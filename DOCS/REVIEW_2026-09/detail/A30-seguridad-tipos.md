# A30 — Seguridad de tipos: `any` / `as` / `@ts-ignore` / `!`

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 125 (2026-11-03, chat nuevo; con 8 agentes a
> pedido de Victor, 6 en esta fila) · Estado **🐛 BUG**

> **Resultado:** 5 hallazgos (`R9-467` P2; `R9-468`..`R9-471` P3), ninguno P0, y dos sumas: a `R9-461` (más
> pantallas que caen con un param repetido) y a `R9-421` (candidato sin medir: Sepia por el respaldo). De 835
> marcas (709 `as`, 62 `!`, 64 `any`, 0 `@ts-ignore`/`@ts-expect-error`), casi todas son honestas: van después de
> un normalizador, sobre datos del bundle o sobre la API de una librería. Las que mienten están donde el dato
> llega de afuera sin pasar por uno: un param (`R9-467`, `R9-471`, la suma a `R9-461`), la respuesta de una
> librería nativa que cambió de forma (`R9-468`), un borrador de la pantalla de conflictos (`R9-469`) y una clave
> del respaldo (`R9-470`).

> **Cómo se midió:** el barrido con el parser de TypeScript (`_scratch/S125-inventario.cjs.txt` →
> `S125-inventario.tsv.txt`, 516 archivos de `src/` y `app/`, sin pruebas ni `.d.ts`), y seis agentes (`fork` en
> worktree, sobre `12f46df`) que solo midieron, cada uno con una fuente del dato: 1, lo guardado en el
> dispositivo; 2, respaldo, sync, Firestore, «Juntos» y `AuthContext`; 3, params, enlaces y rutas; 4, red,
> RevenueCat, nativos y errores; 5, los `!`, los `any` restantes y SQLite; 6, pantallas y componentes. Las seis
> sondas de los hallazgos se re-midieron iguales en el principal con `_scratch/S116-correr.cjs.txt`. Los informes
> y las sondas, en `_scratch/S125-sondas-agente-{1..6}/`.

## El área

| Clase                                                                               | n   | Destino más común                                                                                                                                       |
| ----------------------------------------------------------------------------------- | --- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `as` (sin `as const`)                                                               | 709 | `never` 184 (rutas e íconos), `Error` 70, tuples de colores ~80, `keyof typeof Ionicons.glyphMap` 40, `Record<string, unknown>` 40, `TextStyle` 26      |
| `as unknown as`                                                                     | 8   | `SyncEngine.ts:1550`, `:1707`, `:2307`, `:3541`; `BackupService.ts:357`; `database/index.ts:1191`; `data-loader.web.ts:375`; `OnboardingScreen.tsx:433` |
| `!` no nulo                                                                         | 62  | 43 `this.db!` (`BadgeSystem.ts` 18, `PredictiveCache.ts` 13, `VersionComparison.ts` 12)                                                                 |
| `any`                                                                               | 64  | `AuthContext.tsx` 36 (firmas de los módulos nativos)                                                                                                    |
| `@ts-ignore` / `@ts-expect-error` / `@ts-nocheck` / `eslint-disable` de `any` o `!` | 0   | —                                                                                                                                                       |

Archivos con alguna marca: 199. Los más cargados: `app/(tabs)/index.tsx` (46 `as`), `AuthContext.tsx` (39),
`SyncEngine.ts` (28), `typography.ts` (26), `[chapter].tsx` (24), `BackupService.ts` (22).

## Hallazgos

- **`R9-467` (P2):** `app/features/collections/[name].tsx:64-67` decodifica dos veces el nombre (expo-router ya lo
  entrega decodificado): una colección «Promesas 100%» lanza `URIError` en el render y el `ErrorBoundary` se lleva
  la app; no se abre nunca. Sonda: `S125-a3-coleccionPorciento` (`renderRouter`), 3/3.
- **`R9-468` (P3):** `extractIdToken(signInResult: any)` (`AuthContext.tsx:252-262`) no conoce la cancelación de
  google-signin 16.x (`{type:'cancelled'}`); Ajustes (`settings.tsx:156-168`) la muestra como error y la registra.
  Sondas: `S125-a4-googleCancel` (librería real, `AuthProvider` y Ajustes reales) y `S125-a2-googleCancel`.
- **`R9-469` (P3):** «Combinar» (`conflicts.tsx:48-59`, `:206-226`, `merged as ConflictRecord['localVersion']`)
  guarda «—» o `"5"` sobre un campo que aquí es `null`, en local y en la nube. Sonda: `S125-a6-combinarTipos`
  (`SyncEngine` real), 3/3.
- **`R9-470` (P3):** `canonicalizeProgressMap` (`progressKeys.ts:36-44`) con la clave `__proto__` de un respaldo
  fabricado escribe en `Object.prototype` (familia de `R9-410`). Sonda: `S125-a1-protoProgreso` (`importBackup`
  real), 4/4.
- **`R9-471` (P3):** la vista previa de Widgets (`WidgetsDemoScreen.tsx:37-39`) manda `?highlight=` y el lector
  lee `verse`. Sonda: `S125-a3-widgetVersiculo`, 2/2.
- **Suma a `R9-461`:** con una clave repetida, también lanzan `prep/history.tsx:88-89`,
  `prep/illustrations/index.tsx:157`, `word-study.tsx:90`, `:92` y `lectio.tsx:89`. Sonda: `S125-a3-paramArreglo`,
  4/4. Solo a mano.
- **Suma a `R9-421` (sin medir):** `readerPreferencesFull` del respaldo (`BackupService.ts:181`, `:1244`,
  `:1365-1371`) entra con `sepiaGrandfathered: true` y abre Sepia sin premium; la propuesta de `R9-421` no lo cierra.

## Revisado sin hallazgo

- **Lo guardado en el dispositivo (agente 1):** 115 `as` de su alcance, 46 `JSON.parse` en 41 archivos (38 con
  normalizador o filtro de tipo; `ReadingPlanProgressContext` ya es `R9-411`/`R9-414`, la lectura fallida de
  `ReaderPreferencesContext` ya es `R9-413`) y 118 `getItem` (los numéricos con `parseInt` + `isFinite` o clamp;
  el `in colorThemes` ya es `R9-410`). Por `git log`, `PlanProgress`, `ReaderTextAlign`/`ReaderMargin`, `SrsBox`,
  `ReviewGrade`, `ShareAspect`, `AudioLanguage`, `GroupMembership` y `LastReadPosition` no cambiaron de forma (solo
  se agregaron campos opcionales). No alcanzable: `TogetherContext.tsx:67`, `CustomPlansContext.tsx:69`,
  `ReadingProgressContext.tsx:229` (un solo escritor, no viajan en el respaldo); las escrituras de un nivel con
  `"__proto__"` (`MemoryDeckContext:216-240`, `prepNotes:118`) solo cambian el prototipo de ese objeto.
- **Respaldo, sync, Firestore, «Juntos», cuenta (agente 2):** 116 filas. `parseBackupPayload` (`:690-703`) valida
  y cada fila pasa por su coerción (`:715-880`); `readJSON` (`:344-358`) solo alimenta la exportación; los planes
  sin validar ya son `R9-411`. `parseOwnTable`/`parseQueue` validan; `noteArrived` toma `data()` como `unknown`;
  `fetchResolvedConflicts` lo revisa `conflictAnalytics.ts:101-140`. Los `any` de `firestore.ts` y de 30 firmas de
  `AuthContext` tipan la API de la librería; ningún escritor usa `serverTimestamp()` (no hay `Timestamp` en los
  documentos). «Juntos»: cada `as number` va después de `isInt` o de un rango (`bundle.ts:574-700`,
  `devotionalDraft.ts:60-140`).
- **Params, enlaces y rutas (agente 3):** `S125-a3-rutas.cjs.txt` cruza 195 navegaciones (142 con `as never`, 11
  con destino dinámico) con las 80 rutas de `app/`: 0 rutas literales inexistentes y 1 caso de params que el
  destino no lee (`R9-471`); `S125-a3-rutasLiterales.cjs.txt`, 207 cadenas con forma de ruta: ninguna rota.
  `journeys/[routeId]` valida con `VALID_ROUTES.includes` antes del `as`; `kids/[storyId]`, `prayer/scripture/[passageId]`
  (`:141`), `PropheticReminderRouter.tsx:33-37`, `chapter/[book]` (y su `.web`), `about-book/[book]`, `feelings`,
  `memory/practice`, `plan-builder`, `dictionary` y `prep/index.tsx:925-945`: sanos. No re-derivado lo de `A27`.
- **Red, RevenueCat, nativos, errores (agente 4):** los 70 `(e as Error)` (`S125-a4-asError.cjs.txt`): 68 van a
  `logger.error` y 1 a `logger.warn`; ninguno decide por `.code`/`.message`/`.name` (con un no-`Error`,
  Crashlytics lo ignora con un aviso). Las decisiones por campo de error fuera de esos 70 están guardadas
  (`offeringService.ts:279-299`; su `PurchasesStatic` coincide con `react-native-purchases` 10.7.1;
  `PackDownloadError` con `instanceof`). Red: `data-loader.web.ts:172-214`, `redLetterText.web.ts:159-180`,
  `pack-catalog.ts:52-127` y `giftCodeService.ts:156-183` validan forma o van en `try`. TTS: `expo-speech` en
  Android solo da `Default`/`Enhanced` (`SpeechModule.kt:87`). Notificaciones: `NotificationService.ts:221`,
  `:802`, `:946` sanos.
- **Los `!`, los `any` y SQLite (agente 5):** los 43 `this.db!` van después de `await this.initialize()`, y la base
  nunca se cierra (`database/index.ts:398`, `:459-464`, `:1634`); los 6 `plan!` de `plan/[id].tsx` van después del
  `if (!plan) return` de `:264`; los 13 sueltos tienen su guarda o una clave del mismo `Map`. `executeSql():
Promise<any>` (61 llamadores) solo devuelve `rows._array` con `SELECT`, y todas sus lecturas lo son. 25 de los 31
  `getFirstAsync` con guarda; los 6 restantes devuelven `|| null` o están tipados `| null`. Ninguna tabla de
  usuario cambió de columnas desde que nació (`git log -L`; no hay `ALTER TABLE` en `src/`).
- **Pantallas y componentes (agente 6):** 393 filas clasificadas. Los 65 tuples de colores salen del gradiente de
  `useTheme` (64 combinaciones tema × franja, ninguna con menos de 2: `S125-a6-controles`, 4/4), de
  `celestialTheme.ts` o de literales. Los 47 `Record` y 5 `keyof` del diccionario llevan `?.`/`?? id` o una clave
  constante; las claves de afuera (sentimientos, insignias, categorías de oración) están guardadas
  (`languageUtils.ts:67-150`, `prayerStore.ts:37`). Íconos (42): de constantes; uno desconocido pinta «?», no cae.
  Los 26 `as TextStyle` de `typography.ts`: cosméticos.

## Sin medir

- La variante `%XX` de `R9-467` (la colección abriría vacía).
- `R9-470`: qué pantalla cae con el prototipo contaminado (Modo C, o una sonda de render).
- `R9-469`: qué hace el otro teléfono con un `rating` de texto (ninguna pantalla muestra el puntaje).
- La suma a `R9-421` (receta en `BUGS.md`).
- `constellation.tsx:121`, `reference-chain.tsx:83`, `study.tsx:125`, `prep/index.tsx:296` (params a funciones de
  libro: probablemente suman a `R9-461`).
- Los ~40 `getAllAsync<T>` genéricos de `database/index.ts`, uno por uno (una columna `NULL` entra por el respaldo o
  la sync).
- Las ramas de `SyncEngine.ts` que no son entrada de datos (relojes y cola), ya cubiertas por los R9 del P0.
- `prepAccount.ts:449-459`: cerca del Pendiente de la Mesa, no se siguió.
- Pendiente, sin medir: los 44 `push` a `/verse/<libro>` armados con texto de datos (anotado en `A27`).

## Cruce con las filas vecinas

- `A27` (deep links): `R9-467` y `R9-471` son de params, pero no de enlaces (llegan por la propia app); la suma a
  `R9-461` es suya.
- `A31` (código muerto): la rama «cancelado» de `settings.tsx:156-168` está muerta desde `4015a6a2` (es la raíz
  visible de `R9-468`); `AnimatedBottomNav.tsx` y `getLastReadPosition` sin consumidores (ver `A31`).
- `A13`/`A20` (lector, sync): `R9-469` se suma a los de la pantalla de conflictos (`R9-36`, `R9-160`), con otra raíz.
