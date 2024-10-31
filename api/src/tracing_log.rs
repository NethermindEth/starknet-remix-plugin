use anyhow::Context;
use rocket::yansi::Paint;
use tracing_appender::rolling;
use tracing_subscriber::field::MakeExt;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::registry::LookupSpan;
use tracing_subscriber::Layer;
use tracing_subscriber::{prelude::*, EnvFilter};

pub enum LogType {
    Formatted,
    Json,
}

impl From<String> for LogType {
    fn from(input: String) -> Self {
        match input.as_str() {
            "formatted" => Self::Formatted,
            "json" => Self::Json,
            _ => panic!("Unkown log type {}", input),
        }
    }
}

pub fn default_logging_layer<S>() -> impl Layer<S>
where
    S: tracing::Subscriber,
    S: for<'span> LookupSpan<'span>,
{
    let field_format = tracing_subscriber::fmt::format::debug_fn(|writer, field, value| {
        // We'll format the field name and value separated with a colon.
        if field.name() == "message" {
            write!(writer, "{:?}", value.bold())
        } else {
            write!(writer, "{}: {:?}", field, value.bold())
        }
    })
    .delimited(", ")
    .display_messages();

    tracing_subscriber::fmt::layer()
        .fmt_fields(field_format)
        // Configure the formatter to use `print!` rather than
        // `stdout().write_str(...)`, so that logs are captured by libtest's test
        // capturing.
        .with_test_writer()
}

pub fn json_logging_layer<
    S: for<'a> tracing_subscriber::registry::LookupSpan<'a> + tracing::Subscriber,
>() -> impl tracing_subscriber::Layer<S> {
    tracing_subscriber::fmt::layer()
        .json()
        // Configure the formatter to use `print!` rather than
        // `stdout().write_str(...)`, so that logs are captured by libtest's test
        // capturing.
        .with_test_writer()
}

#[derive(PartialEq, Eq, Debug, Clone, Copy)]
pub enum LogLevel {
    /// Only shows errors and warnings: `"critical"`.
    Critical,
    /// Shows errors, warnings, and some informational messages that are likely
    /// to be relevant when troubleshooting such as configuration: `"support"`.
    Support,
    /// Shows everything except debug and trace information: `"normal"`.
    Normal,
    /// Shows everything: `"debug"`.
    Debug,
    /// Shows nothing: "`"off"`".
    Off,
}

impl From<&str> for LogLevel {
    fn from(s: &str) -> Self {
        match &*s.to_ascii_lowercase() {
            "critical" => LogLevel::Critical,
            "support" => LogLevel::Support,
            "normal" => LogLevel::Normal,
            "debug" => LogLevel::Debug,
            "off" => LogLevel::Off,
            _ => panic!("a log level (off, debug, normal, support, critical)"),
        }
    }
}

pub fn filter_layer(level: LogLevel) -> EnvFilter {
    let filter_str = match level {
        LogLevel::Critical => "warn,hyper=off,rustls=off",
        LogLevel::Support => "warn,rocket::support=info,hyper=off,rustls=off",
        LogLevel::Normal => "info,hyper=off,rustls=off",
        LogLevel::Debug => "trace",
        LogLevel::Off => "off",
    };

    tracing_subscriber::filter::EnvFilter::try_new(filter_str).expect("filter string must parse")
}

pub fn init_logger() -> anyhow::Result<()> {
    // Log all `tracing` events to files prefixed with `debug`.
    // Rolling these files every day
    let debug_file = rolling::daily("./logs", "debug").with_max_level(tracing::Level::TRACE);
    // Log warnings and errors to a separate file. Since we expect these events
    // to occur less frequently, roll that file on a daily basis
    let warn_file = rolling::daily("./logs", "warnings").with_max_level(tracing::Level::WARN);
    let info_file = rolling::daily("./logs", "info").with_max_level(tracing::Level::INFO);
    let all_files = debug_file.and(warn_file).and(info_file);

    let rolling_files = tracing_subscriber::fmt::layer()
        .json()
        .with_writer(all_files)
        .with_ansi(false)
        .with_filter(filter_layer(LogLevel::Debug));

    let log_type = LogType::from(std::env::var("LOG_TYPE").unwrap_or_else(|_| "json".to_string()));
    let log_level = LogLevel::from(
        std::env::var("LOG_LEVEL")
            .unwrap_or_else(|_| "normal".to_string())
            .as_str(),
    );

    match log_type {
        LogType::Formatted => {
            tracing::subscriber::set_global_default(
                tracing_subscriber::registry()
                    .with(default_logging_layer())
                    .with(filter_layer(log_level)),
            )
            .context("Unable to to set LogType::Formatted as default")?;
        }
        LogType::Json => {
            tracing::subscriber::set_global_default(
                tracing_subscriber::registry()
                    .with(json_logging_layer().with_filter(filter_layer(log_level)))
                    .with(rolling_files),
            )
            .context("Unable to to set LogType::Json as default")?;
        }
    };

    Ok(())
}
