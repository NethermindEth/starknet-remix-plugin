pub mod compile;
pub mod process;
pub mod scarb_test;
pub mod scarb_version;
pub mod types;
pub mod utils;
pub mod allowed_versions;

use tracing::info;
use tracing::instrument;

const STATUS_SUCCESS: &str = "Success";
const STATUS_COMPILATION_FAILED: &str = "CompilationFailed";
const STATUS_UNKNOWN_ERROR: &str = "UnknownError";

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
