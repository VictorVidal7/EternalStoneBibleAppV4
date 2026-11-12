# Recetas vigentes

Lo mecánico de cada sesión, en menos de 3 KB. Las reglas: `CONTINUAR.md` §5 y `REGLAS.md`.

## Qué queda abierto

`node DOCS/REVIEW_2026-09/tools/validar-estado.cjs.txt` (`--corto`: solo el conteo). Al cerrar un hallazgo:
`✅ ARREGLADO` y el sha en su entrada de `BUGS.md`, y `node DOCS/REVIEW_2026-09/tools/estado.cjs.txt tsv`.

## Línea de comandos (Git Bash en Windows)

- Sin barras invertidas, acentos graves ni heredocs: scripts y mensajes en `.txt` con Write; `git commit -F`.
- Un argumento que empieza con `/` se vuelve ruta: `MSYS_NO_PATHCONV=1` (no en el destino local de `adb pull`).
- `TZ=` no llega a jest desde Bash: desde PowerShell. `execSync` se come el `^`, y `cmd.exe` parte un `-t` con `|`.
- PowerShell y Python escriben CRLF, y `git apply` lo rechaza.

## Revert por pieza (toda prueba de un arreglo)

Escribí la prueba; revertí solo la pieza; `npx jest <ruta>`; leé que cae por la razón correcta; restaurá; `git diff`
vacío. Con el productor real, no un mock de fábrica. Si no es testeable en jest, decilo en el commit.

## Checkpoint de docs

`_scratch/S143-checkpoint.sh.txt`, copiado con el número de la sesión. La rama (`docs/review-sN-*`) se crea en el
principal; `git worktree add --detach /c/projects/essb-docs-sN <rama>`; los docs se editan en el worktree;
`bash <script> <etiqueta> <mensaje.txt>` lleva el parche, corre prettier y commitea. Después:
`git worktree remove`, y `NODE_ENV=development npm run validate` en primer plano, sin Metro ni worktrees.

## Merge y CI

Con el OK de Victor: `git merge --ff-only <rama>` y `git push origin main`. El CI, en el log: `_scratch/S43-cred.txt`
con Write (`protocol=https`, `host=github.com` y una línea vacía); `bash _scratch/S116-ci.sh.txt <sha completo>`
(usa `S39-runid.cjs.txt` y `S38-ci.cjs.txt`, solo GET); borrar `S43-cred.txt`. La rama se borra cuando
`git cherry -v main <rama>` sale vacío.

## Emulador

APK debug en un AVD, nunca el teléfono de Victor; no más de 2 emuladores. Ayudas: `_scratch/S141-ui.sh.txt` (`dump`,
`tap`, `seq`, `leer`, `frio`, `burst`, `link`). Coordenadas físicas (1280×2856) sacadas de `uiautomator dump`, no a
ojo; rutas con `eternalbible://`; el estado real se lee del disco (`leer`); un toast, con `burst` antes del toque.
La receta larga: la memoria `reference_essb-device-testing-and-automation`.
