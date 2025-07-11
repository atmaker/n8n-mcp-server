---
description: How to add new resources to the n8n MCP Server
---

# Adding New Resources

Follow these steps when adding new resources to the n8n MCP Server:

## 1. Static Resource (No Parameters)

For resources that don't require URI parameters:

```typescript
// src/resources/static/my-resource.ts
import { McpError, ReadResourceResponse } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '../../errors/error-codes.js';
import { N8nClient } from '../../api/n8n-client.js';

export const MY_RESOURCE_URI = 'n8n://my-resource';

export async function handleMyResourceRequest(
  client: N8nClient
): Promise<ReadResourceResponse> {
  try {
    // Implement the resource logic
    // Use the N8nClient to interact with n8n
    const data = await client.getResourceData();
    
    // Return the response
    return {
      content: data,
      contentType: 'application/json'
    };
  } catch (error) {
    // Handle errors properly
    throw new McpError(ErrorCode.InternalError, `Failed to retrieve resource: ${error.message}`);
  }
}
```

## 2. Dynamic Resource (With Parameters)

For resources that require URI parameters:

```typescript
// src/resources/dynamic/my-resource.ts
import { McpError, ReadResourceResponse } from '@modelcontextprotocol/sdk/types.js';
import { ErrorCode } from '../../errors/error-codes.js';
import { N8nClient } from '../../api/n8n-client.js';

export const MY_RESOURCE_URI_TEMPLATE = 'n8n://my-resource/:id';

// Function to parse URI parameters
export function matchMyResourceUri(uri: string): { id: string } | null {
  const match = uri.match(/^n8n:\/\/my-resource\/([^/]+)$/);
  if (!match) return null;
  return { id: match[1] };
}

export async function handleMyResourceRequest(
  client: N8nClient,
  uri: string
): Promise<ReadResourceResponse> {
  const params = matchMyResourceUri(uri);
  if (!params) {
    throw new McpError(
      ErrorCode.InvalidRequest,
      `Invalid resource URI: ${uri}`
    );
  }
  
  try {
    // Implement the resource logic with parameters
    const data = await client.getResourceById(params.id);
    
    // Return the response
    return {
      content: data,
      contentType: 'application/json'
    };
  } catch (error) {
    // Handle errors properly
    throw new McpError(ErrorCode.InternalError, `Failed to retrieve resource: ${error.message}`);
  }
}
```

## 3. Register Resources in Resource Registry

```typescript
// src/resources/registry.ts
import { MY_RESOURCE_URI, handleMyResourceRequest as handleMyStaticResource } from './static/my-resource.js';
import { MY_RESOURCE_URI_TEMPLATE, matchMyResourceUri, handleMyResourceRequest as handleMyDynamicResource } from './dynamic/my-resource.js';

export const staticResources = {
  // Existing resources
  [MY_RESOURCE_URI]: handleMyStaticResource
};

export const dynamicResources = [
  // Existing resources
  {
    template: MY_RESOURCE_URI_TEMPLATE,
    match: matchMyResourceUri,
    handler: handleMyDynamicResource
  }
];
```

## 4. Add Unit Tests

```typescript
// tests/unit/resources/static/my-resource.test.ts
import { describe, it, expect, jest } from '@jest/globals';
import { handleMyResourceRequest, MY_RESOURCE_URI } from '../../../../src/resources/static/my-resource.js';

describe('My Resource', () => {
  it('should return resource data', async () => {
    const mockClient = {
      getResourceData: jest.fn().mockResolvedValue({ data: 'test' })
    };
    
    const response = await handleMyResourceRequest(mockClient as any);
    expect(mockClient.getResourceData).toHaveBeenCalled();
    expect(response.content).toEqual({ data: 'test' });
    expect(response.contentType).toBe('application/json');
  });
  
  it('should handle errors properly', async () => {
    const mockClient = {
      getResourceData: jest.fn().mockRejectedValue(new Error('Test error'))
    };
    
    await expect(handleMyResourceRequest(mockClient as any))
      .rejects.toThrow('Failed to retrieve resource');
  });
});
```

## 5. Update Documentation

- Add the new resource to the API documentation
- Document the URI pattern
- Include examples of resource usage
- Explain parameters and return values
