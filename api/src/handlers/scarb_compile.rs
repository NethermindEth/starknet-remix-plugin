use rocket::serde::json;
use rocket::serde::json::Json;
use rocket::State;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing::{debug, info, instrument};

use crate::errors::{ApiError, Result};
use crate::handlers::get_files_recursive;
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult, ScarbCompileResponse};
use crate::handlers::utils::do_metered_action;
use crate::metrics::COMPILATION_LABEL_VALUE;
use crate::rate_limiter::RateLimited;
use crate::utils::lib::get_file_path;
use crate::worker::WorkerEngine;

#[instrument(skip(engine, _rate_limited))]
#[get("/compile-scarb/<remix_file_path..>")]
pub async fn scarb_compile(
    remix_file_path: PathBuf,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> Json<ScarbCompileResponse> {
    info!("/compile-scarb/{:?}", remix_file_path);
    do_metered_action(
        do_scarb_compile(remix_file_path),
        COMPILATION_LABEL_VALUE,
        &engine.metrics,
    )
    .await
    .unwrap_or_else(|e| {
        Json(ScarbCompileResponse {
            file_content_map_array: vec![],
            message: format!("Failed to compile to scarb: {:?}", e),
            status: "CompilationFailed".to_string(),
        })
    })
}

#[instrument(skip(engine, _rate_limited))]
#[get("/compile-scarb-async/<remix_file_path..>")]
pub async fn scarb_compile_async(
    remix_file_path: PathBuf,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> String {
    info!("/compile-scarb-async/{:?}", remix_file_path);
    do_process_command(ApiCommand::ScarbCompile { remix_file_path }, engine)
}

#[instrument(skip(engine))]
#[get("/compile-scarb-result/<process_id>")]
pub async fn get_scarb_compile_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/compile-scarb-result/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::ScarbCompile(scarb_result) => json::to_string(&scarb_result)
            .unwrap_or_else(|e| format!("Failed to fetch result: {:?}", e)),
        _ => String::from("Result not available"),
    })
}

/// Run Scarb to compile a project
///
pub async fn do_scarb_compile(remix_file_path: PathBuf) -> Result<Json<ScarbCompileResponse>> {
    let remix_file_path = remix_file_path
        .to_str()
        .ok_or(ApiError::FailedToParseString)?
        .to_string();

    let file_path = get_file_path(&remix_file_path);

    let mut compile = Command::new("scarb");
    compile.current_dir(&file_path);

    let result = compile
        .arg("build")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(ApiError::FailedToExecuteCommand)?;

    debug!("LOG: ran command:{:?}", compile);

    let output = result
        .wait_with_output()
        .map_err(ApiError::FailedToReadOutput)?;

    let file_content_map_array = get_files_recursive(&file_path.join("target/dev"))?;

    let message = String::from_utf8(output.stdout)
        .map_err(ApiError::UTF8Error)?
        .replace(
            &file_path
                .to_str()
                .ok_or(ApiError::FailedToParseString)?
                .to_string(),
            &remix_file_path,
        )
        + &String::from_utf8(output.stderr)
            .map_err(ApiError::UTF8Error)?
            .replace(
                &file_path
                    .to_str()
                    .ok_or(ApiError::FailedToParseString)?
                    .to_string(),
                &remix_file_path,
            );

    let status = match output.status.code() {
        Some(0) => "Success",
        Some(_) => "SierraCompilationFailed",
        None => "UnknownError",
    }
    .to_string();

    Ok(Json(ScarbCompileResponse {
        file_content_map_array,
        message,
        status,
    }))
}
