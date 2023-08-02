#[macro_use]
extern crate rocket;
use rocket::serde::{json::Json, Deserialize, Serialize};
use std::path::{Path, PathBuf};
use std::process::{Command, Stdio};

use rocket::data::{Data, ToByteUnit};
use rocket::fairing::{Fairing, Info, Kind};
use rocket::fs::NamedFile;
use rocket::tokio::fs;
use rocket::{Request, Response};
use rocket::http::{Header, Method, Status};

mod utils;
use utils::lib::{get_file_ext, get_file_path, CAIRO_DIR, CASM_ROOT, SIERRA_ROOT};

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

        response.set_header(Header::new(
            "Access-Control-Allow-Origin",
            "https://cairo-remix-test.nethermind.io"
            // "*"
        ));
        response.set_header(Header::new("Access-Control-Allow-Credentials", "true"));
    }
}

#[post("/save_code/<remix_file_path..>", data = "<file>")]
async fn save_code(file: Data<'_>, remix_file_path: PathBuf) -> String {
    let remix_file_path = match remix_file_path.to_str() {
        Some(path) => path.to_string(),
        None => {
            return "".to_string();
        }
    };

    let file_path = get_file_path(&remix_file_path);

    // create file directory from file path
    match file_path.parent() {
        Some(parent) => match fs::create_dir_all(parent).await {
            Ok(_) => {
                println!("LOG: Created directory: {:?}", parent);
            }
            Err(e) => {
                println!("LOG: Error creating directory: {:?}", e);
            }
        },
        None => {
            println!("LOG: Error creating directory");
        }
    }

    // Modify to zip and unpack.
    let saved_file = file.open(128_i32.gibibytes()).into_file(&file_path).await;

    match saved_file {
        Ok(_) => {
            println!("LOG: File saved successfully");
            match file_path.to_str() {
                Some(path) => path.to_string(),
                None => "".to_string(),
            }
        }
        Err(e) => {
            println!("LOG: Error saving file: {:?}", e);
            "".to_string()
            // set the response with not ok code.
        }
    }
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct CompileResponse {
    pub status: String,
    pub message: String,
    pub file_content: String,
}

#[get("/compile-to-sierra/<remix_file_path..>")]
async fn compile_to_sierra(remix_file_path: PathBuf) -> Json<CompileResponse> {
    let remix_file_path = match remix_file_path.to_str() {
        Some(path) => path.to_string(),
        None => {
            return Json(CompileResponse {
                file_content: "".to_string(),
                message: "File path not found".to_string(),
                status: "FileNotFound".to_string(),
            });
        }
    };

    // check if the file has .cairo extension
    match get_file_ext(&remix_file_path) {
        ext if ext == "cairo" => {
            println!("LOG: File extension is cairo");
        }
        _ => {
            println!("LOG: File extension not supported");
            return Json(CompileResponse {
                file_content: "".to_string(),
                message: "File extension not supported".to_string(),
                status: "FileExtensionNotSupported".to_string(),
            });
        }
    }

    let file_path = get_file_path(&remix_file_path);

    let sierra_remix_path = remix_file_path.replace(&get_file_ext(&remix_file_path), "sierra");

    let mut compile = Command::new("cargo");
    compile.current_dir(CAIRO_DIR);

    // replace .cairo with
    let sierra_path = Path::new(SIERRA_ROOT).join(&sierra_remix_path);

    // create directory for sierra file
    match sierra_path.parent() {
        Some(parent) => match fs::create_dir_all(parent).await {
            Ok(_) => {
                println!("LOG: Created directory: {:?}", parent);
            }
            Err(e) => {
                println!("LOG: Error creating directory: {:?}", e);
            }
        },
        None => {
            println!("LOG: Error creating directory");
        }
    }

    let result = compile
        .arg("run")
        .arg("--bin")
        .arg("starknet-compile")
        .arg("--")
        .arg(&file_path)
        .arg(&sierra_path)
        .arg("--single-file")
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to execute starknet-compile");

    println!("LOG: ran command:{:?}", compile);

    let output = result.wait_with_output().expect("Failed to wait on child");

    Json(CompileResponse {
        file_content: match NamedFile::open(&sierra_path).await.ok() {
            Some(file) => match file.path().to_str() {
                Some(path) => match fs::read_to_string(path.to_string()).await {
                    Ok(sierra) => sierra.to_string(),
                    Err(e) => e.to_string(),
                },
                None => "".to_string(),
            },
            None => "".to_string(),
        },
        message: String::from_utf8(output.stderr)
            .unwrap()
            .replace(&file_path.to_str().unwrap().to_string(), &remix_file_path)
            .replace(
                &sierra_path.to_str().unwrap().to_string(),
                &sierra_remix_path,
            ),
        status: match output.status.code() {
            Some(0) => "Success".to_string(),
            Some(_) => "CompilationFailed".to_string(),
            None => "UnknownError".to_string(),
        },
    })
}

#[get("/compile-to-casm/<remix_file_path..>")]
async fn compile_to_casm(remix_file_path: PathBuf) -> Json<CompileResponse> {
    let remix_file_path = match remix_file_path.to_str() {
        Some(path) => path.to_string(),
        None => {
            return Json(CompileResponse {
                file_content: "".to_string(),
                message: "File path not found".to_string(),
                status: "FileNotFound".to_string(),
            });
        }
    };

    // check if the file has .sierra extension
    match get_file_ext(&remix_file_path) {
        ext if ext == "sierra" => {
            println!("LOG: File extension is sierra");
        }
        _ => {
            println!("LOG: File extension not supported");
            return Json(CompileResponse {
                file_content: "".to_string(),
                message: "File extension not supported".to_string(),
                status: "FileExtensionNotSupported".to_string(),
            });
        }
    }

    let file_path = get_file_path(&remix_file_path);

    let casm_remix_path = remix_file_path.replace(&get_file_ext(&remix_file_path), "casm");

    let mut compile = Command::new("cargo");
    compile.current_dir(CAIRO_DIR);

    let casm_path = Path::new(CASM_ROOT).join(&casm_remix_path);

    // create directory for casm file
    match casm_path.parent() {
        Some(parent) => match fs::create_dir_all(parent).await {
            Ok(_) => {
                println!("LOG: Created directory: {:?}", parent);
            }
            Err(e) => {
                println!("LOG: Error creating directory: {:?}", e);
            }
        },
        None => {
            println!("LOG: Error creating directory");
        }
    }

    let result = compile
        .arg("run")
        .arg("--bin")
        .arg("starknet-sierra-compile")
        .arg("--")
        .arg(&file_path)
        .arg(&casm_path)
        .stderr(Stdio::piped())
        .spawn()
        .expect("Failed to execute starknet-sierra-compile");

    println!("LOG: ran command:{:?}", compile);

    let output = result.wait_with_output().expect("Failed to wait on child");

    Json(CompileResponse {
        file_content: match NamedFile::open(&casm_path).await.ok() {
            Some(file) => match file.path().to_str() {
                Some(path) => match fs::read_to_string(path.to_string()).await {
                    Ok(casm) => casm.to_string(),
                    Err(e) => e.to_string(),
                },
                None => "".to_string(),
            },
            None => "".to_string(),
        },
        message: String::from_utf8(output.stderr)
            .unwrap()
            .replace(&file_path.to_str().unwrap().to_string(), &remix_file_path)
            .replace(&casm_path.to_str().unwrap().to_string(), &casm_remix_path),
        status: match output.status.code() {
            Some(0) => "Success".to_string(),
            Some(_) => "SierraCompilationFailed".to_string(),
            None => "UnknownError".to_string(),
        },
    })
}

// Read the version from the cairo Cargo.toml file.
#[get("/cairo_version")]
async fn cairo_version() -> String {
    let mut version_caller = Command::new("cargo");
    version_caller.current_dir(CAIRO_DIR);
    match String::from_utf8(
        version_caller
            .arg("run")
            .arg("-q")
            .arg("--bin")
            .arg("cairo-compile")
            .arg("--")
            .arg("--version")
            .stdout(Stdio::piped())
            .spawn()
            .expect("Failed to execute cairo-compile")
            .wait_with_output()
            .expect("Failed to wait on child")
            .stdout
    ) {
        Ok(version) => version,
        Err(e) => e.to_string(),
    }
}

#[get("/health")]
async fn health() -> &'static str {
    "OK"
}

#[get("/")]
async fn who_is_this() -> &'static str {
    "Who are you?"
}

#[launch]
fn rocket() -> _ {
    rocket::build()
        .attach(CORS)
        .mount(
            "/",
            routes![
                compile_to_sierra,
                compile_to_casm,
                save_code,
                cairo_version,
                health, 
                who_is_this, 
            ],
        )
}
