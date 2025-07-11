/**
 * Response Formatter Utilities
 * 
 * This module provides utility functions for formatting, truncating, and chunking
 * large responses to ensure they can be properly handled by the MCP protocol.
 */

import { ToolCallResult } from '../types/index.js';
import { serializeToJson, approximateObjectSize, isObjectTooLarge } from './json-serializer.js';

/**
 * Default limits for response formatting
 */
export const DEFAULT_LIMITS = {
  // Maximum size in bytes for a response before chunking
  MAX_RESPONSE_SIZE: 1_000_000, // 1MB
  
  // Maximum number of items to include in array responses
  MAX_ARRAY_ITEMS: 50,
  
  // Maximum depth to traverse when formatting nested objects
  MAX_OBJECT_DEPTH: 5,
  
  // Maximum size in bytes for a single chunk
  MAX_CHUNK_SIZE: 500_000, // 500KB
};

/**
 * Options for formatting and truncating responses
 */
export interface FormattingOptions {
  maxResponseSize?: number;
  maxArrayItems?: number;
  maxObjectDepth?: number;
  maxChunkSize?: number;
  truncationIndicator?: boolean;
}

/**
 * Metadata about response truncation
 */
export interface TruncationMetadata {
  wasTruncated: boolean;
  originalSize?: number;
  itemsOmitted?: number;
  reason?: string;
}

/**
 * Extended ToolCallResult with chunking and truncation support
 */
export interface ChunkedToolCallResult extends ToolCallResult {
  // For multi-part responses
  isChunked?: boolean;
  chunkIndex?: number;
  totalChunks?: number;
  continuationToken?: string;
  
  // Truncation metadata
  metadata?: {
    truncation?: TruncationMetadata;
  };
}

/**
 * Check if an object needs to be chunked based on its size
 * 
 * @param data Object to check
 * @param options Formatting options
 * @returns True if the object needs to be chunked
 */
export function needsChunking(data: any, options: FormattingOptions = {}): boolean {
  const maxSize = options.maxResponseSize ?? DEFAULT_LIMITS.MAX_RESPONSE_SIZE;
  
  // Use optimized size calculation instead of full serialization
  try {
    if (isObjectTooLarge(data, maxSize)) {
      return true;
    }
    
    // For smaller objects, still do a full check to be safe
    const jsonString = serializeToJson(data);
    return jsonString.length > maxSize;
  } catch (error) {
    // If we can't serialize or calculate size, assume it's too large
    return true;
  }
}

/**
 * Format and possibly truncate a response object
 * 
 * @param data Response data to format
 * @param options Formatting options
 * @returns Formatted data and truncation metadata
 */
export function formatTruncatedResponse(data: any, options: FormattingOptions = {}): {
  formattedData: any;
  metadata: TruncationMetadata;
} {
  const maxArrayItems = options.maxArrayItems ?? DEFAULT_LIMITS.MAX_ARRAY_ITEMS;
  const maxObjectDepth = options.maxObjectDepth ?? DEFAULT_LIMITS.MAX_OBJECT_DEPTH;
  
  let wasTruncated = false;
  let itemsOmitted = 0;
  let reason: string | undefined = undefined;
  
  // Function to recursively format and truncate objects
  function formatValue(value: any, depth: number): any {
    // Handle max depth
    if (depth > maxObjectDepth) {
      wasTruncated = true;
      reason = reason || 'Maximum object depth exceeded';
      return '[Object depth limit exceeded]';
    }
    
    // Handle null/undefined
    if (value === null || value === undefined) {
      return value;
    }
    
    // Handle arrays
    if (Array.isArray(value)) {
      if (value.length > maxArrayItems) {
        wasTruncated = true;
        itemsOmitted += (value.length - maxArrayItems);
        reason = reason || 'Array size limit exceeded';
        
        return value
          .slice(0, maxArrayItems)
          .map(item => formatValue(item, depth + 1))
          .concat([`... ${value.length - maxArrayItems} more items`]);
      }
      
      return value.map(item => formatValue(item, depth + 1));
    }
    
    // Handle objects
    if (typeof value === 'object') {
      const formattedObj: Record<string, any> = {};
      
      for (const [key, val] of Object.entries(value)) {
        formattedObj[key] = formatValue(val, depth + 1);
      }
      
      return formattedObj;
    }
    
    // Primitive values pass through unchanged
    return value;
  }
  
  const formattedData = formatValue(data, 0);
  
  return {
    formattedData,
    metadata: {
      wasTruncated,
      itemsOmitted: itemsOmitted > 0 ? itemsOmitted : undefined,
      reason: wasTruncated ? reason : undefined
    }
  };
}

/**
 * Split a large response into chunks
 * 
 * @param data Data to chunk
 * @param options Chunking options
 * @returns Array of chunks and a continuation token
 */
export function chunkResponse(data: any, options: FormattingOptions = {}): {
  chunks: any[];
  continuationToken?: string;
} {
  const maxChunkSize = options.maxChunkSize ?? DEFAULT_LIMITS.MAX_CHUNK_SIZE;
  
  // For primitive values, return as single chunk
  if (typeof data !== 'object' || data === null) {
    return { chunks: [data] };
  }
  
  // For arrays, chunk by slicing
  if (Array.isArray(data)) {
    const chunks: any[][] = [];
    let currentChunk: any[] = [];
    let currentSize = 0;
    
    for (const item of data) {
      const itemJson = JSON.stringify(item);
      const itemSize = itemJson.length;
      
      if (currentSize + itemSize > maxChunkSize && currentChunk.length > 0) {
        chunks.push(currentChunk);
        currentChunk = [item];
        currentSize = itemSize;
      } else {
        currentChunk.push(item);
        currentSize += itemSize;
      }
    }
    
    if (currentChunk.length > 0) {
      chunks.push(currentChunk);
    }
    
    // Generate a continuation token for arrays
    const continuationToken = chunks.length > 1 ? 
      Buffer.from(JSON.stringify({ type: 'array', total: data.length })).toString('base64') :
      undefined;
      
    return {
      chunks,
      continuationToken
    };
  }
  
  // For objects, chunk by splitting properties
  const entries = Object.entries(data);
  const chunks: Record<string, any>[] = [];
  let currentChunk: Record<string, any> = {};
  let currentSize = 0;
  
  for (const [key, value] of entries) {
    const entryJson = JSON.stringify({ [key]: value });
    const entrySize = entryJson.length;
    
    // If this entry alone is larger than max chunk size, we need to format it
    if (entrySize > maxChunkSize) {
      const { formattedData } = formatTruncatedResponse({ [key]: value }, options);
      
      // If the current chunk has content and adding this would exceed max size,
      // finalize current chunk first
      if (currentSize > 0 && Object.keys(currentChunk).length > 0) {
        chunks.push(currentChunk);
        currentChunk = {};
        currentSize = 0;
      }
      
      // Add the truncated entry to a new chunk
      currentChunk = formattedData;
      chunks.push(currentChunk);
      currentChunk = {};
      currentSize = 0;
      continue;
    }
    
    // If adding this entry would exceed chunk size, finalize current chunk
    if (currentSize + entrySize > maxChunkSize && Object.keys(currentChunk).length > 0) {
      chunks.push(currentChunk);
      currentChunk = {};
      currentSize = 0;
    }
    
    // Add entry to current chunk
    currentChunk[key] = value;
    currentSize += entrySize;
  }
  
  // Add final chunk if it has content
  if (Object.keys(currentChunk).length > 0) {
    chunks.push(currentChunk);
  }
  
  // Generate continuation token for objects
  const continuationToken = chunks.length > 1 ? 
    Buffer.from(JSON.stringify({ type: 'object', keys: Object.keys(data) })).toString('base64') :
    undefined;
    
  return {
    chunks,
    continuationToken
  };
}

/**
 * Format a response with chunking and truncation support
 * 
 * @param data Response data
 * @param options Formatting options
 * @returns Formatted tool call results
 */
export function formatChunkedResponse(data: any, options: FormattingOptions = {}): ChunkedToolCallResult[] {
  // First, check if response needs chunking
  if (!needsChunking(data, options)) {
    // If no chunking needed, just format with possible truncation
    const { formattedData, metadata } = formatTruncatedResponse(data, options);
    const formattedString = typeof formattedData === 'object' ? 
      JSON.stringify(formattedData, null, 2) : 
      String(formattedData);
      
    const result: ChunkedToolCallResult = {
      content: [
        {
          type: 'text',
          text: formattedString,
        },
      ],
    };
    
    // Add truncation metadata if applicable
    if (metadata.wasTruncated) {
      result.metadata = { truncation: metadata };
    }
    
    return [result];
  }
  
  // If chunking is needed, chunk the response
  const { chunks, continuationToken } = chunkResponse(data, options);
  
  // Format each chunk as a separate tool call result
  return chunks.map((chunk, index) => {
    const { formattedData, metadata } = formatTruncatedResponse(chunk, options);
    const formattedString = typeof formattedData === 'object' ? 
      JSON.stringify(formattedData, null, 2) : 
      String(formattedData);
      
    const result: ChunkedToolCallResult = {
      content: [
        {
          type: 'text',
          text: formattedString,
        },
      ],
      isChunked: true,
      chunkIndex: index,
      totalChunks: chunks.length,
    };
    
    // Add continuation token to the last chunk
    if (index === chunks.length - 1 && continuationToken) {
      result.continuationToken = continuationToken;
    }
    
    // Add truncation metadata if applicable
    if (metadata.wasTruncated) {
      result.metadata = { truncation: metadata };
    }
    
    return result;
  });
}

/**
 * Create a success response with chunking and truncation support
 * 
 * @param data Response data
 * @param message Optional success message
 * @param options Formatting options
 * @returns Formatted success responses
 */
export function createSuccessResponse(
  data: any, 
  message?: string,
  options: FormattingOptions = {}
): ChunkedToolCallResult[] {
  // If there's a message, prepend it to the first chunk
  const results = formatChunkedResponse(data, options);
  
  if (message && results.length > 0) {
    const firstChunk = results[0];
    
    if (firstChunk.content[0]?.type === 'text') {
      firstChunk.content[0].text = `${message}\n\n${firstChunk.content[0].text}`;
    }
  }
  
  return results;
}

/**
 * Create an error response
 * 
 * @param error Error object or message
 * @returns Error response
 */
export function createErrorResponse(error: Error | string): ChunkedToolCallResult {
  const errorMessage = error instanceof Error ? error.message : error;
  
  return {
    content: [
      {
        type: 'text',
        text: errorMessage,
      },
    ],
    isError: true,
  };
}
