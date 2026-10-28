import type { UsbIdentity } from "./keyboards";

/**
 * How the app reaches a keyboard's configuration interface.
 *
 * - `hid`: written and read as a HID device.
 * - `simulated`: a keyboard that exists only in the app.
 */
export type Channel = "hid" | "simulated";

/** A keyboard whose configuration interface the app has open. */
export interface ConnectedKeyboard {
    readonly usb: UsbIdentity;
    readonly interfaceNumber: number;
    readonly channel: Channel;
    /** The report ID the configuration goes after, from the interface's report descriptor. */
    readonly reportId: number;
    /** Bytes per output report, the report ID included. */
    readonly reportLength: number;
    /** What the USB device says about itself; `null` for a simulated keyboard. */
    readonly details: DeviceDetails | null;
}

/** A supported keyboard plugged in — one the app can open. Several can be plugged in; the app opens one at a time. */
export interface AttachedKeyboard {
    /** Which keyboard it is while it stays plugged in. */
    readonly id: string;
    readonly usb: UsbIdentity;
    /**
     * Where it is plugged in — a USB port path. These keyboards carry no serial number, so this is what tells two with
     * the same USB ID apart, and what finds the one chosen last time again.
     */
    readonly location: string;
}

/** The supported keyboards plugged in, in the order the app looks at them, and the one it opens. */
export interface AttachedKeyboards {
    readonly keyboards: readonly AttachedKeyboard[];
    /** The one open, being opened or that failed to open; `null` when none is plugged in. */
    readonly selected: string | null;
}

export const AttachedKeyboards = {
    NONE: { keyboards: [], selected: null } as AttachedKeyboards,
};

export type ConnectionState =
    | { readonly kind: "searching" }
    | { readonly kind: "connected"; readonly keyboard: ConnectedKeyboard }
    /**
     * The system lets the app open the keyboard only once it is allowed to — in a browser, once the user grants it
     * ({@link KeyboardConnectionRepository.requestAccess}).
     */
    | { readonly kind: "needsPermission" }
    /** Opening failed for another reason (an error code). */
    | { readonly kind: "openFailed"; readonly code: number }
    /** The browser can't reach USB keyboards at all: it has no WebHID, or the page is not a secure context. */
    | { readonly kind: "unsupported" };

export const ConnectionState = {
    keyboard(state: ConnectionState): ConnectedKeyboard | null {
        return state.kind === "connected" ? state.keyboard : null;
    },
};

/** Why a transfer with the keyboard failed. */
export type KeyboardDeviceErrorReason =
    /** No keyboard is open. */
    | { readonly kind: "notConnected" }
    /** A report could not be written (an error code). */
    | { readonly kind: "writeFailed"; readonly code: number }
    /** An answer did not come in time. */
    | { readonly kind: "noReply" }
    /** An answer was too short to read. */
    | { readonly kind: "invalidReply" }
    /** The keyboard has no command for this. */
    | { readonly kind: "unsupported" };

/** A transfer with the keyboard failed; {@link reason} says why. */
export class KeyboardDeviceError extends Error {
    readonly reason: KeyboardDeviceErrorReason;

    constructor(reason: KeyboardDeviceErrorReason) {
        super(describe(reason));
        this.name = "KeyboardDeviceError";
        this.reason = reason;
    }

    static notConnected(): KeyboardDeviceError {
        return new KeyboardDeviceError({ kind: "notConnected" });
    }

    static writeFailed(code: number): KeyboardDeviceError {
        return new KeyboardDeviceError({ kind: "writeFailed", code });
    }

    static noReply(): KeyboardDeviceError {
        return new KeyboardDeviceError({ kind: "noReply" });
    }

    static invalidReply(): KeyboardDeviceError {
        return new KeyboardDeviceError({ kind: "invalidReply" });
    }

    static unsupported(): KeyboardDeviceError {
        return new KeyboardDeviceError({ kind: "unsupported" });
    }
}

function describe(reason: KeyboardDeviceErrorReason): string {
    switch (reason.kind) {
        case "notConnected":
            return "no keyboard is open";
        case "writeFailed":
            return `a report could not be written (${reason.code})`;
        case "noReply":
            return "no answer came in time";
        case "invalidReply":
            return "an answer was too short";
        case "unsupported":
            return "the keyboard has no command for this";
    }
}

/**
 * What the USB device and its interfaces say about themselves — read from what the system already knows, never asked
 * of the keyboard. These keyboards carry no strings and their vendor IDs aren't the maker's, so nothing here is
 * guessed at.
 */
export interface DeviceDetails {
    /** `bcdUSB`, e.g. 0x0110; null where the system doesn't tell (a browser). */
    readonly usbVersion: number | null;
    /** `bcdDevice`; 0 on keyboards that don't say, null where the system doesn't tell. */
    readonly deviceRelease: number | null;
    /** Link speed in bits per second. */
    readonly speed: number | null;
    readonly manufacturer: string | null;
    readonly productName: string | null;
    readonly serialNumber: string | null;
    /** The most current the keyboard asks for, in mA (`bMaxPower`). */
    readonly maxPower: number | null;
    readonly interfaces: readonly DeviceInterface[];
}

export interface DeviceInterface {
    readonly number: number;
    readonly class: number;
    /** Null where the system doesn't tell (a browser). */
    readonly subclass: number | null;
    readonly protocol: number | null;
    /**
     * The (usage page, usage) of each top-level collection of the interface's HID report descriptor; empty when the
     * system made no HID device of it.
     */
    readonly usages: readonly UsagePair[];
}

export interface UsagePair {
    readonly page: number;
    readonly usage: number;
}
