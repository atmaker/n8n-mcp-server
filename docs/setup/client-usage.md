# Client Usage Guide

This guide helps you connect client applications to the n8n MCP Server using different transport modes.

## Transport Mode Selection

The n8n MCP Server supports three transport modes:

| Transport Mode | Description | Best For | Endpoint |
|---------------|-------------|----------|----------|
| `stdio` | Standard input/output communication | Direct subprocess integration, local assistants | N/A |
| `sse` | Server-Sent Events over HTTP | Legacy HTTP clients, simplified implementation | `/sse`, `/messages`, `/mcp` |
| `streamable` | Modern HTTP streaming | New integrations, modern clients, robust transport | `/mcp` |

### When to Choose Each Transport

- **stdio**: Use when embedding the server as a subprocess within your application.
- **sse**: Use for legacy compatibility or simpler HTTP clients that support SSE.
- **streamable-http**: Recommended for new integrations with full HTTP streaming support.

## Connection Examples

### stdio Transport

For stdio transport, you'll typically spawn the n8n MCP Server as a child process:

```javascript
const { spawn } = require('child_process');
const serverProcess = spawn('n8n-mcp-server', [], {
  env: {
    ...process.env,
    SERVER_MODE: 'stdio',
    N8N_API_URL: 'http://localhost:5678/api/v1',
    N8N_API_KEY: 'your_n8n_api_key'
  }
});

// Communication with the server
serverProcess.stdout.on('data', (data) => {
  const message = JSON.parse(data.toString());
  // Process the message
});

// Send messages to the server
function sendToServer(message) {
  serverProcess.stdin.write(JSON.stringify(message) + '\n');
}
```

### SSE Transport

For SSE transport, you'll connect to the server over HTTP:

```javascript
// Connect to the SSE stream
const eventSource = new EventSource('http://localhost:3000/sse', {
  headers: {
    'Authorization': 'Bearer your_mcp_api_key'
  }
});

eventSource.onmessage = (event) => {
  const message = JSON.parse(event.data);
  // Process the message
};

// Send messages to the server
async function sendToServer(message) {
  await fetch('http://localhost:3000/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': 'Bearer your_mcp_api_key'
    },
    body: JSON.stringify(message)
  });
}
```

### Streamable HTTP Transport

For Streamable HTTP transport (recommended for new integrations):

```javascript
// Using the MCP TypeScript SDK (recommended)
import { HTTPStreamingClient } from '@modelcontextprotocol/sdk/client';

const client = new HTTPStreamingClient({
  serverUrl: 'http://localhost:3000/mcp',
  headers: {
    'Authorization': 'Bearer your_mcp_api_key'
  }
});

// Connect and handle messages
await client.connect();
client.onMessage((message) => {
  // Process the message
});

// Send messages
await client.sendMessage({ type: 'some-message-type', data: {} });
```

Or using fetch API for streaming:

```javascript
// Create a new streaming request
const response = await fetch('http://localhost:3000/mcp', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': 'Bearer your_mcp_api_key'
  },
  body: JSON.stringify(initialMessage)
});

// Process the streaming response
const reader = response.body.getReader();
while (true) {
  const { done, value } = await reader.read();
  if (done) break;
  
  // Process each chunk of data
  const chunk = new TextDecoder().decode(value);
  // Parse and handle the chunk
}
```

## Authentication

All HTTP-based transports (SSE and Streamable HTTP) require API key authentication:

```
Authorization: Bearer your_mcp_api_key
```

The API key should match the `MCP_API_KEY` environment variable configured in the server.

### Common Authentication Issues

1. **Missing API Key**: Ensure the API key is provided in all requests
2. **Incorrect Format**: The header should be formatted as `Bearer <key>` with a space between
3. **Multiple Bearer Prefixes**: Some clients add 'Bearer' automatically, check if your code is adding it twice
4. **Key Mismatch**: Verify the key matches what's configured in the server's environment

## Endpoint Compatibility

### SSE Transport Endpoints

- `/sse`: GET endpoint for event stream connection
- `/messages`: POST endpoint for sending messages to the server
- `/mcp`: Combined endpoint for compatibility (newer addition)

### Streamable HTTP Transport Endpoints

- `/mcp`: Single unified endpoint for bidirectional communication

If you receive 404 errors, check that you're using the correct endpoint for the transport mode.

## Testing Your Connection

A simple way to test connectivity is to request the list of available tools:

```javascript
// Example message to request server capabilities
const capabilitiesRequest = {
  type: 'get-capabilities'
};

// Send this message to the server using your chosen transport
// The response will contain available tools and resources
```

## Troubleshooting

### Common Issues

1. **Connection Refused**: Check if the server is running and the port is correct
2. **Authentication Errors (401)**: Verify your API key and authentication header
3. **Not Found Errors (404)**: Ensure you're using the correct endpoint for the transport mode
4. **Stream Errors**: For streaming HTTP, check that your client supports proper streaming

For more specific issues, refer to the [Troubleshooting Guide](./troubleshooting.md).
