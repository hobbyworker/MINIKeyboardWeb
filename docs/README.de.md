<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="App-Symbol"></p>

<h1 align="center">Konfigurator für Makrotastaturen im Browser</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <b>Deutsch</b> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Eine Web-Komponente, die aus dem Browser über WebHID Tastenbelegungen auf kleine USB-Makrotastaturen der
884x-Familie schreibt – ohne etwas zu installieren. Für jede Aktion einer Taste oder eines Drehknopfs (nach links
drehen, drücken, nach rechts drehen) legt sie auf den Ebenen 1–3 Tastendrücke, eine Multimedia-Taste oder eine
Mausaktion fest, außerdem die Beleuchtung der Tastatur. Sie ist das Browser-Gegenstück zu den macOS-, Windows- und
Linux-Apps, die nach denselben Regeln gebaut sind, und verwendet dieselben Befehle.

<p align="center"><img src="../.github/devices.png" width="560" alt="Eine kleine USB-Makrotastatur: zwölf Tasten und zwei Drehknöpfe"></p>

| Tastatur | Anordnung | Auslesen | Verzögerung | Beleuchtung | Getestet |
|---|---|---|---|---|---|
| Hersteller `1189` oder `514C`, Produkt `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, neuere Firmware | wie die Tastatur sie meldet – 26 Anordnungen | sofort beim Verbinden | vor jedem Tastendruck | ein Modus und eine Farbe für jede der Tasten 1–16 | ja – `514C:8850`, 12 Tasten und 2 Drehknöpfe |
| dieselben, ältere Firmware | wie die Tastatur sie meldet | sofort beim Verbinden | eine pro Taste | eine Farbe und ein Modus | nein |
| dieselben, ohne Angabe ihres Typs | wählst du – 26 Anordnungen | nein | keine | eine Farbe und ein Modus | nein |

Das sind die Tastaturen, nach denen die plattformübergreifende App des Herstellers, „MINI_KEYBOARD“, sucht. Die
meisten davon melden, wie viele Tasten und Drehknöpfe sie haben und welche Firmware darauf läuft – dann zeichnet die
App die Anordnung so, wie die App des Herstellers sie zeichnen würde. Eine Tastatur, die das nicht meldet, bekommt die
Anordnung, die du unter diesen auswählst.

Die `1189:8890`, die Tastatur, mit der das Windows-Tool des Herstellers, „MINI KeyBoard“, arbeitet, wird im Browser
nicht unterstützt: Ihre Konfigurationsschnittstelle hat nur einen OUT-Endpunkt, deshalb machen macOS und Linux kein
HID-Gerät daraus, und Browser halten Webseiten von USB-Schnittstellen der HID-Klasse fern. Verwende für sie eine der
Apps unten.

Die App gibt es in 13 Sprachen – Englisch, Koreanisch, Japanisch, Chinesisch (vereinfacht und traditionell), Deutsch,
Spanisch, Französisch, Italienisch, Portugiesisch (Brasilien), Polnisch, Indonesisch und Vietnamesisch. Sie folgt der
Sprache der Seite, in der sie steckt; in allen anderen Sprachen erscheint sie auf Englisch.

Der Quellcode in diesem Repository steht unter der MIT-Lizenz. Das Symbol ganz oben dient nur der Anschauung: Es
fällt nicht unter die MIT-Lizenz, sondern unter CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)),
und Builds aus diesem Repository enthalten es nicht.

## macOS, Windows, Linux und das Web

MINIKeyboard gibt es in vier Ausgaben nach denselben Regeln – dieselben Befehle, dieselben 13 Sprachen. Die drei Apps nehmen dieselben Tastaturen, die Web-Ausgabe, die im Browser läuft, alle außer der `1189:8890`.

| Repository | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |
| **MINIKeyboardWeb**<br><img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white"> <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6"> <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWeb](https://github.com/hobbyworker/MINIKeyboardWeb) |

## Wo sie läuft

Dieses Repository enthält nur den Quellcode – hier gibt es weder Releases noch eine bereitgestellte Seite. Die App ist
ein Custom Element, `<minikeyboard-app>`, das eine Seite einbettet (siehe [Einbetten](#einbetten)); jede Version
bekommt das Tag `web/v<Version>`.

- Ein Chromium-Browser – Chrome, Edge und ähnliche – unter Windows, macOS oder Linux. Firefox und Safari haben kein
  WebHID.
- Die Seite muss über HTTPS oder von `localhost` ausgeliefert werden.
- Kein Treiber nötig: Die Tastatur wird wie in der App des Herstellers über ihre erste USB-Schnittstelle beschrieben.
  Sie tippt währenddessen ganz normal weiter. Unter Linux braucht das hidraw-Gerät der Tastatur eine
  udev-Regel; die App zeigt sie unter **Zugriff einrichten…**.

## Verwendung

1. Schließe die Tastatur an, wähle **Tastatur verbinden…** und dann die Tastatur in der Liste, die der Browser zeigt.
   Der Browser merkt sich diese Wahl für die Website: Beim nächsten Mal öffnet die App die Tastatur von selbst. Die
   App fragt die Tastatur nach ihrem Typ; eine, die antwortet, wird sofort ausgelesen.
2. Bei einer Tastatur, die ihre Form nicht angibt, legst du beim ersten Mal die Anordnung fest – eine der Anordnungen
   aus der App des Herstellers – und wie sie vor dir liegt. Die App merkt sich beides für diese USB-ID in diesem
   Browser. Später änderst du das mit **Form…** und **Drehen**; eine Tastatur, die ihre Form angegeben hat, lässt sich
   nur drehen.
3. Wähle eine Ebene und dann auf der Tastatur die Taste oder die Drehknopf-Aktion.
4. Gib ihr eine Aktion:
   - **Tasten** – Halte Sondertasten gedrückt, dann klicke auf Tasten; jeder Klick fügt einen Tastendruck hinzu.
     **Nur Sondertasten** macht die Taste zur Sondertaste. **QWERTY** ordnet die Tasten wie auf einer Tastatur in
     voller Größe an, **ABC** in Gruppen; anklicken lassen sich nur Tasten, die die Tastatur annimmt.
   - **Multimedia**, **Maus** – ersetzen, was die Taste vorher tat.
   - **LED** – die Beleuchtung der Ebene; bei neuerer Firmware wählst du eine der Tasten 1–16 aus, um ihr eine Farbe
     zu geben.
   - **Verzögerung** – bei Firmware, die Wartezeiten speichert.
5. **Sichern** schreibt, was sich geändert hat, und liest es danach zurück, um zu prüfen, ob die Tastatur es
   übernommen hat. **Lesen** holt die aktuellen Einstellungen von der Tastatur.

Im Menü (☰) findest du **Geräteprotokoll**, das jeden geschriebenen Report und jede Antwort unter der
Tastaturabbildung zeigt, und **Simulator**, mit dem du die App ohne die betreffende Tastatur ausprobieren kannst – die
App verhält sich, als wäre eine angeschlossen, mit denselben Befehlen, nur dass nichts über USB hinausgeht. Sind
mehrere erlaubte Tastaturen angeschlossen, wählst du mit einer Schaltfläche neben dem Verbindungsstatus die, die
geöffnet wird.

## Einbetten

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="de"></minikeyboard-app>
```

| Attribut | |
|---|---|
| `lang` | Die Sprache der Seite – `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (Formen mit Region wie `ko-KR` oder `zh-TW` funktionieren auch). Alles andere ist Englisch. Ohne das Attribut gilt die der Seite: das `lang` des Elements oder eines Vorfahren bis hinauf zu `<html>`. |
| `theme` | `light` oder `dark`. Ohne das Attribut folgt die App dem dunklen Modus der Seite – `data-theme` (wie Hugo FixIt es setzt), einer Klasse `dark` oder einem Inline-`color-scheme` an `<html>` oder `<body>` – und sonst dem System. |

Die App zeichnet in einem Shadow Root, daher vermischen sich die Stile der Seite und die der App nicht; die Schrift
übernimmt sie von der Seite. Sie hat keinen eigenen Namen, kein Symbol und keine Links – die gehören zur Seite. Die
Texte jeder Sprache liegen in einer Datei neben `minikeyboard.js` und werden relativ dazu geladen, wenn diese Sprache
gewählt wird – stelle den ganzen Ordner `dist/` zusammen bereit.

Ein eigener Build kann die App ergänzen: `MiniKeyboardElement` aus `src/app/index.ts` ableiten, aus `footer()` eine
Svelte-Komponente zurückgeben – sie wird ganz unten in der App gezeichnet, in deren Farben und der gerade angezeigten
Sprache – und die Unterklasse mit `defineMiniKeyboard()` registrieren.

Die App teilt der Seite außerdem mit, was geschieht: bei jeder Verbindung, jedem Lesen und Speichern, jeder Antwort
auf die Zugriffsanfrage und jedem Problem ein `minikeyboard`-Ereignis – es steigt auf und verlässt den Shadow Root.
`detail.action` ist `connect`, `read`, `save`, `access` oder `problem`, mit der Art der Tastatur und dem Ergebnis,
aber nie mit dem, was auf die Tasten gelegt wurde. Die App selbst sendet nirgendwohin etwas.

## Build

Node 22 oder neuer.

```sh
npm install
npm run dev     # eine Entwicklungsseite unter http://localhost:5180
npm test        # keine Tastatur wird angerührt
npm run check   # Formatierung, Typen und dass jede Schicht nur importiert, was sie darf
npm run build   # dist/
```

## Aufbau

Die Regeln stecken in Schichten, deren Importe nur nach innen zeigen – `scripts/check-layers.mjs` lässt die Prüfung
fehlschlagen, wenn eine nach außen greift.

```
src/
├── domain/        Tastaturen, Aktionen, die Bedienelemente jeder Anordnung und was jede Tastatur aufnehmen kann; die Ports; Use Cases (keine Importe)
├── data/          die Befehle jeder Tastatur und die Nummern ihrer Bedienelemente; WebHID; simulierte Tastaturen; was sich der Browser merkt
├── presentation/  View-Models und die Werte, die die Ansicht zeichnet – die Geometrie der Anordnungen, Tasten- und Farbtabellen (kein UI-Framework)
├── ui/            Svelte 5 – sieht nur presentation; eine Texttabelle pro Sprache (l10n/)
└── app/           <minikeyboard-app> und die Composition Root: der einzige Ort, der alle kennt
tests/             vitest – die Bytes jedes Befehls, die Anordnungen, die Bearbeitungen, der Editor
LICENSES/          die Lizenz des Symbols ganz oben (CC BY-SA 4.0)
```

Null Warnungen ist der Maßstab. Warnungen werden behoben, nicht abgeschaltet.

## Einschränkungen

- Geschrieben wurde bisher nur auf eine einzige Tastatur, eine `514C:8850` mit zwölf Tasten und zwei Drehknöpfen, in
  Chrome unter macOS, Edge unter Windows 11 und Chromium unter Linux. Die übrigen Tastaturen werden so beschrieben,
  wie die App ihres Herstellers sie beschreibt – die Befehle sind bis aufs Byte die der Apps, und Tests halten sie
  fest –, aber an einer echten Tastatur wurde noch keine davon ausprobiert.
- Tastaturen, die ihren Typ nicht angeben, können ihre Einstellungen nicht melden; die App zeigt daher nur, was in ihr
  festgelegt wurde.
- Immer nur eine Tastatur.
- Mausbewegungen und Ziehen werden nicht angeboten.

## Lizenz

MIT – siehe [LICENSE](../LICENSE). Das Symbol ganz oben: CC BY-SA 4.0 – siehe
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
