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
      const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : undefined;
      const cursor: string | undefined = args.cursor ?? args.lastId; // lastId kept as deprecated alias

      const { data, nextCursor } = await this.apiService.getExecutionsPage({
        limit,
        cursor,
        workflowId: args.workflowId,
        status: args.status,
      });

      // Format the executions for display
      const formattedExecutions = data.map((execution: Execution) =>
        formatExecutionSummary(execution)
      );

      // Generate summary if requested (summary for the current page)
      const summary = args.includeSummary ? summarizeExecutions(data) : undefined;

      // Prepare response data
      const responseData = {
        executions: formattedExecutions,
        summary,
        count: formattedExecutions.length,
        nextCursor,
        hasMore: Boolean(nextCursor),
        filtered: Boolean(args.workflowId || args.status),
      };

      return this.formatSuccess(
        responseData,
        `Found ${formattedExecutions.length} execution(s)`
      );
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
        cursor: {
          type: 'string',
          description: 'Cursor for pagination. Use the nextCursor returned by the previous call.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of executions to return for this page',
        },
        lastId: {
          type: 'string',
          description: 'Deprecated: use cursor instead. ID of the last execution for pagination.',
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
