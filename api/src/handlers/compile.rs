use crate::errors::{CmdError, ExecutionError, FileError, Result};
use crate::handlers::allowed_versions::is_version_allowed;
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::CompileResponse;
use crate::handlers::types::{ApiCommand, CompileResponseGetter, IntoTypedResponse};
use crate::handlers::utils::{
    ensure_scarb_toml, get_files_recursive, init_directories, is_single_file_compilation,
    AutoCleanUp,
};
use crate::metrics::Metrics;
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;
use rocket::serde::json::Json;
use rocket::{tokio, State};
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing::{error, instrument};

use super::types::{ApiResponse, CompilationRequest};

pub fn scarb_toml_with_version(version: &str) -> String {
    format!(
        r#"[package]
name = "___testsingle"
version = "0.1.0"

[dependencies]
starknet = "{}"

[[target.starknet-contract]]
sierra = true
casm = true
"#,
        version
    )
}

pub fn default_scarb_toml() -> String {
    scarb_toml_with_version("2.6.4")
}

#[instrument(skip(request_json, _rate_limited, engine))]
#[post("/compile-async", data = "<request_json>")]
pub async fn compile_async(
    request_json: Json<CompilationRequest>,
    _rate_limited: RateLimited,
    engine: &State<WorkerEngine>,
) -> ApiResponse<String> {
    tracing::info!("/compile/{:?}", request_json.0.file_names());
    do_process_command(
        ApiCommand::Compile {
            compilation_request: request_json.0,
        },
        engine,
    )
}

#[instrument(skip(engine))]
#[get("/compile-async/<process_id>")]
pub async fn get_compile_result(process_id: &str, engine: &State<WorkerEngine>) -> CompileResponse {
    tracing::info!("/compile-result/{:?}", process_id);
    fetch_process_result::<CompileResponseGetter>(process_id, engine)
        .map(|result| result.0)
        .unwrap_or_else(|err| err.into_typed())
}

/// Run Scarb to compile a project
///
/// # Errors
/// Returns ApiError if:
/// - Failed to create/write temporary directories
/// - Failed to execute scarb command
/// - Failed to read command output
/// - Command times out
/// - Version is not allowed
/// - Invalid compilation request format
pub async fn do_compile(
    compilation_request: CompilationRequest,
    _metrics: &Metrics,
) -> Result<CompileResponse> {
    // Verify version is in the allowed versions
    let version = compilation_request.version.as_deref().unwrap_or("");
    if !is_version_allowed(version).await && is_single_file_compilation(&compilation_request) {
        error!("Version not allowed: {}", version);
        return Err(ExecutionError::VersionNotAllowed.into());
    }

    // Ensure Scarb.toml exists
    let compilation_request = ensure_scarb_toml(compilation_request).await?;

    // Create temporary directories
    let temp_dir = init_directories(&compilation_request.base_request)
        .await
        .map_err(|e| {
            error!("Failed to initialize directories: {:?}", e);
            e
        })?;

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
        let child = compile.spawn().map_err(|e| {
            error!("Failed to execute scarb command: {:?}", e);
            CmdError::FailedToExecuteCommand(e)
        })?;

        child.wait_with_output().map_err(|e| {
            error!("Failed to read scarb command output: {:?}", e);
            CmdError::FailedToReadOutput(e)
        })
    })
    .await
    .map_err(|_| {
        error!("Compilation timed out after 300 seconds");
        ExecutionError::CompilationTimeout
    })??;

    let file_content_map_array = get_files_recursive(&PathBuf::from(&temp_dir).join("target/dev"))
        .map_err(|e| {
            error!("Failed to read compilation output files: {:?}", e);
            e
        })?;

    let output = result;
    let message = {
        let stdout = String::from_utf8(output.stdout).map_err(|e| {
            error!("Failed to parse stdout as UTF-8: {:?}", e);
            FileError::UTF8Error(e)
        })?;
        let stderr = String::from_utf8(output.stderr).map_err(|e| {
            error!("Failed to parse stderr as UTF-8: {:?}", e);
            FileError::UTF8Error(e)
        })?;
        format!("{}{}", stdout, stderr).replace(&temp_dir, "")
    };

    let (status, code) = match output.status.code() {
        Some(0) => ("Success", 200),
        Some(code) => {
            error!("Compilation failed with exit code: {}", code);
            ("CompilationFailed", 400)
        }
        None => {
            error!("Compilation process terminated by signal");
            ("UnknownError", 500)
        }
    };

    auto_clean_up.clean_up().await;

    Ok(ApiResponse::ok(file_content_map_array)
        .with_status(status.to_string())
        .with_code(code)
        .with_message(message))
}
