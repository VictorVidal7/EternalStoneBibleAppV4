# B8 — Expo SDK 57 / RN 0.86: APIs deprecadas y `expo-doctor`

> Modo B · Prioridad **P1** · Sesión 136 (2026-11-10, chat nuevo, en la terminal, SIN agentes, Opus 5.5) · Estado
> **🐛 BUG** (cerrada en la 136) · Base: `a3676d7`.

> **Resultado:** 1 hallazgo, P3, ninguno P0: `R9-552` (el `splash` de `app.json` ya no es parte del esquema del SDK
> 57 y nadie lo lleva al build: vc74 se publicó con el splash de la plantilla de Expo, una rejilla gris con círculos
> sobre blanco). Corrige la premisa de `R9-463` («el splash es oscuro»). Las otras dos fallas de `expo-doctor` no
> llegan al usuario; 26 usos de APIs deprecadas, ninguno roto hoy; las 33 `.so` del build, alineadas a 16 KB.

## `npx --yes expo-doctor@latest` (21 checks, 3 fallan)

Salida: `_scratch/S136-B8-expo-doctor.out.txt`. `git status` limpio y los lockfiles intactos después.

1. **«Field: splash - Additional property "splash" is not allowed»** → `R9-552`.
2. **«Found duplicates for react: react@16.12.0 (at: node_modules/expensify-common/node_modules/react)»** — sin
   daño. `expensify-common` es par de `@expensify/react-native-live-markdown` y trae su React 16; la app importa
   `MarkdownTextInput` en profundidad (`NoteEditorModal.tsx:29-45`) justo para no cargar `parseExpensiMark`, el único
   que lo requiere. Medido en el bundle del AAB de vc74 (`_scratch/S136-B8-react16.out.txt`): `ExpensiMark` 0,
   `expensify-common` 0, `16.12.0` 0, `19.2.3` 1.
3. **25 parches atrasados** respecto del SDK (`expo` ~57.0.32, `react-native` 0.86.3, los `expo-*`, `jest-expo`): el
   grupo de `B7`. Los changelogs públicos (`sdk-57`) de los que tocan lo que la app usa no traen arreglos que la
   alcancen: `expo-notifications` 57.0.11..25 (Expo Go, token de push, iOS), `expo-sqlite` 57.0.2..4 (la carrera de
   `SQLiteStorage`, que la app no usa, y una sentencia preparada re-ejecutada: la app ya no prepara a mano,
   `database/index.ts:1660-1672`), `expo-router` 57.0.13..30 (drawer en RN 0.88, `Link` con paréntesis, iOS),
   `expo-image-picker` (ninguno de usuario).

## Hallazgos

- **`R9-552` (P3)** — `app.json:44-48` declara `splash` (imagen `./assets/splash-icon.png`, fondo `#001122`), pero
  el SDK 57 ya no lo lee arriba (falla del esquema de `expo-doctor`) y `expo-splash-screen` no está instalado (ni en
  `package.json` ni en `node_modules`). El prebuild del 2026-09-02 19:24 dejó los recursos de la plantilla sin tocar:
  los cinco `splashscreen_logo.png` son idénticos (sha256) a los de `node_modules/expo/template.tgz`, y
  `splashscreen_background` es `#FFFFFF` (`android/app/src/main/res/values/colors.xml`). `MainActivity` arranca con
  `Theme.App.SplashScreen`, cuyo `windowBackground` es ese PNG. El AAB de vc74 lleva los mismos cinco PNG (el mdpi,
  visto: la rejilla con círculos). **Camino:** en Android 7 a 11, cada arranque en frío muestra el marcador de la
  plantilla como ventana inicial; en Android 12 o más, la pantalla de inicio del sistema pone el ícono sobre el fondo
  por defecto del tema (no `#001122`), porque el `windowBackground` no es un color (inferido de la API, sin medir en
  el aparato). **Propuesta (sin escribir):** instalar `expo-splash-screen` con su plugin (imagen, fondo y variante
  oscura) y quitar el `splash` de arriba; es también lo que pide la propuesta de `R9-463` («sostener el splash»).
  Salida: `_scratch/S136-B8-splash.out.txt`.

## APIs deprecadas (eslint tipado de un solo uso)

`_scratch/S136-B8-eslint.config.mjs.txt` (solo `@typescript-eslint/no-deprecated`, con `tsconfig.json`; la `.mjs`
se borró): 524 archivos de `src/` y `app/`, 0 errores de análisis, 26 usos (más 9 avisos de reglas que la config
no carga, de los `eslint-disable`). Salida: `_scratch/S136-B8-deprecated.out.txt`.

- `runOnJS` × 9 (Reanimated 4: «use `scheduleOnRN` from `react-native-worklets`»): `constellation.tsx:450`, `:487`,
  `[chapter].tsx:1847`, `MiniAudioPlayer.tsx:233`, `:437`, y cuatro más. Funciona; se cae cuando Reanimated lo
  quite. Migración mecánica.
- Props de `react-native-svg`: `x`/`y` × 10 y `rotation`/`origin` × 2 («use translateX/rotate in transform»):
  `prophecies/map.tsx:312-325`, `KidsSceneCanvas.tsx:115-125`, `ShareTextureOverlay.tsx:71`, `ProgressCircle.tsx:140-141`.
- `String.prototype.substr` × 3 (`FavoritesContext.tsx:307`, `VersionComparison.ts:493`, `database/index.ts:2102`);
  y dos tipos (`TextLayoutEventData`, `MutableRefObject`): solo de tipos.
- Sin tipos: de las deprecaciones de los changelogs instalados de los `expo-*` en las 56-57 (`setStatusBarStyle`,
  `File.pickFileAsync(a, b)`, `modificationTime`, `Clipboard.setString`), la app no usa ninguna.
  `expo-file-system/legacy` (`originals-download-service.ts:20`, `version-download-service.ts:1`) sigue soportado
  en la 57, sin aviso de retiro.

## ✅ con su evidencia

- **Páginas de 16 KB** (lo que Play exige a las apps con `targetSdk` 35 o más): las 33 `.so` de
  `base/lib/arm64-v8a` del AAB de vc74 tienen todos sus `PT_LOAD` con `p_align` 0x4000
  (`_scratch/S136-B8-elf16k.cjs.txt`, salida `S136-B8-16k.out.txt`).
- `expo-doctor` pasa los otros 18 checks (config de plugins, versiones nativas, etc.).

## Sin medir

- Cómo se ve el arranque en un Android 11 y en un 14 con la app de Play (Modo C, junto con la duración de
  `R9-463`).
- El `armeabi-v7a` del AAB (32 bits: el requisito de 16 KB es para 64 bits).
