// Where the browser keeps the user's choices. Storage can be missing, or throw (a private window, storage turned
// off), so every read and write is guarded: a read that fails finds nothing, a write that fails is dropped.

/** The part of the Web Storage API the app uses — `localStorage`, or a stand-in. */
export type KeyValueStorage = Pick<Storage, "getItem" | "setItem">;

/** The page's `localStorage`, or `null` when it can't be had. */
export function browserStorage(): KeyValueStorage | null {
    try {
        return globalThis.localStorage ?? null;
    } catch {
        return null;
    }
}

export function readItem(storage: KeyValueStorage | null, key: string): string | null {
    try {
        return storage?.getItem(key) ?? null;
    } catch {
        return null;
    }
}

export function writeItem(storage: KeyValueStorage | null, key: string, value: string): void {
    try {
        storage?.setItem(key, value);
    } catch {
        // Dropped — the user chooses again.
    }
}
