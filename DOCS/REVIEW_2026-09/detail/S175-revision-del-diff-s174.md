# Sesión 175 — revisión del diff de la 174 (`R9-51`, una nota por versículo)

> Sin agentes, con emulador (`-read-only`, cuenta anónima, sin la de Victor). Opus 5.5 principal, esfuerzo high.
> Sin cambios de código: los hallazgos se anotan.

## 1. Estado de partida

main = origin/main = `527f2d1c` (los docs de la 174b, encima de `29c956ac`): Victor ya había mergeado. `git status`
limpio. Rama de docs: `docs/review-s175`. Se revisó `541a0d64..29c956ac` por archivo.

## 2. Veredicto

**El arreglo se sostiene**: una nota por versículo en el disco, en la pestaña Notas y en el lector; el plegado de
arranque corre una vez, en una transacción, y sube un lote; el candado ordena el plegado, el adaptador y las
ediciones de las pantallas. Cuatro hallazgos nuevos, todos P3 (`R9-624` a `R9-627`), medidos con SQLite real
(`_scratch/S175-pruebas.test.ts.txt`: el arnés de `notesVerseKeyR951.test.ts` y cinco sondas H1 a H5; se corrió
como prueba temporal y se borró, el repo queda igual) y uno de ellos también en vivo.

## 3. Punto por punto

**1. Lo aceptado en el §5 de la 174.**

- La lápida de un id viejo en un aparato plegado: alcanza para lo que dice (la lápida viene de un aparato que plegó,
  cuyo lote lleva la fila del versículo). Con una app vieja que BORRA su nota, el texto queda en la fila plegada de
  los aparatos nuevos: transitorio, ya escrito.
- La ventana entre el commit del plegado y el encolado: es más ancha de lo que dice, porque `queueWrites` persiste
  la cola sin esperar (`void this.persistQueue()`) y, sin sesión, encola por la cadena del dueño (asíncrona), y la
  bandera se graba antes de que eso termine. La consecuencia es la misma que el §5 acepta (la nube se queda con los
  ids viejos; los aparatos que los reciben los pliegan solos). Se mantiene aceptado. El motor SÍ existe cuando corre
  el plegado: `SyncEngineProvider` es hijo de `ServicesProvider` y su efecto (`setSyncEngine`) corre antes que el
  del padre; `AuthProvider` no retiene a sus hijos.
- La resurrección en una instalación nueva: solo con docs viejos vivos en la nube (la ventana anterior, o un usuario
  de un solo aparato que no sube su lote). Rara; sigue aceptada.
- Dos aparatos que pliegan sin sincronizar: con las MISMAS notas dan el mismo texto (H5) y `updated_at` distinto
  (cada uno su «ahora»); el motor no levanta conflicto porque el campo material (`note`) es igual
  (`SyncEngine.ts:2524-2560`), y gana el último: convergen. Con notas distintas, gana el último (aceptado).
- La app vieja que recibe un `vnote:`: además de la fila de más, cada edición que haga en SU nota vuelve a los
  aparatos nuevos como otra copia del texto: **`R9-626`** (H4).

**2. El candado contra el import.** El import corre su plegado dentro de su transacción y no toma el candado. Un
`applyRemoteNote` que entra a mitad corre DENTRO de esa transacción (expo-sqlite): si escribe un `vnote:` entre el
`DELETE FROM notes` y el `INSERT` del archivo con el mismo id, el import falla con `UNIQUE` y hace rollback (el
usuario ve el error y reintenta); si escribe entre la lectura y la escritura del plegado del import, gana el
archivo, que es lo que pide un «restaurar». Con ids por versículo la colisión es algo más probable que con los ids
al azar, pero la clase es la de antes y el §5 ya la aceptó. El plegado de arranque no se cruza con un import (corre
al abrir la app, antes de que se pueda llegar a Ajustes). Sin hallazgo nuevo.

Lo que sí se cruza es el plegado de arranque con el adaptador: el adaptador lee la bandera FUERA del candado, y un
pull que llega durante el plegado escribe el id viejo después, como segunda fila que ya nadie pliega:
**`R9-624`** (H1: filas `note_b` y `vnote:John:3:16`, bandera `"1"`).

**3. La regla de «contenido».** Es la misma en la migración, el adaptador y el import (las tres llaman
`mergeVerseNotes` → `mergeNoteTexts`), y plegar dos veces = una (H5). Pero es una subcadena de caracteres:
**`R9-625`**. «Ver Juan 1» se pierde junto a «Ver Juan 14:6», «Salmo 2» junto a «Compárese con el Salmo 23» (H3).
**En vivo**: dos filas viejas de Juan 1:1 con esos textos → `vnote:John:1:1` = «Ver Juan 14:6» en el disco y en la
pestaña Notas (`_scratch/S175-vivo/03-notas.png`). Un texto que es prefijo de otro con un párrafo más (`a` y
`a\n\nb`) se junta bien (es lo que la 174 quería). Como el plegado corre una vez por aparato, lo que quita no vuelve.

El orden: el plegado de la migración es determinista (por `createdAt`, después por `rowid`); el del adaptador
depende del orden de llegada, porque la fila ya plegada lleva el `createdAt` más viejo y lo nuevo va al final
(H2: `X\n\nB\n\nD` contra `X\n\nD\n\nB`, el mismo `updated_at`, sin push). Va con **`R9-626`**.

**4. `updateNote` que rechaza con 0 filas.** Llamadores (grep): el lector (`[chapter].tsx:1053`) y lectio
(`lectio.tsx:284`); `addNote` en los mismos dos. El lector tiene `try`, muestra `t.notes.saveError` y deja el
editor abierto con el texto: al reintentar relee y encuentra la fila nueva. Lectio tiene `try` pero el `catch` no
avisa y pasa al final, que no muestra la oración: **`R9-627`** (de antes; la 174 le suma dos razones para fallar:
0 filas, y `UNIQUE` si un pull trae la nota entre la lectura y el `INSERT`). Ninguna promesa queda sin `catch` en
estos dos; el `confirmDelete` de `notes.tsx` sigue sin `try` (ya en `R9-415`). El guardado del lector no tiene
guarda de reentrada: un doble toque muy rápido daría «guardado» y luego el error de `UNIQUE` (antes, dos filas).
No se midió y no se anota: con dos `await` cortos, el primero cierra el editor antes.

**5. El adaptador antes y después de la bandera.** Sin eco (no encola nada; H2 lo comprueba), sin fila duplicada y
con el texto plegado, salvo la carrera de `R9-624`. Antes de la bandera escribe el id viejo y el plegado lo toma
(prueba de la 174). La bandera se cachea en memoria solo cuando es `true`.

**6. Convergencia.** Ver el punto 1: mismas notas → mismo texto, `created_at` igual, `updated_at` distinto que el
motor resuelve sin conflicto. Lo que sube es UN `queueWrites` (la fila del versículo y las lápidas `deleted: true`),
medido en jest con el motor real en la 174 (`backupImportSyncCost`). El lote a la nube en vivo espera `R9-135`.

## 4. En vivo (emulador `-read-only`, APK debug vc73, Metro)

Cuenta anónima, sin sync. `pm clear` y primer arranque (plegado sin notas, bandera puesta). Con la app parada se
sembraron cinco filas viejas (las tres de la 174 y dos de Juan 1:1, «Ver Juan 1» y «Ver Juan 14:6»), se borró la
bandera y se marcó el onboarding como hecho (`_scratch/S175-vivo.sh.txt`, `S175-sembrar.cjs.txt`). Arranque en frío:
logcat `notes: folded into one note per verse {"written":3,"removed":5}`. Disco: `vnote:Genesis:1:1` con sus fechas,
`vnote:John:3:16` con las dos notas por orden de creación (`updated_at` el de ahora), `vnote:John:1:1` = «Ver Juan
14:6» (`R9-625`); bandera `"1"`.

- **Pestaña Notas** (`eternalbible://notes`): «3 Notes saved», una tarjeta por versículo (`03-notas.png`).
- **Lector** (Juan 3, versículo 16 → «Note»): el editor abre con el texto plegado entero (`08-editor.png`). Guardar
  dio «Note saved» y el disco mostró la misma fila `vnote:John:3:16` con `updated_at` nuevo, sin fila de más
  (`09-editado.png`; el texto tecleado no llegó a entrar, el guardado se disparó antes: se midió el camino de
  `updateNote` sobre el id del versículo, no una edición del texto).

Capturas en `_scratch/S175-vivo/`. Lo que pide la nube (el lote subido, dos aparatos reales, una app vieja con
sync) espera `R9-135`.

## 5. Estado al cerrar

`R9-51` sigue ✅; su entrada lleva la nota de esta revisión. Nuevos: `R9-624`, `R9-625`, `R9-626` y `R9-627`, P3.
Validador: 278 abiertos de 627 (0 P0, 2 P1, 87 P2, 188 P3 y un aviso), 0 avisos y 0 errores.

**La 176 (decidido por Claude, por la delegación de Victor):** arreglar `R9-625` y `R9-624` antes que la V6, aunque
sean P3. El porqué: el plegado corre UNA vez por aparato; lo que `R9-625` quita no vuelve después, así que el
arreglo tiene que llegar antes de que un build con `29c956ac` corra sobre notas reales. `R9-627` entra si cabe
(barato, la misma zona). `R9-626`: decidir en la 176 entre arreglarlo o aceptarlo (es transitorio: solo dura
mientras quede una app vieja con sync). Después, la V6.
