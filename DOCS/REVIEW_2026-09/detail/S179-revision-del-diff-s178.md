# Sesión 179 — revisión del diff de la 178 (tanda V6: `R9-107`, `R9-2`, `R9-5`, `R9-6`)

> Sin agentes, sin emulador (es CI y repo). Opus 5.5 principal, esfuerzo high. Sin cambios de código. Revisado
> `e732c20f..36d63241` sobre main; docs en `docs/review-s179`.

## 1. Estado de partida

main = origin/main = `eb0945a6` (la punta de `docs/review-s178`, encima de `36d63241` y `324d98a8`): Victor mergeó y
pusheó. `git status` limpio. Calza con el primer caso del mensaje.

## 2. Veredicto

**Los cuatro arreglos se sostienen.** El CI real los confirma, y cada pieza revertida sola hace caer su prueba y solo
la suya. **Cinco hallazgos nuevos, todos P3**, ninguno causado por la 178: son los vecinos de los casos que cerraron
sus compuertas. Dos son anteriores a la 178, medido con el escáner viejo. Además, una suma a `R9-118`. Al cerrar:
**275 abiertos de 632** (0 P0, 1 P1, 84 P2, 189 P3 y un aviso).

Sondas: `_scratch/S179-sondas.test.ts.txt` (las funciones reales, importadas de las dos suites; 55 casos). Se
corrió copiada a `__tests__/` y se borró de ahí. La salida con el código de la 178 está en `S179-sondas.out.json`,
y con el escáner viejo en `S179-sondas-viejo.out.json`. El revert por pieza está en `S179-revert.cjs.txt` (salida en
`S179-revert.out.txt`) y el escáner viejo en `S179-revert-viejo.cjs.txt`.

## 3. Punto por punto

**1. El CI real de `eb0945a6`** (run `45530938894`, `push`, intento 1; `_scratch/S179-ci.cjs.txt`, solo GET, el
log entero de cada job en `_scratch/S179-ci/`):

- Los tres jobs verdes: «Lint & Type Check», «Run Tests» y **«Dependency Report (non-blocking)»**, con sus pasos
  «npm audit (report only)» y «npm outdated (report only)».
- `permissions` aceptado: ningún error de workflow, y los tres jobs dicen `GITHUB_TOKEN Permissions: Contents: read,
Metadata: read`.
- Codecov: `Download action repository 'codecov/codecov-action@b9fd7d16f6d7d1b5d2bec1a2887e65ceed900238'`.
- Jest en CI: 437 suites y 5182 pruebas, las tres suites nuevas en `PASS`.
- `npm audit` en el job: 61 avisos (1 low, 29 moderate, 29 high, 2 critical), sale 1 y el paso queda verde por su
  `continue-on-error`. Es lo que el nombre nuevo dice.
- `npm ci --legacy-peer-deps` acepta el lockfile editado a mano en los tres jobs (punto 3).
- **Lo que el sha no fija** (suma a `R9-118`): la acción v4.6.0 baja el CLI de `https://cli.codecov.io/latest/…`
  (verifica la firma GPG de Codecov y el SHASUM, pero es `latest`), y el log sigue diciendo «_Branch `main` is
  protected but no token was provided_». Esta vez termina en «_queued for processing_»; no se midió si Codecov lo
  procesó (es la §8).
- Fuera del diff: npm 11.19.1 del runner avisa que `@firebase/util`, `protobufjs` y `re2` tienen scripts de
  instalación «not yet covered by allowScripts». Las pruebas pasan; va como nota para la sesión de `R9-1`, sin
  entrada.

**2. `R9-107`: el escáner con `yaml`.** Sondas sobre `scanWorkflowSource` real:

- **Lo leen bien:** un `run: |` con líneas de comentario de shell; un job entero que es alias de otro (`b: *j`): ve
  sus pasos y su pin, y si el original no tiene pin, faltan los dos; un job con `container: node:20` y `npm test`
  sin `setup-node` (sale sin pin); un `<<:` a nivel de `jobs:` que mete un job entero (sale sin pin); un `<<:` con
  `steps` propios (ganan los propios, como dice YAML); claves duplicadas, en un paso o en dos jobs (el archivo se
  reporta como YAML inválido); una bomba de alias (se reporta, `maxAliasCount`); un `node-version:` vacío (se
  reporta). `.yaml` además de `.yml`: las dos suites filtran `/\.ya?ml$/`.
- **Al revés, lo que antes leía y ahora reporta distinto:**
  - Un `run: |` cuyo comentario de shell dice «npm» cuenta como job que corre node: es un falso positivo, ruidoso y
    del lado seguro.
  - Las claves duplicadas: el escáner viejo daba `jobs: ['lint', 'lint']` y un segundo `lint` con `npm test` sin pin
    pasaba cubierto por el primero. Ahora es YAML inválido. Es mejor que antes.
- **`failsafe` en las comparaciones:** `whyInsufficient` recibe texto, así que `24.0` → `'24.0'` (pasa) y `22.10`
  sigue siendo `22.10`. Con `node-version: ~`, el texto `'~'` entra como pin y `whyInsufficient` lo rechaza («not a
  numeric version»), así que es ruidoso. `nodePinClaims` lee prosa con su regex, no YAML: no cambia. **Donde sí
  cambia algo es en la otra suite** (`R9-628`, punto 5).
- **La prueba del `<<: *shared` que cambió de expectativa sigue protegiendo:** un alias a un ancla que no existe hace
  que `toJS` tire, y el archivo sale con `jobs: []` y un `unreadable`. Ningún paso hereda el pin de otro job. El caso
  textual de `R9-99` (`bad: # comment`) conserva su propia prueba. Revertido el `throw` de `doc.errors`, esta prueba
  sigue verde porque la cubre el `throw` de `toJS`; cae la del YAML inválido, que es la que corresponde.
- **No los ve, y ya no los veía antes** (con el escáner viejo da lo mismo):
  - `R9-631`: «corre node» se decide por el texto del `run:` con `\b(npm|npx|node|yarn|pnpm)\b`. Quedan fuera
    `shell: node {0}` (en el paso o en `defaults.run`) y `./node_modules/.bin/jest`, porque `\bnode\b` no casa con
    `node_modules`.
  - `R9-632`: un pin es cualquier `with.node-version`, de cualquier acción y en cualquier orden.
- El revert del escáner entero (el de `324d98a8~1`, con las pruebas de hoy): **caen 17, como en la 178.**
  Restaurado con `git checkout`.

**3. `yaml` como devDependency.**

- El lockfile editado a mano es el que acepta `npm ci` en el CI: lo confirma el punto 1. La raíz del lockfile pide
  `^2.9.0` y `node_modules/yaml` es 2.9.0.
- `@jest-environment node` no cambia nada más de esas suites. `fs`, `__dirname` y `readdirSync({recursive: true})`
  responden igual: el detector de prosa llega a comparar (su piso `checked >= 1` está en verde en CI). `jest.setup.js`
  corre en ese entorno sin quejarse, y no hay `__mocks__/fs`.

**4. `R9-2`: `.env*`.**

- `git check-ignore -v --no-index`: ahora también se ignoran `.env.example`, `.envrc`, `.environment/x.ts` y
  `.env.d.ts`. Nada de eso existe ni está versionado, y `git ls-files -ci --exclude-standard` sigue vacío.
- Un `.env.example` futuro necesitará `!.env.example`. La 178 lo decidió así y no se anota.
- Expo y EAS: `eas.json` no tiene `env` ni hay `.easignore`. La única `EXPO_PUBLIC_*` del código
  (`EXPO_PUBLIC_WEB_PACKS_BASE_URL`, en `data-loader.web.ts` y `redLetterText.web.ts`) tiene valor por defecto y se
  usa a mano para verificar en local. Ningún build lee un `.env` que el `.gitignore` le esconda ahora.

**5. `R9-5` y `R9-6`.** Sondas sobre las funciones reales:

- `nonBlockingMisnamed`:
  - Ve `true`, `"true"` y `'true'`.
  - **No ve `True` ni `TRUE`**: con `failsafe` quedan como texto distinto de `'true'`, cuando el esquema core de YAML
    1.2 los lee como booleanos (sondeado: `YAML.parse('x: True')` → `true`).
  - Tampoco ve `${{ true }}` ni `run: npm audit || true`: un paso llamado «Run npm audit» dentro de «Security Audit»
    pasa. Es `R9-628`. Que GitHub acepte `True` no se midió (habría que pushear).
  - Al revés, **un job de pruebas con UN paso que solo reporta tiene que llamarse «report»**: se marca `job test`.
    Es `R9-629`.
- `permissionProblems`:
  - Marca un `write` por job aunque el bloque de arriba sea `read`, y también `id-token: write`, `write-all` arriba o
    por job, y `permissions:` vacío.
  - Acepta `{}` y `read-all`.
  - `contents: Write` (mayúscula) pasa, pero GitHub tampoco lo acepta como valor; no se anota.
- `unpinnedThirdPartyActions`:
  - Marca `Codecov/…@v4`, un sha corto, `actions-rs/…` (el prefijo exige la barra) y un sha en mayúsculas (lado
    seguro).
  - **Exime `docker://someone/image:latest`** y no mira `container:` ni `services:` (`checked: 0`). Sin embargo, la
    cabecera de la suite dice «every action not published by GitHub itself is pinned». Es `R9-630`. Hoy no hay
    ninguna.
- El sha de Codecov, otra vez con `git ls-remote` (solo lectura): `refs/tags/v4` = `b9fd7d16…` y
  `refs/tags/v4.6.0^{}` = `b9fd7d16…` (`v4.6.0` es un tag anotado, `0f8570b1`). Es el de `v4.6.0`.

## 4. El revert por pieza, otra vez (`_scratch/S179-revert.cjs.txt`, las tres suites, cada pieza sola)

| Pieza revertida                                  | Caen | Cuáles                                                |
| ------------------------------------------------ | ---- | ----------------------------------------------------- |
| `R9-107` sin `failsafe`                          | 2    | el pin sin comillas, `22.10`                          |
| `R9-107` sin `merge`                             | 1    | el `<<:` que se resuelve                              |
| `R9-107` sin el `throw` de `doc.errors`          | 1    | el YAML inválido                                      |
| `R9-107` sin `isMap(step)` / sin `isMap(body)`   | 1    | «a step or job that is not a mapping»                 |
| `R9-107`, el escáner viejo entero                | 17   | (como en la 178)                                      |
| `R9-2`, `.env*` → `.env*.local`                  | 4    | `.env`, `.env.production`, `scripts/.env`, `src/.env` |
| `R9-5`, el nombre del job / el del paso de audit | 1    | «nothing that cannot fail is named as if it could»    |
| `R9-5` sin `cannotFail(job)`                     | 1    | «a job-level continue-on-error counts as well»        |
| `R9-6` sin `permissions:` / Codecov en `@v4`     | 1    | la suya, sobre el `ci.yml` real                       |
| `R9-6` sin el chequeo por job / sin `job.uses`   | 1    | la sonda de permisos / la de acciones                 |

Restaurado cada archivo, los bytes son iguales.

## 5. Para después

- Los cinco P3 nuevos son de pruebas y de CI: según la §4, no abren tanda y se pagan al tocar esos archivos.
- `R9-118` (§8) y `R9-1` siguen esperando a Victor.
