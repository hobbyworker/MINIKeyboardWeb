import { fileURLToPath } from "node:url";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { defineConfig } from "vitest/config";

const at = (path: string) => fileURLToPath(new URL(path, import.meta.url));

export default defineConfig({
    plugins: [svelte()],
    // Not Vite's usual 5173, which other projects' development servers on the same computer often hold.
    server: { port: 5180, strictPort: true },
    resolve: {
        alias: {
            $domain: at("./src/domain/index.ts"),
            $data: at("./src/data/index.ts"),
            $presentation: at("./src/presentation/index.ts"),
            $ui: at("./src/ui"),
        },
    },
    build: {
        // One module that defines <minikeyboard-app>; each language's strings are a chunk beside it, loaded when asked
        // for — relative to the module, wherever the host page serves it from.
        lib: { entry: at("./src/app/main.ts"), formats: ["es"], fileName: () => "minikeyboard.js" },
        target: "es2022",
        cssCodeSplit: false,
    },
    test: {
        include: ["tests/**/*.test.ts"],
        environment: "node",
    },
});
