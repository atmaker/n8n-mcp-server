/**
 * Base Execution Tool Handler
 * 
 * This module provides a base handler for execution-related tools.
 */

import { ToolCallResult } from '../../types/index.js';
import { N8nApiError } from '../../errors/index.js';
import { createApiService } from '../../api/n8n-client.js';
import { getEnvConfig } from '../../config/environment.js';
import {
  ChunkedToolCallResult,
  createSuccessResponse,
  createErrorResponse,
  FormattingOptions
} from '../../utils/response-formatter.js';

/**
 * Base class for execution tool handlers
 */
export abstract class BaseExecutionToolHandler {
  protected apiService = createApiService(getEnvConfig());
  
  /**
   * Validate and execute the tool
   * 
   * @param args Arguments passed to the tool
   * @returns Tool call result or array of results if chunked
   */
  abstract execute(args: Record<string, any>): Promise<ToolCallResult | ChunkedToolCallResult[]>;
  
  /**
   * Format a successful response with support for chunking and truncation
   * 
   * @param data Response data
   * @param message Optional success message
   * @param options Optional formatting options
   * @returns Formatted success response(s)
   */
  protected formatSuccess(data: any, message?: string, options?: FormattingOptions): ChunkedToolCallResult[] {
    return createSuccessResponse(data, message, options);
  }
  
  /**
   * Format an error response
   * 
   * @param error Error object or message
   * @returns Formatted error response
   */
  protected formatError(error: Error | string): ChunkedToolCallResult {
    return createErrorResponse(error);
  }
  
  /**
   * Handle tool execution errors
   * 
   * @param handler Function to execute
   * @param args Arguments to pass to the handler
   * @returns Tool call result or array of results if chunked
   */
  protected async handleExecution(
    handler: (args: Record<string, any>) => Promise<ToolCallResult | ChunkedToolCallResult[]>,
    args: Record<string, any>
  ): Promise<ToolCallResult | ChunkedToolCallResult[]> {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof N8nApiError) {
        return this.formatError(error.message);
      }
      
      const errorMessage = error instanceof Error 
        ? error.message 
        : 'Unknown error occurred';
        
      return this.formatError(`Error executing execution tool: ${errorMessage}`);
    }
  }
}
