# A3 — Auth (`AuthContext`) + borrado de cuenta

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 3 (2026-09-03) · Estado
> **🐛 BUG** (2 P0 + 2 P1 + 1 P2: `R9-22`..`R9-26`)
>
> Revisado por un agente en worktree; el orquestador **re-verificó a mano** las
> afirmaciones que sostienen `R9-22` y `R9-24`.

## Alcance

`src/context/AuthContext.tsx` (612 L, completo) · `src/context/SyncEngineContext.tsx`
(163 L) · `src/lib/sync/deleteAccountData.ts` (85 L) · de `SyncEngine.ts`:
`start`/`stop`, `queueWrite`/`queueDelete`, `hydrateQueue`/`persistQueue`,
`maybeRunInitialBulkPush`, `pushOne`, `cleanupOldReviewEvents` · `types.ts`
(`PendingWrite`) · `app/(tabs)/settings.tsx` (sección Cuenta) ·
`src/components/settings/DataSettings.tsx` + `data-loader.ts` (`resetBibleData`) ·
`translations.ts` (bloques `auth.*` y `settings.reset*`).

## Cobertura de tests

`__tests__/AuthContext.test.tsx` (único test de auth) cubre `mapFirebaseUser`, el
`signInAnonymously` exactamente-una-vez, `linkWithCredential` sobre anónimo, la caída a
`signInWithCredential`, **las dos ramas del prompt de migración** en
`auth/credential-already-in-use`, `signOut`, y el orden `engine.stop()` antes de
invalidar el token.

**Sin cobertura alguna:** `deleteAccount()` (**cero tests**, ninguno de sus 5 pasos, ni
`auth/requires-recent-login`, ni `restoreSync`) · `deleteAllCloudData()` (no existe
archivo de test; `USER_DATA_COLLECTIONS` no tiene guardia, así que un adapter nuevo que
falte ahí no lo avisa nada) · **el cambio de cuenta en el mismo dispositivo** (todos los
tests de SyncEngine usan un solo uid por caso).

Dato revelador: `__tests__/SyncEngine.test.ts:596-619` **codifica como comportamiento
esperado** justo lo que denuncia `R9-22` — siembra `@sync_queue_v1` a mano y afirma que
`start('uid-persist')` empuja esa entrada, sin relación alguna entre el uid que la encoló
y el que la escribe.

---

## 🐛 `R9-22` (P0, severidad **alta**) — la cola de escrituras pendientes no está namespaceada por uid: lo que quedó sin subir de la cuenta A se escribe en la nube de la cuenta B

**Archivos:** `src/lib/sync/SyncEngine.ts:54` (`const QUEUE_STORAGE_KEY = '@sync_queue_v1'`)
· `src/lib/sync/types.ts:88-101` (`PendingWrite` = `{collection, id, data, queuedAt,
attempts}` — **sin uid**) · `SyncEngine.ts:351` (`stop()`: _"Persisted queue survives"_,
no vacía la cola) · `SyncEngine.ts:1315` (`pushOne` escribe en
`` `users/${this.uid}/${item.collection}` `` — **el uid activo ahora**, no el que encoló).

Una entrada de la cola no recuerda a qué cuenta pertenece, y ni `stop()`, ni `signOut()`,
ni `deleteAccount()` la descartan. La cola se drena contra el uid que esté activo cuando
por fin haya red.

**Escenario de fallo (dispositivo compartido):**

1. Ana, con sesión iniciada y sin datos (metro, avión), edita una nota y borra una tarjeta
   de memoria de `GEN.1.1`. `queueWrite`/`queueDelete` encolan; `flush()` falla y **la cola
   se persiste**.
2. Ana cierra sesión → `signOut()` llama `stop()`, que conserva la cola a propósito.
3. Beto inicia sesión con su Google en el mismo teléfono → `SyncEngineContext:92-111` →
   `engine.start(uidBeto)` → `hydrateQueue()` → `flush()`.
4. `pushOne` escribe la nota de Ana en `users/{uidBeto}/notes/…` y **la lápida** de
   `GEN.1.1` en `users/{uidBeto}/memoryCards/GEN.1.1`. Los ids de `memoryCards` son el
   `verseKey` (`MemoryDeckContext.tsx:290`, `:317`), o sea **estables entre usuarios**: el
   borrado de Ana borra la tarjeta de Beto para ese versículo, en todos sus dispositivos.

**Variante peor:** si Ana acababa de importar un respaldo,
`BackupService.ts:973-1026` encola _toda_ su biblioteca — ese lote entero puede acabar en
la cuenta de Beto.

**Variante "el borrado no se sostiene":** Ana usa Eliminar cuenta con cola pendiente.
`deleteAccount` sí previene este riesgo para el bulk push (`AuthContext.tsx:517`,
`queueSkipNextBulkPush()`) pero **no toca la cola**; al volver a entrar con el mismo
Google (uid nuevo), la cola sobreviviente reescribe justo lo que pidió borrar.

**Confianza:** alta en el camino de código (verificado a mano por el orquestador: la clave
no lleva uid, `PendingWrite` no lleva uid, `stop()` lo conserva explícitamente y `pushOne`
usa `this.uid`); media en la frecuencia — exige escrituras sin drenar en el instante del
cierre de sesión. `queueWrite` no encola con motor inactivo (`:388`, `:413`), lo que acota
el **origen**, no el **destino**.

**Arreglo (no aplicado):** añadir `uid` a `PendingWrite` al encolar y descartar (o aparcar)
en `flush`/`hydrateQueue` toda entrada cuyo uid no sea el activo; o pasar la clave a
`@sync_queue_v1:{uid}`. Complementario: vaciar cola + storage en `deleteAccount` tras el
wipe. Guardia de test: encolar con uid A, `stop()`, `start(uidB)`, afirmar **0** escrituras.

**Contraste interno que lo delata:** los cursores de sync **sí** están namespaceados
(`SyncEngine.ts:177`, `` `${CURSOR_STORAGE_PREFIX}${collection}:${uid}` ``) y el caché en
memoria se vacía en `stop()` con un comentario que nombra el caso "DIFFERENT uid en el
mismo dispositivo". El flag de bulk push también es por uid (`:1146`). Es exactamente el
cuidado que le falta a la cola.

---

## 🐛 `R9-23` (P0, severidad **alta**) — los datos locales del usuario anterior se suben en silencio a una cuenta de Google _nueva_

**Archivos:** `AuthContext.tsx:340-377` (rama de éxito de `linkWithCredential` — **sin
ninguna pregunta**) · `:378-428` (el prompt de migración vive **dentro del `catch`** de
`auth/credential-already-in-use`) · `:438-472` (`signOut` no toca SQLite, por diseño
documentado en `:16-22`) · `SyncEngine.ts:1145-1210` (`maybeRunInitialBulkPush`: sin flag
`@sync_first_push_done:{uid}`, sube **todo** lo local).

El código no distingue "la misma persona que sube de anónima a Google" (migrar es
correcto) de "otra persona en el mismo teléfono" (migrar es una fuga). El único momento en
que pregunta es cuando Firebase le fuerza la mano con `credential-already-in-use`.

**Escenario de fallo:**

1. Ana usa la app con su Google; sus notas privadas, resaltados y favoritos viven en SQLite.
2. Ana cierra sesión (lo local se queda, y la copy lo dice). `triggeredAnonymousRef` se
   rearma (`:463`) → `signInAnonymously()`: hay un uid anónimo montado **encima del almacén
   local de Ana**.
3. Beto inicia sesión con un Google que **nunca ha usado la app**. `currentUser.isAnonymous`
   es true → `linkWithCredential` **tiene éxito** (la credencial está libre) → no se entra
   al `catch` → **no hay prompt**.
4. `SyncEngineContext` ve usuario no anónimo → `engine.start(uid)`. No hay flag de bulk push
   para ese uid → `maybeRunInitialBulkPush` sube **todas** las notas/favoritos/resaltados/
   tarjetas de Ana a `users/{uidBeto}/…`.
5. Las notas privadas de Ana quedan permanentemente en la cuenta de Beto y se replican a
   sus dispositivos. Ana no puede borrarlas: ya no son suyas.

Si el Google de Beto **sí** había usado la app antes, sí se pregunta (rama `catch`) y puede
declinar. **La fuga es precisamente el caso de cuenta nueva** — el más probable en "le
presto el teléfono a mi hermano y se registra".

**Arreglo (no aplicado):** persistir el dueño del almacén local (`@local_store_owner_uid`)
al arrancar el motor; en `signInWithGoogle`, antes de que el link derive en bulk push,
comparar dueño registrado vs. uid entrante y, si difieren **y hay filas locales**, disparar
el **mismo** `askMigration()` que ya existe (reutilizando `exportLocalData()` +
`queueSkipNextBulkPush()`), en vez de reservarlo para la rama de error.

---

## 🐛 `R9-24` (P1, severidad **media**) — el diálogo de "Eliminar cuenta" manda al usuario a un botón que NO borra sus datos

**Archivos:** `translations.ts:3888-3889` (es) y `:10416-10417` (en) — el mensaje termina
con _"…usa \"Resetear Datos de la Biblia\" en Gestionar datos si también quieres
eliminarlos"_ · `src/lib/database/data-loader.ts:144-166` (`resetBibleData`) ·
`translations.ts:4141-4142` (copy del reset: _"Tus favoritos, notas y resaltados **no se
ven afectados**"_).

Dos textos de la misma app se contradicen y **el código le da la razón al segundo**:
`resetBibleData` solo hace `DELETE FROM verses;` + `DELETE FROM verses_fts;` y limpia los
flags de packs. **Verificado a mano por el orquestador.** No borra ni un favorito, ni una
nota, ni un resaltado, ni una tarjeta. Y no existe en la app **ninguna** acción que borre
el contenido local del usuario.

**Escenario:** Ana vende el teléfono. Elimina su cuenta, lee el diálogo, y hace exactamente
lo que le dice: Gestionar datos → "Resetear Datos de la Biblia". Ve el toast de éxito. Sus
notas privadas siguen íntegras y visibles para el siguiente dueño **sin necesidad de
iniciar sesión** (la app funciona anónima). Además esos datos se vuelven la munición de
`R9-23`: se suben a la cuenta de quien inicie sesión después.

La primera mitad del texto ("los datos de este dispositivo no se borran") es honesta; lo
que falla es la instrucción de remediación.

**Arreglo (no aplicado):** (a) **subtractivo y mínimo**: corregir la copy es/en para dejar
de nombrar "Resetear Datos de la Biblia" y decir la verdad (lo local solo se va
desinstalando la app). (b) **correcto**: añadir en Gestionar datos un "Borrar mis datos de
este dispositivo" real y apuntar la copy a ése — cerraría además `R9-23` en el caso de
dispositivo compartido. (b) toca varias filas del índice; es decisión de Victor.

---

## 🐛 `R9-25` (P1, severidad **media**) — `deleteAllCloudData` lee y borra sin límite ni lotes

`src/lib/sync/deleteAccountData.ts:52-76`: por cada una de las 8 colecciones hace un
`.get()` **sin `limit()`** y luego `Promise.allSettled(snapshot.docs.map(… .delete()))` —
**todos los deletes en paralelo de una vez**. `:78-82` es una puerta todo-o-nada que lanza
si cualquier colección falló.

**Contraste interno:** `SyncEngine.ts:864-921` (`cleanupOldReviewEvents`) hace el mismo
barrido **con** `.limit(200)` y borrado secuencial. El repo ya sabe que esto hay que
acotarlo.

**Escenario:** una cuenta antigua con historial de repasos en la nube — legado de antes del
cambio local-first, o de alguien que importó un respaldo con sesión iniciada
(`BackupService.ts:1026` sigue encolando **cada** `reviewEvent`) — acumula ~7 000 docs. Un
solo borrado de cuenta cuesta ~7 000 lecturas (≈14 % del día **para toda la base de
usuarios**) + ~7 000 escrituras (≈35 %) y dispara 7 000 peticiones concurrentes. Si
Firestore estrangula o el móvil pierde red a mitad: `failedCollections` → throw →
`settings.tsx:206-212` muestra "No se pudo eliminar tu cuenta" **con parte de los datos ya
borrados**, y cada reintento vuelve a pagar la lectura completa.

**Confianza:** alta en la forma del defecto; media en la magnitud. **Pendiente de
verificar:** contar docs de `users/{uid}/reviewEvents` en la consola para 2-3 cuentas
antiguas.

**Arreglo (no aplicado):** paginar (`.limit(N)` + bucle) y usar `writeBatch` de 500 (o un
pool de concurrencia pequeño) en vez de `Promise.allSettled` sobre el snapshot entero; y
reportar parcialidad al usuario en vez de un booleano todo-o-nada. Cruza con `R9-12` (`A5`).

---

## 🐛 `R9-26` (P2, severidad **baja**) — tras eliminar la cuenta la app probablemente se queda sin usuario hasta el siguiente arranque

`AuthContext.tsx:569` pone `triggeredAnonymousRef.current = false` **después** de
`await authMod.deleteUser(current)` (`:530`/`:549`) y de dos `await` más sobre Google
(`:558`, `:563`). Comparar con `signOut`, que lo rearma **antes** de invalidar la sesión
(`:463` antes de `:464`).

El handler solo relanza el sign-in anónimo si `!triggeredAnonymousRef.current` (`:302`). Al
eliminar la cuenta, el evento `null` llega casi seguro con la bandera todavía en `true`, así
que no dispara nada; cuando `:569` la baja, ya no habrá otro evento que la lea. El
comentario del paso 5 (`:500-501`, _"then let the existing null-user handler take over"_)
asume el orden contrario.

**Impacto acotado:** el motor está parado igual para anónimos y las escrituras locales no
dependen del uid, pero `logger.setUserId('')` deja los Crashlytics de esa sesión sin
identificar y se rompe el contrato de la cabecera (`:5-8`, "el usuario siempre tiene un uid
estable").

**Confianza:** media-alta (depende del timing del puente nativo). **Pendiente de
verificar:** en dispositivo, eliminar la cuenta con la app abierta y mirar si Ajustes
muestra "Invitado" (correcto) o "Sin sesión iniciada" persistente (bug).

**Arreglo (no aplicado):** mover la línea `:569` a **antes** de `deleteUser` (como en
`signOut`), o forzar `signInAnonymously()` explícito al final de `deleteAccount`.

---

## ✅ Verificado OK

- **Cobertura de colecciones del wipe de nube: completa.** Todo lo que la app escribe bajo
  `users/{uid}/` está en `USER_DATA_COLLECTIONS` (`deleteAccountData.ts:23-44`). Cruzado
  contra los 5 adapters (`favorites`, `memoryCards`, `notes`, `highlights`, `reviewEvents`)
  - `memoryStats` + `conflicts` + `bookmarks` legado. Los logros son 100 % locales. No hay
    doc raíz `users/{uid}` escrito por el cliente, así que nada queda huérfano.
- **Orden nube→auth en `deleteAccount`: correcto y bien razonado** (`:474-502`). Borrar el
  usuario de Auth primero dejaría las subcolecciones inalcanzables (Firestore no borra en
  cascada) y el código lo evita explícitamente.
- **`auth/requires-recent-login` está manejado** (`:531-554`): `hasPlayServices` → `signIn`
  → `reauthenticateWithCredential` → reintento, con `restoreSync()` en cada salida de error
  para no dejar el motor apagado en silencio.
- **Los errores se le muestran al usuario** (`settings.tsx:200-214`, `:174-186`), y el
  estado `isDeletingAccount` bloquea el doble tap.
- **`signOut` no deja listeners vivos:** `stop()` **antes** de invalidar el token
  (`:438-453`), con test de regresión (`AuthContext.test.tsx:522`).
- **El prompt de migración no puede colgarse:** `ConfirmDialog.tsx:73` cablea
  `onRequestClose={onCancel}`, así que el botón atrás resuelve la promesa con `false`.
- **La copy de cierre de sesión sí es honesta** (`translations.ts:3872-3873`) — dice
  exactamente lo que hace el código.
- **`clearMemoryStatsFloor()` se invoca en ambos caminos** (`signOut :471`,
  `deleteAccount :572`), atado a la acción explícita y no al `user` reactivo.

## Dudas

- Orden exacto de `onAuthStateChanged` frente a la resolución de `deleteUser` en
  `@react-native-firebase` v26 (base de `R9-26`). No verificable estáticamente.
- **Cuenta anónima huérfana:** en la rama `credential-already-in-use` se abandona el
  anónimo recién creado. Queda para siempre en Firebase Auth, sin datos. Coste: filas en
  Auth, no datos. Anotado, no es hallazgo.
- **`BackupService.ts:1026` sigue encolando cada `reviewEvent`** aunque el adapter es un
  no-op deliberado desde el cambio local-first. Parece contradecir esa decisión y engorda
  `users/{uid}/reviewEvents` (lo que alimenta `R9-25`). Pertenece a `A7`/`A4`.
- **Contexto de `A1`, no repetido como hallazgo:** `deleteAccount` no revoca la entitlement
  ni limpia la caché de `expo-secure-store`. Consecuencia **dentro de esta área**: en el
  escenario de dispositivo compartido de `R9-23`, la cuenta nueva hereda el premium de la
  anterior. Ya registrado en `R9-9`.
