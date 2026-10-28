import {
    controlKey,
    KeyboardDeviceError,
    type KeyAction,
    type KeyboardConfiguration,
    type KeyboardDeviceRepository,
    type KeyboardIdentity,
    type KeyboardLayout,
    type LayerLighting,
    type LayerRead,
    type RecordFormat,
} from "$domain";
import { ReportFraming, sleep, type ChannelProvider, type ReportChannel } from "./channel";
import type { DeviceLogStore } from "./log";
import * as k884x from "./protocols/k884x";
import * as numbers from "./protocols/numbers";
import { WritePlan } from "./protocols/plan";
import * as records from "./protocols/records";

/** Waits the given milliseconds; tests wait none. */
export type Pause = (ms: number) => Promise<void>;

/** How long the device waits for answers, and how it waits between writes. */
export interface DeviceTiming {
    /** Milliseconds for the answer to `FB FB FB`. */
    readonly identifyTimeout: number;
    /** Milliseconds for every other answer. */
    readonly replyTimeout: number;
    readonly pause: Pause;
}

/**
 * The cross-platform app waits 10 ms for the identification answer; here a slow keyboard gets 600 ms, and every other
 * answer a second.
 */
const DEFAULT_TIMING: DeviceTiming = { identifyTimeout: 600, replyTimeout: 1000, pause: sleep };

/** Talks to whichever keyboard the channel provider has open, in the commands it takes. */
export class KeyboardDevice implements KeyboardDeviceRepository {
    private readonly channels: ChannelProvider;
    private readonly log: DeviceLogStore;
    private readonly timing: DeviceTiming;

    constructor(channels: ChannelProvider, log: DeviceLogStore, timing: Partial<DeviceTiming> = {}) {
        this.channels = channels;
        this.log = log;
        this.timing = { ...DEFAULT_TIMING, ...timing };
    }

    async askIdentity(): Promise<KeyboardIdentity | null> {
        const channel = this.channel();
        channel.discardPendingReplies();
        await this.send(k884x.IDENTIFY, channel);
        const reply = await this.reply(channel, this.timing.identifyTimeout);
        if (reply === null) return null;
        const identity = k884x.identity(reply);
        if (identity === null) throw KeyboardDeviceError.invalidReply();
        return identity;
    }

    /**
     * The answers are records 1… in order. When they stop after some came, those are what was read; a keyboard with
     * fewer controls than the records asked for stops after its last, with nothing left unread. A control the layout
     * keeps beyond the records asked for is outside the read: neither read nor unread.
     */
    async readActions(layer: number, format: RecordFormat, layout: KeyboardLayout): Promise<LayerRead> {
        const request = k884x.readRecords(layer, format);
        if (request === null) throw KeyboardDeviceError.unsupported();
        const channel = this.channel();
        channel.discardPendingReplies();
        await this.send(request, channel);
        const actions = new Map<string, KeyAction>();
        const count = k884x.readReplyCount(format);
        for (let recordId = 1; recordId <= count; recordId++) {
            const reply = await this.reply(channel, this.timing.replyTimeout);
            if (reply === null) {
                if (recordId === 1) throw KeyboardDeviceError.noReply();
                break;
            }
            const control = numbers.controlInRecord(recordId, layout);
            const action = control === null ? null : records.decode(k884x.record(reply), format);
            if (control !== null && action !== null) actions.set(controlKey(control), action);
        }
        const unread = layout.controls.filter((control) => {
            const recordId = numbers.record(control, layout);
            return recordId !== null && recordId <= count && !actions.has(controlKey(control));
        });
        return { actions, unread };
    }

    async readLighting(layer: number): Promise<LayerLighting> {
        const channel = this.channel();
        channel.discardPendingReplies();
        await this.send(k884x.readLighting(layer), channel);
        const reply = await this.reply(channel, this.timing.replyTimeout);
        if (reply === null) throw KeyboardDeviceError.noReply();
        const lighting = k884x.lightingReply(reply);
        if (lighting === null) throw KeyboardDeviceError.invalidReply();
        return lighting;
    }

    storedForm(action: KeyAction, format: RecordFormat): KeyAction | null {
        return records.storedForm(action, format);
    }

    async write(configuration: KeyboardConfiguration, format: RecordFormat, layout: KeyboardLayout): Promise<void> {
        const plan = WritePlan.of(configuration, format, layout);
        const channel = this.channel();
        for (const step of plan.steps) {
            await this.send(step.payload, channel);
            if (step.pauseAfter > 0) await this.timing.pause(step.pauseAfter);
        }
    }

    private channel(): ReportChannel {
        const channel = this.channels.openChannel();
        if (channel === null) throw KeyboardDeviceError.notConnected();
        return channel;
    }

    private async send(payload: Uint8Array, channel: ReportChannel): Promise<void> {
        const report = ReportFraming.frame(channel.framing, payload);
        this.log.append({ kind: "output", bytes: report.slice() });
        try {
            await channel.write(report);
        } catch (error) {
            if (error instanceof KeyboardDeviceError && error.reason.kind === "writeFailed") {
                this.log.append({ kind: "event", event: { kind: "writeFailed", code: error.reason.code } });
            }
            throw error;
        }
    }

    private async reply(channel: ReportChannel, timeoutMs: number): Promise<Uint8Array | null> {
        const reply = await channel.nextReply(timeoutMs);
        if (reply === null) return null;
        this.log.append({ kind: "input", bytes: reply.slice() });
        return reply;
    }
}
