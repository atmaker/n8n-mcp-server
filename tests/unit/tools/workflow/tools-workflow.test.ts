/**
 * Workflow tools handler tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ListWorkflowsHandler } from '../../../../src/tools/workflow/list.js';
import { CreateWorkflowHandler } from '../../../../src/tools/workflow/create.js';
import { UpdateWorkflowHandler } from '../../../../src/tools/workflow/update.js';
import { ActivateWorkflowHandler } from '../../../../src/tools/workflow/activate.js';
import { DeactivateWorkflowHandler } from '../../../../src/tools/workflow/deactivate.js';
import { DeleteWorkflowHandler } from '../../../../src/tools/workflow/delete.js';
import { N8nApiError } from '../../../../src/errors/index.js';

const fakeService: any = {
  getWorkflowsPage: jest.fn(),
  createWorkflow: jest.fn(),
  getWorkflow: jest.fn(),
  updateWorkflow: jest.fn(),
  activateWorkflow: jest.fn(),
  deactivateWorkflow: jest.fn(),
  deleteWorkflow: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Workflow Tools', () => {
  it('list_workflows returns formatted data and hasMore when nextCursor exists', async () => {
    fakeService.getWorkflowsPage.mockResolvedValueOnce({
      data: [
        { id: '1', name: 'W1', active: false, updatedAt: '2024-01-01T00:00:00Z' },
        { id: '2', name: 'W2', active: true, updatedAt: '2024-01-02T00:00:00Z' },
      ],
      nextCursor: 'cur2',
    });

    const handler = new ListWorkflowsHandler(fakeService);
    const result = await handler.execute({ limit: 2, cursor: 'cur1', active: true, name: 'W', tags: 'tag', projectId: 'p1', excludePinnedData: true });

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.workflows).toHaveLength(2);
    expect(payload.hasMore).toBe(true);
    expect(payload.nextCursor).toBe('cur2');
  });

  it('create_workflow validates inputs and returns created summary', async () => {
    // success
    fakeService.createWorkflow.mockResolvedValueOnce({ id: '10', name: 'MyWF', active: false });

    const handler = new CreateWorkflowHandler(fakeService);
    const result = await handler.execute({ name: 'MyWF', nodes: [], connections: {}, active: true, tags: ['x'] });

    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.id).toBe('10');

    // missing name -> error
    const bad = await handler.execute({});
    expect(bad.isError).toBe(true);
    expect(bad.content[0].text).toMatch(/Missing required parameter: name/);

    // invalid nodes type
    const badNodes = await handler.execute({ name: 'X', nodes: {} });
    expect(badNodes.isError).toBe(true);
    expect(badNodes.content[0].text).toMatch(/nodes/);

    // invalid connections type
    const badConn = await handler.execute({ name: 'X', connections: 'str' });
    expect(badConn.isError).toBe(true);
    expect(badConn.content[0].text).toMatch(/connections/);
  });

  it('update_workflow validates inputs, computes changes and warns on read-only', async () => {
    fakeService.getWorkflow.mockResolvedValueOnce({
      id: '11', name: 'Old', active: false, nodes: [], connections: {}, settings: {}, staticData: { k: 1 },
    });
    fakeService.updateWorkflow.mockResolvedValueOnce({ id: '11', name: 'New', active: false });

    const handler = new UpdateWorkflowHandler(fakeService);
    const result = await handler.execute({ workflowId: '11', name: 'New', active: true, tags: ['a'] });

    const text = result.content[0].text;
    expect(text).toMatch(/Workflow updated successfully/);
    expect(text).toMatch(/Changes: name/);
    expect(text).toMatch(/Ignored active/);

    // missing id -> error
    const bad = await handler.execute({});
    expect(bad.isError).toBe(true);
    expect(bad.content[0].text).toMatch(/workflowId/);

    // invalid nodes type
    const badNodes = await handler.execute({ workflowId: '11', nodes: {} });
    expect(badNodes.isError).toBe(true);

    // invalid connections type
    const badConn = await handler.execute({ workflowId: '11', connections: 'x' });
    expect(badConn.isError).toBe(true);
  });

  it('activate_workflow and deactivate_workflow handle missing id and success', async () => {
    // activate: missing id
    const hA = new ActivateWorkflowHandler(fakeService);
    const badA = await hA.execute({});
    expect(badA.isError).toBe(true);

    // activate: success
    fakeService.activateWorkflow.mockResolvedValueOnce({ id: '1', name: 'X', active: true });
    const okA = await hA.execute({ workflowId: '1' });
    const payloadA = JSON.parse(okA.content[0].text.split('\n\n').pop() || '{}');
    expect(payloadA.active).toBe(true);

    // deactivate: missing id
    const hD = new DeactivateWorkflowHandler(fakeService);
    const badD = await hD.execute({});
    expect(badD.isError).toBe(true);

    // deactivate: success
    fakeService.deactivateWorkflow.mockResolvedValueOnce({ id: '1', name: 'X', active: false });
    const okD = await hD.execute({ workflowId: '1' });
    const payloadD = JSON.parse(okD.content[0].text.split('\n\n').pop() || '{}');
    expect(payloadD.active).toBe(false);
  });

  it('delete_workflow handles missing id and success', async () => {
    fakeService.getWorkflow.mockResolvedValueOnce({ id: '2', name: 'WF' });
    fakeService.deleteWorkflow.mockResolvedValueOnce(undefined);

    const handler = new DeleteWorkflowHandler(fakeService);

    const bad = await handler.execute({});
    expect(bad.isError).toBe(true);

    const ok = await handler.execute({ workflowId: '2' });
    const payload = JSON.parse(ok.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.id).toBe('2');
  });
});
