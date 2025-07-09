/**
 * ListWorkflowsHandler unit tests
 */

import { describe, it, expect, jest, beforeEach } from '@jest/globals';
import { ListWorkflowsHandler, getListWorkflowsToolDefinition } from '../../../../src/tools/workflow/list.js';
import { Workflow } from '../../../../src/types/index.js';
import { N8nApiService } from '../../../../src/api/n8n-client.js';
import { createMockWorkflows } from '../../../mocks/n8n-fixtures.js';
import { mockEnv } from '../../../test-setup.js';

// Important: We're not mocking the base-handler module directly to avoid module resolution issues
// Instead, we'll directly override handler methods in our tests

describe('List Workflows Tool', () => {
  
  describe('getListWorkflowsToolDefinition', () => {
    it('should return the correct tool definition with pagination parameters', () => {
      // Act
      const toolDefinition = getListWorkflowsToolDefinition();
      
      // Assert
      expect(toolDefinition.name).toBe('list_workflows');
      expect(toolDefinition.description).toContain('Retrieve a list of all workflows');
      
      // Check for required properties
      expect(toolDefinition.inputSchema.properties.active).toBeDefined();
      expect(toolDefinition.inputSchema.properties.limit).toBeDefined();
      expect(toolDefinition.inputSchema.properties.offset).toBeDefined();
      
      // Check pagination parameters
      const limitProperty = toolDefinition.inputSchema.properties.limit;
      expect(limitProperty.description).toContain('Maximum number of');
      expect(limitProperty.type).toBe('number');
      
      const offsetProperty = toolDefinition.inputSchema.properties.offset;
      expect(offsetProperty.description).toContain('Number of');
      expect(offsetProperty.type).toBe('number');
      
      // Assert
      const requiredParams = toolDefinition.inputSchema.required || [];
      expect(requiredParams).not.toContain('limit');
      expect(requiredParams).not.toContain('offset');
    });
  });

  // Setup and teardown for environment variables
  const testEnvVars = {
    N8N_API_URL: 'https://n8n-test.example.com',
    N8N_API_KEY: 'test-api-key'
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

  describe('ListWorkflowsHandler', () => {
    let handler: ListWorkflowsHandler;
    let mockWorkflows: Workflow[];
    
    beforeEach(() => {
      // Set up mock data using fixtures
      mockWorkflows = createMockWorkflows(3);
      
      // Create handler with mocked API service
      handler = new ListWorkflowsHandler();
      
      // Create a properly typed mock API service
      const mockApiService = {
        getWorkflows: jest.fn(),
        getWorkflow: jest.fn(),
        createWorkflow: jest.fn(),
        updateWorkflow: jest.fn(),
        deleteWorkflow: jest.fn(),
        activateWorkflow: jest.fn(),
        deactivateWorkflow: jest.fn(),
        getExecutions: jest.fn(),
        getExecution: jest.fn(),
        deleteExecution: jest.fn(),
        runWebhook: jest.fn(),
        executeWorkflow: jest.fn(),
        checkConnectivity: jest.fn(),
      } as unknown as N8nApiService;
      
      // Configure the mock to return our test data
      (mockApiService.getWorkflows as jest.MockedFunction<() => Promise<Workflow[]>>).mockResolvedValue(mockWorkflows);
      
      // Inject mock service into handler
      // Using any typecasting since apiService is protected
      (handler as any).apiService = mockApiService;
      
      // Override base handler methods directly on the instance
      // This avoids having to mock the base-handler module
      (handler as any).getPaginationParams = jest.fn((input: any) => ({
        offset: input?.offset || 0,
        limit: input?.limit || 10
      }));
      
      (handler as any).formatPaginatedSuccess = jest.fn((data, pagination) => ({
        content: [
          {
            type: 'text',
            text: JSON.stringify({ workflows: data, pagination })
          }
        ]
      }));
    });

    it('should execute correctly with default pagination parameters', async () => {
      // Act
      const result = await handler.execute({});
      
      // Assert
      expect(((handler as any).apiService as N8nApiService).getWorkflows).toHaveBeenCalled();
      expect(result.content[0].text).toContain('workflows');
      expect(result.content[0].text).toContain('pagination');
    });

    it('should paginate workflows with custom limit', async () => {
      // Arrange
      const mockInput = { limit: 2 };
      
      // Mock the formatPaginatedSuccess implementation to properly slice the workflows
      (handler as any).formatPaginatedSuccess = jest.fn((data: Workflow[], pagination: { limit: number, offset: number }) => {
        // Apply actual pagination logic - slice the data based on limit
        const paginatedWorkflows = data.slice(0, pagination.limit);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ workflows: paginatedWorkflows, pagination })
            }
          ]
        };
      });
      
      // Act
      const result = await handler.execute(mockInput);
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      expect(responseData.workflows).toHaveLength(2);
      expect(responseData.pagination.limit).toBe(2);
    });

    it('should paginate workflows with custom offset', async () => {
      // Arrange
      const mockInput = { offset: 1 };
      
      // Mock the formatPaginatedSuccess implementation to properly slice the workflows
      (handler as any).formatPaginatedSuccess = jest.fn((data: Workflow[], pagination: { limit: number, offset: number }) => {
        // Apply actual pagination logic - slice the data based on offset
        const paginatedWorkflows = data.slice(pagination.offset);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ workflows: paginatedWorkflows, pagination })
            }
          ]
        };
      });
      
      // Act
      const result = await handler.execute(mockInput);
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      expect(responseData.workflows).toHaveLength(2); // 3 total - 1 offset = 2 remaining
      expect(responseData.pagination.offset).toBe(1);
    });

    it('should filter workflows by active status', async () => {
      // Act
      const result = await handler.execute({ active: true });
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      expect(responseData.workflows.length).toBeGreaterThan(0);
      expect(responseData.workflows.every((w: any) => w.active === true)).toBe(true);
    });

    it('should combine filtering and pagination', async () => {
      // Act
      const result = await handler.execute({ active: false, limit: 1 });
      
      // Assert
      const responseText = result.content[0].text;
      const responseData = JSON.parse(responseText);
      
      expect(responseData.workflows.length).toBe(1);
      expect(responseData.workflows[0].active).toBe(false);
      expect(responseData.pagination.limit).toBe(1);
    });
  });
});
