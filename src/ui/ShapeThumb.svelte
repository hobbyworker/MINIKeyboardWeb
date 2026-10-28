<script lang="ts">
    // A keyboard's shape drawn small, for choosing one: keys, and each knob as one body, in the text's colour.
    import type { ShapeDrawing } from "$presentation";

    let { drawing, padding = 16 }: { drawing: ShapeDrawing | null; padding?: number } = $props();

    const box = $derived(
        drawing === null
            ? null
            : {
                  x: drawing.bounds.x - padding,
                  y: drawing.bounds.y - padding,
                  width: drawing.bounds.width + 2 * padding,
                  height: drawing.bounds.height + 2 * padding,
              },
    );
</script>

{#if drawing !== null && box !== null}
    <svg
        class="shape"
        viewBox="{box.x} {box.y} {box.width} {box.height}"
        preserveAspectRatio="xMidYMid meet"
        aria-hidden="true"
        focusable="false"
    >
        {#each drawing.items as item, index (index)}
            {#if item.isKnob}
                <circle
                    cx={item.rect.x + item.rect.width / 2}
                    cy={item.rect.y + item.rect.height / 2}
                    r={Math.min(item.rect.width, item.rect.height) / 2}
                />
            {:else}
                <rect
                    x={item.rect.x}
                    y={item.rect.y}
                    width={item.rect.width}
                    height={item.rect.height}
                    rx={Math.min(12, item.rect.width / 2)}
                />
            {/if}
        {/each}
    </svg>
{/if}

<style>
    .shape {
        display: block;
        width: 100%;
        height: 100%;
        fill: currentColor;
        fill-opacity: 0.45;
    }
</style>
