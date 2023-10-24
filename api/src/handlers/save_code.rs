use crate::types::{ApiError, Result};
use crate::utils::lib::get_file_path;
use rocket::data::ToByteUnit;
use rocket::tokio::fs;
use rocket::Data;
use std::path::PathBuf;
use tracing::info;

#[post("/save_code/<remix_file_path..>", data = "<file>")]
pub async fn save_code(file: Data<'_>, remix_file_path: PathBuf) -> String {
    info!("/save_code/{:?}", remix_file_path);
    do_save_code(file, remix_file_path)
        .await
        .unwrap_or_else(|e| format!("Failed to save code: {:?}", e))
}

/// Upload a data file
///
pub async fn do_save_code(file: Data<'_>, remix_file_path: PathBuf) -> Result<String> {
    let remix_file_path = remix_file_path
        .to_str()
        .ok_or(ApiError::FailedToParseString)?
        .to_string();

    let file_path = get_file_path(&remix_file_path);

    // create file directory from file path
    match file_path.parent() {
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

    // Modify to zip and unpack.
    let _ = file
        .open(128_i32.gibibytes())
        .into_file(&file_path)
        .await
        .map_err(ApiError::FailedToSaveFile)?;

    Ok(file_path
        .to_str()
        .ok_or(ApiError::FailedToParseString)?
        .to_string())
}
