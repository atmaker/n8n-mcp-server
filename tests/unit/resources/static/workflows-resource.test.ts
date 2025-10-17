/**
 * Static Workflows Resource tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpError } from '../../../../src/errors/index.js';
import { getWorkflowsResource } from '../../../../src/resources/static/workflows.js';

const fakeService: any = {
  getWorkflows: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Static Resource: Workflows', () => {
  it('returns formatted workflows resource on success', async () => {
    fakeService.getWorkflows.mockResolvedValueOnce([
      { id: 'w1', name: 'WF 1', active: true, updatedAt: '2024-01-01', createdAt: '2024-01-01', nodes: [], connections: {}, tags: [] },
      { id: 'w2', name: 'WF 2', active: false, updatedAt: '2024-01-02', createdAt: '2024-01-02', nodes: [], connections: {}, tags: [] },
    ]);

    const text = await getWorkflowsResource(fakeService);
    const payload = JSON.parse(text);

    expect(payload.resourceType).toBe('workflows');
    expect(payload.count).toBe(2);
    expect(Array.isArray(payload.workflows)).toBe(true);
    expect(payload._links.self).toBe('n8n://workflows');
    expect(typeof payload.lastUpdated).toBe('string');
  });

  it('wraps generic errors into McpError', async () => {
    fakeService.getWorkflows.mockRejectedValueOnce(new Error('boom'));

    await expect(getWorkflowsResource(fakeService)).rejects.toBeInstanceOf(McpError);
    await expect(getWorkflowsResource(fakeService)).rejects.toThrow(/Failed to retrieve workflows/);
  });
});
