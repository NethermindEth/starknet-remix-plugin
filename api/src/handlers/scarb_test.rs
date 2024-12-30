use super::types::ApiResponse;
use crate::errors::{CmdError, FileError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, IntoTypedResponse, TestResponse};
use crate::handlers::types::{TestRequest, TestResponseGetter};
use crate::handlers::utils::{init_directories, AutoCleanUp};
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;
use rocket::serde::json::Json;
use rocket::State;
use std::process::{Command, Stdio};
use tracing::{debug, error, info, instrument};

#[instrument(skip(test_request, engine, _rate_limited))]
#[post("/test-async", data = "<test_request>")]
pub async fn scarb_test_async(
    test_request: Json<TestRequest>,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> ApiResponse<String> {
    info!("/test-async");
    do_process_command(
        ApiCommand::ScarbTest {
            test_request: test_request.0,
        },
        engine,
    )
}

#[instrument(skip(engine))]
#[get("/test-async/<process_id>")]
pub async fn get_scarb_test_result(
    process_id: &str,
    engine: &State<WorkerEngine>,
) -> ApiResponse<()> {
    info!("/test-async/{:?}", process_id);
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
pub async fn do_scarb_test(test_request: TestRequest) -> Result<TestResponse> {
    // Create temporary directories
    let temp_dir = init_directories(&test_request.base_request)
        .await
        .map_err(|e| {
            error!("Failed to initialize directories: {:?}", e);
            e
        })?;

    let auto_clean_up = AutoCleanUp {
        dirs: vec![&temp_dir],
    };

    let mut compile = Command::new(test_request.test_engine.as_str());
    compile.current_dir(&temp_dir);

    debug!("Executing scarb test command in directory: {:?}", temp_dir);

    let result = compile
        .arg("test")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .map_err(|e| {
            error!("Failed to execute scarb test command: {:?}", e);
            CmdError::FailedToExecuteCommand(e)
        })?;

    debug!("Executed command: {:?}", compile);

    let output = result.wait_with_output().map_err(|e| {
        error!("Failed to read scarb test output: {:?}", e);
        CmdError::FailedToReadOutput(e)
    })?;

    let stdout = String::from_utf8(output.stdout).map_err(|e| {
        error!("Failed to parse stdout as UTF-8: {:?}", e);
        FileError::UTF8Error(e)
    })?;

    let stderr = String::from_utf8(output.stderr).map_err(|e| {
        error!("Failed to parse stderr as UTF-8: {:?}", e);
        FileError::UTF8Error(e)
    })?;

    let message = format!(
        "{}{}",
        stderr.replace(&temp_dir, ""),
        stdout.replace(&temp_dir, "")
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

    auto_clean_up.clean_up_sync();

    Ok(ApiResponse::ok(())
        .with_status(status.to_string())
        .with_code(code)
        .with_message(message)
        .with_timestamp(chrono::Utc::now().to_rfc3339()))
}
