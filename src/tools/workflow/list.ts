/**
 * List Workflows Tool
 * 
 * This tool retrieves a list of workflows from n8n.
 */

import { BaseWorkflowToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition, Workflow } from '../../types/index.js';

/**
 * Handler for the list_workflows tool
 */
export class ListWorkflowsHandler extends BaseWorkflowToolHandler {
  /**
   * Execute the tool
   * 
   * @param args Tool arguments
   * @returns List of workflows
   */
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      const limit = typeof args.limit === 'number' && args.limit > 0 ? args.limit : undefined;
      const cursor: string | undefined = args.cursor;

      const { data, nextCursor } = await this.apiService.getWorkflowsPage({
        limit,
        cursor,
        active: args.active,
        name: args.name,
        tags: args.tags,
        projectId: args.projectId,
        excludePinnedData: args.excludePinnedData,
      });
      
      // Format the workflows for display
      const formattedWorkflows = data.map((workflow: Workflow) => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        updatedAt: workflow.updatedAt,
      }));
      
      const responseData = {
        workflows: formattedWorkflows,
        count: formattedWorkflows.length,
        nextCursor,
        hasMore: Boolean(nextCursor),
      };

      return this.formatSuccess(
        responseData,
        `Found ${formattedWorkflows.length} workflow(s)`
      );
    }, args);
  }
}

/**
 * Get tool definition for the list_workflows tool
 * 
 * @returns Tool definition
 */
export function getListWorkflowsToolDefinition(): ToolDefinition {
  return {
    name: 'list_workflows',
    description: 'Retrieve a list of all workflows available in n8n',
    inputSchema: {
      type: 'object',
      properties: {
        active: {
          type: 'boolean',
          description: 'Optional filter to show only active or inactive workflows',
        },
        name: {
          type: 'string',
          description: 'Optional filter by workflow name',
        },
        tags: {
          type: 'string',
          description: 'Optional comma-separated tag names to filter by',
        },
        projectId: {
          type: 'string',
          description: 'Optional project ID to filter by',
        },
        excludePinnedData: {
          type: 'boolean',
          description: 'Set this to avoid retrieving pinned data',
        },
        cursor: {
          type: 'string',
          description: 'Cursor for pagination. Use the nextCursor returned by the previous call.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of workflows to return for this page',
        },
      },
      required: [],
    },
  };
}
