/**
 * Nodes tools handler tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

// Fake service implementing the subset used by handlers
const fakeService: any = {
  getNodesPage: jest.fn(),
  getNode: jest.fn(),
  getNodeCategoriesPage: jest.fn(),
};

import { ListNodesHandler } from '../../../../src/tools/nodes/list.js';
import { GetNodeHandler } from '../../../../src/tools/nodes/get.js';
import { ListNodeCategoriesHandler } from '../../../../src/tools/nodes/categories.js';
import { N8nApiError } from '../../../../src/errors/index.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Nodes Tools', () => {
  it('list_nodes returns nodes with pagination metadata', async () => {
    fakeService.getNodesPage.mockResolvedValueOnce({
      data: ['n8n-nodes-base.httpRequest', 'n8n-nodes-base.set'],
      nextCursor: 'abc',
    });

    const handler = new ListNodesHandler(fakeService);
    const result = await handler.execute({ limit: 2 });

    expect(result.isError).toBeUndefined();
    const text = result.content[0].text;
    const payload = JSON.parse(text.split('\n\n').pop() || '{}');

    expect(payload.data).toHaveLength(2);
    expect(payload.nextCursor).toBe('abc');
  });

  it('list_nodes mirrors API object array (no transformation)', async () => {
    fakeService.getNodesPage.mockResolvedValueOnce({
      data: [{ type: 'a.node' }, { type: 'b.node' }],
      nextCursor: null,
    });

    const handler = new ListNodesHandler(fakeService);
    const result = await handler.execute({});

    const text = result.content[0].text;
    const payload = JSON.parse(text.split('\n\n').pop() || '{}');
    expect(Array.isArray(payload.data)).toBe(true);
    expect(payload.data[0].type).toBe('a.node');
    expect(payload.nextCursor).toBeNull();
  });

  it('get_node returns friendly auth error with tips', async () => {
    fakeService.getNode.mockRejectedValueOnce(new N8nApiError('Unauthorized', 401));

    const handler = new GetNodeHandler(fakeService);
    const result = await handler.execute({ nodeType: 'n8n-nodes-base.httpRequest' });

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toMatch(/Authentication failed for n8n API/);
    expect(text).toMatch(/N8N_API_KEY/);
  });

  it('get_node returns friendly network error with tips', async () => {
    fakeService.getNode.mockRejectedValueOnce(new N8nApiError('Network error connecting to n8n API', undefined, 'ECONNREFUSED'));

    const handler = new GetNodeHandler(fakeService);
    const result = await handler.execute({ nodeType: 'n8n-nodes-base.httpRequest' });

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toMatch(/Network error connecting to n8n API/);
    expect(text).toMatch(/N8N_API_URL/);
    expect(text).toMatch(/Docker/);
  });

  it('get_node mirrors API payload (no field dropping)', async () => {
    const rawPayload = { foo: 'bar', nested: { a: 1 } };
    fakeService.getNode.mockResolvedValueOnce(rawPayload);

    const handler = new GetNodeHandler(fakeService);
    const result = await handler.execute({ nodeType: 'custom.node' });

    const text = result.content[0].text;
    const payload = JSON.parse(text.split('\n\n').pop() || '{}');
    expect(payload).toEqual(rawPayload);
  });

  it('get_node returns node details', async () => {
    fakeService.getNode.mockResolvedValueOnce({
      node: { type: 'n8n-nodes-base.httpRequest', displayName: 'HTTP Request' },
      installedPackages: [],
    });

    const handler = new GetNodeHandler(fakeService);
    const result = await handler.execute({ nodeType: 'n8n-nodes-base.httpRequest' });

    const text = result.content[0].text;
    const payload = JSON.parse(text.split('\n\n').pop() || '{}');

    expect(payload.node.type).toBe('n8n-nodes-base.httpRequest');
    expect(Array.isArray(payload.installedPackages)).toBe(true);
  });

  it('list_node_categories returns categories', async () => {
    fakeService.getNodeCategoriesPage.mockResolvedValueOnce({
      data: ['Core', 'Productivity'],
      nextCursor: null,
    });

    const handler = new ListNodeCategoriesHandler(fakeService);
    const result = await handler.execute({});

    const text = result.content[0].text;
    const payload = JSON.parse(text.split('\n\n').pop() || '{}');

    expect(payload.categories).toContain('Core');
    expect(payload.hasMore).toBe(false);
  });

  it('list_node_categories sets hasMore true when nextCursor exists', async () => {
    fakeService.getNodeCategoriesPage.mockResolvedValueOnce({
      data: ['A'],
      nextCursor: 'next-1',
    });

    const handler = new ListNodeCategoriesHandler(fakeService);
    const result = await handler.execute({});

    const text = result.content[0].text;
    const payload = JSON.parse(text.split('\n\n').pop() || '{}');
    expect(payload.hasMore).toBe(true);
    expect(payload.nextCursor).toBe('next-1');
  });
});
