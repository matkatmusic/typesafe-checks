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
    const choiceMaxOptions = 255;
    const optionEntries = Object.entries(criteria);
    const errors = listCountErrors(`${questionName}.criteria`, optionEntries.length, choiceMaxOptions, 'options');
    for (const [optionName, optionText] of optionEntries)
        errors.push(...listEntryErrors(`${questionName}.criteria.${optionName}`, optionText));
    return errors;
}

function listScoreCriteriaErrors(questionName: string, criteria: unknown): string[] {
    const isArray = Array.isArray(criteria);
    if (!isArray)
        return [`${questionName}.criteria must be an array`];
    const scoreMaxLevels = 10;
    const errors = listCountErrors(`${questionName}.criteria`, criteria.length, scoreMaxLevels, 'levels');
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
    const questionTypes = ['noul', 'choice', 'score', 'box'];
    const isKnownType = questionTypes.includes(question.type as string);
    if (!isKnownType)
        return [`${questionName}.type must be noul, choice, score or box`];
    const errors: string[] = [];
    if (question.instructions !== undefined)
        errors.push(...listEntryErrors(`${questionName}.instructions`, question.instructions));
    errors.push(...listCriteriaErrors(questionName, question.type, question.criteria));
    return errors;
}
