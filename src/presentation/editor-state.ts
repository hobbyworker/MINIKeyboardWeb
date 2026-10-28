import {
    AttachedKeyboards,
    ConnectionState,
    KeyboardCapabilities,
    KeyboardConfiguration,
    KeyboardSource,
    Modifiers,
    SetLightingUseCase,
    type ConnectedKeyboard,
    type ControlId,
    type EditOutcome,
    type EditTarget,
    type KeyAction,
    type KeyboardIdentification,
    type KeyColor,
    type LayerLighting,
    type ResolvedLayout,
} from "$domain";
import { EditorTab, type Activity, type Notice, type PendingSwitch } from "./state";

/** What the editor holds between the user's doings. */
export class EditorState {
    activity: Activity | null = null;
    notice: Notice | null = null;
    noticeSerial = 0;
    /** The layout sheet is up — on its own when a keyboard that can't say its shape needs one set. */
    isChoosingLayout = false;
    tab: EditorTab = "keys";
    layer = 0;
    connection: ConnectionState = { kind: "searching" };
    /**
     * Counts up each time the connection changes to another keyboard, or to none — so work with the keyboard can tell
     * when it ends whether the keyboard is still the one it began with. Two keyboards of the same USB ID look the same;
     * this tells them apart.
     */
    connectionSerial = 0;
    identification: KeyboardIdentification | null = null;
    resolvedLayout: ResolvedLayout | null = null;
    configuration = new KeyboardConfiguration(3);
    selection: ControlId | null = null;
    /** Modifiers picked for the next key. */
    held: Modifiers = Modifiers.NONE;
    /** The keyboard on USB, or a simulated one. */
    source: KeyboardSource = KeyboardSource.HARDWARE;
    /** The keyboards on USB and the one open. */
    attached: AttachedKeyboards = AttachedKeyboards.NONE;
    /** A switch the user asked for that would drop changes not saved — until they say whether it goes ahead. */
    pendingSwitch: PendingSwitch | null = null;

    keyboard(): ConnectedKeyboard | null {
        return ConnectionState.keyboard(this.connection);
    }

    capabilities(): KeyboardCapabilities | null {
        return this.identification === null ? null : new KeyboardCapabilities(this.identification.format);
    }

    /** Connected, identified and not busy. */
    isReady(): boolean {
        return this.keyboard() !== null && this.identification !== null && this.activity === null;
    }

    layerCount(): number {
        return this.capabilities()?.layerCount() ?? 3;
    }

    availableTabs(): EditorTab[] {
        const capabilities = this.capabilities();
        if (capabilities === null) return [...EditorTab.ALL];
        return EditorTab.ALL.filter((tab) => tab !== "delay" || capabilities.delays().kind !== "unavailable");
    }

    readsBack(): boolean {
        const capabilities = this.capabilities();
        return capabilities !== null && capabilities.reading() !== "never";
    }

    action(control: ControlId): KeyAction | null {
        return this.configuration.action(control, this.layer);
    }

    selectedAction(): KeyAction | null {
        return this.selection === null ? null : this.action(this.selection);
    }

    lighting(): LayerLighting | null {
        return this.configuration.lighting(this.layer);
    }

    /** The colour of a key on a keyboard that lights each key. */
    keyColor(control: ControlId): KeyColor | null {
        const support = this.capabilities()?.lighting();
        if (support?.kind !== "perKeyColor") return null;
        const lighting = this.lighting();
        if (lighting?.kind !== "perKey") return null;
        const index = SetLightingUseCase.colorIndex(control, support.keys);
        return index === null ? null : (lighting.colors[index] ?? null);
    }

    target(): EditTarget | null {
        const capabilities = this.capabilities();
        return capabilities === null ? null : { capabilities, layer: this.layer, control: this.selection };
    }

    show(notice: Notice): void {
        this.notice = notice;
        this.noticeSerial += 1;
    }

    report(outcome: EditOutcome): void {
        switch (outcome.kind) {
            case "applied":
                return;
            case "needsSelection":
                return this.show({ kind: "selectControlFirst" });
            case "unsupported":
                return this.show({ kind: "unsupported" });
            case "full":
                return this.show({ kind: "full", limit: outcome.limit });
            case "modifiersOnlyAlone":
                return this.show({ kind: "modifiersOnlyAlone" });
            case "needsColorKey":
                return this.show({ kind: "needsColorKey", keys: outcome.keys });
        }
    }
}
