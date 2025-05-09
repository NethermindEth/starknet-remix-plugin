pub mod allowed_versions;
pub mod compile;
pub mod multi_test;
pub mod process;
pub mod scarb_version;
pub mod types;
pub mod utils;

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
