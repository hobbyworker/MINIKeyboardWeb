// Which of the keyboards plugged in the app opens.

import { describe, expect, it } from "vitest";
import { choice } from "$data";
import { UsbIdentity, type AttachedKeyboard } from "$domain";

const K8840 = UsbIdentity.of(0x1189, 0x8840);
const K8850 = UsbIdentity.of(0x514c, 0x8850);

const keyboard = (id: string, usb: UsbIdentity, location = ""): AttachedKeyboard => ({ id, usb, location });

describe("keyboard choice", () => {
    /** One entry per keyboard, in the order their places to write came; the same USB ID by location. */
    it("ordered by USB ID, then location", () => {
        const a = keyboard("a", K8840, "1-2");
        const b = keyboard("b", K8840, "1-1");
        const c = keyboard("c", K8850, "1-0");
        expect(choice.ordered([a, b, c, c])).toEqual([b, a, c]);
        // WebHID tells no location: the order the browser gives.
        const d = keyboard("d", K8840);
        const e = keyboard("e", K8850);
        const f = keyboard("f", K8840);
        expect(choice.ordered([d, e, f])).toEqual([d, f, e]);
    });

    it("the one chosen wins", () => {
        const keyboards = [keyboard("a", K8840), keyboard("b", K8850)];
        expect(choice.target(keyboards, "b", "1189:8840", () => true)).toEqual(keyboards[1]);
    });

    /** Nothing chosen this session: the one chosen last time, found by its USB ID — the first of it. */
    it("then the one chosen last time", () => {
        const keyboards = [keyboard("a", K8840), keyboard("b", K8850), keyboard("c", K8850)];
        const remembered = choice.key(keyboards[1] as AttachedKeyboard);
        expect(remembered).toBe("514C:8850");
        expect(choice.target(keyboards, null, remembered, () => true)).toEqual(keyboards[1]);
    });

    /** Nothing chosen: the first that can be opened — and with none, the first, to show why it can't. */
    it("else the first that opens", () => {
        const keyboards = [keyboard("a", K8840), keyboard("b", K8850)];
        const gone = "1189:8842";
        expect(choice.target(keyboards, "x", gone, (keyboard) => keyboard.id === "b")).toEqual(keyboards[1]);
        expect(choice.target(keyboards, null, null, () => false)).toEqual(keyboards[0]);
        expect(choice.target([], null, null, () => true)).toBeNull();
    });
});
