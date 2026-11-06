import { test, expect } from 'bun:test';
import { splitKeyPath, findPathValue, findNestedPathValue, findReferenceValue, findReferenceError, listBacktickedKeys, listUndefinedReferences, collectReferenceNames } from './typesafeChecks';

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
  const questions = { q: { type: 'noul', instructions: { field: { value: 'three' }, question: 'Is `field.value` valid?' } } };
  // The name is in the instructions, so no name is listed.
  expect(listUndefinedReferences({}, questions)).toEqual([]);
}
test('test_reference_found_in_own_instructions_passes', assertReferenceFoundInOwnInstructionsPasses);

function assertReferenceMissingFromBothIsListed() {
  // The instructions name a value that is in neither the state nor the instructions.
  const questions = { q: { type: 'noul', instructions: 'Does `nope` exist?' } };
  // The error names the question and the name.
  expect(listUndefinedReferences({ a: 1 }, questions)).toEqual(['q: `nope` is not in state or in this question']);
}
test('test_reference_missing_from_both_is_listed', assertReferenceMissingFromBothIsListed);

function assertReferenceInCriteriaIsChecked() {
  // One criteria text names a state value, and one names a missing value.
  const questions = { q: { type: 'choice', criteria: { yes: 'Uses `a`.', no: 'Uses `missing`.' } } };
  // Only the missing name is listed.
  expect(listUndefinedReferences({ a: 'one' }, questions)).toEqual(['q: `missing` is not in state or in this question']);
}
test('test_reference_in_criteria_is_checked', assertReferenceInCriteriaIsChecked);

function assertReferenceWithStringStateChecksInstructionsOnly() {
  // The state is text, and the instructions name their own field and the text length.
  const questions = { q: { type: 'noul', instructions: { field: { value: 'three' }, question: 'Is `field.value` more than `length`?' } } };
  // The own field passes. Text state gives no values, so only the question is checked; `length` is listed.
  expect(listUndefinedReferences('some text', questions)).toEqual(['q: `length` is not in state or in this question']);
}
test('test_reference_with_string_state_checks_instructions_only', assertReferenceWithStringStateChecksInstructionsOnly);

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

function assertFindReferenceValueChecksStateFirst() {
  // The state and the question both have the name, with different values.
  const question = { type: 'noul', instructions: { fruit: 'banana' } };
  // The state value wins.
  expect(findReferenceValue({ fruit: 'apple' }, question, 'fruit')).toEqual({ isFound: true, value: 'apple' });
}
test('test_find_reference_value_checks_state_first', assertFindReferenceValueChecksStateFirst);

function assertFindReferenceValueFindsNameInQuestion() {
  // Only the question has the name, in its instructions.
  const question = { type: 'noul', instructions: { secretWord: 'banana' } };
  // The lookup finds the question value.
  expect(findReferenceValue({}, question, 'secretWord')).toEqual({ isFound: true, value: 'banana' });
}
test('test_find_reference_value_finds_name_in_question', assertFindReferenceValueFindsNameInQuestion);

function assertFindReferenceValueWithoutQuestionChecksStateOnly() {
  // A name used inside the state itself has no question.  The lookup finds the state value.
  expect(findReferenceValue({ fruit: 'apple' }, undefined, 'fruit')).toEqual({ isFound: true, value: 'apple' });
}
test('test_find_reference_value_without_question_checks_state_only', assertFindReferenceValueWithoutQuestionChecksStateOnly);

function assertFindReferenceValueRefusesNestedStateKeyWithoutParentPath() {
  // The state has text inside an object. The name is only the inner key.
  const state = { message: { text: 'hi' } };
  // The state lookup is anchored at the top level, so the inner key is not found.
  expect(findReferenceValue(state, undefined, 'text')).toEqual({ isFound: false });
}
test('test_find_reference_value_refuses_nested_state_key_without_parent_path', assertFindReferenceValueRefusesNestedStateKeyWithoutParentPath);

function assertFindReferenceValueFindsDottedStatePath() {
  // The state has text inside an object.
  const state = { message: { text: 'hi' } };
  // The dotted path from the top level is found.
  expect(findReferenceValue(state, undefined, 'message.text')).toEqual({ isFound: true, value: 'hi' });
}
test('test_find_reference_value_finds_dotted_state_path', assertFindReferenceValueFindsDottedStatePath);

function assertFindReferenceValueFindsIndexedStatePath() {
  // The state has a list of objects with text.
  const state = { messages: [{ text: 'hi' }] };
  // The path with an index step is found.
  expect(findReferenceValue(state, undefined, 'messages[0].text')).toEqual({ isFound: true, value: 'hi' });
}
test('test_find_reference_value_finds_indexed_state_path', assertFindReferenceValueFindsIndexedStatePath);

function assertFindReferenceValueFindsNestedQuestionKeyAtAnyDepth() {
  // The question has the inner key two levels down in its instructions.
  const question = { type: 'noul', instructions: { details: { secretWord: 'banana' } } };
  // The question lookup still goes down to any depth.
  expect(findReferenceValue({}, question, 'secretWord')).toEqual({ isFound: true, value: 'banana' });
}
test('test_find_reference_value_finds_nested_question_key_at_any_depth', assertFindReferenceValueFindsNestedQuestionKeyAtAnyDepth);

function assertFindReferenceErrorPassesNumber() {
  // The name points to a number.  No error.
  expect(findReferenceError({ count: 3 }, undefined, 'count')).toBeNull();
}
test('test_find_reference_error_passes_number', assertFindReferenceErrorPassesNumber);

function assertFindReferenceErrorPassesBoolean() {
  // The names point to true and false.  No error.
  expect(findReferenceError({ isOn: true, isOff: false }, undefined, 'isOn')).toBeNull();
  expect(findReferenceError({ isOn: true, isOff: false }, undefined, 'isOff')).toBeNull();
}
test('test_find_reference_error_passes_boolean', assertFindReferenceErrorPassesBoolean);

function assertFindReferenceErrorPassesNull() {
  // The name points to null.  No error.
  expect(findReferenceError({ nothing: null }, undefined, 'nothing')).toBeNull();
}
test('test_find_reference_error_passes_null', assertFindReferenceErrorPassesNull);

function assertFindReferenceErrorRefusesArray() {
  // The name points to a list.  The error says the name must not point to an object or array.
  expect(findReferenceError({ items: ['a'] }, undefined, 'items')).toBe('`items` must not point to an object or array');
}
test('test_find_reference_error_refuses_array', assertFindReferenceErrorRefusesArray);

function assertFindReferenceErrorReportsNestedStateKeyWithoutParentPath() {
  // The state has the key only inside an object.  The error says the name is missing.
  expect(findReferenceError({ message: { text: 'hi' } }, undefined, 'text')).toBe('`text` is not in state or in this question');
}
test('test_find_reference_error_reports_nested_state_key_without_parent_path', assertFindReferenceErrorReportsNestedStateKeyWithoutParentPath);

function assertFindReferenceErrorPassesPlainText() {
  // The name points to text with no backtick.  No error.
  expect(findReferenceError({ fruit: 'apple' }, undefined, 'fruit')).toBeNull();
}
test('test_find_reference_error_passes_plain_text', assertFindReferenceErrorPassesPlainText);

function assertFindReferenceErrorReportsMissingName() {
  // The name is in neither the state nor the question.  The error says the name is missing.
  expect(findReferenceError({ fruit: 'apple' }, { type: 'noul' }, 'nope')).toBe('`nope` is not in state or in this question');
}
test('test_find_reference_error_reports_missing_name', assertFindReferenceErrorReportsMissingName);

// function assertFindReferenceErrorReportsNonText() {
//   // The name points to an object, not to text.  The error says the name must point to text.
//   expect(findReferenceError({ data: { a: 'fruit' } }, undefined, 'data')).toBe('`data` must point to text');
// }
// test('test_find_reference_error_reports_non_text', assertFindReferenceErrorReportsNonText);

function assertFindReferenceErrorRefusesObject() {
  // The name points to an object.  The error says the name must not point to an object or array.
  expect(findReferenceError({ data: { a: 'fruit' } }, undefined, 'data')).toBe('`data` must not point to an object or array');
}
test('test_find_reference_error_refuses_object', assertFindReferenceErrorRefusesObject);

function assertFindReferenceErrorReportsTextWithBackticks() {
  // The name points to text that has another backticked name.  The error says TypeSafe resolves only one level.
  expect(findReferenceError({ banana: '`fruit`' }, undefined, 'banana')).toBe('`banana` points to text with backticks; TypeSafe resolves only one level');
}
test('test_find_reference_error_reports_text_with_backticks', assertFindReferenceErrorReportsTextWithBackticks);

function assertListBacktickedKeysReportsCriteriaKey() {
  // One criteria key is a backticked name. Some values are backticked names too.
  const question = { type: 'choice', instructions: 'what kind of fruit is `fruit`?', criteria: { '`fruit`': '`fruit`', apple: '`fruit`', banana: 'banana', peach: 'peach', other: 'something else' } };
  // Only the key is listed. The values are fine.
  expect(listBacktickedKeys(question, 'choicetest')).toEqual(['choicetest.criteria.`fruit`: backticked names cannot be keys']);
}
test('test_list_backticked_keys_reports_criteria_key', assertListBacktickedKeysReportsCriteriaKey);

function assertListBacktickedKeysUsesIndexPathForArrayItems() {
  // A key inside a list item is a backticked name.
  const question = { type: 'score', criteria: [{ '`fruit`': 'x' }] };
  // The path names the list position.
  expect(listBacktickedKeys(question, 'q')).toEqual(['q.criteria[0].`fruit`: backticked names cannot be keys']);
}
test('test_list_backticked_keys_uses_index_path_for_array_items', assertListBacktickedKeysUsesIndexPathForArrayItems);

function assertReferenceDeclaredInOtherQuestionIsListed() {
  // ownName declares secretWord in its instructions. crossName uses it without declaring it. stateName uses a state name.
  const questions = {
    ownName: { type: 'noul', instructions: { task: 'Is `secretWord` the word banana?', secretWord: 'banana' } },
    crossName: { type: 'noul', instructions: 'Is `secretWord` the word banana?' },
    stateName: { type: 'noul', instructions: 'Is `fruit` the word apple?' },
  };
  // Only crossName gets an error.
  expect(listUndefinedReferences({ fruit: 'apple' }, questions)).toEqual(['crossName: `secretWord` is not in state or in this question']);
}
test('test_reference_declared_in_other_question_is_listed', assertReferenceDeclaredInOtherQuestionIsListed);

function assertReferenceToTextWithBackticksIsListed() {
  // The instructions declare banana as text that has another backticked name.
  const questions = {
    scopeDeclarationInInstructions: {
      type: 'choice',
      instructions: { question: 'is `fruit` the same word as `banana`?', banana: '`fruit`' },
      criteria: { Yes: 'yes they are the same word', no: 'no they are different words', 'something else': 'cannot determine' },
    },
  };
  // Only banana gets an error. fruit points to plain text.
  expect(listUndefinedReferences({ fruit: 'apple' }, questions)).toEqual(['scopeDeclarationInInstructions: `banana` points to text with backticks; TypeSafe resolves only one level']);
}
test('test_reference_to_text_with_backticks_is_listed', assertReferenceToTextWithBackticksIsListed);

function assertReferenceToObjectIsListed() {
  // data is an object in the state. localValue is an object in the question.
  const state = { fruit: 'apple', data: { a: 'fruit' } };
  const questions = { dataCheck: { type: 'noul', localValue: { a: 'fruit' }, instructions: 'is `data` the same as `localValue`?', criteria: { true: "Yes, they're the same", false: 'No, they are different' } } };
  // Both names get an error, because neither may point to an object or array.
  expect(listUndefinedReferences(state, questions)).toEqual(['dataCheck: `data` must not point to an object or array', 'dataCheck: `localValue` must not point to an object or array']);
}
test('test_reference_to_object_is_listed', assertReferenceToObjectIsListed);

// function assertReferenceFoundAtAnyDepthInStatePasses() {
//   // The state has text inside an object. The instructions name only the inner key.
//   const questions = { q: { type: 'noul', instructions: 'say `text`' } };
//   // The name is found at depth, so no name is listed.
//   expect(listUndefinedReferences({ message: { text: 'hi' } }, questions)).toEqual([]);
// }
// test('test_reference_found_at_any_depth_in_state_passes', assertReferenceFoundAtAnyDepthInStatePasses);

function assertReferenceToNestedStateKeyWithoutParentPathIsListed() {
  // The state has text inside an object. The instructions name only the inner key.
  const questions = { q: { type: 'noul', instructions: 'say `text`' } };
  // The inner key alone is not in the state's top level, so the name is listed.
  expect(listUndefinedReferences({ message: { text: 'hi' } }, questions)).toEqual(['q: `text` is not in state or in this question']);
}
test('test_reference_to_nested_state_key_without_parent_path_is_listed', assertReferenceToNestedStateKeyWithoutParentPathIsListed);

function assertReferenceToDottedStatePathPasses() {
  // The state has text inside an object. The instructions name the full dotted path.
  const questions = { q: { type: 'noul', instructions: 'say `message.text`' } };
  // The dotted path is found, so no name is listed.
  expect(listUndefinedReferences({ message: { text: 'hi' } }, questions)).toEqual([]);
}
test('test_reference_to_dotted_state_path_passes', assertReferenceToDottedStatePathPasses);

function assertReferenceToNumberBooleanAndNullPasses() {
  // The state has a number, a boolean and null. The instructions name all three.
  const questions = { q: { type: 'noul', instructions: 'is `count` or `isOn` or `nothing` set?' } };
  // None of the three is listed.
  expect(listUndefinedReferences({ count: 3, isOn: true, nothing: null }, questions)).toEqual([]);
}
test('test_reference_to_number_boolean_and_null_passes', assertReferenceToNumberBooleanAndNullPasses);

function assertBacktickedKeyIsListed() {
  // A criteria key is a backticked name.
  const questions = { choicetest: { type: 'choice', instructions: 'what kind of fruit is `fruit`?', criteria: { '`fruit`': '`fruit`', apple: '`fruit`', banana: 'banana', peach: 'peach', other: 'something else' } } };
  // The key is listed. The backticked values are fine.
  expect(listUndefinedReferences({ fruit: 'apple' }, questions)).toEqual(['choicetest.criteria.`fruit`: backticked names cannot be keys']);
}
test('test_backticked_key_is_listed', assertBacktickedKeyIsListed);

function assertFindReferenceErrorAllowsEscapedBackticks() {
  // The name points to text that has only escaped backticks.  No error: an escaped backtick is plain text.
  expect(findReferenceError({ banana: 'say \\`hi\\`' }, undefined, 'banana')).toBeNull();
}
test('test_find_reference_error_allows_escaped_backticks', assertFindReferenceErrorAllowsEscapedBackticks);

function assertFindReferenceErrorReportsUnescapedBacktick() {
  // The name points to text that has a real backticked name.  The error says TypeSafe resolves only one level.
  expect(findReferenceError({ banana: 'say `fruit`' }, undefined, 'banana')).toBe('`banana` points to text with backticks; TypeSafe resolves only one level');
}
test('test_find_reference_error_reports_unescaped_backtick', assertFindReferenceErrorReportsUnescapedBacktick);

function assertCollectReferenceNamesSkipsEscapedBackticks() {
  // The text has a word inside escaped backticks.  No name is found.
  expect(collectReferenceNames('a \\`fruit\\` b')).toEqual([]);
}
test('test_collect_reference_names_skips_escaped_backticks', assertCollectReferenceNamesSkipsEscapedBackticks);

function assertListBacktickedKeysSkipsEscapedBackticks() {
  // A key has escaped backticks around a word.  No key is listed.
  expect(listBacktickedKeys({ 'x\\`y\\`': 1 }, 'q')).toEqual([]);
}
test('test_list_backticked_keys_skips_escaped_backticks', assertListBacktickedKeysSkipsEscapedBackticks);
