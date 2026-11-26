# Sesiones 187 y 187b — arreglos, tanda P2 3 (sync, y texto del usuario que se pierde sin aviso)

Opus 5.5 principal, Fable de asesor, sin agentes ni emulador. Rama `fix/s187` (sin mergear, sin push), sobre `main`
= `b01ce3d7`. Un commit por hallazgo, cada prueba vista caer sin el arreglo (revert de la pieza, correr, restaurar,
`diff` vacío). La 187 se cortó a ~95 llamadas con cinco arreglados; la 187b hizo `R9-511` y el cierre.

## 0. Fuera de la sesión, por decisión pendiente

- La pregunta de la 185 (las seis pruebas de la Mesa, D o B): sin respuesta de Victor. No se tocó.
- `R9-562`: su severidad sigue abierta (§8 de `CONTINUAR.md`). Fuera.
- Ninguno de los seis recibió una viñeta «Triaje 185: recibe».

## 1. Arreglados en la 187 (5)

| Hallazgo | Commit                                        | Qué                                                                                                                                                                                                |
| -------- | --------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R9-415` | `62d3cd94`                                    | `saveEditor` de resaltados: `try`/`catch`, `toast.error` (texto nuevo), el editor y el borrador siguen                                                                                             |
| `R9-497` | `0f0b7340` (+ `f26b5929`, un import sobrante) | «Reabrir» con testimonio escrito: `ConfirmDialog` destructivo; sin testimonio, como antes                                                                                                          |
| `R9-473` | `24606b9c`                                    | El debounce de la Mesa hace `flush()` de lo pendiente de otra (pasaje, sección, plantilla) antes de agendar                                                                                        |
| `R9-518` | `fd148c48`                                    | La migración de marcadores consulta `users/{uid}/favorites` (`verseId in`, lotes de 10) antes de crear; si la respuesta no viene del servidor (`fromCache` o fallo), no escribe, no borra ni marca |
| `R9-498` | `0883587a` (+ `a55f7722`, un import sobrante) | El paseo «Orar la Escritura» se guarda en varias entradas partidas por versículo entero (`splitPrayerDetail`); la caja de un versículo, 960 en JS                                                  |

Las pruebas, con el productor real:

- `R9-415`: `__tests__/highlightsSaveEditorRejects.test.tsx`, el `HighlightService` REAL sobre una tabla en
  memoria; la fila se borra con el editor abierto. Sin el arreglo: sin toast de error.
- `R9-497`: `__tests__/prayerReopenConfirm.test.tsx`, la pantalla y el store reales con `renderRouter`. Sin el
  arreglo: 2 de 3 caen («Unable to find ¿Reabrir esta oración?»); el control sin testimonio pasa. Ojo para quien
  siga: `renderRouter` pone timers falsos; una espera con `setTimeout` cuelga la prueba: vaciar microtareas.
- `R9-473`: `__tests__/prepSharedDebounceSections.test.tsx` (de la sonda S126), la Mesa real y el debounce real de
  700 ms. Sin el arreglo: A `undefined`. El caso de la restauración (R9-602) y los dos controles pasan con y sin:
  guardan vecinos. Las 41 suites de prep, verdes.
- `R9-518`: `__tests__/retiredBookmarksMigration.test.ts`, la migración real; el Firestore falso ahora va por ruta y
  su `where` aplica el filtro (otro campo u operador no encuentra nada). Sin el arreglo: 4 de 22 caen; el de la
  lápida pasa con y sin. Vecinos verdes: `_layout`, `backupServiceImport`, `notificationRescheduleSerialized`. Las
  reglas vivas (`detail/B4`) permiten `read` bajo `users/{uid}`. **No medible en jest:** que el `get()` sin red
  devuelva `fromCache`: en el aparato (la 188).
- `R9-498`: `__tests__/scripturePrayerWalkSplit.test.tsx` (de la sonda S128), la pantalla real, el diario real,
  versículos de la base semilla. Sin el arreglo: 1 entrada cortada, la caja en 1500. Las 66 de prayer, verdes.

Decisiones de diseño (con su porqué):

- `R9-498`: medido antes de elegir. El pasaje más largo es el Salmo 102 (28 versículos): con «Salmos 102:28: » y el
  separador, un tope en las cajas dejaba ~19 caracteres por versículo. Subir el tope solo al crear no sirve
  (`parseOne` corta a 1000 al leer). Partir en entradas por versículo entero no pierde nada y no toca el store.
  **Decisión visible, sin aprobar por Victor:** el diario recibe N entradas «Título (1/2)». Las consumen el
  contador y el vacío del diario y `PrayerCard` (`requests.length`). El orden en que quedan, a mirar en la 188.
- `R9-518`: la consulta lee solo los docs que coinciden (cuota mínima, una vez por cuenta). Abortar entero si no hay
  respuesta del servidor, porque la migración borra `@bible_bookmarks` y los docs de la nube al terminar: migrar a
  medias perdería o duplicaría. Límite escrito en el código: un `verseId` anterior a la canonización (Sprint 58,
  2026-06-01) no se reconoce, igual que en la dedupe local.
- `R9-415`: los `confirmDelete` de `highlights.tsx` y `notes.tsx` («mismo patrón, sin medir» en la entrada) quedan
  fuera: no pierden texto escrito.

## 2. `R9-511`, en la 187b (`9c939a05`)

El devocional con más de 12 000 caracteres de notas se compartía recortado, se guardaba recortado en «Tus
devocionales» y el borrador se borraba.

- **`calNotesDropped`** (`src/lib/together/bundle.ts`): los caracteres de todas las notas tal como las da
  `sanitizeNote` sin tope, menos los que lleva el paquete. Compara totales, no posiciones: `makeCalBundle` salta las
  refs inválidas, así que `bundle.d[i]` no es `days[i]`. Cubre el tope de 280 por nota, el presupuesto total y los
  días que deja fuera `slice(0, MAX_CAL_DAYS)`.
- **La guarda portante, en `onShare`:** si sobra algo, `toast.error` con cuánto sobra (texto nuevo `notesOverLimit`,
  es/en) y `return`. No se comparte, no se guarda en «Tus devocionales», el borrador sigue y su autoguardado no se
  cancela.
- **El complemento:** el `maxLength` de cada caja = `max(su largo, min(280, 12000 − las demás))`, con longitudes
  crudas (mayores o iguales que las saneadas: conservador). Nunca por debajo del texto que ya tiene la caja, para
  que un tope menor no corte un borrador viejo ya pasado.
- **Decisión (con su porqué), visible y sin aprobar por Victor:** el plan de la 187 decía «toast y no borrar el
  borrador», sin decir si se compartía igual. Se frena: con la hoja del sistema abierta el toast no se ve, Android
  no avisa si la hoja se canceló, y el paquete recortado habría entrado en «Tus devocionales» y en «Reenviar».
  Con el `maxLength` nuevo, la guarda solo salta con un borrador de antes del arreglo.
- **La prueba:** `__tests__/devotionalShareNotesOverLimit.test.tsx` (de la sonda S129, agente 5), la pantalla
  real, el paquete real y el parser real del borrador. Vista caer pieza por pieza: sin la guarda, 50 × 280 se
  comparte (Expected 0, Received 1); sin el `maxLength` nuevo, la caja 43 queda en 280 y no en 240; sin el piso
  `max(su largo)`, un borrador ya pasado da cajas en negativo. Controles: 30 × 280 viaja entero y borra el
  borrador; 42 × 280 + 240 = 12 000 justos se comparte sin aviso. Vecinos verdes: `devotionalDraft`,
  `devotionalDraftRestoreSignal`, `devotionalSavedRestoreSignal`, `togetherBundle`, `keepAwakeRoutes`,
  `functionalidadesSettings`.
- **No medible en jest:** que el `maxLength` nativo frene al teclear o al pegar (`fireEvent.changeText` se lo
  salta). A la 188.
- **Queda, a la vista de Victor:** con ~43 notas llenas, las cajas siguientes no dejan escribir y no hay contador
  del total. No se amplió.
- **Fuera:** `makeStudyBundle` (P3 de la misma raíz): otra pantalla, otra guarda. El «visto de paso» (cancelar la
  hoja también vacía el formulario): resuelto solo en el camino recortado.

`NODE_ENV=development npm run validate` sobre la rama entera (los 8 commits), justo después de este commit: verde,
448 suites y 5 267 pruebas.

## 3. Hallazgo nuevo: `R9-639` (P3, por lectura, sin verificar)

`retiredBookmarksMigration.ts`, la lectura de `users/{uid}/bookmarks`: es un `get()` de un tiro sin `source`. Sin
red y con persistencia, cae a la caché (vacía en una instalación nueva) sin lanzar: `firestoreSucceeded = true`,
la bandera queda en `done:<uid>` y los marcadores de esa cuenta en la nube no se vuelven a leer (sin interfaz para
llegar a ellos). Mismo mecanismo que el que `R9-518` ya cubre en la consulta de favoritos (`metadata.fromCache`).
P3: camino estrecho (primer arranque con sesión, sin red, cuenta con marcadores de antes de 2026-08-10). Medible
solo en el aparato.

## 4. Conteo

176 abiertos de 639 (1 P1, 73 P2, 101 P3 y el aviso), 2 sin verificar. El validador: 0 avisos y 0 errores.

## 5. Sigue

La 188: la revisión del diff de la 187 con emulador (`_scratch/S188-PROMPT.md`). En vivo: el toast de error de
resaltados, el diálogo de «Reabrir», el paseo del Salmo 102 partido en dos (y el orden de las entradas), la Mesa con
la barra de otra sección, el devocional con un borrador ya pasado, y `R9-518` sin red en una instalación nueva si
cabe, sin la cuenta de Victor.
