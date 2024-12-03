pub mod cairo_version;
pub mod process;
pub mod save_code;
pub mod scarb_compile;
pub mod scarb_test;
pub mod types;
pub mod utils;
pub mod compile;

use tracing::info;
use tracing::instrument;

const STATUS_SUCCESS: &str = "Success";
const STATUS_COMPILATION_FAILED: &str = "SierraCompilationFailed";
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
