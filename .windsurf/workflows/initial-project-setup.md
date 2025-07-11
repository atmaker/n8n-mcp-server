---
description: Initial Project Setup
---

# Initial Project Setup

Follow these steps to set up the n8n MCP Server development environment.

## Prerequisites

- Node.js 20 or later
- npm 9 or later
- Access to an n8n instance (self-hosted or cloud)
- n8n API key with appropriate permissions

## Setup Steps

1. **Clone the repository**:
   ```bash
   git clone https://github.com/yourusername/n8n-mcp-server.git
   cd n8n-mcp-server
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Set up environment variables**:
   ```bash
   # Copy the example environment file
   cp .env.example .env
   
   # Edit the .env file with your n8n API credentials
   # Required variables:
   # - N8N_API_URL: URL of your n8n instance API (e.g., https://n8n.example.com/api/v1)
   # - N8N_API_KEY: Your n8n API key
   ```

4. **Verify installation**:
   ```bash
   # Build the project
   npm run build
   
   # Run tests to ensure everything is set up correctly
   npm test
   ```

## Project Structure Overview

```
n8n-mcp-server/
├── src/                  # Source code
│   ├── api/              # API client for n8n
│   ├── config/           # Configuration and environment settings
│   ├── errors/           # Error handling
│   ├── resources/        # MCP resources implementation
│   ├── tools/            # MCP tools implementation
│   ├── types/            # TypeScript type definitions
│   └── utils/            # Utility functions
├── tests/                # Test files
│   ├── unit/             # Unit tests
│   ├── integration/      # Integration tests
│   └── e2e/              # End-to-end tests
└── build/                # Compiled output
```

## Getting Started

1. **Start the development server**:
   ```bash
   npm run dev
   ```

2. **Try the server manually**:
   ```bash
   # In a separate terminal
   echo '{"type":"tool_call","tool_name":"list_workflows","arguments":{}}' | node build/index.js
   ```

3. **Explore the documentation**:
   - Review the `docs/` directory for API documentation and developer guides
   - Start with `docs/index.md` for an overview