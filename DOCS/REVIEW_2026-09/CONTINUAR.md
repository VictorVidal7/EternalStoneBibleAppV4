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
- `REGLAS.md`: las 289 reglas completas (la §5 de antes). `RECETAS.md`: lo mecánico.
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
- **Tanda V2 — sync que pierde en silencio (4 P1).** `R9-128` (un apply remoto que falla y el cursor avanza), con
  `R9-132` (P2, la misma forma en subrayados); `R9-37` (el listener huérfano); `R9-127` (el `skipNextBulkPush` sin
  uid); y `R9-126` (el push con reloj viejo), que es de diseño: se mide y se propone antes de escribirlo, y si no
  cabe, lleva su propia sesión.
- **Tanda V3 — respaldo y la Mesa (4 P1).** `R9-129` (`getAllReviewEvents` se traga su error) con su prueba,
  `R9-131`; `R9-30` (el respaldo omite contenido del usuario), con `R9-60` y `R9-117` (P2, la misma raíz: listas
  enumeradas a mano); y `R9-52` (la Mesa reporta como éxito una escritura que falló).
- **Tanda V4 — cuenta y cuota, antes de lanzar (3 P1).** `R9-25` (`deleteAllCloudData` sin lotes), `R9-29` (el
  import sube un `reviewEvents` por evento) y `R9-24`: del diálogo se corrige el texto, para que no prometa un
  borrado que no existe; agregar la acción de borrar lo local queda en la §8. `R9-136` (la cuota compartida, App
  Check y las reglas) y `R9-4` (versionar las reglas) tocan la consola de Firebase: piden el OK de Victor aparte.
- **Tanda V5 — lector y planes (4 P1).** `R9-41` (Crepúsculo: derivar la oscuridad de la paleta), `R9-40` (el
  timeout del catálogo), `R9-54` (descompletar un día), con `R9-55` y `R9-64` (P2, el mismo archivo), y `R9-51`
  (dos notas para un versículo), que pide diseñar la migración antes de escribirla.
- **Tanda V6 — CI y repo (1 P1, barata).** `R9-107` (leer el workflow con un parser YAML), con `R9-2` (el
  `.gitignore` de un repo público), `R9-5` y `R9-6`. `R9-118` (Codecov) sigue en la §8.
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

- **Tanda 2 — datos locales: lecturas que fallan y pisan, respaldo y reset (7).** `R9-413`, `R9-414` y `R9-421` (una
  lectura que rechaza al montar deja los valores por defecto y la escritura siguiente los vuelca al disco;
  `sepiaGrandfathered` es del mismo store); `R9-411` y `R9-410` (`importBackup` escribe sin validar la forma: un
  respaldo roto tira Home o el tema en cada arranque); `R9-560` (los toasts del respaldo, detrás del modal «Datos»);
  `R9-558` (el reset de la Biblia pierde las versiones descargadas; con `R9-569` y `R9-559`, P3, que son del mismo
  camino: pide decidir qué promete el diálogo, en los dos idiomas). Nota de la 141: `R9-569` no daña (las
  empaquetadas están siempre disponibles); la red puede escribir la clave cuando la base respondió y el pack no
  está, no cuando la lectura falló, y eso cura además las siete pantallas y quita la ventana que hace
  repetirse a `R9-570`.
- **Tanda 3 — sync, y texto del usuario que se pierde sin aviso (7).** `R9-518` (la migración de marcadores duplica
  favoritos en la cuenta); `R9-415` (`saveEditor` de resaltados sin `try`); `R9-473` (un solo debounce para todas las
  secciones de la Mesa); `R9-497` («Reabrir» borra el testimonio); `R9-498` (la oración del paseo, cortada a 1000);
  `R9-511` (el devocional recortado, y «Compartir» borra el borrador); `R9-562` (la ✕ del selector de colores borra
  el subrayado con su nota: **su severidad es una decisión abierta de Victor, §8**).
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
- **Al terminar la fase:** Opus 5.5 como principal con Fable de asesor, y las filas C P1 que faltan (`C17`, `C23`:
  `_scratch/POSTARREGLOS-PROMPT-C17-C23.md`). Las filas de cuenta siguen esperando la cuenta de Google de PRUEBA.

## 5. Reglas que ya costaron caro: el resumen

Las 289 reglas completas, cada una con la sesión y el hallazgo que la pagó, están en `REGLAS.md` (275 movidas tal
cual en la 143, tres de la 145, cuatro de la 146, cuatro de la 147, una de la 148, una de la 149 y una de la 150). Ninguna se retiró. Antes de una tarea, buscá ahí las de su tema con `grep -n`. Este es el resumen, por
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
  creerle a un conteo, mirar qué se extrajo. Se mide después de formatear.
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
- **`R9-158`:** si no se puede leer el marcador del dueño del almacén, ¿se pregunta (fallar
  cerrado) o se sigue sin preguntar, como hoy? Desde la 25 está medido (suben las 12 notas), y va
  junto con su gemelo: `claimLocalStore` también se traga el fallo al ESCRIBIR el marcador.
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
  - **`R9-118`, Codecov:** el step sale verde sin haber recibido nada nunca. ¿Se le da un token (un secreto) o se
    quita el step? Recomendación de Claude: quitarlo; un verde que no mide confunde.
  - **`R9-136`, la cuota compartida de Firestore:** la entrada lo llama bloqueante antes del lanzamiento. Las
    mitigaciones (App Check, y un tope y la lista de colecciones en las reglas) tocan la consola de Firebase.

## 9. Abierto, sin relación con la revisión

De `essb-master-backlog` — **no** son hallazgos de esta revisión, no los registres como
tales: lanzamiento público en Play Store (Track 2, bloqueado por la puerta de Google de 12
testers × 14 días; Victor dijo "hablémoslo" y **sigue sin empezar**) · licencia NLT/Tyndale
sin respuesta · registro de marca IMPI · mapa geográfico real para "Rutas bíblicas"
(diferido a propósito). **Ya NO está abierto el merge de `chore/release-3.2.62`:** se
mergeó en `19fee16` y la rama se borró — `main` lleva `3.2.62` / `versionCode 74`
(verificado contra `git log` el 2026-09-14). Si alguna memoria dice lo contrario, miente.
