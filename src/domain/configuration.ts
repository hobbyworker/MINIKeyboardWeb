import type { KeyAction } from "./actions";
import { structurallyEqual } from "./equality";
import { controlKey, type ControlId } from "./layout";
import type { LayerLighting } from "./lighting";
import type { LayerActions } from "./ports";

/** Some of a configuration's changes: controls by layer, and the layers whose lights changed. */
export interface ChangeSet {
    readonly controls: ReadonlyMap<number, readonly ControlId[]>;
    readonly lightingLayers: readonly number[];
}

export const ChangeSet = {
    NONE: { controls: new Map(), lightingLayers: [] } as ChangeSet,

    isEmpty(changes: ChangeSet): boolean {
        return changes.lightingLayers.length === 0 && [...changes.controls.values()].every((list) => list.length === 0);
    },
};

/** One layer of what the app holds for a keyboard. */
export interface Layer {
    readonly lightingChanged: boolean;
}

interface LayerState extends Layer {
    /** By {@link controlKey}. */
    readonly actions: Map<string, KeyAction>;
    lighting: LayerLighting | null;
    /** By {@link controlKey}. */
    readonly changedControls: Set<string>;
    lightingChanged: boolean;
}

const emptyLayer = (): LayerState => ({
    actions: new Map(),
    lighting: null,
    changedControls: new Set(),
    lightingChanged: false,
});

/**
 * What the app holds for a keyboard: each layer's actions and lights, and what changed since they were read or saved.
 * What the app doesn't know — a keyboard that can't be read, a key nobody has set — is missing rather than guessed,
 * and is never written.
 */
export class KeyboardConfiguration {
    private layerStates: LayerState[];

    constructor(layerCount: number) {
        this.layerStates = Array.from({ length: Math.max(1, layerCount) }, emptyLayer);
    }

    layerCount(): number {
        return this.layerStates.length;
    }

    layers(): readonly Layer[] {
        return this.layerStates;
    }

    /** The action of `control`, or `null` when the app doesn't know it. */
    action(control: ControlId, layer: number): KeyAction | null {
        return this.layer(layer).actions.get(controlKey(control)) ?? null;
    }

    lighting(layer: number): LayerLighting | null {
        return this.layer(layer).lighting;
    }

    isChanged(control: ControlId, layer: number): boolean {
        return this.layer(layer).changedControls.has(controlKey(control));
    }

    hasUnsavedChanges(): boolean {
        return this.layerStates.some((layer) => layer.changedControls.size > 0 || layer.lightingChanged);
    }

    /** Sets an action to be written on the next save. */
    set(action: KeyAction, control: ControlId, layer: number): void {
        const state = this.layer(layer);
        const key = controlKey(control);
        state.actions.set(key, action);
        state.changedControls.add(key);
    }

    /** Sets a layer's lights to be written on the next save. */
    setLighting(lighting: LayerLighting, layer: number): void {
        const state = this.layer(layer);
        state.lighting = lighting;
        state.lightingChanged = true;
    }

    /**
     * What the keyboard said it holds. It replaces the app's values, saved or not, as the vendor app does when it
     * reads.
     */
    applyRead(actions: LayerActions, layer: number): void {
        const state = this.layer(layer);
        for (const [key, action] of actions) {
            state.changedControls.delete(key);
            state.actions.set(key, action);
        }
    }

    applyReadLighting(lighting: LayerLighting, layer: number): void {
        const state = this.layer(layer);
        state.lighting = lighting;
        state.lightingChanged = false;
    }

    /** Everything was written — all but `except`, which stays changed as it is. */
    markSaved(except: ChangeSet = ChangeSet.NONE): void {
        this.layerStates.forEach((layer, index) => {
            const kept = new Set((except.controls.get(index) ?? []).map(controlKey));
            for (const key of layer.changedControls) if (!kept.has(key)) layer.changedControls.delete(key);
            layer.lightingChanged &&= except.lightingLayers.includes(index);
        });
    }

    clone(): KeyboardConfiguration {
        const copy = new KeyboardConfiguration(this.layerStates.length);
        copy.layerStates = this.layerStates.map((layer) => ({
            actions: new Map(layer.actions),
            lighting: layer.lighting,
            changedControls: new Set(layer.changedControls),
            lightingChanged: layer.lightingChanged,
        }));
        return copy;
    }

    equals(other: KeyboardConfiguration): boolean {
        return (
            this.layerStates.length === other.layerStates.length &&
            this.layerStates.every((layer, index) => {
                const theirs = other.layerStates[index];
                return theirs !== undefined && sameLayer(layer, theirs);
            })
        );
    }

    private layer(layer: number): LayerState {
        const state = this.layerStates[layer];
        if (state === undefined) {
            throw new RangeError(`layer ${layer} of a configuration with ${this.layerStates.length}`);
        }
        return state;
    }
}

function sameLayer(a: LayerState, b: LayerState): boolean {
    if (a.lightingChanged !== b.lightingChanged || !structurallyEqual(a.lighting, b.lighting)) return false;
    if (a.changedControls.size !== b.changedControls.size || a.actions.size !== b.actions.size) return false;
    for (const key of a.changedControls) if (!b.changedControls.has(key)) return false;
    for (const [key, action] of a.actions) {
        const theirs = b.actions.get(key);
        if (theirs === undefined || !structurallyEqual(action, theirs)) return false;
    }
    return true;
}
