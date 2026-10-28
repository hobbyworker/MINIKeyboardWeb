import { describe, expect, it } from "vitest";
import {
    AppendStrokeUseCase,
    ClearUseCase,
    ControlId,
    EditOutcome,
    IdentifyKeyboardUseCase,
    KeyAction,
    KeyboardCapabilities,
    KeyboardConfiguration,
    KeyboardDeviceError,
    KeyboardIdentity,
    KeyboardLayout,
    KeyColor,
    KeyMacro,
    KeyStroke,
    MediaKey,
    Modifiers,
    ReadKeyboardUseCase,
    RemoveLastStrokeUseCase,
    SaveKeyboardUseCase,
    SetActionUseCase,
    SetKeyDelayUseCase,
    SetLightingUseCase,
    SetPressDelayUseCase,
    controlKey,
    type EditTarget,
    type KeyboardDeviceErrorReason,
    type KeyboardDeviceRepository,
    type LayerActions,
    type LayerLighting,
    type LayerRead,
    type RecordFormat,
    type SaveOutcome,
} from "$domain";

const KEY1 = ControlId.key(1);

function target(format: RecordFormat, control: ControlId | null, layer: number): EditTarget {
    return { capabilities: new KeyboardCapabilities(format), layer, control };
}

const key1 = (format: RecordFormat) => target(format, KEY1, 0);

const keys = (strokes: readonly KeyStroke[]) => KeyAction.keys(KeyMacro.of(strokes));

function named(id: string): KeyboardLayout {
    const layout = KeyboardLayout.named(id);
    if (layout === null) throw new Error(`no layout ${id}`);
    return layout;
}

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

const append = new AppendStrokeUseCase();
const removeLast = new RemoveLastStrokeUseCase();
const setAction = new SetActionUseCase();
const setPressDelay = new SetPressDelayUseCase();
const setKeyDelay = new SetKeyDelayUseCase();
const clear = new ClearUseCase();
const setLighting = new SetLightingUseCase();

describe("editing", () => {
    it("presses add up", () => {
        const configuration = new KeyboardConfiguration(3);
        const standard = key1("standard");
        expect(append.execute(KeyStroke.of(Modifiers.SUPER, 0x06), configuration, standard)).toEqual(
            EditOutcome.APPLIED,
        );
        expect(append.execute(KeyStroke.key(0x28), configuration, standard)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(keys([KeyStroke.of(Modifiers.SUPER, 0x06), KeyStroke.key(0x28)]));
        expect(configuration.isChanged(KEY1, 0)).toBe(true);
        expect(configuration.action(KEY1, 1)).toBeNull();
    });

    it("nothing without a selection", () => {
        const configuration = new KeyboardConfiguration(3);
        expect(append.execute(KeyStroke.key(0x04), configuration, target("standard", null, 0))).toEqual(
            EditOutcome.NEEDS_SELECTION,
        );
        expect(configuration.hasUnsavedChanges()).toBe(false);
    });

    /**
     * Modifiers alone make a key a modifier key; a key pressed next takes them, as the vendor tools' modifier buttons
     * work.
     */
    it("modifiers alone", () => {
        const configuration = new KeyboardConfiguration(3);
        const legacy = key1("legacy");
        expect(append.execute(KeyStroke.of(Modifiers.CONTROL, 0), configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(keys([KeyStroke.of(Modifiers.CONTROL, 0)]));
        expect(append.execute(KeyStroke.of(Modifiers.SHIFT, 0x06), configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(keys([KeyStroke.of(Modifiers.CONTROL | Modifiers.SHIFT, 0x06)]));
        expect(append.execute(KeyStroke.of(Modifiers.ALT, 0), configuration, legacy)).toEqual(
            EditOutcome.MODIFIERS_ONLY_ALONE,
        );
    });

    /** A key the keyboard's vendor tool doesn't offer isn't added, pressed or set as a whole action. */
    it("a key the keyboard is not given stays out", () => {
        const configuration = new KeyboardConfiguration(3);
        const standard = key1("standard");
        expect(append.execute(KeyStroke.key(0x74), configuration, standard)).toEqual(EditOutcome.UNSUPPORTED);
        expect(setAction.execute(keys([KeyStroke.key(0x66)]), configuration, standard)).toEqual(
            EditOutcome.UNSUPPORTED,
        );
        expect(configuration.hasUnsavedChanges()).toBe(false);
        expect(append.execute(KeyStroke.key(0x68), configuration, standard)).toEqual(EditOutcome.APPLIED);
    });

    it("a full key takes no more", () => {
        const configuration = new KeyboardConfiguration(3);
        const legacy = key1("legacy");
        for (let press = 0; press < 20; press++) {
            expect(append.execute(KeyStroke.key(0x04), configuration, legacy)).toEqual(EditOutcome.APPLIED);
        }
        expect(append.execute(KeyStroke.key(0x04), configuration, legacy)).toEqual(EditOutcome.full(20));
    });

    it("a media key replaces presses", () => {
        const configuration = new KeyboardConfiguration(3);
        const legacy = key1("legacy");
        append.execute(KeyStroke.key(0x04), configuration, legacy);
        expect(setAction.execute(KeyAction.media(MediaKey.MUTE), configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(KeyAction.media(MediaKey.MUTE));
        // A key pressed now starts over.
        append.execute(KeyStroke.key(0x05), configuration, legacy);
        expect(configuration.action(KEY1, 0)).toEqual(keys([KeyStroke.key(0x05)]));
    });

    it("removing presses", () => {
        const configuration = new KeyboardConfiguration(3);
        const legacy = key1("legacy");
        append.execute(KeyStroke.key(0x04), configuration, legacy);
        append.execute(KeyStroke.key(0x05), configuration, legacy);
        expect(removeLast.execute(configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(keys([KeyStroke.key(0x04)]));
        expect(removeLast.execute(configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(KeyAction.UNASSIGNED);
        expect(removeLast.execute(configuration, legacy)).toEqual(EditOutcome.UNSUPPORTED);
    });

    it("delays", () => {
        const configuration = new KeyboardConfiguration(3);
        const standard = key1("standard");
        append.execute(KeyStroke.key(0x04), configuration, standard);
        append.execute(KeyStroke.key(0x05), configuration, standard);
        expect(setPressDelay.execute(1, 70000, configuration, standard)).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(
            keys([KeyStroke.key(0x04), KeyStroke.withDelay(KeyStroke.key(0x05), 60000)]),
        );
        expect(setKeyDelay.execute(100, configuration, standard)).toEqual(EditOutcome.UNSUPPORTED);

        const legacy = key1("legacy");
        expect(setKeyDelay.execute(9000, configuration, legacy)).toEqual(EditOutcome.APPLIED);
        const action = configuration.action(KEY1, 0);
        if (action?.kind !== "keys") throw new Error("the key lost its presses");
        expect(action.macro.delay).toBe(6000);
        expect(setPressDelay.execute(0, 5, configuration, key1("unidentified"))).toEqual(EditOutcome.UNSUPPORTED);
    });

    it("clearing", () => {
        const configuration = new KeyboardConfiguration(3);
        expect(clear.execute(configuration, key1("standard"))).toEqual(EditOutcome.APPLIED);
        expect(configuration.action(KEY1, 0)).toEqual(KeyAction.UNASSIGNED);
        const layout = named("6add1");
        clear.executeAll(layout, configuration, 2);
        expect(layout.controls.every((control) => configuration.action(control, 2)?.kind === "unassigned")).toBe(true);
        configuration.markSaved();
        expect(configuration.hasUnsavedChanges()).toBe(false);
    });

    it("lighting", () => {
        const configuration = new KeyboardConfiguration(3);

        const legacy = target("legacy", KEY1, 1);
        expect(setLighting.setColor("red", configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(setLighting.setMode(4, configuration, legacy)).toEqual(EditOutcome.APPLIED);
        expect(configuration.lighting(1)).toEqual({ kind: "colorMode", color: "red", mode: 4 });
        expect(setLighting.setMode(6, configuration, legacy)).toEqual(EditOutcome.UNSUPPORTED);

        const color = KeyColor.of(1, 2, 3);
        const standard = target("standard", ControlId.key(16), 2);
        expect(setLighting.setKeyColor(color, configuration, standard)).toEqual(EditOutcome.APPLIED);
        const lighting = configuration.lighting(2);
        if (lighting?.kind !== "perKey") throw new Error("no colours");
        expect(lighting.mode).toBe(0);
        expect(lighting.colors[15]).toEqual(color);
        const knob = target("standard", ControlId.knob(1, "press"), 2);
        expect(setLighting.setKeyColor(color, configuration, knob)).toEqual(EditOutcome.needsColorKey(16));
    });

    /** What read back otherwise stays changed, with the user's value; everything else is saved. */
    it("saved, all but some", () => {
        const configuration = new KeyboardConfiguration(3);
        const KEY2 = ControlId.key(2);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.set(KeyAction.media(MediaKey.STOP), KEY2, 0);
        configuration.set(KeyAction.media(MediaKey.STOP), KEY1, 1);
        configuration.setLighting({ kind: "colorMode", color: "red", mode: 1 }, 0);
        configuration.setLighting({ kind: "colorMode", color: "red", mode: 1 }, 2);
        configuration.markSaved({ controls: new Map([[0, [KEY2]]]), lightingLayers: [2] });
        expect(configuration.isChanged(KEY1, 0)).toBe(false);
        expect(configuration.isChanged(KEY2, 0)).toBe(true);
        expect(configuration.action(KEY2, 0)).toEqual(KeyAction.media(MediaKey.STOP));
        expect(configuration.isChanged(KEY1, 1)).toBe(false);
        expect(configuration.layers().map((layer) => layer.lightingChanged)).toEqual([false, false, true]);
        configuration.markSaved();
        expect(configuration.hasUnsavedChanges()).toBe(false);
    });

    it("reading replaces what the app had", () => {
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.applyRead(new Map([[controlKey(KEY1), KeyAction.mouse("leftClick")]]), 0);
        expect(configuration.action(KEY1, 0)).toEqual(KeyAction.mouse("leftClick"));
        expect(configuration.hasUnsavedChanges()).toBe(false);
    });
});

/** A keyboard that answers as told, and keeps what is written to it — as its records hold it — for reading back. */
class FakeDevice implements KeyboardDeviceRepository {
    identities: (KeyboardIdentity | null | KeyboardDeviceError)[] = [];
    /** Every layer's. */
    actions: LayerActions = new Map();
    lighting: LayerLighting | null = null;
    failWrite: KeyboardDeviceError | null = null;
    /** What reading a layer brings in place of what the keyboard holds, or the error it fails with — by layer. */
    readonly answers = new Map<number, LayerRead | KeyboardDeviceError>();
    /** What reading a layer's lights brings in place of what was written, or the error it fails with — by layer. */
    readonly lightingAnswers = new Map<number, LayerLighting | KeyboardDeviceError>();
    asked = 0;
    /** What was read, in order: "actions 0", "lighting 2". */
    readonly reads: string[] = [];
    readonly writes: KeyboardConfiguration[] = [];
    private readonly kept = new Map<number, Map<string, KeyAction>>();
    private readonly keptLighting = new Map<number, LayerLighting>();

    lightingResult(): LayerLighting {
        return this.lighting ?? { kind: "perKey", mode: 1, colors: KeyColor.DEFAULT_KEY_COLORS };
    }

    async askIdentity(): Promise<KeyboardIdentity | null> {
        this.asked += 1;
        const next = this.identities.shift() ?? null;
        if (next instanceof KeyboardDeviceError) throw next;
        return next;
    }

    async readActions(layer: number): Promise<LayerRead> {
        this.reads.push(`actions ${layer}`);
        const answer = this.answers.get(layer);
        if (answer instanceof KeyboardDeviceError) throw answer;
        return answer ?? { actions: new Map([...this.actions, ...(this.kept.get(layer) ?? [])]), unread: [] };
    }

    async readLighting(layer: number): Promise<LayerLighting> {
        this.reads.push(`lighting ${layer}`);
        const answer = this.lightingAnswers.get(layer);
        if (answer instanceof KeyboardDeviceError) throw answer;
        return answer ?? this.keptLighting.get(layer) ?? this.lightingResult();
    }

    /** A wait for the whole key is kept only by the legacy format, as the records keep it. */
    storedForm(action: KeyAction, format: RecordFormat): KeyAction | null {
        if (action.kind !== "keys" || format === "legacy") return action;
        return KeyAction.keys(KeyMacro.of(action.macro.strokes));
    }

    async write(configuration: KeyboardConfiguration, format: RecordFormat, layout: KeyboardLayout): Promise<void> {
        if (this.failWrite !== null) throw this.failWrite;
        this.writes.push(configuration.clone());
        configuration.layers().forEach((state, layer) => {
            const kept = this.kept.get(layer) ?? new Map<string, KeyAction>();
            for (const control of layout.controls) {
                const action = configuration.action(control, layer);
                const stored = action === null ? null : this.storedForm(action, format);
                if (stored !== null && configuration.isChanged(control, layer)) kept.set(controlKey(control), stored);
            }
            this.kept.set(layer, kept);
            const lighting = configuration.lighting(layer);
            if (state.lightingChanged && lighting !== null) this.keptLighting.set(layer, lighting);
        });
    }
}

describe("device", () => {
    it("a 884x keyboard is asked until it answers", async () => {
        const device = new FakeDevice();
        const identity = KeyboardIdentity.of(6, 1, 10);
        device.identities = [KeyboardDeviceError.invalidReply(), null, identity];
        const identification = await new IdentifyKeyboardUseCase(device).execute();
        expect(identification).toEqual({ format: "standard", identity });
        expect(device.asked).toBe(3);
    });

    it("a keyboard that never answers takes FE records", async () => {
        const device = new FakeDevice();
        const identification = await new IdentifyKeyboardUseCase(device).execute();
        expect(identification).toEqual({ format: "unidentified", identity: null });
        expect(device.asked).toBe(3);
    });

    it("a write failure ends the asking", async () => {
        const device = new FakeDevice();
        device.identities = [KeyboardDeviceError.writeFailed(1)];
        expect(await failure(new IdentifyKeyboardUseCase(device).execute())).toEqual({ kind: "writeFailed", code: 1 });
        expect(device.asked).toBe(1);
    });

    it("reading the standard format reads lights too", async () => {
        const device = new FakeDevice();
        device.actions = new Map([[controlKey(KEY1), KeyAction.media(MediaKey.MUTE)]]);
        const layout = named("6add1");
        const read = new ReadKeyboardUseCase(device);
        const outcome = await read.execute(new KeyboardConfiguration(3), new KeyboardCapabilities("standard"), layout);
        expect(outcome.error).toBeNull();
        expect(outcome.configuration.action(KEY1, 2)).toEqual(KeyAction.media(MediaKey.MUTE));
        expect(outcome.configuration.lighting(1)).toEqual(device.lightingResult());

        const legacy = await read.execute(new KeyboardConfiguration(3), new KeyboardCapabilities("legacy"), layout);
        expect(legacy.configuration.lighting(0)).toBeNull();

        const unidentified = await read.execute(
            new KeyboardConfiguration(3),
            new KeyboardCapabilities("unidentified"),
            layout,
        );
        expect(unidentified.error?.reason).toEqual({ kind: "unsupported" });
    });

    it("saving marks the changes saved", async () => {
        const device = new FakeDevice();
        const layout = named("6add1");
        const capabilities = new KeyboardCapabilities("standard");
        const save = new SaveKeyboardUseCase(device);
        const configuration = new KeyboardConfiguration(3);
        expect(await save.execute(configuration, capabilities, layout)).toEqual({ kind: "nothingToSave" });
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        const outcome = await save.execute(configuration, capabilities, layout);
        if (outcome.kind !== "saved") throw new Error("not saved");
        expect(outcome.check).toEqual({ kind: "matched" });
        expect(outcome.configuration.hasUnsavedChanges()).toBe(false);
        expect(outcome.configuration.action(KEY1, 0)).toEqual(KeyAction.media(MediaKey.MUTE));
        expect(device.writes).toHaveLength(1);
        expect(device.writes[0]?.equals(configuration)).toBe(true);

        device.failWrite = KeyboardDeviceError.writeFailed(7);
        expect(await failure(save.execute(configuration, capabilities, layout))).toEqual({
            kind: "writeFailed",
            code: 7,
        });
    });

    /** A short layer leaves its other controls as they were, and reading goes on with the next. */
    it("a layer read short doesn't stop reading", async () => {
        const device = new FakeDevice();
        const KEY2 = ControlId.key(2);
        const KNOB = ControlId.knob(1, "press");
        device.actions = new Map([[controlKey(KEY1), KeyAction.media(MediaKey.MUTE)]]);
        device.answers.set(1, {
            actions: new Map([[controlKey(KEY1), KeyAction.media(MediaKey.STOP)]]),
            unread: [KEY2, KNOB],
        });
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.mouse("leftClick"), KEY2, 1);
        const read = new ReadKeyboardUseCase(device);
        const outcome = await read.execute(configuration, new KeyboardCapabilities("standard"), named("6add1"));
        expect(outcome.error).toBeNull();
        expect(outcome.unread).toEqual(new Map([[1, [KEY2, KNOB]]]));
        expect(device.reads).toEqual(["actions 0", "actions 1", "actions 2", "lighting 0", "lighting 1", "lighting 2"]);
        expect(outcome.configuration.action(KEY1, 1)).toEqual(KeyAction.media(MediaKey.STOP));
        expect(outcome.configuration.action(KEY2, 1)).toEqual(KeyAction.mouse("leftClick"));
        expect(outcome.configuration.isChanged(KEY2, 1)).toBe(true);
        expect(outcome.configuration.action(KEY1, 2)).toEqual(KeyAction.media(MediaKey.MUTE));

        device.answers.clear();
        const whole = await read.execute(
            new KeyboardConfiguration(3),
            new KeyboardCapabilities("legacy"),
            named("6add1"),
        );
        expect(whole.unread.size).toBe(0);
    });

    it("a failure stops reading, and the layers read stay", async () => {
        const device = new FakeDevice();
        device.actions = new Map([[controlKey(KEY1), KeyAction.media(MediaKey.MUTE)]]);
        device.answers.set(1, KeyboardDeviceError.noReply());
        const read = new ReadKeyboardUseCase(device);
        const outcome = await read.execute(
            new KeyboardConfiguration(3),
            new KeyboardCapabilities("legacy"),
            named("6add1"),
        );
        expect(outcome.error?.reason).toEqual({ kind: "noReply" });
        expect(device.reads).toEqual(["actions 0", "actions 1"]);
        expect(outcome.configuration.action(KEY1, 0)).toEqual(KeyAction.media(MediaKey.MUTE));
        expect(outcome.configuration.action(KEY1, 2)).toBeNull();
    });
});

describe("reading back after saving", () => {
    const KEY2 = ControlId.key(2);
    const layout = named("6add1");
    const save = (device: FakeDevice, configuration: KeyboardConfiguration, format: RecordFormat) =>
        new SaveKeyboardUseCase(device).execute(configuration, new KeyboardCapabilities(format), layout);

    async function saved(promise: Promise<SaveOutcome>): Promise<Extract<SaveOutcome, { kind: "saved" }>> {
        const outcome = await promise;
        if (outcome.kind !== "saved") throw new Error("not saved");
        return outcome;
    }

    /** Only the layers with changes are read back, and only what the keyboard changed counts. */
    it("what reads back as its records hold it matches", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        // The standard format keeps no wait for the whole key.
        configuration.set(KeyAction.keys(KeyMacro.of([KeyStroke.key(0x04)], 500)), KEY1, 1);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY2, 1);
        const outcome = await saved(save(device, configuration, "standard"));
        expect(outcome.check).toEqual({ kind: "matched" });
        expect(outcome.configuration.hasUnsavedChanges()).toBe(false);
        expect(device.reads).toEqual(["actions 1"]);
    });

    /** A control read back otherwise stays changed, with the user's action. */
    it("what reads back otherwise stays not saved", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.set(KeyAction.media(MediaKey.STOP), KEY2, 0);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 2);
        device.answers.set(0, {
            actions: new Map<string, KeyAction>([
                [controlKey(KEY1), KeyAction.media(MediaKey.VOLUME_UP)],
                [controlKey(KEY2), KeyAction.UNASSIGNED],
            ]),
            unread: [],
        });
        const outcome = await saved(save(device, configuration, "legacy"));
        expect(outcome.check).toEqual({
            kind: "differs",
            differences: { controls: new Map([[0, [KEY1, KEY2]]]), lightingLayers: [] },
        });
        const result = outcome.configuration;
        expect(result.isChanged(KEY1, 0) && result.isChanged(KEY2, 0)).toBe(true);
        expect(result.action(KEY1, 0)).toEqual(KeyAction.media(MediaKey.MUTE));
        expect(result.isChanged(KEY1, 2)).toBe(false);
        expect(device.reads).toEqual(["actions 0", "actions 2"]);
    });

    /** A control kept beyond the records the read asks for is neither read nor unread, and isn't compared. */
    it("a control outside the read isn't compared", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.set(KeyAction.media(MediaKey.STOP), KEY2, 0);
        device.answers.set(0, { actions: new Map([[controlKey(KEY1), KeyAction.media(MediaKey.MUTE)]]), unread: [] });
        const outcome = await saved(save(device, configuration, "legacy"));
        expect(outcome.check).toEqual({ kind: "matched" });
        expect(outcome.configuration.hasUnsavedChanges()).toBe(false);
    });

    it("a read back that fails can't tell, and saves", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 1);
        device.answers.set(0, KeyboardDeviceError.noReply());
        const outcome = await saved(save(device, configuration, "standard"));
        expect(outcome.check).toEqual({ kind: "couldNotCheck" });
        expect(outcome.configuration.hasUnsavedChanges()).toBe(false);
        expect(device.reads).toEqual(["actions 0", "actions 1"]);
    });

    it("a control left unread can't tell", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.set(KeyAction.media(MediaKey.STOP), KEY2, 0);
        device.answers.set(0, {
            actions: new Map([[controlKey(KEY2), KeyAction.media(MediaKey.STOP)]]),
            unread: [KEY1],
        });
        const outcome = await saved(save(device, configuration, "standard"));
        expect(outcome.check).toEqual({ kind: "couldNotCheck" });
        expect(outcome.configuration.hasUnsavedChanges()).toBe(false);
    });

    it("a keyboard that doesn't read back isn't asked", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        configuration.set(KeyAction.media(MediaKey.MUTE), KEY1, 0);
        configuration.setLighting({ kind: "colorMode", color: "red", mode: 1 }, 0);
        const outcome = await saved(save(device, configuration, "unidentified"));
        expect(outcome.check).toEqual({ kind: "notChecked" });
        expect(outcome.configuration.hasUnsavedChanges()).toBe(false);
        expect(device.reads).toEqual([]);
    });

    /** Per-key lights read back; a legacy layer's colour and mode have no command to read them. */
    it("lights", async () => {
        const device = new FakeDevice();
        const configuration = new KeyboardConfiguration(3);
        const colors = KeyColor.DEFAULT_KEY_COLORS.map((color, index) => (index === 0 ? KeyColor.of(1, 2, 3) : color));
        configuration.setLighting({ kind: "perKey", mode: 3, colors }, 1);
        configuration.setLighting({ kind: "perKey", mode: 4, colors }, 2);
        device.lightingAnswers.set(1, { kind: "perKey", mode: 3, colors: KeyColor.DEFAULT_KEY_COLORS });
        const outcome = await saved(save(device, configuration, "standard"));
        expect(outcome.check).toEqual({ kind: "differs", differences: { controls: new Map(), lightingLayers: [1] } });
        expect(outcome.configuration.layers().map((layer) => layer.lightingChanged)).toEqual([false, true, false]);
        expect(device.reads).toEqual(["lighting 1", "lighting 2"]);

        const legacy = new FakeDevice();
        const lit = new KeyboardConfiguration(3);
        lit.setLighting({ kind: "colorMode", color: "red", mode: 1 }, 0);
        expect((await saved(save(legacy, lit, "legacy"))).check).toEqual({ kind: "matched" });
        expect(legacy.reads).toEqual([]);
    });
});
