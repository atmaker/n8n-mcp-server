/**
 * Nodes Tools Module
 */

import { ToolDefinition } from '../../types/index.js';
import { getListNodesToolDefinition, ListNodesHandler } from './list.js';
import { getGetNodeToolDefinition, GetNodeHandler } from './get.js';
import { getListNodeCategoriesToolDefinition, ListNodeCategoriesHandler } from './categories.js';

export async function setupNodesTools(): Promise<ToolDefinition[]> {
  return [
    getListNodesToolDefinition(),
    getGetNodeToolDefinition(),
    getListNodeCategoriesToolDefinition(),
  ];
}

export {
  ListNodesHandler,
  GetNodeHandler,
  ListNodeCategoriesHandler,
};
