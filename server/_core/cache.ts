/**
 * Lightweight LRU (Least Recently Used) Cache Implementation
 *
 * Features:
 * - Fixed capacity (100 entries)
 * - TTL (Time To Live) support
 * - O(1) get/set operations using Map
 * - Automatic eviction of least recently used items
 * - Memory efficient for 2C2G environment
 *
 * @module cache
 */

interface CacheEntry<T> {
  value: T;
  expiresAt: number | null;
}

export class LRUCache<T = unknown> {
  private cache: Map<string, CacheEntry<T>>;
  private readonly maxSize: number;

  /**
   * Create a new LRU Cache instance
   * @param maxSize - Maximum number of entries (default: 100)
   */
  constructor(maxSize: number = 100) {
    this.cache = new Map();
    this.maxSize = maxSize;
  }

  /**
   * Get a value from cache
   * Returns undefined if key doesn't exist or has expired
   *
   * @param key - Cache key
   * @returns Cached value or undefined
   */
  get(key: string): T | undefined {
    const entry = this.cache.get(key);

    if (!entry) {
      return undefined;
    }

    // Check if entry has expired
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }

    // Move to end (most recently used) by deleting and re-inserting
    this.cache.delete(key);
    this.cache.set(key, entry);

    return entry.value;
  }

  /**
   * Set a value in cache
   * If cache is full, removes the least recently used item
   *
   * @param key - Cache key
   * @param value - Value to cache
   * @param ttl - Time to live in milliseconds (optional)
   */
  set(key: string, value: T, ttl?: number): void {
    // Remove existing entry if present
    if (this.cache.has(key)) {
      this.cache.delete(key);
    }

    // Evict least recently used item if cache is full
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey !== undefined) {
        this.cache.delete(firstKey);
      }
    }

    // Calculate expiration time
    const expiresAt = ttl ? Date.now() + ttl : null;

    // Add new entry (at the end, most recently used)
    this.cache.set(key, { value, expiresAt });
  }

  /**
   * Delete a specific key from cache
   *
   * @param key - Cache key to delete
   * @returns true if key existed, false otherwise
   */
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  /**
   * Delete all keys matching a pattern
   * Useful for invalidating related cache entries
   *
   * @param pattern - String pattern or RegExp to match keys
   * @returns Number of deleted entries
   */
  deletePattern(pattern: string | RegExp): number {
    const regex = typeof pattern === 'string'
      ? new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      : pattern;

    let deletedCount = 0;
    const keysToDelete: string[] = [];

    // Collect keys to delete first (avoid iterator issues)
    this.cache.forEach((_, key) => {
      if (regex.test(key)) {
        keysToDelete.push(key);
      }
    });

    // Delete collected keys
    for (const key of keysToDelete) {
      this.cache.delete(key);
      deletedCount++;
    }

    return deletedCount;
  }

  /**
   * Clear all entries from cache
   */
  clear(): void {
    this.cache.clear();
  }

  /**
   * Get current cache size
   *
   * @returns Number of entries in cache
   */
  size(): number {
    return this.cache.size;
  }

  /**
   * Check if a key exists in cache (without updating LRU order)
   *
   * @param key - Cache key
   * @returns true if key exists and hasn't expired
   */
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;

    // Check expiration
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return false;
    }

    return true;
  }

  /**
   * Get cache statistics for monitoring
   *
   * @returns Cache statistics object
   */
  getStats(): { size: number; maxSize: number; utilization: number } {
    return {
      size: this.cache.size,
      maxSize: this.maxSize,
      utilization: Math.round((this.cache.size / this.maxSize) * 100),
    };
  }
}

// Global cache instance for the application
export const appCache = new LRUCache(100);

/**
 * Generate cache key for article list queries
 */
export function generateArticleListKey(params: {
  limit?: number;
  page?: number;
  status?: string;
  type?: string;
  categorySlug?: string;
  search?: string;
}): string {
  const parts = ['article:list'];
  if (params.page) parts.push(`page:${params.page}`);
  if (params.limit) parts.push(`limit:${params.limit}`);
  if (params.status) parts.push(`status:${params.status}`);
  if (params.type) parts.push(`type:${params.type}`);
  if (params.categorySlug) parts.push(`category:${params.categorySlug}`);
  if (params.search) parts.push(`search:${params.search}`);
  return parts.join(':');
}

/**
 * Generate cache key for category list queries
 */
export function generateCategoryListKey(params?: { type?: string }): string {
  if (params?.type) {
    return `category:list:type:${params.type}`;
  }
  return 'category:list:all';
}

/**
 * Generate cache key for document tree queries
 */
export function generateDocTreeKey(categorySlug?: string): string {
  if (categorySlug) {
    return `doc:tree:category:${categorySlug}`;
  }
  return 'doc:tree:all';
}

/**
 * Invalidate all article-related cache entries
 */
export function invalidateArticleCache(): void {
  appCache.deletePattern(/^article:/);
  appCache.deletePattern(/^doc:tree:/);
}

/**
 * Invalidate all category-related cache entries
 */
export function invalidateCategoryCache(): void {
  appCache.deletePattern(/^category:/);
  appCache.deletePattern(/^article:/); // Articles include category info
  appCache.deletePattern(/^doc:tree:/);
}
