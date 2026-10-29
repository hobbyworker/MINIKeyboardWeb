// The module the page loads: it defines <minikeyboard-app>, once — a page may load it twice.

import { defineMiniKeyboard, MiniKeyboardElement } from "./element.svelte";

defineMiniKeyboard();

export { MiniKeyboardElement };
