/**
 * n8n MCP Server - SSE Transport
 * 
 * This file implements an HTTP server with Server-Sent Events (SSE) for the n8n MCP Server,
 * allowing AI assistants to connect via HTTP+SSE instead of stdio.
 */

import express from 'express';
import cors from 'cors';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { authenticateSseRequest } from '../middleware/auth.js';

// Map to store SSE transports by session ID
const transports: { [sessionId: string]: SSEServerTransport } = {};

/**
 * Creates and starts the HTTP+SSE server for MCP protocol
 * @param server The configured MCP server instance
 * @param port The port to listen on (default: 8000)
 * @returns The Express app and server instance
 */
export async function createSseServer(server: Server, port: number = 8000): Promise<express.Express> {
  const app = express();
  
  // Enable CORS for all routes
  app.use(cors({
    origin: '*', // Configure as needed for production
    exposedHeaders: ['Mcp-Session-Id'],
    allowedHeaders: ['Content-Type', 'Mcp-Session-Id', 'Authorization'],
  }));
  
  // Apply JSON parsing to all routes EXCEPT /messages which needs raw body
  app.use((req, res, next) => {
    if (req.path !== '/messages') {
      express.json()(req, res, next);
    } else {
      next();
    }
  });
  
  // Simple health check endpoint
  app.get('/health', (req, res) => {
    res.status(200).send('OK');
  });
  
  // SSE endpoints for server-to-client events (support both /sse and /mcp for compatibility)
  app.get(['/sse', '/mcp'], authenticateSseRequest, async (req, res) => {
    console.log(`SSE connection established on ${req.path}`);
    
    // Create new SSE transport
    const sseEndpoint = '/messages';
    const transport = new SSEServerTransport(sseEndpoint, res);
    
    // Store transport by session ID
    transports[transport.sessionId] = transport;
    
    // Remove transport when connection closes
    res.on('close', () => {
      console.log(`SSE connection closed for session ${transport.sessionId}`);
      delete transports[transport.sessionId];
    });
    
    // Connect to the MCP server
    await server.connect(transport);
    
    // The SSE connection stays open
  });
  
  // Message endpoint for client-to-server communication
  app.post('/messages', authenticateSseRequest, async (req, res) => {
    const sessionId = req.query.sessionId as string;
    
    if (!sessionId || !transports[sessionId]) {
      return res.status(400).json({
        jsonrpc: '2.0',
        error: {
          code: -32000,
          message: 'Invalid or missing session ID',
        },
        id: null,
      });
    }
    
    try {
      const transport = transports[sessionId];
      // Pass the request to handlePostMessage without consuming the stream
      await transport.handlePostMessage(req, res);
    } catch (error) {
      console.error('Error handling POST message:', error);
      if (!res.headersSent) {
        return res.status(500).json({
          jsonrpc: '2.0',
          error: {
            code: -32000,
            message: 'Error handling message',
          },
          id: null,
        });
      }
    }
  });
  
  // Start the server
  app.listen(port, () => {
    console.info(`n8n MCP Server running in SSE transport mode:`);
    console.info(`  - Container internal HTTP port: ${port}`);
    const containerPort = process.env.CONTAINER_PORT;
    console.info(`  - n8n MCP Server available at: http://localhost:${containerPort || port}/sse and http://localhost:${containerPort || port}/mcp`);
  });
  
  return app;
}
