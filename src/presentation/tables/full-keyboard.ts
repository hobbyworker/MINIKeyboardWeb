// The full-size keyboard of the Keys page, laid out as the cross-platform app's page: 15 key widths of main block,
// the navigation keys and the keypad, with a PC's modifiers in the bottom row.

import type { ModifierKey } from "../choices";
import type { BoardFace } from "../screen-state";
import { KeyUsage } from "./key-usages";

/** A row's width in key widths: 15, a quarter, 3 of navigation, a quarter, 4 of keypad. */
export const FULL_KEYBOARD_WIDTH = 22.5;

export interface Place {
    readonly face: BoardFace;
    readonly row: number;
    readonly column: number;
    readonly width: number;
}

type Slot =
    | { readonly kind: "key"; readonly usage: number; readonly width: number }
    | { readonly kind: "modifier"; readonly modifier: ModifierKey; readonly width: number }
    | { readonly kind: "gap"; readonly width: number };

const K = (usage: number, width = 1): Slot => ({ kind: "key", usage, width });
const M = (modifier: ModifierKey, width: number): Slot => ({ kind: "modifier", modifier, width });
const Gap = (width: number): Slot => ({ kind: "gap", width });
const keys = (usages: readonly number[]): Slot[] => usages.map((usage) => K(usage));

const ROWS: readonly (readonly Slot[])[] = [
    [
        K(0x29),
        Gap(1),
        ...keys([0x3a, 0x3b, 0x3c, 0x3d]),
        Gap(0.5),
        ...keys([0x3e, 0x3f, 0x40, 0x41]),
        Gap(0.5),
        ...keys([0x42, 0x43, 0x44, 0x45]),
        Gap(0.25),
        ...keys([0x46, 0x47, 0x48]),
    ],
    [
        ...keys([0x35, 0x1e, 0x1f, 0x20, 0x21, 0x22, 0x23, 0x24, 0x25, 0x26, 0x27, 0x2d, 0x2e]),
        K(0x2a, 2),
        Gap(0.25),
        ...keys([0x49, 0x4a, 0x4b]),
        Gap(0.25),
        ...keys([0x53, 0x54, 0x55, 0x56]),
    ],
    [
        K(0x2b, 1.5),
        ...keys([0x14, 0x1a, 0x08, 0x15, 0x17, 0x1c, 0x18, 0x0c, 0x12, 0x13, 0x2f, 0x30]),
        K(0x31, 1.5),
        Gap(0.25),
        ...keys([0x4c, 0x4d, 0x4e]),
        Gap(0.25),
        ...keys([0x5f, 0x60, 0x61, 0x57]),
    ],
    [
        K(0x39, 1.75),
        ...keys([0x04, 0x16, 0x07, 0x09, 0x0a, 0x0b, 0x0d, 0x0e, 0x0f, 0x33, 0x34]),
        K(0x28, 2.25),
        Gap(3.5),
        ...keys([0x5c, 0x5d, 0x5e]),
    ],
    [
        M("shift", 2.25),
        ...keys([0x1d, 0x1b, 0x06, 0x19, 0x05, 0x11, 0x10, 0x36, 0x37, 0x38]),
        M("rightShift", 2.75),
        Gap(1.25),
        K(0x52),
        Gap(1.25),
        ...keys([0x59, 0x5a, 0x5b, 0x58]),
    ],
    [
        M("control", 1.25),
        M("super", 1.25),
        M("alt", 1.25),
        K(0x2c, 6.25),
        M("rightAlt", 1.25),
        M("rightSuper", 1.25),
        K(0x65, 1.25),
        M("rightControl", 1.25),
        Gap(0.25),
        ...keys([0x50, 0x51, 0x4f]),
        Gap(0.25),
        K(0x62, 2),
        K(0x63, 1),
    ],
];

function face(slot: Slot): BoardFace | null {
    switch (slot.kind) {
        case "key": {
            const key = KeyUsage.named(slot.usage);
            if (key === null) throw new RangeError(`every key on the board has a name: ${slot.usage}`);
            return { kind: "key", key };
        }
        case "modifier":
            return { kind: "modifier", modifier: slot.modifier };
        case "gap":
            return null;
    }
}

const PLACES: readonly Place[] = ROWS.flatMap((slots, row) => {
    const places: Place[] = [];
    let column = 0;
    for (const slot of slots) {
        const placed = face(slot);
        if (placed !== null) places.push({ face: placed, row, column, width: slot.width });
        column += slot.width;
    }
    return places;
});

/** Every cap, row by row from the left. */
export function places(): readonly Place[] {
    return PLACES;
}
