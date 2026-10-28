<script lang="ts">
    // Waits: before each press on the standard format, for the whole key on the legacy one.
    import type { DelayRange, EditorModel } from "$presentation";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import Section from "./Section.svelte";

    let { ed }: { ed: Live<EditorModel> } = $props();

    const editor = $derived(ed.model);
    const page = $derived(ed.read((e) => e.delayPage()));

    /** The field's number, kept in `range`; `null` while it isn't one. */
    function valueOf(input: HTMLInputElement, range: DelayRange): number | null {
        const value = Math.round(input.valueAsNumber);
        if (!Number.isFinite(value)) return null;
        return Math.min(range.end, Math.max(range.start, value));
    }
</script>

{#snippet milliseconds(value: number, range: DelayRange, label: string, commit: (value: number) => void)}
    <span class="field">
        <input
            type="number"
            inputmode="numeric"
            min={range.start}
            max={range.end}
            step="10"
            {value}
            aria-label={label}
            onchange={(event) => {
                const input = event.currentTarget;
                const next = valueOf(input, range);
                if (next === null) input.value = String(value);
                else {
                    input.value = String(next);
                    commit(next);
                }
            }}
        />
        <span class="dim">ms</span>
    </span>
{/snippet}

<div class="delay">
    {#if page.kind === "perPress"}
        <Section
            title={t("Delay")}
            note={t("Each press can wait before it is sent. Give the key its presses on the Keys page first.")}
        >
            {#if page.presses.length === 0}
                <p class="dim">{t("The selected key has no presses.")}</p>
            {:else}
                <div class="presses">
                    {#each page.presses as press (press.index)}
                        {@const name = t("Press %lld", press.index + 1)}
                        <span class="dim">{name}</span>
                        <span class="stroke">{press.text}</span>
                        {@render milliseconds(press.delay, page.range, name, (value) =>
                            editor.setDelay(press.index, value),
                        )}
                    {/each}
                </div>
            {/if}
        </Section>
    {:else if page.kind === "perKey"}
        <Section title={t("Delay")} note={t("One wait for the whole key. Its presses stay.")}>
            {#if page.value === null}
                <p class="dim">{t("Select a key or knob.")}</p>
            {:else}
                {@render milliseconds(page.value, page.range, t("Delay"), (value) => editor.setKeyDelay(value))}
            {/if}
        </Section>
    {/if}
</div>

<style>
    .presses {
        display: grid;
        grid-template-columns: max-content minmax(90px, max-content) max-content;
        align-items: center;
        gap: 6px 14px;
    }

    .stroke {
        font-weight: 600;
        overflow-wrap: anywhere;
    }

    .field {
        display: inline-flex;
        align-items: center;
        gap: 6px;
    }

    input {
        width: 7.5em;
        box-sizing: border-box;
        padding: 5px 8px;
        border: 1px solid var(--mk-line-strong);
        border-radius: 8px;
        background: var(--mk-field);
        color: inherit;
        font: inherit;
        font-variant-numeric: tabular-nums;
    }

    input:focus-visible {
        outline: 2px solid var(--mk-accent);
        outline-offset: 1px;
    }

    input:disabled {
        opacity: 0.5;
    }

    p {
        margin: 0;
    }

    .dim {
        color: var(--mk-dim);
    }
</style>
