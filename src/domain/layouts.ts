// The layouts of the cross-platform app and the controls each has — keys, and knob actions.

import type { ControlId, KeyboardLayout, KnobPart } from "./layout";

/** A knob's usual three actions. */
const TURNS: readonly KnobPart[] = ["rotateLeft", "press", "rotateRight"];

/** Keys 1…`keys`, then each knob's actions in the order given. */
function layout(id: string, keys: number, knobs: readonly (readonly [number, readonly KnobPart[]])[]): KeyboardLayout {
    const controls: ControlId[] = [];
    for (let number = 1; number <= keys; number++) controls.push({ kind: "key", number });
    for (const [number, parts] of knobs) {
        for (const part of parts) controls.push({ kind: "knob", number, part });
    }
    return { id, controls };
}

export const LAYOUTS: readonly KeyboardLayout[] = [
    // One knob with five actions: it also turns while pressed. The app draws those two under the turns, with no press
    // of their own — a second knob would have one, as in 0add2.
    layout("0add1", 0, [[1, ["rotateLeft", "press", "rotateRight", "pressRotateLeft", "pressRotateRight"]]]),
    layout("0add2", 0, [
        [1, TURNS],
        [2, TURNS],
    ]),
    layout("0add3", 0, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    layout("1add0", 1, []),
    layout("2add0", 2, []),
    layout("3add0", 3, []),
    layout("3add1", 3, [[1, TURNS]]),
    layout("4Key", 4, []),
    layout("4add1", 4, [[1, TURNS]]),
    layout("4add2", 4, [[1, TURNS]]),
    layout("4add3", 4, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    layout("5Key_Mute", 5, []),
    layout("6Key", 6, []),
    layout("6add1", 6, [[1, TURNS]]),
    layout("6add2", 6, [
        [1, TURNS],
        [2, TURNS],
    ]),
    layout("9add2", 9, [
        [1, TURNS],
        [2, TURNS],
    ]),
    layout("9add3", 9, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    layout("11add3", 11, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    layout("12add0", 12, []),
    layout("12add2", 12, [
        [1, TURNS],
        [2, TURNS],
    ]),
    layout("12add3", 12, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    // The fourth knob comes first: the app keeps it in records 13–15, before the other three.
    layout("12add4", 12, [
        [4, TURNS],
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    layout("15add3", 15, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    layout("16add0", 16, []),
    layout("16add3", 16, [
        [1, TURNS],
        [2, TURNS],
        [3, TURNS],
    ]),
    // The app lists this knob's turns the other way round.
    layout("21add1", 21, [[1, ["rotateRight", "press", "rotateLeft"]]]),
];
