<script lang="ts">
    // The selected key or knob action: what it does, and clearing it.
    import type { EditorModel } from "$presentation";
    import Icon from "./Icon.svelte";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import { captionText, controlTitle, mediaIcon, mediaTitle, mouseIcon, mouseTitle } from "./names";

    let { ed }: { ed: Live<EditorModel> } = $props();

    const editor = $derived(ed.model);
    const selection = $derived(ed.read((e) => e.selectionState()));
    const held = $derived(ed.read((e) => e.heldModifierText()));
    const ready = $derived(ed.read((e) => e.isReady()));
    const hasSelection = $derived(ed.read((e) => e.selectedControl() !== null));
    const unsaved = $derived(ed.read((e) => e.hasUnsavedChanges()));
    // They clear what keys and knobs do, not their lights, so the lighting page goes without them.
    const clears = $derived(ed.read((e) => e.tab() !== "lighting"));
</script>

<section class="inspector" aria-label={selection ? controlTitle(selection.title) : t("Select a key or knob.")}>
    {#if selection === null}
        <p class="dim">{t("Select a key or knob.")}</p>
    {:else}
        <div class="selected">
            <div>
                <h3>{controlTitle(selection.title)}</h3>
                {#if selection.layerNumber !== null}
                    <div class="caption dim">{t("Layer %lld", selection.layerNumber)}</div>
                {/if}
            </div>
            <hr />
            {#if selection.binding.kind === "unknown"}
                <p class="dim">
                    {t(
                        "Not known — this keyboard doesn’t tell what its keys do. Whatever you set here is written when you save.",
                    )}
                </p>
            {:else if selection.binding.kind === "nothing"}
                <p class="dim">{t("Nothing")}</p>
            {:else if selection.binding.kind === "presses"}
                {#if selection.binding.strokes.length > 0}
                    <ul class="chips">
                        {#each selection.binding.strokes as stroke, index (index)}
                            <li class="chip">{stroke}</li>
                        {/each}
                    </ul>
                {/if}
                {#if selection.binding.keyDelay > 0}
                    <div class="caption dim">{t("Waits %lld ms", selection.binding.keyDelay)}</div>
                {/if}
                <div class="caption dim">
                    {t("%lld of %lld presses", selection.binding.used, selection.binding.limit)}
                </div>
                <div>
                    <button
                        type="button"
                        class="btn small"
                        disabled={!ready || selection.binding.strokes.length === 0}
                        onclick={() => editor.removeLastStroke()}
                    >
                        <Icon name="undo" size={14} />
                        {t("Remove Last Press")}
                    </button>
                </div>
            {:else if selection.binding.kind === "media"}
                <div class="large">
                    <Icon name={mediaIcon(selection.binding.choice)} size={20} />
                    {mediaTitle(selection.binding.choice)}
                </div>
            {:else if selection.binding.kind === "otherMedia"}
                <div class="large">{captionText({ kind: "otherMedia", usage: selection.binding.usage })}</div>
            {:else}
                <div class="large">
                    <Icon name={mouseIcon(selection.binding.choice)} size={20} />
                    {mouseTitle(selection.binding.choice)}
                </div>
            {/if}
        </div>
    {/if}
    {#if held !== null}
        <div class="caption held">{t("Next key with %@", held)}</div>
    {/if}
    <div class="spacer"></div>
    {#if clears}
        <div class="buttons">
            <button type="button" class="btn" disabled={!ready || !hasSelection} onclick={() => editor.clearSelected()}
                >{t("Clear")}</button
            >
            <button type="button" class="btn" disabled={!ready} onclick={() => editor.clearLayer()}
                >{t("Clear Layer")}</button
            >
        </div>
    {/if}
    {#if unsaved}
        <div class="caption unsaved">● {t("Unsaved changes")}</div>
    {:else if ready}
        <div class="caption dim">✓ {t("No unsaved changes")}</div>
    {/if}
</section>

<style>
    .inspector {
        display: flex;
        flex-direction: column;
        gap: 12px;
        min-width: 0;
        padding: 16px;
        border: 1px solid var(--mk-line);
        border-radius: 14px;
        background: var(--mk-surface);
        box-sizing: border-box;
    }

    .selected {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    h3 {
        margin: 0;
        font-size: 1.2em;
        font-weight: 700;
        line-height: 1.3;
        overflow-wrap: anywhere;
    }

    hr {
        width: 100%;
        margin: 0;
        border: 0;
        border-top: 1px solid var(--mk-line);
    }

    p {
        margin: 0;
    }

    .dim {
        color: var(--mk-dim);
    }

    .caption {
        font-size: 0.85em;
    }

    .chips {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
        margin: 0;
        padding: 0;
        list-style: none;
    }

    .chip {
        padding: 2px 8px;
        border-radius: 6px;
        background: var(--mk-tint);
        font-size: 1.05em;
        font-weight: 600;
        user-select: text;
    }

    .large {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 1.1em;
        font-weight: 600;
    }

    .held {
        color: var(--mk-accent-text);
        font-weight: 600;
    }

    .spacer {
        flex: 1;
    }

    .buttons {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .unsaved {
        color: var(--mk-warning-text);
        font-weight: 600;
    }
</style>
