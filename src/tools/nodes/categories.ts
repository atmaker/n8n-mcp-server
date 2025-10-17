/**
 * List Node Categories Tool
 */

import { BaseNodeToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition } from '../../types/index.js';

export class ListNodeCategoriesHandler extends BaseNodeToolHandler {
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      const { data, nextCursor } = await this.apiService.getNodeCategoriesPage({
        limit: typeof args.limit === 'number' && args.limit > 0 ? args.limit : undefined,
        cursor: args.cursor,
        sort: args.sort,
        order: args.order,
      });

      const categories = data as string[];

      const response = {
        categories,
        count: categories.length,
        nextCursor,
        hasMore: Boolean(nextCursor),
      };

      return this.formatSuccess(response, `Found ${categories.length} category(ies)`);
    }, args);
  }
}

export function getListNodeCategoriesToolDefinition(): ToolDefinition {
  return {
    name: 'list_node_categories',
    description: 'Retrieve available node categories',
    inputSchema: {
      type: 'object',
      properties: {
        limit: { type: 'number', description: 'Max items to return for this page' },
        cursor: { type: 'string', description: 'Pagination cursor (use nextCursor from previous call)' },
        sort: { type: 'string', enum: ['name'], description: 'Sort field' },
        order: { type: 'string', enum: ['asc', 'desc'], description: 'Sort order' },
      },
      required: [],
    },
  };
}
