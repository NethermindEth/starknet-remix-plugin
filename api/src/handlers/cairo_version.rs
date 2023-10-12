use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult};
use crate::utils::lib::CAIRO_DIR;
use crate::worker::WorkerEngine;
use rocket::State;
use std::process::{Command, Stdio};
use tracing::{error, info, instrument};

// Read the version from the cairo Cargo.toml file.
#[instrument]
#[get("/cairo_version")]
pub async fn cairo_version() -> String {
    info!("/cairo_version");
    do_cairo_version().unwrap_or_else(|e| e)
}

// Read the version from the cairo Cargo.toml file.
#[instrument]
#[get("/cairo_version_async")]
pub async fn cairo_version_async(engine: &State<WorkerEngine>) -> String {
    info!("/cairo_version_async");
    do_process_command(ApiCommand::CairoVersion, engine)
}

#[instrument]
#[get("/cairo_version_result/<process_id>")]
pub async fn get_cairo_version_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/cairo_version_result/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::CairoVersion(version) => version.to_string(),
        _ => String::from("Result not available"),
    })
}

/// Run Cairo --version to return Cairo version string
///
pub fn do_cairo_version() -> Result<String, String> {
    let mut version_caller = Command::new("cargo");
    version_caller.current_dir(CAIRO_DIR);
    match String::from_utf8(
        version_caller
            .arg("run")
            .arg("-q")
            .arg("--release")
            .arg("--bin")
            .arg("cairo-compile")
            .arg("--")
            .arg("--version")
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to execute cairo-compile")
            .wait_with_output()
            .expect("Failed to wait on child")
            .stdout,
    ) {
        Ok(version) => Ok(version),
        Err(e) => {
            error!("{:?}", e.to_string());
            Err(e.to_string())
        }
    }
}
