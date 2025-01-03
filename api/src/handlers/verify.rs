use crate::errors::{CmdError, ExecutionError, FileError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::VerifyResponseGetter;
use crate::handlers::types::{ApiCommand, IntoTypedResponse};
use crate::handlers::utils::{init_directories, AutoCleanUp};
use crate::metrics::Metrics;
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;
use rocket::serde::json::Json;
use rocket::{tokio, State};
use std::process::{Command, Stdio};
use tracing::{error, instrument};

use super::types::{ApiResponse, VerifyRequest, VerifyResponse};

#[instrument(skip(request_json, _rate_limited, engine))]
#[post("/verify-async", data = "<request_json>")]
pub async fn verify_async(
    request_json: Json<VerifyRequest>,
    _rate_limited: RateLimited,
    engine: &State<WorkerEngine>,
) -> ApiResponse<String> {
    tracing::info!("/verify");
    do_process_command(
        ApiCommand::Verify {
            verify_request: request_json.0,
        },
        engine,
    )
}

#[instrument(skip(engine))]
#[get("/verify-async/<process_id>")]
pub async fn get_verify_result(process_id: &str, engine: &State<WorkerEngine>) -> VerifyResponse {
    tracing::info!("/verify-result/{:?}", process_id);
    fetch_process_result::<VerifyResponseGetter>(process_id, engine)
        .map(|result| result.0)
        .unwrap_or_else(|err| err.into_typed())
}

pub async fn do_verify(
    verify_request: VerifyRequest,
    _metrics: &Metrics,
) -> Result<VerifyResponse> {
    println!("verify_request: {:?}", verify_request);

    // Create temporary directories
    let temp_dir = init_directories(&verify_request.base_request)
        .await
        .map_err(|e| {
            error!("Failed to initialize directories: {:?}", e);
            e
        })?;

    let auto_clean_up = AutoCleanUp {
        dirs: vec![&temp_dir],
    };

    let mut compile = Command::new("sncast");
    compile
        .current_dir(&temp_dir)
        .args([
            "verify",
            "--confirm-verification",
            "--contract-address",
            &verify_request.contract_address,
            "--contract-name",
            &verify_request.contract_name,
            "--network",
            &verify_request.network,
        ])
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

    println!("status: {:?}", status);
    println!("code: {:?}", code);
    println!("message: {:?}", message);

    auto_clean_up.clean_up().await;

    Ok(ApiResponse::ok(())
        .with_status(status.to_string())
        .with_code(code)
        .with_message(message))
}
