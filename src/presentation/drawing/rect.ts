/** A rectangle in a layout's drawing space. */
export interface LayoutRect {
    readonly x: number;
    readonly y: number;
    readonly width: number;
    readonly height: number;
}

export const LayoutRect = {
    of(x: number, y: number, width: number, height: number): LayoutRect {
        return { x, y, width, height };
    },

    maxX(rect: LayoutRect): number {
        return rect.x + rect.width;
    },

    maxY(rect: LayoutRect): number {
        return rect.y + rect.height;
    },

    midX(rect: LayoutRect): number {
        return rect.x + rect.width / 2;
    },

    midY(rect: LayoutRect): number {
        return rect.y + rect.height / 2;
    },

    contains(rect: LayoutRect, x: number, y: number): boolean {
        return x >= rect.x && x <= LayoutRect.maxX(rect) && y >= rect.y && y <= LayoutRect.maxY(rect);
    },
};
