import { describe, expect, it } from "vitest";
import { Broadcaster } from "$data";

describe("broadcaster", () => {
    /** The current value at once, then each change; the same value again sends nothing. */
    it("sends the current value, then changes", () => {
        const broadcaster = new Broadcaster({ kind: "searching" } as { kind: string; code?: number });
        const seen: unknown[] = [];
        const stop = broadcaster.subscribe((value) => seen.push(value));
        broadcaster.set({ kind: "searching" });
        broadcaster.set({ kind: "openFailed", code: 5 });
        broadcaster.set({ kind: "openFailed", code: 5 });
        stop();
        broadcaster.set({ kind: "searching" });
        expect(seen).toEqual([{ kind: "searching" }, { kind: "openFailed", code: 5 }]);
        expect(broadcaster.value()).toEqual({ kind: "searching" });
    });

    it("equality is whatever it is given", () => {
        const broadcaster = new Broadcaster(1, (a, b) => a % 2 === b % 2);
        const seen: number[] = [];
        broadcaster.subscribe((value) => seen.push(value));
        broadcaster.set(3);
        broadcaster.set(4);
        expect(seen).toEqual([1, 4]);
    });
});
