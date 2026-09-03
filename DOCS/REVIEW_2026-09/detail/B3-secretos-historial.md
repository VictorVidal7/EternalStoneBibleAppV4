# B3 — Escaneo de secretos en el historial de git

**Modo:** B · **Prioridad:** P0 · **Estado:** ✅ OK (con 1 💡 de limpieza: `R9-3`) ·
**Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa`

**Veredicto: ningún secreto entró nunca al historial.** Cobertura **completa** del
almacén de objetos: **5558 de 5558 blobs** escaneados, incluidos los **inalcanzables**
(no solo lo que `git log --all` ve). En un repo **público** con 1836 commits y una
limpieza de ramas de 283→6 locales / 52→3 remotas, esto era la pregunta que más
importaba, y la respuesta es limpia.

---

## Por qué se escaneó el almacén completo y no solo `git log --all`

`git log --all` recorre solo lo **alcanzable** desde las 9 refs actuales. Este repo
borró ~277 ramas locales y ~49 remotas (61ª sesión), así que hay objetos huérfanos que
siguen en `.git` y que un `git log --all` **no vería** — exactamente donde se
esconderían los restos de un commit-y-luego-borrado. De ahí el barrido con
`git cat-file --batch-all-objects`.

| Alcance                       | Objetos   |
| ----------------------------- | --------- |
| Objetos totales en el almacén | 17 224    |
| Blobs                         | 5 558     |
| Blobs escaneados              | **5 558** |
| — en lote (< 3 MB)            | 5 544     |
| — uno por uno (≥ 3 MB, 14)    | 14        |
| Commits alcanzables           | 1 836     |
| Refs                          | 9         |

## Resultados

### 1. Nombres de archivo — ningún archivo sensible se agregó jamás

`git log --all --diff-filter=A --name-only` (todas las rutas **añadidas** en toda la
historia) filtrado por `\.env|\.jks$|\.p12$|\.pem$|\.key$|keystore|secret|credential|service-account|adminsdk|^android/|token`:

**1 solo match: `src/styles/designTokens.ts`** — falso positivo por la subcadena
"token" en el nombre.

Es decir: **`android/` nunca se commiteó** (confirma la nota que dejó `B2`), y nunca
entró un `.env`, `.jks`, `.p12`, `.pem`, `.key`, `keystore*`, `secret*`,
`credential*`, `service-account*` ni `*adminsdk*`.

### 2. Contenido — la contraseña del keystore de release no existe en el almacén

El hilo concreto que heredó de `B2`. Se extrajo el valor real (31 caracteres) de
`android/app/build.gradle:109` y se buscó, sin escribirlo nunca en el ledger:

| Búsqueda                                          | Resultado     |
| ------------------------------------------------- | ------------- |
| `git log --all -S"<pw>"`                          | **0** commits |
| `git grep -l "<pw>" $(git rev-list --all)`        | **0** hits    |
| Los 5 558 blobs del almacén (incl. inalcanzables) | **0** hits    |

> Nota de método: un primer intento extrajo por error la contraseña de **debug**
> (`'android'`, 7 caracteres, línea 103) y devolvió 43 commits — todos falsos
> positivos, porque "android" es una subcadena trivial. La cifra que vale es la de la
> línea 109, el bloque `release`.

### 3. Contenido — patrones de alto valor en los 5558 blobs

| Patrón                                        | Blobs con hit          |
| --------------------------------------------- | ---------------------- |
| `<contraseña del keystore de release>`        | **0**                  |
| `-----BEGIN` (cualquier bloque de clave/cert) | **0**                  |
| `private_key`                                 | **0**                  |
| `client_email`                                | **0**                  |
| `ghp_`                                        | **0**                  |
| `AKIA`                                        | 1 → **falso positivo** |

Y por pickaxe sobre las refs alcanzables (`git log --all -S`):
`-----BEGIN PRIVATE KEY` 0 · `-----BEGIN RSA PRIVATE KEY` 0 · `github_pat_` 0 ·
`xoxb-` 0 · `sk_live_` 0 · `private_key` 0 · `client_email` 0.

**El hit de `AKIA` es un falso positivo probado.** Está solo en
`.yarn/releases/yarn-3.6.4.cjs` del commit inicial `b026962` (bundle minificado de
Yarn 3.6.4, vendorizado). Las ocurrencias reales son fragmentos —
`AKIA`, `AKIA4QI`, `AKIA9`, `AKIAE`, `AKIAI` — ninguno con la forma de una access key
de AWS, que es `AKIA` + 16 caracteres. Son subcadenas casuales dentro del JS
comprimido.

### 4. Solo ha existido **una** clave `AIza` en toda la historia

`git log --all -p | grep -ohE 'AIza[0-9A-Za-z_-]{35}' | sort -u` → **1 sola clave
distinta**, y es la misma que está hoy en `google-services.json`. O sea: no hay
claves viejas rotadas ni huérfanas expuestas en la historia (que sería el caso feo —
una clave que se cambió por haberse filtrado, pero que sigue legible en un commit
antiguo de un repo público).

### 5. Las referencias al keystore son solo **nombres**, nunca valores

`eternalbible-upload` → 1 commit · `keystore.properties` → 2 · `RELEASE_STORE_PASSWORD`
→ 1. Revisados los dos commits:

- **`9f5e672`** ("T2 (pista de código): firma de release real, permisos limpios,
  eas.json") introdujo `plugins/with-release-signing.js` (+96 líneas), `.gitignore`
  (+2), `app.json`, `eas.json`. Es justo el commit que **estableció el diseño
  correcto**: nombres de propiedad (`RELEASE_STORE_PASSWORD`) en el plugin, valores en
  el `keystore.properties` ignoreado.
- **`ea3ca06`** ("docs(research): Play Store release-readiness checklist") es un solo
  `.md` (+289). `grep -inE "storePassword|keyPassword|password\s*[:=]\s*['\"][A-Za-z0-9]{10,}"`
  sobre el commit → **sin asignaciones de valor**. Menciona los archivos por nombre.

---

## 💡 `R9-3` — 3.3 MB de artefactos de Yarn trackeados en un repo que usa npm

**Severidad: muy baja** (limpieza, no seguridad). Surgió persiguiendo el falso
positivo de `AKIA`.

Siguen trackeados hoy:

```
1 074 996 bytes  .yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs
2 231 402 bytes  .yarn/releases/yarn-3.6.4.cjs
```

**3.3 MB** de tooling vendorizado de Yarn 3.6.4, mientras el repo usa **npm**: existe
`package-lock.json`, **no** existe `yarn.lock`, y `package.json` no tiene campo
`packageManager`. Son restos de la era Yarn del commit inicial. Aparte del peso, son
la razón por la que cualquier escáner de secretos sobre este repo va a reportar un
falso positivo de `AKIA` — borrarlos limpia esa señal de ruido también. Encaja mejor
en la fila `B9` (dependencias sin usar); se registra aquí porque acá se encontró.

---

## Caveats — qué NO prueba este hallazgo

- **No se corrió un escáner de entropía** (`gitleaks`/`trufflehog` no están
  instalados). El barrido es por patrones **elegidos**: cubre las formas conocidas de
  credencial (bloques PEM, claves de AWS/GitHub/Slack/Stripe, service accounts de
  Google, la contraseña real del keystore de este proyecto), pero un secreto de una
  forma que no se anticipó podría escapar. Lo que sí es fuerte es la combinación:
  0 archivos sensibles jamás añadidos + 0 bloques `-----BEGIN` en 5558 blobs +
  1 sola clave `AIza` distinta. Un escáner de entropía sería un buen complemento
  barato si Victor quiere cerrarlo del todo.
- **Solo cubre el `.git` local.** Si alguna rama vivió únicamente en el remoto y nunca
  se fetcheó a esta copia, sus objetos no están aquí. Dado que main = origin/main y
  que la limpieza de ramas se hizo desde esta misma copia, es poco probable, pero no
  es demostrable desde aquí.
- **No se hizo `git gc`/`prune` antes ni después** — a propósito: podar habría
  **destruido** justo los objetos inalcanzables que era importante inspeccionar.

## Comandos usados

```
git rev-list --all --count                          # 1836
git log --all --diff-filter=A --name-only --pretty=format: | sort -u | grep -iE '<sensibles>'
git log --all --oneline -S'<literal>'               # pickaxe, por patrón
git grep -l '<pw>' $(git rev-list --all)
git cat-file --batch-all-objects --batch-check      # 17224 objetos / 5558 blobs
#   -> blobs <3MB por lotes de 500 vía `git cat-file --batch`, buscando cada patrón
#   -> los 14 blobs >=3MB, uno por uno con `git cat-file blob <id> | grep -c`
git log --all -p | grep -ohE 'AIza[0-9A-Za-z_-]{35}' | sort -u | wc -l   # 1
```
