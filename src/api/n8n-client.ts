/**
 * n8n API Client Interface
 * 
 * This module defines interfaces and types for the n8n API client.
 */

import { N8nApiClient } from './client.js';
import { EnvConfig } from '../config/environment.js';
import { Workflow, Execution, InstalledNode, NodeDetail, CommunityPackage } from '../types/index.js';

/**
 * n8n API service - provides functions for interacting with n8n API
 */
export class N8nApiService {
  private client: N8nApiClient;

  /**
   * Create a new n8n API service
   * 
   * @param config Environment configuration
   */
  constructor(config: EnvConfig) {
    this.client = new N8nApiClient(config);
  }

  /**
   * Check connectivity to the n8n API
   */
  async checkConnectivity(): Promise<void> {
    return this.client.checkConnectivity();
  }

  /**
   * Get all workflows from n8n
   * 
   * @returns Array of workflow objects
   */
  async getWorkflows(): Promise<Workflow[]> {
    return this.client.getWorkflows();
  }

  /**
   * Get a page of workflows using cursor-based pagination
   *
   * @param params Optional query parameters (limit, cursor, active, name, tags, projectId, excludePinnedData)
   * @returns Page data and nextCursor
   */
  async getWorkflowsPage(params: {
    limit?: number;
    cursor?: string;
    active?: boolean;
    name?: string;
    tags?: string;
    projectId?: string;
    excludePinnedData?: boolean;
  } = {}): Promise<{ data: Workflow[]; nextCursor: string | null }> {
    return this.client.getWorkflowsPage(params);
  }

  /**
   * Get a specific workflow by ID
   * 
   * @param id Workflow ID
   * @returns Workflow object
   */
  async getWorkflow(id: string): Promise<Workflow> {
    return this.client.getWorkflow(id);
  }

  /**
   * Execute a workflow by ID
   * 
   * @param id Workflow ID
   * @param data Optional data to pass to the workflow
   * @returns Execution result
   */
  async executeWorkflow(id: string, data?: Record<string, any>): Promise<any> {
    return this.client.executeWorkflow(id, data);
  }

  /**
   * Create a new workflow
   * 
   * @param workflow Workflow object to create
   * @returns Created workflow
   */
  async createWorkflow(workflow: Record<string, any>): Promise<Workflow> {
    return this.client.createWorkflow(workflow);
  }

  /**
   * Update an existing workflow
   * 
   * @param id Workflow ID
   * @param workflow Updated workflow object
   * @returns Updated workflow
   */
  async updateWorkflow(id: string, workflow: Record<string, any>): Promise<Workflow> {
    return this.client.updateWorkflow(id, workflow);
  }

  /**
   * Delete a workflow
   * 
   * @param id Workflow ID
   * @returns Deleted workflow or success message
   */
  async deleteWorkflow(id: string): Promise<any> {
    return this.client.deleteWorkflow(id);
  }

  /**
   * Activate a workflow
   * 
   * @param id Workflow ID
   * @returns Activated workflow
   */
  async activateWorkflow(id: string): Promise<Workflow> {
    return this.client.activateWorkflow(id);
  }

  /**
   * Deactivate a workflow
   * 
   * @param id Workflow ID
   * @returns Deactivated workflow
   */
  async deactivateWorkflow(id: string): Promise<Workflow> {
    return this.client.deactivateWorkflow(id);
  }

  /**
   * Get all workflow executions
   * 
   * @returns Array of execution objects
   */
  async getExecutions(): Promise<Execution[]> {
    return this.client.getExecutions();
  }

  /**
   * Get a page of executions using cursor-based pagination
   *
   * @param params Optional query parameters (limit, cursor, workflowId, status, projectId, includeData)
   * @returns Page data and nextCursor
   */
  async getExecutionsPage(params: {
    limit?: number;
    cursor?: string;
    workflowId?: string;
    status?: 'error' | 'success' | 'waiting' | 'canceled';
    projectId?: string;
    includeData?: boolean;
  } = {}): Promise<{ data: Execution[]; nextCursor: string | null }> {
    return this.client.getExecutionsPage(params);
  }

  /**
   * Get a specific execution by ID
   * 
   * @param id Execution ID
   * @returns Execution object
   */
  async getExecution(id: string): Promise<Execution> {
    return this.client.getExecution(id);
  }
  
  /**
   * Delete an execution
   * 
   * @param id Execution ID
   * @returns Deleted execution or success message
   */
  async deleteExecution(id: string): Promise<any> {
    return this.client.deleteExecution(id);
  }

  // ===================== Nodes =====================

  /**
   * Get a page of installed nodes.
   */
  async getNodesPage(params: {
    nodeType?: string;
    limit?: number;
    cursor?: string;
    sort?: string;
    order?: 'asc' | 'desc';
  } = {}): Promise<{ data: InstalledNode[]; nextCursor: string | null }> {
    return this.client.getNodesPage(params);
  }

  /**
   * Get details of a specific installed node.
   */
  async getNode(nodeType: string): Promise<NodeDetail> {
    return this.client.getNode(nodeType);
  }

  /**
   * Get a page of node categories.
   */
  async getNodeCategoriesPage(params: {
    limit?: number;
    cursor?: string;
    sort?: 'name';
    order?: 'asc' | 'desc';
  } = {}): Promise<{ data: string[]; nextCursor: string | null }> {
    return this.client.getNodeCategoriesPage(params);
  }

  // ============ Community Packages ============

  /**
   * List installed community packages.
   */
  async listCommunityPackages(): Promise<CommunityPackage[]> {
    return this.client.listCommunityPackages();
  }

  /**
   * Install a community package.
   */
  async installCommunityPackage(body: { name: string; version?: string; checksum?: string }): Promise<{ message: string }> {
    return this.client.installCommunityPackage(body);
  }

  /**
   * Update a community package.
   */
  async updateCommunityPackage(body: { name: string; version?: string; checksum?: string }): Promise<{ message: string }> {
    return this.client.updateCommunityPackage(body);
  }

  /**
   * Uninstall a community package.
   */
  async uninstallCommunityPackage(name: string): Promise<{ message: string }> {
    return this.client.uninstallCommunityPackage(name);
  }
}

/**
 * Create a new n8n API service
 * 
 * @param config Environment configuration
 * @returns n8n API service
 */
export function createApiService(config: EnvConfig): N8nApiService {
  return new N8nApiService(config);
}
