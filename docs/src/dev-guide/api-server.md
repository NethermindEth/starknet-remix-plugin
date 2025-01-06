# API Server Documentation

The API server is built in Rust and serves as the backend for the Starknet Remix Plugin. It handles compilation, testing, and various other Cairo-related operations.

## Server Structure

```
api/
├── src/
│   ├── main.rs           # Server entry point
│   ├── errors.rs         # Error handling
│   ├── handlers/         # Request handlers
│   │   ├── mod.rs        # Handler exports
│   │   ├── compile.rs    # Compilation
│   │   ├── multi_test.rs # Testing
│   │   ├── types.rs      # Type definitions
│   │   └── utils.rs      # Utility functions
│   └── ...
└── Cargo.toml
```

## API Endpoints

### Compilation Endpoints

```rust
POST /compile
Content-Type: application/json

{
    "source": "string",     // Cairo source code
    "target": "string",     // Compilation target
    "scarb_version": "string" // Optional Scarb version
}
```

### Testing Endpoints

```rust
POST /test
Content-Type: application/json

{
    "source": "string",     // Test file content
    "dependencies": [       // Optional dependencies
        {
            "name": "string",
            "source": "string"
        }
    ]
}
```

## Error Handling

The API server uses a standardized error handling approach:

```rust
#[derive(Debug, Serialize)]
pub enum ApiError {
    CompilationError(String),
    TestError(String),
    InternalError(String),
    ValidationError(String)
}
```

Error responses follow this format:
```json
{
    "error": {
        "type": "string",
        "message": "string",
        "details": {} // Optional additional information
    }
}
```

## Configuration

The server can be configured using environment variables:

```env
PORT=3000
HOST=127.0.0.1
LOG_LEVEL=info
SCARB_PATH=/usr/local/bin/scarb
```

## Development Setup

1. **Prerequisites**:
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   cargo install scarb
   ```

2. **Running the Server**:
   ```bash
   cd api
   cargo run
   ```

3. **Running Tests**:
   ```bash
   cargo test
   ```

## Request Flow

1. **Request Validation**:
   - Input validation
   - Content type checking
   - Size limits

2. **Processing**:
   - Request parsing
   - Handler delegation
   - Resource management

3. **Response**:
   - Result formatting
   - Error handling
   - Response compression

## Performance Considerations

1. **Caching**:
   - Compilation results
   - Frequently used dependencies
   - Scarb artifacts

2. **Resource Management**:
   - Memory limits
   - Process pooling
   - File cleanup

## Security

1. **Input Validation**:
   - Source code validation
   - Path traversal prevention
   - Size limits

2. **Resource Protection**:
   - Rate limiting
   - Memory limits
   - Process isolation

## Monitoring

The server includes basic monitoring endpoints:

```rust
GET /health
GET /metrics
```

## Deployment

The server can be deployed using Docker:

```dockerfile
FROM rust:1.70
WORKDIR /app
COPY . .
RUN cargo build --release
CMD ["./target/release/api"]
```

## Contributing

When contributing to the API server:

1. Follow Rust best practices
2. Add tests for new features
3. Update documentation
4. Follow error handling patterns
5. Maintain backward compatibility
