// The interface's icons: plain shapes on a 24 × 24 grid, stroked in the text's colour (a few filled).

export interface IconShape {
    readonly d: string;
    /** Filled rather than stroked. */
    readonly fill?: boolean;
}

const speaker = "M4 9h4l5-4v14l-5-4H4Z";
const circle = (x: number, y: number, r: number) =>
    `M${x - r} ${y}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0Z`;

export const ICONS = {
    menu: { d: "M4 6h16M4 12h16M4 18h16" },
    chevronDown: { d: "M6 9l6 6 6-6" },
    chevronRight: { d: "M9 6l6 6-6 6" },
    chevronLeft: { d: "M15 6l-6 6 6 6" },
    info: { d: `${circle(12, 12, 9.5)}M12 11v6M12 7.5v.01` },
    rotateRight: { d: "M20.5 12a8.5 8.5 0 1 1-2.5-6l2.5 2.5M20.5 3.5v5h-5" },
    rotateLeft: { d: "M3.5 12a8.5 8.5 0 1 0 2.5-6L3.5 8.5M3.5 3.5v5h5" },
    press: { d: circle(12, 12, 5), fill: true },
    keyboard: {
        d: "M3 6h18a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H3a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1ZM6 10h.01M10 10h.01M14 10h.01M18 10h.01M7 14h10",
    },
    warning: { d: "M12 3.5L2.5 20h19L12 3.5ZM12 10v4M12 17h.01" },
    copy: {
        d: "M9 9h10a1 1 0 0 1 1 1v10a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V10a1 1 0 0 1 1-1ZM5 15H4a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1h10a1 1 0 0 1 1 1v1",
    },
    undo: { d: "M9 14L4 9l5-5M4 9h10a6 6 0 0 1 0 12h-3" },
    check: { d: "M5 12.5l4.5 4.5L19.5 7" },
    close: { d: "M6 6l12 12M18 6L6 18" },
    plug: { d: "M9 2.5v4M15 2.5v4M6.5 6.5h11v4a5.5 5.5 0 0 1-11 0v-4ZM12 16v5.5" },
    arrowUp: { d: "M12 19V5M5.5 11.5L12 5l6.5 6.5" },
    arrowDown: { d: "M12 5v14M18.5 12.5L12 19l-6.5-6.5" },
    arrowLeft: { d: "M19 12H5M11.5 5.5L5 12l6.5 6.5" },
    arrowRight: { d: "M5 12h14M12.5 5.5L19 12l-6.5 6.5" },
    playPause: { d: "M4 5.5l8 6.5-8 6.5ZM16 5.5v13M20 5.5v13" },
    stop: { d: "M6 6h12v12H6Z" },
    skipBack: { d: "M19 5.5L10 12l9 6.5ZM6 5.5v13" },
    skipForward: { d: "M5 5.5l9 6.5-9 6.5ZM18 5.5v13" },
    mute: { d: `${speaker}M16.5 9.5l5 5M21.5 9.5l-5 5` },
    volumeHigh: { d: `${speaker}M16 9a4 4 0 0 1 0 6M18.8 6.2a8 8 0 0 1 0 11.6` },
    volumeLow: { d: `${speaker}M16 9a4 4 0 0 1 0 6` },
    brightness: {
        d: `${circle(12, 12, 4)}M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4`,
    },
    speakers: { d: `M6 3h12v18H6Z${circle(12, 14, 3)}M12 7.5v.01` },
    music: { d: `M9 18V5.5l11-2V16${circle(6.5, 18, 2.5)}${circle(17.5, 16, 2.5)}` },
    mail: { d: "M3 6h18v12H3ZM3 7l9 6.5L21 7" },
    calculator: {
        d: "M6 2.5h12a1 1 0 0 1 1 1v17a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-17a1 1 0 0 1 1-1ZM8 6h8v3.5H8ZM8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17.5h.01M12 17.5h.01M15.5 17.5h.01",
    },
    computer: { d: "M3 4h18v12H3ZM8 20.5h8M12 16v4.5" },
    home: { d: "M3 11.5L12 3.5l9 8M5.5 9.5V20.5h13V9.5" },
    refresh: { d: "M20.5 12a8.5 8.5 0 1 1-2.5-6l2.5 2.5M20.5 3.5v5h-5" },
    mouse: { d: "M12 2.5a6 6 0 0 1 6 6v7a6 6 0 0 1-12 0v-7a6 6 0 0 1 6-6ZM12 6.5v4" },
    usb: { d: "M12 2.5v15M9 5.5l3-3 3 3M7 9v3l5 3M17 8v2.5l-5 3" + circle(12, 19.5, 2) },
} satisfies Record<string, IconShape>;

export type IconName = keyof typeof ICONS;
