import { KeyAction, KeyMacro, KeyStroke } from "../actions";
import type { KeyboardCapabilities } from "../capabilities";
import type { KeyboardConfiguration } from "../configuration";
import type { ControlId, KeyboardLayout } from "../layout";
import { KeyColor, type LayerLighting, type LightColor } from "../lighting";
import { InclusiveRange } from "../range";

/** What came of an edit of the app's copy of the configuration. */
export type EditOutcome =
    | { readonly kind: "applied" }
    /** No key or knob is selected. */
    | { readonly kind: "needsSelection" }
    /** The keyboard has nothing for this, so nothing changed. */
    | { readonly kind: "unsupported" }
    /** The key holds no more presses; `limit` is how many it holds. */
    | { readonly kind: "full"; readonly limit: number }
    /** Modifiers alone make a key a modifier key, so they can't follow or precede other presses. */
    | { readonly kind: "modifiersOnlyAlone" }
    /** Colours are kept for the first keys only; `keys` is how many. */
    | { readonly kind: "needsColorKey"; readonly keys: number };

export const EditOutcome = {
    APPLIED: { kind: "applied" } as EditOutcome,
    NEEDS_SELECTION: { kind: "needsSelection" } as EditOutcome,
    UNSUPPORTED: { kind: "unsupported" } as EditOutcome,
    MODIFIERS_ONLY_ALONE: { kind: "modifiersOnlyAlone" } as EditOutcome,

    full(limit: number): EditOutcome {
        return { kind: "full", limit };
    },

    needsColorKey(keys: number): EditOutcome {
        return { kind: "needsColorKey", keys };
    },
};

/** Where an edit applies: the selected control on the shown layer of a keyboard with these capabilities. */
export interface EditTarget {
    readonly capabilities: KeyboardCapabilities;
    readonly layer: number;
    readonly control: ControlId | null;
}

/**
 * Adds a press to the selected key. A key that did something else starts over with it; a key that holds modifiers
 * alone takes them into the press.
 */
export class AppendStrokeUseCase {
    execute(stroke: KeyStroke, configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        if (!KeyStroke.isModifiersOnly(stroke) && !target.capabilities.takes(stroke.key)) {
            return EditOutcome.UNSUPPORTED;
        }
        const current = configuration.action(control, target.layer);
        const macro = current?.kind === "keys" ? current.macro : KeyMacro.EMPTY;
        let strokes = [...macro.strokes];
        let next = stroke;
        const only = strokes.length === 1 ? strokes[0] : undefined;
        if (only !== undefined && KeyStroke.isModifiersOnly(only)) {
            next = { ...stroke, modifiers: stroke.modifiers | only.modifiers, delay: only.delay };
            strokes = [];
        }
        strokes.push(next);
        const appended = KeyMacro.of(strokes, macro.delay);
        if (!KeyMacro.isWellFormed(appended)) return EditOutcome.MODIFIERS_ONLY_ALONE;
        if (!target.capabilities.fits(appended)) return EditOutcome.full(target.capabilities.pressLimit());
        configuration.set(KeyAction.keys(appended), control, target.layer);
        return EditOutcome.APPLIED;
    }
}

/** Takes the last press off the selected key; the key is cleared when none is left. */
export class RemoveLastStrokeUseCase {
    execute(configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        const current = configuration.action(control, target.layer);
        if (current?.kind !== "keys" || current.macro.strokes.length === 0) return EditOutcome.UNSUPPORTED;
        const macro = KeyMacro.of(current.macro.strokes.slice(0, -1), current.macro.delay);
        configuration.set(keysOrNothing(macro), control, target.layer);
        return EditOutcome.APPLIED;
    }
}

/** Replaces the selected key's action with a media key or a mouse action. */
export class SetActionUseCase {
    execute(action: KeyAction, configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        switch (action.kind) {
            case "media":
                if (!target.capabilities.mediaKeys().includes(action.key)) return EditOutcome.UNSUPPORTED;
                break;
            case "keys":
                if (!target.capabilities.takesKeysOf(action.macro)) return EditOutcome.UNSUPPORTED;
                if (!KeyMacro.isWellFormed(action.macro)) return EditOutcome.MODIFIERS_ONLY_ALONE;
                if (!target.capabilities.fits(action.macro)) return EditOutcome.full(target.capabilities.pressLimit());
                break;
            case "unassigned":
            case "mouse":
                break;
        }
        configuration.set(action, control, target.layer);
        return EditOutcome.APPLIED;
    }
}

/** Sets the wait before one press of the selected key (standard format). */
export class SetPressDelayUseCase {
    execute(
        press: number,
        milliseconds: number,
        configuration: KeyboardConfiguration,
        target: EditTarget,
    ): EditOutcome {
        const delays = target.capabilities.delays();
        if (delays.kind !== "perPress") return EditOutcome.UNSUPPORTED;
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        const current = configuration.action(control, target.layer);
        if (current?.kind !== "keys") return EditOutcome.UNSUPPORTED;
        const stroke = current.macro.strokes[press];
        if (stroke === undefined) return EditOutcome.UNSUPPORTED;
        const strokes = [...current.macro.strokes];
        strokes[press] = KeyStroke.withDelay(stroke, InclusiveRange.clamp(delays.range, milliseconds));
        configuration.set(KeyAction.keys(KeyMacro.of(strokes, current.macro.delay)), control, target.layer);
        return EditOutcome.APPLIED;
    }
}

/**
 * Sets the one wait the selected key keeps (legacy format). Its presses stay; a key that held a media key or a mouse
 * action has none to keep.
 */
export class SetKeyDelayUseCase {
    execute(milliseconds: number, configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const delays = target.capabilities.delays();
        if (delays.kind !== "perKey") return EditOutcome.UNSUPPORTED;
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        const current = configuration.action(control, target.layer);
        if (current?.kind === "media" || current?.kind === "mouse") return EditOutcome.UNSUPPORTED;
        const strokes = current?.kind === "keys" ? current.macro.strokes : [];
        const macro = KeyMacro.of(strokes, InclusiveRange.clamp(delays.range, milliseconds));
        configuration.set(keysOrNothing(macro), control, target.layer);
        return EditOutcome.APPLIED;
    }
}

/** Clears the selected key, or every control of the layout on the shown layer. */
export class ClearUseCase {
    execute(configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        configuration.set(KeyAction.UNASSIGNED, control, target.layer);
        return EditOutcome.APPLIED;
    }

    executeAll(layout: KeyboardLayout, configuration: KeyboardConfiguration, layer: number): EditOutcome {
        for (const control of layout.controls) configuration.set(KeyAction.UNASSIGNED, control, layer);
        return EditOutcome.APPLIED;
    }
}

/** Sets the shown layer's lights. */
export class SetLightingUseCase {
    /** The mode of a layer — keeping its colours. */
    setMode(mode: number, configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const current = configuration.lighting(target.layer);
        const support = target.capabilities.lighting();
        if (!InclusiveRange.contains(support.modes, mode)) return EditOutcome.UNSUPPORTED;
        let lighting: LayerLighting;
        switch (support.kind) {
            case "colorAndMode": {
                const color = current?.kind === "colorMode" ? current.color : "cyan";
                lighting = { kind: "colorMode", color, mode };
                break;
            }
            case "perKeyColor": {
                const colors = current?.kind === "perKey" ? current.colors : KeyColor.DEFAULT_KEY_COLORS;
                lighting = { kind: "perKey", mode, colors: [...colors] };
                break;
            }
        }
        configuration.setLighting(lighting, target.layer);
        return EditOutcome.APPLIED;
    }

    /** The colour of a layer that takes one (legacy format and unidentified keyboards). */
    setColor(color: LightColor, configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const support = target.capabilities.lighting();
        if (support.kind !== "colorAndMode") return EditOutcome.UNSUPPORTED;
        const current = configuration.lighting(target.layer);
        const mode = current?.kind === "colorMode" ? current.mode : support.modes.start;
        configuration.setLighting({ kind: "colorMode", color, mode }, target.layer);
        return EditOutcome.APPLIED;
    }

    /** The colour of the selected key (standard format), which must be one of the first keys. */
    setKeyColor(keyColor: KeyColor, configuration: KeyboardConfiguration, target: EditTarget): EditOutcome {
        const support = target.capabilities.lighting();
        if (support.kind !== "perKeyColor") return EditOutcome.UNSUPPORTED;
        const control = target.control;
        if (control === null) return EditOutcome.NEEDS_SELECTION;
        const index = SetLightingUseCase.colorIndex(control, support.keys);
        if (index === null) return EditOutcome.needsColorKey(support.keys);
        const current = configuration.lighting(target.layer);
        const kept = current?.kind === "perKey" ? current : null;
        const mode = kept?.mode ?? support.modes.start;
        const colors = [...(kept?.colors ?? KeyColor.DEFAULT_KEY_COLORS)];
        colors[index] = keyColor;
        configuration.setLighting({ kind: "perKey", mode, colors }, target.layer);
        return EditOutcome.APPLIED;
    }

    /**
     * Where a key's colour is kept: keys 1–16 have colours 1–16. (The app colours records 1–16, and a key is stored in
     * the record of its number.)
     */
    static colorIndex(control: ControlId, keys: number): number | null {
        return control.kind === "key" && control.number >= 1 && control.number <= keys ? control.number - 1 : null;
    }
}

/** The key's presses and wait, or nothing when it has neither. */
function keysOrNothing(macro: KeyMacro): KeyAction {
    return macro.strokes.length === 0 && macro.delay === 0 ? KeyAction.UNASSIGNED : KeyAction.keys(macro);
}
