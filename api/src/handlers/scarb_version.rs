use rocket::State;
use std::process::{Command, Stdio};
use tracing::{error, info, instrument};

use crate::errors::{ApiError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;

use super::types::ApiResponse;

#[instrument(skip(engine, _rate_limited))]
#[post("/scarb-version-async")]
pub async fn scarb_version_async(
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> ApiResponse<String> {
    info!("/scarb_version_async");
    do_process_command(ApiCommand::ScarbVersion, engine)
}

#[instrument(skip(engine))]
#[get("/scarb-version-async/<process_id>")]
pub fn get_scarb_version_result(
    process_id: &str,
    engine: &State<WorkerEngine>,
) -> ApiResponse<String> {
    info!("/scarb-version-async/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        Ok(ApiCommandResult::ScarbVersion(response)) => response.clone(),
        Err(e) => ApiResponse::not_found(e.to_string()),
        _ => ApiResponse::internal_server_error("Result not available".to_string()),
    })
}

/// Run Scarb --version to return Scarb version string
///
/// ## Note
/// (default Scarb version will be used)
pub fn do_scarb_version() -> Result<ApiResponse<String>> {
    let version_caller = Command::new("scarb")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(ApiError::FailedToExecuteCommand)?;

    let output = version_caller
        .wait_with_output()
        .map_err(ApiError::FailedToReadOutput)?;

    if output.status.success() {
        let result = String::from_utf8_lossy(&output.stdout).to_string();

        let result_with_stderr = String::from_utf8_lossy(&output.stderr).to_string();

        Ok(ApiResponse::ok(result.clone())
            .with_message(format!("{}{}", result_with_stderr, result))
            .with_success(true)
            .with_status("Success".to_string())
            .with_code(200))
    } else {
        error!("Failed to get Scarb version: {:?}", output);
        Err(ApiError::ScarbVersionNotFound(output.status.to_string()))
    }
}
