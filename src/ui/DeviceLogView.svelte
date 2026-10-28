<script lang="ts">
    // The reports written to the keyboard and its answers, for checking what a keyboard does. A report shows on one
    // line up to the zero padding at its end; opened, it shows every byte.
    import { LogLine, type DeviceLogModel } from "$presentation";
    import { tick } from "svelte";
    import { SvelteSet } from "svelte/reactivity";
    import CopyButton from "./CopyButton.svelte";
    import Icon from "./Icon.svelte";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import { logEventMessage } from "./names";

    let { log }: { log: Live<DeviceLogModel> } = $props();

    const lines = $derived(log.read((model) => model.lines()));
    const expanded = new SvelteSet<number>();
    let list: HTMLOListElement | undefined = $state();

    const canExpand = (line: LogLine) => line.event === null && (LogLine.isShortened(line) || line.bytes.length > 16);
    const expandable = $derived(lines.filter(canExpand));
    const allExpanded = $derived(expandable.length > 0 && expandable.every((line) => expanded.has(line.id)));

    function toggleAll() {
        const open = !allExpanded;
        for (const line of expandable) {
            if (open) expanded.add(line.id);
            else expanded.delete(line.id);
        }
    }

    function toggle(id: number) {
        if (expanded.has(id)) expanded.delete(id);
        else expanded.add(id);
    }

    /** "14:03:27.412", in local time. */
    function timeText(line: LogLine): string {
        const time = new Date(line.time);
        const two = (value: number) => String(value).padStart(2, "0");
        return `${two(time.getHours())}:${two(time.getMinutes())}:${two(time.getSeconds())}.${String(time.getMilliseconds()).padStart(3, "0")}`;
    }

    /** Every line, every byte of each report. */
    const copyText = $derived(
        lines
            .map((line) => {
                const mark = line.direction === "output" ? "OUT" : line.direction === "input" ? "IN " : "-- ";
                const body = line.event !== null ? logEventMessage(line.event) : LogLine.hex(line);
                return `${timeText(line)} ${mark} ${body}`;
            })
            .join("\n"),
    );

    // New lines scroll into view.
    let shown = 0;
    $effect(() => {
        const count = lines.length;
        if (count > shown) {
            void tick().then(() => {
                if (list) list.scrollTop = list.scrollHeight;
            });
        }
        shown = count;
    });
</script>

<div class="log">
    <div class="bar">
        <span class="count">{t("Packets: %lld", lines.length)}</span>
        <button type="button" class="btn small" disabled={expandable.length === 0} onclick={toggleAll}
            >{allExpanded ? t("Collapse All") : t("Expand All")}</button
        >
        {#if lines.length > 0}
            <CopyButton text={copyText} />
        {/if}
        <button
            type="button"
            class="btn small"
            disabled={lines.length === 0}
            onclick={() => {
                expanded.clear();
                log.model.clear();
            }}>{t("Clear")}</button
        >
    </div>
    {#if lines.length === 0}
        <p class="empty">{t("No packets yet.")}</p>
    {:else}
        <ol class="lines" bind:this={list}>
            {#each lines as line (line.id)}
                {@const open = canExpand(line) && expanded.has(line.id)}
                <li class="line">
                    <div class="head">
                        {#if canExpand(line)}
                            <button
                                type="button"
                                class="icon-button chevron"
                                aria-expanded={open}
                                aria-label={open ? t("Collapse") : t("Expand")}
                                title={open ? t("Collapse") : t("Expand")}
                                onclick={() => toggle(line.id)}
                                ><Icon name={open ? "chevronDown" : "chevronRight"} size={14} /></button
                            >
                        {:else}
                            <span class="chevron" aria-hidden="true"></span>
                        {/if}
                        <span class="dim">{timeText(line)}</span>
                        <span class="direction {line.direction}">
                            <Icon
                                name={line.direction === "output"
                                    ? "arrowUp"
                                    : line.direction === "input"
                                      ? "arrowDown"
                                      : "info"}
                                size={14}
                            />
                        </span>
                        <span class="body"
                            >{line.event !== null ? logEventMessage(line.event) : LogLine.summary(line)}</span
                        >
                        {#if LogLine.isShortened(line)}
                            <span class="dim">… {t("%lld bytes", line.bytes.length)}</span>
                        {/if}
                    </div>
                    {#if open}
                        <pre class="detail">{LogLine.rows(line).join("\n")}</pre>
                    {/if}
                </li>
            {/each}
        </ol>
    {/if}
</div>

<style>
    .log {
        display: flex;
        flex-direction: column;
        gap: 10px;
    }

    .bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 8px;
    }

    .count {
        flex: 1;
        color: var(--mk-dim);
    }

    .empty {
        margin: 0;
        padding: 40px 0;
        color: var(--mk-dim);
        text-align: center;
    }

    .lines {
        max-height: 280px;
        margin: 0;
        padding: 4px 0;
        overflow: auto;
        border: 1px solid var(--mk-line);
        border-radius: 10px;
        list-style: none;
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.8em;
    }

    .line {
        padding: 2px 8px;
    }

    .head {
        display: flex;
        align-items: center;
        gap: 10px;
        min-height: 26px;
        white-space: nowrap;
    }

    .chevron {
        flex: none;
        width: 24px;
        height: 24px;
    }

    .body {
        user-select: text;
    }

    .direction {
        display: inline-flex;
    }

    .direction.output {
        color: var(--mk-accent-text);
    }

    .direction.input {
        color: var(--mk-success);
    }

    .direction.event,
    .dim {
        color: var(--mk-dim);
    }

    .detail {
        margin: 2px 0 6px 34px;
        color: var(--mk-dim);
        font: inherit;
        user-select: text;
    }
</style>
