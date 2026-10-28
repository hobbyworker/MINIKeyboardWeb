import { describe, expect, it } from "vitest";
import { k884x, numbers, records, ReportFraming, WritePlan } from "$data";
import {
    ControlId,
    KeyAction,
    KeyboardConfiguration,
    KeyboardDeviceError,
    KeyboardIdentity,
    KeyboardLayout,
    KeyColor,
    KeyMacro,
    KeyStroke,
    MediaKey,
    Modifiers,
    MouseAction,
    type KeyboardDeviceErrorReason,
    type RecordFormat,
} from "$domain";

const keys = (strokes: readonly KeyStroke[]) => KeyAction.keys(KeyMacro.of(strokes));
const bytes = (array: Uint8Array) => [...array];

function named(id: string): KeyboardLayout {
    const layout = KeyboardLayout.named(id);
    if (layout === null) throw new Error(`no layout ${id}`);
    return layout;
}

/** Why `run` threw a {@link KeyboardDeviceError}. */
function failure(run: () => unknown): KeyboardDeviceErrorReason {
    try {
        run();
    } catch (error) {
        if (error instanceof KeyboardDeviceError) return error.reason;
        throw error;
    }
    throw new Error("it did not fail");
}

// The 884x records, as the cross-platform app writes and reads them.

describe("records", () => {
    it("standard entries take a modifier each", () => {
        const action = KeyAction.keys(
            KeyMacro.of([
                KeyStroke.withDelay(KeyStroke.of(Modifiers.SHIFT | Modifiers.SUPER, 0x1d), 300),
                KeyStroke.withDelay(KeyStroke.key(0x28), 50),
            ]),
        );
        const record = records.standard(action, 4, 2);
        expect(record.length).toBe(64);
        expect(bytes(record.subarray(0, 6))).toEqual([0xfd, 4, 3, 1, 0, 4]);
        expect(bytes(record.subarray(6, 18))).toEqual([
            0x01, 0x2c, 0xf2, 0x00, 0x00, 0xf4, 0x00, 0x00, 0x1d, 0x00, 0x32, 0x28,
        ]);
        expect(records.decode(record, "standard")).toEqual(action);
    });

    it("standard media and mouse", () => {
        const media = records.standard(KeyAction.media(MediaKey.WEB_BACK), 1, 0);
        expect([media[3], media[5], media[8], media[11]]).toEqual([2, 2, 0x24, 0x02]);
        expect(records.decode(media, "standard")).toEqual(KeyAction.media(MediaKey.WEB_BACK));
        const mouse = records.standard(KeyAction.mouse("controlWheelUp"), 1, 0);
        expect([mouse[3], mouse[4], mouse[5], mouse[8], mouse[11], mouse[20]]).toEqual([3, 1, 4, 0xf1, 0, 0x01]);
        expect(records.decode(mouse, "standard")).toEqual(KeyAction.mouse("controlWheelUp"));
        const gesture = Uint8Array.from(mouse);
        gesture[4] = 4;
        expect(records.decode(gesture, "standard")).toBeNull();
    });

    it("legacy pairs and the wait", () => {
        const action = KeyAction.keys(KeyMacro.of([KeyStroke.of(Modifiers.CONTROL, 0x06), KeyStroke.key(0x19)], 500));
        const record = records.encode(action, 16, 0, "legacy");
        expect(record.length).toBe(50);
        expect(bytes(record.subarray(0, 14))).toEqual([0xfd, 16, 1, 5, 0xf4, 0x01, 0, 0, 0, 2, 0x01, 0x06, 0x00, 0x19]);
        expect(records.decode(record, "legacy")).toEqual(action);
        const plain = records.encode(keys([KeyStroke.key(0x04)]), 1, 0, "legacy");
        expect(plain[3]).toBe(1);
    });

    it("legacy media and mouse", () => {
        const media = records.encode(KeyAction.media(MediaKey.MUTE), 1, 0, "legacy");
        expect([media[3], media[9], media[10], media[11]]).toEqual([2, 2, 0xe2, 0]);
        expect(records.decode(media, "legacy")).toEqual(KeyAction.media(MediaKey.MUTE));
        const wheel = records.encode(KeyAction.mouse("altWheelDown"), 1, 0, "legacy");
        expect([wheel[3], wheel[9], wheel[10], wheel[11], wheel[14]]).toEqual([3, 1, 0x04, 0, 0xff]);
        expect(records.decode(wheel, "legacy")).toEqual(KeyAction.mouse("altWheelDown"));
    });

    it("modifiers alone sit after the last pair", () => {
        const alone = keys([KeyStroke.of(Modifiers.ALT, 0)]);
        const record = records.encode(alone, 1, 0, "legacy");
        expect([record[9], record[10], record[11]]).toEqual([0, 0x04, 0]);
        expect(records.decode(record, "legacy")).toEqual(alone);
        const standard = records.standard(alone, 1, 0);
        expect([standard[5], standard[8]]).toEqual([1, 0xf3]);
        expect(records.decode(standard, "standard")).toEqual(alone);
    });

    /** The form keyboards of the 1189:8840 kind take: as the legacy pairs, marked `FE`, a media key with a count of 0 and a wheel move with 3. */
    it("unidentified records", () => {
        const key = records.unidentified(keys([KeyStroke.of(Modifiers.SUPER, 0x06)]), 17, 0);
        expect(bytes(key.subarray(0, 12))).toEqual([0xfe, 17, 1, 1, 0, 0, 0, 0, 0, 1, 0x08, 0x06]);
        const media = records.unidentified(KeyAction.media(MediaKey.VOLUME_UP), 1, 1);
        expect(bytes(media.subarray(0, 12))).toEqual([0xfe, 1, 2, 2, 0, 0, 0, 0, 0, 0, 0xe9, 0x00]);
        const wheel = records.unidentified(KeyAction.mouse("wheelUp"), 1, 0);
        expect(bytes(wheel.subarray(0, 15))).toEqual([0xfe, 1, 1, 3, 0, 0, 0, 0, 0, 3, 0, 0, 0, 0, 0x01]);
        const click = records.unidentified(KeyAction.mouse("leftClick"), 1, 0);
        expect(bytes(click.subarray(0, 12))).toEqual([0xfe, 1, 1, 3, 0, 0, 0, 0, 0, 1, 0, 0x01]);
    });

    it("cleared", () => {
        const record = records.standard(KeyAction.UNASSIGNED, 2, 0);
        expect(bytes(record.subarray(0, 6))).toEqual([0xfd, 2, 1, 1, 0, 0]);
        expect(records.decode(record, "standard")).toEqual(KeyAction.UNASSIGNED);
        expect(records.decode(Uint8Array.of(0xfd, 2, 1, 0), "legacy")).toEqual(KeyAction.UNASSIGNED);
        expect(records.decode(Uint8Array.of(0xfd, 2, 1, 9), "legacy")).toBeNull();
    });

    it("legacy lighting", () => {
        const record = records.legacyLighting("blue", 3, 2, records.LEGACY_LENGTH);
        expect(bytes(record.subarray(0, 12))).toEqual([0xfe, 0xb0, 3, 8, 0, 0, 0, 0, 0, 1, 0, 0x63]);
    });

    it("answers", () => {
        expect(k884x.identity(Uint8Array.of(0x03, 0xfb, 6, 1, 10))).toEqual(KeyboardIdentity.of(6, 1, 10));
        expect(k884x.identity(Uint8Array.of(0x03, 0xfb))).toBeNull();
        const reply = Uint8Array.from([0x03, 0xb0, 4, ...new Array<number>(48).fill(9)]);
        expect(k884x.lightingReply(reply)).toEqual({
            kind: "perKey",
            mode: 4,
            colors: new Array(16).fill(KeyColor.of(9, 9, 9)),
        });
        expect(bytes(k884x.readRecords(0, "standard") ?? new Uint8Array())).toEqual([0xfa, 25, 0, 1]);
        expect(bytes(k884x.readRecords(2, "legacy") ?? new Uint8Array())).toEqual([0xfa, 0x0f, 0x03, 3]);
        expect([k884x.readReplyCount("standard"), k884x.readReplyCount("legacy")]).toEqual([25, 24]);
        expect(k884x.readRecords(0, "unidentified")).toBeNull();
    });

    it("framing", () => {
        expect(bytes(ReportFraming.frame(ReportFraming.of(3, 9), Uint8Array.of(0xaa, 0xaa)))).toEqual([
            3, 0xaa, 0xaa, 0, 0, 0, 0, 0, 0,
        ]);
        expect(bytes(ReportFraming.frame(ReportFraming.of(0, 8), Uint8Array.of(0xaa)))).toEqual([
            0xaa, 0, 0, 0, 0, 0, 0, 0,
        ]);
        expect(ReportFraming.frame(ReportFraming.of(3, 65), k884x.IDENTIFY).length).toBe(65);
    });
});

// The order a save writes in.

const sixAndOne = () => named("6add1");

function configuration(edit: (configuration: KeyboardConfiguration) => void): KeyboardConfiguration {
    const configuration = new KeyboardConfiguration(3);
    edit(configuration);
    return configuration;
}

function prefixes(plan: WritePlan): number[][] {
    return plan.steps.map((step) => bytes(step.payload.subarray(0, 3)));
}

describe("write plan", () => {
    /** Every changed record, then all three layers' lights, then one commit (`Widget::HID_write`). */
    it("standard", () => {
        const edited = configuration((configuration) => {
            configuration.set(KeyAction.media(MediaKey.MUTE), ControlId.key(2), 1);
            configuration.set(KeyAction.UNASSIGNED, ControlId.knob(1, "press"), 0);
            for (let layer = 0; layer < 3; layer++) {
                configuration.applyReadLighting(
                    { kind: "perKey", mode: 0, colors: KeyColor.DEFAULT_KEY_COLORS },
                    layer,
                );
            }
            configuration.setLighting({ kind: "perKey", mode: 2, colors: KeyColor.DEFAULT_KEY_COLORS }, 2);
        });
        const plan = WritePlan.of(edited, "standard", sixAndOne());
        expect(prefixes(plan)).toEqual([
            [0xfd, 17, 1],
            [0xfd, 2, 2],
            [0xfe, 0xb0, 0],
            [0xfe, 0xb0, 1],
            [0xfe, 0xb0, 2],
            [0xfd, 0xfe, 0xff],
        ]);
        expect(plan.steps.at(-1)?.pauseAfter).toBe(200);
        expect(plan.steps[4]?.payload[3]).toBe(2);
    });

    /** Lights alone are written without a commit, as the app does. */
    it("standard lights alone", () => {
        const edited = configuration((configuration) => {
            configuration.setLighting({ kind: "perKey", mode: 1, colors: KeyColor.DEFAULT_KEY_COLORS }, 0);
        });
        expect(prefixes(WritePlan.of(edited, "standard", sixAndOne()))).toEqual([[0xfe, 0xb0, 0]]);
    });

    /** Each layer's records and lights, then that layer's commit. */
    it("legacy", () => {
        const edited = configuration((configuration) => {
            configuration.set(KeyAction.media(MediaKey.MUTE), ControlId.key(1), 0);
            configuration.setLighting({ kind: "colorMode", color: "green", mode: 1 }, 0);
            configuration.set(KeyAction.media(MediaKey.MUTE), ControlId.key(6), 2);
        });
        expect(prefixes(WritePlan.of(edited, "legacy", sixAndOne()))).toEqual([
            [0xfd, 1, 1],
            [0xfe, 0xb0, 1],
            [0xfd, 0xfe, 0xff],
            [0xfd, 6, 3],
            [0xfd, 0xfe, 0xff],
        ]);
    });

    it("unidentified", () => {
        const edited = configuration((configuration) => {
            configuration.set(KeyAction.media(MediaKey.MUTE), ControlId.knob(1, "rotateRight"), 0);
            configuration.setLighting({ kind: "colorMode", color: "red", mode: 2 }, 1);
        });
        const payloads = WritePlan.of(edited, "unidentified", sixAndOne()).steps.map((step) => bytes(step.payload));
        expect(payloads).toEqual([
            bytes(records.unidentified(KeyAction.media(MediaKey.MUTE), 18, 0)),
            [0xaa, 0xaa],
            [0xfd, 0xfe, 0xff],
            [0xaa, 0xaa],
            [0xfb, 0xfb, 0xfb, 0x01],
            [0xfa, 0x0f, 0x03, 1, 0x7f],
            [0xfa, 0x0f, 0x03, 2, 0x7f],
            [0xfa, 0x0f, 0x03, 3, 0x7f],
            [0xfe, 0xb0, 2, 8, 0, 0, 0, 0, 0, 1, 0, 0x12],
            [0xfd, 0xfe, 0xff],
        ]);
    });

    /** What the app doesn't know is never written. */
    it("only changes", () => {
        const read = configuration((configuration) => {
            configuration.applyRead(new Map([["key:1", KeyAction.media(MediaKey.MUTE)]]), 0);
        });
        expect(WritePlan.of(read, "standard", sixAndOne()).steps).toEqual([]);
    });

    it("an action a record can't hold, or a control with no record, isn't written", () => {
        const many = configuration((configuration) => {
            configuration.set(keys(new Array(19).fill(KeyStroke.key(0x04))), ControlId.key(1), 0);
        });
        expect(failure(() => WritePlan.of(many, "standard", sixAndOne()))).toEqual({ kind: "unsupported" });
        const elsewhere = configuration((configuration) => {
            configuration.set(KeyAction.UNASSIGNED, ControlId.key(7), 0);
        });
        expect(WritePlan.of(elsewhere, "standard", sixAndOne()).steps).toEqual([]);
    });
});

// Where each control is stored: the records of the cross-platform app's layouts.

describe("record numbers", () => {
    /** Every control of every layout has a record of its own, from 1 to 25. */
    it("every control has a record", () => {
        for (const layout of KeyboardLayout.all()) {
            const ids = layout.controls.flatMap((control) => numbers.record(control, layout) ?? []);
            expect(ids.length, layout.id).toBe(layout.controls.length);
            expect(new Set(ids).size, layout.id).toBe(ids.length);
            expect(
                ids.every((id) => id >= 1 && id <= 25),
                layout.id,
            ).toBe(true);
            for (const control of layout.controls) {
                const id = numbers.record(control, layout);
                expect(id === null ? null : numbers.controlInRecord(id, layout)).toEqual(control);
            }
        }
        const dial = named("0add1");
        expect(numbers.record(ControlId.knob(1, "pressRotateLeft"), dial)).toBe(19);
        expect(numbers.record(ControlId.knob(1, "pressRotateRight"), dial)).toBe(21);
        expect(numbers.record(ControlId.knob(4, "press"), named("12add4"))).toBe(14);
        expect(numbers.record(ControlId.key(7), sixAndOne())).toBeNull();
    });
});

/** Each format decodes what it encodes, for every action the formats share. */
describe("round trips", () => {
    const actions: KeyAction[] = [
        KeyAction.UNASSIGNED,
        keys([KeyStroke.of(Modifiers.CONTROL | Modifiers.RIGHT_ALT, 0x04), KeyStroke.key(0x05)]),
        ...MediaKey.ALL.map((key) => KeyAction.media(key)),
        ...MouseAction.ALL.map((action) => KeyAction.mouse(action)),
    ];
    for (const format of ["standard", "legacy"] satisfies RecordFormat[]) {
        it(format, () => {
            for (const action of actions) {
                expect(records.decode(records.encode(action, 1, 0, format), format)).toEqual(action);
            }
        });
    }

    /** What a save expects to read back: a well-formed action as it is, but only what the format's records keep. */
    it("stored form", () => {
        const modifierKey = keys([KeyStroke.of(Modifiers.SHIFT, 0)]);
        for (const format of ["standard", "legacy"] satisfies RecordFormat[]) {
            for (const action of [...actions, modifierKey]) expect(records.storedForm(action, format)).toEqual(action);
        }
        const waits = KeyAction.keys(KeyMacro.of([KeyStroke.withDelay(KeyStroke.key(0x04), 40)], 300));
        expect(records.storedForm(waits, "standard")).toEqual(
            KeyAction.keys(KeyMacro.of([KeyStroke.withDelay(KeyStroke.key(0x04), 40)])),
        );
        expect(records.storedForm(waits, "legacy")).toEqual(KeyAction.keys(KeyMacro.of([KeyStroke.key(0x04)], 300)));
        const tooMany = keys(Array.from({ length: 19 }, () => KeyStroke.key(0x04)));
        expect(records.storedForm(tooMany, "standard")).toBeNull();
    });
});
