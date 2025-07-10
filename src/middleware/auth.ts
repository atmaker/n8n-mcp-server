/**
 * Authentication middleware
 * 
 * This module provides middleware functions for authenticating requests
 * to various endpoints in the MCP server.
 */

import { Request, Response, NextFunction } from 'express';
import { getEnvConfig } from '../config/environment.js';

/**
 * Middleware to authenticate SSE endpoints using API key
 * 
 * Checks for the API key in the Authorization header (Bearer token)
 * or as an api_key query parameter
 * 
 * @param req Express request object
 * @param res Express response object
 * @param next Express next function
 */
export function authenticateSseRequest(req: Request, res: Response, next: NextFunction): void {
  const { mcpApiKey } = getEnvConfig();

  // If no API key is configured, skip authentication
  if (!mcpApiKey) {
    console.warn('MCP API key not configured; authentication is disabled');
    return next();
  }

  // Get the API key from the Authorization header or query parameter
  const authHeader = req.headers.authorization;
  
  // Extract token from Authorization header, handling any number of 'Bearer ' prefixes
  let bearerToken: string | null = null;
  if (authHeader) {
    // Strip all occurrences of 'Bearer ' from the header value
    bearerToken = authHeader.replace(/Bearer\s+/g, '');
  }
  
  const queryToken = req.query.api_key as string;
  
  // Check if API key is valid
  if (bearerToken === mcpApiKey || queryToken === mcpApiKey) {
    return next();
  }
  
  // Authentication failed
  console.error('MCP authentication failed: invalid API key');
  res.status(401).json({
    jsonrpc: '2.0',
    error: {
      code: -32001,
      message: 'Unauthorized: invalid API key',
    },
    id: null,
  });
  return; // Return void to satisfy TypeScript
}
