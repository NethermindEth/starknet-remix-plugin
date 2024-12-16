use rocket::http::Status;
use rocket::State;
use std::process::{Command, Stdio};
use tracing::{error, info, instrument};

use crate::errors::{ApiError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;

#[instrument(skip(engine, _rate_limited))]
#[post("/scarb-version-async")]
pub async fn scarb_version_async(
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> String {
    info!("/scarb_version_async");
    do_process_command(ApiCommand::ScarbVersion, engine)
}

#[instrument(skip(engine))]
#[get("/scarb-version-result/<process_id>")]
pub async fn get_scarb_version_result(
    process_id: &str,
    engine: &State<WorkerEngine>,
) -> (Status, String) {
    fetch_process_result(process_id, engine, |result| match result {
        Ok(ApiCommandResult::ScarbVersion(version)) => (Status::Ok, version.to_string()),
        Err(err) => (
            Status::InternalServerError,
            format!("Failed to fetch result: {:?}", err),
        ),
        _ => (
            Status::InternalServerError,
            "Result not available".to_string(),
        ),
    })
}

/// Run Cairo --version to return Cairo version string
///
/// ## Note
/// (default Cairo version will be used)
pub fn do_cairo_version() -> Result<String> {
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
        Ok(result.trim().to_string())
    } else {
        error!("Failed to get cairo version: {:?}", output);
        Err(ApiError::CairoVersionNotFound(output.status.to_string()))
    }
}
