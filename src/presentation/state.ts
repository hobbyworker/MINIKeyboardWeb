import { KeyStroke, Modifiers, type KeyMacro } from "$domain";
import { KeyUsage } from "./tables/key-usages";

/** The pages of actions a key can be given. */
export type EditorTab = "keys" | "media" | "mouse" | "lighting" | "delay";

export const EditorTab = {
    ALL: ["keys", "media", "mouse", "lighting", "delay"] as readonly EditorTab[],
};

/** A transfer with the keyboard under way. */
export type Activity = "identifying" | "reading" | "saving";

/** A switch to another keyboard that waits for the user to let the changes not saved go. */
export type PendingSwitch =
    /** To another of the keyboards plugged in, by its choice's ID. */
    | { readonly kind: "keyboard"; readonly id: string }
    /** To a simulated keyboard by its choice's ID, or with `null` to the keyboard on USB. */
    | { readonly kind: "simulator"; readonly id: string | null };

/** A message that comes and goes. */
export type Notice =
    /** Saved; to a simulated keyboard when `simulated` — nothing went to a real one. */
    | { readonly kind: "saved"; readonly simulated: boolean }
    /** Saved, but some of it read back otherwise; those changes stay not saved. */
    | { readonly kind: "savedButDiffers" }
    /** Saved, but it couldn't be read back to check. */
    | { readonly kind: "savedButNotChecked" }
    | { readonly kind: "readComplete" }
    /** Read, but some controls weren't; they show what they showed before. */
    | { readonly kind: "readIncomplete" }
    | { readonly kind: "nothingToSave" }
    | { readonly kind: "identifyFailed" }
    /** The keyboard answered with a type the app's rules weren't tried with. */
    | { readonly kind: "untestedFirmware"; readonly type: number }
    | { readonly kind: "readFailed" }
    /** `code` is the failed write's. */
    | { readonly kind: "writeFailed"; readonly code: number }
    | { readonly kind: "keyboardGone" }
    | { readonly kind: "full"; readonly limit: number }
    | { readonly kind: "selectControlFirst" }
    | { readonly kind: "modifiersOnlyAlone" }
    | { readonly kind: "needsColorKey"; readonly keys: number }
    | { readonly kind: "unsupported" };

export const Notice = {
    isError(notice: Notice): boolean {
        return notice.kind !== "saved" && notice.kind !== "readComplete" && notice.kind !== "nothingToSave";
    },

    /** How long it stays, in milliseconds — a type not tried yet longer than errors, as it asks for a report. */
    lifetime(notice: Notice): number {
        if (notice.kind === "untestedFirmware") return 10000;
        if (Notice.isError(notice)) return 6000;
        if (notice.kind === "saved" && notice.simulated) return 4000;
        return 2500;
    },
};

/**
 * How modifiers are written, as the computer the page runs on writes them: `pc` — Ctrl+Alt+Shift+Super, as the
 * Linux edition; `windows` — the same with Win for Super, as the Windows edition; `mac` — macOS's symbols ⌃⌥⇧⌘ run
 * together, as the Apple edition.
 */
export type ModifierStyle = "pc" | "windows" | "mac";

let style: ModifierStyle = "pc";

/** Sets how modifiers are written, for the whole app — the composition root calls it once, before anything is drawn. */
export function setModifierStyle(next: ModifierStyle): void {
    style = next;
}

/** Each modifier's name in the current style, each right-hand one after its left-hand one and marked "R". */
export function modifierNames(): readonly (readonly [Modifiers, string])[] {
    if (style === "mac") {
        return [
            [Modifiers.CONTROL, "⌃"],
            [Modifiers.RIGHT_CONTROL, "R⌃"],
            [Modifiers.ALT, "⌥"],
            [Modifiers.RIGHT_ALT, "R⌥"],
            [Modifiers.SHIFT, "⇧"],
            [Modifiers.RIGHT_SHIFT, "R⇧"],
            [Modifiers.SUPER, "⌘"],
            [Modifiers.RIGHT_SUPER, "R⌘"],
        ];
    }
    const gui = style === "windows" ? "Win" : "Super";
    return [
        [Modifiers.CONTROL, "Ctrl"],
        [Modifiers.RIGHT_CONTROL, "RCtrl"],
        [Modifiers.ALT, "Alt"],
        [Modifiers.RIGHT_ALT, "RAlt"],
        [Modifiers.SHIFT, "Shift"],
        [Modifiers.RIGHT_SHIFT, "RShift"],
        [Modifiers.SUPER, gui],
        [Modifiers.RIGHT_SUPER, "R" + gui],
    ];
}

/** How actions read on key caps and in lists: the modifiers, then the key — "Ctrl+Shift+C", or "⇧⌘C" on a Mac. */
export const ActionText = {
    /** "Ctrl+Alt+Shift+Super", or "⌃⌥⇧⌘" on a Mac. */
    modifiers(modifiers: Modifiers): string {
        return modifierNames()
            .filter(([modifier]) => Modifiers.contains(modifiers, modifier))
            .map(([, name]) => name)
            .join(style === "mac" ? "" : "+");
    },

    /** "Super+C" ("⌘C" on a Mac), or "Ctrl+Shift" for modifiers alone. */
    stroke(stroke: KeyStroke): string {
        const modifiers = ActionText.modifiers(stroke.modifiers);
        if (KeyStroke.isModifiersOnly(stroke)) return modifiers;
        if (modifiers === "") return ActionText.key(stroke.key);
        return style === "mac" ? modifiers + ActionText.key(stroke.key) : `${modifiers}+${ActionText.key(stroke.key)}`;
    },

    /** The presses one after another. */
    keys(macro: KeyMacro): string {
        return macro.strokes.map((stroke) => ActionText.stroke(stroke)).join(" ");
    },

    /** A key's label, or its usage in hex when the app has no name for it. */
    key(usage: number): string {
        return KeyUsage.named(usage)?.label ?? `0x${usage.toString(16).toUpperCase().padStart(2, "0")}`;
    },
};
