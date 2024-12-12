use crate::errors::{ApiError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::handlers::types::{FileContentMap, ScarbCompileResponse};
use crate::handlers::utils::{get_files_recursive, init_directories, AutoCleanUp};
use crate::handlers::{STATUS_COMPILATION_FAILED, STATUS_SUCCESS, STATUS_UNKNOWN_ERROR};
use crate::metrics::Metrics;
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;
use rocket::serde::json;
use rocket::serde::json::Json;
use rocket::{tokio, State};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing::instrument;

use super::types::CompilationRequest;

const DEFAULT_SCARB_TOML: &str = r#"[package]
name = "___testsingle"
version = "0.1.0"

[dependencies]
starknet = "2.6.4"

[[target.starknet-contract]]
sierra = true
casm = true
"#;

#[instrument(skip(request_json, _rate_limited, engine))]
#[post("/compile-async", data = "<request_json>")]
pub async fn compile_async(
    request_json: Json<CompilationRequest>,
    _rate_limited: RateLimited,
    engine: &State<WorkerEngine>,
) -> String {
    tracing::info!("/compile/{:?}", request_json.0.file_names());
    do_process_command(
        ApiCommand::Compile {
            compilation_request: request_json.0,
        },
        engine,
    )
}

#[instrument(skip(engine))]
#[get("/compile-result/<process_id>")]
pub async fn get_compile_result(process_id: &str, engine: &State<WorkerEngine>) -> String {
    tracing::info!("/compile-result/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        Ok(ApiCommandResult::Compile(compile_result)) => json::to_string(&compile_result)
            .unwrap_or_else(|e| format!("Failed to fetch result: {:?}", e)),
        Err(err) => {
            format!("Failed to fetch result: {:?}", err)
        }
        _ => "Result is not available".to_string(),
    })
}

async fn ensure_scarb_toml(
    mut compilation_request: CompilationRequest,
) -> Result<CompilationRequest> {
    // Check if Scarb.toml exists in the root
    if !compilation_request.has_scarb_toml() {
        // number of files cairo files in the request
        if compilation_request
            .files
            .iter()
            .filter(|f| f.file_name.ends_with(".cairo"))
            .count()
            != 1
        {
            return Err(ApiError::InvalidRequest);
        }

        tracing::debug!("No Scarb.toml found, creating default one");
        compilation_request.files.push(FileContentMap {
            file_name: "Scarb.toml".to_string(),
            file_content: DEFAULT_SCARB_TOML.to_string(),
        });

        // change the name of the file to the first cairo file to src/lib.cairo
        let first_cairo_file = compilation_request
            .files
            .iter_mut()
            .find(|f| f.file_name.ends_with(".cairo"))
            .unwrap();
        first_cairo_file.file_name = "src/lib.cairo".to_string();
    }

    Ok(compilation_request)
}

/// Run Scarb to compile a project
///
/// # Errors
/// Returns ApiError if:
/// - Failed to create/write temporary directories
/// - Failed to execute scarb command
/// - Failed to read command output
/// - Command times out
pub async fn do_compile(
    compilation_request: CompilationRequest,
    _metrics: &Metrics,
) -> Result<Json<ScarbCompileResponse>> {
    // Ensure Scarb.toml exists
    let compilation_request = ensure_scarb_toml(compilation_request).await?;

    // Create temporary directories
    let temp_dir = init_directories(compilation_request.clone()).await?;

    let auto_clean_up = AutoCleanUp {
        dirs: vec![&temp_dir],
    };

    let mut compile = Command::new("scarb");
    compile
        .current_dir(&temp_dir)
        .arg("build")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped());

    tracing::debug!("Executing scarb command: {:?}", compile);

    let result = tokio::time::timeout(std::time::Duration::from_secs(300), async {
        compile
            .spawn()
            .map_err(ApiError::FailedToExecuteCommand)?
            .wait_with_output()
            .map_err(ApiError::FailedToReadOutput)
    })
    .await
    .map_err(|_| ApiError::CompilationTimeout)??;

    let file_content_map_array = get_files_recursive(&PathBuf::from(&temp_dir).join("target/dev"))?;

    let output = result;
    let message = {
        let stdout = String::from_utf8(output.stdout).map_err(ApiError::UTF8Error)?;
        let stderr = String::from_utf8(output.stderr).map_err(ApiError::UTF8Error)?;
        format!("{}{}", stdout, stderr).replace(&temp_dir, "")
    };

    let status = match output.status.code() {
        Some(0) => STATUS_SUCCESS,
        Some(_) => STATUS_COMPILATION_FAILED,
        None => STATUS_UNKNOWN_ERROR,
    }
    .to_string();

    auto_clean_up.clean_up().await;

    Ok(Json(ScarbCompileResponse {
        artifacts: file_content_map_array,
        message,
        status,
    }))
}
