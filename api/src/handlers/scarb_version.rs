use rocket::State;
use std::process::{Command, Stdio};
use tracing::{error, info, instrument};

use crate::errors::{ApiError, CmdError, ExecutionError, FileError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{
    ApiCommand, ApiCommandResult, IntoTypedResponse, VersionResponseGetter,
};
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
    fetch_process_result::<VersionResponseGetter>(process_id, engine)
        .map(|result| result.0)
        .unwrap_or_else(|err| err.into_typed())
}

impl TryFrom<ApiCommandResult> for ApiResponse<String> {
    type Error = ApiError;

    fn try_from(value: ApiCommandResult) -> Result<Self, Self::Error> {
        match value {
            ApiCommandResult::ScarbVersion(response) => Ok(response),
            _ => {
                error!("Expected ScarbVersion result, got {:?}", value);
                Err(ExecutionError::InvalidRequest.into())
            }
        }
    }
}

/// Run Scarb --version to return Scarb version string
///
/// # Errors
/// Returns ApiError if:
/// - Failed to execute scarb command
/// - Failed to read command output
/// - Command returned non-zero status
/// - Failed to parse command output as UTF-8
pub fn do_scarb_version() -> Result<ApiResponse<String>> {
    let version_caller = Command::new("scarb")
        .arg("--version")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            error!("Failed to execute scarb version command: {:?}", e);
            CmdError::FailedToExecuteCommand(e)
        })?;

    let output = version_caller.wait_with_output().map_err(|e| {
        error!("Failed to read scarb version output: {:?}", e);
        CmdError::FailedToReadOutput(e)
    })?;

    if output.status.success() {
        let result = String::from_utf8(output.stdout).map_err(|e| {
            error!("Failed to parse stdout as UTF-8: {:?}", e);
            FileError::UTF8Error(e)
        })?;

        let result_with_stderr = String::from_utf8(output.stderr).map_err(|e| {
            error!("Failed to parse stderr as UTF-8: {:?}", e);
            FileError::UTF8Error(e)
        })?;

        Ok(ApiResponse::ok(result.clone())
            .with_message(format!("{}{}", result_with_stderr, result))
            .with_success(true)
            .with_status("Success".to_string())
            .with_code(200))
    } else {
        let stderr = String::from_utf8_lossy(&output.stderr);
        error!(
            "Failed to get Scarb version: status={}, stderr={}",
            output.status, stderr
        );
        Err(ExecutionError::ScarbVersionNotFound(format!(
            "Status: {}, Error: {}",
            output.status, stderr
        ))
        .into())
    }
}
