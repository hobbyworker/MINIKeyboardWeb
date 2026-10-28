// The configurator's rules: the keyboards it knows, the actions their keys and knobs take, what each keyboard can
// hold, and the use cases that edit, read and save them. Plain TypeScript only — the ports are what the outer layers
// implement.

export { KeyAction, KeyMacro, KeyStroke, MediaKey, Modifiers, MouseAction, sameAction } from "./actions";
export { KeyboardCapabilities, type DelaySupport, type ReadSupport } from "./capabilities";
export { ChangeSet, KeyboardConfiguration, type Layer } from "./configuration";
export {
    AttachedKeyboards,
    ConnectionState,
    KeyboardDeviceError,
    type AttachedKeyboard,
    type Channel,
    type ConnectedKeyboard,
    type DeviceDetails,
    type DeviceInterface,
    type KeyboardDeviceErrorReason,
    type UsagePair,
} from "./connection";
export {
    CONFIGURATION_INTERFACE,
    KeyboardIdentity,
    SUPPORTED_KEYBOARDS,
    UsbIdentity,
    formatUsbIdentity,
    isSupportedKeyboard,
    sameUsbIdentity,
    type KeyboardIdentification,
    type RecordFormat,
} from "./keyboards";
export {
    ControlId,
    KeyboardLayout,
    KnobPart,
    Rotation,
    compareControls,
    controlKey,
    sameControl,
    sameLayout,
} from "./layout";
export { KeyColor, LayerLighting, LightColor, LightingSupport, sameLighting } from "./lighting";
export {
    once,
    type DeviceLogRepository,
    type KeyboardConnectionRepository,
    type KeyboardDeviceRepository,
    type KeyboardSourceRepository,
    type LayerActions,
    type LayerRead,
    type LayoutProfileRepository,
    type Updates,
} from "./ports";
export { InclusiveRange } from "./range";
export {
    KeyboardSource,
    ResolvedLayout,
    SimulatedModel,
    type DeviceLogEntry,
    type DeviceLogEvent,
    type LayoutProfile,
    type LogContent,
    type SimulatedKind,
    type Source,
} from "./support";
export {
    DeviceLogUseCase,
    IdentifyKeyboardUseCase,
    KeyboardSourceUseCase,
    ObserveAttachedKeyboardsUseCase,
    ObserveConnectionUseCase,
    ReadKeyboardUseCase,
    RequestKeyboardAccessUseCase,
    RetryConnectionUseCase,
    SaveKeyboardUseCase,
    SelectKeyboardUseCase,
    type ReadOutcome,
    type SaveCheck,
    type SaveOutcome,
} from "./usecases/device";
export {
    AppendStrokeUseCase,
    ClearUseCase,
    EditOutcome,
    RemoveLastStrokeUseCase,
    SetActionUseCase,
    SetKeyDelayUseCase,
    SetLightingUseCase,
    SetPressDelayUseCase,
    type EditTarget,
} from "./usecases/editing";
export { ChooseLayoutUseCase, ResolveLayoutUseCase } from "./usecases/layout";
