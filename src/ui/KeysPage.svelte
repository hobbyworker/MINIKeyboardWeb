<script lang="ts">
    // Modifiers to hold, then a key: each key pressed is added to the selected key's presses. The keys are laid out as on
    // a full-size keyboard or in groups, as the user picks — until then, as the keyboard's vendor tool does — and only
    // the keys the keyboard is given can be pressed.
    import { BoardCap, ModifierKey, type EditorModel, type KeyArrangement, type KeyUsage } from "$presentation";
    import { radioKeys } from "./keys";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import { keyGroupTitle, keyName, modifierTitle } from "./names";
    import type { Platform } from "./props";
    import Section from "./Section.svelte";

    let { ed, platform }: { ed: Live<EditorModel>; platform: Platform } = $props();

    /** Where this browser keeps the user's choice of layout, beside the app's other keys. */
    const ARRANGEMENT_KEY = "minikeyboard.keyArrangement";
    const ARRANGEMENTS: readonly { arrangement: KeyArrangement; label: string }[] = [
        { arrangement: "qwerty", label: "QWERTY" },
        { arrangement: "alphabetical", label: "ABC" },
    ];

    function storedArrangement(): KeyArrangement | null {
        try {
            const value = globalThis.localStorage?.getItem(ARRANGEMENT_KEY);
            return value === "qwerty" || value === "alphabetical" ? value : null;
        } catch {
            return null;
        }
    }

    let chosen = $state<KeyArrangement | null>(storedArrangement());

    function choose(arrangement: KeyArrangement) {
        chosen = arrangement;
        try {
            globalThis.localStorage?.setItem(ARRANGEMENT_KEY, arrangement);
        } catch {
            // Not kept — the page shows the vendor tool's layout next time.
        }
    }

    const editor = $derived(ed.model);
    const arrangement = $derived(chosen ?? ed.read((e) => e.vendorKeyArrangement()));
    const limit = $derived(ed.read((e) => e.pressLimit()));
    const modifiersCount = $derived(ed.read((e) => e.modifiersCountAsPresses()));
    const held = $derived(ed.read((e) => e.heldModifiers()));
    const board = $derived(arrangement === "qwerty" ? ed.read((e) => e.keyBoard()) : []);
    const more = $derived(arrangement === "qwerty" ? ed.read((e) => e.moreKeys()) : []);
    const groups = $derived(arrangement === "alphabetical" ? ed.read((e) => e.keyGroups()) : []);
    const shiftSymbols = $derived(arrangement === "alphabetical" ? ed.read((e) => e.shiftSymbols()) : []);

    const note = $derived.by(() => {
        if (limit === 0) return t("Modifiers apply to the next key.");
        return modifiersCount
            ? t(
                  "Modifiers apply to the next key. A key holds up to %lld presses, each modifier counting as one.",
                  limit,
              )
            : t("Modifiers apply to the next key. A key holds up to %lld presses.", limit);
    });

    /**
     * The full-size keyboard in two blocks: the main one, 15 key widths, and the navigation keys and the keypad, a
     * quarter further on. Side by side they are one keyboard; on a narrow page the second goes under the first, its
     * keys larger — there is room for that, and their labels are long.
     */
    const MAIN_WIDTH = 15;
    const SIDE_START = 15.25;
    const quarters = (value: number) => Math.round(value * 4);
    const mainBlock = $derived(board.filter((cap) => cap.column < MAIN_WIDTH));
    const sideBlock = $derived(board.filter((cap) => cap.column >= MAIN_WIDTH));

    /** A cap's place in its block's grid of quarter key widths. */
    function placement(cap: BoardCap, start: number): { column: string; row: number } {
        return {
            column: `${quarters(cap.column - start) + 1} / span ${quarters(cap.width)}`,
            row: cap.row + 1,
        };
    }
</script>

{#snippet keyButton(key: KeyUsage, compact: boolean, enabled: boolean)}
    <button
        type="button"
        class="keycap"
        class:compact
        title={enabled ? keyName(key, platform) : t("This keyboard doesn’t take this key.")}
        aria-label={keyName(key, platform)}
        disabled={!enabled}
        onclick={() => editor.press(key)}
    >
        {#if key.shifted !== null}
            <span class="shifted" aria-hidden="true">{key.shifted}</span>
        {/if}
        <span class="label">{key.label}</span>
    </button>
{/snippet}

{#snippet modifierButton(modifier: ModifierKey, compact: boolean)}
    <button
        type="button"
        class="keycap modifier"
        class:compact
        class:active={held.includes(modifier)}
        aria-pressed={held.includes(modifier)}
        title={modifierTitle(modifier, platform)}
        aria-label={modifierTitle(modifier, platform)}
        onclick={() => editor.toggle(modifier)}><span class="label">{ModifierKey.label(modifier)}</span></button
    >
{/snippet}

<div class="keys-page">
    <div class="top">
        <div class="row">
            <div class="segmented" role="radiogroup" aria-label={t("Key Layout")} title={t("Key Layout")}>
                {#each ARRANGEMENTS as item, index (item.arrangement)}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={arrangement === item.arrangement}
                        tabindex={arrangement === item.arrangement ? 0 : -1}
                        onclick={() => choose(item.arrangement)}
                        onkeydown={(event) =>
                            radioKeys(event, index, ARRANGEMENTS.length, (next) => {
                                const target = ARRANGEMENTS[next];
                                if (target) choose(target.arrangement);
                            })}>{item.label}</button
                    >
                {/each}
            </div>
            <button
                type="button"
                class="keycap"
                title={t("Makes the key hold these modifiers, as a modifier key does.")}
                disabled={held.length === 0}
                onclick={() => editor.assignHeldModifiers()}>{t("Modifiers Only")}</button
            >
        </div>
        <p class="note">{note}</p>
    </div>

    {#if arrangement === "qwerty"}
        <div
            class="board"
            style:--main-columns={quarters(MAIN_WIDTH)}
            style:--side-columns={quarters(BoardCap.ROW_WIDTH - SIDE_START)}
            style:--tracks="minmax(0, {quarters(MAIN_WIDTH)}fr) minmax(0, {quarters(SIDE_START - MAIN_WIDTH)}fr)
            minmax(0, {quarters(BoardCap.ROW_WIDTH - SIDE_START)}fr)"
        >
            {#each [{ block: "main", caps: mainBlock, start: 0 }, { block: "side", caps: sideBlock, start: SIDE_START }] as { block, caps, start } (block)}
                <div class="block {block}">
                    {#each caps as cap (`${cap.row}:${cap.column}`)}
                        {@const place = placement(cap, start)}
                        <div class="place" style:grid-column={place.column} style:grid-row={place.row}>
                            {#if cap.face.kind === "key"}
                                {@render keyButton(cap.face.key, true, cap.isEnabled)}
                            {:else}
                                {@render modifierButton(cap.face.modifier, true)}
                            {/if}
                        </div>
                    {/each}
                </div>
            {/each}
        </div>
        {#if more.length > 0}
            <Section title={t("More Keys")}>
                <div class="wrap">
                    {#each more as key (key.usage)}
                        {@render keyButton(key, false, true)}
                    {/each}
                </div>
            </Section>
        {/if}
    {:else}
        <Section title={t("Modifiers")}>
            <div class="wrap">
                {#each ModifierKey.ALL as modifier (modifier)}
                    {@render modifierButton(modifier, false)}
                {/each}
            </div>
        </Section>
        {#each groups as group (group.kind)}
            <Section title={keyGroupTitle(group.kind)}>
                <div class="wrap">
                    {#each group.keys as key (key.usage)}
                        {@render keyButton(key, false, true)}
                    {/each}
                </div>
            </Section>
        {/each}
        <Section title={t("Shift Symbols")}>
            <div class="wrap">
                {#each shiftSymbols as key (key.usage)}
                    <button
                        type="button"
                        class="keycap"
                        title="Shift+{key.label}"
                        onclick={() => editor.pressShifted(key)}>{key.shifted}</button
                    >
                {/each}
            </div>
        </Section>
    {/if}
</div>

<style>
    .keys-page {
        display: flex;
        flex-direction: column;
        gap: 16px;
    }

    .top {
        display: flex;
        flex-direction: column;
        gap: 8px;
    }

    .row {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px 12px;
    }

    .note {
        margin: 0;
        color: var(--mk-dim);
        font-size: 0.85em;
    }

    /* The full-size keyboard: two grids of quarter key widths, as wide as their keys, a quarter apart. */
    .board {
        display: grid;
        grid-template-columns: var(--tracks);
        gap: 12px 0;
    }

    .block {
        display: grid;
        grid-auto-rows: 32px;
        gap: 3px 0;
        min-width: 0;
    }

    .block.main {
        grid-template-columns: repeat(var(--main-columns), minmax(0, 1fr));
    }

    .block.side {
        grid-column: 3;
        grid-template-columns: repeat(var(--side-columns), minmax(0, 1fr));
    }

    .place {
        display: flex;
        min-width: 0;
        padding: 0 1px;
    }

    .place > :global(.keycap) {
        flex: 1;
    }

    @container mk (max-width: 799px) {
        .board {
            grid-template-columns: minmax(0, 1fr);
        }

        /* Keys half as large again as the main block's. */
        .block.side {
            grid-column: 1;
            width: calc(100% * var(--side-columns) * 1.5 / var(--main-columns));
        }

        .block :global(.keycap.compact) {
            font-size: 0.68em;
        }
    }

    .wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 4px;
    }

    .wrap > :global(.keycap.modifier) {
        min-width: 58px;
    }

    .keycap .shifted {
        display: block;
        font-size: 0.75em;
        line-height: 1;
        opacity: 0.6;
    }

    .keycap .label {
        display: block;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
    }
</style>
