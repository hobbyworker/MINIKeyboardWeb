<script lang="ts">
    // A titled group of controls in a page, with a note under it.
    import type { Snippet } from "svelte";

    let { title, note, children }: { title: string; note?: string | null; children: Snippet } = $props();
    const id = $props.id();
</script>

<section class="section" aria-labelledby="{id}-title">
    <h4 id="{id}-title">{title}</h4>
    {@render children()}
    {#if note}
        <p class="note">{note}</p>
    {/if}
</section>

<style>
    .section {
        display: flex;
        flex-direction: column;
        gap: 8px;
        min-width: 0;
    }

    h4 {
        margin: 0;
        color: var(--mk-dim);
        font-size: 0.9em;
        font-weight: 600;
    }

    .note {
        margin: 0;
        color: var(--mk-dim);
        font-size: 0.85em;
    }
</style>
