/**
 * Node dynamic resource URI functions test
 */

import { describe, it, expect } from '@jest/globals';

function getNodeResourceTemplateUri() {
  return 'n8n://nodes/{nodeType}';
}

function extractNodeTypeFromUri(uri: string): string | null {
  const match = uri.match(/^n8n:\/\/nodes\/(.+)$/);
  return match ? match[1] : null;
}

describe('Node Resource URI Functions', () => {
  it('returns the correct URI template', () => {
    expect(getNodeResourceTemplateUri()).toBe('n8n://nodes/{nodeType}');
  });

  it('extracts nodeType from valid URIs', () => {
    expect(extractNodeTypeFromUri('n8n://nodes/n8n-nodes-base.httpRequest')).toBe('n8n-nodes-base.httpRequest');
    expect(extractNodeTypeFromUri('n8n://nodes/@scope/foo.bar')).toBe('@scope/foo.bar');
  });

  it('returns null for invalid URIs', () => {
    expect(extractNodeTypeFromUri('n8n://nodes')).toBeNull();
    expect(extractNodeTypeFromUri('n8n://node/n8n-nodes-base.httpRequest')).toBeNull();
  });
});
