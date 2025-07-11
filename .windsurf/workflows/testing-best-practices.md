---
description: Testing best practices for the n8n MCP Server
---

# Testing Best Practices

This workflow outlines the testing approach and best practices for the n8n MCP Server.

## Setting Up Tests

1. **Create Test Files in Correct Location**
   - Place test files in the `tests` directory mirroring the source structure
   - Name test files with `.test.ts` extension
   
   ```
   src/tools/workflow/list.ts → tests/unit/tools/workflow/list.test.ts
   ```

2. **Test Environment Setup**
   ```typescript
   // tests/unit/tools/category/tool.test.ts
   import { describe, it, expect, jest, beforeEach, afterEach } from '@jest/globals';
   import { mockEnv } from '../../../test-setup.js';
   
   describe('My Tool', () => {
     // Set up environment variables for tests
     beforeEach(() => {
       mockEnv({
         N8N_API_URL: 'https://n8n.example.com/api/v1',
         N8N_API_KEY: 'test-api-key'
       });
     });
     
     // Restore environment after tests
     afterEach(() => {
       mockEnv.restore();
     });
     
     // Tests go here...
   });
   ```

## Using Test Fixtures

1. **Use Fixture Helpers for Common Test Data**
   ```typescript
   // tests/unit/tools/execution/list.test.ts
   import { createMockExecutions } from '../../../mocks/n8n-fixtures.js';
   
   describe('List Executions', () => {
     it('should list executions with filters', async () => {
       // Create mock executions with predefined statuses
       const mockExecutions = createMockExecutions();
       
       const mockClient = {
         getExecutions: jest.fn().mockResolvedValue(mockExecutions)
       };
       
       // Test with the mock data...
     });
   });
   ```

## Mocking Best Practices

1. **Avoid Module Mocking with ES Modules**
   
   **DON'T DO THIS:**
   ```typescript
   // Problematic with ES modules
   jest.mock('../../src/api/n8n-client.js');
   ```
   
   **DO THIS INSTEAD:**
   ```typescript
   // Better approach with direct method overrides
   const handler = new MyHandler();
   // Type cast if accessing protected members
   (handler as any).apiService = mockApiService;
   // Or override methods directly
   handler.executeMethod = jest.fn().mockResolvedValue(mockResult);
   ```

2. **Mock Minimum Required Behavior**
   ```typescript
   // Only mock the methods you need
   const mockClient = {
     getWorkflow: jest.fn().mockResolvedValue({ id: '123', name: 'Test' })
   };
   
   const result = await handleGetWorkflow(mockClient as any, { workflowId: '123' });
   ```

## Testing Error Handling

1. **Simulate API Errors**
   ```typescript
   it('should handle API errors properly', async () => {
     const mockClient = {
       getWorkflow: jest.fn().mockRejectedValue(
         new Error('API error')
       )
     };
     
     await expect(handleGetWorkflow(mockClient as any, { workflowId: '123' }))
       .rejects.toThrow('Failed to retrieve workflow');
   });
   ```

2. **Test Validation Errors**
   ```typescript
   it('should validate input parameters', async () => {
     const mockClient = {};
     
     // Test with invalid parameter
     await expect(handleGetWorkflow(mockClient as any, { workflowId: '' }))
       .rejects.toThrow('Invalid workflow ID');
   });
   ```

## Testing Pagination

1. **Test Different Page Sizes and Offsets**
   ```typescript
   it('should paginate results correctly', async () => {
     const mockItems = Array.from({ length: 20 }, (_, i) => ({ id: i }));
     
     const mockClient = {
       getItems: jest.fn().mockResolvedValue(mockItems)
     };
     
     // Test first page
     const result1 = await handleListTool(mockClient as any, { offset: 0, limit: 10 });
     expect(result1.content).toHaveLength(10);
     expect(result1.metadata.pagination.hasMore).toBe(true);
     
     // Test second page
     const result2 = await handleListTool(mockClient as any, { offset: 10, limit: 10 });
     expect(result2.content).toHaveLength(10);
     expect(result2.metadata.pagination.hasMore).toBe(false);
   });
   ```

## Testing Formatted Output

1. **Test Exact Output Format**
   ```typescript
   it('should format executions correctly', async () => {
     const mockExecution = {
       id: '123',
       status: 'success',
       startedAt: '2023-01-01T12:00:00.000Z',
       stoppedAt: '2023-01-01T12:01:00.000Z'
     };
     
     const mockClient = {
       getExecution: jest.fn().mockResolvedValue(mockExecution)
     };
     
     const result = await handleGetExecution(mockClient as any, { executionId: '123' });
     
     // Check for emoji prefix in status
     expect(result.content.status).toBe('✅ success');
     // Check for duration calculation
     expect(result.content.duration).toBe('1m 0s');
   });
   ```

## General Best Practices

1. **Follow AAA Pattern**
   - **Arrange**: Set up test data and conditions
   - **Act**: Perform the action being tested
   - **Assert**: Verify the expected outcome

2. **Test One Thing per Test**
   - Each test should focus on a specific behavior
   - Use clear, descriptive test names

3. **Use Proper Assertions**
   - Be specific with assertions
   - Use appropriate matchers (toBe, toEqual, toContain, etc.)

4. **Run Tests Before Committing**
   ```bash
   npm test
   ```

5. **Check Test Coverage**
   ```bash
   npm run test:coverage
   ```
