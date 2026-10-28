// The WebHID connection's decisions, against a fake `navigator.hid`: which devices are keyboards, which one opens, how
// its reports go out and its answers come in, and what happens as keyboards come and go.

import { describe, expect, it } from "vitest";
import {
    DeviceLogStore,
    KeyboardDevice,
    WebHidConnection,
    type HidConnectionEvent,
    type HidDevice,
    type HidInputReport,
    type HidSystem,
    type KeyValueStorage,
} from "$data";
import {
    KeyboardDeviceError,
    KeyboardIdentity,
    UsbIdentity,
    type AttachedKeyboards,
    type ConnectionState,
    type DeviceLogEvent,
    type KeyboardDeviceErrorReason,
} from "$domain";

/** Interface 0 of a 884x keyboard: its typing, and the vendor collection that takes report 3. */
const CONFIGURATION: HIDCollectionInfo[] = [
    { usagePage: 0x01, usage: 0x06, inputReports: [{ reportId: 1 }], outputReports: [{ reportId: 1 }] },
    { usagePage: 0xff60, usage: 0x61, inputReports: [{ reportId: 3 }], outputReports: [{ reportId: 3 }] },
];

/** Another interface of the same keyboard: media keys, nothing to write. */
const MEDIA: HIDCollectionInfo[] = [{ usagePage: 0x0c, usage: 0x01, inputReports: [{ reportId: 2 }] }];

class FakeDevice implements HidDevice {
    readonly vendorId: number;
    readonly productId: number;
    readonly productName: string;
    readonly collections: HIDCollectionInfo[];
    opened = false;
    /** The `DOMException` name `open()` fails with; `null` opens. */
    openError: string | null = null;
    sendFails = false;
    opens = 0;
    closes = 0;
    readonly sent: (readonly [number, number[]])[] = [];
    /** What the keyboard answers a payload with, if anything. */
    answers: (payload: number[]) => number[] | null = () => null;
    private readonly listeners = new Set<(report: HidInputReport) => void>();

    constructor(usb: UsbIdentity, collections: HIDCollectionInfo[] = CONFIGURATION, productName = "") {
        this.vendorId = usb.vendorId;
        this.productId = usb.productId;
        this.collections = collections;
        this.productName = productName;
    }

    get listening(): number {
        return this.listeners.size;
    }

    async open(): Promise<void> {
        this.opens += 1;
        if (this.openError !== null) throw new DOMException("Failed to open the device.", this.openError);
        this.opened = true;
    }

    async close(): Promise<void> {
        this.closes += 1;
        this.opened = false;
    }

    async sendReport(reportId: number, data: Uint8Array<ArrayBuffer>): Promise<void> {
        if (this.sendFails) throw new DOMException("Failed to write the report.", "NotAllowedError");
        const payload = [...data];
        this.sent.push([reportId, payload]);
        const answer = this.answers(payload);
        if (answer !== null) this.report(reportId, answer);
    }

    addEventListener(_type: "inputreport", listener: (report: HidInputReport) => void): void {
        this.listeners.add(listener);
    }

    removeEventListener(_type: "inputreport", listener: (report: HidInputReport) => void): void {
        this.listeners.delete(listener);
    }

    /** An input report, the bytes after its ID. */
    report(reportId: number, bytes: number[]): void {
        const data = new DataView(Uint8Array.from(bytes).buffer);
        for (const listener of [...this.listeners]) listener({ reportId, data });
    }
}

class FakeHid implements HidSystem {
    isAvailable = true;
    readonly plugged: FakeDevice[] = [];
    readonly granted = new Set<HidDevice>();
    /** What the chooser grants, or the error it fails with. */
    chooser: FakeDevice[] | DOMException = [];
    requests: HIDDeviceRequestOptions[] = [];
    getDevicesFails = false;
    lookups = 0;
    private readonly listeners = { connect: new Set<Listener>(), disconnect: new Set<Listener>() };

    async getDevices(): Promise<HidDevice[]> {
        this.lookups += 1;
        if (this.getDevicesFails) throw new DOMException('Access to the feature "hid" is disallowed.', "SecurityError");
        return this.plugged.filter((device) => this.granted.has(device));
    }

    async requestDevice(options: HIDDeviceRequestOptions): Promise<HidDevice[]> {
        this.requests.push(options);
        if (this.chooser instanceof DOMException) throw this.chooser;
        for (const device of this.chooser) this.granted.add(device);
        return this.chooser;
    }

    addEventListener(type: "connect" | "disconnect", listener: Listener): void {
        this.listeners[type].add(listener);
    }

    removeEventListener(type: "connect" | "disconnect", listener: Listener): void {
        this.listeners[type].delete(listener);
    }

    get listening(): number {
        return this.listeners.connect.size + this.listeners.disconnect.size;
    }

    /** Granted devices, plugged in before the page looks. */
    have(...devices: FakeDevice[]): void {
        for (const device of devices) {
            this.granted.add(device);
            this.plugged.push(device);
        }
    }

    plug(...devices: FakeDevice[]): void {
        for (const device of devices) {
            this.plugged.push(device);
            if (this.granted.has(device)) this.fire("connect", device);
        }
    }

    unplug(...devices: FakeDevice[]): void {
        for (const device of devices) {
            this.plugged.splice(this.plugged.indexOf(device), 1);
            device.opened = false;
            if (this.granted.has(device)) this.fire("disconnect", device);
        }
    }

    private fire(type: "connect" | "disconnect", device: HidDevice): void {
        for (const listener of [...this.listeners[type]]) listener({ device });
    }
}

type Listener = (event: HidConnectionEvent) => void;

class MemoryStorage implements KeyValueStorage {
    readonly items = new Map<string, string>();

    getItem(key: string): string | null {
        return this.items.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
        this.items.set(key, value);
    }
}

const K8840 = UsbIdentity.of(0x1189, 0x8840);
const K8850 = UsbIdentity.of(0x514c, 0x8850);
const K8842 = UsbIdentity.of(0x1189, 0x8842);

function watch(hid: FakeHid, storage: KeyValueStorage | null = null) {
    const log = new DeviceLogStore();
    const connection = WebHidConnection.start(log, hid, storage);
    let state: ConnectionState = { kind: "searching" };
    let attached: AttachedKeyboards = { keyboards: [], selected: null };
    connection.connectionStates().subscribe((value) => (state = value));
    connection.attachedKeyboards().subscribe((value) => (attached = value));
    const events = () =>
        log
            .snapshot()
            .flatMap((entry): DeviceLogEvent[] => (entry.content.kind === "event" ? [entry.content.event] : []));
    return { connection, log, state: () => state, attached: () => attached, events };
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

describe("WebHID connection", () => {
    /** No WebHID, or not a secure context: nothing is looked for, and the log stays empty. */
    it("a browser that can't reach HID devices", async () => {
        const hid = new FakeHid();
        hid.isAvailable = false;
        hid.have(new FakeDevice(K8840));
        const { connection, state, events } = watch(hid);
        await connection.requestAccess();
        connection.retry();
        await connection.settled();
        expect(state()).toEqual({ kind: "unsupported" });
        expect(hid.lookups).toBe(0);
        expect(hid.requests).toEqual([]);
        expect(hid.listening).toBe(0);
        expect(events()).toEqual([]);
    });

    /** A frame the page doesn't allow WebHID in can't list devices either. */
    it("a page not allowed WebHID", async () => {
        const hid = new FakeHid();
        hid.getDevicesFails = true;
        const { connection, state } = watch(hid);
        await connection.settled();
        expect(state()).toEqual({ kind: "unsupported" });
    });

    /**
     * Of a keyboard's devices, the one with output report 3 is opened — not its other interfaces, nor a device of
     * another USB ID that also takes report 3.
     */
    it("connects to the configuration interface", async () => {
        const hid = new FakeHid();
        const media = new FakeDevice(K8850, MEDIA);
        const configuration = new FakeDevice(K8850, CONFIGURATION, "MINI KeyBoard");
        const other = new FakeDevice(UsbIdentity.of(0x046d, 0xc52b));
        hid.have(media, other, configuration);
        const { connection, state, attached, events } = watch(hid);
        await connection.settled();

        expect(state()).toEqual({
            kind: "connected",
            keyboard: {
                usb: K8850,
                interfaceNumber: 0,
                channel: "hid",
                reportId: 3,
                reportLength: 65,
                details: {
                    usbVersion: null,
                    deviceRelease: null,
                    speed: null,
                    manufacturer: null,
                    productName: "MINI KeyBoard",
                    serialNumber: null,
                    maxPower: null,
                    interfaces: [
                        {
                            number: 0,
                            class: 3,
                            subclass: null,
                            protocol: null,
                            usages: [
                                { page: 0x01, usage: 0x06 },
                                { page: 0xff60, usage: 0x61 },
                            ],
                        },
                    ],
                },
            },
        });
        expect([media.opens, other.opens, configuration.opens]).toEqual([0, 0, 1]);
        expect(attached().keyboards).toEqual([{ id: "hid-1", usb: K8850, location: "" }]);
        expect(attached().selected).toBe("hid-1");
        expect(events()).toEqual([{ kind: "connected", usb: K8850, interface: 0 }]);
        expect(connection.openChannel()).not.toBeNull();

        // Another device of the page comes: the open one stays open.
        hid.plug(new FakeDevice(K8842, MEDIA));
        await connection.settled();
        expect(configuration.opens).toBe(1);
    });

    /** Output report 3 in a collection's children counts; an empty product name is none. */
    it("a nested configuration collection", async () => {
        const hid = new FakeHid();
        const nested = new FakeDevice(K8840, [
            { usagePage: 0xff00, usage: 0x01, children: [{ usagePage: 0xff00, outputReports: [{ reportId: 3 }] }] },
        ]);
        hid.have(nested);
        const { connection, state } = watch(hid);
        await connection.settled();
        expect(state().kind).toBe("connected");
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { details: { productName: null } } });
    });

    /**
     * Requests go out as report 3 with 64 bytes; answers are input reports with ID 3 of at least 32 bytes — the
     * keyboard's typing, shorter, and other reports are passed over. Every write and answer is in the log.
     */
    it("writes and reads through the open device", async () => {
        const hid = new FakeHid();
        const keyboard = new FakeDevice(K8840);
        keyboard.answers = (payload) => {
            if (payload[0] !== 0xfb) return null;
            keyboard.report(1, [0, 0, 0x04, 0, 0, 0, 0, 0]);
            keyboard.report(3, [0, 0, 0x04, 0, 0, 0, 0, 0]);
            keyboard.report(2, new Array<number>(64).fill(0xee));
            return [0xfb, 6, 1, 10, ...new Array<number>(60).fill(0)];
        };
        hid.have(keyboard);
        const { connection, log } = watch(hid);
        await connection.settled();
        const device = new KeyboardDevice(connection, log, { identifyTimeout: 50, replyTimeout: 50 });

        expect(await device.askIdentity()).toEqual(KeyboardIdentity.of(6, 1, 10));
        expect(keyboard.sent).toEqual([[3, [0xfb, 0xfb, 0xfb, ...new Array<number>(61).fill(0)]]]);
        const reports = log.snapshot().flatMap((entry) => (entry.content.kind === "event" ? [] : [entry.content]));
        expect(reports.map((report) => [report.kind, report.bytes.length, report.bytes[0]])).toEqual([
            ["output", 65, 3],
            ["input", 65, 3],
        ]);

        // No answer in time.
        keyboard.answers = () => null;
        expect(await failure(device.readLighting(0))).toEqual({ kind: "noReply" });

        keyboard.sendFails = true;
        expect(await failure(device.askIdentity())).toEqual({ kind: "writeFailed", code: 0 });
        expect(log.snapshot().at(-1)?.content).toEqual({ kind: "event", event: { kind: "writeFailed", code: 0 } });
    });

    /** An answer that comes before anyone asks waits for the next read, unless a new request drops it. */
    it("answers wait in order", async () => {
        const hid = new FakeHid();
        const keyboard = new FakeDevice(K8840);
        hid.have(keyboard);
        const { connection } = watch(hid);
        await connection.settled();
        const channel = connection.openChannel();
        if (channel === null) throw new Error("no channel");
        const answer = (first: number) => [first, ...new Array<number>(63).fill(0)];
        keyboard.report(3, answer(1));
        keyboard.report(3, answer(2));
        expect((await channel.nextReply(10))?.[1]).toBe(1);
        channel.discardPendingReplies();
        expect(await channel.nextReply(10)).toBeNull();
        const waiting = channel.nextReply(1000);
        keyboard.report(3, answer(3));
        expect((await waiting)?.[1]).toBe(3);
    });

    /** Unplugged, the open keyboard is let go — whoever waits for its answer gets none — and the state is searching. */
    it("an unplugged keyboard is let go", async () => {
        const hid = new FakeHid();
        const keyboard = new FakeDevice(K8840);
        hid.have(keyboard);
        const { connection, state, attached, events } = watch(hid);
        await connection.settled();
        expect(keyboard.listening).toBe(1);
        const channel = connection.openChannel();
        const waiting = channel?.nextReply(5000);

        hid.unplug(keyboard);
        await connection.settled();
        expect(await waiting).toBeNull();
        expect(state()).toEqual({ kind: "searching" });
        expect(attached()).toEqual({ keyboards: [], selected: null });
        expect(connection.openChannel()).toBeNull();
        expect(keyboard.listening).toBe(0);
        expect(await failure(channel?.write(new Uint8Array(65)) ?? Promise.resolve())).toEqual({
            kind: "notConnected",
        });
        expect(events().map((event) => event.kind)).toEqual(["connected", "searching"]);

        // Plugged in again — a new device to WebHID — it opens again.
        const again = new FakeDevice(K8840);
        hid.granted.add(again);
        hid.plug(again);
        await connection.settled();
        expect(state().kind).toBe("connected");
        expect(attached().keyboards.map((keyboard) => keyboard.id)).toEqual(["hid-2"]);
    });

    /**
     * With several plugged in, one is open — the first, in the order the app looks for USB IDs, then the browser's —
     * and choosing another opens it and keeps it for next time. Unplugged, the first opens again; plugged in again, the
     * app stays where it is.
     */
    it("one of several keyboards is open", async () => {
        const hid = new FakeHid();
        const storage = new MemoryStorage();
        const k8850 = new FakeDevice(K8850);
        const first = new FakeDevice(K8840);
        const second = new FakeDevice(K8840);
        hid.have(k8850, first, second);
        const { connection, state, attached } = watch(hid, storage);
        await connection.settled();
        expect(attached()).toEqual({
            keyboards: [
                { id: "hid-1", usb: K8840, location: "" },
                { id: "hid-2", usb: K8840, location: "" },
                { id: "hid-3", usb: K8850, location: "" },
            ],
            selected: "hid-1",
        });
        expect([first.opens, second.opens, k8850.opens]).toEqual([1, 0, 0]);

        connection.selectKeyboard("hid-3");
        await connection.settled();
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8850 } });
        expect(attached().selected).toBe("hid-3");
        expect(storage.getItem("minikeyboard.selectedKeyboard")).toBe("514C:8850");
        expect(first.closes).toBe(1);
        expect(k8850.opens).toBe(1);

        // The same again opens nothing; one that isn't there does nothing.
        connection.selectKeyboard("hid-3");
        connection.selectKeyboard("hid-9");
        await connection.settled();
        expect(k8850.opens).toBe(1);
        expect(attached().selected).toBe("hid-3");

        hid.unplug(k8850);
        await connection.settled();
        expect(attached().selected).toBe("hid-1");
        expect(first.opens).toBe(2);
        hid.plug(k8850);
        await connection.settled();
        expect(attached().selected).toBe("hid-1");
        expect(k8850.opens).toBe(1);

        // Next time, the one chosen last opens first.
        const next = watch(hid, storage);
        await next.connection.settled();
        expect(next.state().kind === "connected" && next.state()).toMatchObject({ keyboard: { usb: K8850 } });
    });

    /** Of two with the USB ID chosen last time, the first opens: WebHID tells them apart by nothing else. */
    it("the one chosen last time, by USB ID", async () => {
        const hid = new FakeHid();
        const storage = new MemoryStorage();
        storage.setItem("minikeyboard.selectedKeyboard", "1189:8840\n");
        const k8850 = new FakeDevice(K8850);
        const first = new FakeDevice(K8840);
        const second = new FakeDevice(K8840);
        hid.have(k8850, first, second);
        const { connection } = watch(hid, storage);
        await connection.settled();
        expect([first.opens, second.opens, k8850.opens]).toEqual([1, 0, 0]);
    });

    /**
     * A keyboard that didn't open isn't tried again — its failure shown — until it is re-plugged or retried. One the
     * browser may not open needs permission; anything else failed.
     */
    it("a failure stays while the keyboard is plugged in", async () => {
        const hid = new FakeHid();
        const keyboard = new FakeDevice(K8840);
        keyboard.openError = "NotAllowedError";
        hid.have(keyboard);
        const { connection, state, events } = watch(hid);
        await connection.settled();
        expect(state()).toEqual({ kind: "needsPermission" });

        hid.plug(new FakeDevice(K8842, MEDIA));
        await connection.settled();
        expect(state()).toEqual({ kind: "needsPermission" });
        expect(keyboard.opens).toBe(1);

        keyboard.openError = "NetworkError";
        connection.retry();
        await connection.settled();
        expect(state()).toEqual({ kind: "openFailed", code: 0 });
        expect(keyboard.opens).toBe(2);

        keyboard.openError = null;
        connection.retry();
        await connection.settled();
        expect(state().kind).toBe("connected");
        // Retrying looks again from the start.
        expect(events().map((event) => event.kind)).toEqual([
            "needsPermission",
            "searching",
            "openFailed",
            "searching",
            "connected",
        ]);
    });

    it("another keyboard is tried while one fails", async () => {
        const hid = new FakeHid();
        const failing = new FakeDevice(K8840);
        failing.openError = "InvalidStateError";
        hid.have(failing);
        const { connection, state } = watch(hid);
        await connection.settled();
        expect(state()).toEqual({ kind: "openFailed", code: 0 });

        const working = new FakeDevice(K8850);
        hid.granted.add(working);
        hid.plug(working);
        await connection.settled();
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8850 } });

        // Unplugged, the failed one is forgotten: plugged in again, it is tried again.
        hid.unplug(working, failing);
        await connection.settled();
        expect(state()).toEqual({ kind: "searching" });
        failing.openError = null;
        hid.plug(failing);
        await connection.settled();
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8840 } });
    });

    /**
     * The chooser offers the supported USB IDs. The first keyboard it newly grants is told, once it is among those
     * plugged in; the one open stays — opening the granted one in its place is the app's to ask for.
     */
    it("access granted from the chooser, with a keyboard open", async () => {
        const hid = new FakeHid();
        const storage = new MemoryStorage();
        const known = new FakeDevice(K8840);
        hid.have(known);
        const { connection, state, attached } = watch(hid, storage);
        await connection.settled();

        const fresh = new FakeDevice(K8850);
        const freshMedia = new FakeDevice(K8850, MEDIA);
        hid.plugged.push(fresh, freshMedia);
        hid.chooser = [known, freshMedia, fresh];
        const granted = connection.requestAccess();
        // Asked for at once, from the click.
        expect(hid.requests.length).toBe(1);
        await expect(granted).resolves.toBe("hid-2");
        expect(hid.requests[0]?.filters.length).toBe(16);
        expect(hid.requests[0]?.filters[0]).toEqual({ vendorId: 0x1189, productId: 0x8842 });
        expect(attached()).toMatchObject({ keyboards: [{ id: "hid-1" }, { id: "hid-2" }], selected: "hid-1" });
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8840 } });
        expect(storage.getItem("minikeyboard.selectedKeyboard")).toBeNull();
        expect(known.closes).toBe(0);
        expect(fresh.opens).toBe(0);

        connection.selectKeyboard("hid-2");
        await connection.settled();
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8850 } });
        expect(storage.getItem("minikeyboard.selectedKeyboard")).toBe("514C:8850");
    });

    /** With none open — the usual case — the keyboard granted is opened, as one plugged in is, and kept for next time. */
    it("access granted from the chooser, with none open", async () => {
        const hid = new FakeHid();
        const storage = new MemoryStorage();
        const { connection, state, attached } = watch(hid, storage);
        await connection.settled();
        expect(state()).toEqual({ kind: "searching" });

        const fresh = new FakeDevice(K8850);
        hid.plugged.push(fresh);
        hid.chooser = [fresh];
        await expect(connection.requestAccess()).resolves.toBe("hid-1");
        expect(attached()).toMatchObject({ keyboards: [{ id: "hid-1" }], selected: "hid-1" });
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8850 } });
        expect(storage.getItem("minikeyboard.selectedKeyboard")).toBe("514C:8850");
        expect(fresh.opens).toBe(1);
    });

    /** The keyboard chosen last time, failing to open, is no keyboard open: the one granted opens in its place. */
    it("access granted from the chooser, while the one chosen fails", async () => {
        const hid = new FakeHid();
        const storage = new MemoryStorage();
        storage.setItem("minikeyboard.selectedKeyboard", "1189:8840");
        const failing = new FakeDevice(K8840);
        failing.openError = "NotAllowedError";
        hid.have(failing);
        const { connection, state } = watch(hid, storage);
        await connection.settled();
        expect(state()).toEqual({ kind: "needsPermission" });

        const fresh = new FakeDevice(K8850);
        hid.plugged.push(fresh);
        hid.chooser = [fresh];
        await expect(connection.requestAccess()).resolves.toBe("hid-2");
        expect(state().kind === "connected" && state()).toMatchObject({ keyboard: { usb: K8850 } });
        expect(storage.getItem("minikeyboard.selectedKeyboard")).toBe("514C:8850");
    });

    /** A cancelled chooser is not an error; anything else the browser refuses is. */
    it("a cancelled chooser", async () => {
        const hid = new FakeHid();
        const { connection, state } = watch(hid);
        await connection.settled();
        hid.chooser = [];
        await expect(connection.requestAccess()).resolves.toBeNull();
        hid.chooser = new DOMException("No device selected.", "NotFoundError");
        await expect(connection.requestAccess()).resolves.toBeNull();
        hid.chooser = new DOMException("Must be handling a user gesture.", "SecurityError");
        await expect(connection.requestAccess()).rejects.toThrow("user gesture");
        expect(state()).toEqual({ kind: "searching" });
    });

    it("closed, it lets go and stops looking", async () => {
        const hid = new FakeHid();
        const keyboard = new FakeDevice(K8840);
        hid.have(keyboard);
        const { connection } = watch(hid);
        await connection.settled();
        connection.close();
        await connection.settled();
        expect(keyboard.closes).toBe(1);
        expect(hid.listening).toBe(0);
        expect(connection.openChannel()).toBeNull();
    });
});
