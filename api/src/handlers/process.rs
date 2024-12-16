use crate::errors::ApiError;
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::worker::{ProcessState, WorkerEngine};
use rocket::State;
use serde::Serialize;
use tracing::{info, instrument};
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

pub fn fetch_process_result<F, T>(
    process_id: &str,
    engine: &State<WorkerEngine>,
    handle_result: F,
) -> ApiResponse<T>
where
    F: FnOnce(Result<&ApiCommandResult, &ApiError>) -> ApiResponse<T>,
    T: Serialize,
{
    // get status of process by ID
    match Uuid::parse_str(process_id) {
        Ok(process_uuid) => {
            if engine.arc_process_states.contains_key(&process_uuid) {
                match engine
                    .arc_process_states
                    .get(&process_uuid)
                    .unwrap()
                    .value()
                {
                    ProcessState::Completed(result) => handle_result(Ok(result)),
                    ProcessState::Error(e) => handle_result(Err(e)),
                    _ => {
                        handle_result(Err(&ApiError::NotFound("Result not available".to_string())))
                    }
                }
            } else {
                handle_result(Err(&ApiError::NotFound("Process id not found".to_string())))
            }
        }
        Err(e) => handle_result(Err(&ApiError::NotFound(e.to_string()))),
    }
}
