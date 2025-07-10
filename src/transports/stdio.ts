/**
 * n8n MCP Server - Stdio Transport
 * 
 * This module implements the stdio transport for the n8n MCP Server.
 * It allows AI assistants to interact with n8n workflows through stdio.
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import type { Server } from '@modelcontextprotocol/sdk/server/index.js';

/**
 * Create and connect a stdio transport to the MCP server
 * @param server MCP server instance
 * @returns Connected stdio server transport
 */
export async function createStdioServer(server: Server<any, any, any>): Promise<StdioServerTransport> {
  // Create a new stdio server transport
  const transport = new StdioServerTransport();
  
  // Connect the transport to the MCP server
  await server.connect(transport);
  
  console.info(`n8n MCP Server running in stdio transport mode.`);
  
  return transport;
}
