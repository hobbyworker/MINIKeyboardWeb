import { formatUsbIdentity, KeyboardIdentity, UsbIdentity, type RecordFormat } from "./keyboards";
import { KeyboardLayout, type Rotation } from "./layout";

/** The layout a user chose for a keyboard that doesn't say its shape, and how the keyboard is turned. */
export interface LayoutProfile {
    readonly layoutId: string;
    readonly rotation: Rotation;
}

/**
 * Where the layout drawn for the connected keyboard came from.
 *
 * - `identified`: the keyboard said how many keys and knobs it has.
 * - `chosen`: the user chose it.
 * - `assumed`: nobody has chosen one yet: what the keyboard's vendor tool draws for a keyboard it knows nothing of.
 */
export type Source = "identified" | "chosen" | "assumed";

/** The layout the app draws for the connected keyboard, and where it came from. */
export interface ResolvedLayout {
    readonly layout: KeyboardLayout;
    readonly rotation: Rotation;
    readonly source: Source;
    /** The cross-platform app's layouts the user may choose from; empty when the keyboard said its shape. */
    readonly choices: readonly KeyboardLayout[];
}

export const ResolvedLayout = {
    needsChoice(resolved: ResolvedLayout): boolean {
        return resolved.source === "assumed";
    },
};

/** What one line of the device log holds. */
export type LogContent =
    /** A report written to the keyboard, its report ID first unless it is 0. */
    | { readonly kind: "output"; readonly bytes: Uint8Array }
    /** A report the keyboard sent. */
    | { readonly kind: "input"; readonly bytes: Uint8Array }
    | { readonly kind: "event"; readonly event: DeviceLogEvent };

/** One line of the device log: a report written or read — every byte of it — or something that happened. */
export interface DeviceLogEntry {
    /** Counts up from 1 as lines are added. */
    readonly id: number;
    /** Milliseconds since the Unix epoch. */
    readonly time: number;
    readonly content: LogContent;
}

/** What happened to the connection, for the device log. */
export type DeviceLogEvent =
    | { readonly kind: "searching" }
    | { readonly kind: "connected"; readonly usb: UsbIdentity; readonly interface: number }
    | { readonly kind: "needsPermission" }
    | { readonly kind: "openFailed"; readonly code: number }
    | { readonly kind: "writeFailed"; readonly code: number }
    /** A simulated keyboard took the place of the one on USB. */
    | { readonly kind: "simulated"; readonly modelId: string };

/** Which keyboard the app talks to: the one on USB, or one that exists only in the app. */
export type KeyboardSource =
    { readonly kind: "hardware" } | { readonly kind: "simulated"; readonly model: SimulatedModel };

export const KeyboardSource = {
    HARDWARE: { kind: "hardware" } as Extract<KeyboardSource, { kind: "hardware" }>,

    isSimulated(source: KeyboardSource): boolean {
        return source.kind === "simulated";
    },
};

/**
 * What a simulated keyboard is.
 *
 * - `identified`: a keyboard that answers identification.
 * - `unidentified`: a keyboard that doesn't.
 */
export type SimulatedKind =
    { readonly kind: "identified"; readonly identity: KeyboardIdentity } | { readonly kind: "unidentified" };

/** A keyboard the simulator plays: its USB ID and, for a keyboard that answers identification, what it says about itself. */
export interface SimulatedModel {
    readonly usb: UsbIdentity;
    readonly kind: SimulatedKind;
}

export const SimulatedModel = {
    id(model: SimulatedModel): string {
        const usb = formatUsbIdentity(model.usb);
        if (model.kind.kind === "unidentified") return `${usb}-unidentified`;
        const identity = model.kind.identity;
        return `${usb}-${identity.keyCount}-${identity.knobCount}-${identity.kind}`;
    },

    /** Every layout a keyboard can be identified as on each format, then a keyboard that doesn't answer. */
    all(): SimulatedModel[] {
        const models: SimulatedModel[] = [];
        for (const format of ["standard", "legacy"] as const) {
            for (const layout of KeyboardLayout.all()) {
                const model = SimulatedModel.identifiedAs(layout, format);
                if (model !== null) models.push(model);
            }
        }
        models.push({ usb: UsbIdentity.of(0x1189, 0x8840), kind: { kind: "unidentified" } });
        return models;
    },

    /**
     * A keyboard that says what makes the cross-platform app draw `layout` with `format`: kind 10 for the standard
     * format, 0 or 1 for the legacy one, with a product ID the rule looks at. `null` when no answer leads there — 4add1
     * and 4add2 exist only on the legacy format.
     */
    identifiedAs(layout: KeyboardLayout, format: RecordFormat): SimulatedModel | null {
        const candidates: readonly (readonly [number, number])[] =
            format === "standard"
                ? [
                      [10, 0x8840],
                      [10, 0x8850],
                      [10, 0x8851],
                  ]
                : [
                      [0, 0x8840],
                      [0, 0x8850],
                      [0, 0x8851],
                      [1, 0x8840],
                  ];
        const keys = KeyboardLayout.keyCount(layout);
        const knobs = KeyboardLayout.knobCount(layout);
        if (keys > 0xff || knobs > 0xff) return null;
        for (const [kind, productId] of candidates) {
            const identity = KeyboardIdentity.of(keys, knobs, kind);
            if (KeyboardLayout.identifiedId(identity, productId) === layout.id) {
                // 8851 is played under 514C, as before 1189:8851 was looked for — the models keep their IDs.
                const vendor = productId === 0x8851 ? 0x514c : 0x1189;
                return { usb: UsbIdentity.of(vendor, productId), kind: { kind: "identified", identity } };
            }
        }
        return null;
    },
};
