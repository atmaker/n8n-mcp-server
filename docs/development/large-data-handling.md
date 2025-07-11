# Large Data Transfer Handling

This document explains how to use the large data transfer handling features in the n8n MCP server.

## Overview

The n8n MCP server includes mechanisms for efficiently handling large data transfers between the MCP client and server. These mechanisms include:

- Response chunking
- Data truncation with metadata indicators
- Optimized JSON serialization
- Pagination support

These features ensure that large datasets from n8n workflows can be properly handled without overwhelming the MCP protocol or causing memory issues.

## Response Chunking

When a response exceeds a certain size threshold, it is automatically split into multiple chunks that can be processed sequentially by the client.

### How It Works

1. The server determines if a response needs chunking based on its size
2. If chunking is needed, the response is split into manageable chunks
3. Each chunk includes metadata about its position in the sequence and the total number of chunks
4. The last chunk includes a continuation token that can be used to retrieve more data if needed

### Example

```typescript
import { createSuccessResponse } from '../../utils/response-formatter.js';

// When returning a potentially large response
const largeData = fetchLargeDataset();
return createSuccessResponse(largeData);
```

The `createSuccessResponse` function automatically handles chunking if necessary.

## Data Truncation

To prevent excessive memory usage, the server may truncate very large arrays or deeply nested objects. When data is truncated, metadata is included to indicate this has occurred.

### Truncation Metadata

When data is truncated, the response includes metadata like:

```json
{
  "content": [...],
  "metadata": {
    "truncation": {
      "wasTruncated": true,
      "itemsOmitted": 150,
      "reason": "Array size limit exceeded"
    }
  }
}
```

## Optimized JSON Serialization

The server includes utilities for efficient JSON serialization of large objects:

- Selective field inclusion/exclusion
- Depth limitation for nested objects
- Memory-efficient object representation

### Usage Example

```typescript
import { serializeToJson } from '../../utils/json-serializer.js';

// Serialize with selective fields
const json = serializeToJson(largeObject, {
  includeFields: ['id', 'name', 'status'],
  excludeFields: ['largeField', 'sensitiveData'],
  maxDepth: 3
});
```

## Integration with Base Handler

The base handlers have been updated to use these features automatically. The `formatSuccess` method now returns an array of `ChunkedToolCallResult` objects:

```typescript
protected formatSuccess(data: any, message?: string, options?: FormattingOptions): ChunkedToolCallResult[] {
  return createSuccessResponse(data, message, options);
}
```

## Handling Chunked Responses in Tools

When implementing a tool that may return large datasets, consider using these utilities:

```typescript
import { createSuccessResponse, FormattingOptions } from '../../utils/response-formatter.js';

// In your tool handler
execute(args: Record<string, any>): Promise<ChunkedToolCallResult[]> {
  try {
    // Fetch potentially large data
    const largeData = await this.fetchData(args);
    
    // Custom formatting options if needed
    const options: FormattingOptions = {
      maxArrayItems: 100,
      truncationIndicator: true
    };
    
    // Return with automatic chunking/truncation
    return createSuccessResponse(largeData, 'Data retrieved successfully', options);
  } catch (error) {
    return [createErrorResponse(error)];
  }
}
```

## Configuration

The default limits can be adjusted in the `DEFAULT_LIMITS` object in `response-formatter.ts`:

- `MAX_RESPONSE_SIZE`: Maximum size in bytes for a response before chunking (default: 1MB)
- `MAX_ARRAY_ITEMS`: Maximum number of items to include in array responses (default: 50)
- `MAX_OBJECT_DEPTH`: Maximum depth to traverse when formatting nested objects (default: 5)
- `MAX_CHUNK_SIZE`: Maximum size in bytes for a single chunk (default: 500KB)
