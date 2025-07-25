/**
 * Base Execution Tool Handler
 * 
 * This module provides a base handler for execution-related tools.
 */

import { ToolCallResult } from '../../types/index.js';
import { N8nApiError } from '../../errors/index.js';
import { createApiService } from '../../api/n8n-client.js';
import { getEnvConfig } from '../../config/environment.js';
import { PaginationParams, paginateResults } from '../../utils/pagination.js';

/**
 * Base class for execution tool handlers
 */
export abstract class BaseExecutionToolHandler {
  protected apiService = createApiService(getEnvConfig());
  
  /**
   * Validate and execute the tool
   * 
   * @param args Arguments passed to the tool
   * @returns Tool call result
   */
  abstract execute(args: Record<string, any>): Promise<ToolCallResult>;
  
  /**
   * Format a successful response
   * 
   * @param data Response data
   * @param message Optional success message
   * @returns Formatted success response
   */
  protected formatSuccess(data: any, message?: string): ToolCallResult {
    const formattedData = typeof data === 'object' 
      ? JSON.stringify(data, null, 2)
      : String(data);
      
    return {
      content: [
        {
          type: 'text',
          text: message ? `${message}\n\n${formattedData}` : formattedData,
        },
      ],
    };
  }
  
  /**
   * Format an error response
   * 
   * @param error Error object or message
   * @returns Formatted error response
   */
  protected formatError(error: Error | string): ToolCallResult {
    const errorMessage = error instanceof Error ? error.message : error;
    
    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }
  
  /**
   * Handle tool execution errors
   * 
   * @param handler Function to execute
   * @param args Arguments to pass to the handler
   * @returns Tool call result
   */
  protected async handleExecution(
    handler: (args: Record<string, any>) => Promise<ToolCallResult>,
    args: Record<string, any>
  ): Promise<ToolCallResult> {
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
  
  /**
   * Extract pagination parameters from args
   * 
   * @param args Tool arguments
   * @returns Standardized pagination parameters
   */
  protected getPaginationParams(args: Record<string, any>): PaginationParams {
    return {
      offset: args.offset !== undefined ? Number(args.offset) : 0,
      limit: args.limit !== undefined ? Number(args.limit) : 10,
    };
  }
  
  /**
   * Format a paginated success response
   * 
   * @param items Items to paginate
   * @param params Pagination parameters
   * @param message Optional success message
   * @returns Formatted paginated success response
   */
  protected formatPaginatedSuccess<T>(
    items: T[],
    params: PaginationParams = {},
    message?: string
  ): ToolCallResult {
    const paginated = paginateResults(items, params);
    
    // Format message with pagination info
    const paginationInfo = `Showing ${paginated.data.length} of ${paginated.pagination.total} total items`;
    const fullMessage = message 
      ? `${message}\n${paginationInfo}`
      : paginationInfo;
    
    return this.formatSuccess(paginated, fullMessage);
  }
}
