use crate::errors::ApiError;
use crate::errors::Result;
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::TestResponseGetter;
use crate::handlers::types::{ApiCommand, IntoTypedResponse, TestResponse};
use crate::rate_limiter::RateLimited;
use crate::utils::lib::get_file_path;
use crate::worker::WorkerEngine;
use rocket::State;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing::{debug, error, info, instrument};

use super::types::ApiResponse;

#[instrument(skip(engine, _rate_limited))]
#[post("/scarb-test-async/<remix_file_path..>")]
pub async fn scarb_test_async(
    remix_file_path: PathBuf,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> ApiResponse<String> {
    info!("/scarb-test-async/{:?}", remix_file_path);
    do_process_command(ApiCommand::ScarbTest { remix_file_path }, engine)
}

#[instrument(skip(engine))]
#[get("/scarb-test-async/<process_id>")]
pub async fn get_scarb_test_result(
    process_id: &str,
    engine: &State<WorkerEngine>,
) -> ApiResponse<()> {
    info!("/scarb-test-async/{:?}", process_id);
    fetch_process_result::<TestResponseGetter>(process_id, engine)
        .map(|result| result.0)
        .unwrap_or_else(|err| err.into_typed())
}

/// Run Scarb to test a project
///
/// # Errors
/// Returns ApiError if:
/// - Failed to parse file path
/// - Failed to execute scarb command
/// - Failed to read command output
/// - Failed to parse command output as UTF-8
/// - Command returned non-zero status
pub async fn do_scarb_test(remix_file_path: PathBuf) -> Result<TestResponse> {
    let remix_file_path = remix_file_path
        .to_str()
        .ok_or_else(|| {
            error!("Failed to parse remix file path: {:?}", remix_file_path);
            ApiError::FailedToParseString
        })?
        .to_string();

    let file_path = get_file_path(&remix_file_path);

    let mut compile = Command::new("scarb");
    compile.current_dir(&file_path);

    debug!("Executing scarb test command in directory: {:?}", file_path);

    let result = compile
        .arg("test")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            error!("Failed to execute scarb test command: {:?}", e);
            ApiError::FailedToExecuteCommand(e)
        })?;

    debug!("Executed command: {:?}", compile);

    let output = result.wait_with_output().map_err(|e| {
        error!("Failed to read scarb test output: {:?}", e);
        ApiError::FailedToReadOutput(e)
    })?;

    // Convert file path to string once to avoid repetition and potential inconsistencies
    let file_path_str = file_path
        .to_str()
        .ok_or_else(|| {
            error!("Failed to convert file path to string: {:?}", file_path);
            ApiError::FailedToParseString
        })?
        .to_string();

    let stdout = String::from_utf8(output.stdout).map_err(|e| {
        error!("Failed to parse stdout as UTF-8: {:?}", e);
        ApiError::UTF8Error(e)
    })?;

    let stderr = String::from_utf8(output.stderr).map_err(|e| {
        error!("Failed to parse stderr as UTF-8: {:?}", e);
        ApiError::UTF8Error(e)
    })?;

    let message = format!(
        "{}{}",
        stdout.replace(&file_path_str, &remix_file_path),
        stderr.replace(&file_path_str, &remix_file_path)
    );

    let (status, code) = match output.status.code() {
        Some(0) => ("Success", 200),
        Some(code) => {
            error!("Test failed with exit code: {}", code);
            ("SierraCompilationFailed", 400)
        }
        None => {
            error!("Test terminated by signal");
            ("UnknownError", 500)
        }
    };

    Ok(ApiResponse::ok(())
        .with_status(status.to_string())
        .with_code(code)
        .with_message(message)
        .with_timestamp(chrono::Utc::now().to_rfc3339()))
}
