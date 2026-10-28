import type { ConnectedKeyboard } from "../connection";
import type { KeyboardIdentification, UsbIdentity } from "../keyboards";
import { KeyboardLayout, Rotation, sameLayout } from "../layout";
import type { LayoutProfileRepository } from "../ports";
import type { ResolvedLayout } from "../support";

/**
 * The layout to draw for a newly identified keyboard. A keyboard that said how many keys and knobs it has gets the
 * layout the cross-platform app draws for that — its records follow it, so it is not the user's to change, only how it
 * is turned. A keyboard that doesn't say gets the layout the user chose from the app's. Until they choose: what the
 * vendor tool would show.
 */
export class ResolveLayoutUseCase {
    private readonly profiles: LayoutProfileRepository;

    constructor(profiles: LayoutProfileRepository) {
        this.profiles = profiles;
    }

    execute(keyboard: ConnectedKeyboard, identification: KeyboardIdentification): ResolvedLayout {
        const saved = this.profiles.profile(keyboard.usb);
        const rotation = saved?.rotation ?? Rotation.DEFAULT;
        if (identification.identity !== null) {
            const layout = KeyboardLayout.named(
                KeyboardLayout.identifiedId(identification.identity, keyboard.usb.productId),
            );
            if (layout !== null) return { layout, rotation, source: "identified", choices: [] };
        }
        const choices = ResolveLayoutUseCase.choices();
        const chosen = saved === null ? undefined : choices.find((layout) => layout.id === saved.layoutId);
        if (saved !== null && chosen !== undefined) {
            return { layout: chosen, rotation: saved.rotation, source: "chosen", choices };
        }
        return { layout: ResolveLayoutUseCase.assumed(), rotation, source: "assumed", choices };
    }

    /** Every layout the user may choose from, fewest controls first. */
    static choices(): KeyboardLayout[] {
        return [...KeyboardLayout.all()].sort(
            (a, b) =>
                KeyboardLayout.keyCount(a) - KeyboardLayout.keyCount(b) ||
                KeyboardLayout.knobCount(a) - KeyboardLayout.knobCount(b) ||
                (a.id < b.id ? -1 : a.id > b.id ? 1 : 0),
        );
    }

    /** What the cross-platform app draws for a keyboard it knows nothing of: its 15 keys and three knobs. */
    private static assumed(): KeyboardLayout {
        const layout = KeyboardLayout.named(KeyboardLayout.FALLBACK_ID);
        if (layout === null) throw new Error("the cross-platform app's fallback layout is among its layouts");
        return layout;
    }
}

/** Keeps the user's choice of layout and rotation for a keyboard. */
export class ChooseLayoutUseCase {
    private readonly profiles: LayoutProfileRepository;

    constructor(profiles: LayoutProfileRepository) {
        this.profiles = profiles;
    }

    /**
     * The resolved layout with `layout` and `rotation` in place. The layout of a keyboard that said its shape stays as
     * it is; only the rotation is kept.
     */
    execute(
        resolved: ResolvedLayout,
        layout: KeyboardLayout,
        rotation: Rotation,
        keyboard: UsbIdentity,
    ): ResolvedLayout {
        const allowed = resolved.choices.some((choice) => sameLayout(choice, layout));
        const chosen = resolved.source === "identified" || !allowed ? resolved.layout : layout;
        this.profiles.save({ layoutId: chosen.id, rotation }, keyboard);
        const source = resolved.source === "identified" ? "identified" : "chosen";
        return { layout: chosen, rotation, source, choices: resolved.choices };
    }
}
