// What the app element gives the interface besides the view models.

import type { Component } from "svelte";
import type { Language } from "./l10n.svelte";

/** `auto` follows the system; the page says `light` or `dark` when it has a theme switch of its own. */
export type Theme = "light" | "dark" | "auto";

/** The computer the page runs on — the names of modifier keys, and how a keyboard is allowed (udev on Linux). */
export type Platform = "mac" | "windows" | "linux" | "other";

/** What a build's footer is given: the language the app is showing. */
export interface FooterProps {
    language: Language;
}

/** A component drawn at the bottom of the app, in its colours (the `--mk-*` properties). */
export type AppFooter = Component<FooterProps>;
