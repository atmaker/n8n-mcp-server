/**
 * Execution tools handler tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ListExecutionsHandler } from '../../../../src/tools/execution/list.js';
import { DeleteExecutionHandler } from '../../../../src/tools/execution/delete.js';
import { RunWebhookHandler } from '../../../../src/tools/execution/run.js';
import axios from 'axios';

const fakeService: any = {
  getExecutionsPage: jest.fn(),
  deleteExecution: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
  process.env.N8N_API_URL = 'http://localhost:5678/api/v1';
  process.env.N8N_API_KEY = 'test-key';
  process.env.N8N_WEBHOOK_USERNAME = 'user';
  process.env.N8N_WEBHOOK_PASSWORD = 'pass';
});

describe('Execution Tools', () => {
  it('list_executions returns formatted data, summary and hasMore', async () => {
    fakeService.getExecutionsPage.mockResolvedValueOnce({
      data: [
        { id: 'e1', workflowId: 'w1', status: 'success', startedAt: '2024-01-01T00:00:00Z', finishedAt: '2024-01-01T00:00:10Z' },
        { id: 'e2', workflowId: 'w1', status: 'error', startedAt: '2024-01-01T00:01:00Z', finishedAt: '2024-01-01T00:01:05Z' },
      ],
      nextCursor: 'cur3',
    });

    const handler = new ListExecutionsHandler(fakeService);
    const result = await handler.execute({ limit: 2, cursor: 'cur2', workflowId: 'w1', status: 'success', includeSummary: true });

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.executions.length).toBe(2);
    expect(payload.summary).toBeDefined();
    expect(payload.hasMore).toBe(true);
  });

  it('delete_execution handles missing id and success', async () => {
    fakeService.deleteExecution.mockResolvedValueOnce(undefined);

    const handler = new DeleteExecutionHandler(fakeService);

    const bad = await handler.execute({});
    expect(bad.isError).toBe(true);

    const ok = await handler.execute({ executionId: 'e1' });
    const payload = JSON.parse(ok.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.deleted).toBe(true);
  });

  it('run_webhook executes successfully', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockResolvedValueOnce({ status: 200, statusText: 'OK', data: { ok: true } } as any);

    const handler = new RunWebhookHandler();
    const result = await handler.execute({ workflowName: 'hello-world', data: { a: 1 }, headers: { 'X-Test': '1' } });

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.status).toBe(200);
  });

  it('run_webhook returns friendly error when webhook credentials missing', async () => {
    delete process.env.N8N_WEBHOOK_USERNAME; delete process.env.N8N_WEBHOOK_PASSWORD;

    const handler = new RunWebhookHandler();
    const res = await handler.execute({ workflowName: 'hello-world' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/Webhook username and password are required/);
  });

  it('run_webhook returns API error details on axios error response', async () => {
    const postSpy = jest.spyOn(axios, 'post').mockRejectedValueOnce({
      isAxiosError: true,
      response: { status: 500, statusText: 'Internal Server Error', data: { error: 'boom' } },
      message: 'Request failed',
    } as any);

    const handler = new RunWebhookHandler();
    const res = await handler.execute({ workflowName: 'hello-world' });
    expect(res.isError).toBe(true);
    expect(res.content[0].text).toMatch(/Webhook execution failed with status 500/);
    expect(res.content[0].text).toMatch(/"error": "boom"/);
    postSpy.mockRestore();
  });
});
