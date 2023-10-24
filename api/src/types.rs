use std::io::Error as IoError;

pub type Result<T> = std::result::Result<T, ApiError>;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error("Failed to execute command: {0}")]
    FailedToExecuteCommand(IoError),
    #[error("Failed to read output: {0}")]
    FailedToReadOutput(IoError),
    #[error("UTF8 error: {0}")]
    UTF8Error(#[from] std::string::FromUtf8Error),
    #[error("Failed to read dir: {0}")]
    FailedToReadDir(IoError),
    #[error("Failed to read file: {0}")]
    FailedToReadFile(IoError),
    #[error("Failed to parse string")]
    FailedToParseString,
    #[error("File extension <{0}> not supported")]
    FileExtensionNotSupported(String),
    #[error("Cairo version {0} not found")]
    CairoVersionNotFound(String),
    #[error("Failed to save file: {0}")]
    FailedToSaveFile(IoError),
    #[error("Failed to read filename")]
    FailedToReadFilename,
}
