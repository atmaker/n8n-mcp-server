/**
 * ListExecutionsHandler unit tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ListExecutionsHandler, getListExecutionsToolDefinition } from '../../../../src/tools/execution/list.js';
import { Execution } from '../../../../src/types/index.js';
import { N8nApiService } from '../../../../src/api/n8n-client.js';
import { createMockExecutions } from '../../../mocks/n8n-fixtures.js';

// Important: We're not mocking the base-handler module directly to avoid module resolution issues
// Instead, we'll directly override handler methods in our tests

// Setup and teardown for environment variables
const testEnvVars = {
  N8N_API_URL: 'https://n8n-test.example.com',
  N8N_API_KEY: 'test-api-key',
  N8N_WEBHOOK_USERNAME: 'test-user',
  N8N_WEBHOOK_PASSWORD: 'test-password'
};

// Store original environment
const originalEnv = { ...process.env };

beforeEach(() => {
  // Set required environment variables for tests
  process.env = { ...originalEnv, ...testEnvVars };
});

afterEach(() => {
  // Restore original environment after each test
  process.env = originalEnv;
});

describe('List Executions Tool', () => {
  
  describe('getListExecutionsToolDefinition', () => {
    it('should return the correct tool definition with pagination parameters', () => {
      // Act
      const toolDefinition = getListExecutionsToolDefinition();
      
      // Assert
      expect(toolDefinition.name).toBe('list_executions');
      expect(toolDefinition.description).toContain('Retrieve a list of workflow executions');
      expect(toolDefinition.inputSchema.properties.workflowId).toBeDefined();
      expect(toolDefinition.inputSchema.properties.status).toBeDefined();
      expect(toolDefinition.inputSchema.properties.limit).toBeDefined();
      expect(toolDefinition.inputSchema.properties.offset).toBeDefined();
      
      // Check pagination parameters
      const limitProperty = toolDefinition.inputSchema.properties.limit;
      expect(limitProperty.description).toContain('Maximum number of executions');
      expect(limitProperty.type).toBe('number');
      
      const offsetProperty = toolDefinition.inputSchema.properties.offset;
      expect(offsetProperty.description).toContain('Number of items to skip');
      expect(offsetProperty.type).toBe('number');
      
      // Check for summary parameter
      expect(toolDefinition.inputSchema.properties.includeSummary).toBeDefined();
      expect(toolDefinition.inputSchema.properties.includeSummary.type).toBe('boolean');
    });
  });
  
  describe('ListExecutionsHandler', () => {
    let handler: ListExecutionsHandler;
    let mockExecutions: Execution[];
    
    beforeEach(() => {
      // Set up mock data using fixtures
      mockExecutions = createMockExecutions(3);
      
      // Create handler with mocked API service
      handler = new ListExecutionsHandler();
      
      // Create a properly typed mock API service
      const mockApiService = {
        getExecutions: jest.fn(),
        getWorkflows: jest.fn(),
        getWorkflow: jest.fn(),
        createWorkflow: jest.fn(),
        updateWorkflow: jest.fn(),
        deleteWorkflow: jest.fn(),
        activateWorkflow: jest.fn(),
        deactivateWorkflow: jest.fn(),
        getExecution: jest.fn(),
        deleteExecution: jest.fn(),
        runWebhook: jest.fn(),
        executeWorkflow: jest.fn(),
        checkConnectivity: jest.fn(),
      } as unknown as N8nApiService;
      
      // Configure the mock to return our test data
      (mockApiService.getExecutions as jest.MockedFunction<() => Promise<Execution[]>>).mockResolvedValue(mockExecutions);
      
      // Inject mock service into handler
      (handler as any).apiService = mockApiService;
      
      // Override base handler methods directly on the instance
      // This avoids having to mock the base-handler module
      (handler as any).getPaginationParams = jest.fn((input: any) => ({
        offset: input?.offset || 0,
        limit: input?.limit || 10
      }));
      
      (handler as any).formatPaginatedSuccess = jest.fn((data: any, pagination: any, summary?: any) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ executions: data, pagination, ...(summary ? { summary } : {}) })
          }
        ]
      }));
    });

    it('should execute correctly with default pagination parameters', async () => {
      // Act
      const result = await handler.execute({});
      
      // Assert
      // Access protected property via type casting
      expect((handler as any).apiService.getExecutions).toHaveBeenCalled();
      expect(result.content[0].text).toContain('executions');
      expect(result.content[0].text).toContain('pagination');
    });

    it('should filter executions by workflowId', async () => {
      // Get a workflowId from our mock data
      const targetWorkflowId = mockExecutions[0].workflowId;
      
      // Act
      const result = await handler.execute({ workflowId: targetWorkflowId });
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      // Verify the API service was called to get all executions
      expect((handler as any).apiService.getExecutions).toHaveBeenCalled();
      
      // Verify that the response only contains executions with the target workflow ID
      expect(responseData.executions.length).toBeGreaterThan(0);
      expect(responseData.executions.every((e: any) => e.workflowId === targetWorkflowId)).toBe(true);
    });

    it('should filter executions by status', async () => {
      // Act - Use 'error' status because our fixture creates one execution with this status
      const result = await handler.execute({ status: 'error' });
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      
      // Verify the API service was called to get all executions
      expect((handler as any).apiService.getExecutions).toHaveBeenCalled();
      
      // Verify that the response only contains executions with the error status
      // Note: The formatter adds emoji prefixes to status, so we check if status contains 'error'
      expect(responseData.executions.length).toBeGreaterThan(0);
      expect(responseData.executions.every((e: any) => e.status.includes('error'))).toBe(true);
    });

    it('should include summary data when requested', async () => {
      // Act
      const result = await handler.execute({ includeSummary: true });
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      expect(responseData.summary).toBeDefined();
    });
  });
});
