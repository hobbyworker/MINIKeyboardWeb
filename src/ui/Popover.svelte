<script lang="ts" module>
    export type Placement = "below-start" | "below-end" | "beside";

    /** Room kept between a popover and the window's edges, in pixels. */
    const MARGIN = 8;
    /** The width taken for a popover placed beside a menu before it is shown and can be measured. */
    const BESIDE_WIDTH = 360;

    /**
     * Places `panel`, shown in the top layer, by `trigger` — under it, or beside the menu it is in: a panel too long for
     * the room left scrolls. A panel beside a menu is as wide as its items, so none wraps; it is measured once shown.
     */
    export function place(panel: HTMLElement, trigger: HTMLElement, placement: Placement): void {
        const width = document.documentElement.clientWidth;
        const height = document.documentElement.clientHeight;
        const anchor = trigger.getBoundingClientRect();
        const style = panel.style;
        style.inset = "auto";
        style.maxWidth = `${width - 2 * MARGIN}px`;
        if (placement === "beside") {
            const menu = trigger.closest("[popover]")?.getBoundingClientRect() ?? anchor;
            style.width = "max-content";
            const size = Math.min(panel.offsetWidth > 0 ? panel.offsetWidth : BESIDE_WIDTH, width - 2 * MARGIN);
            let left = menu.left - 4 - size;
            if (left < MARGIN) {
                left =
                    menu.right + 4 + size <= width - MARGIN ? menu.right + 4 : Math.max(MARGIN, width - MARGIN - size);
            }
            let top = Math.max(MARGIN, anchor.top - 6);
            if (height - MARGIN - top < 360) top = Math.max(MARGIN, height - MARGIN - 360);
            style.left = `${left}px`;
            style.width = `${size}px`;
            style.top = `${top}px`;
            style.maxHeight = `${height - MARGIN - top}px`;
            return;
        }
        const below = height - anchor.bottom - MARGIN;
        const above = anchor.top - MARGIN;
        if (below >= 280 || below >= above) {
            style.top = `${anchor.bottom + 4}px`;
            style.maxHeight = `${Math.max(120, below - 4)}px`;
        } else {
            style.bottom = `${height - anchor.top + 4}px`;
            style.maxHeight = `${above - 4}px`;
        }
        if (placement === "below-end") style.right = `${Math.max(MARGIN, width - anchor.right)}px`;
        else style.left = `${Math.max(MARGIN, anchor.left)}px`;
    }

    /** The items of the menu `panel`, leaving out those of the menus inside it. */
    function itemsOf(panel: HTMLElement): HTMLElement[] {
        return [...panel.querySelectorAll<HTMLElement>('[role^="menuitem"]')].filter(
            (item) => item.closest("[popover]") === panel && !item.hasAttribute("disabled"),
        );
    }

    /** The outermost popover `panel` is in — hiding it hides the ones inside. */
    function outermost(panel: HTMLElement): HTMLElement {
        let top = panel;
        for (let up = panel.parentElement?.closest<HTMLElement>("[popover]"); up;) {
            top = up;
            up = up.parentElement?.closest<HTMLElement>("[popover]");
        }
        return top;
    }
</script>

<script lang="ts">
    // A button and what it opens over the page: a menu, or a panel of information. It opens in the top layer, so the
    // page's columns and stacking don't cut it, and closes on a click elsewhere or Escape. Its content is made when it
    // opens; `children` is given a function that closes it, and the menus it is in.
    import type { Snippet } from "svelte";

    let {
        label,
        trigger,
        children,
        kind = "menu",
        placement = "below-end",
        triggerClass = "icon-button",
        triggerRole,
        showLabel = false,
        disabled = false,
        panelClass = "",
    }: {
        /** The button's name for assistive tools, and its tooltip. */
        label: string;
        trigger: Snippet;
        children: Snippet<[() => void]>;
        kind?: "menu" | "dialog";
        placement?: Placement;
        triggerClass?: string;
        /** `menuitem` for a menu that opens from another menu. */
        triggerRole?: "menuitem";
        /** Whether the button shows `label` itself — then there is no tooltip. */
        showLabel?: boolean;
        disabled?: boolean;
        panelClass?: string;
    } = $props();

    let button: HTMLButtonElement | undefined = $state();
    let panel: HTMLDivElement | undefined = $state();
    let open = $state(false);

    $effect(() => {
        if (!button || !panel) return;
        button.popoverTargetElement = panel;
        // A menu that opens from another stays open when its item is clicked again, as menus do.
        if (triggerRole === "menuitem") button.popoverTargetAction = "show";
    });

    // A menu that opens from another opens when the pointer rests on its item, and closes when the pointer moves on to
    // another item of that menu — not when it comes into this one. A touch has no pointer to rest; it opens with a tap.
    const HOVER_OPEN_MS = 120;
    const HOVER_CLOSE_MS = 150;
    let openTimer: ReturnType<typeof setTimeout> | undefined;
    let closeTimer: ReturnType<typeof setTimeout> | undefined;
    /** Opened by the pointer: the focus stays where it is, so the keys still move through the menu it came from. */
    let openedByPointer = false;

    function pointerEntered(event: PointerEvent) {
        clearTimeout(closeTimer);
        if (triggerRole !== "menuitem" || event.pointerType === "touch" || disabled) return;
        clearTimeout(openTimer);
        openTimer = setTimeout(() => {
            if (!panel || panel.matches(":popover-open")) return;
            openedByPointer = true;
            panel.showPopover();
        }, HOVER_OPEN_MS);
    }

    function pointerLeft() {
        clearTimeout(openTimer);
    }

    $effect(() => {
        if (!open || triggerRole !== "menuitem" || !button || !panel) return;
        const menu = button.parentElement?.closest<HTMLElement>("[popover]");
        if (!menu) return;
        const self = panel;
        const moved = (event: PointerEvent) => {
            if (event.pointerType === "touch") return;
            const item = (event.target as HTMLElement).closest('[role^="menuitem"]');
            if (item === null || item === button || item.closest("[popover]") !== menu) return;
            clearTimeout(closeTimer);
            closeTimer = setTimeout(() => self.hidePopover(), HOVER_CLOSE_MS);
        };
        menu.addEventListener("pointerover", moved);
        return () => {
            menu.removeEventListener("pointerover", moved);
            clearTimeout(closeTimer);
        };
    });

    function reposition() {
        if (button && panel) place(panel, button, placement);
    }

    function beforeToggle(event: ToggleEvent) {
        if (event.newState === "open") {
            reposition();
            open = true;
        }
    }

    function toggled(event: ToggleEvent) {
        if (!panel || !button) return;
        if (event.newState === "open") {
            // Now it has a size of its own.
            reposition();
            window.addEventListener("scroll", reposition, { capture: true, passive: true });
            window.addEventListener("resize", reposition, { passive: true });
            if (openedByPointer) {
                openedByPointer = false;
            } else if (kind === "menu") {
                const items = itemsOf(panel);
                (items.find((item) => item.getAttribute("aria-checked") === "true") ?? items[0] ?? panel).focus();
            } else {
                panel.focus();
            }
        } else {
            window.removeEventListener("scroll", reposition, { capture: true });
            window.removeEventListener("resize", reposition);
            open = false;
            const root = panel.getRootNode() as ShadowRoot | Document;
            const focused = root.activeElement;
            if (focused === null || panel.contains(focused)) button.focus();
        }
    }

    function close() {
        if (panel) outermost(panel).hidePopover();
    }

    function keydown(event: KeyboardEvent) {
        if (!panel || !button || kind !== "menu") return;
        const target = event.target as HTMLElement;
        if (target.closest("[popover]") !== panel) return;
        const items = itemsOf(panel);
        const index = items.indexOf(target);
        let next: HTMLElement | undefined;
        switch (event.key) {
            case "ArrowDown":
                next = items[(index + 1) % items.length];
                break;
            case "ArrowUp":
                next = items[(index - 1 + items.length) % items.length];
                break;
            case "Home":
                next = items[0];
                break;
            case "End":
                next = items[items.length - 1];
                break;
            case "ArrowRight":
                if (target.getAttribute("aria-haspopup") === "menu") {
                    event.preventDefault();
                    // Opened already by the pointer: into it.
                    const menu = (target as HTMLButtonElement).popoverTargetElement as HTMLElement | null;
                    if (menu?.matches(":popover-open")) {
                        const inside = itemsOf(menu);
                        (inside.find((item) => item.getAttribute("aria-checked") === "true") ?? inside[0])?.focus();
                    } else {
                        target.click();
                    }
                }
                return;
            case "ArrowLeft":
                if (placement === "beside") {
                    event.preventDefault();
                    panel.hidePopover();
                    button.focus();
                }
                return;
            case "Tab":
                close();
                return;
            default:
                return;
        }
        event.preventDefault();
        next?.focus();
    }

    // Unmounted while open — the keyboard went, say — it leaves the listeners behind otherwise.
    $effect(() => () => {
        window.removeEventListener("scroll", reposition, { capture: true });
        window.removeEventListener("resize", reposition);
        clearTimeout(openTimer);
        clearTimeout(closeTimer);
    });
</script>

<button
    bind:this={button}
    type="button"
    class={triggerClass}
    role={triggerRole}
    aria-haspopup={kind === "menu" ? "menu" : "dialog"}
    aria-expanded={open}
    aria-label={showLabel ? undefined : label}
    title={showLabel ? undefined : label}
    {disabled}
    onpointerenter={pointerEntered}
    onpointerleave={pointerLeft}
>
    {@render trigger()}
</button>
<div
    bind:this={panel}
    popover="auto"
    class="popover {panelClass}"
    role={kind === "menu" ? "menu" : "dialog"}
    aria-label={label}
    tabindex="-1"
    onbeforetoggle={beforeToggle}
    ontoggle={toggled}
    onkeydown={keydown}
    onpointerenter={() => clearTimeout(closeTimer)}
>
    {#if open}
        {@render children(close)}
    {/if}
</div>

<style>
    .popover {
        margin: 0;
        padding: 6px;
        min-width: 200px;
        overflow: auto;
        overscroll-behavior: contain;
        box-sizing: border-box;
        border: 1px solid var(--mk-line);
        border-radius: 12px;
        background: var(--mk-raised);
        color: var(--mk-fg);
        box-shadow: var(--mk-shadow-raised);
    }

    .popover:focus-visible {
        outline: 2px solid var(--mk-accent);
        outline-offset: 2px;
    }
</style>
