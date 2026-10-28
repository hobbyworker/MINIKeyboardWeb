<script lang="ts">
    // A modal dialog over the page, in the top layer: open while `open` is. A required one has no way out but its own
    // buttons — no close button, and Escape doesn't close it. Its content is made each time it opens.
    import type { Snippet } from "svelte";
    import Icon from "./Icon.svelte";
    import { t } from "./l10n.svelte";

    let {
        open,
        title,
        onclose,
        children,
        footer,
        required = false,
        width = 680,
    }: {
        open: boolean;
        title: string;
        /** Asked to close: the close button, or Escape. */
        onclose: () => void;
        children: Snippet;
        footer?: Snippet;
        required?: boolean;
        /** The most it takes, in pixels; less on a narrow window. */
        width?: number;
    } = $props();

    const id = $props.id();
    let dialog: HTMLDialogElement | undefined = $state();

    $effect(() => {
        if (!dialog) return;
        if (open && !dialog.open) dialog.showModal();
        else if (!open && dialog.open) dialog.close();
    });

    function closed() {
        if (!open || !dialog) return;
        // Closed by the browser while it is still wanted: a required one comes back.
        if (required) dialog.showModal();
        else onclose();
    }
</script>

<dialog
    bind:this={dialog}
    class="dialog"
    style:--width="{width}px"
    aria-labelledby="{id}-title"
    closedby={required ? "none" : "closerequest"}
    oncancel={(event) => {
        if (required) event.preventDefault();
    }}
    onclose={closed}
>
    {#if open}
        <header class="dialog-header">
            <h2 id="{id}-title">{title}</h2>
            {#if !required}
                <button type="button" class="icon-button" aria-label={t("Close")} title={t("Close")} onclick={onclose}>
                    <Icon name="close" />
                </button>
            {/if}
        </header>
        <div class="dialog-body">
            {@render children()}
        </div>
        {#if footer}
            <footer class="dialog-footer">
                {@render footer()}
            </footer>
        {/if}
    {/if}
</dialog>

<style>
    .dialog {
        box-sizing: border-box;
        width: min(var(--width), calc(100vw - 24px));
        max-height: calc(100dvh - 24px);
        padding: 0;
        border: 1px solid var(--mk-line);
        border-radius: 16px;
        background: var(--mk-raised);
        color: var(--mk-fg);
        box-shadow: var(--mk-shadow-raised);
        overscroll-behavior: contain;
    }

    .dialog[open] {
        display: flex;
        flex-direction: column;
    }

    .dialog::backdrop {
        background: rgb(0 0 0 / 0.42);
    }

    .dialog-header {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 14px 14px 6px 20px;
    }

    h2 {
        flex: 1;
        margin: 0;
        font-size: 1.1em;
        font-weight: 700;
        line-height: 1.3;
    }

    .dialog-body {
        flex: 1 1 auto;
        min-height: 0;
        overflow: auto;
        padding: 8px 20px 16px;
    }

    .dialog-footer {
        display: flex;
        align-items: center;
        flex-wrap: wrap;
        gap: 8px;
        padding: 12px 20px 18px;
        border-top: 1px solid var(--mk-line);
    }
</style>
