// <minikeyboard-app>: the app as an element of someone else's page. It draws in a shadow root of its own, so the page's
// styles and the app's never meet, and it is the composition root — the one place that knows every layer.
//
// Attributes: `lang` — the page's language (`ko`, `pt`, `zh-hans` …; without it, the document's), `theme` — `light` or
// `dark` (without it, the system's). A development build also takes `simulator` — a simulated model's ID, e.g.
// `1189:8840-6-1-10` — to start on that keyboard.

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
import type { Platform, Theme } from "$ui/props";

export const TAG = "minikeyboard-app";

/** The computer the page runs on, for the names of modifier keys and how a keyboard is allowed. */
function platform(): Platform {
    const agent = navigator as Navigator & { userAgentData?: { platform?: string } };
    const name = (agent.userAgentData?.platform ?? navigator.platform ?? navigator.userAgent).toLowerCase();
    if (name.includes("mac")) return "mac";
    if (name.includes("win")) return "windows";
    if (name.includes("linux") || name.includes("x11") || name.includes("cros")) return "linux";
    return "other";
}

const themeOf = (value: string | null): Theme => (value === "light" || value === "dark" ? value : "auto");

export class MiniKeyboardElement extends HTMLElement {
    static observedAttributes = ["lang", "theme"];

    #props = $state({ theme: "auto" as Theme });
    #teardown: (() => void) | null = null;

    connectedCallback(): void {
        if (this.#teardown) return;
        void setLanguage(this.getAttribute("lang") ?? document.documentElement.lang);
        const computer = platform();
        setModifierStyle(computer === "mac" ? "mac" : computer === "windows" ? "windows" : "pc");
        this.#props.theme = themeOf(this.getAttribute("theme"));

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
        const stopEditor = editor.start();
        const stopLog = deviceLog.start();

        const root = this.shadowRoot ?? this.attachShadow({ mode: "open" });
        const props = this.#props;
        const app = mount(App, {
            target: root,
            props: {
                editor,
                deviceLog,
                platform: computer,
                // A development build offers every simulated model; the published one, the kinds people have.
                allSimulators: import.meta.env.DEV,
                get theme() {
                    return props.theme;
                },
            },
        });
        this.#teardown = () => {
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

    attributeChangedCallback(name: string, _old: string | null, value: string | null): void {
        if (name === "lang") void setLanguage(value ?? document.documentElement.lang);
        if (name === "theme") this.#props.theme = themeOf(value);
    }

    #initialSource(): KeyboardSource {
        if (!import.meta.env.DEV) return KeyboardSource.HARDWARE;
        const id = this.getAttribute("simulator");
        const model = id ? SimulatedModel.all().find((each) => SimulatedModel.id(each) === id) : undefined;
        return model ? { kind: "simulated", model } : KeyboardSource.HARDWARE;
    }
}
