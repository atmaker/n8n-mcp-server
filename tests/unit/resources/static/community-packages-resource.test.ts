/**
 * Static Community Packages Resource tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { McpError } from '../../../../src/errors/index.js';
import { getCommunityPackagesResource } from '../../../../src/resources/static/community-packages.js';

const fakeService: any = {
  listCommunityPackages: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Static Resource: Community Packages', () => {
  it('returns formatted community-packages resource on success', async () => {
    fakeService.listCommunityPackages.mockResolvedValueOnce([
      { name: 'pkg-1', version: '1.0.0' },
      { name: 'pkg-2', version: '2.0.0' },
    ]);

    const text = await getCommunityPackagesResource(fakeService);
    const payload = JSON.parse(text);

    expect(payload.resourceType).toBe('community-packages');
    expect(payload.count).toBe(2);
    expect(Array.isArray(payload.packages)).toBe(true);
    expect(payload._links.self).toBe('n8n://community-packages');
    expect(typeof payload.lastUpdated).toBe('string');
  });

  it('wraps generic errors into McpError', async () => {
    fakeService.listCommunityPackages.mockRejectedValueOnce(new Error('boom'));

    await expect(getCommunityPackagesResource(fakeService)).rejects.toBeInstanceOf(McpError);
    await expect(getCommunityPackagesResource(fakeService)).rejects.toThrow(/Failed to retrieve community packages/);
  });
});
