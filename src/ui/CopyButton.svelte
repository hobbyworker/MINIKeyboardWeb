<script lang="ts">
    // Copies `text` to the clipboard; a tick shows for a moment that it went.
    import Icon from "./Icon.svelte";
    import { t } from "./l10n.svelte";

    let { text, label }: { text: string; /** What is copied, for assistive tools. */ label?: string } = $props();

    let copied = $state(false);
    let timer: ReturnType<typeof setTimeout> | undefined;

    async function copy() {
        try {
            await navigator.clipboard.writeText(text);
        } catch {
            return;
        }
        copied = true;
        clearTimeout(timer);
        timer = setTimeout(() => (copied = false), 1500);
    }

    $effect(() => () => clearTimeout(timer));
</script>

<button type="button" class="btn small" aria-label={label ? `${t("Copy")} — ${label}` : undefined} onclick={copy}>
    <Icon name={copied ? "check" : "copy"} size={14} />
    {t("Copy")}
</button>
