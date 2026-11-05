import { test, expect } from 'bun:test';
import { listStateErrors, listQuestionsErrors } from './typesafeChecks';

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

function assertStateAcceptsStringObjectAndArray() {
  // A string state has no errors.
  expect(listStateErrors('some text')).toEqual([]);
  // An object state has no errors.
  expect(listStateErrors({ a: 1 })).toEqual([]);
  // A list state has no errors.
  expect(listStateErrors([1, 2])).toEqual([]);
}
test('test_state_accepts_string_object_and_array', assertStateAcceptsStringObjectAndArray);

function assertStateRefusesNumberBooleanAndNull() {
  // A number, a boolean and null each give the state error.
  expect(listStateErrors(5)).toEqual(['state must be a string, object or array']);
  expect(listStateErrors(true)).toEqual(['state must be a string, object or array']);
  expect(listStateErrors(null)).toEqual(['state must be a string, object or array']);
}
test('test_state_refuses_number_boolean_and_null', assertStateRefusesNumberBooleanAndNull);

function assertQuestionsMustBeObjectWithOneQuestion() {
  // A list and a string are not a questions object.
  expect(listQuestionsErrors([])).toEqual(['questions must be an object']);
  expect(listQuestionsErrors('q')).toEqual(['questions must be an object']);
  // An empty object has no question.
  expect(listQuestionsErrors({})).toEqual(['questions needs at least one question']);
  // An object with one good question has no errors.
  expect(listQuestionsErrors({ q: { type: 'box' } })).toEqual([]);
}
test('test_questions_must_be_object_with_one_question', assertQuestionsMustBeObjectWithOneQuestion);

function assertQuestionTypeMustBeKnown() {
  // An unknown type and a missing type each give the type error.
  expect(listQuestionsErrors({ q: { type: 'yesno' } })).toEqual(['q.type must be noul, choice, score or box']);
  expect(listQuestionsErrors({ q: {} })).toEqual(['q.type must be noul, choice, score or box']);
  // A question that is not an object gives the object error.
  expect(listQuestionsErrors({ q: 5 })).toEqual(['q must be an object']);
}
test('test_question_type_must_be_known', assertQuestionTypeMustBeKnown);

function assertInstructionsMustBeEntry() {
  // Number instructions give the entry error.
  expect(listQuestionsErrors({ q: { type: 'box', instructions: 5 } })).toEqual([`q.instructions ${ENTRY_ERROR}`]);
  // Null instructions and object instructions have no errors.
  expect(listQuestionsErrors({ q: { type: 'box', instructions: null } })).toEqual([]);
  expect(listQuestionsErrors({ q: { type: 'box', instructions: { question: 'Is it?' } } })).toEqual([]);
}
test('test_instructions_must_be_entry', assertInstructionsMustBeEntry);

function assertNoulCriteriaMayBeMissingOrNull() {
  // A noul question with no criteria has no errors.
  expect(listQuestionsErrors({ q: { type: 'noul' } })).toEqual([]);
  // A noul question with null criteria has no errors.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: null } })).toEqual([]);
}
test('test_noul_criteria_may_be_missing_or_null', assertNoulCriteriaMayBeMissingOrNull);

function assertNoulCriteriaTrueAndFalseMustBeEntries() {
  // A number true text gives the entry error for true only.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: { true: 5, false: 'No.' } } })).toEqual([`q.criteria.true ${ENTRY_ERROR}`]);
  // Criteria with only a false text has no errors.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: { false: 'No.' } } })).toEqual([]);
  // Text criteria is not an object.
  expect(listQuestionsErrors({ q: { type: 'noul', criteria: 'Yes.' } })).toEqual(['q.criteria must be an object']);
}
test('test_noul_criteria_true_and_false_must_be_entries', assertNoulCriteriaTrueAndFalseMustBeEntries);

function assertChoiceNeeds1To255CriteriaOptions() {
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
}
test('test_choice_needs_1_to_255_criteria_options', assertChoiceNeeds1To255CriteriaOptions);

function assertScoreNeeds1To10CriteriaLevels() {
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
}
test('test_score_needs_1_to_10_criteria_levels', assertScoreNeeds1To10CriteriaLevels);

function assertBoxNeedsOnlyType() {
  // A box question with only a type has no errors.
  expect(listQuestionsErrors({ q: { type: 'box' } })).toEqual([]);
}
test('test_box_needs_only_type', assertBoxNeedsOnlyType);
