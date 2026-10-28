// The 884x keyboards' requests and answers, as the cross-platform app sends and reads them. Every request is a 64-byte
// payload after report ID 3; every answer a 64-byte input report, its first byte the report ID.

import {
    KeyboardIdentity,
    KeyColor,
    LightingSupport,
    type LayerLighting,
    type LightColor,
    type RecordFormat,
} from "$domain";
import { layerByte, legacyLighting } from "./records";

export const REPORT_ID = 0x03;
/** The report ID and 64 bytes. */
export const REPORT_LENGTH = 65;

/** `FB FB FB`: how many keys and knobs, and the type (`Widget::Read_KeyBoard_KeyNum`). */
export const IDENTIFY = Uint8Array.of(0xfb, 0xfb, 0xfb);

/** `FD FE FF`: keep what was written. The app waits 200 ms after it. */
export const COMMIT = Uint8Array.of(0xfd, 0xfe, 0xff);
export const COMMIT_PAUSE = 200;

/**
 * `FA <key records> <knobs> <layer + 1>`, as the cross-platform app asks (`read_Hidkey_Data`): the standard format its
 * 25 records as `FA 19 00`, the legacy one its 15 key records and 3 knobs of 3 records as `FA 0F 03` — 24 answers.
 */
export function readRecords(layer: number, format: RecordFormat): Uint8Array | null {
    const byte = layerByte(layer + 1);
    switch (format) {
        case "standard":
            return Uint8Array.of(0xfa, 25, 0, byte);
        case "legacy":
            return Uint8Array.of(0xfa, 15, 3, byte);
        case "unidentified":
            return null;
    }
}

/** How many answers follow {@link readRecords}, one record each, records 1… in order. */
export function readReplyCount(format: RecordFormat): number {
    return format === "standard" ? 25 : 15 + 3 * 3;
}

/** `FA B0 <layer>`: one layer's lights (standard format, `Read_RgbLed_DataDsp`). The layer counts from 0. */
export function readLighting(layer: number): Uint8Array {
    return Uint8Array.of(0xfa, 0xb0, layerByte(layer));
}

/** `FE B0 <layer> <mode> <r g b × 16>` (standard format). The layer counts from 0. */
export function lighting(layer: number, mode: number, colors: readonly KeyColor[]): Uint8Array {
    const payload = [0xfe, 0xb0, layerByte(layer), mode];
    for (const color of colors.slice(0, LightingSupport.COLOR_KEY_COUNT)) {
        payload.push(color.red, color.green, color.blue);
    }
    return Uint8Array.from(payload);
}

// Answers, the report ID first.

export function identity(reply: Uint8Array): KeyboardIdentity | null {
    const [, , keys, knobs, kind] = reply;
    if (keys === undefined || knobs === undefined || kind === undefined) return null;
    return KeyboardIdentity.of(keys, knobs, kind);
}

/** A record answer carries the record after the report ID. */
export function record(reply: Uint8Array): Uint8Array {
    return reply.subarray(1);
}

/** `[2]` the mode, `[3…50]` sixteen colours. */
export function lightingReply(reply: Uint8Array): LayerLighting | null {
    const count = LightingSupport.COLOR_KEY_COUNT;
    if (reply.length < 3 + 3 * count) return null;
    const colors: KeyColor[] = [];
    for (let index = 0; index < count; index++) {
        const at = 3 + 3 * index;
        colors.push(KeyColor.of(reply[at] ?? 0, reply[at + 1] ?? 0, reply[at + 2] ?? 0));
    }
    return { kind: "perKey", mode: reply[2] ?? 0, colors };
}

// Unidentified keyboards.

/** After an `FE` record: `AA AA`, `FD FE FF`, `AA AA`. */
export function unidentifiedSave(): Uint8Array[] {
    return [Uint8Array.of(0xaa, 0xaa), COMMIT.slice(), Uint8Array.of(0xaa, 0xaa)];
}

/**
 * Lights of an unidentified keyboard: `FE B0 <layer + 1> 08 … 01 00 <code>` and the commit, after the identification
 * and reads the cross-platform app sends first on the same connection — without them the light is known to change but
 * not to stay.
 */
export function unidentifiedLighting(color: LightColor, mode: number, layer: number): Uint8Array[] {
    const payloads: Uint8Array[] = [Uint8Array.of(0xfb, 0xfb, 0xfb, 0x01)];
    for (let record = 1; record <= 3; record++) payloads.push(Uint8Array.of(0xfa, 0x0f, 0x03, record, 0x7f));
    payloads.push(legacyLighting(color, mode, layer, 12));
    payloads.push(COMMIT.slice());
    return payloads;
}
