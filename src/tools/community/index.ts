/**
 * Community Packages Tools Module
 */

import { ToolDefinition } from '../../types/index.js';
import { getListCommunityPackagesToolDefinition, ListCommunityPackagesHandler } from './list.js';
import { getInstallCommunityPackageToolDefinition, InstallCommunityPackageHandler } from './install.js';
import { getUpdateCommunityPackageToolDefinition, UpdateCommunityPackageHandler } from './update.js';
import { getUninstallCommunityPackageToolDefinition, UninstallCommunityPackageHandler } from './uninstall.js';

export async function setupCommunityPackageTools(): Promise<ToolDefinition[]> {
  return [
    getListCommunityPackagesToolDefinition(),
    getInstallCommunityPackageToolDefinition(),
    getUpdateCommunityPackageToolDefinition(),
    getUninstallCommunityPackageToolDefinition(),
  ];
}

export {
  ListCommunityPackagesHandler,
  InstallCommunityPackageHandler,
  UpdateCommunityPackageHandler,
  UninstallCommunityPackageHandler,
};
