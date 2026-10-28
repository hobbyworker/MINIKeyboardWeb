/** The values from `start` to `end`, both included. */
export interface InclusiveRange {
    readonly start: number;
    readonly end: number;
}

export const InclusiveRange = {
    of(start: number, end: number): InclusiveRange {
        return { start, end };
    },

    contains(range: InclusiveRange, value: number): boolean {
        return value >= range.start && value <= range.end;
    },

    /** `value`, brought within the range. */
    clamp(range: InclusiveRange, value: number): number {
        return Math.min(Math.max(value, range.start), range.end);
    },
} as const;
