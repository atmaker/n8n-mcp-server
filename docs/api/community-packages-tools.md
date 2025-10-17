# Community Packages Tools

This page documents the tools for managing Community Packages via the MCP server.

## Tools

- list_community_packages
- install_community_package
- update_community_package
- uninstall_community_package

### list_community_packages

List installed community packages.

Input schema: none.

Response content:

```json
{
  "packages": [
    { "packageName": "n8n-nodes-foo", "installedVersion": "1.0.0", "updateAvailable": false }
  ],
  "count": 1
}
```

### install_community_package

Install a community package by npm name. Optionally provide a version or checksum.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "version": { "type": "string" },
    "checksum": { "type": "string" }
  },
  "required": ["name"]
}
```

Response content:

```json
{ "message": "Installation started for n8n-nodes-foo" }
```

### update_community_package

Update a community package to specific version or verify by checksum.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "version": { "type": "string" },
    "checksum": { "type": "string" }
  },
  "required": ["name"]
}
```

Response content:

```json
{ "message": "Update started for n8n-nodes-foo" }
```

### uninstall_community_package

Uninstall a community package by name.

Input schema:

```json
{
  "type": "object",
  "properties": {
    "name": { "type": "string" }
  },
  "required": ["name"]
}
```

Response content:

```json
{ "message": "Uninstallation started for n8n-nodes-foo" }
```
