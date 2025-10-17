/**
 * Core Types Module
 * 
 * This module provides type definitions used throughout the application
 * and bridges compatibility with the MCP SDK.
 */

// Tool definition for MCP tools
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: string;
    properties: Record<string, any>;
    required?: string[];
  };
}

// Tool call result for MCP tool responses
export interface ToolCallResult {
  content: Array<{
    type: string;
    text: string;
  }>;
  isError?: boolean;
}

// Type for n8n workflow object
export interface Workflow {
  id: string;
  name: string;
  active: boolean;
  nodes: any[];
  connections: any;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

// Type for n8n execution object
export interface Execution {
  id: string;
  workflowId: string;
  finished: boolean;
  mode: string;
  startedAt: string;
  stoppedAt: string;
  status: string;
  data: {
    resultData: {
      runData: any;
    };
  };
  [key: string]: any;
}

// Types for n8n nodes and community packages

// Minimal representation of an installed node as returned by /nodes
export interface InstalledNode {
  type: string; // e.g., n8n-nodes-base.httpRequest
  displayName?: string;
  version?: string | number;
  categories?: string[];
  icon?: string;
  [key: string]: any;
}

// Minimal representation of an installed package entry
export interface InstalledPackage {
  packageName: string;
  installedVersion: string;
  updateAvailable?: boolean;
  [key: string]: any;
}

// Node detail response from /nodes/{nodeType}
export interface NodeDetail {
  node: InstalledNode;
  installedPackages: InstalledPackage[];
}

// Community package entry in /community-packages
export interface CommunityPackage {
  packageName: string;
  installedVersion: string;
  updateAvailable: boolean;
}
