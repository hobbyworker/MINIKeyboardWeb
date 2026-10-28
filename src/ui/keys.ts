// The keyboard in groups of choices — layers, tabs, the key layout — as assistive tools expect of them: the arrow
// keys move the choice and the focus with it.

/**
 * Handles an arrow, Home or End pressed on the choice at `index` of `count`: chooses the next one and focuses it.
 * The group's buttons are the siblings of the one pressed.
 */
export function radioKeys(event: KeyboardEvent, index: number, count: number, choose: (index: number) => void): void {
    let next: number;
    switch (event.key) {
        case "ArrowRight":
        case "ArrowDown":
            next = (index + 1) % count;
            break;
        case "ArrowLeft":
        case "ArrowUp":
            next = (index - 1 + count) % count;
            break;
        case "Home":
            next = 0;
            break;
        case "End":
            next = count - 1;
            break;
        default:
            return;
    }
    event.preventDefault();
    choose(next);
    const buttons = (event.currentTarget as HTMLElement).parentElement?.querySelectorAll<HTMLElement>(
        ":scope > button",
    );
    buttons?.[next]?.focus();
}
