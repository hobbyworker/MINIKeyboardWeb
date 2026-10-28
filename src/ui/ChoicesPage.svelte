<script lang="ts" generics="Choice extends string">
    // Media keys or mouse actions: a cap for each, the one the key does marked.
    import Icon from "./Icon.svelte";
    import type { IconName } from "./icons";
    import Section from "./Section.svelte";

    let {
        title,
        note,
        choices,
        active,
        face,
        assign,
        width,
    }: {
        title: string;
        note: string;
        choices: readonly Choice[];
        /** The choice the selected key does, if any. */
        active: Choice | null;
        face: (choice: Choice) => { icon: IconName; title: string };
        assign: (choice: Choice) => void;
        /** The least a cap takes, in pixels. */
        width: number;
    } = $props();
</script>

<Section {title} {note}>
    <div class="grid" style:--width="{width}px">
        {#each choices as choice (choice)}
            {@const shown = face(choice)}
            <button
                type="button"
                class="keycap tall"
                class:active={active === choice}
                aria-pressed={active === choice}
                onclick={() => assign(choice)}
            >
                <Icon name={shown.icon} />
                <span>{shown.title}</span>
            </button>
        {/each}
    </div>
</Section>

<style>
    .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(var(--width), 100%), 1fr));
        gap: 8px;
    }

    .tall {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        gap: 3px;
        min-height: 54px;
        padding: 6px 8px;
        text-align: center;
    }
</style>
