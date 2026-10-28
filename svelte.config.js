import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

export default {
    preprocess: vitePreprocess(),
    // Styles go into the shadow root the app is mounted in, so the host page's styles and ours never meet.
    compilerOptions: { runes: true, css: "injected" },
};
