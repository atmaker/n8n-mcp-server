/**
 * JSON Serialization Utilities
 * 
 * This module provides efficient serialization methods for large objects,
 * including selective field inclusion and optimized serialization.
 */

/**
 * Options for JSON serialization
 */
export interface SerializationOptions {
  // Fields to include in the serialization (all if not specified)
  includeFields?: string[];
  
  // Fields to exclude from serialization
  excludeFields?: string[];
  
  // Maximum depth to traverse
  maxDepth?: number;
  
  // Current depth (internal use)
  _currentDepth?: number;
}

/**
 * Efficiently serialize an object to JSON with optional field filtering
 * 
 * @param data Object to serialize
 * @param options Serialization options
 * @returns Serialized JSON string
 */
export function serializeToJson(data: any, options: SerializationOptions = {}): string {
  // Prepare filtered data with selected fields
  const filteredData = filterObjectFields(data, {
    ...options,
    _currentDepth: 0,
  });
  
  // Use streaming serialization for large objects if available in environment
  // Otherwise fall back to standard JSON.stringify
  return JSON.stringify(filteredData, null, 2);
}

/**
 * Filter object fields based on serialization options
 * 
 * @param data Object to filter
 * @param options Serialization options
 * @returns Filtered object
 */
export function filterObjectFields(data: any, options: SerializationOptions): any {
  const { 
    includeFields, 
    excludeFields, 
    maxDepth = Infinity, 
    _currentDepth = 0 
  } = options;
  
  // Handle depth limitation
  if (_currentDepth > maxDepth) {
    return '[Maximum depth exceeded]';
  }
  
  // Handle primitives and null
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  // Handle arrays
  if (Array.isArray(data)) {
    return data.map(item => filterObjectFields(item, {
      ...options,
      _currentDepth: _currentDepth + 1
    }));
  }
  
  // Handle objects
  const result: Record<string, any> = {};
  
  // Get list of keys to process
  let keys = Object.keys(data);
  
  // Apply field inclusion filter if specified
  if (includeFields && includeFields.length > 0) {
    keys = keys.filter(key => includeFields.includes(key));
  }
  
  // Apply field exclusion filter if specified
  if (excludeFields && excludeFields.length > 0) {
    keys = keys.filter(key => !excludeFields.includes(key));
  }
  
  // Process filtered keys
  for (const key of keys) {
    result[key] = filterObjectFields(data[key], {
      ...options,
      _currentDepth: _currentDepth + 1
    });
  }
  
  return result;
}

/**
 * Calculate the approximate size of an object in memory
 * 
 * @param obj Object to measure
 * @returns Approximate size in bytes
 */
export function approximateObjectSize(obj: any): number {
  // For primitive types, return direct size estimate
  if (obj === null) return 4;
  if (typeof obj === 'boolean') return 4;
  if (typeof obj === 'number') return 8;
  if (typeof obj === 'string') return obj.length * 2;
  
  // Handle Date objects
  if (obj instanceof Date) return 8;
  
  // For arrays and objects, recursively calculate size
  let size = 0;
  
  // Use a set to track visited objects and avoid circular references
  const visited = new Set();
  
  function sizeOf(value: any): number {
    if (value === null) return 4;
    if (typeof value !== 'object') {
      if (typeof value === 'string') return value.length * 2;
      if (typeof value === 'boolean') return 4;
      if (typeof value === 'number') return 8;
      return 0; // For undefined or functions
    }
    
    // Handle circular references
    if (visited.has(value)) return 0;
    visited.add(value);
    
    let propertySize = 0;
    
    if (Array.isArray(value)) {
      propertySize = 8; // Array header overhead
      for (let i = 0; i < value.length; i++) {
        propertySize += sizeOf(value[i]);
      }
    } else {
      propertySize = 8; // Object header overhead
      for (const key in value) {
        if (Object.prototype.hasOwnProperty.call(value, key)) {
          propertySize += key.length * 2; // Key size (UTF-16 chars)
          propertySize += sizeOf(value[key]); // Value size
        }
      }
    }
    
    return propertySize;
  }
  
  size = sizeOf(obj);
  return size;
}

/**
 * Check if an object is too large to safely serialize
 * 
 * @param obj Object to check
 * @param maxSizeBytes Maximum safe size in bytes
 * @returns True if the object is too large
 */
export function isObjectTooLarge(obj: any, maxSizeBytes: number = 50_000_000): boolean {
  return approximateObjectSize(obj) > maxSizeBytes;
}

/**
 * Convert a large object into a more memory-efficient representation
 * 
 * @param data Object to convert
 * @param options Field selection options
 * @returns Memory-efficient representation
 */
export function createEfficientObjectRepresentation(
  data: any,
  options: SerializationOptions = {}
): any {
  // For primitive types, return as is
  if (data === null || typeof data !== 'object') {
    return data;
  }
  
  // For arrays, create a summary if it's large
  if (Array.isArray(data)) {
    if (data.length > 100) {
      return {
        _type: 'array',
        length: data.length,
        summary: `Array with ${data.length} items`,
        sample: data.slice(0, 10).map(item => 
          createEfficientObjectRepresentation(item, options)
        )
      };
    }
    
    return data.map(item => createEfficientObjectRepresentation(item, options));
  }
  
  // For objects, filter fields
  return filterObjectFields(data, options);
}
