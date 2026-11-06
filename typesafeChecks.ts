export const REFERENCE_PATTERN =/`([^`\s.]+(?:\.[^`\s.]+)*)`/g;
const KEY_PATH_STEP = /\[\d+\]|[^.[\]]+/g;
const QUESTION_TYPES = ['noul', 'choice', 'score', 'box'];
const CHOICE_MAX_OPTIONS = 255;
const SCORE_MAX_LEVELS = 10;

export type PathLookup = { isFound: true; value: unknown } | { isFound: false };

export function splitKeyPath(keyName: string): string[] {
  const steps = keyName.match(KEY_PATH_STEP);
  return steps === null ? [] : steps;
}

function findStepValue(current: unknown, step: string): PathLookup {
  const isContainer = typeof current === 'object' && current !== null;
  if (!isContainer)
    return { isFound: false };
  const isIndexStep = step.startsWith('[');
  const isStepAllowed = isIndexStep === Array.isArray(current);
  if (!isStepAllowed)
    return { isFound: false };
  const key = isIndexStep ? step.slice(1, -1) : step;
  const hasStep = Object.hasOwn(current as object, key);
  if (!hasStep)
    return { isFound: false };
  return { isFound: true, value: (current as Record<string, unknown>)[key] };
}

export function findPathValue(root: unknown, path: string): PathLookup {
  let current = root;
  const steps = splitKeyPath(path);
  const isEmptyPath = steps.length === 0;
  if (isEmptyPath)
    return { isFound: false };
  for (const step of steps) {
    const stepLookup = findStepValue(current, step);
    if (!stepLookup.isFound)
      return { isFound: false };
    current = stepLookup.value;
  }
  return { isFound: true, value: current };
}

export function findNestedPathValue(root: unknown, path: string): PathLookup {
  const rootLookup = findPathValue(root, path);
  if (rootLookup.isFound)
    return rootLookup;
  if (typeof root !== 'object')
    return { isFound: false };
  if (root === null)
    return { isFound: false };
  for (const childValue of Object.values(root)) {
    const childLookup = findNestedPathValue(childValue, path);
    if (childLookup.isFound)
      return childLookup;
  }
  return { isFound: false };
}

export function findReferenceValue(state: unknown, question: unknown, name: string): PathLookup {
  const stateLookup = findNestedPathValue(state, name);
  if (stateLookup.isFound)
    return stateLookup;
  return findNestedPathValue(question, name);
}

export function findReferenceError(state: unknown, question: unknown, name: string): string | null {
  const referenceLookup = findReferenceValue(state, question, name);
  if (!referenceLookup.isFound)
    return `\`${name}\` is not in state or in this question`;
  if (typeof referenceLookup.value !== 'string')
    return `\`${name}\` must point to text`;
  if (referenceLookup.value.includes('`'))
    return `\`${name}\` points to text with backticks; TypeSafe resolves only one level`;
  return null;
}

export function listBacktickedKeys(value: unknown, path: string): string[] {
  const errors: string[] = [];
  if (typeof value !== 'object')
    return errors;
  if (value === null)
    return errors;
  for (const [key, childValue] of Object.entries(value)) {
    const childPath = Array.isArray(value) ? `${path}[${key}]` : `${path}.${key}`;
    // search() ignores lastIndex, so the global REFERENCE_PATTERN is safe here.
    const hasBacktickedName = key.search(REFERENCE_PATTERN) !== -1;
    if (hasBacktickedName)
      errors.push(`${childPath}: backticked names cannot be keys`);
    errors.push(...listBacktickedKeys(childValue, childPath));
  }
  return errors;
}

function isPlainObject(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object')
    return false;
  if (value === null)
    return false;
  const isArray = Array.isArray(value);
  return !isArray;
}

function isEntry(value: unknown): boolean {
  if (typeof value === 'string')
    return true;
  if (value === null)
    return true;
  const isArray = Array.isArray(value);
  if (isArray)
    return true;
  return isPlainObject(value);
}

export function listStateErrors(state: unknown): string[] {
  if (typeof state === 'string')
    return [];
  const isArray = Array.isArray(state);
  if (isArray)
    return [];
  const isObject = isPlainObject(state);
  if (isObject)
    return [];
  return ['state must be a string, object or array'];
}

export function listQuestionsErrors(questions: unknown): string[] {
  const isObject = isPlainObject(questions);
  if (!isObject)
    return ['questions must be an object'];
  const questionEntries = Object.entries(questions);
  if (questionEntries.length === 0)
    return ['questions needs at least one question'];
  const errors: string[] = [];
  for (const [questionName, question] of questionEntries)
    errors.push(...listQuestionErrors(questionName, question));
  return errors;
}

function listEntryErrors(fieldName: string, value: unknown): string[] {
  const isValueEntry = isEntry(value);
  if (isValueEntry)
    return [];
  return [`${fieldName} must be a string, object, array or null`];
}

function listCountErrors(fieldName: string, count: number, maximum: number, itemName: string): string[] {
  const isTooFew = count < 1;
  if (isTooFew)
    return [`${fieldName} needs 1 to ${maximum} ${itemName}`];
  const isTooMany = count > maximum;
  if (isTooMany)
    return [`${fieldName} needs 1 to ${maximum} ${itemName}`];
  return [];
}

function listNoulCriteriaErrors(questionName: string, criteria: unknown): string[] {
  if (criteria === undefined)
    return [];
  if (criteria === null)
    return [];
  const isObject = isPlainObject(criteria);
  if (!isObject)
    return [`${questionName}.criteria must be an object`];
  const errors: string[] = [];
  for (const answerKey of ['true', 'false']) {
    if (criteria[answerKey] !== undefined)
      errors.push(...listEntryErrors(`${questionName}.criteria.${answerKey}`, criteria[answerKey]));
  }
  return errors;
}

function listChoiceCriteriaErrors(questionName: string, criteria: unknown): string[] {
  const isObject = isPlainObject(criteria);
  if (!isObject)
    return [`${questionName}.criteria must be an object`];
  const optionEntries = Object.entries(criteria);
  const errors = listCountErrors(`${questionName}.criteria`, optionEntries.length, CHOICE_MAX_OPTIONS, 'options');
  for (const [optionName, optionText] of optionEntries)
    errors.push(...listEntryErrors(`${questionName}.criteria.${optionName}`, optionText));
  return errors;
}

function listScoreCriteriaErrors(questionName: string, criteria: unknown): string[] {
  const isArray = Array.isArray(criteria);
  if (!isArray)
    return [`${questionName}.criteria must be an array`];
  const errors = listCountErrors(`${questionName}.criteria`, criteria.length, SCORE_MAX_LEVELS, 'levels');
  for (const [levelIndex, levelText] of criteria.entries())
    errors.push(...listEntryErrors(`${questionName}.criteria[${levelIndex}]`, levelText));
  return errors;
}

function listCriteriaErrors(questionName: string, questionType: unknown, criteria: unknown): string[] {
  if (questionType === 'noul')
    return listNoulCriteriaErrors(questionName, criteria);
  if (questionType === 'choice')
    return listChoiceCriteriaErrors(questionName, criteria);
  if (questionType === 'score')
    return listScoreCriteriaErrors(questionName, criteria);
  return [];
}

function listQuestionErrors(questionName: string, question: unknown): string[] {
  const isObject = isPlainObject(question);
  if (!isObject)
    return [`${questionName} must be an object`];
  const isKnownType = QUESTION_TYPES.includes(question.type as string);
  if (!isKnownType)
    return [`${questionName}.type must be noul, choice, score or box`];
  const errors: string[] = [];
  if (question.instructions !== undefined)
    errors.push(...listEntryErrors(`${questionName}.instructions`, question.instructions));
  errors.push(...listCriteriaErrors(questionName, question.type, question.criteria));
  return errors;
}

export function collectReferenceNames(value: unknown): string[] {
  const names: string[] = [];
  if (typeof value === 'string') {
    for (const match of value.matchAll(REFERENCE_PATTERN))
      names.push(match[1]!);
    return names;
  }
  if (typeof value !== 'object')
    return names;
  if (value === null)
    return names;
  for (const childValue of Object.values(value))
    names.push(...collectReferenceNames(childValue));
  return names;
}

// function isReferenceDefined(state: unknown, instructions: unknown, name: string): boolean {
//   const stateLookup = findPathValue(state, name);
//   if (stateLookup.isFound)
//     return true;
//   const instructionsLookup = findPathValue(instructions, name);
//   return instructionsLookup.isFound;
// }

export function listUndefinedReferences(state: unknown, questions: Record<string, unknown>): string[] {
  const errors: string[] = [];
  for (const [questionName, question] of Object.entries(questions)) {
    for (const name of collectReferenceNames(question)) {
      const referenceError = findReferenceError(state, question, name);
      if (referenceError !== null)
        errors.push(`${questionName}: ${referenceError}`);
    }
    errors.push(...listBacktickedKeys(question, questionName));
  }
  return errors;
  // const errors: string[] = [];
  // for (const [questionName, question] of Object.entries(questions)) {
  //   const { instructions, criteria } = question as { instructions?: unknown; criteria?: unknown };
  //   const names = [...collectReferenceNames(instructions), ...collectReferenceNames(criteria)];
  //   for (const name of names) {
  //     const isDefined = isReferenceDefined(state, instructions, name);
  //     if (!isDefined)
  //       errors.push(`${questionName}: \`${name}\` is not in state or in its instructions`);
  //   }
  // }
  // return errors;
}
