<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Ikona aplikacji"></p>

<h1 align="center">Konfigurator klawiatur makro w przeglądarce</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <b>Polski</b> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Komponent webowy, który z poziomu przeglądarki, przez WebHID, zapisuje ustawienia klawiszy w małych klawiaturach
makro USB z rodziny 884x — bez instalowania czegokolwiek. Dla każdego klawisza i każdej akcji pokrętła (obrót w lewo,
naciśnięcie, obrót w prawo) ustawia na warstwach 1–3 naciśnięcia klawiszy, klawisz multimedialny lub akcję myszy, a
także podświetlenie klawiatury. To przeglądarkowy odpowiednik aplikacji na macOS, Windows i Linux opartych na tych
samych regułach; wszystkie używają tych samych poleceń.

<p align="center"><img src="../.github/devices.png" width="560" alt="Mała klawiatura makr USB: dwanaście klawiszy i dwa pokrętła"></p>

| Klawiatura | Układ | Odczyt | Opóźnienie | Podświetlenie | Sprawdzono |
|---|---|---|---|---|---|
| producent `1189` lub `514C`, produkt `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, nowsze oprogramowanie sprzętowe | według tego, co podaje klawiatura — 26 układów | od razu po podłączeniu | przed każdym naciśnięciem | tryb i kolor dla każdego z klawiszy 1–16 | tak — `514C:8850`, 12 klawiszy i 2 pokrętła |
| te same, starsze oprogramowanie sprzętowe | według tego, co podaje klawiatura | od razu po podłączeniu | jedno na klawisz | kolor i tryb | nie |
| te same, niepodające swojego typu | wybierasz go sam — 26 układów | nie | nie | kolor i tryb | nie |

To klawiatury, których szuka wieloplatformowa aplikacja producenta „MINI_KEYBOARD”. Większość z nich podaje, ile ma
klawiszy i pokręteł oraz jakie ma oprogramowanie sprzętowe, więc aplikacja rysuje taki sam układ, jaki narysowałaby
aplikacja producenta; dla klawiatury, która tego nie podaje, używa tego z tych układów, który wybierzesz.

Klawiatura `1189:8890`, z którą współpracuje windowsowe narzędzie konfiguracyjne producenta „MINI KeyBoard”, nie jest
obsługiwana w przeglądarce: jej interfejs konfiguracyjny ma tylko punkt końcowy OUT, więc macOS i Linux nie tworzą z
niego urządzenia HID, a przeglądarki nie dopuszczają stron internetowych do interfejsów USB klasy HID. Do tej
klawiatury użyj jednej z aplikacji poniżej.

Aplikacja jest dostępna w 13 językach — angielskim, koreańskim, japońskim, chińskim (uproszczonym i tradycyjnym),
niemieckim, hiszpańskim, francuskim, włoskim, portugalskim (Brazylia), polskim, indonezyjskim i wietnamskim — i używa
języka strony, w której jest osadzona. W pozostałych językach wyświetla się po angielsku.

Kod źródłowy w tym repozytorium jest objęty licencją MIT. Ikona na górze jest pokazana wyłącznie poglądowo: nie
obejmuje jej licencja MIT, lecz CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)), i nie ma
jej w kompilacjach zbudowanych z tego repozytorium.

## Aplikacje

MINIKeyboard jest też dostępny jako trzy aplikacje zbudowane według tych samych zasad — te same klawiatury (także
`1189:8890`), te same polecenia, te same 13 języków.

| Repozytorium | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |

## Gdzie działa

To repozytorium zawiera tylko kod źródłowy — nie ma tu Releases ani udostępnionej strony. Aplikacja to element
niestandardowy (custom element) `<minikeyboard-app>`, który osadza się na stronie (zobacz [Osadzanie](#osadzanie));
każda wersja ma tag `web/v<wersja>`.

- Przeglądarka oparta na Chromium — Chrome, Edge i podobne — w systemie Windows, macOS lub Linux. Firefox i Safari
  nie mają WebHID.
- Strona musi być serwowana przez HTTPS albo z `localhost`.
- Nie są potrzebne żadne sterowniki: klawiatura jest zapisywana przez swój pierwszy interfejs USB, tak jak robi to
  aplikacja producenta. W tym czasie klawiatura nadal normalnie pisze. W systemie Linux urządzenie hidraw klawiatury
  wymaga reguły udev; aplikacja pokazuje ją w **Jak zezwolić…**.

## Korzystanie

1. Podłącz klawiaturę, wybierz **Połącz klawiaturę…**, a potem klawiaturę z listy, którą pokazuje przeglądarka.
   Przeglądarka zapamiętuje ten wybór dla witryny: następnym razem aplikacja sama otworzy klawiaturę. Aplikacja pyta
   klawiaturę, czym jest; taką, która odpowie, od razu odczytuje.
2. Dla klawiatury, która nie podaje swojego kształtu, przy pierwszym podłączeniu wybierasz układ — jeden z układów
   aplikacji producenta — oraz to, jak leży przed tobą. Aplikacja zapamiętuje oba ustawienia dla danego ID USB w tej
   przeglądarce. Później zmienisz je poleceniami **Kształt…** i **Obróć**. Klawiaturę, która podała swój kształt,
   można tylko obracać.
3. Wybierz warstwę, a potem na rysunku klawiatury klawisz lub akcję pokrętła.
4. Przypisz akcję:
   - **Klawisze** — przytrzymaj modyfikatory i klikaj klawisze; każde kliknięcie dodaje jedno naciśnięcie.
     **Tylko modyfikatory** zmienia klawisz w klawisz modyfikujący. **QWERTY** rozmieszcza klawisze jak na
     pełnowymiarowej klawiaturze, a **ABC** — w grupach. Kliknąć można tylko klawisze, które klawiatura obsługuje.
   - **Multimedia**, **Mysz** — zastępują to, co robił klawisz.
   - **LED** — podświetlenie warstwy; w nowszym oprogramowaniu sprzętowym wybierz jeden z klawiszy 1–16, aby nadać mu
     kolor.
   - **Opóźnienie** — w oprogramowaniu sprzętowym, które zapamiętuje opóźnienia.
5. **Zachowaj** zapisuje zmiany, a potem odczytuje je ponownie, aby sprawdzić, czy klawiatura je przyjęła.
   **Odczytaj** pobiera bieżące ustawienia z klawiatury.

W menu (☰) są **Dziennik urządzenia**, który pod rysunkiem klawiatury pokazuje wszystkie zapisane raporty i wszystkie
odpowiedzi, oraz **Symulator**, który pozwala wypróbować aplikację bez danej klawiatury — aplikacja zachowuje się tak,
jakby klawiatura była podłączona, z tymi samymi poleceniami, bez wysyłania czegokolwiek przez USB. Gdy podłączonych
jest kilka dozwolonych klawiatur, przycisk obok stanu połączenia wybiera tę, którą otworzyć.

## Osadzanie

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="pl"></minikeyboard-app>
```

| Atrybut | |
|---|---|
| `lang` | Język strony — `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (działają też formy z regionem, takie jak `ko-KR` czy `zh-TW`). Każda inna wartość oznacza angielski. |
| `theme` | `light` lub `dark`; bez tego atrybutu aplikacja używa ustawienia systemu. |

Aplikacja rysuje w shadow root, więc style strony i aplikacji się nie mieszają; czcionkę przejmuje ze strony. Nie ma
własnej nazwy, ikony ani linków — to należy do strony. Teksty każdego języka są w pliku obok `minikeyboard.js`,
wczytywanym względem niego, gdy zostanie wybrany ten język — udostępnij cały folder `dist/` razem.

## Budowanie

Node 22 lub nowszy.

```sh
npm install
npm run dev     # strona deweloperska pod adresem http://localhost:5180
npm test        # żadna klawiatura nie jest ruszana
npm run check   # formatowanie, typy i to, czy każda warstwa importuje tylko to, co może
npm run build   # dist/
```

## Struktura

Reguły znajdują się w warstwach, których importy są skierowane tylko do środka — `scripts/check-layers.mjs` kończy
sprawdzanie błędem, gdy któraś sięga na zewnątrz.

```
src/
├── domain/        klawiatury, akcje, kontrolki każdego układu i to, co mieści każda klawiatura; porty; przypadki użycia (bez importów)
├── data/          polecenia każdej klawiatury i numeracja jej kontrolek; WebHID; symulowane klawiatury; to, co zapamiętuje przeglądarka
├── presentation/  modele widoków i wartości rysowane na ekranie — geometria układów, tabele klawiszy i kolorów (bez frameworka UI)
├── ui/            Svelte 5 — widzi tylko presentation; tabela tekstów dla każdego języka (l10n/)
└── app/           <minikeyboard-app> i composition root — jedyne miejsce, które widzi wszystkie pozostałe
tests/             vitest — bajty każdego polecenia, układy, edycje, edytor
LICENSES/          licencja ikony na górze (CC BY-SA 4.0)
```

Zero ostrzeżeń to standard. Ostrzeżenia się poprawia, a nie wyłącza.

## Ograniczenia

- Zapis sprawdzono dotąd tylko na jednej klawiaturze — `514C:8850` z dwunastoma klawiszami i dwoma pokrętłami — w
  Chrome na macOS, Edge na Windows 11 i Chromium na Linuksie. Pozostałe klawiatury są zapisywane tak, jak robi to
  aplikacja ich producenta: polecenia są bajt w bajt takie same jak w aplikacjach i pilnują ich testy, ale żadnej z
  nich nie sprawdzono jeszcze na prawdziwej klawiaturze.
- Klawiatury, które nie podają swojego typu, nie przekazują swoich bieżących ustawień, więc aplikacja pokazuje tylko
  to, co w niej ustawiono.
- Jedna klawiatura naraz.
- Nie ma akcji ruchu myszy ani przeciągania.

## Licencja

MIT — zobacz [LICENSE](../LICENSE). Ikona na górze: CC BY-SA 4.0 — zobacz
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
