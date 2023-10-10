use serde::{Deserialize, Serialize};
use std::path::PathBuf;

#[derive(Debug, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct CompileResponse {
    pub status: String,
    pub message: String,
    pub file_content: String,
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

#[derive(Debug)]
pub enum ApiCommand {
    CairoVersion,
    SierraCompile(PathBuf),
    CasmCompile(PathBuf),
    ScarbCompile(PathBuf),
    #[allow(dead_code)]
    Shutdown,
}

#[derive(Debug)]
pub enum ApiCommandResult {
    CairoVersion(String),
    CasmCompile(CompileResponse),
    SierraCompile(CompileResponse),
    ScarbCompile(ScarbCompileResponse),
    #[allow(dead_code)]
    Shutdown,
}
