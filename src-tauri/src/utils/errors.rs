use serde::Serialize;
use thiserror::Error;

/// Error codes that can be handled by the frontend
#[derive(Debug, Clone, Copy, Serialize, PartialEq, Eq)]
#[serde(rename_all = "SCREAMING_SNAKE_CASE")]
pub enum ErrorCode {
    /// Database operation failed
    DatabaseError,
    /// File system operation failed
    IoError,
    /// Requested resource was not found
    NotFound,
    /// Input validation failed
    ValidationError,
    /// JSON serialization/deserialization failed
    SerializationError,
    /// License validation failed
    LicenseError,
    /// Feature not available in current license tier
    FeatureNotAvailable,
    /// File format is not supported
    UnsupportedFormat,
    /// Operation was cancelled
    Cancelled,
    /// Unknown or unexpected error
    InternalError,
}

/// Structured error type that serializes to JSON for frontend consumption
#[derive(Debug, Serialize)]
pub struct AppErrorResponse {
    /// Machine-readable error code
    pub code: ErrorCode,
    /// Human-readable error message
    pub message: String,
    /// Optional additional details (e.g., field name for validation errors)
    #[serde(skip_serializing_if = "Option::is_none")]
    pub details: Option<String>,
}

impl AppErrorResponse {
    pub fn new(code: ErrorCode, message: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: None,
        }
    }

    pub fn with_details(code: ErrorCode, message: impl Into<String>, details: impl Into<String>) -> Self {
        Self {
            code,
            message: message.into(),
            details: Some(details.into()),
        }
    }
}

/// Internal error type with thiserror for ergonomic error handling
#[derive(Error, Debug)]
pub enum AppError {
    #[error("Database error: {0}")]
    Database(#[from] rusqlite::Error),

    #[error("IO error: {0}")]
    Io(#[from] std::io::Error),

    #[error("Not found: {0}")]
    NotFound(String),

    #[error("Invalid input: {0}")]
    ValidationError(String),

    #[error("Serialization error: {0}")]
    Serialization(#[from] serde_json::Error),

    #[error("License error: {0}")]
    License(String),

    #[error("Feature not available: {0}")]
    FeatureNotAvailable(String),

    #[error("Unsupported format: {0}")]
    UnsupportedFormat(String),

    #[error("Internal error: {0}")]
    Internal(String),
}

impl AppError {
    /// Convert to error code for frontend
    pub fn code(&self) -> ErrorCode {
        match self {
            AppError::Database(_) => ErrorCode::DatabaseError,
            AppError::Io(_) => ErrorCode::IoError,
            AppError::NotFound(_) => ErrorCode::NotFound,
            AppError::ValidationError(_) => ErrorCode::ValidationError,
            AppError::Serialization(_) => ErrorCode::SerializationError,
            AppError::License(_) => ErrorCode::LicenseError,
            AppError::FeatureNotAvailable(_) => ErrorCode::FeatureNotAvailable,
            AppError::UnsupportedFormat(_) => ErrorCode::UnsupportedFormat,
            AppError::Internal(_) => ErrorCode::InternalError,
        }
    }

    /// Convert to structured response
    pub fn to_response(&self) -> AppErrorResponse {
        AppErrorResponse::new(self.code(), self.to_string())
    }
}

/// Convert AppError to serialized JSON string for Tauri commands
/// This allows commands to return Result<T, String> while still having structured errors
impl From<AppError> for String {
    fn from(err: AppError) -> Self {
        serde_json::to_string(&err.to_response()).unwrap_or_else(|_| {
            format!(r#"{{"code":"INTERNAL_ERROR","message":"{}"}}"#, err)
        })
    }
}

