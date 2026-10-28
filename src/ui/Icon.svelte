<script lang="ts">
    // One of the interface's icons, in the text's colour. It says nothing to assistive tools; what it is for is said by
    // the control around it.
    import { ICONS, type IconName } from "./icons";

    let { name, size = 16 }: { name: IconName; size?: number } = $props();
    const shape = $derived(ICONS[name]);
</script>

<svg
    class="icon"
    width={size}
    height={size}
    viewBox="0 0 24 24"
    aria-hidden="true"
    focusable="false"
    fill={"fill" in shape && shape.fill ? "currentColor" : "none"}
    stroke={"fill" in shape && shape.fill ? "none" : "currentColor"}
    stroke-width="2"
    stroke-linecap="round"
    stroke-linejoin="round"><path d={shape.d} /></svg
>

<style>
    .icon {
        display: inline-block;
        flex: none;
        vertical-align: middle;
    }
</style>
