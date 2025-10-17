# Nodes Tools

This page documents the tools for interacting with the n8n Nodes API via the MCP server.

## Tools

- list_nodes
- get_node
- list_node_categories

### list_nodes

Retrieve installed nodes, optionally filtered by node type. Supports cursor-based pagination.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "nodeType": { "type": "string", "description": "Filter by node type" },
    "limit": { "type": "number", "description": "Max items to return for this page" },
    "cursor": { "type": "string", "description": "Pagination cursor (use nextCursor from previous call)" },
    "sort": { "type": "string", "description": "Sort field" },
    "order": { "type": "string", "enum": ["asc", "desc"], "description": "Sort order" }
  },
  "required": []
}
```

Example call (pseudo):

```ts
// Tool: list_nodes
// Args
{
  limit: 20
}
```

Example response content:

```json
{
  "nodes": [
    { "type": "n8n-nodes-base.httpRequest", "displayName": "HTTP Request", "version": 1 },
    { "type": "n8n-nodes-base.set", "displayName": "Set", "version": 1 }
  ],
  "count": 2,
  "nextCursor": "abc123",
  "hasMore": true
}
```

### get_node

Retrieve the details for a specific installed node type.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "nodeType": { "type": "string", "description": "Node type to fetch (e.g., n8n-nodes-base.httpRequest)" }
  },
  "required": ["nodeType"]
}
```

Response content:

```json
{
  "node": { "type": "n8n-nodes-base.httpRequest", "displayName": "HTTP Request" },
  "installedPackages": []
}
```

### list_node_categories

Retrieve the available node categories. Supports cursor-based pagination.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "limit": { "type": "number" },
    "cursor": { "type": "string" },
    "sort": { "type": "string", "enum": ["name"] },
    "order": { "type": "string", "enum": ["asc", "desc"] }
  },
  "required": []
}
```

Response content:

```json
{
  "categories": ["Core", "Productivity"],
  "count": 2,
  "nextCursor": null,
  "hasMore": false
}
```
