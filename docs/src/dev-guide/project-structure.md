# Project Structure

The Starknet Remix Plugin follows a modular architecture designed for maintainability and scalability. This document outlines the organization of the codebase and the purpose of each major component.

## Root Directory Structure

```
starknet-remix-plugin/
├── plugin/               # Frontend React application
├── api/                  # Rust-based API server
├── docs/                 # Documentation
```

## Frontend Application (plugin/)

The frontend application is built with React and TypeScript, organized into feature-based modules:

```
plugin/
├── src/
│   ├── atoms/          # State management with Jotai
│   ├── components/     # Reusable UI components
│   ├── features/       # Feature-specific modules
│   ├── hooks/          # Custom React hooks
│   ├── types/          # TypeScript type definitions
│   └── utils/          # Utility functions and helpers
├── public/             # Static assets
└── package.json        # Dependencies and scripts
```

### Key Frontend Components

The `components` directory contains modular UI elements organized by functionality. Each component follows a consistent structure:

```
components/
├── AddContractArtifacts/    # Contract artifact management and import
├── AddDeployedContract/     # Interface for adding existing deployed contracts
├── BackgroundNotices/       # Background task notifications and alerts
├── Card/                    # Reusable card component for consistent UI
├── CompiledContracts/       # Display and management of compiled contracts
├── CurrentEnv/              # Current environment display and status
├── DevnetAccountSelector/   # Account selection for devnet environments
├── DevnetStatus/           # Devnet connection status and monitoring
├── EnvCard/                # Environment information display card
├── EnvironmentSelector/    # Network environment switching interface
├── ExplorerSelector/       # Block explorer selection and configuration
├── LoadingDots/           # Loading state animation component
├── ManualAccount/         # Manual account creation and management
├── NM/                    # Nethermind icons component
├── Settings/              # Plugin settings and configuration panel
├── StateAction/           # State management action components
├── TransactionCard/       # Transaction details and status display
├── Wallet/               # Wallet connection and management
├── starknet/             # Starknet-specific components
│   ├── connect/          # Wallet connection dialogs
│   └── disconnect/       # Wallet disconnection handling
└── ui_components/        # Shared UI building blocks
    ├── Accordian/        # Collapsible content sections
    ├── CircularLoader/   # Loading spinner animation
    ├── Container/        # Layout container component
    ├── Dropdown/         # Dropdown menu component
    ├── FullScreenOverlay/# Full-screen modal overlay
    ├── Select/           # Enhanced select input component
    └── Tooltip/          # Contextual help tooltips
```

Each component is built as a self-contained module with its own styles, tests, and types.

The `ui_components` directory contains base-level UI elements that are shared across the application, ensuring consistent styling and behavior throughout the interface.

### Feature Modules

```
features/
├── Compilation         # Contract compilation
├── Deployment          # Contract deployment
├── Environment         # Network environment management
├── Footer              # Application footer
├── Interaction         # Contract interaction
├── Plugin              # Plugin settings and configuration
└── TransactionHistory  # Transaction history and management
```

## API Server (api/)

The API server is implemented in Rust, providing robust compilation and testing services for Cairo contracts. The server follows a clean architecture pattern with clear separation of concerns:

```
api/src
├── cors.rs                     # Cross-origin resource sharing configuration
├── errors.rs                   # Error handling and response generation
├── handlers                    # Request handlers for different endpoints
│   ├── allowed_versions.rs     # Supported Cairo versions for single-file compilation
│   ├── compile.rs              # Contract compilation
│   ├── mod.rs                  # Handler module definitions
│   ├── multi_test.rs           # Multi-file test execution
│   ├── process.rs              # `/get-process-status/<pid>` endpoint
│   ├── scarb_version.rs        # Scarb version retrieval
│   ├── types.rs                # Request and response types
│   └── utils.rs                # Utility functions
├── main.rs                     # Server initialization and routing
├── metrics.rs                  # Prometheus metrics
├── rate_limiter.rs             # Request rate limiting fairing
├── tracing_log.rs              # Tracing and logging configuration
├── utils                       # Shared utility functions
│   ├── lib.rs                  # Utility module definitions
│   └── mod.rs                  # Utility module exports
└── worker.rs                   # Worker thread pool for async processing
```

## Documentation (docs/)

Documentation is organized into user and developer guides. We use `mdbook` to generate the documentation site from Markdown files.

To generate the documentation locally, run:

```bash
mdbook serve docs
```

The documentation site will be available at `http://localhost:3000`.