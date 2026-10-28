import { describe, expect, it } from "vitest";
import {
    ConnectionState,
    ObserveAttachedKeyboardsUseCase,
    RequestKeyboardAccessUseCase,
    SelectKeyboardUseCase,
    UsbIdentity,
    once,
    type AttachedKeyboards,
    type ConnectedKeyboard,
    type KeyboardConnectionRepository,
} from "$domain";

/** A connection with one keyboard only, which needs no grant. */
class OneKeyboard implements KeyboardConnectionRepository {
    connectionStates() {
        return once<ConnectionState>({ kind: "searching" });
    }

    retry(): void {}
}

/** A connection that needs the user to grant each keyboard. */
class Granted extends OneKeyboard {
    requests = 0;

    async requestAccess(): Promise<string | null> {
        this.requests += 1;
        return "a";
    }
}

describe("connection", () => {
    it("a connection that needs no grant does nothing", async () => {
        await expect(new RequestKeyboardAccessUseCase(new OneKeyboard()).execute()).resolves.toBeNull();
        const granted = new Granted();
        await expect(new RequestKeyboardAccessUseCase(granted).execute()).resolves.toBe("a");
        expect(granted.requests).toBe(1);
    });

    it("a connection with one keyboard only has no others to choose from", () => {
        const seen: AttachedKeyboards[] = [];
        new ObserveAttachedKeyboardsUseCase(new OneKeyboard()).execute().subscribe((value) => seen.push(value));
        expect(seen).toEqual([{ keyboards: [], selected: null }]);
        expect(() => new SelectKeyboardUseCase(new OneKeyboard()).execute("a")).not.toThrow();
    });

    it("only a connected state has a keyboard", () => {
        const keyboard: ConnectedKeyboard = {
            usb: UsbIdentity.of(0x1189, 0x8840),
            interfaceNumber: 0,
            channel: "hid",
            reportId: 0,
            reportLength: 65,
            details: null,
        };
        expect(ConnectionState.keyboard({ kind: "connected", keyboard })).toBe(keyboard);
        expect(ConnectionState.keyboard({ kind: "unsupported" })).toBeNull();
        expect(ConnectionState.keyboard({ kind: "needsPermission" })).toBeNull();
    });
});
