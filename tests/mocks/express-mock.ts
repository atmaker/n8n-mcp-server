/**
 * Express mock utilities for n8n MCP Server tests
 */

import { Request, Response, NextFunction } from 'express';
import { jest } from '@jest/globals';
import { Readable } from 'stream';

// Define the Express handler type for clarity
type ExpressHandler = (req: Request, res: Response, next: NextFunction) => void;

// Define types for our mock Express app
export interface MockExpressRoute {
  path: string;
  handler: ExpressHandler;
  method: 'get' | 'post' | 'put' | 'delete' | 'use';
}

// Mock HTTP server interface
export interface MockHttpServer {
  close: jest.Mock;
}

// The mock Express app interface
export interface MockExpressApp {
  use: jest.MockedFunction<(handler: ExpressHandler) => MockExpressApp>;
  get: jest.MockedFunction<(path: string, handler: ExpressHandler) => MockExpressApp>;
  post: jest.MockedFunction<(path: string, handler: ExpressHandler) => MockExpressApp>;
  put: jest.MockedFunction<(path: string, handler: ExpressHandler) => MockExpressApp>;
  delete: jest.MockedFunction<(path: string, handler: ExpressHandler) => MockExpressApp>;
  listen: jest.MockedFunction<(port: number, callback?: () => void) => MockHttpServer>;
  routes: MockExpressRoute[];
  middleware: ExpressHandler[];
  
  // Helper methods
  getRouteHandler: (method: string, path: string) => ExpressHandler | undefined;
  reset: () => void;
}

/**
 * Create a mock Express request object
 */
export const createMockRequest = (options: Partial<Request> = {}): Request => {
  return {
    body: {},
    query: {},
    params: {},
    headers: {},
    ...options,
  } as unknown as Request;
};

/**
 * Create a mock Express response object
 */
export const createMockResponse = (): Response => {
  // Create a mock response object
  const res = {} as Partial<Response>;
  
  // Mock the chainable methods that return the response
  res.status = jest.fn().mockReturnThis() as any;
  res.send = jest.fn().mockReturnThis() as any;
  res.json = jest.fn().mockReturnThis() as any;
  res.end = jest.fn().mockReturnThis() as any;
  res.header = jest.fn().mockReturnThis() as any;
  res.set = jest.fn().mockReturnThis() as any;
  res.type = jest.fn().mockReturnThis() as any;
  
  // Mock other methods
  res.on = jest.fn().mockReturnThis() as any;
  res.write = jest.fn().mockReturnValue(true) as any;
  res.headersSent = false;
  
  return res as Response;
};

/**
 * Create a mock Express app for testing
 */
export const createMockExpressApp = (): MockExpressApp => {
  const routes: MockExpressRoute[] = [];
  const middleware: ExpressHandler[] = [];
  
  // Create the mock app object
  const mockApp = {} as Partial<MockExpressApp>;
  
  // Setup the routes and middleware collections
  mockApp.routes = routes;
  mockApp.middleware = middleware;
  
  // Helper function to create route registration methods
  const createRouteMethod = (method: MockExpressRoute['method']) => {
    return jest.fn((path: string, handler: ExpressHandler) => {
      routes.push({ path, handler, method });
      return mockApp as MockExpressApp;
    });
  };
  
  // Setup route methods
  mockApp.get = createRouteMethod('get');
  mockApp.post = createRouteMethod('post');
  mockApp.put = createRouteMethod('put');
  mockApp.delete = createRouteMethod('delete');
  
  // Setup middleware method
  mockApp.use = jest.fn((handler: ExpressHandler) => {
    middleware.push(handler);
    return mockApp as MockExpressApp;
  });
  
  // Setup listen method
  mockApp.listen = jest.fn((port: number, callback?: () => void) => {
    if (callback) callback();
    const server: MockHttpServer = { close: jest.fn() };
    return server;
  });
  
  // Setup helper method to find route handler
  mockApp.getRouteHandler = (method: string, path: string): ExpressHandler | undefined => {
    return routes.find(r => r.method === method && r.path === path)?.handler;
  };
  
  // Setup reset method
  mockApp.reset = () => {
    routes.length = 0;
    middleware.length = 0;
    mockApp.use?.mockClear();
    mockApp.get?.mockClear();
    mockApp.post?.mockClear();
    mockApp.put?.mockClear();
    mockApp.delete?.mockClear();
    mockApp.listen?.mockClear();
  };
  
  return mockApp as MockExpressApp;
};

/**
 * Create a mock SSE transport for testing
 */
export const createMockSseTransport = () => {
  return {
    sessionId: 'test-session-id',
    // @ts-expect-error: Jest mock typing issue with mockResolvedValue
    handlePostMessage: jest.fn().mockResolvedValue(undefined)
  };
};

export default {
  createMockExpressApp,
  createMockRequest,
  createMockResponse,
  createMockSseTransport
};
