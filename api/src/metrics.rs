use prometheus::core::{AtomicF64, AtomicU64, GenericCounter, GenericCounterVec, GenericGaugeVec};
use prometheus::{Encoder, GaugeVec, IntCounter, IntCounterVec, Opts, Registry, TextEncoder};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Method, Status};
use rocket::{Data, Request, State};
use tracing::debug;
use tracing::instrument;

const NAMESPACE: &str = "starknet_api";

#[derive(Clone, Debug)]
pub struct Metrics {
    pub num_distinct_users: GenericCounterVec<AtomicU64>,
    pub num_plugin_launches: GenericCounter<AtomicU64>,
    pub num_of_compilations: GenericCounter<AtomicU64>,
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

            self.num_distinct_users.with_label_values(&[ip]).inc();
        }

        match req.method() {
            Method::Options => {}
            _ => self.update_metrics(req),
        }
    }
}

impl Metrics {
    fn update_metrics(&self, req: &mut Request<'_>) {
        match req.uri().path().as_str() {
            "/compile" | "/compile-async" => self.num_of_compilations.inc(),
            "/on-plugin-launched" => self.num_plugin_launches.inc(),
            _ => {}
        }
    }
}

pub(crate) fn initialize_metrics(registry: Registry) -> Result<Metrics, prometheus::Error> {
    const ACTION_LABEL_NAME: &str = "action";

    let opts = Opts::new("num_distinct_users", "Number of distinct users").namespace(NAMESPACE);
    let num_distinct_users = IntCounterVec::new(opts, &["ip"])?;
    registry.register(Box::new(num_distinct_users.clone()))?;

    let opts = Opts::new("num_plugin_launches", "Number of plugin launches").namespace(NAMESPACE);
    let num_plugin_launches = IntCounter::with_opts(opts)?;
    registry.register(Box::new(num_plugin_launches.clone()))?;

    let opts = Opts::new("num_of_compilations", "Number of compilation runs").namespace(NAMESPACE);
    let num_of_compilations = IntCounter::with_opts(opts)?;
    registry.register(Box::new(num_of_compilations.clone()))?;

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
        num_distinct_users,
        num_plugin_launches,
        num_of_compilations,
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
