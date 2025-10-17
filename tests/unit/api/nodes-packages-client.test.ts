/**
 * N8nApiClient unit tests for Nodes and Community Packages endpoints
 */

import { jest } from '@jest/globals';
import axios from 'axios';
import { N8nApiClient } from '../../../src/api/client.js';
import { EnvConfig } from '../../../src/config/environment.js';
import { createMockAxiosInstance } from '../../mocks/axios-mock.js';

// We'll spy on axios.create per-test for ESM compatibility

describe('N8nApiClient - Nodes & Community Packages', () => {
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

  it('getNodesPage should return data and nextCursor', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('get', '/nodes', {
      status: 200,
      data: { data: [{ type: 'n8n-nodes-base.httpRequest' }], nextCursor: 'abc' },
    });

    const res = await client.getNodesPage({ limit: 10 });
    expect(res.data).toHaveLength(1);
    expect(res.nextCursor).toBe('abc');
  });

  it('getNode should return detail payload', async () => {
    const client = new N8nApiClient(mockConfig);
    const nodeType = 'n8n-nodes-base.httpRequest';
    mockAxios.addMockResponse('get', `/nodes/${encodeURIComponent(nodeType)}`, {
      status: 200,
      data: { node: { type: nodeType }, installedPackages: [] },
    });

    const res = await client.getNode(nodeType);
    expect(res.node.type).toBe(nodeType);
    expect(Array.isArray(res.installedPackages)).toBe(true);
  });

  it('getNodeCategoriesPage should return categories and nextCursor', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('get', '/nodes/categories', {
      status: 200,
      data: { data: ['Productivity', 'Core'], nextCursor: null },
    });

    const res = await client.getNodeCategoriesPage({ limit: 5 });
    expect(res.data).toContain('Productivity');
    expect(res.nextCursor).toBeNull();
  });

  it('listCommunityPackages should return list', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('get', '/community-packages', {
      status: 200,
      data: { data: [{ packageName: 'n8n-nodes-foo', installedVersion: '1.0.0', updateAvailable: false }] },
    });

    const res = await client.listCommunityPackages();
    expect(res[0].packageName).toBe('n8n-nodes-foo');
  });

  it('installCommunityPackage should return message', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('post', '/community-packages', {
      status: 200,
      data: { message: 'Installation started for n8n-nodes-foo' },
    });

    const res = await client.installCommunityPackage({ name: 'n8n-nodes-foo' });
    expect(res.message).toMatch(/Installation started/);
  });

  it('updateCommunityPackage should return message', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('patch', '/community-packages', {
      status: 200,
      data: { message: 'Update started for n8n-nodes-foo' },
    });

    const res = await client.updateCommunityPackage({ name: 'n8n-nodes-foo', version: '1.2.3' });
    expect(res.message).toMatch(/Update started/);
  });

  it('uninstallCommunityPackage should return message', async () => {
    const client = new N8nApiClient(mockConfig);
    mockAxios.addMockResponse('delete', '/community-packages', {
      status: 200,
      data: { message: 'Uninstallation started for n8n-nodes-foo' },
    });

    const res = await client.uninstallCommunityPackage('n8n-nodes-foo');
    expect(res.message).toMatch(/Uninstallation started/);
  });
});
