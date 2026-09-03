# 🐛 Bugs — Revisión profunda 2026-09

> Resumen corriente de todo lo marcado `🐛 BUG` en [`INDEX.md`](INDEX.md), P0 primero.
> Cada entrada lleva: severidad, área del índice, `file:line`, pasos de repro y
> evidencia. **Nada aquí se arregla en esta revisión** — arreglar es una sesión aparte
> (charter §1).
>
> Numeración: `R9-1`, `R9-2`, … (el prefijo evita confundirlas con los `BUG-N` de la
> revisión Fable de julio).
>
> `main` está verde (`npm run validate` pasa), así que **cualquier fallo nuevo que esta
> revisión haga aparecer es una regresión real.**

---

## P0 — dinero, identidad, pérdida de datos, seguridad

- **`R9-9` (A1, entitlements) — 🐛 la revocación de la entitlement premium no se propaga
  nunca.** Severidad **alta**. Es dinero: acceso de pago que sobrevive al reembolso, y
  premium gratis para el segundo usuario de un dispositivo compartido.
  `src/lib/offering/offeringService.ts:121` corta con
  `if (unlocked === lastKnownUnlocked) return;`, y `lastKnownUnlocked` se inicializa a
  `false` en cada arranque del proceso (`:112`). En cualquier arranque en el que
  RevenueCat reporte la entitlement **inactiva**, ese dedupe (`false === false`) corta
  **antes** de `setCachedEntitlement(unlocked)` (`:123`) y **antes** de notificar a los
  listeners (`:124-133`). Un `'true'` viejo en la caché de `expo-secure-store` no se
  corrige jamás. `PremiumContext` se siembra de esa caché al montar
  (`src/context/PremiumContext.tsx:57-61`) y después solo escucha **cambios** (`:64-66`)
  — que ya no van a llegar.
  **Nada lo repara:** `grep` de `SecureStore` sobre `src/` + `app/` da **cero** usos
  fuera de `entitlementCache.ts`. Ni el cierre de sesión, ni el borrado de cuenta, ni el
  reset de Ajustes limpian la clave; y `linkUser()` está documentado a propósito para no
  revocar en el sign-out (`offeringService.ts:200-205`). Solo una desinstalación la
  borra.
  **Repro (verificado con sondas contra el `PremiumContext` y el `offeringService`
  reales + el mock oficial de `react-native-purchases`):** con la caché en `'true'` y
  RevenueCat reportando inactiva → `isPremium = true`, caché en disco `'true'`, y sin
  embargo `getLastKnownEntitlement() = false`. Igual con `linkUser('uid-B')` de un
  usuario sin compra. El **control** en la dirección contraria (caché vacía + RevenueCat
  activa) sí funciona: **el defecto es asimétrico, solo falla la dirección que quita el
  acceso.**
  **Corroboración:** `src/components/settings/ColorThemeSettings.tsx:60-74` tiene un
  `useEffect` cuyo comentario nombra el escenario textualmente ("_the entitlement is
  later revoked (e.g. a refund)_"). Ese revert depende de que `isPremium` pase a `false`,
  que es justo lo que este bug impide. Igual en `ReaderPreferencesSheet.tsx:128-150`.
  **Arreglo sugerido (no aplicado):** el dedupe está bien para no notificar de más; lo
  que está mal es tomar `false` como estado inicial **conocido** cuando en realidad es
  "todavía no sé". Opciones: (a) sembrar `lastKnownUnlocked` desde la caché en
  `initialize()`; (b) escribir siempre la caché y dejar el dedupe solo para la
  notificación; (c) `lastKnownUnlocked: boolean | null` con `null` = sin resolver.
  Detalle completo en `detail/A1-premium-revenuecat.md`.

- **`R9-10` (A1, `PremiumContext`) — 🐛 la lectura tardía de la caché pisa el valor real
  de RevenueCat.** Severidad **media** (se auto-repara en el siguiente arranque), pero el
  usuario afectado es, por definición, uno que **ya pagó**.
  En `src/context/PremiumContext.tsx:54-72` la lectura asíncrona de caché y el listener
  de RevenueCat escriben el mismo estado sin orden garantizado; si el push de RevenueCat
  llega primero, el `setIsPremium(unlocked)` incondicional de la línea **59** lo
  sobrescribe con el valor viejo. Contradice el contrato que declara el propio docstring
  del módulo (`:5-8`: "_those come from RevenueCat's CustomerInfo … and win over anything
  written here_").
  **Repro (verificado, determinista, sin timers):** difiriendo la resolución de
  `getPremiumUnlocked()` y disparando entremedio `initialize()` con la entitlement activa
  → `tras push de RevenueCat: isPremium = true` … `tras resolver la caché: isPremium = false`.
  **Escenario:** usuario que pagó, arranque en frío con la primera lectura de
  `expo-secure-store` lenta (init del keystore de Android) y la caché aún sin reflejar la
  compra — p. ej. tras reinstalar, o tras una escritura fallida, porque
  `entitlementCache.ts:43-48` **se traga los errores de escritura**. Queda premium
  bloqueado toda la sesión.
  **Arreglo sugerido (no aplicado):** ignorar el resultado de la lectura de caché si un
  valor del listener ya llegó (basta un `ref` de "ya resuelto por RevenueCat"), en vez del
  `setIsPremium` incondicional de la línea 59.

- **`R9-11` (A5/A4, `SyncEngine`) — 🐛 una edición hecha durante un flush en vuelo se
  descarta en silencio.** Severidad **media-alta**. `SyncEngine.ts:1243-1247` borra de la
  cola por `collection+id` tras un push exitoso, sin mirar versión; `upsertQueueEntry`
  (`:490-497`) reemplaza la entrada en sitio ("newer wins"). Si el usuario reedita el mismo
  doc mientras `pushOne` está en vuelo, el filtro elimina la entrada **nueva** como si se
  hubiera empujado. **Escenario:** subraya en amarillo, lo cambia a verde durante el push →
  local queda verde, Firestore se queda **amarillo** para siempre; el teléfono que lo
  origina nunca lo ve. **Arreglo:** comparar identidad de entrada (`seq`/`queuedAt`), no
  solo de documento. Detalle: `detail/A5-escrituras-firestore.md`.

- **`R9-13` (A6, web) — 🐛 el lector web crashea en el primer render:
  `hasRedLetterData is not a function`.** Severidad **alta**.
  `ReaderPreferencesSheet.tsx:56` importa el símbolo del especificador **pelado**; en web
  Metro resuelve a `redLetterText.web.ts`, que **no lo exporta** (verificado). La llamada de
  `:121` está en el cuerpo del componente, así que corre aunque la hoja esté cerrada, y
  `BibleVersionProvider` **sí** está montado en web (`_layout.web.tsx:294`), de modo que el
  cortocircuito `!!selectedVersion &&` no protege. Como el `ErrorBoundary` es global y no
  hay boundary por ruta, **cae la app web entera**. Afecta a las 2 pantallas que renderizan
  la hoja en web: lector de capítulo (`chapter].web.tsx:358`) y entrada de diccionario
  (`dictionary/[slug].tsx:750`). **Regresión fechada:** `d753a6e` (2026-08-18). Invisible
  para `tsc` (resuelve al nativo) y para jest (preset nativo). **Pendiente:** confirmar si
  el build desplegado hoy ya incluye `d753a6e`. Detalle: `detail/A6-paridad-web-native.md`.

- **`R9-14` (A6, web) — 🐛 7 rutas web-alcanzables lanzan "must be used within a
  …Provider".** Severidad **media** (código P0, impacto acotado). El árbol web no monta
  `AuthProvider`, `ReadingProgressProvider`, `ReadingPlanProgressProvider`,
  `CustomPlansProvider`, `TogetherProvider` ni `DonationSheetProvider`, y sus hooks lanzan.
  Con el rewrite catch-all de `firebase.json`, una URL directa a `/features/timeline` (o
  badges, version-comparison, reading-insights, plan/[id], plan-builder, together) tumba la
  SPA entera. T21 arregló 4 hooks; faltaron estos 5. Conteo real **≥ 7** (no se barrió
  `src/`). Detalle: `detail/A6-paridad-web-native.md`.

- **`R9-22` (A3, sync) — 🐛 la cola de escrituras pendientes no está namespaceada por uid:
  lo que quedó sin subir de la cuenta A se escribe en la nube de la cuenta B.** Severidad
  **alta**. Verificado: `SyncEngine.ts:54` (`@sync_queue_v1`, sin uid), `types.ts:88-101`
  (`PendingWrite` sin uid), `:351` (`stop()` conserva la cola a propósito), `:1315`
  (`pushOne` escribe contra `this.uid`, el **activo ahora**). **Escenario:** Ana edita sin
  red y cierra sesión; Beto entra en el mismo teléfono; la cola se drena contra el uid de
  Beto — y como los ids de `memoryCards` son el `verseKey`, **estables entre usuarios**, la
  lápida de Ana borra la tarjeta de Beto en todos sus dispositivos. Peor si Ana acababa de
  importar un respaldo (`BackupService.ts:973-1026` encola su biblioteca entera).
  **Contraste que lo delata:** los cursores **sí** están namespaceados por uid (`:177`) y el
  flag de bulk push también (`:1146`). Detalle: `detail/A3-auth-borrado-cuenta.md`.

- **`R9-23` (A3, identidad) — 🐛 los datos locales del usuario anterior se suben en silencio
  a una cuenta de Google _nueva_.** Severidad **alta**. El prompt de migración vive **dentro
  del `catch`** de `auth/credential-already-in-use` (`AuthContext.tsx:378-428`); la rama de
  **éxito** de `linkWithCredential` (`:340-377`) no pregunta nada. **Escenario:** Ana cierra
  sesión (lo local se queda, por diseño) → sesión anónima sobre su almacén → Beto entra con
  un Google que nunca usó la app → `linkWithCredential` tiene éxito → sin prompt →
  `maybeRunInitialBulkPush` sube **todas** las notas privadas de Ana a `users/{uidBeto}/`.
  Ana ya no puede borrarlas. **Arreglo:** persistir `@local_store_owner_uid` y disparar el
  `askMigration()` que ya existe cuando el dueño difiere del uid entrante.
  Detalle: `detail/A3-auth-borrado-cuenta.md`.

- **`R9-27` (A7, respaldo) — 🐛 una sección degradada en el export es indistinguible de una
  vacía, y al importar BORRA los datos buenos.** Severidad **alta**. Verificado:
  `BackupService.ts:569` devuelve `{payload, degradedSections}` — la marca es **hermana** del
  payload y **nunca entra al archivo**; muere en `DataSettings.tsx:88-99`. La guarda
  `allRowsFailedValidation` (`:915-920`) solo salta con `sourceLen > 0`, así que una sección
  degradada pasa como "vacío legítimo". **Escenario:** una lectura SQLite lanza durante el
  export (7 lecturas en `Promise.all`, y el wrapper documenta fallos intermitentes) → el
  archivo sale con `"favorites": []` → meses después el import hace `DELETE` + 0 inserts y
  dice «importada correctamente». Con `prep.notes: null` es peor: los parsers devuelven `{}`
  **truthy**, así que se escribe `"{}"` y **la Mesa queda vacía**. Mesa, progreso por
  capítulo y logros **no tienen copia en la nube**: pérdida definitiva.
  Detalle: `detail/A7-backupservice.md`.

- **`R9-28` (A7, respaldo) — 🐛 ningún contexto se recarga tras el import y la UI no pide
  reiniciar: el estado en memoria reescribe encima de lo restaurado.** Severidad **alta**.
  El docstring de `importBackup` (`:1073-1074`) afirma _"see Settings' import handler, which
  asks the user to close and reopen the app"_ — **verificado que la UI no lo hace**:
  `importSuccess` es solo «Copia de seguridad importada correctamente.» en un toast
  (`DataSettings.tsx:147`). **Escenario:** el import escribe `@memory_deck`;
  `MemoryDeckContext` sigue montado con el mazo viejo en `useState`; el primer repaso
  dispara el `useEffect` de `:192-197` y persiste el mazo **anterior**. El mazo restaurado
  desaparece sin toast, sin error, sin log. Mismo patrón en `ReadingProgressContext`,
  preferencias de lector, tema y planes. Detalle: `detail/A7-backupservice.md`.

---

## P1 — núcleo de la app

- **`R9-15` (A6, tests) — 🐛 el único test que renderiza el lector web enmascara
  exactamente `R9-13`.** `__tests__/chapterReaderWebFontPicker.test.tsx:41` mockea el
  especificador **`.web` explícito**, pero el componente importa el **pelado**; con preset
  nativo ese import carga el archivo nativo (que sí exporta el símbolo) y el mock nunca se
  aplica. Por eso `d753a6e` se mergeó con CI verde. **Arreglo:** redirigir el especificador
  pelado, como ya hace `webStubProviders.test.tsx:516-532`.

- **`R9-16` (A2, dinero) — 🐛 `restore()` confunde "no tienes compra" con "falló la red".**
  `offeringService.ts:325-331` devuelve `{unlocked:false}` en el `catch`, el mismo valor que
  un restore correcto sin compras, y `OfferingSheet.tsx:147-158` lo mapea a «No encontramos
  una ofrenda anterior en esta cuenta.». A quien **ya pagó** y restaura con mala señal se le
  afirma que su compra no existe. Dos tests **congelan la confusión** como esperada.

- **`R9-17` (A2, dinero) — 🐛 `purchaseUnlock` declara `success` sin comprobar que el
  entitlement quedó activo: cobrado, agradecido y bloqueado.** `offeringService.ts:292-298`
  no evalúa `isEntitlementActive(customerInfo)` — aunque `restore()` (`:324`) sí lo hace
  sobre el mismo dato. Si el `CustomerInfo` no trae aún `extras` (mapping mal configurado en
  el dashboard, propagación lenta), Play cobra, la hoja dice «Gracias por sembrar en esta
  obra» y **todo sigue bloqueado**, sin ruta de auto-reparación.

- **`R9-18` (A2, dinero) — 🐛 no se contempla el pago PENDIENTE: a quien paga en efectivo
  (OXXO/SPEI) se le dice que la ofrenda falló.** `offeringService.ts:261-282` solo mapea 2
  códigos; el resto cae al error genérico. En el mercado principal de la app el pago en
  ventanilla termina en transacción **pendiente**: hoy se le muestra «No se pudo completar
  la ofrenda. Inténtalo de nuevo.» y se le pide repetir un pago que sí está en curso.
  Igual en `DonationSheet:93-96`.

- **`R9-19` (A2, dinero) — 🐛 `DonationSheet` nunca maneja `alreadyOwned`.** Verificado:
  `grep` de `alreadyOwned` sobre `src/`+`app/` da **un solo** consumidor
  (`OfferingSheet.tsx:125`). El arreglo `327fc26` se hizo solo en la ofrenda. Si el recibo de
  una donación no se liquida, cada reintento de **ese importe** cae al `else` con «No se
  pudo completar la donación», **para siempre**, y esta hoja **no tiene enlace de
  restaurar**: el tier queda muerto tras haber cobrado una vez.

- **`R9-24` (A3, copy) — 🐛 el diálogo de "Eliminar cuenta" manda al usuario a un botón que
  NO borra sus datos.** `translations.ts:3888-3889` (es) / `:10416-10417` (en) dicen que use
  "Resetear Datos de la Biblia"; **verificado** que `data-loader.ts:144-166` solo hace
  `DELETE FROM verses` + `verses_fts` + flags de packs, y su propia copy (`:4141-4142`) dice
  que favoritos/notas/resaltados **no se ven afectados**. No existe en la app ninguna acción
  que borre el contenido local. Quien vende su teléfono y sigue la instrucción deja sus notas
  privadas intactas para el siguiente dueño — y sirven de munición a `R9-23`.

- **`R9-25` (A3, cuota) — 🐛 `deleteAllCloudData` lee y borra sin límite ni lotes.**
  `deleteAccountData.ts:52-76`: `.get()` **sin `limit()`** por cada una de 8 colecciones +
  `Promise.allSettled` de todos los deletes a la vez, con puerta todo-o-nada (`:78-82`).
  Contraste interno: `SyncEngine.cleanupOldReviewEvents` (`:864-921`) sí pagina a 200 y borra
  secuencialmente. Una cuenta con ~7 000 `reviewEvents` gasta ~14 % de las lecturas y ~35 %
  de las escrituras **diarias de todo el proyecto**, y si falla a mitad muestra "No se pudo
  eliminar tu cuenta" con parte ya borrada.

- **`R9-29` (A7, cuota) — 🐛 el import empuja una escritura Firestore por entidad y revive
  la ruta `reviewEvents` que se eliminó por cuota.** `BackupService.ts:962-1028`. El
  comentario de `:1020-1027` afirma seguir _"the same 12-month window every other write path
  honors (MemoryDeckContext.reviewCard)"_ — **esa afirmación ya es falsa**: `reviewCard` no
  sube nada desde el cambio local-first, así que el import es hoy el **único escritor** de
  esa colección. ~7 300 escrituras en ráfaga ≈ 37 % de la cuota diaria compartida; y
  `persistQueue()` por entrada lo hace O(N²) en el hilo JS.

- **`R9-30` (A7, respaldo) — 🐛 el respaldo omite contenido escrito por el usuario que no
  tiene copia en la nube, incluidas 2 partes de la propia Mesa.** `BackupService.ts:104-116`
  solo cubre `@prep_notes` y `@prep_series`. Faltan **`@prep_illustrations`**,
  **`@prep_self_review`**, **`@sermon_notes`**, `@custom_plans` (el respaldo trae el
  _progreso_ del plan pero no su definición), oración, testimonio, devocionales, diario de
  emociones, `saved_comparisons`, insignias/títulos, y los favoritos/progreso de
  facts/journeys/profecías/kids/quiz. Solo 6 colecciones existen en Firestore, así que todo
  eso **no tiene ninguna ruta de recuperación**, contra lo que promete la UI
  (`translations.ts:4176`).

---

## P2 — resto + pulido

- **`R9-12` (A5, `SyncEngine`) — 💡 no se usa `writeBatch` en ningún lado; los bucles
  empujan de a un documento.** `SyncEngine.ts:1238-1240` empuja secuencialmente y
  `firestore.ts:94` lo dice explícito ("_not needed yet_"). Afecta a subrayar una selección
  entera, a `resetDeck()` y sobre todo a la restauración de un respaldo. **No es cuota**
  (Firestore cuenta documentos, y son N documentos igual): es latencia y exposición a fallo
  parcial. La cola se persiste, así que no se pierden. Cruza con `R9-29`.

- **`R9-20` (A2, backend) — 💡 el endpoint de canje no valida la forma del código antes de
  gastar Auth+Firestore.** `redeem.ts:114-121`, `:159`. Un `{"code":"AB/CD"}` produce una
  ruta de colección y sale un 500 donde tocaba un 400. Y cada POST basura consume un
  `verifyIdToken` + una lectura antes de mirar la cadena; como Vercel Hobby tiene **tope duro
  sin facturación por exceso** (elegido a propósito), suficientes POST dejan el canje **fuera
  de servicio**. **La fuerza bruta NO es la preocupación** (31⁸ ≈ 8,5·10¹¹). Un regex lo
  cierra.

- **`R9-21` (A2, backend) — 💡 si el grant funciona pero falla el marcado, el código vuelve
  a la piscina en silencio.** `redeem.ts:189-213` loguea por `console.error` y devuelve 200.
  El código sigue figurando como disponible, así que un segundo usuario puede canjearlo y
  obtener otro entitlement vitalicio. Sin alerta ni campo barrible. **Adjunto:** el
  comentario de `:194-196` remite a un tradeoff que **no está en la cabecera de este
  fichero** — está en `functions/src/index.ts`, la copia no desplegada. Puntero colgante.

- **`R9-26` (A3, auth) — 💡 tras eliminar la cuenta la app probablemente se queda sin
  usuario hasta el siguiente arranque.** `AuthContext.tsx:569` rearma
  `triggeredAnonymousRef` **después** de `deleteUser`, al revés que `signOut` (`:463` antes
  de `:464`), así que el evento `null` llega con la bandera aún en `true` y no relanza el
  sign-in anónimo. Rompe el contrato de la cabecera ("siempre hay uid estable") y deja los
  Crashlytics de esa sesión sin identificar. **Pendiente de verificar en dispositivo.**

- **`R9-31` (A7, respaldo) — 💡 la restauración no aísla a los demás escritores de SQLite ni
  propaga los borrados a la nube.** `BackupService.ts:1277-1278` usa `withTransactionAsync`,
  no la variante **exclusiva**, así que escrituras de otros módulos (incluido el listener de
  sync, que sigue enganchado) caen dentro de la transacción y se pierden en un rollback. Y el
  push solo hace `queueWrite`, nunca `queueDelete`: lo que el restore borró sigue en
  Firestore y **vuelve** en una reinstalación. "Restaurar = reemplazar" degrada a "restaurar
  = mezclar".

- **`R9-32` (A7, respaldo) — 💡 el archivo de respaldo se escribe en caché y nunca se
  limpia.** `BackupService.ts:586-590`. `shareAsync` resuelve al cerrarse la hoja, no cuando
  un destino guardó el archivo, y no hay toast de éxito **ni de fallo**: descartar la hoja se
  da por bueno y el usuario cree tener un respaldo que solo existe en un directorio que el
  sistema puede desalojar. N exports = N copias completas acumuladas.

- **`R9-2` (B2, `.gitignore`) — 💡 el `.gitignore` raíz solo cubre `.env*.local`, no un
  `.env` pelado.** Severidad **baja** (hardening), arreglo de una línea.
  `.gitignore:48` es `.env*.local`, así que `.env`, `.env.production`, `scripts/.env` y
  `src/.env` **no** están ignoreados — y el repo es **público**
  (`"visibility": "public"`).
  **Repro:** `git check-ignore -v .env` → sin match; comparar con
  `git check-ignore -v functions/.env` → sí matchea (`functions/.gitignore:13`).
  **Por qué NO es P0:** los dos directorios que manejan secretos de alto valor ya se
  cubren solos — `functions/.gitignore` tiene `.env`, y `vercel/gift-code-redeem/.gitignore`
  tiene `.env*`. En la raíz y en `scripts/`/`src/` hoy no hay nada sensible (los
  `process.env` de `scripts/` son rutas y flags; la convención de Expo en la raíz es
  `EXPO_PUBLIC_*`, público por diseño), y no existe un `.env.example` que empuje a
  crear uno.
  **Por qué vale arreglarlo:** el radio de daño si se equivoca es total — el service
  account de Firebase que consume `vercel/gift-code-redeem/api/redeem.ts:36` salta
  _todas_ las reglas de Firestore, y la clave secreta de RevenueCat (`:220`) otorga
  entitlements gratis. `.env` en la raíz es el nombre más natural y basta un
  `git add .`.
  **Arreglo sugerido (no aplicado):** `.env*.local` → `.env*` en `.gitignore:48`.

- **`R9-3` (B3, limpieza) — 💡 3.3 MB de artefactos de Yarn trackeados en un repo que
  usa npm.** Severidad **muy baja**, no es seguridad.
  Siguen trackeados `.yarn/releases/yarn-3.6.4.cjs` (2 231 402 bytes) y
  `.yarn/plugins/@yarnpkg/plugin-interactive-tools.cjs` (1 074 996 bytes), restos de la
  era Yarn del commit inicial, mientras el repo usa npm: hay `package-lock.json`, no hay
  `yarn.lock`, y `package.json` no tiene campo `packageManager`.
  **Repro:** `git ls-files | grep '^\.yarn/'` → 2 archivos.
  **Efecto secundario que vale:** ese bundle minificado es la única razón por la que un
  escáner de secretos sobre este repo reporta un falso positivo de `AKIA` (fragmentos
  `AKIA4QI`/`AKIA9`/`AKIAE`, ninguno con la forma AWS de `AKIA`+16). Borrarlos limpia el
  ruido además del peso. Encaja en la fila `B9`; se registró en `B3` porque ahí se
  encontró.

- **`R9-4` (B4, proceso) — 💡 las reglas de seguridad de Firestore no están versionadas
  en el repo.** Severidad **baja-media**: no es un hueco explotable hoy, es riesgo
  operativo. Las reglas vivas son correctas (default-deny + `request.auth.uid == uid`,
  ningún path abierto — auditado en `detail/B4-reglas-firestore-storage.md`), pero
  existen **solo en la consola de Firebase**.
  **Repro:** `git ls-files | grep -iE '\.rules$'` → 0 archivos; `firebase.json` solo
  tiene `react-native`, `functions`, `hosting` — ni sección `firestore` ni `storage`.
  **Por qué importa:** el control de acceso de toda la app es el único componente de
  seguridad que se salta el proceso que el resto del código sí respeta — sin diff, sin
  PR, sin CI, **sin rollback**. `firebase deploy --only firestore:rules` no funciona
  sin la sección en `firebase.json`, así que el despliegue seguirá siendo manual, que
  es justo el modo en que se relaja una regla sin querer. Hoy reglas y código coinciden
  por suerte estructural (el comodín `{collection=**}` cubre toda colección nueva bajo
  `users/{uid}/`), no por verificación.
  **Arreglo sugerido (no aplicado):** volcar el texto vivo a `firestore.rules` (ya está
  capturado íntegro en el detalle de `B4`, así que es mecánico) + añadir
  `"firestore": {"rules": "firestore.rules"}` a `firebase.json`.

- **`R9-5` (B5, CI) — ⚠️ el job "Security Audit" no puede fallar nunca.** Severidad baja
  como riesgo, pero induce a error activamente. Los dos únicos pasos del job
  (`npm audit --audit-level=moderate` y `npm outdated`) llevan ambos
  `continue-on-error: true`, así que el job **sale verde siempre**.
  **Repro:** cualquier run reciente en Actions → "Security Audit" verde; local
  `npm audit --audit-level=moderate` → exit code ≠ 0 (8 vulns, 1 HIGH, ver `B1`).
  **Por qué importa:** quien mire los checks de un PR concluye "la auditoría de
  seguridad pasó" cuando en realidad se ejecutó y se ignoró el resultado.
  **Opciones (no aplicadas):** quitarle el `continue-on-error` a `npm audit` ahora que
  `B1` ya clasificó las 8 y dejó justificadas las inevitables; o renombrar el job a
  "Dependency Report" para que el nombre no prometa una garantía que no da.
  (`npm outdated` sí necesita la bandera: devuelve 1 siempre que haya algo atrasado.)

- **`R9-6` (B5, CI) — 💡 endurecimiento: sin bloque `permissions:` y acción de terceros
  en tag mutable.** Severidad **baja**, hoy mitigado por configuración del repo.
  (a) `ci.yml` no declara `permissions:` en ningún nivel, así que el `GITHUB_TOKEN`
  hereda el default del repo — que hoy **es `"read"`** (verificado por API), o sea sin
  escalada real; pero es un ajuste de settings mutable desde la UI sin dejar rastro en
  git. (b) `codecov/codecov-action@v4` es de terceros sobre un tag **móvil**, y
  `sha_pinning_required` del repo es `false` (Codecov tiene precedente de compromiso de
  cadena de suministro, 2021).
  **Por qué NO es urgente:** el repo tiene **0 secretos de Actions** (`total_count: 0`)
  y el token es read-only, así que una acción comprometida no podría exfiltrar
  credenciales ni pushear — a lo sumo falsear el resultado del job.
  **Arreglo sugerido (no aplicado):** `permissions: {contents: read}` a nivel workflow +
  fijar la acción de Codecov a SHA completo.

- **`R9-7` (B1b, `functions/`) — ✅ RESUELTO 2026-09-03.** Era: código no desplegado que duplica la lógica de dinero, y
  `firebase.json` todavía lo declara.** Severidad **baja-media** (mantenimiento en una
  ruta P0, no un bug hoy).
  `functions/src/index.ts` implementa el canje de gift-codes completo **en paralelo** al
  de Vercel — los dos leen `db.collection('giftCodes').doc(code)`
  (`functions/src/index.ts:204` vs `vercel/gift-code-redeem/api/redeem.ts:159`) y los dos
  llaman a RevenueCat con la clave secreta. Pero la app solo llama a Vercel
  (`src/lib/offering/giftCodeService.ts:44` → `https://essb-gift-redeem.vercel.app/api/redeem`).
  **Repro:** `git log --oneline -- functions/` → 1 solo commit (`ca69aca`), reemplazado
  por `c3650f0` ("port redemption endpoint to Vercel's free tier"); `functions/node_modules`
  no existe; el proyecto está en plan Spark (Cloud Functions necesita Blaze).
  **Por qué importa:** (a) deriva silenciosa — un arreglo de canje aplicado en Vercel deja
  atrás la copia invisible, y son dos implementaciones del mismo gate de pago;
  (b) `firebase.json` sigue con `"functions": [{"source": "functions", "predeploy": …}]`,
  así que un `firebase deploy` sin `--only hosting` intentaría desplegarlo.
  **Resolución:** Victor pidió primero borrarlo; al revisar el objetivo antes de borrar
  apareció un dato que faltaba en este hallazgo — `functions/` **no está olvidado, está
  conservado a propósito**, y la razón ya estaba escrita en
  `src/lib/offering/giftCodeService.ts`: Cloud Functions exige el **plan Blaze**, que
  convierte el proyecto Firebase **entero** a facturación con sobrecosto, mientras el
  tier Hobby de Vercel tiene tope duro. Con ese dato se recomendó **no borrar**, y Victor
  estuvo de acuerdo. Aplicado:
  (a) se quitó la sección `functions` de `firebase.json` — mata la trampa concreta de
  despliegue (ahora `firebase deploy` solo publica hosting);
  (b) se agregó `functions/README.md`, que lo etiqueta como NO DESPLEGADO, explica el
  motivo de Blaze, señala que la fuente de verdad es `vercel/gift-code-redeem`, **avisa
  que esta copia está atrasada en mantenimiento** (la de Vercel recibió `d97516b`) y deja
  los 5 pasos si alguna vez se despliega, incluida la sección JSON exacta que se quitó;
  (c) punteros al README desde `giftCodeService.ts` y `.prettierignore`.
  **Por qué no se borró:** conservarlo cuesta cero medible (no compila, no testea, no
  entra al bundle, no lo toca `npm run validate`), el riesgo de deriva exige pasar a
  Blaze — un acto deliberado de mucha fricción — y borrarlo sí destruye la salida de
  emergencia de un solo proveedor en una ruta de dinero. El problema del "duplicado
  invisible" se resolvió haciéndolo visible y etiquetado.

- **`R9-8` (B1b, subproyectos) — 💡 replicar el `override` de `uuid` que la raíz ya
  tiene.** Severidad **baja**; cierra la única vuln de runtime desplegado sin tocar
  `firebase-admin`.
  De las 26 vulns de `functions/` + `vercel/` (incluidas **7 HIGH**), la única en el
  runtime realmente desplegado es `uuid@9.0.1` vía `firebase-admin@13.10.0` →
  `google-gax`/`gaxios`/`teeny-request` (todas las HIGH salen de `@vercel/node`, que es
  **devDependency** = tooling de build/`vercel dev`, no viaja al lambda).
  GHSA-w5hq-g745-h8pq afecta solo a `v3`/`v5`/`v6` **con** argumento `buf`; esas libs
  usan `uuid.v4()` → **no alcanzable**, pero es trivial de cerrar.
  **Ojo, misma trampa que `R9-1`:** el fix de npm es
  `firebase-admin@10.3.0` — un **downgrade** desde 13.10.0 que además revertiría
  `d97516b` ("pin firebase-admin to 13.x, avoiding a broken jose/jwks-rsa ESM chain").
  **Arreglo sugerido (no aplicado):** `"overrides": {"uuid": "^11.1.1"}` en
  `vercel/gift-code-redeem/package.json`. **Este override SÍ funciona** (a diferencia del
  de `R9-1`): `uuid@11.1.1` trae build dual (`exports.node.require → ./dist/cjs/index.js`)
  y la **raíz ya lo corre con ese mismo override** con `npm run validate` en verde.
  Verificar con un canje real contra el endpoint desplegado antes de darlo por cerrado.

---

## ⚠️ Dudas / parciales

- **`R9-1` (B1, remediación de vulns) — ⚠️ TRAMPA: `npm audit fix --force` rompería la
  app entera.** No es un bug de la app; es una mina para una futura sesión de arreglos.
  `npm audit` reporta, para las 3 filas de la cadena `expo-router` → `query-string` →
  `decode-uri-component`, `fixAvailable: {"name":"expo-router","version":"5.1.11","isSemVerMajor":true}`.
  El instalado es **`expo-router@57.0.12`** (declarado `~57.0.12`, fijado por Expo SDK
  57), así que la "corrección" es un **downgrade de 52 majors** que destruiría todo el
  routing de `app/`. `npm audit` lo dice en su propia salida:
  `Will install expo-router@5.1.11, which is a breaking change`.
  **Repro:** `npm audit` en la raíz y leer el bloque `fixAvailable` de
  `decode-uri-component` / `query-string` / `expo-router`.
  **Qué hacer:** `npm audit fix` a secas es seguro (solo toca `firebase-tools` y
  `@expo/plist`, ambos dev/build). **Nunca `--force`.** La vía de `overrides` tampoco
  sirve: el parche `decode-uri-component@0.5.0` es ESM-only y `query-string@7.1.3` lo
  consume con `require()`. Lo correcto es no tocar nada — las 3 no son alcanzables
  (detalle en `detail/B1-npm-audit.md`) y se resuelven cuando `expo-router` migre a
  `query-string` 8+.

---

## Heredado de la revisión Fable (julio 2026) — CERRADO

- **BUG-10 (profecías, "Siguiente" no reseteaba el scroll) — ✅ CERRADO.** El charter
  §3 lo listaba como semilla abierta; ese dato estaba obsoleto. Verificado el
  2026-09-03: `app/features/prophecies/index.tsx:297-299` tiene un
  `useEffect(() => scrollRef.current?.scrollTo({y: 0, animated: false}), [phase])` con
  un comentario que cita explícitamente "QA BUG-10". Arreglado en `b17ec99`
  ("fix: prophecies back-nav returns to hub first, plus scroll-reset on step change"),
  confirmado como ancestro de `main`. El arreglo cubre más que el repro original
  (Anterior/Siguiente, salto desde el índice, tarjeta "hoy", auto-avance narrado).
- **BUG-1 … BUG-9, BUG-11, BUG-12 — reportados como cerrados** en las tandas A–E del
  mismo día (2026-07-14/15). **No re-verificados en vivo** en esta revisión; si el
  Modo C toca su área, vale una comprobación de paso.
