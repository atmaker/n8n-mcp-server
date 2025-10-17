/**
 * N8nApiClient unit tests for Workflows & Executions endpoints
 */

import { jest, describe, it, expect, beforeEach, afterEach } from '@jest/globals';
import axios from 'axios';
import { N8nApiClient } from '../../../src/api/client.js';
import { EnvConfig } from '../../../src/config/environment.js';
import { createMockAxiosInstance, createMockAxiosResponse } from '../../mocks/axios-mock.js';

const mockConfig: EnvConfig = {
  n8nApiUrl: 'https://n8n.example.com/api/v1',
  n8nApiKey: 'test-api-key',
  debug: false,
};

let mockAxios: any;

beforeEach(() => {
  mockAxios = createMockAxiosInstance();
  jest.spyOn(axios as any, 'create').mockReturnValue(mockAxios);
});

afterEach(() => {
  jest.clearAllMocks();
  jest.restoreAllMocks();
  mockAxios.reset();
});

describe('N8nApiClient - Workflows & Executions', () => {
  it('checkConnectivity succeeds on 200 and fails on non-200', async () => {
    const client = new N8nApiClient(mockConfig);

    // success 200
    mockAxios.addMockResponse('get', '/workflows', { status: 200, data: { data: [] } });
    await expect(client.checkConnectivity()).resolves.toBeUndefined();

    // non-200 -> error
    mockAxios.addMockResponse('get', '/workflows', { status: 500, data: {} });
    await expect(client.checkConnectivity()).rejects.toThrow(/connectivity check failed/);
  });

  it('getWorkflows and getWorkflowsPage return data and handle errors', async () => {
    const client = new N8nApiClient(mockConfig);

    // getWorkflows success
    mockAxios.addMockResponse('get', '/workflows', { status: 200, data: { data: [{ id: 'w1' }] } });
    const all = await client.getWorkflows();
    expect(all[0].id).toBe('w1');

    // getWorkflowsPage success
    mockAxios.addMockResponse('get', '/workflows', { status: 200, data: { data: [{ id: 'w2' }], nextCursor: 'c2' } });
    const page = await client.getWorkflowsPage({ limit: 1 });
    expect(page.data[0].id).toBe('w2');
    expect(page.nextCursor).toBe('c2');

    // getWorkflowsPage error (throw)
    mockAxios.addMockResponse('get', '/workflows', new Error('Request failed'));
    await expect(client.getWorkflowsPage({ limit: 1 })).rejects.toThrow(/Request failed/);
  });

  it('getWorkflow returns detail and handles 404', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('get', '/workflows/w1', { status: 200, data: { id: 'w1', name: 'W' } });
    const wf = await client.getWorkflow('w1');
    expect(wf.id).toBe('w1');

    // 404 error (throw)
    mockAxios.addMockResponse('get', '/workflows/w2', new Error('not found'));
    await expect(client.getWorkflow('w2')).rejects.toThrow(/not found/);
  });

  it('createWorkflow adds defaults and strips read-only props', async () => {
    const client = new N8nApiClient({ ...mockConfig, debug: true });

    const req = {
      id: 'shouldBeRemoved',
      name: 'X',
      active: true,
      tags: ['t'],
      createdAt: 'today',
      updatedAt: 'now',
      nodes: [],
      connections: {},
    } as any;

    const expected = {
      name: 'X',
      nodes: [],
      connections: {},
      settings: expect.any(Object),
    };

    mockAxios.addMockResponse('post', '/workflows', { status: 200, data: { id: 'w3', name: 'X' } });
    const res = await client.createWorkflow(req);
    expect(res.id).toBe('w3');

    // Ensure axios.post was called with stripped payload
    const history = mockAxios.getRequestHistory('post', '/workflows');
    expect(history.length).toBe(1);
    expect(history[0]).toMatchObject(expected);
  });

  it('updateWorkflow strips read-only and calls PUT', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('put', '/workflows/w1', { status: 200, data: { id: 'w1', name: 'Y' } });

    const res = await client.updateWorkflow('w1', {
      id: 'shouldRemove',
      name: 'Y',
      active: true,
      createdAt: 'x',
      updatedAt: 'y',
      tags: ['t'],
      nodes: [],
      connections: {},
    });
    expect(res.name).toBe('Y');

    const history = mockAxios.getRequestHistory('put', '/workflows/w1');
    expect(history[0]).toMatchObject({ name: 'Y', nodes: [], connections: {} });
    expect(history[0]).not.toHaveProperty('active');
    expect(history[0]).not.toHaveProperty('id');
  });

  it('deleteWorkflow, activateWorkflow, deactivateWorkflow succeed', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('delete', '/workflows/w1', { status: 200, data: { ok: true } });
    const del = await client.deleteWorkflow('w1');
    expect(del.ok).toBe(true);

    mockAxios.addMockResponse('post', '/workflows/w1/activate', { status: 200, data: { id: 'w1', active: true } });
    const act = await client.activateWorkflow('w1');
    expect(act.active).toBe(true);

    mockAxios.addMockResponse('post', '/workflows/w1/deactivate', { status: 200, data: { id: 'w1', active: false } });
    const de = await client.deactivateWorkflow('w1');
    expect(de.active).toBe(false);
  });

  it('getExecutions, getExecutionsPage and getExecution work; deleteExecution deletes', async () => {
    const client = new N8nApiClient(mockConfig);

    mockAxios.addMockResponse('get', '/executions', { status: 200, data: { data: [{ id: 'e1' }] } });
    const list = await client.getExecutions();
    expect(list[0].id).toBe('e1');

    mockAxios.addMockResponse('get', '/executions', { status: 200, data: { data: [{ id: 'e2' }], nextCursor: 'nc' } });
    const page = await client.getExecutionsPage({ limit: 1 });
    expect(page.data[0].id).toBe('e2');
    expect(page.nextCursor).toBe('nc');

    mockAxios.addMockResponse('get', '/executions/e1', { status: 200, data: { id: 'e1' } });
    const ex = await client.getExecution('e1');
    expect(ex.id).toBe('e1');

    mockAxios.addMockResponse('delete', '/executions/e1', { status: 200, data: { deleted: true } });
    const del = await client.deleteExecution('e1');
    expect(del.deleted).toBe(true);
  });

  it('executeWorkflow posts data and returns result', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('post', '/workflows/w1/execute', { status: 200, data: { started: true } });
    const res = await client.executeWorkflow('w1', { a: 1 });
    expect(res.started).toBe(true);

    const history = mockAxios.getRequestHistory('post', '/workflows/w1/execute');
    expect(history[0]).toEqual({ a: 1 });
  });
});
