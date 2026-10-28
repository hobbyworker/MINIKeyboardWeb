// The layouts users chose, in browser storage, in the shape the other editions write.

import { describe, expect, it } from "vitest";
import { StorageLayoutProfiles, type KeyValueStorage } from "$data";
import { UsbIdentity } from "$domain";

const K8840 = UsbIdentity.of(0x1189, 0x8840);
const K8850 = UsbIdentity.of(0x514c, 0x8850);

class MemoryStorage implements KeyValueStorage {
    readonly items = new Map<string, string>();

    getItem(key: string): string | null {
        return this.items.get(key) ?? null;
    }

    setItem(key: string, value: string): void {
        this.items.set(key, value);
    }
}

describe("layout profiles", () => {
    it("layouts are kept by keyboard", () => {
        const storage = new MemoryStorage();
        const profiles = new StorageLayoutProfiles(storage);
        expect(profiles.profile(K8840)).toBeNull();
        profiles.save({ layoutId: "6add1", rotation: "quarter" }, K8850);
        profiles.save({ layoutId: "15add3", rotation: "half" }, K8840);

        const again = new StorageLayoutProfiles(storage);
        expect(again.profile(K8840)).toEqual({ layoutId: "15add3", rotation: "half" });
        expect(again.profile(K8850)).toEqual({ layoutId: "6add1", rotation: "quarter" });
        expect(JSON.parse(storage.getItem("minikeyboard.layouts") ?? "")).toEqual({
            "1189:8840": { layout: "15add3", rotation: 2 },
            "514C:8850": { layout: "6add1", rotation: 1 },
        });
    });

    it("what can't be read is empty", () => {
        const storage = new MemoryStorage();
        const read = (text: string) => {
            storage.setItem("minikeyboard.layouts", text);
            return new StorageLayoutProfiles(storage).profile(K8840);
        };
        expect(read(`{"1189:8840": {"layout": "15add3"}}`)).toBeNull();
        expect(read(`{"1189:8840": {"layout": "15add3", "rotation": 300}}`)).toBeNull();
        expect(read(`{"1189:8840": {"layout": "15add3", "rotation": 1}, "514C:8850": 3}`)).toBeNull();
        expect(read("not json")).toBeNull();
        expect(read("[]")).toBeNull();
        // An extra field is passed over; a quarter turn too many wraps.
        expect(read(`{"1189:8840": {"layout": "15add3", "rotation": 5, "note": 1}}`)).toEqual({
            layoutId: "15add3",
            rotation: "quarter",
        });
    });

    /** No storage, or storage that throws, keeps nothing and breaks nothing. */
    it("storage that fails", () => {
        const throwing: KeyValueStorage = {
            getItem: () => {
                throw new Error("SecurityError");
            },
            setItem: () => {
                throw new Error("QuotaExceededError");
            },
        };
        for (const storage of [null, throwing]) {
            const profiles = new StorageLayoutProfiles(storage);
            expect(() => profiles.save({ layoutId: "6add1", rotation: "upright" }, K8840)).not.toThrow();
            expect(profiles.profile(K8840)).toBeNull();
        }
    });
});
