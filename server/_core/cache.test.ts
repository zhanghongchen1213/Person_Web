/**
 * LRU Cache Unit Tests
 *
 * Run with: npx tsx server/_core/cache.test.ts
 */

import { LRUCache } from './cache';

function assert(condition: boolean, message: string): void {
  if (!condition) {
    throw new Error(`Assertion failed: ${message}`);
  }
}

function testBasicGetSet() {
  console.log('Test 1: Basic get/set operations');
  const cache = new LRUCache<string>(3);

  cache.set('key1', 'value1');
  assert(cache.get('key1') === 'value1', 'Should get value1');
  assert(cache.get('key2') === undefined, 'Should return undefined for non-existent key');

  console.log('✓ Test 1 passed');
}

function testLRUEviction() {
  console.log('Test 2: LRU eviction');
  const cache = new LRUCache<number>(3);

  cache.set('a', 1);
  cache.set('b', 2);
  cache.set('c', 3);
  assert(cache.size() === 3, 'Cache should have 3 items');

  // Add 4th item, should evict 'a' (least recently used)
  cache.set('d', 4);
  assert(cache.size() === 3, 'Cache should still have 3 items');
  assert(cache.get('a') === undefined, 'Key "a" should be evicted');
  assert(cache.get('b') === 2, 'Key "b" should still exist');

  console.log('✓ Test 2 passed');
}

function testTTLExpiration() {
  console.log('Test 3: TTL expiration');
  const cache = new LRUCache<string>(10);

  // Set with 100ms TTL
  cache.set('temp', 'temporary', 100);
  assert(cache.get('temp') === 'temporary', 'Should get value immediately');

  // Wait for expiration
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert(cache.get('temp') === undefined, 'Should return undefined after TTL expires');
      console.log('✓ Test 3 passed');
      resolve();
    }, 150);
  });
}

function testDeletePattern() {
  console.log('Test 4: Delete pattern');
  const cache = new LRUCache<string>(10);

  cache.set('article:list:page:1', 'data1');
  cache.set('article:list:page:2', 'data2');
  cache.set('category:list:all', 'data3');
  cache.set('doc:tree:all', 'data4');

  assert(cache.size() === 4, 'Cache should have 4 items');

  // Delete all article-related entries
  const deleted = cache.deletePattern(/^article:/);
  assert(deleted === 2, 'Should delete 2 article entries');
  assert(cache.size() === 2, 'Cache should have 2 items left');
  assert(cache.get('article:list:page:1') === undefined, 'Article entry should be deleted');
  assert(cache.get('category:list:all') === 'data3', 'Category entry should remain');

  console.log('✓ Test 4 passed');
}

function testClear() {
  console.log('Test 5: Clear cache');
  const cache = new LRUCache<string>(10);

  cache.set('key1', 'value1');
  cache.set('key2', 'value2');
  assert(cache.size() === 2, 'Cache should have 2 items');

  cache.clear();
  assert(cache.size() === 0, 'Cache should be empty');
  assert(cache.get('key1') === undefined, 'All entries should be cleared');

  console.log('✓ Test 5 passed');
}

function testHas() {
  console.log('Test 6: Has method');
  const cache = new LRUCache<string>(10);

  cache.set('key1', 'value1');
  assert(cache.has('key1') === true, 'Should return true for existing key');
  assert(cache.has('key2') === false, 'Should return false for non-existent key');

  // Test with expired entry
  cache.set('temp', 'value', 50);
  return new Promise<void>((resolve) => {
    setTimeout(() => {
      assert(cache.has('temp') === false, 'Should return false for expired key');
      console.log('✓ Test 6 passed');
      resolve();
    }, 100);
  });
}

function testGetStats() {
  console.log('Test 7: Get stats');
  const cache = new LRUCache<string>(5);

  cache.set('key1', 'value1');
  cache.set('key2', 'value2');

  const stats = cache.getStats();
  assert(stats.size === 2, 'Stats should show 2 items');
  assert(stats.maxSize === 5, 'Stats should show max size of 5');
  assert(stats.utilization === 40, 'Stats should show 40% utilization');

  console.log('✓ Test 7 passed');
}

// Run all tests
async function runTests() {
  console.log('Running LRU Cache Tests...\n');

  try {
    testBasicGetSet();
    testLRUEviction();
    await testTTLExpiration();
    testDeletePattern();
    testClear();
    await testHas();
    testGetStats();

    console.log('\n✅ All tests passed!');
  } catch (error) {
    console.error('\n❌ Test failed:', error);
    process.exit(1);
  }
}

runTests();
