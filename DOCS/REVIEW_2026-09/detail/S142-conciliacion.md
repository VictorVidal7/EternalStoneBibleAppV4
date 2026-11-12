# S142 — la conciliación de los hallazgos viejos (2026-11-12)

Sesión de solo docs, en la terminal, sin agentes y sin emulador, con Fable 5.2 como principal. **No se arregló nada,
no se re-severizó nada y no se tocó el código de la app.** Las líneas de código que cita `ESTADO.tsv` son las de
`a0147da0`.

## 1. Qué se hizo

- Las tandas de arreglos cubren `R9-410` en adelante. De `R9-1`..`R9-409`, **157 entradas** no tenían una marca de
  cierre entera en su propia entrada: las 155 de la lista de la 141, más `R9-1` (está en «Dudas / parciales» y la
  lista no la traía) y `R9-347` (su marca dice «✅ ARREGLADO **EN PARTE**» y el clasificador la contaba cerrada).
- Cada una se miró contra el código de hoy y contra `git log`, con una línea de evidencia.
- Queda `ESTADO.tsv` (una fila por hallazgo, los 573: `id`, `severidad`, `área`, `estado`, `cierre`, `evidencia`),
  un validador, y en `BUGS.md` una línea de marca en las 42 entradas que resultaron cerradas y no la tenían.

## 2. El conteo (los 573)

| severidad | abierto | sin-verificar | arreglado | aceptado | total |
| --------- | ------- | ------------- | --------- | -------- | ----- |
| P0        | 0       | 0             | 27        | 0        | 27    |
| P1        | 20      | 0             | 30        | 0        | 50    |
| P2        | 92      | 0             | 38        | 1        | 131   |
| P3        | 161     | 2             | 190       | 11       | 364   |
| aviso     | 1       | 0             | 0         | 0        | 1     |
| total     | 274     | 2             | 285       | 12       | 573   |

- **De las 157 viejas:** 113 siguen abiertas (20 P1, 47 P2, 45 P3 y el aviso `R9-1`), 2 quedan sin verificar, 34
  estaban arregladas y 8 aceptadas (a las 42 se les agregó la marca).
- **De `R9-410` en adelante** (del clasificador, sin verificar contra el código): 161 abiertas (45 P2 y 116 P3) y 3
  arregladas (los tres P1 de la 140).
- **«No hay ningún P0 ni P1 abierto» valía solo para `R9-410` en adelante.** Hay 20 P1 viejos abiertos. No hay
  ningún P0 abierto.
- La severidad es la que dice la entrada en su cabecera (`— P3`, `— P3 bajo`, `— P3, agrupado`) y, si no la dice,
  la sección de `BUGS.md`. Por eso salen 131 P2 y 364 P3: la 141 contaba 185 y 310 porque solo leía `— P3)`. No es
  una re-severización.

## 3. Los viejos que siguen abiertos

### P1 (20)

- **Dinero (4):**
  - `R9-16`: `restore()` confunde «no tienes compra» con «falló la red» (`offeringService.ts:343-348`).
  - `R9-17`: `purchaseUnlock` declara `success` sin comprobar el entitlement (`offeringService.ts:313`).
  - `R9-18`: el pago pendiente (OXXO, SPEI) se le muestra al usuario como una ofrenda fallida.
  - `R9-19`: `DonationSheet` no maneja `alreadyOwned` (el único consumidor es `OfferingSheet.tsx:125`).
- **Cuenta y cuota (3):**
  - `R9-24`: el diálogo de «Eliminar cuenta» manda a un botón que no borra los datos del dispositivo.
  - `R9-25`: `deleteAllCloudData` lee y borra sin límite ni lotes (`deleteAccountData.ts:55-56`).
  - `R9-29`: el import sube una escritura de `reviewEvents` por evento (`BackupService.ts:1078-1084`).
- **Sync (4):**
  - `R9-126`: un push con `updatedAt` viejo pisa en la nube la versión más nueva.
  - `R9-127`: el `skipNextBulkPush` de `deleteAccount` no tiene uid y anula el «Sí, migrar» de la cuenta siguiente.
  - `R9-128`: un apply remoto que falla se traga el error y el cursor avanza igual.
  - `R9-37`: `attachListener` es check-then-act sobre un `await` (un listener huérfano).
- **Respaldo (2):**
  - `R9-30`: el respaldo omite contenido del usuario sin copia en la nube (dos partes de la Mesa incluidas).
  - `R9-129`: `getAllReviewEvents` se traga su error y la sección no se marca degradada.
- **Mesa (1):** `R9-52`: toda falla de escritura de una nota se traga y se reporta como éxito.
- **Lector, notas y planes (4):**
  - `R9-40`: ningún `fetch` del catálogo de versiones tiene timeout.
  - `R9-41`: con el tema «Crepúsculo», la barra de acciones del versículo queda casi blanca sobre casi blanco.
  - `R9-51`: dos dispositivos pueden crear dos notas para el mismo versículo.
  - `R9-54`: descompletar un día de un plan no se sostiene.
- **Pruebas y CI (2):** `R9-131` (nada vigila el `{strict: true}` del export ni el `data.degraded` del servicio) y
  `R9-107` (la compuerta de CI decide por la forma de la línea `run:`).

### P2 (47)

- **Dinero (4):** `R9-20`, `R9-21` (el endpoint de canje), `R9-119` (cerrar sesión quita el premium; es decisión de
  producto), `R9-135` (el `logIn` de RevenueCat que falla al cambiar de cuenta).
- **Cuenta, cuota y reglas (4):** `R9-26`, `R9-134`, `R9-136` (la cuota compartida de Firestore, sin App Check: la
  entrada lo llama bloqueante antes del lanzamiento), `R9-158` (espera decisión de Victor).
- **Sync (4):** `R9-12`, `R9-132`, `R9-163`, `R9-164` (parcial).
- **Respaldo (5):** `R9-31`, `R9-32`, `R9-53`, `R9-60`, `R9-117`.
- **Mesa (3):** `R9-43`, `R9-58`, `R9-167`.
- **Lector, notas, planes y memoria (8):** `R9-42`, `R9-55`, `R9-56`, `R9-57`, `R9-61`, `R9-62`, `R9-63`, `R9-64`.
- **Pruebas (7):** `R9-114`, `R9-116`, `R9-137`, `R9-138`, `R9-139`, `R9-140`, `R9-141`.
- **CI, build y repo (12):** `R9-2`, `R9-3`, `R9-4`, `R9-5`, `R9-6`, `R9-8`, `R9-110`, `R9-111`, `R9-112`,
  `R9-113`, `R9-118` (Codecov: espera decisión de Victor), `R9-144`.

### P3 (45) y el aviso

- **Dinero (1):** `R9-122` (parcial: el punto 4 se arregló con `R9-153`).
- **Cuenta (1):** `R9-268` (decisión de producto).
- **Sync (9):** `R9-165`, `R9-198`, `R9-201`, `R9-202`, `R9-203`, `R9-205`, `R9-211`, `R9-213`, `R9-259`.
- **Respaldo (1):** `R9-284`.
- **Mesa (2):** `R9-168`, `R9-330` (pendiente por decisión de Victor del 2026-10-13: no se toca).
- **Lector, notas, planes y memoria (7):** `R9-145`, `R9-146`, `R9-147`, `R9-150`, `R9-172`, `R9-173` (decidido en
  la sesión 25 y sin hacer), `R9-285`.
- **Pruebas (15):** `R9-142`, `R9-148`, `R9-155`, `R9-159`, `R9-169`, `R9-241`, `R9-296`, `R9-297`, `R9-299`,
  `R9-300`, `R9-301`, `R9-304`, `R9-305`, `R9-308`, `R9-347` (lo que queda: conocido, no se toca). De `R9-296` a
  `R9-347` son del ciclo de las pruebas de la Mesa, que está cerrado.
- **CI, build y repo (9):** `R9-120`, `R9-121`, `R9-123`, `R9-149`, `R9-151`, `R9-152`, `R9-156`, `R9-170`,
  `R9-171`.
- **Aviso (1):** `R9-1` no es un bug: es la advertencia de que `npm audit fix --force` rompería la app.

## 4. Sin verificar (2)

- `R9-177` y `R9-240` piden emulador: los dos dicen «sin medir en nativo» (el hilo único de RNFirebase, y el orden
  entre la copia ajena y la respuesta del `set`). Conocidos por Victor; no se tocaron.

## 5. Las 42 marcas agregadas en `BUGS.md`

- **Arreglados, con commit en el asunto y «Arreglado» en la prosa de su entrada (15):** `R9-82`..`R9-96`.
- **Arreglados, con «✅ Cerrado en la sesión N» en minúsculas, que el clasificador no leía (18):** `R9-229`,
  `R9-234`, `R9-236`..`R9-239`, `R9-242`..`R9-251`, `R9-253`, y `R9-133` (sus dos mitades).
- **Arreglado por otro hallazgo, por lectura (1):** `R9-235`. El `if (!this.uid) return;` de `queueWrite` ya no
  existe: desde `R9-38` (`ea182dcb`, sesión 53), sin sesión se encola para la cuenta dueña del almacén. La sonda de
  la 38 no se repitió: es el único cierre de esta sesión que no tenía ya una señal escrita.
- **Aceptados (8):** `R9-227` (coste aceptado, sesión 38), `R9-252` (aceptado por Victor, sesión 46) y
  `R9-401`..`R9-405` con `R9-409` (costo conocido: la decisión del 2026-10-27 que cerró el ciclo de las pruebas de
  la Mesa).

## 6. Los límites de esta conciliación

- **Huecos de prueba (19 entradas):** se dan por abiertos porque ningún commit ni archivo de `__tests__` nombra el
  id; el revert de cada uno no se repitió.
- **Medidos en su día con una sonda (12 entradas, casi todas de sync):** «sin arreglo en git ni en el código, no
  re-medido». Una sonda podría mostrar que otro arreglo los cerró de paso, como pasó con `R9-235`.
- **Entradas agrupadas** (`R9-120`, `R9-121`, `R9-122`, `R9-123`, `R9-156`): se miró al menos un ítem, no todos.
- **Las entradas con marca y las de `R9-410` en adelante** salen de la marca de su entrada, sin mirar el código.
- La prosa de `INDEX.md` y de `CONTINUAR.md` no se usó como señal de cierre.

## 7. Cómo se usa

- El conteo y la lista de abiertos:
  `node DOCS/REVIEW_2026-09/_scratch/S142-validar-estado.cjs.txt DOCS/REVIEW_2026-09` (con `--corto`, solo el
  conteo). Avisa si falta una fila o una entrada, y si la fila dice una cosa y la entrada otra.
- Regenerar el TSV tras cerrar un hallazgo (la marca `✅ ARREGLADO` en su entrada es la fuente):
  `node DOCS/REVIEW_2026-09/_scratch/S142-estado.cjs.txt DOCS/REVIEW_2026-09 DOCS/REVIEW_2026-09/_scratch tsv`.
  Los veredictos de esta sesión están en `_scratch/S142-v-*.txt` (`id|estado|cierre|evidencia`).
- El lugar definitivo de los dos scripts se decide en la sesión de solo docs (la 143).
