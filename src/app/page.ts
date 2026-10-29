// What the page that holds the app says about itself, for an element that wasn't told: its language and whether it is
// dark. Sites mark dark mode in different ways, so several are read before the system's setting is left to decide.

/** An element as far as these rules read it: <html>, <body>, or an ancestor of the app. */
export interface PageElement {
    getAttribute(name: string): string | null;
    readonly classList: { contains(token: string): boolean };
}

/**
 * The page's colour scheme: `data-theme` (Hugo FixIt and many others), a `dark` class (Tailwind), or an inline
 * `color-scheme` (FixIt in light mode sets only that) — on the first of `elements` that says. Null when none does, and
 * the system's setting decides.
 */
export function pageTheme(...elements: (PageElement | null | undefined)[]): "light" | "dark" | null {
    for (const element of elements) {
        if (!element) continue;
        const marked = element.getAttribute("data-theme");
        if (marked === "light" || marked === "dark") return marked;
        if (element.classList.contains("dark")) return "dark";
        const scheme = /(?:^|;)\s*color-scheme\s*:\s*(light|dark)\b/.exec(element.getAttribute("style") ?? "");
        if (scheme) return scheme[1] as "light" | "dark";
    }
    return null;
}

/** The first language code among `elements`, as an element finds its own: its `lang`, else an ancestor's. */
export function pageLanguage(...elements: (PageElement | null | undefined)[]): string | null {
    for (const element of elements) {
        const code = element?.getAttribute("lang")?.trim();
        if (code) return code;
    }
    return null;
}
