/**
 * Update Community Package Tool
 */

import { BaseCommunityToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition } from '../../types/index.js';

export class UpdateCommunityPackageHandler extends BaseCommunityToolHandler {
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      if (!args.name || typeof args.name !== 'string') {
        return this.formatError('Missing required parameter: name');
      }

      const body: { name: string; version?: string; checksum?: string } = {
        name: args.name,
      };
      if (typeof args.version === 'string') body.version = args.version;
      if (typeof args.checksum === 'string') body.checksum = args.checksum;

      const result = await this.apiService.updateCommunityPackage(body);

      return this.formatSuccess(result, `Update triggered for ${args.name}`);
    }, args);
  }
}

export function getUpdateCommunityPackageToolDefinition(): ToolDefinition {
  return {
    name: 'update_community_package',
    description: 'Update a community package to a specific version or verify by checksum',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'npm package name (e.g., n8n-nodes-foo)' },
        version: { type: 'string', description: 'Specific version to update to' },
        checksum: { type: 'string', description: 'Checksum to verify integrity (e.g., sha512-...)' },
      },
      required: ['name'],
    },
  };
}
