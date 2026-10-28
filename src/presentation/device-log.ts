import { formatUsbIdentity, type DeviceLogEntry, type DeviceLogEvent, type DeviceLogUseCase } from "$domain";
import * as packetText from "./packet-text";

/** Which way a line of the log went. */
export type LogDirection = "output" | "input" | "event";

/** What happened to the connection; the window names it. */
export type LogEvent =
    | { readonly kind: "searching" }
    | { readonly kind: "connected"; readonly usb: string; readonly interface: number }
    | { readonly kind: "needsPermission" }
    | { readonly kind: "openFailed"; readonly code: number }
    | { readonly kind: "writeFailed"; readonly code: number }
    | { readonly kind: "simulated"; readonly id: string };

/** One line of the device log window. */
export interface LogLine {
    readonly id: number;
    /** Milliseconds since the Unix epoch. */
    readonly time: number;
    readonly direction: LogDirection;
    /** Every byte of the report written or read; empty for an event. */
    readonly bytes: Uint8Array;
    readonly event: LogEvent | null;
}

export const LogLine = {
    /** The report up to the zero padding at its end: "03 FB FB FB". */
    summary(line: LogLine): string {
        return packetText.summary(line.bytes);
    },

    /** Whether {@link LogLine.summary} leaves bytes out. */
    isShortened(line: LogLine): boolean {
        return packetText.summaryCount(line.bytes) < line.bytes.length;
    },

    /** Every byte, 16 to a row after the row's offset: "0010  00 00 00 …". */
    rows(line: LogLine): string[] {
        return packetText.rows(line.bytes);
    },

    /** Every byte on one line. */
    hex(line: LogLine): string {
        return packetText.hex(line.bytes);
    },
};

function logEventOf(event: DeviceLogEvent): LogEvent {
    switch (event.kind) {
        case "searching":
            return { kind: "searching" };
        case "connected":
            return { kind: "connected", usb: formatUsbIdentity(event.usb), interface: event.interface };
        case "needsPermission":
            return { kind: "needsPermission" };
        case "openFailed":
            return { kind: "openFailed", code: event.code };
        case "writeFailed":
            return { kind: "writeFailed", code: event.code };
        case "simulated":
            return { kind: "simulated", id: event.modelId };
    }
}

function lineOf(entry: DeviceLogEntry): LogLine {
    const content = entry.content;
    switch (content.kind) {
        case "output":
        case "input":
            return {
                id: entry.id,
                time: entry.time,
                direction: content.kind,
                bytes: content.bytes.slice(),
                event: null,
            };
        case "event":
            return {
                id: entry.id,
                time: entry.time,
                direction: "event",
                bytes: new Uint8Array(),
                event: logEventOf(content.event),
            };
    }
}

/** The device log window. */
export class DeviceLogModel {
    private currentLines: readonly LogLine[] = [];
    private readonly log: DeviceLogUseCase;
    private readonly listeners = new Set<() => void>();

    constructor(log: DeviceLogUseCase) {
        this.log = log;
    }

    lines(): readonly LogLine[] {
        return this.currentLines;
    }

    clear(): void {
        this.log.clear();
    }

    /** Calls `listener` after every change, until the returned function is called. */
    subscribe(listener: () => void): () => void {
        const entry = () => listener();
        this.listeners.add(entry);
        return () => {
            this.listeners.delete(entry);
        };
    }

    /** Follows the log until the returned function is called. */
    start(): () => void {
        let stopped = false;
        const unsubscribe = this.log.entries().subscribe((entries) => {
            if (stopped) return;
            this.currentLines = entries.map(lineOf);
            for (const listener of [...this.listeners]) listener();
        });
        return () => {
            stopped = true;
            unsubscribe();
        };
    }
}
