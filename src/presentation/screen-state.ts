// What each part of the window draws, in the presentation's own types.

import {
    KeyboardIdentity,
    SimulatedModel,
    formatUsbIdentity,
    type ConnectedKeyboard,
    type DeviceDetails,
    type DeviceInterface,
    type KeyboardIdentification,
} from "$domain";
import type {
    ActionCaption,
    ControlRef,
    ControlTitle,
    KnobAction,
    LedColor,
    MediaChoice,
    ModifierKey,
    MouseChoice,
    Rgb,
} from "./choices";
import type { LayoutGeometry } from "./drawing/geometry";
import type { LayoutRect } from "./drawing/rect";
import { FULL_KEYBOARD_WIDTH } from "./tables/full-keyboard";
import { KeyUsage } from "./tables/key-usages";

/** The keyboard as the main window draws it: its body and every control, turned the way it sits. */
export interface KeyboardDrawing {
    readonly frame: LayoutRect;
    readonly bounds: LayoutRect;
    readonly controls: readonly ControlDrawing[];
}

export type ControlFace =
    { readonly kind: "key"; readonly number: number } | { readonly kind: "knob"; readonly action: KnobAction };

export interface ControlDrawing {
    readonly control: ControlRef;
    readonly face: ControlFace;
    readonly rect: LayoutRect;
    readonly caption: ActionCaption;
    readonly isSelected: boolean;
    readonly isChanged: boolean;
    /** The key's colour, on the LED page of a keyboard that lights each key. */
    readonly ledColor: Rgb | null;
}

/** A keyboard's shape drawn small, for choosing one: keys, and each knob as one body. */
export interface ShapeDrawing {
    readonly frame: LayoutRect;
    readonly bounds: LayoutRect;
    readonly items: readonly ShapeItem[];
}

export interface ShapeItem {
    readonly rect: LayoutRect;
    readonly isKnob: boolean;
}

export function shapeDrawingOf(geometry: LayoutGeometry): ShapeDrawing {
    const keys: { number: number; rect: LayoutRect }[] = [];
    for (const { control, rect } of geometry.rects.values()) {
        if (control.kind === "key") keys.push({ number: control.number, rect });
    }
    keys.sort((a, b) => a.number - b.number);
    const items: ShapeItem[] = [
        ...keys.map(({ rect }) => ({ rect, isKnob: false })),
        ...geometry.knobOutlines().map(([, rect]) => ({ rect, isKnob: true })),
    ];
    return { frame: geometry.frame, bounds: geometry.bounds(), items };
}

/** The header's account of the keyboard. */
export type ConnectionStatus =
    | { readonly kind: "searching" }
    | { readonly kind: "needsPermission" }
    | { readonly kind: "openFailed"; readonly code: number }
    /** The browser can't reach USB keyboards: it has no WebHID, or the page is not a secure context. */
    | { readonly kind: "unsupported" }
    /** `keys` and `knobs` are what the keyboard said, when it said. */
    | {
          readonly kind: "connected";
          readonly usb: string;
          readonly keys: number | null;
          readonly knobs: number | null;
          readonly isIdentified: boolean;
          readonly isSimulated: boolean;
      };

/** The inspector's account of the selected control. */
export interface SelectionState {
    readonly title: ControlTitle;
    /** Shown when the keyboard has layers. */
    readonly layerNumber: number | null;
    readonly binding: BindingState;
}

export type BindingState =
    | { readonly kind: "unknown" }
    | { readonly kind: "nothing" }
    /** Each press as text, the wait for the whole key, and how many places the presses take of the limit. */
    | {
          readonly kind: "presses";
          readonly strokes: readonly string[];
          readonly keyDelay: number;
          readonly used: number;
          readonly limit: number;
      }
    | { readonly kind: "media"; readonly choice: MediaChoice }
    | { readonly kind: "otherMedia"; readonly usage: number }
    | { readonly kind: "mouse"; readonly choice: MouseChoice };

/**
 * How the Keys page lays out the keys.
 *
 * - `qwerty`: as on a full-size keyboard — the cross-platform app's page.
 * - `alphabetical`: in groups, the letters in alphabetical order — the Windows tool's page.
 */
export type KeyArrangement = "qwerty" | "alphabetical";

export type BoardFace =
    | { readonly kind: "key"; readonly key: KeyUsage }
    /** Held for the next key, as in the modifier row of the other arrangement. */
    | { readonly kind: "modifier"; readonly modifier: ModifierKey };

/** One cap of the full-size keyboard, placed in key widths. */
export interface BoardCap {
    readonly face: BoardFace;
    readonly row: number;
    /** From the left edge. */
    readonly column: number;
    readonly width: number;
    /** Off for a key the keyboard isn't given; it stays in its place. */
    readonly isEnabled: boolean;
}

export const BoardCap = {
    /** A row's width, in key widths. */
    ROW_WIDTH: FULL_KEYBOARD_WIDTH,
};

export type KeyGroupKind = "letters" | "numbers" | "editing" | "symbols" | "functionKeys" | "navigation" | "numpad";

export const KeyGroupKind = {
    ALL: [
        "letters",
        "numbers",
        "editing",
        "symbols",
        "functionKeys",
        "navigation",
        "numpad",
    ] as readonly KeyGroupKind[],
};

export function keysOf(kind: KeyGroupKind): readonly KeyUsage[] {
    switch (kind) {
        case "letters":
            return KeyUsage.LETTERS;
        case "numbers":
            return KeyUsage.DIGITS;
        case "editing":
            return KeyUsage.EDITING;
        case "symbols":
            return [...KeyUsage.SYMBOLS, ...KeyUsage.INTERNATIONAL];
        case "functionKeys":
            return [...KeyUsage.FUNCTION_KEYS, ...KeyUsage.EXTRA_FUNCTION_KEYS];
        case "navigation":
            return [...KeyUsage.SYSTEM, ...KeyUsage.NAVIGATION];
        case "numpad":
            return KeyUsage.KEYPAD;
    }
}

/** A group of keys in the alphabetical arrangement, with only the keys the keyboard is given. */
export interface KeyGroup {
    readonly kind: KeyGroupKind;
    readonly keys: readonly KeyUsage[];
}

/** The LED page, in the form the keyboard takes. */
export type LightingPage =
    | {
          readonly kind: "colorAndMode";
          readonly colors: readonly LedColor[];
          readonly modes: readonly number[];
          readonly activeColor: LedColor | null;
          readonly activeMode: number | null;
      }
    | {
          readonly kind: "perKeyColor";
          readonly modes: readonly number[];
          readonly activeMode: number | null;
          readonly keys: number;
          readonly selected: KeyColorSelection | null;
      };

export interface KeyColorSelection {
    readonly title: ControlTitle;
    readonly color: Rgb;
}

/** Milliseconds, both ends included. */
export interface DelayRange {
    readonly start: number;
    readonly end: number;
}

/** The Delay page. */
export type DelayPage =
    | { readonly kind: "unavailable" }
    /** The selected key's presses, each with its wait; empty when it has none. */
    | { readonly kind: "perPress"; readonly range: DelayRange; readonly presses: readonly PressDelay[] }
    /** The selected key's one wait; `null` when no key is selected. */
    | { readonly kind: "perKey"; readonly range: DelayRange; readonly value: number | null };

export interface PressDelay {
    readonly index: number;
    readonly text: string;
    readonly delay: number;
}

/** The layout sheet. */
export interface LayoutSheetState {
    readonly usb: string;
    /** What the keyboard said of its keys and knobs, when it said. */
    readonly reportedKeys: number | null;
    readonly reportedKnobs: number | null;
    readonly mode: LayoutSheetMode;
    /** Quarter turns clockwise, 0–3. */
    readonly quarterTurns: number;
    /** The first time: no Cancel. */
    readonly isRequired: boolean;
}

export type LayoutSheetMode =
    /** The keyboard said its shape: it only turns. */
    | { readonly kind: "fixed" }
    /** One of the cross-platform app's layouts. */
    | { readonly kind: "catalog"; readonly choices: readonly LayoutChoice[]; readonly selectedId: string };

export interface LayoutChoice {
    readonly id: string;
    readonly keys: number;
    readonly knobs: number;
    readonly drawing: ShapeDrawing;
}

/**
 * What is known about the keyboard plugged in — from what the system says of the USB device and, on keyboards that
 * answer, from the answer. Nothing is guessed: what the keyboard or the browser doesn't say is `null`.
 */
export interface KeyboardInfo {
    readonly usbId: string;
    readonly name: string | null;
    readonly manufacturer: string | null;
    readonly serialNumber: string | null;
    readonly firmware: Firmware;
    /** "USB 1.1 · 12 Mb/s". */
    readonly usb: string | null;
    /** mA. */
    readonly power: number | null;
    readonly interfaces: readonly InfoInterface[];
    readonly channel: InfoChannel;
    readonly commands: InfoCommands;
}

export type Firmware =
    /** What the keyboard answered: the type, keys and knobs — and whether the app's rules were tried with the type. */
    | {
          readonly kind: "reported";
          readonly type: number;
          readonly keys: number;
          readonly knobs: number;
          readonly isTested: boolean;
      }
    /** `bcdDevice`, "1.02". */
    | { readonly kind: "release"; readonly version: string }
    | { readonly kind: "unknown" };

export interface InfoInterface {
    readonly number: number;
    readonly roles: readonly InterfaceRole[];
    /** The interface the app writes to. */
    readonly isConfiguration: boolean;
}

/** The interface the app writes to, and how. */
export interface InfoChannel {
    readonly interface: number;
    readonly path: ChannelPath;
    readonly reportId: number;
    /** Bytes, the report ID included. */
    readonly reportLength: number;
}

/**
 * - `hid`: through the HID device the system made of the interface.
 * - `simulated`: a keyboard that exists only in the app.
 */
export type ChannelPath = "hid" | "simulated";

/**
 * The records the keyboard takes: on the standard firmware, the legacy one, or one that doesn't answer; `unknown` while
 * it isn't known yet.
 */
export type InfoCommands = "standard" | "legacy" | "unidentified" | "unknown";

export type InterfaceRole = "keyboard" | "mouse" | "media" | "configuration" | "other";

export function keyboardInfoOf(
    keyboard: ConnectedKeyboard,
    identification: KeyboardIdentification | null,
): KeyboardInfo {
    const details = keyboard.details;
    const identity = identification?.identity ?? null;
    let firmware: Firmware;
    if (identity !== null) {
        firmware = {
            kind: "reported",
            type: identity.kind,
            keys: identity.keyCount,
            knobs: identity.knobCount,
            isTested: KeyboardIdentity.isKnownType(identity),
        };
    } else if (details !== null && details.deviceRelease !== null && details.deviceRelease !== 0) {
        const release = details.deviceRelease;
        const minor = (release & 0xff).toString(16).toUpperCase().padStart(2, "0");
        firmware = { kind: "release", version: `${(release >> 8).toString(16).toUpperCase()}.${minor}` };
    } else {
        firmware = { kind: "unknown" };
    }
    const interfaces = (details?.interfaces ?? []).map((info) => ({
        number: info.number,
        roles: rolesOf(info, keyboard.interfaceNumber),
        isConfiguration: info.number === keyboard.interfaceNumber,
    }));
    return {
        usbId: formatUsbIdentity(keyboard.usb),
        name: provided(details?.productName),
        manufacturer: provided(details?.manufacturer),
        serialNumber: provided(details?.serialNumber),
        firmware,
        usb: details !== null && details.usbVersion !== null ? usbText(details, details.usbVersion) : null,
        power: details?.maxPower ?? null,
        interfaces,
        channel: {
            interface: keyboard.interfaceNumber,
            path: keyboard.channel,
            reportId: keyboard.reportId,
            reportLength: keyboard.reportLength,
        },
        commands: identification?.format ?? "unknown",
    };
}

/** A string the device gave, or `null` for none or an empty one. */
function provided(text: string | null | undefined): string | null {
    return text === null || text === undefined || text === "" ? null : text;
}

/**
 * What an interface is for, by the usages of its HID device, or by its descriptor when the system made no HID device
 * of it.
 */
export function rolesOf(info: DeviceInterface, configuration: number): InterfaceRole[] {
    const roles: InterfaceRole[] = [];
    for (const pair of info.usages) {
        let role: InterfaceRole;
        if (pair.page === 0x01 && pair.usage === 0x06) role = "keyboard";
        else if (pair.page === 0x01 && (pair.usage === 0x01 || pair.usage === 0x02)) role = "mouse";
        else if (pair.page === 0x0c) role = "media";
        else if (pair.page >= 0xff00) role = "configuration";
        else role = "other";
        if (!roles.includes(role)) roles.push(role);
    }
    if (roles.length === 0 && info.number === configuration) roles.push("configuration");
    if (roles.length === 0) {
        const descriptor = `${info.class}/${info.subclass}/${info.protocol}`;
        roles.push(descriptor === "3/1/1" ? "keyboard" : descriptor === "3/1/2" ? "mouse" : "other");
    }
    return roles;
}

export function usbText(details: DeviceDetails, version: number): string {
    const [major, minor, sub] = [(version >> 8) & 0xff, (version >> 4) & 0x0f, version & 0x0f];
    const hex = (value: number) => value.toString(16).toUpperCase();
    let text = `USB ${hex(major)}.${hex(minor)}`;
    if (sub !== 0) text += `.${hex(sub)}`;
    const speed = details.speed;
    if (speed !== null) {
        if (speed >= 1_000_000_000) text += ` · ${Math.floor(speed / 1_000_000_000)} Gb/s`;
        else if (speed >= 1_000_000) text += ` · ${Math.floor(speed / 1_000_000)} Mb/s`;
        else text += ` · ${Math.floor(speed / 1000)} kb/s`;
    }
    return text;
}

export type SimulatorGroup = "standard" | "legacy" | "unidentified";

export const SimulatorGroup = {
    ALL: ["standard", "legacy", "unidentified"] as readonly SimulatorGroup[],
};

/** What the simulated keyboard is; the menu names it. */
export type SimulatorKind =
    /** It answers with these — `type` 10 for the standard records — on this USB ID. */
    | {
          readonly kind: "identified";
          readonly keys: number;
          readonly knobs: number;
          readonly type: number;
          readonly usb: string;
      }
    /** It doesn't answer. */
    | { readonly kind: "unidentified"; readonly usb: string };

/** One of the keyboards plugged in, to choose which the app opens. */
export interface KeyboardChoice {
    readonly id: string;
    /** Its USB ID, numbered by port when several have the same one. */
    readonly title: string;
    readonly isSelected: boolean;
}

/** A keyboard the simulator can play. */
export interface SimulatorChoice {
    readonly id: string;
    readonly group: SimulatorGroup;
    readonly kind: SimulatorKind;
}

export const SimulatorChoice = {
    /**
     * Whether everyone's menu has it, not only a development build's: each layout on its standard records, and a
     * keyboard that doesn't answer. The legacy records are for testing the app.
     */
    isForEveryone(choice: SimulatorChoice): boolean {
        return choice.group !== "legacy";
    },
};

export function simulatorChoiceOf(model: SimulatedModel): SimulatorChoice {
    const usb = formatUsbIdentity(model.usb);
    const id = SimulatedModel.id(model);
    if (model.kind.kind === "unidentified") return { id, group: "unidentified", kind: { kind: "unidentified", usb } };
    const identity = model.kind.identity;
    return {
        id,
        group: KeyboardIdentity.recordFormat(identity) === "standard" ? "standard" : "legacy",
        kind: {
            kind: "identified",
            keys: identity.keyCount,
            knobs: identity.knobCount,
            type: identity.kind,
            usb,
        },
    };
}
