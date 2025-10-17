/**
 * Dynamic Node Resource tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpError, ErrorCode } from '../../../../src/errors/index.js';
import { getNodeResource } from '../../../../src/resources/dynamic/node.js';

const fakeService: any = {
  getNode: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Dynamic Resource: n8n Node', () => {
  it('returns detailed node resource on success', async () => {
    fakeService.getNode.mockResolvedValueOnce({
      node: { type: 'a.node', displayName: 'A' },
      installedPackages: [{ name: 'pkg' }],
    });

    const text = await getNodeResource(fakeService, 'a.node');
    const payload = JSON.parse(text);

    expect(payload.resourceType).toBe('node');
    expect(payload.nodeType).toBe('a.node');
    expect(payload.node.type).toBe('a.node');
    expect(Array.isArray(payload.installedPackages)).toBe(true);
    expect(payload._links.self).toContain('n8n://nodes/');
    expect(payload._links.list).toBe('n8n://nodes');
    expect(typeof payload.lastUpdated).toBe('string');
  });

  it('passes through McpError (e.g., 404 Not Found)', async () => {
    fakeService.getNode.mockRejectedValue(new McpError(ErrorCode.NotFoundError, 'not found'));

    await expect(getNodeResource(fakeService, 'missing.node')).rejects.toBeInstanceOf(McpError);
    await expect(getNodeResource(fakeService, 'missing.node')).rejects.toThrow(/not found/);
  });

  it('wraps generic errors into McpError with helpful message', async () => {
    fakeService.getNode.mockRejectedValueOnce(new Error('boom'));

    await expect(getNodeResource(fakeService, 'a.node')).rejects.toBeInstanceOf(McpError);
    await expect(getNodeResource(fakeService, 'a.node')).rejects.toThrow(/Failed to retrieve node/);
  });
});
