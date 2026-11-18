import { findPathValue, findNestedPathValue, type PathLookup } from './pathLookup';

// ponytail: a literal backslash then a real backtick (`\\` + backtick in the parsed value) counts as escaped.
export function getReferencePattern(): RegExp {
    return /(?<!\\)`([^`\s.]+(?:\.[^`\s.]+)*)`/g;
}

export function findReferenceValue(state: unknown, question: unknown, name: string): PathLookup {
    const stateLookup = findPathValue(state, name);
    if (stateLookup.isFound)
        return stateLookup;
    return findNestedPathValue(question, name);
}

// Disabled (#132/#134): the docs never say backticks inside state values are resolved, so state values are not checked.
// function containsUnescapedBacktick(text: string): boolean {
//     const unescapedBacktick = /(?<!\\)`/;
//     const isMatch = unescapedBacktick.test(text);
//     return isMatch;
// }

export function findReferenceError(state: unknown, question: unknown, name: string): string | null {
    const referenceLookup = findReferenceValue(state, question, name);
    if (!referenceLookup.isFound)
        return `\`${name}\` is not in state or in this question`;
    // Disabled (#136-#140): docs.typesafe.ai allows back-ticked names to point to objects and arrays (resume cookbook `potential_duplicate`).
    // if (typeof referenceLookup.value === 'object') {
    //     if (referenceLookup.value !== null)
    //         return `\`${name}\` must not point to an object or array`;
    // }
    // if (typeof referenceLookup.value === 'string') {
    //     const hasUnescapedBacktick = containsUnescapedBacktick(referenceLookup.value);
    //     if (hasUnescapedBacktick)
    //         return `\`${name}\` points to text with backticks; TypeSafe resolves only one level`;
    // }
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
        // search() ignores lastIndex, so the global reference pattern is safe here.
        const hasBacktickedName = key.search(getReferencePattern()) !== -1;
        if (hasBacktickedName)
            errors.push(`${childPath}: backticked names cannot be keys`);
        errors.push(...listBacktickedKeys(childValue, childPath));
    }
    return errors;
}

export function collectReferenceNames(value: unknown): string[] {
    const names: string[] = [];
    if (typeof value === 'string') {
        for (const match of value.matchAll(getReferencePattern()))
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
}
