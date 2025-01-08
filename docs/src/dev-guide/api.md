# API Server Documentation

The Starknet Remix Plugin API server provides a robust backend for Cairo contract compilation and testing. This documentation covers the available endpoints, request/response formats, and usage examples.

All API responses have the similar structure:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": T | null,         // response data or null if error occurred
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

where T - any generic data. All needed response output could be found in the `data` or `message` field.

## Contents

- [Base URL](#base-url)
- [Endpoints](#endpoints)
  - [POST `/compile-async`](#post-compile-async)
  - [GET `/compile-async/<process_id>`](#get-compile-asyncprocess_id)
  - [POST `/test-async`](#post-test-async)
  - [GET `/test-async/<process_id>`](#get-test-asyncprocess_id)
  - [POST `/scarb-version-async`](#post-scarb-version-async)
  - [GET `/scarb-version-async/<process_id>`](#get-scarb-version-asyncprocess_id)
  - [GET `/allowed-versions`](#get-allowed-versions)
  - [GET `/health`](#get-health)
  - [GET `/`](#get-)
  - [GET `/process_status/<process_id>`](#get-process_statusprocess_id)

## Base URL

Production API:

```http
https://cairo-remix-api.nethermind.io
```

Dev API:

```http
https://cairo-remix-api-dev.nethermind.io
```

## Endpoints

### POST `/compile-async`

Used for both single-file and project compilation. For single-file pass only source code.

Request body:

```json
{
   files: [
      {
         file_name: "...",
         file_content: "..."
      },
      {
         file_name: "...",
         file_content: "..."
      },
      ...
   ]
   version: "<cairo_version>"
}
```

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": String | null,    // return process id or null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

### GET `/compile-async/<process_id>`

Used to retrieve the compilation result by process ID.

Response body:

```json
{
"success": boolean,
   "status": string,
   "code": number,
   "message": string,
   "data": [
      {
         "file_name": string,
         "file_content": string
      },
      ...
   ] | null,
   "error": string | null,
   "timestamp": string,
   "request_id": string
}
```

### POST `/test-async

Used for testing the compiled contract using Scarb or Foundry (forge).

Request body:

```json
{
   "test_engine": "scarb" | "forge",
   "files": [
      {
         "file_name": "...",
         "file_content": "..."
      },
      {
         "file_name": "...",
         "file_content": "..."
      },
      ...
   ]
}
```

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": String | null,    // return process id or null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

### GET `/test-async/<process_id>`

Used to retrieve the testing result by process ID.

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // console output, both stdout and stderr
    "data": null,             // null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

### POST `/scarb-version-async`

Used to retrieve the latest Scarb version.

Request body:

```json
{}
```

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": string | null,    // return process id or null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

### GET `/scarb-version-async/<process_id>`

Used to retrieve the Scarb version by process ID.

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": string | null,    // Scarb version or null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

### GET `/allowed-versions`

Used to retrieve the list of allowed Cairo versions (for single-file compilation).

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": string[] | null,  // list of allowed versions or null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```

### GET `/health`

Used to check the API server health status.

Response:

```json
OK
```

### GET `/`

Response:

```json
"Who are you?"
```

### GET `/process_status/<process_id>`

Used to check the status of the process by process ID.

Response body:

```json
{
    "success": boolean,       // true if the request was successful
    "status": string,         // "success" or "error"
    "code": number,           // HTTP status code
    "message": string,        // human-readable message
    "data": "New", "Running", "Completed", "Error" | null,    // process status or null
    "error": string | null,   // error message or null
    "timestamp": string,      // timestamp of the response
    "request_id": string      // unique request ID
}
```
