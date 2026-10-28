// What the signed-in user of a Linux browser needs to open the keyboards: a udev rule that gives them the keyboards'
// hidraw devices.

import { SUPPORTED_KEYBOARDS } from "$domain";

/** Where the rule goes. It sorts before systemd's `73-seat-late.rules`, which turns `uaccess` into access. */
export const UDEV_RULES_PATH = "/etc/udev/rules.d/60-minikeyboard.rules";

/**
 * The rule: a hidraw line for each vendor, with the products as udev's alternatives (`8842|8840|…`), so the commands
 * stay short. sysfs writes USB IDs in lower case. The desktop app for Linux writes the same file; the 1189:8890's line,
 * which only it uses, is here too, so whichever app's commands run last, the file is the same.
 */
export function udevRules(): string {
    const groups: { vendor: number; products: number[] }[] = [];
    for (const usb of SUPPORTED_KEYBOARDS) {
        const group = groups.find(({ vendor }) => vendor === usb.vendorId);
        if (group === undefined) groups.push({ vendor: usb.vendorId, products: [usb.productId] });
        else group.products.push(usb.productId);
    }
    const hex = (id: number) => id.toString(16).padStart(4, "0");
    const lines = [
        "# Lets the signed-in user configure the supported USB macro keyboards.",
        'SUBSYSTEM=="usb", ATTR{idVendor}=="1189", ATTR{idProduct}=="8890", TAG+="uaccess"',
        ...groups.map(
            ({ vendor, products }) =>
                `KERNEL=="hidraw*", ATTRS{idVendor}=="${hex(vendor)}", ATTRS{idProduct}=="${products.map(hex).join("|")}", TAG+="uaccess"`,
        ),
    ];
    return lines.join("\n") + "\n";
}

/** The commands that put the rule in place and apply it to keyboards already plugged in. */
export function udevInstallCommands(): string {
    return (
        `sudo tee ${UDEV_RULES_PATH} > /dev/null <<'EOF'\n${udevRules()}EOF\n` +
        "sudo udevadm control --reload-rules && sudo udevadm trigger\n"
    );
}
