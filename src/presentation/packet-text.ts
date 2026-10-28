// Bytes as the device log shows them, in hex.

/** "03 FB FB FB" — the zero padding a report ends with left out, keeping its first byte. */
export function summary(bytes: Uint8Array): string {
    return hex(bytes.subarray(0, summaryCount(bytes)));
}

/** How many bytes the summary shows. */
export function summaryCount(bytes: Uint8Array): number {
    let end = bytes.length;
    while (end > 1 && bytes[end - 1] === 0) end -= 1;
    return end;
}

/** Every byte, 16 to a row after the row's offset: "0010  00 00 00 …". */
export function rows(bytes: Uint8Array): string[] {
    const rows: string[] = [];
    for (let offset = 0; offset < bytes.length; offset += 16) {
        rows.push(`${offset.toString(16).toUpperCase().padStart(4, "0")}  ${hex(bytes.subarray(offset, offset + 16))}`);
    }
    return rows;
}

export function hex(bytes: Uint8Array): string {
    return Array.from(bytes, (byte) => byte.toString(16).toUpperCase().padStart(2, "0")).join(" ");
}
