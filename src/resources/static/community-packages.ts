/**
 * Static Community Packages Resource Handler
 */

import { N8nApiService } from '../../api/n8n-client.js';
import { formatResourceUri } from '../../utils/resource-formatter.js';
import { McpError, ErrorCode } from '../../errors/index.js';

export async function getCommunityPackagesResource(apiService: N8nApiService): Promise<string> {
  try {
    const data = await apiService.listCommunityPackages();

    const result = {
      resourceType: 'community-packages',
      count: data.length,
      packages: data,
      _links: {
        self: getCommunityPackagesResourceUri(),
      },
      lastUpdated: new Date().toISOString(),
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to retrieve community packages: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getCommunityPackagesResourceUri(): string {
  return formatResourceUri('community-packages');
}

export function getCommunityPackagesResourceMetadata(): Record<string, any> {
  return {
    uri: getCommunityPackagesResourceUri(),
    name: 'n8n Community Packages',
    mimeType: 'application/json',
    description: 'List of installed community packages in this n8n instance',
  };
}
