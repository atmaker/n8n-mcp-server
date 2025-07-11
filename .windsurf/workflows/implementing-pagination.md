---
description: How to implement pagination for list tools in the n8n MCP Server
---

# Implementing Pagination for List Tools

Follow these steps to implement pagination for list-type tools in the n8n MCP Server:

## 1. Include Pagination Parameters in Tool Definition

```typescript
// src/tools/category/list-tool.ts
export function getListToolDefinition(): ToolDefinition {
  return {
    name: 'list_tool',
    description: 'Lists items with pagination support',
    inputSchema: {
      type: 'object',
      properties: {
        // Other parameters...
        
        // Pagination parameters
        offset: {
          type: 'number',
          description: 'Number of items to skip (pagination offset)',
          default: 0
        },
        limit: {
          type: 'number',
          description: 'Maximum number of items to return per page',
          default: 10
        }
      }
    }
  };
}
```

## 2. Import and Use the Pagination Utility

```typescript
// src/tools/category/list-tool.ts
import { paginateResults, PaginationParams } from '../../utils/pagination.js';
import { ListToolParams } from '../../types/tools/category/list-tool.js';

export async function handleListTool(
  client: N8nClient,
  params: ListToolParams
): Promise<ToolCallResponse> {
  try {
    // Fetch all items from the API
    const items = await client.getItems();
    
    // Apply pagination
    const paginationParams: PaginationParams = {
      offset: params.offset,
      limit: params.limit
    };
    
    const result = paginateResults(items, paginationParams);
    
    // Return paginated data with metadata
    return {
      content: result.data,
      metadata: {
        pagination: result.pagination
      }
    };
  } catch (error) {
    // Handle errors appropriately
    throw error;
  }
}
```

## 3. Add Pagination Tests

```typescript
// tests/unit/tools/category/list-tool.test.ts
describe('handleListTool', () => {
  it('should paginate results correctly', async () => {
    // Create mock data with multiple items
    const mockItems = Array.from({ length: 20 }, (_, i) => ({ id: i, name: `Item ${i}` }));
    
    const mockClient = {
      getItems: jest.fn().mockResolvedValue(mockItems)
    };
    
    // Test first page (default limit)
    const resultFirstPage = await handleListTool(mockClient as any, { offset: 0, limit: 10 });
    expect(resultFirstPage.content).toHaveLength(10);
    expect(resultFirstPage.metadata.pagination.offset).toBe(0);
    expect(resultFirstPage.metadata.pagination.limit).toBe(10);
    expect(resultFirstPage.metadata.pagination.total).toBe(20);
    expect(resultFirstPage.metadata.pagination.hasMore).toBe(true);
    expect(resultFirstPage.metadata.pagination.nextOffset).toBe(10);
    
    // Test second page
    const resultSecondPage = await handleListTool(mockClient as any, { offset: 10, limit: 10 });
    expect(resultSecondPage.content).toHaveLength(10);
    expect(resultSecondPage.metadata.pagination.offset).toBe(10);
    expect(resultSecondPage.metadata.pagination.hasMore).toBe(false);
    expect(resultSecondPage.metadata.pagination.nextOffset).toBe(null);
    
    // Test with custom limit
    const resultCustomLimit = await handleListTool(mockClient as any, { offset: 5, limit: 5 });
    expect(resultCustomLimit.content).toHaveLength(5);
    expect(resultCustomLimit.metadata.pagination.offset).toBe(5);
    expect(resultCustomLimit.metadata.pagination.limit).toBe(5);
  });
});
```

## 4. Document Pagination in API Reference

Update the API documentation to include information about pagination parameters and response structure:

```markdown
## List Tool

Lists items with pagination support.

### Parameters

| Name | Type | Description | Default |
|------|------|-------------|---------|
| offset | number | Number of items to skip | 0 |
| limit | number | Maximum number of items to return | 10 |

### Response

```json
{
  "content": [
    { "id": 1, "name": "Item 1" },
    { "id": 2, "name": "Item 2" }
    // ...
  ],
  "metadata": {
    "pagination": {
      "offset": 0,
      "limit": 10,
      "total": 42,
      "hasMore": true,
      "nextOffset": 10,
      "prevOffset": null
    }
  }
}
```

### Example

```typescript
// Request first page
const firstPageResult = await useMcpTool("list_tool", { offset: 0, limit: 10 });

// Request second page
const secondPageResult = await useMcpTool("list_tool", { offset: 10, limit: 10 });
```
```

## 5. Include Pagination in Example Files

Update or add examples demonstrating pagination usage:

```typescript
// Example showing how to retrieve all pages
async function getAllItems() {
  let allItems = [];
  let offset = 0;
  const limit = 10;
  let hasMore = true;
  
  while (hasMore) {
    const result = await useMcpTool("list_tool", { offset, limit });
    allItems = [...allItems, ...result.content];
    
    hasMore = result.metadata.pagination.hasMore;
    offset = result.metadata.pagination.nextOffset;
    
    if (offset === null) break;
  }
  
  return allItems;
}
```
