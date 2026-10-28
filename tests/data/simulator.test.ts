// The device repository against simulated firmware: the same codecs as with a keyboard on USB.

import { describe, expect, it } from "vitest";
import {
    Broadcaster,
    DeviceLogStore,
    KeyboardDevice,
    KeyboardSourceSwitch,
    SimulatedKeyboard,
    numbers,
    type HardwareConnection,
} from "$data";
import {
    AttachedKeyboards,
    ControlId,
    KeyAction,
    KeyboardCapabilities,
    KeyboardConfiguration,
    KeyboardDeviceError,
    KeyboardIdentity,
    KeyboardLayout,
    KeyboardSource,
    KeyColor,
    KeyMacro,
    KeyStroke,
    MediaKey,
    Modifiers,
    SaveKeyboardUseCase,
    SimulatedModel,
    UsbIdentity,
    controlKey,
    type ConnectionState,
    type DeviceLogEntry,
    type KeyboardDeviceErrorReason,
    type RecordFormat,
} from "$domain";

function named(id: string): KeyboardLayout {
    const layout = KeyboardLayout.named(id);
    if (layout === null) throw new Error(`no layout ${id}`);
    return layout;
}

function model(layout: string, format: RecordFormat): SimulatedModel {
    const model = SimulatedModel.identifiedAs(named(layout), format);
    if (model === null) throw new Error(`no model for ${layout}`);
    return model;
}

const device = (keyboard: SimulatedKeyboard, log: DeviceLogStore) =>
    new KeyboardDevice(keyboard, log, { identifyTimeout: 20, replyTimeout: 50, pause: () => Promise.resolve() });

/** Why `promise` rejected with a {@link KeyboardDeviceError}. */
async function failure(promise: Promise<unknown>): Promise<KeyboardDeviceErrorReason> {
    try {
        await promise;
    } catch (error) {
        if (error instanceof KeyboardDeviceError) return error.reason;
        throw error;
    }
    throw new Error("it did not fail");
}

describe("simulated keyboards", () => {
    it("a standard keyboard reads back what was written", async () => {
        const log = new DeviceLogStore();
        const keyboard = new SimulatedKeyboard(model("6add1", "standard"));
        const repository = device(keyboard, log);
        expect(await repository.askIdentity()).toEqual(KeyboardIdentity.of(6, 1, 10));

        const layout = named("6add1");
        const fresh = await repository.readActions(0, "standard", layout);
        expect(fresh.actions.size).toBe(layout.controls.length);
        expect(fresh.unread).toEqual([]);
        expect([...fresh.actions.values()].every((action) => action.kind === "unassigned")).toBe(true);

        const configuration = new KeyboardConfiguration(3);
        const presses = KeyAction.keys(
            KeyMacro.of([
                KeyStroke.withDelay(KeyStroke.of(Modifiers.SUPER, 0x06), 100),
                KeyStroke.withDelay(KeyStroke.key(0x28), 60),
            ]),
        );
        configuration.set(presses, ControlId.key(3), 1);
        configuration.set(KeyAction.mouse("middleClick"), ControlId.knob(1, "press"), 1);
        const colors = Array.from({ length: 16 }, (_, red) => KeyColor.of(red, 0, 0));
        configuration.setLighting({ kind: "perKey", mode: 5, colors }, 1);
        await repository.write(configuration, "standard", layout);

        const read = (await repository.readActions(1, "standard", layout)).actions;
        expect(read.get(controlKey(ControlId.key(3)))).toEqual(presses);
        expect(read.get(controlKey(ControlId.knob(1, "press")))).toEqual(KeyAction.mouse("middleClick"));
        expect(read.get(controlKey(ControlId.key(1)))).toEqual(KeyAction.UNASSIGNED);
        expect(await repository.readLighting(1)).toEqual({ kind: "perKey", mode: 5, colors });
        expect(await repository.readLighting(0)).toEqual({
            kind: "perKey",
            mode: 0,
            colors: KeyColor.DEFAULT_KEY_COLORS,
        });
    });

    it("a legacy keyboard keeps its wait", async () => {
        const log = new DeviceLogStore();
        const keyboard = new SimulatedKeyboard(model("4add1", "legacy"));
        const repository = device(keyboard, log);
        expect(await repository.askIdentity()).toEqual(KeyboardIdentity.of(4, 1, 0));
        const layout = named("4add1");
        const configuration = new KeyboardConfiguration(3);
        const presses = KeyAction.keys(KeyMacro.of([KeyStroke.of(Modifiers.SHIFT, 0x04)], 1500));
        configuration.set(presses, ControlId.key(4), 2);
        configuration.setLighting({ kind: "colorMode", color: "purple", mode: 5 }, 2);
        await repository.write(configuration, "legacy", layout);
        const read = await repository.readActions(2, "legacy", layout);
        expect(read.actions.get(controlKey(ControlId.key(4)))).toEqual(presses);
        expect(keyboard.record(3, 0)?.[11]).toBe(0x75);
    });

    /** What a save writes reads back as written, so the save checks out. */
    it("a save reads back as written", async () => {
        for (const [layoutId, format] of [
            ["6add1", "standard"],
            ["4add1", "legacy"],
        ] as const) {
            const keyboard = new SimulatedKeyboard(model(layoutId, format));
            const repository = device(keyboard, new DeviceLogStore());
            const layout = named(layoutId);
            const capabilities = new KeyboardCapabilities(format);
            const configuration = new KeyboardConfiguration(3);
            const presses = KeyAction.keys(KeyMacro.of([KeyStroke.of(Modifiers.CONTROL, 0x06), KeyStroke.key(0x19)]));
            configuration.set(presses, ControlId.key(2), 0);
            configuration.set(KeyAction.media(MediaKey.VOLUME_UP), ControlId.knob(1, "rotateRight"), 0);
            configuration.set(KeyAction.mouse("wheelDown"), ControlId.key(1), 2);
            if (format === "standard") {
                const colors = KeyColor.DEFAULT_KEY_COLORS.map((color, index) =>
                    index === 1 ? KeyColor.of(7, 8, 9) : color,
                );
                configuration.setLighting({ kind: "perKey", mode: 2, colors }, 2);
            } else {
                configuration.setLighting({ kind: "colorMode", color: "green", mode: 3 }, 2);
            }
            const outcome = await new SaveKeyboardUseCase(repository).execute(configuration, capabilities, layout);
            expect(outcome.kind === "saved" && outcome.check, format).toEqual({ kind: "matched" });
            expect(outcome.kind === "saved" && outcome.configuration.hasUnsavedChanges(), format).toBe(false);
        }
    });

    /**
     * The legacy read asks for 24 records; 16add3 keeps its third knob's right turn in record 25, outside the read —
     * neither read nor unread, and a save of it alone has nothing to compare.
     */
    it("a legacy keyboard's control beyond the records read", async () => {
        const identity = KeyboardIdentity.of(16, 3, 0);
        const usb = UsbIdentity.of(0x1189, 0x8840);
        const keyboard = new SimulatedKeyboard({ usb, kind: { kind: "identified", identity } });
        const repository = device(keyboard, new DeviceLogStore());
        const layout = named("16add3");
        const beyond = ControlId.knob(3, "rotateRight");
        expect(numbers.record(beyond, layout)).toBe(25);

        const read = await repository.readActions(0, "legacy", layout);
        expect(read.unread).toEqual([]);
        expect(read.actions.has(controlKey(beyond))).toBe(false);
        expect(read.actions.size).toBe(layout.controls.length - 1);

        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), beyond, 0);
        const save = new SaveKeyboardUseCase(repository);
        const outcome = await save.execute(configuration, new KeyboardCapabilities("legacy"), layout);
        expect(outcome.kind === "saved" && outcome.check).toEqual({ kind: "matched" });
        expect(outcome.kind === "saved" && outcome.configuration.hasUnsavedChanges()).toBe(false);
        expect(keyboard.record(1, 25)?.[0]).toBe(0xfd);
    });

    it("an unidentified keyboard answers nothing", async () => {
        const log = new DeviceLogStore();
        const keyboard = new SimulatedKeyboard({ usb: UsbIdentity.of(0x1189, 0x8840), kind: { kind: "unidentified" } });
        const repository = device(keyboard, log);
        expect(await repository.askIdentity()).toBeNull();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), ControlId.key(1), 0);
        await repository.write(configuration, "unidentified", named("6add1"));
        expect(keyboard.record(1, 1)?.[0]).toBe(0xfe);
        expect(await failure(repository.readActions(0, "unidentified", named("6add1")))).toEqual({
            kind: "unsupported",
        });
    });

    /** The payloads go out after report ID 3, padded to 65 bytes, and the log holds every report. */
    it("reports are framed and logged", async () => {
        const log = new DeviceLogStore();
        const keyboard = new SimulatedKeyboard(model("6add1", "standard"));
        const repository = device(keyboard, log);
        await repository.askIdentity();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.keys(KeyMacro.of([KeyStroke.key(0x04)])), ControlId.key(1), 0);
        await repository.write(configuration, "standard", named("6add1"));
        const written = keyboard.written();
        expect(written.length).toBe(3);
        expect(written.every((payload) => payload.length === 64)).toBe(true);

        let entries: readonly DeviceLogEntry[] = [];
        log.entries().subscribe((value) => (entries = value));
        const reports = entries.flatMap((entry) =>
            entry.content.kind === "event" ? [] : [[entry.content.kind, entry.content.bytes] as const],
        );
        expect(reports.map(([kind]) => kind)).toEqual(["output", "input", "output", "output"]);
        expect(reports.every(([, bytes]) => bytes.length === 65 && bytes[0] === 3)).toBe(true);
        expect([...(reports[1]?.[1].subarray(0, 5) ?? [])]).toEqual([3, 0xfb, 6, 1, 10]);
    });

    it("nothing open", async () => {
        const repository = new KeyboardDevice({ openChannel: () => null }, new DeviceLogStore());
        expect(await failure(repository.askIdentity())).toEqual({ kind: "notConnected" });
    });

    it("the log keeps the newest lines", () => {
        const log = new DeviceLogStore();
        for (let index = 0; index < 2100; index++) {
            log.append({ kind: "output", bytes: Uint8Array.of(index >> 8, index & 0xff) });
        }
        const lines = log.snapshot();
        expect(lines.length).toBe(2000);
        expect(lines[0]?.id).toBe(101);
        log.clear();
        const seen: (readonly DeviceLogEntry[])[] = [];
        log.entries().subscribe((value) => seen.push(value));
        expect(seen).toEqual([[]]);
    });
});

/** A hardware connection the switch follows, whose values the test sets. */
class FakeHardware implements HardwareConnection {
    readonly state = new Broadcaster<ConnectionState>({ kind: "searching" });
    readonly attached = new Broadcaster<AttachedKeyboards>(AttachedKeyboards.NONE);
    readonly calls: string[] = [];

    connectionStates() {
        return this.state;
    }

    attachedKeyboards() {
        return this.attached;
    }

    retry(): void {
        this.calls.push("retry");
    }

    selectKeyboard(id: string): void {
        this.calls.push(`select ${id}`);
    }

    async requestAccess(): Promise<string | null> {
        this.calls.push("request");
        return "hid-1";
    }

    openChannel() {
        return null;
    }
}

describe("keyboard source switch", () => {
    const simulated = (model: SimulatedModel): KeyboardSource => ({ kind: "simulated", model });

    /**
     * A switch is reported as "searching" and then the new keyboard. The USB connection is made the first time it is
     * chosen, and only followed while it is.
     */
    it("switches between the keyboard on USB and a simulated one", () => {
        const log = new DeviceLogStore();
        const hardware = new FakeHardware();
        let made = 0;
        const sixAndOne = model("6add1", "standard");
        const source = new KeyboardSourceSwitch(log, simulated(sixAndOne), () => {
            made += 1;
            return hardware;
        });
        expect(made).toBe(0);
        const states: ConnectionState[] = [];
        const attached: AttachedKeyboards[] = [];
        source.connectionStates().subscribe((state) => states.push(state));
        source.attachedKeyboards().subscribe((value) => attached.push(value));
        expect(states.map((state) => state.kind)).toEqual(["connected"]);
        expect(source.openChannel()).toBeInstanceOf(SimulatedKeyboard);
        source.retry();
        source.selectKeyboard("hid-1");
        expect(hardware.calls).toEqual([]);

        source.select(KeyboardSource.HARDWARE);
        expect(made).toBe(1);
        expect(states.map((state) => state.kind)).toEqual(["connected", "searching"]);
        const plugged: AttachedKeyboards = {
            keyboards: [{ id: "hid-1", usb: UsbIdentity.of(0x1189, 0x8840), location: "" }],
            selected: "hid-1",
        };
        hardware.attached.set(plugged);
        hardware.state.set({ kind: "needsPermission" });
        expect(states.at(-1)).toEqual({ kind: "needsPermission" });
        expect(attached.at(-1)).toEqual(plugged);
        source.retry();
        source.selectKeyboard("hid-1");
        expect(hardware.calls).toEqual(["retry", "select hid-1"]);

        // Back to the simulated keyboard: the same one, its records kept; the USB keyboards are no longer offered.
        const channel = source.openChannel();
        source.select(simulated(sixAndOne));
        expect(states.slice(-2).map((state) => state.kind)).toEqual(["searching", "connected"]);
        expect(attached.at(-1)).toEqual(AttachedKeyboards.NONE);
        hardware.state.set({ kind: "searching" });
        expect(states.at(-1)?.kind).toBe("connected");
        expect(channel).toBeNull();
        expect(log.snapshot().filter((entry) => entry.content.kind === "event").length).toBe(1);

        // And to the keyboard on USB again: its latest state, without a second connection.
        source.select(KeyboardSource.HARDWARE);
        expect(made).toBe(1);
        expect(states.at(-1)).toEqual({ kind: "searching" });
        expect(attached.at(-1)).toEqual(plugged);
    });

    /**
     * Listeners hear about the new keyboard at once and may write to it straight away — as the editor does, asking it
     * who it is — so its channel is open by the time it is reported, from the keyboard on USB or from another one.
     */
    it("a keyboard reported is one that can be written to", () => {
        const hardware = new FakeHardware();
        const source = new KeyboardSourceSwitch(new DeviceLogStore(), KeyboardSource.HARDWARE, () => hardware);
        const channels: (string | null)[] = [];
        source.connectionStates().subscribe((state) => {
            if (state.kind === "connected") channels.push(state.keyboard.channel);
            if (state.kind === "connected") expect(source.openChannel()).toBeInstanceOf(SimulatedKeyboard);
        });
        source.select(simulated(model("6add1", "standard")));
        source.select(simulated(model("4add1", "legacy")));
        expect(channels).toEqual(["simulated", "simulated"]);
    });

    it("the same source again changes nothing", async () => {
        const hardware = new FakeHardware();
        const source = new KeyboardSourceSwitch(new DeviceLogStore(), KeyboardSource.HARDWARE, () => hardware);
        const states: ConnectionState[] = [];
        source.connectionStates().subscribe((state) => states.push(state));
        source.select(KeyboardSource.HARDWARE);
        expect(states).toEqual([{ kind: "searching" }]);
        expect(source.current()).toEqual(KeyboardSource.HARDWARE);
        await expect(source.requestAccess()).resolves.toBe("hid-1");
        expect(hardware.calls).toEqual(["request"]);

        const legacy = model("4add1", "legacy");
        source.select(simulated(legacy));
        source.select(simulated(legacy));
        expect(states.map((state) => state.kind)).toEqual(["searching", "connected"]);
        await expect(source.requestAccess()).resolves.toBeNull();
        expect(hardware.calls).toEqual(["request"]);
    });
});
