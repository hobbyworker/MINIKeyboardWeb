<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Icono de la app"></p>

<h1 align="center">Configurador de teclados de macros para el navegador</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <b>Español</b> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Un componente web que escribe la configuración de las teclas en pequeños teclados de macros USB de la familia 884x
desde el navegador, a través de WebHID, sin instalar nada. Para cada tecla y cada acción de un botón giratorio (girar
a la izquierda, pulsar, girar a la derecha), define en las capas 1–3 pulsaciones de teclas, una tecla multimedia o una
acción del ratón, y también la iluminación del teclado. Es la versión para el navegador de las apps para macOS,
Windows y Linux creadas con las mismas reglas, y usa los mismos comandos.

<p align="center"><img src="../.github/devices.png" width="560" alt="Un pequeño teclado de macros USB: doce teclas y dos botones giratorios"></p>

| Teclado | Disposición | Lectura | Demora | Iluminación | Probado |
|---|---|---|---|---|---|
| fabricante `1189` o `514C`, producto `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, firmware nuevo | según lo que indica el teclado — 26 disposiciones | al conectarlo | antes de cada pulsación | un modo y un color para cada una de las teclas 1–16 | sí — `514C:8850`, 12 teclas y 2 botones giratorios |
| los mismos, firmware antiguo | según lo que indica el teclado | al conectarlo | una por tecla | un color y un modo | no |
| los mismos, sin indicar su tipo | la eliges tú — 26 disposiciones | no | no | un color y un modo | no |

Son los teclados que busca la app multiplataforma del fabricante, “MINI_KEYBOARD”. La mayoría indican cuántas teclas
y botones giratorios tienen y qué firmware usan, así que la app dibuja la misma disposición que dibujaría la app del
fabricante; si un teclado no lo indica, usa la que elijas entre esas disposiciones.

El `1189:8890`, el teclado con el que trabaja la herramienta de configuración para Windows del fabricante,
“MINI KeyBoard”, no se puede usar en el navegador: su interfaz de configuración solo tiene un endpoint OUT, así que
macOS y Linux no crean un dispositivo HID para ella, y los navegadores no dejan que las páginas web accedan a las
interfaces USB de clase HID. Para ese teclado, usa una de las apps de abajo.

La app está disponible en 13 idiomas: inglés, coreano, japonés, chino (simplificado y tradicional), alemán, español,
francés, italiano, portugués (Brasil), polaco, indonesio y vietnamita. Sigue el idioma de la página en la que está;
en cualquier otro idioma, aparece en inglés.

El código fuente de este repositorio tiene licencia MIT. El icono de arriba se muestra solo como referencia: no está
cubierto por la licencia MIT, sino por CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)), y
las compilaciones de este repositorio no lo incluyen.

## macOS, Windows, Linux y la web

MINIKeyboard tiene cuatro ediciones hechas con las mismas reglas: los mismos comandos y los mismos 13 idiomas. Las tres apps admiten los mismos teclados, y la edición web, que funciona en el navegador, todos menos el `1189:8890`.

| Repositorio | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |
| **MINIKeyboardWeb**<br><img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white"> <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6"> <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWeb](https://github.com/hobbyworker/MINIKeyboardWeb) |

## Dónde funciona

Este repositorio contiene solo el código fuente: aquí no hay Releases ni una página alojada. La app es un elemento
personalizado, `<minikeyboard-app>`, que una página inserta (consulta [Integración](#integración)); cada versión lleva
la etiqueta `web/v<versión>`.

- Un navegador basado en Chromium —Chrome, Edge y similares— en Windows, macOS o Linux. Firefox y Safari no tienen
  WebHID.
- La página debe servirse por HTTPS o desde `localhost`.
- No hace falta ningún controlador: el teclado se escribe a través de su primera interfaz USB, como hace la app del
  fabricante. Mientras tanto, puedes seguir escribiendo con el teclado como siempre. En Linux, el dispositivo hidraw
  del teclado necesita una regla de udev; la app la muestra en **Cómo permitirlo…**.

## Uso

1. Conecta el teclado, elige **Conectar un teclado…** y luego el teclado en la lista que muestra el navegador. El
   navegador recuerda esa elección para el sitio: la próxima vez, la app abre el teclado por sí sola. La app le
   pregunta al teclado qué teclado es; si responde, lo lee enseguida.
2. Si un teclado no indica su forma, la primera vez eliges su disposición —una de las de la app del fabricante— y
   cómo está colocado delante de ti. La app recuerda ambas cosas para ese ID USB en este navegador. Más adelante
   puedes cambiarlas con **Forma…** y **Girar**. Un teclado que indica su forma solo se puede girar.
3. Elige una capa y, en el dibujo del teclado, una tecla o una acción de un botón giratorio.
4. Asígnale una acción:
   - **Teclas** — mantén pulsadas las teclas de modificación y haz clic en las teclas; cada clic añade una
     pulsación. **Solo modificadores** convierte la tecla en una tecla de modificación. **QWERTY** coloca las teclas
     como en un teclado completo y **ABC**, por grupos. Solo puedes hacer clic en las teclas que admite el teclado.
   - **Multimedia**, **Ratón** — sustituyen lo que hacía la tecla.
   - **LED** — la iluminación de la capa. En el firmware nuevo, elige una de las teclas 1–16 para darle un color.
   - **Demora** — en el firmware que guarda las demoras.
5. **Guardar** escribe lo que ha cambiado y después lo vuelve a leer para comprobar que el teclado lo ha recibido.
   **Leer** trae la configuración actual del teclado.

El menú (☰) tiene **Registro del dispositivo**, que muestra debajo del dibujo del teclado todos los informes escritos
y todas las respuestas, y **Simulador**, que permite probar la app sin el teclado en cuestión: la app actúa como si
hubiera uno conectado, con los mismos comandos y sin enviar nada por USB. Si hay varios teclados permitidos
conectados, un botón junto al estado de la conexión elige cuál abrir.

## Integración

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="es"></minikeyboard-app>
```

| Atributo | |
|---|---|
| `lang` | El idioma de la página: `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (también sirven las formas con región, como `ko-KR` o `zh-TW`). Con cualquier otro, la app aparece en inglés. |
| `theme` | `light` o `dark`; sin él, la app sigue al sistema. |

La app dibuja en un shadow root, así que los estilos de la página y los de la app no se mezclan; toma la fuente de la
página. No tiene nombre, icono ni enlaces propios: eso le corresponde a la página. Los textos de cada idioma están en
un archivo junto a `minikeyboard.js`, que se carga con una ruta relativa a él cuando se elige ese idioma, así que
sirve toda la carpeta `dist/` junta.

## Compilación

Node 22 o posterior.

```sh
npm install
npm run dev     # una página de desarrollo en http://localhost:5180
npm test        # no se toca ningún teclado
npm run check   # formato, tipos y que cada capa importe solo lo que puede
npm run build   # dist/
```

## Estructura

Las reglas están en capas cuyas importaciones apuntan solo hacia dentro: `scripts/check-layers.mjs` hace fallar la
comprobación cuando una capa intenta alcanzar algo de fuera.

```
src/
├── domain/        teclados, acciones, los controles de cada disposición y lo que admite cada teclado; puertos; casos de uso (sin importaciones)
├── data/          los comandos de cada teclado y la numeración de sus controles; WebHID; teclados simulados; lo que recuerda el navegador
├── presentation/  modelos de vista y los valores que dibuja la pantalla — la geometría de las disposiciones, tablas de teclas y colores (sin framework de UI)
├── ui/            Svelte 5 — solo ve presentation; una tabla de textos por idioma (l10n/)
└── app/           <minikeyboard-app> y la raíz de composición (composition root): el único lugar que los ve todos
tests/             vitest — los bytes de cada comando, las disposiciones, las ediciones, el editor
LICENSES/          la licencia del icono de arriba (CC BY-SA 4.0)
```

El objetivo es cero advertencias. Las advertencias se corrigen, no se desactivan.

## Limitaciones

- Hasta ahora, la escritura solo se ha probado en un teclado: un `514C:8850` con doce teclas y dos botones
  giratorios, en Chrome en macOS, Edge en Windows 11 y Chromium en Linux. Los demás teclados se escriben tal como lo
  hace la app de su fabricante —los comandos son los de las apps, byte a byte, y las pruebas los fijan—, pero todavía
  no se ha comprobado ninguno con un teclado real.
- Los teclados que no indican su tipo no pueden informar de su configuración, así que la app solo muestra lo que se
  ha definido en ella.
- Un teclado cada vez.
- No hay acciones para mover el ratón ni para arrastrar.

## Licencia

MIT — consulta [LICENSE](../LICENSE). El icono de arriba: CC BY-SA 4.0 — consulta
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
