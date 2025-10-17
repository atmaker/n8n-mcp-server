/**
 * Community tools error handling tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { ListCommunityPackagesHandler } from '../../../../src/tools/community/list.js';
import { N8nApiError } from '../../../../src/errors/index.js';

const fakeService: any = {
  listCommunityPackages: jest.fn(),
};

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Community Tools - Friendly Errors', () => {
  it('returns friendly auth error with tips', async () => {
    fakeService.listCommunityPackages.mockRejectedValueOnce(new N8nApiError('Unauthorized', 401));

    const handler = new ListCommunityPackagesHandler(fakeService);
    const result = await handler.execute({});

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toMatch(/Authentication failed for n8n API/);
    expect(text).toMatch(/N8N_API_KEY/);
  });

  it('returns friendly network error with tips', async () => {
    fakeService.listCommunityPackages.mockRejectedValueOnce(
      new N8nApiError('Network error connecting to n8n API', undefined, 'ECONNREFUSED')
    );

    const handler = new ListCommunityPackagesHandler(fakeService);
    const result = await handler.execute({});

    expect(result.isError).toBe(true);
    const text = result.content[0].text;
    expect(text).toMatch(/Network error connecting to n8n API/);
    expect(text).toMatch(/N8N_API_URL/);
    expect(text).toMatch(/Docker/);
  });
});
