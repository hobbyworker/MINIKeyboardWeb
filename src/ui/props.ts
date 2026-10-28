// What the app element gives the interface besides the view models.

/** `auto` follows the system; the page says `light` or `dark` when it has a theme switch of its own. */
export type Theme = "light" | "dark" | "auto";

/** The computer the page runs on — the names of modifier keys, and how a keyboard is allowed (udev on Linux). */
export type Platform = "mac" | "windows" | "linux" | "other";
