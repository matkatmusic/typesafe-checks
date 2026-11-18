import { test, expect } from 'bun:test';
import { listBacktickedKeys, collectReferenceNames } from './referenceChecks';

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
