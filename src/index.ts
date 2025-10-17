#!/usr/bin/env node
/**
 * n8n MCP Server - Main Entry Point
 * 
 * This file serves as the entry point for the n8n MCP Server,
 * which allows AI assistants to interact with n8n workflows through the MCP protocol.
 */

import { createServer } from 'node:http';
import { randomUUID } from 'node:crypto';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js';
import { SSEServerTransport } from '@modelcontextprotocol/sdk/server/sse.js';
import { isInitializeRequest } from '@modelcontextprotocol/sdk/types.js';
import { loadEnvironmentVariables } from './config/environment.js';
import { configureServer } from './config/server.js';

// Load environment variables
loadEnvironmentVariables();

/**
 * Main function to start the n8n MCP Server
 */
async function main() {
  try {
    console.error('Starting n8n MCP Server...');

    const mode = (process.env.SERVER_MODE ?? 'stdio').toLowerCase();

    if (mode === 'stdio') {
      // STDIO mode (default)
      const server = await configureServer();
      server.onerror = (error: unknown) => console.error('[MCP Error]', error);

      process.on('SIGINT', async () => {
        console.error('Shutting down n8n MCP Server...');
        await server.close();
        process.exit(0);
      });

      const transport = new StdioServerTransport();
      await server.connect(transport);
      console.error('n8n MCP Server running on stdio');
      return;
    }

    // HTTP modes: streamable (recommended) or sse (deprecated)
    const port = parseInt(process.env.SERVER_PORT ?? '8000', 10);
    const apiKey = process.env.MCP_API_KEY;

    // Track active transports per session
    const streamTransports = new Map<string, StreamableHTTPServerTransport>();
    const sseTransports = new Map<string, SSEServerTransport>();

    const isAuthorized = (req: any): boolean => {
      if (!apiKey) return true; // No auth required if not set
      const auth = req.headers?.authorization as string | undefined;
      const xKey = (req.headers?.['x-api-key'] as string | undefined)
        ?? (req.headers?.['x-api_key'] as string | undefined);
      if (auth && auth.startsWith('Bearer ')) {
        return auth.slice('Bearer '.length) === apiKey;
      }
      if (xKey) return xKey === apiKey;
      return false;
    };

    const unauthorized = (res: any) => {
      res.statusCode = 401;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Unauthorized' }));
    };

    const badRequest = (res: any, message: string) => {
      res.statusCode = 400;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: message }));
    };

    const notFound = (res: any) => {
      res.statusCode = 404;
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'Not Found' }));
    };

    const readJsonBody = (req: any): Promise<any> => new Promise((resolve, reject) => {
      let data = '';
      req.setEncoding('utf8');
      req.on('data', (chunk: string) => { data += chunk; });
      req.on('end', () => {
        try {
          const parsed = data ? JSON.parse(data) : undefined;
          resolve(parsed);
        } catch (err) {
          reject(err);
        }
      });
      req.on('error', reject);
    });

    const getHeaderSessionId = (req: any): string | undefined => {
      const h = req.headers?.['mcp-session-id'] as string | string[] | undefined;
      if (!h) return undefined;
      return Array.isArray(h) ? h[0] : h;
    };

    const handleStreamable = async (req: any, res: any, body?: any) => {
      const sid = getHeaderSessionId(req);
      let transport = sid ? streamTransports.get(sid) : undefined;

      // If no existing transport, only allow POST initialization to create one
      if (!transport) {
        const isInit = req.method === 'POST' && body && (
          (Array.isArray(body) && body.length === 1 && isInitializeRequest(body[0])) ||
          (!Array.isArray(body) && isInitializeRequest(body))
        );
        if (!isInit) {
          res.statusCode = 400;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({
            jsonrpc: '2.0',
            error: { code: -32000, message: 'Bad Request: No valid session ID provided' },
            id: null,
          }));
          return;
        }

        // Create a new transport and server for this session
        transport = new StreamableHTTPServerTransport({
          sessionIdGenerator: () => randomUUID(),
          onsessioninitialized: (sessionId: string) => {
            streamTransports.set(sessionId, transport!);
          },
        });

        const mcpServer = await configureServer();
        mcpServer.onerror = (error: unknown) => console.error('[MCP Error]', error);
        transport.onclose = async () => {
          const sessionId = transport?.sessionId;
          if (sessionId) streamTransports.delete(sessionId);
          try { await mcpServer.close(); } catch { /* noop */ }
        };
        await mcpServer.connect(transport);
      }

      await transport.handleRequest(req, res, body);
    };

    const handleSseGet = async (_req: any, res: any) => {
      const transport = new SSEServerTransport('/messages', res);
      const mcpServer = await configureServer();
      mcpServer.onerror = (error: unknown) => console.error('[MCP Error]', error);
      transport.onclose = async () => {
        sseTransports.delete(transport.sessionId);
        try { await mcpServer.close(); } catch { /* noop */ }
      };
      sseTransports.set(transport.sessionId, transport);
      await mcpServer.connect(transport);
      // SSE transport will take over the response stream
    };

    const handleSsePost = async (req: any, res: any, urlObj: URL, body: any) => {
      const sessionId = urlObj.searchParams.get('sessionId') ?? undefined;
      if (!sessionId) return badRequest(res, 'Missing sessionId');
      const transport = sseTransports.get(sessionId);
      if (!transport) return badRequest(res, 'No transport found for sessionId');
      await transport.handlePostMessage(req, res, body);
    };

    const httpServer = createServer(async (req, res) => {
      try {
        const urlObj = new URL(req.url ?? '/', 'http://localhost');

        // Enforce API key if set
        if (!isAuthorized(req)) return unauthorized(res);

        if (mode === 'streamable' && urlObj.pathname === '/mcp' && ['GET', 'POST', 'DELETE'].includes((req.method ?? '').toUpperCase())) {
          let body: any | undefined = undefined;
          if (req.method === 'POST') {
            try { body = await readJsonBody(req); } catch { return badRequest(res, 'Invalid JSON'); }
          }
          return handleStreamable(req, res, body);
        }

        if (mode === 'sse') {
          if (urlObj.pathname === '/sse' && (req.method ?? '').toUpperCase() === 'GET') {
            return handleSseGet(req, res);
          }
          if (urlObj.pathname === '/messages' && (req.method ?? '').toUpperCase() === 'POST') {
            let body: any | undefined = undefined;
            try { body = await readJsonBody(req); } catch { return badRequest(res, 'Invalid JSON'); }
            return handleSsePost(req, res, urlObj, body);
          }
        }

        return notFound(res);
      } catch (err) {
        console.error('HTTP handler error:', err);
        if (!res.headersSent) {
          res.statusCode = 500;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Internal Server Error' }));
        }
      }
    });

    httpServer.listen(port, () => {
      console.error(`n8n MCP Server (mode=${mode}) listening on http://localhost:${port}`);
      if (mode === 'streamable') {
        console.error('Endpoints: GET/POST/DELETE /mcp');
      } else {
        console.error('Endpoints: GET /sse, POST /messages?sessionId=...');
      }
    });

    process.on('SIGINT', async () => {
      console.error('Shutting down n8n MCP Server...');
      httpServer.close();
      try {
        await Promise.all([
          ...Array.from(streamTransports.values()).map(t => t.close()),
          ...Array.from(sseTransports.values()).map(t => t.close()),
        ]);
      } catch { /* noop */ }
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start n8n MCP Server:', error);
    process.exit(1);
  }
}

// Start the server
main().catch(console.error);
