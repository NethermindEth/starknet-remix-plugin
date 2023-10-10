#[macro_use]
extern crate rocket;

use handlers::ApiCommand;
use handlers::ApiCommandResult;
use rocket::serde::{json, json::Json};
use std::env;
use std::fmt;
use std::path::PathBuf;
use std::sync::Arc;
use std::thread;
use std::time;

use futures::executor::block_on;

use uuid::Uuid;

use crossbeam_queue::ArrayQueue;
use crossbeam_skiplist::SkipMap;

use rocket::data::Data;
use rocket::fairing::{Fairing, Info, Kind};
use rocket::http::{Header, Method, Status};
use rocket::{tokio, Request, Response, State};
use tracing::instrument;

mod handlers;

mod tracing_log;
use tracing_log::init_logger;
mod utils;
use log::{debug, info};
use rocket::tokio::task::JoinHandle;

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
            Err(_) => {
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
    handlers::do_compile_to_sierra(remix_file_path)
        .await
        .unwrap_or(Json::from(handlers::CompileResponse {
            message: "Error compiling to sierra".to_string(),
            status: "error".to_string(),
            file_content: "".to_string(),
        }))
}

#[get("/compile-to-sierra-async/<remix_file_path..>")]
async fn compile_to_siera_async(remix_file_path: PathBuf, engine: &State<WorkerEngine>) -> String {
    do_process_command(ApiCommand::SierraCompile(remix_file_path), engine)
}

#[get("/compile-to-sierra-result/<process_id>")]
async fn get_siera_compile_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::SierraCompile(sierra_result) => json::to_string(&sierra_result).unwrap(),
        _ => String::from("Result not available"),
    })
}

#[get("/compile-to-casm/<remix_file_path..>")]
async fn compile_to_casm(remix_file_path: PathBuf) -> Json<handlers::CompileResponse> {
    handlers::do_compile_to_casm(remix_file_path).await
}

#[get("/compile-to-casm-async/<remix_file_path..>")]
async fn compile_to_casm_async(remix_file_path: PathBuf, engine: &State<WorkerEngine>) -> String {
    do_process_command(ApiCommand::CasmCompile(remix_file_path), engine)
}

#[get("/compile-to-casm-result/<process_id>")]
async fn copmile_to_casm_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::CasmCompile(casm_result) => json::to_string(&casm_result).unwrap(),
        _ => String::from("Result not available"),
    })
}

#[instrument]
#[get("/compile-scarb/<remix_file_path..>")]
async fn scarb_compile(remix_file_path: PathBuf) -> Json<handlers::ScarbCompileResponse> {
    handlers::do_scarb_compile(remix_file_path).await.unwrap()
}

#[get("/compile-scarb-async/<remix_file_path..>")]
async fn scarb_compile_async(remix_file_path: PathBuf, engine: &State<WorkerEngine>) -> String {
    do_process_command(ApiCommand::ScarbCompile(remix_file_path), engine)
}

#[get("/compile-scarb-result/<process_id>")]
async fn get_scarb_compile_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::ScarbCompile(scarb_result) => json::to_string(&scarb_result).unwrap(),
        _ => String::from("Result not available"),
    })
}

#[get("/process_status/<process_id>")]
async fn get_process_status(process_id: String, engine: &State<WorkerEngine>) -> String {
    // get status of process by ID
    match Uuid::parse_str(&process_id) {
        Ok(process_uuid) => {
            if engine.arc_process_states.contains_key(&process_uuid) {
                format!(
                    "{:}",
                    engine
                        .arc_process_states
                        .get(&process_uuid)
                        .unwrap()
                        .value()
                )
            } else {
                // TODO can we return HTTP status code here?
                format!("Process id not found")
            }
        }
        Err(e) => {
            // TODO can we return HTTP status code here?
            e.to_string()
        }
    }
}

// Read the version from the cairo Cargo.toml file.
#[instrument]
#[get("/cairo_version")]
async fn cairo_version() -> String {
    handlers::do_cairo_version().unwrap_or_else(|e| e)
}

// Read the version from the cairo Cargo.toml file.
#[get("/cairo_version_async")]
async fn cairo_version_async(engine: &State<WorkerEngine>) -> String {
    do_process_command(ApiCommand::CairoVersion, engine)
}

#[get("/cairo_version_result/<process_id>")]
async fn get_cairo_version_result(process_id: String, engine: &State<WorkerEngine>) -> String {
    fetch_process_result(process_id, engine, |result| match result {
        ApiCommandResult::CairoVersion(version) => version.to_string(),
        _ => String::from("Result not available"),
    })
}

fn do_process_command(command: ApiCommand, engine: &State<WorkerEngine>) -> String {
    // queue the new Scarb command
    match engine.enqueue_command(command) {
        Ok(uuid) => {
            // return the process ID
            format!("{}", uuid)
        }
        Err(e) => {
            // TODO can we return HTTP status code here?
            e
        }
    }
}

fn fetch_process_result<F>(process_id: String, engine: &State<WorkerEngine>, do_work: F) -> String
where
    F: FnOnce(&ApiCommandResult) -> String,
{
    // get status of process by ID
    match Uuid::parse_str(&process_id) {
        Ok(process_uuid) => {
            if engine.arc_process_states.contains_key(&process_uuid) {
                match engine
                    .arc_process_states
                    .get(&process_uuid)
                    .unwrap()
                    .value()
                {
                    ProcessState::Completed(result) => do_work(result),
                    _ => String::from("Result not available"),
                }
            } else {
                // TODO can we return HTTP status code here?
                "Process id not found".to_string()
            }
        }
        Err(e) => {
            // TODO can we return HTTP status code here?
            e.to_string()
        }
    }
}

#[instrument]
#[get("/health")]
async fn health() -> &'static str {
    "OK"
}

#[instrument]
#[get("/")]
async fn who_is_this() -> &'static str {
    "Who are you?"
}

enum ProcessState {
    New,
    Running,
    Completed(ApiCommandResult),
    Error(String),
}

impl fmt::Display for ProcessState {
    fn fmt(&self, f: &mut fmt::Formatter) -> fmt::Result {
        match self {
            ProcessState::New => write!(f, "New"),
            ProcessState::Running => write!(f, "Running"),
            ProcessState::Completed(_) => write!(f, "Completed"),
            ProcessState::Error(e) => write!(f, "Error({})", e),
        }
    }
}

struct WorkerEngine {
    num_workers: u32,
    worker_threads: Vec<JoinHandle<()>>,
    arc_command_queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
    arc_process_states: Arc<SkipMap<Uuid, ProcessState>>,
}

impl WorkerEngine {
    fn new(num_workers: u32) -> Self {
        // Create a queue instance

        let queue: ArrayQueue<(Uuid, ApiCommand)> = ArrayQueue::new(5);
        let arc_command_queue = Arc::new(queue);

        // Create a process state map instance (NOTE: how to implement purging from this map???)
        let process_states = SkipMap::new();
        let arc_process_states = Arc::new(process_states);

        // Create a collection of worker threads
        let worker_threads: Vec<JoinHandle<()>> = vec![];

        WorkerEngine {
            num_workers,
            arc_command_queue,
            arc_process_states,
            worker_threads,
        }
    }

    fn start(&mut self) {
        for _ in 0..self.num_workers {
            // add to collection
            let arc_clone = self.arc_command_queue.clone();
            let arc_states = self.arc_process_states.clone();
            self.worker_threads.push(tokio::spawn(async move {
                block_on(WorkerEngine::worker(arc_clone, arc_states));
            }));
        }
    }

    fn enqueue_command(&self, command: ApiCommand) -> Result<Uuid, String> {
        let uuid = Uuid::new_v4();

        self.arc_process_states.insert(uuid, ProcessState::New);

        match self.arc_command_queue.push((uuid, command)) {
            Ok(()) => Ok(uuid),
            Err((uuid, command)) => Err(format!(
                "Error enqueueing command {:?} in process {:?}",
                command, uuid
            )),
        }
    }

    // worker function
    async fn worker(
        arc_command_queue: Arc<ArrayQueue<(Uuid, ApiCommand)>>,
        arc_process_states: Arc<SkipMap<Uuid, ProcessState>>,
    ) {
        info!("Starting worker thread...");
        'worker_loop: loop {
            // read process ID and command from queue
            match arc_command_queue.pop() {
                Some((process_id, command)) => {
                    debug!("Command received: {:?}", command);

                    match command {
                        ApiCommand::Shutdown => {
                            break 'worker_loop;
                        }
                        _ => {
                            // update process state
                            arc_process_states.insert(process_id, ProcessState::Running);

                            match handlers::dispatch_command(command).await {
                                Ok(result) => {
                                    arc_process_states
                                        .insert(process_id, ProcessState::Completed(result));
                                }
                                Err(e) => {
                                    arc_process_states.insert(process_id, ProcessState::Error(e));
                                }
                            }
                        }
                    }
                }
                None => {
                    debug!("Waiting for commands...");
                    thread::sleep(time::Duration::from_millis(200));
                }
            }
        }
        info!("Worker thread finished...");
    }
}

#[launch]
async fn rocket() -> _ {
    if let Err(err) = init_logger() {
        eprintln!("Error initializing logger: {}", err);
    }

    // Launch the worker processes
    let mut engine = WorkerEngine::new(1);

    engine.start();

    info!("Starting Rocket webserver...");

    rocket::build().manage(engine).attach(CORS).mount(
        "/",
        routes![
            compile_to_sierra,
            compile_to_siera_async,
            get_siera_compile_result,
            compile_to_casm,
            compile_to_casm_async,
            copmile_to_casm_result,
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
