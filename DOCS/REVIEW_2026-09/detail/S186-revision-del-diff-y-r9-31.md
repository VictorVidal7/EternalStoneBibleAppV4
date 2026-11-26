# S186 y S186b — el toast de `R9-32` en vivo, `R9-31` medido en el aparato (no exclusiva, exclusiva y `busy_timeout`), la revisión del diff de la 182 a la 184

Sesión 186, Opus 5.5, esfuerzo high, asesor Fable. Sin rama ni commits: cortada a ~100 llamadas. La 186b (su cierre,
Opus 5.5, high, asesor Fable, sin agentes) agrega las §1.1, §2.1, §3.1 y la §4, y escribe esto en `docs/review-s186`. Emulador
Pixel_9_Pro `-read-only`, techo 1, sin sesión en la app (anónima), APK debug vc73. Dos agentes de solo lectura
(Opus, high, `isolation: "worktree"`, sin jest), sus worktrees ya no existen.

**Rangos corregidos:** los del mensaje (`621793fd..fdc69e7c`, `d991b711..9095ffbf`) dejaban afuera el primer
commit de la 182 (`R9-413`/`R9-414`) y de la 183 (`R9-560`). Se revisó `621793fd^..fdc69e7c`,
`d991b711^..9095ffbf` y `82ca9cda..38a13f59`.

## 1. `R9-32`: el toast `exportReady` en vivo — se ve

- **Descartando la hoja** (toque fuera, ráfaga de 14 antes del toque, `S141-s186-descartar-r*.png`): «Generando
  copia…» sigue ~1–3 s; el toast aparece ~4 s tras el toque (r8) dentro del modal «Datos».
- **Con destino elegido** (Quick Share, local; 6 s en su pantalla; Back con ráfaga de 12,
  `S141-s186-qs-mosaico.png`): el toast aparece ~3 s después del Back, con la app ya al frente, y se ve ~2–3 s.
  `shareAsync` resuelve en `OnActivityResult`, al volver la app. **Sin hallazgo nuevo de `R9-32`.** No se probaron
  Drive ni Gmail (la cuenta del AVD es la de Victor).
- **El texto sale cortado a 2 líneas:** «Copia lista. Solo queda guardada / donde la hayas enviado (Drive, Des…»
  (escala 1,0, visto). El agente 2 lo predijo por lectura (`Toast.tsx:69`, 2 líneas por defecto;
  `DataSettings.tsx:110` sin tercer argumento; el `Text` sin `maxFontSizeMultiplier`): a escala 1,3 se cortaría en
  «…donde la hayas…» y a 2,0 quedaría «Copia lista. / Solo queda…», que es la creencia falsa que `R9-32` quitó.
  **Sin medir a 1,3 y 2,0** (`settings put system font_scale`, en la instancia de solo lectura). Si se confirma, es
  A(2)/A(4) y se registra (P3, D: pasar `numberOfLines` o acortar).
- **Sin medir:** el proceso de la app murió entre el brazo de Quick Share (vivo a +6,8 s) y el toque siguiente
  (~1–2 min después); el buffer de crash ya estaba limpio (`logcat -c`). Puede ser el sistema por memoria.
- El diálogo de importar de la 184 se vio en vivo («Esto reemplazará los datos de este dispositivo…»), con los
  botones a la vista a escala 1,0.

### 1.1 La 186b: el toast a escala 1,3 y 2,0 — se pierde el destino (`R9-638`)

- Emulador Pixel_9_Pro `-read-only`, la app en inglés (el AVD quedó así), descartando la hoja con un toque arriba y
  una ráfaga de 14 antes del toque (`S141-s186b-f13-r*.png`, `S141-s186b-f20-r*.png`). `font_scale` vuelto a 1,0.
- **1,3:** «Backup ready. It's only kept / wherever you sent it (Drive, …»: el destino se lee.
- **2,0:** «Backup ready. It's / only kept wherever …»: dice que solo queda «donde», sin decir dónde. Es lo que el
  agente 2 predijo. **Registrado como `R9-638`** (P3, A(2)/A(4), D: `numberOfLines` o un texto más corto). En
  español a 2,0, sin medir; por lectura, peor (el texto es más largo).
- De paso: el toast de arriba se monta sobre la barra de estado (la hora tapa su borde), a toda escala.

## 2. `R9-31`: la no exclusiva, medida en el aparato

- **Sonda temporal** (revertida con `git checkout`, árbol limpio): en `DataSettings.performImport`, tres timers
  (300, 1200 y 3000 ms tras empezar `importBackup`) que llaman a los productores reales `addReviewEvent` (se traga
  el error) y `new AchievementService(bibleDB).trackVersesRead(n, 0, 'John')` (la racha; no atrapa). Marcas de
  tiempo en `BackupService` al pedir BEGIN, dentro, fin del cuerpo y COMMIT, y un `throw` opcional al final del
  cuerpo. Archivo: la plantilla exportada inflada a 5000 subrayados, solo esa sección
  (`_scratch/S186-inflar.cjs.txt`), en Descargas. El import tardó 30–34 s (la transacción, ~28–33 s; ~5,5 ms por
  `INSERT`); un respaldo real de cientos de filas abre una ventana de 1–3 s.
- **`expo-sqlite` 57.0.1, leído:** `withExclusiveTransactionAsync` abre una conexión nueva (`useNewConnection`),
  `BEGIN` diferido; ni el nativo ni la app fijan `busy_timeout` (solo los binarios de libsql lo nombran, no se
  usan); la app no fija `journal_mode`.

  | brazo                  | escritor (inicio)                         | promesa                  | en disco después |
  | ---------------------- | ----------------------------------------- | ------------------------ | ---------------- |
  | no exclusiva, commit   | repaso y racha a t+3,0 s (dentro)         | resolvió (3 ms y 778 ms) | quedan           |
  | no exclusiva, rollback | repaso a t+0,3 s (antes del BEGIN)        | resolvió                 | queda            |
  | no exclusiva, rollback | repaso y racha a t+1,2 y t+3,0 s (dentro) | resolvieron              | **se perdieron** |

  Lectura: con la no exclusiva, un escritor de otra tabla durante el import se mete en la transacción. Si el import
  hace commit, queda; si hace rollback, se pierde **y el escritor no se entera** (su promesa resolvió). Es
  exactamente lo que dice la entrada de `R9-31`, ahora medido. Los repasos son lo que el usuario calificó (A(1)
  discutible: el evento es un registro de una acción suya); la racha es estadística derivada.

- **Sin medir (a la 187 de cierre):** los dos brazos de la exclusiva (reescribir sobre el `txn` solo la sección de
  subrayados: el archivo no trae más). La predicción por lectura: sin `busy_timeout`, el escritor de la conexión
  compartida recibe «database is locked» al instante; `addReviewEvent` lo traga (se pierde, con un `warn`),
  `trackVersesRead` rechaza a su llamador, el adaptador de favoritos relanza (`R9-128`: el motor re-entrega).
  O sea, la exclusiva cambia «se pierde en rollback» por «se pierde siempre, salvo quien reintenta». La alternativa
  a medir: no exclusiva + nada (el rollback del import es raro: un fallo de SQLite a mitad), o exclusiva +
  `PRAGMA busy_timeout` en las dos conexiones.
- Los escritores de sync no se midieron (sin la cuenta de prueba): el adaptador de favoritos relanza ante un
  fallo (`FavoritesContext.tsx:207-216`, `R9-128`), el de subrayados también (prueba `s154a3`).
- Los `catch` leídos: `reviewEventStore.addReviewEvent` traga y avisa (`reviewEventStore.ts:70`);
  `AchievementService.trackVersesRead` no atrapa salvo `book_reading_log` (`:361`); `FavoritesContext`, arriba.

### 2.1 La 186b: la exclusiva, en sus dos brazos, y con `busy_timeout`

- **Sonda temporal** en `BackupService.importBackup` (revertida con `git checkout`, árbol limpio): la transacción
  de SQLite pasa a `db.withExclusiveTransactionAsync(async txn => …)` con la sección de subrayados sobre
  `txn.runAsync` (el archivo solo trae esa: los demás `Present` dieron falso, así que nada escribió por la conexión
  compartida con el `txn` tomado). Timers a 300, 1200, 3000 y 8000 ms y uno de control 500 ms después del fin;
  cada uno lanza cuatro productores: `addReviewEvent` (traga), un `INSERT` crudo en `review_events` por la
  compartida, la racha (`new AchievementService(bibleDB).trackVersesRead(3, 0, 'John')`) y un lector
  (`SELECT COUNT(*) FROM highlights` por la compartida). Archivos: la plantilla escrita a mano (`formatVersion: 2`
  y `app`) inflada con `_scratch/S186-inflar.cjs.txt` a 5000 y a 500 subrayados.
- **Pragmas:** `journal_mode` `delete` y `busy_timeout` 0, en la compartida y en la del `txn`. El primer `runAsync`
  del `txn` (el `DELETE`) terminó a los 47–73 ms: los timers de 300 ms ya caen con el lock tomado.

  | brazo                                | escritores (repaso, crudo, racha)                                                 | lector                                  | import                        |
  | ------------------------------------ | --------------------------------------------------------------------------------- | --------------------------------------- | ----------------------------- |
  | exclusiva, commit, 5000              | `database is locked` (código 5) a los 3–20 ms; el repaso resuelve (traga, `warn`) | resuelve a los 4–7 ms (estado de antes) | COMMIT a 9,4 s                |
  | exclusiva, rollback (`throw`), 5000  | igual                                                                             | igual                                   | rechaza con el `throw`, 9,7 s |
  | exclusiva + `busy_timeout` 3000, 500 | esperan ~1,4 s y entran tras el COMMIT                                            | espera 1,46 s detrás de ellos           | COMMIT a 1,1 s                |

  En disco (`leer`), tras el commit: solo las filas del control (`post`), ninguna de las de dentro; 5000
  subrayados. Los de control entraron en los tres brazos. Ningún productor quedó colgado (pendientes a +10 s: ninguno).

- **Lectura:**
  - La exclusiva sola **es peor que hoy**: con la no exclusiva, lo de dentro se pierde solo en un rollback; con la
    exclusiva se pierde siempre (el repaso, en silencio; la racha y el crudo rechazan a su llamador).
  - El lector no se bloquea con la exclusiva sola (`delete`, 5000 filas pequeñas: el caché del `txn` no desbordó).
  - Con `busy_timeout`, nada se pierde si la ventana es menor que el timeout, pero la conexión compartida queda en
    serie: el lector espera detrás del escritor que espera. Una ventana más larga que el timeout vuelve a dar
    `locked` (sin medir).
  - La conexión propia es ~3 veces más rápida: 5000 subrayados en 9,4 s contra 28–33 s (~1,9 ms por `INSERT`
    contra ~5,5). Un respaldo real de cientos de filas cierra en ~1 s.
- **Recomendación para `R9-31`** (en su entrada, sin código): exclusiva + `PRAGMA busy_timeout` (≥ 5 s) fijado al
  abrir la conexión compartida, con todo el cuerpo del import sobre el `txn` (hoy escriben por la compartida
  `bibleDB.executeSql`, `foldVerseNotesInTransaction` y los logros: no es mecánico). La alternativa barata: no
  exclusiva y aceptar (pierde solo en un rollback, que es un fallo de SQLite a mitad). La exclusiva sola, descartada.

## 3. La revisión del diff (parte 1: los informes, sin re-verificar)

**Agente 1, la 182.** Se sostienen `R9-413`, `R9-414` (progreso y planes), `R9-421` y `R9-636`. Un A propuesto:

- **A1 (182): `R9-411` a medias.** `readingPlanProgress: {"bible-in-a-year": {"completedDays": "1,2"}}` pasa las
  dos guardas (solo miran el nivel de arriba: `BackupService.ts:1533-1555`, `ReadingPlanProgressContext.tsx:149-161`);
  `getCompletedDays` devuelve el texto (`?? []` solo cubre nulos, `:262-265`) y `planPace.ts:90` hace
  `completedDays.filter` en el render de Home (`app/(tabs)/index.tsx:1566-1590`) y de `plan/[id].tsx:101-142` →
  TypeError, y por `R9-412` «Reintentar» no sale. A(3). La entrada de `R9-411` dice que un `completedDays` de texto
  no tumba nada, pero su sonda copiaba las lecturas de Home sin montar la Home real. **Sin re-verificar:** pide una
  sonda jest con `planPace` real (o Home montada) y el import real; si cae, reabrir `R9-411` (P2, como `R9-410`).
- Fuera de A (una línea cada uno): el rebase de `updateChapterProgress` (`ReadingProgressContext.tsx:212`), un %
  derivado; la ventana antes de la primera lectura (ya existía, no se alcanza); los ya heredados por la lógica vieja
  siguen heredados (premium de más); la hoja del lector devuelve Sepia a `system` sin premium (diseño, como las
  fuentes); las pruebas de planes no cubren `ensureRead` en `setPlanStart`, `migratePlanProgress`, `restartPlan`,
  `startPlanFromSilentProgress`; sin prueba de `reset()` con el disco sin leer ni de la relectura por la señal de
  restauración; los casos `42` y `[1,2]` de `R9-411` no discriminan (ya figuran como control).
- Pedido en vivo: que `@reader_preferences` traiga la clave `sepiaGrandfathered` (premisa de `R9-421`). No se midió.

**Agente 2, la 183 y la 184.** Se sostienen `ToastLayer` (registro y baja por id, nunca dos lugares), la identidad
de `useToast`, `box-none`, la limpieza de caché (solo el nivel de arriba; el picker copia a
`cache/DocumentPicker/`), `isAvailableAsync` antes de escribir, `exportReady` solo sin degradadas, y el texto de
`R9-31` contra `BackupService` (es y en equivalentes). Un A probable: el toast cortado (§1). Fuera de A: el texto
del diálogo calla que el archivo sube y pisa versiones más nuevas (ya es `R9-126`); un destino que lee tarde puede
perder el archivo que borra el export siguiente (con cuenta); el export doble antes de un re-render; el toast que se
muda de host reinicia sus 3 s y TalkBack lo anuncia dos veces; iOS y el modal que se cierra; el JSDoc de
`exportBackup` pegado a `BACKUP_FILE_RE` (el punto sin escapar, inocuo); la prueba de `box-none` no prueba el
toque (solo el vivo de la 183); las de `R9-31` comparan la constante del texto. Pedidos en vivo: el toast a escala
1,3 y 2,0; la caché tras un import y un export; el toast al cerrar el modal antes de 1 s.

### 3.1 La 186b: el A1 re-verificado — `R9-411` se REABRE

- **Sonda jest** (`_scratch/S186b-r9411-sonda.test.tsx.txt`, fuera de `__tests__`): el `importBackup` real (con los
  mocks de `backupServiceImport.test.ts`), el `ReadingPlanProgressProvider` real y lo que hace Home por cada plan
  del catálogo (`getCompletedDays`, `effectivePlanDays`, `planPace`). Entrada `iam-7` con `completedDays`:

  | `completedDays` | el import                | `getCompletedDays` | Home                                                |
  | --------------- | ------------------------ | ------------------ | --------------------------------------------------- |
  | `"1,2"`         | restaurada, sin fallidas | `"1,2"`            | `TypeError: completedDays.filter is not a function` |
  | `42`            | restaurada               | `42`               | el mismo                                            |
  | `{a: 1}`        | restaurada               | `{a: 1}`           | el mismo                                            |
  | `null`          | restaurada               | `[]`               | no lanza (control)                                  |

- Se reabre `R9-411` (P2, como `R9-410`), con el arreglo propuesto en su entrada; no va en esta sesión (dos guardas
  y sus pruebas con revert por pieza). `plan/[id].tsx` llama al mismo `planPace` (por lectura).
- **El A del agente 2:** el toast cortado, confirmado en vivo (§1.1, `R9-638`).
- Los pedidos en vivo que quedan sin medir: `sepiaGrandfathered` en `@reader_preferences`, la caché tras un import
  y un export, y el toast al cerrar el modal antes de 1 s. Ninguno es A; quedan anotados aquí.

## 4. Estado

Al cerrar la 186b: **181 abiertos de 638** (1 P1, 79 P2, 100 P3 y el aviso). `R9-411` reabierto (P2); `R9-638`
nuevo (P3). `R9-32` sigue cerrado (visto en vivo). `R9-31` sigue abierto, ahora medido en las tres variantes, con la
recomendación en su entrada. Sin cambios de código: las dos sondas, revertidas.
