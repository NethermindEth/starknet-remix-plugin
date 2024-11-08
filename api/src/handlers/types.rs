use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub trait Successable {
    fn is_successful(&self) -> bool;
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct CompileResponse {
    pub status: String,
    pub message: String,
    pub file_content: String,
    pub cairo_version: String,
}

impl Successable for CompileResponse {
    fn is_successful(&self) -> bool {
        self.message == "Success"
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct FileContentMap {
    pub file_name: String,
    pub file_content: String,
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScarbCompileResponse {
    pub status: String,
    pub message: String,
    pub file_content_map_array: Vec<FileContentMap>,
}

impl Successable for ScarbCompileResponse {
    fn is_successful(&self) -> bool {
        self.message == "Success"
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScarbTestResponse {
    pub status: String,
    pub message: String,
}

#[derive(Debug)]
pub enum ApiCommand {
    CairoVersion,
    SierraCompile {
        remix_file_path: PathBuf,
        version: String,
    },
    CasmCompile {
        remix_file_path: PathBuf,
        version: String,
    },
    ScarbCompile {
        remix_file_path: PathBuf,
    },
    ScarbTest {
        remix_file_path: PathBuf,
    },
    #[allow(dead_code)]
    Shutdown,
}

#[derive(Debug)]
pub enum ApiCommandResult {
    CairoVersion(String),
    CasmCompile(CompileResponse),
    SierraCompile(CompileResponse),
    ScarbCompile(ScarbCompileResponse),
    ScarbTest(ScarbTestResponse),
    #[allow(dead_code)]
    Shutdown,
}
