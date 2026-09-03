# B1b — `npm audit` en `functions/` y `vercel/` (proyectos Node aparte)

**Modo:** B · **Prioridad:** P0 · **Estado:** ⚠️ DUDA/PARCIAL (1 ⚠️ `R9-7`, 1 💡 `R9-8`)
· **Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa`

Esta fila no venía en el charter; salió de `B1`, que excluyó explícitamente estos dos
directorios. **Importa más que la raíz**: son código de **servidor en producción** con
un **service account de Firebase**, así que el razonamiento de "es solo tooling local"
que cerró `B1` **no aplica de entrada** aquí — hay que verificar caso por caso.

**Veredicto:** 26 vulnerabilidades entre los dos (8 + 18, incluidas **7 HIGH**), y aun
así **ninguna alcanzable en el runtime desplegado**. Pero se encontraron dos cosas
sustantivas que no son vulnerabilidades: **`functions/` es código muerto que duplica la
lógica de dinero** (`R9-7`), y falta replicar en los subproyectos un `override` que la
raíz ya tiene (`R9-8`).

---

## Contexto: solo UNO de los dos backends está vivo

`src/lib/offering/giftCodeService.ts:44` apunta a
**`https://essb-gift-redeem.vercel.app/api/redeem`**. O sea, el backend real es el de
Vercel.

`git log -- functions/` tiene **un solo commit** (`ca69aca`, "feat: gift-code
redemption (Cloud Function + admin script + in-app UI)"), y después
`c3650f0` **"port redemption endpoint to Vercel's free tier"** lo reemplazó. Cloud
Functions requiere plan Blaze; el proyecto está en **Spark**. `functions/` no tiene ni
`node_modules` instalado.

## `functions/` — 8 moderate, 0 high · ⛔ moot (nunca se desplegó)

| Raíz   | Sev.     | Origen                                                       |
| ------ | -------- | ------------------------------------------------------------ |
| `qs`   | moderate | `firebase-functions@7.3.2` → `express@5.2.1` → `body-parser` |
| `uuid` | moderate | `firebase-admin` (misma cadena que abajo)                    |

Ambas son dependencias de **runtime**, no de dev — o sea que si esto se desplegara,
serían reales. No se despliega. Las mismas 2 advisories que en `B1`
(GHSA-x5fp-wj9c-mxmx, GHSA-4mjr-xmp4-gh2g) y la de `uuid` de abajo.

## `vercel/gift-code-redeem` — 18 vulns (11 moderate, **7 high**)

Este **sí** está desplegado. La clave está en que `@vercel/node` es una
**devDependency** (`devDependencies: @vercel/node, typescript`), y en Vercel el
builder real corre del lado del servidor: el lambda desplegado solo empaqueta lo que
la función importa de verdad.

### Las 7 HIGH y 4 moderate: todas de `@vercel/node@5.10.1` (dev) → ⛔ no desplegado

`npm ls` de cada una termina en el mismo sitio:

| Raíz                   | Sev.     | Cadena desde `@vercel/node@5.10.1`                                                                            |
| ---------------------- | -------- | ------------------------------------------------------------------------------------------------------------- |
| `undici@5.28.4`        | **high** | directo (14 advisories: smuggling, CRLF, DoS de WebSocket…)                                                   |
| `minimatch`            | **high** | `@vercel/build-utils` → `@vercel/python-analysis`; `@vercel/nft` → `glob@13`; `ts-morph` → `@ts-morph/common` |
| `path-to-regexp@6.1.0` | **high** | directo                                                                                                       |
| `js-yaml@4.1.1`        | **high** | `@vercel/build-utils` → `@vercel/python-analysis`                                                             |
| `ajv@8.6.3`            | moderate | `@vercel/static-config`                                                                                       |
| `smol-toml@1.5.2`      | moderate | `@vercel/build-utils` → `@vercel/python-analysis`                                                             |

Son el servidor de `vercel dev` local y el tooling de análisis/build
(`build-utils`, `python-analysis`, `nft`, `ts-morph`, `static-config`). Nada de eso
viaja al lambda. `undici` merece una aclaración porque es el caso donde uno se
confundiría: la función usa `fetch` global de Node, que va contra el **undici embebido
en el runtime de Node** (se parchea subiendo Node, no por npm), **no** contra este
`undici@5.28.4` de `node_modules` — que solo se cargaría si algo lo hiciera `require`
explícitamente, y nada lo hace.

### La única de runtime desplegado: `uuid@9.0.1` → ⚠️ no alcanzable, pero arreglable

```
firebase-admin@13.10.0
  +-- @google-cloud/firestore@7.11.6 -> google-gax@4.6.1 -> uuid@9.0.1
  `-- @google-cloud/storage@7.22.0  -> gaxios@6.7.1     -> uuid@9.0.1 (deduped)
                                     -> teeny-request@9.0.0 -> uuid@9.0.1 (deduped)
```

GHSA-w5hq-g745-h8pq, "**Missing buffer bounds check in v3/v5/v6 when `buf` is
provided**", cvss 7.5, rango `<11.1.1`.

**No es alcanzable:** la advisory afecta solo a `v3`/`v5`/`v6` **y** solo cuando se
pasa el argumento opcional `buf`. `google-gax`, `gaxios` y `teeny-request` usan
`uuid.v4()` para IDs de petición — `v4` no está en la lista de funciones afectadas, y
no hay ninguna ruta donde la app influya en un `buf`.

**La misma trampa de `R9-1`, otra vez:** el fix que propone npm es
`fixAvailable: {"name":"firebase-admin","version":"10.3.0","isSemVerMajor":true}` —
un **downgrade** de `13.10.0` a `10.3.0`. Además de romper la API, revertiría a mano
el commit `d97516b` ("pin firebase-admin to 13.x, avoiding a broken jose/jwks-rsa ESM
chain"), que existe justamente porque las versiones viejas rompían. **No correr
`npm audit fix --force` acá tampoco.**

---

## ✅ `R9-7` — `functions/` no desplegado duplica la lógica de dinero, y `firebase.json` todavía lo declara

> **RESUELTO 2026-09-03, después de escribir este detalle.** Al revisar el objetivo
> antes de borrarlo apareció un dato que a este hallazgo le faltaba:
> `src/lib/offering/giftCodeService.ts` ya documenta que `functions/` está
> **deliberadamente sin desplegar** porque Cloud Functions exige plan **Blaze**, que
> pasa el proyecto Firebase **entero** a facturación con sobrecosto (Vercel Hobby
> tiene tope duro). O sea que "código muerto" era correcto sobre el despliegue pero
> incompleto sobre la intención. Se resolvió **conservando** el código: se quitó la
> sección `functions` de `firebase.json` (mata la trampa de despliegue) y se agregó
> `functions/README.md` etiquetándolo. Ver `R9-7` en `BUGS.md` para el detalle.
> **Lección de método:** un hallazgo de "código muerto" tiene que buscar la
> justificación de por qué sigue ahí antes de recomendar borrarlo — acá estaba a un
> `grep` de distancia, en el archivo que consume el endpoint.

**Severidad: baja-media** (riesgo de mantenimiento en una ruta P0, no un bug hoy).

`functions/src/index.ts` implementa el canje de gift-codes **completo y en paralelo**
al de Vercel: los dos leen `db.collection('giftCodes').doc(code)`
(`functions/src/index.ts:204` vs `vercel/…/api/redeem.ts:159`) y los dos llaman a
RevenueCat con la clave secreta. Pero la app solo llama al de Vercel, y `functions/`
no se ha tocado desde su commit inicial.

Dos consecuencias concretas:

1. **Deriva silenciosa en una ruta de dinero.** Si un arreglo de canje (validación,
   idempotencia, manejo de un código ya usado) se aplica en Vercel, la copia de
   `functions/` queda atrás sin que nada lo señale. Es la peor clase de duplicado:
   dos implementaciones del mismo gate de pago, una de ellas invisible.
2. **`firebase.json` sigue declarando el codebase** —
   `"functions": [{"source": "functions", "predeploy": ["npm --prefix … run build"]}]`.
   Un `firebase deploy` a secas (sin `--only hosting`) intentaría desplegarlo. En
   plan Spark lo más probable es que falle en vez de publicar silenciosamente, pero es
   una trampa innecesaria en la ruta de despliegue.

**Repro:** `git log --oneline -- functions/` → 1 commit; `grep -n 'vercel.app' src/lib/offering/giftCodeService.ts:44` → apunta a Vercel; `functions/node_modules` no existe.

**Opciones (ninguna aplicada):** borrar `functions/` y su sección de `firebase.json`;
o, si se quiere conservar como plan B por si Vercel falla, dejarlo pero con un
`README` que diga explícitamente que **no** está desplegado y que la fuente de verdad
es `vercel/gift-code-redeem`. Es decisión de Victor — hay un argumento real para
conservar un fallback en otra nube.

## 💡 `R9-8` — replicar en los subproyectos el `override` de `uuid` que la raíz ya tiene

**Severidad: baja.** Cierra la única vuln de runtime desplegado, sin tocar
`firebase-admin`.

El `package.json` de la **raíz** ya trae `"overrides": {… "uuid": "^11.1.1" …}` —
alguien ya resolvió exactamente esta advisory ahí. Los dos subproyectos **no** tienen
ese override, así que arrastran `uuid@9.0.1`.

**Y esta vez el override sí funciona** (a diferencia de `decode-uri-component@0.5.0`
en `R9-1`, que era ESM-puro): `uuid@11.1.1` declara `"type": "module"` **pero trae
build dual** con condiciones de `exports` — `node.require → ./dist/cjs/index.js`. Los
consumidores CJS (`google-gax`, `gaxios`, `teeny-request`) resuelven al build CJS sin
problema. La prueba empírica más fuerte: **la raíz ya corre `uuid@11.1.1` instalado
por ese mismo override y `npm run validate` pasa**.

**Arreglo sugerido (no aplicado):** añadir `"overrides": {"uuid": "^11.1.1"}` a
`vercel/gift-code-redeem/package.json` (y a `functions/package.json` si se decide
conservarlo por `R9-7`), regenerar el lockfile, y **verificar el canje contra el
endpoint desplegado** antes de darlo por bueno.

---

## Caveats

- **No se ejecutó nada de esto.** Los audits se corrieron con
  `--package-lock-only` (`functions/` no tiene `node_modules`), así que reflejan el
  lockfile, no un árbol instalado. Para el propósito — clasificar qué vuln existe y de
  dónde viene — es la fuente correcta.
- **El veredicto "`@vercel/node` no llega al lambda" es razonamiento sobre el modelo de
  build de Vercel, no una inspección del bundle desplegado.** Es sólido (es una
  devDependency y el builder corre del lado de Vercel), pero la confirmación fuerte
  sería inspeccionar el bundle real de la función desplegada. No se hizo.
- La recomendación de `R9-8` **no se probó contra el endpoint en vivo**. `uuid@11` es
  dual-build y la raíz ya lo corre, pero un cambio en la ruta de dinero merece una
  prueba de canje real antes de considerarse cerrado.
- No se auditaron licencias ni dependencias sin usar de estos subproyectos — eso es
  alcance de `B9`/`B10`, que hoy solo contemplan la raíz. **Vale extenderlas.**

## Comandos usados

```
(cd functions && npm audit --json --package-lock-only)
(cd vercel/gift-code-redeem && npm audit --json --package-lock-only)
npm ls <pkg> --package-lock-only --all       # en cada subproyecto, por cada raíz
npm view uuid@11.1.1 type main exports
grep -n 'vercel.app' src/lib/offering/giftCodeService.ts
git log --oneline -- functions/ ; git log --oneline -- vercel/
```
