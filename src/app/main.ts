// The module the page loads: it defines <minikeyboard-app>, once — a page may load it twice.

import { MiniKeyboardElement, TAG } from "./element.svelte";

if (!customElements.get(TAG)) customElements.define(TAG, MiniKeyboardElement);

export { MiniKeyboardElement };
