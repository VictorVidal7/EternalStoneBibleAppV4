# Sesión 70 — revisión del diff de la 69 (2026-10-06)

En el mismo chat que la 69 (Victor: «continua estimado por favor»), en la terminal y sin agentes,
con `_scratch/S70-PROMPT.md`. Sin tocar código.

- **Estado al empezar:** `main` = `origin/main` = `3d29d33` (la 69 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37572992296`, 3 jobs, Node v24.21.0, 374/4626). Es el mismo
  `main` que dejó la 69, así que no hizo falta mirar el CI otra vez. Los docs decían «sin mergear»
  para la 69: corregido aquí.
- **Rama:** `docs/review-s70-diff-s69` (solo docs), sin mergear hasta el OK de Victor.
- **Qué se revisó:** `e9db115..e96e8e6`, solo `__tests__/backupRestoreSignal.test.ts` (`git diff
--stat`: 1 archivo, 10+ 1−). Y la entrada nueva de `R9-290`.
- **Resultado:** 1 nuevo, P3 (`R9-291`), y una corrección a `R9-290`. Quedan 291 hallazgos, ningún
  P0.
- **No es una mirada fresca:** la 69 y la 70 son del mismo chat. Se compensó con piezas que buscan
  romper el control nuevo (`sinCola`, `ciego`) y con la pieza que demora JUNTO con la regresión
  (`lentoSinTurno`), que nadie había corrido.

## 0. Las herramientas

- `_scratch/S70-turno.cjs.txt <pieza> [archivo|prep|suite]`, nuevo. `archivo` corre
  `backupRestoreSignal.test.ts`; `prep`, ese y `backupPrepTurn.test.ts`; `suite`, las 125 suites
  relacionadas, como `S68-turno`. Piezas:
  - `nada`;
  - `sinCola`: `prepMultiSet` sin el turno (corre su cuerpo enseguida, sin `oneAtATime`);
  - `ciego`: `BackupService` llama a `prepMultiSet` por un alias tomado al cargar el módulo, así que
    el spy no lo ve, con el mismo comportamiento;
  - `lento` y `sinTurno`: las de `S68-turno`;
  - `lentoSinTurno`: las dos juntas.
- `_scratch/S59-rev.cjs.txt <pieza> ver` (el de la 59), para el rojo de la regresión de `R9-275`.
- `_scratch/S69-muere.cjs.txt nada|lento` (el de la 69), re-corrido.
- `git status` vacío tras cada corrida.

## 1. El control nuevo de `R9-289`

- **Cae como dice el cierre:** las salidas `S68-turno-<pieza>-suite.out.txt` de la 69 son de
  `e96e8e6`, que es la prueba de `main`. No se re-corrieron. Se leyó el diff de la prueba en cada una
  (`lento`: el control nuevo en 0 y los avisos; `enTurno` y `principio`: solo los avisos; `sinTurno`:
  los tres controles).
- **`sinCola`** (el control en 1 sin que el respaldo espere): la prueba cae en `mazoPedido…: 1` y
  `terminado…: true`, con el control nuevo en 1. El control cuenta llamadas a `prepMultiSet`, no la
  espera; la espera la miran los otros dos. Los tres juntos se sostienen.
- **`ciego`** (el control en 0 con el comportamiento bueno): la prueba cae con
  `turnoPedidoAntesDeAbrir: 0` y nada más. Es un rojo ruidoso con el código bueno, el precio de
  espiar el objeto del módulo: un cambio que llame a `prepMultiSet` sin pasar por él (un alias, o
  un ayudante dentro de `prepAccount`) lo deja ciego. Nunca da verde. Se acepta, sin número.
- **`mockRestore` antes de abrir:** `importBackup` llama a `prepMultiSet` una sola vez
  (`BackupService.ts:1646`), así que no hay un segundo pedido que se pierda. El turno de las otras
  pruebas: la medición de la 69 (`S69-vueltas`) es sobre el mismo árbol; no se re-corrió.
- **El comentario nuevo** («esperando el aviso, su falta daba el mismo rojo con el aviso dentro del
  turno que con un respaldo que no llego al turno») dice lo que midió la 68 (`lento` y `enTurno`, el
  mismo diff). Se sostiene.

## 2. `R9-290`

- **La medición se sostiene** (`S69-muere` re-corrido sobre `main`): sin pieza, 1 `multiSet`
  colgado y la prueba pasa; con `lento`, 0, y cae con `Ps/23/1-6` fuera de `sinCuenta`.
- **«La 68 no lo vio porque corrió `lento` solo en modo `archivo`»:** se sostiene. De las salidas
  `S68-turno-*-suite.out.txt`, la única de la 68 es `releeRetenido` (20:28); las demás son de la 69
  (21:36). El §0 y la tabla del detalle de la 68 son del modo `archivo`.
- **El rojo de la regresión, que la 69 no midió** (`S59-rev anotaRespaldo ver` y `respaldo ver`,
  con el caso construido): las dos dejan `Ps/23/1-6` bajo `ana` en `muere` (`ana: ["Ps/23/1-6"]`).
  Con `lento`, `ana` sigue en `null`: lo restaurado no está en ninguna Mesa porque el respaldo
  sigue en vuelo. **Los rojos son distintos**, a diferencia de `R9-289`, donde `lento` daba el mismo
  diff que la regresión. `R9-290` sigue en P3, y su entrada se corrige.

## 3. Nuevo: `R9-291`

- **`R9-291` (P3, pruebas):** la prueba de `R9-273` (`backupPrepTurn.test.ts`, «restaurado mientras
  corre una union…») pasa con su propia regresión cuando el respaldo es más lento que sus vueltas.
  - Su vuelta (`for (let i = 0; i < 20 && !restaurado; i++)`) espera el DAÑO: sale antes solo si el
    respaldo termina con la otra escritura retenida, que es lo que hace sin el turno. Con el código
    bueno da siempre las 20 vueltas.
  - Su control `antesDeAbrir: false` («el respaldo no terminó antes de abrir») vale igual si el
    respaldo espera el turno que si todavía no llegó a escribir.
  - **Medido** (`S70-turno <pieza> prep`): con `sinTurno`, la prueba cae. Con `lentoSinTurno`
    (sin turno y 25 vueltas más lento), **pasa**: el respaldo escribe después de que la otra
    escritura terminó, y el caso «durante una unión» no se construye.
  - **El suite no lo distingue** (`S70-turno lentoSinTurno suite`): 2 de 998, `R9-287` (con el mismo
    diff que con `lento` solo: el control nuevo en 0 y los avisos) y `R9-275` (`muere`, `R9-290`).
    Son las mismas 2 caídas, con los mismos diffs, que da `lento` con el turno puesto.
  - P3: hoy el respaldo llega en 1 vuelta, y la prueba ve `sinTurno`. Pero es un verde falso de una
    prueba ante su regresión, no solo un rojo confuso.
  - **¿Lo abrió la 69?** No: es la prueba de `831c7e4` (sesión 57).
  - **Arreglo (hipótesis):** un control de llegada, «el respaldo pidió el turno antes de abrir» (el
    spy de `R9-289`, `prepMultiSet` 1), y la vuelta esperando ese pedido en vez del daño. Verla caer
    con `lentoSinTurno` en el control nuevo, y con `sinTurno` como hoy. Y lo mismo para `R9-290`, en
    el mismo archivo.

## 4. Lo que no se hizo

- No se re-corrieron las salidas `suite` de la 69 ni `S69-vueltas`: son del mismo árbol.
- `prepAccount.test.ts` también tiene vueltas fijas (`:212`, `:357`), pero no pasa por
  `importBackup`, y `lento` no la toca. Hace falta otra pieza que demore para medirla, y no se hizo.
- Las vueltas fijas de `SyncEngine.test.ts` (`flush()` ×5, etc.) quedan fuera del alcance.
- Nada en el teléfono.

## 5. La lección

- **La pieza que demora se corre también JUNTO con la regresión.** La 68 la corrió con el código
  bueno y vio un rojo que se parecía a la regresión. Junta con `sinTurno`, mostró lo contrario: una
  vuelta que espera el daño da siempre N vueltas con el código bueno. Con un caso más lento que N,
  la regresión no llega a mostrarse, y la prueba pasa.
