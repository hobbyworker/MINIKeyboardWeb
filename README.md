<p align="center"><img src=".github/icon.png" width="128" height="128" alt="App icon"></p>

<h1 align="center">Macro keyboard configurator for the browser</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><b>English</b> · <a href="docs/README.ko.md">한국어</a> · <a href="docs/README.de.md">Deutsch</a> · <a href="docs/README.es.md">Español</a> · <a href="docs/README.fr.md">Français</a> · <a href="docs/README.id.md">Bahasa Indonesia</a> · <a href="docs/README.it.md">Italiano</a> · <a href="docs/README.ja.md">日本語</a> · <a href="docs/README.pl.md">Polski</a> · <a href="docs/README.pt-BR.md">Português (Brasil)</a> · <a href="docs/README.vi.md">Tiếng Việt</a> · <a href="docs/README.zh-Hans.md">简体中文</a> · <a href="docs/README.zh-Hant.md">繁體中文</a></p>

A web component that writes key settings to small USB macro keyboards of the 884x family from the browser, over
WebHID — nothing to install. For each key and knob action (rotate left, press, rotate right) it sets key presses, a
media key or a mouse action on layers 1–3, and the keyboard's lighting. It is the browser counterpart of the macOS,
Windows and Linux apps built on the same rules, and speaks the same commands.

<p align="center"><img src=".github/devices.png" width="560" alt="A small USB macro keyboard: twelve keys and two knobs"></p>

| Keyboard | Layout | Reads back | Waits | Lighting | Tried |
|---|---|---|---|---|---|
| vendor `1189` or `514C`, product `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, newer firmware | from what the keyboard says — 26 layouts | when connected | before each press | a mode, and a colour for each of keys 1–16 | yes — `514C:8850`, 12 keys and 2 knobs |
| the same, older firmware | from what the keyboard says | when connected | one per key | a colour and a mode | no |
| the same, not saying what it is | chosen by you — 26 layouts | no | no | a colour and a mode | no |

These are the keyboards the vendor's cross-platform app "MINI_KEYBOARD" looks for. Most of them say how many keys and
knobs they have and which firmware they run, and the app draws the layout the vendor's app would; one that doesn't
say gets the one of those layouts you pick.

The `1189:8890`, the keyboard of the vendor's Windows tool "MINI KeyBoard", isn't supported in the browser: its
configuration interface has an OUT endpoint only, so macOS and Linux make no HID device of it, and browsers keep web
pages away from HID-class USB interfaces. Use one of the apps below for it.

The app is available in 13 languages — English, Korean, Japanese, Chinese (Simplified and Traditional), German,
Spanish, French, Italian, Portuguese (Brazil), Polish, Indonesian and Vietnamese — and follows the language of the
page it sits in. Other languages get English.

The source in this repository is MIT licensed. The icon at the top is shown for reference: it is not covered by the
MIT license but by CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](LICENSES/CC-BY-SA-4.0.txt)), and builds from this
repository don't include it.

## macOS, Windows, Linux and the web

MINIKeyboard comes in four editions built on the same rules — the same commands, the same 13 languages. The three apps take the same keyboards; the web edition, which runs in the browser, takes them all but the `1189:8890`.

| Repository | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |
| **MINIKeyboardWeb**<br><img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white"> <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6"> <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWeb](https://github.com/hobbyworker/MINIKeyboardWeb) |

## Where it runs

This repository holds the source only — there are no releases or hosted page here. The app is a custom element,
`<minikeyboard-app>`, that a page embeds (see [Embedding](#embedding)); each version is tagged `web/v<version>`.

- A Chromium browser — Chrome, Edge and the like — on Windows, macOS or Linux. Firefox and Safari have no WebHID.
- The page must be served over HTTPS, or from `localhost`.
- No driver: the keyboard is written through its first USB interface, as the vendor's app does, and keeps typing
  meanwhile. On Linux the keyboard's hidraw device needs a udev rule; the app shows it under **How to Allow…**.

## Using it

1. Plug the keyboard in, choose **Connect a Keyboard…**, then the keyboard in the list the browser shows. The browser
   remembers that choice for the site: next time the app opens the keyboard by itself. The app asks the keyboard what
   it is; one that answers is read at once.
2. A keyboard that doesn't say its shape asks for its layout the first time — one of the vendor app's layouts — and
   how it sits in front of you. The app remembers both for that USB ID in this browser. **Shape…** and **Rotate**
   change them later; a keyboard that said its shape only turns.
3. Pick a layer, then the key or knob action on the keyboard.
4. Give it an action:
   - **Keys** — hold modifiers, then click keys; each click adds a press. **Modifiers Only** turns the key into a
     modifier key. **QWERTY** lays the keys out as on a full-size keyboard, **ABC** in groups; only the keys the
     keyboard takes can be clicked.
   - **Multimedia**, **Mouse** — replace what the key did.
   - **LED** — the layer's lights; on newer firmware, select one of keys 1–16 to give it a colour.
   - **Delay** — on firmware that keeps waits.
5. **Save** writes what changed, then reads it back to check the keyboard took it. **Read** asks the keyboard what it
   holds.

The menu (☰) has **Device Log**, which shows every report written and every answer under the keyboard, and
**Simulator**, which tries the app without the keyboard in question — the app acts as if one were plugged in, through
the same commands, nothing going to USB. With several keyboards allowed and plugged in, a button beside the connection
status chooses the one to open.

## Embedding

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="en"></minikeyboard-app>
```

| Attribute | |
|---|---|
| `lang` | The page's language — `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (region forms such as `ko-KR` or `zh-TW` work too). Anything else is English. Without it, the page's: the `lang` of the element or an ancestor, up to `<html>`. |
| `theme` | `light` or `dark`. Without it the app follows the page's dark mode — `data-theme` (as Hugo FixIt sets it), a `dark` class or an inline `color-scheme` on `<html>` or `<body>` — and else the system. |

The app draws in a shadow root, so the page's styles and the app's don't mix; it takes the page's font. It has no
name, icon or links of its own — those belong to the page. Each language's words are a file beside `minikeyboard.js`,
loaded relative to it when that language is chosen — serve the whole `dist/` folder together.

A build of its own can add to the app: subclass `MiniKeyboardElement` from `src/app/index.ts`, return a Svelte
component from `footer()` — drawn at the bottom of the app, in its colours and the language it is showing — and
register the subclass with `defineMiniKeyboard()`.

The app also tells the page what happens: a `minikeyboard` event — it bubbles and leaves the shadow root — on each
connection, read, save, answer to the permission request and problem. `detail.action` is `connect`, `read`, `save`,
`access` or `problem`, with the kind of keyboard and the outcome but never what the keys were set to. The app itself
sends nothing anywhere.

## Building

Node 22 or later.

```sh
npm install
npm run dev     # a development page at http://localhost:5180
npm test        # no keyboard is touched
npm run check   # formatting, types, and that each layer imports only what it may
npm run build   # dist/
```

## Structure

The rules live in layers whose imports point inwards — `scripts/check-layers.mjs` fails the check when one reaches
outwards.

```
src/
├── domain/        keyboards, actions, the controls of each layout and what each keyboard can hold; the ports; use cases (no imports)
├── data/          the commands of each keyboard and the numbers its controls go by; WebHID; simulated keyboards; what the browser remembers
├── presentation/  view models and the values the screen draws — the layouts' geometry, key and colour tables (no UI framework)
├── ui/            Svelte 5 — sees the presentation only; a table of words per language (l10n/)
└── app/           <minikeyboard-app> and the composition root: the only place that sees them all
tests/             vitest — the bytes of every command, the layouts, the edits, the editor
LICENSES/          the licence of the icon at the top (CC BY-SA 4.0)
```

Zero warnings is the bar. Warnings are fixed, not switched off.

## Limitations

- Writing has been tried on one keyboard so far, a `514C:8850` with twelve keys and two knobs, in Chrome on macOS,
  Edge on Windows 11 and Chromium on Linux. The other keyboards are written as their vendor's app writes them — the
  commands are the apps', byte for byte, and tests pin them — but none has been tried yet.
- Keyboards that don't say what they are can't report their settings, so the app shows only what was set in it.
- One keyboard at a time.
- Mouse movement and dragging are not offered.

## License

MIT — see [LICENSE](LICENSE). The icon at the top: CC BY-SA 4.0 — see [LICENSES/CC-BY-SA-4.0.txt](LICENSES/CC-BY-SA-4.0.txt).
