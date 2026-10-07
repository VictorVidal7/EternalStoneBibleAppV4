# Sesión 74 — revisión del diff de la 73 (2026-10-07)

En un chat nuevo, en la terminal y sin agentes, sin tocar código. Con `_scratch/S74-PROMPT.md`. La
72 y la 73 fueron del mismo chat; esta es la primera mirada de otro.

- **Estado al empezar:** `main` = `origin/main` = `64c4b88` (la 73 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37661765310`, 3 jobs, Node v24.21.0, 374/4627). Los docs decían
  «sin mergear» para la 73: corregido aquí. `main` no era más nuevo que `64c4b88`: el CI no se volvió
  a mirar.
- **Rama:** `docs/review-s74-diff-s73` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo medido de la 73 se sostiene. 1 nuevo, P3, de pruebas: `R9-302` (no lo abrió la
  73). Una corrección en `R9-297`. Las dos decisiones de Victor, escritas (`R9-289`, `R9-296`, §7).
  Quedan 302 hallazgos, ningún P0.

## 0. Cómo se trabajó

- Con los scripts de la 73: `_scratch/S73-turno1.cjs.txt` (su lista de `seRindeK` llega ahora a 80),
  `S73-a2m.cjs.txt` y `S72-sonda2.cjs.txt`. Uno nuevo, `_scratch/S74-sonda.cjs.txt` (una pieza y los
  archivos de prueba): aplica la pieza (al código o a una prueba), corre jest, restaura y dice
  `git status`; salidas en `S74-sonda-<pieza>.out.txt`.
- `git status` limpio tras cada corrida.

## 1. La prueba nueva de `R9-292` (`38a98da`, `abe6099`, `9c43e22`)

- **Cae como dice el cierre** (`S73-turno1 <pieza> prep`): `nada`, 6/6; `sueltaAntes5`,
  `turnoSoloGone`, `seRinde25` y `sinColaLento25` caen en `escribioConElRespaldoRetenido: 1` en los
  tres casos (`sinColaLento25` tumba además `muere` de `R9-275`, en `colgadas: []`, como
  `demoraDentro`); `devolucionFuera`, solo en `devolucion`; `demoraDentro` y `lento` no la tocan.
  `S73-a2m lentoClave prep`: cae en `retenidaSqlite: 0`.
- **Las 20 después (la regla de la 68 y la de la 71):** `seRinde45` a `seRinde59` caen; `seRinde60`,
  `61`, `62`, `65` y `80` pasan 6/6. El corte es la ventana entera (40 + 20, contadas desde que el
  respaldo toma el turno). Es el límite dicho sin número en `detail/S73` §4, ahora con su número
  exacto: un «se rinde» después de la ventana no lo ve ninguna prueba de vueltas, tampoco con el
  gancho de `R9-296`.
- **Las 40 enteras:** con el respaldo más lento (el código bueno, `S74-sonda lentoN`), `lento30`,
  `35` y `38` pasan; `lento45` cae en los controles `retenida: 0` y `pedido: 0`, que nombran el caso
  no construido. El resto de su diff es lo que el diseño acepta cuando el respaldo todavía no pidió
  el turno: la escritura del store va antes y el respaldo la reemplaza (el segundo caso de
  `R9-286`), y la unión que corre antes deja lo restaurado en la «sin cuenta» (el control de
  `R9-273`; a la vista al cerrar sesión, como dice `R9-269`).
- **¿Los controles nombran QUÉ llegó (la regla de la 72)?**
  - `retenida`: sí, la clave (`@prep_notes`) y el contenido (`del respaldo`). En `devolucion` no
    distingue la devolución de una escritura directa del respaldo en la «sin cuenta», pero la
    segunda pierde P, y el rojo lo dice.
  - `pedido`: cuenta llamadas a `prepMultiSet`, y antes de la vuelta 40 solo puede llamarla el
    respaldo. Con `ciego` da un rojo con el código bueno (ya aceptado en `R9-289`).
  - `retenidaSqlite`: cuenta las esperas en SQLite, y en esta prueba solo el respaldo lo usa. Su
    comentario («con la clave de Ana») dice más de lo que cuenta, pero hoy la clave se resuelve
    antes de la transacción (`BackupService.ts:1400-1419`), y el orden inverso daría el rojo de una
    pérdida real (P). Sin número.
- Lo que el agente 1 de la 73 midió con `storeMerge`, `dosEscrituras` y `copiaSuelta` no da verdes
  falsos (`_scratch/S73-sondas-agente-1/S73-agente-1.md.txt`).

## 2. `colgadas` con el contenido (`cfaa004`)

- **Cae como dice el cierre** (`S72-sonda2 actual <pieza>`): `nada` y `lento18` pasan;
  `releaseSinEsperar` cae en `colgadas: [[P]]` y en `sinCuenta` (sin `Ps/23/1-6`); `toqueYNota`,
  solo en `colgadas: [[P]]`; `anotaRespaldo`, con `ana: [Ps/23/1-6]` y `colgadas` sin diff.
- **¿Otro orden en que `[[P, R]]` mienta?** No encontré otro. Por lectura de los escritores de
  `@prep_notes` en `muere`: R solo llega a `@prep_notes:ana` por el respaldo, y juntar P y R en la
  «sin cuenta» exige una unión de `ana` con R sobre una «sin cuenta» con P. Eso es la devolución del
  respaldo. La de `releasePrepAccount` corre antes (también con `void giveBack`: va antes en el
  turno), y una devolución de `ana` posterior que encontrara P en la «sin cuenta» exigiría devolver
  dos veces, lo que la prueba no hace. Queda el límite del agente 3 de la 73 (una escritura
  suelta con `[P, R]`). `colgadas` lee los pasajes, no el contenido; aquí da igual: R solo viene del
  respaldo.

## 3. Las entradas nuevas

- **`R9-296` se sostiene:** `sueltaAntes5TardeDentro25`, `turnoSoloGoneTardeDentro25` y
  `tardeDentro25`, 6/6; `sueltaAntes5Tarde20` tumba la prueba de `R9-292` y `Tarde21` no. El
  prototipo del gancho (forma `enEspera`), re-medido como dice la entrada. Decisión de Victor escrita.
- **`R9-297` se sostiene, con corrección:** `tarde25` da el diff de la entrada. Pero basta `tarde1`
  (`S74-sonda`): la prueba de `R9-273` cae en su caso `store` con una sola vuelta (el de la unión
  pasa). El margen de hoy es cero.
- **`R9-298`..`R9-301` se sostienen:** cada sonda pasa sin pieza y cae con la suya (`cola`:
  `ana: [Ps/23/1-6]`; `cola2`: además P en vez de R en la «sin cuenta»; `conflicto`:
  `ana: [John/3/16-21]` y `de Ana`; `devuelta2`: sin `Rom/8/28`); las cuatro piezas pasan `prep`, 6/6.
- **¿Las escribiría alguien?** De más a menos: `goneFuera` (la cabecera de `prepMultiSet` la invita:
  «keys resolved before asking»; nota en `R9-298`), `sinSourceGoes` (un booleano por defecto que se
  cae; su gemelo en `giveBack` sí lo vigila `prepAccount.test.ts`, medido: nota en `R9-300`),
  `notaFuera` (va contra la cabecera, que pone la nota dentro) y `devolucionDosTurnos` (18 líneas,
  contra `R9-269`).
- **¿Alguna es P2?** No. Todas son huecos de pruebas con el código de hoy bien, como todas las
  entradas de pruebas anteriores (P3).

## 4. Nuevo: `R9-302`

- La prueba de `R9-287` (`backupRestoreSignal.test.ts:193`) pide la escritura del store y enseguida
  el respaldo, sin esperar a que el store tenga el turno. Con `prepWrite` UNA vuelta más lento
  (`tarde1`, el código bueno), cae con el diff exacto de `sinCola` (`prepMultiSet` sin el turno),
  controles incluidos y `turnoPedidoAntesDeAbrir: 1` a favor. Es lo que `R9-297` dejó «sin
  caracterizar», y el otro lado de `R9-289`.
- **Arreglo medido (`f287`):** la función del store marca que entró, la prueba espera esa marca
  hasta 40 vueltas antes del respaldo, y un control `otraConElTurno: true`. Sin pieza, con `tarde1`
  y con `tarde25`, pasa; `tarde45` cae en el control; `sinCola`, `lento` y `enTurno`, como hoy. No
  toca código de la app.
- **¿Lo abrió la 73?** No: la 73 no tocó `backupRestoreSignal.test.ts`. Es de la 67 (`8c168fb`).

## 5. Que sea solo la prueba

`git diff --stat f6c1c3c 9c43e22`: solo `__tests__/backupPrepTurn.test.ts` (162+, 14−).

## 6. Lo que no se hizo

- No se arregló nada (sesión de revisión). Lo pendiente sigue en la lista de `CONTINUAR.md`.
- No se corrió el suite entero con las piezas nuevas (`tarde1`): se corrieron las tres pruebas de la
  Mesa (`backupPrepTurn`, `backupRestoreSignal`, `prepAccount`), 18 pruebas.

## 7. La lección

- **Medí el corte, no solo una demora grande.** La 73 midió `tarde25` y dejó escrito «25 vueltas»;
  el margen era cero, y una vuelta basta para que dos pruebas den el rojo de una regresión. Cuando
  una pieza que demora tumba una prueba, bajá la demora hasta encontrar dónde deja de tumbarla.
- Y la de la 73, en la prueba de la 67: un control de que lo otro tiene el turno, no solo de que el
  respaldo lo pidió.
