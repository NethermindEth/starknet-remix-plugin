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
    pub artifacts: Vec<FileContentMap>,
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
        self.files
            .iter()
            .any(|f| f.file_name.ends_with("Scarb.toml"))
    }

    pub fn file_names(&self) -> Vec<String> {
        self.files.iter().map(|f| f.file_name.clone()).collect()
    }
}

#[derive(Debug)]
pub enum ApiCommand {
    ScarbVersion,
    Compile {
        compilation_request: CompilationRequest,
    },
    ScarbTest {
        remix_file_path: PathBuf,
    },
    #[allow(dead_code)]
    Shutdown,
}

#[derive(Debug)]
pub enum ApiCommandResult {
    ScarbVersion(String),
    Compile(ScarbCompileResponse),
    ScarbTest(ScarbTestResponse),
    #[allow(dead_code)]
    Shutdown,
}
