import { describe, expect, it } from "vitest";
import {
    ChooseLayoutUseCase,
    ControlId,
    KeyboardIdentity,
    KeyboardLayout,
    ResolveLayoutUseCase,
    ResolvedLayout,
    Rotation,
    SimulatedModel,
    UsbIdentity,
    controlKey,
    formatUsbIdentity,
    isSupportedKeyboard,
    type ConnectedKeyboard,
    type KeyboardIdentification,
    type LayoutProfile,
    type LayoutProfileRepository,
} from "$domain";

function named(id: string): KeyboardLayout {
    const layout = KeyboardLayout.named(id);
    if (layout === null) throw new Error(`no layout ${id}`);
    return layout;
}

const upTo = (count: number) => Array.from({ length: count }, (_, index) => index + 1);

describe("layouts", () => {
    it("every layout is consistent", () => {
        const all = KeyboardLayout.all();
        expect(all).toHaveLength(26);
        expect(new Set(all.map((layout) => layout.id)).size).toBe(26);
        for (const layout of all) {
            expect(new Set(layout.controls.map(controlKey)).size, layout.id).toBe(layout.controls.length);
            const keys = layout.controls.flatMap((control) => (control.kind === "key" ? [control.number] : []));
            expect(keys, layout.id).toEqual(upTo(keys.length));
            const knobs = [...new Set(layout.controls.flatMap((control) => ControlId.knobNumber(control) ?? []))];
            expect(
                knobs.sort((a, b) => a - b),
                layout.id,
            ).toEqual(upTo(KeyboardLayout.knobCount(layout)));
        }
    });

    /** `Widget::Identify_KeyBoard_style`. */
    it("identified layouts", () => {
        const id = (keys: number, knobs: number, kind: number, product: number) =>
            KeyboardLayout.identifiedId(KeyboardIdentity.of(keys, knobs, kind), product);
        expect(id(6, 1, 10, 0x8840)).toBe("6add1");
        expect(id(0, 2, 10, 0x8840)).toBe("0add1");
        expect(id(0, 2, 10, 0x8850)).toBe("0add2");
        expect(id(4, 1, 0, 0x8840)).toBe("4add1");
        expect(id(4, 1, 0, 0x8851)).toBe("4add2");
        expect(id(4, 1, 1, 0x8840)).toBe("4add2");
        expect(id(4, 1, 10, 0x8840)).toBe("15add3");
        expect(id(7, 7, 10, 0x8840)).toBe("15add3");
        for (const layout of KeyboardLayout.all()) {
            expect(KeyboardLayout.named(layout.id)).not.toBeNull();
        }
    });

    /** One knob that also turns while pressed — not two knobs. */
    it("the dial has one knob", () => {
        const dial = named("0add1");
        expect(KeyboardLayout.knobCount(dial)).toBe(1);
        expect(KeyboardLayout.has(dial, ControlId.knob(1, "pressRotateLeft"))).toBe(true);
        expect(KeyboardLayout.has(dial, ControlId.knob(1, "pressRotateRight"))).toBe(true);
        expect(KeyboardLayout.knobCount(named("0add2"))).toBe(2);
    });

    it("rotation turns around", () => {
        expect(Rotation.next("threeQuarters")).toBe("upright");
        expect(Rotation.next("upright")).toBe("quarter");
        expect(Rotation.fromQuarterTurns(-1)).toBe("threeQuarters");
        expect(Rotation.fromQuarterTurns(6)).toBe("half");
    });

    it("an identified keyboard gets its layout", () => {
        const identification: KeyboardIdentification = {
            format: "standard",
            identity: KeyboardIdentity.of(9, 2, 10),
        };
        const resolved = new ResolveLayoutUseCase(new Profiles()).execute(keyboard(0x8840), identification);
        expect(resolved.layout.id).toBe("9add2");
        expect(resolved.source).toBe("identified");
        expect(resolved.choices).toHaveLength(0);
        expect(ResolvedLayout.needsChoice(resolved)).toBe(false);
    });

    it("an unidentified keyboard may have any layout", () => {
        const identification: KeyboardIdentification = { format: "unidentified", identity: null };
        const resolved = new ResolveLayoutUseCase(new Profiles()).execute(keyboard(0x8840), identification);
        expect(resolved.choices).toHaveLength(26);
        expect(resolved.layout.id).toBe("15add3");
        expect(ResolvedLayout.needsChoice(resolved)).toBe(true);
    });

    /** The layout of a keyboard that said its shape stays; only the rotation is kept. */
    it("an identified layout only turns", () => {
        const profiles = new Profiles();
        const connected = keyboard(0x8840);
        const identification: KeyboardIdentification = { format: "legacy", identity: KeyboardIdentity.of(6, 1, 0) };
        const resolve = new ResolveLayoutUseCase(profiles);
        const resolved = resolve.execute(connected, identification);
        const other = named("12add0");
        const chosen = new ChooseLayoutUseCase(profiles).execute(resolved, other, "quarter", connected.usb);
        expect(chosen.layout.id).toBe("6add1");
        expect(chosen.rotation).toBe("quarter");
        expect(resolve.execute(connected, identification).rotation).toBe("quarter");
    });

    it("every simulated model has a keyboard", () => {
        const all = SimulatedModel.all();
        expect(all.length).toBeGreaterThan(40);
        expect(new Set(all.map((model) => SimulatedModel.id(model))).size).toBe(all.length);
        expect(all.every((model) => isSupportedKeyboard(model.usb))).toBe(true);
        expect(SimulatedModel.identifiedAs(named("4add1"), "standard")).toBeNull();
    });
});

class Profiles implements LayoutProfileRepository {
    private readonly saved = new Map<string, LayoutProfile>();

    profile(keyboard: UsbIdentity): LayoutProfile | null {
        return this.saved.get(formatUsbIdentity(keyboard)) ?? null;
    }

    save(profile: LayoutProfile, keyboard: UsbIdentity): void {
        this.saved.set(formatUsbIdentity(keyboard), profile);
    }
}

function keyboard(product: number): ConnectedKeyboard {
    return {
        usb: UsbIdentity.of(0x1189, product),
        interfaceNumber: 0,
        channel: "hid",
        reportId: 3,
        reportLength: 65,
        details: null,
    };
}
