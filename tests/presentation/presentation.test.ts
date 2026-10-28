// The drawing and the tables.

import { describe, expect, it } from "vitest";
import {
    ControlId,
    KeyAction,
    KeyboardIdentity,
    KeyboardLayout,
    KeyMacro,
    KeyStroke,
    MediaKey,
    Modifiers,
    MouseAction,
    SUPPORTED_KEYBOARDS,
    controlKey,
    type DeviceDetails,
    type DeviceInterface,
    type UsagePair,
} from "$domain";
import {
    ActionCaption,
    ActionText,
    BoardCap,
    ControlRef,
    KeyUsage,
    LayoutRect,
    LogLine,
    MediaChoice,
    ModifierKey,
    MouseChoice,
    Rgb,
    UDEV_RULES_PATH,
    udevInstallCommands,
    udevRules,
    type ControlDrawing,
    type KeyboardDrawing,
} from "$presentation";
import { control, fixture, k8840 } from "./fakes";

const { maxX, maxY, midX, midY } = LayoutRect;

const distance = (a: LayoutRect, b: LayoutRect) => Math.hypot(midX(a) - midX(b), midY(a) - midY(b));

const refOf = (control: ControlId): ControlRef =>
    control.kind === "key" ? ControlRef.key(control.number) : ControlRef.knob(control.number, control.part);

/** An editor with a keyboard that doesn't answer, so any of the app's layouts can be drawn. */
async function drawingEach() {
    const { editor, plug } = await fixture();
    await plug(k8840());
    return {
        editor,
        drawn(id: string, quarterTurns = 0): KeyboardDrawing {
            editor.chooseLayout(id, quarterTurns);
            const drawing = editor.drawing();
            if (drawing === null) throw new Error(`no drawing of ${id}`);
            return drawing;
        },
    };
}

describe("the drawing", () => {
    /** A knob is one body in the shape, on its press action. */
    it("knobs are one body each", async () => {
        const { editor, drawn } = await drawingEach();
        const press = control(drawn("6add1"), ControlRef.knob(1, "press")).rect;
        const knobs = (id: string) => editor.previewDrawing(id, 0)?.items.filter((item) => item.isKnob) ?? [];
        expect(knobs("6add1").map((item) => item.rect)).toEqual([press]);
        expect(knobs("0add1").length).toBe(1);
        for (const layout of KeyboardLayout.all()) {
            const drawing = drawn(layout.id);
            expect(new Set(drawing.controls.map((drawn) => ControlRef.id(drawn.control))), layout.id).toEqual(
                new Set(layout.controls.map((control) => ControlRef.id(refOf(control)))),
            );
            const shape = editor.previewDrawing(layout.id, 0);
            expect(shape?.items.filter((item) => !item.isKnob).length, layout.id).toBe(KeyboardLayout.keyCount(layout));
            expect(knobs(layout.id).length, layout.id).toBe(KeyboardLayout.knobCount(layout));
        }
    });

    /**
     * The app's layouts with their turns redrawn: one size in a layout, each turn the gap off its knob, none over
     * another control or out of the body.
     */
    it("turns are even and clear", async () => {
        const { drawn } = await drawingEach();
        for (const layout of KeyboardLayout.all()) {
            const drawing = drawn(layout.id);
            const turns = drawing.controls.filter(
                (drawn): drawn is ControlDrawing & { control: { kind: "knob" } } =>
                    drawn.control.kind === "knob" && drawn.control.action !== "press",
            );
            const size = turns[0]?.rect.width ?? 0;
            for (const { control: ref, rect: turn } of turns) {
                const name = `${layout.id} ${ControlRef.id(ref)}`;
                expect(Math.abs(turn.width - size) < 1e-9 && turn.height === turn.width, name).toBe(true);
                const press = control(drawing, ControlRef.knob(ref.number, "press")).rect;
                const gap = distance(turn, press) - press.width / 2 - turn.width / 2;
                expect(Math.abs(gap - 4), name).toBeLessThan(1e-6);
                for (const other of drawing.controls) {
                    if (ControlRef.same(other.control, ref)) continue;
                    const rect = other.rect;
                    if (other.control.kind === "key") {
                        const x = Math.min(Math.max(midX(turn), rect.x), maxX(rect));
                        const y = Math.min(Math.max(midY(turn), rect.y), maxY(rect));
                        const reach = Math.hypot(midX(turn) - x, midY(turn) - y);
                        expect(reach, `${name} over ${ControlRef.id(other.control)}`).toBeGreaterThanOrEqual(
                            turn.width / 2,
                        );
                    } else {
                        const clear = distance(turn, rect) >= (turn.width + rect.width) / 2 - 1e-6;
                        expect(clear, `${name} over ${ControlRef.id(other.control)}`).toBe(true);
                    }
                }
                const frame = drawing.frame;
                const inside =
                    turn.x >= frame.x && turn.y >= frame.y && maxX(turn) <= maxX(frame) && maxY(turn) <= maxY(frame);
                expect(inside, name).toBe(true);
            }
        }
    });

    /** Turned, every control turns about the middle of the bounds; four turns bring it back. */
    it("rotation turns the geometry", async () => {
        const { editor, drawn } = await drawingEach();
        const upright = drawn("6add1");
        editor.rotate();
        const quarter = editor.drawing();
        if (quarter === null) throw new Error("no drawing");
        expect(Math.abs(quarter.bounds.width - upright.bounds.height)).toBeLessThan(0.001);
        expect(Math.abs(quarter.bounds.height - upright.bounds.width)).toBeLessThan(0.001);
        const [centerX, centerY] = [midX(upright.bounds), midY(upright.bounds)];
        for (const { control: ref, rect } of upright.controls) {
            const turned = control(quarter, ref).rect;
            expect(Math.abs(midX(turned) - centerX + (midY(rect) - centerY))).toBeLessThan(0.001);
            expect(Math.abs(midY(turned) - centerY - (midX(rect) - centerX))).toBeLessThan(0.001);
        }
        editor.rotate();
        editor.rotate();
        editor.rotate();
        expect(editor.drawing()).toEqual(upright);
    });
});

describe("the tables", () => {
    it("strokes", () => {
        const stroke = KeyStroke.of(Modifiers.SUPER | Modifiers.SHIFT | Modifiers.CONTROL, 0x1d);
        expect(ActionText.stroke(stroke)).toBe("Ctrl+Shift+Super+Z");
        expect(ActionText.stroke(KeyStroke.of(Modifiers.ALT | Modifiers.RIGHT_SUPER, 0))).toBe("Alt+RSuper");
        expect(ActionText.keys(KeyMacro.of([KeyStroke.key(0x04), KeyStroke.key(0x28)]))).toBe("A ↵");
        expect(ActionText.key(0xa0)).toBe("0xA0");
    });

    it("key usages are unique and named", () => {
        const all = KeyUsage.all();
        expect(new Set(all.map((key) => key.usage)).size).toBe(all.length);
        expect(all.length).toBe(110);
        expect(KeyUsage.named(0x04)?.label).toBe("A");
        expect(KeyUsage.named(0x45)?.label).toBe("F12");
        expect(KeyUsage.named(0x68)?.label).toBe("F13");
        expect(KeyUsage.named(0x73)?.label).toBe("F24");
        expect(KeyUsage.named(0)).toBeNull();
    });

    /**
     * The full-size keyboard has every key but those a full-size keyboard doesn't, each once, and no two caps overlap or
     * run past the row.
     */
    it("the full keyboard", async () => {
        const caps = (await fixture()).editor.keyBoard();
        const keys = caps.flatMap((cap) => (cap.face.kind === "key" ? [cap.face.key.usage] : []));
        const elsewhere = new Set([...KeyUsage.EXTRA_FUNCTION_KEYS, ...KeyUsage.INTERNATIONAL].map((key) => key.usage));
        expect(keys.length).toBe(new Set(keys).size);
        expect(new Set(keys)).toEqual(
            new Set(
                KeyUsage.all()
                    .map((key) => key.usage)
                    .filter((usage) => !elsewhere.has(usage)),
            ),
        );
        const modifiers = new Set(caps.flatMap((cap) => (cap.face.kind === "modifier" ? [cap.face.modifier] : [])));
        expect(modifiers).toEqual(new Set(ModifierKey.ALL));
        for (let row = 0; row < 6; row++) {
            const inRow = caps.filter((cap) => cap.row === row).sort((a, b) => a.column - b.column);
            for (let index = 1; index < inRow.length; index++) {
                const [before, after] = [inRow[index - 1], inRow[index]];
                expect(before && after && before.column + before.width <= after.column, `row ${row}`).toBe(true);
            }
            const last = inRow.at(-1);
            expect(last ? last.column + last.width : 0, `row ${row}`).toBeLessThanOrEqual(BoardCap.ROW_WIDTH);
        }
    });

    /** A report in the device log: up to its zero padding on one line, every byte 16 to a row. */
    it("packets", () => {
        const report = new Uint8Array(65);
        report.set([0x03, 0xfb, 0xfb, 0xfb]);
        const line: LogLine = { id: 1, time: 0, direction: "output", bytes: report, event: null };
        expect(LogLine.summary(line)).toBe("03 FB FB FB");
        expect(LogLine.isShortened(line)).toBe(true);
        const rows = LogLine.rows(line);
        expect(rows.length).toBe(5);
        expect(rows[0]).toBe("0000  03 FB FB FB 00 00 00 00 00 00 00 00 00 00 00 00");
        expect(rows[4]).toBe("0040  00");
        expect(LogLine.summary({ ...line, bytes: new Uint8Array([0, 0]) })).toBe("00");
        expect(LogLine.rows({ ...line, bytes: new Uint8Array() })).toEqual([]);
    });

    /** Every media key and mouse action the domain knows has a name on screen. */
    it("choices cover the domain", async () => {
        const { editor, device, plug } = await fixture();
        // Before a keyboard is identified, every media key is offered — those with a name.
        expect(editor.mediaChoices().length).toBe(MediaKey.ALL.length);
        expect(MediaChoice.ALL.length).toBe(MediaKey.ALL.length);
        expect(new Set(editor.mediaChoices())).toEqual(new Set(MediaChoice.ALL));
        expect(MouseChoice.ALL.length).toBe(MouseAction.ALL.length);

        device.identity = KeyboardIdentity.of(6, 1, 10);
        device.actions = new Map([[controlKey(ControlId.key(1)), KeyAction.media(0x999)]]);
        await plug(k8840());
        const drawing = editor.drawing();
        expect(control(drawing, ControlRef.key(1)).caption).toEqual({ kind: "otherMedia", usage: 0x999 });
        expect(control(drawing, ControlRef.key(3)).caption).toEqual({ kind: "unknown" });
        expect(ActionCaption.isAssigned({ kind: "otherMedia", usage: 0x999 })).toBe(true);
        expect(ActionCaption.isAssigned({ kind: "unknown" })).toBe(false);
        editor.select(ControlRef.key(2));
        for (const choice of MouseChoice.ALL) {
            editor.assignMouse(choice);
            expect(editor.selectedCaption()).toEqual({ kind: "mouse", choice });
        }
        expect(Rgb.hex(Rgb.of(0, 255, 0))).toBe("#00FF00");
        expect(Rgb.PALETTE.length).toBe(56);
    });
});

describe("keyboard info", () => {
    const interfaceOf = (
        number: number,
        klass: number,
        subclass: number,
        protocol: number,
        usages: UsagePair[],
    ): DeviceInterface => ({ number, class: klass, subclass, protocol, usages });

    const details: DeviceDetails = {
        usbVersion: 0x0110,
        deviceRelease: 0,
        speed: 12_000_000,
        manufacturer: null,
        productName: null,
        serialNumber: null,
        maxPower: 100,
        interfaces: [
            interfaceOf(0, 3, 0, 0, []),
            interfaceOf(1, 3, 1, 1, [{ page: 1, usage: 6 }]),
            interfaceOf(2, 3, 0, 0, [
                { page: 1, usage: 6 },
                { page: 0x0c, usage: 1 },
            ]),
            interfaceOf(3, 3, 1, 2, []),
            interfaceOf(4, 3, 0, 0, [{ page: 0xff00, usage: 1 }]),
        ],
    };

    /** The information popover, from what a keyboard that doesn't answer reports. */
    it("from what the device says", async () => {
        const { editor, plug } = await fixture();
        await plug(k8840(details));
        const info = editor.keyboardInfo();
        expect(info?.usbId).toBe("1189:8840");
        expect(info?.firmware).toEqual({ kind: "unknown" });
        expect(info?.usb).toBe("USB 1.1 · 12 Mb/s");
        expect(info?.power).toBe(100);
        expect(info?.interfaces.map((each) => each.roles)).toEqual([
            ["configuration"],
            ["keyboard"],
            ["keyboard", "media"],
            ["mouse"],
            ["configuration"],
        ]);
        expect(info?.interfaces.map((each) => each.isConfiguration)).toEqual([true, false, false, false, false]);
        expect(info?.channel).toEqual({ interface: 0, path: "hid", reportId: 3, reportLength: 65 });
        expect(info?.commands).toBe("unidentified");
    });

    /** What the browser doesn't say stays unsaid; what the keyboard answers is its firmware. */
    it("nothing is guessed", async () => {
        const { editor, device, plug, unplug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        expect(editor.keyboardInfo()).toEqual({
            usbId: "1189:8840",
            name: null,
            manufacturer: null,
            serialNumber: null,
            firmware: { kind: "reported", type: 10, keys: 6, knobs: 1, isTested: true },
            usb: null,
            power: null,
            interfaces: [],
            channel: { interface: 0, path: "hid", reportId: 3, reportLength: 65 },
            commands: "standard",
        });
        await unplug();
        device.identity = null;
        await plug(
            k8840({
                ...details,
                usbVersion: null,
                deviceRelease: 0x0102,
                speed: null,
                productName: "",
                interfaces: [],
            }),
        );
        const info = editor.keyboardInfo();
        expect(info?.usb).toBeNull();
        expect(info?.name).toBeNull();
        expect(info?.firmware).toEqual({ kind: "release", version: "1.02" });
    });
});

describe("udev", () => {
    /**
     * Every keyboard the app looks for, in sysfs's lower case: one hidraw line per vendor with its products as
     * alternatives — beside the desktop app's 1189:8890 line.
     */
    it("the rules cover every keyboard", () => {
        const lines = udevRules()
            .split("\n")
            .filter((line) => line.startsWith("KERNEL=="));
        expect(lines.length).toBe(2);
        const allowed = (line: string) => {
            const vendor = /idVendor}=="([^"]*)"/.exec(line)?.[1] ?? "";
            const products = /idProduct}=="([^"]*)"/.exec(line)?.[1] ?? "";
            return products.split("|").map((product) => `${vendor}:${product}`);
        };
        const hex = (id: number) => id.toString(16).padStart(4, "0");
        expect(lines.flatMap(allowed).sort()).toEqual(
            SUPPORTED_KEYBOARDS.map((usb) => `${hex(usb.vendorId)}:${hex(usb.productId)}`).sort(),
        );
        expect(lines.every((line) => line.startsWith('KERNEL=="hidraw*", '))).toBe(true);
        expect(lines.every((line) => line.endsWith('TAG+="uaccess"'))).toBe(true);
    });

    /** The commands are short enough to copy without fuss: `tee`, the rule's four lines, `EOF`, and one to apply it. */
    it("the commands are short", () => {
        const commands = udevInstallCommands();
        expect(commands.trimEnd().split("\n").length).toBe(7);
        expect(commands.startsWith(`sudo tee ${UDEV_RULES_PATH} > /dev/null <<'EOF'\n`)).toBe(true);
        expect(commands.endsWith("sudo udevadm control --reload-rules && sudo udevadm trigger\n")).toBe(true);
    });

    /** The rule is the Linux edition's, byte for byte — both apps write the same file. */
    it("the rule is the Linux edition's", () => {
        expect(UDEV_RULES_PATH).toBe("/etc/udev/rules.d/60-minikeyboard.rules");
        expect(udevRules()).toBe(
            "# Lets the signed-in user configure the supported USB macro keyboards.\n" +
                'SUBSYSTEM=="usb", ATTR{idVendor}=="1189", ATTR{idProduct}=="8890", TAG+="uaccess"\n' +
                'KERNEL=="hidraw*", ATTRS{idVendor}=="1189", ATTRS{idProduct}=="8842|8840|8830|8831|8832|8833|8850|8851", TAG+="uaccess"\n' +
                'KERNEL=="hidraw*", ATTRS{idVendor}=="514c", ATTRS{idProduct}=="8842|8840|8830|8831|8832|8833|8850|8851", TAG+="uaccess"\n',
        );
    });
});
