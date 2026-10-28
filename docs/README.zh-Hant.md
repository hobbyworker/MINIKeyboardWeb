<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="App 圖像"></p>

<h1 align="center">瀏覽器巨集鍵盤設定工具</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <b>繁體中文</b></p>

這是一個透過 WebHID 在瀏覽器中將按鍵設定寫入 884x 系列小型 USB 巨集鍵盤的 Web 元件，不需要安裝任何東西。可以為每個按鍵和旋鈕的動作（向左旋轉、按下、向右旋轉）在第 1–3 層設定按鍵輸入、多媒體鍵或滑鼠動作，也可以設定鍵盤的燈光。它是依相同規則打造的 macOS、Windows 和 Linux App 的瀏覽器版，使用相同的指令。

<p align="center"><img src="../.github/devices.png" width="560" alt="一台小型 USB 巨集鍵盤：12 個按鍵和 2 個旋鈕"></p>

| 鍵盤 | 佈局 | 讀取 | 延遲 | 燈光 | 實機驗證 |
|---|---|---|---|---|---|
| 廠商 `1189` 或 `514C`，產品 `8840`、`8842`、`8830`–`8833`、`8850`、`8851`，新版韌體 | 依鍵盤告知的佈局（26 種） | 連接後立即讀取 | 每個輸入 | 一種模式，以及按鍵 1–16 的顏色 | 已驗證（`514C:8850`，12 個按鍵、2 個旋鈕） |
| 同類鍵盤，舊版韌體 | 依鍵盤告知的佈局 | 連接後立即讀取 | 每個按鍵一個 | 顏色和模式 | 未驗證 |
| 同類鍵盤，不告知類型者 | 由使用者選擇（26 種） | 不支援 | 無 | 顏色和模式 | 未驗證 |

這些都是廠商的跨平台 App「MINI_KEYBOARD」會尋找的鍵盤。它們大多會告知自己有幾個按鍵和旋鈕、使用哪種韌體，因此 App 會照樣繪製廠商 App 所繪製的佈局；不告知的鍵盤則採用使用者從這些佈局中選擇的那一種。

廠商的 Windows 設定工具「MINI KeyBoard」所支援的 `1189:8890` 無法在瀏覽器中使用。它的設定介面只有一個 OUT 端點，因此 macOS 和 Linux 不會將它建立為 HID 裝置，而瀏覽器也不允許網頁存取 HID 類別的 USB 介面。請用下方的 App 設定這款鍵盤。

App 提供 13 種語言：英文、韓文、日文、中文（簡體、繁體）、德文、西班牙文、法文、義大利文、葡萄牙文（巴西）、波蘭文、印尼文和越南文。App 會依照所在頁面的語言顯示，其他語言則顯示英文。

本儲存庫的原始碼採用 MIT 授權條款。最上方的圖像僅供展示，它不採用 MIT 授權條款，而是採用 CC BY-SA 4.0 授權條款（[`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)），以本儲存庫建置的 App 也不包含它。

## App

MINIKeyboard 還有三個依相同規則製作的 App——相同的鍵盤（包括 `1189:8890`）、相同的指令、相同的 13 種語言。

| 儲存庫 | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |

## 執行環境

本儲存庫只有原始碼——這裡沒有 Releases，也沒有託管的頁面。App 是嵌入頁面的自訂元素 `<minikeyboard-app>`（請參閱[嵌入](#嵌入)），每個版本都會加上 `web/v<版本>` 標籤。

- Windows、macOS 或 Linux 上的 Chromium 系瀏覽器——Chrome、Edge 等。Firefox 和 Safari 沒有 WebHID。
- 頁面必須透過 HTTPS 或從 `localhost` 開啟。
- 不需要驅動程式：和廠商 App 一樣，透過鍵盤的第一個 USB 介面寫入。這段期間，鍵盤仍可照常輸入。在 Linux 上，鍵盤的 hidraw 裝置需要一條 udev 規則；App 會在**如何允許…**中顯示它。

## 使用方式

1. 插上鍵盤，按一下**連接鍵盤…**，然後在瀏覽器顯示的清單中選擇鍵盤。瀏覽器會依網站記住這個選擇，下次 App 會自動開啟鍵盤。App 會詢問鍵盤的類型；若鍵盤告知了類型，會立即讀取設定。
2. 對於不告知形狀的鍵盤，第一次使用時要設定佈局（廠商 App 的佈局之一）以及它擺在你面前的方向。App 會在這個瀏覽器中依 USB ID 記住這些設定。之後可以透過**形狀…**、**旋轉**變更。已告知形狀的鍵盤只能旋轉。
3. 選擇層，然後在鍵盤圖上選擇按鍵或旋鈕動作。
4. 指定動作：
   - **按鍵**：按住變更鍵再按一下按鍵，每按一下就加入一個輸入。**僅變更鍵**會將該按鍵變成變更鍵。**QWERTY** 依全尺寸鍵盤的樣子排列按鍵，**ABC** 則分組排列。只能按一下鍵盤支援的按鍵。
   - **多媒體**、**滑鼠**：取代按鍵原有的動作。
   - **LED**：該層的燈光。新版韌體可以從按鍵 1–16 中選擇一個並為它設定顏色。
   - **延遲**：適用於會記住延遲的韌體。
5. **儲存**會寫入變更的內容，然後重新讀取，確認鍵盤已依寫入的內容接收。**讀取**會從鍵盤取得目前的設定。

選單（☰）中的**裝置日誌**會在鍵盤圖下方顯示寫入鍵盤的所有報告和收到的所有回應；**模擬器**可以在沒有該鍵盤的情況下試用 App——App 會像插著鍵盤一樣，以相同的指令運作，而不會向 USB 送出任何內容。插著多個已允許的鍵盤時，可以用連線狀態旁的按鈕選擇要開啟的鍵盤。

## 嵌入

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="zh-hant"></minikeyboard-app>
```

| 屬性 | |
|---|---|
| `lang` | 頁面的語言：`en`、`ko`、`ja`、`zh-hans`、`zh-hant`、`es`、`pt`、`fr`、`de`、`it`、`pl`、`id`、`vi`（`ko-KR`、`zh-TW` 這類帶地區的形式也可以）。其他值一律為英文。 |
| `theme` | `light` 或 `dark`；未指定時跟隨系統。 |

App 在 shadow root 中繪製，因此頁面的樣式和 App 的樣式不會混在一起；字型沿用頁面的字型。App 沒有自己的名稱、圖像或連結——這些由頁面負責。各語言的文字是 `minikeyboard.js` 旁邊的檔案，選擇該語言時以 `minikeyboard.js` 為基準依相對路徑載入——請將整個 `dist/` 資料夾一起部署。

## 建置

Node 22 或以上版本。

```sh
npm install
npm run dev     # 開發頁面 http://localhost:5180
npm test        # 不會碰到鍵盤
npm run check   # 格式、型別檢查，以及每一層是否只匯入允許的內容
npm run build   # dist/
```

## 架構

規則位於各層中。相依性只指向內側，若有向外伸手的層，`scripts/check-layers.mjs` 會讓檢查失敗。

```
src/
├── domain/        鍵盤、動作、佈局的控制項、各鍵盤可儲存的內容，Port，使用案例（無匯入）
├── data/          各鍵盤的指令和控制項編號，WebHID，模擬鍵盤，瀏覽器記住的內容
├── presentation/  視圖模型和畫面繪製的值 — 佈局的圖形、按鍵和顏色表（不含 UI 框架）
├── ui/            Svelte 5 — 只看 presentation，每種語言的文字表（l10n/）
└── app/           <minikeyboard-app> 和組裝（composition root）— 唯一知道所有部分的地方
tests/             vitest — 所有指令的位元組、佈局、編輯、編輯器
LICENSES/          最上方圖像的授權條款（CC BY-SA 4.0）
```

以零警告為標準。警告要修正，而不是關閉。

## 限制

- 目前只用一台鍵盤確認過寫入：一台有 12 個按鍵、2 個旋鈕的 `514C:8850`，分別在 macOS 的 Chrome、Windows 11 的 Edge 和 Linux 的 Chromium 上。其餘鍵盤依廠商 App 的方式寫入；指令與各 App 的逐位元組相同，並由測試確保，但還沒有在實機上確認過。
- 不告知類型的鍵盤不會告知目前的設定，因此只會顯示在 App 中設定的內容。
- 一次只能使用一個鍵盤。
- 不支援滑鼠移動和拖移。

## 授權條款

MIT — 請參閱 [LICENSE](../LICENSE)。最上方的圖像採用 CC BY-SA 4.0 — 請參閱 [LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt)。
