use std::io;

#[derive(Debug, thiserror::Error)]
pub enum ApiError {
    #[error(transparent)]
    System(SystemError),
    #[error(transparent)]
    Cmd(CmdError),
    #[error(transparent)]
    File(FileError),
    #[error(transparent)]
    Execution(ExecutionError),
    #[error(transparent)]
    Network(NetworkError),
}

#[derive(Debug, thiserror::Error)]
pub enum SystemError {
    #[error("Task queue is full")]
    QueueIsFull,
    #[error("Rate limiter is not in the Rocket state")]
    RateLimiterNotInState,
    #[error("Error while trying to unlock mutex")]
    MutexUnlockError,
    #[error("Failed to parse file path")]
    FailedToParseFilePath(String),
}

impl From<SystemError> for ApiError {
    fn from(error: SystemError) -> Self {
        ApiError::System(error)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum CmdError {
    #[error("Failed to execute command: {0}")]
    FailedToExecuteCommand(io::Error),
    #[error("Failed to read output: {0}")]
    FailedToReadOutput(io::Error),
}

impl From<CmdError> for ApiError {
    fn from(error: CmdError) -> Self {
        ApiError::Cmd(error)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum FileError {
    #[error("Failed to read dir: {0}")]
    FailedToReadDir(io::Error),
    #[error("Failed to read file: {0}")]
    FailedToReadFile(io::Error),
    #[error("Failed to save file: {0}")]
    FailedToSaveFile(io::Error),
    #[error("Failed to read filename")]
    FailedToReadFilename,
    #[error("Failed to write file: {0}")]
    FailedToWriteFile(io::Error),
    #[error("Failed to initialize directories: {0}")]
    FailedToInitializeDirectories(io::Error),
    #[error("UTF8 error: {0}")]
    UTF8Error(#[from] std::string::FromUtf8Error),
}

impl From<FileError> for ApiError {
    fn from(error: FileError) -> Self {
        ApiError::File(error)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum ExecutionError {
    #[error("Failed to get Cairo version: {0}")]
    CairoVersionNotFound(String),
    #[error("Failed to get Scarb version: {0}")]
    ScarbVersionNotFound(String),
    #[error("Compilation timed out")]
    CompilationTimeout,
    #[error("File extension <{0}> not supported")]
    FileExtensionNotSupported(String),
    #[error("Invalid request")]
    InvalidRequest,
    #[error("Version not allowed")]
    VersionNotAllowed,
    #[error("Not found")]
    NotFound(String),
}

impl From<ExecutionError> for ApiError {
    fn from(error: ExecutionError) -> Self {
        ApiError::Execution(error)
    }
}

#[derive(Debug, thiserror::Error)]
pub enum NetworkError {
    #[error("Failed to fetch releases")]
    FailedToFetchReleases(reqwest::Error),
    #[error("Failed to parse releases")]
    FailedToParseReleases(reqwest::Error),
    #[error("Failed to fetch client IP from the request")]
    FailedToGetClientIp,
    #[error("Too many requests")]
    TooManyRequests,
    #[error("Failed to verify contract: {0}")]
    VerificationFailed(String),
    #[error("Failed to get verification status: {0}")]
    VerificationStatusFailed(String),
}

impl From<NetworkError> for ApiError {
    fn from(error: NetworkError) -> Self {
        ApiError::Network(error)
    }
}

pub type Result<T, E = ApiError> = std::result::Result<T, E>;
