<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Icona dell’app"></p>

<h1 align="center">Configuratore di tastiere macro per il browser</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <b>Italiano</b> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Un componente web che scrive dal browser, tramite WebHID, le impostazioni dei tasti su piccole tastiere macro USB
della famiglia 884x – senza installare nulla. Per ogni azione di un tasto o di una manopola (ruota a sinistra, premi,
ruota a destra) imposta sui livelli 1–3 pressioni di tasti, un tasto multimediale o un’azione del mouse, oltre
all’illuminazione della tastiera. È la versione per il browser delle app per macOS, Windows e Linux costruite sulle
stesse regole, e usa gli stessi comandi.

<p align="center"><img src="../.github/devices.png" width="560" alt="Una piccola tastiera macro USB: dodici tasti e due manopole"></p>

| Tastiera | Disposizione | Lettura | Ritardo | Illuminazione | Provata |
|---|---|---|---|---|---|
| produttore `1189` o `514C`, prodotto `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, firmware più recente | secondo quanto indica la tastiera – 26 disposizioni | subito alla connessione | prima di ogni pressione | una modalità e un colore per ciascuno dei tasti 1–16 | sì – `514C:8850`, 12 tasti e 2 manopole |
| le stesse, firmware precedente | secondo quanto indica la tastiera | subito alla connessione | uno per tasto | un colore e una modalità | no |
| le stesse, senza indicare il proprio tipo | la scegli tu – 26 disposizioni | no | nessuno | un colore e una modalità | no |

Sono le tastiere che cerca l’app multipiattaforma del produttore, “MINI_KEYBOARD”. La maggior parte indica quanti tasti
e manopole ha e quale firmware usa, e l’app disegna la disposizione che disegnerebbe l’app del produttore; una tastiera
che non lo indica riceve, tra queste disposizioni, quella che scegli tu.

La `1189:8890`, la tastiera gestita dallo strumento Windows del produttore, “MINI KeyBoard”, non è supportata nel
browser: la sua interfaccia di configurazione ha un solo endpoint OUT, quindi macOS e Linux non ne fanno un dispositivo
HID, e i browser tengono le pagine web lontane dalle interfacce USB di classe HID. Per questa tastiera usa una delle
app qui sotto.

L’app è disponibile in 13 lingue – inglese, coreano, giapponese, cinese (semplificato e tradizionale), tedesco,
spagnolo, francese, italiano, portoghese (Brasile), polacco, indonesiano e vietnamita – e segue la lingua della pagina
in cui si trova. Nelle altre lingue appare in inglese.

Il codice sorgente di questo repository è distribuito con licenza MIT. L’icona in alto è mostrata solo a titolo
illustrativo: non è coperta dalla licenza MIT ma dalla licenza CC BY-SA 4.0
([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)), e non è inclusa nelle build ottenute da questo
repository.

## macOS, Windows, Linux e il web

MINIKeyboard esiste in quattro edizioni costruite sulle stesse regole – gli stessi comandi, le stesse 13 lingue. Le tre app gestiscono le stesse tastiere, e l’edizione web, che funziona nel browser, tutte tranne la `1189:8890`.

| Repository | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |
| **MINIKeyboardWeb**<br><img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white"> <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6"> <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWeb](https://github.com/hobbyworker/MINIKeyboardWeb) |

## Dove funziona

Questo repository contiene solo il codice sorgente – qui non ci sono Releases né una pagina pubblicata. L’app è un
elemento personalizzato, `<minikeyboard-app>`, che una pagina incorpora (vedi [Incorporamento](#incorporamento)); ogni
versione ha il tag `web/v<versione>`.

- Un browser Chromium – Chrome, Edge e simili – su Windows, macOS o Linux. Firefox e Safari non hanno WebHID.
- La pagina deve essere servita tramite HTTPS, oppure da `localhost`.
- Nessun driver: la tastiera viene scritta tramite la sua prima interfaccia USB, come fa l’app del produttore. Nel
  frattempo la tastiera continua a digitare normalmente. Su Linux il dispositivo hidraw della tastiera richiede una
  regola udev; l’app la mostra in **Come consentire…**.

## Utilizzo

1. Inserisci la tastiera nella porta USB, scegli **Collega una tastiera…**, poi la tastiera nell’elenco mostrato dal
   browser. Il browser ricorda la scelta per il sito: la volta successiva l’app apre la tastiera da sola. L’app chiede
   alla tastiera che tastiera è; se risponde, viene letta subito.
2. Per una tastiera che non indica la propria forma, la prima volta scegli la disposizione – una di quelle dell’app
   del produttore – e come è posizionata davanti a te. L’app ricorda entrambe le cose per quell’ID USB in questo
   browser. In seguito le cambi con **Forma…** e **Ruota**; una tastiera che ha indicato la propria forma si può solo
   ruotare.
3. Scegli un livello, poi il tasto o l’azione della manopola sulla tastiera.
4. Assegna un’azione:
   - **Tasti** – tieni premuti i modificatori, poi fai clic sui tasti; ogni clic aggiunge una pressione.
     **Solo modificatori** trasforma il tasto in un tasto modificatore. **QWERTY** dispone i tasti come su una
     tastiera completa, **ABC** per gruppi; si può fare clic solo sui tasti che la tastiera accetta.
   - **Multimedia**, **Mouse** – sostituiscono ciò che faceva il tasto.
   - **LED** – l’illuminazione del livello; con il firmware più recente, seleziona uno dei tasti 1–16 per assegnargli
     un colore.
   - **Ritardo** – con i firmware che memorizzano le attese.
5. **Salva** scrive ciò che è cambiato, poi lo rilegge per verificare che la tastiera l’abbia accettato. **Leggi**
   recupera le impostazioni attuali dalla tastiera.

Il menu (☰) contiene **Registro dispositivo**, che mostra sotto il disegno della tastiera ogni report scritto e ogni
risposta, e **Simulatore**, che permette di provare l’app senza la tastiera in questione – l’app si comporta come se ne
fosse collegata una, con gli stessi comandi, senza che nulla passi per l’USB. Se sono collegate più tastiere
consentite, un pulsante accanto allo stato della connessione sceglie quella da aprire.

## Incorporamento

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="it"></minikeyboard-app>
```

| Attributo | |
|---|---|
| `lang` | La lingua della pagina – `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (funzionano anche le forme con la regione, come `ko-KR` o `zh-TW`). Qualsiasi altro valore dà l’inglese. Senza, quella della pagina: il `lang` dell’elemento o di un antenato, fino a `<html>`. |
| `theme` | `light` o `dark`. Senza, l’app segue la modalità scura della pagina – `data-theme` (come lo imposta Hugo FixIt), una classe `dark` o un `color-scheme` in linea su `<html>` o `<body>` – e altrimenti il sistema. |

L’app disegna in una shadow root, quindi gli stili della pagina e quelli dell’app non si mescolano; il carattere lo
prende dalla pagina. Non ha nome, icona né link propri: quelli spettano alla pagina. I testi di ogni lingua sono in un
file accanto a `minikeyboard.js`, caricato in modo relativo a esso quando viene scelta quella lingua – pubblica insieme
l’intera cartella `dist/`.

Una build propria può aggiungere qualcosa all’app: estendi `MiniKeyboardElement` da `src/app/index.ts`, restituisci un
componente Svelte da `footer()` – disegnato in fondo all’app, nei suoi colori e nella lingua che sta mostrando – e
registra la sottoclasse con `defineMiniKeyboard()`.

L’app comunica anche alla pagina ciò che succede: un evento `minikeyboard` – che risale ed esce dallo shadow root – a
ogni connessione, lettura, salvataggio, risposta alla richiesta di permesso e problema. `detail.action` è `connect`,
`read`, `save`, `access` o `problem`, con il tipo di tastiera e l’esito, ma mai ciò che è stato assegnato ai tasti.
L’app di per sé non invia nulla da nessuna parte.

## Compilazione

Node 22 o successivo.

```sh
npm install
npm run dev     # una pagina di sviluppo su http://localhost:5180
npm test        # non si tocca nessuna tastiera
npm run check   # formattazione, tipi, e che ogni strato importi solo ciò che può
npm run build   # dist/
```

## Struttura

Le regole stanno in strati i cui import puntano solo verso l’interno: `scripts/check-layers.mjs` fa fallire il
controllo quando uno strato cerca di raggiungere l’esterno.

```
src/
├── domain/        tastiere, azioni, i controlli di ogni disposizione e ciò che ogni tastiera può contenere; le porte; casi d’uso (nessun import)
├── data/          i comandi di ogni tastiera e i numeri dei suoi controlli; WebHID; tastiere simulate; ciò che il browser ricorda
├── presentation/  view model e valori che la schermata disegna – la geometria delle disposizioni, le tabelle di tasti e colori (nessun framework UI)
├── ui/            Svelte 5 – vede solo presentation; una tabella di testi per lingua (l10n/)
└── app/           <minikeyboard-app> e la composition root: l’unico punto che li vede tutti
tests/             vitest – i byte di ogni comando, le disposizioni, le modifiche, l’editor
LICENSES/          la licenza dell’icona in alto (CC BY-SA 4.0)
```

Zero avvisi è il requisito. Gli avvisi si correggono, non si disattivano.

## Limiti

- Finora la scrittura è stata provata su una sola tastiera, una `514C:8850` con dodici tasti e due manopole, in Chrome
  su macOS, Edge su Windows 11 e Chromium su Linux. Le altre tastiere vengono scritte come le scrive l’app del loro
  produttore – i comandi sono quelli delle app, byte per byte, e i test li fissano –, ma nessuna è stata ancora provata
  su una tastiera reale.
- Le tastiere che non indicano il proprio tipo non possono riferire le loro impostazioni, quindi si vede solo ciò che
  è stato impostato nell’app.
- Una tastiera alla volta.
- Lo spostamento del mouse e il trascinamento non sono disponibili.

## Licenza

MIT – vedi [LICENSE](../LICENSE). L’icona in alto: CC BY-SA 4.0 – vedi
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
