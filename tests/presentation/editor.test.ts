import { describe, expect, it } from "vitest";
import {
    ControlId,
    KeyAction,
    KeyboardDeviceError,
    KeyboardIdentity,
    KeyColor,
    MediaKey,
    SimulatedModel,
    UsbIdentity,
    controlKey,
    type AttachedKeyboard,
} from "$domain";
import { ControlRef, EditorTab, LedColor, Notice, Rgb, SimulatorChoice } from "$presentation";
import { A, C, FakeSource, control, fixture, hold, k8840, key, settle } from "./fakes";

const KEY1 = ControlRef.key(1);
const KEY2 = ControlRef.key(2);

describe("the editor", () => {
    /** A keyboard that doesn't answer is drawn as the user arranges it, and edited and saved like any other. */
    it("a keyboard that doesn't answer is arranged", async () => {
        const { editor, device, profiles, plug } = await fixture();
        await plug(k8840());
        expect(editor.isReady()).toBe(true);
        expect(editor.status()).toEqual({
            kind: "connected",
            usb: "1189:8840",
            keys: null,
            knobs: null,
            isIdentified: true,
            isSimulated: false,
        });
        expect(editor.isChoosingLayout()).toBe(true);
        expect(editor.readsBack()).toBe(false);
        expect(editor.availableTabs()).toEqual(["keys", "media", "mouse", "lighting"]);
        expect(device.reads).toBe(0);
        const sheet = editor.layoutSheet();
        expect(sheet?.mode.kind).toBe("catalog");
        expect(sheet?.isRequired).toBe(true);

        editor.chooseLayout("6add1", 0);
        expect(editor.isChoosingLayout()).toBe(false);
        expect(profiles.saved.get("1189:8840")?.layoutId).toBe("6add1");
        expect(editor.drawing()?.controls.length).toBe(9);

        editor.select(KEY1);
        editor.toggle("super");
        expect(editor.heldModifierText()).toBe("Super");
        editor.press(key(C));
        expect(editor.heldModifiers()).toEqual([]);
        expect(editor.selectionState()?.binding).toEqual({
            kind: "presses",
            strokes: ["Super+C"],
            keyDelay: 0,
            used: 1,
            limit: 18,
        });
        const drawing = editor.drawing();
        expect(control(drawing, KEY1).isChanged).toBe(true);
        expect(control(drawing, KEY1).caption).toEqual({ kind: "presses", text: "Super+C" });
        expect(editor.hasUnsavedChanges()).toBe(true);

        await editor.save();
        expect(editor.notice()).toEqual({ kind: "saved", simulated: false });
        expect(editor.hasUnsavedChanges()).toBe(false);
        expect(device.writes.length).toBe(1);

        // The cross-platform app's keys, in its arrangement: F13–F24, the non-US keys and Keypad Enter too.
        expect(editor.vendorKeyArrangement()).toBe("qwerty");
        expect(editor.moreKeys().length).toBe(14);
        expect(editor.keyBoard().filter((cap) => !cap.isEnabled)).toEqual([]);
        const groups = editor.keyGroups();
        expect(groups.find((group) => group.kind === "functionKeys")?.keys.length).toBe(24);
        expect(groups.reduce((sum, group) => sum + group.keys.length, 0)).toBe(110);
        editor.press(key(0x58));
        expect(editor.notice()).toEqual({ kind: "saved", simulated: false });
        expect(editor.hasUnsavedChanges()).toBe(true);
    });

    it("a standard keyboard is read on connect", async () => {
        const { editor, device, plug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 10);
        device.actions = new Map([[controlKey(ControlId.key(2)), KeyAction.media(MediaKey.MUTE)]]);
        await plug(k8840());
        expect(editor.isReady() && device.reads > 0).toBe(true);
        expect(editor.status()).toEqual({
            kind: "connected",
            usb: "1189:8840",
            keys: 6,
            knobs: 1,
            isIdentified: true,
            isSimulated: false,
        });
        expect(editor.isChoosingLayout()).toBe(false);
        expect(editor.layoutSheet()?.mode).toEqual({ kind: "fixed" });
        expect(control(editor.drawing(), KEY2).caption).toEqual({ kind: "media", choice: "mute" });
        expect(editor.availableTabs()).toEqual([...EditorTab.ALL]);
        expect(editor.notice()).toBeNull();
        expect(editor.vendorKeyArrangement()).toBe("qwerty");
        expect(editor.keyBoard().every((cap) => cap.isEnabled)).toBe(true);
        expect(editor.moreKeys().length).toBe(14);

        editor.setTab("lighting");
        editor.select(KEY1);
        const first = KeyColor.DEFAULT_KEY_COLORS[0];
        expect(control(editor.drawing(), KEY1).ledColor).toEqual(first && Rgb.of(first.red, first.green, first.blue));
        const page = editor.lightingPage();
        if (page?.kind !== "perKeyColor") throw new Error("not the per-key page");
        expect(page.modes).toEqual([0, 1, 2, 3, 4, 5]);
        expect(page.keys).toBe(16);
        expect(page.selected?.title).toEqual({ kind: "key", number: 1 });
        editor.setKeyColor(Rgb.of(1, 2, 3));
        editor.setLightingMode(4);
        const changed = editor.lightingPage();
        if (changed?.kind !== "perKeyColor") throw new Error("not the per-key page");
        expect(changed.activeMode).toBe(4);
        expect(changed.selected?.color).toEqual(Rgb.of(1, 2, 3));

        editor.setTab("delay");
        editor.press(key(A));
        editor.press(key(C));
        editor.setDelay(1, 250);
        expect(editor.delayPage()).toEqual({
            kind: "perPress",
            range: { start: 0, end: 60000 },
            presses: [
                { index: 0, text: "A", delay: 0 },
                { index: 1, text: "C", delay: 250 },
            ],
        });
    });

    it("edits need a selection and room", async () => {
        const { editor, plug } = await fixture();
        await plug(k8840());
        editor.press(key(A));
        expect(editor.notice()).toEqual({ kind: "selectControlFirst" });
        editor.select(KEY1);
        for (let press = 0; press < 19; press++) editor.press(key(A));
        expect(editor.notice()).toEqual({ kind: "full", limit: 18 });
        // The cross-platform app's media buttons, in its order.
        expect(editor.mediaChoices()).toEqual([
            "playPause",
            "stop",
            "previousTrack",
            "nextTrack",
            "myComputer",
            "brightnessUp",
            "brightnessDown",
            "mediaPlayer",
            "mute",
            "volumeUp",
            "volumeDown",
            "calculator",
            "webHome",
            "email",
            "bassUp",
            "bassDown",
            "trebleUp",
            "trebleDown",
            "webRefresh",
            "webForward",
            "webBack",
        ]);
        editor.assignMedia("mute");
        expect(editor.selectedCaption()).toEqual({ kind: "media", choice: "mute" });
        editor.toggle("shift");
        editor.assignHeldModifiers();
        expect(editor.selectionState()?.binding).toEqual({
            kind: "presses",
            strokes: ["Shift"],
            keyDelay: 0,
            used: 1,
            limit: 18,
        });
        editor.press(key(A));
        expect(editor.selectionState()?.binding).toEqual({
            kind: "presses",
            strokes: ["Shift+A"],
            keyDelay: 0,
            used: 1,
            limit: 18,
        });
        editor.clearSelected();
        expect(editor.selectionState()?.binding).toEqual({ kind: "nothing" });
        editor.select(KEY2);
        expect(editor.selectionState()?.binding).toEqual({ kind: "unknown" });
        editor.setLightingMode(2);
        expect(editor.lightingPage()).toEqual({
            kind: "colorAndMode",
            colors: [...LedColor.ALL],
            modes: [0, 1, 2, 3, 4, 5],
            activeColor: "cyan",
            activeMode: 2,
        });
    });

    it("a failed save keeps the changes", async () => {
        const { editor, device, plug } = await fixture();
        device.failWrite = KeyboardDeviceError.writeFailed(-7);
        await plug(k8840());
        await editor.save();
        expect(editor.notice()).toEqual({ kind: "nothingToSave" });
        editor.setLightingMode(1);
        await editor.save();
        expect(editor.notice()).toEqual({ kind: "writeFailed", code: -7 });
        expect(editor.hasUnsavedChanges()).toBe(true);
        expect(editor.activity()).toBeNull();
    });

    it("unplugging forgets the keyboard", async () => {
        const { editor, plug, unplug } = await fixture();
        await plug(k8840());
        editor.select(KEY2);
        await unplug();
        expect(editor.status()).toEqual({ kind: "searching" });
        expect(editor.selectedControl()).toBeNull();
        expect(editor.isReady()).toBe(false);
        expect(editor.keyboardInfo()).toBeNull();
    });

    /** Unplugged, the last keyboard is still drawn, but its shape can't be changed — and its sheet goes with it. */
    it("unplugged, the shape can't change", async () => {
        const { editor, plug, unplug } = await fixture();
        await plug(k8840());
        expect(editor.hasLayout()).toBe(true);
        expect(editor.isChoosingLayout()).toBe(true);
        await unplug();
        expect(editor.drawing()).not.toBeNull();
        expect(editor.hasLayout()).toBe(false);
        expect(editor.isChoosingLayout()).toBe(false);
        expect(editor.layoutSheet()).toBeNull();
        editor.setChoosingLayout(true);
        expect(editor.isChoosingLayout()).toBe(false);
    });

    /**
     * With several keyboards plugged in, each is a choice — those with the same USB ID numbered — and choosing one asks
     * the connection to open it. One keyboard alone is no choice.
     */
    it("several keyboards are choices", async () => {
        const { editor, connection } = await fixture();
        const attached = (id: string, usb: UsbIdentity, location: string): AttachedKeyboard => ({ id, usb, location });
        const first = attached("a", UsbIdentity.of(0x1189, 0x8840), "1-1");
        const second = attached("b", UsbIdentity.of(0x1189, 0x8840), "1-2");
        const third = attached("c", UsbIdentity.of(0x514c, 0x8850), "1-3");
        connection.attached.send({ keyboards: [first], selected: "a" });
        await settle();
        expect(editor.keyboardChoices()).toEqual([]);
        connection.attached.send({ keyboards: [first, second, third], selected: "b" });
        await settle();
        expect(editor.keyboardChoices()).toEqual([
            { id: "a", title: "1189:8840 (1)", isSelected: false },
            { id: "b", title: "1189:8840 (2)", isSelected: true },
            { id: "c", title: "514C:8850", isSelected: false },
        ]);
        editor.selectKeyboard("c");
        expect(connection.selected).toEqual(["c"]);
    });

    /** A keyboard that doesn't answer picks one of the app's layouts; rotating turns the drawing. */
    it("the layout sheet", async () => {
        const { editor, plug } = await fixture();
        await plug(k8840());
        const mode = editor.layoutSheet()?.mode;
        if (mode?.kind !== "catalog") throw new Error("no catalog");
        expect(mode.choices.length).toBe(26);
        expect(mode.selectedId).toBe("15add3");
        editor.chooseLayout("9add2", 1);
        expect(editor.layoutSheet()?.quarterTurns).toBe(1);
        const upright = editor.previewDrawing("9add2", 0);
        const turned = editor.previewDrawing("9add2", 1);
        expect(Math.abs((upright?.bounds.width ?? 0) - (turned?.bounds.height ?? 1))).toBeLessThan(0.001);
        editor.rotate();
        expect(editor.layoutSheet()?.quarterTurns).toBe(2);
    });

    it("listeners hear every change", async () => {
        const { editor, plug } = await fixture();
        let heard = 0;
        const unsubscribe = editor.subscribe(() => (heard += 1));
        await plug(k8840());
        expect(heard).toBeGreaterThan(0);
        const before = heard;
        editor.setTab("media");
        expect(heard).toBe(before + 1);
        unsubscribe();
        editor.setTab("keys");
        expect(heard).toBe(before + 1);
    });

    it("a notice goes only when it is still shown", async () => {
        const { editor, plug } = await fixture();
        await plug(k8840());
        editor.press(key(A));
        const first = editor.noticeSerial();
        editor.select(ControlRef.knob(1, "press"));
        // A keyboard that doesn't answer keeps no waits.
        editor.setKeyDelay(100);
        expect(editor.notice()).toEqual({ kind: "unsupported" });
        editor.expireNotice(first);
        expect(editor.notice()).toEqual({ kind: "unsupported" });
        editor.expireNotice(editor.noticeSerial());
        expect(editor.notice()).toBeNull();
    });
});

describe("checking what the keyboard holds", () => {
    /** A read that leaves some controls unread says so — the read made on connecting too, which says nothing else. */
    it("a read that leaves controls unread", async () => {
        const { editor, device, plug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 10);
        device.actions = new Map([[controlKey(ControlId.key(2)), KeyAction.media(MediaKey.MUTE)]]);
        device.unread = [ControlId.key(2)];
        await plug(k8840());
        expect(editor.notice()).toEqual({ kind: "readIncomplete" });
        expect(Notice.isError({ kind: "readIncomplete" })).toBe(true);
        expect(control(editor.drawing(), KEY2).caption).toEqual({ kind: "unknown" });

        device.unread = [];
        await editor.read();
        expect(editor.notice()).toEqual({ kind: "readComplete" });
        device.failRead = KeyboardDeviceError.noReply();
        await editor.read();
        expect(editor.notice()).toEqual({ kind: "readFailed" });
    });

    /** A save says how it read back; what read back otherwise stays not saved, with the user's presses. */
    it("a save says how it read back", async () => {
        const { editor, device, plug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        await editor.save();
        expect(editor.notice()).toEqual({ kind: "saved", simulated: false });
        expect(editor.hasUnsavedChanges()).toBe(false);

        device.keeps = () => KeyAction.media(MediaKey.MUTE);
        editor.press(key(C));
        await editor.save();
        expect(editor.notice()).toEqual({ kind: "savedButDiffers" });
        expect(editor.hasUnsavedChanges()).toBe(true);
        expect(control(editor.drawing(), KEY1)).toMatchObject({
            isChanged: true,
            caption: { kind: "presses", text: "A C" },
        });

        device.keeps = (action) => action;
        device.failRead = KeyboardDeviceError.noReply();
        await editor.save();
        expect(editor.notice()).toEqual({ kind: "savedButNotChecked" });
        expect(editor.hasUnsavedChanges()).toBe(false);
        const warnings: Notice[] = [{ kind: "savedButDiffers" }, { kind: "savedButNotChecked" }];
        expect(warnings.every(Notice.isError)).toBe(true);
    });

    /** Reading back is part of the save: still saving meanwhile, and dropped when the keyboard goes. */
    it("the read back is part of the save", async () => {
        const { editor, device, plug, unplug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        const read = hold();
        device.readHeld = read.promise;
        const reads = device.reads;
        const saving = editor.save();
        await settle();
        expect(device.writes.length).toBe(1);
        expect(device.reads).toBe(reads + 1);
        expect(editor.activity()).toBe("saving");
        await unplug();

        read.release();
        await saving;
        expect(editor.notice()).toEqual({ kind: "keyboardGone" });
        expect(editor.hasUnsavedChanges()).toBe(true);
        expect(editor.activity()).toBeNull();
    });

    /** A type the rules weren't tried with is pointed out once, after connecting, and marked in the information. */
    it("a firmware type not tried yet", async () => {
        const { editor, device, plug, unplug } = await fixture();
        device.identity = KeyboardIdentity.of(12, 2, 11);
        await plug(k8840());
        expect(editor.notice()).toBeNull();
        expect(editor.keyboardInfo()?.firmware).toMatchObject({ type: 11, isTested: true });
        await unplug();

        device.identity = KeyboardIdentity.of(12, 2, 12);
        await plug(k8840());
        const notice = editor.notice();
        expect(notice).toEqual({ kind: "untestedFirmware", type: 12 });
        expect(notice && Notice.lifetime(notice)).toBe(10000);
        expect(Notice.lifetime({ kind: "readFailed" })).toBeLessThan(10000);
        expect(editor.keyboardInfo()?.firmware).toEqual({
            kind: "reported",
            type: 12,
            keys: 12,
            knobs: 2,
            isTested: false,
        });
        await editor.read();
        expect(editor.notice()).toEqual({ kind: "readComplete" });
    });

    /** A legacy keyboard is read on connecting too; the untried type's notice takes the place of that read's. */
    it("a legacy keyboard is read on connecting", async () => {
        const { editor, device, plug, unplug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 0);
        device.actions = new Map([[controlKey(ControlId.key(2)), KeyAction.media(MediaKey.MUTE)]]);
        await plug(k8840());
        expect(device.reads).toBe(3);
        expect(editor.keyboardInfo()?.commands).toBe("legacy");
        expect(editor.notice()).toBeNull();
        expect(control(editor.drawing(), KEY2).caption).toEqual({ kind: "media", choice: "mute" });
        await unplug();

        device.identity = KeyboardIdentity.of(6, 1, 2);
        device.unread = [ControlId.key(1)];
        await plug(k8840());
        expect(device.reads).toBe(6);
        expect(editor.notice()).toEqual({ kind: "untestedFirmware", type: 2 });
    });
});

describe("the editor in a browser", () => {
    it("a browser that can't reach keyboards says so", async () => {
        const { editor, connection } = await fixture();
        connection.states.send({ kind: "unsupported" });
        await settle();
        expect(editor.status()).toEqual({ kind: "unsupported" });
        expect(editor.isReady()).toBe(false);
    });

    it("access is asked for where the connection needs it", async () => {
        const asking = await fixture();
        expect(asking.editor.canRequestAccess()).toBe(true);
        await asking.editor.requestAccess();
        expect(asking.connection.requests).toBe(1);

        const plain = await fixture({ withoutAccess: true });
        expect(plain.editor.canRequestAccess()).toBe(false);
        await expect(plain.editor.requestAccess()).resolves.toBeUndefined();
        expect(plain.connection.requests).toBe(0);
    });

    /** A state that comes while a keyboard is being identified waits its turn. */
    it("connection states are handled one at a time, in order", async () => {
        const { editor, connection, device } = await fixture();
        let answer = () => {};
        device.answer = new Promise((resolve) => (answer = resolve));
        connection.states.send({ kind: "connected", keyboard: k8840() });
        await settle();
        expect(editor.activity()).toBe("identifying");
        connection.states.send({ kind: "searching" });
        await settle();
        expect(editor.status()).toMatchObject({ kind: "connected", isIdentified: false });

        answer();
        await settle();
        expect(editor.status()).toEqual({ kind: "searching" });
        expect(editor.activity()).toBeNull();
        expect(device.asked).toBe(1);
        // The keyboard that went is still drawn.
        expect(editor.drawing()).not.toBeNull();
    });

    it("stopping stops following", async () => {
        const { editor, connection, stop } = await fixture();
        stop();
        expect(connection.states.listening()).toBe(0);
        expect(connection.attached.listening()).toBe(0);
        connection.states.send({ kind: "connected", keyboard: k8840() });
        await settle();
        expect(editor.status()).toEqual({ kind: "searching" });
    });

    it("retrying asks the connection to look again", async () => {
        const { editor, connection } = await fixture();
        editor.retryConnection();
        expect(connection.retries).toBe(1);
    });
});

describe("the simulator", () => {
    it("is there only when it is wired in", async () => {
        const { editor } = await fixture();
        expect(editor.canSelectSource()).toBe(false);
        expect(editor.simulatorChoices()).toEqual([]);
        editor.selectSimulator("1189:8840-6-1-10");
        expect(editor.activeSimulatorId()).toBeNull();
    });

    /** Every keyboard it plays is a choice; switching tells the source, and a save says it went to no real keyboard. */
    it("plays the keyboards", async () => {
        const source = new FakeSource();
        const { editor, device, plug } = await fixture({ source });
        expect(editor.canSelectSource()).toBe(true);
        const choices = editor.simulatorChoices();
        expect(choices.length).toBe(SimulatedModel.all().length);
        expect(new Set(choices.map((choice) => choice.group))).toEqual(new Set(["standard", "legacy", "unidentified"]));
        expect(choices.filter(SimulatorChoice.isForEveryone).map((choice) => choice.group)).not.toContain("legacy");
        expect(choices.find((choice) => choice.group === "unidentified")).toEqual({
            id: "1189:8840-unidentified",
            group: "unidentified",
            kind: { kind: "unidentified", usb: "1189:8840" },
        });
        const sixAndOne = choices.find((choice) => choice.id === "1189:8840-6-1-10");
        expect(sixAndOne).toEqual({
            id: "1189:8840-6-1-10",
            group: "standard",
            kind: { kind: "identified", keys: 6, knobs: 1, type: 10, usb: "1189:8840" },
        });

        expect(editor.activeSimulatorId()).toBeNull();
        editor.selectSimulator("1189:8840-6-1-10");
        expect(source.selected.map((selected) => selected.kind)).toEqual(["simulated"]);
        expect(editor.activeSimulatorId()).toBe("1189:8840-6-1-10");
        editor.selectSimulator("1189:8840-6-1-10");
        editor.selectSimulator("no such keyboard");
        expect(source.selected.length).toBe(1);

        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        expect(editor.status()).toMatchObject({ kind: "connected", isSimulated: true });
        editor.select(KEY1);
        editor.press(key(A));
        await editor.save();
        expect(editor.notice()).toEqual({ kind: "saved", simulated: true });

        editor.selectSimulator(null);
        expect(editor.activeSimulatorId()).toBeNull();
        expect(source.selected.map((selected) => selected.kind)).toEqual(["simulated", "hardware"]);
    });

    it("starts with the source in use", async () => {
        const source = new FakeSource();
        const model = SimulatedModel.all()[0];
        if (model === undefined) throw new Error("no simulated keyboards");
        source.source = { kind: "simulated", model };
        const { editor } = await fixture({ source });
        expect(editor.activeSimulatorId()).toBe(SimulatedModel.id(model));
    });
});
