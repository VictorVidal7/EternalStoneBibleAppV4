# A9 — Persistencia y autoguardado de la Mesa de preparación

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 6 (2026-09-14) · Estado
> **🐛 BUG** (4 hallazgos: `R9-47` **P0**, `R9-52` P1, `R9-58`/`R9-59` P2)
>
> **Procedencia y estado de verificación.** Fila ejecutada por un agente en worktree
> aislado dentro del fan-out de 4 de la sesión 6. El P0 está **probado con 3 sondas
> ejecutables** (`A9probe`, `A9probe_b`, `A9probe_c`) montadas sobre la pantalla real con el
> mock stateful de AsyncStorage; el P1 también. **PENDIENTE: la re-verificación a mano del
> orquestador** sobre los `grep` portantes del P0 (regla fija de `CONTINUAR.md` §5).

## Alcance

**Leído de punta a punta:** `src/features/study/prepNotes.ts` ·
`src/features/study/prepNotesStore.ts` · `src/features/study/prepHistory.ts` ·
`src/features/study/prepTable.ts` (§ secciones/plantillas, `:55-200`) ·
`node_modules/use-debounce@10.1.1/dist/index.mjs` (**desminificado a mano**) ·
`src/features/study/sharePdf.ts` · `src/features/study/prepIllustrationsStore.ts` ·
`src/features/study/prepSelfReviewStore.ts`.

**Leído por el camino de persistencia** (no en diagonal, pero no entero):
`app/features/prep/index.tsx` — `:1-120`, `:290-470`, `:464-700` (`load()`), `:826-1010`
(navegación + flushes), `:1024-1090` (autoguardado), `:1775-1870` (stepper de rango),
`:2270-2470` (picker de plantilla + inputs de nota).

**En diagonal:** `app/features/prep/history.tsx`, `pulpit.tsx`, `series/index.tsx`,
`series/[id].tsx`, `illustrations/index.tsx`, `illustrations/[id].tsx`,
`src/services/BackupService.ts` (solo la porción `prep`), `src/context/PremiumContext.tsx`,
`src/lib/offering/offeringService.ts`.

**Nota de ubicación para futuras sesiones:** `src/features/prep/` **está vacío**. La lógica
de la Mesa vive en `src/features/study/` (los stores) y en `app/features/prep/` (las
pantallas). El índice decía `features/prep` a secas y eso cuesta un minuto de búsqueda.

## Cobertura de tests

Hay **30 archivos de test** que tocan `prep*`. Cubren bien el modelo puro
(`prepNotes.test.ts` — round-trip de `template`, auto-borrado del entry vacío),
`prepHistory`, plantillas, timing, rango, markdown, PDF (manuscrito/handout/fallos de
share), el gating premium de las 4 pantallas, la autorrevisión, la comparación de versiones,
y **un** caso de refoco (`prepTableScreenNotesRefocus.test.tsx`).

**Hueco medido — NINGÚN test escribe jamás en un campo de nota de la Mesa:**

```
grep -rn "fireEvent" __tests__/prepTableScreen*.tsx __tests__/prepPulpitScreen.test.tsx __tests__/prepHistoryScreen.test.tsx
→ 0 hits de changeText sobre un input de sección; todos los fireEvent son press sobre botones

grep -rn "savePrepNote|debounce|flush|autosave" __tests__/*.tsx
→ savePrepNote solo aparece como SEMBRADOR de datos previos, nunca como sujeto de prueba
```

Es decir: `handleNoteChange` → `debouncedSaveNote` → `savePrepNote`, `handleNoteBlur`, y el
`flush()` al desmontar (`index.tsx:1042`) **no tienen ni una sola aserción** en los ~4027
tests. Tampoco hay ningún test que cambie el rango con notas sembradas en más de una clave,
ni ninguno que ejercite una escritura fallida.

---

## 🐛 `R9-47` (P0, severidad **alta**) — `load()` no tiene guarda de obsolescencia: una carga vieja que llega tarde pisa los `drafts`, y el siguiente `onBlur` escribe esa prosa ajena (o vacía) sobre la clave del pasaje visible

`app/features/prep/index.tsx:464` (`load`), `:592` (`setDrafts(saved.sections)`), `:598`
(`setTemplate(...)`), `:611-615` (`useEffect(() => load(), [load])`), `:843-846`
(`handleRange`), `:1053-1065` (`handleNoteBlur`)

**Qué pasa.** `load()` es un `useCallback` con deps `[table, params.version]` disparado por
un `useEffect` **sin cleanup**. `table` cambia de identidad con
`[book, chapter, range.start, range.end, isPremium]` (`:321-328`). Cada toque del stepper
arranca un `load()` nuevo **sin cancelar ni invalidar el anterior**: no hay request-id, ni
`AbortController`, ni un `if (table.passageKey !== currentKeyRef.current) return` antes de
los `set*`. Las cargas terminan en el orden en que el disco las suelta y **la última en
llegar gana**, sea o no la del pasaje que está en pantalla. `setDrafts` (`:592`) y
`setTemplate` (`:598`) se aplican incondicionalmente.

A partir de ahí el daño **no es solo visual**, porque `handleNoteBlur` (`:1053-1065`) no lee
el `TextInput`, lee el estado: escribe `drafts[section] ?? ''` **bajo `table.passageKey`**,
que es la clave del pasaje _visible_, no la de los `drafts` que quedaron cargados. El `?? ''`
convierte una prosa ausente en un **borrado**: `setMapSectionNote` con texto vacío elimina la
sección, y si era la última, elimina el entry entero (`prepNotes.ts:157-170`).

**Mecanismo de fondo.** `getPrepNotes` lee con un `AsyncStorage.getItem` crudo
(`prepNotesStore.ts:40-42`) que **no pasa por la `writeQueue`** que serializa las escrituras
(`:46`), así que las lecturas y las escrituras no están ordenadas entre sí.

**Escenario de fallo (real, dos toques).** El predicador tiene su idea central escrita para
Juan 3:16. Toca «+ Fin» para mirar 3:16-17 y enseguida «− Fin» para volver. La carga del
rango ancho (más versículos, más referencias cruzadas que resolver) termina _después_ de la
del rango angosto. La pantalla dice «Juan 3:16» pero el cuadro muestra lo del 3:16-17 (o
vacío). El siguiente toque en cualquier lado dispara el `blur` → y Juan 3:16 queda
**borrado** o **reemplazado por el texto del otro sermón**. Sin toast, sin confirmación, sin
deshacer.

**Debería:** descartar toda carga que ya no corresponda al pasaje visible.

**Evidencia — probado con sonda, 3 variantes, 3 fallos distintos:**

```
[A9 PROBE 2]  bigIdea en pantalla        = ""
[A9 PROBE 2]  storage ANTES del blur     = {"John/3/16":{"sections":{"bigIdea":"SEIS MESES DE TRABAJO: …"}}}
[A9 PROBE 2]  storage DESPUÉS del blur   = {}                    ← nota BORRADA

[A9 PROBE 2b] mostrado bajo el rango 16-16 = "SERMON B — Juan 3:16-17"
[A9 PROBE 2b] storage después del blur:
              "John/3/16"    → bigIdea: "SERMON B — Juan 3:16-17"  ← SERMON A destruido
              "John/3/16-17" → bigIdea: "SERMON B — Juan 3:16-17"

[A9 PROBE 2c] rango 16-16; ¿renderiza el cuadro "tension" (solo de 'narrative')? true
[A9 PROBE 2c] John/3/16 template = expository | sections = [ 'bigIdea', 'tension' ]
```

**La tercera consecuencia (2c) es la más silenciosa:** la carga obsoleta también trae el
**template** ajeno (`:598`), así que la Mesa renderiza secciones que el entry visible no
tiene. Lo que el predicador escriba ahí queda guardado bajo un id de sección que
`getPrepTemplateSections('expository')` nunca devuelve — **invisible para siempre**: no se
re-renderiza al recargar, no sale en el PDF ni en «copiar esquema» (ambos iteran
`templateSections`), y no aparece en la vista previa del Historial (`prepHistory.ts:85` itera
el template del entry). Solo sobrevive dentro de `searchableText`.

**Segundo disparador del mismo defecto, SIN carrera (leído, no probado).** `table` depende
de `isPremium` (`:328`). Cuando RevenueCat empuja un cambio de titularidad
(`offeringService.ts:118-133` → `PremiumContext.tsx:63-66`), `table` se recrea y `load()` se
vuelve a correr **sobre el mismo pasaje**; si el predicador estaba tecleando,
`setDrafts(saved.sections)` (`:592`) revierte el cuadro a lo último persistido y su `onBlur`
vuelve a escribir esa versión vieja. Ventana ≈ los 700 ms del debounce.

**Por qué los tests no lo agarran.** Ningún test cambia el rango con notas sembradas en
**más de una** clave de pasaje; `prepTableScreenVersionCompare.test.tsx:406` ensancha el
rango pero solo verifica versículos, sin notas. Como ningún test escribe en un input de
nota, `handleNoteBlur` **no se ejecuta nunca en toda la suite**. Y el mock de `@lib/database`
de los tests de pantalla resuelve instantáneo e idéntico para todos los versículos, así que
jamás hay dos cargas solapadas con tiempos distintos.

---

## 🐛 `R9-52` (P1, severidad **media**) — toda falla de escritura de una nota se traga en silencio y `savePrepNote` la reporta como éxito; la Mesa no tiene ninguna señal de guardado

`src/features/study/prepNotesStore.ts:76-81` · `app/features/prep/index.tsx:1024-1065`

**Qué pasa.**

```ts
writeQueue = writeQueue.then(run).catch(error => {
  logger.warn('Failed to save prep note', {error: String(error)});
});
return writeQueue; // ← resuelve, nunca rechaza
```

El `.catch` convierte cualquier fallo en resolución. Los cuatro llamadores (`:1031`
debounce, `:1057` blur, `:952` ilustraciones, `:983` púlpito) son fire-and-forget o
`await Promise.all(...)` sin `try`. Y la Mesa no tiene **ningún** afordance de guardado: los
únicos dos toasts del archivo de 3467 líneas son `p.exportPdfError` (`:1248`, `:1252`). No
hay «Guardado», ni spinner, ni reintento.

`@prep_notes` es **una sola clave JSON con todos los sermones de toda la vida**, y
`AsyncStorage_db_size_in_MB` no está configurado en ningún lado
(`grep -rn "AsyncStorage_db_size|db_size_in_MB" android/ app.json app.config*` → 0 hits),
así que rige el **techo de 6 MB por defecto de Android** para _toda_ la base de AsyncStorage,
compartido con progreso de lectura, mazo de memorización, ilustraciones, series, etc.

**Escenario de fallo.** El almacenamiento del teléfono se llena (o se cruza el techo de
6 MB). El predicador escribe toda la tarde; el texto sigue en pantalla porque viene del
estado `drafts`, no del disco. Cierra la app. Al volver: vacío. Nunca vio un solo aviso.

**Debería:** un error visible («no se pudo guardar») en el primer fallo de escritura.

**Evidencia — probado con sonda** (`A9probe.test.tsx`, PROBE 3; **pasa = confirma el
defecto**):

```js
jest
  .spyOn(AsyncStorage, 'setItem')
  .mockRejectedValue(new Error('database or disk is full'));
await expect(
  savePrepNote('John/3/16', 'bigIdea', 'texto que el usuario cree guardado'),
).resolves.toBeUndefined(); // ✓ resuelve como éxito
// [A9 PROBE 3] storage after "successful" save = {}
```

**Por qué los tests no lo agarran.** No hay ni un test en toda la suite que haga fallar
`AsyncStorage.setItem`; `prepNotes.test.ts` solo prueba el modelo puro y `prepNotesStore`
nunca se prueba contra un disco que falla.

---

## 🐛 `R9-58` (P2, severidad **baja**) — matar la app (o cerrar la pestaña en web) pierde hasta 700 ms de tecleo: `use-debounce` expone `flushOnExit` y no se usa

`app/features/prep/index.tsx:1024-1042`

**Qué pasa.** El debounce es de **700 ms** (`:1033`). El agente desminificó
`use-debounce@10.1.1` y verificó que, al desmontar, su effect interno solo pone
`mounted.current = false` (lo que hace que `timerExpired` salga sin invocar) **pero no limpia
el `setTimeout`**, y `flush()` solo mira si hay handle de timer, sin consultar `mounted`. Por
eso el `flush()` de `:1042` **sí funciona** aunque React corra primero el cleanup del hook —
**confirmado con sonda** (`A9probe.test.tsx` PROBE 1, pasa: teclear y desmontar al instante
persiste el texto). **El arreglo documentado en `:1021-1041` es correcto.**

Lo que **no** cubre: un flush de desmontaje no corre si el proceso muere (swipe-away, OOM,
cierre de pestaña en web). La versión 10.1.1 trae la opción `flushOnExit` (añade un listener
de `visibilitychange` que hace flush al pasar a _hidden_) y no se usa en ningún lado del
repo.

**Escenario de fallo.** El predicador escribe una frase y desliza la app fuera de recientes
antes de 700 ms. Esa frase no existe.

**Caminos de salida auditados uno por uno** (esto es el valor principal de la fila):

| Salida                                                                  | ¿Persiste? | Por qué                                                                                                                         |
| ----------------------------------------------------------------------- | ---------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Desmontar (back de hardware que hace pop)                               | ✅         | `flush()` en `:1042`, **probado**                                                                                               |
| `onBlur` del campo                                                      | ✅         | `:1053` guarda de inmediato                                                                                                     |
| «Modo púlpito» (`:975-991`)                                             | ✅         | `await Promise.all` de todas las secciones antes de navegar                                                                     |
| «Banco de ilustraciones» (`:940-960`)                                   | ✅         | ídem                                                                                                                            |
| Historial (`:914`) / Series (`:924`) / salto a ref. cruzada (`:835`)    | ✅         | no hacen flush, pero la pantalla **sigue montada** y el trailing call dispara a los 700 ms                                      |
| Cambio de pasaje por stepper (`:843`) o por `setParams` (`:871`,`:894`) | ✅         | el `passageKey` viaja **como argumento** del debounce (`:1048`), así que el trailing call escribe bajo la clave vieja, correcta |
| Kill de la app / cierre de pestaña web                                  | ❌         | ver arriba                                                                                                                      |

---

## 🐛 `R9-59` (P2, severidad **baja**) — `@prep_notes` no se limpia al cerrar sesión ni al cambiar de cuenta: en un teléfono compartido, el sermón sin terminar del predicador anterior queda a la vista del siguiente

`src/features/study/prepNotesStore.ts:26` · `src/features/study/prepNotes.ts:12-15`

**Qué pasa.** No existe ningún `removeItem`/`multiRemove` sobre `@prep_notes`,
`@prep_series`, `@prep_illustrations` ni `@prep_self_review` en todo el repo
(`grep -rn "clear()|multiRemove|removeItem" src/ | grep AsyncStorage` → ninguno toca claves
de prep). La clave tampoco está namespaceada por uid. El módulo se presenta como _"un
estudio sin terminar es del preparador, y de nadie más (privacy-first)"_ — pero la garantía
se cumple solo contra la nube, no contra la siguiente cuenta en el mismo aparato.

**Escenario de fallo.** Un pastor prepara en el teléfono compartido de la iglesia y cierra
sesión; el siguiente usuario entra, abre la Mesa (gratis) y lee el borrador. Con premium ve
además el Historial completo.

**Es un mecanismo DISTINTO de `R9-22`/`R9-23`:** allí el problema es la cola de escrituras
del `SyncEngine`; aquí **no hay sync ninguno** (el trabajo de la Mesa no tiene adaptador).

**Severidad honesta (criterio del agente, que comparto):** P2 y no P0 porque, a diferencia
de `R9-23`, **no hay fuga hacia afuera del dispositivo**, y el repo trata el resto de los
datos locales (progreso de lectura, logros) con la misma política device-scoped. **Decisión
para Victor:** si «device-local» debe significar también «visible para cualquiera que use el
aparato».

---

## ✅ Lo que salió LIMPIO, con evidencia

- **La clave de escritura es correcta.** `passageKey` + `section` es único, y el
  `passageKey` se pasa **como argumento** al debounce (`:1026`, `:1048`) en vez de leerse del
  closure, así que un guardado pendiente durante un cambio de pasaje escribe bajo la clave
  vieja, que es la correcta. **No es por ahí por donde se pierde texto** — se pierde por
  `R9-47`, que es la dirección contraria: la carga que vuelve tarde. (Era mi hipótesis
  principal al escribir el encargo y **quedó refutada**.)
- **El gating premium solo OCULTA, nunca borra.** `history.tsx:118`,
  `illustrations/index.tsx:145` y `series/index.tsx:125` hacen `if (!isPremium) return;`
  _antes_ de leer el store; `:218`/`:326`/`:289` renderizan el teaser en vez de la lista.
  Ningún borrado en ninguna ruta. Un ex-premium (reembolso, expiración) conserva todo intacto
  y además mantiene la salida gratuita «copiar esquema» para sacar su texto (solo el PDF es
  premium). **No hay P0 de dinero en la Mesa**, que era la otra hipótesis del encargo.
- **Las plantillas no huerfanizan por sí solas.** El picker solo se renderiza mientras el
  entry está vacío (`:2288`, `isPrepNotesEmpty(drafts)`), el `template` se estampa una vez en
  el primer guardado y ya nunca cambia (`prepNotes.ts:82`: `notes.template ?? template`), y
  `'application'` —el destino fijo del insertador de ilustraciones
  (`illustrations/index.tsx:106`)— está en las 4 plantillas (`prepTable.ts:153-158`). La
  **única** vía de huérfano es la de `R9-47` (probada en 2c).
- **El camino de PDF/compartir está bien defendido.** `pdfFileName`
  (`prepPdf.ts:115-125`) quita `/\:*?"<>|`, colapsa espacios, corta a 80 y cae a `'export'`
  si no queda nada; `sharePreparedPdf` (`sharePdf.ts:31-41`) envuelve la copia/renombrado en
  try/catch y comparte el temporal si falla; el fallo de generación sí produce toast
  (`index.tsx:1248`). Cubierto por 9 tests en `prepTableScreenPdfExport.test.tsx`.
- **Theming / i18n.** Cero strings crudos en inglés y cero hex literales en las 6 pantallas
  de `app/features/prep/`, salvo `pulpit.tsx:67-69` (`STAGE_BG`/`TEXT`/`DIM`), que es el par
  fijo de alto contraste del «modo escenario» opcional y está documentado como decisión
  deliberada — **excepción legítima, no violación**.
- **Cuidado teológico: sin dudas.** El copy de la Mesa invita a que el preparador escriba
  _sus_ palabras («para que llene con sus PROPIAS palabras en oración») y lleva su propio
  guardarraíl visible; no prescribe oraciones ni afirma doctrina discutible como consenso.

## Respaldo — ya cubierto por `R9-30`, con un dato que refuerza su severidad

El trabajo de la Mesa **no se sincroniza nunca** (`prepNotesStore.ts:8` lo dice explícito),
así que export/import es la única ruta. `BackupService.ts:104-116` solo enumera
`@prep_notes` y `@prep_series`; **faltan `@prep_illustrations`, `@prep_self_review` y
`@sermon_notes`**. Verificado de forma independiente
(`grep -rn "_KEY\s*=\s*'@'" src/features/ src/lib/` vs. la lista `KEYS`) y **coincide
exactamente con `R9-30`**, que ya lo reporta.

**El dato nuevo que no está en `R9-30`:** el copy de confirmación de importación
(`translations.ts:4167`) le promete al usuario «la Mesa de preparación» **en bloque**, y el
banco de ilustraciones —que su propio docstring describe como _"un predicador colecciona
ilustraciones, citas y analogías **durante años**"_— no tiene ninguna ruta de recuperación.
Perder el teléfono = perderlo entero.

## Altitud (una línea, como pedía el encargo)

`index.tsx` son 3467 líneas con ~35 `useState` en un solo componente. Lo relevante para esta
fila **no es el tamaño sino la consecuencia concreta**: el estado del pasaje
(`table`/`range`) y el del texto del usuario (`drafts`/`template`) viven en el mismo
componente sin ninguna relación explícita, y por eso una carga asíncrona puede aterrizar los
segundos sobre el primero sin que nada lo note — que es exactamente `R9-47`.

## Receta para reconstruir las sondas

Archivos (gitignoreados, vivían en el worktree del agente):
`_scratch/A9probe.test.tsx` (PROBE 1/2/3), `_scratch/A9probe_b.test.tsx` (2b),
`_scratch/A9probe_c.test.tsx` (2c).

1. **El worktree no tiene `node_modules`.** Crear una junction:
   `New-Item -ItemType Junction -Path <worktree>\node_modules -Target C:\projects\EternalStoneBibleAppV4\node_modules`.
   **Borrarla al terminar con `(Get-Item <ruta>).Delete()`** — un `rm -rf` seguiría la
   junction y borraría el `node_modules` real.
2. Copiar el arnés de `__tests__/prepTableScreenNotesRefocus.test.tsx` (es el único test de
   pantalla que usa el mock **stateful real** de AsyncStorage de `jest.setup.js`).
3. Dos ajustes de arnés, ninguno toca el código bajo prueba: mockear
   `@components/hints/ContextualHintBanner` a `() => null`, y `jest.spyOn(Animated, 'timing')`
   a un no-op (`TouchableOpacity` anima su propia opacidad en `componentDidUpdate` y bajo
   react-test-renderer lanza _"Unable to locate attached view in the native tree"_ cuando el
   botón pulsado se re-renderiza en el mismo commit).
4. Mockear `@lib/database.getVerse` para que los versículos ≥17 tarden 400 ms — un rango más
   ancho cuesta genuinamente más I/O; **es lo único que hace la inversión determinista**.
5. Sembrar con `savePrepNote`, renderizar, esperar
   `findByLabelText(p.sections.bigIdea.label)` (**no** `findByText('Juan 3:16')`: el
   encabezado aparece mientras el cuerpo sigue en el spinner), pulsar
   `` `${p.increase} ${p.rangeEndLabel}` ``, esperar 20 ms, pulsar
   `` `${p.decrease} ${p.rangeEndLabel}` ``, esperar 900 ms, `fireEvent(input, 'blur')`, leer
   `getAllPrepNotes()`.
