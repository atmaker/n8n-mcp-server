/**
 * Resources routing tests (resources/index.ts)
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { setupResourceHandlers } from '../../../src/resources/index.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { ListResourcesRequestSchema, ListResourceTemplatesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

// Minimal mock server that records handlers and lets us invoke them
class MockServer {
  handlers: Map<any, Function> = new Map();
  setRequestHandler(schema: any, handler: Function) {
    this.handlers.set(schema, handler);
  }
  getHandler(schema: any) {
    const h = this.handlers.get(schema);
    if (!h) throw new Error('handler not found');
    return h;
  }
}

const fakeApi: any = {
  getWorkflows: jest.fn(),
  getExecutions: jest.fn(),
  getNodesPage: jest.fn(),
  listCommunityPackages: jest.fn(),
  getWorkflow: jest.fn(),
  getExecution: jest.fn(),
  getNode: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Resources routing', () => {
  it('lists static resources', async () => {
    const server = new MockServer() as unknown as Server;
    setupResourceHandlers(server, { n8nApiUrl: 'http://x', n8nApiKey: 'y', debug: false }, fakeApi);

    const res = await (server as any).getHandler(ListResourcesRequestSchema)();
    expect(res.resources).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ uri: 'n8n://workflows' }),
        expect.objectContaining({ uri: 'n8n://execution-stats' }),
        expect.objectContaining({ uri: 'n8n://nodes' }),
        expect.objectContaining({ uri: 'n8n://community-packages' }),
      ])
    );
  });

  it('lists dynamic resource templates', async () => {
    const server = new MockServer() as unknown as Server;
    setupResourceHandlers(server, { n8nApiUrl: 'http://x', n8nApiKey: 'y', debug: false }, fakeApi);

    const res = await (server as any).getHandler(ListResourceTemplatesRequestSchema)();
    expect(res.resourceTemplates.length).toBeGreaterThanOrEqual(3);
  });

  it('reads static resources and returns content', async () => {
    fakeApi.getWorkflows.mockResolvedValueOnce([]);
    fakeApi.getExecutions.mockResolvedValueOnce([]);
    fakeApi.getNodesPage.mockResolvedValueOnce({ data: [], nextCursor: null });
    fakeApi.listCommunityPackages.mockResolvedValueOnce([]);

    const server = new MockServer() as unknown as Server;
    setupResourceHandlers(server, { n8nApiUrl: 'http://x', n8nApiKey: 'y', debug: false }, fakeApi);

    for (const uri of ['n8n://workflows', 'n8n://execution-stats', 'n8n://nodes', 'n8n://community-packages']) {
      const res = await (server as any).getHandler(ReadResourceRequestSchema)({ params: { uri } });
      expect(res.contents[0].uri).toBe(uri);
      expect(res.contents[0].mimeType).toBe('application/json');
      expect(typeof res.contents[0].text).toBe('string');
    }
  });

  it('reads dynamic resources workflow/execution/node and unknown returns NotFound', async () => {
    fakeApi.getWorkflow.mockResolvedValueOnce({ id: 'w1', name: 'WF', active: false, nodes: [], connections: {}, tags: [] });
    fakeApi.getExecution.mockResolvedValueOnce({ id: 'e1', workflowId: 'w1', status: 'success', startedAt: '2024-01-01T00:00:00Z', stoppedAt: '2024-01-01T00:00:10Z', data: {} });
    fakeApi.getNode.mockResolvedValueOnce({ node: { type: 'a.node' }, installedPackages: [] });

    const server = new MockServer() as unknown as Server;
    setupResourceHandlers(server, { n8nApiUrl: 'http://x', n8nApiKey: 'y', debug: false }, fakeApi);

    const w = await (server as any).getHandler(ReadResourceRequestSchema)({ params: { uri: 'n8n://workflows/w1' } });
    expect(w.contents[0].uri).toBe('n8n://workflows/w1');

    const e = await (server as any).getHandler(ReadResourceRequestSchema)({ params: { uri: 'n8n://executions/e1' } });
    expect(e.contents[0].uri).toBe('n8n://executions/e1');

    const n = await (server as any).getHandler(ReadResourceRequestSchema)({ params: { uri: 'n8n://nodes/a.node' } });
    expect(n.contents[0].uri).toBe('n8n://nodes/a.node');

    // Unknown
    await expect((server as any).getHandler(ReadResourceRequestSchema)({ params: { uri: 'n8n://unknown/thing' } })).rejects.toThrow(/Resource not found/);
  });
});
