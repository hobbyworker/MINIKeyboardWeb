// What each part of the window draws, in the presentation's types.

import {
    KeyboardLayout,
    MediaKey,
    Modifiers,
    ResolvedLayout,
    Rotation,
    formatUsbIdentity,
    sameControl,
    sameUsbIdentity,
    type InclusiveRange,
} from "$domain";
import {
    ControlRef,
    LedColor,
    ModifierKey,
    captionOf,
    controlRefOf,
    knobActionOf,
    ledColorOf,
    mediaChoiceOf,
    modifiersOf,
    mouseChoiceOf,
    rgbOf,
    type ActionCaption,
    type MediaChoice,
} from "./choices";
import { LayoutGeometry } from "./drawing/geometry";
import type { EditorState } from "./editor-state";
import {
    KeyGroupKind,
    keyboardInfoOf,
    keysOf,
    shapeDrawingOf,
    type BindingState,
    type BoardCap,
    type ConnectionStatus,
    type ControlDrawing,
    type DelayPage,
    type KeyArrangement,
    type KeyboardChoice,
    type KeyboardDrawing,
    type KeyboardInfo,
    type KeyGroup,
    type LayoutChoice,
    type LayoutSheetMode,
    type LayoutSheetState,
    type LightingPage,
    type SelectionState,
    type ShapeDrawing,
} from "./screen-state";
import { ActionText } from "./state";
import { places } from "./tables/full-keyboard";
import { KeyUsage } from "./tables/key-usages";

// Header

export function status(state: EditorState): ConnectionStatus {
    const connection = state.connection;
    switch (connection.kind) {
        case "searching":
            return { kind: "searching" };
        case "needsPermission":
            return { kind: "needsPermission" };
        case "openFailed":
            return { kind: "openFailed", code: connection.code };
        case "unsupported":
            return { kind: "unsupported" };
        case "connected": {
            const identity = state.identification?.identity ?? null;
            return {
                kind: "connected",
                usb: formatUsbIdentity(connection.keyboard.usb),
                keys: identity?.keyCount ?? null,
                knobs: identity?.knobCount ?? null,
                isIdentified: state.identification !== null,
                isSimulated: state.source.kind === "simulated",
            };
        }
    }
}

export function keyboardInfo(state: EditorState): KeyboardInfo | null {
    const keyboard = state.keyboard();
    return keyboard === null ? null : keyboardInfoOf(keyboard, state.identification);
}

/** The keyboards plugged in, to choose which is open — only when there is more than one. */
export function keyboardChoices(state: EditorState): KeyboardChoice[] {
    const attached = state.attached;
    if (attached.keyboards.length < 2) return [];
    const seen = new Map<string, number>();
    return attached.keyboards.map((keyboard) => {
        const usb = formatUsbIdentity(keyboard.usb);
        const sameId = attached.keyboards.filter((other) => sameUsbIdentity(other.usb, keyboard.usb)).length;
        const number = (seen.get(usb) ?? 0) + 1;
        seen.set(usb, number);
        return {
            id: keyboard.id,
            title: sameId > 1 ? `${usb} (${number})` : usb,
            isSelected: attached.selected === keyboard.id,
        };
    });
}

// The keyboard

export function drawing(state: EditorState): KeyboardDrawing | null {
    const resolved = state.resolvedLayout;
    if (resolved === null) return null;
    const geometry = LayoutGeometry.of(resolved.layout)?.rotated(resolved.rotation) ?? null;
    if (geometry === null) return null;
    const controls = resolved.layout.controls.flatMap((control): ControlDrawing[] => {
        const rect = geometry.rect(control);
        if (rect === null) return [];
        const keyColor = state.tab === "lighting" ? state.keyColor(control) : null;
        return [
            {
                control: controlRefOf(control),
                face:
                    control.kind === "key"
                        ? { kind: "key", number: control.number }
                        : { kind: "knob", action: knobActionOf(control.part) },
                rect,
                caption: captionOf(state.action(control)),
                isSelected: state.selection !== null && sameControl(state.selection, control),
                isChanged: state.configuration.isChanged(control, state.layer),
                ledColor: keyColor === null ? null : rgbOf(keyColor),
            },
        ];
    });
    return { frame: geometry.frame, bounds: geometry.bounds(), controls };
}

// Selection

export function selectedControl(state: EditorState): ControlRef | null {
    return state.selection === null ? null : controlRefOf(state.selection);
}

export function selectionState(state: EditorState): SelectionState | null {
    const selection = state.selection;
    if (selection === null) return null;
    const action = state.action(selection);
    const capabilities = state.capabilities();
    let binding: BindingState;
    if (action === null) {
        binding = { kind: "unknown" };
    } else {
        switch (action.kind) {
            case "unassigned":
                binding = { kind: "nothing" };
                break;
            case "keys":
                binding = {
                    kind: "presses",
                    strokes: action.macro.strokes.map((stroke) => ActionText.stroke(stroke)),
                    keyDelay: action.macro.delay,
                    used: capabilities?.presses(action.macro) ?? action.macro.strokes.length,
                    limit: capabilities?.pressLimit() ?? 0,
                };
                break;
            case "media": {
                const choice = mediaChoiceOf(action.key);
                binding = choice === null ? { kind: "otherMedia", usage: action.key } : { kind: "media", choice };
                break;
            }
            case "mouse":
                binding = { kind: "mouse", choice: mouseChoiceOf(action.action) };
                break;
        }
    }
    return {
        title: ControlRef.title(controlRefOf(selection)),
        layerNumber: state.layerCount() > 1 ? state.layer + 1 : null,
        binding,
    };
}

/** What the selected key does, for marking the page's matching button. */
export function selectedCaption(state: EditorState): ActionCaption | null {
    return state.selection === null ? null : captionOf(state.action(state.selection));
}

// Keys page

export function heldModifiers(state: EditorState): ModifierKey[] {
    return ModifierKey.ALL.filter((modifier) => Modifiers.contains(state.held, modifiersOf(modifier)));
}

/** "Ctrl+Super", or `null` when none is held. */
export function heldModifierText(state: EditorState): string | null {
    return state.held === Modifiers.NONE ? null : ActionText.modifiers(state.held);
}

export function pressLimit(state: EditorState): number {
    return state.capabilities()?.pressLimit() ?? 0;
}

/** Whether each modifier takes a place of its own in a key, as on the standard format. */
export function modifiersCountAsPresses(state: EditorState): boolean {
    return state.capabilities()?.modifiersTakePlaces() ?? false;
}

/** How the keyboard's vendor tool lays out its keys — the cross-platform app's full-size keyboard. */
export function vendorKeyArrangement(): KeyArrangement {
    return "qwerty";
}

/** Every key, before a keyboard is identified. */
function takes(state: EditorState, key: KeyUsage): boolean {
    return state.capabilities()?.takes(key.usage) ?? true;
}

/** The full-size keyboard. A key the keyboard isn't given keeps its place but is off. */
export function keyBoard(state: EditorState): BoardCap[] {
    return places().map((place) => ({
        face: place.face,
        row: place.row,
        column: place.column,
        width: place.width,
        isEnabled: place.face.kind === "key" ? takes(state, place.face.key) : true,
    }));
}

/** The keys a full-size keyboard doesn't have — F13–F24 and the two non-US keys — that the keyboard is given. */
export function moreKeys(state: EditorState): KeyUsage[] {
    return [...KeyUsage.EXTRA_FUNCTION_KEYS, ...KeyUsage.INTERNATIONAL].filter((key) => takes(state, key));
}

/** The alphabetical arrangement: groups of the keys the keyboard is given, leaving out empty ones. */
export function keyGroups(state: EditorState): KeyGroup[] {
    return KeyGroupKind.ALL.flatMap((kind) => {
        const keys = keysOf(kind).filter((key) => takes(state, key));
        return keys.length === 0 ? [] : [{ kind, keys }];
    });
}

/** Digits and symbols with their shifted characters, sent as Shift and the key. */
export function shiftSymbols(state: EditorState): KeyUsage[] {
    return [...KeyUsage.DIGITS, ...KeyUsage.SYMBOLS].filter((key) => key.shifted !== null && takes(state, key));
}

// Media page

export function mediaChoices(state: EditorState): MediaChoice[] {
    const keys = state.capabilities()?.mediaKeys() ?? MediaKey.ALL;
    return keys.flatMap((key) => mediaChoiceOf(key) ?? []);
}

// LED page

function values(range: InclusiveRange): number[] {
    return Array.from({ length: Math.max(0, range.end - range.start + 1) }, (_, index) => range.start + index);
}

export function lightingPage(state: EditorState): LightingPage | null {
    const capabilities = state.capabilities();
    if (capabilities === null) return null;
    const current = state.lighting();
    const support = capabilities.lighting();
    switch (support.kind) {
        case "colorAndMode": {
            const colorMode = current?.kind === "colorMode" ? current : null;
            return {
                kind: "colorAndMode",
                colors: [...LedColor.ALL],
                modes: values(support.modes),
                activeColor: colorMode === null ? null : ledColorOf(colorMode.color),
                activeMode: colorMode?.mode ?? null,
            };
        }
        case "perKeyColor": {
            const selection = state.selection;
            const color = selection === null ? null : state.keyColor(selection);
            return {
                kind: "perKeyColor",
                modes: values(support.modes),
                activeMode: current?.mode ?? null,
                keys: support.keys,
                selected:
                    selection === null || color === null
                        ? null
                        : { title: ControlRef.title(controlRefOf(selection)), color: rgbOf(color) },
            };
        }
    }
}

// Delay page

export function delayPage(state: EditorState): DelayPage {
    const delays = state.capabilities()?.delays();
    if (delays === undefined || delays.kind === "unavailable") return { kind: "unavailable" };
    const range = { start: delays.range.start, end: delays.range.end };
    const action = state.selectedAction();
    if (delays.kind === "perPress") {
        const presses =
            action?.kind === "keys"
                ? action.macro.strokes.map((stroke, index) => ({
                      index,
                      text: ActionText.stroke(stroke),
                      delay: stroke.delay,
                  }))
                : [];
        return { kind: "perPress", range, presses };
    }
    const value = state.selection === null ? null : action?.kind === "keys" ? action.macro.delay : 0;
    return { kind: "perKey", range, value };
}

// Layout sheet

export function layoutSheet(state: EditorState): LayoutSheetState | null {
    const resolved = state.resolvedLayout;
    const keyboard = state.keyboard();
    if (resolved === null || keyboard === null) return null;
    let mode: LayoutSheetMode;
    if (resolved.source === "identified") {
        mode = { kind: "fixed" };
    } else {
        const choices = resolved.choices.flatMap((layout): LayoutChoice[] => {
            const geometry = LayoutGeometry.of(layout);
            if (geometry === null) return [];
            return [
                {
                    id: layout.id,
                    keys: KeyboardLayout.keyCount(layout),
                    knobs: KeyboardLayout.knobCount(layout),
                    drawing: shapeDrawingOf(geometry),
                },
            ];
        });
        mode = { kind: "catalog", choices, selectedId: resolved.layout.id };
    }
    const identity = state.identification?.identity ?? null;
    return {
        usb: formatUsbIdentity(keyboard.usb),
        reportedKeys: identity?.keyCount ?? null,
        reportedKnobs: identity?.knobCount ?? null,
        mode,
        quarterTurns: Rotation.quarterTurns(resolved.rotation),
        isRequired: ResolvedLayout.needsChoice(resolved),
    };
}

/** One of the app's layouts by its name, or with `null` the keyboard's own, drawn small and turned. */
export function previewDrawing(state: EditorState, layoutId: string | null, quarterTurns: number): ShapeDrawing | null {
    const layout = (layoutId === null ? null : KeyboardLayout.named(layoutId)) ?? state.resolvedLayout?.layout ?? null;
    if (layout === null) return null;
    const geometry = LayoutGeometry.of(layout);
    return geometry === null ? null : shapeDrawingOf(geometry.rotated(Rotation.fromQuarterTurns(quarterTurns)));
}
