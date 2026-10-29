// For a build that extends the app — a footer of its own: subclass MiniKeyboardElement, give it footer(), and define it
// with defineMiniKeyboard; and for a page that counts what happens: the EVENT name and its detail. Importing this module
// defines nothing; main.ts is the module that does.

export { defineMiniKeyboard, EVENT, MiniKeyboardElement, TAG } from "./element.svelte";
export type { EditorEvent as MiniKeyboardEventDetail } from "$presentation";
export { LANGUAGES, type Language } from "$ui/l10n.svelte";
export type { AppFooter, FooterProps } from "$ui/props";
