# Sesión 28 — arreglos de lo de la 27 (`R9-175`..`R9-181`)

**Fecha:** 2026-09-29. **Modo:** solo terminal. **Agentes:** 3 en worktree, a pedido de Victor, y
solo para MEDIR diseños (no tocaron la rama de arreglos).

## 1. Estado de partida

- `main` = `origin/main` = `f305fa2` (el checkpoint de la 27 ya estaba mergeado; la §2 de
  `CONTINUAR.md` todavía decía `6f73f69`). El último código era `34de18f` (`R9-124`).
- **CI de `origin/main` verificado en el log:** run `36510398166`, 3 jobs verdes, Node 24.21.0,
  367/4414, cero «failed to run».

## 2. Cómo se trabajó

1. **Orden y diseño, antes de tocar código:** el orden que propuso Victor (`R9-179`/`R9-180`
   primero, como `R9-15` antes que `R9-13`), con el diseño como hipótesis.
2. **3 agentes, solo para medir** el diseño en su worktree. Cada uno entregó su propuesta como
   diff en `_scratch`:
   - **A1:** el mock con eco propio, `isSyncing` y `R9-180`. Terminó.
   - **A2:** `R9-175`, la cadena por colección. Lo cortó el límite de sesión después de medir
     casi todo; su diff se guardó a mitad de un revert (ver §4).
   - **A3:** `R9-181`, `R9-176` y `R9-178`. Se pausó antes del informe final; su propuesta estaba
     medida en su worktree.

   Victor eligió no retomarlos: el orquestador integró los tres diffs. Los worktrees se limpiaron
   tras rescatar sus sondas a `_scratch` (junction borrada con `.Delete()`, 0 commits por delante
   de `main`).

3. **La rama `fix/s28-sync-r9175-r9181`, un commit por hallazgo:** cada prueba vista fallar, cada
   pieza revertida por separado con `_scratch/S28-matriz.cjs.txt` (el de la 27 más las piezas
   nuevas, con un filtro por nombre), y la matriz entera al final. Todo con
   `NODE_ENV=development` y con el mock NUEVO.

## 3. Los commits

| Commit    | Hallazgo            | Qué                                                      |
| --------- | ------------------- | -------------------------------------------------------- |
| `d093a4e` | `R9-179` (1/2)      | el mock: eco, reversión, re-entrega y un solo hilo       |
| `7292b78` | `R9-179` (2/2)      | fuera `isSyncing`                                        |
| `363056e` | `R9-180`            | la guarda de la marca, vigilada donde el eco no llega    |
| `c163659` | `R9-175`            | los lotes de una colección corren de a uno               |
| `1bae03e` | `R9-181`            | el conflicto retenido vuelve aunque sea más viejo        |
| `53e79fa` | `R9-176` + `R9-178` | la respuesta de la lectura no pisa una escritura en cola |

La suite de sync pasa de 141 a 160 pruebas. `npm run validate` (con `NODE_ENV=development`) da 367 suites y 4433 pruebas, en verde.

## 4. Lo que decidió cada diseño (medido, no supuesto)

### El mock (`R9-179`)

- **El eco solo no alcanza: hace falta el hilo único de RNFB.** A2 y A3 llegaron a lo mismo por
  caminos distintos. Con el mock de eco de la 27, que entrega el eco en la LLAMADA a `set()`, la
  respuesta «fresca» de la lectura ya traía lo propio. Es un orden que RNFB no produce: ahí el
  `set()` ni siquiera se emite mientras el `get()` retiene el ejecutor. Con ese mock, 4 de las 6
  pruebas de fallo de A3 dejaban de caer contra el motor viejo.
- **Cómo lo modela el mock ahora:**
  - un `get()` de doc retiene un ejecutor global hasta que vuelve;
  - un `set()` o `delete()` emitido mientras tanto espera detrás, con su eco;
  - sin lecturas en vuelo, se emite en el acto, así que el tiempo de las demás pruebas no cambia.
- **Control del mecanismo:** hoy solo 1 `set()` de toda la suite espera detrás de una lectura
  (`_scratch/S28-sonda-hilo.cjs.txt`). El hilo único lo vigilan las pruebas de `R9-176`/`R9-178`.
- **Con el mock nuevo y sin tocar nada, caían 14 pruebas (A1):**
  - las 6 esperadas;
  - 7 por tiempo, porque suponían el ack dentro de un macrotask: se ajustaron con `drain()` o con
    el flag del bulk push, cada una con su comentario;
  - la de `R9-161` con la edición en la cola, que simulaba un rechazo sin reversión (ver
    `R9-182`).
- **La re-entrega al enganchar (la variante R de la 27) entró a propósito:** sin ella, las 4 de
  `R9-104` no caen. Con `@sync_first_push_done:uid-beto` pasan, y cada pieza de `R9-104` sigue
  cayendo con el mock nuevo.

### `R9-175`

- **La trampa de la cadena ingenua:** `handleSnapshot` tomaba la sesión y el uid al EMPEZAR. Un
  lote que esperó en la cola a través de un `stop()` corría en la sesión de la cuenta siguiente: su
  Y entraba en la sesión de Beto, y su cursor, bajo la clave de Beto (la clase de `R9-153`). Por
  eso la sesión se toma en el callback de `onSnapshot`.
- **El diff de A2 se guardó a mitad del revert «sesión»:** traía `session = this.flushSession;
uid = this.uid;` al empezar el lote. Se corrigió al integrar.
- **La pregunta de Victor («si una lectura no vuelve nunca, ¿la cadena bloquea todos los lotes
  siguientes?») se midió: sí.** El SDK no le pone plazo a un `get()`. El plazo del motor es de 60 s,
  y vencerlo cuenta como una lectura fallida. Su revert tumba 2 pruebas.
- **La cadena cierra la versión PERMANENTE de `R9-176`/`R9-178`** (medido por A2): sin ella, el eco
  que «cura» se procesaba en paralelo con el apply de la respuesta vieja y se perdía.
- **`R9-183` queda afuera por alcance:** A2 lo había arreglado en su worktree, haciendo que
  `resolveConflict` avance el cursor por la cadena. Victor aprobó registrarlo sin arreglar, y el
  comentario corregido de `handleSnapshot` lo nombra como excepción.
- **La prueba de profundidad de `R9-154`** usaba dos lotes solapados, que ya no se solapan: ahora
  usa un doble keepTheirs.

### `R9-181`

- **La (b) tal cual creaba un conflicto fantasma entre lo propio y lo propio** (A3, caso B1). La
  forma final re-detecta la copia más vieja solo si es la que marca el conflicto, y el eco propio no
  mueve la marca.
- **Corolario 6, otra vez:** la prueba de la 26 afirmaba 0 conflictos tras reiniciar. Con la
  re-entrega del mock nuevo y la (b), da 1: ahora vigila la consecuencia.
- **Corolario 37:** la pieza «la marca sigue a "su versión"» no hacía caer nada. No era equivalente
  por construcción, porque decide la altura del piso (cuota), así que se le escribió prueba.

### `R9-176` + `R9-178`

- **Una sola guarda, `hasQueuedWrite`.** La entrada de `R9-176` decía que no cubría `R9-178`, pero
  eso valía solo con el orden del mock viejo.
- **`heldBefore` se descartó:** rompe la convergencia de N2 (A3).
- **Las 3 pruebas «RNFBw» de A2 se quitaron:** con esta guarda la respuesta ya no se aplica, y el
  escenario no ocurre.
- **La prueba de E1p no discriminaba con el mock de hilo único:** el eco de keepMine sale apenas
  vuelve la lectura y disuelve el fantasma en el lote siguiente. Ahora anota cada lista de conflictos
  que el motor publica (corolario 13) y cae con la guarda revertida.
- **El helper de A3 retenía las subidas** para simular el hilo único. Con el mock nuevo esa mitad no
  hacía nada (la compuerta del `set()` se evalúa cuando la lectura ya se soltó), así que quedó
  `holdRead`.

## 5. La matriz entera (estado final, `NODE_ENV=development`, mock nuevo)

`_scratch/S28-matriz-final.out.txt` y `S28-matriz-final-aus.out.txt`. Se mide cada pieza sola,
con la suite de 160 pruebas. La cifra es cuántas pruebas caen:

| Pieza                                 | Caen | Pieza                             | Caen  |
| ------------------------------------- | ---- | --------------------------------- | ----- |
| P1 existe = borrado                   | 5    | R104-1 `stop()` suelta el candado | 2     |
| P2=G1 `isCurrent()` tras la lectura   | 1    | R104-2 el corte del catch         | 1     |
| P3 la lectura dentro de la supresión  | 5    | R104-3 el finally del flush       | 1     |
| P4 borrado sin mirar el retenido      | 1    | R104-4 / R104-5 (sueltas)         | 0     |
| P5 lectura fallida = borrado          | 3    | R104-6 = 4 + 5                    | 1     |
| P6 sin soltarlo del conjunto          | 2    | R104-7 la ruta con `item.uid`     | 0     |
| P7 existe = soltar a ciegas           | 3    | S175 cadena / sesión / inicio     | 7/2/1 |
| P8 existe = ignorar sin soltar        | 4    | S175 stop / motor / plazo         | 2/1/2 |
| G2..G6, G9                            | 1-2  | S181 b / marca / lectura          | 2/2/2 |
| G7 (`isSyncing`)                      | —    | S181 suya / respaldo              | 1/1   |
| G8 `isCurrent()` tras `getLocal`      | 3    | S176 la guarda de la cola         | 5     |
| G10 `resolveConflict` suelta la marca | 3    | R154 profundidad                  | 1     |

- **Toda pieza discrimina, salvo R104-4, R104-5 y R104-7 sueltas.** Esas tres dan 0 igual que en
  `f305fa2` (lo midió A1 con los dos mocks): son las capas de la S20 que se cubren entre sí
  (corolario 34). R104-6 (4 y 5 juntas) cae.
- **G7 ya no existe:** se quitó con `isSyncing`.
- **P7 antes daba el mismo estado final** (era la queja de `R9-181`). Con la (b), cae con 3.
- **P2, P7 y P8 salieron primero AUSENTES:** sus anclas cambiaron con la guarda de `R9-176` y con
  `fromRead`. Se les agregó una alternativa y se midieron aparte. Una matriz «entera» con tres piezas
  que no midieron nada no lo era.

## 6. Hallazgos nuevos

- **`R9-182` (P2):** un `set()` rechazado de un doc que la nube no tiene borra la copia local (A1).
- **`R9-183` (P3):** resolver otro conflicto durante la lectura mueve el cursor (A2, P10r).
- **`R9-184` (P2):** el flush sube una foto vieja de la cola, y su eco crea un conflicto entre dos
  versiones propias que no se disuelve solo (A3, B3; el mecanismo lo verificó el orquestador en el
  código).

**Notas a hallazgos registrados (A1):**

- **`R9-126` tiene dos disparadores más:**
  - el bulk push que revive una lápida también la revive en este teléfono, por el eco;
  - un keepMine resuelto sin red sale después de un cambio remoto más nuevo. El
    `set({merge:true})` deja la nube en L, una hora más viejo que R3, y el LWW de los dos teléfonos
    lo ignora.
- **La tabla de la S20 está desactualizada:** R104-1 tumba 2 pruebas, no 4.

## 7. Lecciones

- **Un mock que modela UNA propiedad del SDK puede producir órdenes que el SDK no produce.** El eco
  sin el hilo único dejaba que la lectura viera la escritura hecha durante ella (la variante del
  corolario 35 por el eje del orden).
- **Un diff de agente guardado a mitad de un revert se ve como una propuesta.** El de A2 traía
  revertida la pieza «sesión». Antes de integrar un diff ajeno, leelo línea por línea contra su
  informe.
- **Un helper de prueba escrito para otro mock puede quedar muerto a medias** (el
  `holdReadAndWrites` de A3): la prueba pasa igual, y el comentario del helper miente.
- **El orden del mock decide qué guarda hace falta.** «Esta guarda no cubre aquel caso» se midió
  con el orden del mock viejo; con el de RNFB, una sola cubre los dos.

## 8. Sondas

En `_scratch/` (todas con `.txt` al final):

- A1: `S28-A1-*`;
- A2: `S28-A2-*`, con `S28-A2-propuesta.diff.txt` (guardado a mitad del revert «sesión») y
  `S28-A2-reverts-final.diff.txt`;
- A3: `S28-A3-*`, con `S28-A3-parcial.diff.txt`;
- el orquestador: `S28-matriz.cjs.txt`, `S28-matriz-*.out.txt`, `S28-sonda-hilo.cjs.txt`,
  `S28-split-c1.cjs.txt`, `S28-split-c5.cjs.txt`, `S28-build-c6.cjs.txt` y `S28-c6-tests.cjs.txt`.
