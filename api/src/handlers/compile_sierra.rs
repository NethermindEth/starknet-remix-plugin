use crate::errors::{ApiError, Result};
use crate::handlers::process::{do_process_command, fetch_process_result};
use crate::handlers::types::{ApiCommand, ApiCommandResult, CompileResponse};
use crate::rate_limiter::RateLimited;
use crate::utils::lib::{get_file_ext, get_file_path, CAIRO_COMPILERS_DIR, SIERRA_ROOT};
use crate::worker::WorkerEngine;
use rocket::fs::NamedFile;
use rocket::serde::json;
use rocket::serde::json::Json;
use rocket::tokio::fs;
use rocket::State;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use tracing::{debug, info, instrument};

#[instrument(skip(_rate_limited))]
#[get("/compile-to-sierra/<version>/<remix_file_path..>")]
pub async fn compile_to_sierra(
    version: String,
    remix_file_path: PathBuf,
    _rate_limited: RateLimited,
) -> Json<CompileResponse> {
    info!("/compile-to-sierra");

    let res = do_compile_to_sierra(version.clone(), remix_file_path).await;

    match res {
        Ok(res) => res,
        Err(e) => Json(CompileResponse {
            file_content: "".to_string(),
            message: format!("Failed to compile to sierra: {:?}", e),
            status: "CompilationFailed".to_string(),
            cairo_version: version,
        }),
    }
}

#[instrument(skip(engine, _rate_limited))]
#[get("/compile-to-sierra-async/<version>/<remix_file_path..>")]
pub async fn compile_to_siera_async(
    version: String,
    remix_file_path: PathBuf,
    engine: &State<WorkerEngine>,
    _rate_limited: RateLimited,
) -> String {
    info!("/compile-to-sierra-async");
    do_process_command(
        ApiCommand::SierraCompile {
            version,
            remix_file_path,
        },
        engine,
    )
}

#[instrument(skip(engine))]
#[get("/compile-to-sierra-result/<process_id>")]
pub async fn get_siera_compile_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    info!("/compile-to-sierra-result");
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::SierraCompile(sierra_result) => {
            json::to_string(&sierra_result).unwrap_or("Failed to fetch result".to_string())
        }
        _ => String::from("Result not available"),
    })
}

/// Compile a given file to Sierra bytecode
///
pub async fn do_compile_to_sierra(
    cairo_version: String,
    remix_file_path: PathBuf,
) -> Result<Json<CompileResponse>> {
    let remix_file_path = remix_file_path
        .to_str()
        .ok_or(ApiError::FailedToParseString)?
        .to_string();

    // check if the file has .cairo extension
    match get_file_ext(&remix_file_path) {
        ext if ext == "cairo" => {
            debug!("LOG: File extension is cairo");
        }
        ext => {
            debug!("LOG: File extension not supported");
            return Err(ApiError::CairoVersionNotFound(ext));
        }
    }

    let file_path = get_file_path(&remix_file_path);

    let sierra_remix_path = remix_file_path.replace(&get_file_ext(&remix_file_path), "sierra");

    let mut compile = Command::new("cargo");

    let path_to_cairo_compiler = Path::new(CAIRO_COMPILERS_DIR).join(&cairo_version);
    if path_to_cairo_compiler.exists() {
        compile.current_dir(path_to_cairo_compiler);
    } else {
        return Err(ApiError::CairoVersionNotFound(cairo_version));
    }

    // replace .cairo with
    let sierra_path = Path::new(SIERRA_ROOT).join(&sierra_remix_path);

    // create directory for sierra file
    match sierra_path.parent() {
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
        .arg("starknet-compile")
        .arg("--")
        .arg(&file_path)
        .arg(&sierra_path)
        .arg("--single-file")
        .stderr(Stdio::piped())
        .stdout(Stdio::piped())
        .spawn()
        .map_err(ApiError::FailedToExecuteCommand)?;

    debug!("LOG: ran command:{:?}", compile);

    let output = result
        .wait_with_output()
        .map_err(ApiError::FailedToReadOutput)?;

    let remix_file_path_without_hash = remix_file_path
        .split('/')
        .collect::<Vec<&str>>()
        .split_first()
        .ok_or(ApiError::FailedToParseString)?
        .1
        .join("/");

    let sierra_remix_path_without_hash = sierra_remix_path
        .split('/')
        .collect::<Vec<&str>>()
        .split_first()
        .ok_or(ApiError::FailedToParseString)?
        .1
        .join("/");

    let message = String::from_utf8(output.stderr)
        .map_err(ApiError::UTF8Error)?
        .replace(
            &file_path
                .to_str()
                .ok_or(ApiError::FailedToParseString)?
                .to_string(),
            &remix_file_path_without_hash,
        )
        .replace(
            &sierra_path
                .to_str()
                .ok_or(ApiError::FailedToParseString)?
                .to_string(),
            &sierra_remix_path_without_hash,
        );

    let status = match output.status.code() {
        Some(0) => "Success",
        Some(_) => "CompilationFailed",
        None => "UnknownError",
    }
    .to_string();

    // Prepare response based on the compilation result
    match output.status.code() {
        Some(0) => {
            let file_content = fs::read_to_string(
                NamedFile::open(&sierra_path)
                    .await
                    .map_err(ApiError::FailedToReadFile)?
                    .path()
                    .to_str()
                    .ok_or(ApiError::FailedToParseString)?,
            )
            .await
            .map_err(ApiError::FailedToReadFile)?;

            Ok(Json(CompileResponse {
                file_content,
                message,
                status,
                cairo_version,
            }))
        }
        _ => Ok(Json(CompileResponse {
            file_content: String::from(""),
            message,
            status,
            cairo_version,
        })),
    }
}
