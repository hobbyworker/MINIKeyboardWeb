// The records 884x keyboards store actions in, as the cross-platform app writes and reads them (`PHY2_KEY_Value` and
// `PHY_KEY_Value`), and the `FE` record of keyboards that don't say which they take.
//
// A record starts `<marker> <record> <layer + 1> <kind>`; the kind is 1 for key presses, 2 for a media key, 3 for a
// mouse action, 5 for key presses after a wait (legacy format) and 8 for lights.
//
// - Standard (64 bytes): `[5]` the entry count, then three-byte entries from `[6]` — the wait before the entry in
//   milliseconds, high byte first, and a code: a key usage, or `F1`–`F8` for a modifier held until the next key.
// - Legacy (50 bytes): `[4…5]` the wait, low byte first, `[9]` the count, then (modifiers, key) pairs from `[10]`.
//   Modifiers with no key after them sit in the pair after the last.
// - `FE`: as legacy, without a wait.

import {
    KeyAction,
    KeyboardDeviceError,
    KeyMacro,
    KeyStroke,
    LightColor,
    Modifiers,
    MouseAction,
    type RecordFormat,
} from "$domain";

export const STANDARD_LENGTH = 64;
export const LEGACY_LENGTH = 50;
export const STANDARD_ENTRIES = 18;
export const LEGACY_PAIRS = 20;

const KIND = { keys: 1, media: 2, mouse: 3, delayedKeys: 5, lighting: 8 } as const;
const KINDS: readonly number[] = Object.values(KIND);

// Encoding

/** The record that stores `action` for the control in record `recordId` of `layer` (from 0). */
export function encode(action: KeyAction, recordId: number, layer: number, format: RecordFormat): Uint8Array {
    switch (format) {
        case "standard":
            return standard(action, recordId, layer);
        case "legacy":
            return pairs(action, 0xfd, recordId, layer, LEGACY_LENGTH, true);
        case "unidentified":
            return unidentified(action, recordId, layer);
    }
}

/** Throws a `KeyboardDeviceError` (unsupported) for more entries than a record holds. */
export function standard(action: KeyAction, recordId: number, layer: number): Uint8Array {
    const record = header(0xfd, recordId, layer, STANDARD_LENGTH);
    switch (action.kind) {
        case "unassigned":
            record[3] = KIND.keys;
            break;
        case "keys": {
            record[3] = KIND.keys;
            const entries: (readonly [number, number])[] = [];
            for (const stroke of action.macro.strokes) {
                const codes = modifierCodes(stroke.modifiers);
                if (!KeyStroke.isModifiersOnly(stroke)) codes.push(stroke.key);
                codes.forEach((code, index) => entries.push([index === 0 ? stroke.delay : 0, code]));
            }
            if (entries.length > STANDARD_ENTRIES) throw KeyboardDeviceError.unsupported();
            record[5] = entries.length;
            entries.forEach(([delay, code], index) => {
                const wait = u16(delay);
                record.set([wait >> 8, wait & 0xff, code], 6 + 3 * index);
            });
            break;
        }
        case "media":
            record[3] = KIND.media;
            record[5] = 2;
            record[8] = action.key & 0xff;
            record[11] = action.key >> 8;
            break;
        case "mouse":
            record[3] = KIND.mouse;
            // 1 for a mouse action; the cross-platform app's 2025-06 builds put 4 here for a gesture.
            record[4] = 1;
            record[5] = 4;
            record[8] = modifierCodes(MouseAction.modifiers(action.action))[0] ?? 0;
            record[11] = MouseAction.buttons(action.action);
            record[20] = MouseAction.wheel(action.action);
            break;
    }
    return record;
}

/**
 * The legacy record, or with marker `FE` and no wait the record of an unidentified keyboard. Throws a
 * `KeyboardDeviceError` (unsupported) for more pairs than a record holds.
 */
export function pairs(
    action: KeyAction,
    marker: number,
    recordId: number,
    layer: number,
    length: number,
    keepsDelay: boolean,
): Uint8Array {
    const record = header(marker, recordId, layer, length);
    switch (action.kind) {
        case "unassigned":
            record[3] = KIND.keys;
            break;
        case "keys": {
            const macro = action.macro;
            const delay = keepsDelay ? u16(macro.delay) : 0;
            record[3] = delay > 0 ? KIND.delayedKeys : KIND.keys;
            record[4] = delay & 0xff;
            record[5] = delay >> 8;
            const only = macro.strokes.length === 1 ? macro.strokes[0] : undefined;
            if (only !== undefined && KeyStroke.isModifiersOnly(only)) {
                record[10] = only.modifiers;
            } else {
                if (macro.strokes.length > LEGACY_PAIRS || 10 + 2 * macro.strokes.length > length) {
                    throw KeyboardDeviceError.unsupported();
                }
                record[9] = macro.strokes.length;
                macro.strokes.forEach((stroke, index) => {
                    record[10 + 2 * index] = stroke.modifiers;
                    record[11 + 2 * index] = stroke.key;
                });
            }
            break;
        }
        case "media":
            record[3] = KIND.media;
            record[9] = 2;
            record[10] = action.key & 0xff;
            record[11] = action.key >> 8;
            break;
        case "mouse":
            record[3] = KIND.mouse;
            record[9] = 1;
            record[10] = MouseAction.modifiers(action.action);
            record[11] = MouseAction.buttons(action.action);
            record[14] = MouseAction.wheel(action.action);
            break;
    }
    return record;
}

/**
 * The `FE` record: the legacy form with these differences, which keyboards of the 1189:8840 kind are known to take — a
 * media key has a count of 0, a wheel move a count of 3.
 */
export function unidentified(action: KeyAction, recordId: number, layer: number): Uint8Array {
    const record = pairs(action, 0xfe, recordId, layer, STANDARD_LENGTH, false);
    if (action.kind === "media") record[9] = 0;
    else if (action.kind === "mouse" && MouseAction.wheel(action.action) !== 0) record[9] = 3;
    return record;
}

/**
 * A legacy-format layer's lights, which it keeps in record 0: `FE B0 <layer + 1> 08`, a count of 1 and
 * `colour << 4 | mode` in `[11]`.
 */
export function legacyLighting(color: LightColor, mode: number, layer: number, length: number): Uint8Array {
    const record = new Uint8Array(length);
    record.set([0xfe, 0xb0, layerByte(layer + 1), KIND.lighting]);
    record[9] = 1;
    record[11] = (LightColor.code(color) << 4) | (mode & 0x0f);
    return record;
}

function header(marker: number, recordId: number, layer: number, length: number): Uint8Array {
    const record = new Uint8Array(length);
    record.set([marker, recordId, layerByte(layer + 1)]);
    return record;
}

/** `F1`–`F8` for the modifiers set, lowest bit first: left Control, Shift, Alt, Super, then right. */
export function modifierCodes(modifiers: Modifiers): number[] {
    return Modifiers.EACH.flatMap((modifier, index) => (Modifiers.contains(modifiers, modifier) ? [0xf1 + index] : []));
}

export function modifiersOfCode(code: number): Modifiers | null {
    return code >= 0xf1 && code <= 0xf8 ? 1 << (code - 0xf1) : null;
}

/** Layers count from 0 or 1 in a byte; there are at most three. */
export function layerByte(layer: number): number {
    if (!Number.isInteger(layer) || layer < 0 || layer > 0xff) throw new RangeError(`layer ${layer} in a byte`);
    return layer;
}

/** A wait in a 16-bit field: the most it holds when it is longer. */
function u16(value: number): number {
    return Math.min(Math.max(Math.trunc(value), 0), 0xffff);
}

// Decoding

/** The action a record the keyboard reported stores, or `null` for a kind the app doesn't know. */
export function decode(record: Uint8Array, format: RecordFormat): KeyAction | null {
    const byte = (index: number) => record[index] ?? 0;
    const kind = byte(3);
    if (!KINDS.includes(kind)) return kind === 0 ? KeyAction.UNASSIGNED : null;
    const isStandard = format === "standard";
    switch (kind) {
        case KIND.keys:
        case KIND.delayedKeys:
            return isStandard ? standardKeys(byte) : legacyKeys(byte, kind === KIND.delayedKeys);
        case KIND.media: {
            const usage = isStandard ? byte(8) | (byte(11) << 8) : byte(10) | (byte(11) << 8);
            return usage === 0 ? KeyAction.UNASSIGNED : KeyAction.media(usage);
        }
        case KIND.mouse:
            // A gesture (4 in byte 4), which the app doesn't make, isn't read as a mouse action.
            if (isStandard && byte(4) === 4) return null;
            if (isStandard) return mouse(byte(11), byte(20), modifiersOfCode(byte(8)) ?? Modifiers.NONE);
            return mouse(byte(11), byte(14), Modifiers.members(byte(10))[0] ?? Modifiers.NONE);
        default:
            return null;
    }
}

/**
 * `action` as a record of `format` holds it — encoded, then decoded — or `null` when a record can't hold it. What a
 * keyboard that kept it reads back.
 */
export function storedForm(action: KeyAction, format: RecordFormat): KeyAction | null {
    let record: Uint8Array;
    try {
        record = encode(action, 1, 0, format);
    } catch (error) {
        if (error instanceof KeyboardDeviceError) return null;
        throw error;
    }
    return decode(record, format);
}

function standardKeys(byte: (index: number) => number): KeyAction {
    const strokes: KeyStroke[] = [];
    let held = Modifiers.NONE;
    let heldDelay: number | null = null;
    for (let index = 0; index < Math.min(byte(5), STANDARD_ENTRIES); index++) {
        const code = byte(8 + 3 * index);
        const delay = (byte(6 + 3 * index) << 8) | byte(7 + 3 * index);
        const modifier = modifiersOfCode(code);
        if (modifier !== null) {
            held |= modifier;
            heldDelay ??= delay;
        } else if (code !== 0) {
            strokes.push(KeyStroke.withDelay(KeyStroke.of(held, code), heldDelay ?? delay));
            held = Modifiers.NONE;
            heldDelay = null;
        }
    }
    if (held !== Modifiers.NONE && strokes.length === 0) {
        strokes.push(KeyStroke.withDelay(KeyStroke.of(held, 0), heldDelay ?? 0));
    }
    return strokes.length === 0 ? KeyAction.UNASSIGNED : KeyAction.keys(KeyMacro.of(strokes));
}

function legacyKeys(byte: (index: number) => number, delayed: boolean): KeyAction {
    const delay = delayed ? byte(4) | (byte(5) << 8) : 0;
    const count = Math.min(byte(9), LEGACY_PAIRS);
    let strokes: KeyStroke[] = [];
    for (let index = 0; index < count; index++) {
        const modifiers = byte(10 + 2 * index);
        const key = byte(11 + 2 * index);
        if (modifiers !== Modifiers.NONE || key !== 0) strokes.push(KeyStroke.of(modifiers, key));
    }
    if (count === 0 && byte(10) !== 0) strokes = [KeyStroke.of(byte(10), 0)];
    if (strokes.length > 1) strokes = strokes.filter((stroke) => !KeyStroke.isModifiersOnly(stroke));
    return strokes.length === 0 && delay === 0 ? KeyAction.UNASSIGNED : KeyAction.keys(KeyMacro.of(strokes, delay));
}

function mouse(buttons: number, wheel: number, modifiers: Modifiers): KeyAction | null {
    if (buttons === 0 && wheel === 0) return KeyAction.UNASSIGNED;
    const action = MouseAction.fromParts(buttons, wheel, modifiers);
    return action === null ? null : KeyAction.mouse(action);
}
