# B9 — Dependencias sin usar (estilo `depcheck`)

> Modo B · Prioridad **P2** · Sesión 136 (2026-11-10, chat nuevo, en la terminal, SIN agentes, Opus 5.5) · Estado
> **🐛 BUG** (cerrada en la 136) · Base: `704dcba`. Raíz, `functions/` y `vercel/gift-code-redeem`.

> **Resultado:** 1 hallazgo, P3, ninguno P0: `R9-553` (cuatro módulos nativos que nadie importa van en el release:
> `expo-image` con Glide, `expo-status-bar`, y `@react-native-community/slider` y `@react-native-clipboard/clipboard`,
> que están en `devDependencies` pero el autolinking de RN los enlaza igual; solo sus `.so` suman 1,4 MB en arm64).
> Dos JS sin uso que no llegan al bundle (`zod`, `@gorhom/bottom-sheet`) y tres importaciones fantasma de bajo
> riesgo, sin número. Los subproyectos, limpios.

## Cómo se midió

`_scratch/S136-B9-deps.cjs.txt`: junta los `import`/`require`/`jest.mock`/`import()` de `src/`, `app/`,
`__tests__/`, `__mocks__/`, `scripts/`, `plugins/` y los archivos de config de la raíz (935 archivos), y cuenta como
uso también el nombre en `app.json`, babel, metro, jest, eslint, `.husky/pre-commit`, el CI y los `scripts` y
`lint-staged` de `package.json`. Salidas: `S136-B9-raiz.out.txt` (los «fantasmas» de una palabra, como `luz` o
`choose`, son textos que el patrón confunde), `S136-B9-functions.out.txt`, `S136-B9-vercel-gift-code-redeem.out.txt`,
y `S136-B9-nativos.out.txt` (autolinking, merge del release y `.so` del AAB de vc74).

## Hallazgos

- **`R9-553` (P3)** — Cuatro dependencias nativas sin ningún import (0 archivos en el código, las pruebas y los
  plugins) se compilan en el release:
  - `expo-image` 57.0.2 (`package.json`, `dependencies`), con Glide 5.0.5, su `avif-integration`, el `glide-plugin`
    de animaciones y `glide-transformations` (`node_modules/expo-image/android/build.gradle:44-55`). Nunca se
    importó (`git log -S"from 'expo-image'"` sobre `src/` y `app/` no da nada; entró con `7994d5d8`, 2025-12-19).
  - `expo-status-bar` 57.0.1: nunca se importó (viene de la plantilla, `b026962d`).
  - `@react-native-community/slider` y `@react-native-clipboard/clipboard` (`devDependencies`): el autolinking de RN
    no distingue `devDependencies` (`android/build/generated/autolinking/autolinking.json` los lista) y el merge del
    release los incluye (`:react-native-community_slider`, `:react-native-clipboard_clipboard`). Su último import se
    fue en `9c3446b6` (2026-05-17, «Sprint 2 — technical health (dead code…)»): se borró el código y quedó la
    dependencia. La app copia con `expo-clipboard`.
  - **Camino:** el instalado y la descarga de Play cargan código que no hace nada. En el AAB de vc74, solo las `.so`:
    `libavif_android.so` 899 752 B, `libanimation-decoder-gif.so` 275 368 B y `libreact_codegen_RNCSlider.so`
    237 048 B en arm64 (1,4 MB; 1,0 MB más en armeabi-v7a), más las clases de Glide y de los cuatro módulos en el
    dex (sin medir). **Propuesta (sin escribir):** quitar los cuatro, con un build nativo y una pasada por las
    dos pantallas con imágenes (usan `Image` de RN: `ImageShareModal.tsx:384`, `:525`; `settings.tsx:545`).

## Sin número

- **JS sin uso, que Metro no empaqueta** (solo entra lo importado): `zod` (último import retirado en `b179d067`,
  S90 T5, 2026-06-15; por eso su major de `B7` no cuesta nada) y `@gorhom/bottom-sheet` (retirado en `7a02d578`, S90
  T3; `OfferingSheet.tsx:12-13` lo dice: «installed but unused»). Ruido en `npm outdated` y en el audit, sin daño.
- **Fantasmas** (importados sin declararse), de bajo riesgo: `@expo/config-plugins` en `plugins/with-release-signing.js:22`
  y `with-verse-widget.js:25` (llega izado desde `expo`; si npm lo anidara, el prebuild falla a la vista; Expo
  recomienda `expo/config-plugins`); `react-test-renderer`, solo de tipos, en `__tests__/ColorThemeSettings.test.tsx:20`
  (está en `overrides` y lo trae `@testing-library/react-native`); `express`, solo de tipos, en
  `functions/src/index.ts:40` (no desplegado).
- **Declarados sin import que sí hacen falta:** `react-native-screens` y `expo-linking` (pares de `expo-router`),
  `react-dom` y `react-native-web` (la versión web), `@react-native/jest-preset` (par de `jest-expo`), `@types/*`,
  `firebase-tools` (la CLI de las reglas, `B4`), y los de solo config (plugins de `app.json`, babel, husky,
  lint-staged, prettier, eslint, jest).
- **Subproyectos:** `functions/` y `vercel/gift-code-redeem` usan sus dos dependencias de runtime; `typescript`
  solo por `tsc`.

## Sin medir

- El peso en el dex de Glide y de los cuatro módulos (haría falta `bundletool` y un análisis del APK).
- Si quitar `expo-status-bar` cambia algo de la barra de estado en el arranque (no se importa, así que no debería).
