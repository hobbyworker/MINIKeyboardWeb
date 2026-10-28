// Which of the keyboards plugged in the app opens — the rule, apart from WebHID so tests can hold it.
//
// The one chosen this session, while it stays plugged in; else the one chosen last time, when it is plugged in; else
// the first, in the order the app looks at keyboards, that can be opened at all.

import { formatUsbIdentity, sameUsbIdentity, type AttachedKeyboard } from "$domain";

/**
 * What "the one chosen last time" is kept as — its USB ID, e.g. `1189:8840`. WebHID tells no port, so of several with
 * the same USB ID the first matches.
 */
export function key(keyboard: AttachedKeyboard): string {
    return formatUsbIdentity(keyboard.usb);
}

/**
 * The keyboard to open. One the user chose (now or last time) is opened even when it can't be, so the failure is shown
 * rather than passed over for another.
 */
export function target(
    keyboards: readonly AttachedKeyboard[],
    chosen: string | null,
    remembered: string | null,
    canOpen: (keyboard: AttachedKeyboard) => boolean,
): AttachedKeyboard | null {
    return (
        keyboards.find((keyboard) => keyboard.id === chosen) ??
        keyboards.find((keyboard) => remembered !== null && key(keyboard) === remembered) ??
        keyboards.find(canOpen) ??
        keyboards[0] ??
        null
    );
}

/**
 * One entry for each keyboard, in the order the first of its USB ID came — the order the cross-platform app looks for
 * them; several with the same USB ID by location.
 */
export function ordered(found: readonly AttachedKeyboard[]): AttachedKeyboard[] {
    const unique: AttachedKeyboard[] = [];
    for (const keyboard of found) {
        if (!unique.some((other) => other.id === keyboard.id)) unique.push(keyboard);
    }
    const firstOfUsb = (keyboard: AttachedKeyboard) =>
        unique.findIndex((other) => sameUsbIdentity(other.usb, keyboard.usb));
    return unique.sort(
        (a, b) => firstOfUsb(a) - firstOfUsb(b) || (a.location < b.location ? -1 : a.location > b.location ? 1 : 0),
    );
}
