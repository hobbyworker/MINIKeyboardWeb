<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Ikon aplikasi"></p>

<h1 align="center">Alat pengatur papan ketik makro untuk browser</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <b>Bahasa Indonesia</b> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Komponen web untuk menulis pengaturan tombol ke papan ketik makro USB berukuran kecil dari keluarga 884x langsung dari
browser, melalui WebHID — tanpa perlu memasang apa pun. Untuk setiap tombol dan setiap tindakan kenop (putar ke kiri,
tekan, putar ke kanan), Anda dapat mengatur tekanan tombol, tombol multimedia, atau tindakan tetikus di lapisan 1–3,
serta pencahayaan papan ketik. Komponen ini adalah versi browser dari aplikasi macOS, Windows, dan Linux yang dibuat
dengan aturan yang sama, dan memakai perintah yang sama.

<p align="center"><img src="../.github/devices.png" width="560" alt="Papan ketik makro USB kecil: 12 tombol dan 2 kenop"></p>

| Papan ketik | Tata letak | Membaca kembali | Tunda | Pencahayaan | Diuji langsung |
|---|---|---|---|---|---|
| produsen `1189` atau `514C`, produk `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, firmware baru | sesuai yang dilaporkan papan ketik — 26 tata letak | langsung saat terhubung | per tekanan | satu mode, dan warna untuk tombol 1–16 | sudah — `514C:8850`, 12 tombol, 2 kenop |
| papan ketik yang sama, firmware lama | sesuai yang dilaporkan papan ketik | langsung saat terhubung | satu per tombol | warna dan mode | belum |
| papan ketik yang sama, tidak memberi tahu jenisnya | Anda pilih sendiri — 26 tata letak | tidak bisa | tidak ada | warna dan mode | belum |

Semuanya adalah papan ketik yang dicari oleh aplikasi lintas platform dari produsen, "MINI_KEYBOARD". Papan ketik ini
biasanya memberi tahu jumlah tombol dan kenopnya serta firmware yang dipakainya, sehingga aplikasi menggambar tata
letaknya persis seperti aplikasi produsen; papan ketik yang tidak memberi tahu memakai salah satu tata letak itu yang
Anda pilih.

`1189:8890`, papan ketik yang ditangani alat pengaturan Windows dari produsen, "MINI KeyBoard", tidak bisa diatur di
browser. Saluran konfigurasinya hanya punya satu endpoint OUT, jadi macOS dan Linux tidak menjadikannya perangkat HID,
dan browser mencegah halaman web menjangkau antarmuka USB kelas HID. Atur papan ketik ini dengan salah satu aplikasi
di bawah.

Aplikasi ini tersedia dalam 13 bahasa — Inggris, Korea, Jepang, Tionghoa (Sederhana dan Tradisional), Jerman, Spanyol,
Prancis, Italia, Portugis (Brasil), Polandia, Indonesia, dan Vietnam. Aplikasi mengikuti bahasa halaman tempatnya
berada; untuk bahasa lainnya, aplikasi tampil dalam bahasa Inggris.

Kode sumber di repositori ini berlisensi MIT. Ikon di bagian atas hanya ditampilkan sebagai gambaran: ikon itu tidak
dicakup lisensi MIT, melainkan berlisensi CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)),
dan tidak disertakan dalam aplikasi yang dibangun dari repositori ini.

## macOS, Windows, Linux, dan web

MINIKeyboard hadir dalam empat edisi yang dibuat dengan aturan yang sama — perintah yang sama, 13 bahasa yang sama. Ketiga aplikasi menangani papan ketik yang sama, dan edisi web, yang berjalan di browser, menangani semuanya kecuali `1189:8890`.

| Repositori | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |
| **MINIKeyboardWeb**<br><img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white"> <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6"> <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWeb](https://github.com/hobbyworker/MINIKeyboardWeb) |

## Tempat aplikasi ini berjalan

Repositori ini hanya berisi kode sumber — di sini tidak ada Releases maupun halaman yang di-hosting. Aplikasinya
berupa elemen kustom, `<minikeyboard-app>`, yang disematkan ke sebuah halaman (lihat [Menyematkan](#menyematkan));
setiap versi diberi tag `web/v<versi>`.

- Browser berbasis Chromium — Chrome, Edge, dan sejenisnya — di Windows, macOS, atau Linux. Firefox dan Safari tidak
  punya WebHID.
- Halaman harus disajikan melalui HTTPS, atau dari `localhost`.
- Tidak memerlukan driver: papan ketik ditulis melalui antarmuka USB pertamanya, seperti yang dilakukan aplikasi
  produsen. Selama itu, papan ketik tetap bisa dipakai mengetik seperti biasa. Di Linux, perangkat hidraw papan ketik
  memerlukan aturan udev; aplikasi menampilkannya di **Cara mengizinkan…**.

## Cara menggunakan

1. Colokkan papan ketik, pilih **Hubungkan papan ketik…**, lalu pilih papan ketik di daftar yang ditampilkan browser.
   Browser mengingat pilihan itu untuk situs tersebut, sehingga lain kali aplikasi membuka papan ketik dengan
   sendirinya. Aplikasi menanyakan jenis papan ketik; jika papan ketik itu menjawab, pengaturannya langsung dibaca.
2. Untuk papan ketik yang tidak memberi tahu bentuknya, pertama kali Anda menentukan tata letaknya — salah satu tata
   letak aplikasi produsen — serta arah posisinya di depan Anda. Aplikasi mengingatnya untuk setiap ID USB di browser
   ini. Nanti Anda bisa mengubahnya dengan **Bentuk…** dan **Putar**. Papan ketik yang sudah memberi tahu bentuknya
   hanya bisa diputar.
3. Pilih lapisan, lalu pilih tombol atau tindakan kenop pada gambar papan ketik.
4. Berikan tindakannya.
   - **Tombol** — tahan tombol pengubah, lalu klik tombol. Setiap klik menambahkan satu tekanan. **Hanya pengubah**
     menjadikan tombol itu sebagai tombol pengubah. **QWERTY** menata tombol seperti pada papan ketik ukuran penuh,
     sedangkan **ABC** menatanya per kelompok. Hanya tombol yang diterima papan ketik yang bisa diklik.
   - **Multimedia**, **Tetikus** — menggantikan tindakan tombol sebelumnya.
   - **LED** — pencahayaan lapisan. Pada firmware baru, pilih salah satu tombol 1–16 untuk memberinya warna.
   - **Tunda** — pada firmware yang menyimpan tunda.
5. **Simpan** menulis perubahan, lalu membacanya kembali untuk memeriksa bahwa papan ketik sudah menerimanya. **Baca**
   mengambil pengaturan saat ini dari papan ketik.

Menu (☰) berisi **Log Perangkat**, yang menampilkan semua laporan yang ditulis dan semua jawaban yang diterima di bawah
gambar papan ketik, serta **Simulator**, untuk mencoba aplikasi tanpa papan ketik tersebut — aplikasi bekerja
seolah-olah papan ketik itu tercolok, dengan perintah yang sama, tanpa ada yang dikirim ke USB. Jika beberapa papan
ketik yang diizinkan tercolok, pilih papan ketik yang akan dibuka dengan tombol di samping status koneksi.

## Menyematkan

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="id"></minikeyboard-app>
```

| Atribut | |
|---|---|
| `lang` | Bahasa halaman — `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (bentuk dengan wilayah seperti `ko-KR` atau `zh-TW` juga bisa). Selain itu, bahasa Inggris. |
| `theme` | `light` atau `dark`; tanpa atribut ini, aplikasi mengikuti sistem. |

Aplikasi menggambar di dalam shadow root, sehingga gaya halaman dan gaya aplikasi tidak bercampur; fonnya diambil dari
halaman. Aplikasi tidak punya nama, ikon, atau tautan sendiri — semua itu milik halaman. Teks setiap bahasa berada di
file di samping `minikeyboard.js` dan dimuat relatif terhadapnya saat bahasa itu dipilih — sajikan seluruh folder
`dist/` bersama-sama.

## Build

Node 22 atau yang lebih baru.

```sh
npm install
npm run dev     # halaman pengembangan di http://localhost:5180
npm test        # tidak ada papan ketik yang disentuh
npm run check   # format, tipe, dan bahwa setiap lapisan hanya mengimpor apa yang boleh diimpornya
npm run build   # dist/
```

## Struktur

Aturannya berada di lapisan-lapisan yang impornya hanya mengarah ke dalam — `scripts/check-layers.mjs` menggagalkan
pemeriksaan jika ada lapisan yang menjangkau ke luar.

```
src/
├── domain/        papan ketik, tindakan, kontrol setiap tata letak, dan apa yang bisa ditampung tiap papan ketik; port; use case (tanpa impor)
├── data/          perintah setiap papan ketik dan nomor kontrolnya; WebHID; papan ketik simulasi; apa yang diingat browser
├── presentation/  view model dan nilai yang digambar layar — gambar tata letak, tabel tombol dan warna (tanpa framework UI)
├── ui/            Svelte 5 — hanya melihat presentation; tabel teks per bahasa (l10n/)
└── app/           <minikeyboard-app> dan composition root — satu-satunya tempat yang mengenal semuanya
tests/             vitest — byte setiap perintah, tata letak, pengeditan, editor
LICENSES/          lisensi ikon di bagian atas (CC BY-SA 4.0)
```

Standarnya adalah nol peringatan. Peringatan diperbaiki, bukan dimatikan.

## Batasan

- Sejauh ini, penulisan baru diperiksa pada satu papan ketik, yaitu `514C:8850` dengan 12 tombol dan 2 kenop, di
  Chrome pada macOS, Edge pada Windows 11, dan Chromium pada Linux. Papan ketik lainnya ditulis persis seperti cara
  aplikasi produsennya menulis — perintahnya sama dengan milik aplikasi-aplikasi itu sampai ke byte-nya, dan tes
  menjaganya — tetapi belum ada satu pun yang diperiksa langsung pada perangkatnya.
- Papan ketik yang tidak memberi tahu jenisnya tidak melaporkan pengaturan saat ini, jadi yang terlihat hanya apa yang
  diatur di aplikasi.
- Hanya satu papan ketik dalam satu waktu.
- Gerakan dan seret tetikus tidak tersedia.

## Lisensi

MIT — lihat [LICENSE](../LICENSE). Ikon di bagian atas: CC BY-SA 4.0 — lihat
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
