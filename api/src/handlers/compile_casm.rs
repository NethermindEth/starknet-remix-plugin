use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult, CompileResponse};
use crate::rate_limiter::RateLimited;
use crate::types::{ApiError, Result};
use crate::utils::lib::{get_file_ext, get_file_path, CAIRO_COMPILERS_DIR, CASM_ROOT};
use crate::worker::WorkerEngine;
use rocket::fs::NamedFile;
use rocket::serde::json;
use rocket::serde::json::Json;
use rocket::tokio::fs;
use rocket::State;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tracing::info;
use tracing::instrument;

#[get("/compile-to-casm/<version>/<remix_file_path..>")]
pub async fn compile_to_casm(
    version: String,
    remix_file_path: PathBuf,
    _rate_limited: RateLimited,
) -> Json<CompileResponse> {
    info!("/compile-to-casm/{:?}", remix_file_path);
    do_compile_to_casm(version.clone(), remix_file_path)
        .await
        .unwrap_or_else(|e| {
            Json(CompileResponse {
                file_content: "".to_string(),
                message: format!("Failed to compile to casm: {:?}", e),
                status: "CompilationFailed".to_string(),
                cairo_version: version,
            })
        })
}

#[instrument]
#[get("/compile-to-casm-async/<version>/<remix_file_path..>")]
pub async fn compile_to_casm_async(
    version: String,
    remix_file_path: PathBuf,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> String {
    info!("/compile-to-casm-async/{:?}", remix_file_path);
    do_process_command(
        ApiCommand::CasmCompile {
            remix_file_path,
            version,
        },
        engine,
    )
}

#[instrument]
#[get("/compile-to-casm-result/<process_id>")]
pub async fn compile_to_casm_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/compile-to-casm-result/{:?}", process_id);
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::CasmCompile(casm_result) => {
            json::to_string(&casm_result).unwrap_or("Failed to fetch result".to_string())
        }
        _ => String::from("Result not available"),
    })
}

/// Compile source file to CASM
///
pub async fn do_compile_to_casm(
    cairo_version: String,
    remix_file_path: PathBuf,
) -> Result<Json<CompileResponse>> {
    let remix_file_path = remix_file_path
        .to_str()
        .ok_or(ApiError::FailedToParseString)?
        .to_string();

    // check if the file has .sierra extension
    match get_file_ext(&remix_file_path) {
        ext if ext == "sierra" => {
            debug!("LOG: File extension is sierra");
        }
        ext => {
            debug!("LOG: File extension not supported");
            return Err(ApiError::FileExtensionNotSupported(ext));
        }
    }

    let file_path = get_file_path(&remix_file_path);

    let casm_remix_path = remix_file_path.replace(&get_file_ext(&remix_file_path), "casm");

    let mut compile = Command::new("cargo");

    let path_to_cairo_compiler = Path::new(CAIRO_COMPILERS_DIR).join(&cairo_version);

    if path_to_cairo_compiler.exists() {
        compile.current_dir(path_to_cairo_compiler);
    } else {
        return Err(ApiError::CairoVersionNotFound(cairo_version));
    }

    let casm_path = Path::new(CASM_ROOT).join(&casm_remix_path);

    // create directory for casm file
    match casm_path.parent() {
        Some(parent) => match fs::create_dir_all(parent).await {
            Ok(_) => {
                debug!("LOG: Created directory: {:?}", parent);
            }
            Err(e) => {
                debug!("LOG: Error creating directory: {:?}", e);
            }
        },
        None => {
            debug!("LOG: Error creating directory");
        }
    }

    let result = compile
        .arg("run")
        .arg("--release")
        .arg("--bin")
        .arg("starknet-sierra-compile")
        .arg("--")
        .arg(&file_path)
        .arg(&casm_path)
        .stderr(Stdio::piped())
        .spawn()
        .map_err(ApiError::FailedToExecuteCommand)?;

    debug!("LOG: ran command:{:?}", compile);

    let output = result
        .wait_with_output()
        .map_err(ApiError::FailedToReadOutput)?;

    let file_content = fs::read_to_string(
        NamedFile::open(&casm_path)
            .await
            .map_err(ApiError::FailedToReadFile)?
            .path()
            .to_str()
            .ok_or(ApiError::FailedToParseString)?
            .to_string(),
    )
    .await
    .map_err(ApiError::FailedToReadFile)?;

    let message = String::from_utf8(output.stderr)
        .map_err(ApiError::UTF8Error)?
        .replace(
            &file_path
                .to_str()
                .ok_or(ApiError::FailedToParseString)?
                .to_string(),
            &remix_file_path,
        )
        .replace(
            &casm_path
                .to_str()
                .ok_or(ApiError::FailedToParseString)?
                .to_string(),
            &casm_remix_path,
        );

    let status = match output.status.code() {
        Some(0) => "Success",
        Some(_) => "SierraCompilationFailed",
        None => "UnknownError",
    }
    .to_string();

    Ok(Json(CompileResponse {
        file_content,
        message,
        status,
        cairo_version,
    }))
}
