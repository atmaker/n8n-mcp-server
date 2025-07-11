---
description: How to add new tools to the n8n MCP Server
---

# Adding New Tools

Follow these steps when adding a new tool to the n8n MCP Server:

1. **Define Tool Interface**
   ```typescript
   // src/types/tools/my-category/my-tool.ts
   export interface MyToolParams {
     param1: string;
     param2?: number;
     // Add pagination parameters for list-type tools
     offset?: number;
     limit?: number;
   }
   ```

2. **Create Tool Definition**
   ```typescript
   // src/tools/my-category/my-tool.ts
   import { ToolDefinition } from '@modelcontextprotocol/sdk/types.js';
   
   export function getMyToolDefinition(): ToolDefinition {
     return {
       name: 'my_tool',
       description: 'Description of what the tool does',
       inputSchema: {
         type: 'object',
         properties: {
           param1: {
             type: 'string',
             description: 'Description of parameter 1'
           },
           param2: {
             type: 'number',
             description: 'Description of parameter 2'
           }
         },
         required: ['param1']
       }
     };
   }
   ```

3. **Implement Handler Function**
   ```typescript
   // src/tools/my-category/my-tool.ts
   import { ToolCallResponse } from '@modelcontextprotocol/sdk/types.js';
   import { N8nClient } from '../../api/n8n-client.js';
   import { MyToolParams } from '../../types/tools/my-category/my-tool.js';
   
   export async function handleMyTool(
     client: N8nClient,
     params: MyToolParams
   ): Promise<ToolCallResponse> {
     try {
       // Implement tool logic
       const result = await client.performAction(params.param1, params.param2);
       
       return {
         content: result
       };
     } catch (error) {
       // Handle errors properly
       throw error;
     }
   }
   ```

4. **Register Tool in Handler Collection**
   ```typescript
   // src/tools/my-category/handler.ts
   import { getMyToolDefinition, handleMyTool } from './my-tool.js';
   
   export const myCategoryTools = {
     my_tool: {
       definition: getMyToolDefinition,
       handler: handleMyTool
     }
   };
   ```

5. **Update Main Server Registration**
   ```typescript
   // src/index.ts
   import { myCategoryTools } from './tools/my-category/handler.js';
   
   // In the server initialization section
   Object.entries(myCategoryTools).forEach(([name, { definition, handler }]) => {
     server.setToolHandler(definition(), async (request) => {
       return await handler(client, request.params.arguments as any);
     });
   });
   ```

6. **Add Unit Tests**
   ```typescript
   // tests/unit/tools/my-category/my-tool.test.ts
   import { describe, it, expect, jest } from '@jest/globals';
   import { handleMyTool, getMyToolDefinition } from '../../../../src/tools/my-category/my-tool.js';
   
   describe('My Tool', () => {
     describe('getMyToolDefinition', () => {
       it('should return a valid tool definition', () => {
         const definition = getMyToolDefinition();
         expect(definition.name).toBe('my_tool');
         expect(definition.inputSchema.required).toContain('param1');
       });
     });
     
     describe('handleMyTool', () => {
       it('should handle the tool call correctly', async () => {
         const mockClient = {
           performAction: jest.fn().mockResolvedValue({ result: 'success' })
         };
         
         const result = await handleMyTool(mockClient as any, { param1: 'test' });
         expect(mockClient.performAction).toHaveBeenCalledWith('test', undefined);
         expect(result.content).toEqual({ result: 'success' });
       });
       
       it('should handle errors properly', async () => {
         const mockClient = {
           performAction: jest.fn().mockRejectedValue(new Error('Test error'))
         };
         
         await expect(handleMyTool(mockClient as any, { param1: 'test' }))
           .rejects.toThrow('Test error');
       });
     });
   });
   ```

7. **Update Documentation**
   - Add the new tool to the relevant API documentation
   - Include examples of tool usage
   - Explain parameters and return values
