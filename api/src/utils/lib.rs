use std::path::{Path, PathBuf};

pub const CAIRO_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "upload/temp/");
pub const SIERRA_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "sierra/temp/");
pub const CASM_ROOT: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "casm/temp/");

pub const DEFAULT_CAIRO_DIR: &str = concat!(
    env!("CARGO_MANIFEST_DIR"),
    "/",
    "cairo_compilers/",
    "v2.5.4"
);
pub const CAIRO_COMPILERS_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "cairo_compilers/");
#[allow(dead_code)]
pub const TEMP_DIR: &str = concat!(env!("CARGO_MANIFEST_DIR"), "/", "temp/");

pub const DEFAULT_CAIRO_VERSION: &str = "v2.5.4";

pub const DURATION_TO_PURGE: u64 = 60 * 5; // 5 minutes

pub fn get_file_ext(file_path: &str) -> String {
    match file_path.split('.').last() {
        Some(ext) => ext.to_string(),
        None => {
            debug!("LOG: File extension not found");
            "".to_string()
        }
    }
}

pub fn get_file_path(file_path: &String) -> PathBuf {
    match get_file_ext(file_path).to_string() {
        ext if ext == "sierra" => Path::new(SIERRA_ROOT).join(file_path),
        ext if ext == "casm" => Path::new(CASM_ROOT).join(file_path),
        ext if ext == "cairo" => Path::new(CAIRO_ROOT).join(file_path),

        ext if ext == "toml" => Path::new(CAIRO_ROOT).join(file_path),

        _ => Path::new(CAIRO_ROOT).join(file_path),
    }
}

pub fn timestamp() -> u64 {
    chrono::Utc::now().timestamp() as u64
}
