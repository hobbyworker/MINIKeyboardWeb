<script lang="ts">
    // The connected keyboard as the view model draws it, turned the way it sits. The body and the caps are drawn; over
    // each cap lies a button — for clicking, focus, its tooltip and its name for assistive tools. A key shows its number
    // and what it does; a knob's actions show which way they turn.
    import { ActionCaption, ControlRef, type ControlDrawing, type EditorModel, type Rgb } from "$presentation";
    import Icon from "./Icon.svelte";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import { captionText, controlTitle } from "./names";

    let { ed }: { ed: Live<EditorModel> } = $props();

    /** Room around the keyboard, in the drawing's units — for the outline and the simulator's badge. */
    const PADDING = 26;
    /** The tallest the drawing grows, in pixels; and the most a unit of the drawing becomes. */
    const MAX_HEIGHT = 380;
    const MAX_SCALE = 1.15;

    const id = $props.id();
    const editor = $derived(ed.model);
    const drawing = $derived(ed.read((e) => e.drawing()));
    const ready = $derived(ed.read((e) => e.isReady()));
    const hasLayout = $derived(ed.read((e) => e.hasLayout()));
    const simulated = $derived(ed.read((e) => e.activeSimulatorId() !== null));

    const view = $derived.by(() => {
        if (drawing === null) return null;
        const { bounds } = drawing;
        const box = {
            x: bounds.x - PADDING,
            y: bounds.y - PADDING,
            width: bounds.width + 2 * PADDING,
            height: bounds.height + 2 * PADDING,
        };
        return {
            box,
            maxWidth: Math.min((MAX_HEIGHT * box.width) / box.height, box.width * MAX_SCALE),
            /** About 15 of the drawing's units: a key holds three lines of eight characters or so. */
            font: 1500 / box.width,
        };
    });

    function percent(value: number, whole: number): string {
        return `${(value / whole) * 100}%`;
    }

    function lighten(color: Rgb, amount: number): string {
        const up = (channel: number) => Math.round(channel + (255 - channel) * amount);
        return `rgb(${up(color.red)} ${up(color.green)} ${up(color.blue)})`;
    }

    function tooltip(control: ControlDrawing): string {
        const title = controlTitle(ControlRef.title(control.control));
        return ActionCaption.isAssigned(control.caption) ? `${title}: ${captionText(control.caption)}` : title;
    }

    /** The outline: the accent when selected; on a knob, green when it does something. */
    function outline(control: ControlDrawing): { color: string; width: number } {
        if (control.isSelected) return { color: "var(--mk-canvas-selection)", width: 3 };
        if (control.face.kind === "knob") {
            return ActionCaption.isAssigned(control.caption)
                ? { color: "rgb(51 209 122 / 0.75)", width: 1.5 }
                : { color: "rgb(255 255 255 / 0.15)", width: 1.5 };
        }
        return { color: "rgb(255 255 255 / 0.15)", width: 1 };
    }

    function fill(control: ControlDrawing, index: number): string {
        if (control.face.kind === "key") return control.ledColor ? `url(#${id}-led-${index})` : `url(#${id}-key)`;
        return control.face.action === "press" ? `url(#${id}-press)` : `url(#${id}-turn)`;
    }
</script>

<section class="area" aria-label={t("Keyboard")}>
    {#if drawing !== null && view !== null}
        <div class="stage">
            <div
                class="board"
                class:dim={!ready}
                style:width="min(100%, {view.maxWidth}px)"
                style:aspect-ratio="{view.box.width} / {view.box.height}"
                style:--font="clamp(9px, {view.font}cqw, 15px)"
            >
                <svg
                    class="drawing"
                    viewBox="{view.box.x} {view.box.y} {view.box.width} {view.box.height}"
                    aria-hidden="true"
                    focusable="false"
                >
                    <defs>
                        <linearGradient id="{id}-body" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#474747" />
                            <stop offset="1" stop-color="#303030" />
                        </linearGradient>
                        <linearGradient id="{id}-key" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#757575" />
                            <stop offset="1" stop-color="#616161" />
                        </linearGradient>
                        <linearGradient id="{id}-press" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#808080" />
                            <stop offset="1" stop-color="#6b6b6b" />
                        </linearGradient>
                        <linearGradient id="{id}-turn" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0" stop-color="#666666" />
                            <stop offset="1" stop-color="#525252" />
                        </linearGradient>
                        {#each drawing.controls as control, index (ControlRef.id(control.control))}
                            {#if control.ledColor}
                                <linearGradient id="{id}-led-{index}" x1="0" y1="0" x2="0" y2="1">
                                    <stop offset="0" stop-color={lighten(control.ledColor, 0.12)} />
                                    <stop offset="1" stop-color={lighten(control.ledColor, 0)} />
                                </linearGradient>
                            {/if}
                        {/each}
                    </defs>
                    <rect
                        class="body"
                        x={drawing.frame.x}
                        y={drawing.frame.y}
                        width={drawing.frame.width}
                        height={drawing.frame.height}
                        rx="24"
                        fill="url(#{id}-body)"
                    />
                    {#if simulated}
                        <rect
                            x={drawing.frame.x}
                            y={drawing.frame.y}
                            width={drawing.frame.width}
                            height={drawing.frame.height}
                            rx="24"
                            fill="none"
                            stroke="var(--mk-simulator)"
                            stroke-width="4"
                            vector-effect="non-scaling-stroke"
                        />
                    {/if}
                    {#each drawing.controls as control, index (ControlRef.id(control.control))}
                        {@const line = outline(control)}
                        {#if control.face.kind === "key"}
                            <rect
                                x={control.rect.x}
                                y={control.rect.y}
                                width={control.rect.width}
                                height={control.rect.height}
                                rx="12"
                                fill={fill(control, index)}
                                stroke={line.color}
                                stroke-width={line.width}
                                vector-effect="non-scaling-stroke"
                            />
                        {:else}
                            <circle
                                cx={control.rect.x + control.rect.width / 2}
                                cy={control.rect.y + control.rect.height / 2}
                                r={Math.min(control.rect.width, control.rect.height) / 2}
                                fill={fill(control, index)}
                                stroke={line.color}
                                stroke-width={line.width}
                                vector-effect="non-scaling-stroke"
                            />
                        {/if}
                    {/each}
                </svg>
                {#each drawing.controls as control (ControlRef.id(control.control))}
                    {@const label = tooltip(control)}
                    <button
                        type="button"
                        class="control"
                        class:knob={control.face.kind === "knob"}
                        class:lit={control.ledColor !== null}
                        style:left={percent(control.rect.x - view.box.x, view.box.width)}
                        style:top={percent(control.rect.y - view.box.y, view.box.height)}
                        style:width={percent(control.rect.width, view.box.width)}
                        style:height={percent(control.rect.height, view.box.height)}
                        title={label}
                        aria-label={label}
                        aria-pressed={control.isSelected}
                        disabled={!ready}
                        onclick={() => editor.select(control.control)}
                    >
                        {#if control.face.kind === "key"}
                            <span class="number" aria-hidden="true">{control.face.number}</span>
                            <span class="caption" aria-hidden="true"><span>{captionText(control.caption)}</span></span>
                        {:else}
                            <Icon
                                name={control.face.action === "press"
                                    ? "press"
                                    : control.face.action === "rotateLeft" || control.face.action === "pressRotateLeft"
                                      ? "rotateLeft"
                                      : "rotateRight"}
                            />
                        {/if}
                        {#if control.isChanged}
                            <span class="changed" aria-hidden="true"></span>
                        {/if}
                    </button>
                {/each}
                {#if simulated}
                    <span
                        class="badge"
                        style:left={percent(drawing.frame.x + drawing.frame.width / 2 - view.box.x, view.box.width)}
                        style:top={percent(drawing.frame.y - view.box.y, view.box.height)}>{t("Simulator")}</span
                    >
                {/if}
            </div>
        </div>
    {:else}
        <div class="empty">
            <Icon name="keyboard" size={40} />
            <p>{t("Keys appear here once the keyboard is connected.")}</p>
        </div>
    {/if}
    {#if hasLayout}
        <div class="layout-buttons">
            <button
                type="button"
                class="btn osd round"
                title={t("Rotate")}
                aria-label={t("Rotate")}
                onclick={() => editor.rotate()}><Icon name="rotateRight" /></button
            >
            <button type="button" class="btn osd" onclick={() => editor.setChoosingLayout(true)}>{t("Shape…")}</button>
        </div>
    {/if}
</section>

<style>
    .area {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: center;
        min-height: 230px;
        padding: 10px 16px;
        border: 1px solid var(--mk-line);
        border-radius: 14px;
        background: var(--mk-surface);
        box-sizing: border-box;
    }

    .stage {
        display: flex;
        justify-content: center;
        padding-bottom: 40px;
    }

    .board {
        position: relative;
        container-type: inline-size;
        transition: opacity 0.15s;
    }

    .board.dim {
        opacity: 0.45;
    }

    .drawing {
        position: absolute;
        inset: 0;
        width: 100%;
        height: 100%;
        overflow: visible;
    }

    .body {
        filter: drop-shadow(0 3px 8px rgb(0 0 0 / 0.3));
    }

    .control {
        position: absolute;
        display: flex;
        flex-direction: column;
        box-sizing: border-box;
        min-width: 0;
        margin: 0;
        padding: 0;
        border: 0;
        border-radius: 12%;
        background: none;
        color: white;
        font: inherit;
        font-size: var(--font);
        line-height: 1.2;
        cursor: pointer;
        overflow: hidden;
    }

    .control:disabled {
        cursor: default;
    }

    .control:hover:not(:disabled) {
        background: rgb(255 255 255 / 0.07);
    }

    .control:focus-visible {
        outline: 2px solid var(--mk-canvas-selection);
        outline-offset: 2px;
        overflow: visible;
    }

    .control.knob {
        align-items: center;
        justify-content: center;
        border-radius: 50%;
    }

    .control.knob :global(.icon) {
        width: 44%;
        height: 44%;
    }

    .number {
        align-self: flex-start;
        padding: 0.3em 0 0 0.5em;
        color: #66db66;
        font-weight: 700;
    }

    .lit .number {
        color: white;
        text-shadow: 0 0 2px rgb(0 0 0 / 0.8);
    }

    .caption {
        display: flex;
        flex: 1;
        align-items: center;
        justify-content: center;
        min-height: 0;
        padding: 0 0.25em 0.4em;
    }

    .caption > span {
        display: -webkit-box;
        overflow: hidden;
        font-weight: 500;
        text-align: center;
        text-shadow: 0 0 2px rgb(0 0 0 / 0.7);
        overflow-wrap: anywhere;
        -webkit-box-orient: vertical;
        -webkit-line-clamp: 3;
        line-clamp: 3;
    }

    .changed {
        position: absolute;
        top: 5px;
        right: 5px;
        width: 7px;
        height: 7px;
        border-radius: 50%;
        background: #ff7800;
    }

    /* On the circle's edge, up and to the right — the corner of the button is outside the knob. */
    .knob .changed {
        top: calc(14.6% - 3.5px);
        right: calc(14.6% - 3.5px);
    }

    .badge {
        position: absolute;
        padding: 2px 12px 3px;
        border-radius: 6px;
        background: var(--mk-simulator);
        color: white;
        font-size: 0.9em;
        font-weight: 700;
        line-height: 1.4;
        transform: translate(-50%, -50%);
        white-space: nowrap;
        pointer-events: none;
    }

    .empty {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 8px;
        padding: 24px 8px;
        color: var(--mk-dim);
        text-align: center;
    }

    .empty p {
        margin: 0;
    }

    .layout-buttons {
        position: absolute;
        right: 10px;
        bottom: 10px;
        display: flex;
        gap: 6px;
    }
</style>
