#[macro_use]
extern crate rocket;

use handlers::ApiCommand;
use rocket::serde::{json::Json, Deserialize, Serialize};
use std::env;
use std::thread;
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};
use std::sync::Arc;

use futures::executor::block_on;

use uuid::Uuid;

use crossbeam_queue::ArrayQueue;

use rocket::data::{Data, ToByteUnit};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::fs::NamedFile;
use rocket::http::{Header, Method, Status};
use rocket::tokio::fs;
use rocket::{Request, Response};

mod handlers;


mod utils;
use utils::lib::{get_file_ext, get_file_path, CAIRO_DIR, CASM_ROOT, SIERRA_ROOT};

use log::{debug, error, log_enabled, info, Level};
use env_logger::Env;


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
                response.set_header(Header::new(
                    "Access-Control-Allow-Origin",
                    v
                ));
            },
            Err(e) => {
                response.set_header(Header::new(
                    "Access-Control-Allow-Origin",
                    "https://cairo-remix-test.nethermind.io"
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
    handlers::do_scarb_compile(remix_file_path).await
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
    handlers::do_cairo_version()
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
    // TODO create a static' queue instance
    let queue : ArrayQueue<(Uuid, ApiCommand)> = ArrayQueue::new(5);
    let arc_queue = Arc::new(queue);

    // TODO create a static' results state map instance (NOTE: how to implement purging from this map???)
    // TODO create a static' collection of worker threads
    let mut worker_threads: Vec<thread::JoinHandle<()>> = vec![];


    for _ in 0..num_workers {
        // add to collection
        let arc_clone = arc_queue.clone();
        worker_threads.push( 
            thread::spawn( move || 
            { 
                block_on(worker(arc_clone));
            })
        );
        
    }
}

// worker function
async fn worker(queue : Arc<ArrayQueue<(Uuid, ApiCommand)>>) {
    loop {
        // read process ID and command from queue
        match queue.pop() {
            Some((process_id, command )) => {
                match command {
                    handlers::ApiCommand::Shutdown => { 
                        return; 
                    },
                    _ => {
                        // TODO: update process state
        
                        let result = handlers::dispatch_command(command).await;
                        // TODO store the result in results map
        
                        // TODO: update process state
                    },
                }
            },
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
