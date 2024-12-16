use crate::errors::{ApiError, Result};
use lazy_static::lazy_static;
use semver::Version;
use serde::{Deserialize, Serialize};
use std::collections::HashMap;
use std::sync::RwLock;
use std::time::SystemTime;
use tracing::instrument;

use super::types::ApiResponse;

#[derive(Debug, Deserialize)]
struct GitHubRelease {
    tag_name: String,
}

#[derive(Debug, Serialize, Clone)]
struct CachedVersions {
    versions: Vec<String>,
    last_updated: SystemTime,
}

lazy_static! {
    static ref CACHED_VERSIONS: RwLock<CachedVersions> = RwLock::new(CachedVersions {
        versions: Vec::new(),
        last_updated: SystemTime::now(),
    });
}

async fn fetch_github_releases() -> Result<Vec<String>> {
    let client = reqwest::Client::new();
    let releases: Vec<GitHubRelease> = client
        .get("https://api.github.com/repos/starkware-libs/cairo/releases")
        .header("User-Agent", "starknet-remix-plugin")
        .send()
        .await
        .map_err(ApiError::FailedToFetchReleases)?
        .json()
        .await
        .map_err(ApiError::FailedToParseReleases)?;

    let mut version_map: HashMap<(u64, u64), Version> = HashMap::new();

    for release in releases {
        if let Ok(version) = Version::parse(&release.tag_name.replace("v", "")) {
            if version.pre.is_empty() {
                // Skip pre-releases (alpha, beta, rc)
                let key = (version.major, version.minor);

                match version_map.get(&key) {
                    Some(existing_version) => {
                        if version > *existing_version {
                            version_map.insert(key, version);
                        }
                    }
                    None => {
                        version_map.insert(key, version);
                    }
                }
            }
        }
    }

    let mut versions: Vec<String> = version_map.into_values().map(|v| v.to_string()).collect();

    versions.sort_by(|a, b| {
        let a_ver = Version::parse(a).unwrap();
        let b_ver = Version::parse(b).unwrap();
        b_ver.cmp(&a_ver)
    });

    versions.truncate(3);

    Ok(versions)
}

pub async fn start_version_updater() {
    tokio::spawn(async move {
        loop {
            if let Ok(versions) = fetch_github_releases().await {
                let mut cache = CACHED_VERSIONS.write().unwrap();
                cache.versions = versions;
                cache.last_updated = SystemTime::now();
            }

            tracing::info!("Updated allowed versions");

            tokio::time::sleep(tokio::time::Duration::from_secs(24 * 60 * 60)).await;
        }
    });
}

#[instrument]
#[get("/allowed-versions")]
pub async fn get_allowed_versions() -> ApiResponse<Vec<String>> {
    do_get_allowed_versions().await
}

pub async fn is_version_allowed(version: &str) -> bool {
    let allowed_versions = do_get_allowed_versions().await;
    allowed_versions
        .data
        .unwrap_or_default()
        .contains(&version.to_string())
}

pub async fn do_get_allowed_versions() -> ApiResponse<Vec<String>> {
    let should_fetch = {
        let cache = CACHED_VERSIONS.read().unwrap();
        cache.versions.is_empty()
    };

    if should_fetch {
        if let Ok(versions) = fetch_github_releases().await {
            let mut cache = CACHED_VERSIONS.write().unwrap();
            cache.versions = versions;
            cache.last_updated = SystemTime::now();
            return ApiResponse::ok(cache.versions.clone());
        }
        return ApiResponse::ok(vec![]);
    }

    let cache = CACHED_VERSIONS.read().unwrap();
    ApiResponse::ok(cache.versions.clone())
}
