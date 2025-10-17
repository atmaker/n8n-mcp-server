/**
 * List Community Packages Tool
 */

import { BaseCommunityToolHandler } from './base-handler.js';
import { ToolCallResult, ToolDefinition, CommunityPackage } from '../../types/index.js';

export class ListCommunityPackagesHandler extends BaseCommunityToolHandler {
  async execute(args: Record<string, any>): Promise<ToolCallResult> {
    return this.handleExecution(async () => {
      const data = (await this.apiService.listCommunityPackages()) as CommunityPackage[];

      const packages = data.map((p) => ({
        packageName: p.packageName,
        installedVersion: p.installedVersion,
        updateAvailable: p.updateAvailable,
      }));

      const response = {
        packages,
        count: packages.length,
      };

      return this.formatSuccess(response, `Found ${packages.length} community package(s)`);
    }, args);
  }
}

export function getListCommunityPackagesToolDefinition(): ToolDefinition {
  return {
    name: 'list_community_packages',
    description: 'Retrieve a list of installed community packages',
    inputSchema: {
      type: 'object',
      properties: {},
      required: [],
    },
  };
}
