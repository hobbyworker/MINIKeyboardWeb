// Fakes of the domain's ports, and an editor wired to them.

import {
    AttachedKeyboards,
    ChooseLayoutUseCase,
    IdentifyKeyboardUseCase,
    KeyboardSource,
    KeyboardSourceUseCase,
    KeyColor,
    ObserveAttachedKeyboardsUseCase,
    ObserveConnectionUseCase,
    ReadKeyboardUseCase,
    RequestKeyboardAccessUseCase,
    ResolveLayoutUseCase,
    RetryConnectionUseCase,
    SaveKeyboardUseCase,
    SelectKeyboardUseCase,
    UsbIdentity,
    formatUsbIdentity,
    controlKey,
    type ConnectedKeyboard,
    type ConnectionState,
    type ControlId,
    type DeviceDetails,
    type KeyAction,
    type KeyboardConfiguration,
    type KeyboardConnectionRepository,
    type KeyboardDeviceError,
    type KeyboardDeviceRepository,
    type KeyboardIdentity,
    type KeyboardLayout,
    type KeyboardSourceRepository,
    type LayerLighting,
    type LayerRead,
    type LayoutProfile,
    type LayoutProfileRepository,
    type RecordFormat,
    type Updates,
} from "$domain";
import { ControlRef, EditorModel, KeyUsage, type ControlDrawing, type KeyboardDrawing } from "$presentation";

/** Values sent when told: the current one to each new listener, then every one sent. */
export class Sent<T> implements Updates<T> {
    private current: T;
    private readonly listeners = new Set<(value: T) => void>();

    constructor(initial: T) {
        this.current = initial;
    }

    subscribe(listener: (value: T) => void): () => void {
        const entry = (value: T) => listener(value);
        this.listeners.add(entry);
        entry(this.current);
        return () => {
            this.listeners.delete(entry);
        };
    }

    send(value: T): void {
        this.current = value;
        for (const listener of [...this.listeners]) listener(value);
    }

    listening(): number {
        return this.listeners.size;
    }
}

/** A keyboard that is plugged in when told — and the keyboards plugged in, and the ones chosen. */
export class FakeConnection implements KeyboardConnectionRepository {
    readonly states = new Sent<ConnectionState>({ kind: "searching" });
    readonly attached = new Sent<AttachedKeyboards>(AttachedKeyboards.NONE);
    readonly selected: string[] = [];
    /** What the chooser grants. */
    granted: string | null = null;
    requests = 0;
    retries = 0;

    connectionStates(): Updates<ConnectionState> {
        return this.states;
    }

    retry(): void {
        this.retries += 1;
    }

    attachedKeyboards(): Updates<AttachedKeyboards> {
        return this.attached;
    }

    selectKeyboard(id: string): void {
        this.selected.push(id);
    }

    async requestAccess(): Promise<string | null> {
        this.requests += 1;
        return this.granted;
    }
}

/** A keyboard that answers as told, and keeps what is written to it — as told — for reading back. */
export class FakeDevice implements KeyboardDeviceRepository {
    identity: KeyboardIdentity | null = null;
    /** Every layer's, by `controlKey`. */
    actions = new Map<string, KeyAction>();
    /** The controls each read leaves unread. */
    unread: ControlId[] = [];
    /** What the keyboard keeps of an action written. */
    keeps: (action: KeyAction) => KeyAction = (action) => action;
    failWrite: KeyboardDeviceError | null = null;
    failIdentity: KeyboardDeviceError | null = null;
    failRead: KeyboardDeviceError | null = null;
    readonly writes: KeyboardConfiguration[] = [];
    reads = 0;
    asked = 0;
    /** What was written, by layer and `controlKey`. */
    private readonly kept = new Map<number, Map<string, KeyAction>>();
    /** When set, an identity is answered only once this settles. */
    answer: Promise<void> | null = null;
    /** When set, each layer's actions are read only once this settles. */
    readHeld: Promise<void> | null = null;
    /** When set, a write is done only once this settles. */
    writeHeld: Promise<void> | null = null;

    async askIdentity(): Promise<KeyboardIdentity | null> {
        this.asked += 1;
        if (this.answer !== null) await this.answer;
        if (this.failIdentity !== null) throw this.failIdentity;
        return this.identity;
    }

    async readActions(layer: number): Promise<LayerRead> {
        this.reads += 1;
        if (this.readHeld !== null) await this.readHeld;
        if (this.failRead !== null) throw this.failRead;
        const unread = new Set(this.unread.map(controlKey));
        const actions = [...this.actions, ...(this.kept.get(layer) ?? [])].filter(([key]) => !unread.has(key));
        return { actions: new Map(actions), unread: [...this.unread] };
    }

    async readLighting(): Promise<LayerLighting> {
        return { kind: "perKey", mode: 0, colors: [...KeyColor.DEFAULT_KEY_COLORS] };
    }

    storedForm(action: KeyAction): KeyAction | null {
        return action;
    }

    async write(configuration: KeyboardConfiguration, _format: RecordFormat, layout: KeyboardLayout): Promise<void> {
        if (this.writeHeld !== null) await this.writeHeld;
        if (this.failWrite !== null) throw this.failWrite;
        this.writes.push(configuration.clone());
        for (let layer = 0; layer < configuration.layerCount(); layer++) {
            for (const control of layout.controls) {
                const action = configuration.action(control, layer);
                if (action === null || !configuration.isChanged(control, layer)) continue;
                const kept = this.kept.get(layer) ?? new Map<string, KeyAction>();
                kept.set(controlKey(control), this.keeps(action));
                this.kept.set(layer, kept);
            }
        }
    }
}

export class Profiles implements LayoutProfileRepository {
    readonly saved = new Map<string, LayoutProfile>();

    profile(keyboard: UsbIdentity): LayoutProfile | null {
        return this.saved.get(formatUsbIdentity(keyboard)) ?? null;
    }

    save(profile: LayoutProfile, keyboard: UsbIdentity): void {
        this.saved.set(formatUsbIdentity(keyboard), profile);
    }
}

export class FakeSource implements KeyboardSourceRepository {
    source: KeyboardSource = KeyboardSource.HARDWARE;
    readonly selected: KeyboardSource[] = [];

    current(): KeyboardSource {
        return this.source;
    }

    select(source: KeyboardSource): void {
        this.selected.push(source);
        this.source = source;
    }
}

/** Lets every promise that can settle settle. */
export function settle(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, 0));
}

/** A promise that settles when the test lets it go — to hold a fake's answer in the middle of work. */
export function hold(): { readonly promise: Promise<void>; readonly release: () => void } {
    let release = () => {};
    const promise = new Promise<void>((resolve) => (release = resolve));
    return { promise, release };
}

export interface FixtureOptions {
    /** Wire in the simulator's switch. */
    readonly source?: FakeSource;
    /** Leave out asking for access. */
    readonly withoutAccess?: boolean;
}

export async function fixture(options: FixtureOptions = {}) {
    const connection = new FakeConnection();
    const device = new FakeDevice();
    const profiles = new Profiles();
    const editor = new EditorModel({
        observeConnection: new ObserveConnectionUseCase(connection),
        retryConnection: new RetryConnectionUseCase(connection),
        identifyKeyboard: new IdentifyKeyboardUseCase(device, 1),
        resolveLayout: new ResolveLayoutUseCase(profiles),
        chooseLayout: new ChooseLayoutUseCase(profiles),
        readKeyboard: new ReadKeyboardUseCase(device),
        saveKeyboard: new SaveKeyboardUseCase(device),
        keyboardSource: options.source === undefined ? null : new KeyboardSourceUseCase(options.source),
        attachedKeyboards: {
            observe: new ObserveAttachedKeyboardsUseCase(connection),
            select: new SelectKeyboardUseCase(connection),
        },
        requestAccess: options.withoutAccess ? null : new RequestKeyboardAccessUseCase(connection),
    });
    const stop = editor.start();
    await settle();
    return {
        connection,
        device,
        profiles,
        editor,
        stop,
        async plug(keyboard: ConnectedKeyboard): Promise<void> {
            connection.states.send({ kind: "connected", keyboard });
            await settle();
        },
        async unplug(): Promise<void> {
            connection.states.send({ kind: "searching" });
            await settle();
        },
    };
}

export function k8840(details: DeviceDetails | null = null): ConnectedKeyboard {
    return {
        usb: UsbIdentity.of(0x1189, 0x8840),
        interfaceNumber: 0,
        channel: "hid",
        reportId: 3,
        reportLength: 65,
        details,
    };
}

export function key(usage: number): KeyUsage {
    const found = KeyUsage.named(usage);
    if (found === null) throw new Error(`no key ${usage}`);
    return found;
}

export const A = 0x04;
export const C = 0x06;

export function control(drawing: KeyboardDrawing | null, ref: ControlRef): ControlDrawing {
    const found = drawing?.controls.find((drawn) => ControlRef.same(drawn.control, ref));
    if (found === undefined) throw new Error(`no control ${JSON.stringify(ref)}`);
    return found;
}
