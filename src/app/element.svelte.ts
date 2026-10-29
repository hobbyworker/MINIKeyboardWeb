// <minikeyboard-app>: the app as an element of someone else's page. It draws in a shadow root of its own, so the page's
// styles and the app's never meet, and it is the composition root — the one place that knows every layer.
//
// Attributes: `lang` — the page's language (`ko`, `pt`, `zh-hans` …), `theme` — `light` or `dark`. Without them the app
// follows the page: the `lang` of the element or an ancestor, and the page's dark mode (see page.ts), else the system's.
// A development build also takes `simulator` — a simulated model's ID, e.g. `1189:8840-6-1-10` — to start on that
// keyboard.
//
// Event: `minikeyboard`, bubbling out to the page, its detail what happened (EditorEvent — a connection, a read, a save,
// a problem; kinds and outcomes, never the keys' settings). A build of its own can subclass the element and give
// footer() — drawn at the bottom of the app, in its colours and language — then define it with defineMiniKeyboard.

import { mount, unmount } from "svelte";
import {
    ChooseLayoutUseCase,
    DeviceLogUseCase,
    IdentifyKeyboardUseCase,
    KeyboardSource,
    KeyboardSourceUseCase,
    ObserveAttachedKeyboardsUseCase,
    ObserveConnectionUseCase,
    ReadKeyboardUseCase,
    RequestKeyboardAccessUseCase,
    ResolveLayoutUseCase,
    RetryConnectionUseCase,
    SaveKeyboardUseCase,
    SelectKeyboardUseCase,
    SimulatedModel,
} from "$domain";
import {
    DeviceLogStore,
    KeyboardDevice,
    KeyboardSourceSwitch,
    StorageLayoutProfiles,
    WebHidConnection,
    browserHidSystem,
    browserStorage,
} from "$data";
import { DeviceLogModel, EditorModel, setModifierStyle } from "$presentation";
import App from "$ui/App.svelte";
import { setLanguage } from "$ui/l10n.svelte";
import type { AppFooter, Platform, Theme } from "$ui/props";
import { pageLanguage, pageTheme } from "./page";

export const TAG = "minikeyboard-app";

/** The DOM event the element sends for each thing that happened. */
export const EVENT = "minikeyboard";

/** The computer the page runs on, for the names of modifier keys and how a keyboard is allowed. */
function platform(): Platform {
    const agent = navigator as Navigator & { userAgentData?: { platform?: string } };
    const name = (agent.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent).toLowerCase();
    if (name.includes("mac")) return "mac";
    if (name.includes("win")) return "windows";
    if (name.includes("linux") || name.includes("x11") || name.includes("cros")) return "linux";
    return "other";
}

export class MiniKeyboardElement extends HTMLElement {
    static observedAttributes = ["lang", "theme"];

    #props = $state({ theme: "auto" as Theme });
    #teardown: (() => void) | null = null;

    /** What the app draws below itself; none here. A build of its own overrides it. */
    protected footer(): AppFooter | null {
        return null;
    }

    connectedCallback(): void {
        if (this.#teardown) return;
        this.#follow();
        const computer = platform();
        setModifierStyle(computer === "mac" ? "mac" : computer === "windows" ? "windows" : "pc");

        const log = new DeviceLogStore();
        const storage = browserStorage();
        const source = new KeyboardSourceSwitch(log, this.#initialSource(), () =>
            WebHidConnection.start(log, browserHidSystem(), storage),
        );
        const device = new KeyboardDevice(source, log);
        const profiles = new StorageLayoutProfiles(storage);
        const editor = new EditorModel({
            observeConnection: new ObserveConnectionUseCase(source),
            retryConnection: new RetryConnectionUseCase(source),
            identifyKeyboard: new IdentifyKeyboardUseCase(device),
            resolveLayout: new ResolveLayoutUseCase(profiles),
            chooseLayout: new ChooseLayoutUseCase(profiles),
            readKeyboard: new ReadKeyboardUseCase(device),
            saveKeyboard: new SaveKeyboardUseCase(device),
            keyboardSource: new KeyboardSourceUseCase(source),
            attachedKeyboards: {
                observe: new ObserveAttachedKeyboardsUseCase(source),
                select: new SelectKeyboardUseCase(source),
            },
            requestAccess: new RequestKeyboardAccessUseCase(source),
        });
        const deviceLog = new DeviceLogModel(new DeviceLogUseCase(log));
        const stopEvents = editor.onEvent((detail) =>
            this.dispatchEvent(new CustomEvent(EVENT, { detail, bubbles: true, composed: true })),
        );
        const stopEditor = editor.start();
        const stopLog = deviceLog.start();

        const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
        const props = this.#props;
        const app = mount(App, {
            target: root,
            props: {
                editor,
                deviceLog,
                footer: this.footer(),
                platform: computer,
                // A development build offers every simulated model; the published one, the kinds people have.
                allSimulators: import.meta.env.DEV,
                get theme() {
                    return props.theme;
                },
            },
        });
        // The page may change its language or dark mode while the app is open (a theme switch).
        const page = new MutationObserver(() => this.#follow());
        for (const element of [document.documentElement, document.body]) {
            page.observe(element, { attributes: true, attributeFilter: ["lang", "data-theme", "class", "style"] });
        }
        this.#teardown = () => {
            page.disconnect();
            stopEvents();
            void unmount(app);
            stopEditor();
            stopLog();
            source.close();
        };
    }

    disconnectedCallback(): void {
        this.#teardown?.();
        this.#teardown = null;
    }

    attributeChangedCallback(): void {
        if (this.#teardown) this.#follow();
    }

    /** The language and theme the element was given, or else the page's. */
    #follow(): void {
        void setLanguage(pageLanguage(this, this.parentElement?.closest("[lang]"), document.documentElement));
        const theme = this.getAttribute("theme");
        this.#props.theme =
            theme === "light" || theme === "dark"
                ? theme
                : (pageTheme(document.documentElement, document.body) ?? "auto");
    }

    #initialSource(): KeyboardSource {
        if (!import.meta.env.DEV) return KeyboardSource.HARDWARE;
        const id = this.getAttribute("simulator");
        const model = id ? SimulatedModel.all().find((each) => SimulatedModel.id(each) === id) : undefined;
        return model ? { kind: "simulated", model } : KeyboardSource.HARDWARE;
    }
}

/** Defines `tag` as `ctor` — the app, or a build's subclass of it — once; a page may load the module twice. */
export function defineMiniKeyboard(tag: string = TAG, ctor: CustomElementConstructor = MiniKeyboardElement): void {
    if (!customElements.get(tag)) customElements.define(tag, ctor);
}
