/**
 * Dynamic Node Resource Handler
 */

import { N8nApiService } from '../../api/n8n-client.js';
import { formatResourceUri } from '../../utils/resource-formatter.js';
import { McpError, ErrorCode } from '../../errors/index.js';

export async function getNodeResource(apiService: N8nApiService, nodeType: string): Promise<string> {
  try {
    const detail = await apiService.getNode(nodeType);

    const result = {
      resourceType: 'node',
      nodeType,
      node: detail.node,
      installedPackages: detail.installedPackages,
      _links: {
        self: formatResourceUri('nodes', nodeType),
        list: formatResourceUri('nodes'),
      },
      lastUpdated: new Date().toISOString(),
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    // surface 404s if the API reports not found
    if (error instanceof McpError) {
      throw error;
    }

    throw new McpError(
      ErrorCode.InternalError,
      `Failed to retrieve node '${nodeType}': ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getNodeResourceTemplateUri(): string {
  return 'n8n://nodes/{nodeType}';
}

export function getNodeResourceTemplateMetadata(): Record<string, any> {
  return {
    uriTemplate: getNodeResourceTemplateUri(),
    name: 'n8n Node Details',
    mimeType: 'application/json',
    description: 'Detailed information about a specific installed n8n node',
  };
}

export function extractNodeTypeFromUri(uri: string): string | null {
  const match = uri.match(/^n8n:\/\/nodes\/(.+)$/);
  return match ? match[1] : null;
}
