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
    // Step: a name points to an object.  Step: no error shows.
    expect(findReferenceError({ a: { b: 1 } }, {}, 'a')).toBeNull();
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

function validateReferenceToOwnInstructionsArrayGivesNoError() {
    // Step: the state holds agentReply.  Step: the question's instructions hold an exclusions array, and the question points at it.
    const state = { agentReply: 'Which file do you want?' };
    const question = { type: 'noul', instructions: { background: 'bg', exclusions: ['a status sentence'], question: 'Accounting for the choices in `exclusions`, Is a question or choice for the user written in `agentReply`? ' }, criteria: { true: 'YES', false: 'NO' } };
    // Step: no error shows, because a name may point to an array.
    expect(listUndefinedReferences(state, { questionOrChoiceV3: question })).toEqual([]);
}

function validateReferenceToStateArrayGivesNoError() {
    // Step: the state holds a charges array and a customer object.  Step: a question points at both.
    const state = { order: { charges: [1, 2] }, customer: { name: 'Ann' } };
    const question = { type: 'noul', instructions: 'Are `order.charges` fine for `customer`?' };
    // Step: no error shows, because a name may point to an array or an object.
    expect(listUndefinedReferences(state, { q: question })).toEqual([]);
}

test('test_reference_to_own_instructions_array_gives_no_error', validateReferenceToOwnInstructionsArrayGivesNoError);
test('test_reference_to_state_array_gives_no_error', validateReferenceToStateArrayGivesNoError);
test('test_state_value_wins_over_question_value', validateStateValueWinsOverQuestionValue);
test('test_missing_name_gives_error', validateMissingNameGivesError);
test('test_object_target_gives_error', validateObjectTargetGivesError);
test('test_backtick_in_target_text_gives_no_error', validateBacktickInTargetTextGivesNoError);
test('test_state_value_with_backticked_table_cell_gives_no_error', validateStateValueWithBacktickedTableCellGivesNoError);
test('test_escaped_backtick_in_target_text_gives_no_error', validateEscapedBacktickInTargetTextGivesNoError);
test('test_backticked_key_gives_error', validateBacktickedKeyGivesError);
test('test_nested_names_are_collected', validateNestedNamesAreCollected);
test('test_unknown_reference_has_question_name', validateUnknownReferenceHasQuestionName);
