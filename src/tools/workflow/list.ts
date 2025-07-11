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
      const { active } = args;
      const paginationParams = this.getPaginationParams(args);
      
      // Get all workflows
      const workflows = await this.apiService.getWorkflows();
      
      // Apply active filter if specified
      let filteredWorkflows = workflows;
      if (active !== undefined) {
        filteredWorkflows = workflows.filter(
          (workflow: Workflow) => workflow.active === active
        );
      }
      
      // Format the workflows for display
      const formattedWorkflows = filteredWorkflows.map((workflow: Workflow) => ({
        id: workflow.id,
        name: workflow.name,
        active: workflow.active,
        updatedAt: workflow.updatedAt,
      }));
      
      // Use the base pagination handler
      return this.formatPaginatedSuccess(
        formattedWorkflows, 
        paginationParams,
        `Workflows${active !== undefined ? ` (${active ? 'active' : 'inactive'})` : ''}`
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
        offset: {
          type: 'number',
          description: 'Number of items to skip (for pagination). Default is 0.',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of items to return. Default is 10.',
        },
      },
      required: [],
    },
  };
}
