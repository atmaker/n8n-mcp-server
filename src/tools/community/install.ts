/**
 * Install Community Package Tool
 */

import { BaseCommunityToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition } from '../../types/index.js';

export class InstallCommunityPackageHandler extends BaseCommunityToolHandler {
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

      const result = await this.apiService.installCommunityPackage(body);

      return this.formatSuccess(result, `Install triggered for ${args.name}`);
    }, args);
  }
}

export function getInstallCommunityPackageToolDefinition(): ToolDefinition {
  return {
    name: 'install_community_package',
    description: 'Install a community package by npm name with optional version or checksum verification',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'npm package name (e.g., n8n-nodes-foo)' },
        version: { type: 'string', description: 'Specific version to install' },
        checksum: { type: 'string', description: 'Checksum to verify integrity (e.g., sha512-...)' },
      },
      required: ['name'],
    },
  };
}
