use crate::errors::{NetworkError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::VerifyResponseGetter;
use crate::handlers::types::{ApiCommand, IntoTypedResponse};
use crate::handlers::utils::{init_directories, AutoCleanUp};
use crate::metrics::Metrics;
use crate::rate_limiter::RateLimited;
use crate::worker::WorkerEngine;
use reqwest::multipart;
use rocket::serde::json::Json;
use rocket::{tokio, State};
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::time::Duration;
use tracing::{debug, error, info, instrument};

use super::types::{ApiResponse, VerifyRequest, VerifyResponse};

const VOYAGER_API_BASE: &str = "https://api.voyager.online/beta";
const VERIFICATION_POLL_INTERVAL: Duration = Duration::from_secs(5);
const VERIFICATION_TIMEOUT: Duration = Duration::from_secs(300);

#[derive(Debug, Deserialize)]
struct VoyagerVerifyResponse {
    job_id: String,
}

#[derive(Debug, Deserialize)]
struct VoyagerVerifyStatus {
    status: i32,
    status_description: String,
}

#[instrument(skip(request_json, _rate_limited, engine))]
#[post("/verify-async", data = "<request_json>")]
pub async fn verify_async(
    request_json: Json<VerifyRequest>,
    _rate_limited: RateLimited,
    engine: &State<WorkerEngine>,
) -> ApiResponse<String> {
    info!("/verify");
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
    info!("/verify-result/{:?}", process_id);
    fetch_process_result::<VerifyResponseGetter>(process_id, engine)
        .map(|result| result.0)
        .unwrap_or_else(|err| err.into_typed())
}

pub async fn do_verify(
    verify_request: VerifyRequest,
    _metrics: &Metrics,
) -> Result<VerifyResponse> {
    debug!("verify_request: {:?}", verify_request);

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

    // Find main contract file
    let contract_file = verify_request
        .base_request
        .files
        .iter()
        .find(|f| f.file_name.ends_with(".cairo"))
        .ok_or_else(|| NetworkError::VerificationFailed("No Cairo contract file found".to_string()))?;

    // Create multipart form
    let mut form = multipart::Form::new()
        .text("name", verify_request.contract_name.clone())
        .text("classHash", verify_request.contract_address.clone())
        .text("license", "MIT".to_string())
        .text("compilerVersion", "2.6.4".to_string()); // TODO: Make this configurable

    // Add files to form
    for file in &verify_request.base_request.files {
        let part = multipart::Part::text(file.file_content.clone())
            .file_name(file.file_name.clone());
        form = form.part(file.file_name.clone(), part);
    }

    let client = reqwest::Client::new();
    
    // Start verification
    let verify_response = client
        .post(&format!("{}/verification/send", VOYAGER_API_BASE))
        .multipart(form)
        .send()
        .await
        .map_err(|e| NetworkError::VerificationFailed(e.to_string()))?
        .json::<VoyagerVerifyResponse>()
        .await
        .map_err(|e| NetworkError::VerificationFailed(e.to_string()))?;

    let job_id = verify_response.job_id;
    debug!("Verification job started with ID: {}", job_id);

    // Poll for verification status
    let start_time = std::time::Instant::now();
    loop {
        if start_time.elapsed() > VERIFICATION_TIMEOUT {
            auto_clean_up.clean_up().await;
            return Ok(ApiResponse::ok(())
                .with_status("Timeout".to_string())
                .with_code(408)
                .with_message("Verification timed out after 5 minutes".to_string()));
        }

        let status = client
            .get(&format!("{}/class-verify/job/{}", VOYAGER_API_BASE, job_id))
            .send()
            .await
            .map_err(|e| NetworkError::VerificationStatusFailed(e.to_string()))?
            .json::<VoyagerVerifyStatus>()
            .await
            .map_err(|e| NetworkError::VerificationStatusFailed(e.to_string()))?;

        match status.status {
            0 => {
                tokio::time::sleep(VERIFICATION_POLL_INTERVAL).await;
                continue;
            }
            1 => {
                auto_clean_up.clean_up().await;
                return Ok(ApiResponse::ok(())
                    .with_status("Success".to_string())
                    .with_code(200)
                    .with_message("Contract verified successfully".to_string()));
            }
            _ => {
                auto_clean_up.clean_up().await;
                return Ok(ApiResponse::ok(())
                    .with_status("Failed".to_string())
                    .with_code(400)
                    .with_message(format!("Verification failed: {}", status.status_description)));
            }
        }
    }
}
