# Reglas que ya costaron caro — no las re-descubras

> Es la §5 de `CONTINUAR.md`, movida tal cual en la sesión 143 (2026-11-12): **todas rigen**, ninguna se retiró.
> El resumen por tema está en `CONTINUAR.md` §5 y lo mecánico en `RECETAS.md`. No hace falta leerla entera: antes
> de una tarea, `grep -n` del tema (el archivo, el hallazgo o la palabra). Las más nuevas de cada bloque están al
> final de ese bloque; las lecciones de las sesiones 12 a 24 están en
> `historial/CONTINUAR-lee-esto-antes-de-nada.md`.

- **Una rama hecha en la nube (o por un agente) se revisa en la máquina de Victor, no solo en
  CI.** La nube y el CI corren sin `NODE_ENV`, y Victor exporta `NODE_ENV=development`. Desde la
  24, `jest.config.js` lo fija (`R9-157`), pero cualquier otra diferencia de entorno se vería igual:
  verde allá y rojo acá. Revertí cada pieza en SU entorno antes de pedir el OK.
- **Un arreglo puede crear el caso que su premisa niega (sesión 25, `R9-160`).** `R9-36` supuso
  que «lo local de ahora» es siempre «lo mío», y es falso cuando lo cambió el LWW de un cambio del
  otro teléfono. Antes de dar por buena la premisa de un arreglo, preguntá quién más escribe en
  ese mismo lugar mientras el caso espera.
- **Después de apilar, re-medí la matriz entera, no solo el tramo nuevo (sesión 25, `R9-162`).** La
  guarda nueva de `9c425a8` tapó en las pruebas la de `a7d688e`, que estaba en otro commit y en
  otra tanda. La matriz de la tanda 3 midió solo las guardas nuevas.
- **⛔ La nube ya NO es una opción (el crédito se terminó el 2026-09-24).** No la propongas. Queda
  como registro el método que se usó en las sesiones 24 y 25: cada sesión en la nube entregaba su
  informe en una rama `review/sNN-*`, que NUNCA se mergeaba; el orquestador la bajaba a `_scratch`,
  verificaba cada P0/P1 con sonda propia en la máquina de Victor, y con su OK la borraba.
- **El contenido de un `removed` no dice qué pasó (sesión 26, medido en nativo).** El SDK entrega la
  última versión que casaba con la query y `exists: true`, también para un borrado de verdad. Antes
  de diseñar sobre «el cambio trae X», medí qué trae en el SDK real.
- **Una guarda que ninguna prueba puede vigilar se mide antes de quedarse (sesión 26).** Si su
  revert no hace caer nada, o falta la prueba o la guarda es equivalente por construcción. En el
  segundo caso, quitala.
- **Desde la sesión 28 (`d093a4e`), el mock de `onSnapshot` entrega el eco propio** (antes del
  ack), la reversión de un rechazo y la re-entrega al enganchar. También modela el hilo único de
  RNFirebase (`R9-177`): un `get()` retiene el ejecutor, y un `set()` emitido mientras tanto espera
  detrás, con su eco. Antes de afirmar un orden de eventos, preguntá cuál permite el SDK real.
- **Un mock que modela UNA propiedad del SDK puede producir órdenes que el SDK no produce (sesión
  28).** El eco sin el hilo único dejaba que la respuesta de la lectura trajera lo escrito durante
  ella: 4 pruebas de fallo dejaban de caer, y la entrada de `R9-176` afirmaba que su guarda no cubría
  `R9-178`. Con el orden de RNFB, una sola guarda cubre las dos.
- **Un diff de agente guardado a mitad de un revert se ve igual que una propuesta (sesión 28).** El
  de A2 traía revertida la pieza «sesión» (`session = this.flushSession` al empezar el lote). Antes
  de integrar un diff ajeno, leelo línea por línea contra su informe.
- **Una guarda que hace `settle` puede soltar la marca que otro arreglo del MISMO diff hizo durable
  (sesión 29, `R9-185`).** La guarda de `R9-176` se midió sin conflictos retenidos, justo lo que
  `R9-181` volvió durable. «Decide el eco» tiene que decir qué pasa si el eco no llega, o si llega y
  su reversión lo suelta. Y un plazo del motor (`withDeadline`) suelta el `await`, no el ejecutor
  nativo de RNFB (`R9-186`).
- **Un arreglo de la sesión puede abrir su propio vecino, y lo ve mejor quien busca romperlo
  (sesión 30, `R9-190`).** H1 movía la marca a «la copia que encontró la lectura», medido contra la
  copia del OTRO; la copia PROPIA (un respaldo restaurado) daba «lo mío contra lo mío». Ante una
  marca que se mueve a una copia, preguntá de quién puede ser esa copia.
- **Una pieza que caía en el worktree del agente puede no caer en el propio (sesión 30).** P1q de
  A2 caía por un fantasma que solo mostraban otras dos piezas que no se integraron. Re-medí cada
  pieza en el árbol que vas a commitear; no copies la tabla del informe.
- **Un comentario de prueba que dice la consecuencia tiene que verla (sesión 30).** Dos veces el
  revert tumbó el mecanismo sin llegar a la consecuencia (el `.catch` de la cadena, la escritura en
  cola de `R9-190`): se corrigió el comentario en vez de afirmar lo no visto.
- **Una hipótesis escrita en una decisión sigue siendo una hipótesis (sesión 31).** «El sello en la
  entrada de la cola cierra la ventana» venía en la delegación de `R9-193`; medido punto de caída por
  punto, dejaba abierto uno, y lo que la cierra es otra cosa (un solo `multiSet`).
- **En un prompt, nombrá la LÍNEA, no la palabra (sesión 31).** «El `fromRead` que queda
  equivalente» tenía dos candidatos; el prompt apuntó al equivocado y lo corrigió el agente
  midiendo los dos.
- **Los `.diff.txt` que deja PowerShell llevan CRLF (sesión 31):** `git apply` los rechaza
  («patch does not apply»); `sed 's/\r$//' <diff> | git apply`.
- **Python en Windows escribe CRLF** (`open(..., 'w')` sin `newline=''`): tras un script sobre un
  `.md`, `sed -i 's/\r$//'` o `newline=''`.
- **El orden de llegada y el de proceso son dos relojes (sesión 38, `R9-220`/`R9-222`).** Con la
  cadena de lotes (`R9-175`), un lote se procesa cuando ya llegaron otros detrás. Una decisión que
  depende de «qué llegó antes» se toma en el callback de `onSnapshot`, no al procesar.
- **Una sonda que deja de mostrar el daño tras un arreglo puede haberlo esquivado (sesión 38).** La
  de `R9-223` encolaba L2 después de la copia del otro, y el arreglo de `R9-222` hizo que L2 ya no
  llevara el reloj: el caso seguía abierto con la entrada ya en cola. Antes de cerrar, preguntá si
  el caso sigue construible por otro orden.
- **Una premisa que dice «sin X entre medias» tiene que preguntar si el caso mismo es X (sesión 39,
  `R9-237`).** La 38 razonó «sin copia ajena entre medias, toda entrega de la copia de la nube es
  mía», y el respaldo que el otro restaura ES la copia ajena, solo que trae mi reloj.
- **«El ack» tiene dos relojes (sesión 39, `R9-240`):** el del SDK y el de la continuación del
  `set` en el motor. Una premisa sobre el SDK no vale para el motor sin medir en qué orden llegan a
  JS la respuesta y el snapshot.
- **Dos guardas que se cubren entre ellas dan 0 cada una en la matriz (sesión 39, `R9-236`).** Y
  juntas pueden ser la causa de un daño: `207fold` y `207acum`. La matriz mide de a una pieza.
- **Una sonda puede dejar de mostrar su daño por un arreglo HERMANO de la misma sesión (sesión 40).**
  `S39-4` y `S39-5` usaban un respaldo de W2, y `R9-239` dejó a W2 sin sello: las dos «pasaban»
  con el caso todavía abierto. Antes de convertir una sonda en prueba, corrala sobre el árbol de
  hoy, y preguntá si sigue construyendo su caso.
- **Una guarda que «el eco siempre cubre» se mide con el eco esperando en la cadena (sesión 40,
  `Fresolve`).** La 39 leyó «el eco de la resolución asienta el doc», pero `settle` corre al
  procesar, y con la cadena ocupada el ack llega antes: ahí decidía la guarda que se iba a quitar.
- **Antes de afirmar una propiedad del SDK, leé también el envoltorio propio (sesión 40, `R9-241`).**
  En RNFirebase `change.doc` es un getter que crea un snapshot nuevo por lectura, y
  `src/lib/sync/firestore.ts` lo lee una sola vez: el motor ve un objeto por cambio.
- **Una pieza que no se aplicó da «sin daño» (sesión 41).** Con `S34_PIEZAS` relativa, `require` no
  la encontró, el apply falló dentro de `S38-sonda`, y tres sondas «pasaron» con el motor de hoy.
  Antes de creerle a una sonda con pieza, mirá que el motor cambió (el `git diff --shortstat` del
  apply, o el «diff del revert» de `S34-rev`), y pasá las rutas de entorno absolutas.
- **«Hace falta mientras la entrada espera, y no después de su ack» tiene que preguntar qué otros
  acks pasan mientras espera (sesión 41, `R9-242`).** La entrada que reemplazó una subida en vuelo
  sobrevive al ack de esa subida, con su reloj y el de antes en el `own`.
- **Toda retirada que corre al PROCESAR tiene el problema de `Fresolve` (sesión 41, `R9-243`).** Con
  la cadena de lotes ocupada, lo que llega después se juzga al llegar, antes de la retirada.
- **Un `fire` del mock con los datos de la nube y nada en vuelo es un evento que el SDK no levanta
  (sesión 41, `R9-244`).** El `View` del SDK compara los datos (`docsEqual`), y `__fire` no. Antes
  de leer una prueba con `fire`, preguntá si esa copia difiere de la nube.
- **Una hipótesis que cierra la sonda puede no cerrar el caso que nombra la entrada (sesión 42,
  `R9-234`).** `H239join` cerraba `S41-6` (con un ack en medio) y no la retirada sin nada después,
  que era lo que decía la entrada. Antes de aplicar la hipótesis de una revisión, construí el caso
  de la entrada, no solo el de la sonda.
- **Una decisión tomada con un veredicto que puede estar mal no se guarda sin lo que permite
  corregirla (sesión 42).** Con la tabla ilegible, «esta copia no es mía» puede ser falso
  (`R9-230`); guardar la retirada sola tumbó cuatro pruebas de `R9-208`, y guardarla con el reloj
  de la copia deja que la relectura la corrija.
- **`S41-motor` restaura su base encima de `SyncEngine.ts` también cuando falla (sesión 42).** Toma
  el motor por NOMBRE dentro de `_scratch`; con la ruta absoluta falla, y borró un arreglo sin
  commitear. Commiteá antes de correr una sonda con otro motor.
- **Una reversión es también una entrega de la nube (sesión 43, `R9-247`).** Vuelve a la copia que
  tiene el servidor, y esa copia puede ser del otro: una excepción que mira lo que trae el
  `removed` (mi payload rechazado) exime también la escritura del otro que viene con él.
- **Una escritura que el rechazo descarta deja de ser «mía» antes de que llegue su reversión
  (sesión 43, `R9-248`).** El descarte la saca de la cola, e `isOwnCopy` lee la cola.
- **Un arreglo de un hecho del servidor no se guarda con `isCurrent()` (sesión 43, `R9-249`).** El
  ack dice que la escritura llegó a la nube de su dueño, sea cual sea la sesión; con la guarda, el
  arreglo de `R9-242` valía solo dentro de ella.
- **Un reloj viejo en una escritura propia rompe toda premisa de «más nueva que lo local» (sesión
  43, `R9-245`).** El respaldo restaurado lleva el `updatedAt` del archivo.
- **Un arreglo de la sesión puede quitarle el caso a la prueba que la misma sesión acaba de escribir
  (sesión 44, `R9-246`).** La de la lectura sola dejó de caer con su pieza dos commits después, con
  `R9-247`. Re-medí las piezas de los commits anteriores tras cada arreglo, no solo en la matriz.
- **Una guarda agregada por un veredicto incierto también se mide (sesión 44, `R9-251`).** Si su
  revert no tumba nada, escribí qué muestra la sonda (el mecanismo) y qué falta (el daño).
- **«Equivalente por construcción» se razona con la cadena entera (sesión 44).** El `clear()` del
  piso en `stop()` parecía higiene. Una entrega tardía lee `uid` nulo, ninguna anotación casa, y
  nunca llega a leer el piso.
- **Una guarda que da 0 en la matriz puede decidir en un estado que ninguna prueba arma (sesión
  45, `R9-251`).** La de `ownUnread` decide con el conflicto EN MEMORIA cuando vuelve la
  relectura. `S44-2` lo tenía retenido, y el eco de mi escritura lo asentaba antes. Antes de
  proponer quitar una guarda, variá el estado del doc, no solo el orden.
- **Lo que una prueba da por esperado también se revisa (sesión 45, `R9-252`).** Las pruebas de
  `R9-245` y `R9-248` esperan «tras reiniciar, ningún conflicto» con «lo suyo» todavía en la
  sesión, y eso era el daño.
- **Una decisión de aceptar un daño también se escribe donde ocurre (sesión 46, `R9-252`).** El
  comentario va en la rama que asienta el conflicto, para que la próxima revisión no lo
  re-descubra como hallazgo.
- **Un comentario que enumera casos se mide caso por caso (sesión 47, `R9-253`).** El de `R9-252`
  generalizó «un respaldo restaurado» a partir de una sonda que tenía uno solo, bajo el piso.
- **Una guarda que espera a releer necesita una salida (sesión 49, `R9-212`).** Una lectura puede
  fallar siempre (un valor más grande que la `CursorWindow` de Android), y «no escribir hasta
  leer» convertía una pérdida de una vez en una permanente. Antes de esperar, preguntá si el fallo
  puede ser determinista.
- **Una unión que devuelve una entrada vieja pregunta si su doc cambió desde entonces (sesión 49).**
  `set` no tiene guarda: sin la marca, la entrada de disco subía encima de la edición nueva o de la
  copia del otro.
- **El control también se lee entero (sesión 49).** El caso con la cola legible era solo el control
  de la unión, y su final (local R, nube D) era un disparador común de `R9-126`.
- **Una pieza que dice «el arreglo entero» se compara con el motor de antes (sesión 50,
  `R9-254`).** `R212` quitaba la bandera y dejaba la asignación nueva de `hydrateQueue`. Con la
  pieza, una escritura durante la hidratación se perdía igual que hoy; con el motor de `8f59942`,
  quedaba. Un «¿lo abrió el arreglo?» se mide con el motor del commit anterior
  (`_scratch/S50-viejo.cjs.txt`).
- **«La copia aplicada es más nueva» pregunta qué pasa sin copia local (sesión 50, `R9-256`).** LWW
  compara con lo local, y sin lo local no compara nada. Una lápida en cola es justo ese caso, y la
  entrada es la más nueva.
- **Un estado que vive solo en memoria protege solo mientras vive el proceso (sesión 50,
  `R9-255`).** Si la decisión se escribe en disco más tarde, preguntá qué queda en disco si el
  proceso muere antes.
- **«Los duplicados son inocuos» se coteja con el ledger (sesión 51, `R9-257`).** El motor lo
  decía del bulk push, y `R9-126` dice lo contrario: un push con el reloj viejo pisa la copia más
  nueva. «No grabar el flag» habría repetido el push entero; se reintenta solo la colección que
  falló.
- **Una guarda nueva junto a una vieja se mide con la pieza de la vieja (sesión 51, `R9-259`).**
  `R9-256` tapó la guarda de `R9-197` en su única prueba: sola daba 0, y con `R256` volvía a caer.
- **El control de una prueba de orden se fuerza, no se supone (sesión 51).** «La lectura vuelve
  antes del ack» era falso sin `mockSetGate`, y lo mostró el control en la primera corrida.
- **Una puerta del mock en una lectura tiene que ver el disco de cuando se pidió (sesión 52,
  `R9-260`).** AsyncStorage en Android corre en un `SerialExecutor`: una escritura pedida durante
  una lectura lenta va detrás. La puerta de `colaIlegible` lee al abrirse, y con el motor viejo el
  caso de `R9-115` «pasaba». Antes de un «¿lo abrió?», preguntá si la sonda deja escribir durante
  la lectura.
- **Una marca que se vacía al usarse pregunta qué pasa si se usa dos veces (sesión 52,
  `R9-260`).** `joinQueue` vacía `queueTouched`, y dos `start()` del mismo uid pedían dos
  hidrataciones: la segunda unión volvía a meter la entrada vieja.
- **Una guarda que dice «atendido» adelanta el cursor (sesión 52, `R9-262`).** Lo que deja fuera
  no vuelve a llegar, y el final cambia según haya o no un reinicio entre medias. Una guarda que
  espera a otra escritura retiene; no asienta.
- **Una aceptación vale para la ventana que midió (sesión 52, `R9-261`).** `R9-255` se aceptó
  «tras dos lecturas fallidas», y la 51 abrió la misma ventana sin ninguna.
- **Una escritura que espera una lectura previa se ordena con las que vienen detrás (sesión 53,
  `R9-38`).** La edición sin sesión espera a leer el dueño; la de la sesión que llegaba después
  subía y salía de la cola antes, y la vieja subía encima. Ninguna comprobación sobre la cola lo ve
  después: se ordenan en la misma cadena.
- **Un marcador que significa algo no usa un valor vacío (sesión 53).** `''` vuelve como `null` en
  el mock de AsyncStorage, y un dueño nulo significa «no preguntar». Se usa un valor explícito que
  no es de nadie (`(deleted)`).
- **Antes de arreglar un camino del motor, comprobá que los llamadores llegan a él (sesión 53).**
  Con la sesión cerrada el motor existe, parado: si `getSyncEngine()` hubiera devuelto `null`, el
  arreglo de `R9-38` habría pasado sus pruebas sin servir en la app.
- **Una guarda que pasa de asentar a retener puede cubrir a otra en su prueba (sesión 53).**
  `S176cola` perdió el testigo de `R9-197`; con `R256` vuelve a caer. Medilas juntas.
- **Una unión que dice «gana X» pregunta qué pasa con lo que pierde (sesión 54, `R9-269`).**
  `joinPrep` borraba la clave de origen entera, también la entrada que no ganó: «cerrar sesión no
  borra nada» se cumplía al cerrar y se rompía al volver a entrar.
- **Un marcador escrito por otro, después y tragándose el fallo, puede decir la cuenta anterior
  (sesión 54, `R9-270`).** El motor usa el dueño que dice `start()` en el proceso, y en el
  siguiente, el disco.
- **Una ventana sin sesión no tiene quien relea (sesión 54, `R9-271`).** Con sesión, `start()`
  relee la cola; sin ella, la edición espera a la escritura siguiente.
- **Una prueba de una carrera tiene que construirla (sesión 55, `R9-269`).** La primera versión
  de la prueba no la construía: todo chocaba, la unión no escribía y la puerta no retenía. Pasaba
  sin el turno; su control (`antesDeAbrir`) lo mostró al revertir la pieza.
- **Un turno compartido con una espera dentro se traba (sesión 55).** La clave de la Mesa espera al
  primer estado de auth, cuya unión toma un turno: se resuelve la clave antes de pedir turno.
- **En el mock, `setItem` pasa por `multiSet` (sesión 54).** Una puerta sobre todo `multiSet`
  cuelga la prueba, y un `spyOn` sobre un `jest.fn` devuelve el mismo, que se llama a sí mismo
  (memoria agotada): la puerta, solo en la llamada a retener, y la implementación real con
  `getMockImplementation()`.
- **Un turno sobre una clave pregunta quién más escribe esa clave (sesión 56, `R9-273`).** La 55
  puso en turno los cuatro stores de la Mesa, y el respaldo escribe las mismas claves fuera de él:
  restaurado durante una unión, se pierde. Antes de cerrar una carrera, buscá (`grep`) cada
  escritor de la clave, no solo los que tocó el defecto.
- **La premisa de una pregunta también se mide (sesión 56).** La del prompt de la 56 («las
  ilustraciones y la autoevaluación no tienen reloj») venía del detalle de la 55, y las cuatro
  Mesas tienen `updatedAt`.
- **Para sondear el respaldo, `importBackup` real con los mocks de `backupServiceImport.test.ts`
  (sesión 56).** SQLite y los logros, mockeados; el resto (la clave de la Mesa, el `multiSet`) es
  el de la app (`_scratch/S56-prep.test.ts.txt`).
- **Una puerta armada con `getMockImplementation()` hereda lo que dejó la prueba anterior del
  archivo (sesión 57, `R9-273`).** En `backupServiceImport.test.ts`, un `spyOn` sobre el `multiSet`
  del mock y su `mockRestore` lo dejan llamándose a sí mismo: la prueba pasaba sola (`-t`) y caía
  con el archivo entero. Una prueba con puerta va en un archivo donde nadie espía el mock
  (`__tests__/backupPrepTurn.test.ts`).
- **Una sonda de una carrera que espera (`await`) la escritura que compite se traba en cuanto el
  arreglo la pone en turno (sesión 57).** `RESPALDO` de la 56 se esperaba a sí misma sobre el árbol
  arreglado (y dejaba la puerta puesta para las siguientes). No esperes nada antes de abrir.
- **Una nota que dice «termina esto al arrancar» se escribe cuando ya no queda nada que decidir
  (sesión 57, `R9-274`).** Escrita antes de `deleteUser`, el arranque siguiente tendría que adivinar
  si la cuenta existe, con un estado de auth que puede pasar por nulo al restaurar la sesión.
- **Una escritura «para la cuenta de cuando se pidió» pregunta qué pasa si esa cuenta deja de
  existir mientras espera (sesión 58, `R9-275`).** El turno de la 57 ordena el respaldo con la
  devolución de `deleteAccount`, pero no cambia su clave: lo restaurado llega después y queda bajo
  el uid borrado. Para sondear el respaldo a mitad de camino, una puerta en `withTransactionAsync`
  del mock de SQLite (`_scratch/S58-prep.test.ts.txt`).
- **Una nota de un solo lugar pregunta qué pasa si se escribe dos veces antes de leerse (sesión
  58, `R9-276`).** La de `R9-274`: otra devolución en el mismo proceso la pisa.
- **Antes de llevar una escritura tardía a donde fue su Mesa, preguntá si es un parche o un
  reemplazo (sesión 59, `R9-275`).** La de un store edita una sección, y se redirige a la «sin
  cuenta»; la del respaldo reemplaza el mapa, y se escribe y se une. Cambiadas, la primera borra
  secciones (una entrada parcial con el reloj más nuevo gana la unión) y la segunda borra lo
  devuelto.
- **Una colocación que hoy da lo mismo por el orden de las microtareas se mide y se escribe
  (sesión 59).** `mismoTurno` (anotar la cuenta devuelta fuera del turno) no cae: la continuación
  del `await` corre antes que la tarea siguiente del turno. Se dejó la colocación robusta, y el
  comentario dice solo lo que se ve.
- **Para mover una rama, `git branch -f`, nunca `git reset --hard` con cambios sin commitear
  (sesión 59).** Un `reset --hard` para alinear la rama de docs con la de arreglos borró el ledger
  editado. Se recuperó del respaldo que lint-staged deja en cada commit (un `git stash create`, que
  queda inalcanzable): `git fsck --unreachable --no-reflogs`, el «WIP on …» de la hora del último
  commit, y `git checkout <hash> -- <archivos>`. Commiteá el ledger antes de cambiar de rama.
- **Una revisión en el mismo chat que escribió los arreglos no es una mirada fresca (sesión 60).**
  Se dice en el detalle, y se compensa con sondas que buscan romperlos (casos de fallo, basura,
  datos que crecen), no con las que ya pasaban.
- **El ejecutor serie de AsyncStorage ordena lo que CORRE, no solo lo que llega (sesiones 61 y 62,
  `R9-281`, `R9-283`).** La 61 escribió «una puerta por lectura, abiertas en `act` distintos», y no
  alcanzaba. Su puerta tomaba la foto al pedir y solo demoraba la entrega, así que la escritura del
  respaldo se completaba mientras la relectura esperaba: un orden que el teléfono no produce. La
  prueba de la guarda `nueva` afirmaba lo contrario de lo que pasa (en orden serie, la salida pisa
  el respaldo). En el ejecutor serie, nada pedido después de una operación pendiente corre ni llega
  antes que ella. Usá el modelo de `_scratch/S62-sondas-agente-3/S62a3-orden.test.tsx.txt`, y con
  el mock plano preguntá qué orden construye la puerta.
- **Una carga que reemplaza el estado pregunta qué se escribió mientras estaba en vuelo (sesión 61,
  `R9-277`).** `setDeck(clean)` borraba lo agregado durante la lectura. Y la relectura de una guarda
  que espera es también una carga: lo editado que la disparó tiene que quedar encima. **Pero (sesión
  62, `R9-279`)** poner encima lo editado no distingue un alta condicional («si no está») de una
  edición: un alta sobre un mazo sin leer reemplaza lo que había.
- **Una salida que vive en un efecto necesita un render (sesión 62, `R9-280`).** `setHydrated(true)`
  con `hydrated` ya en `true` no renderiza, y la relectura de la recarga fallida quedaba esperando
  otra edición. Antes de escribir «espera solo lo que tarda una lectura», recorré cada camino que
  falla.
- **El worktree de un agente que termina sin cambios trackeados se borra solo con su `_scratch`
  (sesión 62).** Al agente 2 el harness no lo dejó escribir por ruta absoluta en el árbol principal,
  y su sonda se perdió. Pedile que devuelva el informe íntegro en su mensaje final, y copiá enseguida
  lo que haya en su `_scratch`.
- **Un arreglo que agrega un aviso previo cambia qué órdenes son posibles (sesión 63, `R9-281`).**
  Dos pruebas pedían la escritura del respaldo antes de que el alta pidiera su relectura; con el
  aviso de inicio, el alta ya no relee, y solo su control lo mostró (2 lecturas en vez de 3). Tras
  un arreglo de orden, mirá que el control de cada prueba siga construyendo su caso, y reordená al
  orden que el arreglo deja posible.
- **Una prueba colgada tumba las siguientes del archivo (sesión 63).** Una prueba que hacía `await`
  de la escritura que compite se colgó 20 s con una pieza revertida, y las 12 siguientes cayeron con
  «Can't access .root on unmounted test renderer»: una caída que parecía trece. Mirá la duración de
  cada prueba antes de leer una matriz, y usá banderas en vez de `await` (la regla de la 57).
- **Medí después de formatear (sesión 63).** Prettier sangró una función entera al agregarle un
  parámetro: las anclas de una línea del revert siguieron casando como subcadena, las de varias no.
  El script tiene que decir «ancla … 0 veces» y seguir, no abortar ni pasar en silencio.
- **Para saber si una prueba depende de cómo el modelo intercala las entregas, separalas y re-medí
  la matriz (sesión 64).** `enSerie` entrega con microtareas, y la respuesta n+1 puede llegar en
  medio de la cadena de la n; en el teléfono cada respuesta llega en su tarea. Demorar cada entrega
  K microtareas (`_scratch/S64-serie.cjs.txt`) y comparar qué tumba cada pieza lo responde.
- **Un comentario sobre el orden en la ventana del respaldo tiene dos casos (sesión 64, `R9-286`).**
  Con el `multiSet` ya pedido, lo de después corre detrás y la recarga lo lee; con el turno de la
  Mesa, todavía no está pedido, y lo de después corre antes y el respaldo lo borra. Contá los dos.
- **Un arreglo de solo comentarios se verifica con su control (sesión 65).** El JS emitido sin
  comentarios, idéntico al de `main` (`_scratch/S65-igual.cjs.txt`), prueba que no cambió nada más
  solo si el comprobador sabe decir «distinto»: contra un commit con código distinto tiene que
  fallar. Y se re-corre sobre lo commiteado, porque el hook de lint-staged re-formatea.
- **Cuando un comentario cuenta un segundo caso, buscá la pieza que conserva el primero y rompe el
  segundo (sesión 66, `R9-287`).** La 65 escribió el caso del turno en cuatro comentarios. Pero con
  el aviso de inicio movido dentro del turno (`enTurno`, `_scratch/S66-turno.cjs.txt`), el caso que
  vigilan las pruebas queda igual, lo editado durante la espera se pierde, y las 125 suites
  relacionadas pasan. Y el JS emitido es ciego a los tipos: sumale las líneas tocadas que no son
  comentario.
- **Un comentario nombra la lectura que decide, no «la siguiente» (sesión 67, `R9-288`).** Con una
  carga vieja en vuelo cuando llega el aviso del respaldo, la siguiente en llegar no es la que suelta
  lo editado. La hipótesis de la 66 («as the next read will find it») repetía, una lectura más allá,
  el mismo error que corregía.
- **Nada de barras invertidas ni acentos graves en un `node -e` (sesión 67).** Dentro de comillas
  dobles, bash ejecuta cada `` `…` `` como un comando: el script de anclas abortó sin escribir, pero
  pudo no hacerlo. Para un cambio de docs con código, Edit o un `.cjs.txt` escrito con Write.
- **Si una prueba espera N vueltas a que algo pase, corré la pieza que lo DEMORA más allá de N, con
  el código bueno (sesión 68, `R9-289`).** La prueba de `R9-287` cae con el respaldo 25 vueltas más
  lento y el aviso en su lugar (`lento`, `_scratch/S68-turno.cjs.txt`), con el mismo diff que
  `enTurno`. Sus dos `CONTROL` valen 0 y «no» también cuando el respaldo no llegó al turno: les
  falta el que dice que el caso llegó.
- **Una pieza que muestra una forma se corre en el suite, no solo en la prueba que la motivó
  (sesión 69, `R9-290`).** La 68 corrió `lento` en modo `archivo`. En el suite tumbó también el caso
  `muere` de `R9-275`: 20 vueltas fijas, controles que miran un paso anterior, y un rojo que se lee
  como pérdida de datos cuando el caso no se construyó.
- **La pieza que demora se corre también JUNTO con la regresión (sesión 70, `R9-291`).** Una vuelta
  que espera el daño (`i < 20 && !restaurado`) da siempre N vueltas con el código bueno, y con un
  caso más lento que N la regresión no llega a mostrarse. La prueba de `R9-273` cae con `sinTurno` y
  pasa con `lentoSinTurno` (`_scratch/S70-turno.cjs.txt`). Y para comparar el rojo de una pieza
  que demora con el de la regresión, medí el segundo con el caso construido (`R9-290`: eran
  distintos).
- **Antes de cambiar «N vueltas fijas» por «hasta que llegue», preguntá qué pasaba en las vueltas
  que sobraban (sesión 71, `R9-290`).** La primera versión del arreglo salía en el primer `multiSet`
  colgado y dejaba de ver lo que el proceso hace mientras la devolución cuelga: con la nota quitada
  unas vueltas después, la prueba vieja caía y la nueva pasaba. Lo vio el agente que buscaba
  romperla, no el que la escribió. Y un control que se lee al final de dos vueltas no dice en cuál
  llegó: se lee al terminar la que lo espera.
- **Un control de llegada tiene que nombrar QUÉ llegó (sesión 72, `R9-293`, `R9-295`, `R9-292`).**
  `turnoPedido` cuenta el pedido y no la escritura: con la demora DESPUÉS del pedido
  (`sinColaLento25`), la prueba de `R9-273` pasa con el control en 1. `colgadas` cuenta un colgado
  de la clave, y con `releaseSinEsperar` el colgado es la devolución del borrado, no la del
  respaldo. Y la sonda `suelta` de la 71 contaba dos retenciones que no eran las que importaban.
  Corré la demora también después del paso que el control cuenta, y que el control lea el
  CONTENIDO (`colgadaCon`), no un conteo.
- **El worktree de un agente se borra solo al terminar, con su `_scratch` (sesión 72).** El
  `_scratch` está en `.gitignore` y no cuenta como cambio: al agente 1 se le perdieron las sondas.
  En el prompt, pedí desde el principio que copie su `_scratch` al principal con `cp` antes de
  terminar.
- **«No pasó» no es «estaba esperando» (sesión 73, `R9-296`, `R9-297`).** Una prueba de invariante
  («mientras la escritura del respaldo está en vuelo, ninguna otra corre») ve la regresión solo si la
  otra escritura llegó a pedir el turno y está esperando: si es lenta, «no escribió» vale igual, y
  la prueba pasa con el turno roto. Y un control que se lee después de abrir la puerta cuenta el
  paso, no la retención. Preguntá qué control dice que lo otro está EN LA COLA.
- **Medí el corte, no solo una demora grande (sesión 74, `R9-297`, `R9-302`).** La 73 midió `tarde25`
  y escribió «25 vueltas»; con `tarde1` (`_scratch/S74-sonda.cjs.txt`) ya caen la prueba de `R9-273`
  y la de `R9-287`, esta con el diff exacto de `sinCola`: el margen de hoy es cero. Cuando una pieza
  que demora tumba una prueba, bajá la demora hasta donde deja de tumbarla, y escribí ese número.
- **Una espera que ordena dos cosas se lleva la cobertura del otro orden (sesión 75, `R9-303`).** La
  prueba de `R9-287` veía «un turno tomado con el respaldo ya empezado» por una carrera de
  microtareas, la misma que daba su rojo engañoso (`R9-302`). Al esperar al store, el arreglo cerró
  la carrera y con ella esa cobertura, y ninguna de las 999 la tenía (`drenaAlInicio`, del agente
  que buscaba romperlo). Cuando un arreglo fija un orden que antes era una carrera, corré la prueba
  vieja contra las regresiones del otro orden, y construí ese orden como su propio caso, con una
  puerta (`durante`, con el respaldo retenido en SQLite).
- **Una puerta construye un punto del orden, no el tramo (sesión 76, `R9-306`, `R9-307`).** La 75
  cambió la carrera de la prueba de `R9-287` por dos casos con puertas (`antes`, `durante`). La
  carrera vieja armaba un tercer orden, el store pedido antes del respaldo y en el turno después
  (`generacion`: la prueba vieja cae y las 1000 de hoy pasan). Y la puerta, puesta antes del cuerpo
  de la transacción, deja sin armar lo que pasa dentro de él (`drenaEnSqlite`). Al cambiar una
  carrera por casos con puertas, listá los puntos donde podía caer la carrera, y corré la prueba
  vieja y la nueva contra una regresión en cada uno (`de<sha>+pieza`). Y leé el rojo ENTERO de tu
  propia sonda: la 75 vio un control en 0 y escribió «caso no construido», con el diff de la
  regresión en la misma salida.
- **Las regresiones de orden vienen en dos clases, y cada una necesita su extremo (sesión 77,
  `R9-307`).** Las que fijan demasiado pronto lo que van a esperar (`drenaX`) se ven si lo otro
  entra lo más TARDE posible; las que sueltan lo que ya tenía el turno (`reiniciaX`), si entra lo más
  TEMPRANO. Mover la puerta de SQLite al final del cuerpo le dio a `durante` el extremo tardío, y le
  quitó `reiniciaEnSqlite`, que sigue viendo `antes`. Al mover una puerta, corré una regresión de
  cada clase y comprobá que algún caso la siga viendo.
- **Un caso que fija el momento de una clave fija también qué marcas puede ver (sesión 78,
  `R9-309`).** `pedido antes` suelta la clave del store en la puerta de SQLite. Una regresión que
  pregunte «¿empezó un respaldo desde que me pidieron?» la ve si la marca va antes de la puerta
  (`genEnSqlite`, `genFinSqlite`), y no si va en el aviso (`genTrasSqlite`, 1001/1001), donde la
  pondría cualquiera. Para la clase «lo pedido antes de una marca», el extremo es lo más TARDE
  posible, con lo otro ya en su turno (`copia292`). Corré la marca en cada punto, también después
  de la puerta.
- **Una regla escrita sin su prueba no protege (sesión 78, `R9-310`).** La traba de la 55 («se
  resuelve la clave antes de pedir turno») está escrita aquí, en §5. Un `prepWrite` que toma el
  turno antes de la clave pasa las 1001 (`turnoAntesDeClave`); la sonda `copiaClave` lo traba en
  100 vueltas. Cuando una regla de §5 dice «X se traba» o «X pierde datos», buscá la prueba que lo
  arma.
- **Medí el corte de tu propia prueba antes de commitearla, y mirá QUÉ rojo da ahí (sesión 79,
  `R9-310`).** La primera versión de la prueba de la traba esperaba 100 vueltas: con la unión 100
  vueltas más lenta (`migraLenta100`, código bueno) daba el rojo exacto de la traba, el defecto de
  `R9-289`. Separá «llega tarde» de «no llega»: una espera más larga (1000) y un campo propio
  (`aTiempo`). Y una prueba de una traba no pasa por una cola de módulo que no se reinicia: con
  `savePrepNote`, la traba tumbaba 4 pruebas siguientes (`conSave`); con `prepWrite` directo,
  ninguna.
- **Un control que cuenta llamadas no dice que la puerta retuvo: compará la identidad de lo
  retenido (sesión 80, `R9-311`).** `pedidaAntes` arma su caso con un `spyOn` de `prepKey`. Con la
  clave sin retener (`claveCapturada`), el caso no se construía y el rojo era el diff exacto de la
  regresión, con `otraPedidaAntes: 1` (contaba `prepWrite`, no LA clave). Y un contador que se lee
  al final cuenta también lo de antes del caso. Si un `spyOn` arma el caso, el control dice que la
  llamada que importa recibió lo que el `spyOn` devolvió.
- **«Lo más tarde posible» se mide contra el turno ENTERO del otro (sesión 80, `R9-313`).** La 79
  soltó la clave con el `multiSet` del respaldo retenido y escribió «lo más tarde posible». Con una
  cuenta borrada, el turno del respaldo sigue con la devolución de `R9-275`, y una marca ahí
  (`genTrasMultiSet`) no la ve nadie. Y un comentario que dice «después de» necesita un control de
  orden: un resultado final que sale igual en los dos órdenes no lo es (`R9-312`).
- **Un control de orden lee algo que solo existe DESPUÉS del primer evento (sesión 81, `R9-312`,
  `R9-314`).** `recibida: '@prep_notes:ana'` decía la cuenta, y la cuenta la fija `setPrepAccount`
  antes de la unión: con la clave resuelta al fijarla (`claveAntesDeUnion`), pasaba igual. Lo que
  dice «después de la unión» es lo que la escritura leyó (`leido`, lo que la unión escribió). Y corré
  la regresión que armaste para probar un control también contra los otros caminos que dependen de
  la misma garantía: contra una lectura, `claveAntesDeUnion` mostró `R9-314`. Un tope nuevo vale
  para todos los casos que pasan por él: la salida de `R9-313` le puso 100 vueltas también a
  `devolucion`.
- **Un control nuevo se corre también contra un cambio BUENO de su superficie (sesión 82,
  `R9-315`, `R9-316`).** La 81 midió el control por identidad de `R9-311` contra regresiones
  (`claveCapturada`, `claveDosVeces`), y un `.then(k => k)` en el store (`claveEnvuelta`) lo hace
  caer con el caso armado: comparaba la promesa, y lo que importa es que la escritura espera la clave
  retenida (`arregloPendiente`: la clave sigue pendiente). Que el control lea lo que importa, no la
  forma en que llegó. Y una salida armada para una traba cubre la que la motivó: medila con una que
  llegue por otro camino (`turnoAntesSqlite` traba la devolución por la puerta de SQLite, y la
  salida que suelta la clave no la saca).
- **Un arreglo de un control cambia también su espera: medí el corte otra vez (sesión 83,
  `R9-315`).** Contar las claves pendientes aceptó el cambio bueno, y cada vuelta de la espera pasó
  a esperar una más para ver la clave: el corte de un store lento se movió de 20 a 41 vueltas. Y
  una salida se escribe una vez, y suelta TODO lo retenido (`devolverConTope`, `R9-316`): así no
  depende de adivinar qué la trabó.
- **«Esperaba» se mide contra «tardó» (sesión 84, `R9-317`).** `antes: null` tras un
  `setTimeout(0)` dice que la lectura no terminó en 1 ms: una clave que espera el primer estado a lo
  sumo 250 ms pasa las 1004. Para decir que algo espera un evento, dale todo el tiempo (relojes
  falsos, una hora) y mirá que siga esperando. Es la regla de la 73, en el tiempo real.
- **Un control de «pendiente» se corre contra algo pendiente por su cuenta (sesión 84, `R9-318`).**
  La 83 midió el suyo contra un cambio bueno (`claveEnvuelta`) y contra claves que resuelven
  enseguida (`claveCapturada`). Una clave de otro lado que tarda 5 vueltas da 1 con el caso sin
  armar, y la prueba pasa con `genTrasMultiSet`. Que el control lea el estado en el momento que
  importa (justo antes de soltar), no tras una vuelta.
- **Un reloj falso da tiempo, no vueltas (sesión 85, `R9-317`).** `advanceTimersByTimeAsync` de una
  hora casi no cede al bucle real: con la lectura una vuelta más lenta (`lecturaLenta1`, un cambio
  bueno), el control `antes` volvía a no ver una clave sin esperar. Para decir «sigue esperando»,
  dale el reloj (una hora) y las vueltas (1000), y escribí el corte (995 se ve, 1005 no).
- **«Pendiente hasta que se suelta» se lee a los dos lados del momento (sesión 85, `R9-318`).**
  Pendiente justo antes de soltar no dice que lo soltado la liberó: una clave de otro lado más lenta
  que todo el caso también lo está (`claveCapturadaLenta100`, y con `genTrasMultiSetD` la prueba
  pasaba). Lo que dice «el caso se armó» es que VOLVIÓ después, con lo otro todavía retenido. Y una
  hipótesis medida en una revisión se vuelve a medir, al integrarla, contra algo lento por su cuenta:
  las dos de la 84 tenían un hueco.
- **«Volvió la clave» no es «llegó al turno» (sesión 86, `R9-319`).** La 85 leyó su control en el
  momento justo, pero sobre la clave, un paso antes de lo que afirma. Con `prepWrite` 20 vueltas
  entre la clave y el turno (`tardeClaveK`, un cambio bueno), el control da 1 con el caso sin armar,
  y `genTrasMultiSetD` pasa. Que el control lea el último paso antes de lo que afirma (aquí, que la
  otra espera el turno: el gancho de `R9-296`). Y cuando un control tiene una ventana, medila caso
  por caso, imprimiendo los controles (`muestra`).
- **Una lección también se mide antes de escribirla (sesión 87, `R9-319`).** El primer borrador del
  detalle decía «un control del último paso no reemplaza a los anteriores; plegados, dejaban un paso
  sin leer». Lo segundo era falso por construcción: plegado, el control es un Y de los dos pasos, y
  solo calla cuál falló. Lo primero no lo mostró ninguna de diez corridas sin el control de la clave
  (`soloEnEspera`). La frase que va a §5 y a la memoria es una afirmación como cualquier otra: con su
  sonda, o sin número.
- **Un contador compartido no dice de quién es lo que cuenta (sesión 88, `R9-320`).** El gancho de
  la 87 cuenta todos los pedidos del turno, y la prueba lo lee como «la otra espera». Con un pedido
  ajeno de la Mesa en la ventana (`ajenoTarde5`), da 1 con la otra sin pedir y
  `genTrasMultiSetD+tardeClave25` pasa; con la otra pidiendo (`ajeno`), da 2 y la prueba cae con el
  código bueno. Un control que lee un registro compartido dice de quién es lo que cuenta
  (`porClave`), y se corre con algo ajeno en la ventana, también con algo que llega dentro de ella:
  la resta (`delta`) pasaba con `ajenoTarde20`. Y un riesgo que el detalle nombra «sin sonda» es lo
  primero que se mide: la 87 nombró este.
- **Que una prueba caiga por OTRO caso no cierra el hueco del primero (sesión 89, `R9-320`).** La 88
  midió el residuo de `porClave` con un ajeno de `@prep_notes` (`ajenoClaveTarde5`), vio caer la
  prueba por `devolucionPedidaAntes` y escribió «cae igual por el otro caso». Con un ajeno de la
  clave de cada caso (`ajenoAmbasTarde5`), `genTrasMultiSetD+tardeClave25` pasa. Un residuo se mide
  en cada caso que lo lee, con la pieza hecha para ese caso.
- **Un comentario que describe un dato es una definición: medí un cambio que la siga al pie de la
  letra (sesión 90, `R9-321`).** El del `Set` de `oneAtATime` dice que cada pedido lleva «what it
  writes». Un gancho hecho así (`etiquetaDesviada`), sin cambiar nada de lo que hace la app, tumba la
  prueba de `R9-292` con el código bueno: con la cuenta devuelta, la otra pide con la clave de Ana y
  escribe en la «sin cuenta», y la prueba lee la clave que resolvió. Y una deducción sobre el orden
  se mide antes de decirla: la 90 dedujo de `giveBack` que Ana no estaba devuelta al pedir, y
  `etiquetaDesviada` mostró lo contrario.
- **Una frase que corrige una definición busca las otras que definen lo mismo (sesión 92,
  `R9-322`).** La 91 corrigió «not always the key it writes» y dejó, 26 líneas más arriba, la de
  `prepKey` («a write queued behind others still goes to the account of when it was asked for»),
  que dice lo contrario para el mismo caso. Seguida al pie de la letra (`segunPrepKey`), caen dos
  pruebas con el código bueno. Es la regla de la 56 aplicada a las frases: `grep` de lo que la
  frase afirma, no solo del nombre del dato.
- **En Windows, `execSync` se come el `^` (sesión 92).** Pasa por `cmd.exe`: `git rev-parse
538b1bc^` da `538b1bc` (`_scratch/S92-caret.cjs.txt`), así que un control `<sha>^` compara contra
  el propio `<sha>` y dice «igual». Usá `~1` o el hash. Y `S65-igual` sale con 0 también cuando hay
  diferencias: leé su última línea.
- **Una lectura al pie de la letra que pasa todas las pruebas no es inocua por eso: medí su daño
  (sesión 93, `R9-323`).** La regla de la 90 busca la lectura que tumba una prueba con el código
  bueno. La 93 encontró la contraria: «was given back» leído como «se marcó» (`devueltaAunqueFalle`,
  `devueltaAlAnotar`) pasa las 1004 relacionadas, y con una devolución fallida pierde una sección
  (`editaTrasFalla`). Cuando una lectura pasa, armá el caso que la distingue y mirá qué rompe.
- **Una excepción se escribe para cada camino que pasa por la frase (sesión 93, `R9-322`).** «Va a
  la sin cuenta», leído para el respaldo, es el arreglo que `R9-275` descartó, y tumba dos pruebas
  (`respaldoDesviado`). Y sacar una frase del paréntesis que la acotaba («once the auth state is
  known») la vuelve falsa para otro camino (lo pedido antes del primer estado; medido en la 94:
  `pedidaSinEstado` tumba la de `R9-310`). Antes de escribir, listá los llamadores (`grep` del
  nombre), y medí la frase en cada uno.
- **Un «por lectura» del detalle es un riesgo sin sonda, y se mide primero (sesión 94, `R9-328`,
  `R9-329`).** Es la regla de la 88 para las afirmaciones, no solo para los riesgos. De lo que la 93
  dejó por lectura en su detalle, cuatro afirmaciones tenían una negación que pasa las 1004 y pierde
  datos («noted first», «keeps its note», el error que `noteRelease` se traga, la frase de los
  stores), y dos citas de prueba no fijaban lo que decían (`:97` es una lectura sin nada sembrado;
  `muere` cuelga la unión, no la hace fallar).
- **Una regla que la sesión escribe se mide primero contra lo que esa sesión escribió (sesión 94,
  `R9-325`).** La 93 escribió «medí la frase en cada llamador», y su «a store's write» se midió solo
  con notas: hecha pieza en cada store (`sinDesvio<X>`), tres de cuatro pasan las 1004.
- **Un «benigno» se re-mide con un caso hecho para la pieza (sesión 94, `R9-327`).** La 73 llamó
  benigna a `devolucionGiveBack` porque su rojo en `devuelta` (una sonda hecha para otra pieza) era
  falso. Con un store en la cola entre la escritura del respaldo y su devolución
  (`tiendaTrasRespaldo`), pierde la sección restaurada. Lo benigno era el rojo, no la pieza.
- **Un arreglo que cambia CUÁNDO se toma un valor re-mide las frases que dicen cuándo (sesión 95,
  `R9-331`).** Con el trabajo del primer estado esperado por todos, lo pedido antes toma la cuenta
  de un estado posterior. La frase de `prepKey` («else at the first auth state»), cierta antes,
  pasó a admitir «la cuenta del primer estado» (`claveDelPrimerEstado`), que pasa las 1015 y parte
  una entrada. Lo vio el agente que buscaba romper el arreglo.
- **La prueba de un arreglo que espera un trabajo se arma para cada parte de ese trabajo (sesión
  95, `R9-331`).** El trabajo del primer estado es la migración Y la devolución; la prueba retenía
  la devolución, y una regresión que esperara solo esa parte pasaba (`soloDevolucion`).
- **Un control por clave no ve las colas que hay delante del turno (sesión 95, `R9-327`).** La
  edición iba por el store, cuya cola la ponía detrás de otra escritura de notas: el gancho contaba
  esa, la edición pedía su turno tarde, y la prueba pasaba con la regresión (`ajenoR327`). Armá el
  caso con el paso más corto al turno (`prepWrite` directo), y corré el ajeno contra él.
- **En la sonda, un `-t` con `|` lo parte `cmd.exe` (sesión 95).** Jest corre con `shell: true`,
  como el `^` de la 92: usá clases (`R9-3[23]`) o una corrida por patrón.
- **Al escribir una prueba, pasale como lista las reglas de controles y esperas de §5, no solo la
  del hallazgo (sesión 96, `R9-334`, `R9-335`).** La 95 tenía las de la 72 y la 86 y las de la 84 y
  la 85. Aun así, la de `R9-298` controla solo uno de los dos pedidos que ordena, y con el respaldo
  una vuelta más tarde su regresión pasa las 1016 (`goneAlPedirTarde1`). Y las de `R9-331` esperan
  1000 vueltas sin reloj: un tope de 250 ms pasa las 1016 (`segundoTope250`).
- **Una promesa que esperan todos hace de una garantía local una de todos (sesión 96, `R9-336`).**
  Con `await firstWork` en todo estado, «el primer trabajo no rechaza» pasó a valer para todos los
  estados, sin comentario ni prueba: quitar una guarda pasa las 1016 (`lecturaNotaSinTry`), y con
  la lectura de la nota fallida los tres estados lanzan y las claves no se sueltan nunca. Cuando un
  arreglo hace que varios esperen lo mismo, preguntá qué pasa si eso rechaza o se cuelga.
- **Una frase en singular sobre algo que puede pasar varias veces se mide con varias (sesión 96,
  `R9-337`).** «A state that came meanwhile counts» es cierta con un estado y ambigua con dos. Su
  lectura (`claveDelSegundoEstado`) pasa las 1016 y mezcla cuentas, porque las pruebas tienen un
  solo estado durante el trabajo. Es la regla de la 66, aplicada a la cantidad.
- **El `grep` de la regla de la 92 entra también en `__tests__/` (sesión 96, `R9-338`, `R9-339`).**
  Un comentario de prueba que cita al código («así lo dice `prepKey`») queda falso cuando el código
  cambia: la 95 corrigió `prepKey` y dejó el de su propia prueba. Y un comentario de prueba también
  es una definición: «en ningún punto», al pie de la letra, tumba 6 con el código bueno.
- **La salida de la sonda se nombra por corrida y modo, no por los argumentos de jest (sesión
  96).** Un `-t` pisa la salida del `prep` entero de la misma corrida. En la matriz del agente 3,
  tres comparaciones leyeron una salida aislada, y una afirmación (`notaLenta50` ya no tumba la de
  `R9-274`) no se sostuvo en el principal, donde cae 3 de 3 veces. Una matriz que compara salidas
  guardadas comprueba de qué corrida es cada una.
- **Un gancho con nombre dice la CLASE del pedido; si la prueba espera uno en concreto, el nombre
  dice cuál (sesión 97, `R9-334`).** `'restore'` decía «un respaldo»: con otro respaldo en la
  ventana, la espera salía con el ajeno y la regresión pasaba (`ajenoRespaldo298`). Con las claves
  en la etiqueta, cae; el gancho viejo (`etiquetaSinClaves`) devuelve el verde falso. Son las reglas
  de la 88 y la 89, en un gancho escrito por la sesión que ya las tenía.
- **La 97 repitió en sus pruebas nuevas tres reglas de §5 que tenía (sesión 97, `R9-336`,
  `R9-334`).** La de la 95 («cada parte del trabajo»): la prueba de `R9-336` fijaba uno de los tres
  pasos (`migraLanza` y `arranqueLanzaSiQueda` pasaban). La de la 79 («llega tarde» no es «no
  llega»): esperaba 1000 vueltas algo que tiene que llegar, y una lectura 1010 vueltas más lenta
  daba el rojo del daño. Y las de la 88 y la 89 (el ajeno del gancho). La regla de la 96 («pasá §5
  como lista») estaba escrita: las tres las vieron los agentes, no quien escribió las pruebas.
- **Una pieza con un plazo real más largo que la corrida cuelga jest (sesión 97).**
  `segundoTope1800000` crea un `setTimeout` real en las pruebas sin reloj falso, y jest no termina
  hasta que vence. Un tope largo se mide con el reloj falso; si se cuelga, se mata solo el proceso de
  jest (`Win32_Process` con `jest.js` en la línea de comandos), y la sonda restaura y sigue.
- **Un «por lectura» que dice «cambia los datos del caso» se mide con los datos que no lo cambian
  (sesión 98, `R9-342`).** La 97 escribió en su propia entrada que un respaldo ajeno de la misma
  clave «no es neutro». Con los mismos pares lo es, y con él la regresión de `R9-298` pasa
  (`goneAlPedirTarde1+ajenoMismaClaveNeutro298`). Es la regla de la 94, en el ledger de la sesión
  que la tenía.
- **La regla de la 95 baja hasta las partes de cada paso, y vale para cada prueba que espera el
  trabajo (sesión 98, `R9-343`, `R9-344`).** La 97 armó un caso por paso de `firstWork`, y la
  migración tiene cuatro partes en un `try`: con la falla de la unión o de la marca fuera de él,
  pasan las 1020 (`migraUnionSale`, `migraMarcaSale`). Y su prueba de `R9-337` tiene estados solo
  durante la migración: tomar la cuenta al terminarla pasa las 1020 (`claveTrasMigrar`).
- **Al reescribir media oración, medí la oración entera (sesión 98, `R9-345`).** La 95 y la 97
  corrigieron la segunda mitad de la frase de `prepKey`, y la primera («taken at the call once the
  auth state is known», de `a85df96`), leída como «ya llegó un estado» (`claveConocidaAlLlegar`),
  pasa las 1020 y manda lo escrito sin cuenta a la Mesa de Ana. Es la regla de la 92, dentro de la
  misma oración.
- **Una pieza re-anclada conserva lo que el arreglo agregó en la línea de su ancla (sesión 98).**
  `S97-gen` re-escribió el cierre de `prepMultiSet` y su reemplazo perdió la etiqueta: con
  `devuelveFueraDelTurno`, la de `R9-298` cae solo en su control (`pidio: 0`), y su columna de la
  matriz dejó de informar. Las `…E` de `S98-sonda` la conservan.
- **Jest levanta 31 workers por corrida aunque haya 3 archivos (sesión 98).** Son unos 3,4 GB por
  corrida; dos a la vez dejaron 6,4 GB libres de 31,8, y Victor lo notó. Pasale a la sonda
  `--maxWorkers=3` en `prep` y 4 en el suite (argumento extra, después del modo), también en el
  prompt de cada agente. Y para cortar una matriz, esperá la línea «tanda N»: matar el padre mata la
  sonda hija sin restaurar.
- **Medir los diseños antes de escribir los arreglos rindió (sesión 99).** Victor pidió los agentes
  antes de que hubiera commit; cada uno armó en su worktree el diseño que le dio el orquestador y lo
  midió o lo atacó. En cinco de los diseños hubo un verde falso o un hueco, medido, antes de escribir
  la rama: el `of` que re-sangraba `prepMultiSet`, el ajeno del mismo paso de `R9-343`, el control
  leído al final de `R9-344`, las pruebas de `R9-345` que retenían solo la migración, y «the
  give-backs» en `prepKey`. Es la regla de la 60 antes del commit, no después.
- **Las llamadas de una clave se cuentan en una corrida limpia (sesión 99, `R9-343`).** Contadas en
  la corrida que falla, una llamada ajena que al fallar corta el paso (`return`) esconde la parte: con
  `migraMismoPaso343`, la prueba pasaba con la parte fuera del `try`. Con una corrida sin falla antes,
  cae. Es la regla de la 80 para un control de fallas.
- **Un argumento nuevo en una llamada con una función larga re-sangra todo su cuerpo (sesión 99,
  `R9-342`).** Con tres argumentos, prettier deja de abrazar la función y re-sangra `prepMultiSet`
  entero: las anclas de todas las piezas que lo tocan dejaban de aplicar. El dato fue a un argumento
  que ya estaba (la etiqueta). Es la regla de la 63: medí después de formatear (modo `anclas`).
- **Para «cuándo se toma un valor», retené la ÚLTIMA parte del trabajo (sesión 99, `R9-344`).** Una
  retención en el medio ve solo las regresiones que lo toman antes de ese punto: reteniendo la unión
  de la devolución, `claveTrasUnionDev` pasaba; con la quita de la nota (o, sin devoluciones, su
  lectura), caen todas las de antes. Es la regla de la 77, aplicada al trabajo mismo.
- **La regla de la 93 vale para todo llamador, no solo los stores (sesión 99, `R9-347`).** Ninguno de
  los 10 caminos que llaman a `prepKey` tenía un caso de `R9-345`, y el único con pérdida de datos
  era uno que la prueba no tocaba: restaurar un respaldo. `grep` del nombre, y un caso por camino.
- **Un hueco de las pruebas se cierra en las pruebas (sesión 99, `R9-340`).** Módulos y almacén
  propios por prueba (`jest.resetModules()` + un mock nuevo de AsyncStorage) cortan lo mismo que 21
  líneas de producción, sin dejar en `src/` lo que solo sirve bajo jest (la regla de la 26). El mock
  de `jest.setup.js` es uno solo: `resetModules` sin el mock nuevo deja el almacén compartido
  (`soloModulos340`). Y todo `spyOn` va sobre la instancia de la prueba (sobre un módulo importado
  arriba del archivo no ve nada: `espiaArriba343`, sesión 100).
- **La pieza que demora se corre con CADA regresión que la prueba dice ver (sesión 100, `R9-349`).**
  En la 99, el agente 6 vio que con el store mil vueltas más lento la regresión de `prepKey` pasaba,
  y el arreglo (la clave pedida directo) cerró esa. Las de cada llamador (`llegar<X>`) siguen
  pasando con el llamador más lento que la espera (`tardeClave2000+llegarEscribeNotas`,
  `lento2000+llegarRestaura`). Es la regla de la 70 en cada caso de la 93, y la de la 89.
- **Una falla inyectada una sola vez no ve un reintento (sesión 100, `R9-348`).** El ayudante de las
  partes hace fallar la `n`-ésima llamada; un reintento fuera del `try` pasa las 1037
  (`reintentaNotaFuera`), y con la falla repetida todo estado lanza. Es la regla de la 49 (una falla
  puede repetirse) en el ayudante que hace fallar.
- **Un control de «terminó» no dice «durante esta» (sesión 100, `R9-350`).** Jest da 2 vueltas entre
  pruebas. Si el trabajo de una prueba termina antes de que empiece la siguiente (la puerta tras una
  vuelta, o un `afterEach` que drena 30), la pareja de `R9-340` deja de vigilar con los controles en
  verde. Un control de orden entre pruebas lee a los dos lados del borde (la regla de la 81).
- **Al llevar un caso a otra parte del trabajo, llevá también su cantidad (sesión 100, `R9-351`).**
  La 99 puso un estado en la última parte; los varios estados de `R9-337` quedaron en la migración, y
  tomar el primero de la última parte pasa las 1037 (`claveDelPrimeroEnDev`). Las reglas de la 96 y
  la 98, juntas.
- **Con un control nuevo, la pieza que demora va también ANTES del paso que lee (sesión 101,
  `R9-349`).** Después de ese paso, el control de «pendiente al abrir» no tiene corte (`llegar` cae a
  990, 1005 y 2000). Antes, sí: el respaldo que pide su clave 1005 vueltas tarde (`respaldoClaveTarde1005`,
  un cambio bueno) cae, y daba el mismo rojo que la regresión hasta que el control se leyó también al
  final (`pedidasAlFinal`). Las reglas de la 70, la 79 y la 85, juntas.
- **Una regla de la revisión anterior se corre en todas las pruebas del mismo diseño (sesión 101,
  `R9-353`).** La 100 llevó la cantidad a la última parte en la de `R9-344` (`R9-351`); los casos de
  `R9-345`, con la misma forma (un estado), quedaron sin correrla, y tomar la cuenta al pedir pasa las
  1037 (`valorAlPedirDurante`).
- **Un control de «pidió y espera» lee el pedido, no lo que usa la escritura (sesión 101, `R9-354`).**
  Con `prepKey` espiado, un store que pide su clave y escribe con otra pasa si es más lento que la
  espera (`tardeClave2000+pideYDescarta`). Es la regla de la 86, en un control escrito con §5 como
  lista.
- **Al llevar la cantidad de un caso a otra parte, llevá también su forma (sesión 102, `R9-355`).** La
  101 puso en la última parte dos estados distintos entre sí y del primero: con dos como tope, «el
  segundo» y «el último» son el mismo, y sin el primero repetido, también «el último distinto del
  primero». Un filtro de re-disparos (`ignoraPrimeroEnDev`) y `claveDelSegundoEnDev` pasan las 1037.
  La forma (nulo→ana→nulo) la tenía la de `R9-337`, en la migración.
- **Varios estados en la misma tarea son distintos en valor, no en tiempo (sesión 102, `R9-356`).**
  `setPrepAccount` fija la cuenta en su primera línea: llamados seguidos, una microtarea después ya
  es la del último, y leer el primero una microtarea tarde (`claveDelPrimeroEn{Dev,Trabajo}Micro`)
  pasa las 1037. Con los estados de a uno, con una vuelta entre ellos, cae. Es la regla de la 76.
- **Una falla inyectada por par (método, clave) no ve un camino de error que toca otro par (sesión
  102, `R9-357`).** Un `removeItem` en un `catch`, fuera del `try`, pasa las 1037; con el disco
  fallando entero, los dos estados lanzan. La regla de la 49 (la falla se repite) vale también para
  «se extiende».
- **Las pruebas-sonda que sostienen un hallazgo se anclan en el último commit de la sesión (sesión
  102).** La 101 midió `R9-353` sobre `ac1a7a5` y cambió esa prueba en `44927a5`: en la matriz de la
  102, sus cuatro pruebas-sonda no aplicaban. Antes de cerrar, corré las piezas del ledger sobre el
  último commit (modo `anclas`).
- **Aflojar un control que daba un rojo ante un cambio bueno puede quitarle una regresión que veía por
  ese rojo (sesión 103, `R9-358`).** Sobre la prueba del respaldo de `ee88726`, un respaldo que pide
  sus claves a `prepKey` y escribe con otras (`lento2000+respaldoPideYDescarta`) caía solo por la lista
  exacta de `pedidasAlAbrir`. Con el control aflojado y nada más (`soloR358`), pasaba. Antes de aflojar
  un control, corré contra el control nuevo las regresiones que hoy caen por él. Es la regla de la 9
  (un arreglo desarma la prueba de otro), con un rojo.
- **Un caso donde el valor del pedido y el del final difieren da daño a la regresión que solo veía un
  control (sesión 103, `R9-353`, `R9-354`).** Con un estado, la clave tomada antes es la del final, y
  `pideYDescarta` no tenía daño. Con un estado más tras los pedidos, sin el control nuevo, ya la ven
  los datos (`tardeClave2000+pideYDescarta` cae sobre `1121ec9`).
- **Un plazo medido en vueltas no ve un temporizador (sesión 103, `R9-357`).** Mil vueltas antes de
  leer la nota dejaban pasar una quita con un `setTimeout` de 10 ms (`notaQuitaTimeout10`); con una
  hora de reloj falso y mil vueltas, cae. La regla de la 85 vale también para la espera antes de leer
  el resultado, no solo para la de un control.
- **«Todo el disco» es todo método del almacén (sesión 103, `R9-357`).** Con los tres métodos de
  `discoEntero348`, un `multiGet` en un `catch` pasaba (`discoTres357+migraLeeEnCatchMultiGet`). Es la
  regla de la 102 («la falla se extiende») hasta los métodos.
- **Al portar un control sobre el diseño de otro, su lectura va después de todo lo que ese diseño
  agrega antes del momento que nombra (sesión 104, `R9-366`).** La 103 portó el control de A4 sobre
  las funciones de A3, y quedó antes del bucle de los estados nuevos: «al abrir» se lee dos vueltas
  antes de abrir, y `notasLentoAntesPrepWrite1002+tardeClave2000+pideYDescarta` pasa nulo→beto→nulo.
  Las reglas de la 81 y la 85, en la integración.
- **Un ajeno se corre contra el esperado de hoy, no contra uno adaptado (sesión 104, `R9-363`).** La
  103 midió `ajenoEscritura354b` con el esperado ajustado a dos `@prep_notes` y escribió «no ocupa el
  lugar del que falta». Con el esperado de la prueba, lo ocupa: `ajenoEscritura354+notasSinPrepWrite`
  pasa los 4 casos de `R9-345`. Las reglas de la 88 y la 89.
- **Un dato vacío no dice adónde fue (sesión 104, `R9-362`).** La lección de la 103 («el valor del
  pedido y el del final difieren») necesita datos en cada clave que el llamador escribe: con las series
  vacías, `respaldoSeriesAlPedir` pasa `prep` y el suite y parte lo restaurado entre dos cuentas.
- **Una hora de reloj falso también es un corte, y una vuelta no separa en el tiempo (sesión 104,
  `R9-360`, `R9-361`).** La regla de la 103 se corre también contra la hora misma
  (`notaQuitaTimeoutLargo3600001` pasa) y entre los estados (`claveDelPrimeroEnDevTimeout10` pasa). Con
  `runAllTimersAsync`, o con tiempo de reloj tras cada estado, caen.
- **Lo que veía un control exacto es una clase, no una pieza (sesión 104, `R9-363`, `R9-364`).** La
  103 aflojó `R9-358` tras correr la regresión que caía por la lista exacta. Otras dos de la misma clase
  (tomar las claves tarde, cubrirse con un ajeno) también caían por ella sobre `ee88726`, y con el
  control aflojado pasan. Antes de aflojar, armá más de una regresión de lo que el control veía.
- **Una hipótesis del ledger que nombra una herramienta se mide con un cambio bueno de esa herramienta
  (sesión 105, `R9-360`, `R9-361`).** «`runAllTimersAsync` lo cierra» venía medido contra una
  regresión. Con un intervalo que no se apaga nunca, lanza («Aborting after running 100000 timers»), y
  termina en cuanto no queda ningún temporizador: uno puesto 5 vueltas después pasaba
  (`notaQuitaVueltasYTimeout5x7200000`). Lo que da tiempo y vueltas juntos son mil vueltas con los
  pendientes en cada una (`tiempoYVueltas`), con su corte en vueltas (1010). Las reglas de la 31 y la 82.
- **Un control que lee «de quién» en la pila tiene su propio cambio bueno (sesión 105, `R9-371`).** La
  respuesta a la regla de la 88 (un registro compartido) trae la de la 82: un `prepWrite.bind` en un
  `then` borra el marco del store, y los 4 casos caen con el código bueno.
- **Dos pendientes pueden tener una causa (sesión 105, `R9-372`).** El rojo engañoso de la rehecha de
  `R9-327` con `notaLenta50` era el arrastre de `backupPrepTurn.test.ts` sin aislamiento: lo cruzaron
  dos agentes que medían cada uno el suyo. Medí los pendientes de a grupos, no de a uno.
- **Un evento que la prueba manda «en cuanto X» espera a X sin un tope corto, con un control de que X
  pasó (sesión 105, `53bdbe6`).** El estado tardío de `R9-364` salía tras mil vueltas aunque lo pedido
  siguiera pendiente: con la migración 1005 vueltas más lenta (un cambio bueno), lo restaurado iba a la
  Mesa de Cata, y el rojo era el del daño. Es la regla de la 79, en un diseño que su agente midió sin
  demorar la migración; lo vio la matriz, antes del OK.
- **Un control de «nada pendiente» pregunta qué pasa si no contó nada (sesión 106, `R9-376`).** La
  espera de Cata de `53bdbe6` sale cuando ningún pedido contado está pendiente. Con un pedido que el
  filtro de la pila no ve (`respaldoClaveOtroModulo`, un cambio bueno), el registro está vacío, sale en
  la primera vuelta y `resolvioAntesDeCata` da `true`: Cata llega durante el trabajo, y el rojo trae las
  columnas del daño. Es la regla de la 73, en el control que la 105 escribió tras su matriz.
- **Una herramienta que corre «lo pendiente» una vez por vuelta tiene un corte en eslabones (sesión
  106, `R9-373`).** `tiempoYVueltas()` corre un eslabón de una cadena de temporizadores por vuelta: una
  quita de la nota tras 1001 eslabones de dos horas pasa `prep` y el suite, y su frase decía «o en
  cadena» sin el número. Es la regla de la 74, en la herramienta que la 105 midió solo en vueltas.
- **«Lo que el trabajo programa vence aquí» pregunta qué pasa con lo que el trabajo ESPERA (sesión
  106, `R9-374`).** Con el reloj falso puesto antes del trabajo y la prueba esperándolo antes de dar
  tiempo, un trabajo que cede con un `setTimeout` de 0 ms traba 15 pruebas (`cedeConTimeoutEnNota0`).
- **`jest.resetModules()` no reinicia lo que la fábrica de un mock cierra del archivo de prueba
  (sesión 106, `R9-375`).** `mockSqlite` sobrevive al aislamiento de `R9-372`: una prueba colgada con
  la puerta puesta se la deja a la siguiente (`colgadaSqliteBpt`, 64/65).
- **Un control que se calcula y no se compara no vigila (sesión 106, `R9-379`).** La 105 movió el
  control «al abrir» de la lectura tras los estados y lo escribió; el esperado de esos casos no lo lee
  (`lecturaControlAntesDeEstados` pasa). Al mover un control, mirá que el `expect` lo lea en cada caso.
- **Antes de llamar «cambio bueno» a una pieza, preguntá si abre en la app una ventana que el código
  bueno no tiene (sesión 106).** Una vuelta entre los dos pedidos de clave del respaldo
  (`respaldoVueltaEntreClaves`) deja entrar un estado que parte lo restaurado; hoy la segunda clave se
  pide en la misma tanda de microtareas (`respaldoMicroEntreClaves` pasa). Un agente la llamó cambio
  bueno; otro, midiendo lo mismo, vio el partido.
- **Una decisión que nombra un momento se mide en cada paso que hay hasta ese momento (sesión 107,
  `R9-370`).** La §7 decía «antes de terminar el trabajo del primer estado»; entre leer el dueño y
  terminar hay una lectura y las devoluciones. Leer la cuenta con el dueño (A1) dejaba partido el caso
  de la lectura de la nota; ir hasta el final mezclaba cuentas (la Mesa devuelta de Bob, a la de Ana).
  El corte va donde la regla deja de ser cierta, y se escribe.
- **Un caso tiene su espejo (sesión 107, `R9-370`).** `ana` y nulo partía igual que nulo y `ana`, y la
  entrada no lo nombraba: lo vio A2 al armar los casos en las dos direcciones.
- **Un arreglo que parte un camino en dos pide una fila por camino (sesión 107, `R9-370`).** La tabla
  tenía una fila por paso; con la marca escrita por dos funciones, la fila de siempre quedó en el camino
  sin dueño y el otro sin fila. Es la regla de la 93, en la tabla.
- **Una pieza se re-ancla solo donde el texto nuevo hace lo mismo (sesión 107, `S107-gen`).** Por el
  camino con dueño registrado, sí; una pieza que demora la unión de la migración ya no demora la del
  camino sin dueño (`migraLenta2000` deja de tumbar `R9-340` y `R9-310`). Donde el texto quedó repetido,
  no aplica y se dice. Y el reemplazo se lee entero: `migraConMultiGet` traía `?? signedIn` y 13 quitas
  un `return;` que el código nuevo ya no tiene (27 y 13 rojos que no eran de la regresión).
- **Un corte medido sobre el diseño de un agente se re-mide sobre lo integrado (sesión 107, `R9-373`).**
  A9 escribió los cortes en vueltas sobre `02d8e93`; sobre lo integrado el corte bajó uno, y la frase
  prometía ver una regresión que pasaba. Lo vio la matriz: tres corridas de A9 que caían en su worktree
  pasaban en el principal. (La causa que escribió la 107, «con `R9-370` el trabajo sigue un paso tras la
  falla», es falsa: con el `src` de antes y la prueba nueva el corte ya bajó; lo bajaron las pruebas.
  Medido en la 108, `R9-387`.)
- **Un control que lee «de quién» por identidad tiene su propio cambio bueno, como el de la pila
  (sesión 107, `R9-381`, `R9-382`).** El envoltorio de una promesa pierde la identidad como el `bind`
  perdía el marco; un ayudante en el mismo módulo que el ajeno no se distingue por quien llama.
- **Una fila por camino necesita datos que hagan trabajar a la parte (sesión 108, `R9-383`).** La 107
  partió la fila de la marca en dos caminos; sin dueño, la tabla corre con los estados nulos, y ahí la
  mudanza no une nada: siete regresiones de su unión, su marca o la nota fallida pasan `prep` y el suite,
  con la Mesa de antes marcada sin mover o las claves trabadas. La fila existía; sus datos no hacían
  trabajar la parte. Es la regla de la 104 («un dato vacío no dice adónde fue») en la tabla.
- **El corte de una decisión empieza donde se toma el valor, no en el paso que la motivó (sesión 108,
  `R9-385`).** La 107 escribió «un estado mientras se devuelve», porque las devoluciones decidieron dónde
  mover; la mudanza lee la cuenta al empezar su turno, y un estado durante su unión o su marca, sin
  devoluciones, también parte el pasaje (`corte370a1`). Medí el corte desde la lectura del valor.
- **Lo que un re-anclado deja en un solo camino se lista, y cada pieza pide su gemela (sesión 108,
  `R9-384`).** La 107 hizo una gemela sin dueño (`claveAntesDelTurnoMueve370`); el agente 2 listó unas
  diez piezas que el re-anclado dejó solo en el camino con dueño, y la de `R9-344`
  (`claveTrasMover344`) y las del `catch` de la migración pasan sin dueño. Es la regla de la 99 (un caso
  por camino) sobre las piezas.
- **Al aflojar un control exacto, la clase incluye «pedir de más y usar lo de más» (sesión 108,
  `R9-386`).** La 107 corrió 18 regresiones antes de aflojar `pedidas`; un store que vuelve a pedir su
  clave y escribe con la segunda solo lo veía la cantidad. Las reglas de la 103 y la 104, con la
  regresión que usa lo que la lista contaba de más.
- **La causa de un corte que se movió se mide moviendo una cosa por vez (sesión 108, `R9-387`).** La 107
  cambió `src/` y las pruebas juntos, vio bajar el corte y se lo atribuyó a `src/` por lectura. Con el
  `src` de antes y la prueba nueva, y al revés, se ve qué lo movió. Es la regla de la 87 (una lección se
  mide antes de escribirla).
- **Una pieza de un store pide la misma en los otros tres (sesión 109, `R9-386`).** La entrada nombraba
  la de notas (`notasRepideSiPendiente2000`); las de series, ilustraciones y autoevaluación pasaban el
  `prep` entero, sin que ni `R9-292` las viera. Es la regla de la 108 (cada pieza pide su gemela), entre
  stores.
- **La forma de un caso va con su camino nuevo (sesión 109, `R9-384`).** Un caso sin dueño con un solo
  estado no ve las formas de varios estados: cuatro gemelas sin dueño de `R9-351` y `R9-355` pasaban
  `prep` y el suite hasta los casos de tres estados. Las reglas de la 100 y la 102, en el camino que
  abrió la 107.
- **Dos diseños en la misma prueba se miden juntos (sesión 109, `R9-381`, `R9-386`).** Con la marca por
  `.then` sola, `notasEncadenaRepide2000` pasaba los casos; con el estado tras el trabajo de otro agente,
  cae. Ningún agente los midió juntos: lo vio la verificación en el principal, sobre lo integrado.
- **Un espía que devuelve otro tipo cambia lo que recibe el código bajo prueba (sesión 109, `R9-389`).**
  Para contar el respaldo por la identidad de su clave, cada pedido devuelve un `String` envuelto, y
  `src/` lo recibe en lugar de la cadena. Escribilo como costo, con lo que no se midió.
- **La última parte del trabajo depende de los datos (sesión 110, `R9-393`).** Sin dueño y sin
  devoluciones, la última parte es la mudanza; los casos de tres estados de la 109 estaban solo en el camino
  con dos devoluciones, y cuatro formas de `R9-351` y `R9-355` tomadas en la mudanza pasan `prep`. La regla
  de la 99 («retené la última parte») se corre en cada camino donde cambia cuál es la última.
- **Un costo escrito «sin medir» se mide con una regresión que dependa de él (sesión 110, `R9-390`).** La
  109 escribió que `src/` recibe un objeto. Con un espía de control que devuelve la cadena, una regresión
  que compara la clave de las series con `!==` pasa con el objeto (`prep` y el suite) y pierde las series
  restauradas con la cadena. La regla de la 88, en el costo de un espía.
- **Una fila por cada lectura del camino, con datos en cada base (sesión 110, `R9-391`, `R9-392`).** Las
  filas de la mudanza fallaban la lectura de la «sin cuenta» y sembraban una base: la lectura de destino
  (que, tragada, pierde prosa) y las otras bases no tenían fila ni datos. Las reglas de la 104 y la 108,
  dentro de una parte.
- **Un momento que una frase nombra necesita un caso donde difiera del vecino (sesión 110, `R9-399`).**
  Con el turno siempre libre, «al tener el turno» y «al pedirlo» son el mismo momento, y leer la cuenta
  antes de pedirlo pasa `prep`. La regla de la 78.
- **Un arreglo que cambia lo que cuenta un control re-mide la frase vieja del control (sesión 110,
  `R9-397`).** La 109 escribió «todo pedido» justo debajo de la frase de la 106, que decía lo contrario;
  seguida, la frase vieja vuelve el rojo que el arreglo cerró. La regla de la 95.
- **Antes de lanzar los agentes, cruzá cada mirada contra el Pendiente del mensaje (sesión 110).** Una
  mirada pidió «si alcanza» algo que Victor dejó en «NO salvo que te lo pida», y el agente lo midió.
- **Entre diseños con costos, se elige por quién más ve cada costo (sesión 111, `R9-403`).** El «de quién»
  por la función que escribe deja un verde falso (un ajeno que escribe la misma base) que ven otras seis
  pruebas; la variante que lo cerraba tumbaba los 6 casos con un cambio bueno. Se escriben los dos, cada
  uno con su pieza.
- **Sin envoltorio, el «de quién» pasa a lo que se hace con el valor (sesión 111, `R9-404`).** Con la
  cadena, el ayudante del respaldo y un ajeno del mismo marco piden igual; solo los separa leerla, y un
  lector de la Mesa en la ventana (`ajenoNotasTrasAbrir358D`) tumba los 6. La regla de la 107, del otro
  lado: cerrar el costo de un espía abre el de la regla contraria.
- **Un control que lee un gancho de la app tiene los cambios buenos del gancho (sesión 111, `R9-402`).**
  El turno ocupado se lee con `__prepTurnWaitingForTests`; el gancho al pie de la letra de su comentario,
  una etiqueta para la mudanza y `alPedir` (de la 92) lo tumban. La regla de la 82.
- **La matriz ve lo que ningún agente corrió (sesión 111, `R9-404`).** Dos piezas viejas (un lector tras
  abrir y una prueba-sonda que imprime) cayeron sobre lo integrado por el mismo control; ningún agente las
  eligió. La matriz entera, antes del OK, aunque cada diseño venga medido.
- **Al sembrar cada base, la falla va también a cada base (sesión 111, `R9-401`).** Las filas de la
  mudanza siembran las cuatro bases y fallan solo las notas: tragarse la lectura de otra base pasa. La
  regla de la 109, en las filas de la 110.
- **Lo que un arreglo lleva a un camino, lo pide el camino vecino (sesión 112, `R9-406`, `R9-407`).** La
  111 sembró las cuatro bases solo sin dueño, y con dueño una migración que salta las ilustraciones pasa el
  suite y deja la base marcada sin mover. Y llevó la forma de tres estados a la mudanza solo con formas que
  vuelven al primero, donde «el primero» y «el último» son el mismo: tomar el primero mezcla cuentas. Los
  tres daños de la 112 no los abrió la 111: son gemelas de arreglos viejos en otro camino. Las reglas de la
  102 y la 108, del lado del camino que el arreglo no tocó.
- **Lo que un control hereda no lo distingue (sesión 112, `R9-408`).** El «de quién» por contexto pasa a
  todo lo que la función lanza: una escritura que sale del turno (`void run(k)`) lleva el contexto de la
  llamada, y en tres stores pasa `prep` con daño. Un control que sigue la llamada no ve lo que la llamada
  deja corriendo; eso lo ven los datos de un caso con algo en la ventana. La regla de la 107, del lado de
  la herencia.
- **Un conteo que resta no dice a quién le resta (sesión 112, `R9-404`, `R9-409`).** «Cada lectura
  descuenta un pedido con esa clave» resta el más viejo, que es el del respaldo si el lector pide después.
  La regla de la 88 vale también para lo que se descuenta.
- **Un «cambio bueno» se re-mide en el caso nuevo (sesión 113, `seriesTarde2000`, `R9-330`).** La 109 lo
  usó como control de una demora (pedir el turno 2000 vueltas tarde no cambiaba nada allí); con una
  adopción en la ventana, el turno queda detrás de la unión, y la prueba nueva de `R9-408` cae con daño. La
  etiqueta valía para el caso de la 109: el rojo pedía una prueba-sonda con el código real
  (`colaSegunda113`), que mostró la misma ventana sin ninguna pieza.
- **Con un agente por fila, el orquestador cruza los «sin medir» de las filas vecinas (sesión 116).** El
  candidato del reset de datos de `A14` (el registro de versiones no se refresca) es el camino de llegada de
  la página en blanco sin mensaje de `A13`, y ninguno de los dos agentes lo podía ver solo. Y en una sonda que
  monta una pantalla, un mock que devuelve un objeto NUEVO en cada render (`favorites: []`) mete en bucle un
  efecto y cuelga jest (10 min, 67 MB de salida, `ENOBUFS`): los mocks de contexto, con objetos estables.
- **El mock de Reanimated no guarda los valores animados (sesión 117, `R9-427`).** Su `useSharedValue` crea
  uno nuevo en cada render y su `interpolate` devuelve `undefined`: un defecto de un valor animado que
  sobrevive a un `return null` es invisible con el mock tal cual. La sonda le da la semántica real (un
  `useRef`; `interpolate` lineal con recorte) y un control que pasa. Y para la base, `node:sqlite` (Node 24)
  trae FTS5: el `BibleDatabase` real corre en jest sobre `assets/bible-seed.db` en solo lectura (un adaptador
  con `getAllAsync`), con la entrada real (`_scratch/S117-buscarReal.test.ts.txt`).
- **Una `key` por id reinicia el estado solo si el id cambia (sesión 118, `R9-432`).** El quiz reinicia la
  ronda al cambiar de categoría y la vuelve a barajar, pero la primera pregunta puede ser la misma: el panel no
  se remonta y queda respondido sobre el orden nuevo. Se ve con `Math.random` sembrado y 60 rondas (5 de 59
  repiten). Y en un componente que queda montado con `visible` (una hoja), lo que termina tarde trae el cierre
  del render en que empezó (`R9-435`); un efecto que lee un estado que otro efecto del mismo commit vacía, lo
  lee viejo (`R9-434`). Al identificar una pregunta en la sonda, enunciado Y opciones: varias comparten el
  enunciado.
- **Un `useFocusEffect(useCallback(…, deps))` con dependencias de menos corre, en cada foco, el cierre del
  render en que cambiaron (sesión 119, `R9-438`).** Lo que viene de un contexto queda congelado (el % de
  «Continuar leyendo»); lo que se lee de la base, no (la referencia). Para verlo en jest, el mock de
  `useFocusEffect` tiene que guardar el callback del último EFECTO (`useEffect(…, [effect])`, como
  react-navigation) y el foco llamarlo; un mock que llama al callback de cada render lo tapa. Una pantalla
  grande se monta igual: contextos estables, hijos de relleno (`_scratch/S119-homeFoco.test.tsx.txt`).
- **Cancelar y volver a agendar con un `await` en el medio no es atómico (sesión 120, `R9-439`).** Si el
  disparador (un efecto con `language` o la versión en las deps) puede correr dos veces seguidas, los dos
  refrescos cancelan antes de que el otro agende, y quedan los dos: avisos dobles. En jest se ve lanzando los
  dos sin esperar el primero, con un control que los espera en serie. Y con agentes por fila (a pedido de
  Victor): repartir una fila grande en «la pantalla y lo que escribe» contra «lo que solo presenta» deja
  cerrar las dos filas en una sesión (`_scratch/S120-agentes-reglas.md.txt`).
- **Lo que se revierte al perder el entitlement, entero; y lo que se celebra, desde el llamador (sesión 121,
  `R9-443`, `R9-444`).** Un modal que vive montado revierte tres de sus cuatro cosas exclusivas al caer
  `isPremium`, y la cuarta se comparte: la sonda monta el `PremiumProvider` real y dispara el listener. Un
  servicio que devuelve lo desbloqueado no celebra nada si el llamador lo descarta: medí el llamador. Y el
  agente que dice «nuevo» no siempre buscó la clave del archivo hermano: el orquestador encontró que guardar un
  estilo sin `catch` ya era `R9-416` buscando `compactStylePresetsStore` (`_scratch/S121-agentes-reglas.md.txt`,
  3 agentes, sin cortes).
- **En una fila transversal, el barrido da la lista y la sonda el daño; un tema se mide como FONDO, no solo como
  TEXTO (sesión 122, `R9-449`, `R9-454`).** Un diccionario sano (tipado contra ES, paridad, tokens) no ve los
  textos que lo esquivan (`plan.name` en vez del localizado). Y `themeContrast` pasa los colores de estado como
  texto sobre el fondo, pero el aviso pone blanco fijo ENCIMA de ellos: la sonda compone la paleta como
  `useTheme.tsx:1207-1230` (16 temas × claro/oscuro + alto contraste) y mide los colores renderizados.
  Reparto que cerró dos filas transversales con 3 agentes: el diccionario / lo que lo esquiva / los colores
  (`_scratch/S122-agentes-reglas.md.txt`; ~300k tokens cada uno, sin cortes).
- **La navegación se mide con la navegación REAL: `renderRouter` de `expo-router/testing-library` (sesión 123,
  `R9-457`, `R9-458`).** Monta el `StackRouter` y el `TabRouter` vendorizados con los layouts de la app (Stack
  raíz con `(tabs)`, `backBehavior="history"`); `initialUrl` es el arranque en frío y `router.push` el caliente.
  El atrás del sistema: espiar `BackHandler.addEventListener` (en jest es el de iOS, no guarda nada), llamar a
  los listeners del último al primero y, si nadie consume, `exitApp`. Lo que un mock de `expo-router` tapa (la
  historia de pestañas que no repite, el `GO_BACK` sin pila) aparece solo así. Si la sonda importa
  `expo-router`, el mock de `expo-linking` de `testing-library/mocks.js` llega tarde para `Unmatched.js`: izarlo
  en la sonda (`_scratch/S123-enlaces.test.tsx.txt`). Recetas: `S123-navLayout` (layouts),
  `S123-compartidoAtras` y `S123-ninosAtras` (una pantalla real sobre el router real).
- **Un mock de contexto estable tapa lo que el provider real NO estabiliza (sesión 124, `R9-464`, `R9-465`).**
  La regla de la 116 (objetos estables) evita colgar jest, pero esconde las cascadas: `detail/A13` mockeaba
  `useToast` estable y no vio que cada aviso re-agenda el temporizador del lector; un foco que corre solo al
  montar no ve el bucle de la pestaña Favoritos. Para medir un efecto con algo del contexto en sus deps, el
  PROVIDER real (con un consumidor que cuente) y el foco como expo-router (re-corre al cambiar el callback,
  `useFocusEffect.js:45`). Y «hoy» se mide con `Date` falso y un re-render SIN foco nuevo (`R9-462`). Reparto
  que cerró dos filas con 3 agentes: los hooks / el árbol / adentro de cada provider
  (`_scratch/S124-agentes-reglas.md.txt`; 345-420k tokens cada uno, 5-13 min, sin cortes).
- **En una fila de tipos, el reparto va por la FUENTE del dato, no por carpeta; y el `as` que miente casi nunca
  está en el `as` (sesión 125, `R9-467`..`R9-471`).** De 835 marcas, las que mienten están donde un dato de afuera
  no pasa por un normalizador: un param ya decodificado que se vuelve a decodificar (`R9-467`), la respuesta de
  una librería que cambió de forma en una versión mayor (`R9-468`: el `any` esconde que google-signin 16 resuelve
  la cancelación en vez de rechazar), un borrador de pantalla que adivina el tipo por el valor de este teléfono
  (`R9-469`), una clave del respaldo que es un nombre del prototipo (`R9-470`, familia de `R9-410`) y un nombre de
  param distinto escondido por `as never` (`R9-471`). El conteo no dice nada: el barrido con el parser
  (`_scratch/S125-inventario.cjs.txt`) da la lista, y cada agente sigue la VARIABLE hasta su origen (la heurística
  del texto pone el 95 % en «otro»). Dos agentes con fuentes vecinas (cuenta y errores) llegaron por separado al
  mismo hallazgo: el orquestador lo junta en un `R9`. Y un peso de bundle se mide con el `require.context` real
  de expo-router: Metro no lo filtra por plataforma (`R9-472`). Reparto que cerró dos filas con 8 agentes: seis
  fuentes del dato para `A30` y, para `A31`, el resolvedor + la divergencia / el peso
  (`_scratch/S125-agentes-reglas.md.txt`; 169-222k tokens cada uno, 51-89 llamadas, 7-12 min, sin cortes).
- **Un solo `useDebouncedCallback` para varios campos guarda solo el ÚLTIMO argumento; y una clave que se arma
  con un nombre visible duplica en otro idioma (sesión 126, `R9-473`, `R9-475`).** El `flush()` al salir funciona
  (`R9-58`), pero empuja solo la sección del último llamado: lo que otra sección dejó pendiente se pierde si nada
  le quita el foco (una barra de herramientas con `keyboardShouldPersistTaps="handled"` no lo hace). Mirá quién
  más llama al mismo debounce, no solo el `onChangeText`. Y una clave de mazo, favorito o progreso armada con el
  nombre del libro EN EL IDIOMA de la versión no coincide con la canónica (`canonicalBookName` → `nameEn`) que usa
  el resto: la sonda con RVR1960 y la carta ya guardada por la canónica lo muestra (el control, con KJV). El
  agente que mide una pantalla de 3,5k L con 8 mocks puede no llegar a un estado (el botón «Descargar» nunca
  apareció): si el CONTROL también cae, la sonda no mide nada y el candidato queda «sin medir». Reparto de dos
  filas con 2 agentes: la pantalla y lo que escribe / lo que solo presenta + la fila siguiente
  (`_scratch/S126-agentes-reglas.md.txt`; 300k y 365k tokens, 47 y 69 llamadas, 8 y 12 min, sin cortes).
- **En una sonda que monta una pantalla, el `findBy`/`waitFor` va FUERA del `act`; dentro, solo el toque (sesión
  127, `R9-476`).** Dentro de un `act(async …)` React no aplica los `setState` hasta que el `act` termina: la
  búsqueda nunca ve lo que el estado nuevo pinta (la Mesa de la 126 «se quedaba en el spinner» por eso, y caía
  también el control). Y `renderRouter` activa los timers falsos (`expo-router/build/testing-library/index.js:38`):
  una espera con `setTimeout` real después de montarlo cuelga la prueba; avanzá con
  `act(() => jest.advanceTimersByTime(n))`. **Un pack, el publicado:** la copia de `C:/projects/_pages_pub` es el
  pack de originales de julio; mide sobre el que sirve Pages (sha del `originals-meta.json`), bajado a `%TEMP%`.
  **Lo que dependa del día local, con `TZ=America/Mexico_City`** y una precondición en la sonda (la zona al oeste
  de UTC; si no, no mide): un `Date.parse('YYYY-MM-DD')` es medianoche UTC (`R9-487`). Reparto de dos filas con 6
  agentes: 4 en la grande (un candidato, la tabla, los datos, los «sin medir») y 2 en la siguiente
  (`_scratch/S127-agentes-reglas.md.txt`; 173-193k tokens, 46-60 llamadas, 7-11 min, sin cortes, worktrees
  borrados solos).
- **Un dato bíblico se mide por lo que la pantalla MUESTRA, y en cada pack publicado (sesión 128, `R9-489`,
  `R9-503`).** Que la referencia exista no basta: la prueba del repo de Niños miraba el capítulo, y la caja pinta
  solo `refs[0]` de una escena de 2-3 versículos (13 cajas a media frase). Y un número de versículo es el mismo
  versículo solo entre versiones de la misma versificación: RV1909 difiere de KJV en 12 capítulos (Jonás 1 tiene
  16), SSE1569 en 4, WEB en Ro 16; RVR1960 y BSB en ninguno. Un rango (`range('Jonah', 2, 1, 9)`) se mide en cada
  pack con el sha del manifiesto de Pages, no solo en la base sembrada. Lo que un agente mide de paso y está en el
  Pendiente de Victor (aquí el «sin medir» de `A12` sobre `prayerStore`) se anota «medido de paso», sin número.
  Reparto de dos filas con 8 agentes: una pantalla (o un grupo de pantallas) por agente y uno en la frontera
  (respaldo, cuenta, entradas, recordatorios); dos llegaron por separado a `R9-502` y se juntó
  (`_scratch/S128-agentes-reglas.md.txt`; 145-198k tokens, 28-59 llamadas, 5-10 min, sin cortes, worktrees
  borrados solos).
- **En un chat largo, o en la misma ventana de 5 horas tras otra tanda grande, agentes NUEVOS y no `fork` (sesión
  129).** Ocho `fork` lanzados en el mismo chat que la 128 (que ya había gastado su ventana con 8 agentes) se
  cortaron todos a los pocos minutos («You've hit your 5-hour limit»), sin escribir nada: un `fork` hereda el chat
  entero. Tras el reset, 8 agentes `general-purpose` nuevos, con reglas autosuficientes (qué leer entero, «guardá
  el informe desde la primera llamada»), completaron sin cortes (153-200k tokens, 40-68 llamadas, 9-11 min). Y
  una regla de juntar: tres agentes llegaron por separado a `R9-506` y dos a `R9-507`, `R9-508` y `R9-511`; un
  hallazgo que nombra una premisa de otro (aquí «no hay widget nativo», `R9-451`) se verifica y se corrige en la
  entrada vieja, sin re-severizarla (`_scratch/S129-agentes-reglas.md.txt`).
- **Lo que SUENA se mide con el motor real; y una lista de «pantallas que hacen X» se re-cuenta en cada fila
  (sesión 130, `R9-525`, `R9-424`).** Que un tema no siga a la versión cambiada se ve en las filas; que «Escuchar»
  lea el texto viejo con la voz nueva, solo con el `AudioPlayerProvider` REAL y `expo-speech` espiado (el molde de
  `__tests__/audioNarrationLanguage.test.tsx`): `loadChapter` sin `language` toma el idioma de la versión VIVA
  (`AudioPlayerContext.tsx:1096`). Y la lista de `R9-424` («seis pantallas leen `@bible_version` directo») tenía
  siete: un `grep` del patrón en la fila nueva la corrigió. Sin agentes, en el principal, dos filas (~4,6k L)
  cerraron con 3 sondas (5/5, 4/4 y un script de `node:sqlite` sobre los 4 packs de Pages con el sha del
  `packs/versions.json`).
- **Una lista que recarga en el foco no ve el `flush` del editor que se desmonta; y una cita en inglés se mide
  contra las versiones que TRAE la app (sesión 131, `R9-528`, `R9-527`).** Al volver, el foco de la pantalla de
  abajo llega antes de que se desmonte la de arriba, y la lectura directa de `AsyncStorage` no espera la cola de
  escrituras del store: la sonda monta las DOS pantallas reales, cambia un campo, llama al foco y desmonta en los dos
  órdenes, con un control que enfoca tras la escritura (`_scratch/S131-sermonLista.test.tsx.txt`). Y las citas de un
  texto curado se barren todas con un script (`_scratch/S131-citasTeologia.cjs.txt`: entre comillas, normalizadas,
  un versículo o dos seguidos): la de Sal 90:2 era la KJV modernizada, que no está en KJV, WEB ni BSB. Un mock de
  `@expo/vector-icons` con solo `Ionicons` rompe `MarkdownFormatToolbar`: mockearlo vacío si no interviene.
- **Antes de re-revisar una fila cerrada, medí cuánto cambió su archivo; y el arreglo que recarga «los providers»
  deja las pantallas (sesión 132, piloto de `A7`, `R9-529`).** `git diff --shortstat <commit del detalle> HEAD --
<archivo>`: `BackupService.ts` tenía +295/−102 y servía para medir la revisión; `SyncEngine.ts`, +2761, habría
  medido los arreglos. La pasada va a ciegas (el detalle se lee al final) y cada candidato se busca en `BUGS.md`
  por su clave. Y cuando un arreglo re-hidrata por una señal, listá TODO lo que escribe la clave entera desde
  memoria, también las pantallas de pestaña que quedan montadas (`search.tsx` y `@bible_search_history`): la sonda
  de `_scratch/S132-historialRespaldo.test.tsx.txt` junta los mocks de la pantalla (`S117-buscarPantalla`) con los
  del respaldo (`__tests__/backupRestoreSignal.test.ts`).
- **Para saber qué reglas hay en producción, LISTÁ los releases; y una regla que solo mira el token se cruza con
  cada flujo que cambia la cuenta (sesión 133, piloto de `B4`, `R9-530`).** `GET …/projects/<id>/releases` da
  todos de una vez: el de Firestore se llama `cloud.firestore` (o `cloud.firestore/<base>`), y los de Storage,
  `firebase.storage/<bucket>`; pedir `releases/firebase.storage` da 404 haya o no haya Storage. La lista de
  `rulesets` da el historial con fechas (sin autor). El script es `_scratch/S133-reglas.cjs.txt`: refresca el
  token en memoria, no lo imprime ni lo guarda. Y la regla `request.auth.uid == uid` no sabe si la cuenta se está
  borrando, se cerró en otro lado o se enlazó recién: en una fila de reglas, por cada flujo que cambia la cuenta
  (borrar, cerrar sesión, enlazar) preguntá qué puede escribir OTRO dispositivo con el token que ya tiene.
- **Lo que se guarda se reabre desde OTRO lugar; y dos ventanas que se alinean se miden con sus dos constantes
  (sesión 134, `R9-533`, `R9-532`).** El QA de Fable hizo «crear → listar → eliminar» de las comparaciones guardadas
  sin defecto, pero nunca reabrió una desde otro capítulo: restaurar recupera las versiones y los versículos, y el
  libro y el capítulo son props de la ruta. En una función de guardar, cargá lo guardado desde la entrada por
  defecto (Inicio: Juan 3:16). Y un comentario que dice «retención 84 d = las 12 semanas del heatmap» se mide contra
  las dos constantes: el heatmap tiene 17 desde el Sprint 45. Para una pantalla con base, la sonda arma una base
  `node:sqlite` en memoria con la semilla y los packs PUBLICADOS insertados como `pack-import.ts:61-62`, y mockea
  `bibleDB` con un adaptador (`getFirstAsync`, `getAllAsync`, `runAsync`, `execAsync`): la pantalla y el servicio
  reales, 5/5 a la primera (`_scratch/S134-comparar.test.tsx.txt`; los packs, con `_scratch/S134-packs.cjs.txt`).
  Y el `sed` sobre un detalle volvió a pasar (la 134 corrigió números de línea así): Edit, siempre.
- **El cambio de hora se mide en una zona que lo tenga, con el TZ desde PowerShell; y una fila corta con agentes
  necesita un reparto de ÁNGULOS, no de archivos (sesión 135, `R9-549`, `R9-547`).** México abolió el horario de
  verano en 2022: con `TZ=America/Mexico_City` la precondición de la sonda del cambio de hora CAE (medido:
  `_scratch/S135-sondas-agente-6/S135-a6-indiceDiario.test.tsx.txt`, «la zona tiene horario de verano», 3 rojas).
  Usá `Europe/Madrid` o `America/New_York`, afirmá en la sonda que la zona cambia de offset en las fechas elegidas,
  y fijá el TZ con `$env:TZ='Europe/Madrid'; node …S116-correr…` en PowerShell: desde Git Bash no le llega a jest
  (`detail/S22:76`). Y con 13 agentes sobre dos filas, la primera tanda repartió archivos y las otras dos ángulos (el
  landing montado, cada colección en la tarjeta, la cuenta que cambia, las reglas, el sentido de las citas): los
  ángulos dieron 8 de los 14 hallazgos. Las sondas del motor se re-arman en el principal con el `armar` del agente y
  se comparan con `cmp` antes de correr. Un estado que sobrevive en una pestaña oculta que queda montada (el
  borrador de «Combinar») se mide con un cambio de cuenta en el medio (`R9-547`).
- **Lo que se publica se mide en el BUILD, no en `app.json`; y un certificado «propio» se compara con el de la
  plantilla (sesión 136, `R9-550`..`R9-553`).** `android/` no está en git (CNG): la verdad es el manifiesto fusionado
  (`android/app/build/intermediates/merged_manifests/release/…`), su origen por permiso
  (`android/app/build/outputs/logs/manifest-merger-release-report.txt`) y el AAB
  (`android/app/build/outputs/bundle/release/app-release.aab`: `unzip -l`, el bundle de Hermes con `grep -a -c`, las
  `.so`, `BUNDLE-METADATA/…/dependencies.pb` para las librerías Maven). Antes, `git diff <commit del bump> HEAD --
package.json package-lock.json` para saber si ese build es el de HEAD. Así salieron el splash de la plantilla (el
  prebuild ignora el `splash` de arriba: `R9-552`) y dos nativos de `devDependencies` en el release (el autolinking
  de RN no distingue: `R9-553`). Y una huella que figura en `assetlinks.json` o en Firebase se compara con
  `node_modules/expo/template.tgz` (`package/android/app/debug.keystore`, contraseña `android`): `5E:8F:16…` /
  `FA:C6:17…` es la clave PÚBLICA de todas las apps de Expo y RN (`R9-550`, `R9-551`). `keytool -printcert -jarfile`
  no lee un APK firmado solo con v2/v3: usá `apksigner verify --print-certs` (build-tools del SDK).
- **Un toast se mide con una ráfaga de capturas arrancada ANTES del toque (sesión 138, `R9-560`).** El toast aparece
  ~0,7-1,0 s después del toque y dura ~3 s: `tapdump` (toque → dump, que espera el idle → captura) llega tarde, y por
  eso la 137 no vio ninguno, ni fuera ni dentro de un modal. Una ráfaga de 14 capturas en segundo plano antes del
  toque (cada ~0,4 s), con los brazos de fuera y de dentro en la MISMA instancia, y la separación: cerrar el modal a
  ~1 s y ver si el toast aparece detrás. Los dos agentes que midieron toasts así coincidieron.
- **Ningún agente crea ni borra carpetas dentro del repo ni de su worktree (sesión 138).** El watcher de Metro
  recorre todo el repo, incluidos `.claude/worktrees/`, y una carpeta temporal creada y borrada al toque lo tiró
  (ENOENT en `watch`) con dos agentes midiendo. Las copias transitorias (`bible.db`, RKStorage), en `/c/tmp/s138-a<N>/`,
  fuera del repo. Y en debug, dos «r» seguidas tecleadas con `adb input text` recargan el JS (la doble R de React
  Native): los textos sintéticos, sin «rr».
- **Antes de lanzar a un agente de Modo C, el orquestador lleva su emulador hasta pasar «Preparing...» (sesión 138).**
  Con la caché de Metro caliente, tardó de 26 s a 253 s; en la 137 se comió al agente 3. El script de espera
  (`_scratch/S138-esperar.sh.txt`) borra el dump local antes de cada `pull` (si no, un dump fallido lee el viejo) y
  exige texto visible; en el Home animado `uiautomator dump` falla y agota el tope: ahí, captura.
- **Ninguna «r» repetida en un texto sintético, aunque no vayan seguidas (sesión 139).** «Serie esperanza» tecleado
  con `adb input text` recargó el JS (mismo pid, servicios reiniciados en el log de Metro): las dos «r» caen dentro de
  la ventana del doble R de React Native, también con el foco en un campo. La recarga apaga el toggle de dev como un
  frío. Y antes de tocar un botón al pie de una hoja, `dumpsys input_method | grep mInputShown`: con el teclado
  vuelto a abrir, el toque escribió un espacio en la nota en vez de guardar (`R9-561`).
- **Una sesión sin agentes rinde con UNA herramienta que junte pasos (sesión 139).** `_scratch/S139-ui.sh.txt seq
<n> <filtro> t=X,Y x=TEXTO k=KEY s=SEG w=…` hace varios toques y termina en un solo dump filtrado (el filtro es una
  subcadena, no una expresión regular; para varias, `| grep -E`). Un color pintado se mide sin abrir la imagen:
  `node _scratch/S139-pix.cjs.txt <captura> x,y`. Con eso, 4 filas en ~230 llamadas, con un emulador.
- **Solo revisar y reportar. NO se toca código de la app.** Lo único que se escribe es el
  ledger. Las mejoras del Modo D se **redactan**, no se aplican.
- **Un mensaje de Victor a mitad de turno va al frente AHORA**, antes de seguir tu propio
  bucle (`feedback_essb-user-requests-preempt`). Pasó en las sesiones 5 y 6, y las dos veces
  atenderlo primero fue lo correcto.
- **Checkpoint por área, COMPLETO, en el momento:** `detail/<slug>.md` **+** la fila del
  índice **+** la entrada en `BUGS.md`, antes de pasar a la siguiente área. La sesión 4
  escribió solo el `detail/` y dejó el índice mintiendo durante 11 días. Si te quedás sin
  margen a mitad, deja la fila en `EN CURSO` — pero **nunca** dejes un `detail/` escrito con
  el índice diciendo `PENDIENTE`.
- **Una sonda ejecutable vale más que una lectura, y también vale para VERIFICAR un informe
  ajeno.** En la sesión 6 los 4 agentes probaron **19 de 21 hallazgos** con sondas contra el
  código real; varias **refutaron la hipótesis inicial del propio agente** y encontraron algo
  distinto y mejor. Cuando una sonda contradice tu lectura, gana la sonda.
- **Los agentes aciertan el mecanismo y fallan el detalle: re-verificá lo portante.**
  **Comprobá a mano cada afirmación de la que cuelgue un P0** antes de darla por buena;
  cuestan un `grep` cada una. **Rindió otra vez en la sesión 6:** al re-verificar los 6 P0
  del fan-out, los 6 se sostuvieron pero salieron 3 correcciones, y una (`R9-46`) invalidaba
  el argumento de alcanzabilidad entero. El defecto sobrevivió; la explicación, no.
- **Borrá las sondas ejecutables al cerrar la fila, o sacalas de `testMatch`.**
  `_scratch/` está gitignoreado pero **NO** jest-ignoreado: un `*.test.ts` olvidado ahí se
  suma a `npm test` sin aparecer jamás en `git status`. El truco barato: renombrar a
  `.ts.txt`. (En la sesión 6 no hizo falta: las sondas vivían en worktrees de agentes, que se
  limpian solos — pero por eso mismo **sus recetas de reconstrucción están en cada
  `detail/`**, y son lo único que queda.)
- **`TZ=... npx jest` NO propaga la variable desde Bash en Windows.** Usá
  `$env:TZ = 'Europe/Madrid'; npx jest <ruta>` en PowerShell. Sin esto, cualquier sonda de
  horario de verano pasa en falso.
- **Prettier manda sobre el ledger.** `format:check` de CI cubre `**/*.md` y
  `.prettierignore` no excluye `DOCS/`. Corré
  `npx prettier --write "DOCS/REVIEW_2026-09/**/*.md"` después de cada checkpoint.
  Prettier **rellena cada celda de tabla al ancho de la más ancha** — por eso la columna
  `Área` del índice está capada a ~55 chars y `Detalle` es un slug pelón. No metas prosa en
  las tablas del índice. Ojo también: si insertás texto a mano en un `.md`, **deja línea en
  blanco antes de un `---`** o el párrafo anterior se vuelve un encabezado.
- **`NUNCA npm audit fix --force` en este repo.** Propone downgrades que romperían la app
  en dos lugares (`R9-1`, `R9-8`). `npm audit fix` a secas es seguro.
- **El reflejo de `overrides` no siempre sirve:** verificá si el parche es ESM-puro antes de
  recomendarlo. `decode-uri-component@0.5.0` es ESM-only y rompería Metro; `uuid@11.1.1`
  trae build dual y la raíz ya lo corre en verde. Mismo patrón, veredictos opuestos.
- **Un hallazgo de "código muerto" tiene que buscar POR QUÉ sigue ahí antes de recomendar
  borrarlo.** `R9-7` recomendó borrar `functions/` sin ver que la justificación estaba a un
  `grep` de distancia.
- **Verificá contra `git log` antes de afirmar un estado que venga de memoria o del
  charter.** La sesión 1 encontró que la semilla BUG-10 del charter ya estaba arreglada
  (`b17ec99`), y la sesión 2 encontró que la memoria de device-testing miente sobre el
  `signingConfig` de release.
- **Antes de creerle a un conteo, verificá qué extrajiste.** En `B3`, una extracción mal
  hecha agarró la contraseña de _debug_ (`'android'`, 7 chars) y devolvió 43 falsos
  positivos.
- **Pedí el OK a Victor antes de commitear el ledger** (charter §5.4/§7). Ya lo dio
  **cuatro** veces con el formato **commit + push directo a `main`**, así que el formato está
  fijado — pero la autorización es por sesión, no se hereda.
- **Si despachás agentes:** `isolation: "worktree"` en **todos**, incluso los de solo
  lectura; cada uno escribe **únicamente** a `DOCS/REVIEW_2026-09/_scratch/<área>.md` (ya
  está en `.gitignore`), nunca a `INDEX.md`; el orquestador fusiona todo en **una** pasada al
  final y verifica el estado real de cada worktree en vez de confiar en el "completado".
  El fan-out necesita que **Victor lo pida explícitamente**.
- **Tamaño del fan-out: 4, no 11.** La sesión 3 lanzó 11 agentes Opus a la vez y **los 11
  murieron por límite de uso** sin escribir una línea. Relanzados en tanda de 4, los 4
  completaron; en la sesión 6, otra tanda de 4 volvió a completar entera. **4 es el número.**
  Pedile además que **devuelva el informe íntegro en su mensaje final**: el `_scratch/` queda
  en **su** worktree, que se limpia solo.
- **Dale a cada agente los "ya reportado, no lo repitas" por número.** En la sesión 6 los 4
  informes distinguieron correctamente su hallazgo de los `R9-*` previos, y tres de ellos
  argumentaron **por qué** su mecanismo era distinto. Eso ahorró toda una pasada de dedup.
- **Un worktree de agente no tiene `node_modules`.** Si necesita correr jest, hace falta
  `New-Item -ItemType Junction -Path <worktree>\node_modules -Target <repo>\node_modules`, y
  borrarla al terminar con `(Get-Item <ruta>).Delete()` — **un `rm -rf` seguiría la junction**
  y borraría el `node_modules` real.
- **En una sesión de ARREGLOS, una prueba nueva no vale nada hasta que la ves FALLAR sin el
  arreglo.** Pasó en la sesión 7: tres pruebas de `R9-47` pasaban igual con el código roto
  (una porque el re-render no llegaba a aplicarse; otra porque `setSectionNote` ya borra una
  sección vacía, así que no discriminaba nada). Reescritas contra el mecanismo real, la
  primera sí falla. Revertí el arreglo, corré, restauralo: cuesta 30 segundos.
- ~~**`react-test-renderer` no aguanta re-renderizar una pantalla del tamaño de la Mesa.**~~
  **FALSO (sesión 24, `R9-157`):** «Unable to locate attached view in the native tree» venía de
  que Victor exporta `NODE_ENV=development`, no del tamaño de la pantalla. Desde la 24,
  `jest.config.js` fija `NODE_ENV=test`, y las pruebas de la Mesa re-renderizan en jest.
- **`python - <<'EOF'` NO persiste las escrituras a `src/i18n/translations.ts`.** Falla en
  silencio: los `assert` pasan, imprime el "ok", y el archivo queda igual. Descubierto en la
  sesión 7 tras cuatro intentos. Para ese archivo usá la herramienta de edición; para los
  demás el heredoc funcionó sin problema.
- **Un revert mal hecho se ve EXACTAMENTE igual que una prueba que no discrimina.** En la
  sesión 8, el primer revert de `R9-46` «pasó»: el `sed` había parcheado el `catch` de
  `valuesEqual` en vez de `applyRemoteChange`, porque el patrón `return false;` aparecía
  antes en el archivo. **Antes de concluir que una prueba no discrimina, `diff` el revert y
  confirmá que tocó la línea que creías.**
- **Una prueba de «no pasa nada» suele no discriminar, y eso está bien SI lo sabés.** Varias
  de la sesión 8 pasan con y sin el arreglo a propósito (su trabajo es impedir que una guarda
  se vuelva preguntona, o que se borre de más). Distinguí esas de las discriminantes al
  escribirlas, o te vas a creer cubierto sin estarlo — le pasó a la primera versión del test
  de `R9-44`.
- **Si un commit lleva DOS arreglos, preguntá si uno desarma la prueba del otro.** Pasó en la
  sesión 9 y lo cazó la 10: el backoff de `R9-33` hacía que el `flush()` de la prueba de
  `R9-34` saliera temprano, así que la carrera que decía probar no llegaba a ocurrir y la
  prueba pasaba en verde por la razón trivial. **Es la variante más traicionera de «una
  prueba de un solo caso no prueba el mecanismo»**, porque el arreglo culpable está en el
  mismo diff y parece que se refuerzan. Antídoto barato: meterle a la prueba un **control del
  mecanismo** (`expect(...attempts).toBe(1)`) que falle ruidosamente si la carrera deja de
  ocurrir.
- **La paridad de SUPERFICIE no ve la paridad de COMPORTAMIENTO.** Segunda mitad de la
  sesión 12: la prueba nueva de aislamiento de rutas web pasaba en verde ejercitando el
  `ErrorBoundary` **nativo**, porque los dos layouts importan el especificador pelado
  `@components/ErrorBoundary`. Misma clase que `R9-15`, y
  `webNativeModuleParity.test.ts` **no puede** cazarla: ambos archivos exportan
  `ErrorBoundary`, lo que difiere es lo que hace. **Regla: si una prueba dice «árbol web»,
  redirigí TODOS los especificadores pelados que la pantalla importe, no solo los que
  sospechás.**
- **Cuando algo queda «dicho, no arreglado», preguntá si el camino barato es el honesto.**
  La letra roja de web se iba a cerrar corrigiendo la COPIA para que describiera la carencia
  («solo en inglés»). El camino bueno era quitar la carencia: un pack por versión. Coste
  real, un rato; resultado, la función existe en español. Contraste con el otro caso de la
  misma sesión: en `R9-14` la opción cara (montar 5 providers) NO era la buena, porque habría
  renderizado pantallas vacías. **Lo barato no es siempre lo malo ni lo caro siempre lo
  bueno: preguntá cuál de los dos deja al usuario con algo cierto.**
- **Un mock con factoría literal no COMPRUEBA la superficie de un módulo: la SUSTITUYE.**
  La trampa de la sesión 12. `chapterReaderWebFontPicker.test.tsx` mockeaba
  `@lib/reading/redLetterText.web` con un objeto escrito a mano de 3 claves, así que ese
  objeto **era** la superficie del módulo dentro de la prueba. Al redirigirle el import pelado
  (el arreglo de `R9-15`), la prueba habría seguido roja **después** de arreglar `R9-13`, y el
  reflejo obvio —añadir la clave que falta al mock— la habría puesto verde sin mirar jamás el
  archivo real. Antídoto: `...jest.requireActual(<mismo especificador>)` y stubear **solo** lo
  que de verdad estorba.
- **Si el bug es de resolución por plataforma, arreglá el TEST primero y mirá el rojo.** En la
  sesión 12 el orden fue `R9-15` → `R9-13`, no al revés, y por eso se pudo ver el `TypeError`
  exacto de producción (`hasRedLetterData is not a function`, en la línea real del componente)
  dentro de jest antes de tocar código de la app. Al revés no se habría visto nunca, porque el
  bug es invisible para las tres compuertas por construcción.
- **Para verificar algo de WEB de verdad: `npx expo export --platform web` y servilo.** Es la
  única forma de ver la resolución `.web` que ni `tsc` ni jest pueden ver. Dos gotchas que
  cuestan tiempo: (1) un servidor estático pelado **no tiene el rewrite catch-all** de
  `firebase.json`, así que una URL profunda da 404 — **navegá siempre dentro de la SPA**; (2)
  recargar con el worker de SQLite vivo dispara el bloqueo de OPFS
  (`NoModificationAllowedError`) y el botón «Clear data & reload» no siempre lo salva. Además,
  grepear el bundle vale como prueba: si están `loadRedLetterSpans` y `web-red-letter.json` y
  **no** están `redLetterByVersion`/`buildSpanMap`, el pelado resolvió al `.web`.
- **`python - <<'EOF'` decodifica el script en cp1252 en esta máquina, no en UTF-8.** Primo
  hermano del gotcha de `translations.ts`, y falla distinto: los acentos pasan (están en
  cp1252) pero `≥`, `⊆` o `✅` se corrompen y un `assert <ancla> in s` falla sin explicar por
  qué. Costó dos intentos en la sesión 12. Usá **`PYTHONUTF8=1 python script.py`** con el
  script escrito a archivo por la herramienta de edición, no por heredoc.
- **Revertir un `let` de módulo NO discrimina si hay un `__resetForTests()` que lo
  reasigna.** En la sesión 10, revertir `lastKnownUnlocked = false` en su declaración dejó las
  33 pruebas en verde, porque el `beforeEach` llama a `__resetForTests()` y **es ese** el que
  fija el valor inicial bajo jest. Hay que revertir **los dos sitios**. Corolario al derecho:
  un arreglo que toque solo el helper de reset **pasa los tests y deja producción rota**.
- **Una prueba vieja que se pone roja al arreglar un bug puede estar encodificando el bug.**
  En la sesión 10, dos pruebas de `OfferingSheet` montaban «ya desbloqueado» sembrando un
  `'true'` viejo en la caché con RevenueCat reportando inactiva — o sea, el escenario exacto
  de `R9-9`. Estaban verdes **gracias** al defecto. Antes de «adaptar» una prueba que se cae,
  preguntá si lo que afirmaba era cierto.
- **Un hallazgo de severidad media pegado a uno P0 puede ser el que DESANDA al P0.** `R9-10`
  estaba catalogado como «media, se auto-repara en el siguiente arranque»; en realidad
  anulaba el arreglo de `R9-9` entero (la revocación llegaba y la lectura de caché la
  pisaba). Arreglar el P0 solo no le habría cambiado nada a ningún usuario.
- **Un mock de fábrica puede dejar la prueba verde con y sin el arreglo (sesión 140, `R9-427`).** El mock de
  Reanimated crea un `useSharedValue` nuevo en cada render y su `interpolate` devuelve `undefined`: un valor animado
  que sobrevive de más no existe bajo jest. La prueba les da su semántica real (un `useRef`, una interpolación
  lineal), y aun así los estilos animados solo se recalculan al renderizar: tras un efecto que mueve el valor hay que
  volver a pintar antes de medir. Lo que el mock no puede mostrar (un resorte, un tirón) se escribe como «sin prueba
  que lo distinga» y va a la verificación en vivo.
- **Antes de hacer que una red de seguridad escriba, mirá contra qué lectura corre (sesión 140, `R9-424`,
  `R9-569`).** La caída a una versión empaquetada no se guarda, y parecía un defecto (la clave queda apuntando a una
  versión ausente). Pero la lectura del arranque corre a la par de la recarga de `initializeBibleData`: guardada, una
  lista parcial quedaría como la elección del usuario. El arreglo esperó la respuesta y dejó la escritura afuera,
  como costo conocido con su número. **Corregido en la 141:** la lista parcial es real pero no daña
  (`installedVersions` devuelve siempre las empaquetadas); lo que impide escribir es la lectura que FALLA. La regla
  queda, con su razón afinada: escribir solo cuando la lectura respondió.
- **El arreglo va donde el dato todavía es cierto, no donde la entrada lo propuso (sesión 140, `R9-425`).** La
  propuesta era que el aviso de fin de capítulo llevara el modo del temporizador hasta el avanzador. El motor ya lo
  tenía fresco en el mismo callback, tres líneas debajo de otra rama que decide con él, y el avanzador es el único
  lector de la señal: no subirla fue una línea. Antes de seguir la propuesta, buscá quién más lee lo que vas a tocar.
- **Un hallazgo «medido con sonda» puede haberse medido contra un productor simulado: antes de arreglarlo, medí el
  real (sesión 141, `R9-427`, `R9-571`, `R9-572`).** La sonda de la 117 y la prueba de la 140 traían un contexto
  propio cuyo `hidePlayer` ponía `isExpanded = false`. El real llama a `stop()` en el mismo tick, y `stop()` arma su
  estado desde un ref que se renueva en un efecto: pisa el plegado. El estado «roto» nunca ocurrió en la app, y el
  arreglo y su prueba quedaron verdes sobre un mundo que no existe. Diez líneas con el proveedor real lo mostraban.
  De paso: un `setState` con un objeto armado desde un ref pisa al updater encolado en el mismo tick.
- **Un arreglo que alarga una ventana despierta a quien reacciona a cada valor (sesión 141, `R9-570`).** La guarda
  de `R9-424` hizo durar ~1 s un valor que antes duraba un render. Un efecto con ese valor en sus dependencias
  (`app/_layout.tsx:180-198`) pasó a correr dos veces, y lo que lanza (cancelar y programar, con `await` en medio)
  no se serializa: 26 alarmas en vez de 13. Al alargar un estado intermedio, buscá los efectos que lo tienen en sus
  dependencias y preguntá si dos corridas seguidas se pisan. jest no lo ve: se vio en el emulador, con el control
  de quitar la pieza.
- **La consecuencia de un hallazgo por lectura se mide donde el dato se CONSUME (sesión 141, `R9-569`).** La lista
  parcial del registro existe (medida: `["RVR1960"]`), y la consecuencia escrita («WEB deja de estar disponible»)
  era falsa: el consumidor agrega siempre las empaquetadas. Un «por lectura» que termina en «y entonces el usuario
  ve X» pide leer al menos la función que produce X.
- **Una sonda de código puede romper lo que mide (sesión 141).** Un `useAnimatedReaction` con `runOnJS` dentro del
  reproductor dejó sus botones sin responder, y parecía el arreglo. Ante un síntoma nuevo con una sonda puesta,
  primero el archivo original.
- **Un aviso que manda a otra acción se mide siguiendo esa acción en el mismo estado (sesión 145, `R9-574`).** El
  aviso de `R9-17` manda a «Restaurar mi ofrenda anterior», y «Restaurar», en ese estado, responde «No encontramos
  una ofrenda anterior». Cada arreglo era correcto por separado, y la prueba del texto solo miraba que el aviso
  nombrara el enlace. Cuando un texto nuevo nombra un botón, la sonda toca ese botón sin cambiar nada más.
- **En la revisión de un diff las piezas se cortan más finas que en el arreglo (sesión 145, `R9-578`).** La 144
  revirtió una pieza por hallazgo y todas caían. Cortando cada rama, cada llamada y cada guarda por separado
  aparecieron una guarda sin prueba (72 de 72 pasan sin ella) y una prueba que pasa sin la llamada que nombra.
- **Una conducta del SDK no se cita de memoria: se lee en la versión instalada (sesión 145).** La memoria decía
  que `restorePurchases` no consume; las clases compiladas de `purchases-android` 10.16.1 nombran
  `postTransactionAndConsumeIfNeeded` en ese camino. El AAR está en la caché de Gradle
  (`~/.gradle/caches/modules-2/files-2.1/com.revenuecat.purchases/`): se saca `classes.jar` con `unzip` y se busca
  el nombre con `grep -a -o` sobre la clase. Es lectura: no reemplaza al dispositivo.
- **Un arreglo que deja quieto un estado convierte en camino principal el fallo que ese estado tapaba (sesión 146,
  `R9-119` y `R9-135`).** Mientras el anónimo que nacía al cerrar sesión se enlazaba a RevenueCat, el `logIn`
  fallido de la cuenta siguiente casi no se veía: el anónimo ya había pisado a la cuenta anterior. Al quitar ese
  enlace, RevenueCat se queda en la cuenta que salió, y la que entra con un `logIn` fallido ve los extras de la
  otra en cada arranque. Lo mostró la matriz corrida ENTRE commit y commit, no al final: cuando un arreglo quita
  una llamada, preguntá qué otro fallo dependía de que esa llamada lo tapara.
- **Una pieza que llama al SDK para quien hoy no se llama se mide con los dos supuestos del backend, y la guarda se
  corta por lo que el cliente SÍ puede saber (sesión 146, `R9-135`).** Qué hace `logIn` con las compras del id
  anónimo lo decide el backend de RevenueCat, y el mock no modela clientes. La sonda sí, con un interruptor (une;
  no une): lo que da igual en los dos entra, y lo que no, queda escrito y medido como propuesta. El reintento
  entró porque se acotó a un dato del cliente (`isAnonymous()`: RevenueCat está en el id de OTRA cuenta), donde
  el supuesto no interviene.
- **Una lista del SDK trae más de lo que el nombre de la propuesta sugiere (sesión 146, `R9-574`).** La entrada
  proponía mirar `nonSubscriptionTransactions` para saber si la cuenta tiene una ofrenda. Esa lista trae también
  las donaciones: tal cual, a quien solo donó se le habría dicho «Tu ofrenda ya está registrada». Antes de usar
  una lista del SDK, leé su tipo y preguntá qué más vende la app que caiga ahí.
- **Un `mockRejectedValueOnce` que no se consume lo hereda la prueba siguiente (sesión 146).** `mockClear` (lo que
  hace el `__reset()` del mock del SDK) no vacía la cola de `Once`. Con una pieza revertida, una prueba dejó un
  rechazo sin consumir y las tres que seguían cayeron en cascada. Al leer por qué cae cada prueba de un revert,
  mirá primero cuál es la primera que cae.
- **Actualizá memoria y este archivo al cerrar la sesión** (`feedback_essb-memory-freshness`).
