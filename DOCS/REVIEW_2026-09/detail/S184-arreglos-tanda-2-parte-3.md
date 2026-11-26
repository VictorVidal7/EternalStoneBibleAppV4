# S184 — Tanda 2, parte 3: `R9-32` cerrado, `R9-31` (el texto), `R9-53` sin arreglo exacto

Sesión 184, Opus 5.5, esfuerzo high, sin agentes ni emulador. Rama `fix/s184` (sobre `82ca9cda`): `8ed7e99a`
(`R9-32`), `b26d7878` y `38a13f59` (`R9-31`, el texto). El paso 5 (la revisión del diff de la 182 y la 183 con
emulador) no entró: pasada la llamada ~65 sin los tres hallazgos cerrados, va a la 186 (la 185 es el triaje).

## 1. `R9-32`: el aviso tras exportar (`8ed7e99a`) — ✅ ARREGLADO

- **Arreglo:** `DataSettings.handleExportBackup`, con `degradedSections` vacío, muestra
  `toast.info(t.settings.exportReady)`. Con degradadas sigue solo el aviso parcial; si `exportBackup` rechaza, solo
  el error. El texto es el decidido en la 183 (`CONTINUAR.md` §7): «Copia lista. Solo queda guardada donde la hayas
  enviado (Drive, Descargas…).» y «Backup ready. It's only kept wherever you sent it (Drive, Downloads…).».
  `exportBackup` espera a `shareAsync`, que resuelve al cerrarse la hoja: el toast sale después.
- **Jest** (`__tests__/toastHostModal.test.tsx`, `ToastProvider`, `DataSettings` y `ConfirmDialog` reales): el
  export limpio dibuja el aviso dentro del modal «Datos», una vez; controles: degradado → solo `exportPartial`;
  rechazo → solo `exportError`; los dos textos exactos.
- **Revert por pieza** (solo el `else` con el `toast.info`; el archivo queda igual a `HEAD`): cae 1, el export
  limpio. Restaurado, diff con el arreglo. Se vio el conteo, no el nombre.
- **Vecinos:** `--findRelatedTests DataSettings.tsx`: 2 suites, 18 pruebas, verdes. `exportReady` solo lo lee
  `DataSettings`. `tsc` limpio.
- **Sin medir (a la 186, primero):** en vivo. Sobre todo con un destino elegido: la app puede estar en segundo plano
  cuando el toast sale (3 s) y no verse.

## 2. `R9-31`: el diálogo de importar (`b26d7878`, `38a13f59`) — EN PARTE, sigue abierto

- **Cuándo vuelve lo que el restore borró, medido** (`_scratch/S184-r931-sonda.test.ts.txt`: el `SyncEngine`, el
  cursor persistido y el adaptador de subrayados reales; SQLite y Firestore falsos, el falso entrega al adjuntar
  los docs con `updatedAt >= piso`, como la consulta real). Tres subrayados en la nube: hace 2 h, hace 6 min y hace
  2 min (el más nuevo; el cursor queda ahí). El restore los borra del aparato:

  | momento                                    | vuelven                                    |
  | ------------------------------------------ | ------------------------------------------ |
  | en el mismo proceso                        | ninguno                                    |
  | el arranque en frío que pide el aviso      | los de 6 y 2 min (dentro del margen)       |
  | otro aparato edita el de 2 h               | ese, al instante                           |
  | cerrar sesión y volver con la misma cuenta | los del margen del cursor nuevo; no el 3.º |
  | reinstalar (sin cursor)                    | los tres                                   |

  El piso de la consulta es el cursor menos 5 min (`CURSOR_SAFETY_MARGIN_MS`); el cursor persiste por uid y nada lo
  borra salvo reinstalar o borrar los datos de la app (`grep sync_cursor`: solo `SyncEngine.ts`). O sea: lo borrado
  no vuelve en el arranque, salvo lo cambiado en los 5 min antes del último cambio que el aparato vio; vuelve al
  reinstalar, si otro aparato lo edita, y queda en los otros aparatos.

- **Solo se midieron subrayados.** Favoritos, notas y memorización usan el mismo motor y cursor y su upsert es
  `INSERT OR REPLACE` (notas, subrayados) — por mecanismo, sin medir. El piso retenido por docs sin asentar
  (`R9-39`/`R9-106`) puede traer más: sin medir. La nube real y su caché offline, sin la cuenta de prueba: sin medir.
- **El texto (decidido: el restore no borra en la cuenta, §7):** «Esto reemplazará los datos de este dispositivo con
  los del archivo elegido y no se puede deshacer. / Si usas una cuenta, lo que no esté en el archivo no se borra de
  ella: tus otros dispositivos lo conservan y puede volver a este (por ejemplo, al reinstalar la app). El progreso
  de lectura, logros y rachas, preferencias y la Mesa de preparación solo viven en este dispositivo.»; en inglés,
  «This will replace the data on this device with the contents of the chosen file, and can't be undone. / If you use
  an account, what isn't in the file isn't deleted from it: your other devices keep it, and it can come back to this
  one (for example, if you reinstall the app). Reading progress, achievements and streaks, preferences, and the
  Preparation table live only on this device.».
  - Un solo texto, sin condición de sesión: «si usas una cuenta» cubre también el aparato sin sesión con dueño del
    store local (el import encola para ese dueño, `R9-38`).
  - «Lo que no esté en el archivo no se borra», no «no se borra nada»: el fold de notas sí encola los borrados de los
    ids que reemplaza (`R9-51`); el contenido sobrevive fusionado.
  - No promete el arranque en frío (solo vuelve una parte). Sale la frase «favoritos… y repasos (últimos 12 meses)
    también se sincronizan»: el respaldo no sube los repasos (`R9-29`).
  - `38a13f59` lo acorta al largo del anterior (377/383 caracteres contra 386/370): `ConfirmDialog` no desplaza el
    mensaje, y uno 50 % más largo podía empujar «Importar y reemplazar» fuera de pantalla con letra grande.
- **Jest:** dos casos en `toastHostModal.test.tsx` (el diálogo real muestra el texto; el inglés dice lo mismo).
  **Revert:** con los textos de `8ed7e99a` caen los 2; con el `translations.ts` entero de `82ca9cda`, 6 (los 2 y
  los que leen `exportReady`).
- **La mitad técnica, sin código:** la exclusiva (`withExclusiveTransactionAsync`) entrega su propia conexión, y el
  cuerpo del import escribe con `bibleDB.executeSql` (la conexión compartida): cambiarle el nombre dejaría las
  escrituras fuera de la transacción o bloqueadas contra ella. No hay `busy_timeout` ni `PRAGMA` de bloqueo
  (`grep`). Escritores de las tablas que el import toca: los adaptadores de sync (favoritos en `FavoritesContext`,
  notas en `database/index.ts`, subrayados), `AchievementService` y `reviewEventStore`. El adaptador de subrayados
  rechaza ante «database is locked» y el motor no mueve el cursor (re-entrega, `R9-128`, prueba `s154a3`); los
  demás, **sin leer**. Medir la exclusiva pide el aparato: queda en la entrada.
- **Una línea, sin medir:** las filas restauradas se encolan con el `updatedAt` del archivo; un aparato con el cursor
  más adelante puede no recibirlas.

## 3. `R9-53`: la propuesta no es exacta — sin arreglo, decide Victor

- **Medido** (`_scratch/S184-r953-sonda.test.ts.txt`: `computeMemoryStatsSummary` real, la resta de la propuesta a
  mano; no `importBackup`). El floor se siembra UNA vez desde el resumen de la nube (`seedMemoryStatsFloorIfFresh`)
  y guarda totales por banda, sin ids. Retención total (suma de `total` por banda):

  | caso                                                                    | verdad | sin arreglo | propuesta |
  | ----------------------------------------------------------------------- | ------ | ----------- | --------- |
  | 1. respaldo = lo que contó el floor                                     | 10     | 20          | 10        |
  | 2. floor de B (10) y C (5); respaldo de B hecho después de sembrar (15) | 20     | 30          | 15        |
  | 3. floor de B (10); respaldo con 5 eventos que el floor nunca contó     | 15     | 15          | 10        |
  | 4. floor de B y C; respaldo de B de antes de sembrar                    | 15     | 25          | 15        |

- La propuesta resta eventos que el floor no contó: subcuenta (casos 2 y 3), y el piso 0 lo esconde. En el caso 3
  hoy el conteo es correcto y la propuesta lo rompería. El caso 3 no pide otra cuenta: alcanza un respaldo de un
  aparato cuyo resumen no estaba en la nube al sembrar. Sin vía de escape (`R9-61`), un arreglo inexacto no va.
- **Opciones, sin medir, para Victor:** (a) aceptar la subcuenta en vez de la sobrecuenta; (b) restar solo los
  eventos anteriores al `updatedAt` del floor (cubre el 2, no el 3); (c) ids en el resumen, o una vía de reset que
  borre el floor y el resumen (no es `resetDeck`, `R9-61`). Va en la entrada y en el mensaje, no en la §8.

## 4. Validate

`NODE_ENV=development npm run validate` en `docs/review-s184` (`43ff7884`), sin Metro ni emulador: verde, 443 suites
y 5245 pruebas (la 183: 443 y 5239; +6), eslint sin errores (82 advertencias). Salida: `_scratch/S184-validate.out.txt`.

## 5. Cierre

Docs en `docs/review-s184`, sobre `fix/s184`, en el principal (sin el worktree de la receta: solo docs, sin código
nuevo). Sondas fuera de `testMatch`, en `_scratch`.
