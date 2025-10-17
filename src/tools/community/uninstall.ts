/**
 * Uninstall Community Package Tool
 */

import { BaseCommunityToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition } from '../../types/index.js';

export class UninstallCommunityPackageHandler extends BaseCommunityToolHandler {
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      if (!args.name || typeof args.name !== 'string') {
        return this.formatError('Missing required parameter: name');
      }

      const result = await this.apiService.uninstallCommunityPackage(args.name);

      return this.formatSuccess(result, `Uninstall triggered for ${args.name}`);
    }, args);
  }
}

export function getUninstallCommunityPackageToolDefinition(): ToolDefinition {
  return {
    name: 'uninstall_community_package',
    description: 'Uninstall a community package by npm name',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'npm package name (e.g., n8n-nodes-foo)' },
      },
      required: ['name'],
    },
  };
}
