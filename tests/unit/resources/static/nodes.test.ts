/**
 * Static Nodes Resource tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpError } from '../../../../src/errors/index.js';
import { getNodesResource } from '../../../../src/resources/static/nodes.js';

const fakeService: any = {
  getNodesPage: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Static Resource: n8n Nodes', () => {
  it('returns sorted string node IDs when API returns strings', async () => {
    fakeService.getNodesPage.mockResolvedValueOnce({
      data: ['b.node', 'a.node'],
      nextCursor: 'xyz',
    });

    const content = await getNodesResource(fakeService);
    const payload = JSON.parse(content);

    expect(payload.resourceType).toBe('nodes');
    expect(payload.nodes).toEqual(['a.node', 'b.node']);
    expect(payload.count).toBe(2);
    expect(payload.nextCursor).toBe('xyz');
    expect(typeof payload.lastUpdated).toBe('string');
  });

  it('extracts best-effort identifiers from object items and sorts them', async () => {
    fakeService.getNodesPage.mockResolvedValueOnce({
      data: [
        { type: 'b.node' },
        { name: 'a.node' },
        { nodeType: 'c.node' },
        { codex: { alias: 'd.node' } },
        { unknown: true }, // will be dropped
      ],
      nextCursor: null,
    });

    const content = await getNodesResource(fakeService);
    const payload = JSON.parse(content);

    expect(payload.nodes).toEqual(['a.node', 'b.node', 'c.node', 'd.node']);
    expect(payload.count).toBe(4);
    expect(payload.nextCursor).toBeNull();
  });

  it('handles empty lists', async () => {
    fakeService.getNodesPage.mockResolvedValueOnce({ data: [], nextCursor: null });
    const content = await getNodesResource(fakeService);
    const payload = JSON.parse(content);
    expect(payload.nodes).toEqual([]);
    expect(payload.count).toBe(0);
  });

  it('wraps errors as McpError with helpful message', async () => {
    fakeService.getNodesPage.mockRejectedValueOnce(new Error('boom'));
    await expect(getNodesResource(fakeService)).rejects.toBeInstanceOf(McpError);
    await expect(getNodesResource(fakeService)).rejects.toThrow(/Failed to retrieve nodes/);
  });
});
