use serde::{Deserialize, Serialize};
use std::path::PathBuf;

pub trait Successful {
    fn is_successful(&self) -> bool;
}

#[derive(Debug, Deserialize, Serialize)]
#[serde(crate = "rocket::serde")]
pub struct CompileResponse {
    pub status: String,
    pub message: String,
    pub file_content: String,
}

impl Successful for CompileResponse {
    fn is_successful(&self) -> bool {
        self.status == "Success"
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
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

impl Successful for ScarbCompileResponse {
    fn is_successful(&self) -> bool {
        self.status == "Success"
    }
}

#[derive(Debug, Serialize, Deserialize)]
pub struct ScarbTestResponse {
    pub status: String,
    pub message: String,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct CompilationRequest {
    pub files: Vec<FileContentMap>,
}

impl CompilationRequest {
    pub fn has_scarb_toml(&self) -> bool {
        self.files.iter().any(|f| &f.file_name == "Scarb.toml")
    }

    pub fn file_names(&self) -> Vec<String> {
        self.files.iter().map(|f| f.file_name.clone()).collect()
    }
}

#[derive(Debug)]
pub enum ApiCommand {
    CairoVersion,
    Compile {
        compilation_request: CompilationRequest,
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
    Compile(ScarbCompileResponse),
    ScarbCompile(ScarbCompileResponse),
    ScarbTest(ScarbTestResponse),
    #[allow(dead_code)]
    Shutdown,
}
