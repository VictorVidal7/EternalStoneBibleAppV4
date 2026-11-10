# B7 — `npm outdated`: seguro / fijado / major

> Modo B · Prioridad **P1** · Sesión 136 (2026-11-10, chat nuevo, en la terminal, SIN agentes, Opus 5.5) · Estado
> **✅ OK** (cerrada en la 136) · Base: `07e69dd`. Nada instalado: `npm outdated --json` en cada proyecto, con
> `git status` limpio y los lockfiles sin tocar después de cada uno.

> **Resultado:** ningún hallazgo. Raíz: 62 atrasados (37 fijados, 18 major, 7 seguros); `functions/` (no
> desplegado, `R9-7`): 2; `vercel/gift-code-redeem`: 3 major. Ninguno bloquea la tienda ni el endpoint: la
> biblioteca de facturación del build es `billing:8.3.0` (`detail/B6`), `targetSdk` 36, y el endpoint corre en
> Node `22.x` (`vercel/gift-code-redeem/package.json:5-7`). Lo que conviene subir va en grupos que se mueven juntos
> y todos piden un build nativo.

## Cómo se clasificó

`_scratch/S136-B7-clasificar.cjs.txt` lee la salida de `npm outdated --json` y el `package.json` del proyecto.
**Fijado:** el paquete está en `node_modules/expo/bundledNativeModules.json` (la versión que espera el SDK 57,
`expo@57.0.12`), en `overrides`, o con versión exacta en `package.json`. **Major:** la `latest` sube la major (o la
menor, en `0.x`). **Seguro:** el resto. «`npm update` lo mueve» = `wanted` ≠ `current` dentro del rango declarado.
Salidas: `S136-B7-raiz.out.txt`, `S136-B7-functions.out.txt`, `S136-B7-vercel-gift-code-redeem.out.txt` (y los
`.json.txt` crudos).

## Raíz

**(a) Seguro de subir ya (dentro del rango):**

- Herramientas: `@typescript-eslint/eslint-plugin` y `parser` 8.67.0 → 8.72.2 (juntos), `firebase-tools` 15.27.0 →
  15.35.0, `sql.js` 1.14.1 → 1.16.0, `prettier` 3.9.6 → 3.9.10 (un parche de Prettier puede cambiar el formato: correr
  `format` y mirar el diff), `@react-native/jest-preset` 0.86.2 → 0.86.3 (tiene que seguir en la 0.86 de RN).
- `@expensify/react-native-live-markdown` 0.1.335 → 0.1.371: nativo y en `0.x`; lo usa el editor de notas
  (`NoteEditorModal.tsx`, `noteMarkdownRanges.ts`). Su par `react-native-worklets >=0.7.0` se cumple (0.10.1).
- `@types/react` ~19.2.18 → 19.3.0: no, aunque el script lo dé «seguro»: React está fijado en 19.2.3 por el SDK.

**Dentro del rango, pero tocan nativo o dinero (con build y prueba en el aparato):**

- El tren de parches del SDK 57: `expo` 57.0.12 → 57.0.32 y, con él, `npx expo install --fix` para los `expo-*` (22 de los 23 atrasados tienen parche en la 57)
  (p. ej. `expo-notifications` 57.0.10 → 57.0.25, `expo-router` 57.0.12 → 57.0.30, `expo-image-picker` 57.0.9 →
  57.0.21), `jest-expo`, `babel-preset-expo` y `react-native-web` 0.21.2 → 0.21.4. Es UN grupo: los rangos los
  dicta el `bundledNativeModules.json` del `expo` instalado.
- `@react-native-firebase/{app,auth,crashlytics,firestore}` 26.2.0 → 26.4.1: los cuatro con la misma versión.
- `react-native-purchases` 10.7.1 → 10.16.0: es el cobro (RevenueCat); con prueba de compra y restauración.
- `@react-native-google-signin/google-signin` 16.1.4 → 16.2.0: con un inicio de sesión de verdad (ver `R9-551`).

**(b) Fijado por el SDK 57 — no tocar:** `react`/`react-dom` 19.2.3, `react-native` 0.86.2 (latest 0.88.1),
`react-native-reanimated` 4.5.1, `react-native-worklets` 0.10.1, `react-native-gesture-handler` ~2.32.0,
`react-native-screens` ~4.26.0, `react-native-safe-area-context` ~5.7.0, `react-native-svg` 15.15.4,
`react-native-view-shot` 5.1.0, `@react-native-async-storage/async-storage` 2.2.0 (latest 3.1.1),
`@react-native-community/slider` 5.2.0, y las majors 58 de todos los `expo-*`. Se mueven con el SDK 58 (ya salió:
`expo` 58.0.23, RN 0.88), que es una migración como la de `project_essb-sdk-54-to-57-migration`.

**(c) Major, con su esfuerzo:**

- **Bloqueadas por el SDK:** `jest` 29 → 30 y `@types/jest` 30 (van con `jest-expo`, que sigue al SDK);
  `typescript` 6.0 → 7.0 (el compilador nuevo; esperar a que el SDK lo declare); `@testing-library/react-native`
  13 → 14 (pide su par de React y de jest).
- **Del lado del cobro y la cuenta, cada una con su prueba en el aparato:** `react-native-purchases` 11,
  `@react-native-firebase/*` 27, `google-signin` 17.
- **Herramientas, bajo esfuerzo:** `eslint` y `@eslint/js` 10 (juntos; ver si `eslint-plugin-react` y
  `eslint-plugin-react-native` ya lo aceptan), `lint-staged` 17, `firebase-admin` 14 (dev en la raíz).
- **`zod` 3 → 4: sin esfuerzo, porque nadie lo importa** (ver `B9`).

## `functions/` (no desplegado, `R9-7`)

Sin `node_modules`: `npm outdated` da `MISSING`; el lockfile tiene `firebase-admin` 14.2.0 y `firebase-functions`
7.3.2, y la `latest` es 14.5.0 y 7.4.0 (seguros). `engines.node` es `22`. Sin camino de daño mientras no se
despliegue.

## `vercel/gift-code-redeem` (desplegado: el canje de códigos)

`firebase-admin` 13.10.0 → 14.5.0 (major, el único de runtime: con una prueba del canje contra el endpoint, como
pedía `R9-8`), `@vercel/node` 5.10.1 → 5.10.2 dentro del rango (la `latest` es otra major) y `typescript` ~5.9 → 7
(dev). `engines.node` `22.x`.

## Sin medir

- Si Play ya anunció la próxima exigencia de versión de facturación o de `targetSdk` con fecha: no se consultó la
  página de Play (dato de conocimiento: `billing:8.3.0` y `targetSdk` 36 son las versiones recientes).
- Los changelogs de cada salto «seguro»: la clasificación es por rango, no por notas de versión.
