/**
 * Community packages tools handler tests
 */

import { describe, it, expect, beforeEach, jest } from '@jest/globals';

const fakeService: any = {
  listCommunityPackages: jest.fn(),
  installCommunityPackage: jest.fn(),
  updateCommunityPackage: jest.fn(),
  uninstallCommunityPackage: jest.fn(),
};

import { ListCommunityPackagesHandler } from '../../../../src/tools/community/list.js';
import { InstallCommunityPackageHandler } from '../../../../src/tools/community/install.js';
import { UpdateCommunityPackageHandler } from '../../../../src/tools/community/update.js';
import { UninstallCommunityPackageHandler } from '../../../../src/tools/community/uninstall.js';

beforeEach(() => {
  jest.clearAllMocks();
});

describe('Community Packages Tools', () => {
  it('list_community_packages returns packages', async () => {
    fakeService.listCommunityPackages.mockResolvedValueOnce([
      { packageName: 'n8n-nodes-foo', installedVersion: '1.0.0', updateAvailable: false },
    ]);

    const handler = new ListCommunityPackagesHandler(fakeService);
    const result = await handler.execute({});

    expect(result.isError).toBeUndefined();
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.packages[0].packageName).toBe('n8n-nodes-foo');
    expect(payload.count).toBe(1);
  });

  it('install_community_package triggers install', async () => {
    fakeService.installCommunityPackage.mockResolvedValueOnce({ message: 'Installation started' });

    const handler = new InstallCommunityPackageHandler(fakeService);
    const result = await handler.execute({ name: 'n8n-nodes-foo' });

    expect(fakeService.installCommunityPackage).toHaveBeenCalledWith({ name: 'n8n-nodes-foo' });
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.message).toMatch(/Installation/);
  });

  it('update_community_package triggers update', async () => {
    fakeService.updateCommunityPackage.mockResolvedValueOnce({ message: 'Update started' });

    const handler = new UpdateCommunityPackageHandler(fakeService);
    const result = await handler.execute({ name: 'n8n-nodes-foo', version: '1.2.3' });

    expect(fakeService.updateCommunityPackage).toHaveBeenCalledWith({ name: 'n8n-nodes-foo', version: '1.2.3' });
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.message).toMatch(/Update/);
  });

  it('uninstall_community_package triggers uninstall', async () => {
    fakeService.uninstallCommunityPackage.mockResolvedValueOnce({ message: 'Uninstallation started' });

    const handler = new UninstallCommunityPackageHandler(fakeService);
    const result = await handler.execute({ name: 'n8n-nodes-foo' });

    expect(fakeService.uninstallCommunityPackage).toHaveBeenCalledWith('n8n-nodes-foo');
    const payload = JSON.parse(result.content[0].text.split('\n\n').pop() || '{}');
    expect(payload.message).toMatch(/Uninstallation/);
  });
});
