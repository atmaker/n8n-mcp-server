/**
 * Static Execution Stats Resource tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpError } from '../../../../src/errors/index.js';
import { getExecutionStatsResource } from '../../../../src/resources/static/execution-stats.js';

const fakeService: any = {
  getExecutions: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Static Resource: Execution Stats', () => {
  it('returns formatted execution-stats resource on success', async () => {
    fakeService.getExecutions.mockResolvedValueOnce([
      { id: 'e1', workflowId: 'w1', status: 'success', startedAt: '2024-01-01T00:00:00Z', stoppedAt: '2024-01-01T00:00:10Z' },
      { id: 'e2', workflowId: 'w1', status: 'error', startedAt: '2024-01-01T00:01:00Z', stoppedAt: '2024-01-01T00:01:05Z' },
    ]);

    const text = await getExecutionStatsResource(fakeService);
    const payload = JSON.parse(text);

    expect(payload.resourceType).toBe('execution-stats');
    expect(payload.total).toBe(2);
    expect(Array.isArray(payload.byStatus)).toBe(true);
    expect(payload._links.self).toBe('n8n://execution-stats');
  });

  it('wraps generic errors into McpError', async () => {
    fakeService.getExecutions.mockRejectedValueOnce(new Error('boom'));

    await expect(getExecutionStatsResource(fakeService)).rejects.toBeInstanceOf(McpError);
    await expect(getExecutionStatsResource(fakeService)).rejects.toThrow(/Failed to retrieve execution statistics/);
  });
});
