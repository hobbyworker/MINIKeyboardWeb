import { sameAction } from "../actions";
import type { KeyboardCapabilities } from "../capabilities";
import { ChangeSet, type KeyboardConfiguration } from "../configuration";
import { AttachedKeyboards, KeyboardDeviceError, type ConnectionState } from "../connection";
import { KeyboardIdentity, type KeyboardIdentification } from "../keyboards";
import { controlKey, sameControl, type ControlId, type KeyboardLayout } from "../layout";
import { sameLighting } from "../lighting";
import {
    once,
    type DeviceLogRepository,
    type KeyboardConnectionRepository,
    type KeyboardDeviceRepository,
    type KeyboardSourceRepository,
    type LayerRead,
    type Updates,
} from "../ports";
import type { DeviceLogEntry, KeyboardSource } from "../support";

/** Follows the keyboard as it comes and goes. */
export class ObserveConnectionUseCase {
    private readonly repository: KeyboardConnectionRepository;

    constructor(repository: KeyboardConnectionRepository) {
        this.repository = repository;
    }

    execute(): Updates<ConnectionState> {
        return this.repository.connectionStates();
    }
}

/** Follows the supported keyboards plugged in and the one the app opens. */
export class ObserveAttachedKeyboardsUseCase {
    private readonly repository: KeyboardConnectionRepository;

    constructor(repository: KeyboardConnectionRepository) {
        this.repository = repository;
    }

    execute(): Updates<AttachedKeyboards> {
        return this.repository.attachedKeyboards?.() ?? once(AttachedKeyboards.NONE);
    }
}

/** Opens another of the keyboards plugged in. */
export class SelectKeyboardUseCase {
    private readonly repository: KeyboardConnectionRepository;

    constructor(repository: KeyboardConnectionRepository) {
        this.repository = repository;
    }

    execute(id: string): void {
        this.repository.selectKeyboard?.(id);
    }
}

/** Looks for the keyboard again. */
export class RetryConnectionUseCase {
    private readonly repository: KeyboardConnectionRepository;

    constructor(repository: KeyboardConnectionRepository) {
        this.repository = repository;
    }

    execute(): void {
        this.repository.retry();
    }
}

/** Asks the user to grant a keyboard. */
export class RequestKeyboardAccessUseCase {
    private readonly repository: KeyboardConnectionRepository;

    constructor(repository: KeyboardConnectionRepository) {
        this.repository = repository;
    }

    /** The ID of the keyboard newly granted, or `null` when none was — or the connection needs no grant. */
    async execute(): Promise<string | null> {
        return (await this.repository.requestAccess?.()) ?? null;
    }
}

/**
 * Settles the commands a newly connected keyboard takes: it is asked who it is, up to `attempts` times, and one that
 * never answers is written in the `FE` form.
 */
export class IdentifyKeyboardUseCase {
    private readonly repository: KeyboardDeviceRepository;
    private readonly attempts: number;

    constructor(repository: KeyboardDeviceRepository, attempts = 3) {
        this.repository = repository;
        this.attempts = Math.max(1, attempts);
    }

    /** Rejects with a {@link KeyboardDeviceError} when asking fails for a reason other than an answer too short. */
    async execute(): Promise<KeyboardIdentification> {
        for (let attempt = 0; attempt < this.attempts; attempt++) {
            let identity: KeyboardIdentity | null;
            try {
                identity = await this.repository.askIdentity();
            } catch (error) {
                if (error instanceof KeyboardDeviceError && error.reason.kind === "invalidReply") continue;
                throw error;
            }
            if (identity !== null) return { format: KeyboardIdentity.recordFormat(identity), identity };
        }
        return { format: "unidentified", identity: null };
    }
}

/**
 * What reading left: the configuration with every layer that arrived, the controls of each layer that didn't — by
 * layer, only layers that have some — and why it stopped, if it did.
 */
export interface ReadOutcome {
    readonly configuration: KeyboardConfiguration;
    readonly unread: ReadonlyMap<number, readonly ControlId[]>;
    readonly error: KeyboardDeviceError | null;
}

/**
 * Reads what the keyboard holds into a configuration: every layer's actions and, on the standard format, every
 * layer's lights. A control whose answer doesn't arrive is left as it was, and reading goes on with the next layer; a
 * failure stops it.
 */
export class ReadKeyboardUseCase {
    private readonly repository: KeyboardDeviceRepository;

    constructor(repository: KeyboardDeviceRepository) {
        this.repository = repository;
    }

    /** Reads into a copy of `configuration`; the one given is left as it is. */
    async execute(
        configuration: KeyboardConfiguration,
        capabilities: KeyboardCapabilities,
        layout: KeyboardLayout,
    ): Promise<ReadOutcome> {
        const unread = new Map<number, readonly ControlId[]>();
        if (capabilities.reading() === "never") {
            return { configuration, unread, error: KeyboardDeviceError.unsupported() };
        }
        const updated = configuration.clone();
        try {
            for (let layer = 0; layer < updated.layerCount(); layer++) {
                const read = await this.repository.readActions(layer, capabilities.format, layout);
                updated.applyRead(read.actions, layer);
                if (read.unread.length > 0) unread.set(layer, read.unread);
            }
            if (capabilities.lighting().kind === "perKeyColor") {
                for (let layer = 0; layer < updated.layerCount(); layer++) {
                    const lighting = await this.repository.readLighting(layer);
                    updated.applyReadLighting(lighting, layer);
                }
            }
            return { configuration: updated, unread, error: null };
        } catch (error) {
            if (!(error instanceof KeyboardDeviceError)) throw error;
            return { configuration: updated, unread, error };
        }
    }
}

/**
 * How what was saved read back.
 *
 * - `notChecked`: the keyboard doesn't read back.
 * - `matched`: everything written read back as the keyboard's records hold it.
 * - `differs`: some of it read back otherwise — `differences`.
 * - `couldNotCheck`: nothing differed, but some of it couldn't be read back to compare.
 */
export type SaveCheck =
    | { readonly kind: "notChecked" }
    | { readonly kind: "matched" }
    | { readonly kind: "differs"; readonly differences: ChangeSet }
    | { readonly kind: "couldNotCheck" };

/** What saving came to. */
export type SaveOutcome =
    | { readonly kind: "saved"; readonly configuration: KeyboardConfiguration; readonly check: SaveCheck }
    | { readonly kind: "nothingToSave" };

/**
 * Writes what changed, then — on a keyboard that reads back — reads it back to check. On a failure the changes stay
 * marked, so saving can be tried again; so do those that read back otherwise.
 */
export class SaveKeyboardUseCase {
    private readonly repository: KeyboardDeviceRepository;

    constructor(repository: KeyboardDeviceRepository) {
        this.repository = repository;
    }

    /** Rejects with a {@link KeyboardDeviceError} when writing fails; reading back never fails it. */
    async execute(
        configuration: KeyboardConfiguration,
        capabilities: KeyboardCapabilities,
        layout: KeyboardLayout,
    ): Promise<SaveOutcome> {
        if (!configuration.hasUnsavedChanges()) return { kind: "nothingToSave" };
        await this.repository.write(configuration, capabilities.format, layout);
        const check = await this.readBack(configuration, capabilities, layout);
        const saved = configuration.clone();
        saved.markSaved(check.kind === "differs" ? check.differences : ChangeSet.NONE);
        return { kind: "saved", configuration: saved, check };
    }

    /**
     * Reads back each layer with changed controls and compares each of them with the form the keyboard's records hold
     * it in, so only what the keyboard changed counts; then, where the keyboard reads lights back, each layer whose
     * lights changed. A layer that can't be read back can't be told; a control outside the read isn't compared.
     */
    private async readBack(
        configuration: KeyboardConfiguration,
        capabilities: KeyboardCapabilities,
        layout: KeyboardLayout,
    ): Promise<SaveCheck> {
        if (capabilities.reading() === "never") return { kind: "notChecked" };
        const format = capabilities.format;
        const controls = new Map<number, ControlId[]>();
        const lightingLayers: number[] = [];
        let untold = false;
        for (let layer = 0; layer < configuration.layerCount(); layer++) {
            const written = layout.controls.flatMap((control) => {
                const action = configuration.isChanged(control, layer) ? configuration.action(control, layer) : null;
                return action === null ? [] : [[control, action] as const];
            });
            if (written.length === 0) continue;
            let read: LayerRead;
            try {
                read = await this.repository.readActions(layer, format, layout);
            } catch {
                untold = true;
                continue;
            }
            const differing: ControlId[] = [];
            for (const [control, action] of written) {
                const actual = read.actions.get(controlKey(control));
                const isUnread = read.unread.some((other) => sameControl(other, control));
                if (actual === undefined && !isUnread) continue;
                const expected = this.repository.storedForm(action, format);
                if (actual === undefined || expected === null) {
                    untold = true;
                    continue;
                }
                if (!sameAction(actual, expected)) differing.push(control);
            }
            if (differing.length > 0) controls.set(layer, differing);
        }
        if (capabilities.lighting().kind === "perKeyColor") {
            for (const [layer, state] of configuration.layers().entries()) {
                const written = configuration.lighting(layer);
                if (!state.lightingChanged || written === null) continue;
                try {
                    if (!sameLighting(await this.repository.readLighting(layer), written)) lightingLayers.push(layer);
                } catch {
                    untold = true;
                }
            }
        }
        const differences: ChangeSet = { controls, lightingLayers };
        if (!ChangeSet.isEmpty(differences)) return { kind: "differs", differences };
        return untold ? { kind: "couldNotCheck" } : { kind: "matched" };
    }
}

/** The device log. */
export class DeviceLogUseCase {
    private readonly repository: DeviceLogRepository;

    constructor(repository: DeviceLogRepository) {
        this.repository = repository;
    }

    entries(): Updates<readonly DeviceLogEntry[]> {
        return this.repository.entries();
    }

    clear(): void {
        this.repository.clear();
    }
}

/** Switches between the keyboard on USB and a simulated one. */
export class KeyboardSourceUseCase {
    private readonly repository: KeyboardSourceRepository;

    constructor(repository: KeyboardSourceRepository) {
        this.repository = repository;
    }

    current(): KeyboardSource {
        return this.repository.current();
    }

    select(source: KeyboardSource): void {
        this.repository.select(source);
    }
}
