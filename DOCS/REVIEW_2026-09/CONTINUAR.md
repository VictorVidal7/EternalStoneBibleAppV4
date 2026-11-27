# ▶️ Continuar la revisión profunda 2026-09

> **Qué es este archivo (desde la sesión 143, 2026-11-12).** Las reglas, los hechos y las decisiones que siguen
> rigiendo, y por dónde seguir. No lleva el estado de git ni la historia de las sesiones: eso está en git, en
> `detail/` y en `historial/`. **Qué queda abierto se pregunta con un comando, no se lee en prosa:**
> `node DOCS/REVIEW_2026-09/tools/validar-estado.cjs.txt` (el conteo por severidad y la lista de abiertos, de
> `ESTADO.tsv`). La frontera es la fase de ARREGLOS, con Fable 5.2 como principal (§7), en el orden de la §4.

## 1. Qué leer (arranque liviano)

Leé solo esto, en este orden:

1. El mensaje de la sesión (`_scratch/S<N>-PROMPT*.md`): manda sobre este archivo.
2. El estado generado: el validador de arriba (con `--corto`, solo el conteo).
3. El detalle de la sesión anterior (`detail/S<N-1>-*.md`) y las entradas de `BUGS.md` que la sesión va a tocar
   (`grep -n` del id y un rango corto con `sed -n`).
4. `RECETAS.md` (no más de 3 KB): la línea de comandos, el revert por pieza, el checkpoint, el CI y el emulador.
5. De este archivo, la §4 y la §5.

No leas enteros `BUGS.md`, `REGLAS.md`, `historial/` ni las memorias largas
(`feedback_essb-regression-test-must-fail-first`, `reference_essb-device-testing-and-automation`,
`project_essb-master-backlog`): `grep` y rangos cortos.

Dónde está cada cosa:

- `ESTADO.tsv` y `tools/`: el estado de cada hallazgo, su generador, su validador y los veredictos de la 142.
- `BUGS.md`: las entradas. Es la fuente: la marca `✅ ARREGLADO` va en la entrada, y el TSV se regenera.
- `detail/`: un detalle por fila o por sesión.
- `INDEX.md`: el ledger de las filas (Modos A a D).
- `REGLAS.md`: las 295 reglas completas (la §5 de antes). `RECETAS.md`: lo mecánico.
- `historial/`: lo que la 143 sacó de este archivo y de `INDEX.md`, movido tal cual. No rige: es registro.
- `REVIEW_PROMPT.md`: el charter.

## 2. Git: cómo se comprueba el estado (no se escribe aquí)

- El estado de git no se escribe en los docs: se pregunta. `git fetch`, `git log -1 origin/main`,
  `git status -sb`, `git worktree list`, `git branch --list "docs/*" "fix/*"`.
- Una rama por sesión (`docs/review-sN-*` o `fix/sN-*`), creada en el principal. Los docs se editan en un worktree
  aparte y el script de checkpoint lleva el parche (`RECETAS.md`).
- **No se mergea ni se pushea sin el OK de Victor**, pedido en esa sesión. Con el OK: fast-forward, push, el CI
  verificado en el log, y la rama borrada tras `git cherry`.
- `npm run validate` con `NODE_ENV=development`, en primer plano, sin worktrees ni Metro vivos. La referencia al
  cierre de la 142: 377 suites, 4709 pruebas, 70 advertencias de eslint y ningún error.

## 3. Dónde va la revisión

**138 filas** en el ledger: Modo A 46 · Modo B 11 · Modo C 71 · Modo D 10.
**Cerradas: 55** (todo el Modo B P0 + las 12 filas del Modo A P0, `A12` en la 114; 5 del Modo C P0 en la
115: `C6`, `C15`, `C16`, `C39`, `C56`; `A13` en la 116; `A14`, `A15` y `A16` en la 117; `A17` y `A18` en la
118; `A19` en la 119; `A20` y `A21` en la 120; `A22` y `A23` en la 121; `A24` y `A25` en la 122; `A26` y `A27`
en la 123; `A28` y `A29` en la 124; `A30` y `A31` en la 125; `A33` en la 126; `A32` y `A34` en la 127; `A35` y
`A36` en la 128; `A37` y `A38` en la 129; `A39` y `A40` en la 130; `A41` y `A42` en la 131; `A43` y `A44` en la 134;
`A45` y `A46` en la 135; `B6` a `B10` en la 136: **62**, contadas en `INDEX.md` en la 136 — el Modo A y el Modo B,
enteros; `C1a` y `C26b` en la 137; `C27a`, `C42a` y `C43a` en la 138: **67**, contadas en `INDEX.md` en la 138).
**Pendientes: 71** (61 del Modo C, entre ellas `C20a` EN CURSO y `C26a`, `C54` y `C55` «sin medir», que esperan una
cuenta de Google de PRUEBA, y las 10 del Modo D). Esto cuenta filas REVISADAS; los arreglos no mueven ninguna fila, porque
arreglar no es revisar — mueven el conteo de P0 ABIERTOS de la sección P0 de `BUGS.md`, que
tras la sesión 21 son **5** (`R9-36`, `R9-38`, `R9-39`, `R9-124`, `R9-125`). **No re-derives ese número contando
arreglos** — ver la nota al principio de esa sección.

| Sesión | Qué se hizo                                                   | Commit              |
| ------ | ------------------------------------------------------------- | ------------------- |
| 1      | Solo el inventario (charter §5)                               | `18a3ffa`           |
| 2      | Modo B P0 completo: `B1`, `B1b`, `B2`–`B5`                    | `2f32aa9`           |
| 2      | Este prompt + correcciones al charter                         | `8b64c11`           |
| 2      | `R9-7` resuelto: `functions/` documentada                     | `af64ce1`           |
| 3      | `A1` (premium/RevenueCat) — `R9-9`, `R9-10`                   | `299a76c`           |
| 3      | `A2`, `A3`, `A5`, `A6`, `A7` — `R9-11`..`R9-32`               | `b5a9afa`           |
| 3      | Cierre de la sesión 3 + las 2 preguntas abiertas              | `6ac10e3`/`894deb5` |
| 4      | `A4` (`SyncEngine`) — se cortó a mitad del checkpoint         | `f791749`           |
| 5      | `A4` verificada + campo `R9-40`..`R9-43`                      | `f791749`           |
| 6      | `A8`–`A11` por fan-out — `R9-44`..`R9-64`; `A12` a medias     | `f791749`           |
| 6      | Re-verificados a mano los 6 P0 nuevos                         | `c184a1c`/`9939e76` |
| 7      | **ARREGLOS**: 7 P0 de pérdida de datos                        | `7f8e666`           |
| 8      | Revisión del diff de la 7 + merge y push a `main`             | `8fe24f1`           |
| 8      | **ARREGLOS**: `R9-46` + mezcla entre cuentas                  | `b3d73e1`→`e75eca3` |
| 9      | Revisión del diff de la 8: **2 defectos reales** + merge      | `3e780c6`→`d800a24` |
| 9      | **ARREGLOS**: `R9-33`, `R9-34`, `R9-35`                       | `0a4f0fc`→`c41c9cb` |
| 10     | Revisión del diff de la 9: **1 prueba ciega** + merge         | `2bfa126`→`daad3a9` |
| 10     | **ARREGLOS**: `R9-9` + `R9-10`, dinero; merge + push          | `bb3b25b`→`f9e184a` |
| 11     | **ARREGLOS**: `R9-11` + `R9-65` + la prueba de `R9-28`        | `261c053`→`952d456` |
| 12     | **ARREGLOS**: `R9-13` + `R9-15` + `R9-14` (bloque web)        | mergeado a `main`   |
| 13     | Revisión del diff de la 12: **6 defectos** + arreglos         | mergeado a `main`   |
| 14     | Revisión del diff de la 13: **5 defectos** + arreglos         | mergeado a `main`   |
| 15     | Revisión del diff de la 14: **5 defectos** + arreglos         | mergeado a `main`   |
| 16     | Revisión del diff de la 15: **5 defectos** + `main` en rojo   | mergeado a `main`   |
| 17     | Revisión del diff de la 16: **10 defectos** + arreglos        | mergeado a `main`   |
| 18     | Revisión del diff de la 17: **5 defectos** + arreglos         | mergeado a `main`   |
| 19     | Revisión del diff de la 18, y de los de la 10 y 11 (Opus 5.5) | `ac9c7fd`           |
| 20     | **ARREGLOS**: `R9-102`..`R9-105` (Opus 5.5)                   | `8ea93b6`→`00f69c4` |
| 21     | Doble check, puntos 1 y 2: `R9-124`..`R9-142` (Opus 5.5)      | `f294333`           |
| 22     | Doble check, puntos 3 y 4: `R9-143`..`R9-152` (Opus 5.5)      | rama de la 21       |

**Balance por modo.** El Modo B P0 salió **limpio**: 0 vulnerabilidades alcanzables, 0
secretos filtrados jamás (5558/5558 blobs), 0 paths abiertos en Firestore. Sus 8 hallazgos
son endurecimiento, no bugs.

**El Modo A P0 salió lo contrario: 52 hallazgos, 21 de ellos P0 reales.** Los más graves,
por orden de daño irreversible:

- **Pérdida de datos al respaldar/restaurar:** `R9-49` (un fallo transitorio de SQLite
  produce un respaldo vacío **sin marca**, y al importarlo **borra la racha y los ledgers**;
  canal distinto y peor que `R9-27`), `R9-27`/`R9-28`, `R9-53`.
- **Pérdida de prosa escrita a mano:** `R9-47` (dos toques al stepper de la Mesa **borran o
  pisan un sermón**), `R9-44` (recolorear un subrayado **borra su nota**), `R9-46` (una copia
  remota vieja pisa la nota nueva en cada arranque en frío).
- **Fuga o mezcla entre cuentas:** `R9-22`/`R9-23`, `R9-48` (el historial de A se escribe
  dentro de la cuenta de B y **sobrescribe** su agregado).
- **Sync que descarta o se para en silencio:** `R9-33`, `R9-35`, `R9-45` (una lápida que no
  se limpia deja un subrayado **borrado para siempre** en todo otro dispositivo).
- **Dinero:** `R9-9` (premium que sobrevive al reembolso).
- **Web:** `R9-13` (el lector crashea — **no llegó a estar en producción**; bloqueaba el
  próximo deploy web). **✅ Cerrado en la sesión 12 y verificado en un navegador de verdad,
  así que el deploy web ya no está bloqueado.**

**Los cuatro ejes donde están, y donde conviene seguir buscando.** Las tres compuertas
verdes (`tsc`, jest, CI) comparten puntos ciegos:

1. **La resolución de módulos por plataforma** — `tsc` y jest resuelven siempre al archivo
   nativo.
2. **La dirección inversa** de cada flujo — quitar acceso, restaurar, borrar, descompletar,
   cambiar de cuenta.
3. **Las listas de strings enumeradas a mano**, que se quedan atrás al añadir un miembro.
4. **El horario de verano** (nuevo en la sesión 6) — ninguna prueba fija `TZ` y la máquina
   está en una zona sin DST, así que la suite **no puede** ver esa clase de bug.

Y un quinto patrón, más fino, que salió de `A8`: **`{merge:true}` hace que un campo opcional
sea imposible de desasignar por sync**, así que cualquier omisión local se convierte en
divergencia permanente con la nube (`R9-44`, `R9-45`, `R9-50` son la misma raíz).

## 4. Por dónde seguir

**Desde el 2026-11-26 rige el método rápido de la §7** (re-triaje de los P2, carriles disjuntos, olas de agentes).
**La 189 hizo el re-triaje** (`detail/S189-retriaje-p2.md`): de 70 P2 leídos, ninguno ya arreglado, 24 bajadas
a P3 (aprobadas por Victor y aplicadas: P1 + P2 = 50), 6 que esperan a Victor y 40 P2 reales en 12 carriles y
4 olas. **La 190 hizo la ola 1** (`detail/S190-ola1.md`, rama `fix/s190-ola1`): carriles Toasts, Sync, y Mesa y
búsqueda, más Sonnet en `R9-601`. 6 P2 cerrados (P1 + P2 = 43); `R9-430` y `R9-474` EN PARTE por sus familias
(pregunta en la §8); 9 P3 nuevos (`R9-641` a `R9-649`); lo vivo, en `detail/PENDIENTES-EN-VIVO.md`. **Lo siguiente: la
ola 2** (`_scratch/S191-PROMPT.md`): carriles 4, 5 y 6. Lo de abajo es el registro de antes.

**Qué queda:** `node DOCS/REVIEW_2026-09/tools/validar-estado.cjs.txt`. Al cierre de la 142: 274 abiertos de 573
(ningún P0, 20 P1, 92 P2, 161 P3 y el aviso `R9-1`), 2 sin verificar que piden emulador (`R9-177`, `R9-240`), 285
arreglados y 12 aceptados. De los abiertos, 113 son de `R9-1`..`R9-409` (los 20 P1); la lista por severidad y área
está en `detail/S142-conciliacion.md` §3.

**Lo siguiente: la fase de ARREGLOS**, una tanda por sesión, en un chat nuevo, en la terminal, con Fable 5.2 como
principal y sin agentes. El mensaje de la primera está en `_scratch/S144-PROMPT-arreglos.md`. Cada tanda: la entrada
leída entera, la reproducción con el productor real, la prueba vista fallar sin el arreglo, la matriz de vecinos y
el `grep` de quién consume el valor (§5). Al cerrar un hallazgo: `✅ ARREGLADO` con el sha en su entrada, y el TSV
regenerado.

**El orden de las tandas (decidido por Claude el 2026-11-12, por delegación de Victor: «mis decisiones las dejo a
tu mejor consideración»; Victor puede cambiarlo cuando quiera).** El criterio: primero los P1, que son todos
viejos; entre ellos, el dinero, después lo que pierde datos en silencio, después lo que bloquea el lanzamiento, y
al final lo visible y lo barato. Los P2 viejos entran en la tanda de su área; no abren tandas propias.

- **Tanda V1 — dinero (4 P1).** `R9-16` (`restore()` confunde «sin compra» con «falló la red»), `R9-17`
  (`purchaseUnlock` da `success` sin mirar el entitlement), `R9-18` (el pago pendiente, OXXO o SPEI, se muestra
  como fallo) y `R9-19` (`DonationSheet` sin `alreadyOwned`). Con ellos, del mismo servicio: `R9-135` (P2). Va
  primero porque le pasa a quien paga, y porque es un solo archivo de servicio y dos hojas. Su revisión de diff va
  aparte. `R9-119` no entra: de quién es el premium sigue en la §8; solo se corrige el docstring que miente.
  **Hecha en la sesión 144** (`detail/S144-arreglos-dinero.md`), sin medir en vivo; su revisión es la 145.
  `R9-135` reproduce y no entró: su arreglo cambia de quién es el premium.
- **Tanda V1b — de quién es el premium (2 P2, decididos en la §7).** `R9-119` (el anónimo que nace tras cerrar
  sesión ya no se enlaza a RevenueCat) y `R9-135` (el enlace de una cuenta que llegó antes de `initialize()`, o
  cuyo `logIn` falló, se reintenta). Va en la sesión 146, antes de la V2, junto con lo que deje la revisión de la
  145: es el mismo servicio, y así los dos diffs de dinero se cierran seguidos. Con el `AuthProvider` y el
  servicio reales; la matriz: cerrar sesión con y sin premium, otra cuenta en el mismo aparato, el canje de un
  código siendo anónimo, el arranque en frío, y «Eliminar cuenta» (se mide; no está decidido).
  **Hecha en la sesión 146** (`detail/S146-arreglos-premium.md`), sin medir en vivo; su revisión es la 147, y la V2
  pasa a la 148. `R9-119`, arreglado. **`R9-135`, EN PARTE, y sigue abierto:** entró el reintento de un `logIn` que
  falla al cambiar de cuenta; la raíz (enlazar al terminar `initialize()`) y el enlace tras pasar de anónimo a
  Google NO entraron, y esperan la medición con la cuenta de Google de prueba (§7). Con ella entraron `R9-574`,
  `R9-579` y `R9-578`; `R9-575`, `R9-576` y `R9-577` (P3) siguen abiertos. «Eliminar cuenta» quedó medido y pasa
  a la tanda V4.
- **Lo que dejó la revisión de la 147: `R9-580` (P2) va PRIMERO en la 148, antes de la V2.** Es una regresión de
  `R9-119`: la compra de una cuenta nueva nacida del anónimo tras un cierre de sesión queda en la cuenta que
  salió. Su arreglo es la segunda pieza pendiente de `R9-135`, acotada (enlazar tras el `linkWithCredential` solo
  si RevenueCat no está en un `$RCAnonymousID`): da igual con los dos supuestos y no espera la cuenta de prueba.
  Con él, del mismo archivo: `R9-581`, `R9-582`, `R9-583` y las pruebas de `R9-584` (P3).
  `detail/S147-revision-del-diff-s146.md`.
  **Hecha en la sesión 148** (`detail/S148-arreglos-r9-580.md`), sin medir en vivo: `R9-580`, `R9-581` y `R9-583`
  arreglados. **`R9-582` y `R9-584` siguen abiertos:** la 149 revisa este diff, y después van ellos, antes de la V2.
  **Revisada en la sesión 149** (`detail/S149-revision-del-diff-s148.md`): los tres arreglos se sostienen; tres
  hallazgos nuevos (P3): `R9-589` y `R9-590` van con `R9-582`, y `R9-591` con `R9-584`.
  **Hecha en la sesión 150** (`detail/S150-arreglos-r9-582.md`), sin medir en vivo: `R9-582`, `R9-589` y `R9-590`
  arreglados. **La 151 revisa este diff; después van `R9-584` con `R9-591` (las pruebas) y la V2.**
  **Revisada en la sesión 151** (`detail/S151-revision-del-diff-s150.md`): los tres arreglos se sostienen en lo que
  fijan sus pruebas; dos hallazgos nuevos (P3): `R9-592` (el canje con la sesión cambiando, que reabre las filas de
  `R9-582`) y `R9-593` (la compra con el `logIn` en vuelo). **La 152: `R9-584` con `R9-591` (las pruebas) y, si cabe,
  `R9-592` (el mismo archivo); después, la V2.** `R9-593` va con la pieza abierta de `R9-135`.
  **Hecha en la sesión 152** (`detail/S152-arreglos-pruebas.md`), con 6 agentes, sin medir en vivo: `R9-584`,
  `R9-591` y `R9-592` arreglados; un hallazgo nuevo, `R9-594` (P3). **La 153 revisa este diff; después, la V2.**
  **Revisada en la sesión 153** (`detail/S153-revision-del-diff-s152.md`), sin agentes: se sostiene; ningún hallazgo
  nuevo; dos frases de `R9-594` corregidas. **La 154: la V2.**
- **Tanda V2 — sync que pierde en silencio (4 P1).** `R9-128` (un apply remoto que falla y el cursor avanza), con
  `R9-132` (P2, la misma forma en subrayados); `R9-37` (el listener huérfano); `R9-127` (el `skipNextBulkPush` sin
  uid); y `R9-126` (el push con reloj viejo), que es de diseño: se mide y se propone antes de escribirlo, y si no
  cabe, lleva su propia sesión.
  **Hecha EN PARTE en la sesión 154** (`detail/S154-arreglos-v2.md`), con 8 agentes, sin medir en vivo: `R9-128` y
  `R9-132` (`5296512b`) y `R9-37` (`253f0a9d`) arreglados, en `fix/s154-v2`. **`R9-127` sigue abierto:** el diff del
  agente 6 no entró (quita el skip de `deleteAccount`, la única red del camino de borrado). **`R9-126`, medido y
  propuesto** (opciones C, E, B, R y T). **La 155: `R9-127`** con el diseño del §5 del detalle (armar el skip solo si
  la limpieza y el borrado salieron bien, y que un «Migrar» explícito suelte el pendiente; antes, medir los dos
  casos sin pregunta con HEAD y con el diff del agente 6), **y la revisión del diff de la 154.** Después, `R9-126`
  opción C en su propia sesión (y E detrás); la B espera la decisión de la §8; la R va con la V4 (`R9-4`).
  **Hecha en la sesión 155** (`detail/S155-revision-y-r9-127.md`), sin agentes, sin medir en vivo: la 154,
  revisada (se sostiene); `R9-127` arreglado (`9757b8dc`). Dos hallazgos nuevos (P3): `R9-595` (un `apply*` que
  falla siempre clava el piso) y `R9-596` (el upsert de `memoryCards` resuelve antes del disco). **La V2 queda
  completa salvo `R9-126`.** **La 156: `R9-126` opción C, sola** (Victor, 2026-11-17). La revisión del diff de la
  155 va después.
  **Hecha en la sesión 156** (`detail/S156-r9-126-opcion-c.md`), con 5 agentes, sin medir en vivo: la opción C
  (`46ad0e93`, en `fix/s156-r9-126`), con la guarda de la cola sin leer y ampliada a los borrados. `R9-126` sigue
  abierto por E, B y R. **La 157: la revisión de los diffs de la 155 y la 156.** Después, la E.
  **Hecha en la sesión 157** (`detail/S157-revision-155-156.md`), con 5 agentes, sin medir en vivo: los dos
  diffs se sostienen sobre lo apilado (16 piezas y la matriz de vecinos, otra vez); C no rompe el push en vuelo ni
  los conflictos. Un hallazgo nuevo, anterior a los dos: `R9-597` (P3), con la tanda siguiente. **La 158: la E.**
  **Hecha en la sesión 158** (`detail/S158-r9-126-opcion-e.md`), con 3 agentes, sin medir en vivo: la E
  (`2e9b042b`, en `fix/s158-r9-126-e`), con el filtro de relojes y el envoltorio de `firestore.ts`. `R9-126` sigue
  abierto por B (§8), R (con la V4) y el push en vuelo. **La 159: la revisión del diff de la 158.** Después, la V3.
  **Hecha en la sesión 159** (`detail/S159-revision-del-diff-s158.md`), con 3 agentes, sin medir en vivo: la E se
  sostiene (piezas y matriz iguales; el envoltorio, medido con RNFB real). Dos nuevos (P3): `R9-598` y `R9-599`,
  con la próxima tanda de sync. **La 160: la V3.**
  **Hecha en parte en la 160** (`detail/S160-v3-arreglos.md`), sin agentes, sin medir en vivo: `R9-129` y `R9-131`
  (`501bb70a`), `R9-60` y `R9-117` (`90f67a46`), en `fix/s160-v3`. La raíz de `R9-30` tiene guarda (47 claves en
  `PENDING_R9_30`). **La 161: `R9-52` y después `R9-30`**, con el diseño del detalle §5 (de `R9-30`, la tanda 1).
  **Hecha en parte en la 161** (`detail/S161-v3-arreglos.md`), con 5 agentes, sin medir en vivo: `R9-52` en parte
  (las notas y la autoevaluación; quedan los `save*` de los bancos) y la tanda 1 de `R9-30` (13 claves), en
  `fix/s161-v3`. Nuevos: `R9-600` (P2) y `R9-601` (P3). **La 162: la tanda 2 de `R9-30` (la Mesa:
  `@prep_illustrations`, `@prep_self_review`, `@sermon_notes`) y los bancos de `R9-52`, con `R9-600`.**
  **Hecha en la 162** salvo `R9-30` (`detail/S162-v3-arreglos.md`), con 3 agentes, sin medir en vivo:
  `R9-52` y `R9-600`, cerrados; la tanda 2 de `R9-30` (ilustraciones y autoevaluación), en `fix/s162-v3`.
  `@sermon_notes` no es de la Mesa: va con las claves que no son de la Mesa. **La 163: la tanda 3 de `R9-30`
  (`@custom_plans`, `@together_groups`) y medir los borradores de la Mesa ante una restauración (detalle §5).**
  **Hecha en la 163** (`detail/S163-v3-arreglos.md`), sin agentes, sin medir en vivo: la tanda 3 de `R9-30` y
  `R9-602` (la Mesa relee con la señal), en `fix/s163-v3`. **La 164: la tanda 4 de `R9-30`, las claves de
  contenido que no son preferencias (`@sermon_notes`, `@devotional_draft`, audio, compartir, metas,
  `lastReadPosition`); detalle §6.**
  **Hecha en la 164** (`detail/S164-v3-arreglos.md`), con 3 agentes, sin medir en vivo: las 9 claves, en
  `fix/s164-v3`; `@sermon_notes` pasa tal cual y `lastReadPosition` va a `EXCLUDED`. **La 165: las 21
  preferencias de `PENDING_R9_30`, con la recomendación de `detail/S160-v3-arreglos.md` §5, y la promesa de
  `translations.ts:4176` al cerrar `R9-30`; detalle S164 §6.**
  **Hecha en la 165** (`detail/S165-v3-arreglos.md`), con 3 agentes, sin medir en vivo: las 21 preferencias,
  en `fix/s165-v3`; `R9-30` cerrado y la V3 completa. **La 166: la revisión del diff de la 165 (respaldo,
  audio y arranque: con emulador, por la regla de riesgo de abajo); después, la V4.**
  **Hecha en la 166: la revisión** (`detail/S166-revision-v3.md`), con 3 agentes y con emulador: los arreglos se
  sostienen salvo lo anotado; importar cambia idioma, versión y contraste en vivo sin reiniciar. Nuevos: `R9-603`,
  `R9-604` y `R9-605` (P2), y de `R9-606` a `R9-611` (P3); sumas a `R9-410` y `R9-439`. Con P2 nuevos, la regla
  «Según el riesgo» pide arreglos. **La 167: los arreglos de la revisión de la 166 (los 3 P2 y los P3 del mismo
  archivo), y después la V4.**
  **Hecha en la 167** (`detail/S167-arreglos-revision-166.md`), con 3 agentes, sin medir en vivo: de `R9-603` a
  `R9-611` cerrados, en `fix/s167`; nuevo `R9-612` (P3). **La 168: la revisión del diff de la 167 (audio y
  arranque: con emulador, por la regla «Según el riesgo»); después, la V4** (Victor, 2026-11-18).
  **Hecha en la 168** (`detail/S168-revision-del-diff-s167.md`), con 3 agentes y con emulador: los arreglos se
  sostienen; nuevos `R9-613` y `R9-614` (P3); suma a `R9-558`. Sin P2 nuevos: **la 169 es la V4.**
  **Hecha en la 169** (`detail/S169-tanda-v4.md`), con 3 agentes, sin nube ni emulador: `R9-25`, `R9-29` y
  `R9-24` cerrados en `fix/s169-v4`; nuevo `R9-615` (P3). `R9-136` y `R9-4`: propuesta en el §4 del detalle, sin
  aplicar. **La 170: la revisión del diff de la 169 (borrado de la cuenta y cola del sync).**
  **Hecha en la 170** (`detail/S170-revision-del-diff-s169.md`), con 3 agentes y con emulador: los arreglos se
  sostienen; nuevos de `R9-616` a `R9-619` (P3); suma a `R9-25`. Sin P2 nuevos: **la 171 es la V5.**
  **Hecha en la 171** (`detail/S171-tanda-v5.md`), sin agentes ni emulador: `R9-41`, `R9-40`, `R9-54`, `R9-55` y
  `R9-64` cerrados en `fix/s171-v5`; nuevo `R9-620` (P2, el resto de `R9-40`). `R9-51`: el diseño de la migración en el
  §3 del detalle, sin código. **La 172: la revisión del diff de la 171 (el tema y los planes, con emulador).**
  **Hecha en la 172** (`detail/S172-revision-del-diff-s171.md`; cortada, la cerró la 172b), sin agentes y con
  emulador: los arreglos se sostienen; nuevos `R9-621` y `R9-622` (P3) y `R9-623` (P2: un lector montado re-tilda un
  día destildado, por `R9-465`); suma a `R9-465`. Con un P2 nuevo, la regla «Según el riesgo» pide arreglos: **la 173
  arregla `R9-623` con `R9-465`** (y `R9-622` si cabe); **`R9-51`, la 174.**
  **Hecha en la 173** (`detail/S173-arreglos-revision-s172.md`; cortada, la cerró la 173b), sin agentes y con
  emulador: `R9-623` y `R9-465` cerrados (`41a2a356`: el `value` de Toast estable y el temporizador del lector con
  un ref) y `R9-622` decidido (`2b126e75`: queda el sello más viejo). Tocó el lector y el Toast, no datos guardados:
  **la 174 es `R9-51` con el diseño del §3 de la 171** (OK de Victor).
  **Hecha en la 174** (`detail/S174-r9-51-notas.md`; cortada, la cerró la 174b), sin agentes y con emulador:
  `R9-51` cerrado en `fix/s174` (`29c956ac`): el id de una nota es el versículo, un plegado que no pierde texto (al
  arrancar, en el adaptador y en el import) y un candado de notas. Toca datos guardados y el sync: **la 175: la
  revisión del diff de la 174, con emulador.**
  **Hecha en la 175** (`detail/S175-revision-del-diff-s174.md`), sin agentes y con emulador: el arreglo se sostiene;
  nuevos de `R9-624` a `R9-627` (P3). Sin P2 nuevos, pero el plegado corre una vez por aparato y `R9-625` borra texto
  que después no vuelve: **la 176 arregla `R9-625` y `R9-624`** (y `R9-627` si cabe; `R9-626`, arreglar o aceptar),
  antes de que un build con `29c956ac` llegue a un aparato con notas reales. **Después, la V6.**
  **Hecha en la 176** (`detail/S176-arreglos-revision-s175.md`), en `fix/s176` (`4d5e4777`), con emulador: `R9-625`,
  `R9-624` y `R9-627` arreglados; `R9-626` aceptado. **Revisada en la 177**
  (`detail/S177-revision-del-diff-s176.md`), con emulador: el diff se sostiene, sin hallazgos nuevos. **La 178: la
  V6**, tras el merge de `fix/s176`, `docs/review-s176` y `docs/review-s177` con el OK de Victor.
- **Tanda V3 — respaldo y la Mesa (4 P1).** `R9-129` (`getAllReviewEvents` se traga su error) con su prueba,
  `R9-131`; `R9-30` (el respaldo omite contenido del usuario), con `R9-60` y `R9-117` (P2, la misma raíz: listas
  enumeradas a mano); y `R9-52` (la Mesa reporta como éxito una escritura que falló).
- **Tanda V4 — cuenta y cuota, antes de lanzar (3 P1).** `R9-25` (`deleteAllCloudData` sin lotes), `R9-29` (el
  import sube un `reviewEvents` por evento) y `R9-24`: del diálogo se corrige el texto, para que no prometa un
  borrado que no existe; agregar la acción de borrar lo local queda en la §8. `R9-136` (la cuota compartida, App
  Check y las reglas) y `R9-4` (versionar las reglas) tocan la consola de Firebase: piden el OK de Victor aparte.
  **Hecha en la 169:** los tres P1 cerrados; la propuesta de `R9-136` y `R9-4`, paso por paso, en
  `detail/S169-tanda-v4.md` §4, espera el OK de Victor.
- **Tanda V5 — lector y planes (4 P1).** `R9-41` (Crepúsculo: derivar la oscuridad de la paleta), `R9-40` (el
  timeout del catálogo), `R9-54` (descompletar un día), con `R9-55` y `R9-64` (P2, el mismo archivo), y `R9-51`
  (dos notas para un versículo), que pide diseñar la migración antes de escribirla.
  **Hecha en la 171:** cerrados los P1 `R9-41`, `R9-40` y `R9-54`, y los P2 `R9-55` y `R9-64`. `R9-51` queda abierto con
  su diseño (`detail/S171-tanda-v5.md` §3): lo escribe una sesión propia, con revisión de diff con emulador detrás.
- **Tanda V6 — CI y repo (1 P1, barata).** `R9-107` (leer el workflow con un parser YAML), con `R9-2` (el
  `.gitignore` de un repo público), `R9-5` y `R9-6`. `R9-118` (Codecov) sigue en la §8.
  **Hecha en la 178** (`detail/S178-tanda-v6.md`), sin agentes ni emulador, en `fix/s178` (`324d98a8` y
  `36d63241`): los cuatro cerrados. `R9-107`: el escáner lee el workflow con `yaml` (devDependency directa nueva, ya
  instalada). `R9-2`: `.env*`, sin tocar nada de Victor. `R9-5`: por el renombre, porque `npm audit` sale 1 hoy en
  todos los niveles (62 avisos; la remediación es `R9-1`, sesión propia). `R9-6`: `contents: read` y Codecov en el
  sha de `@v4`. **La 179: la revisión del diff de la 178**, tras el merge con el OK de Victor; el CI real se mide
  después del merge.
  **Revisada en la 179** (`detail/S179-revision-del-diff-s178.md`), sin agentes ni emulador, sobre main
  (`eb0945a6`, mergeado y pusheado): se sostiene. El CI real está verde (el job nuevo con su nombre, `Contents: read`
  y Codecov desde el sha), y cada pieza revertida hace caer su prueba. Nuevos, todos P3, vecinos de sus compuertas:
  de `R9-628` a `R9-632` (dos son anteriores a la 178). Hay una suma a `R9-118`: el sha no fija el CLI `latest` de
  Codecov. Como son P3 de CI y pruebas, no abren tanda. **La V6 queda completa. La 180: los cuatro P3 de la 141
  (`R9-570` a `R9-573`), antes de la tanda 2.** Hecha: ver «Antes de la tanda 2», abajo.
- **Después, las tandas 2 a 9 de abajo** (los P2 de `R9-410` en adelante), con los cuatro P3 de la 141 delante de la
  tanda 2. Los P2 viejos que quedan entran así: `R9-31`, `R9-32` y `R9-53`, con la tanda 2; `R9-163`, `R9-164`,
  `R9-12`, `R9-58` y `R9-167`, con la 3; `R9-63`, con la 4; `R9-56`, con la 5; `R9-42`, `R9-43` y `R9-57`, con la
  9; `R9-61` y `R9-62` (memoria), tras la 7; `R9-173` (el lector web: decidido en la sesión 25 y sin hacer), con
  la 8. `R9-20` y `R9-21` (el endpoint de canje) piden redesplegar en Vercel:
  con el OK de Victor. `R9-26`, `R9-134` y `R9-158`, con la V4 si caben; `R9-158` espera decisión (§8).
- **Los P2 y P3 de pruebas, de CI y de build** (`R9-114`, `R9-116`, `R9-137`..`R9-141`, `R9-144`, `R9-110`..`R9-113`,
  `R9-3`, `R9-8` y los P3 de esas áreas) no abren tanda: se pagan al tocar el archivo. Los del ciclo de las pruebas
  de la Mesa (`R9-296`..`R9-347`) no se reabren (§7).
- **Según el riesgo:** revisión de diff aparte y con emulador para datos, sync, dinero, audio y arranque; para la
  interfaz y los P3, una cada dos o tres tandas. Una revisión que solo encuentra P3 no abre su propia sesión de
  arreglos: esos P3 van con la tanda siguiente.

**Las tandas siguientes de la fase de arreglos (PROPUESTA de la 140; el orden lo decide Victor).** Los 45 P2 de
`R9-410`..`R9-568`, agrupados por raíz o por área, datos y sync primero; después los P3. Cada tanda de arreglos lleva
detrás su revisión de diff. Agrupados por el título y las primeras líneas de cada entrada: la raíz se confirma al
leer la entrada entera en su tanda, y si dos resultan la misma, van en un commit.

- **Antes de la tanda 2 — lo que encontró la 141 (4, P3):** `R9-570` (los recordatorios duplicados: serializar la
  reprogramación), `R9-571` y `R9-572` (la ✕ que no pliega, y su prueba con el proveedor real) y `R9-573` («al
  final del libro» en una lista). Son vecinos de la tanda 1: van primero para no dejar una regresión abierta.
  **Hecha en la 180** (`detail/S180-arreglos-p3-de-la-141.md`), sin agentes, en `fix/s180` (`ec99241a`, `4f4c24e3`,
  `dd758313` y `62ee160c`): los cuatro cerrados. `R9-570`: una cola por tipo de recordatorio; en vivo, 14 alarmas
  (26 sin la cola). `R9-571`: la ✕ pliega a través del ref, y con eso el efecto de `R9-427` pasa a hacer falta.
  `R9-572`: la prueba con el proveedor real, vista roja. `R9-573`: «Fin del libro» no se ofrece sobre una lista, y
  uno arrastrado vence al final de la lista, sin textos nuevos. **La 181: la revisión del diff de la 180** (el audio
  y el arranque, con emulador), tras el merge con el OK de Victor.
  **Revisada en la 181** (`detail/S181-revision-del-diff-s180.md`, en tres partes; las dos primeras cortadas por
  límite de llamadas), sin agentes, con emulador en solo lectura y sin cambios de código: se sostiene. En vivo, 28
  alarmas en frío, tras dos cambios de versión y al apagar y encender rápido; la ✕ pliega sonando; «Fin del libro»
  no se ofrece sobre una lista y uno arrastrado para al final. Con la repetición quedó leído, sin medir en vivo.
  Nuevos, P3 y de antes de la 180: `R9-633` (un panel trabado visto una vez, sin reproducir en seis intentos),
  `R9-634` (la pastilla «0m») y `R9-635` («Fin del capítulo» sobre un día de plan). `R9-464` quedó confirmado en
  vivo. Los tres nuevos no abren tanda: entran con la próxima de audio. **La 182: la tanda 2.**

- **Tanda 2 — datos locales: lecturas que fallan y pisan, respaldo y reset (7).** `R9-413`, `R9-414` y `R9-421` (una
  lectura que rechaza al montar deja los valores por defecto y la escritura siguiente los vuelca al disco;
  `sepiaGrandfathered` es del mismo store); `R9-411` y `R9-410` (`importBackup` escribe sin validar la forma: un
  respaldo roto tira Home o el tema en cada arranque); `R9-560` (los toasts del respaldo, detrás del modal «Datos»);
  `R9-558` (el reset de la Biblia pierde las versiones descargadas; con `R9-569` y `R9-559`, P3, que son del mismo
  camino: pide decidir qué promete el diálogo, en los dos idiomas). Nota de la 141: `R9-569` no daña (las
  empaquetadas están siempre disponibles); la red puede escribir la clave cuando la base respondió y el pack no
  está, no cuando la lectura falló, y eso cura además las siete pantallas y quita la ventana que hace
  repetirse a `R9-570`.
  **Hecha EN PARTE en la 182** (`detail/S182-arreglos-tanda-2-parte-1.md`), sin agentes ni emulador, en `fix/s182`
  (`621793fd`, `457a6494`, `69d3d052` y `fdc69e7c`), cortada por forma: `R9-413` y `R9-414` (un arreglo común: nada
  se escribe hasta releer), `R9-421` (la vía del respaldo, sin cerrar: decide Victor si el heredado viaja), `R9-636`
  (nuevo, P3: «Restablecer» quitaba Sepia) y `R9-411` arreglados. `R9-569` y `R9-559` dependen de `R9-558` y quedan
  con él. **La 183: el resto** (`R9-560` con emulador, y los P2 viejos `R9-31`, `R9-32` y `R9-53`), tras el merge
  con el OK de Victor; después, la revisión del diff de la 182 y la 183.
  **Parte 2 en la 183** (`detail/S183-arreglos-tanda-2-parte-2.md`), sin agentes, en `fix/s183`, mergeada
  (`d991b711` y `9095ffbf`), cortada a ~95 llamadas: `R9-560` arreglado y medido en vivo; `R9-32`, la caché
  arreglada. `R9-637` (P3, nuevo, por lectura): los otros 22 modales sin `ToastHost`. Lo que promete el respaldo,
  decidido (§7). **Queda, para la 184:** el aviso de `R9-32` (lo cierra), `R9-31` (medir cuándo vuelve lo borrado,
  el diálogo con sesión y la transacción exclusiva) y `R9-53` (la propuesta de su entrada); después, la revisión
  del diff de la 182 y la 183 con emulador (a la 185 si no entra). `R9-410` y `R9-558` (con `R9-569` y `R9-559`)
  siguen sin sesión.
  **Parte 3 en la 184** (`detail/S184-arreglos-tanda-2-parte-3.md`), sin agentes ni emulador, en `fix/s184` (sin
  mergear): `R9-32` cerrado (el aviso); `R9-31`, el texto del diálogo (medido cuándo vuelve lo borrado), sigue
  abierto por la transacción exclusiva (en el aparato); `R9-53`, la propuesta subcuenta: sin arreglo, decide Victor.
  **Queda, para la 186** (la 185 es el triaje): la revisión del diff de la 182, la 183 y la 184 con emulador, el
  toast de `R9-32` en vivo y la exclusiva de `R9-31`.
  **Revisión en la 186 y la 186b** (`detail/S186-revision-del-diff-y-r9-31.md`; la 186 cortada a ~100 llamadas y
  sin commits), emulador en solo lectura, sin cambios de código: se sostiene, salvo dos. `R9-32` visto en vivo;
  `R9-31` medido en sus tres variantes (la exclusiva sola es peor que hoy; por defecto, aceptar; en su entrada);
  `R9-411` REABIERTO (P2: un `completedDays` que no es arreglo tumba Home, va con `R9-410`); `R9-638` nuevo (P3, el
  aviso del export cortado con letra grande, lote D). **Sigue la 187:** la tanda P2 3.
- **Tanda 3 — sync, y texto del usuario que se pierde sin aviso (7).** `R9-518` (la migración de marcadores duplica
  favoritos en la cuenta); `R9-415` (`saveEditor` de resaltados sin `try`); `R9-473` (un solo debounce para todas las
  secciones de la Mesa); `R9-497` («Reabrir» borra el testimonio); `R9-498` (la oración del paseo, cortada a 1000);
  `R9-511` (el devocional recortado, y «Compartir» borra el borrador); `R9-562` (la ✕ del selector de colores borra
  el subrayado con su nota: **su severidad es una decisión abierta de Victor, §8**).
  **Hecha en la 187 y la 187b** (`detail/S187-arreglos-tanda-3.md`), sin agentes ni emulador, en `fix/s187` (mergeada
  con el OK de Victor: `main` = `e4289cb2`, CI verde): los seis arreglados (`62d3cd94`, `0f0b7340`, `24606b9c`, `fd148c48`, `0883587a`, `9c939a05` y `1e1c5ccf`). Las
  decisiones visibles (N entradas del paseo, «Compartir» que frena, el piso del `maxLength`), tomadas en la 187c por
  delegación (§7). `R9-639` (nuevo, P3, por lectura): vecino de `R9-518`. `R9-640` (P3, A, lote D): el estudio de
  la Mesa compartido con una nota cortada. `R9-562` sigue fuera (§8).
  **La 188, cortada** (`detail/S188-revision-del-diff-s187.md`): el diff leído; en vivo, el devocional de `R9-511`
  (frena, el borrador sigue, `maxLength` 0 bloquea al teclear). Por lectura: el toast de `R9-415` sale detrás del
  editor (`R9-637`), y el paseo deja «(2/2)» arriba. **Lo de la 188b pasa a los pendientes en vivo del método rápido (§7, punto 6)**: pegar,
  el aviso a 2,0 y en español, el paseo, «Reabrir», la Mesa y el toast de `R9-415`, en vivo.
- **Tanda 4 — planes propios y Juntos (5).** `R9-507`, `R9-508` y `R9-509` (el constructor: el plan viejo tras
  guardar, la vista previa que no es lo que se guarda, el renombre que rearma los días y mueve el progreso);
  `R9-512` y `R9-506` (invitar con la duración elegida; pegar el mensaje entero).
- **Tanda 5 — audio, y la versión elegida que no llega a todos lados (7).** `R9-426` (los huecos del audio: el vecino
  de `R9-425`) y `R9-423` (la voz sigue en la versión anterior); `R9-430` (la búsqueda con los resultados de la
  versión anterior); `R9-436` (el estudio de palabra en RVR1960 con la interfaz en inglés); `R9-533` (la comparación
  guardada de otro pasaje); `R9-475` y `R9-496` (gemelos: «Memorizar» duplica la carta con una versión en español).
  De paso, las siete pantallas que leen `@bible_version` directo (`R9-525`, P3; el agravante de `R9-424`).
- **Tanda 6 — búsqueda (4).** `R9-428` («fe» no busca), `R9-429` («Probar otra búsqueda»), `R9-431` (el resaltado no
  sigue lo que encontró la búsqueda) y `R9-568` (los buscadores de libros sin tilde: `foldDiacritics` en tres
  filtros).
- **Tanda 7 — carreras y estado viejo en pantalla (6).** `R9-435` y `R9-476` (gemelos: el pack de originales termina
  de bajar sobre otro versículo u otro pasaje); `R9-432` (el quiz al cambiar de categoría); `R9-437` y `R9-438` (Home:
  el corazón del versículo del día, «Continuar leyendo»); `R9-464` (Favoritos relee la base en bucle).
- **Tanda 8 — robustez: crash y navegación (4).** `R9-412` (un solo boundary nativo, y «Reintentar» en bucle);
  `R9-417` (en release, las promesas rechazadas no llegan a Crashlytics); `R9-467` (una colección con «%» en el
  nombre tira la app); `R9-457` (un enlace compartido abierto en frío queda sin nada debajo).
- **Tanda 9 — interfaz visible (4).** `R9-418` (la hoja de ofrenda se sale por arriba), `R9-454` (los toasts
  ilegibles en oscuro y en alto contraste), `R9-561` (la hoja de nota bajo el teclado) y `R9-450` (el PDF «Guía de
  discusión», solo en español). Se ven en el emulador: su revisión de diff, con capturas.
- **Fuera de las tandas (1):** `R9-477` (el pack de originales descarta 235 palabras): el arreglo del build es
  código, pero republicarlo toca Pages y pide el OK de Victor aparte.
- **Después, los P3** (103 de `R9-410`..`R9-568`, más `R9-569`; los cuatro de la 141 van antes de la tanda 2): por área, en el mismo orden (datos y sync, audio y
  versión, búsqueda, pantallas, interfaz y accesibilidad), y al final los de pruebas, docs y dependencias. Varios caen
  solos con su tanda P2 (`R9-559` y `R9-569` con la 2; `R9-525` con la 5; lo que suma a `R9-524` es una sola raíz).
  **Desde el 2026-11-25, antes van por el triaje de la §7** (la 185, solo docs): lo que quede en A sigue este
  orden; los lotes D van con agentes en paralelo.
  **Triaje hecho en la 185** (`detail/S185-triaje-p3.md`): de 174 P3 triageados, 68 B y 22 C cerrados (90); quedan
  99 P3 abiertos: 29 A, 28 D, 23 E (más los 15 del «NO»), y 4 pruebas sin revert visto. **Una pregunta para Victor**
  (§5 del detalle): las seis pruebas de la Mesa, D o B.
- **El orden que queda, desde la 188** (la tanda 3 hecha en la 187 y la 187b; la 188 revisa su diff con
  emulador; `R9-562` espera su severidad, §8):
  1. **Los P2, por tanda** (4 a 9). **No son disjuntas** (medido sobre los archivos que nombran sus entradas, no los
     que tocará el arreglo): `[chapter].tsx` en 3, 5 y 7; `search.tsx` en 5 y 6; `FavoritesContext.tsx` en 3 y 7;
     `highlights.tsx` en 3 y 9; `app/_layout.tsx` en 3 y 8; `prophecies/index.tsx` en 5 y 7; `translations.ts` en 4,
     6 y 9. Olas posibles con agentes en paralelo: 4, 6 y 9 (con `translations.ts` en serie); 5 y
     8; la 7 al final. Cada P2 sigue con su sesión de revisión de diff (§7, regla 4). De la tanda 2 quedan `R9-410` y
     `R9-411` (los dos del import, una sesión corta), `R9-558` (con `R9-569` y `R9-559`) y `R9-31` (§2.1 del
     detalle de la 186).
  2. **Los lotes D en paralelo**, siete por zona de archivos (§6 del detalle), un agente por lote, cada commit con su
     revert por pieza y sin sesión de revisión. El lote del lector (`[chapter].tsx`) no corre a la vez que las tandas
     P2 3, 5 y 7.
  3. **Los A largos, por área:** sync (`R9-198`, `R9-201` a `R9-213`, `R9-595` a `R9-598`, `R9-122` punto 3, `R9-156`
     ítem 7), Conflictos (`R9-469` con `R9-546`, `R9-545`), favoritos y notas (`R9-145`, `R9-466`, `R9-519`,
     `R9-520`, `R9-284`), borradores (`R9-499` y `R9-563` con `R9-57`), texto bíblico (`R9-489`, `R9-491`, `R9-503`
     con `R9-535` y `R9-538`), y los sueltos (`R9-159`, `R9-168`, `R9-173`).
  4. **Sin revert visto** (`R9-152`, `R9-171`, `R9-297`, `R9-305`): correr el revert que nombra su entrada; si la
     prueba cae, B.
- **Al terminar la fase:** Opus 5.5 como principal con Fable de asesor, y las filas C P1 que faltan (`C17`, `C23`:
  `_scratch/POSTARREGLOS-PROMPT-C17-C23.md`). Las filas de cuenta siguen esperando la cuenta de Google de PRUEBA.

## 5. Reglas que ya costaron caro: el resumen

Las 301 reglas completas, cada una con la sesión y el hallazgo que la pagó, están en `REGLAS.md` (275 movidas tal
cual en la 143, tres de la 145, cuatro de la 146, cuatro de la 147, una de la 148, una de la 149, una de la 150, una de la 151, una de la 152, una de la 153, una de la 155, una de la 156, una de la 157, dos de la 158, dos de la 159 y dos de la 160). Ninguna se retiró. Antes de una tarea, buscá ahí las de su tema con `grep -n`. Este es el resumen, por
tema:

- **Alcance y permisos.** Se hace lo que pide el mensaje de la sesión y nada más. Un mensaje de Victor a mitad de
  turno va al frente. No se mergea ni se pushea sin su OK. Nunca `npm audit fix --force`. La nube no es una opción.
  Los agentes los pide Victor: con `isolation: "worktree"` en todos, 3 o 4 a la vez, con los «ya reportado» por
  número, sin crear ni borrar carpetas; y lo portante de su informe se re-verifica con una sonda propia.
- **Una prueba de un arreglo no vale hasta verla FALLAR sin el arreglo.** Revert de la pieza, correr, leer que cae
  por la razón correcta, restaurar, diff. Un revert mal hecho se ve igual que una prueba que no discrimina. Con el
  productor real: un mock de fábrica puede dejar la prueba verde con y sin el arreglo.
- **Un arreglo abre vecinos.** Puede crear el caso que su premisa niega, quitarle el caso a otra prueba del mismo
  diff, o despertar a quien reacciona al valor que cambia. Antes del commit: la matriz de vecinos en una sonda,
  `grep` de quién consume el valor, y, tras apilar arreglos, la matriz entera otra vez. El arreglo va donde el dato
  todavía es cierto, no donde la entrada lo propuso.
- **Medir, no leer.** Una sonda ejecutable vale más que una lectura, también para verificar un informe. Un «por
  lectura», un «benigno», un «sin daño» y una hipótesis escrita en una decisión son riesgos sin medir. La
  consecuencia de un hallazgo se mide donde el dato se consume. Antes de afirmar un estado, `git log`; antes de
  creerle a un conteo, mirar qué se extrajo. Se mide después de formatear. Excepción, solo para P3: el triaje de
  la §7 (regla 2).
- **Controles y sondas.** Un control se fuerza, se lee entero y se corre también contra un cambio BUENO de su
  superficie. Una pieza que no se aplicó da «sin daño». Una sonda puede romper lo que mide, o dejar de mostrar el
  daño por un arreglo hermano. Las sondas ejecutables se borran al cerrar, o salen de `testMatch`.
- **Mocks y SDK.** Un mock con factoría literal sustituye la superficie, no la comprueba; uno de contexto estable
  tapa lo que el provider real no estabiliza; el de Reanimated no guarda valores. La navegación se mide con
  `renderRouter`; lo que suena, con el motor real; una propiedad del SDK, en nativo y leyendo el envoltorio propio.
- **Sync, cuentas y respaldo.** Quién más escribe en ese lugar mientras el caso espera; qué pasa sin copia local,
  sin sesión, con la cuenta que cambió y con el proceso que murió; lo que `stop()` limpia, `start()` no lo vuelve a
  limpiar; un estado solo en memoria protege mientras vive el proceso.
- **Pruebas de orden y de carreras (la Mesa y el respaldo).** Son más de cien reglas, de las sesiones 55 a 113. El
  ciclo está cerrado por decisión de Victor (§7): no se reabre. Si un arreglo toca `prepAccount` o el turno del
  respaldo, leé antes las de `REGLAS.md` que nombran ese archivo.
- **Interfaz y Modo C.** Un tema se mide como fondo; un toast, con una ráfaga de capturas arrancada antes del
  toque; lo que se publica, en el build y no en `app.json`; la web, con `npx expo export --platform web` servido.
  El emulador llega a pasar «Preparing…» antes de dárselo a un agente. Nunca el teléfono de Victor.
- **Entorno (Windows y Git Bash).** Está en `RECETAS.md`: sin barras invertidas ni acentos graves en la línea de
  comandos, CRLF de PowerShell y de Python, `TZ` desde PowerShell, `execSync` y `cmd.exe`, 31 workers de jest,
  `git branch -f` y nunca `git reset --hard` con cambios sin commitear.
- **Docs.** Prettier manda sobre los docs. El checkpoint se escribe completo en el momento. El estado va en la
  marca de la entrada y en `ESTADO.tsv`, no en prosa. La memoria se actualiza al cerrar.

## 6. Hechos duros que ya no hay que volver a averiguar

- **Modo C, medido en la 141: el audio SÍ se puede medir en el emulador.** En la instancia de solo lectura del
  `Pixel_9_Pro` el TTS dispara `onStart` y `onDone` (sin sonido): el reproductor aparece, la narración avanza
  versículo a versículo y el fin de capítulo ocurre (Salmo 117, dos versículos, ~12 s). Mientras suena, `uiautomator
dump` falla («could not get idle state»): pausar antes, o usar capturas y logcat. `adb` no inyecta dos punteros.
  `screenrecord --size 640x1428` + `ffmpeg` (está en el PATH) dan la animación cuadro a cuadro
  (`_scratch/S141-427-video.sh.txt`). Las alarmas de los recordatorios: `dumpsys alarm`, y el almacén de
  expo-notifications en `shared_prefs` (`_scratch/S141-store.cjs.txt`). El permiso de notificaciones se da con
  `pm grant … POST_NOTIFICATIONS`.
- **Modo C, lo que cambió en las sesiones 137 y 138:** el pagefile es FIJO de 8 GB y el commit total ~40 GB: con
  Metro entran **2** emuladores (25,1 GB libres antes del primero, 17,3 antes del segundo); el 3.er agente va en
  segunda ola sobre el emulador que se libera, con `pm clear` hecho por el orquestador. **Tras el `pm clear` de la 138,
  la instancia del agente 3 arrancó FREE** (Ajustes → Extras: «Unlock with premium»), no premium como en la 115 y la
  137; la del agente 2 midió en premium: leé el estado en Ajustes → Extras antes de medir algo con gating. La base
  `bible.db` va en modo journal (sin `-wal`); la copia por `run-as cat` vale entera. La recarga tras el reset de la
  Biblia tarda 6-17 s con Metro en caché (los 8+ min de la 137 eran el primer empaquetado).
- **Modo C: lo que costó la sesión 115** (el entorno entero, en `detail/C15-hoja-ofrenda.md`):
  - **El techo de emuladores es la memoria COMPROMETIDA, no la libre:** cada instancia de `Pixel_9_Pro`
    compromete ~6,4 GB (con `-memory 1536` también) y el total es ~52 GB. **4 a la vez como máximo** (con
    Metro); con 7 se agotó: Metro sirvió un bundle roto («Compiling JS failed … ';' expected»; arreglo:
    matar Metro y `--clear`), un emulador murió, adb se cayó y Bash no podía hacer fork. Arrancalas de a una:
    tres a la vez dejaron dos trabadas (~450 MB, sin llegar a adb).
  - **Instancias de solo lectura:** `emulator -avd Pixel_9_Pro -port <p> -read-only -no-snapshot-save
-no-boot-anim -no-audio`, con el APK debug vc73 ya instalado (sin cambios nativos desde vc73); `pm clear`
    de la app = onboarding y cuenta anónima nueva; nada queda en el AVD al apagar. La primera carga tras
    `pm clear` tarda de 1 a 5 min en «Preparing...»: en debug, `bible-seed.db` (21,8 MB) baja de Metro
    (`nativeSeedAssets.ts:37-40`).
  - **Metro ve los clones del mismo AVD como UN dispositivo** (mismo `device=`): el depurador de Hermes por
    CDP no sirve con varios a la vez (`R9-417` quedó sin medir por eso). Para CDP, un solo emulador.
  - **La cuenta de Google del AVD es la REAL de Victor (`victorvdu@gmail.com`) y ya tiene la ofrenda.** Tocar
    un nivel de la hoja de ofrenda hace que Play responda «You already own this item» y la app restaura sola
    (`OfferingSheet.tsx:125-138`): el derecho pasa al uid del emulador. Desde la restauración de la 115, cada
    instalación nueva con esa cuenta arranca premium. Nunca iniciar sesión con Google en la app con esa
    cuenta (sus datos reales).
  - **Con la cuenta anónima, el sync y el canje no existen** (`SyncEngineContext.tsx:93`,
    `settings.tsx:541`, `redeem.ts:148`): `C26a`, `C54` y `C55` necesitan una cuenta de Google de PRUEBA que
    Victor agregue a una instancia (Ajustes del sistema → Cuentas).
  - **El toggle premium de dev no sobrevive a un arranque en frío:** RevenueCat responde y gana
    (`PremiumContext.tsx:74-85`, el diseño de `R9-9`/`R9-10`). Para medir free tras un arranque en frío con
    la cuenta que ya tiene la ofrenda, no hay forma desde la UI.
  - **`scripts/device2.js`** (el 2.o dispositivo por firebase-admin) tiene como uid por defecto la cuenta REAL
    de Victor: siempre `--uid=` explícito.
  - Las compras se paran en el diálogo de Play (con «Test card, always approves» para la donación); nunca se
    confirman sin el OK de Victor.
- **El repo de GitHub es PÚBLICO** (`VictorVidal7/EternalStoneBibleAppV4`). Cualquier cosa
  commiteada es material publicado.
- **0 secretos de GitHub Actions** en el repo y `default_workflow_permissions: "read"` → el
  radio de daño de un hallazgo de CI es casi nulo.
- **Las reglas de Firestore NO están versionadas** (no hay `firestore.rules`, ni sección en
  `firebase.json`). Son correctas (default-deny + `request.auth.uid == uid`) y su texto vivo
  está **capturado íntegro** en `detail/B4-reglas-firestore-storage.md`.
- **Todas las rutas Firestore del cliente van bajo `users/{uid}/`.** `giftCodes` es de raíz
  y está deliberadamente **fuera** de las reglas → ningún cliente puede enumerar códigos.
  **Está bien así.**
- **Hay 5 adaptadores de sync, no 3:** `notes`, `highlights`, `reviewEvents`
  (`registerOfflineAdapters.ts:17-19`), **`favorites`** (`FavoritesContext.tsx:228`) y
  **`memoryDeck`** (`MemoryDeckContext.tsx:267`). Y **8 colecciones Firestore**, enumeradas en
  `deleteAccountData.ts:22-43`.
- **La racha, el progreso de lectura, los planes y los logros NO viajan entre dispositivos.**
  No hay colección ni adaptador para ellos: el único camino es el respaldo manual. La app lo
  dice con honestidad en el diálogo de importar (`translations.ts:4168`) y **no** en el
  anzuelo de inicio de sesión (`:3877`, «Inicia sesión para sincronizar tus datos entre
  dispositivos»). Alinear ese copy es decisión de producto de Victor, no un bug.
- **La app llama al backend de Vercel** (`giftCodeService.ts:44` →
  `essb-gift-redeem.vercel.app/api/redeem`). **`functions/` NO está desplegada, y es a
  propósito** — Cloud Functions exige plan Blaze. **No propongas borrarla** (`R9-7`).
- **Firebase Storage no se usa.** **`TogetherContext` no toca Firestore** (los grupos de
  "Juntos" son locales).
- **`/android` está gitignoreado.** La contraseña del keystore de release vive fuera de git
  y **nunca entró al historial** (verificado sobre los 5558 blobs).
- **CI corre Node 24** desde la sesión 16 (antes 20, y eso es `R9-82`: `node:sqlite` no existe
  antes de 22, así que `buildWebPacks.test.js` no CARGABA en CI y su compuerta nunca se
  ejecutó). La máquina de Victor tiene **24.11.1** y `package.json` ya declara
  `engines.node: ">=22"`. **La suite entera se verificó verde en 22.23.2 y en 24.11.1, y roja
  en 20.20.2.** Para correrla en otra versión sin instalar nada:
  `$N=$(npx --yes node@22 -e "process.stdout.write(process.execPath)"); & $N ./node_modules/jest/bin/jest.js`.
- **`tsc` y jest resuelven SIEMPRE al archivo nativo**, nunca al `.web`. Las 14 parejas
  `*.web.*` solo están cubiertas donde alguien escribió a mano un `jest.mock` que redirige
  (patrón en `webStubProviders.test.tsx:516-532`; la pareja de `MemoryDeckContext` **sí** lo
  tiene y salió limpia). **Cualquier divergencia de API entre una pareja web/native sin ese
  mock es invisible para las tres compuertas.**
- **La suite es CIEGA al horario de verano.** Ninguna prueba fija `TZ`. La máquina de Victor
  está en `America/Mexico_City`, **que abolió el DST en 2022**, y el CI en **UTC** (medido en el
  log en la sesión 22; antes aquí decía que en Ciudad de México). Ninguna de las dos zonas tiene
  cambio de hora.
- **`_scratch/` está gitignoreado pero NO jest-ignoreado** (ver §5).
- **El último deploy web es del 2026-08-13.** La regresión de `R9-13` entró el 2026-08-18,
  **5 días DESPUÉS**, así que el sitio vivo está sano y el bug está solo **armado**.
  Trátalo como bloqueante de release.
- **El recipe del token de `firebase-tools` generaliza a la API de Hosting**, no solo a la de
  Rules. Ver `reference_essb-firebase-cli-token-for-rules-api`.
- **La ofrenda desbloquea premium PARA SIEMPRE** (confirmado por Victor, 2026-09-03). El
  `GRANT_DURATION = 'lifetime'` del backend de canje es correcto y un código regalado concede
  exactamente lo mismo que una compra.
- **Ningún `fetch` de la app tiene timeout** — los 6 call sites (`R9-40`).
- **`@prep_notes` es UNA sola clave JSON con todos los sermones**, y
  `AsyncStorage_db_size_in_MB` no está configurado → rige el techo de **6 MB por defecto de
  Android** para toda la base de AsyncStorage, compartido con progreso, mazo, ilustraciones y
  series.
- **La Mesa no vive en `src/features/prep/`** (esa carpeta está **vacía**): los stores están
  en `src/features/study/` y las pantallas en `app/features/prep/`.
- **El gating premium de la Mesa solo OCULTA, nunca borra** (verificado en `A9`): un
  ex-premium conserva todo su trabajo y mantiene la salida gratuita «copiar esquema». No
  busques ahí un P0 de dinero.
- **El intervalo del SRS está acotado en [1, 48] días por construcción** (probado en `A10`):
  no hay desbordamiento posible, ni `NaN`, ni negativos, ni con 20 fallos ni con 200 aciertos
  encadenados.
- **El arreglo del "anillo morado" (clave de día LOCAL) está aplicado completo** en los 4
  caminos de escritura de racha y en toda la aritmética de fechas de `A10` y `A11`. Cero
  `toISOString().split('T')[0]` disfrazado de local.

## 7. Decisiones de Victor que NO hay que volver a preguntarle

- **El método rápido (Victor, 2026-11-26, tras la 188: «hay que aplicar todo… avanzar muchísimo mejor y con un
  método súper óptimo»; diseñado con el asesor).** Por qué: la tanda 3 costó cinco sesiones para seis P2; el ritmo
  era menos de un P2 por sesión, y cada revisión registraba uno o dos nuevos. Manda sobre el orden de tandas de la
  §4 y sobre «una tanda por sesión».
  1. **Un número.** El final de la fase es 0 P1 y 0 P2: todo mensaje final da primero P1 + P2 (74 al cierre de la
     188); el total de abiertos va después.
  2. **Re-triaje de los P2 (la 189, solo lectura).** Cada P2 abierto cae en una clase: **ya arreglado** por trabajo
     posterior (se cierra solo con una sonda o un sha, nunca por lectura; sobre todo los 37 viejos fuera de tanda,
     `R9-3` a `R9-167`, `R9-558`, `R9-620`); **no es A** según la regla 1 del triaje (se propone bajarlo a P3;
     Victor aprueba la lista; lo que toca A(1) o A(2) sigue P2; esto corrige severidades viejas, no arregla nada);
     **espera a Victor** (un solo mensaje, cada uno con la respuesta recomendada); **P2 real**, repartido en
     carriles disjuntos por los archivos que nombra su entrada. Los carriles reemplazan las tandas 4 a 9.
  3. **Olas, no tandas.** Cada ola: 3 o 4 agentes con `isolation: "worktree"`, un carril cada uno (carriles P2 y
     lotes D mezclados). Cada agente corre solo sus pruebas con `--maxWorkers` bajo; el orquestador corre el
     validate una vez por ola. Un merge y un CI por ola.
  4. **«Verla fallar primero», con un script.** Toma un sha y una ruta de prueba, pone los archivos de producción
     del padre, corre jest esperando rojo, restaura y comprueba el `diff` vacío. El orquestador verifica cada commit
     de agente con una llamada.
  5. **La revisión, dentro de la ola.** Un agente de solo lectura que no escribió el carril lee su diff antes del
     merge (consumidores, vecinos, la matriz de la §5). Sin sesión de revisión aparte.
  6. **Lo vivo, en lote.** Cada arreglo anota lo «no medible en jest» en un solo archivo de pendientes en vivo; una
     sesión de emulador cada dos olas. Lo que quedó de la 188b va ahí; nada de eso bloquea.
  7. **La clase del toast, con una guarda y no con una lista.** Una prueba de jest que cae si un archivo tiene
     `<Modal` y `useToast` sin `ToastHost`, y medir si subir el `numberOfLines` por defecto de `Toast.tsx` es
     seguro. El `ToastHost` del editor de resaltados (`R9-415`) va primero en el primer lote D; no se gasta una
     sesión en reproducirlo.
  8. **Menos gasto fijo.** Un script de arranque (estado, conteos, las entradas que nombra el mensaje) y uno de
     cierre (TSV, validador, checkpoint, validate). El detalle en prosa, solo para hallazgos.

  No se promete un ritmo: la estimación sale de la clasificación de la 189. **Las tres respuestas de Victor
  (2026-11-26, «de acuerdo», sobre la recomendación hecha con el asesor):**
  - **Agentes.** Opus 5.5 para todo lo que decide (clasificar, arreglar, revisar); Fable no (sin margen). En la
    primera ola, Sonnet 5.5 en un solo lote D, a prueba: si el script de verla fallar y el revisor lo aprueban,
    queda para los lotes simples. La 189: 4 de solo lectura, y el orquestador lee TODA bajada propuesta. Las olas:
    3 que escriben y 1 revisor; a 4 o 5 si la primera sale sin caídas por carga ni conflictos. Una sola ola grande
    por ventana de 5 h (la 129 se cortó entera en la segunda). Agentes × `--maxWorkers` por debajo de 32 núcleos.
    `translations.ts` lo tocan casi todos: las ramas se mergean de a una.
  - **Decisiones por defecto.** Una decisión técnica o de interfaz, reversible en el código, escrita en esta §7 con
    su porqué y «Victor puede cambiarlo», rige si Victor arranca la sesión siguiente sin objetar. Nunca por
    defecto: merge y push, la lista de bajadas de P2, dinero o premium, contenido teológico o bíblico, lo legal,
    borrar datos de la nube o de cuentas, lo que vive fuera del repo. Se revisa al lanzar (hoy es prueba interna).
  - **Validate de un checkpoint de docs.** Si `git diff --quiet <último sha con CI verde> HEAD -- . ':!DOCS'` sale
    vacío, basta `npx prettier --check "DOCS/REVIEW_2026-09/**/*.md"` y el validador de estado; si cambió código,
    el validate entero. El CI tras el push sigue siendo el control.
  - **Decisiones por defecto de la ola 1 (la 190; Victor puede cambiarlas).**
    - **Sonnet 5.5 queda para lotes D simples**, con el grep de consumidores a cargo del revisor. No va a lotes donde
      el valor devuelto alimenta un estado o una pantalla. Por qué: en `R9-601` el arreglo y la prueba salieron
      bien, pero no miró qué hacían los llamadores con lo devuelto (`R9-641`).
    - **La tinta del aviso (`R9-454`) cambia también el modo claro:** cada variante usa la tinta del tema que más
      contrasta. Por qué: una regla para todos los temas, sin colores fijos; success y warning en claro ganan contraste.
    - **`R9-164`:** un retenido sin copia en la nube se suelta y la copia local se queda; con la lectura fallida,
      sigue retenido para el enganche siguiente. Por qué: es el trato de la rama en vivo de `R9-160` (nunca borrar,
      soltar), y un `deleteAccount` fallido no puede borrar filas del teléfono.
    - **`R9-167`:** abrir la Mesa y tocar un botón sin editar ya no escribe ni sube la entrada en «editado más
      recientemente». Por qué: abrir no es editar; reescribir todo era lo que pisaba la ilustración.
    - **`R9-430`:** la búsqueda rehecha por el cambio de versión es silenciosa: no cuenta para logros ni entra al
      historial. Por qué: la búsqueda no es nueva, solo cambia de versión.
    - **El tope por defecto del aviso (`R9-638`) pasa de 2 a 6 líneas en toda la app.** Por qué: con 2 se cortaban 15
      de 138 textos a escala 1,0 y 65 a 2,0 (modelo de ajuste del agente, calibrado con las capturas de la 186; no
      medido en vivo). Con 6, 0 a 1,0 y 8 a 2,0. Un aviso largo tapa más arriba: pendientes en vivo.
    - **`R9-601`:** ante una lectura fallida, el store no escribe y devuelve vacío, sin relanzar al llamador. Por qué:
      los cuatro llamadores no tienen `.catch`; relanzar daría un rechazo sin manejar. La pantalla vacía: `R9-641`.

- **El flujo de trabajo, desde la sesión 153 (Victor, 2026-11-16: «apliquemos todo lo que nos convenga», tras el
  video de los 7 principios de Karpathy; el análisis está en `detail/S152-arreglos-pruebas.md` §10).**
  - **Esfuerzo por tipo de sesión.** `high` para arreglos y revisiones. `medium` para lo mecánico: un cierre, un
    checkpoint, un merge, un `S1NN-CIERRE-PROMPT`, la memoria. **Lo pone el orquestador** (Victor, 2026-11-16: «que
    tú seas quien modifica el esfuerzo»): al cerrar cada sesión, tras escribir el mensaje siguiente, corre
    `node DOCS/REVIEW_2026-09/tools/esfuerzo.cjs.txt <nivel>` con el nivel de la sesión siguiente, y el mensaje lo
    dice. Vale desde el chat siguiente (no cambia el chat en curso); el statusline lo muestra al arrancar. Si algo
    falla dos veces con `medium`, el orquestador lo dice y pone `high` para el chat siguiente. El esfuerzo pesa poco
    en el costo (la salida es el 13 %, medido en la 141): el ahorro grande es el contexto y los agentes.
    En TODA parada, también un corte por ~100 llamadas con un CIERRE-PROMPT, `esfuerzo.cjs.txt` es el último
    comando antes del mensaje final, y ese mensaje dice el nivel que quedó (se pasó en la 168 al cortar).
  - **El mensaje de la sesión, corto.** Lleva el objetivo, el alcance, el estado esperado de git y lo que NO va. Las
    reglas fijas viven en `CONTINUAR.md` §5, `RECETAS.md` y `REGLAS.md`, y no se copian al mensaje. El modelo:
    `_scratch/S153-PROMPT.md`.
  - **Los informes, cortos.** Frases de 20 palabras o menos, voz activa, una idea por frase. Una tabla o un
    diagrama antes que tres párrafos. Vale para el mensaje final a Victor, la bitácora de `INDEX.md` y el
    encabezado de una entrada de `BUGS.md`. El detalle de una sesión puede ser largo, pero cada frase sigue la regla.
  - **Agentes: el modelo y el esfuerzo los elige el orquestador** (Victor, 2026-11-16: «automáticamente
    seleccionar el modelo de los agentes»). Cuántos, los sigue pidiendo Victor. Esta es la instrucción explícita
    que pide la herramienta para fijar `model` y `effort` en cada llamada:
    - diseña o escribe pruebas, arreglos o sondas nuevas, o busca romper lo integrado: el modelo principal y el
      esfuerzo de la sesión; puede ir como `fork` (hereda el contexto, el modelo y el esfuerzo);
    - solo corre scripts dados y compara salidas (una matriz, una re-medición, un checkpoint): `model: "sonnet"`,
      `effort: "medium"`, `general-purpose` con las reglas completas en un archivo (un `fork` ignora `model`);
    - solo localiza código o archivos: `Explore`, `model: "sonnet"`, `effort: "low"`.
      Ante la duda, el modelo principal. Lo que un script puede filtrar se filtra sin IA. El mensaje final a Victor
      dice qué modelo y esfuerzo llevó cada agente.
  - **El banco propio: `BANCO.md`** (escrito en la 152, siete tareas con la respuesta conocida, cada una un error
    real de la IA en esta revisión). Sirve para comparar un esfuerzo o un modelo con otro antes de cambiar un
    defecto de arriba. Se corre cuando Victor lo pide. **El orquestador se lo recomienda** al cerrar una sesión si se
    cumple uno de los momentos de su sección «Cuándo recomendarlo» (un modelo nuevo, un defecto que se quiere bajar,
    un agente barato que se equivocó dos veces, la cuota que no alcanza, una tanda grande nueva).

- **El triaje de los P3 y la entrada de hallazgos nuevos (Victor, 2026-11-25: «adelante con las reglas que
  necesitan mi OK», con el criterio revisado por el asesor y por un agente Fable sobre 26 P3 reales).** Por qué:
  desde la 142 se arreglaron 66 hallazgos y entraron 64, casi todos P3 de las revisiones de diff. Saldo neto: −4 en
  40 sesiones. El final de la fase sigue siendo 0 P1 y 0 P2 abiertos; el triaje no lo acorta, quita el ruido.
  - **Regla 1, el criterio.** Cada P3 abierto cae en un grupo:
    - **A, se arregla.** (1) Pierde, altera, resucita o deja distinto entre aparatos, o con la nube, algo que el
      usuario escribió o borró; puntos y estadísticas derivadas no cuentan. (2) Dice «guardado», «restaurado»,
      «pagado» o «borrado» cuando no lo está, o muestra mal un texto o una cita bíblica. (3) Tira la app o la deja
      sin salida. (4) Deja un contenido o una acción inalcanzable (lector de pantalla, texto grande, contraste).
      (5) Expone datos o credenciales. (6) Contradice una decisión de esta §7 o una regla fija: el premium no quita
      lo gratis, el cuidado teológico, la fidelidad bíblica.
    - **B, aceptado.** Lo que no cae en A. Se cierra con la marca `✅ ACEPTADO en la sesión N (triaje)`, seguida de
      la cláusula y una frase. Pruebas y CI van a B solo con un revert visto: el que ya documenta la entrada, o uno
      que corre el orquestador (revert, jest, restaurar, `git diff` vacío). Si la puerta no atrapa y protege un
      A(1), van a D.
    - **C, fusionado.** «Familia de» o «raíz de» otro abierto; «vecino de» no es fusión. Se cierra en el que queda,
      que recibe la consecuencia en su entrada. Una fusión hacia uno que espera a Victor hereda la espera.
    - **D, lote.** Es una parte de A, no de B: lo que no cae en A no entra a D, aunque sea barato. Un A con arreglo
      corto, en archivos propios y prueba simple; también una frontera con arreglo propuesto y sonda hecha. Lo
      reparten agentes en paralelo; cada commit, con su revert por pieza. Ejemplo: `R9-637` es D solo para los
      modales donde el toast tapado es un aviso de A(2) (un error al guardar, pagar o restaurar); los demás, B.
    - **E, espera al dueño.** Lo decide Victor o vive fuera del repo (consola, legal). Sigue abierto, sin tocar. Además
      de los del «NO» de cada mensaje, la muestra de Fable marcó como E a `R9-490`, `R9-505`, `R9-522`, `R9-523`,
      `R9-527`, `R9-551`, `R9-419` y `R9-554` (los ocho, P3 abiertos en `ESTADO.tsv`); la 185 lo confirma.
    - **Precedencia:** E, después C, después A (D si es corto), y B al final.
    - **En la duda entre A y B, va a B**, salvo que toque A(1) o A(2): una divergencia silenciosa nadie la reporta,
      así que no se acepta esperando que alguien la reabra.
  - **Regla 2, una excepción a «medir, no leer» (§5).** Un P3 hallado por lectura, sin daño medido y fuera de A, se
    acepta cuando medirlo cuesta más que el riesgo.
  - **Regla 3, la entrada.** Una revisión de diff mira lo que el diff cambió. Un P3 nuevo, del diff o anterior a él, se registra solo si cae en A. El resto va en una línea del detalle,
    sin entrada.
  - **Regla 4, qué diff se revisa.** Solo el de un arreglo P1 o P2. Un arreglo P3 (también los lotes D) se verifica
    con su revert por pieza y el validate, sin sesión de revisión.
  - **La sesión de triaje (`_scratch/S185-PROMPT.md`).** Seis agentes de solo lectura, dos por familia (pruebas y
    CI; sync, dinero y respaldo; pantallas), que no se ven entre sí. Cada uno devuelve un TSV: id, grupo, cláusula,
    frase citada de la entrada y marca de frontera, calibrado con los 14 aceptados de `ESTADO.tsv`. El orquestador
    lee los desacuerdos, toda frontera (Fable espera unas 40) y todo B que nombre pérdida, texto falso o crash. La
    lista de aceptados va en el detalle, y Victor la ve antes del merge. Estimación de Fable: quedan unos 73
    abiertos de 189 (de 53 a 93, según dónde caiga la frontera).

- **Las seis preguntas de la 189 (decididas por delegación de Victor, 2026-11-26: «De acuerdo a las 6 … qué
  advisor decida»; Victor puede cambiarlo).** El detalle: `detail/S189-retriaje-p2.md` §5.
  - `R9-31`: la transacción no exclusiva queda, ACEPTADO (la exclusiva sola midió peor; pierde solo un rollback).
  - `R9-118`: se quita el step de Codecov (`count: 0`; un verde que no mide confunde). Carril 13.
  - `R9-158`: fallar cerrado (preguntar), con el fallo de escritura de `claimLocalStore`. Carril 9.
  - `R9-4`: versionar las reglas vivas tal cual; solo GET, nunca desplegar. Carril 13, fuera de la ola 1.
  - `R9-136`: dirección aprobada (borrador de la 169 §4, App Check en monitoreo); cada paso en vivo, con el OK de
    Victor. No se fusiona con `R9-4`.
  - `R9-135`: sin cambios; espera la cuenta de Google de prueba (pendientes en vivo).

- **`R9-498` y `R9-511`: cómo se guarda lo que no entra (decidido por Claude en la 187c, por delegación de Victor
  del 2026-11-26: «lo dejo a tu mejor criterio»; Victor puede cambiarlo).** El detalle: `detail/S187-arreglos-tanda-3.md` §1, §2 y §6.
  - **`R9-498`: el paseo «Orar la Escritura» se guarda en N entradas del diario** («Título (1/2)», «(2/2)»),
    partidas por versículo entero. Por qué: la otra salida (cajas con tope) dejaba ~19 caracteres por versículo en
    el Salmo 102, y subir el tope del diario no sirve (`parseOne` corta a 1000 al leer). Quién lo ve: el contador y
    el vacío del diario y `PrayerCard` (`requests.length`). Mirado en la 187c: el registro de días de oración
    (`recordTodayPrayer`) es por día, no por entrada; el diario no tiene sync por documento ni logros por entrada;
    viaja en el respaldo (`@prayer_requests_v1`) como cualquier entrada. **Sin medir:** el orden en que quedan en
    el diario (la 188, en vivo).
  - **`R9-511`: si el paquete del devocional recortaría texto, «Compartir» se frena** (toast con cuánto sobra, el
    borrador sigue) en vez de compartir y avisar. Por qué: con la hoja del sistema abierta el toast no se ve,
    Android no dice si la hoja se canceló, y lo recortado entraría en «Tus devocionales» y en «Reenviar».
  - **`R9-511`: el `maxLength` de una caja nunca baja de su propio texto.** Por qué: si un tope menor cortara un
    borrador viejo ya pasado, sería la pérdida que el arreglo viene a quitar. **Sin medir (hipótesis):** que el
    nativo no recorte al bajar el tope, y que `maxLength` 0 bloquee y no se lea como «sin límite» (la 188).
  - **Triaje de lo visto (reglas 1 y 3):** `makeStudyBundle` es A(1): `R9-640`. Cancelar la hoja en el camino
    normal es B (lo compartido queda entero en «Tus devocionales»). Con ~43 notas llenas, las cajas siguientes no
    dejan escribir y no hay contador del total: B (no pierde ni altera nada; es el tope del enlace), una línea en
    el detalle; un contador iría al backlog de ideas.
- **`R9-32` y `R9-31`: qué promete el respaldo (decidido por Claude en la sesión 183, por delegación de Victor del
  2026-11-25).** El detalle: `detail/S183-arreglos-tanda-2-parte-2.md` §2 y §3.
  - **`R9-32`: (a), un aviso neutro al volver de la hoja de Exportar.** Un `toast.info` tras `exportBackup` sin
    secciones degradadas (con degradadas sigue el aviso parcial): «Copia lista. Solo queda guardada donde la hayas
    enviado (Drive, Descargas…).»; en inglés, «Backup ready. It's only kept wherever you sent it (Drive,
    Downloads…).». Por qué: `shareAsync` no sabe si un destino guardó el archivo. El daño que nombra `R9-32` es la
    creencia falsa, y (a) la quita igual en Android e iOS, con una línea en los dos idiomas y sin flujo nativo nuevo
    que medir. En el chat se había recomendado (b). (b), guardar con el selector de carpetas del sistema (SAF), solo
    existe en Android (en iOS la hoja ya trae «Guardar en Archivos») y es una función, no un arreglo: va al backlog
    de ideas. Se implementa en la 184, y con eso `R9-32` se cierra.
  - **`R9-31`: el restore no borra en la nube.** Reemplaza los datos de ESTE aparato, y el diálogo lo dice. Por qué:
    la asimetría de lo irreversible. Un borrado de más en la nube alcanza a todos los aparatos de la cuenta y no hay
    copia en la nube para deshacerlo: un respaldo viejo borraría lo que se creó después en otro teléfono. Un elemento
    de más que vuelve se borra a mano. Lo que queda del bug es la mentira: «reemplaza tus datos» con sesión iniciada
    no es cierto para la cuenta. La 184 mide cuándo vuelve lo borrado y escribe el texto exacto, en los dos idiomas.

- **El premium es de quien dio la ofrenda: en el aparato donde estuvo, no se pierde al cerrar sesión, y la cuenta
  lo lleva a otros aparatos (`R9-119`; decidido por Claude el 2026-11-12, por delegación de Victor: «lo dejo a tu
  mejor consideración»; Victor puede cambiarlo).** La regla, en una línea: **un usuario anónimo nunca le cambia el
  dueño a RevenueCat; solo lo cambia una cuenta que inició sesión.**
  - **Por qué.** Es lo que la app ya prometía: «la ofrenda desbloquea premium PARA SIEMPRE» (abajo), y los dos
    docstrings originales decían que al cerrar sesión la ofrenda «stays unlocked on this device»; lo que falla es
    el código, no la intención. La compra es de la cuenta de la tienda del aparato, no de la cuenta de la app. Y es
    el patrón que la app ya usa: el anónimo no es dueño de nada (`setPrepAccount` y `claimLocalStore`, solo con
    cuenta).
  - **Lo que no cambia.** Iniciar sesión en otro aparato trae el premium. Iniciar sesión con OTRA cuenta en el
    mismo aparato muestra lo de esa cuenta. Un código de regalo se concede al uid de la CUENTA que lo canjea, y
    `giftCodeService` lo sigue enlazando él mismo. **Un anónimo no puede canjear** (corregido en la 147): el
    servidor rechaza el token anónimo y la hoja solo existe con cuenta (`R9-583`).
  - **Lo que se acepta.** Un aparato donde quien dio la ofrenda inició sesión una vez se queda con los extras tras
    cerrar sesión, aunque la compra se haya hecho en otro. Es una ofrenda voluntaria y la app completa es
    gratuita; el error que NO se acepta es el contrario, quitárselo a quien pagó. La alternativa exacta (cerrar la
    sesión de RevenueCat y restaurar en silencio desde la tienda) depende de la configuración de transferencias
    del panel de RevenueCat y puede quitarle el premium a quien paga y tiene dos aparatos.
  - **Lo que también se acepta, escrito en la 147:** con RevenueCat quieto en la cuenta que salió, lo que un
    anónimo compre después queda en el cliente de esa cuenta (el anónimo no es dueño de nada). Lo que NO se
    acepta es que le pase a una cuenta NUEVA creada por link: es `R9-580`.
  - **Cómo se hace: la tanda V1b (§4).** `AuthContext` deja de enlazar al anónimo que nace tras cerrar sesión, y
    `R9-135` se arregla con la misma regla: el uid de una cuenta que llegó antes de `initialize()` se enlaza al
    terminar, y un `logIn` que falló se reintenta. Con su reproducción, su prueba vista fallar y su revisión.
  - **A medir en esa tanda, sin decidir:** qué queda en RevenueCat tras «Eliminar cuenta» (con la regla, el
    aparato seguiría con el uid borrado como dueño). Si la V1b no lo cierra, va con la tanda V4 (cuenta).
    **Medido en la 146:** el aparato sigue con los extras y RevenueCat sigue respondiendo por el uid borrado,
    también tras un arranque en frío; el cliente con ese uid sigue existiendo en RevenueCat. Va con la V4.
  - **La regla, reescrita en la sesión 146 (decidido por Claude por delegación, 2026-11-12; Victor puede
    cambiarlo): el ENLACE automático (el `logIn` de RevenueCat) nunca lo dispara un anónimo; una RESTAURACIÓN no es
    un enlace, y vale para cualquiera, anónimo incluido.** Por qué: una restauración solo trae lo que es de la
    cuenta de la TIENDA del aparato, y quien la pide tiene esa cuenta en la mano; es la única manera de recuperar
    los extras para quien nunca inició sesión, y negársela sería quitárselo a quien pagó. Valen igual los tres
    caminos que restauran (el enlace, «ya comprado» en la ofrenda y «ya comprado» en la donación). Lo que la regla
    no puede prometer: que restaurar en un aparato no se lo saque a otro; eso lo decide el ajuste de
    transferencias del panel de RevenueCat, sin medir.
  - **`R9-579`, decidido con lo anterior:** la restauración de «ya comprado» en la donación se conserva; cuando es
    ella la que desbloquea los extras, la hoja lo dice (`offering.restoreSuccess`).
  - **Solo se commitea lo que es seguro con los DOS supuestos sobre RevenueCat (decidido por Claude por delegación
    de Victor, 2026-11-12, al cerrar la 145: «lo dejo a tu mejor consideración»; Victor puede cambiarlo).** Lo que
    no está medido: qué hace `logIn(uid)` con las compras hechas bajo el id anónimo de RevenueCat (las une al uid,
    o responde sin ellas). Si con el supuesto malo una pieza le quita los extras a quien pagó, esa pieza no se
    commitea: queda escrita y medida en el detalle, y su entrada sigue abierta. Por qué: es el mismo criterio de
    la decisión de arriba (el error que no se acepta es quitárselo a quien pagó); el daño de `R9-135` es bajo (el
    premium lo pagó alguien en ese aparato) y el del supuesto malo es alto (le pasa, al actualizar, a cada persona
    que ya dio la ofrenda); y el estado de hoy tras un arranque en frío, RevenueCat en su id anónimo, es el que
    tienen todos los que ya pagaron.
  - **Qué quedó esperando la medición con la cuenta de Google de prueba (sesión 146):** enlazar al terminar
    `initialize()` a la cuenta que llegó antes (la raíz de `R9-135`), y enlazar tras pasar de anónimo a Google con
    `linkWithCredential`. Hasta entonces, «la cuenta lo lleva a otros aparatos» no se cumple para quien compró con
    RevenueCat en su id anónimo: en el otro aparato hay que restaurar. Las dos piezas, su matriz con los dos
    supuestos y qué hay que medir: `detail/S146-arreglos-premium.md` §6.
- **Los textos de dinero de la sesión 144 quedan como están** (Victor, 2026-11-12, los dejó a consideración de
  Claude). Están en los dos idiomas en `detail/S144-arreglos-dinero.md` §8, y la 145 los revisa.
- **La fase de ARREGLOS va con Fable 5.2 como modelo principal, decidido por Victor el 2026-11-11 (al empezar la
  sesión 140).** Toda la fase, con sus revisiones de diff, va con Fable 5.2 como principal. Al terminarla se vuelve a
  Opus 5.5 como principal con Fable de asesor, y a las filas C P1 que faltan (`C17`, `C23`), con
  `_scratch/POSTARREGLOS-PROMPT-C17-C23.md`.
  - **Empieza en la 140** (la tanda 1, los tres P1: `detail/S140-arreglos-p1.md`); la 141 revisa su diff, también con
    Fable como principal y con emulador. El orden de las tandas siguientes está PROPUESTO en la §4 y lo decide Victor.
  - **Si se sigue re-revisando con Fable lo decide Victor:** no se propone. Los pilotos de re-revisión fueron la 132
    y la 133 (`A7`, `B4`), fuera de la serie.
  - **Desde la sesión 148, Opus 5.5 como principal mientras Victor no tenga margen de Fable (Victor, 2026-11-13:
    «ya tendría que usar Opus 5.5 porque ya no tengo casi margen»).** Cuando vuelva el margen, lo decide él.
  - **Los agentes los pide Victor:** si no los pide, la sesión va sin agentes. La nube sigue sin ser una opción.
  - **En una tanda de arreglos:** un commit por hallazgo, cada prueba vista FALLAR sin el arreglo (revert, correr,
    restaurar, `diff` del revert), el vecino cubierto o escrito como costo conocido, y lo nuevo que aparezca se
    registra y no se arregla salvo que sea la raíz común. La verificación en vivo va en la sesión que revisa el diff.

- **El ciclo de las pruebas de la Mesa se CIERRA con la sesión 112, decidido por Victor el 2026-10-27
  (tras la 111).** La 112 fue la última vuelta de revisión de `__tests__/prepAccount.test.ts` y
  `__tests__/backupPrepTurn.test.ts`.
  - **Por qué:** el ciclo revisión ↔ arreglo no converge. Las revisiones de la 102 a la 110 trajeron 4, 7,
    8, 5 y 11 nuevos, casi todos P3 de las pruebas, sin P0 y con `src/` casi quieto desde la 107: cada
    diseño de control tiene su cambio bueno que cae, y cada arreglo trae sus costos (`R9-401`..`R9-405`).
    Seguir gasta la cuota sin bajar el riesgo de la app.
  - **El corte:** si la 112 no encuentra nada con daño medido (en la app, o en una prueba-sonda que muestre
    pérdida o mezcla de datos), lo que encuentre queda como costo conocido, junto con `R9-401`..`R9-405`, y
    no hay una 113 de arreglos de estas pruebas. Si algo tiene daño medido, la 113 arregla SOLO eso, sin
    abrir otra revisión del ciclo. No se propone otra vuelta salvo que Victor la pida.
  - **Lo siguiente, en este orden, sin mezclar modos en una sesión (charter §3):** `A12` (Modo A, P0, «EN
    CURSO»: superficies de crash), en la terminal. Después, en una sesión aparte con emulador (Modo C: la
    receta de `reference_essb-device-testing-and-automation`, APK debug, nunca el teléfono de Victor), las
    filas C P0 de dinero y gating: `C15` (ofrenda), `C39` (donación), `C55` (canje de gift-code), `C16` y
    `C56` (gating premium), y `C6`, `C54`. Después, las P1/P2 (`A13`+, `B6`–`B10`) en tandas, una fila por
    agente.
  - **Lo que resultó en la 112:** tres verdes falsos con daño medido en una prueba-sonda (`R9-406`,
    `R9-407`, `R9-408`; ninguno lo abrió la 111: son gemelas de arreglos viejos en otro camino), así que
    la 113 arregla SOLO esos tres. `R9-409` (frases) y las notas «Medido en la 112» de `R9-396`, `R9-402`,
    `R9-403` y `R9-404` quedan como costo conocido, con `R9-401`..`R9-405`. `A12` va en la 114, en un chat
    nuevo (sin mezclar los arreglos con el Modo A). Detalle: `detail/S112-revision-del-diff-s111.md`.
  - **El cierre, en la 113 (2026-10-27): arreglado lo que tenía daño, el resto costo conocido.** La 113
    arregló `R9-406`, `R9-407` y `R9-408` (seis commits de pruebas, cada prueba nueva vista caer con su
    regresión y pasar con el código bueno), sin abrir otra revisión, y no hay una 114 que revise su diff.
    Lo que midió de más quedó escrito sin número en `R9-408` (dos costos del arreglo, sin daño). **El ciclo
    de las pruebas de la Mesa está CERRADO:** `R9-401`..`R9-405`, `R9-409`, las notas «Medido en la 112» y
    los costos de la 113 no se arreglan, y no se propone otra vuelta salvo que Victor la pida. Detalle:
    `detail/S113-arreglo-de-s112.md`.
  - **`A12`, cerrada en la 114 (2026-10-28):** los tres hilos cerraron con ocho nuevos (`R9-410`..`R9-417`),
    ninguno P0. El único disparador de un crash de arranque es un respaldo fabricado (`R9-410`). Con eso se
    cierra el Modo A P0. **Lo siguiente:** el Modo C P0 de dinero y gating, con emulador (la 115,
    `_scratch/S115-PROMPT.md`); después, las P1/P2 (`A13`+, `B6`–`B10`) en tandas, una fila por agente.
    Detalle: `detail/A12-superficies-crash.md`.
  - **El Modo C P0 de dinero y gating, medido en la 115 (2026-10-28):** cinco nuevos (`R9-418`..`R9-422`),
    ninguno P0. **Decidido por Victor en la sesión:** las compras paran en el diálogo de Play; «Restaurar»
    una sola vez (ocurrió sola, por `alreadyOwned`); `C55` y `C54` quedan «sin medir» antes que iniciar
    sesión con su cuenta. **Lo siguiente:** las P1/P2 (`A13`+, `B6`–`B10`) en tandas, una fila por agente (la
    116, `_scratch/S116-PROMPT.md`). Detalle: `detail/C15-hoja-ofrenda.md` y vecinos.
  - **La primera tanda del Modo A P1, en la 116 (2026-11-02):** `A13`, `A14` y `A15`, un agente por fila;
    cuatro nuevos (`R9-423`..`R9-426`), ninguno P0. `A13` cerrada; `A14` y `A15` siguen EN CURSO por el
    alcance que no se recorrió (en sus detalles). **Lo siguiente:** el resto de `A14` y `A15`, y `A16`+, en
    tandas (la 117, `_scratch/S117-PROMPT.md`). Detalle: `detail/A13-lector-capitulo.md` y vecinos.
  - **La segunda tanda, en la 117 (2026-11-02), SIN agentes (lo pidió Victor):** `A14` y `A15` cerradas,
    `A16` hecha; cinco nuevos (`R9-427`..`R9-431`), ninguno P0. **Lo siguiente:** `A17`+ por el orden del
    índice (la 118, `_scratch/S118-PROMPT.md`). Detalle: `detail/A16-busqueda.md` y vecinos.
  - **La tercera tanda, en la 118 (2026-11-02), sin agentes:** `A17` y `A18` cerradas; cinco nuevos
    (`R9-432`..`R9-436`), ninguno P0. `A19` no se empezó (mejor entera que a medias). **Lo siguiente:** `A19`+
    por el orden del índice (la 119, `_scratch/S119-PROMPT.md`). Detalle: `detail/A17-quiz.md` y
    `detail/A18-word-study.md`.
  - **La cuarta tanda, en la 119 (2026-11-02), en el mismo chat que la 118 (Victor: «continúa»), sin
    agentes:** `A19` cerrada; dos nuevos (`R9-437`, `R9-438`, P2), ninguno P0. **Lo siguiente:** `A20`+ por el
    orden del índice (la 120, `_scratch/S120-PROMPT.md`). Detalle: `detail/A19-home.md`.
  - **La quinta tanda, en la 120 (2026-11-02/03), con 2 agentes a pedido de Victor (solo midieron):** `A20`
    cerrada (🐛) y `A21` (✅); tres nuevos (`R9-439`..`R9-441`, P3), ninguno P0. **Lo siguiente:** `A22`+ por
    el orden del índice (la 121, `_scratch/S121-PROMPT.md`). Detalle: `detail/A20-ajustes.md` y
    `detail/A21-onboarding.md`.
  - **La sexta tanda, en la 121 (2026-11-03), con 3 agentes a pedido de Victor (solo midieron):** `A22` y
    `A23` cerradas (🐛); siete nuevos (`R9-442`..`R9-448`, P3) y una nota en `R9-416`, ninguno P0. **Lo
    siguiente:** `A24`+ por el orden del índice (la 122, `_scratch/S122-PROMPT.md`). Detalle:
    `detail/A22-compartir.md` y `detail/A23-logros.md`.
  - **La séptima tanda, en la 122 (2026-11-03), en el mismo chat que la 121, con 3 agentes a pedido de Victor
    (solo midieron):** `A24` y `A25` cerradas (🐛); ocho nuevos (`R9-449`..`R9-456`, dos P2) y un camino sin
    medir en `R9-439`, ninguno P0. **Lo siguiente:** `A26`+ por el orden del índice (la 123,
    `_scratch/S123-PROMPT.md`). Detalle: `detail/A24-i18n.md` y `detail/A25-theming.md`.
  - **La octava tanda, en la 123 (2026-11-03), en un chat nuevo, sin agentes:** `A26` y `A27` cerradas (🐛);
    cinco nuevos (`R9-457`..`R9-461`, uno P2), ninguno P0. **Lo siguiente:** `A28`+ por el orden del índice
    (la 124, `_scratch/S124-PROMPT.md`). Detalle: `detail/A26-navegacion.md` y `detail/A27-deep-links.md`.
  - **La novena tanda, en la 124 (2026-11-03), en el mismo chat que la 123, con 3 agentes a pedido de Victor
    (solo midieron):** `A28` y `A29` cerradas (🐛); cinco nuevos (`R9-462`..`R9-466`, uno P2), ninguno P0. **Lo
    siguiente:** `A30`+ por el orden del índice (la 125, `_scratch/S125-PROMPT.md`). Detalle:
    `detail/A28-hooks.md` y `detail/A29-contexts.md`.
  - **La décima tanda, en la 125 (2026-11-03), en un chat nuevo, con 8 agentes a pedido de Victor (solo
    midieron):** `A30` y `A31` cerradas (🐛), las últimas P1 del Modo A; seis nuevos (`R9-467`..`R9-472`, uno P2),
    ninguno P0. **Lo siguiente:** `A32`+ (P2) por el orden del índice (la 126, `_scratch/S126-PROMPT.md`).
    Detalle: `detail/A30-seguridad-tipos.md` y `detail/A31-codigo-muerto.md`.
  - **La primera tanda del Modo A P2, en la 126 (2026-11-03), en el mismo chat que la 125, con 2 agentes a
    pedido de Victor (solo midieron):** `A32` 🐛 EN CURSO y `A33` cerrada (🐛); tres nuevos (`R9-473`..`R9-475`,
    dos P2), ninguno P0. **Lo siguiente:** terminar `A32` y seguir con `A34`+ (la 127, `_scratch/S127-PROMPT.md`).
    Detalle: `detail/A32-mesa-altitud.md` y `detail/A33-profecias.md`.
  - **La segunda tanda del Modo A P2, en la 127 (2026-11-03), en un chat nuevo, con 6 agentes a pedido de Victor
    (solo midieron):** `A32` y `A34` cerradas (🐛); trece nuevos (`R9-476`..`R9-488`, dos P2), ninguno P0. **Lo
    siguiente:** `A35`+ por el orden del índice (la 128, `_scratch/S128-PROMPT.md`). Detalle:
    `detail/A32-mesa-altitud.md` y `detail/A34-journeys-camino.md`.
  - **La tercera tanda del Modo A P2, en la 128 (2026-11-04), en un chat nuevo, con 8 agentes a pedido de Victor
    (solo midieron):** `A35` y `A36` cerradas (🐛); diecisiete nuevos (`R9-489`..`R9-505`, tres P2), ninguno P0.
    **Lo siguiente:** `A37`+ por el orden del índice (la 129, `_scratch/S129-PROMPT.md`). Detalle:
    `detail/A35-ninos.md` y `detail/A36-oracion-lectio.md`.
  - **La cuarta tanda del Modo A P2, en la 129 (2026-11-04), en el mismo chat que la 128, con 8 agentes a pedido de
    Victor (solo midieron; relanzados tras un corte por el límite):** `A37` y `A38` cerradas (🐛), `A39` EN CURSO;
    dieciocho nuevos (`R9-506`..`R9-523`, siete P2), ninguno P0. **Lo siguiente:** terminar `A39` y seguir con
    `A40` (la 130, `_scratch/S130-PROMPT.md`). Detalle: `detail/A37-planes-juntos.md`, `detail/A38-widgets.md`,
    `detail/A39-timeline-facts-colecciones.md`.
  - **La quinta tanda del Modo A P2, en la 130 (2026-11-04), en un chat nuevo, SIN agentes (lo pidió Victor):**
    `A39` y `A40` cerradas (🐛); tres nuevos (`R9-524`..`R9-526`, P3), ninguno P0, más una suma a `R9-524` y una
    corrección de `R9-424`. **Lo siguiente:** `A41` y `A42` (la 131, `_scratch/S131-PROMPT.md`). Detalle:
    `detail/A39-timeline-facts-colecciones.md` y `detail/A40-devocional-luz-guiada.md`.
  - **La sexta tanda del Modo A P2, en la 131 (2026-11-04), en el MISMO chat que la 130, SIN agentes (lo pidió
    Victor):** `A41` y `A42` cerradas (🐛); dos nuevos (`R9-527`, `R9-528`, P3), ninguno P0, más notas a `R9-503` y
    `R9-525`. **Lo siguiente:** `A43` y `A44` (la 132, `_scratch/S132-PROMPT.md`). Detalle:
    `detail/A41-teologia-diccionario.md` y `detail/A42-sermones-share-faith.md`.
- **`R9-330` queda PENDIENTE, decidido el 2026-10-13 (tras la sesión 95), con la recomendación de
  Claude («sigamos tu recomendación»).** Es la edición pedida sin cuenta detrás de la adopción, que
  queda partida entre dos Mesas. Hay un diseño por entrada medido como prototipo (`porEntradaAuto`,
  agente 3 de la 95). Es parcial: cubre notas y autoevaluación, no series ni ilustraciones, y deja
  la ventana entre la adopción y `setPrepAccount`. No se revisa ni se propone salvo que Victor lo
  pida. (La 113 vio, sin revisarlo, otro camino hasta esa ventana: la cola de escrituras de un store;
  anotado en la entrada.)
- **`R9-370`, decidido el 2026-10-20 (tras la sesión 105) por el orquestador de la 105, con la
  delegación de Victor («lo dejo a tu mejor criterio»): opción (a).** Sin dueño registrado, la
  migración toma como dueña la cuenta del ÚLTIMO estado que llegó antes de terminar el trabajo del
  primer estado (la misma regla que ya siguen las claves, `R9-337`), no la del primero.
  - **Por qué:** la entrada partida nace de que las dos reglas difieren. Con un primer estado nulo al
    restaurar la sesión (§5, sesión 57), ese nulo es pasajero, y una Mesa sin dueño registrado no dice
    de quién es: «el primero» tampoco era un dato. La opción (b) (no marcar la migración hasta un
    estado con cuenta) dejaría sin migrar a quien de verdad no inicia sesión.
  - **Lo implementa la 107** en `src/` (con la cabecera de `migrateLegacyPrep` y la de `prepKey`), con
    su prueba vista FALLAR sin el arreglo (`duenoDurante` hecha prueba). Antes, que mida la hipótesis:
    los casos con dueño registrado, nulo→nulo (un usuario que de verdad está sin sesión), y las de
    `R9-331`, `R9-337` y `R9-344`, igual que hoy.
  - **IMPLEMENTADO en la sesión 107** (`a0323d7`): sin dueño registrado, la Mesa de antes se mueve tras
    leer la nota de devoluciones y antes de la primera (`moveUnownedPrep`), con la cuenta de ese momento.
    No al pie de la letra («antes de terminar el trabajo»): moverla tras las devoluciones se llevaba la
    Mesa devuelta de otra cuenta. **El corte**, escrito en las cabeceras: un estado que llega mientras se
    devuelve se lleva las claves y no la Mesa de antes (por lectura, sin medir). Ver la entrada de
    `R9-370`.
- **`R9-59` y `R9-38`, decididos el 2026-10-03 (tras la sesión 51), con la recomendación de
  Claude:**
  - **La Mesa de preparación (`@prep_notes`, `@prep_series`, `@prep_illustrations`,
    `@prep_self_review`) se guarda por cuenta** (la opción (b) de la sesión 22). Cada uno ve solo
    lo suyo en un teléfono compartido, y cerrar sesión no borra nada. Se corrige también la frase
    de `prepNotes.ts` («theirs alone»). Progreso y logros siguen por aparato, como hoy: la decisión
    es para la Mesa.
  - **`R9-38`:** si vuelve a entrar la misma cuenta, se sube lo editado con la sesión cerrada. Si
    entra otra, se le pregunta antes, como la pregunta del dueño anterior (`R9-166`).
  - **El cómo es técnico y está delegado:** qué pasa con los datos de la Mesa sin dueño de
    antes, con el respaldo exportado, y con qué se registra lo editado sin sesión. Sin repetir el
    bulk push entero (`R9-126`). Se decide midiendo, y se deja escrito.
  - **IMPLEMENTADOS en la sesión 53** (`ea182dc`, `a85df96`): el cómo está en las entradas de
    `R9-38` y `R9-59`, en `SyncEngine.queueWrite` y en `src/features/study/prepAccount.ts`.

- **Decidido el 2026-10-07, tras la 73, con la recomendación de Claude** (escrito en la 74, también
  en las entradas):
  - **La corrección de la 71 en `R9-289` va SIN número.**
  - **El arreglo de `R9-296`, cuando toque, PUEDE llevar un export solo para pruebas en
    `src/features/study/prepAccount.ts`** (el gancho que cuenta los pedidos que esperan el turno,
    como `__resetPrepAccountForTests`). Sin él, ninguna ventana de vueltas distingue «espera el
    turno» de «es lenta».
  - **IMPLEMENTADO en la sesión 87** (`9d3f489`): `__prepTurnWaitingForTests()`. Lo lee la prueba
    de `R9-292` en los dos casos `pedidaAntes` (`R9-319`); el caso `durante` de `R9-296` sigue
    abierto. La 88 encontró que cuenta pedidos de cualquiera (`R9-320`). El arreglo medido
    (`porClave`) le pasa a `oneAtATime` qué espera: es el mismo export, con un argumento, pero hay
    que decírselo a Victor al arreglarlo.
  - **Con un argumento desde la sesión 89** (`538b1bc`, `R9-320`), como lo pidió Victor en el
    mensaje de la 89: `oneAtATime` recibe una etiqueta (`prepWrite`, su clave), y
    `__prepTurnWaitingForTests(clave)` cuenta los que esperan con esa clave. No tocó nada más de la
    app. Para el caso `durante` con la unión haría falta etiquetar también las uniones.

- **Las 2 preguntas que dejó abierta la sesión 3 están RESPONDIDAS** (ofrenda = premium para
  siempre; `R9-13` no está en producción). No las vuelvas a plantear.
- **Los 4 hallazgos de campo `R9-40`..`R9-43` NO se arreglan todavía** — quedan registrados
  y se atacan junto con los P0 en la sesión de arreglos (preguntado explícitamente el
  2026-09-07).
- **`R9-42`, cómo arreglarlo cuando toque: repartir los 2 px.**
  `left: -(fontSizes.sm + spacing['0.5'])` → `-(fontSizes.sm + 1)`, o sea −16 → −15, 1 px por
  lado. Descartó ampliar el canalón y achicar el ícono. **Ya está decidido.**
- **Fan-out: Victor lo pide explícitamente cuando lo quiere** ("manda al menos 3 agentes",
  sesión 6). No lo asumas por defecto.
- **Severidades de la sesión 25:** `R9-160` y `R9-166` son P0 y `R9-161` es P1, como se
  propusieron. **`R9-173`:** extender la opción (b) de `R9-109` al fallo de red y al 404 de un
  navegador con texto (decisión delegada al orquestador). La prioridad es baja.
- **Crédito de la nube:** se acabó el 2026-09-24. Desde la sesión 26 se trabaja solo en la
  terminal, y la nube no se propone salvo que Victor la pida.
- **El diseño de `R9-124` (sesión 26):** si el doc de un `removed` todavía existe, NO se suelta a
  ciegas del conjunto no asentado. Pasa por `applyRemoteChange` y se retiene o se suelta según lo
  que resulte, para que un conflicto pendiente conserve su marca (lo aprobó Victor antes del
  arreglo).
- **`R9-181` (sesión 27, delegado al orquestador «a su mejor criterio»): la (b), acotada a los
  docs con la marca.** La rama retenida vuelve a detectar el conflicto también ante una re-entrega
  MÁS VIEJA con campos distintos. Los docs sin marca siguen como `R9-126`. El porqué está en la
  entrada de `R9-181`.
- **`R9-192` (delegado al orquestador al cerrar la 30, 2026-09-29): se integran P2 y P3 de A2.** El
  conflicto tiene que mostrar lo que la nube tiene de verdad; tras reiniciar ya lo hace, y P2/P3
  hacen que la sesión diga lo mismo. HX-push queda descartado (resucita un doc que el otro borró de
  verdad). Con P3, el `fromRead ||` de la marca es equivalente y se quita (medido en la 31).
  **Integrado en la 32; con los sellos de `R9-193`, P3 resultó equivalente y se quitó (`R9-196`).**
- **`R9-193` (delegado igual): los «sellos propios» persistidos, unificados con `R9-190`.** Un solo
  mecanismo responde «¿esta copia es mía?», y los sellos reemplazan a `ownAcked`. Dheld y F se
  quedan solo si una prueba las ve caer (en la 31: Dheld y Dwin fuera, `Fsettle`/`Fresolve`
  dentro). La ventana de caída se cierra con la cola y la tabla de sellos en un solo `multiSet`: la
  31 midió que el sello en la entrada de la cola, solo, no alcanza. Con la tabla ilegible, se
  muestra el conflicto (elegido por el orquestador por la delegación, como `R9-191`). **Integrado
  en la 32.**
- **`+Y` para `R9-194` (delegado al orquestador tras el merge de la 31, 2026-09-30): se acepta.**
  `recentAcked` no responde «¿es mía?»: solo pasa el reloj de la última escritura tomada de un doc
  SIN conflicto a `own` de la entrada NUEVA siguiente de ese doc, que es lo persistido. La
  respuesta sigue siendo una sola (`isOwnCopy` sobre lo persistido), la clave lleva el uid, y si
  el proceso muere antes de la entrada siguiente no hay nada en cola que pueda dar el fantasma.
  Integrado en la 32 (`e7d7fb8`), con comentario.
- **Cuando avise del límite de uso de 5 h, la prioridad es volcar a disco y commitear, no
  terminar de verificar.** Es lo que se decidió en la sesión 6 y por eso existe la deuda de
  re-verificación del `⛔` de arriba: fue un intercambio consciente, no un olvido.

## 8. Decisiones abiertas para Victor (no son bugs)

- **Las familias de `R9-430` y `R9-474` (sesión 190):** el arreglo de la búsqueda (`7a39e815`) y el de la cabecera
  (`R9-478`, `0a8fbfd9`) están hechos, pero `R9-486`, `R9-521` y `R9-525` (fusionados en `R9-430` en la 185) y `R9-482`
  (en `R9-474`) piden archivos de fuera del carril 3. **Recomendado:** terminarlas en la ola 2 con un cuarto agente
  (carril 3b: sus archivos no tocan los carriles 4, 5 y 6, y la ola 1 salió limpia). Alternativa: reabrirlas como P3
  propios y cerrar ya `R9-430` y `R9-474` (P1 + P2 bajaría a 42). Hasta que Victor diga, los dos quedan EN PARTE.

- **La severidad de `R9-562` (sesión 138):** la ✕ del selector de colores del lector borra el subrayado con su nota
  y su categoría, sin confirmar ni deshacer (medido dos veces y re-verificado). Está en P2 PROPUESTO porque media un
  gesto de quitar; pero la regla dice P0 para la pérdida irrecuperable de datos del usuario, y `R9-44` (el mismo dato,
  el mismo selector) fue P0 en la 6. **P2, P1 o P0: lo decide Victor.** Hasta entonces, «ningún P0 abierto» vale con
  esa salvedad.

- **El tope de cuota del piso de no asentados (`R9-39`, sesión 24):** mientras un conflicto siga
  sin resolver, cada enganche de esa colección vuelve a leer desde su piso. ¿Se le pone un tope,
  por ejemplo un aviso si un conflicto lleva N días pendiente? **Medido en la 25:** con 300 docs,
  en un año son 300 928 lecturas contra 3 647. Ojo: un aviso no cubre `R9-164`, un retenido sin
  conflicto visible.
- ~~**`R9-158`:** si no se puede leer el marcador del dueño del almacén, ¿se pregunta (fallar
  cerrado) o se sigue sin preguntar, como hoy? Desde la 25 está medido (suben las 12 notas), y va
  junto con su gemelo: `claimLocalStore` también se traga el fallo al ESCRIBIR el marcador.~~ **Decidido en la 189: fallar cerrado (§7).**
- ~~**`R9-59`:** ¿«device-local» debe significar también «visible para cualquiera que use el
  aparato»?~~ **Decidido el 2026-10-03:** la Mesa, por cuenta (ver la §7).
- **El diario de oración, ¿por cuenta o por aparato? (sesión 128, nota en `R9-59`):** hoy es del aparato
  («DEVICE-LOCAL»), y en un teléfono compartido la cuenta siguiente ve las peticiones de la anterior; la decisión
  de la Mesa no lo alcanza. Ninguna copy promete privacidad por cuenta. Y **la cita en inglés del recordatorio de
  oración (`R9-505`)** es la redacción de la NIV sin atribución: ¿se cambia por WEB/KJV o se atribuye?
- **La severidad de `R9-511` (sesión 129):** el devocional largo se comparte recortado y «Compartir» borra el
  borrador: se pierde texto escrito. Va como P2 (como `R9-498` y `R9-473`); ¿se sube? Y **`R9-522`**: ¿la línea de
  tiempo debe recordar el récord de racha de devoción más allá de los 400 días de retención del registro?
- **Tres de la sesión 135:** la severidad de **`R9-547`** (va P3 porque la cadena entre cuentas es muy improbable;
  el daño, si ocurre, es de privacidad: la nota de una cuenta en la nube de otra); la **retención de
  `users/{uid}/conflicts`** (sin TTL ni limpieza, con tres copias del texto del usuario por registro: `R9-544`, sin
  síntoma en la app); y los **dos dudosos de `book-intros`** (Judas v.24 «Aquel poderoso para guardaros…: Cristo»,
  cuando el v.25 dice «al único y sabio Dios»; Malaquías 4:5 «Juan el Bautista», cuando el versículo dice «Elías»:
  anotados en `R9-539`, sin severizar).
- **Una de la sesión 136:** la severidad de **`R9-551`** (va P3 porque la cadena es muy improbable: una app falsa
  con el paquete de la app, firmada con el keystore de debug PÚBLICO de la plantilla e instalada por fuera de Play,
  que no convive con la real; el daño, si ocurre, es de privacidad: la sesión de Firebase del usuario, con sus notas
  y su diario de oración). Y, ligado: si el desarrollo sigue usando ese keystore para el inicio de sesión en el
  emulador, o se crea uno propio (la propuesta de `R9-551`).
- **`R9-268` (sesión 53):** a una cuenta que ya hizo su bulk push en este teléfono se le pregunta
  «¿Migrar?», y «Migrar» no sube nada. ¿No se le pregunta (y se le dice que los datos locales no se
  migran), o se migra solo lo que falta en su nube? Repetir el push entero no es una opción
  (`R9-126`).
- ~~**La severidad de `R9-269` (sesión 54):** ¿P1, o P0 por ser pérdida de datos?~~ **Decidido
  P1** por el orquestador con la delegación de Victor («como mejor convenga», 2026-10-03): hace
  falta el mismo pasaje en las dos Mesas. Se arregla primero en la 55.
- **El anzuelo de inicio de sesión** promete sincronizar "tus datos" cuando la racha, el
  progreso y los logros no viajan. ¿Se califica el copy?
- **Tres que dejó a la vista la conciliación (sesión 142); las tandas de la §4 no las deciden** (la cuarta,
  `R9-119`, de quién es el premium, y los textos de dinero de la 144 ya están decididos: §7):
  - **`R9-24`, borrar lo que hay en el aparato:** no existe ninguna acción que borre el contenido local. La tanda
    V4 corrige el texto del diálogo de «Eliminar cuenta»; ¿se agrega además esa acción?
  - ~~**`R9-118`, Codecov:** el step sale verde sin haber recibido nada nunca. ¿Se le da un token (un secreto) o se
    quita el step? Recomendación de Claude: quitarlo; un verde que no mide confunde.~~ **Decidido en la 189: quitarlo (§7).**
  - **`R9-136`, la cuota compartida de Firestore:** la entrada lo llama bloqueante antes del lanzamiento. Las
    mitigaciones (App Check, y un tope y la lista de colecciones en las reglas) tocan la consola de Firebase.
    **La 189 aprobó la dirección (§7);** cada paso en vivo sigue pidiendo el OK de Victor.
- **`R9-126`, opción B (sesión 154):** «Restaurar» un respaldo, ¿lleva lo restaurado a la cuenta (el import
  reestampa `updatedAt` y la nube queda con el respaldo) o solo a este teléfono (la nube no cambia)? Recomendación
  de Claude: «a la cuenta». `detail/S154-arreglos-v2.md` §6.

## 9. Abierto, sin relación con la revisión

De `essb-master-backlog` — **no** son hallazgos de esta revisión, no los registres como
tales: lanzamiento público en Play Store (Track 2, bloqueado por la puerta de Google de 12
testers × 14 días; Victor dijo "hablémoslo" y **sigue sin empezar**) · licencia NLT/Tyndale
sin respuesta · registro de marca IMPI · mapa geográfico real para "Rutas bíblicas"
(diferido a propósito). **Ya NO está abierto el merge de `chore/release-3.2.62`:** se
mergeó en `19fee16` y la rama se borró — `main` lleva `3.2.62` / `versionCode 74`
(verificado contra `git log` el 2026-09-14). Si alguna memoria dice lo contrario, miente.
