import { describe, expect, it } from "vitest";
import {
    ControlId,
    KeyAction,
    KeyboardDeviceError,
    KeyboardIdentity,
    MediaKey,
    UsbIdentity,
    controlKey,
    type AttachedKeyboard,
} from "$domain";
import { ControlRef } from "$presentation";
import { A, FakeSource, control, fixture, hold, k8840, key, settle } from "./fakes";

const KEY1 = ControlRef.key(1);
const KEY2 = ControlRef.key(2);
const SIX_AND_ONE = "1189:8840-6-1-10";

/** Two keyboards of the same USB ID, the first open. */
const TWO = {
    keyboards: [
        { id: "a", usb: UsbIdentity.of(0x1189, 0x8840), location: "1-1" },
        { id: "b", usb: UsbIdentity.of(0x1189, 0x8840), location: "1-2" },
    ] as AttachedKeyboard[],
    selected: "a",
};

describe("a keyboard that changes during work", () => {
    /** Another keyboard of the same USB ID opens while the first is read: what was read is the first's and the second's. */
    it("a read whose keyboard changed is dropped, and the new keyboard identified after it", async () => {
        const { editor, connection, device, plug } = await fixture();
        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        editor.select(KEY2);
        editor.press(key(A));
        expect(editor.hasUnsavedChanges()).toBe(true);

        device.actions = new Map([[controlKey(ControlId.key(2)), KeyAction.media(MediaKey.MUTE)]]);
        const read = hold();
        device.readHeld = read.promise;
        const reading = editor.read();
        await settle();
        expect(editor.activity()).toBe("reading");
        connection.states.send({ kind: "searching" });
        connection.states.send({ kind: "connected", keyboard: k8840() });
        await settle();
        expect(editor.status()).toMatchObject({ kind: "connected", isIdentified: false });
        expect(editor.activity()).toBe("reading");

        const answer = hold();
        device.answer = answer.promise;
        const asked = device.asked;
        read.release();
        await settle();
        expect(editor.notice()).toEqual({ kind: "keyboardGone" });
        expect(editor.activity()).toBe("identifying");
        expect(device.asked).toBe(asked + 1);
        // Taken in, the read would have replaced the key's change.
        expect(editor.hasUnsavedChanges()).toBe(true);

        answer.release();
        await reading;
        expect(editor.activity()).toBeNull();
        expect(editor.isReady()).toBe(true);
        expect(control(editor.drawing(), KEY2).caption).toEqual({ kind: "media", choice: "mute" });
    });

    it("a save whose keyboard went says so, and leaves the changes not saved", async () => {
        const { editor, device, plug, unplug } = await fixture();
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        const write = hold();
        device.writeHeld = write.promise;
        const saving = editor.save();
        await settle();
        expect(editor.activity()).toBe("saving");
        await unplug();

        write.release();
        await saving;
        expect(editor.notice()).toEqual({ kind: "keyboardGone" });
        expect(editor.hasUnsavedChanges()).toBe(true);
        expect(editor.activity()).toBeNull();
    });

    /** Two keyboards of the same USB ID look the same; the one that answered is still not the one open now. */
    it("an identification whose keyboard changed is dropped, and the new keyboard asked", async () => {
        const { editor, connection, device } = await fixture();
        device.failIdentity = KeyboardDeviceError.noReply();
        connection.states.send({ kind: "connected", keyboard: k8840() });
        await settle();
        expect(editor.notice()).toEqual({ kind: "identifyFailed" });

        // Asked again, as Retry does; another keyboard opens meanwhile.
        device.failIdentity = null;
        device.identity = KeyboardIdentity.of(6, 1, 10);
        const answer = hold();
        device.answer = answer.promise;
        const identifying = editor.identify();
        connection.states.send({ kind: "searching" });
        connection.states.send({ kind: "connected", keyboard: k8840() });
        await settle();
        expect(device.asked).toBe(2);

        answer.release();
        await identifying;
        expect(editor.notice()).toEqual({ kind: "keyboardGone" });
        expect(device.asked).toBe(3);
        expect(editor.isReady()).toBe(true);
    });

    it("selecting a keyboard or a simulator is ignored while reading", async () => {
        const source = new FakeSource();
        const { editor, connection, device, plug } = await fixture({ source });
        connection.attached.send(TWO);
        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        const read = hold();
        device.readHeld = read.promise;
        const reading = editor.read();
        await settle();
        expect(editor.canSwitchKeyboard()).toBe(false);
        editor.selectKeyboard("b");
        editor.selectSimulator(SIX_AND_ONE);
        expect(connection.selected).toEqual([]);
        expect(source.selected).toEqual([]);
        expect(editor.activeSimulatorId()).toBeNull();
        expect(editor.pendingSwitch()).toBeNull();

        read.release();
        await reading;
        editor.selectKeyboard("b");
        expect(connection.selected).toEqual(["b"]);
    });

    it("a keyboard can be switched only while nothing is under way", async () => {
        const { editor, connection, device } = await fixture();
        expect(editor.canSwitchKeyboard()).toBe(true);
        const answer = hold();
        device.answer = answer.promise;
        connection.states.send({ kind: "connected", keyboard: k8840() });
        await settle();
        expect(editor.activity()).toBe("identifying");
        expect(editor.canSwitchKeyboard()).toBe(false);
        answer.release();
        await settle();
        expect(editor.canSwitchKeyboard()).toBe(true);

        editor.select(KEY1);
        editor.press(key(A));
        const write = hold();
        device.writeHeld = write.promise;
        const saving = editor.save();
        expect(editor.activity()).toBe("saving");
        expect(editor.canSwitchKeyboard()).toBe(false);
        write.release();
        await saving;
        expect(editor.canSwitchKeyboard()).toBe(true);
    });
});

describe("switching with changes not saved", () => {
    it("switching keyboards asks first", async () => {
        const { editor, connection, plug } = await fixture();
        connection.attached.send(TWO);
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        // The one open is no switch.
        editor.selectKeyboard("a");
        expect(editor.pendingSwitch()).toBeNull();

        editor.selectKeyboard("b");
        expect(editor.pendingSwitch()).toEqual({ kind: "keyboard", id: "b" });
        expect(connection.selected).toEqual([]);
        editor.cancelSwitch();
        expect(editor.pendingSwitch()).toBeNull();
        expect(connection.selected).toEqual([]);
        expect(editor.status()).toMatchObject({ kind: "connected" });
        expect(editor.hasUnsavedChanges()).toBe(true);

        editor.selectKeyboard("b");
        editor.confirmSwitch();
        expect(editor.pendingSwitch()).toBeNull();
        expect(connection.selected).toEqual(["b"]);
    });

    it("switching to a simulated keyboard asks first", async () => {
        const source = new FakeSource();
        const { editor, plug } = await fixture({ source });
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        // The keyboard on USB is the one in use already.
        editor.selectSimulator(null);
        expect(editor.pendingSwitch()).toBeNull();

        editor.selectSimulator(SIX_AND_ONE);
        expect(editor.pendingSwitch()).toEqual({ kind: "simulator", id: SIX_AND_ONE });
        expect(source.selected).toEqual([]);
        editor.cancelSwitch();
        expect(editor.activeSimulatorId()).toBeNull();
        expect(editor.hasUnsavedChanges()).toBe(true);

        editor.selectSimulator(SIX_AND_ONE);
        editor.confirmSwitch();
        expect(source.selected.map((selected) => selected.kind)).toEqual(["simulated"]);
        expect(editor.activeSimulatorId()).toBe(SIX_AND_ONE);
    });

    it("without changes not saved there is no question", async () => {
        const source = new FakeSource();
        const { editor, connection, plug } = await fixture({ source });
        connection.attached.send(TWO);
        await plug(k8840());
        editor.selectKeyboard("b");
        expect(editor.pendingSwitch()).toBeNull();
        expect(connection.selected).toEqual(["b"]);
        editor.selectSimulator(SIX_AND_ONE);
        expect(editor.pendingSwitch()).toBeNull();
        expect(editor.activeSimulatorId()).toBe(SIX_AND_ONE);
    });

    /** The changes of a keyboard that went, or that failed to open, can be saved nowhere: nothing to ask about. */
    it("with no keyboard open, its changes are not asked about", async () => {
        const source = new FakeSource();
        const { editor, connection, plug, unplug } = await fixture({ source });
        connection.attached.send(TWO);
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        await unplug();
        expect(editor.hasUnsavedChanges()).toBe(true);
        editor.selectKeyboard("b");
        expect(editor.pendingSwitch()).toBeNull();
        expect(connection.selected).toEqual(["b"]);

        connection.states.send({ kind: "openFailed", code: 0 });
        await settle();
        editor.selectSimulator(SIX_AND_ONE);
        expect(editor.pendingSwitch()).toBeNull();
        expect(editor.activeSimulatorId()).toBe(SIX_AND_ONE);
    });

    it("the question goes when the keyboard does", async () => {
        const { editor, connection, plug, unplug } = await fixture();
        connection.attached.send(TWO);
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        editor.selectKeyboard("b");
        expect(editor.pendingSwitch()).not.toBeNull();
        await unplug();
        expect(editor.pendingSwitch()).toBeNull();
        editor.confirmSwitch();
        expect(connection.selected).toEqual([]);
    });
});

describe("a keyboard granted from the browser's chooser", () => {
    /** Another keyboard is open: the one granted is a switch like any other. */
    it("with changes not saved, asks first", async () => {
        const { editor, connection, plug } = await fixture();
        connection.attached.send(TWO);
        await plug(k8840());
        editor.select(KEY1);
        editor.press(key(A));
        connection.granted = "b";
        await editor.requestAccess();
        expect(editor.pendingSwitch()).toEqual({ kind: "keyboard", id: "b" });
        expect(connection.selected).toEqual([]);
        editor.confirmSwitch();
        expect(connection.selected).toEqual(["b"]);
    });

    it("with none open, opens", async () => {
        const { editor, connection } = await fixture();
        connection.attached.send({ keyboards: TWO.keyboards.slice(1), selected: null });
        connection.granted = "b";
        await editor.requestAccess();
        expect(connection.requests).toBe(1);
        expect(editor.pendingSwitch()).toBeNull();
        expect(connection.selected).toEqual(["b"]);
    });

    it("while the keyboard is busy, doesn't switch", async () => {
        const { editor, connection, device, plug } = await fixture();
        connection.attached.send(TWO);
        device.identity = KeyboardIdentity.of(6, 1, 10);
        await plug(k8840());
        const read = hold();
        device.readHeld = read.promise;
        const reading = editor.read();
        await settle();
        connection.granted = "b";
        await editor.requestAccess();
        expect(connection.selected).toEqual([]);
        expect(editor.pendingSwitch()).toBeNull();
        read.release();
        await reading;
        expect(connection.selected).toEqual([]);
    });

    it("none granted, nothing changes", async () => {
        const { editor, connection, plug } = await fixture();
        connection.attached.send(TWO);
        await plug(k8840());
        await editor.requestAccess();
        expect(connection.requests).toBe(1);
        expect(connection.selected).toEqual([]);
        expect(editor.pendingSwitch()).toBeNull();
    });
});
