# Static Resources

### n8n://nodes

Provides a list of installed nodes in the n8n instance. Supports cursor-based pagination internally; the resource returns the first page by default.

**URI:** `n8n://nodes`

**Description:** Returns installed nodes with basic information.

**Example Usage:**

```javascript
const resource = await accessMcpResource('n8n-mcp-server', 'n8n://nodes');
```

**Response:**

```json
{
  "resourceType": "nodes",
  "count": 2,
  "nodes": [
    { "type": "n8n-nodes-base.httpRequest", "displayName": "HTTP Request", "version": 1 },
    { "type": "n8n-nodes-base.set", "displayName": "Set", "version": 1 }
  ],
  "nextCursor": null,
  "_links": { "self": "n8n://nodes" },
  "lastUpdated": "2025-03-01T12:00:00.000Z"
}
```

### n8n://community-packages

Provides a list of installed community packages in the n8n instance.

**URI:** `n8n://community-packages`

**Description:** Returns installed community packages with update availability.

**Example Usage:**

```javascript
const resource = await accessMcpResource('n8n-mcp-server', 'n8n://community-packages');
```

**Response:**

```json
{
  "resourceType": "community-packages",
  "count": 1,
  "packages": [
    { "packageName": "n8n-nodes-foo", "installedVersion": "1.0.0", "updateAvailable": false }
  ],
  "_links": { "self": "n8n://community-packages" },
  "lastUpdated": "2025-03-01T12:00:00.000Z"
}
```

This page documents the static resources available in the n8n MCP Server.

## Overview

Static resources provide access to fixed n8n data sources without requiring parameters in the URI. These resources are ideal for retrieving collections of data or summary information.

## Available Resources

### n8n://workflows/list

Provides a list of all workflows in the n8n instance.

**URI:** `n8n://workflows/list`

**Description:** Returns a comprehensive list of all workflows with their basic metadata.

**Example Usage:**

```javascript
const resource = await accessMcpResource('n8n-mcp-server', 'n8n://workflows/list');
```

**Response:**

```javascript
{
  "workflows": [
    {
      "id": "1234abc",
      "name": "Email Processing Workflow",
      "active": true,
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-02T14:30:00.000Z"
    },
    {
      "id": "5678def",
      "name": "Data Sync Workflow",
      "active": false,
      "createdAt": "2025-03-01T12:00:00.000Z",
      "updatedAt": "2025-03-12T10:15:00.000Z"
    }
  ],
  "count": 2,
  "pagination": {
    "hasMore": false
  }
}
```

### n8n://execution-stats

Provides aggregated statistics about workflow executions.

**URI:** `n8n://execution-stats`

**Description:** Returns summary statistics about workflow executions, including counts by status, average execution times, and recent trends.

**Example Usage:**

```javascript
const resource = await accessMcpResource('n8n-mcp-server', 'n8n://execution-stats');
```

**Response:**

```javascript
{
  "totalExecutions": 1250,
  "statusCounts": {
    "success": 1050,
    "error": 180,
    "cancelled": 20
  },
  "averageExecutionTime": 3.5, // seconds
  "recentActivity": {
    "last24Hours": 125,
    "last7Days": 450
  },
  "topWorkflows": [
    {
      "id": "1234abc",
      "name": "Email Processing Workflow",
      "executionCount": 256
    },
    {
      "id": "5678def",
      "name": "Data Sync Workflow",
      "executionCount": 198
    }
  ]
}
```

### n8n://health

Provides health information about the n8n instance.

**URI:** `n8n://health`

**Description:** Returns health status information about the n8n instance including connection status, version, and basic metrics.

**Example Usage:**

```javascript
const resource = await accessMcpResource('n8n-mcp-server', 'n8n://health');
```

**Response:**

```javascript
{
  "status": "healthy",
  "n8nVersion": "1.5.0",
  "uptime": 259200, // seconds (3 days)
  "databaseStatus": "connected",
  "apiStatus": "operational",
  "memoryUsage": {
    "rss": "156MB",
    "heapTotal": "85MB",
    "heapUsed": "72MB"
  }
}
```

## Content Types

All static resources return JSON content with the MIME type `application/json`.

## Authentication

Access to static resources requires the same authentication as tools, using the configured n8n API key. If authentication fails, the resource will return an error.

## Error Handling

Static resources can return the following errors:

| HTTP Status | Description |
|-------------|-------------|
| 401 | Unauthorized - Invalid or missing API key |
| 403 | Forbidden - API key does not have permission to access this resource |
| 500 | Internal Server Error - An unexpected error occurred on the n8n server |

## Pagination

Some resources that return large collections (like `n8n://workflows/list`) support pagination. The response includes a `pagination` object with information about whether more results are available.

## Best Practices

- Use static resources for getting an overview of what's available in the n8n instance
- Prefer static resources over tools when you only need to read data
- Check the health resource before performing operations to ensure the n8n instance is operational
- Use execution statistics to monitor the performance and reliability of your workflows
