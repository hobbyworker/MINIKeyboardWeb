// Keeps the dependencies pointing inward, as the other editions' compilers do: the domain needs nothing; the data
// layer and the presentation need the domain only; the interface needs the presentation only; the app, which puts
// them together, needs any of them.
//
//   node scripts/check-layers.mjs     prints every import that points the wrong way, and fails if there is one

import { readdirSync, readFileSync } from "node:fs";
import { dirname, join, relative, resolve, sep } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const src = join(root, "src");

/** What each layer may import: other layers, and packages by name. */
const allowed = {
    domain: { layers: [], packages: [] },
    data: { layers: ["domain"], packages: [] },
    presentation: { layers: ["domain"], packages: [] },
    ui: { layers: ["presentation"], packages: ["svelte"] },
    app: { layers: ["domain", "data", "presentation", "ui"], packages: ["svelte"] },
};
const aliases = { $domain: "domain", $data: "data", $presentation: "presentation", $ui: "ui" };

function* files(directory) {
    for (const entry of readdirSync(directory, { withFileTypes: true })) {
        const path = join(directory, entry.name);
        if (entry.isDirectory()) yield* files(path);
        else if (/\.(ts|svelte)$/.test(entry.name)) yield path;
    }
}

const layerOf = (path) => relative(src, path).split(sep)[0];
const specifiers = (text) =>
    [
        ...text.matchAll(
            /(?:\bimport\s[^'"]*?from\s*|\bimport\s*\(\s*|\bimport\s+|\bexport\s[^'"]*?from\s*)["']([^"']+)["']/g,
        ),
    ].map((match) => match[1]);

const problems = [];
for (const file of files(src)) {
    const layer = layerOf(file);
    const rules = allowed[layer];
    if (!rules) {
        problems.push(`${relative(root, file)}: not in a layer (${Object.keys(allowed).join(", ")})`);
        continue;
    }
    for (const specifier of specifiers(readFileSync(file, "utf8"))) {
        let target;
        if (specifier.startsWith(".")) target = layerOf(resolve(dirname(file), specifier));
        else {
            const alias = Object.keys(aliases).find((name) => specifier === name || specifier.startsWith(name + "/"));
            if (alias) target = aliases[alias];
            else {
                const name = specifier.startsWith("@")
                    ? specifier.split("/").slice(0, 2).join("/")
                    : specifier.split("/")[0];
                if (!rules.packages.includes(name))
                    problems.push(`${relative(root, file)}: ${layer} imports the package ${specifier}`);
                continue;
            }
        }
        if (target !== layer && !rules.layers.includes(target)) {
            problems.push(`${relative(root, file)}: ${layer} imports ${target} (${specifier})`);
        }
    }
}

if (problems.length) {
    console.error(problems.join("\n"));
    process.exit(1);
}
console.log("layers: every import points inward");
