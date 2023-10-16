pub mod cairo_version;
pub mod cairo_versions;
pub mod compile_casm;
pub mod compile_sierra;
pub mod process;
pub mod save_code;
pub mod scarb_compile;
pub mod types;

use crate::handlers::cairo_version::do_cairo_version;
use crate::handlers::compile_casm::do_compile_to_casm;
use crate::handlers::compile_sierra::do_compile_to_sierra;
use crate::handlers::scarb_compile::do_scarb_compile;
use crate::handlers::types::{ApiCommand, ApiCommandResult, FileContentMap};
use rocket::serde::json::Json;
use std::path::Path;
use tracing::info;
use tracing::instrument;

#[instrument]
#[get("/health")]
pub async fn health() -> &'static str {
    info!("/health");
    "OK"
}

#[instrument]
#[get("/")]
pub async fn who_is_this() -> &'static str {
    info!("/who_is_this");
    "Who are you?"
}

pub async fn dispatch_command(command: ApiCommand) -> Result<ApiCommandResult, String> {
    match command {
        ApiCommand::CairoVersion => match do_cairo_version() {
            Ok(result) => Ok(ApiCommandResult::CairoVersion(result)),
            Err(e) => Err(e),
        },
        ApiCommand::ScarbCompile { remix_file_path } => {
            match do_scarb_compile(remix_file_path).await {
                Ok(result) => Ok(ApiCommandResult::ScarbCompile(result.into_inner())),
                Err(e) => Err(e),
            }
        }
        ApiCommand::SierraCompile {
            remix_file_path,
            version,
        } => match do_compile_to_sierra(version, remix_file_path).await {
            Ok(compile_response) => Ok(ApiCommandResult::SierraCompile(
                compile_response.into_inner(),
            )),
            Err(e) => Err(e),
        },
        ApiCommand::CasmCompile {
            remix_file_path,
            version,
        } => match do_compile_to_casm(version, remix_file_path).await {
            Json(compile_response) => Ok(ApiCommandResult::CasmCompile(compile_response)),
        },
        ApiCommand::Shutdown => Ok(ApiCommandResult::Shutdown),
    }
}

fn get_files_recursive(base_path: &Path) -> Vec<FileContentMap> {
    let mut file_content_map_array: Vec<FileContentMap> = Vec::new();

    if base_path.is_dir() {
        for entry in base_path.read_dir().unwrap().flatten() {
            let path = entry.path();
            if path.is_dir() {
                file_content_map_array.extend(get_files_recursive(&path));
            } else if let Ok(content) = std::fs::read_to_string(&path) {
                let file_name = path.file_name().unwrap().to_string_lossy().to_string();
                let file_content = content;
                let file_content_map = FileContentMap {
                    file_name,
                    file_content,
                };
                file_content_map_array.push(file_content_map);
            }
        }
    }

    file_content_map_array
}
