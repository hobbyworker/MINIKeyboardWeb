// Where a layout's controls are drawn, and the keyboard's body around them.

import { ControlId, controlKey, type KeyboardLayout, type KnobPart, type Rotation } from "$domain";
import { appGeometry } from "./app-geometry";
import { LayoutRect } from "./rect";

const { maxX, maxY, midX, midY } = LayoutRect;

/** Room between a knob and its turns, in the app's layouts' space (a key there is 80 or so). */
export const TURN_GAP = 4;

/** How far apart two rectangles' centres are. */
export function distance(a: LayoutRect, b: LayoutRect): number {
    return Math.hypot(midX(a) - midX(b), midY(a) - midY(b));
}

/** A control and where it is drawn. */
export interface PlacedControl {
    readonly control: ControlId;
    readonly rect: LayoutRect;
}

/** Each layout's geometry once worked out, by layout ID. */
const drawn = new Map<string, LayoutGeometry | null>();

export class LayoutGeometry {
    readonly frame: LayoutRect;
    /** By {@link controlKey}. */
    readonly rects: ReadonlyMap<string, PlacedControl>;

    constructor(frame: LayoutRect, rects: ReadonlyMap<string, PlacedControl>) {
        this.frame = frame;
        this.rects = rects;
    }

    /** The cross-platform app's own geometry for its layouts; `null` for a layout it doesn't draw. */
    static of(layout: KeyboardLayout): LayoutGeometry | null {
        if (!drawn.has(layout.id)) {
            const app = appGeometry(layout.id);
            const rects = new Map(
                app?.rects.map(([control, rect]) => [controlKey(control), { control, rect }] as const),
            );
            drawn.set(layout.id, app === null ? null : new LayoutGeometry(app.frame, rects).withEvenTurns());
        }
        return drawn.get(layout.id) ?? null;
    }

    rect(control: ControlId): LayoutRect | null {
        return this.rects.get(controlKey(control))?.rect ?? null;
    }

    /**
     * The turns redrawn: all one size, none touching its knob. The original app sizes a knob's turns by the knob (0.6
     * of it), so a big knob's turns grow with it, and puts some over the edge of their knob. Here every turn is as
     * large as the layout's smallest — smaller still where one would come closer than {@link TURN_GAP} to its knob —
     * and stands in its original direction from the knob's centre, {@link TURN_GAP} off the knob.
     */
    withEvenTurns(): LayoutGeometry {
        const turns: { control: ControlId; rect: LayoutRect; press: LayoutRect }[] = [];
        for (const { control, rect } of this.rects.values()) {
            if (control.kind !== "knob" || control.part === "press") continue;
            const press = this.rect(ControlId.knob(control.number, "press"));
            if (press !== null) turns.push({ control, rect, press });
        }
        if (turns.length === 0) return this;
        const size = Math.min(
            ...turns.map(({ rect, press }) =>
                Math.min(rect.width, 2 * (distance(rect, press) - press.width / 2 - TURN_GAP)),
            ),
        );
        const rects = new Map(this.rects);
        for (const { control, rect, press } of turns) {
            const scale = (press.width / 2 + TURN_GAP + size / 2) / distance(rect, press);
            const x = midX(press) + (midX(rect) - midX(press)) * scale;
            const y = midY(press) + (midY(rect) - midY(press)) * scale;
            rects.set(controlKey(control), { control, rect: LayoutRect.of(x - size / 2, y - size / 2, size, size) });
        }
        return new LayoutGeometry(this.frame, rects);
    }

    /** The body and every control. */
    bounds(): LayoutRect {
        let [minX, minY, maxX_, maxY_] = [this.frame.x, this.frame.y, maxX(this.frame), maxY(this.frame)];
        for (const { rect } of this.rects.values()) {
            minX = Math.min(minX, rect.x);
            minY = Math.min(minY, rect.y);
            maxX_ = Math.max(maxX_, maxX(rect));
            maxY_ = Math.max(maxY_, maxY(rect));
        }
        return LayoutRect.of(minX, minY, maxX_ - minX, maxY_ - minY);
    }

    /**
     * As it looks with the keyboard turned: every rectangle turned about the middle of the bounds. Squares stay
     * squares; a wide key stands up.
     */
    rotated(rotation: Rotation): LayoutGeometry {
        if (rotation === "upright") return this;
        const bounds = this.bounds();
        const [centerX, centerY] = [midX(bounds), midY(bounds)];
        const sideways = rotation === "quarter" || rotation === "threeQuarters";
        const turn = (rect: LayoutRect): LayoutRect => {
            const [dx, dy] = [midX(rect) - centerX, midY(rect) - centerY];
            const [x, y] = rotation === "quarter" ? [-dy, dx] : rotation === "half" ? [-dx, -dy] : [dy, -dx];
            const [width, height] = sideways ? [rect.height, rect.width] : [rect.width, rect.height];
            return LayoutRect.of(centerX + x - width / 2, centerY + y - height / 2, width, height);
        };
        const rects = new Map(
            [...this.rects].map(([key, { control, rect }]) => [key, { control, rect: turn(rect) }] as const),
        );
        return new LayoutGeometry(turn(this.frame), rects);
    }

    /**
     * Each knob as one body, for drawing the keyboard's shape — its actions are separate controls only for binding.
     * The body sits on the press action, as large as it; a knob without one sits between its turns, as large as the
     * layout's other knobs. In knob number order.
     */
    knobOutlines(): (readonly [number, LayoutRect])[] {
        const parts = new Map<number, { part: KnobPart; rect: LayoutRect }[]>();
        for (const { control, rect } of this.rects.values()) {
            if (control.kind !== "knob") continue;
            const knob = parts.get(control.number) ?? [];
            knob.push({ part: control.part, rect });
            parts.set(control.number, knob);
        }
        const presses = [...parts.values()].flat().filter(({ part }) => part === "press");
        const pressSize = presses.length === 0 ? null : Math.max(...presses.map(({ rect }) => rect.width));
        return [...parts]
            .sort(([a], [b]) => a - b)
            .map(([number, rects]) => {
                const press = rects.find(({ part }) => part === "press");
                if (press !== undefined) return [number, press.rect] as const;
                const minX = Math.min(...rects.map(({ rect }) => rect.x));
                const maxX_ = Math.max(...rects.map(({ rect }) => maxX(rect)));
                const minY = Math.min(...rects.map(({ rect }) => rect.y));
                const maxY_ = Math.max(...rects.map(({ rect }) => maxY(rect)));
                const size = pressSize ?? Math.min(maxX_ - minX, maxY_ - minY);
                return [
                    number,
                    LayoutRect.of((minX + maxX_ - size) / 2, (minY + maxY_ - size) / 2, size, size),
                ] as const;
            });
    }
}
