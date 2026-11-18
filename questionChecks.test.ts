import { test, expect } from 'bun:test';
import { listStateErrors, listQuestionsErrors } from './questionChecks';

function assertListStateErrorsAcceptsString() {
    // A string state has no errors.
    expect(listStateErrors('hello')).toEqual([]);
}
test('test_list_state_errors_accepts_string', assertListStateErrorsAcceptsString);

function assertListStateErrorsAcceptsArray() {
    // An array state has no errors.
    expect(listStateErrors([1, 2])).toEqual([]);
}
test('test_list_state_errors_accepts_array', assertListStateErrorsAcceptsArray);

function assertListStateErrorsAcceptsObject() {
    // A plain object state has no errors.
    expect(listStateErrors({ a: 1 })).toEqual([]);
}
test('test_list_state_errors_accepts_object', assertListStateErrorsAcceptsObject);

function assertListStateErrorsRejectsNumber() {
    // A number state gives one error.
    expect(listStateErrors(5)).toEqual(['state must be a string, object or array']);
}
test('test_list_state_errors_rejects_number', assertListStateErrorsRejectsNumber);

function assertListStateErrorsRejectsNull() {
    // A null state gives one error.
    expect(listStateErrors(null)).toEqual(['state must be a string, object or array']);
}
test('test_list_state_errors_rejects_null', assertListStateErrorsRejectsNull);

function assertListQuestionsErrorsRejectsNonObject() {
    // Questions that are not an object give one error.
    expect(listQuestionsErrors([])).toEqual(['questions must be an object']);
}
test('test_list_questions_errors_rejects_non_object', assertListQuestionsErrorsRejectsNonObject);

function assertListQuestionsErrorsRejectsEmptyObject() {
    // An empty questions object gives one error.
    expect(listQuestionsErrors({})).toEqual(['questions needs at least one question']);
}
test('test_list_questions_errors_rejects_empty_object', assertListQuestionsErrorsRejectsEmptyObject);

function assertListQuestionsErrorsRejectsNonObjectQuestion() {
    // A question that is not an object gives one error with its name.
    expect(listQuestionsErrors({ q1: 'text' })).toEqual(['q1 must be an object']);
}
test('test_list_questions_errors_rejects_non_object_question', assertListQuestionsErrorsRejectsNonObjectQuestion);

function assertListQuestionsErrorsRejectsUnknownType() {
    // A question with an unknown type gives one error.
    expect(listQuestionsErrors({ q1: { type: 'bad' } })).toEqual(['q1.type must be noul, choice, score or box']);
}
test('test_list_questions_errors_rejects_unknown_type', assertListQuestionsErrorsRejectsUnknownType);

function assertListQuestionsErrorsAcceptsBoxQuestion() {
    // A box question with no criteria has no errors.
    expect(listQuestionsErrors({ q1: { type: 'box', instructions: 'Say it' } })).toEqual([]);
}
test('test_list_questions_errors_accepts_box_question', assertListQuestionsErrorsAcceptsBoxQuestion);

function assertListQuestionsErrorsRejectsBadInstructions() {
    // Instructions that are a number give one error.
    expect(listQuestionsErrors({ q1: { type: 'box', instructions: 5 } })).toEqual(['q1.instructions must be a string, object, array or null']);
}
test('test_list_questions_errors_rejects_bad_instructions', assertListQuestionsErrorsRejectsBadInstructions);

function assertListQuestionsErrorsAcceptsNoulWithoutCriteria() {
    // A noul question may leave out criteria.
    expect(listQuestionsErrors({ q1: { type: 'noul' } })).toEqual([]);
}
test('test_list_questions_errors_accepts_noul_without_criteria', assertListQuestionsErrorsAcceptsNoulWithoutCriteria);

function assertListQuestionsErrorsRejectsNoulCriteriaNonObject() {
    // Noul criteria that are a string give one error.
    expect(listQuestionsErrors({ q1: { type: 'noul', criteria: 'x' } })).toEqual(['q1.criteria must be an object']);
}
test('test_list_questions_errors_rejects_noul_criteria_non_object', assertListQuestionsErrorsRejectsNoulCriteriaNonObject);

function assertListQuestionsErrorsRejectsBadNoulTrueEntry() {
    // A noul true entry that is a number gives one error.
    expect(listQuestionsErrors({ q1: { type: 'noul', criteria: { true: 5 } } })).toEqual(['q1.criteria.true must be a string, object, array or null']);
}
test('test_list_questions_errors_rejects_bad_noul_true_entry', assertListQuestionsErrorsRejectsBadNoulTrueEntry);

function assertListQuestionsErrorsAcceptsChoiceCriteria() {
    // A choice question with two options has no errors.
    expect(listQuestionsErrors({ q1: { type: 'choice', criteria: { a: 'A', b: 'B' } } })).toEqual([]);
}
test('test_list_questions_errors_accepts_choice_criteria', assertListQuestionsErrorsAcceptsChoiceCriteria);

function assertListQuestionsErrorsRejectsEmptyChoiceCriteria() {
    // A choice question with no options gives one error.
    expect(listQuestionsErrors({ q1: { type: 'choice', criteria: {} } })).toEqual(['q1.criteria needs 1 to 255 options']);
}
test('test_list_questions_errors_rejects_empty_choice_criteria', assertListQuestionsErrorsRejectsEmptyChoiceCriteria);

function assertListQuestionsErrorsRejectsChoiceCriteriaNonObject() {
    // Choice criteria that are an array give one error.
    expect(listQuestionsErrors({ q1: { type: 'choice', criteria: [] } })).toEqual(['q1.criteria must be an object']);
}
test('test_list_questions_errors_rejects_choice_criteria_non_object', assertListQuestionsErrorsRejectsChoiceCriteriaNonObject);

function assertListQuestionsErrorsAcceptsScoreCriteria() {
    // A score question with two levels has no errors.
    expect(listQuestionsErrors({ q1: { type: 'score', criteria: ['low', 'high'] } })).toEqual([]);
}
test('test_list_questions_errors_accepts_score_criteria', assertListQuestionsErrorsAcceptsScoreCriteria);

function assertListQuestionsErrorsRejectsTooManyScoreLevels() {
    // A score question with 11 levels gives one error.
    const elevenLevels = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k'];
    expect(listQuestionsErrors({ q1: { type: 'score', criteria: elevenLevels } })).toEqual(['q1.criteria needs 1 to 10 levels']);
}
test('test_list_questions_errors_rejects_too_many_score_levels', assertListQuestionsErrorsRejectsTooManyScoreLevels);

function assertListQuestionsErrorsRejectsScoreCriteriaNonArray() {
    // Score criteria that are an object give one error.
    expect(listQuestionsErrors({ q1: { type: 'score', criteria: {} } })).toEqual(['q1.criteria must be an array']);
}
test('test_list_questions_errors_rejects_score_criteria_non_array', assertListQuestionsErrorsRejectsScoreCriteriaNonArray);

function assertListQuestionsErrorsRejectsBadScoreLevelEntry() {
    // A score level that is a number gives one error with its index.
    expect(listQuestionsErrors({ q1: { type: 'score', criteria: ['ok', 5] } })).toEqual(['q1.criteria[1] must be a string, object, array or null']);
}
test('test_list_questions_errors_rejects_bad_score_level_entry', assertListQuestionsErrorsRejectsBadScoreLevelEntry);
