use rocket::http::{ContentType, Status};
use serde::{Deserialize, Serialize};

use crate::errors::{ApiError, ExecutionError};

pub trait Successful {
    fn is_successful(&self) -> bool;
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ApiResponse<T> {
    pub success: bool,
    pub status: String,
    pub code: u16,
    pub message: String,
    pub data: Option<T>,
    pub error: Option<String>,
    pub timestamp: String,
    pub request_id: String,
}

impl<'r, T: serde::Serialize> rocket::response::Responder<'r, 'static> for ApiResponse<T> {
    fn respond_to(self, _: &'r rocket::Request<'_>) -> rocket::response::Result<'static> {
        let json = rocket::serde::json::to_string(&self).unwrap();

        rocket::Response::build()
            .sized_body(json.len(), std::io::Cursor::new(json))
            .header(ContentType::JSON)
            .status(Status::from_code(self.code).unwrap_or(Status::InternalServerError))
            .ok()
    }
}

impl<T> Default for ApiResponse<T> {
    fn default() -> Self {
        Self {
            success: false,
            status: "".to_string(),
            code: 0,
            message: "".to_string(),
            data: None,
            error: None,
            timestamp: chrono::Utc::now().to_rfc3339(),
            request_id: "".to_string(),
        }
    }
}

impl<T> ApiResponse<T> {
    pub fn internal_server_error(error: String) -> Self {
        Self {
            status: "InternalServerError".to_string(),
            code: 500,
            error: Some(error),
            ..Default::default()
        }
    }

    pub fn not_found(error: String) -> Self {
        Self {
            status: "NotFound".to_string(),
            code: 404,
            error: Some(error),
            ..Default::default()
        }
    }

    pub fn bad_request(error: String) -> Self {
        Self {
            status: "BadRequest".to_string(),
            code: 400,
            error: Some(error),
            ..Default::default()
        }
    }

    pub fn ok(data: T) -> Self {
        Self {
            success: true,
            status: "Ok".to_string(),
            code: 200,
            data: Some(data),
            ..Default::default()
        }
    }

    pub fn not_available(message: String) -> Self {
        Self {
            status: "NotAvailable".to_string(),
            code: 404,
            message,
            ..Default::default()
        }
    }

    pub fn with_message(mut self, message: String) -> Self {
        self.message = message;
        self
    }

    pub fn with_data(mut self, data: T) -> Self {
        self.data = Some(data);
        self
    }

    pub fn with_error(mut self, error: String) -> Self {
        self.error = Some(error);
        self
    }

    pub fn with_timestamp(mut self, timestamp: String) -> Self {
        self.timestamp = timestamp;
        self
    }

    pub fn with_request_id(mut self, request_id: String) -> Self {
        self.request_id = request_id;
        self
    }

    pub fn with_status(mut self, status: String) -> Self {
        self.status = status;
        self
    }

    pub fn with_code(mut self, code: u16) -> Self {
        self.code = code;
        self
    }

    pub fn with_success(mut self, success: bool) -> Self {
        self.success = success;
        self
    }

    pub fn not_allowed(error: String) -> Self {
        Self {
            status: "NotAllowed".to_string(),
            code: 403,
            error: Some(error),
            ..Default::default()
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct FileContentMap {
    pub file_name: String,
    pub file_content: String,
}

pub type CompileResponse = ApiResponse<Vec<FileContentMap>>;

pub type TestResponse = ApiResponse<()>;

pub type VersionResponse = ApiResponse<String>;

impl<T> Successful for ApiResponse<T> {
    fn is_successful(&self) -> bool {
        self.success
    }
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct BaseRequest {
    pub files: Vec<FileContentMap>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct CompilationRequest {
    #[serde(flatten)]
    pub base_request: BaseRequest,
    pub version: Option<String>,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct TestRequest {
    #[serde(flatten)]
    pub base_request: BaseRequest,
    pub test_engine: TestEngine,
}

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub struct VerifyRequest {
    #[serde(flatten)]
    pub base_request: BaseRequest,
    pub contract_name: String,
    pub contract_address: String,
    pub network: String,
}

pub type VerifyResponse = ApiResponse<()>;

#[derive(serde::Serialize, serde::Deserialize, Clone, Debug)]
#[serde(crate = "rocket::serde")]
pub enum TestEngine {
    #[serde(alias = "scarb")]
    Scarb,
    #[serde(alias = "forge")]
    Forge,
}

impl TestEngine {
    pub fn as_str(&self) -> &str {
        match self {
            TestEngine::Scarb => "scarb",
            TestEngine::Forge => "snforge",
        }
    }
}

impl CompilationRequest {
    pub fn has_scarb_toml(&self) -> bool {
        self.base_request
            .files
            .iter()
            .any(|f| f.file_name.ends_with("Scarb.toml"))
    }

    pub fn file_names(&self) -> Vec<String> {
        self.base_request
            .files
            .iter()
            .map(|f| f.file_name.clone())
            .collect()
    }
}

#[derive(Debug)]
pub enum ApiCommand {
    ScarbVersion,
    Compile {
        compilation_request: CompilationRequest,
    },
    ScarbTest {
        test_request: TestRequest,
    },
    Verify {
        verify_request: VerifyRequest,
    },
    #[allow(dead_code)]
    Shutdown,
}

#[derive(Debug)]
pub struct ShutdownGetter;

#[derive(Debug)]
pub struct VersionResponseGetter(pub VersionResponse);

#[derive(Debug)]
pub struct CompileResponseGetter(pub CompileResponse);

#[derive(Debug)]
pub struct TestResponseGetter(pub TestResponse);

#[derive(Debug)]
pub struct VerifyResponseGetter(pub VerifyResponse);

#[derive(Debug, Clone)]
pub enum ApiCommandResult {
    ScarbVersion(VersionResponse),
    Compile(CompileResponse),
    Test(TestResponse),
    Verify(VerifyResponse),
    #[allow(dead_code)]
    Shutdown,
}

impl TryFrom<ApiCommandResult> for VersionResponseGetter {
    type Error = ApiError;

    fn try_from(value: ApiCommandResult) -> Result<Self, Self::Error> {
        if let ApiCommandResult::ScarbVersion(response) = value {
            Ok(VersionResponseGetter(response))
        } else {
            Err(ExecutionError::InvalidRequest.into())
        }
    }
}

impl TryFrom<ApiCommandResult> for CompileResponseGetter {
    type Error = ApiError;

    fn try_from(value: ApiCommandResult) -> Result<Self, Self::Error> {
        if let ApiCommandResult::Compile(response) = value {
            Ok(CompileResponseGetter(response))
        } else {
            Err(ExecutionError::InvalidRequest.into())
        }
    }
}

impl TryFrom<ApiCommandResult> for TestResponseGetter {
    type Error = ApiError;

    fn try_from(value: ApiCommandResult) -> Result<Self, Self::Error> {
        if let ApiCommandResult::Test(response) = value {
            Ok(TestResponseGetter(response))
        } else {
            Err(ExecutionError::InvalidRequest.into())
        }
    }
}

impl TryFrom<ApiCommandResult> for VerifyResponseGetter {
    type Error = ApiError;

    fn try_from(value: ApiCommandResult) -> Result<Self, Self::Error> {
        if let ApiCommandResult::Verify(response) = value {
            Ok(VerifyResponseGetter(response))
        } else {
            Err(ExecutionError::InvalidRequest.into())
        }
    }
}

impl TryFrom<ApiCommandResult> for ShutdownGetter {
    type Error = ApiError;

    fn try_from(value: ApiCommandResult) -> Result<Self, Self::Error> {
        if let ApiCommandResult::Shutdown = value {
            Ok(ShutdownGetter)
        } else {
            Err(ExecutionError::InvalidRequest.into())
        }
    }
}

pub trait IntoTypedResponse<T> {
    fn into_typed(self) -> ApiResponse<T>;
}

impl<T> IntoTypedResponse<T> for ApiResponse<()> {
    fn into_typed(self) -> ApiResponse<T> {
        ApiResponse {
            data: None,
            success: self.success,
            status: self.status,
            code: self.code,
            message: self.message,
            error: self.error,
            timestamp: self.timestamp,
            request_id: self.request_id,
        }
    }
}
