#[macro_use]
extern crate rocket;

pub mod cors;
pub mod handlers;
pub mod tracing_log;
pub mod utils;
pub mod worker;

use crate::cors::CORS;
use crate::tracing_log::init_logger;
use crate::worker::WorkerEngine;
use handlers::cairo_version::{cairo_version, cairo_version_async, get_cairo_version_result};
use handlers::compile_casm::{compile_to_casm, compile_to_casm_async, compile_to_casm_result};
use handlers::compile_sierra::{
    compile_to_siera_async, compile_to_sierra, get_siera_compile_result,
};
use handlers::process::get_process_status;
use handlers::save_code::save_code;
use handlers::scarb_compile::{get_scarb_compile_result, scarb_compile, scarb_compile_async};
use handlers::{health, who_is_this};
use tracing::info;

#[launch]
async fn rocket() -> _ {
    if let Err(err) = init_logger() {
        eprintln!("Error initializing logger: {}", err);
    }

    let number_of_workers = match std::env::var("WORKER_THREADS") {
        Ok(v) => match v.parse::<u32>() {
            Ok(v) => v,
            Err(_) => 2u32,
        },
        Err(_) => 2u32,
    };

    let queue_size = match std::env::var("QUEUE_SIZE") {
        Ok(v) => match v.parse::<usize>() {
            Ok(v) => v,
            Err(_) => 1_000,
        },
        Err(_) => 1_000,
    };

    // Launch the worker processes
    let mut engine = WorkerEngine::new(number_of_workers, queue_size);

    engine.start();

    info!("Number of workers: {}", number_of_workers);
    info!("Queue size: {}", queue_size);

    info!("Starting Rocket webserver...");

    rocket::build().manage(engine).attach(CORS).mount(
        "/",
        routes![
            compile_to_sierra,
            compile_to_siera_async,
            get_siera_compile_result,
            compile_to_casm,
            compile_to_casm_async,
            compile_to_casm_result,
            scarb_compile,
            scarb_compile_async,
            get_scarb_compile_result,
            save_code,
            cairo_version,
            cairo_version_async,
            get_cairo_version_result,
            get_process_status,
            health,
            who_is_this,
        ],
    )
}
