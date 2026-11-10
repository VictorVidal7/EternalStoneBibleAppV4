# B4 — Reglas de Firestore y Storage: ¿algún path abierto?

**Modo:** B · **Prioridad:** P0 · **Estado:** ✅ OK (con 1 💡 de proceso: `R9-4`) ·
**Revisado:** 2026-09-03, sesión 2 · **Commit base:** `18a3ffa` · **Re-revisado (piloto):** 2026-11-09, sesión
133, sobre `308cb81` (al final: las reglas no cambiaron; ningún path abierto; un nuevo, `R9-530`, P3)

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

---

## Re-revisión piloto con Fable 5.2 (sesión 133, 2026-11-09)

**Para qué:** el segundo piloto para decidir si vale la pena volver a revisar con Fable 5.2 lo ya revisado. El
primero fue `A7` (sesión 132, una fila 🐛). Este va sobre una fila cerrada en ✅ OK. El criterio lo fijó Victor
antes de empezar: al menos un hallazgo nuevo P2 o mayor → se sigue con `B2`, `B3`, `B5`, `A21` y `B1b`; solo P3 o
nada → la re-revisión se cierra acá.

**Cómo:** Fable 5.2 de modelo principal, esfuerzo `high`, sin agentes, sin advisor. A ciegas: este archivo y las
entradas de `BUGS.md` que citan `B4` no se leyeron hasta terminar la pasada; cada candidato se buscó en `BUGS.md`
por su clave. Lo único que salió a la red fueron GET a la API de Rules (más el refresco del token, dentro de un
solo script de Node: `_scratch/S133-reglas.cjs.txt`). Nada se ejecutó contra el Firestore real, y el emulador de
Firebase no está instalado (`~/.cache/firebase/emulators` no existe): lo que pide ejecutar queda «sin medir».

### ¿Cambiaron las reglas en producción desde septiembre? No

| Dato (API de Rules, 2026-11-10T05:41Z)  | Valor                                                          |
| --------------------------------------- | -------------------------------------------------------------- |
| Releases del proyecto (lista completa)  | 1: `cloud.firestore`                                           |
| Ruleset en uso                          | `4c122e10-f8d5-498b-9711-eaa216619ebb`, el mismo de septiembre |
| Creación del ruleset                    | 2026-05-28T07:41:38Z                                           |
| Última vez que el release cambió        | 2026-05-28T07:41:39Z (`updateTime`)                            |
| Texto                                   | idéntico al de arriba, línea por línea                         |
| Rulesets en el historial                | 2: el vigente y `d860d466-…`, de 2026-05-28T07:38:24Z          |
| Texto del ruleset anterior (`d860d466`) | `match /{document=**} { allow read, write: if false; }`        |
| Quién los creó                          | la API no lo dice (ni el ruleset ni el release traen autor)    |
| Release de Storage                      | ninguno                                                        |

El texto de hoy está en `_scratch/S133-reglas-firestore.txt`; el historial, en
`_scratch/S133-reglas-historial.txt`; el ruleset anterior, en `_scratch/S133-reglas-firestore-anterior.txt`.

Dos caveats de septiembre quedan cerrados por la LISTA de releases (`GET …/releases`), que la revisión original no
pidió:

- **Storage.** El 404 de `…/releases/firebase.storage` no era concluyente: los releases de Storage se llaman
  `firebase.storage/<bucket>`. La lista sí lo es: no hay ninguno. La conclusión de entonces se sostiene (tampoco
  hay SDK de Storage, ni `firebase_url` de Realtime Database en `google-services.json`).
- **Bases con nombre.** Tendrían un release `cloud.firestore/<base>`: no hay ninguno.

Y un dato nuevo: según el historial, nunca hubo una regla abierta. El primer ruleset negaba todo y duró tres
minutos.

### La regla, por quién pregunta

| Quién                         | `users/{su uid}/**`            | `users/{otro uid}/**` | Fuera de `users/` (p. ej. `giftCodes`) |
| ----------------------------- | ------------------------------ | --------------------- | -------------------------------------- |
| Sin sesión                    | niega (`request.auth` es nulo) | niega                 | niega (ningún `match`)                 |
| Anónimo                       | permite leer y escribir        | niega (`uid` no casa) | niega                                  |
| Autenticado (Google)          | permite leer y escribir        | niega                 | niega                                  |
| Admin SDK (Vercel, Functions) | se salta las reglas            | se salta las reglas   | se salta las reglas                    |

Qué valida del dato: nada. No consulta `request.resource` (ni tipos, ni tamaños, ni campos de más, ni el nombre de
la colección, ni la profundidad). El dueño lo fija el path, no un campo. No hay `collectionGroup(` en el código.

### El cruce con el código, hoy (`308cb81`)

| Ruta                                 | Origen (líneas de hoy)                                         | Sesión que la usa          |
| ------------------------------------ | -------------------------------------------------------------- | -------------------------- |
| `users/{uid}/{adapter.collection}`   | `SyncEngine.ts:1597` (el listener)                             | no anónima                 |
| `users/{item.uid}/{item.collection}` | `SyncEngine.ts:3915` (`pushOne`)                               | no anónima                 |
| `users/{uid}/conflicts`              | `SyncEngine.ts:3491`, `:3529`                                  | no anónima                 |
| `users/{uid}/reviewEvents`           | `SyncEngine.ts:2804` (la limpieza)                             | no anónima                 |
| `users/{uid}/memoryStats/summary`    | `memoryStatsSync.ts:174`, `:240`                               | no anónima (uid del motor) |
| `users/{uid}/bookmarks`              | `retiredBookmarksMigration.ts:200`, `:274`                     | no anónima                 |
| `users/{uid}/<las 8 colecciones>`    | `deleteAccountData.ts:53-57` (no estaba en la tabla de arriba) | no anónima                 |
| `giftCodes/{code}` (raíz)            | `functions/src/index.ts:204`, `vercel/…/api/redeem.ts:159`     | Admin SDK                  |

Las colecciones del cliente son ocho: `favorites`, `notes`, `highlights`, `memoryCards`, `reviewEvents`,
`memoryStats`, `conflicts` y la retirada `bookmarks`. Las dos clases de desajuste:

- **Un path que el código usa y ninguna regla permite:** ninguno.
- **Una regla más ancha que lo que el código necesita:** sí, en tres ejes. Permite la sesión anónima (el código
  nunca la usa contra Firestore), cualquier nombre de colección y profundidad (el código usa ocho, a un nivel), y
  cualquier dato. Es la base de `R9-136`, que ya estaba reportado.

Lo que suponen los dos servidores: que el cliente no puede crear ni tocar `giftCodes/…` (cierto: sin `match`, se
niega) y que el uid sale del token verificado, nunca del cuerpo (`functions/src/index.ts:168-202`,
`redeem.ts:123-157`). El premium no vive en Firestore (lo da RevenueCat): por las reglas, un cliente no puede
escribirse un entitlement, ni un canje, ni un contador que alguien más lea.

### Resultado

| Hallazgo previo                                              | En la pasada a ciegas                                     |
| ------------------------------------------------------------ | --------------------------------------------------------- |
| El veredicto de `B4`: ningún path abierto                    | confirmado, con el mismo texto                            |
| `R9-4` (las reglas no están versionadas)                     | dado por el mensaje de la sesión; sigue en pie            |
| `R9-136` (S21: la cuota compartida y la cuenta anónima)      | visto; se le agregan tres notas                           |
| `R9-126` (S21: la nube no aplica LWW, la regla no lo valida) | visto a medias (que no valida nada; el daño es del motor) |
| `R9-25` (A3: `deleteAllCloudData` sin límite ni lotes)       | **no visto** (se leyó el borrado, no su costo)            |
| `R9-26` (A3: sin usuario tras eliminar la cuenta)            | fuera de alcance                                          |

- **Nuevo: 1, `R9-530` (P3):** «Eliminar cuenta» borra una foto de la nube, y la regla deja que otro dispositivo
  de la misma cuenta siga escribiendo; lo escrito queda sin dueño.
- **Nuevos P0, P1 o P2: ninguno.** Ningún path abierto.
- **Notas a `R9-136`** (no son hallazgos nuevos): la comprobación que su mitigación pedía (hoy nada accede a
  Firestore como anónimo), que excluir `anonymous` no lo cierra, y dos variantes (el GiB de almacenamiento, las
  lecturas).
- **Descartados con evidencia:**
  - no hay path de cliente fuera de `users/{uid}/` (cinco archivos tocan Firestore, todos por `getFirestore()`);
  - Juntos no toca Firestore (`src/lib/together/` no lo importa ni hace `fetch`);
  - las colecciones que alguna vez existieron en el historial de git son las mismas ocho, y las ocho están en
    `USER_DATA_COLLECTIONS` (`deleteAccountData.ts:23-45`);
  - una escritura encolada de otra cuenta, si llegara a salir, va al path de su dueño (`SyncEngine.ts:3905-3916`)
    y la regla la niega (`'beto' == 'ana'` es falso), como supone el comentario;
  - un `code` con barras en el canje solo puede apuntar a documentos bajo `giftCodes/…`, que ningún cliente
    escribe;
  - no hay App Check, ni Storage, ni Realtime Database; y el proyecto está en plan Spark
    (`functions/README.md:13-19`), así que el canje vive en Vercel y no en una Function.

**Sin medir (candidatos, esperan su tanda):**

1. La mitad de `R9-530` posterior al `deleteUser`: que Firestore acepta el ID token ya emitido de una cuenta
   borrada hasta que vence. Es lo que dice la documentación de Firebase; no se midió.
2. Qué hace el SDK de Auth en el otro dispositivo cuando el refresco falla (¿cierra la sesión, o deja al usuario
   y todo da `permission-denied` hasta que el motor descarta las subidas tras 8 intentos, `R9-33`?). Es de
   dispositivo.
3. Las dos variantes de `R9-136`: qué pasa al llenar el GiB del plan Spark y al agotar las lecturas.
4. Qué proveedores de inicio de sesión están habilitados en el proyecto y qué restricciones tiene la API key: no
   lo dice la API de Rules, y esta sesión no consultó otra.
5. El `sign_in_provider` del token justo después de `linkWithCredential` (importa solo si se excluye `anonymous`
   en la regla).
6. Igual que en septiembre: la regla no se ejercitó contra el emulador.

**Lectura del piloto:** con el criterio fijado antes de empezar, **no se cumple**: un nuevo P3, ningún P2 o mayor.
La revisión de septiembre acertó el veredicto, y lo más útil que agrega esta pasada es de segundo orden: un caso
de borde del borrado de cuenta, dos caveats cerrados con una llamada que faltaba, y la comprobación que `R9-136`
dejó pedida. Las dos salvedades de la 132 valen igual: `B4` es de septiembre, y el piloto no separa modelo de
protocolo. Una más, propia de esta fila: la superficie eran diez líneas de reglas, así que había poco donde
esconder algo. Y un dato para la decisión: en los dos pilotos, lo no visto a ciegas fue un hallazgo de COSTO de
cuota (`R9-29` en la 132, `R9-25` acá). La decisión es de Victor.
