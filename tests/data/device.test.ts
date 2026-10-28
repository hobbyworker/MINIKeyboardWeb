// The device repository's reads, against a keyboard whose answers the test gives.

import { describe, expect, it } from "vitest";
import {
    DeviceLogStore,
    KeyboardDevice,
    ReportFraming,
    k884x,
    records,
    type ChannelProvider,
    type ReportChannel,
} from "$data";
import {
    ControlId,
    KeyAction,
    KeyboardDeviceError,
    KeyboardLayout,
    controlKey,
    type KeyboardDeviceErrorReason,
} from "$domain";

function named(id: string): KeyboardLayout {
    const layout = KeyboardLayout.named(id);
    if (layout === null) throw new Error(`no layout ${id}`);
    return layout;
}

/** A configuration interface that answers each request with what {@link answers} gives for it. */
class ScriptedChannel implements ReportChannel, ChannelProvider {
    readonly framing = ReportFraming.of(k884x.REPORT_ID, k884x.REPORT_LENGTH);
    answers: (payload: Uint8Array) => Uint8Array[] = () => [];
    private replies: Uint8Array[] = [];

    openChannel(): ReportChannel {
        return this;
    }

    async write(report: Uint8Array): Promise<void> {
        const answers = this.answers(report.subarray(1));
        this.replies.push(...answers.map((payload) => ReportFraming.frame(this.framing, payload)));
    }

    discardPendingReplies(): void {
        this.replies = [];
    }

    async nextReply(): Promise<Uint8Array | null> {
        return this.replies.shift() ?? null;
    }
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

/** Records 1…`count` of layer 0 on the standard format, each a media key of its number. */
function mediaRecords(count: number): Uint8Array[] {
    return Array.from({ length: count }, (_, index) => records.standard(KeyAction.media(index + 1), index + 1, 0));
}

describe("reading a layer", () => {
    const layout = named("6add1");
    const setUp = () => {
        const channel = new ScriptedChannel();
        const device = new KeyboardDevice(channel, new DeviceLogStore(), { replyTimeout: 1 });
        return { channel, device };
    };

    /** Answers that stop after some came: those are read, the layout's other controls aren't. */
    it("answers that stop early keep what came", async () => {
        const { channel, device } = setUp();
        channel.answers = () => mediaRecords(4);
        const read = await device.readActions(0, "standard", layout);
        expect([...read.actions.keys()]).toEqual([1, 2, 3, 4].map((number) => controlKey(ControlId.key(number))));
        expect(read.actions.get(controlKey(ControlId.key(3)))).toEqual(KeyAction.media(3));
        expect(read.unread).toEqual(layout.controls.filter((control) => control.kind === "knob" || control.number > 4));
    });

    /** A keyboard that answers only as far as its last control leaves nothing unread. */
    it("a keyboard with fewer controls than records", async () => {
        const { channel, device } = setUp();
        channel.answers = () => mediaRecords(18);
        const read = await device.readActions(0, "standard", layout);
        expect(read.unread).toEqual([]);
        expect(read.actions.size).toBe(layout.controls.length);
    });

    it("no answer at all", async () => {
        const { device } = setUp();
        expect(await failure(device.readActions(0, "standard", layout))).toEqual({ kind: "noReply" });
    });

    /** A record of a kind the app doesn't know leaves its control unread. */
    it("a kind the app doesn't know", async () => {
        const { channel, device } = setUp();
        channel.answers = () =>
            mediaRecords(k884x.readReplyCount("standard")).map((record, index) => {
                if (index === 1) record[3] = 9;
                return record;
            });
        const read = await device.readActions(0, "standard", layout);
        expect(read.unread).toEqual([ControlId.key(2)]);
        expect(read.actions.has(controlKey(ControlId.key(2)))).toBe(false);
        expect(read.actions.get(controlKey(ControlId.key(1)))).toEqual(KeyAction.media(1));
    });
});
