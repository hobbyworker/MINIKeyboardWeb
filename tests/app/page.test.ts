import { describe, expect, it } from "vitest";
import { pageLanguage, pageTheme, type PageElement } from "../../src/app/page";

/** An element with these attributes and classes. */
function element(attributes: Record<string, string>, classes: string[] = []): PageElement {
    return {
        getAttribute: (name) => attributes[name] ?? null,
        classList: { contains: (token) => classes.includes(token) },
    };
}

describe("the page's theme", () => {
    it("reads data-theme first, as Hugo FixIt sets it in dark mode", () => {
        expect(pageTheme(element({ "data-theme": "dark", style: "color-scheme: dark" }))).toBe("dark");
        expect(pageTheme(element({ "data-theme": "light" }, ["dark"]))).toBe("light");
    });

    it("reads a dark class, then an inline color-scheme — FixIt's light mode sets only that", () => {
        expect(pageTheme(element({}, ["dark"]))).toBe("dark");
        expect(pageTheme(element({ style: "color-scheme: light;" }))).toBe("light");
        expect(pageTheme(element({ style: "margin: 0; color-scheme: dark" }))).toBe("dark");
    });

    it("goes on to the next element, and leaves it to the system when none says", () => {
        expect(pageTheme(element({}), element({}, ["dark"]))).toBe("dark");
        expect(pageTheme(element({ "data-theme": "auto" }), null, undefined)).toBeNull();
        expect(pageTheme(element({ style: "background-color: black" }))).toBeNull();
    });
});

describe("the page's language", () => {
    it("is the first lang among the element and its ancestors", () => {
        expect(pageLanguage(element({}), element({ lang: "zh-hans" }), element({ lang: "en" }))).toBe("zh-hans");
        expect(pageLanguage(element({ lang: " ko " }), element({ lang: "en" }))).toBe("ko");
        expect(pageLanguage(element({ lang: "" }), null, element({}))).toBeNull();
    });
});
