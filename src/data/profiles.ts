import {
    formatUsbIdentity,
    Rotation,
    type LayoutProfile,
    type LayoutProfileRepository,
    type UsbIdentity,
} from "$domain";
import { readItem, writeItem, type KeyValueStorage } from "./storage";

/** The storage key, holding what the desktop editions keep in `layouts.json`. */
const KEY = "minikeyboard.layouts";

interface Stored {
    readonly layout: string;
    /** Quarter turns clockwise. */
    readonly rotation: number;
}

/**
 * The layouts users chose, by keyboard, as JSON in browser storage: `{"1189:8840": {"layout": "15add3", "rotation":
 * 2}}`. What can't be read is treated as empty; a write that fails is dropped — the user chooses again.
 */
export class StorageLayoutProfiles implements LayoutProfileRepository {
    private readonly storage: KeyValueStorage | null;

    constructor(storage: KeyValueStorage | null) {
        this.storage = storage;
    }

    profile(keyboard: UsbIdentity): LayoutProfile | null {
        const stored = this.load().get(formatUsbIdentity(keyboard));
        if (stored === undefined) return null;
        return { layoutId: stored.layout, rotation: Rotation.fromQuarterTurns(stored.rotation) };
    }

    save(profile: LayoutProfile, keyboard: UsbIdentity): void {
        const all = this.load();
        all.set(formatUsbIdentity(keyboard), {
            layout: profile.layoutId,
            rotation: Rotation.quarterTurns(profile.rotation),
        });
        writeItem(this.storage, KEY, JSON.stringify(Object.fromEntries(all)));
    }

    /** Every entry, or none when one of them isn't a layout and a rotation in a byte — as the desktop editions read. */
    private load(): Map<string, Stored> {
        const text = readItem(this.storage, KEY);
        if (text === null) return new Map();
        let parsed: unknown;
        try {
            parsed = JSON.parse(text);
        } catch {
            return new Map();
        }
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) return new Map();
        const all = new Map<string, Stored>();
        for (const [keyboard, value] of Object.entries(parsed)) {
            const stored = value as Partial<Record<keyof Stored, unknown>> | null;
            if (typeof stored !== "object" || stored === null) return new Map();
            const { layout, rotation } = stored;
            if (typeof layout !== "string" || !isByte(rotation)) return new Map();
            all.set(keyboard, { layout, rotation });
        }
        return all;
    }
}

function isByte(value: unknown): value is number {
    return typeof value === "number" && Number.isInteger(value) && value >= 0 && value <= 0xff;
}
