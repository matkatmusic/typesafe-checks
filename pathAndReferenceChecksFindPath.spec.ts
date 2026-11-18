import { test, expect } from 'bun:test';
import { splitKeyPath, findPathValue, findNestedPathValue } from './pathLookup';

function assertSplitKeyPathSplitsKeysAndIndexes() {
    // A path with keys and one index splits into one step per key and per index.
    expect(splitKeyPath('a.b[0].c')).toEqual(['a', 'b', '[0]', 'c']);
}
test('test_split_key_path_splits_keys_and_indexes', assertSplitKeyPathSplitsKeysAndIndexes);

function assertFindPathValueFindsNestedValue() {
    // The state has a value inside an object inside a list.
    const state = { ticket: { messages: [{ text: 'hello' }] } };
    // The lookup follows each key and index to the value.
    expect(findPathValue(state, 'ticket.messages[0].text')).toEqual({ isFound: true, value: 'hello' });
}
test('test_find_path_value_finds_nested_value', assertFindPathValueFindsNestedValue);

function assertFindPathValueRefusesIndexOnObjectAndKeyOnArray() {
    // An index step on an object finds nothing, even when the object has that key.
    expect(findPathValue({ a: { 0: 'x' } }, 'a[0]')).toEqual({ isFound: false });
    // A key step on a list finds nothing, even when the list has that position.
    expect(findPathValue({ a: ['x'] }, 'a.0')).toEqual({ isFound: false });
}
test('test_find_path_value_refuses_index_on_object_and_key_on_array', assertFindPathValueRefusesIndexOnObjectAndKeyOnArray);

function assertFindNestedPathValueFindsValueAtRoot() {
    // The path starts at the root of the value.
    const root = { fruit: 'apple' };
    // The lookup finds the value without going deeper.
    expect(findNestedPathValue(root, 'fruit')).toEqual({ isFound: true, value: 'apple' });
}
test('test_find_nested_path_value_finds_value_at_root', assertFindNestedPathValueFindsValueAtRoot);

function assertFindNestedPathValueFindsValueInChild() {
    // The path starts inside a list item inside an object, not at the root.
    const root = { message: { parts: [{ text: 'hi' }] } };
    // The lookup goes down into each child until the path matches.
    expect(findNestedPathValue(root, 'text')).toEqual({ isFound: true, value: 'hi' });
}
test('test_find_nested_path_value_finds_value_in_child', assertFindNestedPathValueFindsValueInChild);

function assertFindNestedPathValueMissReturnsNotFound() {
    // No object at any depth has the key.
    const root = { message: { text: 'hi' } };
    // The lookup finds nothing.
    expect(findNestedPathValue(root, 'nope')).toEqual({ isFound: false });
}
test('test_find_nested_path_value_miss_returns_not_found', assertFindNestedPathValueMissReturnsNotFound);
