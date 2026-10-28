<script lang="ts">
    // How to give the signed-in user of a Linux browser the keyboard: the udev rule, ready to copy into a terminal — the
    // commands that write it, or the file and what goes in it.
    import { UDEV_RULES_PATH, udevInstallCommands, udevRules } from "$presentation";
    import CopyButton from "./CopyButton.svelte";
    import { t } from "./l10n.svelte";

    const commands = udevInstallCommands();
    const rules = udevRules();
</script>

<div class="guide">
    <p>
        {t(
            "Linux lets an app open a USB keyboard only when a udev rule gives the signed-in user its device. Run these commands in a terminal once — they write %@ — then plug the keyboard in again.",
            UDEV_RULES_PATH,
        )}
    </p>
    <div class="block">
        <pre>{commands}</pre>
        <div class="copy"><CopyButton text={commands} /></div>
    </div>
    <div class="file">
        <code>{UDEV_RULES_PATH}</code>
        <CopyButton text={UDEV_RULES_PATH} label={UDEV_RULES_PATH} />
    </div>
    <div class="block">
        <pre>{rules}</pre>
        <div class="copy"><CopyButton text={rules} /></div>
    </div>
</div>

<style>
    .guide {
        display: flex;
        flex-direction: column;
        gap: 12px;
    }

    p {
        margin: 0;
    }

    .block {
        display: flex;
        flex-direction: column;
        gap: 6px;
    }

    pre {
        margin: 0;
        padding: 10px 12px;
        overflow-x: auto;
        border: 1px solid var(--mk-line);
        border-radius: 10px;
        background: var(--mk-tint);
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.82em;
        line-height: 1.5;
        user-select: text;
    }

    .copy {
        display: flex;
        justify-content: flex-end;
    }

    .file {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        justify-content: space-between;
        gap: 8px;
        margin-top: 6px;
    }

    code {
        font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
        font-size: 0.88em;
        font-weight: 600;
        overflow-wrap: anywhere;
        user-select: text;
    }
</style>
