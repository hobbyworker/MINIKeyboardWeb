<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Biểu tượng ứng dụng"></p>

<h1 align="center">Công cụ cấu hình bàn phím macro cho trình duyệt</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <b>Tiếng Việt</b> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Thành phần web dùng để ghi thiết lập phím vào những bàn phím macro USB cỡ nhỏ thuộc dòng 884x ngay từ trình duyệt, qua
WebHID — không cần cài đặt gì. Với từng phím và từng thao tác của núm xoay (xoay sang trái, nhấn, xoay sang phải), bạn
có thể gán thao tác nhấn phím, phím đa phương tiện hoặc tác vụ chuột cho lớp 1–3, và đặt cả đèn của bàn phím. Đây là
phiên bản trình duyệt của các ứng dụng macOS, Windows và Linux được làm theo cùng các quy tắc, và dùng cùng các lệnh.

<p align="center"><img src="../.github/devices.png" width="560" alt="Bàn phím macro USB nhỏ: 12 phím và 2 núm xoay"></p>

| Bàn phím | Bố cục | Đọc lại | Độ trễ | Đèn | Thử thực tế |
|---|---|---|---|---|---|
| nhà sản xuất `1189` hoặc `514C`, sản phẩm `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, chương trình cơ sở mới | theo thông tin bàn phím báo — 26 bố cục | ngay khi kết nối | cho từng lần nhấn | một chế độ, và màu cho từng phím 1–16 | đã thử — `514C:8850`, 12 phím, 2 núm xoay |
| cùng loại bàn phím, chương trình cơ sở cũ | theo thông tin bàn phím báo | ngay khi kết nối | mỗi phím một giá trị | màu và chế độ | chưa |
| cùng loại bàn phím, không cho biết loại | bạn tự chọn — 26 bố cục | không | không có | màu và chế độ | chưa |

Tất cả đều là những bàn phím mà ứng dụng đa nền tảng của nhà sản xuất, "MINI_KEYBOARD", tìm kiếm. Phần lớn chúng cho
biết có bao nhiêu phím, bao nhiêu núm xoay và đang chạy chương trình cơ sở nào, nên ứng dụng vẽ đúng bố cục mà ứng dụng
của nhà sản xuất vẽ; bàn phím không cho biết thì dùng bố cục bạn chọn trong số đó.

`1189:8890`, bàn phím mà công cụ cấu hình Windows của nhà sản xuất, "MINI KeyBoard", hỗ trợ, không dùng được trong
trình duyệt. Kênh cấu hình của nó chỉ có một endpoint OUT, nên macOS và Linux không tạo thiết bị HID cho nó, còn trình
duyệt thì không cho trang web chạm tới giao diện USB thuộc lớp HID. Hãy cấu hình bàn phím này bằng một trong các ứng
dụng bên dưới.

Ứng dụng có 13 ngôn ngữ — tiếng Anh, tiếng Hàn, tiếng Nhật, tiếng Trung (Giản thể và Phồn thể), tiếng Đức, tiếng Tây Ban
Nha, tiếng Pháp, tiếng Ý, tiếng Bồ Đào Nha (Brazil), tiếng Ba Lan, tiếng Indonesia và tiếng Việt. Ứng dụng theo ngôn ngữ
của trang chứa nó; với các ngôn ngữ khác, ứng dụng hiển thị bằng tiếng Anh.

Mã nguồn trong kho này được cấp phép MIT. Biểu tượng ở đầu trang chỉ để minh họa: biểu tượng này không thuộc phạm vi
giấy phép MIT mà được cấp phép CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)), và không có
trong ứng dụng được build từ kho này.

## macOS, Windows, Linux và web

MINIKeyboard có bốn phiên bản làm theo cùng quy tắc — cùng lệnh, cùng 13 ngôn ngữ. Ba ứng dụng dùng cùng các bàn phím, còn phiên bản web, chạy trong trình duyệt, dùng tất cả trừ `1189:8890`.

| Kho mã | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |
| **MINIKeyboardWeb**<br><img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white"> <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6"> <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWeb](https://github.com/hobbyworker/MINIKeyboardWeb) |

## Nơi chạy

Kho này chỉ chứa mã nguồn — ở đây không có Releases hay trang được lưu trữ sẵn. Ứng dụng là một phần tử tùy chỉnh,
`<minikeyboard-app>`, được nhúng vào trang (xem [Nhúng vào trang](#nhúng-vào-trang)); mỗi phiên bản được gắn thẻ
`web/v<phiên bản>`.

- Trình duyệt Chromium — Chrome, Edge và các trình duyệt tương tự — trên Windows, macOS hoặc Linux. Firefox và Safari
  không có WebHID.
- Trang phải được phục vụ qua HTTPS, hoặc từ `localhost`.
- Không cần trình điều khiển: bàn phím được ghi qua giao diện USB đầu tiên, giống như ứng dụng của nhà sản xuất. Trong
  lúc đó, bàn phím vẫn gõ bình thường. Trên Linux, thiết bị hidraw của bàn phím cần một quy tắc udev; ứng dụng hiển thị
  quy tắc đó trong **Cách cho phép…**.

## Cách dùng

1. Cắm bàn phím, chọn **Kết nối bàn phím…**, rồi chọn bàn phím trong danh sách trình duyệt hiển thị. Trình duyệt ghi
   nhớ lựa chọn đó theo từng trang web, nên lần sau ứng dụng tự mở bàn phím. Ứng dụng hỏi loại bàn phím; nếu bàn phím
   trả lời, thiết lập được đọc ngay.
2. Với bàn phím không cho biết hình dạng, lần đầu bạn chọn bố cục — một trong các bố cục của ứng dụng nhà sản xuất —
   cùng hướng đặt bàn phím trước mặt bạn. Ứng dụng ghi nhớ theo từng USB ID trong trình duyệt này. Sau này bạn có thể
   đổi bằng **Hình dạng…** và **Xoay**. Bàn phím đã cho biết hình dạng thì chỉ xoay được.
3. Chọn lớp, rồi chọn phím hoặc thao tác núm xoay trên hình bàn phím.
4. Gán tác vụ.
   - **Phím** — giữ phím bổ trợ, rồi nhấp vào phím. Mỗi lần nhấp thêm một lần nhấn. **Chỉ phím bổ trợ** biến phím đó
     thành phím bổ trợ. **QWERTY** xếp phím như bàn phím đầy đủ, còn **ABC** xếp theo nhóm. Chỉ nhấp được những phím mà
     bàn phím nhận.
   - **Đa phương tiện**, **Chuột** — thay thế tác vụ trước đó của phím.
   - **LED** — đèn của lớp. Với chương trình cơ sở mới, chọn một trong các phím 1–16 để đặt màu cho phím đó.
   - **Độ trễ** — trên chương trình cơ sở có ghi nhớ độ trễ.
5. **Lưu** ghi những gì đã thay đổi, rồi đọc lại để kiểm tra bàn phím đã nhận đúng. **Đọc** lấy thiết lập hiện tại từ
   bàn phím.

Trong menu (☰), **Nhật ký thiết bị** hiển thị mọi báo cáo đã ghi và mọi phản hồi nhận được ở bên dưới hình bàn phím,
còn **Trình mô phỏng** cho phép dùng thử ứng dụng mà không cần bàn phím đó — ứng dụng hoạt động như thể có bàn phím
đang được cắm vào, với cùng các lệnh, không có gì được gửi qua USB. Nếu nhiều bàn phím đã được cho phép đang được cắm,
hãy chọn bàn phím cần mở bằng nút bên cạnh trạng thái kết nối.

## Nhúng vào trang

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="vi"></minikeyboard-app>
```

| Thuộc tính | |
|---|---|
| `lang` | Ngôn ngữ của trang — `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (dạng có vùng như `ko-KR` hay `zh-TW` cũng được). Giá trị khác là tiếng Anh. |
| `theme` | `light` hoặc `dark`; nếu không có, ứng dụng theo hệ thống. |

Ứng dụng vẽ trong shadow root, nên kiểu dáng của trang và của ứng dụng không lẫn vào nhau; phông chữ thì lấy theo
trang. Ứng dụng không có tên, biểu tượng hay liên kết riêng — những thứ đó thuộc về trang. Văn bản của từng ngôn ngữ là
một tệp nằm cạnh `minikeyboard.js`, được tải theo đường dẫn tương đối với tệp đó khi ngôn ngữ ấy được chọn — hãy đưa cả
thư mục `dist/` lên cùng nhau.

## Build

Node 22 trở lên.

```sh
npm install
npm run dev     # trang phát triển tại http://localhost:5180
npm test        # không đụng đến bàn phím
npm run check   # định dạng, kiểu, và việc mỗi lớp chỉ nhập những gì được phép
npm run build   # dist/
```

## Cấu trúc

Các quy tắc nằm trong các lớp. Lệnh nhập chỉ hướng vào trong, và nếu lớp nào vươn ra ngoài, `scripts/check-layers.mjs`
sẽ làm bước kiểm tra thất bại.

```
src/
├── domain/        bàn phím, tác vụ, các nút điều khiển của từng bố cục và những gì mỗi bàn phím chứa được; port; use case (không nhập gì)
├── data/          lệnh của từng bàn phím và số hiệu các nút điều khiển; WebHID; bàn phím mô phỏng; những gì trình duyệt ghi nhớ
├── presentation/  view model và các giá trị màn hình vẽ — hình vẽ bố cục, bảng phím và màu (không có framework UI)
├── ui/            Svelte 5 — chỉ thấy presentation; bảng văn bản cho từng ngôn ngữ (l10n/)
└── app/           <minikeyboard-app> và phần lắp ráp (composition root) — nơi duy nhất biết tất cả
tests/             vitest — byte của mọi lệnh, bố cục, chỉnh sửa, trình chỉnh sửa
LICENSES/          giấy phép của biểu tượng ở đầu trang (CC BY-SA 4.0)
```

Tiêu chuẩn là không có cảnh báo nào. Cảnh báo được sửa chứ không bị tắt đi.

## Hạn chế

- Đến nay, việc ghi mới được kiểm tra trên một bàn phím là `514C:8850` có 12 phím và 2 núm xoay, trên Chrome của macOS,
  Edge của Windows 11 và Chromium của Linux. Các bàn phím còn lại được ghi đúng theo cách ứng dụng của nhà sản xuất ghi
  — các lệnh giống hệt lệnh của các ứng dụng đến từng byte và được kiểm thử giữ đúng, nhưng chưa bàn phím nào được thử
  trên thiết bị thật.
- Các bàn phím không cho biết loại không báo lại thiết lập hiện tại, nên chỉ thấy được những gì đã đặt trong ứng dụng.
- Mỗi lần chỉ một bàn phím.
- Không hỗ trợ di chuyển chuột và kéo thả.

## Giấy phép

MIT — xem [LICENSE](../LICENSE). Biểu tượng ở đầu trang: CC BY-SA 4.0 — xem
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
