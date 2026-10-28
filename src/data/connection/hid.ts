// The browser's HID devices, as the connection looks at and opens them — `navigator.hid` behind an interface small
// enough for tests to stand in for.

/** An input report as WebHID hands it over: its ID apart, then the bytes after it. */
export interface HidInputReport {
    readonly reportId: number;
    readonly data: DataView;
}

/** The part of a WebHID `HIDDevice` the connection uses. */
export interface HidDevice {
    readonly vendorId: number;
    readonly productId: number;
    readonly productName: string;
    readonly collections: readonly HIDCollectionInfo[];
    readonly opened: boolean;
    open(): Promise<void>;
    close(): Promise<void>;
    sendReport(reportId: number, data: Uint8Array<ArrayBuffer>): Promise<void>;
    addEventListener(type: "inputreport", listener: (report: HidInputReport) => void): void;
    removeEventListener(type: "inputreport", listener: (report: HidInputReport) => void): void;
}

/** A device granted to the page was plugged in or unplugged. */
export interface HidConnectionEvent {
    readonly device: HidDevice;
}

/** The part of `navigator.hid` the connection uses, and whether there is one. */
export interface HidSystem {
    /** Whether the page can reach HID devices: the browser has WebHID and the page is a secure context. */
    readonly isAvailable: boolean;

    /** The devices granted to the page and plugged in. */
    getDevices(): Promise<HidDevice[]>;

    /** Shows the browser's chooser; only from a click. Resolves with the devices granted. */
    requestDevice(options: HIDDeviceRequestOptions): Promise<HidDevice[]>;

    addEventListener(type: "connect" | "disconnect", listener: (event: HidConnectionEvent) => void): void;
    removeEventListener(type: "connect" | "disconnect", listener: (event: HidConnectionEvent) => void): void;
}

const UNAVAILABLE: HidSystem = {
    isAvailable: false,
    getDevices: () => Promise.resolve([]),
    requestDevice: () => Promise.resolve([]),
    addEventListener: () => {},
    removeEventListener: () => {},
};

/** The page's `navigator.hid`; one that can reach nothing when the browser has no WebHID or the page isn't secure. */
export function browserHidSystem(): HidSystem {
    const hid: HID | undefined =
        typeof navigator !== "undefined" && globalThis.isSecureContext === true ? navigator.hid : undefined;
    if (hid === undefined || hid === null) return UNAVAILABLE;
    return {
        isAvailable: true,
        getDevices: () => hid.getDevices(),
        requestDevice: (options) => hid.requestDevice(options),
        addEventListener: (type, listener) => hid.addEventListener(type, listener),
        removeEventListener: (type, listener) => hid.removeEventListener(type, listener),
    };
}
