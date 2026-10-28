// What the app calls things, in the page's language. The view models name nothing a user reads. The messages are
// the other editions' own, so their translations apply.

import type {
    ActionCaption,
    ControlTitle,
    EditorTab,
    InfoChannel,
    InfoCommands,
    InterfaceRole,
    KeyGroupKind,
    KeyUsage,
    LedColor,
    LogEvent,
    MediaChoice,
    ModifierKey,
    MouseChoice,
    Notice,
    SimulatorKind,
} from "$presentation";
import type { IconName } from "./icons";
import { t } from "./l10n.svelte";
import type { Platform } from "./props";

export function controlTitle(title: ControlTitle): string {
    if (title.kind === "key") return t("Key %lld", title.number);
    switch (title.action) {
        case "rotateLeft":
            return t("Knob %lld · Rotate left", title.number);
        case "press":
            return t("Knob %lld · Press", title.number);
        case "rotateRight":
            return t("Knob %lld · Rotate right", title.number);
        case "pressRotateLeft":
            return t("Knob %lld · Press and rotate left", title.number);
        case "pressRotateRight":
            return t("Knob %lld · Press and rotate right", title.number);
    }
}

export function mediaTitle(media: MediaChoice): string {
    switch (media) {
        case "playPause":
            return t("Play/Pause");
        case "stop":
            return t("Stop");
        case "previousTrack":
            return t("Prev Song");
        case "nextTrack":
            return t("Next Song");
        case "mute":
            return t("Mute");
        case "volumeUp":
            return t("Volume+");
        case "volumeDown":
            return t("Volume-");
        case "brightnessUp":
            return t("Brightness+");
        case "brightnessDown":
            return t("Brightness-");
        case "bassUp":
            return t("Bass+");
        case "bassDown":
            return t("Bass-");
        case "trebleUp":
            return t("Treble+");
        case "trebleDown":
            return t("Treble-");
        case "mediaPlayer":
            return t("Media Player");
        case "email":
            return t("Email");
        case "calculator":
            return t("Calculator");
        case "myComputer":
            return t("My Computer");
        case "webHome":
            return t("Web Home");
        case "webBack":
            return t("Web Back");
        case "webForward":
            return t("Web Forward");
        case "webRefresh":
            return t("Web Refresh");
    }
}

export function mediaIcon(media: MediaChoice): IconName {
    switch (media) {
        case "playPause":
            return "playPause";
        case "stop":
            return "stop";
        case "previousTrack":
            return "skipBack";
        case "nextTrack":
            return "skipForward";
        case "mute":
            return "mute";
        case "volumeUp":
            return "volumeHigh";
        case "volumeDown":
            return "volumeLow";
        case "brightnessUp":
        case "brightnessDown":
            return "brightness";
        case "bassUp":
        case "bassDown":
        case "trebleUp":
        case "trebleDown":
            return "speakers";
        case "mediaPlayer":
            return "music";
        case "email":
            return "mail";
        case "calculator":
            return "calculator";
        case "myComputer":
            return "computer";
        case "webHome":
            return "home";
        case "webBack":
            return "arrowLeft";
        case "webForward":
            return "arrowRight";
        case "webRefresh":
            return "refresh";
    }
}

export function mouseTitle(mouse: MouseChoice): string {
    switch (mouse) {
        case "leftClick":
            return t("Mouse Left");
        case "middleClick":
            return t("Mouse Centre");
        case "rightClick":
            return t("Mouse Right");
        case "wheelUp":
            return t("Mouse wheel Up");
        case "wheelDown":
            return t("Mouse wheel Down");
        case "controlWheelUp":
            return t("Ctrl + Mouse wheel Up");
        case "controlWheelDown":
            return t("Ctrl + Mouse wheel Down");
        case "shiftWheelUp":
            return t("Shift + Mouse wheel Up");
        case "shiftWheelDown":
            return t("Shift + Mouse wheel Down");
        case "altWheelUp":
            return t("Alt + Mouse wheel Up");
        case "altWheelDown":
            return t("Alt + Mouse wheel Down");
    }
}

export function mouseIcon(mouse: MouseChoice): IconName {
    switch (mouse) {
        case "leftClick":
        case "middleClick":
        case "rightClick":
            return "mouse";
        case "wheelUp":
        case "controlWheelUp":
        case "shiftWheelUp":
        case "altWheelUp":
            return "arrowUp";
        case "wheelDown":
        case "controlWheelDown":
        case "shiftWheelDown":
        case "altWheelDown":
            return "arrowDown";
    }
}

/**
 * A modifier's full name, for its tooltip: as the computer the page runs on calls it — Command and Option on a Mac,
 * the Windows key on Windows, Super elsewhere.
 */
export function modifierTitle(modifier: ModifierKey, platform: Platform): string {
    switch (modifier) {
        case "control":
            return t("Control");
        case "shift":
            return t("Shift");
        case "rightControl":
            return t("Right Control");
        case "rightShift":
            return t("Right Shift");
        case "alt":
            return platform === "mac" ? t("Option") : t("Alt");
        case "rightAlt":
            return platform === "mac" ? t("Right Option") : t("Right Alt");
        case "super":
            if (platform === "mac") return t("Command");
            return platform === "windows" ? t("Windows") : t("Super");
        case "rightSuper":
            if (platform === "mac") return t("Right Command");
            return platform === "windows" ? t("Right Windows") : t("Right Super");
    }
}

export function ledColorTitle(color: LedColor): string {
    switch (color) {
        case "red":
            return t("Red");
        case "orange":
            return t("Orange");
        case "yellow":
            return t("Yellow");
        case "green":
            return t("Green");
        case "cyan":
            return t("Cyan");
        case "blue":
            return t("Blue");
        case "purple":
            return t("Purple");
    }
}

/** The colour a swatch shows, as CSS. */
export function ledColorCss(color: LedColor): string {
    switch (color) {
        case "red":
            return "#e01b24";
        case "orange":
            return "#ff7800";
        case "yellow":
            return "#f6d32d";
        case "green":
            return "#33d17a";
        case "cyan":
            return "#33c7de";
        case "blue":
            return "#3584e4";
        case "purple":
            return "#9141ac";
    }
}

export function interfaceRoleTitle(role: InterfaceRole): string {
    switch (role) {
        case "keyboard":
            return t("Keyboard");
        case "mouse":
            return t("Mouse");
        case "media":
            return t("Multimedia");
        case "configuration":
            return t("Configuration Channel");
        case "other":
            return t("Other");
    }
}

/** The modes of a 884x keyboard have numbers only — what they do hasn't been seen. */
export function lightingModeTitle(mode: number): string {
    return t("Mode %lld", mode);
}

export function keyGroupTitle(kind: KeyGroupKind): string {
    switch (kind) {
        case "letters":
            return t("Letters");
        case "numbers":
            return t("Numbers");
        case "editing":
            return t("Editing");
        case "symbols":
            return t("Symbols");
        case "functionKeys":
            return t("Function Keys");
        case "navigation":
            return t("Navigation");
        case "numpad":
            return t("Numpad");
    }
}

export function tabTitle(tab: EditorTab): string {
    switch (tab) {
        case "keys":
            return t("Keys");
        case "media":
            return t("Multimedia");
        case "mouse":
            return t("Mouse");
        case "lighting":
            return t("LED");
        case "delay":
            return t("Delay");
    }
}

/**
 * A failure's code. WebHID tells no code — the data layer reports 0 — so a failure there is named for WebHID; another
 * code shows as the Apple edition shows its own.
 */
export function errorCode(code: number): string {
    if (code === 0) return "WebHID";
    return `0x${(code >>> 0).toString(16).toUpperCase().padStart(8, "0")}`;
}

export function noticeMessage(notice: Notice): string {
    switch (notice.kind) {
        case "saved":
            return notice.simulated
                ? t("Saved to the simulator — nothing was written to a keyboard.")
                : t("Saved to the keyboard.");
        case "savedButDiffers":
            return t("Saved, but some keys or knobs read back differently. Those changes stay unsaved.");
        case "savedButNotChecked":
            return t("Saved, but the keyboard couldn’t be read back to check.");
        case "readComplete":
            return t("Read from the keyboard.");
        case "readIncomplete":
            return t("Some keys or knobs couldn’t be read. They’re shown as before.");
        case "nothingToSave":
            return t("Nothing to save — no key has changed.");
        case "identifyFailed":
            return t("The keyboard couldn’t be asked what it is.");
        case "untestedFirmware":
            return t(
                "This keyboard’s firmware (type %lld) hasn’t been tested yet. If keys read or save wrong, please report it with the device log.",
                notice.type,
            );
        case "readFailed":
            return t("Reading from the keyboard failed.");
        case "writeFailed":
            return t("Writing to the keyboard failed (%@).", errorCode(notice.code));
        case "keyboardGone":
            return t("The keyboard is no longer connected.");
        case "full":
            return t("A key holds up to %lld presses.", notice.limit);
        case "selectControlFirst":
            return t("Select a key or knob.");
        case "modifiersOnlyAlone":
            return t("Modifiers alone make the key a modifier key, so they can’t go with other presses.");
        case "needsColorKey":
            return t("Only keys 1–%lld have a color. Select one of them.", notice.keys);
        case "unsupported":
            return t("This keyboard can’t do that.");
    }
}

/** What a key cap shows: "Super+C", "Mute". */
export function captionText(caption: ActionCaption): string {
    switch (caption.kind) {
        case "unknown":
        case "nothing":
            return "";
        case "presses":
            return caption.text;
        case "media":
            return mediaTitle(caption.choice);
        case "otherMedia":
            return t("Media Key %@", `0x${caption.usage.toString(16).toUpperCase().padStart(3, "0")}`);
        case "mouse":
            return mouseTitle(caption.choice);
    }
}

/** The keypad's operators as their keys are usually named, rather than as their caps show them. */
const KEYPAD_SYMBOLS: Readonly<Record<number, string>> = { 0x54: "/", 0x55: "*", 0x56: "-", 0x57: "+" };

/**
 * What the key is called, for its tooltip. A key whose cap reads plainly — a letter, a digit, F5 — goes by its label.
 * On a Mac, three keys go by the names macOS gives them, as in the Apple edition.
 */
export function keyName(key: KeyUsage, platform: Platform): string {
    const mac = platform === "mac";
    switch (key.usage) {
        case 0x28:
            return mac ? t("Return") : t("Enter");
        case 0x29:
            return t("Escape");
        case 0x2a:
            return mac ? t("Delete (Backspace)") : t("Backspace");
        case 0x2b:
            return t("Tab");
        case 0x2c:
            return t("Space");
        case 0x39:
            return t("Caps Lock");
        case 0x65:
            return t("Menu Key");
        case 0x46:
            return t("Print Screen");
        case 0x47:
            return t("Scroll Lock");
        case 0x49:
            return t("Insert");
        case 0x4a:
            return t("Home");
        case 0x4b:
            return t("Page Up");
        case 0x4c:
            return mac ? t("Forward Delete") : t("Delete");
        case 0x4d:
            return t("End");
        case 0x4e:
            return t("Page Down");
        case 0x4f:
            return t("Right Arrow");
        case 0x50:
            return t("Left Arrow");
        case 0x51:
            return t("Down Arrow");
        case 0x52:
            return t("Up Arrow");
        case 0x53:
            return t("Num Lock");
        case 0x58:
            return t("Keypad Enter");
        case 0x32:
        case 0x64:
            return t("Non-US Key %@ %@", key.label, key.shifted ?? "");
    }
    if (key.usage >= 0x54 && key.usage <= 0x63) return t("Keypad %@", KEYPAD_SYMBOLS[key.usage] ?? key.label);
    return key.label;
}

export function logEventMessage(event: LogEvent): string {
    switch (event.kind) {
        case "searching":
            return t("Looking for the keyboard");
        case "connected":
            return t("Connected to %@, interface %lld", event.usb, event.interface);
        case "needsPermission":
            return t("Access to the keyboard is needed");
        case "openFailed":
            return t("The keyboard couldn’t be opened (%@).", errorCode(event.code));
        case "writeFailed":
            return t("Writing to the keyboard failed (%@).", errorCode(event.code));
        case "simulated":
            return t("Simulated keyboard: %@", event.id);
    }
}

export function simulatorKindTitle(kind: SimulatorKind): string {
    if (kind.kind === "unidentified") return t("%@ · %@", commandsText("unidentified"), kind.usb);
    return t("%@ · %@", t("Keys: %lld · Knobs: %lld · Type %lld", kind.keys, kind.knobs, kind.type), kind.usb);
}

/** "Interface 0 · WebHID · Report ID 3 · 65 bytes". */
export function channelText(channel: InfoChannel): string {
    const way = channel.path === "simulated" ? t("Simulator") : "WebHID";
    return t(
        "Interface %lld · %@ · %@ · %@",
        channel.interface,
        way,
        t("Report ID %lld", channel.reportId),
        t("%lld bytes", channel.reportLength),
    );
}

export function commandsText(commands: InfoCommands): string {
    switch (commands) {
        case "standard":
            return t("884x · Standard Firmware");
        case "legacy":
            return t("884x · Legacy Firmware");
        case "unidentified":
            return t("884x · Doesn’t Answer Identification");
        case "unknown":
            return "—";
    }
}
