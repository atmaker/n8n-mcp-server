/**
 * Static Nodes Resource Handler
 */

import { N8nApiService } from '../../api/n8n-client.js';
import { formatResourceUri } from '../../utils/resource-formatter.js';
import { McpError, ErrorCode } from '../../errors/index.js';

export async function getNodesResource(apiService: N8nApiService): Promise<string> {
  try {
    const { data, nextCursor } = await apiService.getNodesPage({});

    // Produce a compact, cleaner list of node identifiers (strings)
    const nodes: string[] = Array.isArray(data)
      ? (() => {
          const arr: any[] = data as any[];
          if (arr.length === 0) return [];
          if (typeof arr[0] === 'string') {
            return arr.filter((v): v is string => typeof v === 'string');
          }
          return arr
            .map((n) => n?.type ?? n?.name ?? n?.nodeType ?? n?.codex?.alias ?? null)
            .filter((v): v is string => typeof v === 'string' && v.length > 0);
        })()
      : [];

    // Present a predictable, cleaner ordering
    const nodesSorted = [...nodes].sort((a, b) => a.localeCompare(b));

    const result = {
      resourceType: 'nodes',
      count: nodesSorted.length,
      nodes: nodesSorted,
      nextCursor: nextCursor || null,
      _links: {
        self: getNodesResourceUri(),
      },
      lastUpdated: new Date().toISOString(),
    };

    return JSON.stringify(result, null, 2);
  } catch (error) {
    throw new McpError(
      ErrorCode.InternalError,
      `Failed to retrieve nodes: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

export function getNodesResourceUri(): string {
  return formatResourceUri('nodes');
}

export function getNodesResourceMetadata(): Record<string, any> {
  return {
    uri: getNodesResourceUri(),
    name: 'n8n Nodes',
    mimeType: 'application/json',
    description: 'List of installed nodes in this n8n instance',
  };
}
