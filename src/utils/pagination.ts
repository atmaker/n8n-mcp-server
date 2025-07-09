/**
 * Pagination Utilities
 * 
 * This module provides utilities for paginating results in a consistent way
 * across all tool handlers.
 */

/**
 * Pagination parameters interface
 */
export interface PaginationParams {
  offset?: number;
  limit?: number;
}

/**
 * Pagination metadata interface
 */
export interface PaginationMetadata {
  offset: number;
  limit: number;
  total: number;
  hasMore: boolean;
  nextOffset: number | null;
  prevOffset: number | null;
}

/**
 * Interface for a paginated result
 */
export interface PaginatedResult<T> {
  data: T[];
  pagination: PaginationMetadata;
}

/**
 * Apply pagination to an array of items
 * 
 * @param items Array of items to paginate
 * @param params Pagination parameters
 * @returns Paginated result with metadata
 */
export function paginateResults<T>(
  items: T[], 
  params: PaginationParams = {}
): PaginatedResult<T> {
  const offset = params.offset !== undefined ? Number(params.offset) : 0;
  const limit = params.limit !== undefined ? Number(params.limit) : 10;
  const total = items.length;
  
  // Ensure valid pagination parameters
  const validOffset = Math.max(0, Math.min(offset, total));
  const validLimit = Math.max(1, limit);
  
  const paginatedItems = items.slice(validOffset, validOffset + validLimit);
  
  return {
    data: paginatedItems,
    pagination: {
      offset: validOffset,
      limit: validLimit,
      total,
      hasMore: validOffset + validLimit < total,
      nextOffset: validOffset + validLimit < total ? validOffset + validLimit : null,
      prevOffset: validOffset > 0 ? Math.max(0, validOffset - validLimit) : null,
    }
  };
}
