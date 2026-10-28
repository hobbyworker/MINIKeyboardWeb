// Where each control is stored: the records of the cross-platform app's layouts on a 884x keyboard.

import { ControlId, KeyboardLayout, sameControl, type KnobPart } from "$domain";

/**
 * The record a 884x keyboard keeps `control` of `layout` in: a key in the record of its number, a knob action where the
 * cross-platform app puts it. In 0add1, records 19 and 21 turn its one knob while it is pressed — a second knob would
 * have its press in record 20, as in 0add2.
 */
export function record(control: ControlId, layout: KeyboardLayout): number | null {
    if (!KeyboardLayout.has(layout, control)) return null;
    if (control.kind === "key") return control.number;
    const knob = KNOBS.get(layout.id)?.find(([candidate]) => sameControl(candidate, control));
    return knob?.[1] ?? null;
}

/** The control stored in `recordId`, or `null` when the layout has none there. */
export function controlInRecord(recordId: number, layout: KeyboardLayout): ControlId | null {
    return layout.controls.find((control) => record(control, layout) === recordId) ?? null;
}

type KnobRecord = readonly [ControlId, number];

const at = (knob: number, part: KnobPart, record: number): KnobRecord => [ControlId.knob(knob, part), record];

/** A knob's turn left, press and turn right in three records from `first`. */
const turns = (knob: number, first: number): KnobRecord[] => [
    at(knob, "rotateLeft", first),
    at(knob, "press", first + 1),
    at(knob, "rotateRight", first + 2),
];

/** Knobs 1–3 from record 16. */
const three = (): KnobRecord[] => [...turns(1, 16), ...turns(2, 19), ...turns(3, 22)];

const KNOBS: ReadonlyMap<string, readonly KnobRecord[]> = new Map([
    ["0add1", [...turns(1, 16), at(1, "pressRotateLeft", 19), at(1, "pressRotateRight", 21)]],
    ["0add2", [...turns(1, 16), ...turns(2, 19)]],
    ["0add3", three()],
    ["3add1", turns(1, 16)],
    ["4add1", turns(1, 16)],
    ["4add2", turns(1, 16)],
    ["4add3", three()],
    ["6add1", turns(1, 16)],
    ["6add2", [...turns(1, 16), ...turns(2, 19)]],
    ["9add2", [...turns(1, 16), ...turns(2, 19)]],
    ["9add3", three()],
    ["11add3", three()],
    ["12add2", [...turns(1, 16), ...turns(2, 19)]],
    ["12add3", three()],
    ["12add4", [...turns(4, 13), ...three()]],
    ["15add3", three()],
    ["16add3", [...turns(1, 17), ...turns(2, 20), ...turns(3, 23)]],
    ["21add1", [at(1, "rotateRight", 22), at(1, "press", 23), at(1, "rotateLeft", 24)]],
]);
