// What happened while the app was used, for the page that holds it to count if it wants — the element sends each one
// as a DOM event. Kinds and outcomes only: never what the keys were set to.

import type { RecordFormat } from "$domain";

export type EditorEvent =
    /** A keyboard was identified: its USB ID, the type it answered (null when it didn't) and the records it takes. */
    | {
          readonly action: "connect";
          readonly usb: string;
          readonly type: number | null;
          readonly format: RecordFormat;
          /** Whether the type is one the app's rules were made from (no "not tested yet"). */
          readonly knownType: boolean;
          readonly simulated: boolean;
      }
    /** A read finished; `automatic` when it was the one made on connecting. */
    | {
          readonly action: "read";
          readonly result: "complete" | "incomplete" | "failed";
          readonly automatic: boolean;
          readonly simulated: boolean;
      }
    /** A save finished — with what reading it back found, or how it failed. */
    | {
          readonly action: "save";
          readonly result: "matched" | "differs" | "couldNotCheck" | "notChecked" | "failed";
          readonly simulated: boolean;
      }
    /** The browser's list of keyboards closed: with one allowed, or none. */
    | { readonly action: "access"; readonly granted: boolean }
    /** The keyboard couldn't be reached or identified, or the browser can't reach keyboards at all. */
    | {
          readonly action: "problem";
          readonly problem: "unsupported" | "needsPermission" | "openFailed" | "identifyFailed";
      };
