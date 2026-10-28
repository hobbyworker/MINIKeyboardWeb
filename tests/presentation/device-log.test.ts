import { describe, expect, it } from "vitest";
import { DeviceLogUseCase, UsbIdentity, type DeviceLogEntry, type DeviceLogRepository, type Updates } from "$domain";
import { DeviceLogModel, LogLine } from "$presentation";
import { Sent } from "./fakes";

class FakeLog implements DeviceLogRepository {
    readonly sent = new Sent<readonly DeviceLogEntry[]>([]);
    cleared = 0;

    entries(): Updates<readonly DeviceLogEntry[]> {
        return this.sent;
    }

    clear(): void {
        this.cleared += 1;
    }
}

describe("the device log", () => {
    /** The window's lines follow the log, each kind of entry as the window shows it, until it stops. */
    it("the lines follow the log", () => {
        const log = new FakeLog();
        const model = new DeviceLogModel(new DeviceLogUseCase(log));
        let changes = 0;
        model.subscribe(() => (changes += 1));
        const stop = model.start();
        expect(changes).toBe(1);
        expect(model.lines()).toEqual([]);

        const report = new Uint8Array([0x03, 0xfb, 0xfb, 0xfb, 0, 0]);
        log.sent.send([
            {
                id: 1,
                time: 0,
                content: {
                    kind: "event",
                    event: { kind: "connected", usb: UsbIdentity.of(0x1189, 0x8840), interface: 0 },
                },
            },
            { id: 2, time: 0, content: { kind: "output", bytes: report } },
            { id: 3, time: 0, content: { kind: "input", bytes: new Uint8Array([0x01]) } },
            { id: 4, time: 0, content: { kind: "event", event: { kind: "simulated", modelId: "1189:8840-6-1-10" } } },
            { id: 5, time: 0, content: { kind: "event", event: { kind: "searching" } } },
            { id: 6, time: 0, content: { kind: "event", event: { kind: "needsPermission" } } },
            { id: 7, time: 0, content: { kind: "event", event: { kind: "openFailed", code: -1 } } },
            { id: 8, time: 0, content: { kind: "event", event: { kind: "writeFailed", code: -2 } } },
        ]);
        expect(changes).toBe(2);

        const lines = model.lines();
        expect(lines.map((line) => line.id)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
        expect(lines.map((line) => line.direction)).toEqual([
            "event",
            "output",
            "input",
            "event",
            "event",
            "event",
            "event",
            "event",
        ]);
        const [connected, output, input, simulated] = lines;
        if (!connected || !output || !input || !simulated) throw new Error("lines missing");
        expect(connected.event).toEqual({ kind: "connected", usb: "1189:8840", interface: 0 });
        expect(connected.bytes.length).toBe(0);
        expect(LogLine.summary(output)).toBe("03 FB FB FB");
        expect(LogLine.isShortened(output)).toBe(true);
        expect(LogLine.hex(output)).toBe("03 FB FB FB 00 00");
        expect(LogLine.rows(output)).toEqual(["0000  03 FB FB FB 00 00"]);
        expect(LogLine.isShortened(input)).toBe(false);
        expect(simulated.event).toEqual({ kind: "simulated", id: "1189:8840-6-1-10" });
        expect(lines.slice(4).map((line) => line.event)).toEqual([
            { kind: "searching" },
            { kind: "needsPermission" },
            { kind: "openFailed", code: -1 },
            { kind: "writeFailed", code: -2 },
        ]);

        model.clear();
        expect(log.cleared).toBe(1);
        stop();
        expect(log.sent.listening()).toBe(0);
        log.sent.send([]);
        expect(model.lines().length).toBe(8);
        expect(changes).toBe(2);
    });
});
