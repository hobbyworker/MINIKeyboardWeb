// What the windows show and what the user does in them, in the presentation's own types: the views take these and hand
// them back, and never see the domain's.
//
// The view models live on the main thread. Their work that waits returns a promise. They say when they changed through
// `subscribe`; the interface reads what it draws again.

export { UDEV_RULES_PATH, udevInstallCommands, udevRules } from "./access";
export { ActionCaption, ControlRef, LedColor, MediaChoice, ModifierKey, MouseChoice, Rgb } from "./choices";
export type { ControlTitle, KnobAction } from "./choices";
export { DeviceLogModel, LogLine, type LogDirection, type LogEvent } from "./device-log";
export { LayoutRect } from "./drawing/rect";
export { EditorModel, type EditorDependencies } from "./editor";
export type { EditorEvent } from "./events";
export {
    BoardCap,
    KeyGroupKind,
    SimulatorChoice,
    SimulatorGroup,
    type BindingState,
    type BoardFace,
    type ChannelPath,
    type ConnectionStatus,
    type ControlDrawing,
    type ControlFace,
    type DelayPage,
    type DelayRange,
    type Firmware,
    type InfoChannel,
    type InfoCommands,
    type InfoInterface,
    type InterfaceRole,
    type KeyArrangement,
    type KeyColorSelection,
    type KeyGroup,
    type KeyboardChoice,
    type KeyboardDrawing,
    type KeyboardInfo,
    type LayoutChoice,
    type LayoutSheetMode,
    type LayoutSheetState,
    type LightingPage,
    type PressDelay,
    type SelectionState,
    type ShapeDrawing,
    type ShapeItem,
    type SimulatorKind,
} from "./screen-state";
export {
    ActionText,
    EditorTab,
    Notice,
    modifierNames,
    setModifierStyle,
    type Activity,
    type ModifierStyle,
    type PendingSwitch,
} from "./state";
export { KeyUsage } from "./tables/key-usages";
