import { structurallyEqual } from "./equality";
import type { KeyboardIdentity } from "./keyboards";
import { LAYOUTS } from "./layouts";

/** One action of a knob. Some knobs also turn while pressed. */
export type KnobPart = "rotateLeft" | "press" | "rotateRight" | "pressRotateLeft" | "pressRotateRight";

const KNOB_PARTS: readonly KnobPart[] = ["rotateLeft", "press", "rotateRight", "pressRotateLeft", "pressRotateRight"];

export const KnobPart = {
    ALL: KNOB_PARTS,

    /** 0 for a turn to the left, then in the order above. */
    index(part: KnobPart): number {
        return KNOB_PARTS.indexOf(part);
    },
};

/**
 * A key, or one action of a knob — what the user selects and binds. Keys come before knobs, each in number order, a
 * knob's actions in {@link KnobPart} order ({@link compareControls}).
 */
export type ControlId =
    | { readonly kind: "key"; readonly number: number }
    | { readonly kind: "knob"; readonly number: number; readonly part: KnobPart };

export const ControlId = {
    key(number: number): Extract<ControlId, { kind: "key" }> {
        return { kind: "key", number };
    },

    knob(number: number, part: KnobPart): Extract<ControlId, { kind: "knob" }> {
        return { kind: "knob", number, part };
    },

    isKey(control: ControlId): boolean {
        return control.kind === "key";
    },

    knobNumber(control: ControlId): number | null {
        return control.kind === "knob" ? control.number : null;
    },
};

/** A string that names the control, for map keys and sets: `key:1`, `knob:2:press`. */
export function controlKey(control: ControlId): string {
    return control.kind === "key" ? `key:${control.number}` : `knob:${control.number}:${control.part}`;
}

export function sameControl(a: ControlId, b: ControlId): boolean {
    if (a.kind === "key") return b.kind === "key" && a.number === b.number;
    return b.kind === "knob" && a.number === b.number && a.part === b.part;
}

/** Keys before knobs, each in number order, a knob's actions in {@link KnobPart} order. */
export function compareControls(a: ControlId, b: ControlId): number {
    if (a.kind !== b.kind) return a.kind === "key" ? -1 : 1;
    if (a.number !== b.number) return a.number - b.number;
    return a.kind === "knob" && b.kind === "knob" ? KnobPart.index(a.part) - KnobPart.index(b.part) : 0;
}

/** How far a keyboard is turned clockwise from the way its layout is drawn — kept with the user's choice. */
export type Rotation = "upright" | "quarter" | "half" | "threeQuarters";

const ROTATIONS: readonly Rotation[] = ["upright", "quarter", "half", "threeQuarters"];

export const Rotation = {
    ALL: ROTATIONS,
    DEFAULT: "upright" as Rotation,

    /** Quarter turns clockwise, 0–3. */
    quarterTurns(rotation: Rotation): number {
        return ROTATIONS.indexOf(rotation);
    },

    /** Any whole number of quarter turns, either way. */
    fromQuarterTurns(turns: number): Rotation {
        return ROTATIONS[((turns % 4) + 4) % 4] as Rotation;
    },

    next(rotation: Rotation): Rotation {
        return Rotation.fromQuarterTurns(Rotation.quarterTurns(rotation) + 1);
    },
};

/**
 * A keyboard's controls, named as the cross-platform app names its layouts ("6add1" — six keys and a knob). Where they
 * are drawn is the presentation's business, where they are stored the device's.
 */
export interface KeyboardLayout {
    readonly id: string;
    readonly controls: readonly ControlId[];
}

export const KeyboardLayout = {
    /** What the cross-platform app draws when a keyboard's answer matches no layout. */
    FALLBACK_ID: "15add3",

    of(id: string, controls: readonly ControlId[]): KeyboardLayout {
        return { id, controls };
    },

    keyCount(layout: KeyboardLayout): number {
        return layout.controls.filter(ControlId.isKey).length;
    },

    knobCount(layout: KeyboardLayout): number {
        return new Set(layout.controls.flatMap((control) => ControlId.knobNumber(control) ?? [])).size;
    },

    has(layout: KeyboardLayout, control: ControlId): boolean {
        return layout.controls.some((candidate) => sameControl(candidate, control));
    },

    /** The cross-platform app's layouts. */
    all(): readonly KeyboardLayout[] {
        return LAYOUTS;
    },

    named(id: string): KeyboardLayout | null {
        return LAYOUTS.find((layout) => layout.id === id) ?? null;
    },

    /**
     * The layout the cross-platform app draws for what a keyboard says of itself (`Widget::Identify_KeyBoard_style`).
     * The kind also tells two keyboards of four keys and a knob apart; the product ID tells two others apart.
     */
    identifiedId(identity: KeyboardIdentity, productId: number): string {
        switch (`${identity.keyCount}+${identity.knobCount}`) {
            case "0+1":
                return "0add1";
            case "0+2":
                return productId === 0x8850 ? "0add2" : "0add1";
            case "0+3":
                return "0add3";
            case "1+0":
                return "1add0";
            case "2+0":
                return "2add0";
            case "3+0":
                return "3add0";
            case "3+1":
                return "3add1";
            case "4+0":
                return "4Key";
            case "4+1":
                if (identity.kind === 0) return productId === 0x8851 ? "4add2" : "4add1";
                if (identity.kind === 1) return "4add2";
                return KeyboardLayout.FALLBACK_ID;
            case "4+3":
                return "4add3";
            case "5+0":
                return "5Key_Mute";
            case "6+0":
                return "6Key";
            case "6+1":
                return "6add1";
            case "6+2":
                return "6add2";
            case "9+2":
                return "9add2";
            case "9+3":
                return "9add3";
            case "11+3":
                return "11add3";
            case "12+0":
                return "12add0";
            case "12+2":
                return "12add2";
            case "12+3":
                return "12add3";
            case "12+4":
                return "12add4";
            case "16+0":
                return "16add0";
            case "16+3":
                return "16add3";
            case "21+1":
                return "21add1";
            default:
                return KeyboardLayout.FALLBACK_ID;
        }
    },
};

export function sameLayout(a: KeyboardLayout, b: KeyboardLayout): boolean {
    return structurallyEqual(a, b);
}
