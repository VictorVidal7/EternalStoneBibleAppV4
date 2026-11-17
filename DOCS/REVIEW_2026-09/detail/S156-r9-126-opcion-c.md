# S156 — `R9-126` opción C: una entrada en cola que ya perdió LWW no sube

> **Sesión 156 (2026-11-17).** Chat nuevo, en la terminal, con **Opus 5.5 de principal**, esfuerzo `high`, y **5
> agentes a pedido de Victor**. **Sin emulador: nada de esto está medido en vivo.**
>
> **Resultado.** La opción C entró en `fix/s156-r9-126` (`46ad0e93`), con una guarda que pidió el agente 3 y
> ampliada a los borrados (agente 4). `R9-126` queda **arreglado en parte**: siguen E, B y R. Ningún hallazgo nuevo
> con número; dos notas (en `R9-126` y en `R9-595`).

## 1. Estado de partida

main = origin/main = `5a3a01d0`, como pedía el mensaje. Validador: 0 avisos y 0 errores; 276 abiertos de 596.

## 2. Los agentes

Reglas comunes: `_scratch/S156-agentes-reglas.md.txt`. El contrato se fijó antes de repartir: la pieza
`_scratch/S156-pieza-C.json.txt`. La del agente 7 de la 154 ya no calzaba (el apply está dentro del `try` de
`R9-128`). Informes, piezas y salidas: `_scratch/S156-sondas-agente-<N>/`. Ninguno se cortó.

| N   | Modelo y esfuerzo       | Qué                                                        | Llamadas | Min |
| --- | ----------------------- | ---------------------------------------------------------- | -------- | --- |
| 1   | Sonnet, `medium`        | re-medir la sonda del agente 7 de la 154; línea base       | 15       | 2   |
| 2   | Opus 5.5, `high` (fork) | el arreglo y su prueba (dos vueltas)                       | 36 + 24  | 9   |
| 3   | Opus 5.5, `high` (fork) | vecinos en la cola: `R9-38`, `queueTouched`, `joinQueue`   | 34       | 6   |
| 4   | Opus 5.5, `high` (fork) | vecinos retenidos y borrados: `R9-128`, `R9-595`, lápidas  | 34       | 6   |
| 5   | Opus 5.5, `high` (fork) | otros productores: bulk push, push en vuelo, `own`, R9-104 | 29       | 5   |

`CONTINUAR.md` §5 dice «3 o 4 a la vez»: fueron 5 porque Victor lo pidió.

## 3. Lo medido

**Agente 1, re-medición sobre HEAD.** Con HEAD, todas las celdas iguales a la 154. Con C, el caso de la 49 (D en
cola, R del otro a 60 s) y sus tres variantes pasan de «nube D» a «nube R». Restaurar (C1), el bulk push (C2) y el
conflicto a 10 s, sin cambio. `SyncEngine.test.ts` 285/285 y las 36 vecinas 669/669, con HEAD y con C. Verificado
por el orquestador en las salidas (`nubeQ`: D, D, R con HEAD; R, R, R con C).

**Agente 3, la cola.** Un vecino ROTO por C, y su guarda:

| Caso                                                        | HEAD          | C                       | C + guarda    |
| ----------------------------------------------------------- | ------------- | ----------------------- | ------------- |
| `R9-38`, misma cuenta; llega R más nueva                    | nube D        | nube R                  | igual que C   |
| `R9-38`, otra cuenta (aparcada)                             | intacta       | intacta                 | intacta       |
| cola sin leer, 4 lecturas fallan, sin más ediciones (2b-f4) | disco [D1, O] | **disco [], O perdida** | disco [D1, O] |
| el apply lanza, cola sin leer                               | sin cambio    | sin cambio              | sin cambio    |

- La causa, confirmada por el orquestador en `readQueueAgain`: con la cola sin leer, `persistQueue` marca
  `queueWaiting` y relee; si la relectura falla, se rinde y escribe la cola desde memoria (`R9-212`, aceptado).
  Hoy solo una escritura dispara eso; con C, también un apply.
- La guarda: con la cola sin leer, C quita la entrada solo de memoria. La unión posterior descarta la del disco
  (`queueTouched`, que marcó el apply).
- Queda D1 en el disco si el proceso muere antes de releer: sube sobre R tras reiniciar, igual que HEAD (la
  ventana aceptada de `R9-255`).

**Agente 4, retenidos y borrados.**

| Caso                                           | HEAD (A / nube)    | C              | Veredicto  |
| ---------------------------------------------- | ------------------ | -------------- | ---------- |
| `R9-128`: el apply de R falla una vez, sin red | R / **D**          | R / R          | mejora     |
| igual, la red vuelve entre attaches            | D / D              | D / D          | sin cambio |
| `R9-595`: el apply falla siempre               | D / D              | D / D          | sin cambio |
| lápida propia en cola, copia viva más nueva    | R / **lápida**     | R / R          | mejora     |
| lápida en cola, copia no más nueva (`R9-262`)  | retenida           | retenida       | sin cambio |
| borrado remoto más nuevo que D viva en cola    | D / **D** (revive) | D / D (revive) | sin cambio |
| lo mismo, con C ampliada a borrados            | —                  | nada / lápida  | mejora     |

- **Decidido por el orquestador** (el diseño técnico de sync está delegado): C va también con los borrados. Es la
  misma regla de LWW: A ya aplicó el borrado, y subir D solo revive el doc en la nube. Riesgo: el de LWW con un
  upsert (un reloj del otro adelantado gana). Victor puede revertirlo antes del merge.
- Las filas 2 y 3 van como notas en `R9-126` y en `R9-595` (sin número).

**Agente 5, otros productores.** Ninguna fila rompe; cuatro mejoran.

| Caso                                              | HEAD (A / nube / B / C) | C                 | Veredicto  |
| ------------------------------------------------- | ----------------------- | ----------------- | ---------- |
| bulk push en línea (C2)                           | V / V / N / V           | igual             | sin cambio |
| bulk push, primer snapshot antes del flush        | N / **V** / N / V       | N / N / N / N     | mejora     |
| push en vuelo: R llega mientras D sube            | R / R / R               | igual             | sin cambio |
| respaldo W en cola, llega la copia propia         | W / W / – / W           | igual             | sin cambio |
| respaldo W en cola, llega N2 del otro (más nueva) | N2 / **W** / N2 / W     | N2 / N2 / N2 / N2 | mejora     |
| `R9-104`, la entrada aparcada de otra cuenta      | intacta                 | intacta           | sin cambio |
| `R9-104`, la misma cuenta vuelve y llega RX antes | RX / **D**              | RX / RX           | mejora     |
| C3 a 10 s (conflicto pendiente)                   | D, 1 conflicto / D / R  | igual             | sin cambio |

- Con el respaldo en cola, `R9-245` corta antes del apply (la copia es propia): C no corre. No quedan relojes
  `own` colgados al quitar la entrada (ya tenía `own=null`).
- El push en vuelo con C quitando la entrada no se puede armar en el mock; por lectura, el flush lo tolera.

## 4. Lo que entró

`46ad0e93` — `fix(sync): R9-126 opción C`. En `applyRemoteChange`, después del `try/catch` de `R9-128`:
`if (data) this.dropQueuedOlderThan(...)`. El helper quita las entradas de `this.uid`, esa colección, ese id y
`updatedAtOf(q.data) < updatedAtOf(data)`; si quitó alguna, `pendingWrites`, y `persistQueue()` solo con la cola
leída. Un apply que lanza no llega ahí (el `catch` devuelve `false`).

Prueba: `__tests__/s156a2-r9-126-cola.test.ts`, 10 casos, motor real. Verificado por el orquestador en el principal
(`_scratch/S156-verif.cjs.txt`, salida `.out.txt`):

| Pieza revertida | Caen                                                    |
| --------------- | ------------------------------------------------------- |
| sin C           | 6: los tres de la 49, la guarda, el borrado y la lápida |
| sin la guarda   | 1: la guarda (disco `[]` en vez de `[uid, doc-o]`)      |
| con `!deleted`  | 1: el borrado remoto (la entrada `doc-d` sigue en cola) |

Los 4 controles (entrada más nueva, otra cuenta, apply que lanza, lápida retenida) no caen con ninguna pieza; los
dos primeros caen con un filtro demasiado ancho (`S156-a2-mut`).

## 5. Sin medir

- Todo, sin emulador.
- Un push ya en vuelo cuando C quita su entrada (el mock no lo arma).
- Un conflicto retenido cuya entrada lleva `own` vivo cuando C la quita.
- Un borrado remoto contra una entrada con conflicto pendiente.
- El otro teléfono como segundo motor: deducido de su piso.

## 6. Estado al cerrar el código

`fix/s156-r9-126` sobre `5a3a01d0`, un commit: `46ad0e93`. Compuertas: prettier, eslint y tsc OK; las 36 vecinas,
669/669; `SyncEngine.test.ts` más la prueba nueva, 295/295. Suite entera: 385 suites, 4863 pruebas, verdes
(`S156-suite.out.txt`). Los docs, apilados en `docs/review-s156`. Sin mergear: espera el OK de Victor.
