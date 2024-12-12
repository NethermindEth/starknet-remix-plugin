use crate::errors::ApiError;
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::worker::{ProcessState, WorkerEngine};
use rocket::State;
use tracing::{info, instrument};
use uuid::Uuid;

#[instrument(skip(engine))]
#[get("/process_status/<process_id>")]
pub async fn get_process_status(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/process_status/{:?}", process_id);
    // get status of process by ID
    match Uuid::parse_str(&process_id) {
        Ok(process_uuid) => {
            if engine.arc_process_states.contains_key(&process_uuid) {
                format!(
                    "{:}",
                    engine
                        .arc_process_states
                        .get(&process_uuid)
                        .unwrap()
                        .value()
                )
            } else {
                // TODO can we return HTTP status code here?
                format!("Process with id={} not found", process_id)
            }
        }
        Err(e) => {
            // TODO can we return HTTP status code here?
            e.to_string()
        }
    }
}

pub fn do_process_command(command: ApiCommand, engine: &State<WorkerEngine>) -> String {
    // queue the new Scarb command
    match engine.enqueue_command(command) {
        Ok(uuid) => {
            // return the process ID
            format!("{}", uuid)
        }
        Err(e) => {
            // TODO can we return HTTP status code here?
            e
        }
    }
}

pub fn fetch_process_result<F>(
    process_id: &str,
    engine: &State<WorkerEngine>,
    do_work: F,
) -> String
where
    F: FnOnce(Result<&ApiCommandResult, &ApiError>) -> String,
{
    // get status of process by ID
    match Uuid::parse_str(&process_id) {
        Ok(process_uuid) => {
            if engine.arc_process_states.contains_key(&process_uuid) {
                match engine
                    .arc_process_states
                    .get(&process_uuid)
                    .unwrap()
                    .value()
                {
                    ProcessState::Completed(result) => do_work(Ok(result)),
                    ProcessState::Error(e) => do_work(Err(e)),
                    _ => String::from("Result not available"),
                }
            } else {
                // TODO can we return HTTP status code here?
                "Process id not found".to_string()
            }
        }
        Err(e) => {
            // TODO can we return HTTP status code here?
            e.to_string()
        }
    }
}
