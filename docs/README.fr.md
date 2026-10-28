<p align="center"><img src="../.github/icon.png" width="128" height="128" alt="Icône de l’app"></p>

<h1 align="center">Configurateur de claviers macro pour le navigateur</h1>

<p align="center">
  <img alt="Chrome · Edge" src="https://img.shields.io/badge/Chrome%20·%20Edge-WebHID-4285F4?logo=googlechrome&logoColor=white">
  <img alt="Windows · macOS · Linux" src="https://img.shields.io/badge/Windows%20·%20macOS%20·%20Linux-5E5CE6">
  <img alt="TypeScript · Svelte 5" src="https://img.shields.io/badge/TypeScript-Svelte%205-3178C6?logo=typescript&logoColor=white">
  <a href="../LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"></a>
</p>

<p align="center"><a href="../README.md">English</a> · <a href="README.ko.md">한국어</a> · <a href="README.de.md">Deutsch</a> · <a href="README.es.md">Español</a> · <b>Français</b> · <a href="README.id.md">Bahasa Indonesia</a> · <a href="README.it.md">Italiano</a> · <a href="README.ja.md">日本語</a> · <a href="README.pl.md">Polski</a> · <a href="README.pt-BR.md">Português (Brasil)</a> · <a href="README.vi.md">Tiếng Việt</a> · <a href="README.zh-Hans.md">简体中文</a> · <a href="README.zh-Hant.md">繁體中文</a></p>

Un composant web qui écrit, depuis le navigateur et via WebHID, les réglages des touches sur de petits claviers macro
USB de la famille 884x – sans rien installer. Pour chaque action d’une touche ou d’un bouton rotatif (rotation à
gauche, appui, rotation à droite), il définit sur les couches 1 à 3 des frappes, une touche multimédia ou une action
de la souris, ainsi que l’éclairage du clavier. C’est la version navigateur des apps macOS, Windows et Linux
construites selon les mêmes règles, et il utilise les mêmes commandes.

<p align="center"><img src="../.github/devices.png" width="560" alt="Un petit clavier de macros USB : douze touches et deux boutons rotatifs"></p>

| Clavier | Disposition | Lecture | Délai | Éclairage | Testé |
|---|---|---|---|---|---|
| fabricant `1189` ou `514C`, produit `8840` · `8842` · `8830`–`8833` · `8850` · `8851`, programme interne récent | selon ce qu’indique le clavier – 26 dispositions | dès la connexion | avant chaque frappe | un mode, et une couleur pour chacune des touches 1–16 | oui – `514C:8850`, 12 touches et 2 boutons rotatifs |
| les mêmes, ancien programme interne | selon ce qu’indique le clavier | dès la connexion | un par touche | une couleur et un mode | non |
| les mêmes, sans indiquer leur type | choisie par vous – 26 dispositions | non | aucun | une couleur et un mode | non |

Ce sont les claviers que recherche l’app multiplateforme du fabricant, « MINI_KEYBOARD ». La plupart indiquent combien
de touches et de boutons rotatifs ils possèdent et quel programme interne ils exécutent : l’app dessine alors la
disposition que dessinerait l’app du fabricant. Un clavier qui ne l’indique pas reçoit celle de ces dispositions que
vous choisissez.

Le `1189:8890`, le clavier de l’outil Windows du fabricant, « MINI KeyBoard », n’est pas pris en charge dans le
navigateur : son interface de configuration n’a qu’un point de terminaison OUT, si bien que macOS et Linux n’en font
pas un périphérique HID, et les navigateurs tiennent les pages web à l’écart des interfaces USB de classe HID. Pour ce
clavier, utilisez l’une des apps ci-dessous.

L’app est disponible en 13 langues – anglais, coréen, japonais, chinois (simplifié et traditionnel), allemand,
espagnol, français, italien, portugais (Brésil), polonais, indonésien et vietnamien – et suit la langue de la page dans
laquelle elle se trouve. Dans les autres langues, elle s’affiche en anglais.

Le code source de ce dépôt est sous licence MIT. L’icône en haut de la page n’est présentée qu’à titre d’illustration :
elle n’est pas couverte par la licence MIT mais par la licence CC BY-SA 4.0
([`LICENSES/CC-BY-SA-4.0.txt`](../LICENSES/CC-BY-SA-4.0.txt)), et n’est pas incluse dans les compilations issues de ce
dépôt.

## Les apps

MINIKeyboard existe aussi sous forme de trois apps construites sur les mêmes règles – les mêmes claviers, le
`1189:8890` compris, les mêmes commandes, les mêmes 13 langues.

| Dépôt | GitHub |
|---|---|
| **MINIKeyboardApple**<br><img alt="macOS 14+" src="https://img.shields.io/badge/macOS-14%2B-0A84FF?logo=apple&logoColor=white"> <img alt="Universal: Apple Silicon + Intel" src="https://img.shields.io/badge/Universal-Apple%20Silicon%20%2B%20Intel-5E5CE6"> <img alt="Swift 6" src="https://img.shields.io/badge/Swift-6-F05138?logo=swift&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardApple](https://github.com/hobbyworker/MINIKeyboardApple) |
| **MINIKeyboardWin**<br><img alt="Windows 10 (2004)+ · 11" src="https://img.shields.io/badge/Windows-10%20(2004)%2B%20·%2011-0078D4?logo=windows&logoColor=white"> <img alt="x64 · ARM64" src="https://img.shields.io/badge/x64%20·%20ARM64-5E5CE6"> <img alt=".NET 10 · WinUI 3" src="https://img.shields.io/badge/.NET%2010-WinUI%203-512BD4?logo=dotnet&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardWin](https://github.com/hobbyworker/MINIKeyboardWin) |
| **MINIKeyboardLinux**<br><img alt="Linux" src="https://img.shields.io/badge/Linux-GTK%204%20·%20libadwaita-4A86CF?logo=linux&logoColor=white"> <img alt="Flatpak: x86_64 · aarch64" src="https://img.shields.io/badge/Flatpak-x86__64%20·%20aarch64-4A90D9?logo=flatpak&logoColor=white"> <img alt="Rust" src="https://img.shields.io/badge/Rust-2024-B7410E?logo=rust&logoColor=white"> <img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-yellow"> | [github.com/hobbyworker/MINIKeyboardLinux](https://github.com/hobbyworker/MINIKeyboardLinux) |

## Où il fonctionne

Ce dépôt ne contient que le code source – il n’y a ici ni Releases ni page hébergée. L’app est un élément
personnalisé, `<minikeyboard-app>`, qu’une page intègre (voir [Intégration](#intégration)) ; chaque version est
étiquetée `web/v<version>`.

- Un navigateur Chromium – Chrome, Edge et consorts – sous Windows, macOS ou Linux. Firefox et Safari n’ont pas
  WebHID.
- La page doit être servie en HTTPS, ou depuis `localhost`.
- Aucun pilote : le clavier est écrit via sa première interface USB, comme le fait l’app du fabricant. Pendant ce
  temps, le clavier continue de saisir normalement. Sous Linux, le périphérique hidraw du clavier nécessite une règle
  udev ; l’app l’affiche sous **Comment autoriser…**.

## Utilisation

1. Branchez le clavier, choisissez **Connecter un clavier…**, puis le clavier dans la liste qu’affiche le navigateur.
   Le navigateur retient ce choix pour le site : la fois suivante, l’app ouvre le clavier d’elle-même. L’app demande au
   clavier ce qu’il est ; s’il répond, il est lu aussitôt.
2. Pour un clavier qui n’indique pas sa forme, vous choisissez la première fois sa disposition – l’une des
   dispositions de l’app du fabricant – et son orientation devant vous. L’app retient les deux pour cet ID USB dans ce
   navigateur. **Forme…** et **Faire pivoter** permettent de les modifier par la suite ; un clavier qui a indiqué sa
   forme peut seulement pivoter.
3. Choisissez une couche, puis la touche ou l’action du bouton rotatif sur le clavier.
4. Attribuez-lui une action :
   - **Touches** – maintenez des touches de modification, puis cliquez sur des touches ; chaque clic ajoute une
     frappe. **Modificateurs seuls** fait de la touche une touche de modification. **QWERTY** dispose les touches
     comme sur un clavier complet, **ABC** par groupes ; seules les touches que le clavier accepte peuvent être
     cliquées.
   - **Multimédia**, **Souris** – remplacent ce que faisait la touche.
   - **LED** – l’éclairage de la couche ; avec un programme interne récent, sélectionnez l’une des touches 1–16 pour
     lui donner une couleur.
   - **Délai** – avec un programme interne qui conserve les attentes.
5. **Enregistrer** écrit ce qui a changé, puis le relit pour vérifier que le clavier l’a bien pris en compte. **Lire**
   récupère les réglages actuels du clavier.

Le menu (☰) contient **Journal de l’appareil**, qui affiche sous le dessin du clavier chaque rapport écrit et chaque
réponse, et **Simulateur**, qui permet d’essayer l’app sans le clavier concerné – l’app se comporte comme si un clavier
était branché, avec les mêmes commandes, sans que rien ne parte vers l’USB. Si plusieurs claviers autorisés sont
branchés, un bouton à côté de l’état de la connexion permet de choisir celui à ouvrir.

## Intégration

```html
<script type="module" src="/path/to/minikeyboard.js"></script>
<minikeyboard-app lang="fr"></minikeyboard-app>
```

| Attribut | |
|---|---|
| `lang` | La langue de la page – `en`, `ko`, `ja`, `zh-hans`, `zh-hant`, `es`, `pt`, `fr`, `de`, `it`, `pl`, `id`, `vi` (les formes avec région comme `ko-KR` ou `zh-TW` fonctionnent aussi). Toute autre valeur donne l’anglais. |
| `theme` | `light` ou `dark` ; sans lui, l’app suit le système. |

L’app dessine dans une shadow root, si bien que les styles de la page et ceux de l’app ne se mélangent pas ; elle
reprend la police de la page. Elle n’a ni nom, ni icône, ni liens à elle – ceux-ci appartiennent à la page. Les textes
de chaque langue se trouvent dans un fichier à côté de `minikeyboard.js`, chargé relativement à celui-ci quand cette
langue est choisie – servez tout le dossier `dist/` ensemble.

## Compilation

Node 22 ou plus récent.

```sh
npm install
npm run dev     # une page de développement sur http://localhost:5180
npm test        # aucun clavier n’est touché
npm run check   # formatage, types, et que chaque couche n’importe que ce qu’elle a le droit d’importer
npm run build   # dist/
```

## Structure

Les règles se trouvent dans des couches dont les importations pointent uniquement vers l’intérieur –
`scripts/check-layers.mjs` fait échouer la vérification quand l’une d’elles cherche à atteindre l’extérieur.

```
src/
├── domain/        claviers, actions, les contrôles de chaque disposition et ce que chaque clavier peut contenir ; les ports ; cas d’utilisation (aucune importation)
├── data/          les commandes de chaque clavier et les numéros de ses contrôles ; WebHID ; claviers simulés ; ce que retient le navigateur
├── presentation/  modèles de vue et valeurs que dessine l’écran – la géométrie des dispositions, les tables de touches et de couleurs (sans framework d’interface)
├── ui/            Svelte 5 – ne voit que presentation ; une table de textes par langue (l10n/)
└── app/           <minikeyboard-app> et la racine de composition : le seul endroit qui les voit tous
tests/             vitest – les octets de chaque commande, les dispositions, les modifications, l’éditeur
LICENSES/          la licence de l’icône en haut de la page (CC BY-SA 4.0)
```

Zéro avertissement : c’est la règle. Les avertissements sont corrigés, pas désactivés.

## Limites

- L’écriture n’a été essayée jusqu’ici que sur un seul clavier, un `514C:8850` à douze touches et deux boutons
  rotatifs, dans Chrome sous macOS, Edge sous Windows 11 et Chromium sous Linux. Les autres claviers sont écrits comme
  l’app de leur fabricant les écrit – les commandes sont celles des apps, octet pour octet, et des tests les figent –,
  mais aucun n’a encore été essayé sur un vrai clavier.
- Les claviers qui n’indiquent pas leur type ne peuvent pas communiquer leurs réglages ; seuls ceux définis dans l’app
  sont donc affichés.
- Un seul clavier à la fois.
- Le déplacement de la souris et le glissement ne sont pas proposés.

## Licence

MIT – voir [LICENSE](../LICENSE). L’icône en haut de la page : CC BY-SA 4.0 – voir
[LICENSES/CC-BY-SA-4.0.txt](../LICENSES/CC-BY-SA-4.0.txt).
