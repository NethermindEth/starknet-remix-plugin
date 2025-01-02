use rocket::tokio;
use std::path::Path;
use std::time::Instant;
use std::{future::Future, path::PathBuf};
use tracing::{info, instrument};

use crate::errors::{ApiError, ExecutionError, FileError, Result, SystemError};
use crate::handlers::compile::{default_scarb_toml, scarb_toml_with_version};
use crate::metrics::{Metrics, COMPILATION_LABEL_VALUE, VERIFY_LABEL_VALUE};

use super::scarb_version::do_scarb_version;
use super::types::{BaseRequest, CompilationRequest, FileContentMap, Successful};
use super::verify::do_verify;
use super::{
    compile::do_compile,
    multi_test::do_test,
    types::{ApiCommand, ApiCommandResult},
};

#[instrument]
#[post("/on-plugin-launched")]
pub async fn on_plugin_launched() {
    info!("/on-plugin-launched");
}

pub(crate) async fn do_metered_action<T: Successful>(
    action: impl Future<Output = Result<T>>,
    action_label_value: &str,
    metrics: &Metrics,
) -> Result<T> {
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
            debug!("Removing path: {:?}", path);

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
            debug!("Removing path: {:?}", path);

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
        ApiCommand::ScarbVersion => match do_scarb_version() {
            Ok(result) => Ok(ApiCommandResult::ScarbVersion(result)),
            Err(e) => Err(e),
        },
        ApiCommand::Shutdown => Ok(ApiCommandResult::Shutdown),
        ApiCommand::ScarbTest { test_request } => match do_test(test_request).await {
            Ok(result) => Ok(ApiCommandResult::Test(result)),
            Err(e) => Err(e),
        },
        ApiCommand::Compile {
            compilation_request,
        } => match do_metered_action(
            do_compile(compilation_request, metrics),
            COMPILATION_LABEL_VALUE,
            metrics,
        )
        .await
        {
            Ok(result) => Ok(ApiCommandResult::Compile(result)),
            Err(e) => Err(e),
        },
        ApiCommand::Verify {
            verify_request,
        } => match do_metered_action(
            do_verify(verify_request, metrics),
            VERIFY_LABEL_VALUE,
            metrics,
        )
        .await
        {
            Ok(result) => Ok(ApiCommandResult::Verify(result)),
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
        .map_err(FileError::FailedToInitializeDirectories)?;

    Ok(folder_path)
}

pub async fn init_directories(base_request: &BaseRequest) -> Result<String> {
    let temp_dir = create_temp_dir().await?;

    for file in base_request.files.iter() {
        let file_path = temp_dir.join(&file.file_name);

        if let Some(parent) = file_path.parent() {
            tokio::fs::create_dir_all(parent)
                .await
                .map_err(FileError::FailedToInitializeDirectories)?;
        }

        tokio::fs::write(&file_path, &file.file_content)
            .await
            .map_err(FileError::FailedToSaveFile)?;
    }

    temp_dir
        .to_str()
        .ok_or_else(|| {
            ApiError::System(SystemError::FailedToParseFilePath(format!(
                "{:?}",
                temp_dir
            )))
        })
        .map(|s| s.to_string())
}

pub fn get_files_recursive(base_path: &Path) -> Result<Vec<FileContentMap>> {
    let mut file_content_map_array: Vec<FileContentMap> = Vec::new();

    if base_path.is_dir() {
        for entry in base_path
            .read_dir()
            .map_err(FileError::FailedToReadDir)?
            .flatten()
        {
            let path = entry.path();
            if path.is_dir() {
                file_content_map_array.extend(get_files_recursive(&path)?);
            } else if let Ok(content) = std::fs::read_to_string(&path) {
                let file_name = path
                    .file_name()
                    .ok_or(FileError::FailedToReadFilename)?
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

pub async fn ensure_scarb_toml(
    mut compilation_request: CompilationRequest,
) -> Result<CompilationRequest> {
    // Check if Scarb.toml exists in the root
    if !compilation_request.has_scarb_toml() {
        // number of files cairo files in the request
        let cairo_files_count = compilation_request
            .base_request
            .files
            .iter()
            .filter(|f| f.file_name.ends_with(".cairo"))
            .count();

        if cairo_files_count != 1 {
            tracing::error!(
                "Invalid request: Expected exactly one Cairo file, found {}",
                cairo_files_count
            );
            return Err(ExecutionError::InvalidRequest.into());
        }

        tracing::debug!("No Scarb.toml found, creating default one");
        compilation_request.base_request.files.push(FileContentMap {
            file_name: "Scarb.toml".to_string(),
            file_content: match compilation_request.version {
                Some(ref version) => scarb_toml_with_version(version),
                None => default_scarb_toml(),
            },
        });

        // change the name of the file to the first cairo file to src/lib.cairo
        if let Some(first_cairo_file) = compilation_request
            .base_request
            .files
            .iter_mut()
            .find(|f| f.file_name.ends_with(".cairo"))
        {
            first_cairo_file.file_name = "src/lib.cairo".to_string();
        }
    }

    Ok(compilation_request)
}

pub fn is_single_file_compilation(compilation_request: &CompilationRequest) -> bool {
    compilation_request.base_request.files.len() == 1
        && compilation_request.base_request.files[0]
            .file_name
            .ends_with(".cairo")
}
