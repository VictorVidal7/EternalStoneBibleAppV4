# A36 — Oración y lectio (`app/features/prayer/`, `app/features/lectio.tsx`, `src/features/prayer/`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 128 (2026-11-04, chat nuevo; con 8 agentes a
> pedido de Victor, 4 en esta fila y uno en la frontera con `A35`) · Estado **🐛 BUG** (cerrada en la 128)

> **Resultado:** 10 hallazgos, ninguno P0: P2 `R9-496` (lectio: «Memorizar» con una versión en español duplica la
> carta del mazo, el gemelo de `R9-475`), `R9-497` («Reabrir» borra el testimonio sin confirmar) y `R9-498`
> (orar la Escritura guarda la oración cortada a 1000 caracteres y dice «Guardado»); P3 `R9-499`..`R9-505`.
> Notas a `R9-30`, `R9-59` y `R9-24` (los datos de Oración y Niños fuera del respaldo y de la cuenta). Las 98
> anclas de ACTS y los 17 pasajes de orar la Escritura existen en las versiones medidas, el mismo versículo en
> los dos idiomas.

> **Cómo se midió:** cuatro agentes (`fork` en worktree, sobre `3473f79`) que solo midieron: el 4, lectio
> (`lectio.tsx` 1021 L); el 5, el diario (`prayer/index.tsx` 989 L, `prayer.ts`, `prayerStore.ts`,
> `usePrayerJournal.ts`); el 6, ACTS y el registro (`acts.tsx` 563 L, `acts.ts`, `prayerLog.ts`,
> `prayerLogStore.ts`); el 7, orar la Escritura (`scripture/index.tsx`, `scripture/[passageId].tsx` 530 L,
> `scripturePrayers.ts`); el 8, la frontera de las dos filas (respaldo, sync, cuenta, deep links, recordatorios,
> logros). Cada sonda de un hallazgo se re-midió igual en el principal. Informes y sondas en
> `_scratch/S128-sondas-agente-{4,5,6,7,8}/`. Lo ya dicho por `A8` (`handleFinish` de lectio,
> `detail/A8-notas-subrayados.md:397`), `A26` (el atrás de ACTS), `A28` (la cola y las mutaciones del diario),
> `A7` (`R9-30`), `A12` (el «sin medir» de `prayerStore`), `A22` (compartir), `__tests__/prayer*.test.ts`,
> `__tests__/acts.test.ts` y Fable (áreas 35 y 49, ✅) no se re-derivó.

## Hallazgos

- **`R9-496` (P2):** `lectio.tsx:101-105` arma `bookDisplay` en el idioma de la versión y `handleMemorize`
  (`:230-246`) lo usa en `buildVerseKey` y en `addCard`; el resto usa `canonicalBookName` (`handleFinish`, `:271`,
  también). Con RVR1960 y «John/3/16» en el mazo: sin aviso, y el mazo real queda con «John/3/16» y «Juan/3/16».
  Gemelo de `R9-475` en otro archivo.
- **`R9-497` (P2):** «Reabrir» (`prayer/index.tsx:354-359`) llama a `reopenRequest` (`prayer.ts:179-191`), que
  borra `answeredNote` y `answeredAt`, al primer toque, junto a «Compartir testimonio»; «Eliminar» sí confirma
  (`:161-166`, `:774-783`).
- **`R9-498` (P2):** `scripture/[passageId].tsx:174-191` junta las oraciones del paseo en un `detail` que
  `newPrayerRequest` corta a 1000 (`prayer.ts:87`, `:91-94`, `:111`) sin aviso; el campo del paseo (`:296`) no
  tiene `maxLength` ni contador (el formulario del diario sí, `prayer/index.tsx:602`, `:716`). Salmo 51: cortada a
  mitad del versículo 13, con «Guardado en tu diario de oración».
- **`R9-499` (P3):** el formulario del diario se cierra con el atrás (`onRequestClose`, `:566`) o «Cancelar»
  (`:660`) y el «+» lo vacía (`openAdd`, `:113-120`); igual el testimonio a medio escribir (`:696`, `:170`). La
  forma de `R9-57` en otra pantalla.
- **`R9-500` (P3):** orar la Escritura: la flecha del encabezado (`goBack`, `:153-156`, `:210-216`) sale del paseo
  sin preguntar y pierde lo escrito (vive solo en `notes`, `:77`); el atrás del sistema retrocede un versículo
  (`useBackHandlerStep`, `:166-172`) y «Anterior» lleva la misma flecha.
- **`R9-501` (P3):** orar la Escritura: `saved` (`:79`) nunca vuelve a `false` y el botón depende de `!saved`
  (`:375`): lo escrito después de guardar no se puede guardar.
- **`R9-502` (P3):** `acts.tsx:402-405` hace `router.replace('/features/prayer?openAdd=1')`: llegado desde el
  diario («Orar ahora», `prayer/index.tsx:437-440`), deja dos diarios en la pila y hace falta un atrás de más.
  Lo encontraron por separado los agentes 5 y 6.
- **`R9-503` (P3):** el pack RV1909 publicado sigue otra versificación en 12 capítulos (Jonás 1 con 16
  versículos): `range('Jonah', 2, 1, 9)` (`scripturePrayers.ts:114`) empieza con el pez y no llega a «La
  salvación pertenece á Jehová». SSE1569 difiere en 4 capítulos y WEB en Romanos 16; RVR1960 y BSB, en ninguno.
- **`R9-504` (P3, fidelidad):** `scripturePrayers.ts:100-101` pone el Salmo 51 en «Salmos que la Escritura titula
  "oración"»; su título (BSB, versículo 1) no lo dice; el 86, 90, 102 y 142 sí.
- **`R9-505` (P3, fidelidad):** `src/lib/notifications/prayerReminderCopy.ts:38` presenta como cita de 1 Pe 5:7 una
  paráfrasis («Echa sobre Él toda tu ansiedad…»; RVR1960: «echando toda vuestra ansiedad sobre él…»), y `:64` la
  redacción de la NIV sin atribución (WEB: «casting all your worries on him…»). Hebreos 4:16 (`:34`, `:60`) omite
  «pues»/«therefore»; Salmos 46:10, literal.

## Notas a hallazgos viejos (sin número)

- **`R9-30`:** `@kids_progress_v1`, `@prayer_requests_v1` y `@prayer_log` siguen fuera de
  `BackupService.ts:109-121` (el detalle de `A7`, `:173`, ya los nombra). Sin medir: un respaldo viejo puede
  volver a bloquear «Primera historia» y ya no se gana (ver `detail/A35-ninos.md`).
- **`R9-59`:** en un teléfono compartido, la cuenta siguiente ve el diario de oración de la anterior
  (`prayerStore.ts:6-7`, «DEVICE-LOCAL»); la decisión (b) se aplicó solo a la Mesa. Si el diario va por cuenta o
  por aparato es una decisión de Victor (§8 de CONTINUAR).
- **`R9-24`:** «Resetear Datos de la Biblia» tampoco borra el diario de oración ni el progreso de Niños.

## Medido de paso, en el Pendiente (sin número)

- `prayerStore.ts:105-126` nunca rechaza y orar la Escritura (`:192-198`) celebra «Guardado» con `setItem`
  fallando (`S128-a7` prueba 5: `toast=[["Guardado…"]] guardado=null`): es el «sin medir» de `A12`
  (`detail/A12-superficies-crash.md:107`), que espera su tanda.

## Revisado sin hallazgo

- **lectio:** los params de las tres entradas (Home `(tabs)/index.tsx:1828-1836`, lector `[chapter].tsx:3488-3497`,
  guiada `guided.tsx:153-161`): los 132 `book_name` de RVR1960 y WEB resuelven
  (`S128-a4-nombresLibro.test.ts.txt`, 1/1); fuera de rango, `status 'error'`. La versión cambiada recarga (`:136`).
  El atrás (`:356-370`), el temporizador y la pregunta de meditación (canónica, día local), bien.
- **El diario:** la carga valida cada entrada; las categorías por id (no hay clave en otro idioma); el «+» abre con
  el filtro activo; `?openAdd=1` tiene un solo origen.
- **ACTS:** las 98 anclas existen en RVR1960 y WEB, el mismo versículo en los dos idiomas
  (`S128-a6-anclasActs.test.ts.txt`, 1/1); la versión cambiada recarga (`:126`) sin repetir el registro; el día
  local (`dailyIndex`, `prayerLog.ts`); la cola de `prayerLogStore` serializa.
- **Orar la Escritura:** los 17 pasajes existen en RVR1960, WEB, KJV, BSB, RV1909 y SSE1569 (salvo Jonás en RV1909,
  `R9-503`); la versión cambiada conserva lo escrito (prueba 8); `go` acotado; `handleSave` con guarda.
- **La frontera:** `+native-intent.tsx` deja pasar `features/prayer` y `features/kids`; la tarjeta del Home recarga;
  Ajustes guarda el switch y la hora con `busy` (`NotificationsSettings.tsx:182-225`); Oración y lectio no tienen
  logros propios.

## Sin medir

- **Modo C:** dos toques en «Siguiente» en Oratio de lectio (el segundo cae en «Terminar» y salta la
  contemplación), dos toques en «Guardar» del diario mientras el `Modal` se desvanece, el doble toque en una
  tarjeta del índice de orar la Escritura (`index.tsx:55-58`, familia de `R9-474`), la app cerrada a mitad del
  paseo, el doble toque en los switches de Ajustes.
- **Sin número, a criterio de Victor:** la X de lectio con una oración a medio escribir sale sin confirmar
  (`:647-651`, la salida explícita); dos `setPhase` en el mismo tick dejan ACTS sin registrar el día (no alcanzable
  con toques reales: un `>=` lo cerraría).
- Los títulos de los salmos 102 y 142 citados en español (sin fuente en el repo: los packs en español no traen
  títulos); los `book_name` de las versiones descargadas en lectio; el tope de 1000 en lectio y ACTS; las otras
  referencias en capítulos de versificación distinta (`kidsStories.ts:705`, `:739`, `messianicProphecies.ts:535`,
  `theology.ts:51`, `cross-references.ts:88`, `shareFaithObjections.ts:138`); dos cambios de idioma seguidos que
  agendan dos veces el recordatorio de oración (`app/_layout.tsx:191`, el «sin medir» de `A20`, forma de
  `R9-439`: Pendiente); la copy de los otros recordatorios.

**Cruce con las vecinas (§5, sesión 116):** `A35` deja «Modo C» el doble toque de la portada de Niños (la misma
familia que el índice de orar la Escritura y Journeys); el «sin medir» de `A12` sobre `prayerStore` quedó medido
de paso; `R9-503` (versificación de RV1909) toca `kidsStories.ts` de `A35` y filas de más adelante (`A41`, `A42`).
