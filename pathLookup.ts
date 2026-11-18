export type PathLookup = { isFound: true; value: unknown } | { isFound: false };

export function splitKeyPath(keyName: string): string[] {
    const keyPathStep = /\[\d+\]|[^.[\]]+/g;
    const steps = keyName.match(keyPathStep);
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
