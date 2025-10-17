/**
 * Workflow tools error handling tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { GetWorkflowHandler } from '../../../../src/tools/workflow/get.js';
import { N8nApiError } from '../../../../src/errors/index.js';

const fakeService: any = {
  getWorkflow: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Workflow Tools - Friendly Errors', () => {
  it('returns friendly auth error with tips', async () => {
    fakeService.getWorkflow.mockRejectedValueOnce(new N8nApiError('Unauthorized', 403));

    const handler = new GetWorkflowHandler(fakeService);
    const result = await handler.execute({ workflowId: '123' });

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toMatch(/Authentication failed for n8n API/);
    expect(text).toMatch(/N8N_API_KEY/);
  });

  it('returns friendly network error with tips', async () => {
    fakeService.getWorkflow.mockRejectedValueOnce(
      new N8nApiError('Network error connecting to n8n API', undefined, 'ECONNREFUSED')
    );

    const handler = new GetWorkflowHandler(fakeService);
    const result = await handler.execute({ workflowId: '123' });

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toMatch(/Network error connecting to n8n API/);
    expect(text).toMatch(/N8N_API_URL/);
    expect(text).toMatch(/Docker/);
  });
});
