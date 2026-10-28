import { describe, expect, it } from "vitest";
import {
    KeyboardCapabilities,
    KeyboardIdentity,
    KeyMacro,
    KeyStroke,
    Modifiers,
    MouseAction,
    SUPPORTED_KEYBOARDS,
    UsbIdentity,
    formatUsbIdentity,
    isSupportedKeyboard,
    type RecordFormat,
} from "$domain";

const capabilities = (format: RecordFormat) => new KeyboardCapabilities(format);

const repeat = (stroke: KeyStroke, count: number) => KeyMacro.of(Array.from({ length: count }, () => stroke));

const EVERY_BYTE = Array.from({ length: 0x100 }, (_, key) => key);

describe("keyboards", () => {
    it("supported keyboards", () => {
        // The 1189:8890 is configured by the other editions only.
        expect(isSupportedKeyboard(UsbIdentity.of(0x1189, 0x8890))).toBe(false);
        expect(isSupportedKeyboard(UsbIdentity.of(0x1189, 0x8840))).toBe(true);
        expect(isSupportedKeyboard(UsbIdentity.of(0x514c, 0x8851))).toBe(true);
        expect(isSupportedKeyboard(UsbIdentity.of(0x1189, 0x8851))).toBe(true);
        expect(isSupportedKeyboard(UsbIdentity.of(0x05ac, 0x8890))).toBe(false);
        // All eight products under each vendor, 1189 first.
        const products = ["8842", "8840", "8830", "8831", "8832", "8833", "8850", "8851"];
        expect(SUPPORTED_KEYBOARDS.map(formatUsbIdentity)).toEqual([
            ...products.map((product) => `1189:${product}`),
            ...products.map((product) => `514C:${product}`),
        ]);
    });

    it("usb identity prints as hex", () => {
        expect(formatUsbIdentity(UsbIdentity.of(0x514c, 0x8850))).toBe("514C:8850");
    });

    it("identity picks the record format", () => {
        expect(KeyboardIdentity.recordFormat(KeyboardIdentity.of(6, 1, 10))).toBe("standard");
        expect(KeyboardIdentity.recordFormat(KeyboardIdentity.of(12, 2, 11))).toBe("standard");
        expect(KeyboardIdentity.recordFormat(KeyboardIdentity.of(6, 1, 0))).toBe("legacy");
        expect(KeyboardIdentity.recordFormat(KeyboardIdentity.of(6, 1, 1))).toBe("legacy");
        // From type 10 up, as the cross-platform app tells them apart.
        const format = (kind: number) => KeyboardIdentity.recordFormat(KeyboardIdentity.of(6, 1, kind));
        expect(format(9)).toBe("legacy");
        expect([10, 11, 12, 255].map(format)).toEqual(["standard", "standard", "standard", "standard"]);
    });

    /** Types the rules weren't tried with are only marked — the format still follows the rule. */
    it("known types", () => {
        const known = (kind: number) => KeyboardIdentity.isKnownType(KeyboardIdentity.of(12, 2, kind));
        expect([0, 1, 10, 11].every(known)).toBe(true);
        expect([2, 9, 12, 255].some(known)).toBe(false);
        expect(KeyboardIdentity.recordFormat(KeyboardIdentity.of(12, 2, 12))).toBe("standard");
        expect(KeyboardIdentity.recordFormat(KeyboardIdentity.of(12, 2, 9))).toBe("legacy");
    });

    it("layers", () => {
        expect(capabilities("standard").layerCount()).toBe(3);
    });

    /** The standard format spends a place on every modifier; the others put a key's modifiers with it. */
    it("presses count modifiers on the standard format", () => {
        const macro = KeyMacro.of([KeyStroke.of(Modifiers.SUPER | Modifiers.SHIFT, 0x1d), KeyStroke.key(0x04)]);
        expect(capabilities("standard").presses(macro)).toBe(4);
        expect(capabilities("legacy").presses(macro)).toBe(2);
        const modifiersOnly = KeyMacro.of([KeyStroke.of(Modifiers.CONTROL | Modifiers.ALT, 0)]);
        expect(capabilities("standard").presses(modifiersOnly)).toBe(2);
    });

    it("limits", () => {
        expect(capabilities("legacy").fits(repeat(KeyStroke.key(0x04), 20))).toBe(true);
        expect(capabilities("standard").fits(repeat(KeyStroke.of(Modifiers.SUPER, 0x04), 10))).toBe(false);
        expect(capabilities("legacy").fits(KeyMacro.of([KeyStroke.key(0x04), KeyStroke.of(Modifiers.SHIFT, 0)]))).toBe(
            false,
        );
    });

    it("what each keyboard does", () => {
        expect(capabilities("standard").mediaKeys()).toHaveLength(21);
        expect(capabilities("standard").delays()).toEqual({ kind: "perPress", range: { start: 0, end: 60000 } });
        expect(capabilities("legacy").delays()).toEqual({ kind: "perKey", range: { start: 0, end: 6000 } });
        expect(capabilities("unidentified").delays()).toEqual({ kind: "unavailable" });
        expect(capabilities("standard").lighting()).toEqual({
            kind: "perKeyColor",
            modes: { start: 0, end: 5 },
            keys: 16,
        });
        expect(capabilities("legacy").lighting()).toEqual({ kind: "colorAndMode", modes: { start: 0, end: 5 } });
        expect(capabilities("standard").reading()).toBe("onConnect");
        expect(capabilities("legacy").reading()).toBe("onConnect");
        expect(capabilities("unidentified").reading()).toBe("never");
    });

    /** The keys the cross-platform app offers: 110. */
    it("keys each keyboard is given", () => {
        const standard = capabilities("standard");
        expect(EVERY_BYTE.filter((key) => standard.takes(key))).toHaveLength(110);
        expect(
            EVERY_BYTE.every((key) => capabilities("unidentified").takes(key) === capabilities("legacy").takes(key)),
        ).toBe(true);
        for (const key of [0x32, 0x58, 0x64, 0x68, 0x73]) {
            expect(standard.takes(key), `0x${key.toString(16)}`).toBe(true);
        }
        expect(standard.takes(0x66)).toBe(false);
        expect(standard.takes(0x74)).toBe(false);
        expect(standard.takesKeysOf(KeyMacro.of([KeyStroke.of(Modifiers.SHIFT, 0)]))).toBe(true);
        expect(standard.takesKeysOf(KeyMacro.of([KeyStroke.key(0x04), KeyStroke.key(0x74)]))).toBe(false);
    });

    it("mouse actions come back from their parts", () => {
        for (const action of MouseAction.ALL) {
            expect(
                MouseAction.fromParts(
                    MouseAction.buttons(action),
                    MouseAction.wheel(action),
                    MouseAction.modifiers(action),
                ),
            ).toBe(action);
        }
        expect(MouseAction.fromParts(0, 0, Modifiers.NONE)).toBeNull();
    });
});
