# B4 — Reglas de Firestore y Storage: ¿algún path abierto?

**Modo:** B · **Prioridad:** P0 · **Estado:** ✅ OK (con 1 💡 de proceso: `R9-4`) ·
**Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa`

**Veredicto: ningún path abierto. Las reglas en vivo son correctas y el diseño de
aislamiento por usuario se sostiene contra el 100 % de las rutas que la app usa.**
El hallazgo real de esta área no es de seguridad sino de **proceso**: las reglas **no
están en el repo** — viven solo en la consola de Firebase, sin versionar (`R9-4`).

---

## Cómo se obtuvieron (no están en el repo)

`git ls-files | grep -iE '\.rules$'` → **0 archivos**. `firebase.json` solo tiene
`react-native`, `functions` y `hosting`: **ni sección `firestore` ni `storage`**.

Así que se leyeron **las reglas vivas de producción** con el patrón documentado en la
memoria `reference_essb-firebase-cli-token-for-rules-api` (refresh del token cacheado
de `firebase-tools` → API `firebaserules.googleapis.com`, **solo lectura**).
Proyecto: `eternal-stone-bible-app-5ad27` (de `.firebaserc`).

## Las reglas vivas de Firestore

Ruleset `4c122e10-f8d5-498b-9711-eaa216619ebb`, creado **2026-05-28T07:41:38Z**.
10 líneas, byte por byte lo que está en producción:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{uid}/{collection=**} {
      allow read, write: if request.auth != null
                         && request.auth.uid == uid;
    }
  }
}
```

**Auditoría:**

| Comprobación                                                          | Resultado                                    |
| --------------------------------------------------------------------- | -------------------------------------------- |
| `allow read/write: if true`                                           | ✅ ninguna                                   |
| Regla de modo-prueba con fecha (`request.time < timestamp.date(...)`) | ✅ ninguna                                   |
| Path que permita acceso sin autenticar                                | ✅ ninguno                                   |
| Path que permita leer datos de **otro** usuario                       | ✅ ninguno                                   |
| Default-deny para todo lo no declarado                                | ✅ sí (comportamiento estándar de Firestore) |

Es una sola regla y hace exactamente dos cosas bien: exige sesión
(`request.auth != null`) y exige que el `uid` del path **coincida** con el del token
(`request.auth.uid == uid`). No hay forma de leer ni escribir el subárbol de otro
usuario. Todo lo demás cae en default-deny.

El comodín `{collection=**}` es lo que hace la regla **a prueba de futuro**: cualquier
colección nueva que se agregue bajo `users/{uid}/` queda cubierta sin tocar las reglas.
Eso explica por qué un ruleset de hace ~3 meses sigue sirviendo después de ~635
commits.

## Verificación cruzada: las rutas que la app realmente usa

No basta leer las reglas; hay que confirmar que las rutas del código caben dentro.
Se enumeraron **todas** las construcciones de path de Firestore en `src/`, `app/`,
`functions/src/` y `vercel/`:

**Cliente (todas bajo `users/{uid}/`, o sea todas cubiertas):**

| Ruta                                    | Origen                                                        |
| --------------------------------------- | ------------------------------------------------------------- |
| `users/{uid}/{adapter.collection}`      | `src/lib/sync/SyncEngine.ts:562-564` (genérico)               |
| `users/{uid}/{item.collection}`         | `src/lib/sync/SyncEngine.ts:1316`                             |
| `users/{uid}/conflicts`                 | `src/lib/sync/SyncEngine.ts:1080`, `:1118`                    |
| `users/{uid}/reviewEvents`              | `src/lib/sync/SyncEngine.ts:869`                              |
| `users/{uid}/{MEMORY_STATS_COLLECTION}` | `src/lib/memory/memoryStatsSync.ts:93`, `:141`                |
| `users/{uid}/bookmarks`                 | `src/lib/migrations/retiredBookmarksMigration.ts:200`, `:274` |

**Cero rutas de cliente fuera de `users/{uid}/`.** Búsqueda de cualquier
`collection('<algo>')` que no empiece por `users/` en `src/` y `app/` → sin
resultados. Dato relacionado que confirma la política de sync mínimo:
**`src/context/TogetherContext.tsx` no toca Firestore en absoluto** — los grupos de
"Juntos" son locales, coherente con `feedback_essb-minimize-firestore-sync`.

**Servidor — y acá está lo interesante:**

| Ruta                      | Origen                                      |
| ------------------------- | ------------------------------------------- |
| `giftCodes/{code}` (raíz) | `functions/src/index.ts:204`                |
| `giftCodes/{code}` (raíz) | `vercel/gift-code-redeem/api/redeem.ts:159` |

`giftCodes` es una colección **de raíz**, deliberadamente **no** declarada en las
reglas. Eso significa que por default-deny **ningún cliente puede leerla ni
escribirla**: nadie puede enumerar códigos válidos ni marcar uno como canjeado desde
la app. Los dos backends la alcanzan porque usan el **Admin SDK con service account**,
que salta las reglas por diseño. **El gate de canje es exclusivamente de servidor —
esto está bien hecho** y vale reconocerlo explícitamente.

## Storage: el 404 es correcto, no es un hallazgo

`GET .../releases/firebase.storage` → **404 NOT_FOUND**: no existe ruleset de Storage.
Verificado que eso es lo correcto y no un descuido:

- `@react-native-firebase/storage` **no está instalado** (los únicos paquetes Firebase
  son `app`, `auth`, `crashlytics`, `firestore`).
- `grep -rn "firebase/storage\|storage()"` en `src/` y `app/` → **0 resultados**.

O sea: Storage nunca se aprovisionó porque la app no lo usa. El campo
`storage_bucket` de `google-services.json` es el que Firebase emite siempre por
defecto, no evidencia de uso. **Nada que endurecer aquí.**

---

## 💡 `R9-4` — las reglas de seguridad no están versionadas en el repo

**Severidad: baja-media** (proceso / riesgo operativo, no un hueco explotable hoy).

No existe `firestore.rules` en el árbol y `firebase.json` no tiene sección
`firestore`. Consecuencias concretas:

1. **No hay revisión de código sobre las reglas.** El control de acceso de toda la app
   es un artefacto de 10 líneas que solo se puede editar a mano en la consola web, sin
   diff, sin PR, sin CI. Es el único componente de seguridad del proyecto que se salta
   por completo el proceso que el resto del código sí respeta.
2. **No hay rollback.** Si una edición futura en la consola relaja la regla (p. ej.
   quitar el `request.auth.uid == uid` mientras se depura algo), no queda registro en
   git ni forma de volver atrás salvo recordar el texto anterior.
3. **No se pueden desplegar declarativamente.** `firebase deploy --only firestore:rules`
   no funciona sin la sección `firestore` en `firebase.json` — el despliegue seguirá
   siendo manual, que es justo el modo en que se cometen estos errores.
4. **Divergencia silenciosa.** Hoy las reglas y el código coinciden, pero es por
   suerte estructural (el comodín `{collection=**}`), no por verificación. Si alguna
   feature futura necesitara una colección de raíz para el cliente (un feed
   compartido, grupos de "Juntos" sincronizados), fallaría en tiempo de ejecución con
   `permission-denied` y nada en el repo lo anticiparía.

**Arreglo sugerido (no aplicado):** volcar el texto vivo a `firestore.rules`, añadir
`"firestore": {"rules": "firestore.rules"}` a `firebase.json`, y commitearlo — el
texto ya está capturado en este documento, así que es una tarea mecánica. Idealmente
además un test de reglas con el emulador de Firestore, pero eso ya es alcance de otra
sesión.

## Caveats

- El texto de las reglas es el **vivo al 2026-09-03**. Si Victor lo edita en la
  consola después de esta fecha, este documento queda obsoleto y no hay nada que lo
  detecte (que es precisamente `R9-4`).
- **No se ejercitaron las reglas contra el emulador.** La auditoría es por lectura del
  texto más verificación cruzada de las rutas del código, no una prueba dinámica de
  permitir/denegar. Para 10 líneas de esta forma el razonamiento es directo, pero una
  prueba con el emulador de Firestore sería la confirmación fuerte.
- Solo se leyó el release `cloud.firestore`. Si el proyecto tuviera bases de datos
  Firestore adicionales con nombre, tendrían su propio release — no se enumeraron.

## Comandos usados

```
git ls-files | grep -iE '\.rules$'                      # 0
node -e "require('./firebase.json')"                     # sin secciones firestore/storage
# lectura de reglas vivas (solo lectura), patrón de reference_essb-firebase-cli-token-for-rules-api:
#   refresh_token de C:/Users/victo/.config/configstore/firebase-tools.json
#   POST https://www.googleapis.com/oauth2/v3/token            -> access_token
#   GET  https://firebaserules.googleapis.com/v1/projects/<pid>/releases/cloud.firestore
#   GET  https://firebaserules.googleapis.com/v1/<rulesetName> -> source.files[0].content
grep -rnE "collection\(|\.doc\(" src/ app/ functions/src/ vercel/ --include=*.ts --include=*.tsx
grep -rn "firebase/storage\|storage()" src/ app/                # 0
```
