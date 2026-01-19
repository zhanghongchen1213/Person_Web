/**
 * Performance Monitoring Module
 *
 * This module provides performance monitoring utilities for tracking:
 * - Request duration
 * - Cache hit/miss statistics
 * - Slow query detection
 */

interface PerformanceStats {
  totalRequests: number;
  slowQueries: number;
  cacheHits: number;
  cacheMisses: number;
}

class PerformanceMonitor {
  private stats: PerformanceStats = {
    totalRequests: 0,
    slowQueries: 0,
    cacheHits: 0,
    cacheMisses: 0,
  };

  /**
   * Record a cache hit
   */
  recordCacheHit(): void {
    this.stats.cacheHits++;
  }

  /**
   * Record a cache miss
   */
  recordCacheMiss(): void {
    this.stats.cacheMisses++;
  }

  /**
   * Get cache hit rate as a percentage
   */
  getCacheHitRate(): number {
    const total = this.stats.cacheHits + this.stats.cacheMisses;
    if (total === 0) return 0;
    return (this.stats.cacheHits / total) * 100;
  }

  /**
   * Get current performance statistics
   */
  getStats(): PerformanceStats & { cacheHitRate: number } {
    return {
      ...this.stats,
      cacheHitRate: this.getCacheHitRate(),
    };
  }

  /**
   * Record a request completion
   */
  recordRequest(duration: number, path: string): void {
    this.stats.totalRequests++;

    // Detect slow queries (> 500ms)
    if (duration > 500) {
      this.stats.slowQueries++;
      this.logSlowQuery(duration, path);
    }
  }

  /**
   * Log slow query warning
   */
  private logSlowQuery(duration: number, path: string): void {
    console.warn(`[SLOW QUERY] ${path} took ${duration.toFixed(2)}ms`);
  }

  /**
   * Reset statistics (useful for testing or periodic resets)
   */
  reset(): void {
    this.stats = {
      totalRequests: 0,
      slowQueries: 0,
      cacheHits: 0,
      cacheMisses: 0,
    };
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Format duration for logging
 */
export function formatDuration(ms: number): string {
  if (ms < 1) return `${(ms * 1000).toFixed(0)}μs`;
  if (ms < 1000) return `${ms.toFixed(2)}ms`;
  return `${(ms / 1000).toFixed(2)}s`;
}

/**
 * Log request performance
 */
export function logRequestPerformance(
  path: string,
  duration: number,
  status: 'success' | 'error',
  userId?: number
): void {
  const level = duration > 500 ? 'warn' : 'info';
  const userInfo = userId ? ` [User: ${userId}]` : ' [Guest]';
  const statusIcon = status === 'success' ? '✓' : '✗';

  console[level](
    `[tRPC ${statusIcon}] ${path}${userInfo} - ${formatDuration(duration)}`
  );

  // Record in performance monitor
  performanceMonitor.recordRequest(duration, path);
}

/**
 * Log cache statistics periodically
 */
export function logCacheStats(): void {
  const stats = performanceMonitor.getStats();

  if (stats.totalRequests === 0) {
    return; // No requests yet, skip logging
  }

  console.info('[CACHE STATS]', {
    totalRequests: stats.totalRequests,
    cacheHits: stats.cacheHits,
    cacheMisses: stats.cacheMisses,
    hitRate: `${stats.cacheHitRate.toFixed(2)}%`,
    slowQueries: stats.slowQueries,
    slowQueryRate: `${((stats.slowQueries / stats.totalRequests) * 100).toFixed(2)}%`,
  });
}
