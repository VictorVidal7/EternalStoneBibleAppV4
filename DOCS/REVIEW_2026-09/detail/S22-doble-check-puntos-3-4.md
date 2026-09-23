# S22 — doble check con Opus 5.5, puntos 3 y 4: los P1/P2 nunca re-verificados y las afirmaciones de los `detail/S*`

**Sesión 22, 2026-09-23. Solo de REVISIÓN, con Opus 5.5.** Tuvo dos partes:

1. **El checkpoint de la sesión 21** (`detail/S21-doble-check.md`), en `docs/review-s21-doble-check`.
2. **Los puntos 3 y 4 del doble check** que pidió Victor. Con los puntos 1 y 2 de la 21, **el doble
   check de todo lo revisado con Opus 5 (hasta la sesión 18 incluida) queda TERMINADO.**

- **Base:** `ca2cd71`. Su CI está verificado EN EL LOG al empezar: run `35801884549`, Node v24.20.0,
  364/4299 y cero «failed to run».
- **Agentes:** el prompt pedía 2, pero Victor pidió 5 a mitad de sesión. Los 2 que ya corrían se
  quedaron con una parte de su punto y se lanzaron 3 más. Todos eran forks en worktree aislado,
  con informe incremental en `_scratch/S22-agente-*.md`, la lista de ya reportados
  (`_scratch/S21-ya-reportados.txt`) y la regla de revertir por pieza.

| agente | punto | alcance                                         |
| ------ | ----- | ----------------------------------------------- |
| 3      | 3     | A8 + A9: `R9-51`, `52`, `56`, `57`, `58` y `59` |
| 3b     | 3     | A10 + A11: `R9-53`, `54`, `55` y `60`..`64`     |
| 4      | 4     | `detail/S8`, `S9` y `S10`                       |
| 4b     | 4     | `detail/S13`, `S14` y `S15`                     |
| 4c     | 4     | `detail/S16`, `S17` y `S18`                     |

- **Los 5 se cortaron A LA VEZ por el límite de uso de la sesión.** Cuando se reseteó, 3, 3b, 4 y 4c
  se retomaron con su contexto intacto. Sus worktrees seguían ahí, sin ningún archivo trackeado
  modificado.
- **El worktree del 4b se había borrado solo, y con él sus sondas.** Se relanzó como fork nuevo a
  partir de su informe, sin repetir lo que ya tenía veredicto. Las mediciones de su primera parte
  no se volvieron a correr, y ninguna sostiene un P0/P1.
- **Todo lo que subió a P1 lo verificó a mano el orquestador.** También las dos bajadas de P1 a P2.

**Resultado: 10 hallazgos, `R9-143`..`R9-152`** (1 P1, 1 P2 y 8 P3), y 3 cambios de severidad.
**Ningún P0 nuevo: siguen 5 abiertos** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`).

---

## Punto 3: los P1/P2 que nunca se re-verificaron (`R9-51`..`R9-64`)

**Las 14 entradas siguen siendo ciertas en `HEAD`.** Ninguna sesión posterior tocó el código de
fondo, y solo se corrieron líneas. En casi todas hay algo del texto que no se sostiene. Las
correcciones quedaron escritas dentro de cada entrada de `BUGS.md`, como «⚠️ Sesión 22» o «❌
Corrección de la sesión 22».

| R9      | veredicto en `HEAD`                   | sev.        | lo que cambia en la entrada                                                             |
| ------- | ------------------------------------- | ----------- | --------------------------------------------------------------------------------------- |
| `R9-51` | CONFIRMADO (sonda, SQLite real)       | P1          | no es «una arbitraria»: cada dispositivo ve la suya y divergen para siempre             |
| `R9-52` | CONFIRMADO (sonda)                    | P1          | 5 llamadores, no 4; el quinto muestra un toast de ÉXITO sobre una escritura fallida     |
| `R9-53` | CONFIRMADO (sonda, cadena real)       | **P1 → P2** | la pantalla solo muestra porcentajes; solo se tuercen si el respaldo y la nube difieren |
| `R9-54` | CONFIRMADO (sonda)                    | P1          | la prueba existente nunca lee el capítulo del día                                       |
| `R9-55` | CONFIRMADO (sonda)                    | **P1 → P2** | solo presentación; la barra no se desborda; falta la tarjeta de Inicio                  |
| `R9-56` | CONFIRMADO (sonda de render)          | P2          | el arreglo propuesto rompe las notas de varios versículos                               |
| `R9-57` | CONFIRMADO POR LECTURA                | P2          | lo esperable es que gane el `Modal`; sigue sin dispositivo                              |
| `R9-58` | CONFIRMADO; **remedio FALSO** (sonda) | P2          | `flushOnExit` no hace nada en RN; hace falta `AppState`                                 |
| `R9-59` | CONFIRMADO POR LECTURA                | P2          | bug = el comentario «theirs alone»; lo demás es decisión de Victor                      |
| `R9-60` | CONFIRMADO (lectura + sonda)          | P2          | se re-celebra solo el hito más alto, no todos                                           |
| `R9-61` | CONFIRMADO POR LECTURA                | P2          | cablear `resetDeck` no sería la vía de escape                                           |
| `R9-62` | CONFIRMADO (sonda)                    | P2          | peor: 15 re-celebraciones en 200 días desde el día 1                                    |
| `R9-63` | CONFIRMADO (sonda, `TZ` fijado)       | **P2 → P3** | franja de una hora durante ~6 días por cambio; «el sábado desaparece» es falso          |
| `R9-64` | CONFIRMADO (sonda)                    | P2          | segunda vía: el id de un plan borrado (`R9-146`)                                        |

**Verificación del orquestador de las dos bajadas de P1:**

- `R9-53`: `app/features/memory/insights.tsx:181-207` calcula `Math.round(b.retention * 100)` por
  banda y `recalled/total` en total. El único `total` que se pinta es `insights.summary.total`, que
  cuenta solo eventos.
- `R9-55`: `progressTrack` tiene `overflow: 'hidden'` (`app/(tabs)/plan/[id].tsx:1030-1036`).

**`R9-30` se re-confirmó en `HEAD`.** El agente 3 lo propuso como P1 nuevo, pero la entrada ya
nombra `@prep_illustrations` y `@prep_self_review`. La sonda sobre el `buildBackup()` real da
`{"prepKeysInStorage":["@prep_notes","@prep_illustrations","@prep_series"],"payloadPrepFields":["notes","series"],"fileContainsIllustration":false}`.
No se renumeró.

**El CI corre en UTC, no en `America/Mexico_City`.** El log del run `35801884549` muestra `gpg:
Signature made … UTC` y la imagen `ubuntu-24.04`, y ningún workflow fija `TZ`. Así que `INDEX.md` y
`CONTINUAR.md` decían mal la zona, aunque la conclusión se sostiene: ninguna de las dos zonas tiene
cambio de hora. Desde Git Bash, `TZ=…` no le llega al proceso de jest; hay que fijarlo desde
PowerShell.

### Salida de las sondas del punto 3

```
R9-51  devA {"getLocalOfOtherId":null,"rowsForJohn3_16":[…TELEFONO…,…TABLET…],"readerSees":"nota escrita en el TELEFONO","getNotesCount":2}
       devB {…,"readerSees":"nota escrita en la TABLET","getNotesCount":2}
R9-52  store  {"out":"RESOLVED","stored":null}
       insert {"successToastCalls":[["Ilustración añadida a tu preparación."]],"warningToastCalls":[],"backCalls":1,"savedApplication":null}
R9-53  device B: floor seeded=10 … screenRetentionTotal=20 cloudAfterWrite=20
       device C: floor seeded=20 … screenRetentionTotal=30 cloudAfterWrite=30
       identical mixed backup: true=50% shown B=50% C=50%
       subset backup:          true=50% shown B=33% C=25%
R9-54  {"autoOnJuan6":[…day 1…],"day1AfterUntick":false,"newlyCompletedOnGenesis1":[{"planId":"iam-7","day":1}],"day1AfterGenesis1":true}
R9-55  {"completedDays":[1,2,3,4,5],"effectiveDuration":2,"screenText":"5/2 · 250%","pacePercent":100}
R9-56  {"reference":["John"," ",3,":",16],"verseShown":["\"","Porque de tal manera amó Dios al mundo","\""]}
R9-58  rn  {"hadDocument":false,"calledBeforeTimer":0,"appStateListenersRegisteredByHook":0}
       web {"listeners":1,"calledOnHidden":1}
R9-60  celebrations shown after restore: ["streak:100","goal:2026-06-05"]
R9-62  RE-celebrations: day 59 streak:3 | day 62 streak:7 | … | day 194 streak:30   (15 en 200 días)
R9-63  TZ=Europe/Madrid fall-back sweep: 12/674 half-hour instants broken; broken local hours: ["23"]
       spring-forward sweep: 12/574; summarizeListening weekMs=50000 (real 50000)
       TZ=America/Mexico_City 0/672, 0/576 (zona sin cambio de hora)
R9-64  {"fromAfter":[],"toAfter":[1],"stored":{"custom-small":{"completedDays":[1],…}}}
```

Las sondas están en `_scratch/S22-sondas-agente-3/` y `_scratch/S22-sondas-agente-3b/`, con `.txt`
al final del nombre (gitignoreadas, solo en la máquina de Victor).

---

## Punto 4: las afirmaciones de `detail/S8`..`S18`, contra el mundo

| agente | archivos      | inventariadas | verificadas | sin verificar                                                 |
| ------ | ------------- | ------------- | ----------- | ------------------------------------------------------------- |
| 4      | S8, S9, S10   | 50            | 46          | 4 conteos del momento del merge (hay que ir a commits viejos) |
| 4b     | S13, S14, S15 | 63            | 63          | —                                                             |
| 4c     | S16, S17, S18 | 66            | 62          | S16-D4, S16-D5 y S17-D1 (barrido o medición pendientes)       |

**Ninguna afirmación falsa escondía un P0 ni un P1.** Las que no se sostienen se reparten así:

- **dejan un defecto real**, que ahora tiene número: `R9-144`, `R9-148`..`R9-152`;
- **son frases falsas sin defecto detrás**, que quedaron como sección «⚠️ Correcciones de la
  sesión 22» al final de cada `detail/S*` y de `A9`;
- **ya se sabían falsas**: `S10:128-129`, `S18:92-95`, `B5:45`, `R9-81` y la frase de `R9-23`.

**Lo que se sostiene contra el mundo, medido otra vez:**

- **Los datos publicados:** el manifiesto que sirve Pages es idéntico al versionado y los 4 sha256
  coinciden. Abiertos los bytes servidos, dan 31102/31098 versículos, 66 libros, 2059/2057 entradas
  y 2077 spans. El `main()` real, con salida a un temporal, saca los 4 packs byte a byte.
- **Los reverts por pieza de las compuertas de packs** (`R9-66`, `R9-72`, `R9-73`, `R9-77`, `R9-78`,
  `R9-81`, `R9-83`, `R9-84`, `R9-85`, `R9-87`, `R9-95`..`R9-98`): cada pieza deja al menos una roja.
  Los números de rojas ya no coinciden con los de los docs porque las suites crecieron. Es deriva,
  no falsedad.
- **El lado web** (`R9-13`, `R9-14`, `R9-68`, `R9-69`, `R9-71`), también pieza por pieza, en varios
  casos con el número exacto.
- **La compuerta de CI** da rojo en las 10 formas del mundo que se probaron, y el `ci.yml` real da
  verde.
- **`R9-88`, con binarios reales:** 22.12.0 no carga `node:sqlite` sin bandera y 22.13.0 sí. La
  suite entera en el piso de `engines`, 22.13.0, da 364/4299: es la primera vez que se corre ahí.
- **Los logs de CI:** el run `35051277859` confirma el rojo en Node 20 que describe S16, y el
  `35163775542` el 363/4289 de S18.
- **Lo de S8, S9 y S10:** 33 de 46 se sostienen, entre ellas el tick periódico, medido con una sonda
  que solo avanza el reloj: la cola se vacía sola a los 69 minutos.

### Notas de corrección (sin defecto detrás)

| dónde                    | afirmación                                       | lo cierto                                                 |
| ------------------------ | ------------------------------------------------ | --------------------------------------------------------- |
| `S8:22-25`               | los dos escritores pasan por `num()`             | solo el del restore; el otro, por `computeStreaks`        |
| `S8:31-33`               | «19 call sites» de `queueWrite`                  | 15 llamadas reales, entonces y hoy                        |
| `S8:36`                  | «~33 llamadores» de `ConfirmDialog`              | hoy 22                                                    |
| `S8:45-46`               | `R9-28` sigue sin prueba                         | la tiene desde `aa70be0`                                  |
| `S10:86-89`              | los dos `cursors.set` viven ahí                  | uno vive en `loadCursor`                                  |
| `S13:72-74`, `S14:32-34` | el manifiesto no cambia ni un byte               | `generated` cambia con cada corrida                       |
| `S15:223-224`            | nada detecta un provider en `(tabs)/_layout.tsx` | lo detecta desde `8a91c5c`                                |
| `S17:278-282`            | los seis `catch`                                 | hoy son 8; misma conclusión                               |
| `S17:289-290`            | «55 aserciones»                                  | 6 pruebas y 9 `expect`                                    |
| `S17:313-314`            | holgura de 1                                     | 0 para los directorios                                    |
| `S18:212-215`            | «el modelo de metro»                             | lo decide expo-router, que exige un hermano sin extensión |
| `S18:29`, `:205`         | `content-length` idénticos                       | solo sin compresión                                       |
| `A9:210-211`             | púlpito e ilustraciones ✅                       | persisten con las trampas de `R9-47` (`R9-143`)           |

Notas sin número del 4b, sin defecto:

- el error de S13-C sale pelado («unable to open database file»), sin versión ni causa, que es la
  familia de `R9-110`/`R9-112`;
- `-allow-shrink` con un solo guion se toma como ruta de salida, pero falla cerrado;
- dos pruebas web mockean el `data-loader` pelado con una factoría literal, pero la paridad cubre ese
  par.

---

## Los 10 hallazgos

| R9       | origen    | sev | estado                            | título corto                                                       |
| -------- | --------- | --- | --------------------------------- | ------------------------------------------------------------------ |
| `R9-143` | ag. 3 N2  | P1¹ | CONFIRMADO (sonda + lectura)      | el flush de ilustraciones/púlpito conserva las trampas de `R9-47`  |
| `R9-144` | ag. 4b N2 | P2  | CONFIRMADO (revert + sonda)       | el lector de exports de la paridad (`R9-67`), sin casos sintéticos |
| `R9-145` | ag. 3 N1  | P3  | CONFIRMADO; alcance PLAUSIBLE     | el `book_name` de la nube o de un respaldo no se canonicaliza      |
| `R9-146` | ag. 3b N1 | P3  | CONFIRMADO (sonda)                | el progreso de un plan propio borrado resucita al recrearlo        |
| `R9-147` | ag. 3b N2 | P3  | CONFIRMADO (expresión literal)    | `weekdayShort` en bloques de 24 h                                  |
| `R9-148` | ag. 4 N1  | P3  | CONFIRMADO (revert)               | el flush del tick periódico, sin prueba                            |
| `R9-149` | ag. 4b N1 | P3  | CONFIRMADO (revert)               | la pieza «no se pudo leer» de `R9-74`, sin prueba                  |
| `R9-150` | ag. 4b N3 | P3  | CONFIRMADO (sonda, lector real)   | `R9-69` por A → B → A                                              |
| `R9-151` | ag. 4c N1 | P3  | CONFIRMADO (sonda, `main()` real) | el `null` de `filesNotPinnedBy`, sin prueba                        |
| `R9-152` | ag. 4c N2 | P3  | CONFIRMADO (Node 20.20.2 real)    | con Node 20, `buildWebPacks` corre con cero aserciones             |

¹ El agente lo propuso como P2. El orquestador propuso P1 y Victor lo confirmó: no hace falta que
falle nada, alcanza un toque rápido que el propio código dice haber visto en vivo, y `R9-47`, con la
misma ventana, fue P0.

### `R9-143`: verificación del orquestador

- `app/features/prep/index.tsx:998-1008` (`handleOpenIllustrations`) y `:1028-1038`
  (`handleOpenPulpit`) hacen `savePrepNote(table.passageKey, section, drafts[section] ?? '', undefined, template)`
  para cada sección de la plantilla.
- `handleNoteBlur` (`:1105-1129`) corta con `if (value === undefined) return;` y escribe bajo
  `draftsPassageKeyRef.current ?? table.passageKey`.
- `setDrafts` solo aparece en `:626` (`load`), `:674` (foco) y `:1093` (change). Tras un cambio de
  pasaje por `setParams`, `table` (un `useMemo` sobre los params) ya es el nuevo en el siguiente
  render, y `drafts` sigue siendo el del pasaje anterior hasta que aterriza `getPrepNotes`.

Sonda del agente (arnés de `prepTableScreenPassageKeying.test.tsx`, que es la regresión de `R9-47`):

```
S22 PROBE N2 {"before":{"bigIdea":"La idea central del pasaje"},"after":{},"rawAfter":"{}"}
```

### Salidas de las sondas de los otros hallazgos

```
R9-144  N2-control (lector intacto): 1 failed, 76 passed   ·   N2-demo (+ una línea del lector revertida): 77 passed
R9-145  {"readerSees":null,"all":[{"id":"note_old_1","book_name":"Juan",…},{"book_name":"John","note":"nota nueva desde el lector"}]}
R9-146  {"completedAtBefore":true,"entryStillStoredAfterDelete":true,"afterRecreate":{"completedDays":[1,2],"completedAt":true}}
R9-147  24h labels 0:sab 1:lun 2:mar 3:mie 4:jue 5:vie 6:sab  ·  calendar 0:sab 1:dom 2:lun …
R9-148  `// void this.flush();` en el setInterval → 364 suites reales verdes; la única roja, la sonda
R9-149  `if (error.code === 'ENOENT') return null;` → `return null;` → buildWebPacks 63/63 verde
R9-150  back at A: [{"offsetsFor":"RVR1960","textFrom":"WEB"},{"offsetsFor":"RVR1960","textFrom":"RVR1960"}]
R9-151  [!previous -> []]        PROBE sin-manifiesto: IS coherent | exists(manifest)=false   (63/63 verde)
        [pinned.size===0 -> []]  PROBE sin-pines:      IS coherent                            (63/63 verde)
R9-152  Node 20.20.2: 63 failed, 63 total · con el beforeAll envuelto: 26 failed, 37 passed · Node 24: 63/63
```

Las sondas están en `_scratch/S22-sondas-agente-{3,3b,4,4b,4c}/`, con `.txt` al final. Los binarios
de Node del 4c (20.20.2, 22.12.0 y 22.13.0, unos 300 MB) quedaron en `%TEMP%/s22_4c/node`, fuera del
repo.

---

## Lo que queda

- **Arreglar:** `R9-124` (antes, medir el SDK nativo en Modo C, en el emulador, con el OK de
  Victor), `R9-125` + `R9-130` (un solo arreglo, con una prueba por las tres ramas), `R9-143`, y
  los P0 viejos `R9-36`, `R9-38` y `R9-39`.
- **Revisar:** el diff de la 20 (`25128b3..ca2cd71`), que es la opción (a).
- **Terminar `A12`.**
- **Decisiones de Victor:** `R9-59` (qué significa «local» en un teléfono compartido) y el efecto
  de `R9-146` (re-importar un plan trae su progreso viejo).
- **Sin verificar del punto 4:** 4 conteos del momento del merge (S9/S10), S16-D4, S16-D5 y S17-D1.

---

## Lecciones de la sesión

- **Cinco agentes Opus a la vez agotaron la sesión de uso**, y se cortaron los cinco en el mismo
  minuto. Salvó el trabajo el informe incremental en disco. El worktree de uno se borró solo al
  cortarse, sus sondas con él, y lo único que quedó fue lo que había escrito. **El informe en disco
  no es opcional, y la sonda que sostiene un P0/P1 tiene que copiarse a `_scratch` en cuanto se
  corre, no al final.**
- **Un agente puede re-descubrir un hallazgo ya numerado aunque tenga la lista de ya reportados**
  (el «P1 nuevo» del agente 3 era `R9-30`). La lista trae títulos cortos, y `R9-30` no nombra el
  Banco de ilustraciones en su título. El orquestador tiene que buscar por la CLAVE (`grep
@prep_illustrations BUGS.md`), no por el título.
- **Un remedio escrito en el ledger es una hipótesis, también en un P2** (`R9-58`). «Activar
  `flushOnExit`» sonaba exacto y en el teléfono no hace nada. Es la lección de la sesión 20 (la
  propuesta de `R9-104`) otra vez.
- **Una afirmación sobre dónde corre algo se comprueba en el log** («el CI corre en
  `America/Mexico_City`» era falso). La conclusión sobrevivió por suerte: UTC tampoco tiene cambio
  de hora.
