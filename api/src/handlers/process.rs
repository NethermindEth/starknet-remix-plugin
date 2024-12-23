use crate::errors::ApiError;
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::worker::{ProcessState, WorkerEngine};
use rocket::State;
use tracing::{error, info, instrument};
use uuid::Uuid;

use super::types::ApiResponse;

#[instrument(skip(engine))]
#[get("/process_status/<process_id>")]
pub async fn get_process_status(
    process_id: String,
    engine: &State<WorkerEngine>,
) -> ApiResponse<String> {
    info!("/process_status/{:?}", process_id);
    // get status of process by ID
    match Uuid::parse_str(&process_id) {
        Ok(process_uuid) => {
            if engine.arc_process_states.contains_key(&process_uuid) {
                ApiResponse::ok(
                    engine
                        .arc_process_states
                        .get(&process_uuid)
                        .unwrap()
                        .value()
                        .to_string(),
                )
            } else {
                ApiResponse::not_found(format!("Process with id={} not found", process_id))
            }
        }
        Err(e) => ApiResponse::bad_request(e.to_string()),
    }
}

pub fn do_process_command(
    command: ApiCommand,
    engine: &State<WorkerEngine>,
) -> ApiResponse<String> {
    // queue the new Scarb command
    match engine.enqueue_command(command) {
        Ok(uuid) => ApiResponse::ok(uuid.to_string()),
        Err(e) => ApiResponse::internal_server_error(e.to_string()),
    }
}

pub fn fetch_process_result<T>(
    process_id: &str,
    engine: &State<WorkerEngine>,
) -> Result<T, Box<ApiResponse<()>>>
where
    T: TryFrom<ApiCommandResult, Error = ApiError>,
{
    let process_uuid = Uuid::parse_str(process_id).map_err(|e| {
        error!("Failed to parse process UUID: {}", e);
        ApiResponse::<()>::bad_request(format!("Failed to parse process UUID: {}", e))
    })?;

    let process_state = engine
        .arc_process_states
        .get(&process_uuid)
        .ok_or_else(|| {
            error!("Process not found: {}", process_id);
            ApiResponse::<()>::not_found(format!("Process id not found: {}", process_id))
        })?;

    match process_state.value() {
        ProcessState::Completed(result) => {
            let result = result.clone();
            T::try_from(result).map_err(|e| {
                error!("Failed to convert result type: {:?}", e);
                Box::new(ApiResponse::bad_request(format!(
                    "Failed to convert result type: {:?}",
                    e
                )))
            })
        }
        ProcessState::Error(e) => {
            error!("Process error: {:?}", e);
            Err(Box::new(ApiResponse::not_found(format!(
                "Process error: {}",
                e
            ))))
        }
        _ => {
            error!("Process result not available: {}", process_id);
            Err(Box::new(ApiResponse::not_found(
                "Result not available".to_string(),
            )))
        }
    }
}
