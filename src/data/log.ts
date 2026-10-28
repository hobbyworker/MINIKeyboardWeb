import type { DeviceLogEntry, DeviceLogRepository, LogContent, Updates } from "$domain";

/** The device log, kept in memory: what the connection and the device write, the log window reads. */
export class DeviceLogStore implements DeviceLogRepository {
    static readonly LIMIT = 2000;

    private items: readonly DeviceLogEntry[] = [];
    private lastId = 0;
    private listeners: ((entries: readonly DeviceLogEntry[]) => void)[] = [];

    append(content: LogContent): void {
        this.lastId += 1;
        const entry: DeviceLogEntry = { id: this.lastId, time: Date.now(), content };
        const items = [...this.items, entry];
        this.items = items.length > DeviceLogStore.LIMIT ? items.slice(items.length - DeviceLogStore.LIMIT) : items;
        this.publish();
    }

    /** Every line, oldest first. */
    snapshot(): readonly DeviceLogEntry[] {
        return this.items;
    }

    entries(): Updates<readonly DeviceLogEntry[]> {
        return {
            subscribe: (listener) => {
                this.listeners.push(listener);
                listener(this.items);
                return () => {
                    this.listeners = this.listeners.filter((other) => other !== listener);
                };
            },
        };
    }

    clear(): void {
        this.items = [];
        this.publish();
    }

    private publish(): void {
        for (const listener of [...this.listeners]) listener(this.items);
    }
}
