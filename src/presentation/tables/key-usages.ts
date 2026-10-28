/**
 * A key on the HID keyboard page and how to show it. Labels are the same in every language — letters, digits and what
 * PC keyboards print on their keys; the app names the keys in the user's language.
 */
export interface KeyUsage {
    readonly usage: number;
    /** What a key cap shows: "A", "F5", "⌫". */
    readonly label: string;
    /** The shifted character a key cap shows above, if any. */
    readonly shifted: string | null;
}

const key = (usage: number, label: string): KeyUsage => ({ usage, label, shifted: null });
const shifted = (usage: number, label: string, shifted: string): KeyUsage => ({ usage, label, shifted });

const LETTERS: readonly KeyUsage[] = [
    key(0x04, "A"),
    key(0x05, "B"),
    key(0x06, "C"),
    key(0x07, "D"),
    key(0x08, "E"),
    key(0x09, "F"),
    key(0x0a, "G"),
    key(0x0b, "H"),
    key(0x0c, "I"),
    key(0x0d, "J"),
    key(0x0e, "K"),
    key(0x0f, "L"),
    key(0x10, "M"),
    key(0x11, "N"),
    key(0x12, "O"),
    key(0x13, "P"),
    key(0x14, "Q"),
    key(0x15, "R"),
    key(0x16, "S"),
    key(0x17, "T"),
    key(0x18, "U"),
    key(0x19, "V"),
    key(0x1a, "W"),
    key(0x1b, "X"),
    key(0x1c, "Y"),
    key(0x1d, "Z"),
];

const DIGITS: readonly KeyUsage[] = [
    shifted(0x1e, "1", "!"),
    shifted(0x1f, "2", "@"),
    shifted(0x20, "3", "#"),
    shifted(0x21, "4", "$"),
    shifted(0x22, "5", "%"),
    shifted(0x23, "6", "^"),
    shifted(0x24, "7", "&"),
    shifted(0x25, "8", "*"),
    shifted(0x26, "9", "("),
    shifted(0x27, "0", ")"),
];

const EDITING: readonly KeyUsage[] = [
    key(0x28, "↵"),
    key(0x29, "Esc"),
    key(0x2a, "⌫"),
    key(0x2b, "↹"),
    key(0x2c, "Space"),
    key(0x39, "⇪"),
    key(0x65, "Menu"),
];

const SYMBOLS: readonly KeyUsage[] = [
    shifted(0x2d, "-", "_"),
    shifted(0x2e, "=", "+"),
    shifted(0x2f, "[", "{"),
    shifted(0x30, "]", "}"),
    shifted(0x31, "\\", "|"),
    shifted(0x33, ";", ":"),
    shifted(0x34, "'", '"'),
    shifted(0x35, "`", "~"),
    shifted(0x36, ",", "<"),
    shifted(0x37, ".", ">"),
    shifted(0x38, "/", "?"),
];

const FUNCTION_KEYS: readonly KeyUsage[] = [
    key(0x3a, "F1"),
    key(0x3b, "F2"),
    key(0x3c, "F3"),
    key(0x3d, "F4"),
    key(0x3e, "F5"),
    key(0x3f, "F6"),
    key(0x40, "F7"),
    key(0x41, "F8"),
    key(0x42, "F9"),
    key(0x43, "F10"),
    key(0x44, "F11"),
    key(0x45, "F12"),
];

const EXTRA_FUNCTION_KEYS: readonly KeyUsage[] = [
    key(0x68, "F13"),
    key(0x69, "F14"),
    key(0x6a, "F15"),
    key(0x6b, "F16"),
    key(0x6c, "F17"),
    key(0x6d, "F18"),
    key(0x6e, "F19"),
    key(0x6f, "F20"),
    key(0x70, "F21"),
    key(0x71, "F22"),
    key(0x72, "F23"),
    key(0x73, "F24"),
];

const SYSTEM: readonly KeyUsage[] = [key(0x46, "PrtSc"), key(0x47, "ScrLk"), key(0x48, "Pause")];

const NAVIGATION: readonly KeyUsage[] = [
    key(0x49, "Ins"),
    key(0x4a, "Home"),
    key(0x4b, "PgUp"),
    key(0x4c, "Del"),
    key(0x4d, "End"),
    key(0x4e, "PgDn"),
    key(0x4f, "→"),
    key(0x50, "←"),
    key(0x51, "↓"),
    key(0x52, "↑"),
];

const KEYPAD: readonly KeyUsage[] = [
    key(0x53, "Num"),
    key(0x54, "÷"),
    key(0x55, "×"),
    key(0x56, "−"),
    key(0x57, "+"),
    key(0x58, "⌤"),
    key(0x59, "1"),
    key(0x5a, "2"),
    key(0x5b, "3"),
    key(0x5c, "4"),
    key(0x5d, "5"),
    key(0x5e, "6"),
    key(0x5f, "7"),
    key(0x60, "8"),
    key(0x61, "9"),
    key(0x62, "0"),
    key(0x63, "."),
];

const INTERNATIONAL: readonly KeyUsage[] = [shifted(0x32, "#", "~"), shifted(0x64, "\\", "|")];

const ALL: readonly KeyUsage[] = [
    ...LETTERS,
    ...DIGITS,
    ...EDITING,
    ...SYMBOLS,
    ...FUNCTION_KEYS,
    ...SYSTEM,
    ...NAVIGATION,
    ...KEYPAD,
    ...EXTRA_FUNCTION_KEYS,
    ...INTERNATIONAL,
];

export const KeyUsage = {
    LETTERS,
    DIGITS,
    EDITING,
    SYMBOLS,
    FUNCTION_KEYS,
    EXTRA_FUNCTION_KEYS,
    SYSTEM,
    NAVIGATION,
    KEYPAD,
    /** The two keys ISO keyboards have and ANSI ones don't ("Non-US # and ~", "Non-US \ and |"). */
    INTERNATIONAL,

    /** Every key the cross-platform app offers: both vendor tools' keys, and F13–F24 and the two non-US keys. */
    all(): readonly KeyUsage[] {
        return ALL;
    },

    named(usage: number): KeyUsage | null {
        return ALL.find((key) => key.usage === usage) ?? null;
    },
};
