use prometheus::core::{AtomicF64, AtomicU64, GenericCounter, GenericCounterVec, GenericGaugeVec};
use prometheus::{Encoder, GaugeVec, IntCounter, IntCounterVec, Opts, Registry, TextEncoder};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Method, Status};
use rocket::{Data, Request, State};
use tracing::debug;
use tracing::instrument;

const NAMESPACE: &str = "starknet_api";
pub(crate) const COMPILATION_LABEL_VALUE: &str = "compilation";

// Action - compile/verify(once supported)
#[derive(Clone, Debug)]
pub struct Metrics {
    pub distinct_users_total: GenericCounterVec<AtomicU64>,
    pub plugin_launches_total: GenericCounter<AtomicU64>,
    pub action_total: GenericCounterVec<AtomicU64>,
    pub requests_total: GenericCounter<AtomicU64>,
    pub action_failures_total: GenericCounterVec<AtomicU64>,
    pub action_successes_total: GenericCounterVec<AtomicU64>,
    pub action_duration_seconds: GenericGaugeVec<AtomicF64>,
}

#[rocket::async_trait]
impl Fairing for Metrics {
    fn info(&self) -> Info {
        Info {
            name: "Metrics fairing",
            kind: Kind::Request,
        }
    }

    #[instrument(skip(self, req, _data))]
    async fn on_request(&self, req: &mut Request<'_>, _data: &mut Data<'_>) {
        self.requests_total.inc();
        if let Some(val) = req.client_ip() {
            let ip = val.to_string();
            let ip = ip.as_str();
            debug!("Plugin launched by: {}", ip);
            debug!("Headers: {:?}", req.headers());

            self.distinct_users_total.with_label_values(&[ip]).inc();
        }

        match req.method() {
            Method::Options => {}
            _ => self.update_metrics(req),
        }
    }
}

impl Metrics {
    fn update_metrics(&self, req: &mut Request<'_>) {
        let method = req.uri().path().segments().next().unwrap_or_default();
        match method {
            "compile-scarb"
            | "compile-scarb-async"
            | "compile-to-sierra"
            | "compile-to-sierra-async" => self
                .action_total
                .with_label_values(&[COMPILATION_LABEL_VALUE])
                .inc(),
            "on-plugin-launched" => self.plugin_launches_total.inc(),
            _ => {}
        }
    }
}

pub(crate) fn initialize_metrics(registry: Registry) -> Result<Metrics, prometheus::Error> {
    const ACTION_LABEL_NAME: &str = "action";

    let opts = Opts::new("distinct_users_total", "Distinct users total").namespace(NAMESPACE);
    let distinct_users_total = IntCounterVec::new(opts, &["ip"])?;
    registry.register(Box::new(distinct_users_total.clone()))?;

    let opts =
        Opts::new("plugin_launches_total", "Total number plugin launches").namespace(NAMESPACE);
    let plugin_launches_total = IntCounter::with_opts(opts)?;
    registry.register(Box::new(plugin_launches_total.clone()))?;

    let opts = Opts::new("action_total", "Total number of action runs").namespace(NAMESPACE);
    let action_total = IntCounterVec::new(opts, &[ACTION_LABEL_NAME])?;
    registry.register(Box::new(action_total.clone()))?;

    // Follow naming conventions for new metrics https://prometheus.io/docs/practices/naming/
    let opts = Opts::new("requests_total", "Number of requests").namespace(NAMESPACE);
    let requests_total = IntCounter::with_opts(opts)?;
    registry.register(Box::new(requests_total.clone()))?;

    let opts = Opts::new("action_failures_total", "Number of action failures").namespace(NAMESPACE);
    let action_failures_total = IntCounterVec::new(opts, &[ACTION_LABEL_NAME])?;
    registry.register(Box::new(action_failures_total.clone()))?;

    let opts =
        Opts::new("action_successes_total", "Number of action successes").namespace(NAMESPACE);
    let action_successes_total = IntCounterVec::new(opts, &[ACTION_LABEL_NAME])?;
    registry.register(Box::new(action_successes_total.clone()))?;

    let opts =
        Opts::new("action_duration_seconds", "Duration of action in seconds").namespace(NAMESPACE);
    let action_duration_seconds = GaugeVec::new(opts, &[ACTION_LABEL_NAME])?;
    registry.register(Box::new(action_duration_seconds.clone()))?;

    Ok(Metrics {
        distinct_users_total,
        plugin_launches_total,
        action_total,
        requests_total,
        action_failures_total,
        action_successes_total,
        action_duration_seconds,
    })
}

#[instrument(skip(registry))]
#[get("/metrics")]
pub(crate) async fn metrics(registry: &State<Registry>) -> Result<String, (Status, String)> {
    let metric_families = registry.gather();
    let mut buffer = Vec::new();
    let encoder = TextEncoder::new();

    match encoder.encode(&metric_families, &mut buffer) {
        Ok(_) => match String::from_utf8(buffer) {
            Ok(val) => Ok(val),
            Err(_) => Err((Status::InternalServerError, "Non utf8 metrics".to_string())),
        },
        Err(_) => Err((Status::InternalServerError, "Encode error".to_string())),
    }
}
