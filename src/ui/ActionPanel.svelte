<script lang="ts">
    // The pages of actions for the selected key — keys, media keys, the mouse, the lights and waits — under their tabs.
    import { MouseChoice, type EditorModel, type EditorTab } from "$presentation";
    import ChoicesPage from "./ChoicesPage.svelte";
    import DelayPage from "./DelayPage.svelte";
    import KeysPage from "./KeysPage.svelte";
    import { radioKeys } from "./keys";
    import { t } from "./l10n.svelte";
    import LightingPage from "./LightingPage.svelte";
    import type { Live } from "./live.svelte";
    import { mediaIcon, mediaTitle, mouseIcon, mouseTitle, tabTitle } from "./names";
    import type { Platform } from "./props";

    let { ed, platform }: { ed: Live<EditorModel>; platform: Platform } = $props();

    const id = $props.id();
    const editor = $derived(ed.model);
    const tabs = $derived(ed.read((e) => e.availableTabs()));
    const tab = $derived(ed.read((e) => e.tab()));
    const ready = $derived(ed.read((e) => e.isReady()));
    const caption = $derived(ed.read((e) => e.selectedCaption()));
    const mediaChoices = $derived(tab === "media" ? ed.read((e) => e.mediaChoices()) : []);

    const activeMedia = $derived(caption?.kind === "media" ? caption.choice : null);
    const activeMouse = $derived(caption?.kind === "mouse" ? caption.choice : null);

    function select(next: EditorTab) {
        editor.setTab(next);
    }
</script>

<section class="panel">
    <div class="tabs segmented" role="tablist" aria-orientation="horizontal">
        {#each tabs as each, index (each)}
            <button
                type="button"
                role="tab"
                id="{id}-tab-{each}"
                aria-selected={tab === each}
                aria-controls="{id}-page"
                tabindex={tab === each ? 0 : -1}
                disabled={!ready}
                onclick={() => select(each)}
                onkeydown={(event) =>
                    radioKeys(event, index, tabs.length, (next) => {
                        const target = tabs[next];
                        if (target) select(target);
                    })}>{tabTitle(each)}</button
            >
        {/each}
    </div>
    <div id="{id}-page" role="tabpanel" aria-labelledby="{id}-tab-{tab}">
        <fieldset class="page" disabled={!ready}>
            {#if tab === "keys"}
                <KeysPage {ed} {platform} />
            {:else if tab === "media"}
                <ChoicesPage
                    title={t("Multimedia")}
                    note={t("A media key replaces what the key did.")}
                    choices={mediaChoices}
                    active={activeMedia}
                    face={(choice) => ({ icon: mediaIcon(choice), title: mediaTitle(choice) })}
                    assign={(choice) => editor.assignMedia(choice)}
                    width={132}
                />
            {:else if tab === "mouse"}
                <ChoicesPage
                    title={t("Mouse")}
                    note={t("A mouse action replaces what the key did.")}
                    choices={MouseChoice.ALL}
                    active={activeMouse}
                    face={(choice) => ({ icon: mouseIcon(choice), title: mouseTitle(choice) })}
                    assign={(choice) => editor.assignMouse(choice)}
                    width={160}
                />
            {:else if tab === "lighting"}
                <LightingPage {ed} />
            {:else}
                <DelayPage {ed} />
            {/if}
        </fieldset>
    </div>
</section>

<style>
    .panel {
        display: flex;
        flex-direction: column;
        gap: 14px;
        min-width: 0;
        padding: 16px;
        border: 1px solid var(--mk-line);
        border-radius: 14px;
        background: var(--mk-surface);
        box-sizing: border-box;
    }

    .tabs {
        align-self: flex-start;
        max-width: 100%;
        overflow-x: auto;
    }

    .page {
        min-width: 0;
        margin: 0;
        padding: 0;
        border: 0;
    }

    .page:disabled {
        opacity: 0.55;
    }
</style>
