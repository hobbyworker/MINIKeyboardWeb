<script lang="ts">
    // The app in someone else's page: the header, the keyboard and what its keys do, between the page's own header and
    // footer. Everything is drawn in the element's shadow root; the page's column gives the width, and the page's font
    // and background show through.
    import { Notice, type DeviceLogModel, type EditorModel } from "$presentation";
    import ActionPanel from "./ActionPanel.svelte";
    import DeviceLogView from "./DeviceLogView.svelte";
    import Dialog from "./Dialog.svelte";
    import Header from "./Header.svelte";
    import Icon from "./Icon.svelte";
    import Inspector from "./Inspector.svelte";
    import KeyboardArea from "./KeyboardArea.svelte";
    import { t } from "./l10n.svelte";
    import LayoutSheet from "./LayoutSheet.svelte";
    import { Live } from "./live.svelte";
    import { noticeMessage } from "./names";
    import PermissionGuide from "./PermissionGuide.svelte";
    import type { Platform, Theme } from "./props";

    let {
        editor,
        deviceLog,
        theme,
        platform,
        allSimulators,
    }: {
        editor: EditorModel;
        deviceLog: DeviceLogModel;
        theme: Theme;
        platform: Platform;
        allSimulators: boolean;
    } = $props();

    const ed = $derived(new Live(editor));
    const log = $derived(new Live(deviceLog));
    $effect(() => ed.follow());
    $effect(() => log.follow());

    const status = $derived(ed.read((e) => e.status()));
    const simulated = $derived(ed.read((e) => e.activeSimulatorId() !== null));
    /** The browser can be asked for a keyboard: WebHID is there, and the keyboard on USB is the one in use. */
    const canConnect = $derived(ed.read((e) => e.canRequestAccess()) && !simulated && status.kind !== "unsupported");
    const choosingLayout = $derived(ed.read((e) => e.isChoosingLayout()));
    const sheet = $derived(ed.read((e) => e.layoutSheet()));
    /** Not while the keyboard is identified, read or saved. */
    const canSwitch = $derived(ed.read((e) => e.canSwitchKeyboard()));
    /** A switch to another keyboard that would drop changes not saved, waiting for the user to say. */
    const pendingSwitch = $derived(ed.read((e) => e.pendingSwitch()));

    // The device log is part of the page while it is on — a page can't keep a window of its own open beside it — and
    // stays on next time, in this browser.
    const SHOWS_LOG_KEY = "minikeyboard.showsDeviceLog";

    function storedShowsLog(): boolean {
        try {
            return globalThis.localStorage?.getItem(SHOWS_LOG_KEY) === "true";
        } catch {
            return false;
        }
    }

    let showsLog = $state(storedShowsLog());
    let showsAllow = $state(false);

    function setShowsLog(shows: boolean) {
        showsLog = shows;
        try {
            globalThis.localStorage?.setItem(SHOWS_LOG_KEY, String(shows));
        } catch {
            // Not kept — the log starts hidden next time.
        }
    }

    // Messages that come and go: the editor's, and the app's own when the browser wouldn't show its chooser.
    const notice = $derived(ed.read((e) => e.notice()));
    const serial = $derived(ed.read((e) => e.noticeSerial()));
    let local = $state<{ text: string } | null>(null);

    $effect(() => {
        if (notice === null) return;
        const shown = serial;
        // A newer message of the editor's takes the place of the app's own.
        local = null;
        const timer = setTimeout(() => editor.expireNotice(shown), Notice.lifetime(notice));
        return () => clearTimeout(timer);
    });

    $effect(() => {
        if (local === null) return;
        const timer = setTimeout(() => (local = null), 6000);
        return () => clearTimeout(timer);
    });

    const toast = $derived(
        local !== null
            ? { text: local.text, error: true }
            : notice !== null
              ? { text: noticeMessage(notice), error: Notice.isError(notice) }
              : null,
    );

    function dismissToast() {
        if (local !== null) local = null;
        else editor.dismissNotice();
    }

    /** Shows the browser's chooser. WebHID asks for a click: nothing may be awaited before the request. */
    function connect() {
        editor.requestAccess().catch(() => {
            editor.dismissNotice();
            local = { text: t("The browser couldn’t show its list of keyboards.") };
        });
    }
</script>

<div class="app" data-theme={theme}>
    <Header
        {ed}
        {platform}
        {allSimulators}
        {canConnect}
        onconnect={connect}
        onallow={() => (showsAllow = true)}
        {showsLog}
        ontogglelog={() => setShowsLog(!showsLog)}
    />

    {#if simulated}
        <div class="simulator-bar">
            <Icon name="warning" size={22} />
            <div class="bar-texts">
                <strong>{t("Simulator in use")}</strong>
                <span>{t("This isn't a real keyboard. Nothing you save here is written to any keyboard.")}</span>
            </div>
            <button
                type="button"
                class="btn on-simulator"
                disabled={!canSwitch}
                onclick={() => editor.selectSimulator(null)}>{t("Back to the Keyboard on USB")}</button
            >
        </div>
    {/if}

    {#if status.kind === "searching" && canConnect}
        <div class="card connect">
            <Icon name="usb" size={28} />
            <p>{t("Plug the keyboard in, then choose it in the list the browser shows.")}</p>
            <button type="button" class="btn accent large" onclick={connect}>
                <Icon name="plug" />
                {t("Connect a Keyboard…")}
            </button>
        </div>
    {:else if status.kind === "unsupported"}
        <!-- The header says that the browser can't reach the keyboards; this, what to do. -->
        <div class="card calm">
            <Icon name="info" size={24} />
            <p>{t("Use Chrome or Edge on a computer. The page must be opened over HTTPS.")}</p>
        </div>
    {/if}

    <div class="main">
        <KeyboardArea {ed} />
        <Inspector {ed} />
    </div>
    <ActionPanel {ed} {platform} />

    {#if showsLog}
        <section class="log-panel" aria-labelledby="mk-log-title">
            <div class="log-title">
                <h2 id="mk-log-title">{t("Device Log")}</h2>
                <button
                    type="button"
                    class="icon-button"
                    aria-label={t("Close")}
                    title={t("Close")}
                    onclick={() => setShowsLog(false)}><Icon name="close" size={14} /></button
                >
            </div>
            <DeviceLogView {log} />
        </section>
    {/if}

    <div class="toasts" aria-live="polite">
        {#if toast !== null}
            <div class="toast" class:error={toast.error}>
                {#if toast.error}<Icon name="warning" />{/if}
                <span>{toast.text}</span>
                <button
                    type="button"
                    class="icon-button on-dark"
                    aria-label={t("Close")}
                    title={t("Close")}
                    onclick={dismissToast}><Icon name="close" size={14} /></button
                >
            </div>
        {/if}
    </div>

    <Dialog
        open={choosingLayout && sheet !== null}
        title={t("Choose the Keyboard’s Shape")}
        required={sheet?.isRequired ?? false}
        onclose={() => editor.setChoosingLayout(false)}
    >
        {#if sheet !== null}
            <LayoutSheet {ed} {sheet} oncancel={() => editor.setChoosingLayout(false)} />
        {/if}
    </Dialog>

    <Dialog
        open={showsAllow && platform === "linux"}
        title={t("Allow Access to the Keyboard")}
        width={640}
        onclose={() => (showsAllow = false)}
    >
        <PermissionGuide />
    </Dialog>

    <Dialog
        open={pendingSwitch !== null}
        title={t("Switch Keyboards?")}
        width={440}
        onclose={() => editor.cancelSwitch()}
    >
        <p class="dialog-text">{t("Changes you haven’t saved will be lost.")}</p>
        {#snippet footer()}
            <span class="grow"></span>
            <!-- A modal dialog focuses this as it opens: the choice that keeps the changes. -->
            <!-- svelte-ignore a11y_autofocus -->
            <button type="button" class="btn" autofocus onclick={() => editor.cancelSwitch()}>{t("Cancel")}</button>
            <button type="button" class="btn destructive" onclick={() => editor.confirmSwitch()}>{t("Switch")}</button>
        {/snippet}
    </Dialog>
</div>

<style>
    :global(:host) {
        display: block;
    }

    /* The colours, light and dark. The page says which with `theme`; `auto` follows the system. */
    .app {
        --mk-fg: #1d1d21;
        --mk-dim: rgb(29 29 33 / 0.62);
        --mk-surface: #ffffff;
        --mk-raised: #ffffff;
        --mk-tint: rgb(29 29 33 / 0.06);
        --mk-segment: #ffffff;
        --mk-line: rgb(29 29 33 / 0.12);
        --mk-line-strong: rgb(29 29 33 / 0.2);
        --mk-field: #ffffff;
        --mk-keycap: #ffffff;
        --mk-keycap-hover: rgb(38 158 102 / 0.12);
        --mk-accent: #269e66;
        --mk-accent-hover: #1f8a58;
        --mk-accent-text: #1c7a4e;
        --mk-success: #2a9d5c;
        --mk-warning: #e5a50a;
        --mk-warning-text: #9a6200;
        --mk-error: #d0312d;
        --mk-simulator: #c2410c;
        --mk-canvas-selection: #3ccf8a;
        --mk-toast: #2b2b30;
        --mk-toast-error: #8f1d1a;
        --mk-shadow-raised: 0 12px 32px rgb(0 0 0 / 0.16), 0 2px 6px rgb(0 0 0 / 0.08);
        color-scheme: light;
    }

    .app[data-theme="dark"] {
        --mk-fg: #ececf1;
        --mk-dim: rgb(236 236 241 / 0.6);
        --mk-surface: #222226;
        --mk-raised: #2b2b30;
        --mk-tint: rgb(255 255 255 / 0.07);
        --mk-segment: rgb(255 255 255 / 0.15);
        --mk-line: rgb(255 255 255 / 0.11);
        --mk-line-strong: rgb(255 255 255 / 0.2);
        --mk-field: #1a1a1e;
        --mk-keycap: #2e2e34;
        --mk-keycap-hover: rgb(38 158 102 / 0.24);
        --mk-accent-text: #4cc78f;
        --mk-success: #3fbf7f;
        --mk-warning: #f0b429;
        --mk-warning-text: #f5c451;
        --mk-error: #ef5350;
        --mk-toast: #3b3b41;
        --mk-toast-error: #a8302c;
        --mk-shadow-raised: 0 12px 32px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.3);
        color-scheme: dark;
    }

    @media (prefers-color-scheme: dark) {
        .app[data-theme="auto"] {
            --mk-fg: #ececf1;
            --mk-dim: rgb(236 236 241 / 0.6);
            --mk-surface: #222226;
            --mk-raised: #2b2b30;
            --mk-tint: rgb(255 255 255 / 0.07);
            --mk-segment: rgb(255 255 255 / 0.15);
            --mk-line: rgb(255 255 255 / 0.11);
            --mk-line-strong: rgb(255 255 255 / 0.2);
            --mk-field: #1a1a1e;
            --mk-keycap: #2e2e34;
            --mk-keycap-hover: rgb(38 158 102 / 0.24);
            --mk-accent-text: #4cc78f;
            --mk-success: #3fbf7f;
            --mk-warning: #f0b429;
            --mk-warning-text: #f5c451;
            --mk-error: #ef5350;
            --mk-toast: #3b3b41;
            --mk-toast-error: #a8302c;
            --mk-shadow-raised: 0 12px 32px rgb(0 0 0 / 0.5), 0 2px 6px rgb(0 0 0 / 0.3);
            color-scheme: dark;
        }
    }

    /* The page's column is the app's width: wide, the keyboard and the inspector side by side. */
    .app {
        container: mk / inline-size;
        display: flex;
        flex-direction: column;
        gap: 12px;
        background: transparent;
        color: var(--mk-fg);
        line-height: 1.45;
        letter-spacing: normal;
        text-align: start;
        text-transform: none;
        white-space: normal;
        word-break: normal;
        -webkit-tap-highlight-color: transparent;
    }

    .main {
        display: grid;
        grid-template-columns: minmax(0, 1fr);
        gap: 12px;
    }

    @container mk (min-width: 760px) {
        .main {
            grid-template-columns: minmax(0, 1fr) 300px;
        }
    }

    .simulator-bar {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 10px 14px;
        padding: 12px 16px 12px 18px;
        border-radius: 14px;
        background: var(--mk-simulator);
        color: white;
    }

    .bar-texts {
        display: flex;
        flex: 1 1 240px;
        flex-direction: column;
        gap: 2px;
        min-width: 0;
    }

    .bar-texts strong {
        font-size: 1.12em;
        font-weight: 800;
    }

    .card {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: 12px 16px;
        padding: 16px 18px;
        border: 1px solid var(--mk-line);
        border-radius: 14px;
        background: var(--mk-surface);
    }

    .card > p {
        flex: 1 1 220px;
        margin: 0;
    }

    .log-panel {
        display: flex;
        flex-direction: column;
        gap: 10px;
        min-width: 0;
        padding: 16px;
        border: 1px solid var(--mk-line);
        border-radius: 14px;
        background: var(--mk-surface);
    }

    .log-title {
        display: flex;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
    }

    .log-title h2 {
        margin: 0;
        font-size: 1em;
    }

    .card.connect {
        border-color: color-mix(in srgb, var(--mk-accent) 45%, transparent);
        background: color-mix(in srgb, var(--mk-accent) 7%, var(--mk-surface));
    }

    .card.connect > :global(.icon) {
        color: var(--mk-accent-text);
    }

    .card.calm > :global(.icon) {
        color: var(--mk-dim);
    }

    /* A message that comes and goes: at the foot of the app, or of the window while the app runs past it. */
    .toasts {
        position: sticky;
        bottom: 0;
        z-index: 2;
        height: 0;
        margin-top: -12px;
    }

    .toast {
        position: absolute;
        bottom: 16px;
        left: 50%;
        display: flex;
        align-items: center;
        gap: 10px;
        box-sizing: border-box;
        width: max-content;
        max-width: calc(100% - 24px);
        padding: 8px 8px 8px 16px;
        border-radius: 12px;
        background: var(--mk-toast);
        box-shadow: var(--mk-shadow-raised);
        color: white;
        transform: translateX(-50%);
    }

    .toast.error {
        background: var(--mk-toast-error);
    }

    /* The question before a switch that would drop the changes not saved. */
    .dialog-text {
        margin: 0;
        line-height: 1.45;
    }

    .grow {
        flex: 1;
    }

    /* The pieces every part of the app is built from — without weight of their own, so a part's rules win. */
    :where(.app) :global {
        button {
            font: inherit;
            color: inherit;
        }

        :focus-visible {
            outline: 2px solid var(--mk-accent);
            outline-offset: 2px;
        }

        .btn {
            display: inline-flex;
            align-items: center;
            justify-content: center;
            gap: 6px;
            box-sizing: border-box;
            min-height: 34px;
            margin: 0;
            padding: 5px 14px;
            border: 1px solid var(--mk-line-strong);
            border-radius: 9px;
            background: var(--mk-keycap);
            color: var(--mk-fg);
            font-weight: 600;
            line-height: 1.2;
            white-space: nowrap;
            cursor: pointer;
        }

        .btn:hover:not(:disabled) {
            background: var(--mk-keycap-hover);
        }

        .btn:disabled {
            opacity: 0.45;
            cursor: default;
        }

        .btn.accent {
            border-color: var(--mk-accent);
            background: var(--mk-accent);
            color: white;
        }

        .btn.accent:hover:not(:disabled) {
            background: var(--mk-accent-hover);
        }

        /* The action that throws something away. */
        .btn.destructive {
            border-color: var(--mk-error);
            background: var(--mk-error);
            color: white;
        }

        .btn.destructive:hover:not(:disabled) {
            background: color-mix(in srgb, var(--mk-error) 86%, black);
        }

        .btn.small {
            min-height: 28px;
            padding: 3px 10px;
            font-size: 0.9em;
        }

        .btn.large {
            min-height: 42px;
            padding: 8px 20px;
            font-size: 1.05em;
        }

        .btn.osd {
            border-color: transparent;
            background: rgb(0 0 0 / 0.55);
            color: white;
        }

        .btn.osd:hover:not(:disabled) {
            background: rgb(0 0 0 / 0.7);
        }

        .btn.round {
            width: 34px;
            padding: 0;
            border-radius: 50%;
        }

        .btn.on-simulator {
            border-color: rgb(255 255 255 / 0.7);
            background: rgb(255 255 255 / 0.14);
            color: white;
        }

        .btn.on-simulator:hover:not(:disabled) {
            background: rgb(255 255 255 / 0.26);
        }

        .btn.on-simulator:focus-visible,
        .icon-button.on-dark:focus-visible {
            outline-color: white;
        }

        .icon-button {
            display: inline-flex;
            flex: none;
            align-items: center;
            justify-content: center;
            width: 32px;
            height: 32px;
            margin: 0;
            padding: 0;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: var(--mk-fg);
            cursor: pointer;
        }

        .icon-button:hover:not(:disabled),
        .icon-button[aria-expanded="true"] {
            background: var(--mk-tint);
        }

        .icon-button:disabled {
            opacity: 0.45;
            cursor: default;
        }

        .icon-button.on-dark {
            width: 28px;
            height: 28px;
            color: white;
        }

        .icon-button.on-dark:hover {
            background: rgb(255 255 255 / 0.15);
        }

        .keycap {
            min-width: 34px;
            min-height: 34px;
            margin: 0;
            padding: 2px 8px;
            border: 0;
            border-radius: 7px;
            background: var(--mk-keycap);
            box-shadow:
                inset 0 0 0 1px var(--mk-line-strong),
                0 1px 1px rgb(0 0 0 / 0.08);
            color: var(--mk-fg);
            font-weight: 500;
            line-height: 1.2;
            cursor: pointer;
        }

        .keycap:hover:not(:disabled) {
            background: var(--mk-keycap-hover);
        }

        .keycap.active,
        .keycap.active:hover {
            background: var(--mk-accent);
            box-shadow: inset 0 0 0 1px var(--mk-accent);
            color: white;
        }

        .keycap:disabled {
            opacity: 0.45;
            cursor: default;
        }

        .keycap.compact {
            min-width: 0;
            min-height: 0;
            padding: 0 1px;
            font-size: 0.78em;
        }

        .segmented {
            display: inline-flex;
            gap: 2px;
            padding: 3px;
            border-radius: 10px;
            background: var(--mk-tint);
        }

        .segmented > button {
            min-height: 30px;
            margin: 0;
            padding: 4px 12px;
            border: 0;
            border-radius: 8px;
            background: transparent;
            color: var(--mk-fg);
            font-weight: 600;
            line-height: 1.2;
            white-space: nowrap;
            cursor: pointer;
        }

        .segmented > button[aria-checked="true"],
        .segmented > button[aria-selected="true"] {
            background: var(--mk-segment);
            box-shadow: 0 1px 3px rgb(0 0 0 / 0.16);
        }

        .segmented > button:disabled {
            opacity: 0.5;
            cursor: default;
        }

        .menu-item {
            display: flex;
            align-items: center;
            gap: 8px;
            box-sizing: border-box;
            width: 100%;
            margin: 0;
            padding: 7px 10px;
            border: 0;
            border-radius: 7px;
            background: transparent;
            color: var(--mk-fg);
            line-height: 1.3;
            text-align: start;
            white-space: nowrap;
            cursor: pointer;
        }

        .menu-item:hover:not(:disabled),
        .menu-item:focus-visible,
        .menu-item[aria-expanded="true"] {
            background: var(--mk-tint);
        }

        .menu-item:focus-visible {
            outline: 2px solid var(--mk-accent);
            outline-offset: -2px;
        }

        .menu-item:disabled {
            opacity: 0.45;
            cursor: default;
        }

        .menu-item .check {
            display: inline-flex;
            flex: none;
            width: 14px;
        }

        /* An item that is on or off, among items that are neither: a box either way, filled when on. */
        .menu-item .checkbox {
            display: inline-flex;
            flex: none;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            width: 16px;
            height: 16px;
            border: 1.5px solid var(--mk-line-strong);
            border-radius: 4px;
        }

        .menu-item .checkbox.on {
            border-color: var(--mk-accent);
            background: var(--mk-accent);
            color: #ffffff;
        }

        .menu-item .grow {
            flex: 1;
        }

        .menu-separator {
            height: 1px;
            margin: 5px 4px;
            background: var(--mk-line);
        }

        .menu-heading {
            padding: 6px 10px 4px;
            color: var(--mk-dim);
            font-size: 0.82em;
            font-weight: 700;
        }
    }
</style>
