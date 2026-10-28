/**
 * A USB device's vendor and product IDs. These keyboards carry no name or serial number, so this is all there is to
 * tell them apart by.
 */
export interface UsbIdentity {
    readonly vendorId: number;
    readonly productId: number;
}

export const UsbIdentity = {
    of(vendorId: number, productId: number): UsbIdentity {
        return { vendorId, productId };
    },
};

/** "1189:8840". */
export function formatUsbIdentity(usb: UsbIdentity): string {
    const hex = (value: number) => value.toString(16).toUpperCase().padStart(4, "0");
    return `${hex(usb.vendorId)}:${hex(usb.productId)}`;
}

export function sameUsbIdentity(a: UsbIdentity, b: UsbIdentity): boolean {
    return a.vendorId === b.vendorId && a.productId === b.productId;
}

const PRODUCTS = [0x8842, 0x8840, 0x8830, 0x8831, 0x8832, 0x8833, 0x8850, 0x8851];

/**
 * Every keyboard the app looks for, in the order it looks: the keyboards of the vendor's cross-platform app, vendor
 * 1189 or 514C with product 8842, 8840, 8830–8833, 8850 or 8851 — all eight under each vendor, as the app looks for
 * them. They are configured through 64-byte reports on interface 0; most say how many keys and knobs they have and
 * read back what they hold.
 */
export const SUPPORTED_KEYBOARDS: readonly UsbIdentity[] = [0x1189, 0x514c].flatMap((vendor) =>
    PRODUCTS.map((product) => UsbIdentity.of(vendor, product)),
);

export function isSupportedKeyboard(usb: UsbIdentity): boolean {
    return SUPPORTED_KEYBOARDS.some((supported) => sameUsbIdentity(supported, usb));
}

/** The USB interface that takes the configuration. */
export const CONFIGURATION_INTERFACE = 0;

/**
 * How a keyboard stores a key's action — the commands a connected keyboard takes, settled once it is connected and
 * identified.
 *
 * - `standard`: firmware that answers identification with type 10 or above: `FD` records of three-byte entries — a
 *   delay and a code, every modifier an entry of its own. They read back.
 * - `legacy`: firmware that answers with a type below 10: `FD` records of (modifier, key) pairs and one delay for the
 *   whole key. They read back.
 * - `unidentified`: a keyboard that does not answer identification: `FE` records of (modifier, key) pairs, written the
 *   way keyboards of the 1189:8840 kind are known to take them. Nothing reads back.
 */
export type RecordFormat = "standard" | "legacy" | "unidentified";

/** What a keyboard answers when asked who it is (`FB FB FB`). */
export interface KeyboardIdentity {
    readonly keyCount: number;
    readonly knobCount: number;
    /**
     * 10 or above for the standard record format, below 10 for the legacy one, as the cross-platform app tells them
     * apart. On a keyboard of four keys and a knob it also picks between two layouts.
     */
    readonly kind: number;
}

/** The types {@link KeyboardIdentity.isKnownType} knows. */
const KNOWN_TYPES: readonly number[] = [0, 1, 10, 11];

export const KeyboardIdentity = {
    of(keyCount: number, knobCount: number, kind: number): KeyboardIdentity {
        return { keyCount, knobCount, kind };
    },

    recordFormat(identity: KeyboardIdentity): RecordFormat {
        return identity.kind >= 10 ? "standard" : "legacy";
    },

    /**
     * Whether the type is one the app's rules come from or were tried with: 0 and 1, which pick one of the
     * cross-platform app's two layouts of four keys and a knob; 10, its standard firmware; and 11, a 514C:8850 tried
     * with the app. Any other is taken by the same rule ({@link recordFormat}) — this only marks it.
     */
    isKnownType(identity: KeyboardIdentity): boolean {
        return KNOWN_TYPES.includes(identity.kind);
    },
};

/** What the app learned about a keyboard once it was connected. */
export interface KeyboardIdentification {
    readonly format: RecordFormat;
    /** What the keyboard said about itself; `null` on a keyboard that did not answer. */
    readonly identity: KeyboardIdentity | null;
}
