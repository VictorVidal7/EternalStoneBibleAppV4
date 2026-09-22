# S19 — revisión del diff de la 18, y de los dos diffs que nadie había revisado (10 y 11)

**Sesión 19, 2026-09-22. Solo revisión: no se arregló nada.** Victor pidió «decime qué
encontraste antes de tocar nada», así que este checkpoint registra hallazgos y no trae ningún
cambio de código. `main` sigue en `40160d7`.

**Alcance, en tres partes:**

1. **El diff de la 18** (`0da86ce..40160d7`: `2a442dd` y `f477c19` de código, más tres de
   checkpoint), con los cinco sitios que pedía el prompt de arranque.
2. **Los diffs de las sesiones 10 y 11, que NUNCA se habían revisado.** Lo destapó la
   auditoría de los docs: la frase «décima sesión seguida» era falsa, porque la 11 no revisó
   ningún diff y la 12 tampoco. O sea que **nadie había revisado los arreglos de dinero
   (`bb3b25b`: `R9-9`/`R9-10`), el remate de la 10 sobre el motor de sync (`2bfa126`), los de
   la cola y el cursor (`261c053`: `R9-11`/`R9-65`) ni la prueba de `R9-28` (`aa70be0`)**.
   Victor pidió revisarlos en esta misma sesión.
3. **El mundo fuera del repo:** el directorio de publicación real, lo que sirve GitHub Pages,
   el log de CI y el calendario de GitHub.

**Método:** 9 agentes, todos con `isolation: "worktree"`. Dos revisores (packs y CI), uno de
docs y mensajes vecinos, **dos verificadores adversariales** (uno por cada revisor, con la
consigna de REFUTAR), uno del flujo real de publicación, uno de «CI en el tiempo», y uno por
cada diff sin revisar (10 y 11). Todo lo que sube a P0 o a P1 lo verificó además el
orquestador en el código o en los datos. **Jest corre en los worktrees sin junction:** cuelgan
de `.claude/worktrees/` dentro del repo, así que la resolución de módulos sube sola hasta el
`node_modules` del árbol principal.

**22 hallazgos: `R9-102`..`R9-123`.** Dos P0, seis P1, diez P2 y cuatro entradas P3
agrupadas. **Hallazgos totales: 123. P0 abiertos: 5** (`R9-36`, `R9-38`, `R9-39`, `R9-102`,
`R9-103`).

---

## 🚨 Lo primero, y estaba fuera del repo

**`C:\Users\victo\Desktop\web-packs\rvr1960.sqlite` era el pack VIEJO, con texto de chatbot
dentro de 2 Reyes 22:9.** Llevaba literal «_Claro, aquí tienes el texto continuado de 2 Reyes
22:10-20 de la Biblia Reina-Valera 1960_» (verificado con `grep -a`; el de Pages da 0
coincidencias).

- Su sha es `f281f541…` y **pesa exactamente lo mismo** que el bueno, `ad3761b4…`, que es el
  que sirve Pages.
- Al lado estaba el `web-bootstrap.json` ACTUAL (copiado el 15-sep), que pina el bueno.
- `importWebPack` (`data-loader.web.ts:59-94`) **no hashea los bytes** y guarda como versión el
  sha del MANIFIESTO (`R9-109`).

Subir «la carpeta de siempre» republicaba el texto de IA sin que nada lo detectara, y **los
navegadores que lo importaran no se curarían** al re-subir el bueno, porque su versión guardada
ya «coincide».

**Acción tomada (con permiso de Victor):** movido a
`C:\Users\victo\essb-cuarentena\rvr1960.sqlite.f281f541-CONTAMINADO-2Re22-9.NO-SUBIR`, con un
`LEEME.txt`. El sha es idéntico antes y después. Queda fuera de `web-packs` y sin extensión
`.sqlite`, así que ni «subir la carpeta» ni un glob lo arrastran. No hay ninguna copia local
de `ad3761…`, pero una corrida limpia lo regenera **byte a byte** (medido).

**Cómo se publica de verdad** (reconstruido con evidencia de las 4 publicaciones del repo de
Pages: `67a6dc2`, `17d2fc1`, `3cea34c`, `c0e3ed7`):

- **El Escritorio fue el `out` real una sola vez,** el 27-jul. Las otras tres se construyeron en
  directorios desechables (`.tmp-webpacks`, `_webpacks_out`), que después se borraron.
- **El manifiesto se copió SIEMPRE del repo** (`web/packs/web-bootstrap.json`) y nunca de `out`.
  Se hizo porque el operador lo sabía por la memoria, no porque el script lo pidiera (`R9-108`).
- **La sesión del 15-sep creó la incoherencia:** copió al Escritorio el manifiesto nuevo junto a
  un pack de julio.
- Hay además un clon viejo de Pages en `C:\projects\_pages_pub` (HEAD `70463fb`, 10-jul), con el
  mismo `rvr1960.sqlite` contaminado. **No se tocó.** Solo se usa para la página de privacidad y
  el redirector, pero publicar packs desde ahí republicaría el texto de IA.

---

## Los cinco sitios que pedía el prompt

1. **`filesNotPinnedBy` en las dos direcciones (`R9-97`).**
   - **Con 2 de 4 archivos borrados, lo que pone roja la prueba es la dirección NUEVA:**
     quitando solo el segundo bucle caen exactamente las dos pruebas de `R9-97`, en
     `not.toMatch(/IS coherent/)`. Los dos archivos que quedan coinciden con su sha256.
   - **Falso «NOT coherent»: sí.** En el `out` REAL está `web-bootstrap.json` (tiene que estar
     para publicarlo), y la función lo marca siempre como «_the manifest does not mention it_».
     O sea que **la rama «IS coherent» que protegen las pruebas solo existe en los fixtures**
     (`R9-111`).
   - **El `[]` sigue significando una sola cosa en principio,** pero una entrada sin `sha256` lo
     rompe (`R9-120`; hoy es inalcanzable).
   - **La causa que afirma el encabezado,** «_An EARLIER run left this directory MIXED_», no está
     comprobada: lo dice de un directorio vacío (`R9-112`).
2. **`previousRedLetterOf` y `versionId: 'WEB'` (`R9-98`).**
   - **Es irrelevante aquí:** solo se compara `file` y `sha256`, y la forma legacy REAL (commits
     `a0782a6`..`60444ab`) es `{file, bytes, sha256, entries, spans}`.
   - **En el script no queda otra lectura en crudo** de `previous.packs` ni de `previous.redLetter`.
   - **Pero la prueba legacy no demuestra lo que dice su comentario:** ignorar el objeto en
     silencio da **63/63 verde**, porque el `toContain('rvr1960-red-letter.json')` se cumple
     igual (`R9-120`).
   - **El vecino de `R9-98` sigue abierto:** un error de E/S dentro del MISMO `catch` (EBUSY sin
     ruta, EISDIR, ENOENT) vuelve a reemplazar el mensaje entero (`R9-110`).
3. **El escáner por COLUMNA (`R9-99`).**
   - **Sin regresión en YAML válido.** El escáner viejo y el nuevo dan `jobs`, `jobsRunningNode`,
     `pins` y `unreadable` **idénticos** en las 5 revisiones históricas de `ci.yml` y en `HEAD`,
     y los tres coinciden con un oráculo `yaml` 2.9 en modo estricto.
   - **Ninguna línea en `0 < indent <= jobIndent` que no sea un job es YAML válido** para `yaml`
     2.9. Sí hay casos que `js-yaml` acepta y `yaml` rechaza. **Con qué parser lee GitHub no está
     establecido** (el runner usa YamlDotNet; el servidor no es público).
   - **El agujero grande está en la OTRA mitad de la correlación,** que la 18 no tocó: decidir si
     un step corre node por la FORMA de la línea `run:` (`R9-107`).
   - **La sonda titular de `R9-99` no discrimina la lógica de columna** (`R9-121`).
4. **El piso por archivo (`R9-100`).**
   - **Ningún workflow legítimo carece de `jobs:`.**
   - **Pero el piso no tiene sonda propia:** quitarlo deja 23/23.
   - **Cuando falla, solo dice `["deploy.yml", false]`**, sin el porqué.
   - **El caso del commit (`jobs: # comentario`) no aísla el piso:** con el strip y sin el piso
     sale rojo igual, por «bare major» (`R9-121`).
5. **El aplanado de `nodePinClaims` (`R9-101`).**
   - **Falsos positivos:** los hay en sintético (`const pins = …;` + `node-version: 20` →
     `['20']`), y **0 en el repo**, ninguno cerca.
   - **`checked >= 1` lo alimentan SOLO las tres frases que escribió el mismo arreglo.**
     Revertirlas da rojo con un mensaje que parece «el regex se rompió».
   - **Aun así es lo único que caza un recorrido de directorio roto** (medido rompiendo el
     filtro).
   - **La frase canónica devuelta verbatim sí se pone roja**, como afirmaba el commit.
   - **No ve redacciones ordinarias:** «pins Node.js 20», «pins Node v20», «is pinned to Node 20»
     (`R9-121`).

---

## Tabla de hallazgos

«Verificado por»: **A** = el agente que lo encontró; **V** = su verificador adversarial;
**O** = el orquestador, en el código o en los datos.

| ID       | Sev.      | Dónde                                                       | Qué                                                                                                    | Verif. |
| -------- | --------- | ----------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ | ------ |
| `R9-102` | **P0**    | `FavoritesContext.tsx:379-394`                              | editar un favorito a menudo **no se encola**: efecto dentro de un actualizador de `setFavorites`       | A, O   |
| `R9-103` | **P0**    | `SyncEngine.ts:246,451,479,505-509`                         | `suppressLocalWriteCount` es GLOBAL: una edición durante una bajada en vuelo se descarta               | A, O   |
| `R9-104` | P1 (→P0?) | `SyncEngine.ts:1569-1575,1700-1702`                         | el flush no re-mira la cuenta tras cada `await`: datos de Ana a `users/<beto>`, descartes sin aviso    | A×2, O |
| `R9-105` | P1        | `offeringService.ts:106,127`                                | la línea exacta de `R9-9` no la protege ninguna prueba (`__resetForTests` tapa el inicializador)       | A, O   |
| `R9-106` | P1        | `SyncEngine.ts:847-926,1366`                                | `R9-65` (y `R9-46`) frenan el cursor solo en SU lote                                                   | A      |
| `R9-107` | P1        | `ciNodeVersion.test.ts:263`                                 | «corre node» se decide por la FORMA de `run:`; 14 formas válidas pasan un job sin `setup-node`         | A, V   |
| `R9-108` | P1        | `build-web-packs.js:1027-1030`                              | «Done.» no manda subir `web-bootstrap.json`                                                            | A×2, O |
| `R9-109` | P1        | `data-loader.web.ts:59-94,175-199`                          | el lector web no verifica el sha256 de los bytes, y un pack malo no se cura                            | A, O   |
| `R9-110` | P2        | `build-web-packs.js:943`                                    | un error de E/S de `filesNotPinnedBy` dentro del `catch` borra el mensaje FIRST FILE                   | A×2, V |
| `R9-111` | P2        | `build-web-packs.js:505-540`                                | en el `out` real, «IS coherent» es inalcanzable (`web-bootstrap.json` siempre «no mencionado»)         | A, O   |
| `R9-112` | P2        | `build-web-packs.js:957-972`                                | FIRST FILE y HALFWAY afirman una CAUSA («EARLIER run», «MIXED») que no comprobaron                     | A×2, V |
| `R9-113` | P2        | `build-web-packs.js:885-919`                                | el preflight de `R9-81` no caza un visor SQLite (ni `readOnly`) ni un `open('r')`                      | A, V   |
| `R9-114` | P2        | `SyncEngine.test.ts:1914-1918`                              | el «control» de la prueba de `R9-34` no controla nada                                                  | A      |
| `R9-115` | P2        | `SyncEngine.ts:515-526` + rama de éxito                     | la premisa de `R9-11` es falsa: `hydrateQueue` mete objetos VIEJOS en la cola                          | A      |
| `R9-116` | P2        | `MemoryDeckContext.test.tsx`, `backupServiceImport.test.ts` | la prueba de `R9-28` cubre 1 de los 4 providers                                                        | A      |
| `R9-117` | P2        | `FavoritesContext.tsx`                                      | favoritos no escucha la señal de restauración y pisa lo restaurado                                     | A, O   |
| `R9-118` | P2        | `ci.yml:76-81`                                              | Codecov **nunca recibió nada**, con el step en verde                                                   | A, O   |
| `R9-119` | P2        | `offeringService.ts:218-223`, `AuthContext.tsx:335-338`     | cerrar sesión le quita el premium a quien pagó; los docstrings dicen lo contrario                      | A      |
| `R9-120` | P3        | packs                                                       | agrupado: prueba legacy, entrada sin sha256, siete mensajes que afirman algo falso                     | A, V   |
| `R9-121` | P3        | compuerta de CI                                             | agrupado: `node-version` en cualquier línea, pisos, `nodePinClaims`, sondas, pisos de Node rancios     | A, V   |
| `R9-122` | P3        | dinero y sync                                               | agrupado: ventana inexistente, aserciones vacuas, `stop()` durante `start()`, cursor en la clave ajena | A      |
| `R9-123` | P3        | docs de la revisión                                         | agrupado: estados de git rancios, rangos, severidades, «décima seguida», conteos                       | A, O   |

El texto completo de cada uno está en `BUGS.md`.

---

## Por qué `R9-102` y `R9-103` son P0 y `R9-104` no (todavía)

**`R9-102` y `R9-103` tienen el MISMO efecto que `R9-11`, que era P0:** una edición local que
nunca llega a la cola. La pantalla la muestra, `pendingWrites` queda en 0, la nube nunca la
recibe, y la siguiente edición desde otro dispositivo la pisa. Los dos están medidos con el
código REAL: el reconciliador de React 19.2.3 para `R9-102`, y el motor real para `R9-103`.

**`R9-104` tiene el mecanismo medido y el disparador no.** El motor escribe el dato de Ana bajo
`users/<beto>` si la promesa de un `set()` de Ana se resuelve después de `stop()` +
`start('beto')`. Lo encontraron **dos agentes por separado**. Lo que no está medido es qué hace
el SDK real de Firestore con un `set()` en vuelo cuando cambia el usuario:

- **Si lo resuelve después del cambio:** es mezcla entre cuentas, la clase de `R9-22`, y **P0**.
- **Si lo deja pendiente:** `flushInFlight` se queda en `true` y Beto no sube nada hasta
  reiniciar la app. Sus escrituras quedan en cola y en disco, así que es un P1 de «no sincroniza».

**Cómo medirlo:** Modo C, con emulador y dos cuentas de prueba, cortando la red con un push en
vuelo. **Nunca el teléfono de Victor.**

---

## Comprobado y BIEN

- **La cadena de datos publicados, contra el mundo.**
  - Los 4 sha256 y los `content-length` de `eternalstonebible.github.io/packs/` coinciden con
    el manifiesto versionado. Hay que pedirlos con `Accept-Encoding: identity`; con gzip el
    largo sale comprimido.
  - El `main()` REAL sobre las fuentes reales, en un temporal y con el manifiesto apuntando a
    una COPIA, produce los 4 packs **byte a byte**. El manifiesto reescrito solo cambia en
    `generated`.
- **CI de `HEAD` verificado EN EL LOG** (run `35163775542`, commit `40160d7`):
  - los tres jobs en verde, con Node v24.20.0;
  - 363 suites / 4289 pruebas, cero «Test suite failed to run»;
  - `PASS` en `buildWebPacks`, `ciNodeVersion`, `missingProviderError` y `redLetterPackParity`;
  - cero `MISSING` y cero `EBADENGINE`.
- **Cada arreglo de la 18 discrimina al revertirlo:**
  - quitar el segundo bucle de `R9-97` hace caer sus 2 pruebas;
  - esparcir en crudo otra vez hace caer la de `R9-98` con «is not iterable»;
  - revertir la columna hace caer la sonda `<<:`;
  - revertir el strip de `jobs:` hace caer su sonda;
  - revertir el aplanado hace caer la sonda WRAPS.
- **`buildWorld('…')` comparte `manifestFile` y `out` con el mundo original,** así que `previous`
  no es `null` en las pruebas nuevas.
- **Cada arreglo de las sesiones 10 y 11 también discrimina:**
  - `R9-9` revertido en los dos sitios: 4 rojas. Solo el guard de `R9-10`: 1 roja.
  - `R9-34` (`0a4f0fc`) revertido: la prueba reescrita cae con `Received: "v1"`.
  - `droppedWrites: 0` de `stop()` revertido: `Expected 0 / Received 2`.
  - `R9-11` solo: 2 rojas. `R9-65` solo: 1 roja. Los dos juntos: 3 rojas, 64 verdes. **Son
    independientes: no se repite lo de la sesión 10.**
  - `R9-28`: cada mitad cae por su razón.
- **Un error de RevenueCat nunca revoca:** todos los `catch` salen sin pasar por
  `handleCustomerInfo`. Los gift codes conceden `lifetime` en los dos backends.
- **Bordes del cursor:** con `>=` y `lowest - 1`, los empates quedan dentro. El horario de verano
  no importa, porque son milisegundos de época. Con el reloj hacia atrás no pasa nada.
- **Conteos de los docs:** 363/4289 exacto (+11 `it(`); 101 hallazgos sin huecos; 21 entradas P0
  con 3 abiertas; las frases y los regex citados existen tal cual.
- **node20 en las acciones:** GitHub lo retira el **2026-09-23**. El código de `actions/runner`
  («_Phase 3: Always use Node 24 regardless of environment variables_») fuerza Node 24, que es lo
  que ya pasa hoy con el run en verde. **Probablemente inocuo** (inferido, no medido): mirar el
  primer run posterior. La premisa de la 18 («deja los tres jobs sin arrancar») no se sostiene.
- **npm 10 contra 11, explicado:** npm 11.19 con `--legacy-peer-deps` materializa **1827 = 1862 −
  35** entradas `"peer": true`. El `node_modules` local tiene 24 paquetes peer-only que CI no, y
  hoy no los importa nadie.

---

## Dicho y NO hecho

- **Nada de esta sesión está arreglado.** El orden propuesto está en `CONTINUAR.md`.
- **`R9-104` necesita Modo C** para decidir si es P0.
- **Hay dos formas de GitHub que no se pueden medir desde aquí:**
  - si YamlDotNet acepta una continuación en la columna 1 (que crearía un job fantasma en el
    escáner nuevo);
  - el runtime de las acciones después del 23-sep.
- **Deuda de docs de `CONTINUAR.md`** (parte de `R9-123`): se reescribieron el encabezado y el
  mensaje de arranque. Las secciones 1-9 siguen con cifras rancias de sesiones viejas, anotadas en
  `R9-123` y sin corregir una por una.
- **El clon viejo `C:\projects\_pages_pub`** sigue teniendo el `rvr1960.sqlite` contaminado. No se
  tocó, porque es un repo git de Victor. Si se usa para algo más que la privacidad, conviene
  borrarlo o hacerle pull.

---

## ⚠️ Pedido de Victor: doble check con Opus 5.5 de lo revisado ANTES de esta sesión

**Todo lo que el ledger registra hasta la sesión 18 incluida se revisó con Opus 5.** Esta sesión
es la primera con **Opus 5.5**, y lo que encontró (los diffs de la 10 y la 11 sin revisar, dos P0
nuevos que existían desde antes, y afirmaciones de los docs que eran falsas) dice que la pasada
anterior dejó huecos. **Victor pidió que una sesión posterior vuelva a hacer doble check, con
Opus 5.5, de lo ya revisado.** Queda como punto fijo en `CONTINUAR.md` y en el mensaje de
arranque.

Propuesta de alcance para esa sesión (cada una cabe en un agente):

1. **Los P0 marcados ✅ ARREGLADO** (18 entradas): re-verificar que cada arreglo se sostiene y que
   su prueba discrimina **en `HEAD`**, no en el commit donde nació.
2. **Las filas del Modo A ya cerradas** (`A1`..`A11`) y del Modo B: re-leer el código con ojo
   fresco. Esta sesión encontró dos P0 (`R9-102`, `R9-103`) en código que el Modo A ya había
   pasado.
3. **Los P1/P2 que nunca se re-verificaron** (`R9-51`..`R9-64`, que `CONTINUAR.md` ya señalaba).
4. **Las afirmaciones «comprobado y BIEN» de los `detail/S*`:** esta sesión encontró varias falsas
   (`S10:128-129`, `S18:92-95`, `B5:45`, `R9-81` «cubre la causa realista entera»).

---

## Las lecciones de la sesión

- **Un helper de RESET en el `beforeEach` sustituye el valor inicial del módulo, así que el
  inicializador nunca corre bajo jest** (`R9-105`). Si el bug vive en el estado de ARRANQUE de un
  módulo, probalo con un módulo fresco (`jest.isolateModulesAsync`) y sin reset. Es la forma de la
  sesión 12 (el mock con factoría literal) por la puerta del reset.
- **Una compuerta verificada solo con spies no se midió contra el mundo** (`R9-113`). El
  preflight de `R9-81` se probó espiando `renameSync`. Con procesos reales, un visor SQLite pasa el
  preflight y rompe el rename a mitad de camino.
- **Un efecto secundario dentro de un actualizador de `setState` no corre cuando creés**
  (`R9-102`). React solo lo ejecuta en el acto si la fibra no tiene trabajo pendiente.
- **Y la de programa:** la frase «N sesiones seguidas» era una afirmación sobre el mundo que nadie
  comprobó, y escondía **dos diffs sin revisar, uno de ellos de dinero**. Contá los `detail/S*`, no
  las sesiones.
