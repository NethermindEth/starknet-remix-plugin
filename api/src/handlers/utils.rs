use rocket::serde::json::Json;
use rocket::tokio;
use std::path::Path;
use std::time::Instant;
use std::{future::Future, path::PathBuf};
use tracing::{info, instrument};

use crate::errors::{ApiError, Result};
use crate::metrics::{Metrics, COMPILATION_LABEL_VALUE};

use super::types::{CompilationRequest, FileContentMap, Successful};
use super::{compile::do_compile, scarb_test::do_scarb_test, scarb_version::do_cairo_version, types::{ApiCommand, ApiCommandResult}};

#[instrument]
#[post("/on-plugin-launched")]
pub async fn on_plugin_launched() {
    info!("/on-plugin-launched");
}

pub(crate) async fn do_metered_action<T: Successful>(
    action: impl Future<Output=Result<Json<T>>>,
    action_label_value: &str,
    metrics: &Metrics,
) -> Result<Json<T>> {
    let start_time = Instant::now();
    let result = action.await;
    let elapsed_time = start_time.elapsed().as_secs_f64();
    metrics
        .action_duration_seconds
        .with_label_values(&[action_label_value])
        .set(elapsed_time);

    match result {
        Ok(val) => {
            if val.is_successful() {
                debug!("action successful: {}", action_label_value);
                metrics
                    .action_successes_total
                    .with_label_values(&[action_label_value])
                    .inc();
                Ok(val)
            } else {
                debug!("action failed: {}", action_label_value);
                metrics
                    .action_failures_total
                    .with_label_values(&[action_label_value])
                    .inc();
                Ok(val)
            }
        }
        Err(err) => {
            debug!("action failed: {}, with: {}", action_label_value, err);
            metrics
                .action_failures_total
                .with_label_values(&[action_label_value])
                .inc();
            Err(err)
        }
    }
}

pub struct AutoCleanUp<'a> {
    pub(crate) dirs: Vec<&'a str>,
}

impl Drop for AutoCleanUp<'_> {
    fn drop(&mut self) {
        self.clean_up_sync();
    }
}

impl AutoCleanUp<'_> {
    pub async fn clean_up(&self) {
        for path in self.dirs.iter() {
            println!("Removing path: {:?}", path);

            // check if the path exists
            if !Path::new(path).exists() {
                continue;
            }

            if let Err(e) = tokio::fs::remove_dir_all(path).await {
                tracing::info!("Failed to remove file: {:?}", e);
            }
        }
    }

    pub fn clean_up_sync(&self) {
        for path in self.dirs.iter() {
            println!("Removing path: {:?}", path);

            // check if the path exists
            if !Path::new(path).exists() {
                continue;
            }

            if let Err(e) = std::fs::remove_dir_all(path) {
                tracing::info!("Failed to remove file: {:?}", e);
            }
        }
    }
}


pub async fn dispatch_command(command: ApiCommand, metrics: &Metrics) -> Result<ApiCommandResult> {
    match command {
        ApiCommand::ScarbVersion => match do_cairo_version() {
            Ok(result) => Ok(ApiCommandResult::ScarbVersion(result)),
            Err(e) => Err(e),
        },
        ApiCommand::Shutdown => Ok(ApiCommandResult::Shutdown),
        ApiCommand::ScarbTest { remix_file_path } => match do_scarb_test(remix_file_path).await {
            Ok(result) => Ok(ApiCommandResult::ScarbTest(result.into_inner())),
            Err(e) => Err(e),
        },
        ApiCommand::Compile { compilation_request } => match do_metered_action(
            do_compile(compilation_request, &metrics),
            COMPILATION_LABEL_VALUE,
            metrics,
        )
            .await
        {
            Ok(result) => Ok(ApiCommandResult::Compile(result.into_inner())),
            Err(e) => Err(e),
        },
    }
}

pub async fn create_temp_dir() -> Result<PathBuf> {
    let temp_dir = std::env::temp_dir();
    let folder_name = uuid::Uuid::new_v4().to_string();
    let folder_path = temp_dir.join(&folder_name);

    tokio::fs::create_dir_all(&folder_path)
        .await
        .map_err(|e| ApiError::FailedToInitializeDirectories(e.to_string()))?;

    Ok(folder_path)
}

pub async fn init_directories(compilation_request: CompilationRequest) -> Result<String> {
    println!("init_directories, compilation_request: {:?}", compilation_request);

    let temp_dir = create_temp_dir().await?;

    for file in compilation_request.files.iter() {
        let file_path = temp_dir.join(&file.file_name);

        if let Some(parent) = file_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(|e| ApiError::FailedToInitializeDirectories(e.to_string()))?;
        }

        tokio::fs::write(&file_path, &file.file_content)
            .await
            .map_err(|e| ApiError::FailedToInitializeDirectories(e.to_string()))?;
    }

    println!("init_directories, temp_dir: {:?}", temp_dir);

    // check the path content
    println!("init_directories, temp_dir content: {:?}", tokio::fs::read_dir(&temp_dir).await);

    temp_dir
        .to_str()
        .ok_or_else(|| ApiError::FailedToInitializeDirectories("Failed to convert path to string".to_string()))
        .map(|s| s.to_string())
}

pub fn get_files_recursive(base_path: &Path) -> Result<Vec<FileContentMap>> {
    let mut file_content_map_array: Vec<FileContentMap> = Vec::new();

    if base_path.is_dir() {
        for entry in base_path
            .read_dir()
            .map_err(ApiError::FailedToReadDir)?
            .flatten()
        {
            let path = entry.path();
            if path.is_dir() {
                file_content_map_array.extend(get_files_recursive(&path)?);
            } else if let Ok(content) = std::fs::read_to_string(&path) {
                let file_name = path
                    .file_name()
                    .ok_or(ApiError::FailedToReadFilename)?
                    .to_string_lossy()
                    .to_string();
                let file_content = content;
                let file_content_map = FileContentMap {
                    file_name,
                    file_content,
                };
                file_content_map_array.push(file_content_map);
            }
        }
    }

    Ok(file_content_map_array)
}
