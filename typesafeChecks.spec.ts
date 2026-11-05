import { test, expect } from 'bun:test';
import { splitKeyPath, findPathValue, listStateErrors, listQuestionsErrors, listUndefinedReferences } from './typesafeChecks';

const ENTRY_ERROR = 'must be a string, object, array or null';

function buildChoiceCriteria(optionCount: number): Record<string, string> {
  const criteria: Record<string, string> = {};
  for (let optionIndex = 0; optionIndex < optionCount; optionIndex++)
    criteria[`option${optionIndex}`] = `Option ${optionIndex}.`;
  return criteria;
}

function buildScoreCriteria(levelCount: number): string[] {
  const criteria: string[] = [];
  for (let levelIndex = 0; levelIndex < levelCount; levelIndex++)
    criteria.push(`Level ${levelIndex}.`);
  return criteria;
}

test('test_split_key_path_splits_keys_and_indexes', () => {
  // A path with keys and one index splits into one step per key and per index.
  expect(splitKeyPath('a.b[0].c')).toEqual(['a', 'b', '[0]', 'c']);
});

test('test_find_path_value_finds_nested_value', () => {
  // The state has a value inside an object inside a list.
  const state = { ticket: { messages: [{ text: 'hello' }] } };
  // The lookup follows each key and index to the value.
  expect(findPathValue(state, 'ticket.messages[0].text')).toEqual({ isFound: true, value: 'hello' });
});

test('test_find_path_value_refuses_index_on_object_and_key_on_array', () => {
  // An index step on an object finds nothing, even when the object has that key.
  expect(findPathValue({ a: { 0: 'x' } }, 'a[0]')).toEqual({ isFound: false });
  // A key step on a list finds nothing, even when the list has that position.
  expect(findPathValue({ a: ['x'] }, 'a.0')).toEqual({ isFound: false });
});

test('test_state_accepts_string_object_and_array', () => {
  // A string state has no errors.
  expect(listStateErrors('some text')).toEqual([]);
  // An object state has no errors.
  expect(listStateErrors({ a: 1 })).toEqual([]);
  // A list state has no errors.
  expect(listStateErrors([1, 2])).toEqual([]);
});

test('test_state_refuses_number_boolean_and_null', () => {
  // A number, a boolean and null each give the state error.
  expect(listStateErrors(5)).toEqual(['state must be a string, object or array']);
  expect(listStateErrors(true)).toEqual(['state must be a string, object or array']);
  expect(listStateErrors(null)).toEqual(['state must be a string, object or array']);
});

test('test_questions_must_be_object_with_one_question', () => {
  // A list and a string are not a questions object.
  expect(listQuestionsErrors([])).toEqual(['questions must be an object']);
  expect(listQuestionsErrors('q')).toEqual(['questions must be an object']);
  // An empty object has no question.
  expect(listQuestionsErrors({})).toEqual(['questions needs at least one question']);
  // An object with one good question has no errors.
  expect(listQuestionsErrors({ q: { type: 'box' } })).toEqual([]);
});

test('test_question_type_must_be_known', () => {
  // An unknown type and a missing type each give the type error.
  expect(listQuestionsErrors({ q: { type: 'yesno' } })).toEqual(['q.type must be noul, choice, score or box']);
  expect(listQuestionsErrors({ q: {} })).toEqual(['q.type must be noul, choice, score or box']);
  // A question that is not an object gives the object error.
  expect(listQuestionsErrors({ q: 5 })).toEqual(['q must be an object']);
});

test('test_instructions_must_be_entry', () => {
  // Number instructions give the entry error.
  expect(listQuestionsErrors({ q: { type: 'box', instructions: 5 } })).toEqual([`q.instructions ${ENTRY_ERROR}`]);
  // Null instructions and object instructions have no errors.
  expect(listQuestionsErrors({ q: { type: 'box', instructions: null } })).toEqual([]);
  expect(listQuestionsErrors({ q: { type: 'box', instructions: { question: 'Is it?' } } })).toEqual([]);
});

test('test_noul_criteria_may_be_missing_or_null', () => {
  // A noul question with no criteria has no errors.
  expect(listQuestionsErrors({ q: { type: 'noul' } })).toEqual([]);
  // A noul question with null criteria has no errors.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: null } })).toEqual([]);
});

test('test_noul_criteria_true_and_false_must_be_entries', () => {
  // A number true text gives the entry error for true only.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: { true: 5, false: 'No.' } } })).toEqual([`q.criteria.true ${ENTRY_ERROR}`]);
  // Criteria with only a false text has no errors.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: { false: 'No.' } } })).toEqual([]);
  // Text criteria is not an object.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: 'Yes.' } })).toEqual(['q.criteria must be an object']);
});

test('test_choice_needs_1_to_255_criteria_options', () => {
  // A choice question with no criteria gives the object error.
  expect(listQuestionsErrors({ q: { type: 'choice' } })).toEqual(['q.criteria must be an object']);
  // No options and 256 options each give the count error.
  expect(listQuestionsErrors({ q: { type: 'choice', criteria: {} } })).toEqual(['q.criteria needs 1 to 255 options']);
  expect(listQuestionsErrors({ q: { type: 'choice', criteria: buildChoiceCriteria(256) } })).toEqual(['q.criteria needs 1 to 255 options']);
  // 1 option and 255 options have no errors.
  expect(listQuestionsErrors({ q: { type: 'choice', criteria: buildChoiceCriteria(1) } })).toEqual([]);
  expect(listQuestionsErrors({ q: { type: 'choice', criteria: buildChoiceCriteria(255) } })).toEqual([]);
  // A number option text gives the entry error for that option.
  expect(listQuestionsErrors({ q: { type: 'choice', criteria: { calm: 'Calm.', angry: 5 } } })).toEqual([`q.criteria.angry ${ENTRY_ERROR}`]);
});

test('test_score_needs_1_to_10_criteria_levels', () => {
  // A score question with object criteria gives the list error.
  expect(listQuestionsErrors({ q: { type: 'score', criteria: { a: 'A.' } } })).toEqual(['q.criteria must be an array']);
  // No levels and 11 levels each give the count error.
  expect(listQuestionsErrors({ q: { type: 'score', criteria: [] } })).toEqual(['q.criteria needs 1 to 10 levels']);
  expect(listQuestionsErrors({ q: { type: 'score', criteria: buildScoreCriteria(11) } })).toEqual(['q.criteria needs 1 to 10 levels']);
  // 1 level and 10 levels have no errors.
  expect(listQuestionsErrors({ q: { type: 'score', criteria: buildScoreCriteria(1) } })).toEqual([]);
  expect(listQuestionsErrors({ q: { type: 'score', criteria: buildScoreCriteria(10) } })).toEqual([]);
  // A number level text gives the entry error for that level.
  expect(listQuestionsErrors({ q: { type: 'score', criteria: ['Low.', 5] } })).toEqual([`q.criteria[1] ${ENTRY_ERROR}`]);
});

test('test_box_needs_only_type', () => {
  // A box question with only a type has no errors.
  expect(listQuestionsErrors({ q: { type: 'box' } })).toEqual([]);
});

test('test_reference_found_in_state_passes', () => {
  // The instructions name a nested state value.
  const state = { ticket: { messages: [{ text: 'hello' }] } };
  const questions = { q: { type: 'noul', instructions: 'Is `ticket.messages[0].text` rude?' } };
  // The name is in the state, so no name is listed.
  expect(listUndefinedReferences(state, questions)).toEqual([]);
});

test('test_reference_found_in_own_instructions_passes', () => {
  // The structured instructions name their own field, and the state does not have it.
  const questions = { q: { type: 'noul', instructions: { field: { value: 3 }, question: 'Is `field.value` valid?' } } };
  // The name is in the instructions, so no name is listed.
  expect(listUndefinedReferences({}, questions)).toEqual([]);
});

test('test_reference_missing_from_both_is_listed', () => {
  // The instructions name a value that is in neither the state nor the instructions.
  const questions = { q: { type: 'noul', instructions: 'Does `nope` exist?' } };
  // The error names the question and the name.
  expect(listUndefinedReferences({ a: 1 }, questions)).toEqual(['q: `nope` is not in state or in its instructions']);
});

test('test_reference_in_criteria_is_checked', () => {
  // One criteria text names a state value, and one names a missing value.
  const questions = { q: { type: 'choice', criteria: { yes: 'Uses `a`.', no: 'Uses `missing`.' } } };
  // Only the missing name is listed.
  expect(listUndefinedReferences({ a: 1 }, questions)).toEqual(['q: `missing` is not in state or in its instructions']);
});

test('test_reference_with_string_state_checks_instructions_only', () => {
  // The state is text, and the instructions name their own field and the text length.
  const questions = { q: { type: 'noul', instructions: { field: { value: 3 }, question: 'Is `field.value` more than `length`?' } } };
  // The own field passes. The text state gives no values, so `length` is listed.
  expect(listUndefinedReferences('some text', questions)).toEqual(['q: `length` is not in state or in its instructions']);
});
