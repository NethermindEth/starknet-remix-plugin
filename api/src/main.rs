#[macro_use]
extern crate rocket;
use std::process::Command;
// use std::fs;

use rocket::data::{Data, ToByteUnit};
use std::{thread, time};
// use rocket::fs::TempFile;

mod utils;
use utils::lib::Id;

// Endpoint that receives a file and stores it to the upload folder
#[post("/compile", data = "<file>")]
async fn compile(file: Data<'_>) -> std::io::Result<()> {
    // file.persist_to("upload/").await;
    let file_id = Id::new(16);
    let file_path = file_id.file_path("cairo");
    // Modify to zip.
    file.open(128_i32.kibibytes()).into_file(&file_path).await?;

    // let contents = fs::read_to_string(file_path);
    // println!("contents: {:?}", contents.unwrap());

    let cairo_dir = concat!(env!("CARGO_MANIFEST_DIR"), "/", "cairo/");

    println!("sierra path: {:?}", file_id.sierra_path());

    // Process the file through cairo:  cargo run --bin starknet-compile -- ../../../../id.cairo ../example.json --allowed-libfuncs-list-name experimental_v0.1.0
    let mut compile = Command::new("cargo");

    compile.current_dir(cairo_dir);

    // file_id.get_id();

    let result = compile
        .arg("run")
        .arg("--bin")
        .arg("starknet-compile")
        .arg("--")
        .arg(&file_path)
        .arg(file_id.sierra_path())
        // .arg(format!("../upload/{}.cairo", file_id.get_id()))
        // .arg(format!("./{}.json", file_id.get_id()))
        .arg("--allowed-libfuncs-list-name")
        .arg("experimental_v0.1.0")
        .spawn();

    let wait_time = time::Duration::from_millis(10000);
    thread::sleep(wait_time);

    match result {
        Ok(child) => {
            println!("child: {:?}", child.wait_with_output());
        }
        Err(e) => {
            println!("error: {:?}", e);
        }
    }
    // .expect("failed to execute process");

    Ok(())
}

#[launch]
fn rocket() -> _ {
    rocket::build().mount("/", routes![compile])
}
