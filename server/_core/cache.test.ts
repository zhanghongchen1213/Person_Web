import { describe, it, expect, vi } from "vitest";
import { LRUCache, generateArticleListKey, generateCategoryListKey, generateDocTreeKey } from "./cache";

describe("LRUCache", () => {
  it("basic get/set", () => {
    const cache = new LRUCache<string>(3);
    cache.set("key1", "value1");
    expect(cache.get("key1")).toBe("value1");
    expect(cache.get("key2")).toBeUndefined();
  });

  it("evicts least recently used item", () => {
    const cache = new LRUCache<number>(3);
    cache.set("a", 1);
    cache.set("b", 2);
    cache.set("c", 3);
    cache.set("d", 4);
    expect(cache.size()).toBe(3);
    expect(cache.get("a")).toBeUndefined();
    expect(cache.get("b")).toBe(2);
  });

  it("respects TTL expiration", () => {
    vi.useFakeTimers();
    const cache = new LRUCache<string>(10);
    cache.set("temp", "value", 100);
    expect(cache.get("temp")).toBe("value");
    vi.advanceTimersByTime(150);
    expect(cache.get("temp")).toBeUndefined();
    vi.useRealTimers();
  });

  it("deletePattern removes matching keys", () => {
    const cache = new LRUCache<string>(10);
    cache.set("article:list:1", "d1");
    cache.set("article:list:2", "d2");
    cache.set("category:list", "d3");
    expect(cache.deletePattern(/^article:/)).toBe(2);
    expect(cache.size()).toBe(1);
  });

  it("clear removes all entries", () => {
    const cache = new LRUCache<string>(10);
    cache.set("a", "1");
    cache.set("b", "2");
    cache.clear();
    expect(cache.size()).toBe(0);
  });

  it("has returns false for expired keys", () => {
    vi.useFakeTimers();
    const cache = new LRUCache<string>(10);
    cache.set("temp", "v", 50);
    expect(cache.has("temp")).toBe(true);
    vi.advanceTimersByTime(100);
    expect(cache.has("temp")).toBe(false);
    vi.useRealTimers();
  });

  it("getStats returns correct utilization", () => {
    const cache = new LRUCache<string>(5);
    cache.set("a", "1");
    cache.set("b", "2");
    const stats = cache.getStats();
    expect(stats.size).toBe(2);
    expect(stats.maxSize).toBe(5);
    expect(stats.utilization).toBe(40);
  });
});

describe("cache key generators", () => {
  it("generateArticleListKey", () => {
    expect(generateArticleListKey({ page: 1, limit: 10, status: "published" }))
      .toBe("article:list:page:1:limit:10:status:published");
  });

  it("generateCategoryListKey", () => {
    expect(generateCategoryListKey()).toBe("category:list:all");
    expect(generateCategoryListKey({ type: "blog" })).toBe("category:list:type:blog");
  });

  it("generateDocTreeKey", () => {
    expect(generateDocTreeKey()).toBe("doc:tree:all");
    expect(generateDocTreeKey("guide")).toBe("doc:tree:category:guide");
  });
});
