# Sesión 178 — tanda V6: CI y repo

2026-11-24. Opus 5.5 de principal, sin agentes, sin emulador. Código en `fix/s178` (`324d98a8` y `36d63241`, este
solo comentarios); docs en `docs/review-s178`. Partida: main = origin/main = `e732c20f` (la 176 y la 177 mergeadas).

Cerrados: `R9-107` (P1), `R9-2`, `R9-5` y `R9-6` (P2). Al cerrar: **270 abiertos de 627** (0 P0, 1 P1, 84 P2, 184 P3
y un aviso), validador en 0 avisos y 0 errores. `NODE_ENV=development npm run validate`: verde, 437 suites, 5182
pruebas (lint: los 82 warnings de main, 0 de los archivos nuevos).

Lo del workflow (`R9-5`, `R9-6`) solo se mide en el CI real **después del merge** (receta del CI, solo GET).

## 1. `R9-107` — qué job corre node, leído de los datos

**Reproducción:** las 12 formas de la entrada, como `it.each` sobre el escáner real (un job `smoke` con `npm test` y
sin `setup-node`), más un cuarto job pegado al `ci.yml` real con el `run:` en la línea siguiente. Con el escáner de
`main` caen las 13: `jobsRunningNode` sale vacío o sin `smoke`.

**Arreglo:** `scanWorkflowSource` (`__tests__/ciNodeVersion.test.ts`) lee el archivo con `yaml` y recorre
`jobs.*.steps[*]`. Dos opciones a propósito, cada una con su prueba:

- `schema: 'failsafe'`: todo escalar queda como el TEXTO escrito. El esquema por defecto lee `22.10` como el número
  22.1 (medido con una sonda). Sin ella caen 2 (el pin sin comillas y el de `22.10`).
- `merge: true`: se sigue un `<<:`, así que los pasos heredados se ven; leer más que GitHub es el lado seguro de esta
  compuerta. Sin ella cae 1.

Lo que no puede convertir se reporta: YAML inválido (incluido un alias a un ancla que no existe: `toJS` tira y se
atrapa), un job o un paso que no es un mapa, un `with:` que no es mapa, un pin que no es escalar.

**El revert por pieza** (el escáner viejo de `HEAD` con las pruebas nuevas, `_scratch/S178-revert.cjs.txt`): caen 17,
por la razón correcta; restaurado, `cmp` igual.

**Una prueba vieja cambió de expectativa:** «REPORTS a job-level line it cannot name» (`<<: *shared` sin ancla) pedía
el mensaje «cannot read a job name» y que `good` siguiera contado. Con el parser el archivo entero es YAML inválido:
se reporta y no da jobs, así que además cae el piso por archivo. Es más ruidoso, no menos. Se sumó la contraria: un
`<<:` con ancla definida hace ver los pasos heredados.

**Dependencia:** `yaml` pasa a devDependency directa (`^2.9.0`). Ya estaba instalada, 2.9.0, como transitiva de
`expo` (metro-config), `lint-staged` y `firebase-tools`. El lockfile cambia en DOS líneas (la raíz), editadas a mano:
`npm install -D yaml` reescribía 861 líneas, quitaba 35 paquetes y subía `yaml` a 2.9.1, así que se revirtió.
`npm ci --legacy-peer-deps` acepta el lockfile editado. (De paso: la raíz del lockfile dice `3.2.61` y no lleva
`engines`, a diferencia de `package.json`; `npm ci` lo tolera y no se tocó.)

**Entorno:** la suite lleva `@jest-environment node`: `jest-expo` resuelve con condiciones de navegador y `yaml`
cargaba su build ESM (`Cannot use import statement outside a module`).

**Vecinos:** nadie más importa `scanWorkflowSource` ni `nodePinClaims` (`grep`). Las aserciones sobre el repo
(todo job con node tiene pin, ningún pin bajo el piso, las afirmaciones en prosa) siguen verdes con el parser, y
también con el `ci.yml` editado por `R9-5` y `R9-6`: el control de un cambio BUENO a la superficie.

## 2. `R9-2` — `.env*` en la raíz

**Medido antes de proponer:**

- Versionado hoy: de lo sensible, solo `google-services.json` (la configuración Android de Firebase; `app.json:60`
  la usa y su clave es pública por diseño, `detail/B2-secretos-arbol.md`). Ningún `.env*`.
- Historial (2425 commits, todas las ramas): ningún archivo `.env*`, keystore ni service account; el único nombre
  sensible es `google-services.json`. Un pickaxe por `PRIVATE KEY`, `"private_key"` y `sk_…` da un solo commit
  (`2f32aa99`), que es el doc de B3 nombrando el patrón.
- En disco: `keystore.properties`, `keystores/eternalbible-upload.jks` y `android/` ya están ignorados;
  `vercel/gift-code-redeem/.env.local` lo ignora su propio `.gitignore`. Ningún `.env` en el árbol.

**Arreglo:** `.env*.local` → `.env*`, con su comentario. Con la regla nueva, `git ls-files -ci --exclude-standard`
sale vacío: nada versionado queda ignorado. Sin `!.env.example`: no existe y no hace falta decidirlo hoy.

**Prueba:** `__tests__/gitignoreSecrets.test.ts` le pregunta a git (`check-ignore -q --no-index`; un estado distinto
de 0 y 1 tira). Sin el arreglo caen exactamente las cuatro que nombra la entrada (`.env`, `.env.production`,
`scripts/.env`, `src/.env`). El control: `app.json`, `package.json`, `src/index.ts` y `environment.ts` no se ignoran.

Nada de lo de Victor se borró, se movió ni se des-versionó. No hizo falta preguntar nada.

## 3. `R9-5` — el job que no puede fallar

**Medido:** `npm audit --audit-level=moderate` sale **1** hoy: 62 avisos (1 low, 30 moderate, 29 high, 2 critical).
Con `--omit=dev`, 28 (7 moderate, 20 high, 1 critical), y sale 1 en `moderate`, `high` y `critical`; en Expo
`dependencies` sigue contando el CLI y el servidor de desarrollo, y no se midió qué entra al bundle. Quitar el
`continue-on-error` (la primera opción de la entrada) dejaría el CI rojo hasta una remediación: eso es `R9-1`, una
sesión propia (`npm audit fix` a secas, nunca `--force`). La nota va en la entrada de `R9-1`.

**Arreglo, la segunda opción:** el job pasa a «Dependency Report (non-blocking)» y sus pasos a «npm audit (report
only)» y «npm outdated (report only)», con un comentario que dice por qué. `main` no está protegida y no tiene checks
requeridos (`GET /repos/…/branches/main`, público): renombrar no traba nada. Nada en el repo consume el nombre viejo
(la receta del CI imprime el que venga).

**Prueba:** `__tests__/ciWorkflowHonesty.test.ts`, `nonBlockingMisnamed`: un paso con `continue-on-error: true` (o
un job con él) tiene que decir «report» en su nombre, y su job también. Sondas: lo marca, lo acepta con los nombres
nuevos, no exige nada a un paso que sí puede fallar (`false` o una expresión), y cuenta el `continue-on-error` del
job. Sobre el `ci.yml` de `main` da `job security`, `security step 3` y `security step 5`; revertido solo el nombre
del job, cae solo esa prueba.

## 4. `R9-6` — permisos y la acción de terceros

**Arreglo:** `permissions: contents: read` a nivel de workflow (ningún job pushea, comenta ni publica; el default del
repo ya era `read`, así que no cambia el comportamiento: lo deja escrito). `codecov/codecov-action@v4` →
`@b9fd7d16f6d7d1b5d2bec1a2887e65ceed900238 # v4.6.0`: `git ls-remote` dice que `refs/tags/v4` apunta a ese commit,
el mismo que `v4.6.0^{}`. Corre el mismo código. Quitar o no el step es `R9-118` (§8), que no entra.

**Prueba:** `permissionProblems` (sin bloque arriba, un `write` o un `write-all` en cualquier nivel) y
`unpinnedThirdPartyActions` (toda acción que no sea de `actions/` ni `github/`, ni local ni `docker://`, con sha de 40;
también un workflow reutilizable a nivel de job), cada una con sus sondas y un piso de que el bucle llegó a comparar.
Revertida cada pieza sola (`_scratch`, `sed` sobre una copia del `ci.yml` arreglado), cae su prueba y solo la suya.

## 5. Para después del merge

- El CI real (`_scratch/S116-ci.sh.txt <sha>`): los tres jobs verdes, el tercero con su nombre nuevo, y Codecov
  corriendo desde el sha (en el log, la línea `Download action repository 'codecov/codecov-action@b9fd7d16…'`).
- `R9-1`: la remediación de dependencias, si Victor la quiere como sesión propia.

Sondas de la sesión en `_scratch/` (`S178-yaml-probe.cjs.txt`, `S178-revert.cjs.txt`, `S178-scanner.ts.txt`,
`S178-splice.cjs.txt`, `S178-marcas.cjs.txt`); ninguna quedó en `__tests__/`.
