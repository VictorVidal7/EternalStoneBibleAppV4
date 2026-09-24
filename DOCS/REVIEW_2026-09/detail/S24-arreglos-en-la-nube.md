# S24 — arreglos en la nube, revisados en local

**Sesión 24, 2026-09-23/24. De ARREGLOS, con Opus 5.5.** Es la opción (c) de `CONTINUAR.md`. Arrancó en
el mismo chat que la 23. Victor recibió $100 de crédito para sesiones de Claude Code en la nube, y la
sesión lo usó así:

- **Los arreglos los hicieron sesiones en la nube**, cada una en su rama y en archivos distintos. Cada
  una recibió un prompt con las reglas de la sección 5 de `CONTINUAR.md`. Los prompts están en
  `_scratch/S24-*nube*.md`, que no está en git.
- **La revisión la hizo el orquestador en la máquina de Victor**, antes de pedir el OK:
  - `npm run validate`;
  - el revert por PIEZA, con un script que reemplaza un texto exacto, corre jest y restaura, y
    confirma con `git status` que el árbol quedó limpio;
  - apilar las ramas y comparar cada tramo con su rama original con `cmp`.
- **Todo se mergeó en fast-forward** con el OK de Victor, y el CI de cada punta se verificó EN EL LOG.

**Resultado: 11 hallazgos cerrados, 3 nuevos, y P0 abiertos de 5 a 2** (`R9-38`, `R9-124`).
Hallazgos: **159**. `main` = `9c425a8`.

---

## Las 6 sesiones en la nube

| Tanda (prompt)                   | Qué                                | Commits en `main`                                     | Revisión local (quitando cada pieza por separado)                                    |
| -------------------------------- | ---------------------------------- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1 (`S24-PROMPT-nube`)            | `R9-125` + `R9-130`                | `e8c2031`                                             | la rama sin anónimo → caen 4; `claimLocalStore` → caen 5; el link (`R9-23`) → caen 2 |
| 1 (el mismo, más un 2.º mensaje) | `R9-143`                           | `03ad214`, `92cfc16`                                  | `?? ''` → caen 2; `table.passageKey` → caen 2 (primero fallaban por `NODE_ENV`)      |
| 2 (`nube-3`)                     | `NODE_ENV=test` en jest (`R9-157`) | `03d45ad`, `dc8db54`, `f80a2c6`, `b59a3ab`, `3a23e76` | sin el pin, caen las 4 de la compuerta; en 16 archivos solo cambian comentarios      |
| 2 (`nube-2`)                     | `R9-109` + `R9-108`                | `d2b1cc7`, `b8e812c`                                  | todas las piezas discriminan menos el chequeo de tipo del pin (lo cerró `nube-5`)    |
| 2 (`nube-1`)                     | `R9-153` + `R9-122.4`, `R9-154`    | `a7d688e`, `42f6afb`                                  | las 9 piezas discriminan (6 guardas de sesión y 3 sitios de supresión)               |
| 3 (`nube-5`)                     | `R9-109` opción (b)                | `44a5d15`, `0631557`                                  | las 5 piezas discriminan                                                             |
| 3 (`nube-4`)                     | `R9-36`, `R9-39` + `R9-106`        | `6440ca0`, `9c425a8`                                  | las 11 piezas discriminan, incluidas las que cruzan con `R9-153`                     |

> **⚠️ Sesión 25:** la fila de `nube-1` era cierta cuando se midió la tanda 2. Pero en `main`, tras
> apilar `9c425a8`, son 8 de 9: la guarda `:1026` ya no la vigila ninguna prueba (`R9-162`).

Los prompts son `_scratch/S24-PROMPT-nube.md` y `_scratch/S24-nube-N-*.md`. Las sesiones de una
misma tanda corrieron en paralelo, en archivos distintos.

**Los CI, en el log:**

| Run           | Sobre              | Resultado |
| ------------- | ------------------ | --------- |
| `35940051600` | `03ad214` (rama)   | 364/4310  |
| `35948177912` | `92cfc16` (rama)   | 364/4310  |
| `35950842807` | `main` = `92cfc16` | 364/4310  |
| `35960858279` | `main` = `42f6afb` | 365/4337  |
| `35965550736` | `main` = `9c425a8` | 366/4366  |

En todos: 3 jobs verdes y cero «failed to run».

Las matrices de revert están en `_scratch/S24-revision-local-matriz.txt`, `-matriz-2.txt`,
`-tanda2.txt` y `-tanda3.txt`.

## El hallazgo de la sesión: `NODE_ENV` (`R9-157`)

- La primera rama de la nube dio verde en la nube y en CI, y **rojo en la máquina de Victor**: fallaban
  2 pruebas de `R9-143` con un `AggregateError` que envolvía dos «Unable to locate attached view in the
  native tree».
- Con la pila en la mano, la sesión en la nube encontró la causa. **No era Windows ni la versión de Node:
  es `NODE_ENV`.**
  - Victor tiene `NODE_ENV=development` como variable de usuario de Windows (comprobado con
    `[Environment]::GetEnvironmentVariable`).
  - jest solo pone `test` si la variable no existe.
  - `AnimatedProps#connectAnimatedView` tolera una vista nativa ausente solo con `NODE_ENV === 'test'`.
- **La vieja creencia de que «react-test-renderer desmonta la Mesa al re-renderizar»**, citada en ~12
  suites, en `app/features/memory/index.tsx` y en la memoria del orquestador, **era esto.** Por ella
  quedaron sin prueba las mitades de `R9-47`.
- El arreglo fija `NODE_ENV=test` en `jest.config.js`, con una compuerta de dos capas
  (`jestNodeEnv.test.ts`). La primera mira dentro de jest; la segunda carga la configuración en un
  proceso hijo, y esa también la ve el CI.

## Decisiones de Victor en esta sesión

- **`R9-153` antes que `R9-124`.** `R9-124` espera la medición en Modo C.
- **Se levantó la espera de `R9-36` y `R9-39`**, que fueron en la tanda 3, después del motor.
- **`NODE_ENV`, opción (a):** fijarlo en la configuración del repo.
- **`R9-109`, opción (b):** un navegador que ya tenía el pack sigue leyéndolo si el nuevo no verifica;
  solo uno sin texto ve la pantalla de error.

## Lo que queda abierto

- **`R9-124` (P0):** medir el SDK nativo en Modo C, con el emulador y el OK de Victor. Su arreglo toca
  la rama `removed` de `handleSnapshot`, que ahora tiene sesión (`R9-153`) y el conjunto no asentado
  (`R9-39`). Si consulta si el doc existe, que sea FUERA de `withLocalWriteSuppressed`.
- **`R9-38` (P0):** depende de la decisión de `R9-59`, qué significa «local» en un teléfono compartido.
- **Decisiones de Victor:**
  - el tope de cuota del piso de no asentados (mientras un conflicto siga sin resolver, cada enganche
    relee desde su piso);
  - `R9-158`, la guarda de dueño que falla abierta;
  - el efecto de `R9-146`.
- **P3 nuevos:** `R9-159` (el router inestable en ~41 suites). La nota nueva de `R9-127` (el skip
  que queda armado si falla el sign-in) cuelga de un P1 que ya estaba abierto.

## Lecciones de la sesión

> **Verde en la nube y en CI no es verde en la máquina de Victor.** Los dos corren sin `NODE_ENV`, y
> Victor lo exporta. Una rama de la nube se revisa en SU entorno antes de pedir el OK. Es la lección de
> la 16 («¿dónde corre?») con otra cara.

> **Una limitación escrita en un comentario puede ser un defecto del entorno.** «El renderer desmonta la
> Mesa» se repitió en 12 suites y en la memoria sin que nadie lo midiera, y dejó sin prueba la mitad de
> un P0.

> **La nube escribe y el orquestador revisa: la división funciona.** La revisión local encontró una
> compuerta roja (`NODE_ENV`), una pieza sin vigilar (el chequeo de tipo del pin) y un defecto de
> diseño (la pantalla de error para quien ya tenía texto), y cada uno volvió a la nube con un mensaje
> concreto.

> **Las sesiones en paralelo tienen que tocar archivos distintos.** Así las ramas se apilan sin
> conflictos, y cada tramo se comprueba con `cmp` contra su rama original antes del fast-forward.

> **El heredoc del Bash tool se comió otra vez las barras invertidas.** En un script de Node, `\n`
> dentro de un texto escrito desde Python llegó como un salto de línea literal. Los scripts se escriben
> con la herramienta de edición, no con heredocs.

> **Costo:** la primera sesión en la nube (dos P0/P1 de identidad y la Mesa) gastó unos $19 del
> crédito. A mitad de la tanda 3 quedaban $39 de $100. Las sesiones de P0 del motor son las más caras.
