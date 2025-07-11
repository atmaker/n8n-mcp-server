/**
 * Tests for pagination utility
 */

import '@jest/globals';
import { paginateResults } from '../../../src/utils/pagination.js';

describe('Pagination Utilities', () => {
  describe('paginateResults', () => {
    // Test data
    const testItems = [
      { id: 1, name: 'Item 1' },
      { id: 2, name: 'Item 2' },
      { id: 3, name: 'Item 3' },
      { id: 4, name: 'Item 4' },
      { id: 5, name: 'Item 5' },
      { id: 6, name: 'Item 6' },
      { id: 7, name: 'Item 7' },
      { id: 8, name: 'Item 8' },
      { id: 9, name: 'Item 9' },
      { id: 10, name: 'Item 10' },
    ];

    it('should paginate results with default parameters', () => {
      const result = paginateResults(testItems);
      
      expect(result.data).toHaveLength(10);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextOffset).toBeNull();
      expect(result.pagination.prevOffset).toBeNull();
    });

    it('should paginate results with custom limit', () => {
      const result = paginateResults(testItems, { limit: 5 });
      
      expect(result.data).toHaveLength(5);
      expect(result.pagination.offset).toBe(0);
      expect(result.pagination.limit).toBe(5);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextOffset).toBe(5);
      expect(result.pagination.prevOffset).toBeNull();
    });

    it('should paginate results with custom offset', () => {
      const result = paginateResults(testItems, { offset: 5 });
      
      expect(result.data).toHaveLength(5);
      expect(result.data[0].id).toBe(6);
      expect(result.pagination.offset).toBe(5);
      expect(result.pagination.limit).toBe(10);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextOffset).toBeNull();
      expect(result.pagination.prevOffset).toBe(0);
    });

    it('should paginate results with custom offset and limit', () => {
      const result = paginateResults(testItems, { offset: 3, limit: 4 });
      
      expect(result.data).toHaveLength(4);
      expect(result.data[0].id).toBe(4);
      expect(result.pagination.offset).toBe(3);
      expect(result.pagination.limit).toBe(4);
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(true);
      expect(result.pagination.nextOffset).toBe(7);
      expect(result.pagination.prevOffset).toBe(0);
    });

    it('should handle empty array', () => {
      const result = paginateResults([]);
      
      expect(result.data).toHaveLength(0);
      expect(result.pagination.total).toBe(0);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextOffset).toBeNull();
      expect(result.pagination.prevOffset).toBeNull();
    });

    it('should handle offset greater than array length', () => {
      const result = paginateResults(testItems, { offset: 15 });
      
      expect(result.data).toHaveLength(0);
      expect(result.pagination.offset).toBe(10); // Should clamp to array length
      expect(result.pagination.total).toBe(10);
      expect(result.pagination.hasMore).toBe(false);
      expect(result.pagination.nextOffset).toBeNull();
      expect(result.pagination.prevOffset).toBe(0);
    });

    it('should ensure minimum limit of 1', () => {
      const result = paginateResults(testItems, { limit: 0 });
      
      expect(result.pagination.limit).toBe(1);
      expect(result.data).toHaveLength(1);
    });
  });
});
