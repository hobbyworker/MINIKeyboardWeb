<script lang="ts">
    // What is known about the keyboard plugged in. Nothing is guessed: what the keyboard or the browser doesn't say
    // shows as not provided.
    import type { KeyboardInfo } from "$presentation";
    import { t } from "./l10n.svelte";
    import { channelText, commandsText, interfaceRoleTitle } from "./names";

    let { info }: { info: KeyboardInfo } = $props();
</script>

{#snippet provided(value: string | null)}
    {#if value === null}
        <dd class="dim">{t("Not provided by the keyboard")}</dd>
    {:else}
        <dd class="selectable">{value}</dd>
    {/if}
{/snippet}

<div class="info">
    <h3>{t("Keyboard Information")}</h3>
    <dl>
        <dt>USB ID</dt>
        <dd class="selectable mono">{info.usbId}</dd>
        <dt>{t("Name")}</dt>
        {@render provided(info.name)}
        <dt>{t("Manufacturer")}</dt>
        {@render provided(info.manufacturer)}
        <dt>{t("Serial Number")}</dt>
        {@render provided(info.serialNumber)}
        <!-- No USB descriptor names the chip. -->
        <dt>{t("Chip")}</dt>
        {@render provided(null)}
        <dt>{t("Firmware")}</dt>
        {#if info.firmware.kind === "reported"}
            <dd>
                <span class="selectable">{info.firmware.type}</span>
                <span class="caption dim">{t("Keys: %lld · Knobs: %lld", info.firmware.keys, info.firmware.knobs)}</span
                >
                {#if !info.firmware.isTested}
                    <span class="caption warning">{t("Not tested yet")}</span>
                {/if}
            </dd>
        {:else if info.firmware.kind === "release"}
            <dd class="selectable">{info.firmware.version}</dd>
        {:else}
            {@render provided(null)}
        {/if}
        {#if info.usb !== null}
            <dt>USB</dt>
            <dd class="selectable">{info.usb}</dd>
        {/if}
        {#if info.power !== null}
            <dt>{t("Power")}</dt>
            <dd class="selectable">{info.power}&nbsp;mA</dd>
        {/if}
        {#if info.interfaces.length > 0}
            <dt>{t("Interfaces")}</dt>
            <dd>
                {#each info.interfaces as item (item.number)}
                    <span class="selectable"
                        >{item.number}&nbsp;&nbsp;{item.roles.map(interfaceRoleTitle).join(", ")}{item.isConfiguration
                            ? "  ←"
                            : ""}</span
                    >
                {/each}
            </dd>
        {/if}
        <dt>{t("Configuration Channel")}</dt>
        <dd class="selectable">{channelText(info.channel)}</dd>
        <dt>{t("Commands")}</dt>
        <dd class="selectable">{commandsText(info.commands)}</dd>
    </dl>
</div>

<style>
    .info {
        width: min(440px, calc(100vw - 40px));
        padding: 8px 8px 6px;
    }

    h3 {
        margin: 0 0 12px;
        font-size: 1em;
        font-weight: 700;
    }

    dl {
        display: grid;
        grid-template-columns: max-content minmax(0, 1fr);
        gap: 8px 14px;
        margin: 0;
    }

    dt {
        color: var(--mk-dim);
        text-align: end;
    }

    dd {
        display: flex;
        flex-direction: column;
        gap: 2px;
        margin: 0;
        overflow-wrap: anywhere;
        white-space: pre-wrap;
    }

    .dim {
        color: var(--mk-dim);
    }

    .caption {
        font-size: 0.85em;
    }

    .warning {
        color: var(--mk-warning-text);
    }

    .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }

    .selectable {
        user-select: text;
    }
</style>
