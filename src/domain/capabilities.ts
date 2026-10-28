import { KeyMacro, KeyStroke, MediaKey, Modifiers } from "./actions";
import type { RecordFormat } from "./keyboards";
import { LightingSupport } from "./lighting";
import { InclusiveRange } from "./range";

/** How a keyboard keeps waits. */
export type DelaySupport =
    /** No waits. */
    | { readonly kind: "unavailable" }
    /** A wait before each press, in milliseconds. */
    | { readonly kind: "perPress"; readonly range: InclusiveRange }
    /** One wait for the whole key, in milliseconds. */
    | { readonly kind: "perKey"; readonly range: InclusiveRange };

/**
 * Whether the keyboard tells what it holds.
 *
 * - `onConnect`: asked as soon as it is connected, as the cross-platform app does, and again when the user asks.
 */
export type ReadSupport = "never" | "onConnect";

/** What a connected keyboard can hold and do, from the commands it takes. */
export class KeyboardCapabilities {
    readonly format: RecordFormat;

    constructor(format: RecordFormat) {
        this.format = format;
    }

    /** Every keyboard has three layers. */
    layerCount(): number {
        return 3;
    }

    /** How many presses one key holds — counted as {@link presses} counts them. */
    pressLimit(): number {
        switch (this.format) {
            case "standard":
                return 18;
            case "legacy":
                return 20;
            case "unidentified":
                return 18;
        }
    }

    /** Whether each modifier takes a place of its own, as in the standard format. */
    modifiersTakePlaces(): boolean {
        return this.format === "standard";
    }

    /** The places `macro` takes in a key. */
    presses(macro: KeyMacro): number {
        if (!this.modifiersTakePlaces()) return macro.strokes.length;
        return macro.strokes.reduce(
            (sum, stroke) => sum + Modifiers.count(stroke.modifiers) + (KeyStroke.isModifiersOnly(stroke) ? 0 : 1),
            0,
        );
    }

    fits(macro: KeyMacro): boolean {
        return KeyMacro.isWellFormed(macro) && this.presses(macro) <= this.pressLimit();
    }

    /**
     * Whether the keyboard is given `key`, a usage on the HID keyboard page — the keys its vendor tool offers. The
     * cross-platform app has every usage from 0x04 to 0x65, and F13–F24 (0x68–0x73).
     */
    takes(key: number): boolean {
        return (key >= 0x04 && key <= 0x65) || (key >= 0x68 && key <= 0x73);
    }

    /** Whether the keyboard is given every key `macro` presses. */
    takesKeysOf(macro: KeyMacro): boolean {
        return macro.strokes.every((stroke) => KeyStroke.isModifiersOnly(stroke) || this.takes(stroke.key));
    }

    delays(): DelaySupport {
        switch (this.format) {
            case "standard":
                return { kind: "perPress", range: InclusiveRange.of(0, 60000) };
            case "legacy":
                return { kind: "perKey", range: InclusiveRange.of(0, 6000) };
            case "unidentified":
                return { kind: "unavailable" };
        }
    }

    mediaKeys(): readonly MediaKey[] {
        return MediaKey.ALL;
    }

    lighting(): LightingSupport {
        switch (this.format) {
            case "standard":
                return {
                    kind: "perKeyColor",
                    modes: InclusiveRange.of(0, 5),
                    keys: LightingSupport.COLOR_KEY_COUNT,
                };
            case "legacy":
            case "unidentified":
                return { kind: "colorAndMode", modes: InclusiveRange.of(0, 5) };
        }
    }

    reading(): ReadSupport {
        switch (this.format) {
            case "standard":
            case "legacy":
                return "onConnect";
            case "unidentified":
                return "never";
        }
    }
}
