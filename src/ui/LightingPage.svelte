<script lang="ts">
    // The shown layer's lights, in what the keyboard takes: a colour and an effect for the layer, or an effect and a
    // colour for each of the first keys.
    import { Rgb, type EditorModel } from "$presentation";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import { controlTitle, ledColorCss, ledColorTitle, lightingModeTitle } from "./names";
    import Section from "./Section.svelte";

    let { ed }: { ed: Live<EditorModel> } = $props();

    const editor = $derived(ed.model);
    const page = $derived(ed.read((e) => e.lightingPage()));
    const css = (color: Rgb) => `rgb(${color.red} ${color.green} ${color.blue})`;
</script>

{#snippet effects(modes: readonly number[], active: number | null, note: string | null)}
    <Section title={t("Effect")} {note}>
        <div class="wrap">
            {#each modes as mode (mode)}
                <button
                    type="button"
                    class="keycap mode"
                    class:active={active === mode}
                    aria-pressed={active === mode}
                    onclick={() => editor.setLightingMode(mode)}>{lightingModeTitle(mode)}</button
                >
            {/each}
        </div>
    </Section>
{/snippet}

<div class="lighting">
    {#if page?.kind === "colorAndMode"}
        <Section title={t("Color")}>
            <div class="wrap">
                {#each page.colors as color (color)}
                    <button
                        type="button"
                        class="keycap color"
                        class:active={page.activeColor === color}
                        aria-pressed={page.activeColor === color}
                        onclick={() => editor.setLightColor(color)}
                    >
                        <span class="dot" style:background={ledColorCss(color)} aria-hidden="true"></span>
                        {ledColorTitle(color)}
                    </button>
                {/each}
            </div>
        </Section>
        {@render effects(page.modes, page.activeMode, t("Lighting is set per layer; no key selection is needed."))}
    {:else if page?.kind === "perKeyColor"}
        {@render effects(page.modes, page.activeMode, null)}
        <Section
            title={t("Color")}
            note={t("Select one of keys 1–%lld on the keyboard, then pick its color.", page.keys)}
        >
            <div class="colors">
                <div class="palette">
                    {#each Rgb.PALETTE as color, index (index)}
                        <button
                            type="button"
                            class="swatch"
                            style:background={css(color)}
                            title={Rgb.hex(color)}
                            aria-label={Rgb.hex(color)}
                            onclick={() => editor.setKeyColor(color)}
                        ></button>
                    {/each}
                </div>
                {#if page.selected !== null}
                    <div class="preview">
                        <span class="preview-swatch" style:background={css(page.selected.color)}></span>
                        <span class="preview-title">{controlTitle(page.selected.title)}</span>
                        <span class="hex">{Rgb.hex(page.selected.color)}</span>
                    </div>
                {/if}
            </div>
        </Section>
    {/if}
</div>

<style>
    .lighting {
        display: flex;
        flex-direction: column;
        gap: 18px;
    }

    .wrap {
        display: flex;
        flex-wrap: wrap;
        gap: 8px;
    }

    .mode {
        min-width: 90px;
    }

    .color {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    .dot {
        width: 12px;
        height: 12px;
        border-radius: 50%;
    }

    .colors {
        display: flex;
        flex-wrap: wrap;
        align-items: flex-start;
        gap: 18px;
    }

    .palette {
        display: grid;
        grid-template-columns: repeat(14, minmax(0, 26px));
        gap: 5px;
        flex: 0 1 auto;
        min-width: 0;
    }

    .swatch {
        aspect-ratio: 1;
        min-width: 0;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 5px;
        box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35);
        cursor: pointer;
    }

    .swatch:hover {
        transform: scale(1.12);
    }

    .swatch:focus-visible {
        outline: 2px solid var(--mk-accent);
        outline-offset: 2px;
    }

    .preview {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 6px;
    }

    .preview-swatch {
        width: 60px;
        height: 60px;
        border-radius: 10px;
        box-shadow: inset 0 0 0 1px rgb(127 127 127 / 0.35);
    }

    .preview-title {
        font-size: 0.85em;
        font-weight: 700;
    }

    .hex {
        color: var(--mk-dim);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.85em;
        user-select: text;
    }
</style>
