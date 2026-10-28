/**
 * Whether two values of the domain's plain data are equal — numbers, strings, booleans, null, arrays, byte arrays and
 * plain objects, compared member by member. What Rust derives as `PartialEq`.
 */
export function structurallyEqual(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) || Array.isArray(b) || a instanceof Uint8Array || b instanceof Uint8Array) {
        const left = a as ArrayLike<unknown>;
        const right = b as ArrayLike<unknown>;
        if (Array.isArray(a) !== Array.isArray(b) || a instanceof Uint8Array !== b instanceof Uint8Array) return false;
        if (left.length !== right.length) return false;
        for (let index = 0; index < left.length; index++) {
            if (!structurallyEqual(left[index], right[index])) return false;
        }
        return true;
    }
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) return false;
    return keys.every((key) => Object.hasOwn(right, key) && structurallyEqual(left[key], right[key]));
}
