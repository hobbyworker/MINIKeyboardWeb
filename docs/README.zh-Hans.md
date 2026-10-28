<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="应用图标"></p>

<h1 align="center">浏览器宏键盘设置工具</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <b>简体中文</b> · <a href="README.zh-Hant.md">繁體中文</a></p>

这是一个通过 WebHID 在浏览器中向 884x 系列小型 USB 宏键盘写入按键设置的 Web 组件，无需安装任何东西。对于每个按键和旋钮的动作（向左旋转、按下、向右旋转），可以在第 1–3 层设置按键输入、多媒体键或鼠标动作，还可以设置键盘的灯光。它是按同样规则打造的 macOS、Windows 和 Linux 应用的浏览器版，使用相同的命令。

<p align="center"><img src="../.github/devices.png" width="560" alt="一台小型 USB 宏键盘：12 个按键和 2 个旋钮"></p>

| 键盘 | 布局 | 读取 | 延迟 | 灯光 | 实机验证 |
|---|---|---|---|---|---|
| 厂商 `1189` 或 `514C`，产品 `8840`、`8842`、`8830`–`8833`、`8850`、`8851`，新版固件 | 按键盘告知的布局（26 种） | 连接后立即读取 | 每个输入 | 一种模式，以及按键 1–16 的颜色 | 已验证（`514C:8850`，12 个按键、2 个旋钮） |
| 同类键盘，旧版固件 | 按键盘告知的布局 | 连接后立即读取 | 每个按键一个 | 颜色和模式 | 未验证 |
| 同类键盘，不告知类型的 | 由用户选择（26 种） | 不支持 | 无 | 颜色和模式 | 未验证 |

这些都是厂商的跨平台应用“MINI_KEYBOARD”会查找的键盘。它们大多会告知自己有几个按键和旋钮、使用什么固件，因此应用会照原样绘制厂商应用所绘制的布局；不告知的键盘则采用用户从这些布局中选择的那一种。

厂商的 Windows 设置工具“MINI KeyBoard”所支持的 `1189:8890` 无法在浏览器中使用。它的设置接口只有一个 OUT 端点，因此 macOS 和 Linux 不会把它创建为 HID 设备，而浏览器也不允许网页访问 HID 类的 USB 接口。请用下方的应用设置这款键盘。

应用提供 13 种语言：英语、韩语、日语、中文（简体、繁体）、德语、西班牙语、法语、意大利语、葡萄牙语（巴西）、波兰语、印度尼西亚语和越南语。应用跟随所在页面的语言，其他语言则显示为英语。

本仓库的源代码采用 MIT 许可证。顶部的图标仅供展示，它不采用 MIT 许可证，而是采用 CC BY-SA 4.0 许可证（[`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)），用本仓库构建的应用中也不包含它。

## 应用

MINIKeyboard 还有三个按相同规则制作的应用——相同的键盘（包括 `1189:8890`）、相同的命令、相同的 13 种语言。

| 仓库 | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |

## 运行环境

本仓库只有源代码——这里没有 Releases，也没有托管的页面。应用是嵌入页面的自定义元素 `<minikeyboard-app>`（参见[嵌入](#嵌入)），每个版本都打上 `web/v<版本>` 标签。

- Windows、macOS 或 Linux 上的 Chromium 系浏览器——Chrome、Edge 等。Firefox 和 Safari 没有 WebHID。
- 页面必须通过 HTTPS 或从 `localhost` 打开。
- 无需驱动程序：与厂商应用一样，通过键盘的第一个 USB 接口写入。写入期间，键盘仍可照常输入。在 Linux 上，键盘的 hidraw 设备需要一条 udev 规则；应用会在**如何允许…**中显示它。

## 使用方法

1. 插上键盘，点击**连接键盘…**，然后在浏览器显示的列表中选择键盘。浏览器会按网站记住这一选择，下次应用会自动打开键盘。应用会询问键盘的类型；如果键盘告知了类型，会立即读取设置。
2. 对于不告知形状的键盘，首次使用时要设定布局（厂商应用的布局之一）以及它在你面前的摆放方向。应用会在此浏览器中按 USB ID 记住这些设置。之后可以通过**形状…**、**旋转**更改。已告知形状的键盘只能旋转。
3. 选择层，然后在键盘图上选择按键或旋钮动作。
4. 指定动作：
   - **按键**：按住修饰键再点击按键，每点击一次就添加一个输入。**仅修饰键**会把该按键变成修饰键。**QWERTY** 按全尺寸键盘的样子排列按键，**ABC** 则分组排列。只能点击键盘支持的按键。
   - **多媒体**、**鼠标**：替换按键原有的动作。
   - **LED**：该层的灯光。新版固件可以从按键 1–16 中选择一个并为其设置颜色。
   - **延迟**：适用于能记住延迟的固件。
5. **保存**会写入更改的内容，然后重新读取，确认键盘已按写入的内容接收。**读取**会从键盘获取当前设置。

菜单（☰）中的**设备日志**会在键盘图下方显示写入键盘的所有报告和收到的所有回复；**模拟器**可以在没有对应键盘的情况下试用应用——应用会像插着键盘一样，用同样的命令运行，而不会向 USB 发送任何内容。插着多个已允许的键盘时，可以用连接状态旁的按钮选择要打开的键盘。

## 嵌入

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="zh-hans"></minikeyboard-app>
```

| 属性 | |
|---|---|
| `lang` | 页面的语言：`en`、`ko`、`ja`、`zh-hans`、`zh-hant`、`es`、`pt`、`fr`、`de`、`it`、`pl`、`id`、`vi`（`ko-KR`、`zh-TW` 这样带地区的形式也可以）。其他值一律为英语。 |
| `theme` | `light` 或 `dark`；不指定时跟随系统。 |

应用在 shadow root 中绘制，因此页面的样式和应用的样式不会混在一起；字体沿用页面的字体。应用没有自己的名称、图标或链接——这些由页面负责。各语言的文字是 `minikeyboard.js` 旁边的文件，选择该语言时以 `minikeyboard.js` 为基准按相对路径加载——请把整个 `dist/` 文件夹一起部署。

## 构建

Node 22 或更高版本。

```sh
npm install
npm run dev     # 开发页面 http://localhost:5180
npm test        # 不会触碰键盘
npm run check   # 格式、类型检查，以及每一层是否只导入允许的内容
npm run build   # dist/
```

## 结构

规则位于各层中。依赖只指向内侧，若有向外伸手的层，`scripts/check-layers.mjs` 会让检查失败。

```
src/
├── domain/        键盘、动作、布局的控件、每种键盘能存储的内容，端口，用例（无导入）
├── data/          各键盘的命令与控件编号，WebHID，模拟键盘，浏览器记住的内容
├── presentation/  视图模型和界面绘制的值 — 布局的图形、按键和颜色表（不含 UI 框架）
├── ui/            Svelte 5 — 只看 presentation，每种语言的文字表（l10n/）
└── app/           <minikeyboard-app> 和组装（composition root）— 唯一知道所有部分的地方
tests/             vitest — 所有命令的字节、布局、编辑、编辑器
LICENSES/          顶部图标的许可证（CC BY-SA 4.0）
```

以零警告为标准。警告要修复，而不是关闭。

## 限制

- 目前只用一台键盘验证过写入：一台有 12 个按键、2 个旋钮的 `514C:8850`，分别在 macOS 的 Chrome、Windows 11 的 Edge 和 Linux 的 Chromium 上。其余键盘按厂商应用的方式写入；命令与各应用的逐字节相同，并由测试保证，但还没有在实机上验证过。
- 不告知类型的键盘不会告知当前设置，因此只会显示在应用中设定的内容。
- 一次只能使用一个键盘。
- 不支持鼠标移动和拖动。

## 许可证

MIT — 参见 [LICENSE](../LICENSE)。顶部的图标采用 CC BY-SA 4.0 — 参见 [LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt)。
