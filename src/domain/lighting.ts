import { structurallyEqual } from "./equality";
import type { InclusiveRange } from "./range";

/** A colour with one byte per channel. */
export interface KeyColor {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
}

const color = (red: number, green: number, blue: number): KeyColor => ({ red, green, blue });

export const KeyColor = {
    of: color,

    /** The colours keys 1–16 start with in the cross-platform app (`KeyBoard_KeyLed`), the same on every layer. */
    DEFAULT_KEY_COLORS: [
        color(0xff, 0x00, 0x00),
        color(0xff, 0x80, 0x30),
        color(0xff, 0xff, 0x30),
        color(0x00, 0xff, 0x00),
        color(0x00, 0xff, 0xff),
        color(0x00, 0x00, 0xff),
        color(0x80, 0x00, 0x80),
        color(0x8b, 0x00, 0x00),
        color(0xff, 0xa5, 0x00),
        color(0xff, 0xff, 0x96),
        color(0x7d, 0xff, 0x00),
        color(0x00, 0x8b, 0x8b),
        color(0x00, 0x00, 0x8b),
        color(0xff, 0x00, 0xff),
        color(0xff, 0x66, 0x66),
        color(0xff, 0xc8, 0x64),
    ] as readonly KeyColor[],
};

/** The colours a legacy-format or unidentified keyboard lights in, as the high nibble it takes ({@link LightColor.code}). */
export type LightColor = "red" | "orange" | "yellow" | "green" | "cyan" | "blue" | "purple";

const LIGHT_COLORS: readonly LightColor[] = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"];

export const LightColor = {
    ALL: LIGHT_COLORS,

    /** 1 for red, then in the order above. */
    code(color: LightColor): number {
        return LIGHT_COLORS.indexOf(color) + 1;
    },
};

/** What one layer's lights do, in the form the keyboard takes. */
export type LayerLighting =
    /** A legacy-format or unidentified keyboard: a colour and a mode, 0–5. */
    | { readonly kind: "colorMode"; readonly color: LightColor; readonly mode: number }
    /** A standard-format keyboard: a mode, 0–5, and a colour for each of keys 1–16. */
    | { readonly kind: "perKey"; readonly mode: number; readonly colors: readonly KeyColor[] };

export const LayerLighting = {
    mode(lighting: LayerLighting): number {
        return lighting.mode;
    },
};

export function sameLighting(a: LayerLighting, b: LayerLighting): boolean {
    return structurallyEqual(a, b);
}

/** What a keyboard can do with its lights. */
export type LightingSupport =
    /** A colour and a mode per layer. */
    | { readonly kind: "colorAndMode"; readonly modes: InclusiveRange }
    /** A mode per layer and a colour for each of the first keys. */
    | { readonly kind: "perKeyColor"; readonly modes: InclusiveRange; readonly keys: number };

export const LightingSupport = {
    /** Keys whose colour the standard format stores. */
    COLOR_KEY_COUNT: 16,
};
