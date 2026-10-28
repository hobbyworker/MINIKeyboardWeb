<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="アプリアイコン"></p>

<h1 align="center">ブラウザ用マクロキーボード設定ツール</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <b>日本語</b> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

884xシリーズの小さなUSBマクロキーボードに、ブラウザからWebHIDでキー設定を書き込むWebコンポーネントです。インストールは必要ありません。キーとノブの操作（反時計回りに回す・押す・時計回りに回す）ごとに、レイヤー1–3にキー入力・マルチメディアキー・マウス操作を割り当て、キーボードのライティングも設定します。同じルールで作られたmacOS・Windows・Linuxアプリのブラウザ版で、同じコマンドを使います。

<p align="center"><img src="../.github/devices.png" width="560" alt="小さなUSBマクロキーボード — キー12個とノブ2つ"></p>

| キーボード | 配列 | 読み込み | 遅延 | ライティング | 実機での確認 |
|---|---|---|---|---|---|
| ベンダー`1189`または`514C`、製品`8840`・`8842`・`8830`–`8833`・`8850`・`8851`、新しいファームウェア | キーボードが知らせるとおり（26種類） | 接続時にすぐ | 入力ごと | モード1つとキー1–16の色 | 済み（`514C:8850`、キー12個・ノブ2つ） |
| 同じキーボード、旧ファームウェア | キーボードが知らせるとおり | 接続時にすぐ | キーごとに1つ | 色とモード | 未確認 |
| 同じキーボードで、種類を知らせないもの | ユーザーが選ぶ（26種類） | 不可 | なし | 色とモード | 未確認 |

いずれも、メーカーのマルチプラットフォームアプリ「MINI_KEYBOARD」が探すキーボードです。たいてい、キーとノブの数やファームウェアの種類を知らせてくるので、メーカーのアプリが描く配列をそのまま描きます。知らせてこないキーボードには、それらの配列の中からユーザーが選んだものを使います。

メーカーのWindows用設定ツール「MINI KeyBoard」が扱う`1189:8890`は、ブラウザでは扱えません。設定用インターフェイスにはOUTエンドポイントが1つしかないため、macOSとLinuxはこれをHIDデバイスにせず、ブラウザはWebページがHIDクラスのUSBインターフェイスに触れられないようにしています。このキーボードは、下のアプリで設定してください。

アプリは13の言語で表示されます：英語・韓国語・日本語・中国語（簡体字・繁体字）・ドイツ語・スペイン語・フランス語・イタリア語・ポルトガル語（ブラジル）・ポーランド語・インドネシア語・ベトナム語。アプリを置いたページの言語に従い、それ以外の言語では英語で表示されます。

このリポジトリのソースはMITライセンスです。冒頭のアイコンは紹介のために置いた画像で、MITライセンスではなくCC BY-SA 4.0です（[`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)）。このリポジトリからビルドしたアプリには含まれません。

## アプリ

MINIKeyboardには、同じルールで作られた3つのアプリもあります。対応するキーボード（`1189:8890`も）もコマンドも、13の言語も同じです。

| リポジトリ | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |

## 動作環境

このリポジトリにはソースだけがあります。リリースや公開しているページはありません。アプリはページに埋め込むカスタム要素`<minikeyboard-app>`です（[埋め込み](#埋め込み)）。バージョンごとに`web/v<バージョン>`のタグを付けます。

- Windows・macOS・LinuxのChromium系ブラウザ（Chrome・Edgeなど）。FirefoxとSafariにはWebHIDがありません。
- ページはHTTPSで、または`localhost`から開く必要があります。
- ドライバーは必要ありません。メーカーのアプリと同じく1つ目のUSBインターフェイスを通して書き込みます。その間もキーボードはいつもどおり入力できます。Linuxでは、キーボードのhidrawデバイスにudevルールが必要です。アプリの**許可する方法…**で表示します。

## 使い方

1. キーボードをUSBに差し込んで**キーボードを接続…**をクリックし、ブラウザに表示される一覧からキーボードを選びます。ブラウザはその選択をサイトごとに記憶するので、次からはアプリがキーボードを自動で開きます。アプリはキーボードに種類を問い合わせ、種類を知らせてきた場合は、すぐに設定を読み込みます。
2. 形を知らせないキーボードでは、最初に配列（メーカーのアプリの配列のいずれか）と、手前に置いた向きを決めます。アプリはこのブラウザでUSB IDごとにこれを記憶します。あとから**形…**、**回転**で変更できます。形を知らせたキーボードは回転だけができます。
3. レイヤーを選び、キーボードの図でキーやノブの操作を選びます。
4. 操作を割り当てます。
   - **キー**：修飾キーを押したままキーをクリックします。クリックするたびに入力が1つずつ追加されます。**修飾キーのみ**は、そのキーを修飾キーにします。**QWERTY**はキーをフルサイズキーボードのように、**ABC**はグループごとに並べます。クリックできるのは、キーボードが受け付けるキーだけです。
   - **マルチメディア**・**マウス**：キーにあった操作を置き換えます。
   - **LED**：レイヤーのライティングです。新しいファームウェアでは、キー1–16のいずれかを選んで色を付けます。
   - **遅延**：遅延を記憶するファームウェアで使えます。
5. **保存**で変更を書き込み、もう一度読み込んで、キーボードが書き込んだとおりに受け取ったかを確かめます。**読み込む**は、キーボードから現在の設定を取得します。

メニュー（☰）の**デバイスログ**は、キーボードに書き込んだレポートと受け取った応答をすべてキーボードの図の下に表示します。**シミュレータ**では、対象のキーボードがなくてもアプリを試せます。アプリは接続されているかのように同じコマンドで動作し、USBには何も送りません。許可したキーボードが複数接続されているときは、接続状態の横のボタンで開くキーボードを選びます。

## 埋め込み

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="ja"></minikeyboard-app>
```

| 属性 | |
|---|---|
| `lang` | ページの言語：`en`・`ko`・`ja`・`zh-hans`・`zh-hant`・`es`・`pt`・`fr`・`de`・`it`・`pl`・`id`・`vi`（`ko-KR`・`zh-TW`のような地域付きの形も使えます）。それ以外は英語です。 |
| `theme` | `light`または`dark`。指定しなければシステムに従います。 |

アプリはshadow rootに描画するため、ページのスタイルとアプリのスタイルは混ざらず、フォントはページのものを引き継ぎます。アプリには名前・アイコン・リンクがありません。それらはページが受け持ちます。言語ごとの文言は`minikeyboard.js`の隣にあるファイルで、その言語を選んだときに`minikeyboard.js`を基準にした相対パスで読み込みます。`dist/`フォルダーをまるごと一緒に配置してください。

## ビルド

Node 22以降。

```sh
npm install
npm run dev     # 開発用ページ http://localhost:5180
npm test        # キーボードには触れない
npm run check   # 書式・型のチェック、そして各レイヤーが許されたものだけをインポートしているか
npm run build   # dist/
```

## 構成

ルールはレイヤーにあります。依存関係は内側にだけ向かい、外側に手を伸ばすレイヤーがあると`scripts/check-layers.mjs`がチェックを失敗させます。

```
src/
├── domain/        キーボード・操作・配列のコントロール・キーボードごとに保持できるもの、ポート、ユースケース（インポートなし）
├── data/          キーボードごとのコマンドとコントロールの番号、WebHID、シミュレータのキーボード、ブラウザが記憶するもの
├── presentation/  ビューモデルと画面が描く値 — 配列の図形、キー・色の表（UIフレームワークなし）
├── ui/            Svelte 5 — presentationだけを参照。言語ごとの文言表（l10n/）
└── app/           <minikeyboard-app>と組み立て（composition root）— すべてを知る唯一の場所
tests/             vitest — すべてのコマンドのバイト、配列、編集、エディター
LICENSES/          冒頭のアイコンのライセンス（CC BY-SA 4.0）
```

警告ゼロが基準です。警告は抑制せずに修正します。

## 制限事項

- 書き込みはこれまで1台のキーボード、キー12個・ノブ2つの`514C:8850`を使って、macOSのChrome・Windows 11のEdge・LinuxのChromiumで確認しました。それ以外のキーボードには、メーカーのアプリと同じように書き込みます。コマンドはアプリのものとバイト単位まで同じで、テストで守っていますが、実機ではまだ確認できていません。
- 種類を知らせないキーボードは現在の設定を知らせないため、アプリで設定したものだけが表示されます。
- 一度に扱えるキーボードは1台です。
- マウスの移動とドラッグには対応していません。

## ライセンス

MIT — [LICENSE](../LICENSE)を参照してください。冒頭のアイコンはCC BY-SA 4.0 — [LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt)を参照してください。
