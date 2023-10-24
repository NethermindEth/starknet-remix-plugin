use crate::types::{ApiError, Result};
use crate::utils::lib::CAIRO_COMPILERS_DIR;
use rocket::tokio::fs::read_dir;
use std::path::Path;
use tracing::instrument;

#[instrument]
#[get("/cairo_versions")]
pub async fn cairo_versions() -> String {
    do_cairo_versions()
        .await
        .unwrap_or_else(|e| format!("Failed to get cairo versions: {:?}", e))
}

/// Get cairo versions
pub async fn do_cairo_versions() -> Result<String> {
    let path = Path::new(CAIRO_COMPILERS_DIR);

    let mut dir = read_dir(path).await.map_err(ApiError::FailedToReadDir)?;
    let mut result = vec![];

    while let Ok(Some(entry)) = dir.next_entry().await {
        let entry = entry;
        let path = entry.path();
        if path.is_dir() {
            result.push(entry.file_name().to_string_lossy().to_string());
        }
    }

    Ok(format!("{:?}", result))
}
