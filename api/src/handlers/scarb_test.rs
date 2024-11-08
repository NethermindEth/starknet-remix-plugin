use crate::errors::ApiError;
use crate::errors::Result;
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult, ScarbTestResponse};
use crate::rate_limiter::RateLimited;
use crate::utils::lib::get_file_path;
use crate::worker::WorkerEngine;
use rocket::serde::json;
use rocket::serde::json::Json;
use rocket::State;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing::{debug, info, instrument};

#[instrument(skip(engine, _rate_limited))]
#[get("/scarb-test-async/<remix_file_path..>")]
pub async fn scarb_test_async(
    remix_file_path: PathBuf,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> String {
    info!("/scarb-test-async/{:?}", remix_file_path);
    do_process_command(ApiCommand::ScarbTest { remix_file_path }, engine)
}

#[instrument(skip(engine))]
#[get("/scarb-test-result/<process_id>")]
pub async fn get_scarb_test_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/scarb-test-result/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::ScarbTest(scarb_result) => json::to_string(&scarb_result)
            .unwrap_or_else(|e| format!("Failed to fetch result: {:?}", e)),
        _ => String::from("Result not available"),
    })
}

/// Run Scarb to test a project
///
pub async fn do_scarb_test(remix_file_path: PathBuf) -> Result<Json<ScarbTestResponse>> {
    let remix_file_path = remix_file_path
        .to_str()
        .ok_or(ApiError::FailedToParseString)?
        .to_string();

    let file_path = get_file_path(&remix_file_path);

    let mut compile = Command::new("scarb");
    compile.current_dir(&file_path);

    let result = compile
        .arg("test")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(ApiError::FailedToExecuteCommand)?;

    debug!("LOG: ran command:{:?}", compile);

    let output = result
        .wait_with_output()
        .map_err(ApiError::FailedToReadOutput)?;

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

    Ok(Json(ScarbTestResponse { message, status }))
}
