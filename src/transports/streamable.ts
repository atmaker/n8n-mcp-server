/**
 * n8n MCP Server - Streamable HTTP Transport
 * 
 * This file implements an HTTP server with the Streamable HTTP transport for the n8n MCP Server,
 * replacing the deprecated SSE transport with a more robust implementation.
 */

import express from 'express';
import cors from 'cors';
import { randomUUID } from 'crypto';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { authenticateSseRequest } from '../middleware/auth.js';

/**
 * Creates and starts the Streamable HTTP server for MCP protocol
 * @param server The configured MCP server instance
 * @param port The port to listen on (default: 8000)
 * @returns The Express app instance
 */
export async function createStreamableServer(server: Server, port: number = 8000): Promise<express.Express> {
  const app = express();
  
  // Enable CORS for all routes
  app.use(cors({
    origin: '*', // Configure as needed for production
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Authorization'],
  }));
  
  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });

  // Create the Streamable HTTP transport
  const transport = new StreamableHTTPServerTransport({
    // Generate random session IDs for stateful mode
    sessionIdGenerator: () => randomUUID(),
    
    // Security settings
    enableDnsRebindingProtection: false, // Can be enabled in production with proper configuration
    
    // Additional configuration for advanced use cases
    // allowedHosts: ['127.0.0.1', 'localhost'],
    // allowedOrigins: ['https://yourdomain.com']
  });

  // Mount the transport on the Express app with authentication middleware
  app.use('/mcp', authenticateSseRequest, (req, res, next) => {
    transport.handleRequest(req, res).catch(next);
  });

  // Start the server and connect the transport to the MCP server
  app.listen(port, () => {
    console.info(`n8n MCP Server running in Streamable HTTP transport mode:`);
    
    // If using Docker, show the external port mapping
    const containerPort = process.env.CONTAINER_PORT;
    if (containerPort && containerPort !== String(port)) {
        console.info(`  - Container internal HTTP port: ${port}`);
        console.info(`  - n8n MCP Server available at: http://localhost:${containerPort}/mcp`);
    } else {
        console.info(`  - n8n MCP Server available at: http://localhost:${port}/mcp`);
    }
  });

  // Connect the transport to the MCP server
  await server.connect(transport);

  return app;
}
