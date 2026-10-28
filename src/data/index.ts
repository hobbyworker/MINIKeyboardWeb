// The keyboards as the domain's ports see them: their commands byte for byte, finding them through WebHID and writing
// to them, the device log, the user's layouts in browser storage, and simulated keyboards that answer as their
// firmware would.

export { Broadcaster, ReportFraming, sleep, type ChannelProvider, type ReportChannel } from "./channel";
export { WebHidConnection } from "./connection/webhid";
export {
    browserHidSystem,
    type HidConnectionEvent,
    type HidDevice,
    type HidInputReport,
    type HidSystem,
} from "./connection/hid";
export * as choice from "./connection/choice";
export { KeyboardDevice, type DeviceTiming, type Pause } from "./device";
export { DeviceLogStore } from "./log";
export { StorageLayoutProfiles } from "./profiles";
export * as k884x from "./protocols/k884x";
export * as numbers from "./protocols/numbers";
export { WritePlan, type Step } from "./protocols/plan";
export * as records from "./protocols/records";
export { KeyboardSourceSwitch, SimulatedKeyboard, type HardwareConnection } from "./simulator";
export { browserStorage, type KeyValueStorage } from "./storage";
