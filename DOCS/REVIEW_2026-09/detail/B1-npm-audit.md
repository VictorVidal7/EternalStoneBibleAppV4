# B1 — `npm audit`: clasificación de las 8 vulnerabilidades

**Modo:** B (dependencias) · **Prioridad:** P0 · **Estado:** ✅ OK (con 1 ⚠️ trampa de
remediación: `R9-1`) · **Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa`

**Veredicto: 0 de las 8 vulnerabilidades es alcanzable desde código de la app.** 4 son
de una devDependency (la CLI de Firebase), 1 es de tiempo-de-build (plugins de config
de Expo), y las 3 que sí se empaquetan con la app están en una ruta de código **muerta**
— el parser de deep links vivo no las toca. **Pero** la remediación que `npm` propone
para esas 3 es un **downgrade que rompería la app entera** — ver `R9-1`.

---

## Datos crudos

`npm audit` → **8 vulnerabilidades (7 moderate, 1 high, 0 critical)** sobre 1872
dependencias (962 prod, 865 dev, 62 optional, 35 peer). Las 8 se reducen a **3 causas
raíz**; el resto son paquetes que solo "dependen de una versión vulnerable".

| Paquete                | Sev.     | Instalado | Causa raíz               | Origen                  |
| ---------------------- | -------- | --------- | ------------------------ | ----------------------- |
| `fast-uri`             | **high** | 3.1.5     | sí (4 advisories)        | `firebase-tools` (dev)  |
| `qs`                   | moderate | 6.15.3    | sí (2 advisories)        | `firebase-tools` (dev)  |
| `express`              | moderate | 4.22.2    | no — vía `qs`            | `firebase-tools` (dev)  |
| `body-parser`          | moderate | 1.20.6    | no — vía `qs`            | `firebase-tools` (dev)  |
| `@xmldom/xmldom`       | moderate | 0.8.14    | sí (1 advisory)          | `@expo/plist` (build)   |
| `decode-uri-component` | moderate | 0.2.2     | sí (1 advisory)          | `expo-router` (runtime) |
| `query-string`         | moderate | 7.1.3     | no — vía `decode-uri-c.` | `expo-router` (runtime) |
| `expo-router`          | moderate | 57.0.12   | no — vía `query-string`  | dependencia directa     |

---

## Grupo 1 — `firebase-tools` (4 de 8, incluida la única HIGH) → ⛔ no alcanzable

`npm ls` confirma que **las 4 salen exclusivamente de `firebase-tools@15.27.0`**, y
`firebase-tools` está en **`devDependencies`** (`^15.25.1`), no en `dependencies`:

```
eternalstonebibleappv4@3.2.62
`-- firebase-tools@15.27.0
  +-- ajv@8.20.0 -> fast-uri@3.1.5
  +-- express@4.22.2 -> body-parser@1.20.6 -> qs@6.15.3
  `-- exegesis@4.3.0 -> ...
```

- **Nunca entra al bundle de la app.** Es la CLI que Victor corre en su máquina para
  desplegar reglas/hosting; no hay ninguna ruta desde `src/`/`app/` hacia ella.
- Las 4 advisories de `fast-uri` (CVSS 7.5: GHSA-5jgf-p345-68v8, GHSA-f65p-4m7j-42xc,
  GHSA-fph4-wmhf-6fwf, GHSA-jqff-g426-hqxp) son **SSRF / host confusion al parsear
  URIs no confiables**. Ese modelo de amenaza es un servidor que recibe URIs de un
  atacante — no una CLI local que solo parsea los schemas de su propia API.
- `qs` (GHSA-x5fp-wj9c-mxmx CVSS 3.7, GHSA-4mjr-xmp4-gh2g CVSS 5.3) son bypass de
  `array-limit` y DoS en un parser de query-strings de Express: mismo razonamiento.

**Fix:** `npm audit fix` (sin `--force`) las arregla; `fixAvailable: true` y no es
semver-major. Seguro, pero de valor bajo — es higiene de tooling local, no de la app.

## Grupo 2 — `@xmldom/xmldom` (1 de 8) → ⛔ no alcanzable

Dos rutas, ambas de tiempo-de-build:

```
+-- @react-native-firebase/auth@26.2.0 -> @expo/plist@0.5.4 -> @xmldom/xmldom@0.8.14
`-- expo-sharing@57.0.11 -> @expo/config-plugins@57.0.7 -> xcode -> simple-plist
      -> plist@3.1.1 -> @xmldom/xmldom@0.9.11
```

GHSA-6gmq-8vp8-gcm6 es inyección de fragmento XML al **serializar**. `@expo/plist` y
`plist` solo corren durante `expo prebuild` / los config plugins, generando el
`Info.plist` de **iOS** — código que no se empaqueta en el bundle JS y que además no
toca la app de Android que es la que se publica. **Fix:** `npm audit fix`, seguro.

## Grupo 3 — `expo-router` → `query-string` → `decode-uri-component` (3 de 8) → ⚠️ se empaqueta, pero NO alcanzable

Esta es la única cadena que **sí viaja en el bundle**: `expo-router@57.0.12` es el
router de la app (todo el directorio `app/`). Aun así, el bug **no tiene disparador
vivo**. Cuatro comprobaciones, todas en la copia instalada:

1. **El parser de deep links vivo no usa `query-string`.** `link/linking.js:45`
   importa `../fork/getStateFromPath`, y ahí la llamada a `queryString.parse` está
   **comentada** dentro de un bloque `// START FORK`
   (`build/fork/getStateFromPath.js:536-546`). En su lugar,
   `getStateFromPath.js:525` llama a `expo.parseQueryParams(...)`, implementada en
   `build/fork/getStateFromPath-forks.js:370-382`, que usa
   **`parseUrlUsingCustomBase(path).searchParams`** — la API estándar
   `URL`/`URLSearchParams` — más su propio `safelyDecodeURIComponent`
   (`:40-47`), que envuelve el `decodeURIComponent` nativo en `try/catch`.
   `build/fork/getStateFromPath.js` **no tiene ningún `require("query-string")`**.
2. **La copia que sí llama `queryString.parse` está muerta.**
   `build/react-navigation/core/getStateFromPath.js:499` hace `queryString.parse(query)`,
   pero `grep -rn "core/getStateFromPath" node_modules/expo-router/build/` no devuelve
   **ningún** importador: es una copia vendorizada de react-navigation que el fork de
   Expo sustituye.
3. **El único uso vivo de `query-string` es `.stringify()`**, en
   `build/fork/getPathFromState.js:273` y `getPathFromState-forks.js:71` — construcción
   de URLs **de salida**. En `query-string@7.1.3`, `decodeComponent` se llama solo desde
   `decode()` (`index.js:231-233`), y `decode()` solo se invoca desde la ruta de
   **`parse`/`parseUrl`** (`:177-179`, `:189`, `:195`, `:328-329`, `:435`).
   `stringify` nunca lo toca.
4. **La app no los importa directamente.** `grep -rn "query-string\|decode-uri-component" src/ app/`
   → 0 resultados. En todo `node_modules`, el único consumidor de
   `decode-uri-component` es `query-string/index.js`.

### El bug de la librería sí es real (medido, para dimensionarlo)

Vale documentarlo porque si una futura versión de `expo-router` reconecta
`query-string.parse` a la ruta de deep links, esto se vuelve explotable de inmediato.

GHSA-vcc3-ghjq-m6fr ("DoS via exponential decoding of malformed percent-encoded
input", rango `<=0.4.2`). Leyendo `node_modules/decode-uri-component/index.js`, el
costo real es **cuadrático**, no exponencial: `decode()` (`:30-42`) itera sobre los `n`
tokens `%XX` y en cada iteración re-ejecuta `decodeComponents()`, que recursa con
`split=1` (profundidad `n`) → O(n²).

Medido contra la copia instalada (0.2.2), Node 24 de escritorio:

| Tokens `%C0` | Caracteres de URL | Tiempo    |
| ------------ | ----------------- | --------- |
| 100          | 300               | 241 ms    |
| 250          | 750               | 1 680 ms  |
| 500          | 1 500             | 7 090 ms  |
| 1 000        | 3 000             | 31 659 ms |

Es decir: **un query-string de ~3 KB congelaría el hilo JS ~32 s** en escritorio, y
peor en Hermes en un teléfono → ANR de Android. Reproducible con
`require('decode-uri-component')('%C0'.repeat(1000))`. **Hoy no hay ninguna ruta que
alimente ese parser con entrada del atacante en esta app** (puntos 1-4 arriba).

---

## ⚠️ `R9-1` — la remediación que propone npm es un downgrade que rompe la app

`npm audit` reporta, para las 3 filas de la cadena de `expo-router`:

```json
"fixAvailable": {"name": "expo-router", "version": "5.1.11", "isSemVerMajor": true}
```

El instalado es **`expo-router@57.0.12`** (declarado `~57.0.12`, fijado por Expo SDK
57, junto a `expo@^57.0.0` y `react-native@0.86.2`). O sea que la "corrección" de npm
es **bajar de 57.0.12 a 5.1.11** — 52 majors hacia atrás. El propio `npm audit` lo
anuncia como `Will install expo-router@5.1.11, which is a breaking change`.

**Nunca correr `npm audit fix --force` en este repo.** Rompería todo el routing.
`npm audit fix` a secas es seguro (solo toca los grupos 1 y 2) pero deja las 3 filas de
`expo-router` sin cambio — que es lo correcto, porque no son alcanzables.

**La vía de `overrides` tampoco sirve aquí, aunque el repo ya use ese patrón.**
`package.json` ya tiene 11 `overrides` (`ws`, `react-dom`, `metro`, `postcss`…), así
que el reflejo sería fijar `"decode-uri-component": "^0.5.0"` (0.5.0 es el último y
queda fuera del rango `<=0.4.2` de la advisory). **No funciona:** `0.5.0` es
**ESM-only** (`"type": "module"`, `exports: {default: "./index.js"}`), mientras que
`query-string@7.1.3` lo consume con `require('decode-uri-component')`
(`index.js:3`, paquete CJS). El override rompería el `require` bajo Metro.

**Recomendación:** dejarlo como está y no tocar nada. Se resuelve solo cuando
`expo-router` migre a `query-string` 8+/9+ (hoy fija 7.1.3; el último es 9.5.1).

---

## Caveats de este hallazgo

- Verificado contra **las copias instaladas hoy** (`expo-router@57.0.12`). El veredicto
  de no-alcanzable depende del fork de Expo; **re-verificar los puntos 1-3 en cualquier
  bump de `expo-router`**, porque el fork podría volver a usar `query-string.parse`.
- No se auditó `functions/` ni `vercel/` (proyectos Node aparte con su propio
  tooling, excluidos de `npm run validate` y de este `npm audit`). Si alguno expone un
  endpoint que parsea URIs no confiables, el razonamiento de "solo dev/CLI" **no**
  aplica ahí. **Queda como trabajo abierto** — ver la fila `B1b` del índice.
- La medición del DoS es en Node de escritorio, no en Hermes. El orden de magnitud en
  el teléfono sería peor, no mejor, pero no se midió en dispositivo.

## Comandos usados

```
npm audit ; npm audit --json
npm ls fast-uri qs express body-parser @xmldom/xmldom decode-uri-component query-string --all
npm view decode-uri-component@0.5.0 type main exports engines
grep -rn "query-string\|queryString" node_modules/expo-router/build/**/*.js
grep -rn "query-string\|decode-uri-component" src/ app/
node -e "require('decode-uri-component')('%C0'.repeat(n))"   # n = 100..1000
```
