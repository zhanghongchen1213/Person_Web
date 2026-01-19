/**
 * Performance Monitoring Tests
 *
 * Tests for the performance monitoring system
 */

import { performanceMonitor, formatDuration, logRequestPerformance } from '../performance';

describe('Performance Monitor', () => {
  beforeEach(() => {
    // Reset stats before each test
    performanceMonitor.reset();
  });

  describe('Cache Statistics', () => {
    it('should track cache hits', () => {
      performanceMonitor.recordCacheHit();
      performanceMonitor.recordCacheHit();

      const stats = performanceMonitor.getStats();
      expect(stats.cacheHits).toBe(2);
      expect(stats.cacheMisses).toBe(0);
    });

    it('should track cache misses', () => {
      performanceMonitor.recordCacheMiss();
      performanceMonitor.recordCacheMiss();
      performanceMonitor.recordCacheMiss();

      const stats = performanceMonitor.getStats();
      expect(stats.cacheHits).toBe(0);
      expect(stats.cacheMisses).toBe(3);
    });

    it('should calculate cache hit rate correctly', () => {
      performanceMonitor.recordCacheHit();
      performanceMonitor.recordCacheHit();
      performanceMonitor.recordCacheHit();
      performanceMonitor.recordCacheHit();
      performanceMonitor.recordCacheMiss();

      const stats = performanceMonitor.getStats();
      expect(stats.cacheHitRate).toBe(80); // 4/5 = 80%
    });

    it('should return 0% hit rate when no cache operations', () => {
      const stats = performanceMonitor.getStats();
      expect(stats.cacheHitRate).toBe(0);
    });
  });

  describe('Request Tracking', () => {
    it('should track total requests', () => {
      performanceMonitor.recordRequest(100, 'test.path');
      performanceMonitor.recordRequest(200, 'test.path');

      const stats = performanceMonitor.getStats();
      expect(stats.totalRequests).toBe(2);
    });

    it('should detect slow queries', () => {
      performanceMonitor.recordRequest(600, 'slow.query');
      performanceMonitor.recordRequest(100, 'fast.query');

      const stats = performanceMonitor.getStats();
      expect(stats.slowQueries).toBe(1);
    });

    it('should not flag queries under 500ms as slow', () => {
      performanceMonitor.recordRequest(499, 'fast.query');
      performanceMonitor.recordRequest(100, 'fast.query');

      const stats = performanceMonitor.getStats();
      expect(stats.slowQueries).toBe(0);
    });
  });

  describe('Duration Formatting', () => {
    it('should format microseconds correctly', () => {
      expect(formatDuration(0.5)).toBe('500μs');
    });

    it('should format milliseconds correctly', () => {
      expect(formatDuration(45.23)).toBe('45.23ms');
      expect(formatDuration(500)).toBe('500.00ms');
    });

    it('should format seconds correctly', () => {
      expect(formatDuration(1500)).toBe('1.50s');
      expect(formatDuration(5000)).toBe('5.00s');
    });
  });
});
