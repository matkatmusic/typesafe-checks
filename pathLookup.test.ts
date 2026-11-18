import { test, expect } from 'bun:test';
import { splitKeyPath, findPathValue, findNestedPathValue } from './pathLookup';

function assertSplitKeyPathSplitsKeysAndIndexes() {
    // A path with keys and one index splits into one step per key and per index.
    expect(splitKeyPath('a.b[0].c')).toEqual(['a', 'b', '[0]', 'c']);
}
test('test_split_key_path_splits_keys_and_indexes', assertSplitKeyPathSplitsKeysAndIndexes);

function assertSplitKeyPathReturnsEmptyForEmptyText() {
    // An empty path has no steps.
    expect(splitKeyPath('')).toEqual([]);
}
test('test_split_key_path_returns_empty_for_empty_text', assertSplitKeyPathReturnsEmptyForEmptyText);

function assertSplitKeyPathGivesSameResultOnRepeatedCalls() {
    // The same path split twice gives the same steps.
    expect(splitKeyPath('a.b')).toEqual(splitKeyPath('a.b'));
}
test('test_split_key_path_gives_same_result_on_repeated_calls', assertSplitKeyPathGivesSameResultOnRepeatedCalls);

function assertFindPathValueFindsNestedValue() {
    // A key path with an index reaches the value inside the array.
    expect(findPathValue({ a: [{ b: 5 }] }, 'a[0].b')).toEqual({ isFound: true, value: 5 });
}
test('test_find_path_value_finds_nested_value', assertFindPathValueFindsNestedValue);

function assertFindPathValueFailsOnMissingKey() {
    // A key that does not exist gives not found.
    expect(findPathValue({ a: 1 }, 'b')).toEqual({ isFound: false });
}
test('test_find_path_value_fails_on_missing_key', assertFindPathValueFailsOnMissingKey);

function assertFindPathValueFailsOnEmptyPath() {
    // An empty path gives not found.
    expect(findPathValue({ a: 1 }, '')).toEqual({ isFound: false });
}
test('test_find_path_value_fails_on_empty_path', assertFindPathValueFailsOnEmptyPath);

function assertFindNestedPathValueSearchesChildren() {
    // A path that exists only below the root is found in a child value.
    expect(findNestedPathValue({ wrapper: { a: 7 } }, 'a')).toEqual({ isFound: true, value: 7 });
}
test('test_find_nested_path_value_searches_children', assertFindNestedPathValueSearchesChildren);

function assertFindNestedPathValueFailsOnNull() {
    // A null root gives not found.
    expect(findNestedPathValue(null, 'a')).toEqual({ isFound: false });
}
test('test_find_nested_path_value_fails_on_null', assertFindNestedPathValueFailsOnNull);
