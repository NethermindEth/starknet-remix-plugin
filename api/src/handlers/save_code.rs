use crate::utils::lib::get_file_path;
use rocket::data::ToByteUnit;
use rocket::tokio::fs;
use rocket::Data;
use std::path::PathBuf;

#[post("/save_code/<remix_file_path..>", data = "<file>")]
pub async fn save_code(file: Data<'_>, remix_file_path: PathBuf) -> String {
    do_save_code(file, remix_file_path).await
}

/// Upload a data file
///
pub async fn do_save_code(file: Data<'_>, remix_file_path: PathBuf) -> String {
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
