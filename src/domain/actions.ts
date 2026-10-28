import { structurallyEqual } from "./equality";

/**
 * The modifier keys of a key press, as the bits of a HID keyboard report (usages 0xE0–0xE7). The vendor tools call
 * Super "Win". A union of modifiers is `a | b`; toggling is `a ^ b`.
 */
export type Modifiers = number;

const EACH: readonly Modifiers[] = [0x01, 0x02, 0x04, 0x08, 0x10, 0x20, 0x40, 0x80];

export const Modifiers = {
    NONE: 0x00 as Modifiers,
    CONTROL: 0x01 as Modifiers,
    SHIFT: 0x02 as Modifiers,
    ALT: 0x04 as Modifiers,
    SUPER: 0x08 as Modifiers,
    RIGHT_CONTROL: 0x10 as Modifiers,
    RIGHT_SHIFT: 0x20 as Modifiers,
    RIGHT_ALT: 0x40 as Modifiers,
    RIGHT_SUPER: 0x80 as Modifiers,

    /** Each modifier on its own, lowest bit first. */
    EACH,

    contains(modifiers: Modifiers, other: Modifiers): boolean {
        return (modifiers & other) === other;
    },

    /** The modifiers set here, lowest bit first. */
    members(modifiers: Modifiers): Modifiers[] {
        return EACH.filter((modifier) => (modifiers & modifier) === modifier);
    },

    count(modifiers: Modifiers): number {
        return EACH.filter((modifier) => (modifiers & modifier) === modifier).length;
    },
};

/**
 * One press: modifiers held while a key goes down. A key of 0 holds the modifiers alone, which turns the keyboard key
 * into a modifier key — so such a press is only ever a key's whole action.
 */
export interface KeyStroke {
    readonly modifiers: Modifiers;
    /** The key's usage on the HID keyboard page, or 0 for none. */
    readonly key: number;
    /** Milliseconds to wait before this press. Only standard-format keyboards keep it. */
    readonly delay: number;
}

export const KeyStroke = {
    of(modifiers: Modifiers, key: number): KeyStroke {
        return { modifiers, key, delay: 0 };
    },

    key(key: number): KeyStroke {
        return { modifiers: Modifiers.NONE, key, delay: 0 };
    },

    withDelay(stroke: KeyStroke, delay: number): KeyStroke {
        return { ...stroke, delay };
    },

    isModifiersOnly(stroke: KeyStroke): boolean {
        return stroke.key === 0;
    },
};

/** Key presses one keyboard key sends, in order. */
export interface KeyMacro {
    readonly strokes: readonly KeyStroke[];
    /** Milliseconds to wait, for the whole key. Only legacy-format keyboards keep it. */
    readonly delay: number;
}

export const KeyMacro = {
    EMPTY: { strokes: [], delay: 0 } as KeyMacro,

    of(strokes: readonly KeyStroke[], delay = 0): KeyMacro {
        return { strokes, delay };
    },

    /** One modifiers-only press, or nothing at all, but never one among others. */
    isWellFormed(macro: KeyMacro): boolean {
        return macro.strokes.length <= 1 || !macro.strokes.some(KeyStroke.isModifiersOnly);
    },
};

/** What a keyboard key or knob action does. */
export type KeyAction =
    /** Nothing: the key is cleared. */
    | { readonly kind: "unassigned" }
    | { readonly kind: "keys"; readonly macro: KeyMacro }
    | { readonly kind: "media"; readonly key: MediaKey }
    | { readonly kind: "mouse"; readonly action: MouseAction };

export const KeyAction = {
    UNASSIGNED: { kind: "unassigned" } as Extract<KeyAction, { kind: "unassigned" }>,

    keys(macro: KeyMacro): Extract<KeyAction, { kind: "keys" }> {
        return { kind: "keys", macro };
    },

    media(key: MediaKey): Extract<KeyAction, { kind: "media" }> {
        return { kind: "media", key };
    },

    mouse(action: MouseAction): Extract<KeyAction, { kind: "mouse" }> {
        return { kind: "mouse", action };
    },
};

export function sameAction(a: KeyAction, b: KeyAction): boolean {
    return structurallyEqual(a, b);
}

/** A key on the HID consumer page — media and application keys — as its consumer-page usage. */
export type MediaKey = number;

const MEDIA_KEYS = {
    PLAY_PAUSE: 0xcd as MediaKey,
    STOP: 0xb7 as MediaKey,
    PREVIOUS_TRACK: 0xb6 as MediaKey,
    NEXT_TRACK: 0xb5 as MediaKey,
    MUTE: 0xe2 as MediaKey,
    VOLUME_UP: 0xe9 as MediaKey,
    VOLUME_DOWN: 0xea as MediaKey,
    BRIGHTNESS_UP: 0x6f as MediaKey,
    BRIGHTNESS_DOWN: 0x70 as MediaKey,
    BASS_UP: 0x152 as MediaKey,
    BASS_DOWN: 0x153 as MediaKey,
    TREBLE_UP: 0x154 as MediaKey,
    TREBLE_DOWN: 0x155 as MediaKey,
    MEDIA_PLAYER: 0x183 as MediaKey,
    EMAIL: 0x18a as MediaKey,
    CALCULATOR: 0x192 as MediaKey,
    MY_COMPUTER: 0x194 as MediaKey,
    WEB_HOME: 0x223 as MediaKey,
    WEB_BACK: 0x224 as MediaKey,
    WEB_FORWARD: 0x225 as MediaKey,
    WEB_REFRESH: 0x227 as MediaKey,
};

export const MediaKey = {
    ...MEDIA_KEYS,

    /** The cross-platform app's media buttons, in its order. */
    ALL: [
        MEDIA_KEYS.PLAY_PAUSE,
        MEDIA_KEYS.STOP,
        MEDIA_KEYS.PREVIOUS_TRACK,
        MEDIA_KEYS.NEXT_TRACK,
        MEDIA_KEYS.MY_COMPUTER,
        MEDIA_KEYS.BRIGHTNESS_UP,
        MEDIA_KEYS.BRIGHTNESS_DOWN,
        MEDIA_KEYS.MEDIA_PLAYER,
        MEDIA_KEYS.MUTE,
        MEDIA_KEYS.VOLUME_UP,
        MEDIA_KEYS.VOLUME_DOWN,
        MEDIA_KEYS.CALCULATOR,
        MEDIA_KEYS.WEB_HOME,
        MEDIA_KEYS.EMAIL,
        MEDIA_KEYS.BASS_UP,
        MEDIA_KEYS.BASS_DOWN,
        MEDIA_KEYS.TREBLE_UP,
        MEDIA_KEYS.TREBLE_DOWN,
        MEDIA_KEYS.WEB_REFRESH,
        MEDIA_KEYS.WEB_FORWARD,
        MEDIA_KEYS.WEB_BACK,
    ] as readonly MediaKey[],
};

/** The mouse buttons and wheel moves both vendor tools offer. */
export type MouseAction =
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

const MOUSE_ACTIONS: readonly MouseAction[] = [
    "leftClick",
    "middleClick",
    "rightClick",
    "wheelUp",
    "wheelDown",
    "controlWheelUp",
    "controlWheelDown",
    "shiftWheelUp",
    "shiftWheelDown",
    "altWheelUp",
    "altWheelDown",
];

export const MouseAction = {
    ALL: MOUSE_ACTIONS,

    /** HID mouse button bits. */
    buttons(action: MouseAction): number {
        switch (action) {
            case "leftClick":
                return 0x01;
            case "rightClick":
                return 0x02;
            case "middleClick":
                return 0x04;
            default:
                return 0;
        }
    },

    /** One notch up (0x01) or down (0xFF), or 0. */
    wheel(action: MouseAction): number {
        switch (action) {
            case "wheelUp":
            case "controlWheelUp":
            case "shiftWheelUp":
            case "altWheelUp":
                return 0x01;
            case "wheelDown":
            case "controlWheelDown":
            case "shiftWheelDown":
            case "altWheelDown":
                return 0xff;
            default:
                return 0;
        }
    },

    /** The modifier held while the wheel turns. */
    modifiers(action: MouseAction): Modifiers {
        switch (action) {
            case "controlWheelUp":
            case "controlWheelDown":
                return Modifiers.CONTROL;
            case "shiftWheelUp":
            case "shiftWheelDown":
                return Modifiers.SHIFT;
            case "altWheelUp":
            case "altWheelDown":
                return Modifiers.ALT;
            default:
                return Modifiers.NONE;
        }
    },

    /** The action with these buttons, or this wheel move and modifier; `null` when there is none. */
    fromParts(buttons: number, wheel: number, modifiers: Modifiers): MouseAction | null {
        if (buttons !== 0) {
            return MOUSE_ACTIONS.find((action) => MouseAction.buttons(action) === buttons) ?? null;
        }
        if (wheel !== 0) {
            return (
                MOUSE_ACTIONS.find(
                    (action) =>
                        MouseAction.buttons(action) === 0 &&
                        MouseAction.wheel(action) === wheel &&
                        MouseAction.modifiers(action) === modifiers,
                ) ?? null
            );
        }
        return null;
    },
};
