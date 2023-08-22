use std::path::{Path, PathBuf};

pub const CAIRO_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "upload/temp/");
pub const SIERRA_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "sierra/temp/");
pub const CASM_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "casm/temp/");

pub const CAIRO_DIR: &str  = concat!(env!("CARGO_MANIFEST_DIR"), "/", "cairo/");
pub const TEMP_DIR: &str  = concat!(env!("CARGO_MANIFEST_DIR"), "/", "temp/");

pub fn get_file_ext(file_path:&String) -> String {
    match file_path.split(".").last() {
        Some(ext) => ext.to_string(),
        None => {
            println!("LOG: File extension not found");
           "".to_string()
        }
    }
}

pub fn get_file_path(file_path:&String) -> PathBuf {
    match get_file_ext(file_path).to_string() {
        ext if ext == "sierra" => {
            Path::new(SIERRA_ROOT).join(file_path)
        }
        ext if ext == "casm" => {
            Path::new(CASM_ROOT).join(file_path)
            
        }
        ext if ext == "cairo" => {
            Path::new(CAIRO_ROOT).join(file_path)
        }

        ext if ext == "toml" => {
            Path::new(CAIRO_ROOT).join(file_path)
        }

        _ => {
            Path::new(CAIRO_ROOT).join(file_path)
        }
    }
}