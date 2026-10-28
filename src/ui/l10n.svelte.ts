// The interface's words. English is the message itself; each other language is a table of its own, loaded when it is
// chosen (a chunk beside the module). The page that holds the app says which language — the app has no choice of its own.

export const LANGUAGES = [
    "en",
    "ko",
    "ja",
    "zh-Hans",
    "zh-Hant",
    "es",
    "pt-BR",
    "fr",
    "de",
    "it",
    "pl",
    "id",
    "vi",
] as const;
export type Language = (typeof LANGUAGES)[number];

const tables = import.meta.glob<Record<string, string>>("./l10n/*.json", { import: "default" });

let table = $state<Record<string, string>>({});
let current = $state<Language>("en");
let requested: Language = "en";

/**
 * One of the app's languages for a language code as pages and browsers write it — `ko`, `ko-KR`, `pt` (Brazilian, as
 * the blog has it), `zh-hans` or `zh-CN`, `zh-hant` or `zh-TW` — or English.
 */
export function languageFor(code: string | null | undefined): Language {
    const lower = (code ?? "").trim().toLowerCase().replace("_", "-");
    if (!lower) return "en";
    if (lower.startsWith("zh")) {
        return /hant|tw|hk|mo/.test(lower) ? "zh-Hant" : "zh-Hans";
    }
    if (lower.startsWith("pt")) return "pt-BR";
    const base = lower.split("-")[0];
    return LANGUAGES.find((language) => language.toLowerCase() === base) ?? "en";
}

export function language(): Language {
    return current;
}

/** Shows the words in `code`'s language; English while another is loading. */
export async function setLanguage(code: string | null | undefined): Promise<void> {
    const next = languageFor(code);
    requested = next;
    if (next === current) return;
    const load = tables[`./l10n/${next}.json`];
    const loaded = next === "en" || !load ? {} : await load();
    // A newer choice may have come while this one loaded.
    if (requested !== next) return;
    table = loaded;
    current = next;
}

/**
 * `message` in the current language, its placeholders filled in order: `%@` and `%lld`, or numbered — `%1$lld`,
 * `%2$@` — where a language puts them in another order.
 */
export function t(message: string, ...values: (string | number)[]): string {
    const text = table[message] ?? message;
    let next = 0;
    return text.replace(/%(?:(\d+)\$)?(@|lld|d)/g, (_, position: string | undefined) => {
        const index = position ? Number(position) - 1 : next++;
        return String(values[index] ?? "");
    });
}
