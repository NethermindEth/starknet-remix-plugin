use crate::handlers::get_files_recursive;
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult, ScarbCompileResponse};
use crate::utils::lib::get_file_path;
use crate::worker::WorkerEngine;
use rocket::serde::json;
use rocket::serde::json::Json;
use rocket::State;
use std::path::PathBuf;
use std::process::{Command, Stdio};
use tracing::{instrument, info};

#[instrument]
#[get("/compile-scarb/<remix_file_path..>")]
pub async fn scarb_compile(remix_file_path: PathBuf) -> Json<ScarbCompileResponse> {
    info!("/compile-scarb/{:?}", remix_file_path);
    do_scarb_compile(remix_file_path).await.unwrap()
}

#[instrument]
#[get("/compile-scarb-async/<remix_file_path..>")]
pub async fn scarb_compile_async(remix_file_path: PathBuf, engine: &State<WorkerEngine>) -> String {
    info!("/compile-scarb-async/{:?}", remix_file_path);
    do_process_command(ApiCommand::ScarbCompile(remix_file_path), engine)
}

#[instrument]
#[get("/compile-scarb-result/<process_id>")]
pub async fn get_scarb_compile_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/compile-scarb-result/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::ScarbCompile(scarb_result) => json::to_string(&scarb_result).unwrap(),
        _ => String::from("Result not available"),
    })
}

/// Run Scarb to compile a project
///
pub async fn do_scarb_compile(
    remix_file_path: PathBuf,
) -> Result<Json<ScarbCompileResponse>, String> {
    let remix_file_path = match remix_file_path.to_str() {
        Some(path) => path.to_string(),
        None => {
            return Ok(Json(ScarbCompileResponse {
                file_content_map_array: vec![],
                message: "File path not found".to_string(),
                status: "FileNotFound".to_string(),
            }));
        }
    };

    let file_path = get_file_path(&remix_file_path);

    let mut compile = Command::new("scarb");
    compile.current_dir(&file_path);

    let result = compile
        .arg("build")
        .stdout(Stdio::piped())
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to execute scarb build");

    debug!("LOG: ran command:{:?}", compile);

    let output = result.wait_with_output().expect("Failed to wait on child");

    Ok(Json(ScarbCompileResponse {
        file_content_map_array: get_files_recursive(&file_path.join("target/dev")),
        message: String::from_utf8(output.stdout)
            .unwrap()
            .replace(&file_path.to_str().unwrap().to_string(), &remix_file_path)
            + &String::from_utf8(output.stderr)
                .unwrap()
                .replace(&file_path.to_str().unwrap().to_string(), &remix_file_path),
        status: match output.status.code() {
            Some(0) => "Success".to_string(),
            Some(_) => "SierraCompilationFailed".to_string(),
            None => "UnknownError".to_string(),
        },
    }))
}
