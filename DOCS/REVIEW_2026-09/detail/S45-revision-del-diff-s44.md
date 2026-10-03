# Sesión 45 (2026-10-02): revisión del diff de la 44

**Modo:** solo terminal, sin agentes y sin tocar código. Arrancó con `_scratch/S45-PROMPT.md` (vale
más que el mensaje (y) de `CONTINUAR.md`).

**Estado al empezar:** `main` = `origin/main` = `35529db` (el checkpoint de la 44, mergeado y
pusheado; CI verde en el log, run `37069485600`, 368/4540). El último código es `c429604`, y
`_scratch/S44-SyncEngine-R250.ts.txt` es su motor (comprobado con `cmp`; NUL 0). Los docs del repo
decían «sin mergear» para la 44: este checkpoint lo corrige.

**Diff revisado:** `a731c23..c429604` (`SyncEngine.ts`, `types.ts` y `SyncEngine.test.ts`).

**Resultado:** `R9-251` tiene un orden con daño (la guarda se queda; falta su prueba). 1 nuevo,
`R9-252` (P3, ya existía). Hallazgos: **252**. Queda 1 P0 (`R9-38`).

---

## 1. Cómo se trabajó

- **Sondas** (en `_scratch`): `S45-sondas1.body.txt` (`S45-1`, `R9-251`), `-2` (`S45-2`, la
  prueba de `R9-248` con ocho rechazos de verdad) y `-3` (`S45-3`, `R9-252`). Cada una con su
  control en el mismo `it`.
- **Las piezas** son las de la 44 (`S44-piezas.cjs.txt`), con `S32_BASE` y `S34_PIEZAS` por ruta
  absoluta. Antes de creerle a cada sonda con pieza se miró el «aplicadas» de `S38-sonda` y que la
  salida difiere de la de hoy.
- **¿De la 44?:** medido con el motor de `1a77b78` (`S42-SyncEngine-R243.ts.txt`), con
  `S45-motor.cjs.txt`.
- Tras cada corrida: `cmp` igual, NUL 0 y `git status` limpio.

## 2. Las preguntas

### 2.1 `queryFloors` (`R9-247`): leído, sin daño

- **El piso que lee cada entrega es el de su listener:** `noteArrived` corre al LLEGAR, dentro del
  callback. Un re-enganche (`unregister` + `register`) fija el piso nuevo antes de suscribirse, y
  el lote viejo que espera en la cadena ya decidió con el suyo. Con la consulta sin filtro, el piso
  es 0: una reversión `removed` dice que la nube no tiene el doc, y no hay copia mía que nombrar.
  Con dos listeners de la misma colección (`R9-37`, abierto), los dos comparten un piso, calculado
  del mismo disco en el mismo instante.
- **¿La retirada al llegar le gana a una lectura que habría reconocido la copia?** No. Las dos
  leen lo mismo (`recentAcked`, `ownStamps`, el `own` de la entrada). Si el reloj de la copia de la
  nube está en memoria, está bajo el piso, y la llegada no retira. Si no está, `isOwnCopy` tampoco
  la reconoce en la lectura (tras reiniciar, `recentAcked` está vacío para las dos). El payload de
  la entrada (que `clocks` no lista) no lo retira nadie. Entre la llegada y la lectura, la memoria
  gana relojes solo por un ack (la lectura encuentra esa escritura y la ve) o por la relectura de
  la tabla: eso es la guarda `ownUnread` (2.2).
- **El comentario de `queryFloors`** dice que una entrega tardía, después de un `stop()`, «has no
  `uid`». Si ya entró otra cuenta, lee la suya. La conclusión vale igual (ninguna anotación de esa
  cuenta tiene ese reloj): nota en `R9-247`.

### 2.2 `R9-251`: hay un orden con daño (`S45-1`)

- **Lo que faltaba en `S44-2`:** el doc en conflicto EN MEMORIA cuando vuelve la relectura. En
  `S44-2` el conflicto estaba retenido, y el eco de W2 lo asentaba antes de la reversión.
- **El orden:** el proceso anterior dejó en doc-c la marca de relectura, el sello de mi respaldo
  W0 en la tabla (la nube es W0, bajo el piso) y W2 en la cola. Este proceso no puede leer la
  tabla, y la relectura queda esperando una puerta. El enganche lee W0, no lo reconoce, y doc-c
  queda en conflicto en memoria: «lo mio nuevo | mi respaldo», la degradación aceptada de
  `R9-219`. El servidor rechaza W2; la reversión llega y su lectura encuentra W0. Después, el ack
  de Wd (doc-d, otro conflicto) ensucia la tabla y dispara la relectura, que vuelve DESPUÉS de las
  dos retiradas. La app se reinicia sin red.
- **Medido:**

  | Motor                          | `ownRetired` tras el rechazo | tabla tras la relectura | tras reiniciar               |
  | ------------------------------ | ---------------------------- | ----------------------- | ---------------------------- |
  | hoy                            | [W0, W0]                     | doc-c [W0], doc-d       | sin conflicto                |
  | `R247unread` (sin la guarda)   | [W0, W2, W0]                 | solo doc-d              | «lo mio nuevo · mi respaldo» |
  | `1a77b78` (antes de la 44)     | igual que hoy                | igual que hoy           | sin conflicto                |
  | control (+1 ms, los 3 motores) | —                            | solo doc-d              | «lo mio nuevo · mi respaldo» |

  (`S45-1-hoy.out.txt`, `S45-1-R247unread.out.txt`, `S45-1-motor43.out.txt`.)

- **Conclusión:** la guarda decide. Sin ella, la reversión anota en `ownRetired` el reloj del
  payload (W2), que ninguna tabla tiene. La relectura descarta entonces el sello de W0, reescribe
  la tabla sin doc-c, y tras reiniciar mi propio respaldo vuelve a ser «su versión». **Propuesta
  (para la 46):** `S45-1` pasa a ser la prueba de la guarda, y debe caer con `R247unread`.

### 2.3 `H43propia` (`R9-245`): sin regresión; un daño viejo en lo que su control espera

- **Qué cambia la guarda** (leído): solo las copias mías MÁS NUEVAS que lo local, o sin copia
  local, con una escritura mía en la cola. Con la misma edad o más viejas, LWW ya las ignoraba, y
  con el conflicto en memoria decide antes su rama. Dejan de aplicarse la reversión de un respaldo
  (el caso), un reloj de este teléfono que fue para atrás, el eco con la referencia atrasada de
  `R9-174` (lo local ya lo tiene) y mi copia viva con mi lápida en la cola (sin copia local, antes
  la aplicaba hasta el eco de la lápida). Ninguna se aplicaba bien antes. Si la escritura de la
  cola se descarta después, lo local queda en ella, como cualquier escritura descartada (`R9-33`).
- **El control de su prueba** (el respaldo aceptado a la primera) no cambia con `R245`: en
  `S44-rev245-R245.out.txt` solo cae `rechazo`. Es un control válido.
- **¿`settle` pierde «lo suyo»?** Sí, pero no por la 44 (`S45-3`, ver 3).

### 2.4 `takeBack` (`R9-248`): leído, sin daño

- La anotación se consume con la primera entrega del doc, sea cual sea. Si el payload rechazado
  era igual a la vista, el SDK no levanta nada, y la anotación espera a la próxima. Lo que la casa
  después es el reintento del mismo payload (es mío) o un `removed` que trae ese payload. En la 43,
  ese `removed` no retiraba nada al llegar; hoy retira si todos mis relojes están sobre el piso. La
  44 lo mejora.
- Queda el otro con el mismo milisegundo, el límite de siempre de `isOwnCopy`.

### 2.5 `R9-249`: leído, sin daño

- El `own` cambiado llega a disco con el `persistQueue` del final del `flush`, justo después del
  `break` de `!isCurrent()`. En la sesión, ese mismo cambio espera al resto del lote.
- Si ya entró otra cuenta con una tabla sin leer, ese `persistQueue` primero la relee y escribe al
  volver: la ventana es una lectura de AsyncStorage, la misma que tiene el `splice` de al lado
  (`R9-104`). Las entradas son por `uid`, y la otra cuenta no toca las aparcadas.

### 2.6 Las pruebas nuevas

- **La de la lectura sola (`R9-246`)** siembra el sello de W3 y la marca de relectura. Es un estado
  alcanzable, pero no solo porque «murió antes de escribir». La retirada al llegar escribe la tabla
  en el mismo turno, antes de que la lectura falle y se guarde la marca, y AsyncStorage escribe en
  orden. Se llega si esa escritura esperó la relectura de otra colección, si falló, o si la tabla
  no se pudo leer en ese proceso. Nota en `R9-246`.
- **La de `R9-248`** fuerza `attempts = 7`. Con ocho rechazos de verdad (`S45-2`), cada
  reintento trae su eco, que vuelve a retener la marca, y su reversión, que la asienta. El octavo
  llega igual que el forzado: hoy los dos limpios; con `R248` (vista aplicada) los dos con «lo mio
  | mi respaldo», y «lo mio nuevo | mi respaldo» tras reiniciar (`S45-2-hoy.out.txt`,
  `S45-2-R248.out.txt`).
- **La de `R9-245`**: ver 2.3.

### 2.7 Los comentarios

- **`ownRetired` (`R9-250`), `noteArrived`, `rejectedAwaitingRevert` y `PendingWrite.own`** dicen
  lo que hace el código. El de `noteArrived` sobre la guarda `ownUnread` («which may hold one») es
  justo lo que mide `S45-1`.
- **`queryFloors`**: la premisa «has no `uid`» no es entera (2.1). La conclusión vale.

## 3. Lo nuevo: `R9-252` (P3, ya existía)

- **El caso** (`S45-3`): con un conflicto «lo mio | lo suyo» pendiente, el usuario edita el doc
  (`edita`) o restaura su respaldo (`respaldo`), y el servidor toma la escritura. Después, la app
  se reinicia.
- **Medido:** en la sesión, el conflicto sigue. Tras reiniciar, no hay conflicto, y local y nube
  quedan en lo mío. Con `edita`, la marca seguía en disco, pero la entrega de W1 (igual a lo local)
  la asienta por LWW. Con `respaldo`, la lectura del eco ya la había asentado en la sesión
  (`R9-190`). «Lo suyo» ya no está en la nube, y nadie eligió. El control (sin escritura) muestra
  el conflicto otra vez tras reiniciar.
- **¿De la 44?** No: el motor de `1a77b78` da lo mismo (`S45-3-motor43.out.txt`). Las pruebas de
  `R9-245` y `R9-248` lo dan por esperado.
- **Hipótesis, sin medir:** guardar «lo suyo» con la marca. Es una decisión de Victor.

## 4. Pendiente

- **Para la 46 (arreglos de la 45):** la prueba de `R9-251` (de `S45-1`, que cae con
  `R247unread`). La decisión de `R9-252` (guardar «lo suyo» en disco, o aceptarlo). Si se quiere,
  los dos comentarios: el de la prueba de la lectura sola (`R9-246`) y la premisa de `queryFloors`.
- Lo demás, como en el (y): `R9-240` (Modo C, con el OK de Victor), `R9-235`, `R9-241`,
  `R9-211`..`R9-214`, `R9-201`..`R9-203`, `R9-198`, `R9-205`, `R9-177`, `R9-38`, `A12`, `R9-164`,
  `R9-127`, `R9-173`, `R9-126`, `R9-133`.

## 5. Las lecciones

- **Una guarda que da 0 en la matriz puede decidir en un estado que ninguna prueba arma.** La de
  `R9-251` decide con el conflicto EN MEMORIA cuando vuelve la relectura; las pruebas y `S44-2` lo
  tenían retenido, y el eco de mi escritura lo asentaba antes.
- **Lo que una prueba da por esperado también se revisa.** Las pruebas de `R9-245` y `R9-248`
  esperan «tras reiniciar, ningún conflicto» con «lo suyo» todavía en la sesión: eso es `R9-252`.
