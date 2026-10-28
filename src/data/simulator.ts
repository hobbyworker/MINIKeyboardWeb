// Keyboards that exist only in the app, for trying every keyboard without owning it. They take the same reports a real
// one does, through the same codecs, and answer as their firmware would.

import {
    AttachedKeyboards,
    CONFIGURATION_INTERFACE,
    KeyboardIdentity,
    KeyboardSource,
    KeyColor,
    LightingSupport,
    SimulatedModel,
    type ConnectedKeyboard,
    type ConnectionState,
    type KeyboardConnectionRepository,
    type KeyboardSourceRepository,
    type Updates,
} from "$domain";
import { Broadcaster, ReportFraming, type ChannelProvider, type ReportChannel } from "./channel";
import type { DeviceLogStore } from "./log";
import * as k884x from "./protocols/k884x";

/**
 * A keyboard that exists only in the app. One that answers says who it is and reads back what was written to it; one
 * that doesn't keeps the `FE` records it is sent.
 */
export class SimulatedKeyboard implements ReportChannel, ChannelProvider {
    readonly model: SimulatedModel;
    readonly framing = ReportFraming.of(k884x.REPORT_ID, k884x.REPORT_LENGTH);
    private replies: Uint8Array[] = [];
    /** Records by layer (from 1) and record number, as written. */
    private readonly records = new Map<number, Map<number, Uint8Array>>();
    /** Standard-format lights by layer (from 0): the mode and 16 colours, as written. */
    private readonly lighting = new Map<number, Uint8Array>();
    /** Every payload written, in order. */
    private readonly payloads: Uint8Array[] = [];

    constructor(model: SimulatedModel) {
        this.model = model;
    }

    keyboard(): ConnectedKeyboard {
        return {
            usb: this.model.usb,
            interfaceNumber: CONFIGURATION_INTERFACE,
            channel: "simulated",
            reportId: this.framing.reportId,
            reportLength: this.framing.length,
            details: null,
        };
    }

    /** Every payload written, in order. */
    written(): readonly Uint8Array[] {
        return this.payloads;
    }

    /** The record kept in `record` of `layer` (from 1), as written. */
    record(layer: number, record: number): Uint8Array | null {
        return this.records.get(layer)?.get(record) ?? null;
    }

    openChannel(): ReportChannel {
        return this;
    }

    write(report: Uint8Array): Promise<void> {
        this.receive(report);
        return Promise.resolve();
    }

    discardPendingReplies(): void {
        this.replies = [];
    }

    /** The firmware answers as soon as it is asked, so a reply that isn't there won't come. */
    nextReply(_timeoutMs: number): Promise<Uint8Array | null> {
        return Promise.resolve(this.replies.shift() ?? null);
    }

    private receive(report: Uint8Array): void {
        const payload = (this.framing.reportId === 0 ? report : report.subarray(1)).slice();
        this.payloads.push(payload);
        const byte = (index: number) => payload[index] ?? 0;
        if (this.model.kind.kind === "unidentified") {
            if (payload.length >= 3 && byte(0) === 0xfe) this.keep(byte(2), byte(1), payload);
            return;
        }
        const identity = this.model.kind.identity;
        const format = KeyboardIdentity.recordFormat(identity);
        if (byte(0) === 0xfb) {
            this.reply(Uint8Array.of(0xfb, identity.keyCount, identity.knobCount, identity.kind));
        } else if (byte(0) === 0xfa && byte(1) === 0xb0) {
            const lighting = this.lighting.get(byte(2)) ?? initialLighting();
            this.reply(Uint8Array.of(0xb0, ...lighting));
        } else if (byte(0) === 0xfa) {
            const layer = byte(3);
            for (let id = 1; id <= k884x.readReplyCount(format); id++) {
                this.reply(this.record(layer, id) ?? initialRecord(id, layer));
            }
        } else if (byte(0) === 0xfd && byte(1) !== 0xfe) {
            this.keep(byte(2), byte(1), payload);
        } else if (byte(0) === 0xfe && byte(1) === 0xb0 && format === "standard") {
            this.lighting.set(byte(2), payload.slice(3, 4 + 3 * LightingSupport.COLOR_KEY_COUNT));
        } else if (byte(0) === 0xfe && byte(1) === 0xb0) {
            this.keep(byte(2), 0, payload);
        }
    }

    private keep(layer: number, record: number, payload: Uint8Array): void {
        let layerRecords = this.records.get(layer);
        if (layerRecords === undefined) {
            layerRecords = new Map();
            this.records.set(layer, layerRecords);
        }
        layerRecords.set(record, payload);
    }

    private reply(payload: Uint8Array): void {
        this.replies.push(ReportFraming.frame(this.framing, payload));
    }
}

/** What the cross-platform app starts a record as: `FD <record> <layer> 01`. */
function initialRecord(id: number, layer: number): Uint8Array {
    const record = new Uint8Array(64);
    record.set([0xfd, id, layer, 0x01]);
    return record;
}

function initialLighting(): Uint8Array {
    return Uint8Array.from([
        0,
        ...KeyColor.DEFAULT_KEY_COLORS.flatMap((color) => [color.red, color.green, color.blue]),
    ]);
}

/** The connection to the keyboards on USB, as the switch follows it. */
export type HardwareConnection = KeyboardConnectionRepository & ChannelProvider & { close?(): void };

/**
 * The keyboard the app talks to, switchable while it runs: the one on USB or a simulated one. A switch is reported as
 * "searching" and then the new keyboard, so the app starts over as after re-plugging. The USB connection is made the
 * first time it is chosen — an app that stays on a simulated keyboard never asks the browser for one.
 */
export class KeyboardSourceSwitch implements KeyboardConnectionRepository, KeyboardSourceRepository, ChannelProvider {
    private readonly log: DeviceLogStore;
    private readonly connectHardware: () => HardwareConnection;
    private source: KeyboardSource = KeyboardSource.HARDWARE;
    private hardware: HardwareConnection | null = null;
    private hardwareState: ConnectionState = { kind: "searching" };
    private hardwareAttached: AttachedKeyboards = AttachedKeyboards.NONE;
    /** By {@link SimulatedModel.id}. */
    private readonly simulated = new Map<string, SimulatedKeyboard>();
    private readonly state = new Broadcaster<ConnectionState>({ kind: "searching" });
    /** The keyboards on USB to choose from — none while a simulated keyboard is in use. */
    private readonly attached = new Broadcaster<AttachedKeyboards>(AttachedKeyboards.NONE);
    /** Whether the hardware connection's values are passed on. */
    private followingHardware = false;

    /** `connectHardware` makes the connection to the keyboards on USB, the first time it is needed. */
    constructor(log: DeviceLogStore, initial: KeyboardSource, connectHardware: () => HardwareConnection) {
        this.log = log;
        this.connectHardware = connectHardware;
        this.source = initial;
        this.follow(initial);
    }

    connectionStates(): Updates<ConnectionState> {
        return this.state;
    }

    retry(): void {
        if (this.source.kind === "hardware") this.hardware?.retry();
    }

    attachedKeyboards(): Updates<AttachedKeyboards> {
        return this.attached;
    }

    selectKeyboard(id: string): void {
        if (this.source.kind === "hardware") this.hardware?.selectKeyboard?.(id);
    }

    /** Asks the browser for a keyboard on USB — only while that is the source. */
    async requestAccess(): Promise<string | null> {
        if (this.source.kind !== "hardware") return null;
        return (await this.hardware?.requestAccess?.()) ?? null;
    }

    current(): KeyboardSource {
        return this.source;
    }

    select(source: KeyboardSource): void {
        if (sameSource(this.source, source)) return;
        this.followingHardware = false;
        this.state.set({ kind: "searching" });
        // The source first: listeners hear the new keyboard at once and may write to it straight away.
        this.source = source;
        this.follow(source);
    }

    /** Lets go of the keyboards on USB, if they were ever looked for. */
    close(): void {
        this.hardware?.close?.();
    }

    openChannel(): ReportChannel | null {
        if (this.source.kind === "hardware") return this.hardware?.openChannel() ?? null;
        return this.simulated.get(SimulatedModel.id(this.source.model)) ?? null;
    }

    private follow(source: KeyboardSource): void {
        if (source.kind === "hardware") {
            if (this.hardware === null) {
                const hardware = this.connectHardware();
                this.hardware = hardware;
                hardware.connectionStates().subscribe((state) => {
                    this.hardwareState = state;
                    if (this.followingHardware) this.state.set(state);
                });
                hardware.attachedKeyboards?.().subscribe((attached) => {
                    this.hardwareAttached = attached;
                    if (this.followingHardware) this.attached.set(attached);
                });
            }
            this.followingHardware = true;
            this.state.set(this.hardwareState);
            this.attached.set(this.hardwareAttached);
        } else {
            this.followingHardware = false;
            this.attached.set(AttachedKeyboards.NONE);
            this.state.set({ kind: "connected", keyboard: this.simulatedKeyboard(source.model).keyboard() });
        }
    }

    private simulatedKeyboard(model: SimulatedModel): SimulatedKeyboard {
        const id = SimulatedModel.id(model);
        let keyboard = this.simulated.get(id);
        if (keyboard === undefined) {
            this.log.append({ kind: "event", event: { kind: "simulated", modelId: id } });
            keyboard = new SimulatedKeyboard(model);
            this.simulated.set(id, keyboard);
        }
        return keyboard;
    }
}

function sameSource(a: KeyboardSource, b: KeyboardSource): boolean {
    if (a.kind === "hardware" || b.kind === "hardware") return a.kind === b.kind;
    return SimulatedModel.id(a.model) === SimulatedModel.id(b.model);
}
