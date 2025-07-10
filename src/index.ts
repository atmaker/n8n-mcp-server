#!/usr/bin/env node
/**
 * n8n MCP Server - Main Entry Point
 * 
 * This file serves as the entry point for the n8n MCP Server,
 * which allows AI assistants to interact with n8n workflows through the MCP protocol.
 */

import { loadEnvironmentVariables } from './config/environment.js';
import { configureServer } from './config/server.js';
import { createStreamableServer } from './transports/streamable.js';
import { createStdioServer } from './transports/stdio.js';
import { createSseServer } from './transports/sse.js';

// Load environment variables
loadEnvironmentVariables();

// Get server mode from environment or default to stdio
const SERVER_MODE = process.env.SERVER_MODE?.toLowerCase() || 'stdio';
// 'sse' mode now uses the more modern Streamable HTTP transport, which is backward compatible
const SERVER_PORT = parseInt(process.env.SERVER_PORT || '8000', 10);
const CONTAINER_PORT = parseInt(process.env.CONTAINER_PORT || '3000', 10);

/**
 * Main function to start the n8n MCP Server
 */
async function main() {
  try {
    console.info('Starting n8n MCP Server...');

    // Create and configure the MCP server
    const server = await configureServer();

    // Set up error handling
    server.onerror = (error: unknown) => console.error('[MCP Error]', error);

    // Set up clean shutdown
    process.on('SIGINT', async () => {
      console.warn('Shutting down n8n MCP Server...');
      await server.close();
      process.exit(0);
    });

    // Connect to the appropriate transport based on mode
    if (SERVER_MODE === 'streamable') {
      // Start Streamable HTTP server (replaces legacy SSE server)
      await createStreamableServer(server, SERVER_PORT);
    } else if (SERVER_MODE === 'sse') {
      // Start SSE server (legacy mode)
      await createSseServer(server, SERVER_PORT);
    } else {
      // Default to stdio transport
      await createStdioServer(server);
    }
  } catch (error) {
    console.error('Failed to start n8n MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error);
