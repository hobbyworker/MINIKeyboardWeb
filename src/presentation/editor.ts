import {
    AppendStrokeUseCase,
    ClearUseCase,
    KeyAction,
    KeyboardCapabilities,
    KeyboardConfiguration,
    KeyboardDeviceError,
    KeyboardIdentity,
    KeyboardLayout,
    KeyboardSource,
    KeyStroke,
    Modifiers,
    RemoveLastStrokeUseCase,
    ResolvedLayout,
    Rotation,
    SetActionUseCase,
    SetKeyDelayUseCase,
    SetLightingUseCase,
    SetPressDelayUseCase,
    SimulatedModel,
    formatUsbIdentity,
    sameUsbIdentity,
    type ChooseLayoutUseCase,
    type ConnectedKeyboard,
    type ConnectionState,
    type EditOutcome,
    type EditTarget,
    type IdentifyKeyboardUseCase,
    type KeyboardIdentification,
    type KeyboardSourceUseCase,
    type ObserveAttachedKeyboardsUseCase,
    type ObserveConnectionUseCase,
    type ReadKeyboardUseCase,
    type ReadOutcome,
    type RequestKeyboardAccessUseCase,
    type ResolveLayoutUseCase,
    type RetryConnectionUseCase,
    type SaveCheck,
    type SaveKeyboardUseCase,
    type SaveOutcome,
    type SelectKeyboardUseCase,
} from "$domain";
import {
    controlIdOf,
    keyColorOf,
    lightColorOf,
    mediaKeyOf,
    modifiersOf,
    mouseActionOf,
    type ActionCaption,
    type ControlRef,
    type LedColor,
    type MediaChoice,
    type ModifierKey,
    type MouseChoice,
    type Rgb,
} from "./choices";
import { EditorState } from "./editor-state";
import type { EditorEvent } from "./events";
import { structurallyEqual } from "./equality";
import * as screen from "./screen";
import {
    simulatorChoiceOf,
    type BoardCap,
    type ConnectionStatus,
    type DelayPage,
    type KeyArrangement,
    type KeyboardChoice,
    type KeyboardDrawing,
    type KeyboardInfo,
    type KeyGroup,
    type LayoutSheetState,
    type LightingPage,
    type SelectionState,
    type ShapeDrawing,
    type SimulatorChoice,
} from "./screen-state";
import type { Activity, EditorTab, Notice, PendingSwitch } from "./state";
import type { KeyUsage } from "./tables/key-usages";

/** The use cases the editor works through, wired in by the composition root. */
export interface EditorDependencies {
    readonly observeConnection: ObserveConnectionUseCase;
    readonly retryConnection: RetryConnectionUseCase;
    readonly identifyKeyboard: IdentifyKeyboardUseCase;
    readonly resolveLayout: ResolveLayoutUseCase;
    readonly chooseLayout: ChooseLayoutUseCase;
    readonly readKeyboard: ReadKeyboardUseCase;
    readonly saveKeyboard: SaveKeyboardUseCase;
    /** The simulator's switch. */
    readonly keyboardSource?: KeyboardSourceUseCase | null;
    /** The keyboards plugged in, and choosing which one is open. */
    readonly attachedKeyboards?: {
        readonly observe: ObserveAttachedKeyboardsUseCase;
        readonly select: SelectKeyboardUseCase;
    } | null;
    /** Asking the user to grant a keyboard, where the connection needs it. */
    readonly requestAccess?: RequestKeyboardAccessUseCase | null;
}

const appendStroke = new AppendStrokeUseCase();
const removeLastStroke = new RemoveLastStrokeUseCase();
const setAction = new SetActionUseCase();
const setPressDelay = new SetPressDelayUseCase();
const setKeyDelay = new SetKeyDelayUseCase();
const clear = new ClearUseCase();
const setLighting = new SetLightingUseCase();

function sameKeyboard(a: ConnectedKeyboard | null, b: ConnectedKeyboard | null): boolean {
    return a === null || b === null ? a === b : structurallyEqual(a, b);
}

function sameSource(a: KeyboardSource, b: KeyboardSource): boolean {
    if (a.kind === "hardware" || b.kind === "hardware") return a.kind === b.kind;
    return SimulatedModel.id(a.model) === SimulatedModel.id(b.model);
}

/** The simulated keyboard of a choice's ID, or with `null` the keyboard on USB; `null` for an ID that is none. */
function sourceNamed(id: string | null): KeyboardSource | null {
    if (id === null) return KeyboardSource.HARDWARE;
    const model = SimulatedModel.all().find((candidate) => SimulatedModel.id(candidate) === id);
    return model === undefined ? null : { kind: "simulated", model };
}

/** What a failed save says. */
function saveFailure(error: unknown): Notice {
    if (error instanceof KeyboardDeviceError) {
        switch (error.reason.kind) {
            case "writeFailed":
                return { kind: "writeFailed", code: error.reason.code };
            case "unsupported":
                return { kind: "unsupported" };
            default:
                return { kind: "keyboardGone" };
        }
    }
    return { kind: "keyboardGone" };
}

/** What a save says, by how it read back. */
function savedNotice(check: SaveCheck, simulated: boolean): Notice {
    switch (check.kind) {
        case "notChecked":
        case "matched":
            return { kind: "saved", simulated };
        case "differs":
            return { kind: "savedButDiffers" };
        case "couldNotCheck":
            return { kind: "savedButNotChecked" };
    }
}

/**
 * The main window's state and what the user does in it: the keyboard connected, its layout, the layer, key and page
 * shown, and the app's copy of the keyboard's configuration. The rules are the use cases'; this keeps the screen, turns
 * their outcomes into notices, and gives the views what they draw in the presentation's own types.
 *
 * It lives on the main thread. Its work that waits returns a promise. It says when it changed through
 * {@link subscribe}; the interface reads what it draws again.
 */
export class EditorModel {
    private readonly state = new EditorState();
    private readonly deps: EditorDependencies;
    private readonly listeners = new Set<() => void>();
    private readonly eventListeners = new Set<(event: EditorEvent) => void>();

    constructor(deps: EditorDependencies) {
        this.deps = deps;
    }

    /** Calls `listener` after every change, until the returned function is called. */
    subscribe(listener: () => void): () => void {
        const entry = () => listener();
        this.listeners.add(entry);
        return () => {
            this.listeners.delete(entry);
        };
    }

    /** Hears what happened ({@link EditorEvent}) — a connection, a read, a save, a problem — until the returned call. */
    onEvent(listener: (event: EditorEvent) => void): () => void {
        const entry = (event: EditorEvent) => listener(event);
        this.eventListeners.add(entry);
        return () => {
            this.eventListeners.delete(entry);
        };
    }

    private emit(event: EditorEvent): void {
        for (const listener of [...this.eventListeners]) listener(event);
    }

    private simulated(): boolean {
        return KeyboardSource.isSimulated(this.state.source);
    }

    /** Changes the state, then tells the listeners — after the change is done, so they can read it. */
    private update<R>(change: (state: EditorState) => R): R {
        const result = change(this.state);
        for (const listener of [...this.listeners]) listener();
        return result;
    }

    /**
     * Follows the keyboard, and the keyboards plugged in, until the returned function is called; one that comes is
     * identified at once. Connection states are handled one at a time, in order: one that comes while another is still
     * being handled — while a keyboard is identified and read — waits its turn.
     */
    start(): () => void {
        const source = this.deps.keyboardSource;
        if (source) {
            const current = source.current();
            this.update((state) => {
                state.source = current;
            });
        }
        let stopped = false;
        const waiting: ConnectionState[] = [];
        let handling = false;
        const handle = async () => {
            if (handling) return;
            handling = true;
            try {
                for (let next = waiting.shift(); next !== undefined && !stopped; next = waiting.shift()) {
                    await this.connectionChanged(next);
                }
            } finally {
                handling = false;
            }
        };
        const unsubscribeStates = this.deps.observeConnection.execute().subscribe((state) => {
            if (stopped) return;
            waiting.push(state);
            void handle();
        });
        const unsubscribeAttached = this.deps.attachedKeyboards?.observe.execute().subscribe((keyboards) => {
            if (stopped) return;
            this.update((state) => {
                state.attached = keyboards;
            });
        });
        return () => {
            stopped = true;
            waiting.length = 0;
            unsubscribeStates();
            unsubscribeAttached?.();
        };
    }

    // State the views read

    activity(): Activity | null {
        return this.state.activity;
    }

    notice(): Notice | null {
        return this.state.notice;
    }

    /** Counts up with each notice shown, so the one to take away can be told from a newer one. */
    noticeSerial(): number {
        return this.state.noticeSerial;
    }

    isChoosingLayout(): boolean {
        return this.state.isChoosingLayout;
    }

    /** Opens or closes the layout sheet — it opens only with a keyboard to choose for. */
    setChoosingLayout(choosing: boolean): void {
        this.update((state) => {
            state.isChoosingLayout = choosing && state.resolvedLayout !== null && state.keyboard() !== null;
        });
    }

    tab(): EditorTab {
        return this.state.tab;
    }

    setTab(tab: EditorTab): void {
        this.update((state) => {
            state.tab = tab;
        });
    }

    layer(): number {
        return this.state.layer;
    }

    setLayer(layer: number): void {
        this.update((state) => {
            state.layer = Math.max(0, Math.min(layer, state.layerCount() - 1));
        });
    }

    isReady(): boolean {
        return this.state.isReady();
    }

    layerCount(): number {
        return this.state.layerCount();
    }

    availableTabs(): EditorTab[] {
        return this.state.availableTabs();
    }

    /** Whether the keyboard reads back at all — then the header has Read. */
    readsBack(): boolean {
        return this.state.readsBack();
    }

    canRead(): boolean {
        return this.state.isReady() && this.state.readsBack();
    }

    hasUnsavedChanges(): boolean {
        return this.state.configuration.hasUnsavedChanges();
    }

    /** Whether another keyboard, or a simulated one, can be opened — not while work with the keyboard is under way. */
    canSwitchKeyboard(): boolean {
        return this.state.activity === null;
    }

    // Connection

    private async connectionChanged(next: ConnectionState): Promise<void> {
        const before = this.state.connection.kind;
        if (
            next.kind !== before &&
            (next.kind === "unsupported" || next.kind === "needsPermission" || next.kind === "openFailed")
        ) {
            this.emit({ action: "problem", problem: next.kind });
        }
        const identify = this.update((state) => {
            const previous = state.keyboard();
            state.connection = next;
            const keyboard = state.keyboard();
            if (sameKeyboard(keyboard, previous)) return false;
            state.connectionSerial += 1;
            state.identification = null;
            state.selection = null;
            state.held = Modifiers.NONE;
            // A sheet for the keyboard that went goes with it; the next one asks again if it needs to. So does a
            // switch away from it waiting to be confirmed.
            state.isChoosingLayout = false;
            state.pendingSwitch = null;
            if (keyboard === null) return false;
            if (previous === null || !sameUsbIdentity(keyboard.usb, previous.usb)) state.resolvedLayout = null;
            return true;
        });
        if (identify) await this.identify();
    }

    retryConnection(): void {
        this.deps.retryConnection.execute();
    }

    /**
     * Opens another of the keyboards plugged in — not while work with the keyboard is under way, and with changes not
     * saved to the keyboard open only once the user lets them go ({@link pendingSwitch}). The connection reports
     * "searching" first, as after re-plugging.
     */
    selectKeyboard(id: string): void {
        this.requestSwitch({ kind: "keyboard", id });
    }

    /** A switch that waits for the user to let the changes not saved go: {@link confirmSwitch} or {@link cancelSwitch}. */
    pendingSwitch(): PendingSwitch | null {
        return this.state.pendingSwitch;
    }

    /** Makes the switch that waits, dropping the changes not saved. */
    confirmSwitch(): void {
        const pending = this.state.pendingSwitch;
        if (pending === null) return;
        this.update((state) => {
            state.pendingSwitch = null;
        });
        if (this.canSwitchKeyboard()) this.switchTo(pending);
    }

    /** Forgets the switch that waits; the keyboard and the changes stay. */
    cancelSwitch(): void {
        if (this.state.pendingSwitch === null) return;
        this.update((state) => {
            state.pendingSwitch = null;
        });
    }

    /**
     * Switches at once, or keeps the switch to be confirmed when it would drop changes that could still be saved — to
     * the keyboard open and identified. Those of a keyboard that went can be saved nowhere, and aren't asked about.
     */
    private requestSwitch(request: PendingSwitch): void {
        if (!this.canSwitchKeyboard() || !this.switches(request)) return;
        const state = this.state;
        if (state.keyboard() !== null && state.identification !== null && this.hasUnsavedChanges()) {
            this.update((state) => {
                state.pendingSwitch = request;
            });
        } else {
            this.switchTo(request);
        }
    }

    /** Whether `request` opens a keyboard there is, other than the one open. */
    private switches(request: PendingSwitch): boolean {
        const state = this.state;
        if (request.kind === "keyboard") {
            const attached = state.attached;
            return (
                this.deps.attachedKeyboards != null &&
                attached.keyboards.some((keyboard) => keyboard.id === request.id) &&
                (request.id !== attached.selected || state.keyboard() === null)
            );
        }
        const next = sourceNamed(request.id);
        return this.deps.keyboardSource != null && next !== null && !sameSource(next, state.source);
    }

    /** Makes the switch now — unless it no longer opens another keyboard. */
    private switchTo(request: PendingSwitch): void {
        if (!this.switches(request)) return;
        if (request.kind === "keyboard") {
            this.deps.attachedKeyboards?.select.execute(request.id);
            return;
        }
        const next = sourceNamed(request.id);
        if (next === null) return;
        this.deps.keyboardSource?.select(next);
        this.update((state) => {
            state.source = next;
        });
    }

    /** Whether the browser can be asked for a keyboard — then the window offers to connect one while it searches. */
    canRequestAccess(): boolean {
        return this.deps.requestAccess != null;
    }

    /**
     * Asks the user to grant a keyboard; call it from a click. The one granted is opened as one chosen from those
     * plugged in is ({@link selectKeyboard}) — with none open, at once. Rejects as the connection's request does.
     */
    async requestAccess(): Promise<void> {
        if (!this.deps.requestAccess) return;
        const granted = await this.deps.requestAccess.execute();
        this.emit({ action: "access", granted: granted != null });
        if (granted != null) this.selectKeyboard(granted);
    }

    /**
     * Settles the keyboard's commands and layout, then reads it if it reads back on its own. A type the app's rules
     * weren't tried with is pointed out once that is done — in place of what the read said, as it says what to do.
     */
    async identify(): Promise<void> {
        const keyboard = this.state.keyboard();
        if (keyboard === null || this.state.identification !== null || this.state.activity !== null) return;
        const serial = this.begin("identifying");
        let identified: KeyboardIdentification;
        try {
            identified = await this.deps.identifyKeyboard.execute();
        } catch {
            const shown = await this.finish(serial, (state) => {
                state.show({ kind: "identifyFailed" });
                return true;
            });
            if (shown !== undefined) this.emit({ action: "problem", problem: "identifyFailed" });
            return;
        }
        const resolveLayout = this.deps.resolveLayout;
        const readNow = await this.finish(serial, (state) => {
            state.identification = identified;
            const capabilities = new KeyboardCapabilities(identified.format);
            const resolved = resolveLayout.execute(keyboard, identified);
            state.isChoosingLayout = ResolvedLayout.needsChoice(resolved);
            state.resolvedLayout = resolved;
            state.configuration = new KeyboardConfiguration(capabilities.layerCount());
            state.layer = Math.min(state.layer, capabilities.layerCount() - 1);
            if (!state.availableTabs().includes(state.tab)) state.tab = "keys";
            return capabilities.reading() === "onConnect";
        });
        if (readNow === undefined) return;
        this.emit({
            action: "connect",
            usb: formatUsbIdentity(keyboard.usb),
            type: identified.identity?.kind ?? null,
            format: identified.format,
            knownType: identified.identity === null || KeyboardIdentity.isKnownType(identified.identity),
            simulated: this.simulated(),
        });
        if (readNow) await this.readWith(false);
        const identity = identified.identity;
        if (identity === null || KeyboardIdentity.isKnownType(identity)) return;
        this.update((state) => {
            // Not when the keyboard changed meanwhile: the one there now was identified on its own.
            if (state.connectionSerial === serial) state.show({ kind: "untestedFirmware", type: identity.kind });
        });
    }

    /**
     * Starts work with the keyboard. Returns the connection's serial as it starts, for {@link finish} to tell whether the
     * keyboard changed meanwhile.
     */
    private begin(activity: Activity): number {
        return this.update((state) => {
            state.activity = activity;
            return state.connectionSerial;
        });
    }

    /**
     * Ends work begun at connection `serial`: `apply` takes its outcome into the state, and what it returns is returned.
     * When the keyboard changed meanwhile, the outcome isn't the keyboard's: it is dropped, the user is told the keyboard
     * went, and the one connected now is identified — it wasn't when it came, as the work was under way. Then the
     * result is `undefined`.
     */
    private async finish<R>(serial: number, apply: (state: EditorState) => R): Promise<R | undefined> {
        const changed = this.update((state) => {
            state.activity = null;
            if (state.connectionSerial === serial) return { result: apply(state) };
            state.show({ kind: "keyboardGone" });
            return null;
        });
        if (changed !== null) return changed.result;
        await this.identify();
        return undefined;
    }

    // Reading and saving

    async read(): Promise<void> {
        await this.readWith(true);
    }

    private async readWith(announce: boolean): Promise<void> {
        const state = this.state;
        const capabilities = state.capabilities();
        const resolved = state.resolvedLayout;
        if (capabilities === null || resolved === null) return;
        if (!(state.isReady() && state.readsBack())) return;
        const configuration = state.configuration.clone();
        const serial = this.begin("reading");
        let outcome: ReadOutcome;
        try {
            outcome = await this.deps.readKeyboard.execute(configuration, capabilities, resolved.layout);
        } catch {
            const failed = await this.finish(serial, (state) => {
                state.show({ kind: "readFailed" });
                return true;
            });
            if (failed !== undefined)
                this.emit({ action: "read", result: "failed", automatic: !announce, simulated: this.simulated() });
            return;
        }
        const result = await this.finish(serial, (state) => {
            state.configuration = outcome.configuration;
            if (outcome.error !== null) state.show({ kind: "readFailed" });
            else if (outcome.unread.size > 0) state.show({ kind: "readIncomplete" });
            else if (announce) state.show({ kind: "readComplete" });
            return outcome.error !== null ? "failed" : outcome.unread.size > 0 ? "incomplete" : "complete";
        });
        if (result !== undefined)
            this.emit({ action: "read", result, automatic: !announce, simulated: this.simulated() });
    }

    async save(): Promise<void> {
        const state = this.state;
        const capabilities = state.capabilities();
        const resolved = state.resolvedLayout;
        if (capabilities === null || resolved === null) return;
        if (!state.isReady()) return;
        const configuration = state.configuration.clone();
        if (!configuration.hasUnsavedChanges()) {
            this.update((state) => state.show({ kind: "nothingToSave" }));
            return;
        }
        const serial = this.begin("saving");
        let result: SaveOutcome;
        try {
            result = await this.deps.saveKeyboard.execute(configuration, capabilities, resolved.layout);
        } catch (error) {
            const failed = await this.finish(serial, (state) => {
                state.show(saveFailure(error));
                return true;
            });
            if (failed !== undefined) this.emit({ action: "save", result: "failed", simulated: this.simulated() });
            return;
        }
        const check = await this.finish(serial, (state) => {
            if (result.kind === "saved") {
                state.configuration = result.configuration;
                state.show(savedNotice(result.check, KeyboardSource.isSimulated(state.source)));
                return result.check.kind;
            }
            state.show({ kind: "nothingToSave" });
            return null;
        });
        if (check != null) this.emit({ action: "save", result: check, simulated: this.simulated() });
    }

    // Layout

    /** The layout and rotation the user chose; on a keyboard that said its shape, only the rotation. */
    private applyLayout(layout: KeyboardLayout, rotation: Rotation): void {
        const chooseLayout = this.deps.chooseLayout;
        this.update((state) => {
            const keyboard = state.keyboard();
            const resolved = state.resolvedLayout;
            if (keyboard === null || resolved === null) return;
            const chosen = chooseLayout.execute(resolved, layout, rotation, keyboard.usb);
            if (state.selection !== null && !KeyboardLayout.has(chosen.layout, state.selection)) state.selection = null;
            state.resolvedLayout = chosen;
            state.isChoosingLayout = false;
        });
    }

    /** One of the cross-platform app's layouts by its name, or with `null` the keyboard's own — only turned. */
    chooseLayout(id: string | null, quarterTurns: number): void {
        const layout = (id === null ? null : KeyboardLayout.named(id)) ?? this.state.resolvedLayout?.layout ?? null;
        if (layout === null) return;
        this.applyLayout(layout, Rotation.fromQuarterTurns(quarterTurns));
    }

    /**
     * Whether there is a layout to turn or change — the connected keyboard's. With none connected the last one is
     * still drawn, dimmed, but there is nothing to change it on.
     */
    hasLayout(): boolean {
        return this.state.resolvedLayout !== null && this.state.keyboard() !== null;
    }

    rotate(): void {
        const resolved = this.state.resolvedLayout;
        if (resolved === null) return;
        this.applyLayout(resolved.layout, Rotation.next(resolved.rotation));
    }

    // Editing

    select(control: ControlRef): void {
        this.update((state) => {
            if (state.isReady()) state.selection = controlIdOf(control);
        });
    }

    private edit(change: (configuration: KeyboardConfiguration, target: EditTarget) => EditOutcome): void {
        this.update((state) => {
            if (!state.isReady()) return;
            const target = state.target();
            if (target === null) return;
            state.report(change(state.configuration, target));
        });
    }

    /** A key, with the modifiers held for it. */
    press(key: KeyUsage): void {
        const stroke = KeyStroke.of(this.state.held, key.usage);
        this.edit((configuration, target) => appendStroke.execute(stroke, configuration, target));
        this.update((state) => {
            state.held = Modifiers.NONE;
        });
    }

    /** A shifted symbol: Shift and its key. */
    pressShifted(key: KeyUsage): void {
        const stroke = KeyStroke.of(this.state.held | Modifiers.SHIFT, key.usage);
        this.edit((configuration, target) => appendStroke.execute(stroke, configuration, target));
        this.update((state) => {
            state.held = Modifiers.NONE;
        });
    }

    toggle(modifier: ModifierKey): void {
        this.update((state) => {
            state.held ^= modifiersOf(modifier);
        });
    }

    /** The held modifiers alone, which makes the key a modifier key. */
    assignHeldModifiers(): void {
        const held = this.state.held;
        if (held === Modifiers.NONE) return;
        this.edit((configuration, target) => appendStroke.execute(KeyStroke.of(held, 0), configuration, target));
        this.update((state) => {
            state.held = Modifiers.NONE;
        });
    }

    removeLastStroke(): void {
        this.edit((configuration, target) => removeLastStroke.execute(configuration, target));
    }

    assignMedia(media: MediaChoice): void {
        this.edit((configuration, target) =>
            setAction.execute(KeyAction.media(mediaKeyOf(media)), configuration, target),
        );
    }

    assignMouse(mouse: MouseChoice): void {
        this.edit((configuration, target) =>
            setAction.execute(KeyAction.mouse(mouseActionOf(mouse)), configuration, target),
        );
    }

    /** The wait before press `press` (from 0) of the selected key, in milliseconds. */
    setDelay(press: number, milliseconds: number): void {
        this.edit((configuration, target) => setPressDelay.execute(press, milliseconds, configuration, target));
    }

    /** The one wait of the selected key, in milliseconds. */
    setKeyDelay(milliseconds: number): void {
        this.edit((configuration, target) => setKeyDelay.execute(milliseconds, configuration, target));
    }

    clearSelected(): void {
        this.edit((configuration, target) => clear.execute(configuration, target));
    }

    clearLayer(): void {
        const layout = this.state.resolvedLayout?.layout;
        if (layout === undefined) return;
        this.edit((configuration, target) => clear.executeAll(layout, configuration, target.layer));
    }

    setLightingMode(mode: number): void {
        this.edit((configuration, target) => setLighting.setMode(mode, configuration, target));
    }

    setLightColor(color: LedColor): void {
        this.edit((configuration, target) => setLighting.setColor(lightColorOf(color), configuration, target));
    }

    setKeyColor(color: Rgb): void {
        this.edit((configuration, target) => setLighting.setKeyColor(keyColorOf(color), configuration, target));
    }

    // Simulator

    canSelectSource(): boolean {
        return this.deps.keyboardSource != null;
    }

    /** Every keyboard the simulator plays, when it is wired in. */
    simulatorChoices(): SimulatorChoice[] {
        if (this.deps.keyboardSource == null) return [];
        return SimulatedModel.all().map(simulatorChoiceOf);
    }

    /** The simulated keyboard in use, or `null` for the keyboard on USB. */
    activeSimulatorId(): string | null {
        const source = this.state.source;
        return source.kind === "simulated" ? SimulatedModel.id(source.model) : null;
    }

    /**
     * Switches to a simulated keyboard, or with `null` to the keyboard on USB — as {@link selectKeyboard}, not while
     * busy, and with changes not saved to the keyboard open only once the user lets them go. The switch reports
     * "searching" first, so the window starts over as after re-plugging.
     */
    selectSimulator(id: string | null): void {
        this.requestSwitch({ kind: "simulator", id });
    }

    // Notices

    dismissNotice(): void {
        this.update((state) => {
            state.notice = null;
        });
    }

    /** Takes the notice away when it is still the one shown as `serial`. */
    expireNotice(serial: number): void {
        if (this.state.noticeSerial === serial && this.state.notice !== null) this.dismissNotice();
    }

    // What the window draws (see screen.ts)

    status(): ConnectionStatus {
        return screen.status(this.state);
    }

    keyboardInfo(): KeyboardInfo | null {
        return screen.keyboardInfo(this.state);
    }

    /** The keyboards plugged in, to choose which is open — only when there is more than one. */
    keyboardChoices(): KeyboardChoice[] {
        return screen.keyboardChoices(this.state);
    }

    drawing(): KeyboardDrawing | null {
        return screen.drawing(this.state);
    }

    selectedControl(): ControlRef | null {
        return screen.selectedControl(this.state);
    }

    selectionState(): SelectionState | null {
        return screen.selectionState(this.state);
    }

    /** What the selected key does, for marking the page's matching button. */
    selectedCaption(): ActionCaption | null {
        return screen.selectedCaption(this.state);
    }

    heldModifiers(): ModifierKey[] {
        return screen.heldModifiers(this.state);
    }

    /** "Ctrl+Super", or `null` when none is held. */
    heldModifierText(): string | null {
        return screen.heldModifierText(this.state);
    }

    pressLimit(): number {
        return screen.pressLimit(this.state);
    }

    /** Whether each modifier takes a place of its own in a key, as on the standard format. */
    modifiersCountAsPresses(): boolean {
        return screen.modifiersCountAsPresses(this.state);
    }

    /** How the keyboard's vendor tool lays out its keys — the cross-platform app's full-size keyboard. */
    vendorKeyArrangement(): KeyArrangement {
        return screen.vendorKeyArrangement();
    }

    /** The full-size keyboard. A key the keyboard isn't given keeps its place but is off. */
    keyBoard(): BoardCap[] {
        return screen.keyBoard(this.state);
    }

    /** The keys a full-size keyboard doesn't have — F13–F24 and the two non-US keys — that the keyboard is given. */
    moreKeys(): KeyUsage[] {
        return screen.moreKeys(this.state);
    }

    /** The alphabetical arrangement: groups of the keys the keyboard is given, leaving out empty ones. */
    keyGroups(): KeyGroup[] {
        return screen.keyGroups(this.state);
    }

    /** Digits and symbols with their shifted characters, sent as Shift and the key. */
    shiftSymbols(): KeyUsage[] {
        return screen.shiftSymbols(this.state);
    }

    mediaChoices(): MediaChoice[] {
        return screen.mediaChoices(this.state);
    }

    lightingPage(): LightingPage | null {
        return screen.lightingPage(this.state);
    }

    delayPage(): DelayPage {
        return screen.delayPage(this.state);
    }

    layoutSheet(): LayoutSheetState | null {
        return screen.layoutSheet(this.state);
    }

    /** One of the app's layouts by its name, or with `null` the keyboard's own, drawn small and turned. */
    previewDrawing(layoutId: string | null, quarterTurns: number): ShapeDrawing | null {
        return screen.previewDrawing(this.state, layoutId, quarterTurns);
    }
}
