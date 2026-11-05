import { test, expect } from 'bun:test';
import { splitKeyPath, findPathValue, listUndefinedReferences } from './typesafeChecks';

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

function assertReferenceFoundInStatePasses() {
  // The instructions name a nested state value.
  const state = { ticket: { messages: [{ text: 'hello' }] } };
  const questions = { q: { type: 'noul', instructions: 'Is `ticket.messages[0].text` rude?' } };
  // The name is in the state, so no name is listed.
  expect(listUndefinedReferences(state, questions)).toEqual([]);
}
test('test_reference_found_in_state_passes', assertReferenceFoundInStatePasses);

function assertReferenceFoundInOwnInstructionsPasses() {
  // The structured instructions name their own field, and the state does not have it.
  const questions = { q: { type: 'noul', instructions: { field: { value: 3 }, question: 'Is `field.value` valid?' } } };
  // The name is in the instructions, so no name is listed.
  expect(listUndefinedReferences({}, questions)).toEqual([]);
}
test('test_reference_found_in_own_instructions_passes', assertReferenceFoundInOwnInstructionsPasses);

function assertReferenceMissingFromBothIsListed() {
  // The instructions name a value that is in neither the state nor the instructions.
  const questions = { q: { type: 'noul', instructions: 'Does `nope` exist?' } };
  // The error names the question and the name.
  expect(listUndefinedReferences({ a: 1 }, questions)).toEqual(['q: `nope` is not in state or in its instructions']);
}
test('test_reference_missing_from_both_is_listed', assertReferenceMissingFromBothIsListed);

function assertReferenceInCriteriaIsChecked() {
  // One criteria text names a state value, and one names a missing value.
  const questions = { q: { type: 'choice', criteria: { yes: 'Uses `a`.', no: 'Uses `missing`.' } } };
  // Only the missing name is listed.
  expect(listUndefinedReferences({ a: 1 }, questions)).toEqual(['q: `missing` is not in state or in its instructions']);
}
test('test_reference_in_criteria_is_checked', assertReferenceInCriteriaIsChecked);

function assertReferenceWithStringStateChecksInstructionsOnly() {
  // The state is text, and the instructions name their own field and the text length.
  const questions = { q: { type: 'noul', instructions: { field: { value: 3 }, question: 'Is `field.value` more than `length`?' } } };
  // The own field passes. The text state gives no values, so `length` is listed.
  expect(listUndefinedReferences('some text', questions)).toEqual(['q: `length` is not in state or in its instructions']);
}
test('test_reference_with_string_state_checks_instructions_only', assertReferenceWithStringStateChecksInstructionsOnly);
