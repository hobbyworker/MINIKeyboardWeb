// Finds the supported keyboards granted to the page and plugged in, and keeps one's configuration interface open — the
// one chosen (`choice.ts`). The others are left alone, so another tab or app can have them.
//
// A keyboard is the `HIDDevice` that takes output report 3 — a keypad shows one `HIDDevice` per HID interface, and only
// interface 0 has it. WebHID says nothing of where a keyboard is plugged in and gives no lasting ID, so each `HIDDevice`
// is named for as long as it stays plugged in ("hid-1"…) and its `AttachedKeyboard.location` is empty. The browser
// tells when a granted keyboard comes or goes; nothing is polled.

import {
    AttachedKeyboards,
    CONFIGURATION_INTERFACE,
    KeyboardDeviceError,
    SUPPORTED_KEYBOARDS,
    UsbIdentity,
    isSupportedKeyboard,
    sameUsbIdentity,
    type AttachedKeyboard,
    type ConnectedKeyboard,
    type ConnectionState,
    type DeviceDetails,
    type DeviceLogEvent,
    type KeyboardConnectionRepository,
    type Updates,
} from "$domain";
import { Broadcaster, ReportFraming, samePlainData, type ChannelProvider, type ReportChannel } from "../channel";
import type { DeviceLogStore } from "../log";
import * as k884x from "../protocols/k884x";
import { readItem, writeItem, type KeyValueStorage } from "../storage";
import * as choice from "./choice";
import type { HidConnectionEvent, HidDevice, HidInputReport, HidSystem } from "./hid";

/** The storage key of the keyboard chosen last time ({@link choice.key}). */
const SELECTED_KEYBOARD = "minikeyboard.selectedKeyboard";

/** Answers are 64-byte reports; shorter ones are the keyboard's typing, media keys or mouse. */
const MINIMUM_REPLY_LENGTH = 32;

/** The connection to the keyboards on USB, through WebHID. */
export class WebHidConnection implements KeyboardConnectionRepository, ChannelProvider {
    private readonly log: DeviceLogStore;
    private readonly hid: HidSystem;
    private readonly storage: KeyValueStorage | null;
    private readonly state: Broadcaster<ConnectionState>;
    private readonly attached = new Broadcaster<AttachedKeyboards>(AttachedKeyboards.NONE);
    private readonly ids = new WeakMap<HidDevice, string>();
    private lastId = 0;
    /** The keyboards found last, by ID. */
    private devices = new Map<string, HidDevice>();
    private open: { readonly id: string; readonly device: HidDevice; readonly channel: WebHidChannel } | null = null;
    /** The one the user chose this session; `null` once it is unplugged — the app doesn't go back to it by itself. */
    private chosen: string | null = null;
    /** Keyboards that didn't open, left alone until they are plugged in again or the user retries. */
    private readonly failed = new Set<string>();
    /** The work queued so far: one thing at a time, in order. */
    private work: Promise<void> = Promise.resolve();
    private closed = false;
    private readonly onConnect = () => void this.enqueue(() => this.refresh(null));
    private readonly onDisconnect = (event: HidConnectionEvent) => void this.enqueue(() => this.refresh(event.device));

    private constructor(log: DeviceLogStore, hid: HidSystem, storage: KeyValueStorage | null) {
        this.log = log;
        this.hid = hid;
        this.storage = storage;
        this.state = new Broadcaster<ConnectionState>({ kind: hid.isAvailable ? "searching" : "unsupported" });
    }

    /**
     * Starts looking for keyboards — unless the page can't reach HID devices, which leaves the state `unsupported`.
     * The one chosen is kept in `storage`, to be opened again next time.
     */
    static start(log: DeviceLogStore, hid: HidSystem, storage: KeyValueStorage | null): WebHidConnection {
        const connection = new WebHidConnection(log, hid, storage);
        if (hid.isAvailable) {
            hid.addEventListener("connect", connection.onConnect);
            hid.addEventListener("disconnect", connection.onDisconnect);
            void connection.enqueue(() => connection.refresh(null));
        }
        return connection;
    }

    connectionStates(): Updates<ConnectionState> {
        return this.state;
    }

    attachedKeyboards(): Updates<AttachedKeyboards> {
        return this.attached;
    }

    retry(): void {
        if (!this.hid.isAvailable || this.closed) return;
        void this.enqueue(async () => {
            this.failed.clear();
            if (this.open === null) this.setState({ kind: "searching" });
            await this.refresh(null);
        });
    }

    selectKeyboard(id: string): void {
        if (this.closed) return;
        void this.enqueue(() => this.select(id));
    }

    /**
     * Shows the browser's chooser for the supported keyboards — call it from a click: the chooser is asked for before
     * anything is awaited. Resolves with the first keyboard it grants that wasn't granted before, once that is among
     * the keyboards plugged in. With none open, that one is opened and kept for next time; one open stays. A cancelled
     * chooser is not an error.
     */
    async requestAccess(): Promise<string | null> {
        if (!this.hid.isAvailable || this.closed) return null;
        const known = new Set(this.devices.values());
        let granted: HidDevice[];
        try {
            granted = await this.hid.requestDevice({
                filters: SUPPORTED_KEYBOARDS.map((usb) => ({ vendorId: usb.vendorId, productId: usb.productId })),
            });
        } catch (error) {
            if (nameOf(error) === "NotFoundError" || nameOf(error) === "AbortError") return null;
            throw error;
        }
        if (this.closed) return null;
        const fresh = granted.find((device) => isKeyboard(device) && !known.has(device)) ?? null;
        return this.enqueue(async () => {
            await this.refresh(null);
            if (fresh === null) return null;
            const id = this.idOf(fresh);
            if (!this.devices.has(id)) return null;
            if (this.open === null || this.open.id === id) await this.select(id);
            return id;
        });
    }

    openChannel(): ReportChannel | null {
        return this.open?.channel ?? null;
    }

    /** Resolves once the work queued so far is done. */
    settled(): Promise<void> {
        return this.work;
    }

    /** Stops following the keyboards and lets go of the open one. */
    close(): void {
        if (this.closed) return;
        this.closed = true;
        this.hid.removeEventListener("connect", this.onConnect);
        this.hid.removeEventListener("disconnect", this.onDisconnect);
        void this.enqueue(() => this.closeChannel());
    }

    private enqueue<T>(job: () => Promise<T>): Promise<T> {
        const run = this.work.then(job);
        this.work = run.then(
            () => {},
            () => {},
        );
        return run;
    }

    private async select(id: string): Promise<void> {
        const keyboard = this.attached.value().keyboards.find((candidate) => candidate.id === id);
        if (keyboard === undefined) return;
        this.chosen = id;
        // A write that fails is dropped — the first keyboard opens next time.
        writeItem(this.storage, SELECTED_KEYBOARD, choice.key(keyboard));
        if (this.open?.id === id) return;
        await this.closeChannel();
        this.failed.clear();
        this.setState({ kind: "searching" });
        await this.refresh(null);
    }

    /** Looks at the keyboards plugged in — less `gone`, just unplugged — and opens the one to open. */
    private async refresh(gone: HidDevice | null): Promise<void> {
        let devices: HidDevice[];
        try {
            devices = await this.hid.getDevices();
        } catch {
            // The page may not use WebHID here (a frame not allowed it).
            await this.closeChannel();
            this.attached.set(AttachedKeyboards.NONE);
            this.state.set({ kind: "unsupported" });
            return;
        }
        const order = (device: HidDevice) =>
            SUPPORTED_KEYBOARDS.findIndex((usb) => sameUsbIdentity(usb, usbOf(device)));
        const found = devices
            .filter((device) => device !== gone && isKeyboard(device))
            .sort((a, b) => order(a) - order(b));
        this.devices = new Map(found.map((device) => [this.idOf(device), device]));
        for (const id of this.failed) if (!this.devices.has(id)) this.failed.delete(id);
        const keyboards = choice.ordered(
            found.map((device): AttachedKeyboard => ({ id: this.idOf(device), usb: usbOf(device), location: "" })),
        );
        if (this.chosen !== null && !this.devices.has(this.chosen)) this.chosen = null;

        if (this.open !== null) {
            if (this.devices.has(this.open.id)) {
                this.publish(keyboards, this.open.id);
                return;
            }
            await this.closeChannel();
            this.setState({ kind: "searching" });
        }
        const usable = (keyboard: AttachedKeyboard) => !this.failed.has(keyboard.id);
        const remembered = readItem(this.storage, SELECTED_KEYBOARD)?.trim() ?? null;
        const target = choice.target(keyboards, this.chosen, remembered, usable);
        this.publish(keyboards, target?.id ?? null);
        const device = target !== null && usable(target) ? this.devices.get(target.id) : undefined;
        if (target === null || device === undefined) {
            // A failure stays on screen while that keyboard is still plugged in.
            const kind = this.state.value().kind;
            const failing = kind === "needsPermission" || kind === "openFailed";
            if (!(failing && this.devices.size > 0)) this.setState({ kind: "searching" });
            return;
        }
        await this.openKeyboard(target.id, device);
    }

    private async openKeyboard(id: string, device: HidDevice): Promise<void> {
        try {
            if (!device.opened) await device.open();
        } catch (error) {
            this.failed.add(id);
            const name = nameOf(error);
            this.setState(
                name === "NotAllowedError" || name === "SecurityError"
                    ? { kind: "needsPermission" }
                    : { kind: "openFailed", code: 0 },
            );
            return;
        }
        this.open = { id, device, channel: new WebHidChannel(device) };
        this.setState({ kind: "connected", keyboard: connectedKeyboard(device) });
    }

    private async closeChannel(): Promise<void> {
        const open = this.open;
        if (open === null) return;
        this.open = null;
        open.channel.close();
        try {
            await open.device.close();
        } catch {
            // Already gone.
        }
    }

    private setState(next: ConnectionState): void {
        if (samePlainData(next, this.state.value())) return;
        const event = logEvent(next);
        if (event !== null) this.log.append({ kind: "event", event });
        this.state.set(next);
    }

    private publish(keyboards: readonly AttachedKeyboard[], selected: string | null): void {
        this.attached.set({ keyboards, selected });
    }

    private idOf(device: HidDevice): string {
        let id = this.ids.get(device);
        if (id === undefined) {
            this.lastId += 1;
            id = `hid-${this.lastId}`;
            this.ids.set(device, id);
        }
        return id;
    }
}

/** An open keyboard's output reports out and its answers in. */
class WebHidChannel implements ReportChannel {
    readonly framing = ReportFraming.of(k884x.REPORT_ID, k884x.REPORT_LENGTH);
    private readonly device: HidDevice;
    private replies: Uint8Array[] = [];
    private waiters: ((reply: Uint8Array | null) => void)[] = [];
    private closed = false;
    private readonly onInputReport = (report: HidInputReport) => {
        if (report.reportId !== this.framing.reportId) return;
        const reply = new Uint8Array(1 + report.data.byteLength);
        reply[0] = report.reportId;
        reply.set(new Uint8Array(report.data.buffer, report.data.byteOffset, report.data.byteLength), 1);
        if (reply.length < MINIMUM_REPLY_LENGTH) return;
        const waiter = this.waiters.shift();
        if (waiter !== undefined) waiter(reply);
        else this.replies.push(reply);
    };

    constructor(device: HidDevice) {
        this.device = device;
        device.addEventListener("inputreport", this.onInputReport);
    }

    /** Sends the report's payload after its report ID, zero-padded to 64 bytes. */
    async write(report: Uint8Array): Promise<void> {
        if (this.closed) throw KeyboardDeviceError.notConnected();
        const data = new Uint8Array(Math.max(this.framing.length - 1, report.length - 1));
        data.set(report.subarray(1));
        try {
            await this.device.sendReport(report[0] ?? this.framing.reportId, data);
        } catch {
            throw KeyboardDeviceError.writeFailed(0);
        }
    }

    discardPendingReplies(): void {
        this.replies = [];
    }

    nextReply(timeoutMs: number): Promise<Uint8Array | null> {
        const reply = this.replies.shift();
        if (reply !== undefined) return Promise.resolve(reply);
        if (this.closed) return Promise.resolve(null);
        return new Promise((resolve) => {
            const waiter = (reply: Uint8Array | null) => {
                clearTimeout(timer);
                resolve(reply);
            };
            const timer = setTimeout(() => {
                this.waiters = this.waiters.filter((other) => other !== waiter);
                resolve(null);
            }, timeoutMs);
            this.waiters.push(waiter);
        });
    }

    /** No more writes; whoever waits for an answer gets none. */
    close(): void {
        this.closed = true;
        this.device.removeEventListener("inputreport", this.onInputReport);
        this.replies = [];
        const waiters = this.waiters;
        this.waiters = [];
        for (const waiter of waiters) waiter(null);
    }
}

function usbOf(device: HidDevice): UsbIdentity {
    return UsbIdentity.of(device.vendorId, device.productId);
}

/** A supported keyboard's `HIDDevice` that takes the configuration: a collection with output report 3. */
function isKeyboard(device: HidDevice): boolean {
    return isSupportedKeyboard(usbOf(device)) && device.collections.some(takesConfiguration);
}

function takesConfiguration(collection: HIDCollectionInfo): boolean {
    return (
        (collection.outputReports ?? []).some((report) => report.reportId === k884x.REPORT_ID) ||
        (collection.children ?? []).some(takesConfiguration)
    );
}

/**
 * What WebHID tells of the device: its product name, and the usages of its top-level collections on the configuration
 * interface. The rest — USB version, speed, power, strings other than the name — it doesn't, and nothing is guessed.
 */
function connectedKeyboard(device: HidDevice): ConnectedKeyboard {
    const details: DeviceDetails = {
        usbVersion: null,
        deviceRelease: null,
        speed: null,
        manufacturer: null,
        productName: device.productName === "" ? null : device.productName,
        serialNumber: null,
        maxPower: null,
        interfaces: [
            {
                number: CONFIGURATION_INTERFACE,
                class: 3,
                subclass: null,
                protocol: null,
                usages: device.collections.map((collection) => ({
                    page: collection.usagePage ?? 0,
                    usage: collection.usage ?? 0,
                })),
            },
        ],
    };
    return {
        usb: usbOf(device),
        interfaceNumber: CONFIGURATION_INTERFACE,
        channel: "hid",
        reportId: k884x.REPORT_ID,
        reportLength: k884x.REPORT_LENGTH,
        details,
    };
}

function logEvent(state: ConnectionState): DeviceLogEvent | null {
    switch (state.kind) {
        case "searching":
            return { kind: "searching" };
        case "connected":
            return { kind: "connected", usb: state.keyboard.usb, interface: state.keyboard.interfaceNumber };
        case "needsPermission":
            return { kind: "needsPermission" };
        case "openFailed":
            return { kind: "openFailed", code: state.code };
        case "unsupported":
            return null;
    }
}

function nameOf(error: unknown): string | null {
    return typeof error === "object" && error !== null && "name" in error && typeof error.name === "string"
        ? error.name
        : null;
}
