import { afterEach, describe, expect, it } from "vitest";
import { KeyStroke, Modifiers } from "$domain";
import { ActionText, ModifierKey, setModifierStyle } from "$presentation";

/** Modifiers read as the computer the page runs on writes them, as each desktop edition does. */
describe("modifier style", () => {
    afterEach(() => setModifierStyle("pc"));
    const shiftSuperC = KeyStroke.of(Modifiers.SHIFT | Modifiers.SUPER, 0x06);
    const rightControlAlone = KeyStroke.of(Modifiers.CONTROL | Modifiers.RIGHT_CONTROL, 0);

    it("pc, as the Linux edition", () => {
        expect(ActionText.stroke(shiftSuperC)).toBe("Shift+Super+C");
        expect(ActionText.stroke(rightControlAlone)).toBe("Ctrl+RCtrl");
        expect(ModifierKey.label("rightSuper")).toBe("RSuper");
    });

    it("windows: Win for Super, as the Windows edition", () => {
        setModifierStyle("windows");
        expect(ActionText.stroke(shiftSuperC)).toBe("Shift+Win+C");
        expect(ModifierKey.label("super")).toBe("Win");
        expect(ModifierKey.label("rightSuper")).toBe("RWin");
        expect(ModifierKey.label("alt")).toBe("Alt");
    });

    it("mac: macOS's symbols run together, as the Apple edition", () => {
        setModifierStyle("mac");
        expect(ActionText.stroke(shiftSuperC)).toBe("⇧⌘C");
        expect(ActionText.stroke(rightControlAlone)).toBe("⌃R⌃");
        expect(ActionText.modifiers(Modifiers.CONTROL | Modifiers.ALT | Modifiers.SHIFT | Modifiers.SUPER)).toBe(
            "⌃⌥⇧⌘",
        );
        expect(ModifierKey.label("rightAlt")).toBe("R⌥");
    });
});
