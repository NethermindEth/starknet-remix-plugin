use tracing_appender::rolling;
use tracing_subscriber::filter::LevelFilter;
use tracing_subscriber::fmt::writer::MakeWriterExt;
use tracing_subscriber::prelude::*;

pub fn init_logger() -> Result<(), Box<dyn std::error::Error>> {
    // TO STDOUT
    let stdout_log = tracing_subscriber::fmt::layer().pretty();
    // Log all `tracing` events to files prefixed with `debug`.
    // Rolling these files every day
    let debug_file = rolling::daily("./logs", "debug");
    // Log warnings and errors to a separate file. Since we expect these events
    // to occur less frequently, roll that file on a daily basis
    let warn_file = rolling::daily("./logs", "warnings").with_max_level(tracing::Level::WARN);
    let all_files = debug_file.and(warn_file);

    let rolling_files = tracing_subscriber::fmt::layer()
        .with_writer(all_files)
        .with_ansi(false);

    tracing_subscriber::registry()
        .with(
            stdout_log
                // Add an `INFO` filter to the stdout logging layer
                .with_filter(LevelFilter::INFO)
                .and_then(rolling_files),
        )
        .init();

    Ok(())
}
