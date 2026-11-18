import { test, expect } from 'bun:test';
import { collectReferenceNames, findReferenceError, findReferenceValue, listBacktickedKeys, listUndefinedReferences } from './referenceChecks';

function validateStateValueWinsOverQuestionValue() {
    // Step: state and question both hold "a".  Step: the state value is found.
    const lookup = findReferenceValue({ a: 1 }, { a: 2 }, 'a');
    expect(lookup.isFound).toBe(true);
    expect(lookup.isFound && lookup.value).toBe(1);
}

function validateMissingNameGivesError() {
    // Step: a name is in neither state nor question.  Step: the not-found error shows.
    expect(findReferenceError({}, {}, 'missing')).toBe('`missing` is not in state or in this question');
}

function validateObjectTargetGivesError() {
    // Step: a name points to an object.  Step: the object error shows.
    expect(findReferenceError({ a: { b: 1 } }, {}, 'a')).toBe('`a` must not point to an object or array');
}

function validateBacktickInTargetTextGivesNoError() {
    // Step: a name points to text with an unescaped backtick.  Step: no error shows.
    expect(findReferenceError({ a: 'hi `x`' }, {}, 'a')).toBeNull();
}

function validateStateValueWithBacktickedTableCellGivesNoError() {
    // Step: the state holds an earlier assistant message with `sms.xml` in backticks.
    const state = { earlierAssistantMessage: '| file | note |\n| `sms.xml` | backup |' };
    // Step: a question points at that message.  Step: no error shows, because state values are not checked for backticks.
    expect(findReferenceError(state, {}, 'earlierAssistantMessage')).toBeNull();
}

function validateEscapedBacktickInTargetTextGivesNoError() {
    // Step: a backslash comes before the backtick.  Step: no error shows.
    expect(findReferenceError({ a: 'hi \\`x' }, {}, 'a')).toBeNull();
}

function validateBacktickedKeyGivesError() {
    // Step: a key is written with backticks.  Step: the error holds the path.
    expect(listBacktickedKeys({ '`name`': 1 }, 'q')).toEqual(['q.`name`: backticked names cannot be keys']);
}

function validateNestedNamesAreCollected() {
    // Step: names sit in a nested string and a nested array.  Step: all names come back in order.
    expect(collectReferenceNames({ a: 'x `one` y', b: ['`two.three`'] })).toEqual(['one', 'two.three']);
}

function validateUnknownReferenceHasQuestionName() {
    // Step: a question uses an unknown name.  Step: the error starts with the question name.
    expect(listUndefinedReferences({}, { q1: 'use `nope`' })).toEqual(['q1: `nope` is not in state or in this question']);
}

test('test_state_value_wins_over_question_value', validateStateValueWinsOverQuestionValue);
test('test_missing_name_gives_error', validateMissingNameGivesError);
test('test_object_target_gives_error', validateObjectTargetGivesError);
test('test_backtick_in_target_text_gives_no_error', validateBacktickInTargetTextGivesNoError);
test('test_state_value_with_backticked_table_cell_gives_no_error', validateStateValueWithBacktickedTableCellGivesNoError);
test('test_escaped_backtick_in_target_text_gives_no_error', validateEscapedBacktickInTargetTextGivesNoError);
test('test_backticked_key_gives_error', validateBacktickedKeyGivesError);
test('test_nested_names_are_collected', validateNestedNamesAreCollected);
test('test_unknown_reference_has_question_name', validateUnknownReferenceHasQuestionName);
