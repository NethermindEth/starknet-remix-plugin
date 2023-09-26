#[macro_use]
extern crate rocket;

use handlers::ApiCommand;
use handlers::ApiCommandResult;
use rocket::serde::{json::Json, Deserialize, Serialize};
use std::env;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Arc;
use std::thread;

use futures::executor::block_on;

use uuid::{uuid, Uuid};

use crossbeam_queue::ArrayQueue;
use crossbeam_skiplist::SkipMap;

use rocket::data::{Data, ToByteUnit};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::fs::NamedFile;
use rocket::http::{Header, Method, Status};
use rocket::tokio::fs;
use rocket::{Request, Response};

mod handlers;

mod utils;
use utils::lib::{get_file_ext, get_file_path, CAIRO_DIR, CASM_ROOT, SIERRA_ROOT};

use env_logger::Env;
use log::{debug, error, info, log_enabled, Level};

#[derive(Default)]

pub struct CORS;

#[rocket::async_trait]
impl Fairing for CORS {
    fn info(&self) -> Info {
        Info {
            name: "Add CORS headers to responses",
            kind: Kind::Response,
        }
    }

    async fn on_response<'r>(&self, request: &'r Request<'_>, response: &mut Response<'r>) {
        if request.method() == Method::Options {
            response.set_status(Status::NoContent);
            response.set_header(Header::new(
                "Access-Control-Allow-Methods",
                "POST, PATCH, GET, DELETE",
            ));
            response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        }

        // Take the Plugin App URL from the env variable, if set
        match env::var("REACT_APP_URL") {
            Ok(v) => {
                response.set_header(Header::new("Access-Control-Allow-Origin", v));
            }
            Err(e) => {
                response.set_header(Header::new(
                    "Access-Control-Allow-Origin",
                    "https://cairo-remix-test.nethermind.io",
                ));
            }
        }

        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

#[post("/save_code/<remix_file_path..>", data = "<file>")]
async fn save_code(file: Data<'_>, remix_file_path: PathBuf) -> String {
    handlers::do_save_code(file, remix_file_path).await
}

#[get("/compile-to-sierra/<remix_file_path..>")]
async fn compile_to_sierra(remix_file_path: PathBuf) -> Json<handlers::CompileResponse> {
    handlers::do_compile_to_sierra(remix_file_path).await
}

#[get("/compile-to-casm/<remix_file_path..>")]
async fn compile_to_casm(remix_file_path: PathBuf) -> Json<handlers::CompileResponse> {
    handlers::do_compile_to_casm(remix_file_path).await
}

#[get("/compile-scarb/<remix_file_path..>")]
async fn scarb_compile(remix_file_path: PathBuf) -> Json<handlers::ScarbCompileResponse> {
    handlers::do_scarb_compile(remix_file_path).await.unwrap()
}

#[get("/compile-scarb-async/<remix_file_path..>")]
async fn scarb_compile_async(remix_file_path: PathBuf) -> String {
    // generate a process ID

    // queue the new Scarb command

    // return the process ID
    String::from("")
}

#[get("/compile-scarb-result/<process_id>")]
async fn get_scarb_compile_result(process_id: String) -> Json<handlers::ScarbCompileResponse> {
    // verify if process state is Success

    // fetch the process results

    // return process results
    panic!("asdsad");
    //Json::from(handlers::ScarbCompileResponse{})
}

#[get("/process_status/<process_id>")]
async fn get_process_status(process_id: String) -> String {
    // get status of process by ID

    // return the process status
    String::from("")
}

// Read the version from the cairo Cargo.toml file.
#[get("/cairo_version")]
async fn cairo_version() -> String {
    handlers::do_cairo_version().unwrap_or_else(|e| e)
}

#[get("/health")]
async fn health() -> &'static str {
    "OK"
}

#[get("/")]
async fn who_is_this() -> &'static str {
    "Who are you?"
}

fn start_workers(num_workers: u32) {
    // Create a queue instance
    let queue: ArrayQueue<(Uuid, ApiCommand)> = ArrayQueue::new(5);
    let arc_queue = Arc::new(queue);

    // Create a process state map instance (NOTE: how to implement purging from this map???)
    let process_states = SkipMap::new();
    let arc_process_states = Arc::new(process_states);

    // Create a collection of worker threads
    let mut worker_threads: Vec<thread::JoinHandle<()>> = vec![];

    for _ in 0..num_workers {
        // add to collection
        let arc_clone = arc_queue.clone();
        let arc_states = arc_process_states.clone();
        worker_threads.push(thread::spawn(move || {
            block_on(worker(arc_clone, arc_states));
        }));
    }
}

enum ProcessState {
    New,
    Running,
    Completed(ApiCommandResult),
    Error(String),
}

fn enqueue_command(
    command: ApiCommand,
    queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
    states: Arc<SkipMap<Uuid, ProcessState>>,
) -> Result<Uuid, String> {
    let uuid = Uuid::new_v4();

    states.insert(uuid, ProcessState::New);

    match queue.push((uuid, command)) {
        Ok(()) => Ok(uuid),
        Err(e) => {
            Err(String::from("Error enqueueing command {}")) // TODO nice formatting
        }
    }
}

// worker function
async fn worker(
    queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
    states: Arc<SkipMap<Uuid, ProcessState>>,
) {
    loop {
        // read process ID and command from queue
        match queue.pop() {
            Some((process_id, command)) => {
                match command {
                    handlers::ApiCommand::Shutdown => {
                        return;
                    }
                    _ => {
                        // TODO: update process state

                        let result = handlers::dispatch_command(command).await;
                        // TODO store the result in results map

                        // TODO: update process state
                    }
                }
            }
            None => {
                // TODO: should we sleep here?
            }
        }
    }
}

#[launch]
fn rocket() -> _ {
    env_logger::init();

    // Launch the worker processes
    let num_of_workers = 1;

    start_workers(num_of_workers);

    info!("Starting Rocket webserver...");

    rocket::build().attach(CORS).mount(
        "/",
        routes![
            compile_to_sierra,
            compile_to_casm,
            scarb_compile,
            save_code,
            cairo_version,
            health,
            who_is_this,
        ],
    )
}
