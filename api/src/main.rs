#[macro_use]
extern crate rocket;
use std::process::Command;

use rocket::data::{Data, ToByteUnit};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::fs::NamedFile;
use rocket::http::{ContentType, Header, Method, Status};
use rocket::{Request, Response};

mod utils;
use utils::lib::Hash;

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
        response.set_header(Header::new("Access-Control-Allow-Origin", "*"));
        response.set_header(Header::new(
            "Access-Control-Allow-Methods",
            "POST, GET, PATCH, OPTIONS",
        ));
        response.set_header(Header::new("Access-Control-Allow-Headers", "*"));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
        if request.method() == Method::Options {
            let body = "";
            response.set_header(ContentType::Plain);
            response.set_sized_body(body.len(), std::io::Cursor::new(body));
            response.set_status(Status::Ok);
        }
    }
}

#[post("/compile-to-sierra", data = "<file>")]
async fn compile_to_sierra(file: Data<'_>) -> Option<NamedFile> {
    let file_hash = Hash::new(16);
    let file_path = file_hash.file_path("cairo");

    // Modify to zip and unpack.
    let saved_file = file.open(128_i32.gibibytes()).into_file(&file_path).await;

    match saved_file {
        Ok(_) => {
            println!("File saved successfully");
        }
        Err(e) => {
            println!("Error saving file: {:?}", e);
        }
    }

    let cairo_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/", "cairo/");

    let mut compile = Command::new("cargo");
    compile.current_dir(cairo_dir);

    let result = compile
        .arg("run")
        .arg("--bin")
        .arg("starknet-compile")
        .arg("--")
        .arg(&file_path)
        .arg(file_hash.sierra_path())
        .arg("--allowed-libfuncs-list-name")
        .arg("experimental_v0.1.0")
        .spawn();

    match result {
        Ok(mut child) => match child.wait() {
            // Return here?
            Ok(status) => {
                println!("status: {}", status);
            }
            Err(e) => {
                println!("error: {}", e);
            }
        },
        Err(e) => {
            println!("error: {:?}", e);
        }
    }

    NamedFile::open(file_hash.sierra_path()).await.ok()
}

#[post("/compile-to-casm", data = "<file>")]
async fn compile_to_casm(file: Data<'_>) -> Option<NamedFile> {
    let file_hash = Hash::new(16);
    let file_path = file_hash.file_path("json");
    // Modify to zip.
    println!("Saving file to: {:?}", file_path);
    let saved_file = file.open(128_i32.gibibytes()).into_file(&file_path).await;
    println!("After file save");

    match saved_file {
        Ok(_) => {
            println!("File saved successfully");
        }
        Err(e) => {
            println!("Error saving file: {:?}", e);
        }
    }

    let cairo_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/", "cairo/");

    let mut compile = Command::new("cargo");
    compile.current_dir(cairo_dir);

    let result = compile
        .arg("run")
        .arg("--bin")
        .arg("starknet-sierra-compile")
        .arg("--")
        .arg(&file_path)
        .arg(file_hash.casm_path())
        .arg("--allowed-libfuncs-list-name")
        .arg("experimental_v0.1.0")
        .spawn();

    match result {
        Ok(mut child) => match child.wait() {
            Ok(status) => {
                println!("status: {}", status);
            }
            Err(e) => {
                println!("error: {}", e);
            }
        },
        Err(e) => {
            println!("error: {:?}", e);
        }
    }

    NamedFile::open(file_hash.casm_path()).await.ok()
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .mount("/", routes![compile_to_sierra, compile_to_casm])
        .attach(CORS)
}
