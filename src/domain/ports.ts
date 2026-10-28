// What the outer layers provide: the keyboard, its connection, the device log and the user's choices.
//
// Everything here lives on the main thread, as the interface does. Work that waits — on the keyboard, or for time to
// pass — is a promise, and whoever implements the port does the waiting. A failed transfer rejects with a
// KeyboardDeviceError.

import type { KeyAction } from "./actions";
import type { KeyboardConfiguration } from "./configuration";
import type { AttachedKeyboards, ConnectionState } from "./connection";
import type { KeyboardIdentity, RecordFormat, UsbIdentity } from "./keyboards";
import type { ControlId, KeyboardLayout } from "./layout";
import type { LayerLighting } from "./lighting";
import type { DeviceLogEntry, KeyboardSource, LayoutProfile } from "./support";

/** Values that keep coming: the current one, then changes. */
export interface Updates<T> {
    /**
     * Calls `listener` with the current value before returning, then with every change, until the returned function is
     * called.
     */
    subscribe(listener: (value: T) => void): () => void;
}

/** One value, then no more. */
export function once<T>(value: T): Updates<T> {
    return {
        subscribe(listener) {
            listener(value);
            return () => {};
        },
    };
}

/** Finding the keyboard and keeping its configuration interface open. */
export interface KeyboardConnectionRepository {
    /** The current state, then every change. */
    connectionStates(): Updates<ConnectionState>;

    /** Looks for the keyboard again — after access was given, or another app let go of it. */
    retry(): void;

    /**
     * The supported keyboards plugged in and the one the app opens, then every change. A connection with one keyboard
     * only — a simulated one — has no others to choose from, and leaves this out.
     */
    attachedKeyboards?(): Updates<AttachedKeyboards>;

    /** Opens another of the keyboards plugged in, in place of the one open now, and keeps it for next time. */
    selectKeyboard?(id: string): void;

    /**
     * Asks the user to grant a keyboard. Resolves with the ID of the keyboard newly granted — the first, when several
     * are — once it is among the keyboards plugged in; `null` when none new was granted or the chooser was cancelled.
     * With no keyboard open, the one granted is opened, as one plugged in is; one open stays — opening the granted one
     * in its place is the app's to ask for ({@link selectKeyboard}). A connection that needs no grant leaves this out.
     */
    requestAccess?(): Promise<string | null>;
}

/** The actions one layer holds, by control ({@link controlKey}). */
export type LayerActions = ReadonlyMap<string, KeyAction>;

/**
 * What reading one layer brought: the actions read, and the layout's controls that weren't. A control of the layout in
 * neither is outside the read — kept in a record beyond those the request asks for.
 */
export interface LayerRead {
    readonly actions: LayerActions;
    /**
     * The layout's controls, within the records asked for, whose records didn't come — the answers stopped early — or
     * held a kind the app doesn't know, in the layout's order. Empty when every control was read.
     */
    readonly unread: readonly ControlId[];
}

/** Talking to the open keyboard. */
export interface KeyboardDeviceRepository {
    /** Asks a keyboard who it is (`FB FB FB`) once. `null` when no answer comes in time. */
    askIdentity(): Promise<KeyboardIdentity | null>;

    /**
     * The actions one layer holds, for the controls of `layout` — standard and legacy formats only. When the answers
     * stop after at least one came, what came; when none comes, it rejects (no reply).
     */
    readActions(layer: number, format: RecordFormat, layout: KeyboardLayout): Promise<LayerRead>;

    /** One layer's lights — the standard format only. */
    readLighting(layer: number): Promise<LayerLighting>;

    /**
     * `action` as a record of `format` holds it — what a keyboard that kept it reads back — or `null` when a record
     * can't hold it.
     */
    storedForm(action: KeyAction, format: RecordFormat): KeyAction | null;

    /**
     * Writes every changed action and light of `configuration`, in the order the keyboard's vendor tool writes them,
     * and has the keyboard keep them.
     */
    write(configuration: KeyboardConfiguration, format: RecordFormat, layout: KeyboardLayout): Promise<void>;
}

/** The layouts users chose, by keyboard. */
export interface LayoutProfileRepository {
    profile(keyboard: UsbIdentity): LayoutProfile | null;
    save(profile: LayoutProfile, keyboard: UsbIdentity): void;
}

/** The reports exchanged with the keyboard, for the device log. */
export interface DeviceLogRepository {
    /** The current entries, then the whole list after changes. */
    entries(): Updates<readonly DeviceLogEntry[]>;

    clear(): void;
}

/** Choosing between the keyboard on USB and a simulated one. */
export interface KeyboardSourceRepository {
    current(): KeyboardSource;
    select(source: KeyboardSource): void;
}
