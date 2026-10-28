<script lang="ts">
    // Sets the shape of a keyboard that can't say it, and how the keyboard is turned: one of the cross-platform app's
    // layouts, or — for a keyboard that said its shape — only the turn. Made each time the dialog opens; the first time
    // for a keyboard there is no Cancel, there being nothing to go back to.
    import type { EditorModel, LayoutSheetState } from "$presentation";
    import { untrack } from "svelte";
    import Icon from "./Icon.svelte";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import ShapeThumb from "./ShapeThumb.svelte";

    let { ed, sheet, oncancel }: { ed: Live<EditorModel>; sheet: LayoutSheetState; oncancel: () => void } = $props();

    const editor = $derived(ed.model);
    let layoutId = $state<string | null>(null);
    let quarterTurns = $state(untrack(() => sheet.quarterTurns));

    const chosenId = $derived(sheet.mode.kind === "catalog" ? (layoutId ?? sheet.mode.selectedId) : null);
    const preview = $derived(ed.read((e) => e.previewDrawing(chosenId, quarterTurns)));
    const reported = $derived(
        sheet.reportedKeys !== null && sheet.reportedKnobs !== null
            ? t(
                  "The keyboard reports its keys and knobs: %@",
                  t("Keys: %lld · Knobs: %lld", sheet.reportedKeys, sheet.reportedKnobs),
              )
            : t("The keyboard doesn’t say how many keys and knobs it has."),
    );

    function done() {
        editor.chooseLayout(chosenId, quarterTurns);
        // Choosing ends the choice, and the window closes the dialog; this ends it even when the keyboard went away.
        editor.setChoosingLayout(false);
    }
</script>

<div class="sheet">
    <div class="explanation">
        <div class="mono dim">{sheet.usb}</div>
        <p class="dim">{reported}</p>
        <p class="dim">
            {t("Pick the shape that matches the keyboard, then rotate it to match how it sits in front of you.")}
        </p>
    </div>

    {#if sheet.mode.kind === "catalog"}
        <div class="catalog">
            {#each sheet.mode.choices as choice (choice.id)}
                <button
                    type="button"
                    class="keycap layout"
                    class:active={chosenId === choice.id}
                    aria-pressed={chosenId === choice.id}
                    aria-label={t("Keys: %lld · Knobs: %lld", choice.keys, choice.knobs)}
                    onclick={() => (layoutId = choice.id)}
                >
                    <span class="thumb"><ShapeThumb drawing={choice.drawing} padding={10} /></span>
                    <span class="counts">{choice.keys} + {choice.knobs}</span>
                </button>
            {/each}
        </div>
    {/if}

    <div class="preview">
        <ShapeThumb drawing={preview} padding={20} />
    </div>

    <div class="footer">
        <button type="button" class="btn" onclick={() => (quarterTurns = (quarterTurns + 1) % 4)}>
            <Icon name="rotateRight" />
            {t("Rotate")}
        </button>
        <span class="grow"></span>
        {#if !sheet.isRequired}
            <button type="button" class="btn" onclick={oncancel}>{t("Cancel")}</button>
        {/if}
        <button type="button" class="btn accent" onclick={done}>{t("Done")}</button>
    </div>
</div>

<style>
    .sheet {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .explanation {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    p {
        margin: 0;
    }

    .dim {
        color: var(--mk-dim);
    }

    .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.9em;
    }

    .catalog {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(92px, 1fr));
        gap: 8px;
        max-height: 230px;
        padding: 2px;
        overflow-y: auto;
    }

    .layout {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
        padding: 6px 4px;
    }

    .thumb {
        display: block;
        width: 80px;
        height: 52px;
    }

    .counts {
        font-size: 0.85em;
        font-variant-numeric: tabular-nums;
    }

    .preview {
        height: 220px;
        padding: 6px;
        border-radius: 10px;
        background: var(--mk-tint);
        box-sizing: border-box;
    }

    .footer {
        position: sticky;
        bottom: -16px;
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
        margin: 0 -20px -16px;
        padding: 12px 20px 18px;
        border-top: 1px solid var(--mk-line);
        background: var(--mk-raised);
    }

    .grow {
        flex: 1;
    }
</style>
