import { test, expect } from 'bun:test';
import { listUndefinedReferences } from './referenceChecks';

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

function assertReferenceToTextWithBackticksIsNotListed() {
    // The instructions declare banana as text that has another backticked name.
    const questions = {
        scopeDeclarationInInstructions: {
            type: 'choice',
            instructions: { question: 'is `fruit` the same word as `banana`?', banana: '`fruit`' },
            criteria: { Yes: 'yes they are the same word', no: 'no they are different words', 'something else': 'cannot determine' },
        },
    };
    // No name gets an error. banana points to question text, and backticks in it are not checked.
    expect(listUndefinedReferences({ fruit: 'apple' }, questions)).toEqual([]);
}
test('test_reference_to_text_with_backticks_is_not_listed', assertReferenceToTextWithBackticksIsNotListed);

function assertReferenceToObjectIsListed() {
    // data is an object in the state. localValue is an object in the question.
    const state = { fruit: 'apple', data: { a: 'fruit' } };
    const questions = { dataCheck: { type: 'noul', localValue: { a: 'fruit' }, instructions: 'is `data` the same as `localValue`?', criteria: { true: "Yes, they're the same", false: 'No, they are different' } } };
    // Both names get an error, because neither may point to an object or array.
    expect(listUndefinedReferences(state, questions)).toEqual(['dataCheck: `data` must not point to an object or array', 'dataCheck: `localValue` must not point to an object or array']);
}
test('test_reference_to_object_is_listed', assertReferenceToObjectIsListed);

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
