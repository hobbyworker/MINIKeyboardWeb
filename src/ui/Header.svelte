<script lang="ts">
    // The app's header: the keyboard's state — with several plugged in, which one is open — the layer, reading and
    // saving, and the menu.
    import { SimulatorChoice, type EditorModel, type SimulatorGroup } from "$presentation";
    import Icon from "./Icon.svelte";
    import KeyboardInfoView from "./KeyboardInfoView.svelte";
    import { t } from "./l10n.svelte";
    import type { Live } from "./live.svelte";
    import { commandsText, errorCode, simulatorKindTitle } from "./names";
    import Popover from "./Popover.svelte";
    import type { Platform } from "./props";
    import { radioKeys } from "./keys";

    let {
        ed,
        platform,
        allSimulators,
        canConnect,
        onconnect,
        onallow,
        showsLog,
        ontogglelog,
    }: {
        ed: Live<EditorModel>;
        platform: Platform;
        allSimulators: boolean;
        /** Whether the browser can be asked for a keyboard now. */
        canConnect: boolean;
        /** Asks the browser for a keyboard — synchronously, from the click. */
        onconnect: () => void;
        onallow: () => void;
        /** Whether the device log is shown under the editor. */
        showsLog: boolean;
        ontogglelog: () => void;
    } = $props();

    const editor = $derived(ed.model);
    const status = $derived(ed.read((e) => e.status()));
    const activity = $derived(ed.read((e) => e.activity()));
    const ready = $derived(ed.read((e) => e.isReady()));
    const layerCount = $derived(ed.read((e) => e.layerCount()));
    const layer = $derived(ed.read((e) => e.layer()));
    const readsBack = $derived(ed.read((e) => e.readsBack()));
    const canRead = $derived(ed.read((e) => e.canRead()));
    const unsaved = $derived(ed.read((e) => e.hasUnsavedChanges()));
    const hasSelection = $derived(ed.read((e) => e.selectedControl() !== null));
    const hasLayout = $derived(ed.read((e) => e.hasLayout()));
    const keyboardChoices = $derived(ed.read((e) => e.keyboardChoices()));
    /** Not while the keyboard is identified, read or saved. */
    const canSwitch = $derived(ed.read((e) => e.canSwitchKeyboard()));
    const keyboardInfo = $derived(ed.read((e) => e.keyboardInfo()));
    const canSelectSource = $derived(ed.read((e) => e.canSelectSource()));
    const activeSimulator = $derived(ed.read((e) => e.activeSimulatorId()));
    const simulatorChoices = $derived(
        ed.read((e) => e.simulatorChoices()).filter((choice) => allSimulators || SimulatorChoice.isForEveryone(choice)),
    );

    /** The dot's colour, by what the keyboard is doing. */
    const dot = $derived.by(() => {
        switch (status.kind) {
            case "connected":
                if (status.isSimulated) return "simulated";
                return status.isIdentified ? "connected" : "identifying";
            case "needsPermission":
                return "permission";
            case "unsupported":
                return "unsupported";
            case "searching":
            case "openFailed":
                return "disconnected";
        }
    });

    const title = $derived.by(() => {
        switch (status.kind) {
            case "searching":
                return t("Not Connected");
            case "needsPermission":
                return t("Access to the keyboard is needed");
            case "openFailed":
                return t("The keyboard couldn’t be opened");
            case "unsupported":
                return t("This browser can’t reach USB keyboards");
            case "connected":
                switch (activity) {
                    case "identifying":
                        return t("Asking the keyboard what it is…");
                    case "reading":
                        return t("Reading…");
                    case "saving":
                        return t("Saving…");
                    case null:
                        return status.isSimulated ? t("Simulated Keyboard") : t("Connected");
                }
        }
    });

    const detail = $derived.by(() => {
        switch (status.kind) {
            case "searching":
                return t("Connect the keyboard via USB.");
            case "needsPermission":
                return platform === "linux"
                    ? t("Add the udev rule for this keyboard, then plug it in again.")
                    : t("The browser wasn’t allowed to open the keyboard.");
            case "openFailed":
                return errorCode(status.code);
            case "unsupported":
                return "";
            case "connected":
                return status.keys !== null && status.knobs !== null
                    ? t("%@ · %@", status.usb, t("Keys: %lld · Knobs: %lld", status.keys, status.knobs))
                    : status.usb;
        }
    });

    /** The simulator's groups as the desktop editions have them; a group of one is an item under its group's name. */
    const simulatorGroups = $derived(
        (["standard", "legacy"] as const satisfies readonly SimulatorGroup[])
            .map((group) => ({
                group,
                title: commandsText(group),
                choices: simulatorChoices.filter((choice) => choice.group === group),
            }))
            .filter(({ choices }) => choices.length > 0),
    );
    const unidentifiedSimulators = $derived(simulatorChoices.filter((choice) => choice.group === "unidentified"));
</script>

{#snippet menuItem(label: string, enabled: boolean, run: () => void, close: () => void)}
    <button
        type="button"
        role="menuitem"
        class="menu-item"
        disabled={!enabled}
        onclick={() => {
            close();
            run();
        }}>{label}</button
    >
{/snippet}

{#snippet simulatorItem(id: string | null, label: string, close: () => void)}
    <button
        type="button"
        role="menuitemradio"
        class="menu-item"
        aria-checked={activeSimulator === id}
        disabled={!canSwitch}
        onclick={() => {
            close();
            editor.selectSimulator(id);
        }}
    >
        <span class="check" aria-hidden="true">
            {#if activeSimulator === id}<Icon name="check" size={14} />{/if}
        </span>
        <span>{label}</span>
    </button>
{/snippet}

<header class="header">
    <div class="status">
        <span class="dot {dot}" aria-hidden="true"></span>
        <div class="texts" role="status">
            <div class="title">{title}</div>
            {#if detail}
                <div class="detail">{detail}</div>
            {/if}
        </div>
        {#if keyboardChoices.length > 0}
            <Popover label={t("Choose a Keyboard")} placement="below-start" disabled={!canSwitch}>
                {#snippet trigger()}<Icon name="chevronDown" />{/snippet}
                {#snippet children(close)}
                    <div class="menu-heading" role="presentation">{t("Choose a Keyboard")}</div>
                    {#each keyboardChoices as choice (choice.id)}
                        <button
                            type="button"
                            role="menuitemradio"
                            class="menu-item"
                            aria-checked={choice.isSelected}
                            disabled={!canSwitch}
                            onclick={() => {
                                close();
                                editor.selectKeyboard(choice.id);
                            }}
                        >
                            <span class="check" aria-hidden="true">
                                {#if choice.isSelected}<Icon name="check" size={14} />{/if}
                            </span>
                            <span class="mono">{choice.title}</span>
                        </button>
                    {/each}
                {/snippet}
            </Popover>
        {/if}
        {#if status.kind === "connected" && keyboardInfo !== null}
            <Popover label={t("Keyboard Information")} kind="dialog" placement="below-start">
                {#snippet trigger()}<Icon name="info" />{/snippet}
                {#snippet children()}
                    {#if keyboardInfo}<KeyboardInfoView info={keyboardInfo} />{/if}
                {/snippet}
            </Popover>
        {/if}
        {#if status.kind === "needsPermission" && platform === "linux"}
            <button type="button" class="btn" onclick={onallow}>{t("How to Allow…")}</button>
        {/if}
        {#if status.kind === "connected" && !status.isIdentified && activity === null}
            <button type="button" class="btn" onclick={() => void editor.identify()}>{t("Retry")}</button>
        {/if}
        {#if status.kind === "needsPermission" || status.kind === "openFailed"}
            <button type="button" class="btn" onclick={() => editor.retryConnection()}>{t("Retry")}</button>
        {/if}
        {#if activity !== null}
            <span class="spinner" aria-hidden="true"></span>
        {/if}
    </div>

    <div class="actions">
        {#if layerCount > 1}
            <div class="segmented" role="radiogroup" aria-label={t("Layer")}>
                {#each Array.from({ length: layerCount }, (_, index) => index) as index (index)}
                    <button
                        type="button"
                        role="radio"
                        aria-checked={layer === index}
                        tabindex={layer === index ? 0 : -1}
                        disabled={!ready}
                        onclick={() => editor.setLayer(index)}
                        onkeydown={(event) => radioKeys(event, index, layerCount, (next) => editor.setLayer(next))}
                        >{t("Layer %lld", index + 1)}</button
                    >
                {/each}
            </div>
        {/if}
        <div class="buttons">
            {#if readsBack}
                <button
                    type="button"
                    class="btn"
                    title={t("Read from Keyboard")}
                    disabled={!canRead}
                    onclick={() => void editor.read()}>{t("Read")}</button
                >
            {/if}
            <button
                type="button"
                class="btn accent"
                title={t("Save to Keyboard")}
                disabled={!ready || !unsaved}
                onclick={() => void editor.save()}>{t("Save")}</button
            >
            <Popover label={t("Main Menu")} placement="below-end">
                {#snippet trigger()}<Icon name="menu" size={18} />{/snippet}
                {#snippet children(close)}
                    {#if canConnect}
                        {@render menuItem(t("Connect a Keyboard…"), true, onconnect, close)}
                        <div class="menu-separator" role="separator"></div>
                    {/if}
                    {@render menuItem(t("Read from Keyboard"), canRead, () => void editor.read(), close)}
                    {@render menuItem(t("Save to Keyboard"), ready && unsaved, () => void editor.save(), close)}
                    <div class="menu-separator" role="separator"></div>
                    {@render menuItem(t("Clear Key"), ready && hasSelection, () => editor.clearSelected(), close)}
                    {@render menuItem(t("Clear Layer"), ready, () => editor.clearLayer(), close)}
                    <div class="menu-separator" role="separator"></div>
                    {@render menuItem(t("Shape…"), hasLayout, () => editor.setChoosingLayout(true), close)}
                    {@render menuItem(t("Rotate"), hasLayout, () => editor.rotate(), close)}
                    <div class="menu-separator" role="separator"></div>
                    <button
                        type="button"
                        role="menuitemcheckbox"
                        class="menu-item"
                        aria-checked={showsLog}
                        onclick={() => {
                            close();
                            ontogglelog();
                        }}
                    >
                        <span class="checkbox" class:on={showsLog} aria-hidden="true">
                            {#if showsLog}<Icon name="check" size={12} />{/if}
                        </span>
                        <span>{t("Device Log")}</span>
                    </button>
                    {#if canSelectSource}
                        <div class="menu-separator" role="separator"></div>
                        <Popover
                            label={t("Simulator")}
                            placement="beside"
                            triggerRole="menuitem"
                            triggerClass="menu-item submenu"
                            showLabel
                            disabled={!canSwitch}
                        >
                            {#snippet trigger()}
                                <span class="grow">{t("Simulator")}</span>
                                <Icon name="chevronRight" size={14} />
                            {/snippet}
                            {#snippet children(closeAll)}
                                {@render simulatorItem(null, t("Keyboard on USB"), closeAll)}
                                <div class="menu-separator" role="separator"></div>
                                <!-- Each firmware a menu of its own, so the keyboards fit on one line each. -->
                                {#each simulatorGroups as { group, title, choices } (group)}
                                    {#if choices.length === 1 && choices[0]}
                                        {@render simulatorItem(choices[0].id, title, closeAll)}
                                    {:else}
                                        <Popover
                                            label={title}
                                            placement="beside"
                                            triggerRole="menuitem"
                                            triggerClass="menu-item submenu"
                                            showLabel
                                            disabled={!canSwitch}
                                        >
                                            {#snippet trigger()}
                                                <span class="check" aria-hidden="true">
                                                    {#if choices.some((choice) => choice.id === activeSimulator)}<Icon
                                                            name="check"
                                                            size={14}
                                                        />{/if}
                                                </span>
                                                <span class="grow">{title}</span>
                                                <Icon name="chevronRight" size={14} />
                                            {/snippet}
                                            {#snippet children(closeGroup)}
                                                <div role="group" aria-label={title}>
                                                    {#each choices as choice (choice.id)}
                                                        {@render simulatorItem(
                                                            choice.id,
                                                            simulatorKindTitle(choice.kind),
                                                            closeGroup,
                                                        )}
                                                    {/each}
                                                </div>
                                            {/snippet}
                                        </Popover>
                                    {/if}
                                {/each}
                                {#if unidentifiedSimulators.length > 0}
                                    <div class="menu-separator" role="separator"></div>
                                    {#each unidentifiedSimulators as choice (choice.id)}
                                        {@render simulatorItem(choice.id, simulatorKindTitle(choice.kind), closeAll)}
                                    {/each}
                                {/if}
                            {/snippet}
                        </Popover>
                    {/if}
                {/snippet}
            </Popover>
        </div>
    </div>
</header>

<style>
    .header {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 16px;
        padding: 10px 12px 10px 16px;
        border: 1px solid var(--mk-line);
        border-radius: 14px;
        background: var(--mk-surface);
    }

    .status {
        display: flex;
        flex: 1 1 260px;
        align-items: center;
        gap: 10px;
        min-width: 0;
    }

    .texts {
        min-width: 0;
    }

    .title {
        font-weight: 700;
        line-height: 1.3;
    }

    .detail {
        overflow: hidden;
        color: var(--mk-dim);
        font-size: 0.85em;
        line-height: 1.3;
        text-overflow: ellipsis;
        white-space: nowrap;
    }

    .dot {
        flex: none;
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: var(--mk-dim);
    }

    .dot.connected {
        background: var(--mk-success);
    }

    .dot.simulated {
        background: var(--mk-simulator);
    }

    .dot.identifying,
    .dot.permission {
        background: var(--mk-warning);
    }

    .dot.disconnected {
        background: var(--mk-error);
    }

    .dot.unsupported {
        background: var(--mk-dim);
    }

    .spinner {
        flex: none;
        width: 16px;
        height: 16px;
        border: 2px solid var(--mk-line-strong);
        border-top-color: var(--mk-accent);
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
    }

    @keyframes spin {
        to {
            transform: rotate(1turn);
        }
    }

    @media (prefers-reduced-motion: reduce) {
        .spinner {
            animation-duration: 2.4s;
        }
    }

    .actions {
        display: flex;
        flex-wrap: wrap;
        flex: 1 1 auto;
        align-items: center;
        justify-content: flex-end;
        gap: 10px 16px;
    }

    .buttons {
        display: flex;
        align-items: center;
        gap: 8px;
    }

    .mono {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
    }
</style>
