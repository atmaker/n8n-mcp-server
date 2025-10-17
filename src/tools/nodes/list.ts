/**
 * List Nodes Tool
 */

import { BaseNodeToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition, InstalledNode } from '../../types/index.js';

export class ListNodesHandler extends BaseNodeToolHandler {
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      const { data, nextCursor } = await this.apiService.getNodesPage({
        nodeType: args.nodeType,
        limit: typeof args.limit === 'number' && args.limit > 0 ? args.limit : undefined,
        cursor: args.cursor,
        sort: args.sort,
        order: args.order,
      });

      // Mirror API response shape exactly: { data: string[] | installedNode[], nextCursor }
      const response = {
        data,
        nextCursor,
      };

      const count = Array.isArray(data) ? data.length : 0;
      return this.formatSuccess(response, `Found ${count} item(s)`);
    }, args);
  }
}

export function getListNodesToolDefinition(): ToolDefinition {
  return {
    name: 'list_nodes',
    description: 'Retrieve installed nodes, optionally filtered by nodeType',
    inputSchema: {
      type: 'object',
      properties: {
        nodeType: { type: 'string', description: 'Filter by node type' },
        limit: { type: 'number', description: 'Max items to return for this page' },
        cursor: { type: 'string', description: 'Pagination cursor (use nextCursor from previous call)' },
        sort: { type: 'string', description: 'Sort field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
      },
      required: [],
    },
  };
}
