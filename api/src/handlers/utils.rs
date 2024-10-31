use rocket::serde::json::Json;
use std::future::Future;
use std::time::Instant;
use tracing::instrument;

use crate::errors::Result;
use crate::handlers::types::Successable;
use crate::metrics::Metrics;

#[instrument]
#[post("/on-plugin-launched")]
pub async fn on_plugin_launched() {
    tracing::info!("/on-plugin-launched");
}

pub(crate) async fn do_metered_action<T: Successable>(
    action: impl Future<Output = Result<Json<T>>>,
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
                metrics
                    .action_successes_total
                    .with_label_values(&[action_label_value])
                    .inc();
                Ok(val)
            } else {
                metrics
                    .action_failures_total
                    .with_label_values(&[action_label_value]);
                Ok(val)
            }
        }
        Err(err) => {
            metrics
                .action_failures_total
                .with_label_values(&[action_label_value]);
            Err(err)
        }
    }
}
