/**
 * List Executions Tool
 * 
 * This tool retrieves a list of workflow executions from n8n.
 */

import { BaseExecutionToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition, Execution } from '../../types/index.js';
import { formatExecutionSummary, summarizeExecutions } from '../../utils/execution-formatter.js';

/**
 * Handler for the list_executions tool
 */
export class ListExecutionsHandler extends BaseExecutionToolHandler {
  /**
   * Execute the tool
   * 
   * @param args Tool arguments (workflowId, status, limit, lastId)
   * @returns List of executions
   */
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      const { workflowId, status, includeSummary } = args;
      const paginationParams = this.getPaginationParams(args);
      
      // Get all executions
      const executions = await this.apiService.getExecutions();
      
      // Apply filters if provided
      let filteredExecutions = executions;
      
      // Filter by workflow ID if provided
      if (workflowId) {
        filteredExecutions = filteredExecutions.filter(
          (execution: Execution) => execution.workflowId === workflowId
        );
      }
      
      // Filter by status if provided
      if (status) {
        filteredExecutions = filteredExecutions.filter(
          (execution: Execution) => execution.status === status
        );
      }
      
      // Format the executions for display
      const formattedExecutions = filteredExecutions.map((execution: Execution) => 
        formatExecutionSummary(execution)
      );
      
      // Generate summary if requested
      let summary = undefined;
      if (includeSummary) {
        summary = summarizeExecutions(executions);
      }
      
      // Use the base pagination handler
      const messagePrefix = `Executions${status ? ` (${status})` : ''}${
        workflowId ? ` for workflow ${workflowId}` : ''
      }`;
      
      // Use the base pagination handler for the executions list
      const paginatedResult = this.formatPaginatedSuccess(
        formattedExecutions,
        paginationParams,
        messagePrefix
      );
      
      // If summary was requested, add it to the response
      if (includeSummary && summary) {
        // Modify the response to include the summary
        const responseText = paginatedResult.content[0].text;
        const jsonStartIndex = responseText.indexOf('{');
        
        if (jsonStartIndex >= 0) {
          // Parse the JSON from the response
          const responseJson = JSON.parse(responseText.substring(jsonStartIndex));
          
          // Add the summary to the response
          responseJson.summary = summary;
          
          // Replace the JSON in the response
          const newText = responseText.substring(0, jsonStartIndex) + 
                          JSON.stringify(responseJson, null, 2);
          
          paginatedResult.content[0].text = newText;
        }
      }
      
      return paginatedResult;
    }, args);
  }
}

/**
 * Get tool definition for the list_executions tool
 * 
 * @returns Tool definition
 */
export function getListExecutionsToolDefinition(): ToolDefinition {
  return {
    name: 'list_executions',
    description: 'Retrieve a list of workflow executions from n8n',
    inputSchema: {
      type: 'object',
      properties: {
        workflowId: {
          type: 'string',
          description: 'Optional ID of workflow to filter executions by',
        },
        status: {
          type: 'string',
          description: 'Optional status to filter by (success, error, waiting, or canceled)',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of executions to return. Default is 10.',
        },
        lastId: {
          type: 'string',
          description: 'ID of the last execution for pagination (deprecated, use offset instead)',
        },
        offset: {
          type: 'number',
          description: 'Number of items to skip (for pagination). Default is 0.',
        },
        includeSummary: {
          type: 'boolean',
          description: 'Include summary statistics about executions',
        },
      },
      required: [],
    },
  };
}
