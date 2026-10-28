// The payloads that write a configuration's changes, in the order the keyboard's vendor tool writes them.

import {
    compareControls,
    KeyboardDeviceError,
    type ControlId,
    type KeyAction,
    type KeyboardConfiguration,
    type KeyboardLayout,
    type RecordFormat,
} from "$domain";
import * as k884x from "./k884x";
import * as numbers from "./numbers";
import * as records from "./records";

export interface Step {
    readonly payload: Uint8Array;
    /** Milliseconds to wait after it. */
    readonly pauseAfter: number;
}

export interface WritePlan {
    readonly steps: readonly Step[];
}

export const WritePlan = {
    /** Throws a `KeyboardDeviceError` (unsupported) for an action the format can't hold or a control with no record. */
    of(configuration: KeyboardConfiguration, format: RecordFormat, layout: KeyboardLayout): WritePlan {
        const steps: Step[] = [];
        const append = (...payloads: Uint8Array[]) => {
            for (const payload of payloads) steps.push({ payload, pauseAfter: 0 });
        };
        const commit = () => steps.push({ payload: k884x.COMMIT.slice(), pauseAfter: k884x.COMMIT_PAUSE });
        const layers = configuration.layers();
        switch (format) {
            case "standard": {
                // Every changed record, then — when a light changed — every layer's lights, then one commit if a
                // record was written (`Widget::HID_write`).
                let wroteRecords = false;
                for (let layer = 0; layer < layers.length; layer++) {
                    for (const [control, action] of changes(configuration, layer, layout)) {
                        append(records.standard(action, record(control, layout), layer));
                        wroteRecords = true;
                    }
                }
                if (layers.some((layer) => layer.lightingChanged)) {
                    for (let layer = 0; layer < layers.length; layer++) {
                        const lighting = configuration.lighting(layer);
                        if (lighting?.kind === "perKey") append(k884x.lighting(layer, lighting.mode, lighting.colors));
                    }
                }
                if (wroteRecords) commit();
                break;
            }
            case "legacy":
                // Each layer's changed records, its lights in record 0, and a commit.
                for (let layer = 0; layer < layers.length; layer++) {
                    let wroteRecords = false;
                    for (const [control, action] of changes(configuration, layer, layout)) {
                        append(records.encode(action, record(control, layout), layer, "legacy"));
                        wroteRecords = true;
                    }
                    const lighting = configuration.lighting(layer);
                    if (layers[layer]?.lightingChanged && lighting?.kind === "colorMode") {
                        append(records.legacyLighting(lighting.color, lighting.mode, layer, records.LEGACY_LENGTH));
                        wroteRecords = true;
                    }
                    if (wroteRecords) commit();
                }
                break;
            case "unidentified":
                // One record at a time, each saved on its own.
                for (let layer = 0; layer < layers.length; layer++) {
                    for (const [control, action] of changes(configuration, layer, layout)) {
                        append(records.unidentified(action, record(control, layout), layer));
                        append(...k884x.unidentifiedSave());
                    }
                    const lighting = configuration.lighting(layer);
                    if (layers[layer]?.lightingChanged && lighting?.kind === "colorMode") {
                        append(...k884x.unidentifiedLighting(lighting.color, lighting.mode, layer));
                    }
                }
                break;
        }
        return { steps };
    },
};

/** Changed controls of one layer that the layout has, in control order. */
function changes(
    configuration: KeyboardConfiguration,
    layer: number,
    layout: KeyboardLayout,
): (readonly [ControlId, KeyAction])[] {
    return layout.controls
        .filter((control) => configuration.isChanged(control, layer))
        .sort(compareControls)
        .flatMap((control) => {
            const action = configuration.action(control, layer);
            return action === null ? [] : [[control, action] as const];
        });
}

/** The record a 884x keyboard keeps `control` in. */
function record(control: ControlId, layout: KeyboardLayout): number {
    const id = numbers.record(control, layout);
    if (id === null) throw KeyboardDeviceError.unsupported();
    return id;
}
