/**
 * Base Node Tool Handler
 *
 * Provides common formatting and error handling for node-related tools.
 */

import { ToolCallResult } from '../../types/index.js';
import { N8nApiError } from '../../errors/index.js';
import { createApiService, N8nApiService } from '../../api/n8n-client.js';
import { getEnvConfig } from '../../config/environment.js';

export abstract class BaseNodeToolHandler {
  protected apiService: N8nApiService;

  constructor(apiService?: N8nApiService) {
    this.apiService = apiService ?? createApiService(getEnvConfig());
  }

  abstract execute(args: Record<string, any>): Promise<ToolCallResult>;

  protected formatSuccess(data: any, message?: string): ToolCallResult {
    const formattedData = typeof data === 'object' ? JSON.stringify(data, null, 2) : String(data);
    return {
      content: [
        {
          type: 'text',
          text: message ? `${message}\n\n${formattedData}` : formattedData,
        },
      ],
    };
  }

  protected formatError(error: Error | string): ToolCallResult {
    const errorMessage = error instanceof Error ? error.message : error;
    return {
      content: [
        {
          type: 'text',
          text: errorMessage,
        },
      ],
      isError: true,
    };
  }

  protected async handleExecution(
    handler: (args: Record<string, any>) => Promise<ToolCallResult>,
    args: Record<string, any>
  ): Promise<ToolCallResult> {
    try {
      return await handler(args);
    } catch (error) {
      if (error instanceof N8nApiError) {
        // Build a friendly, actionable error message
        const tips: string[] = [];
        let headline = 'n8n API request failed';

        const sc = error.statusCode;
        if (typeof sc === 'number') {
          if (sc === 401 || sc === 403) {
            headline = 'Authentication failed for n8n API';
            tips.push(
              '- Ensure a valid n8n API key is configured (env: N8N_API_KEY).',
              '- Use header X-N8N-API-KEY (the client already does this).',
              '- Verify the key belongs to this n8n instance and has required permissions.'
            );
          } else if (sc === 404) {
            headline = 'Requested resource was not found on n8n API';
            if (args?.nodeType) tips.push(`- Verify nodeType is correct: ${args.nodeType}`);
          } else if (sc >= 400 && sc < 500) {
            headline = 'Invalid request to n8n API';
            tips.push(
              '- Check input parameters and their types.',
              '- Ensure the endpoint and query parameters match your n8n version.'
            );
          } else if (sc >= 500) {
            headline = 'n8n API returned a server error';
            tips.push(
              '- Try again shortly.',
              '- Check n8n server logs for details.'
            );
          }
        } else {
          // Network / transport errors
          headline = 'Network error connecting to n8n API';
          tips.push(
            '- Verify N8N_API_URL is reachable from this MCP server runtime.',
            '- If running in Docker, ensure the hostname is resolvable from the container (e.g., service name like "n8n" or host.docker.internal).',
            '- Confirm the port is open and not blocked by a firewall.'
          );
        }

        const detailsStr = error.details ? (() => {
          try { return typeof error.details === 'string' ? error.details : JSON.stringify(error.details, null, 2); } catch { return undefined; }
        })() : undefined;

        const messageLines = [
          headline,
          '',
          error.message,
          tips.length ? '' : undefined,
          tips.length ? 'Tips:' : undefined,
          ...tips,
          detailsStr ? '' : undefined,
          detailsStr ? `Details: ${detailsStr}` : undefined,
        ].filter((v): v is string => Boolean(v));

        return {
          content: [{ type: 'text', text: messageLines.join('\n') }],
          isError: true,
        };
      }
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      return this.formatError(`Error executing node tool: ${errorMessage}`);
    }
  }
}
