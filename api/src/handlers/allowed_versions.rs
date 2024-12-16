use std::time::SystemTime;
use rocket::serde::json::Json;
use serde::{Deserialize, Serialize};
use tracing::instrument;
use lazy_static::lazy_static;
use std::sync::RwLock;
use std::collections::HashMap;

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

fn parse_version(version: &str) -> Option<(u32, u32, u32)> {
    let version = version.trim_start_matches('v');
    let parts: Vec<&str> = version.split('.').collect();
    if parts.len() != 3 {
        return None;
    }

    Some((
        parts[0].parse().ok()?,
        parts[1].parse().ok()?,
        parts[2].parse().ok()?
    ))
}

async fn fetch_github_releases() -> Result<Vec<String>, Box<dyn std::error::Error>> {
    let client = reqwest::Client::new();
    let releases: Vec<GitHubRelease> = client
        .get("https://api.github.com/repos/starkware-libs/cairo/releases")
        .header("User-Agent", "starknet-remix-plugin")
        .send()
        .await?
        .json()
        .await?;

    // Group versions by major.minor and keep the highest patch version
    let mut version_map: HashMap<(u32, u32), String> = HashMap::new();

    for release in releases {
        // Skip non-release versions
        if release.tag_name.contains("-rc") ||
           release.tag_name.contains("alpha") ||
           release.tag_name.contains("beta") {
            continue;
        }

        if let Some((major, minor, patch)) = parse_version(&release.tag_name) {
            let key = (major, minor);
            match version_map.get(&key) {
                Some(existing_version) => {
                    if let Some((_, _, existing_patch)) = parse_version(existing_version) {
                        if patch > existing_patch {
                            version_map.insert(key, release.tag_name);
                        }
                    }
                }
                None => {
                    version_map.insert(key, release.tag_name);
                }
            }
        }
    }

    // Convert to vec and sort by version (descending)
    let mut versions: Vec<String> = version_map.into_values().collect();
    versions.sort_by(|a, b| {
        let a_ver = parse_version(a).unwrap_or((0, 0, 0));
        let b_ver = parse_version(b).unwrap_or((0, 0, 0));
        b_ver.cmp(&a_ver)
    });

    // Take the latest 3 major.minor versions
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
            tokio::time::sleep(tokio::time::Duration::from_secs(24 * 60 * 60)).await; // Update every 24 hours
        }
    });
}

#[instrument]
#[get("/allowed-versions")]
pub async fn get_allowed_versions() -> Json<Vec<String>> {
    let should_fetch = {
        let cache = CACHED_VERSIONS.read().unwrap();
        cache.versions.is_empty()
    };

    if should_fetch {
        if let Ok(versions) = fetch_github_releases().await {
            let mut cache = CACHED_VERSIONS.write().unwrap();
            cache.versions = versions;
            cache.last_updated = SystemTime::now();
            return Json(cache.versions.clone());
        }
        return Json(vec![]);
    }

    let cache = CACHED_VERSIONS.read().unwrap();
    Json(cache.versions.clone())
}
