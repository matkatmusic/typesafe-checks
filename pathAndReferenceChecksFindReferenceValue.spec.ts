import { test, expect } from 'bun:test';
import { findReferenceValue } from './referenceChecks';

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
