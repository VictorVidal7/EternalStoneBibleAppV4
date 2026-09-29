# Sesión 30 — arreglos de lo de la 29 (`R9-182`..`R9-188`), y `R9-189`..`R9-194`

Sesión 30, 2026-09-29, solo en la terminal. A pedido de Victor, a mitad de la sesión, hubo 3 agentes
en worktree, que solo midieron (A1, A2 y A3). La rama `fix/s30-sync-r9185-r9188` la escribió el
orquestador.

## 1. Estado de partida

- `main` = `origin/main` = `678a4be` (el checkpoint de la 29). El CI verificado en el log: run
  `36613268918`, Node v24.21.0, 367/4433, cero «failed to run».
- 1 P0 abierto (`R9-38`), 188 hallazgos.

## 2. Resumen

| Hallazgo | Commit    | Qué                                                                                     |
| -------- | --------- | --------------------------------------------------------------------------------------- |
| `R9-185` | `24900f1` | H1: con escritura en cola, un conflicto retenido pasa la marca a la copia leída         |
| `R9-186` | `52a420c` | V2: la lectura fallida o vencida retiene el conflicto con `reread`, y el enganche relee |
| `R9-187` | `20ef1f9` | Sin el `throw` de `pushOne`; pruebas de `R104-4` y del `.catch` de la cadena            |
| `R9-188` | `3c09a0f` | La prueba de `R9-161` en su forma original; comentarios de `applyRemoteChange` y mock   |
| `R9-184` | `560fe5c` | El flush salta la entrada que otra edición ya reemplazó (A1)                            |
| `R9-183` | `7c7a6ec` | `resolveConflict` avanza el cursor por la cadena de la colección (A1)                   |
| `R9-182` | `5dac31e` | La reversión del rechazo final no borra la copia local (A1, H182b)                      |
| `R9-190` | `5c44cec` | Nuevo, abierto por H1: la marca no pasa a una copia PROPIA (A2)                         |
| `R9-191` | `395a448` | Nuevo, abierto por `R9-186`: lista de releer ilegible, se releen todos (A2)             |
| —        | `45d2f41` | Comentario: el reloj atrasado apunta a `R9-193`                                         |

- **Suite de sync:** 160 → 178 pruebas, todas verdes. `npm run validate` entero
  (`NODE_ENV=development`), sobre `3c09a0f` (367 suites / 4440 pruebas) y sobre la punta final
  `45d2f41` con el ledger (367 / 4451): verde, 0 errores de lint. El CI de la rama no corre hasta
  que se pushee.
- **Hallazgos nuevos:** `R9-189`..`R9-194` (6). Dos se abrieron y se cerraron en la sesión
  (`R9-190` y `R9-191`); cuatro quedan abiertos (`R9-189`, `R9-192`, `R9-193` y `R9-194`).
- **Cerrados:** `R9-182`..`R9-188`, `R9-190` y `R9-191`. Hallazgos: 194. P0: 1 (`R9-38`).

## 3. `R9-185` — H1

- **La prueba de la Q5a** («R9-185: con un conflicto retenido y una edición mía en cola…»), con
  control del mecanismo (el `removed` entregado y la edición en cola tras un intento).
  - La guarda de la 28 (`settle` a secas): cae, con la marca `{}` y 0 conflictos tras reiniciar.
  - Sin mover la marca a la copia leída: cae (la marca queda en «lo suyo»).
- **El `settle` de la guarda para un doc SIN conflicto** (pieza `S176-settle`, 0 caídas en la 29)
  tiene ahora su prueba: un doc retenido por `R9-46` y un respaldo del otro con la edición en cola.
  Sin el `settle`, la marca queda y el piso del reinicio baja a ella (5 s sobre el piso, en vez de
  el cursor menos el margen).

## 4. `R9-186` — medido antes de elegir

Sonda `_scratch/S30-sonda-r186.body.txt` (4 escenarios; variantes con `_scratch/S30-v.cjs.txt`):

| Variante                              | Tras el fallo              | Tras reiniciar                                          |
| ------------------------------------- | -------------------------- | ------------------------------------------------------- |
| hoy (`settle`)                        | marca `{}`                 | 0 conflictos                                            |
| V1: retener sin releer                | marca en «lo suyo», releer | 0 conflictos en cada reinicio; piso clavado en la marca |
| **V2: retener con `reread` y releer** | marca en «lo suyo», releer | `[lo mío, su respaldo viejo]`, marca en el respaldo     |

- V1, con el cursor ya una hora más arriba: piso en `T − 235 001` en cada reinicio, para siempre.
- V2: si la relectura vuelve a fallar, sigue para el enganche siguiente; tras el plazo vencido, un
  proceso nuevo (el ejecutor libre) lo lee. Coste: el enganche de la relectura lee desde la marca
  vieja una vez.
- El control sin conflicto (la lectura fallida suelta el doc, como antes) sigue verde.
- **Elegida V2.** Siete piezas (la rama, sin la marca de releer, el enganche sin releer, la
  detección sin la copia leída, guardarla, cargarla y el `hold` que ignora el cambio de la marca):
  cada una tumba las 3 pruebas nuevas.
- Los comentarios de `REMOVED_LOOKUP_TIMEOUT_MS` y de `stop()` dicen ahora que el plazo suelta el
  `await` del motor, no el ejecutor único de RNFB.

## 5. `R9-187`

- **Se quitó el `throw` y se quedó la ruta `users/${item.uid}`**: la ruta sigue siendo cierta
  aunque alguien meta un `await` en medio, y el `throw` solo lo era mientras el bloque siguiera
  síncrono. Sin el `throw`, `R104-4` discrimina sola (caen 2).
- **La prueba del efecto propio de `R104-4`**, con un reloj que se distingue: `lastError` no sirve,
  porque cualquier lote del listener lo pone en `null`.
- **El `.catch` de `enqueueSnapshot`: decidido por Victor, se queda, con prueba.** Un spy sobre
  `handleSnapshot` que rechaza una vez. Sin el `.catch`, jest tumba la prueba con el rechazo que se
  escapa de la cadena antes de llegar a la aserción de `doc-b`: la consecuencia se afirma por la
  semántica de las promesas, no se ve en la prueba, y el comentario lo dice.
- `R104-7` sola da 0 (la cubren los cortes de `R104-2` y `R104-4` por tiempo); `4 + 7` caen 2.

## 6. `R9-188`

- La prueba de `R9-161` volvió a su forma original (la nube sin el doc). Su comentario nuevo («L
  no se borra por la guarda de `R9-176`») está vigilado: la prueba cae con `S176-cola`.
- El comentario de `applyRemoteChange` sobre las copias más viejas dice que no siempre son propias
  (`R9-193`), y el del hilo único del mock, que el `delete()` no entrega evento.
- La nota de `R9-182` en `BUGS.md` («su forma original sirve como prueba») se corrigió en este
  checkpoint.

## 7. A1 — `R9-182`..`R9-184`

Informe íntegro: `_scratch/S30-A1-informe.md.txt`; diffs `S30-A1-r18{2,3,4}.diff.txt`. El
orquestador leyó cada diff contra el informe y re-midió cada pieza en su árbol: los mismos números.

- **`R9-184`:** `if (!this.queue.includes(item)) continue;`. W2 sube en el re-flush del final del
  mismo flush. **Vecino abierto (`R9-189`):** si W2 reemplaza a W1 después de llamar `pushOne(W1)`
  y antes de que el SDK emita el `set` (el `set` espera detrás de una lectura en el hilo único), el
  conflicto aparece igual.
- **`R9-183`:** el avance del cursor pasa por la cadena, y dentro mira `isCurrent()` (sin eso, el
  «ahora» de Ana caía en la clave y la caché del cursor de Beto). Piezas: cadena 3, sesión 1.
- **`R9-182`:** la hipótesis literal de la 29 (un `Set` que consume el `removed`) deja la marca
  colgada si la reversión es un `modified` y se traga un borrado de verdad posterior; se integró
  H182b (un `Map` que termina con cualquier entrega que no sea el eco del mismo payload). Piezas:
  2 / 2 / 1 / 1. El orquestador consideró vaciar el mapa en `stop()` y no lo hizo: una pieza sin
  prueba, para un camino estrecho que queda dicho en el comentario. Depende del orden «rechazo
  antes que reversión», no medido en RNFB.

## 8. A2 — los arreglos nuevos, medidos adversarialmente

Informe íntegro: `_scratch/S30-A2-informe.md.txt`; hipótesis `S30-A2-hx.diff.txt`.

- **Q2, `R9-190` (nuevo, lo abrió H1):** si la copia leída es un respaldo PROPIO restaurado y la
  edición siguiente espera en la cola, H1 movía la marca a esa copia propia; tras reiniciar,
  «lo mío contra lo mío», y `keepTheirs` perdía la edición. **Arreglado** con P1/P1q/P4/P5 de A2
  (`isOwnCopy`: la escritura en cola o la última que el servidor tomó en esta sesión, `ownAcked`).
  P1q no tenía prueba en este árbol (en A2 caía por el fantasma pasajero que mostraban P2/P3, no
  integradas): se le escribió la suya (la lectura vuelve antes del ack). Mide la marca, no un
  fantasma tras ese reinicio.
- **Q3c, `R9-191` (nuevo, lo abrió `R9-186`):** la lista de releer ilegible → 0 conflictos y piso
  clavado para siempre. **Arreglado** con P6 (ilegible, se releen todos los conflictos retenidos).
- **Q1/Q1d/Q3e/Q4d, `R9-192` (nuevo, ya existía):** en la sesión, el conflicto sigue mostrando
  «lo suyo» (R) cuando la nube ya tiene otra copia (X); `keepTheirs` sube R encima de X o deja
  local R y nube X para siempre. P2/P3 de A2 lo cierran (medidas) pero cambian lo que ve el
  usuario: **decisión de Victor, sin integrar.**
- **Sin hallazgo:** el cambio de cuenta con el lote sintético (termina en el `isCurrent()` de
  Ana), las claves tras `resolveConflict`, `R9-180` y `R9-160`. Nada limpia claves por uid al
  cerrar sesión ni al borrar la cuenta; la nueva se comporta igual que las otras.

## 9. A3 — el reloj atrasado del otro teléfono

Informe íntegro: `_scratch/S30-A3-informe.md.txt`; hipótesis `S30-A3-reloj.diff.txt`.

- **`R9-193` (nuevo, P2):** más ancho que lo que señaló la 29. La rama `pending` toma una copia
  del otro con el reloj atrasado por un eco propio con cualquier atraso (1 s, 20 s, 2 min, 10
  min): «su versión» se queda vieja, y `keepTheirs` deja la nube y el teléfono distintos. La rama
  retenida (con la app cerrada) la asienta por LWW y borra la marca. Caso realista: el usuario
  sigue escribiendo aquí y el otro, 2 min atrasado, escribe casi a la vez.
- **La hipótesis de A3 («sellos propios» persistidos, `@sync_own_<col>:<uid>`)** converge en 23 de
  24 casos, con un coste medido: un fantasma «lo mío contra lo mío» si el proceso muere en una
  ventana de milisegundos, y dos piezas sin guarda. Se pisa con `ownAcked` de `R9-190`: las dos
  responden «¿esta copia es mía?». **Decisión de Victor: registrar, sin integrar**; la 31 decide
  cómo unificarlas.
- **`R9-194` (nuevo, P3, ya existía):** la ventana de 30 s da un fantasma «lo mío contra lo mío»
  tras reiniciar, sin conflicto previo (L1 subió, L2 en cola sin red).
- Notas: con la app cerrada, una copia del otro reescrita bajo el piso no vuelve nunca en el mock
  (a `R9-164`); `R9-174` podría cerrarse con los mismos sellos (sin medir).

## 10. La matriz entera

`_scratch/S30-matriz.cjs.txt` sobre la punta del código (`395a448`; `45d2f41` solo cambia un
comentario), `NODE_ENV=development`, suite de 178, en un worktree aparte (`C:/projects/essb-s30m`,
junction borrada con `.Delete()` antes del `git worktree remove`). Salida:
`_scratch/S30-matriz-final.out.txt`. 72 piezas; el control, 0 caídas.

- **Todas las piezas discriminan, salvo tres, ya explicadas:**
  - `R104-7` (y `R104-8`, que sin el `throw` es la misma pieza): 0. La cubren por tiempo los cortes
    de `R104-2` y `R104-4`; `R104-4 + R104-7` caen 2;
  - `G7` y `R104-5`: AUSENTES a propósito. Su código ya no existe (`isSyncing` desde `7292b78`; el
    `throw` desde `20ef1f9`).
- **Anclas que cambiaron con los arreglos, medidas con una alternativa (corolario 41):**
  `S176-cola` (la guarda entera, 10), `S176-settle` (3), `S181-b` (5), `S185-h1` (2), `T-cursor` (1)
  y las combinadas `R104-6`/`R104-9`, sin el `throw` (2 y 2).
- **Las que daban 0 en la 29 y ahora caen:** `R104-4` (2), `S176-settle` (3) y `S175-catch` (1).
- **Las piezas nuevas:** `S182-*` 2/2/1/1, `S183-*` 3/1, `S184-foto` 1, `S185-*` 2/2, `S186-*` 4, 4,
  4, 4, 4, 3 y 4, `S190-*` 2/1/1/1, `S191-ilegible` 1.
- **El resto, pieza por pieza:** P1 11, P2 1, P3 5, P4 1, P5 3, P6 2, P7 7, P8 8; G2..G6 1-2, G8
  3, G9 1, G10 3; `R104-1` 2, `R104-2` 1, `R104-3` 1; `S175-*` 11/2/1/2/5/3; `S181-*` 5/2/2/1/1,
  `S181-clon` 1; `R154` 1; `T-*` 3/2/1/20/13/1/2/1.

## 11. Lecciones

- **Un arreglo de la sesión abrió su propio vecino, y lo vio un agente que buscaba romperlo
  (`R9-190`).** H1 se midió contra la copia leída del OTRO; la copia PROPIA estaba a un paso. Ante
  una marca que se mueve a «la copia que encontró la lectura», preguntá de quién puede ser esa
  copia.
- **Un comentario que compara dos modos de fallo es una afirmación (`R9-191`).** «Como una lista
  de conflictos ilegible» era falso: aquella tiene una próxima entrega que la asienta, esta no.
- **Un nombre o un comentario de prueba que dice la consecuencia tiene que verla.** Dos veces en
  la sesión la pieza revertida hacía caer el mecanismo y no la consecuencia (el `.catch`, la
  escritura en cola de `R9-190`): se corrigieron los comentarios en vez de afirmar lo no visto.
- **Una pieza que en el worktree del agente caía puede no caer en el del orquestador** si el
  agente tenía integradas otras piezas que la exponían (P1q con P2/P3). Re-medir cada pieza en el
  árbol que se va a commitear, no copiar la tabla del informe.

## 12. Sondas y scripts

En `_scratch/` (todas con `.txt` al final):

- `S30-matriz.cjs.txt` (la de la 29 con las piezas de la 30; `S30_ROOT` corre en otro árbol;
  `S30_FULL=1` imprime el mensaje entero), y sus salidas `S30-matriz-*.out.txt`;
- `S30-mk.cjs.txt` (arma `__tests__/S30sonda.test.ts`; `--clean` lo borra),
  `S30-sonda-r186.body.txt` y `S30-v.cjs.txt` (variantes de `R9-186`);
- `S30-split191.cjs.txt` (separó `R9-191` de `R9-190` para commitearlos aparte);
- `S30-validate.out.txt`;
- los informes, diffs y salidas de A1, A2 y A3: `S30-A1-*`, `S30-A2-*` y `S30-A3-*`.
