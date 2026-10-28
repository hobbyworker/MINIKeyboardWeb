<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Ícone do app"></p>

<h1 align="center">Configurador de teclados de macro para o navegador</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <a href="README.fr.md">Français</a> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <b>Português (Brasil)</b> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Um componente web que grava, a partir do navegador e via WebHID, as configurações das teclas em pequenos teclados de
macro USB da família 884x — sem instalar nada. Para cada tecla e cada ação de botão giratório (girar à esquerda,
pressionar, girar à direita), ele define nas camadas 1–3 toques de teclas, uma tecla multimídia ou uma ação do mouse,
além da iluminação do teclado. É a versão para o navegador dos apps para macOS, Windows e Linux feitos com as mesmas
regras, e usa os mesmos comandos.

<p align="center"><img src="../.github/devices.png" width="560" alt="Um pequeno teclado de macros USB: doze teclas e dois botões giratórios"></p>

| Teclado | Disposição | Leitura | Atraso | Iluminação | Testado |
|---|---|---|---|---|---|
| fabricante `1189` ou `514C`, produto `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, firmware novo | conforme o que o teclado informa — 26 disposições | ao conectar | antes de cada toque | um modo e uma cor para cada uma das teclas 1–16 | sim — `514C:8850`, 12 teclas e 2 botões giratórios |
| os mesmos, firmware antigo | conforme o que o teclado informa | ao conectar | um por tecla | uma cor e um modo | não |
| os mesmos, sem informar o tipo | escolhida por você — 26 disposições | não | não | uma cor e um modo | não |

São os teclados que o app multiplataforma do fabricante, “MINI_KEYBOARD”, procura. A maioria deles informa quantas
teclas e botões giratórios tem e qual firmware usa, então o app desenha a mesma disposição que o app do fabricante
desenharia; para um teclado que não informa isso, ele usa a disposição que você escolher entre essas.

O `1189:8890`, o teclado com que trabalha a ferramenta de configuração para Windows do fabricante, “MINI KeyBoard”,
não funciona no navegador: a interface de configuração dele só tem um endpoint OUT, então o macOS e o Linux não criam
um dispositivo HID para ela, e os navegadores não deixam as páginas web acessarem interfaces USB da classe HID. Para
esse teclado, use um dos apps abaixo.

O app está disponível em 13 idiomas — inglês, coreano, japonês, chinês (simplificado e tradicional), alemão,
espanhol, francês, italiano, português (Brasil), polonês, indonésio e vietnamita — e segue o idioma da página em que
está. Em qualquer outro idioma, ele aparece em inglês.

O código-fonte deste repositório está sob a licença MIT. O ícone no topo é mostrado apenas como referência: ele não
está coberto pela licença MIT, mas pela CC BY-SA 4.0 ([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)), e
as compilações deste repositório não o incluem.

## Os apps

O MINIKeyboard também existe como três apps feitos com as mesmas regras — os mesmos teclados (inclusive o
`1189:8890`), os mesmos comandos, os mesmos 13 idiomas.

| Repositório | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |

## Onde funciona

Este repositório contém só o código-fonte — aqui não há Releases nem uma página hospedada. O app é um elemento
personalizado, `<minikeyboard-app>`, que uma página incorpora (veja [Incorporação](#incorporação)); cada versão recebe
a tag `web/v<versão>`.

- Um navegador baseado no Chromium — Chrome, Edge e similares — no Windows, no macOS ou no Linux. O Firefox e o
  Safari não têm WebHID.
- A página precisa ser servida por HTTPS ou a partir de `localhost`.
- Nenhum driver: o teclado é gravado pela primeira interface USB dele, como faz o app do fabricante. Enquanto isso,
  você continua digitando normalmente com o teclado. No Linux, o dispositivo hidraw do teclado precisa de uma regra do
  udev; o app a mostra em **Como permitir…**.

## Como usar

1. Conecte o teclado, escolha **Conectar um teclado…** e depois o teclado na lista que o navegador mostra. O navegador
   guarda essa escolha para o site: da próxima vez, o app abre o teclado sozinho. O app pergunta ao teclado o que ele
   é; se ele responder, já o lê na hora.
2. Na primeira vez, para um teclado que não informa a forma, você define a disposição — uma das disposições do app
   do fabricante — e a posição em que ele fica na sua frente. O app guarda as duas coisas para aquele ID USB neste
   navegador. Depois, você pode mudá-las com **Forma…** e **Girar**. Um teclado que informou a forma só pode ser
   girado.
3. Escolha uma camada e, no desenho do teclado, uma tecla ou uma ação de botão giratório.
4. Atribua uma ação:
   - **Teclas** — segure as teclas modificadoras e clique nas teclas; cada clique adiciona um toque.
     **Só modificadoras** transforma a tecla em uma tecla modificadora. **QWERTY** dispõe as teclas como num
     teclado completo, e **ABC**, em grupos. Só é possível clicar nas teclas que o teclado aceita.
   - **Multimídia**, **Mouse** — substituem o que a tecla fazia.
   - **LED** — a iluminação da camada. No firmware novo, escolha uma das teclas 1–16 para dar uma cor a ela.
   - **Atraso** — no firmware que guarda os atrasos.
5. **Salvar** grava o que mudou e depois lê tudo de novo para conferir se o teclado recebeu. **Ler** traz a
   configuração atual do teclado.

O menu (☰) tem **Registro do Dispositivo**, que mostra abaixo do desenho do teclado todos os relatórios gravados e
todas as respostas, e **Simulador**, que permite experimentar o app sem o teclado em questão — o app age como se
houvesse um conectado, com os mesmos comandos, sem enviar nada por USB. Com vários teclados permitidos conectados, um
botão ao lado do status da conexão escolhe qual abrir.

## Incorporação

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="pt"></minikeyboard-app>
```

| Atributo | |
|---|---|
| `lang` | O idioma da página — `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (formas com região, como `ko-KR` ou `zh-TW`, também funcionam). Qualquer outro valor resulta em inglês. |
| `theme` | `light` ou `dark`; sem ele, o app segue o sistema. |

O app desenha em um shadow root, então os estilos da página e os do app não se misturam; ele usa a fonte da página.
Ele não tem nome, ícone nem links próprios — isso fica a cargo da página. Os textos de cada idioma ficam em um arquivo
ao lado de `minikeyboard.js`, carregado com caminho relativo a ele quando esse idioma é escolhido — publique a pasta
`dist/` inteira junto.

## Compilação

Node 22 ou posterior.

```sh
npm install
npm run dev     # uma página de desenvolvimento em http://localhost:5180
npm test        # nenhum teclado é tocado
npm run check   # formatação, tipos e se cada camada importa só o que pode
npm run build   # dist/
```

## Estrutura

As regras ficam em camadas cujas importações apontam só para dentro: `scripts/check-layers.mjs` faz a verificação
falhar quando uma delas tenta alcançar algo de fora.

```
src/
├── domain/        teclados, ações, os controles de cada disposição e o que cada teclado comporta; as portas; casos de uso (sem importações)
├── data/          os comandos de cada teclado e a numeração dos controles; WebHID; teclados simulados; o que o navegador guarda
├── presentation/  view models e os valores que a tela desenha — a geometria das disposições, tabelas de teclas e cores (sem framework de UI)
├── ui/            Svelte 5 — só vê presentation; uma tabela de textos por idioma (l10n/)
└── app/           <minikeyboard-app> e a composition root: o único lugar que conhece todos os outros
tests/             vitest — os bytes de cada comando, as disposições, as edições, o editor
LICENSES/          a licença do ícone no topo (CC BY-SA 4.0)
```

Zero avisos é o padrão. Avisos são corrigidos, não desativados.

## Limitações

- Até agora, a gravação só foi testada em um teclado, um `514C:8850` com doze teclas e dois botões giratórios, no
  Chrome no macOS, no Edge no Windows 11 e no Chromium no Linux. Os demais teclados são gravados como o app do
  fabricante os grava — os comandos são os dos apps, byte a byte, e os testes os fixam —, mas nenhum deles foi testado
  em um teclado real ainda.
- Os teclados que não informam o tipo não conseguem informar a configuração atual, então o app mostra só o que foi
  definido nele.
- Um teclado por vez.
- Não há ações para mover o mouse nem para arrastar.

## Licença

MIT — veja [LICENSE](../LICENSE). O ícone no topo: CC BY-SA 4.0 — veja
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
