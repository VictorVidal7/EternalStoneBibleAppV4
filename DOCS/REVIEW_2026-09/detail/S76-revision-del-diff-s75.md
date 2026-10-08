# Sesión 76 — revisión del diff de la 75 (2026-10-07)

En un chat nuevo, en la terminal, con 4 agentes en worktree que solo midieron (Victor: «¿podrías
mandar 4 agentes?»; se le recordó la 37 y eligió 4). Con `_scratch/S76-PROMPT.md`. Solo docs: no
se tocó código ni pruebas.

- **Estado al empezar:** `main` = `origin/main` = `f01e149` (la 75 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37698839488`, 3 jobs, Node v24.21.0, 374/4628). Los docs decían
  «sin mergear» para la 75: corregido aquí. `main` no era más nuevo que `f01e149`: el CI no se volvió
  a mirar.
- **Rama:** `docs/review-s76-diff-s75` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo que la 75 midió se sostiene, salvo tres frases (§5). 3 nuevos, P3, de pruebas:
  `R9-306` (lo abrió la 75), `R9-307` y `R9-308` (no). Ninguno es P2. Quedan 308 hallazgos, ningún
  P0.

## 0. Cómo se trabajó

- 4 agentes `fork` en worktree sobre `f01e149`, solo midiendo, ~25 min de tope cada uno:
  - el 1, la espera de `R9-302`;
  - el 2, si `durante` cae como dice su cierre;
  - el 3, `R9-304`, `R9-305` y `sueltaK`;
  - el 4, a romper `durante`.
- Herramientas con `_scratch/S76-copiar.cjs.txt`: es la `S75-copiar` con `S75-sonda1.cjs.txt` en la
  lista; la de la 75 no la copiaba.
- Los 4 copiaron su `_scratch` al principal (`_scratch/S76-sondas-agente-{1..4}/`, con el informe
  en `S76-agente-N.md.txt`). Gastaron 139k, 146k, 153k y 171k tokens, con 20 a 39 llamadas, en 5 a
  9 min. Los worktrees se borraron solos al terminar, con sus ramas: lo único que quedó es la copia.
- El orquestador re-midió en el árbol principal cada afirmación que se registra. Para eso regeneró
  con `ROOT` en el principal (`_scratch/S76-gen.cjs.txt <sonda del agente> <salida>`) las sondas de
  los agentes que traen piezas nuevas:
  - `S76-sonda-a1.cjs.txt`: `generacion`, `reiniciaAlInicio`, `pendientesAlInicio`;
  - `S76-sonda-a3.cjs.txt`: `sueltaMsN`;
  - `S76-sonda-a4.cjs.txt`: `drenaX`, `puertaAlFinal`, `cuerpoK`, `turnoAntesSqlite`, `pideVacio`,
    `alReves`, `copia278`.

  Sus salidas: `S76-a1-*`, `S76-a3-*`, `S76-a4-*`.

- `git status` limpio tras cada corrida.

## 1. La espera de `R9-302` (`a808c29`): cae como dice el cierre

- **Matriz pedida** (agente 1, `archivo`):
  - `nada`, `tarde1`, `tarde39` y `lento19` pasan, 4/4.
  - `tarde40` cae en los dos casos en `otraConElTurno: false`, más el diff de un `multiSet` sin
    turno.
  - `sinCola` cae en los dos casos con su diff, con los controles igual.
  - `lento20` cae en los dos en `turnoPedidoAntesDeAbrir: 0`.
  - `enTurno` cae en los dos, solo en los avisos.
  - `debc845c0+tarde1`: el revert es exacto (52+/98−) y da el rojo de `R9-302`.

  Coincide con el cierre y con las tablas de `detail/S75` §1 y §2.

- **La regla de la 69** (`prep` y `suite`; agente 1): con `tarde1` cae solo la de `R9-273`
  (`R9-297`); con `tarde39`, además `removes` y `reorders` de `PrepSeriesDetailScreen` (`R9-305`);
  con `tarde40`, además los dos casos de `R9-287` (995/1000). Nada que no esté registrado.
- **Rota con la regla de la 71: `R9-306`** (§4). La prueba de `bc845c0` armaba un tercer orden
  (el store pedido ANTES de empezar el respaldo y en el turno DESPUÉS), y ni `antes` ni `durante` lo
  arman. Las otras dos piezas del agente 1 son cobertura que la 75 ganó, no que perdió:
  - `reiniciaAlInicio` (el respaldo reinicia `turn` al empezar): la de `bc845c0` pasa; la de
    `a808c29` y la de hoy caen, en `antes`.
  - `pendientesAlInicio` (el respaldo espera solo lo pedido antes de empezar): la de `bc845c0` y la
    de `a808c29` pasan; la de hoy cae, en `durante`.

  Medido por el agente 1, no re-medido.

## 2. El caso `durante` de `R9-303` (`125736b`)

- **Cae como dice** (agente 2, `archivo`):
  - `drenaAlInicio` cae solo en `durante`, con el diff de un `multiSet` sin turno y los controles en
    su sitio.
  - `dea808c29+drenaAlInicio` pasa 3/3, y `debc845c0+drenaAlInicio` cae.
  - Con `antesSqlite39`, `durante` pasa (`antes` cae); con `antesSqlite40`, `durante` cae solo en
    `respaldoEnSqlite: 0`.
  - En `prep` (18/19) y en el suite (999/1000), `durante` es la única prueba que ve `drenaAlInicio`.
- **El corte de `antes` con `antesSqliteK`** (`detail/S75` §2 lo dejó sin número): 19 pasa, y 20 cae
  en `turnoPedidoAntesDeAbrir: 0`. Re-medido: `S75-sonda1 antesSqlite19,antesSqlite20 archivo`. Es
  la ventana de 20 de `R9-289`, contada desde que se pide el respaldo.
  - Con K entre 20 y 39, `antes` cae por el corte y deja de mostrar el diff de la regresión. Con
    `antesSqlite39+enTurno`, `+sinCola` y `+drenaAlInicio`, solo `durante` la ve, con los controles
    en su sitio (agente 2).
- **La regla de la 70 en `durante`** (agente 2): hasta el borde (`tarde39`, `lento19`, `antesSqlite39`
  con `drenaAlInicio`), el rojo sigue nombrando un `multiSet` sin turno. En el borde, `tarde40+` y
  `lento20+drenaAlInicio` dan el rojo de la pieza sola, siempre con un control en falso. No hay
  ningún verde falso.
- **La lección de la 75, sobre su propio arreglo:** ¿el caso `durante` fija un orden nuevo que se
  lleva la cobertura de otro? No: no se llevó nada. Lo que hace es dejar sin construir dos órdenes
  vecinos:
  - el de la prueba vieja, que no lo arma ni `antes` ni `durante` (`R9-306`);
  - un turno tomado mientras corre el cuerpo de la transacción. La puerta del mock va ANTES del
    cuerpo, y el store entra siempre antes de él (`R9-307`, agente 4).

  El agente 4 midió dónde puede ir la marca de `drenaX`. La prueba de `bc845c0` veía solo una marca
  puesta antes del primer `await` de `importBackup`. `durante` ve cualquier marca anterior a la
  transacción (`drenaTrasInit`, `drenaTrasAch`, `drenaAntesSqlite`), pero no una puesta dentro
  (`drenaEnSqlite`).

- **Las vueltas que se salta la espera de SQLite (la regla de la 71; agente 4):**
  - Antes de la transacción todo son mocks ya resueltos: la vuelta sale en la primera, y en las que
    se salta el respaldo está quieto en la puerta.
  - Entre `soltarSqlite()` y la espera de 20, el cuerpo, el aviso y `prepMultiSet` corren en
    microtareas. Con `cuerpo19` (19 vueltas dentro del cuerpo) pasa; con `cuerpo20`, los dos casos
    caen en `turnoPedidoAntesDeAbrir: 0`. Es la ventana de `R9-289`, que en `durante` cuenta desde
    `soltarSqlite()`. No es nuevo.
- **¿`respaldoEnSqlite` nombra QUÉ llegó (la regla de la 72)?** Nombra «llegó a
  `withTransactionAsync` con la puerta puesta». Con el orden de hoy (la transacción antes de
  `prepMultiSet`, sin otro turno entre medias), eso implica «todavía no pidió el turno». El agente 4
  no encontró ningún caso con el control en 1, el caso sin construir y la prueba en verde:
  - `turnoAntesSqlite` (el respaldo toma un turno antes de la transacción y lo retiene) cae en
    `durante`, en `otraConElTurno: false`;
  - `pideVacio` (un `prepMultiSet([])` de más al empezar) cae en los dos casos y con la prueba de
    `bc845c0`, en los avisos: es el daño de `R9-287`.

  Pero su comentario dice más de lo que mide (§5).

- **`mockSqlite` en las otras pruebas del archivo** (agente 4): el `beforeEach` alcanza.
  - Con los casos al revés (`alReves`), 4/4. Con una copia de la de `R9-278` al final que comprueba
    `retenida: 0` y `puerta: null` (`copia278`), 5/5, y también con `alReves+copia278`. Con
    `-t durante`, pasa.
  - Si `durante` falla antes de soltar, la copia cae por timeout. La causa no es `mockSqlite`: es el
    turno de la Mesa, que queda tomado (la copia no llama a `__resetPrepAccountForTests`). Pasaba
    igual con la prueba de `bc845c0`. Sin número.

## 3. Las entradas nuevas de la 75

- **`R9-304` se sostiene** (agente 3; `fueraDelTurno`, `tardeDentro39`, `tardeDentro40`, y los
  controles con `debc845c0`):
  - `fueraDelTurno` cae en los dos casos con el diff de `sinCola`, y lo recibido dice
    `otraConElTurno: true`.
  - `tardeDentro40` cae solo en `otraConElTurno: false`, en los dos casos.
  - Con la prueba de `bc845c0`, `fueraDelTurno` da el mismo diff sin esa línea, y `tardeDentro40`
    pasa (3/3).

  Lo abrió la 75. Sigue en P3.

- **`R9-305` se sostiene, pero la frase de su corte no.** Con `nada`, 22/22. `removes` cae siempre en
  el `waitFor` de la línea 301, y `reorders`, cuando cae, recibe `['John/3/16']`. Es de T8.4.4
  (`git log -S`: `da97edf`). Lo que no se sostiene es el corte:
  - el agente 3, con carga: `tarde26` tumbó las dos y `tarde30` solo `removes`;
  - el agente 3, en otras dos rondas: `tarde26` y `tarde30` pasaron, y de 40 a 100 cayeron siempre
    las dos;
  - re-medido en el árbol principal, sin agentes: `tarde30` tumba solo `removes`, y `tarde40` las
    dos.

  La 75 escribió «con `tarde30` caen las dos»: no se repite. Es de reloj, entre 26 y 40.

- **`sueltaK` (sin número en `detail/S75` §3) se sostiene, con un número corregido.** Medido por el
  agente 3 y re-medido:
  - `suelta19` en `prep` tumba `R9-273` y `R9-275`; `suelta20`, solo `R9-275`; `suelta21`, ninguna
    (19/19).
  - `suelta21` en el suite: 1000/1000. Nadie lo había corrido.
  - La 75 escribió «la de `R9-273` lo ve hasta 10»: lo ve hasta 19. El agente 1 de la 75 midió 10 y 20.
  - La forma de reloj es `R9-308` (§4).
- **¿Alguna es P2?** No. La escala de `BUGS.md` deja P2 para «resto + pulido»; las de pruebas van en
  P3 por precedente, y el código de hoy está bien en todas.
  - `R9-308` cubre la clase de `R9-273`, que es P3.
  - La razón de pedirle número es otra: la regresión plausible (un plazo para que la importación no
    cuelgue esperando la Mesa) no la ve ninguna prueba.

## 4. Nuevos

- **`R9-306`:** a la prueba de `R9-287` le falta el orden «el store pedido antes de empezar el
  respaldo, en el turno después».
  - Con `generacion`, un respaldo que deja correr sin turno a un store pedido antes de que él
    empezara:
    - la prueba de hoy pasa (4/4);
    - la de `a808c29`, también (3/3);
    - la de `bc845c0` cae con el diff de `sinCola`;
    - el suite, 1000/1000.
  - Lo abrió la 75 (`a808c29`); `125736b` no lo cerró. Visto por el agente 1, re-medido.
- **`R9-307`:** ninguna versión de la prueba ve un turno tomado mientras corre el cuerpo de la
  transacción de SQLite.
  - Con `drenaEnSqlite` (la marca de `drenaAlInicio`, puesta al empezar el cuerpo): la de hoy 4/4,
    la de `bc845c0` 3/3, el suite 1000/1000.
  - Arreglo medido por el agente 4 y re-medido en `archivo`: `puertaAlFinal`, la puerta del mock
    después de `await fn()`.
    - Sola, 4/4.
    - Con `drenaEnSqlite` y con `drenaAlInicio`, cae `durante` con el diff de un `multiSet` sin
      turno.
    - Contra la matriz de la 75, da lo mismo que hoy, y en el suite, 1000/1000 (agente 4, no
      re-medido).
  - No lo abrió la 75: tampoco lo veía ninguna versión anterior.
- **`R9-308`:** un respaldo que deja de esperar el turno de la Mesa tras un plazo de reloj no lo ve
  ninguna prueba.
  - Con `sueltaMs50` (50 ms de `setTimeout`, después escribe sin turno): `prep` 19/19 y el suite
    1000/1000, re-medido.
  - Las puertas de las pruebas se abren en vueltas de `setImmediate`, que duran mucho menos.
  - Es lo sin número de `detail/S75` §3, en la forma que tendría en el código (el motor de sync ya
    tiene un `withDeadline`).
  - No lo abrió la 75.

## 5. Correcciones (sin número)

- **`R9-303`, «con `antesSqlite40+drenaAlInicio`, el control en 0 nombra el caso no construido»:**
  falso, y la propia salida de la 75 lo muestra
  (`_scratch/S75-sonda1-antesSqlite40+drenaAlInicio-archivo.out.txt`):
  - `durante` cae con `respaldoEnSqlite: 0` y además con el diff entero de `drenaAlInicio`
    (`mazoPedido…: 1`, `terminado…: true`, `fin` antes de abrir).
  - El caso «un turno tomado con el respaldo ya empezado» sí se construye: el respaldo está en sus
    40 vueltas antes de SQLite. Lo que no se construye es «retenido en SQLite».
  - El comentario de la prueba, «CONTROL: ya habia empezado», dice más de lo que mide. En `antes`,
    el control vale 0 siempre (la puerta es `null`), y es un control vacío. Agente 2, re-leído.
  - Rojo que dice dos cosas, no un verde falso. Arreglo: el comentario, «CONTROL: el respaldo
    esperaba en SQLite».
- **`R9-305`, el corte:** ver §3.
- **`sueltaK`, «hasta 10»:** es 19; ver §3.

## 6. Que sea solo la prueba

`git diff --stat bc845c0 125736b`: solo `__tests__/backupRestoreSignal.test.ts` (98+, 50−).

## 7. La lección

- **Una puerta construye un punto del orden, no el tramo.** La 75 aprendió que una espera que ordena
  dos cosas se lleva la cobertura del otro orden, y construyó ese otro orden con una puerta. Pero la
  carrera vieja armaba un orden que no es ni «antes» ni «durante»: el store pedido antes y en el
  turno después (`R9-306`). Y la puerta, puesta antes del cuerpo de la transacción, deja sin armar
  lo que pasa dentro de él (`R9-307`). Al reemplazar una carrera por casos con puertas, listá los
  puntos donde la carrera podía caer, y corré la prueba vieja contra una regresión en cada uno
  (`de<sha>+pieza`).
- **Y leé el rojo entero de tu propia sonda.** La 75 miró el control en 0 y escribió «caso no
  construido», con el diff de la regresión en la misma salida (el corolario 55).
