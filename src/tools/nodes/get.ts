/**
 * Get Node Tool
 */

import { BaseNodeToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition, NodeDetail } from '../../types/index.js';

export class GetNodeHandler extends BaseNodeToolHandler {
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      if (!args.nodeType || typeof args.nodeType !== 'string') {
        return this.formatError('Missing required parameter: nodeType');
      }

      const detail = (await this.apiService.getNode(args.nodeType)) as NodeDetail | Record<string, any>;

      // Mirror API response as-is to avoid dropping fields across different n8n versions
      return this.formatSuccess(detail, `Fetched node '${args.nodeType}'`);
    }, args);
  }
}

export function getGetNodeToolDefinition(): ToolDefinition {
  return {
    name: 'get_node',
    description: 'Retrieve details for a specific installed node',
    inputSchema: {
      type: 'object',
      properties: {
        nodeType: { type: 'string', description: 'Node type to fetch (e.g., n8n-nodes-base.httpRequest)' },
      },
      required: ['nodeType'],
    },
  };
}
