// The open configuration interface, as the device repository uses it, and the values the repositories hand out.

import type { Updates } from "$domain";

/**
 * How payloads become reports on a keyboard's configuration interface: the report ID first unless it is 0, then the
 * payload, zero-padded to the report's length.
 */
export interface ReportFraming {
    readonly reportId: number;
    /** Bytes per report, the report ID included. */
    readonly length: number;
}

export const ReportFraming = {
    of(reportId: number, length: number): ReportFraming {
        return { reportId, length };
    },

    frame(framing: ReportFraming, payload: Uint8Array): Uint8Array {
        const start = framing.reportId !== 0 ? 1 : 0;
        const bytes = new Uint8Array(Math.max(framing.length, start + payload.length));
        if (start === 1) bytes[0] = framing.reportId;
        bytes.set(payload, start);
        return bytes;
    },
};

/** The open configuration interface: reports out, and the keyboard's answers in. */
export interface ReportChannel {
    readonly framing: ReportFraming;

    /** Writes one report, as framed. Rejects with a `KeyboardDeviceError`. */
    write(report: Uint8Array): Promise<void>;

    /** Drops answers that came before a new request. */
    discardPendingReplies(): void;

    /** The next answer, its report ID first, or `null` when none comes within `timeoutMs`. */
    nextReply(timeoutMs: number): Promise<Uint8Array | null>;
}

/** Whoever has the channel open — the connection to the keyboard on USB, or the simulator. */
export interface ChannelProvider {
    openChannel(): ReportChannel | null;
}

/**
 * Keeps every subscriber of a value up to date: the current value first, then each change. A value equal to the last
 * one, by `equals`, sends nothing.
 */
export class Broadcaster<T> implements Updates<T> {
    private current: T;
    private readonly equals: (a: T, b: T) => boolean;
    private listeners: ((value: T) => void)[] = [];

    constructor(value: T, equals: (a: T, b: T) => boolean = samePlainData) {
        this.current = value;
        this.equals = equals;
    }

    value(): T {
        return this.current;
    }

    /** Sends a changed value to every subscriber; the same value again sends nothing. */
    set(value: T): void {
        if (this.equals(this.current, value)) return;
        this.current = value;
        for (const listener of [...this.listeners]) listener(value);
    }

    subscribe(listener: (value: T) => void): () => void {
        this.listeners.push(listener);
        listener(this.current);
        return () => {
            this.listeners = this.listeners.filter((other) => other !== listener);
        };
    }
}

/** Waits `ms` milliseconds. */
export function sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Whether two values of plain data are equal — numbers, strings, booleans, null, arrays, byte arrays and plain objects,
 * compared member by member.
 */
export function samePlainData(a: unknown, b: unknown): boolean {
    if (a === b) return true;
    if (typeof a !== "object" || typeof b !== "object" || a === null || b === null) return false;
    if (Array.isArray(a) || Array.isArray(b) || a instanceof Uint8Array || b instanceof Uint8Array) {
        if (Array.isArray(a) !== Array.isArray(b) || a instanceof Uint8Array !== b instanceof Uint8Array) return false;
        const left = a as ArrayLike<unknown>;
        const right = b as ArrayLike<unknown>;
        if (left.length !== right.length) return false;
        for (let index = 0; index < left.length; index++) {
            if (!samePlainData(left[index], right[index])) return false;
        }
        return true;
    }
    const left = a as Record<string, unknown>;
    const right = b as Record<string, unknown>;
    const keys = Object.keys(left);
    if (keys.length !== Object.keys(right).length) return false;
    return keys.every((key) => Object.hasOwn(right, key) && samePlainData(left[key], right[key]));
}
