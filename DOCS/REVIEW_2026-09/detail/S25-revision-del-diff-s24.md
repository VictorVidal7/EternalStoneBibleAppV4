# S25 — revisión del diff de la 24, hecha en la nube

**Sesión 25, 2026-09-24. Solo de REVISIÓN, con Opus 5.5.** Revisa el diff de la 24
(`0bc707d..9c425a8`, 16 commits), sobre `main` = `ae9c8e4`. No se tocó código.

- **La revisión la hicieron 2 sesiones de Claude Code en la nube**, lanzadas por Victor desde la app,
  con Default, `main` y el modo Auto:
  - la 1 revisó el motor (`a7d688e`, `42f6afb`, `6440ca0` y `9c425a8`);
  - la 2 revisó identidad, la Mesa, la web y jest (`e8c2031`, `03ad214`, `92cfc16`, `d2b1cc7`,
    `44a5d15`, `0631557`, `b8e812c`, y `03d45ad`..`3a23e76`), más las afirmaciones del ledger sobre
    la 24.
- **Cada una entregó su informe en una rama propia** (`review/s25-motor`, `review/s25-auth-web-jest`),
  pusheado de a poco y pasado por prettier. Esas ramas no se mergearon: el orquestador las bajó, copió
  los informes y las sondas a `_scratch/S25-nube-*`, y las borró del remoto con el OK de Victor.
- **El orquestador verificó en la máquina de Victor**, con `NODE_ENV=development` exportado, todo lo
  que subió a P0 o P1, con sondas propias (`_scratch/S25-sondas-orquestador/`). También midió la
  guarda de `R9-162`, porque contradecía una afirmación del ledger.
- Los prompts de la nube están en `_scratch/S25-nube-{1,2}-*.md`, y los links, en
  `_scratch/S25-nube-sesiones.txt`. Antes de lanzarlos se corrigieron dos cosas:
  - las matrices completas de la 24 están en `_scratch`, que la nube no ve, así que cada sesión armó
    la suya;
  - los «16 archivos» de `R9-157` son los de `f80a2c6`, `b59a3ab` y `3a23e76` (1 + 13 + 2), no solo
    los de los dos últimos.

**Resultado: 14 hallazgos nuevos (`R9-160`..`R9-173`), 2 de ellos P0 y 1 P1.** Pasan a ser 4 P0
abiertos (`R9-38`, `R9-124`, `R9-160` y `R9-166`), y 173 hallazgos en total. El CI de `main` =
`ae9c8e4` está verificado EN EL LOG: run `35967053890`, 3 jobs verdes, Node 24.21.0, 366/4366 y cero
«failed to run».

## Lo que verificó el orquestador, con sonda propia

| Hallazgo        | Sonda                                                                 | Resultado en la máquina de Victor                                                                                             |
| --------------- | --------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| `R9-160` (P0)   | el arnés de `SyncEngine.test.ts` + 3 casos, con el reloj simulado     | «conservar lo mío» sube R2 (del otro teléfono); con el `keepMine` de antes de `6440ca0`, sube L                               |
| `R9-161` (P1)   | la misma                                                              | `keepTheirs` deja lo local en R, más viejo que R2, sin subir nada; tras reiniciar, R2 (o la lápida) queda por debajo del piso |
| `R9-162` (P2)   | quitar solo `:1026` en `main`                                         | `SyncEngine.test.ts` da 104/104 en verde                                                                                      |
| `R9-166` (P0)   | `AuthProvider` + `SyncEngineProvider` + `SyncEngine` reales, 12 notas | si la app muere con la pregunta abierta, suben 12. El control da 0, y la rama de colisión también 0                           |
| `R9-127` (nota) | la misma                                                              | declinar + un fallo de red + reintentar con «Migrar» → flag `skip`, 0 notas                                                   |

Cada sonda se copió a `__tests__/`, se corrió y se borró, y `git status` quedó limpio. Las salidas
están en `s25o-motor-salida.txt` y `s25o-auth-salida.txt`. La primera corrida de la sonda de auth
falló entera por un error del orquestador, no del código: el `useEffect` devolvía un objeto como
cleanup.

## Lo que midió la nube y el orquestador no re-midió

- **Motor:**
  - `R9-163`: `loadCursor` sin sesión.
  - `R9-164`: un retenido que no vuelve nunca.
  - `R9-165`: un conjunto ilegible que no se cura.
  - El costo del piso de no asentados: 300 928 lecturas contra 3 647 en un año, con 300 docs y un
    conflicto sin resolver. La fórmula es la de `SyncEngine.ts:898-899`.
- **Matriz del motor**, 46 corridas: todas las piezas de conducta discriminan, salvo `:1026`
  (`R9-162`). Las que no caen son defensivas, cosméticas, de rendimiento o equivalentes por
  construcción. `R9-36`, `R9-39` y `R9-106` se sostienen.
- **Identidad:**
  - `R9-158`, medido: dos ramas, no tres.
  - Un `onAuthStateChanged` no puede arrancar el motor antes de la pregunta en las ramas de colisión y
    sin anónimo.
  - Dos inicios de sesión a la vez no se pueden provocar desde la UI.
- **Mesa:**
  - `R9-167`: la otra ventana de `R9-143`.
  - `R9-168`: el ref y los borradores se mueven en momentos distintos.
  - `R9-169`: el `await` del flush no tiene prueba.
  - No hay un tercer camino que escriba `drafts[section] ?? ''`.
  - **Observación sin sonda, sin número:** la autorrevisión (`setPrepSelfReviewQuestion`,
    `index.tsx:1147`) todavía escribe bajo `table.passageKey`. Es una casilla, no prosa.
- **Web**, en Chromium headless, sobre el bundle real de `expo export`, con los packs servidos desde
  disco y sin publicar nada:
  - un navegador con el pack sigue leyendo, y uno nuevo ve la pantalla de error;
  - el `instanceof` sobrevive al bundle;
  - `sha256Hex` tarda 152–157 ms;
  - `R9-170`: los packs no son reproducibles entre versiones de SQLite;
  - `R9-173`: el fallo de red o el 404 tumban a un navegador que ya tiene texto.
- **Entorno:**
  - `R9-171`: de las variables probadas, solo `TZ` cambia la suite.
  - `R9-172`: el día del año con horario de verano.
- **Matriz de identidad, Mesa, web y jest**, 32 piezas: coincide con el resumen de la 24. Los
  agregados son `R9-169` y que el router estable es lo que deja ver una dependencia faltante
  (`R9-159`, medido).
- **Afirmaciones del ledger sobre la 24** (30): 27 CIERTAS, 3 A MEDIAS y 0 FALSAS. Las a medias son
  `R9-108` (son tres pruebas, no dos), `R9-158` (dos ramas, no tres) y `R9-143` («arreglado», con la
  otra ventana abierta). Los 5 CI se leyeron en el log, y los «16 archivos solo comentarios» se
  comprobaron por AST (16/16).

## Decisiones de Victor en esta sesión

- **Severidades:** OK con las propuestas. `R9-160` va a P0, como `R9-36`, porque es pérdida de texto
  escrito a mano y, además, una regresión de un arreglo nuestro.
- **`R9-109` y el fallo de red o el 404 (`R9-173`):** Victor delegó la decisión, y el orquestador
  recomendó extender la opción (b). Queda como P3, para después.
- **Arreglos:** Victor aprobó lanzar en la nube los P0 y P1 que se prueban con jest, con lo que queda
  del crédito (unos $8), aunque se acabe.

## Lo que queda abierto

- **P0:**
  - `R9-160` y `R9-161`, en la nube (sesión A, el motor);
  - `R9-166`, en la nube (sesión B, auth);
  - `R9-124`, en Modo C y en la 26, DESPUÉS de mergear la sesión A, porque toca el mismo
    `handleSnapshot`. Su arreglo tiene dos condiciones nuevas (ver su entrada);
  - `R9-38`, que depende de `R9-59`.
- **Decisiones de Victor:** las de siempre (`R9-59`, el efecto de `R9-146`, el tope de cuota del piso
  y `R9-158`, ahora junto con el `claimLocalStore` que también falla abierto).
- **La puerta de `R9-127` que se cierra en `AuthContext`** (el skip armado antes de un sign-in que
  falla) no entra en la sesión B. El arreglo de fondo de `R9-127` (un skip por uid) toca
  `SyncEngine.ts`, que es de la sesión A. Va después.

## Lecciones de la sesión

> **Un arreglo puede crear el caso que su propia premisa niega.** `R9-36` supuso que «lo local de
> ahora» es siempre «lo mío», y eso es falso cuando lo que cambió lo local fue el LWW de un cambio del
> OTRO teléfono. La pregunta que faltó: ¿quién más escribe en ese mismo lugar mientras el conflicto
> espera?

> **Un arreglo posterior puede desarmar la prueba de uno anterior aunque estén en commits distintos.**
> La guarda nueva de `9c425a8` tapó, en las pruebas, la guarda de `a7d688e`. La matriz de la tanda 3
> midió las guardas nuevas, no las viejas. Después de apilar, hay que re-medir la matriz entera, no
> solo el tramo nuevo.

> **Revisar en la nube funciona.** Dos sesiones encontraron 2 P0, y el orquestador los confirmó en
> local con sondas propias. La revisión fue más profunda de lo que el chat local podía pagar en cuota:
> la nube construyó el bundle web, lo corrió en Chromium, midió 13 entornos de la suite y repitió dos
> matrices enteras.

> **Costo:** las dos sesiones de revisión gastaron unos $31 del crédito (de $39 a $8), corriendo en
> paralelo, así que no se puede repartir cuánto fue de cada una.
