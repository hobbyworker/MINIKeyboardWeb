// What the screens offer and show, in their own words. The domain's types stay behind the view model: views hand
// these back, and the view model turns them into the domain's.

import {
    ControlId,
    KeyColor,
    LightColor,
    MediaKey,
    Modifiers,
    type KeyAction,
    type KnobPart,
    type MouseAction,
} from "$domain";
import { ActionText, modifierNames } from "./state";
import { PALETTE } from "./tables/palette";

/** A modifier key, as the Keys page offers it. */
export type ModifierKey =
    "control" | "alt" | "shift" | "super" | "rightControl" | "rightAlt" | "rightShift" | "rightSuper";

const MODIFIER_KEYS: readonly ModifierKey[] = [
    "control",
    "alt",
    "shift",
    "super",
    "rightControl",
    "rightAlt",
    "rightShift",
    "rightSuper",
];

export const ModifierKey = {
    ALL: MODIFIER_KEYS,

    /** "Ctrl", or "RCtrl" for a right-hand one — in the current modifier style ("⌃" and "R⌃" on a Mac). */
    label(modifier: ModifierKey): string {
        const bits = modifiersOf(modifier);
        return modifierNames().find(([each]) => each === bits)?.[1] ?? "";
    },
};

export function modifiersOf(modifier: ModifierKey): Modifiers {
    switch (modifier) {
        case "control":
            return Modifiers.CONTROL;
        case "alt":
            return Modifiers.ALT;
        case "shift":
            return Modifiers.SHIFT;
        case "super":
            return Modifiers.SUPER;
        case "rightControl":
            return Modifiers.RIGHT_CONTROL;
        case "rightAlt":
            return Modifiers.RIGHT_ALT;
        case "rightShift":
            return Modifiers.RIGHT_SHIFT;
        case "rightSuper":
            return Modifiers.RIGHT_SUPER;
    }
}

/** A media key the app names. */
export type MediaChoice =
    | "playPause"
    | "stop"
    | "previousTrack"
    | "nextTrack"
    | "mute"
    | "volumeUp"
    | "volumeDown"
    | "brightnessUp"
    | "brightnessDown"
    | "bassUp"
    | "bassDown"
    | "trebleUp"
    | "trebleDown"
    | "mediaPlayer"
    | "email"
    | "calculator"
    | "myComputer"
    | "webHome"
    | "webBack"
    | "webForward"
    | "webRefresh";

const MEDIA_KEYS: readonly (readonly [MediaChoice, MediaKey])[] = [
    ["playPause", MediaKey.PLAY_PAUSE],
    ["stop", MediaKey.STOP],
    ["previousTrack", MediaKey.PREVIOUS_TRACK],
    ["nextTrack", MediaKey.NEXT_TRACK],
    ["mute", MediaKey.MUTE],
    ["volumeUp", MediaKey.VOLUME_UP],
    ["volumeDown", MediaKey.VOLUME_DOWN],
    ["brightnessUp", MediaKey.BRIGHTNESS_UP],
    ["brightnessDown", MediaKey.BRIGHTNESS_DOWN],
    ["bassUp", MediaKey.BASS_UP],
    ["bassDown", MediaKey.BASS_DOWN],
    ["trebleUp", MediaKey.TREBLE_UP],
    ["trebleDown", MediaKey.TREBLE_DOWN],
    ["mediaPlayer", MediaKey.MEDIA_PLAYER],
    ["email", MediaKey.EMAIL],
    ["calculator", MediaKey.CALCULATOR],
    ["myComputer", MediaKey.MY_COMPUTER],
    ["webHome", MediaKey.WEB_HOME],
    ["webBack", MediaKey.WEB_BACK],
    ["webForward", MediaKey.WEB_FORWARD],
    ["webRefresh", MediaKey.WEB_REFRESH],
];

export const MediaChoice = {
    ALL: MEDIA_KEYS.map(([choice]) => choice) as readonly MediaChoice[],
};

export function mediaKeyOf(choice: MediaChoice): MediaKey {
    const found = MEDIA_KEYS.find(([candidate]) => candidate === choice);
    if (found === undefined) throw new RangeError(`no media key for ${choice}`);
    return found[1];
}

/** The choice that names `key`; `null` for a media key the app has no name for. */
export function mediaChoiceOf(key: MediaKey): MediaChoice | null {
    return MEDIA_KEYS.find(([, candidate]) => candidate === key)?.[0] ?? null;
}

/** A mouse action. */
export type MouseChoice =
    | "leftClick"
    | "middleClick"
    | "rightClick"
    | "wheelUp"
    | "wheelDown"
    | "controlWheelUp"
    | "controlWheelDown"
    | "shiftWheelUp"
    | "shiftWheelDown"
    | "altWheelUp"
    | "altWheelDown";

const MOUSE_ACTIONS: readonly (readonly [MouseChoice, MouseAction])[] = [
    ["leftClick", "leftClick"],
    ["middleClick", "middleClick"],
    ["rightClick", "rightClick"],
    ["wheelUp", "wheelUp"],
    ["wheelDown", "wheelDown"],
    ["controlWheelUp", "controlWheelUp"],
    ["controlWheelDown", "controlWheelDown"],
    ["shiftWheelUp", "shiftWheelUp"],
    ["shiftWheelDown", "shiftWheelDown"],
    ["altWheelUp", "altWheelUp"],
    ["altWheelDown", "altWheelDown"],
];

export const MouseChoice = {
    ALL: MOUSE_ACTIONS.map(([choice]) => choice) as readonly MouseChoice[],
};

export function mouseActionOf(choice: MouseChoice): MouseAction {
    const found = MOUSE_ACTIONS.find(([candidate]) => candidate === choice);
    if (found === undefined) throw new RangeError(`no mouse action for ${choice}`);
    return found[1];
}

export function mouseChoiceOf(action: MouseAction): MouseChoice {
    const found = MOUSE_ACTIONS.find(([, candidate]) => candidate === action);
    if (found === undefined) throw new RangeError(`every mouse action has a choice: ${action}`);
    return found[0];
}

/** A colour a layer of a legacy-format or unidentified keyboard lights in. */
export type LedColor = "red" | "orange" | "yellow" | "green" | "cyan" | "blue" | "purple";

const LED_COLORS: readonly LedColor[] = ["red", "orange", "yellow", "green", "cyan", "blue", "purple"];

export const LedColor = {
    ALL: LED_COLORS,
};

export function lightColorOf(color: LedColor): LightColor {
    const light = LightColor.ALL[LED_COLORS.indexOf(color)];
    if (light === undefined) throw new RangeError(`no light colour for ${color}`);
    return light;
}

export function ledColorOf(color: LightColor): LedColor {
    const led = LED_COLORS[LightColor.code(color) - 1];
    if (led === undefined) throw new RangeError(`no LED colour for ${color}`);
    return led;
}

/** A key's colour on a keyboard that lights each key. */
export interface Rgb {
    readonly red: number;
    readonly green: number;
    readonly blue: number;
}

export const Rgb = {
    of(red: number, green: number, blue: number): Rgb {
        return { red, green, blue };
    },

    /** "#00FF00". */
    hex(rgb: Rgb): string {
        const hex = (value: number) => value.toString(16).toUpperCase().padStart(2, "0");
        return `#${hex(rgb.red)}${hex(rgb.green)}${hex(rgb.blue)}`;
    },

    /** The 56 swatches of the cross-platform app's RGB page (`LED_color_1` … `LED_color_56`). */
    PALETTE,
};

export function rgbOf(color: KeyColor): Rgb {
    return Rgb.of(color.red, color.green, color.blue);
}

export function keyColorOf(rgb: Rgb): KeyColor {
    return KeyColor.of(rgb.red, rgb.green, rgb.blue);
}

/** One action of a knob. */
export type KnobAction = "rotateLeft" | "press" | "rotateRight" | "pressRotateLeft" | "pressRotateRight";

export function knobActionOf(part: KnobPart): KnobAction {
    switch (part) {
        case "rotateLeft":
            return "rotateLeft";
        case "press":
            return "press";
        case "rotateRight":
            return "rotateRight";
        case "pressRotateLeft":
            return "pressRotateLeft";
        case "pressRotateRight":
            return "pressRotateRight";
    }
}

function knobPartOf(action: KnobAction): KnobPart {
    switch (action) {
        case "rotateLeft":
            return "rotateLeft";
        case "press":
            return "press";
        case "rotateRight":
            return "rotateRight";
        case "pressRotateLeft":
            return "pressRotateLeft";
        case "pressRotateRight":
            return "pressRotateRight";
    }
}

/** What a control is called: "Key 3", "Knob 1 · Press". */
export type ControlTitle =
    | { readonly kind: "key"; readonly number: number }
    | { readonly kind: "knob"; readonly number: number; readonly action: KnobAction };

/** A key or knob action on the keyboard, as views hand it back to the view model. */
export type ControlRef =
    | { readonly kind: "key"; readonly number: number }
    | { readonly kind: "knob"; readonly number: number; readonly action: KnobAction };

export const ControlRef = {
    key(number: number): ControlRef {
        return { kind: "key", number };
    },

    knob(number: number, action: KnobAction): ControlRef {
        return { kind: "knob", number, action };
    },

    title(control: ControlRef): ControlTitle {
        return control.kind === "key"
            ? { kind: "key", number: control.number }
            : { kind: "knob", number: control.number, action: control.action };
    },

    same(a: ControlRef, b: ControlRef): boolean {
        if (a.kind === "key") return b.kind === "key" && a.number === b.number;
        return b.kind === "knob" && a.number === b.number && a.action === b.action;
    },

    /** A string that names the control, for keyed lists: `key:1`, `knob:2:press`. */
    id(control: ControlRef): string {
        return control.kind === "key" ? `key:${control.number}` : `knob:${control.number}:${control.action}`;
    },
};

export function controlRefOf(control: ControlId): ControlRef {
    return control.kind === "key"
        ? ControlRef.key(control.number)
        : ControlRef.knob(control.number, knobActionOf(control.part));
}

export function controlIdOf(control: ControlRef): ControlId {
    return control.kind === "key"
        ? ControlId.key(control.number)
        : ControlId.knob(control.number, knobPartOf(control.action));
}

/** What a key does, as a key cap and the inspector show it. */
export type ActionCaption =
    /** The app doesn't know: the keyboard can't be read, or nobody has set it. */
    | { readonly kind: "unknown" }
    | { readonly kind: "nothing" }
    /** "Super+C ↵". */
    | { readonly kind: "presses"; readonly text: string }
    | { readonly kind: "media"; readonly choice: MediaChoice }
    /** A media key the app has no name for, by its consumer usage. */
    | { readonly kind: "otherMedia"; readonly usage: number }
    | { readonly kind: "mouse"; readonly choice: MouseChoice };

export const ActionCaption = {
    isAssigned(caption: ActionCaption): boolean {
        return caption.kind !== "unknown" && caption.kind !== "nothing";
    },
};

export function captionOf(action: KeyAction | null): ActionCaption {
    if (action === null) return { kind: "unknown" };
    switch (action.kind) {
        case "unassigned":
            return { kind: "nothing" };
        case "keys":
            return action.macro.strokes.length === 0
                ? { kind: "nothing" }
                : { kind: "presses", text: ActionText.keys(action.macro) };
        case "media": {
            const choice = mediaChoiceOf(action.key);
            return choice === null ? { kind: "otherMedia", usage: action.key } : { kind: "media", choice };
        }
        case "mouse":
            return { kind: "mouse", choice: mouseChoiceOf(action.action) };
    }
}
