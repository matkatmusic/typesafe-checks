import { test, expect } from 'bun:test';
import { findReferenceError } from './referenceChecks';

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

function assertFindReferenceErrorRefusesObject() {
    // The name points to an object.  The error says the name must not point to an object or array.
    expect(findReferenceError({ data: { a: 'fruit' } }, undefined, 'data')).toBe('`data` must not point to an object or array');
}
test('test_find_reference_error_refuses_object', assertFindReferenceErrorRefusesObject);

function assertFindReferenceErrorAllowsTextWithBackticks() {
    // The name points to text that has another backticked name.  No error: state values are not checked for backticks.
    expect(findReferenceError({ banana: '`fruit`' }, undefined, 'banana')).toBeNull();
}
test('test_find_reference_error_allows_text_with_backticks', assertFindReferenceErrorAllowsTextWithBackticks);

function assertFindReferenceErrorAllowsEscapedBackticks() {
    // The name points to text that has only escaped backticks.  No error: an escaped backtick is plain text.
    expect(findReferenceError({ banana: 'say \\`hi\\`' }, undefined, 'banana')).toBeNull();
}
test('test_find_reference_error_allows_escaped_backticks', assertFindReferenceErrorAllowsEscapedBackticks);

function assertFindReferenceErrorAllowsUnescapedBacktick() {
    // The name points to text that has a real backticked name.  No error: state values are not checked for backticks.
    expect(findReferenceError({ banana: 'say `fruit`' }, undefined, 'banana')).toBeNull();
}
test('test_find_reference_error_allows_unescaped_backtick', assertFindReferenceErrorAllowsUnescapedBacktick);
