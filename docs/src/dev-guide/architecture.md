# Architecture Overview

The Starknet Remix Plugin is built with a microservices architecture, consisting of two main components:

## High-Level Architecture

```text
┌─────────────────┐      ┌──────────────┐      ┌──────────────┐
│  Remix Plugin   │◄────►│  API Server  │─────►|   Grafana    |
│                 │      │    (Rust)    │      |              |
└─────────────────┘      └──────────────┘      └──────────────┘
        ▲                        ▲
        │ iframe                 │
        │                        ▼
┌─────────────────┐      ┌──────────────┐
│  Remix IDE      │      │Scarb/Foundry │
└─────────────────┘      └──────────────┘
```

## Component Overview

### 1. Frontend (Remix Plugin)

- Built with React and TypeScript
- Implements Remix plugin API
- Handles user interface and interactions
- Manages state using React hooks and atoms
- Communicates with the API server

### 2. API Server (Rust)

- Handles compilation and testing
- Manages Scarb integration
- Provides RESTful endpoints
- Error handling and logging

## Communication Flow

1. **User Interaction**:

   ```text
      User → Remix IDE → Plugin Frontend → API Server
   ```

2. **Compilation Process**:

   ```text
      Frontend → API Server → Scarb → API Server → Frontend
   ```

3. **Transaction Flow**:

   ```text
   Frontend → Wallet → Starknet → Frontend
   ```

## Key Features Implementation

### Compilation

- Frontend sends source code to API
- API server manages Scarb compilation
- Results returned to frontend

### Deployment

- Contract compilation verified
- Transaction created and signed
- Deployment status monitored

## Security Considerations

1. **API Security**:
   - Request validation
   - Rate limiting
   - Error handling

2. **Frontend Security**:
   - Secure wallet connections
   - Transaction signing
   - Data validation

## Future Architecture Considerations

- Scalability improvements
- Additional network support
- Enhanced testing capabilities
- Extended IDE integration
