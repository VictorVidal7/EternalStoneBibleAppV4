# Sesión 189: el re-triaje de los 73 P2 abiertos (solo lectura y sondas)

Rama `docs/review-s189`, desde `main` = `1b17dc3d`. Opus 5.5 principal, Fable de asesor. Cuatro agentes de solo
lectura (`general-purpose`, Opus 5.5, esfuerzo high, `isolation: "worktree"`), sin verse entre sí, cada uno con un
grupo de áreas. El método: `CONTINUAR.md` §7, «El método rápido», punto 2, y la regla 1 del triaje. Ningún cambio
de código: el revert de prueba del script del punto 4 se restauró con `git diff` vacío.

## 1. El conteo

Base: 73 P2 abiertos. `R9-410`, `R9-411` y `R9-562` quedan fuera sin leer (el «NO» del mensaje). Clasificados: 70.

| Clase         | Cuántos | Qué pasa                                                                  |
| ------------- | ------- | ------------------------------------------------------------------------- |
| ya arreglado  | 0       | ningún agente encontró un sha que lo cierre entero; ninguna marca nueva   |
| no es A       | 24      | se propone bajar a P3; **NO aplicado**: espera el OK de Victor (§4)       |
| espera Victor | 6       | un solo mensaje, con la respuesta recomendada (§5)                        |
| P2 real       | 40      | 36 de los agentes y 4 que el orquestador sacó de la lista de bajadas (§4) |

**Si Victor aprueba las 24 bajadas:** 49 P2 y 1 P1, es decir, **P1 + P2 = 50** (hoy 74). De los 49 P2, 40 se
arreglan en el repo (§6) y 9 esperan una decisión (los 6 de §5 y los 3 del «NO»).

## 2. Cómo se decidió

- **Los grupos, por área** (no por número, para que un archivo quede con un solo agente): 1, repo, build, backend,
  CI y huecos de prueba (19); 2, sync, cuentas, respaldo, dinero y memoria (17); 3, lector, Mesa, notas, audio,
  búsqueda y originales (18); 4, quiz, Home, tema, navegación, Profecías, lectio, planes y Juntos (16).
- **Las reglas que recibieron:** `_scratch/S189-agente-reglas.md` (las clases, A(1) a A(6), «en la duda, P2»,
  dinero o consola nunca no-A por defecto, un arreglo EN PARTE no es ya-arreglado, un hueco de prueba se juzga por
  lo que protege).
- **Por script, sin IA:** las 70 frases citadas son texto literal de su entrada (una corregida: el agente 4 había
  escapado `<viejo>` como HTML); todos los archivos nombrados existen; ningún id repetido
  (`_scratch/S189-frases.cjs.txt`). Los archivos de los 28 lotes D salen de sus entradas
  (`_scratch/S189-archivos.cjs.txt`, seis completados a mano).
- **Ya arreglado: ninguno.** Los cuatro agentes buscaron por `git log -S`, `-L` y `--grep`; ningún commit de código
  cita estos ids y el código sigue como lo describe cada entrada. No hubo nada que re-verificar con una sonda.
- **Toda bajada, leída por el orquestador en su entrada** (las 28 propuestas). Quedan 24; 4 vuelven a P2 (§4).

## 3. La tabla

| id       | ag. | clase                      | cláusula                                                                   | frase citada de la entrada                                                                                            |
| -------- | --- | -------------------------- | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------- |
| `R9-3`   | 1   | no-A                       | limpieza, sin daño al usuario                                              | «usa npm.** Severidad **muy baja**, no es seguridad.»                                                                 |
| `R9-4`   | 1   | espera-Victor              | Victor: versionar reglas Firestore                                         | «**Sesión 169: propuesta, nada aplicado.** Primer paso: `firestore.rules` = las reglas vivas tal cual»                |
| `R9-8`   | 1   | no-A                       | vuln de dependencia no alcanzable                                          | «usan `uuid.v4()` → **no alcanzable**, pero es trivial de cerrar.»                                                    |
| `R9-12`  | 2   | no-A                       | mejora sin daño, cola persistida                                           | «La cola se persiste, así que no se pierden.»                                                                         |
| `R9-20`  | 1   | P2-real                    | A(4)                                                                       | «sin facturación por exceso** (elegido a propósito), suficientes POST dejan el canje **fuera»                         |
| `R9-21`  | 1   | P2-real                    | A(2)                                                                       | «El código sigue figurando como disponible, así que un segundo usuario puede canjearlo y»                             |
| `R9-26`  | 2   | **P2-real** (agente: no-A) | A(1) en la duda: sin uid tras borrar la cuenta, no medido                  | «Crashlytics de esa sesión sin identificar.»                                                                          |
| `R9-31`  | 2   | espera-Victor              | Victor: transacción exclusiva del restore                                  | «Recomendación (sin código): por defecto, no exclusiva y aceptar»                                                     |
| `R9-42`  | 3   | no-A                       | mejora cosmética (💡) sin daño                                             | «💡 el ícono de bocina del versículo que se está narrando»                                                            |
| `R9-43`  | 3   | no-A                       | espaciado visual, sigue legible                                            | «pegado a los chips y el número de versículo («23» en la captura) queda pegado bajo el»                               |
| `R9-53`  | 2   | no-A                       | estadística derivada (bandas de retención)                                 | «No hay pérdida de datos.»                                                                                            |
| `R9-56`  | 3   | **P2-real** (agente: no-A) | A(2) en la duda: cita en un idioma, texto en otro (y en la imagen pública) | «el versículo congelado en el idioma de cuando se creó la nota.»                                                      |
| `R9-57`  | 3   | P2-real                    | A(1)                                                                       | «el primer atrás cierra el teclado y el segundo cierra el editor y descarta el borrador»                              |
| `R9-58`  | 3   | P2-real                    | A(1)                                                                       | «Si el proceso muere en segundo plano se pierde lo tecleado desde la última pausa de 700 ms antes de salir»           |
| `R9-61`  | 2   | no-A                       | vía de escape de estadísticas                                              | «y las tarjetas sí se pueden borrar una por una.»                                                                     |
| `R9-62`  | 2   | no-A                       | cosmético, re-celebra un hito                                              | «Cosmético, pero trivializa el mecanismo de»                                                                          |
| `R9-63`  | 2   | no-A                       | ya bajado a P3, estadística                                                | «**⬇️ Sesión 22: baja a P3** (sonda con `TZ` fijado desde PowerShell).»                                               |
| `R9-110` | 1   | no-A                       | mensaje del operador del build                                             | «herramienta del flujo real que tome un bloqueo de rango sobre un `.json`: SQLite bloquea en el»                      |
| `R9-111` | 1   | no-A                       | mensaje del operador del build                                             | «web-bootstrap.json (the manifest does not mention it). Do NOT upload anything from it._»»                            |
| `R9-112` | 1   | no-A                       | causa falsa, consejo seguro                                                | «El consejo («Do NOT upload») es seguro en todos los casos; lo falso es la causa. Es vecino de»                       |
| `R9-113` | 1   | no-A                       | solo operador; HALFWAY dice verdad                                         | «El mensaje de HALFWAY sí dice la verdad; por eso es P2. **Lección: una compuerta verificada solo»                    |
| `R9-114` | 1   | P2-real                    | A(1)                                                                       | «Hoy la prueba sí cae con `R9-34` revertido; lo que no protege es su propia premisa.»                                 |
| `R9-116` | 1   | P2-real                    | A(1)                                                                       | «verde (363 suites / 4289 pruebas)**. La frase «ya no queda ningún arreglo sin prueba»»                               |
| `R9-118` | 1   | espera-Victor              | Victor: token de Codecov o quitar                                          | «**Decisión de Victor:** darle token (un secreto) o quitar el step. Lo que no vale es un verde que»                   |
| `R9-134` | 2   | **P2-real** (agente: no-A) | A(5) en la duda: el historial de una cuenta en la nube de otra             | «el historial de Ana en el agregado de Beto»                                                                          |
| `R9-135` | 2   | espera-Victor              | Victor: medición RevenueCat con cuenta de prueba                           | «la raíz siguen esperando la cuenta de prueba»                                                                        |
| `R9-136` | 1   | espera-Victor              | Victor: reglas Firestore y App Check                                       | «Pide el OK de Victor aparte, paso por paso.»                                                                         |
| `R9-137` | 1   | P2-real                    | A(1)                                                                       | «la escritura aparcada de Ana (`Juan/3/16`) la REEMPLAZA la de Beto en cuanto Beto toca el mismo»                     |
| `R9-138` | 1   | P2-real                    | A(1)                                                                       | «lápida vieja del servidor sobrevive: es `R9-45` entero por la puerta del bulk push. Las 4»                           |
| `R9-139` | 1   | P2-real                    | A(1)                                                                       | «`notes` → `DELETE FROM notes`;»                                                                                      |
| `R9-140` | 1   | no-A                       | estadística derivada, no cuenta                                            | «`recomputeReadingStreak` (el remate de `R9-49`) no lo vigila ninguna prueba.** CONFIRMADO por»                       |
| `R9-141` | 1   | P2-real                    | A(1)                                                                       | «verdes las 2 pruebas de import y la suite entera. Mientras `R9-117` siga abierto, es la ÚNICA»                       |
| `R9-144` | 1   | no-A                       | meta-prueba de compuerta, revert visto                                     | «`export {hasRedLetterData};` y el `.web` sin exportarla). Con el lector intacto cae 1 prueba;»                       |
| `R9-158` | 2   | espera-Victor              | Victor: fallar cerrado o abierto                                           | «**Decide Victor:** fallar cerrado (preguntar) o abierto, como hoy.»                                                  |
| `R9-163` | 2   | P2-real                    | A(1)                                                                       | «proceso, el primer enganche de Beto sale con el piso de Ana (`cursorAna − 5 min`), su historial»                     |
| `R9-164` | 2   | P2-real                    | A(1)                                                                       | «vuelve nunca en el mock (el caso `app-cerrada` a 10 min de `R9-193`): la marca queda fija y el»                      |
| `R9-167` | 3   | P2-real                    | A(1)                                                                       | «salta porque el borrador existe, aunque viejo, y la escritura pisa la inserción.»                                    |
| `R9-412` | 2   | P2-real                    | A(3)                                                                       | «pero tocar «Inicio» vuelve a caer: desde la interfaz el usuario no tiene salida.»                                    |
| `R9-417` | 2   | no-A                       | observabilidad, no pierde datos                                            | «No pierde datos por sí solo.»                                                                                        |
| `R9-418` | 2   | P2-real                    | A(4)                                                                       | «con letra normal, en un Pixel 9 Pro, no se ven el título ni el comienzo de la intro.»                                |
| `R9-423` | 3   | P2-real                    | A(2)                                                                       | «Texto en inglés, voz en español: el defecto del Sprint 102,»                                                         |
| `R9-426` | 3   | P2-real                    | A(3)                                                                       | «tras el fin de un capítulo: el siguiente suena con el reproductor oculto, sin control.»                              |
| `R9-428` | 3   | no-A                       | chip muerto, sin daño A                                                    | «está muerta para todo usuario en español; «fe» sí tiene coincidencias en el índice.»                                 |
| `R9-429` | 3   | no-A                       | estado visual, hay salida                                                  | «la acción del estado vacío hace `setSearchQuery('')` y nada más;»                                                    |
| `R9-430` | 3   | P2-real                    | A(2)                                                                       | «resultados de la anterior con la etiqueta de la nueva, y «Cargar más» les pega la página 2 de la nueva.»             |
| `R9-431` | 3   | no-A                       | resaltado cosmético, texto correcto                                        | «con un apóstrofo en inglés no resalta nada, y con `OR` resalta «or» dentro de otras palabras.»                       |
| `R9-432` | 4   | no-A                       | solo puntaje del quiz                                                      | «cuenta: la ronda de 8 cierra con «Aciertos: 7 · Errores: 0» y «¡Ronda perfecta!».»                                   |
| `R9-435` | 3   | P2-real                    | A(2)                                                                       | «al terminar: «Juan 3:17» con las palabras de 3:16»                                                                   |
| `R9-436` | 3   | **P2-real** (agente: no-A) | A(2) en la duda: la misma forma que R9-56                                  | ««Matthew 1:20» con el texto»                                                                                         |
| `R9-437` | 4   | P2-real                    | A(2)                                                                       | «y tocarlo otra vez, «Quitar de favoritos»: se vacía y el versículo sigue en Favoritos.»                              |
| `R9-438` | 4   | no-A                       | porcentaje derivado, sin pérdida                                           | «abrir la app → leer un capítulo hasta la mitad → volver a Home: «Juan 3:1 · 0%», congelado»                          |
| `R9-450` | 3   | no-A                       | i18n, sin daño A                                                           | «etapas y preguntas para el grupo en español.»                                                                        |
| `R9-454` | 4   | P2-real                    | A(4)                                                                       | «P2: en el modo para baja visión ningún aviso se lee, y el de error es a menudo la única señal de un fallo.»          |
| `R9-457` | 4   | P2-real                    | A(3)                                                                       | «con la app cerrada, tocar un estudio compartido por WhatsApp: la flecha no hace nada y el atrás»                     |
| `R9-464` | 4   | no-A                       | solo costo de batería, sin daño                                            | «abrir Favoritos y quedarse: lecturas de SQLite y renders sin pausa hasta salir.»                                     |
| `R9-467` | 4   | P2-real                    | A(3)                                                                       | «a la pantalla de error al abrirla, y no se abre nunca.»                                                              |
| `R9-475` | 4   | P2-real                    | A(1)                                                                       | «una segunda carta: dos repasos del mismo versículo y dos documentos en la nube.»                                     |
| `R9-476` | 3   | P2-real                    | A(2)                                                                       | «o «Romanos 5:8» con las de Juan 3:16»                                                                                |
| `R9-477` | 3   | P2-real                    | A(6)                                                                       | «griegas: 2 Corintios 13:13-14 y Filipenses 1:16-17 quedan sin originales, y otros 34 versículos incompletos.»        |
| `R9-496` | 4   | P2-real                    | A(1)                                                                       | «versículo ya en el mazo: sin aviso, «Juan/3/16» junto a «John/3/16» (dos repasos, dos documentos en la nube);»       |
| `R9-506` | 4   | P2-real                    | A(4)                                                                       | «→ «Unirme a un grupo» → pegar → «Continuar»: error. Al plan propio y al estudio solo les queda copiar el enlace»     |
| `R9-507` | 4   | P2-real                    | A(1)                                                                       | «Marcar un día ahí escribe `{"custom-<viejo>":[1]}` y la vista cae en «Libro no encontrado» sin»                      |
| `R9-508` | 4   | P2-real                    | A(1)                                                                       | «la vista previa promete un plan y se guarda otro,»                                                                   |
| `R9-509` | 4   | P2-real                    | A(1)                                                                       | «días; los días 1-5 son ahora Juan 1-15, y Juan 11-15 queda marcado como leído.»                                      |
| `R9-512` | 4   | P2-real                    | A(1)                                                                       | «plan con su duración por defecto: el grupo deja de leer lo mismo el mismo día.»                                      |
| `R9-533` | 4   | P2-real                    | A(2)                                                                       | «es otro texto bíblico bajo el nombre de la guardada (las notas de la guardada hablan de Romanos).»                   |
| `R9-558` | 2   | P2-real                    | A(2)                                                                       | «la clave sigue en `KJV`: el modo estudio (`study.tsx:155-158`, lee la clave directo) muestra «(text not available)»» |
| `R9-561` | 3   | P2-real                    | A(4)                                                                       | «el usuario escribe sin ver lo que escribe, y para guardar tiene que cerrar el teclado»                               |
| `R9-568` | 4   | no-A                       | queda la lista desplazable; solo comodidad                                 | «(«exodo», «isaias», «levitico»), y la lista queda vacía. La lista desplazable sigue ahí.»                            |
| `R9-620` | 2   | P2-real                    | A(3)                                                                       | «conexión y no responde, el canje gira sin salida.»                                                                   |

## 4. Las bajadas a P3, para que Victor las apruebe

**No se aplicó ninguna.** Con el OK, cada una lleva en su entrada «⬇️ Sesión 189 (re-triaje): baja a P3», la
cláusula y la frase, y `estado.cjs.txt tsv`. Después del OK, el triaje de los P3 (regla 1) las decide como
cualquier P3: casi todas irían a B.

| id       | Por qué no es A                                                                                                                                              |
| -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `R9-3`   | 3,3 MB de Yarn en el repo; «Severidad muy baja, no es seguridad».                                                                                            |
| `R9-8`   | la vuln de `uuid` del backend no es alcanzable (`uuid.v4()` sin `buf`).                                                                                      |
| `R9-12`  | sin `writeBatch`: latencia; «La cola se persiste, así que no se pierden».                                                                                    |
| `R9-42`  | la bocina a 0 px del borde: cosmético (lo pidió Victor; si lo quiere P2, lo dice).                                                                           |
| `R9-43`  | el número de versículo pegado a los chips de «Comparar versiones»: espaciado, el texto es el correcto (frontera).                                            |
| `R9-53`  | el floor de memoria se duplica: conteos derivados; la pantalla muestra porcentajes, que no se mueven.                                                        |
| `R9-61`  | no hay «resetear memoria»: la vía de escape de estadísticas derivadas (`R9-53`).                                                                             |
| `R9-62`  | re-celebra «¡3 días!»: cosmético.                                                                                                                            |
| `R9-63`  | **ya bajó a P3 en la sesión 22** (marca en su entrada); el TSV lo seguía contando P2: solo alinear.                                                          |
| `R9-110` | el mensaje del build de packs pierde la ruta: protege al operador, no al usuario (precedente `R9-149`).                                                      |
| `R9-111` | el build llama MIXED a un `out` coherente: el consejo es no subir; operador.                                                                                 |
| `R9-112` | FIRST FILE y HALFWAY afirman una causa falsa; «El consejo («Do NOT upload») es seguro».                                                                      |
| `R9-113` | el preflight no caza un visor de SQLite; HALFWAY dice la verdad y frena la subida; operador.                                                                 |
| `R9-140` | ninguna prueba vigila el `MAX` de la racha más larga: estadística derivada.                                                                                  |
| `R9-144` | el lector de exports de la compuerta web/nativo sin caso sintético (revert visto); protege un A(3) futuro, no A(1) ni A(2) (frontera, precedente de la 185). |
| `R9-417` | los rechazos de promesas no llegan a Crashlytics: observabilidad, «No pierde datos por sí solo».                                                             |
| `R9-428` | el chip «fe» no busca (mínimo de 3 letras); las demás sugerencias y la caja funcionan.                                                                       |
| `R9-429` | «Probar otra búsqueda» deja el vacío con comillas; la ✕ y escribir sacan de ahí.                                                                             |
| `R9-431` | el resaltado no sigue al FTS (apóstrofo, `OR`): los resultados son los correctos.                                                                            |
| `R9-432` | el quiz queda respondido tras cambiar de categoría: puntaje del juego.                                                                                       |
| `R9-438` | «Continuar leyendo» con el % congelado: porcentaje derivado; la referencia sí se refresca.                                                                   |
| `R9-450` | el PDF «Guía de discusión» con las etapas en español: interfaz, no texto bíblico.                                                                            |
| `R9-464` | Favoritos relee la base en bucle (medido en vivo): batería, sin dato perdido ni crash (frontera).                                                            |
| `R9-568` | un libro sin tilde no se encuentra al escribirlo: la lista desplazable sigue ahí.                                                                            |

**Las 4 que el orquestador dejó en P2** (los agentes las proponían bajar; en la duda, P2):

- `R9-26`: tras «Eliminar cuenta» la app queda sin uid hasta el arranque siguiente. Qué pasa con lo que se escribe
  en ese hueco no está medido («Pendiente de verificar en dispositivo»): toca A(1).
- `R9-134`: la guarda de dueño del historial de memoria falla abierta: «el historial de Ana en el agregado de
  Beto». Es derivado, pero queda escrito en la nube de otra cuenta: A(5) en la duda.
- `R9-56` y `R9-436`: «John 3:16» sobre el texto de Reina-Valera (Notas, y su imagen para compartir) y
  «Matthew 1:20» sobre RVR1960 (estudio de palabra). La cita no coincide en idioma con el texto bíblico: A(2) en
  la duda. La sonda de la 22 ya sostuvo `R9-56` en P2.

## 5. Lo que espera a Victor (el mensaje único)

| id       | La pregunta                                          | La respuesta recomendada                                                                                                                                             |
| -------- | ---------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `R9-118` | el step de Codecov: ¿token o quitarlo?               | **Quitarlo.** Codecov tiene 0 subidas: el verde no mide nada, y es un secreto menos que cuidar.                                                                      |
| `R9-4`   | ¿versionar `firestore.rules`?                        | **Sí, tal cual están vivas** (propuesta de la 169): diff y rollback, sin cambiar nada vivo. Copiarlas de la consola lo hace Victor o lo autoriza.                    |
| `R9-136` | reglas por colección y App Check antes de lanzar     | **Aprobar el borrador de la 169 §4, paso por paso, con App Check primero en monitoreo.** Va con `R9-4` (la misma propuesta, el mismo archivo): proponer fusionarlos. |
| `R9-31`  | la transacción exclusiva del restore                 | **Aceptar la no exclusiva y cerrar:** la exclusiva sola perdió siempre en el aparato; el riesgo es un rollback de SQLite.                                            |
| `R9-158` | ¿fallar cerrado o abierto al no poder leer el dueño? | **Cerrado (preguntar),** junto con el fallo de escritura de `claimLocalStore`: abierto sube las notas de Ana a Beto; preguntar de más cuesta un diálogo.             |
| `R9-135` | la raíz del enlace de RevenueCat                     | **Sigue esperando la medición con la cuenta de Google de prueba (§7).** Sin cambios hasta entonces.                                                                  |

Siguen sin tocar, por el «NO»: `R9-410`, `R9-411` y `R9-562` (P2), y la pregunta de la Mesa (D o B).

Dos P2 reales también le piden algo a Victor al final, pero se arreglan en el repo: `R9-20` y `R9-21` (el canje de
códigos en Vercel: el despliegue lo hace Victor) y `R9-477` (el pack de originales: republicarlo en Pages, con su OK).

## 6. Los carriles

Los 40 P2 reales y los 28 lotes D, agrupados por los componentes conexos de «comparten un archivo de producción»
(`_scratch/S189-carriles.cjs.txt`, sin `translations.ts`). `R9-637` (los 22 modales sin `<ToastHost />`) se reparte
por archivo: si no, une casi todo. Los componentes grandes se parten en dos carriles seguidos, no en paralelo.

| Carril                       | P2                                                          | Lotes D                                                                                  | Archivos de producción                                                                                                                                                                                                                    |
| ---------------------------- | ----------------------------------------------------------- | ---------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1. Toasts                    | `R9-454`                                                    | `R9-637` (los 22), `R9-638` (A, sin lote)                                                | `Toast.tsx` y los 22 de `R9-637` (§7 punto 7: la guarda de jest y el `numberOfLines`)                                                                                                                                                     |
| 2. Sync                      | `R9-163`, `R9-164`                                          | `R9-148`, `R9-241`                                                                       | `SyncEngine.ts`, `firestore.ts`                                                                                                                                                                                                           |
| 3. Mesa y búsqueda           | `R9-58`, `R9-167`, `R9-476`, `R9-430`                       | `R9-169`, `R9-474`                                                                       | `app/features/prep/index.tsx`, `app/(tabs)/search.tsx`                                                                                                                                                                                    |
| 4. Planes y Juntos           | `R9-506`, `R9-507`, `R9-508`, `R9-509`, `R9-512`            | `R9-510`, `R9-542`                                                                       | `together/index.tsx`, `plan-builder/index.tsx`, `plan/[id].tsx`, `customPlanBuild.ts`, `ShareTogetherModal.tsx`, `bundle.ts`, `settings.tsx`                                                                                              |
| 5. Lector                    | `R9-57`, `R9-423`, `R9-561`                                 | `R9-565`, `R9-566`                                                                       | `[chapter].tsx`, `NoteEditorModal.tsx`, `highlights.tsx`                                                                                                                                                                                  |
| 6. Datos y respaldo          | `R9-558`; las pruebas `R9-116`, `R9-139`, `R9-141`          | `R9-470`, `R9-529`, `R9-557`                                                             | `DataSettings.tsx`, `data-loader.ts`, `useBibleVersion.tsx`, `BackupService.ts`, `ReadingProgressContext.tsx`, `progressKeys.ts`, `search.tsx`                                                                                            |
| 7. Robustez y enlaces        | `R9-412`, `R9-457`, `R9-436`                                | `R9-461`, `R9-440`                                                                       | `app/_layout.tsx`, `ErrorBoundary.tsx`, `study-shared`, `devotional-shared`, `together/index.tsx`, `word-study.tsx`, `facts/index.tsx`, `bundle.ts`, `settings.tsx`                                                                       |
| 8. Dinero                    | `R9-418`, `R9-20`, `R9-21`, `R9-620`                        | `R9-576`, `R9-577`, `R9-585`                                                             | `OfferingSheet.tsx`, `DonationSheet.tsx`, `vercel/gift-code-redeem/api/redeem.ts`, `giftCodeService.ts`, `data-loader.web.ts`, `redLetterText.web.ts`                                                                                     |
| 9. Cuentas y pruebas de sync | `R9-26`, `R9-134`; las pruebas `R9-114`, `R9-137`, `R9-138` | `R9-155`                                                                                 | `AuthContext.tsx`, `memoryStatsSync.ts`                                                                                                                                                                                                   |
| 10. Home y el mazo           | `R9-437`, `R9-475`, `R9-496`                                | `R9-456`                                                                                 | `VerseOfDayCard.tsx`, `app/(tabs)/index.tsx`, `StatsCard.tsx`, `prophecies/index.tsx`, `MemoryDeckContext.tsx`, `lectio.tsx`                                                                                                              |
| 11. Audio y originales       | `R9-426`, `R9-435`, `R9-477`                                |                                                                                          | `AudioPlayerContext.tsx`, `AudioChapterAdvancer.tsx`, `OriginalLanguagesSheet.tsx`, `scripts/build-originals-pack.js`                                                                                                                     |
| 12. Sueltos                  | `R9-467`, `R9-56`, `R9-533`                                 | `R9-455`, `R9-500`, `R9-501`, `R9-451`, `R9-471`, `R9-150`, `R9-416`, `R9-504`, `R9-601` | `collections/[name].tsx`, `notes.tsx`, `VersionComparisonScreen.tsx`, `BadgeCollectionScreen.tsx`, `rarityColors.ts`, los de oración, los de widgets, `[chapter].web.tsx`, los de compartir, `scripturePrayers.ts`, los stores de estudio |

Notas de los carriles:

- **Gemelos, en el mismo carril:** `R9-475` y `R9-496` (la clave del mazo con el nombre mostrado); `R9-435` y
  `R9-476` (la descarga de originales que pinta el versículo viejo; carriles 11 y 3, la misma forma); `R9-57` y
  `R9-561` (el teclado obliga al atrás que descarta el borrador).
- **`R9-415` ya está arreglado** (`62d3cd94`). Su resto, el `ToastHost` del editor de `highlights.tsx`, es la línea de
  `highlights.tsx` en `R9-637` (la 188, §1): va primero en el carril 1. No se reabre.
- **`R9-500`** nombra `[passageId].tsx` (no `useBackHandlerStep.ts`, que el script resolvió por nombre): va con
  `R9-501` en los de oración.
- **`R9-141`**: su premisa («mientras `R9-117` siga abierto») ya no vale (`R9-117`, arreglado en la 160); sigue P2
  porque el aviso de reiniciar cubre las pantallas que no escuchan la señal. Frontera.
- **`R9-164`**: «en nativo, sin medir»; el agente lo dejó en A(1) por la nota de la sesión 30. El carril 2 lo mide
  antes de arreglar.

## 7. Las olas propuestas

Cada ola: 3 agentes que escriben (Opus 5.5) y 1 revisor de solo lectura (Opus 5.5); en la primera, además, Sonnet
5.5 en un solo lote D, a prueba (§7). Los archivos de una ola no se tocan entre carriles. El carril 1 toca 22
archivos de otros carriles (una línea en cada uno), así que va en la ola 1 y los que comparten esos archivos van
después.

| Ola | Carriles                                              | Por qué juntos                                                                       |
| --- | ----------------------------------------------------- | ------------------------------------------------------------------------------------ |
| 1   | 1 Toasts, 2 Sync, 3 Mesa y búsqueda; Sonnet: `R9-601` | disjuntos entre sí; el carril 1 desbloquea los archivos de los carriles 4, 5, 8 y 12 |
| 2   | 4 Planes y Juntos, 5 Lector, 6 Datos y respaldo       | disjuntos; el 6 toca `search.tsx` después del 3                                      |
| 3   | 7 Robustez y enlaces, 8 Dinero, 9 Cuentas             | el 7 comparte `together/index.tsx`, `bundle.ts` y `settings.tsx` con el 4            |
| 4   | 10 Home y el mazo, 11 Audio y originales, 12 Sueltos  | lo que queda; el 12 es casi todo lote D                                              |

Cuatro olas para los 40 P2 si ninguna se cae; una ola por ventana de 5 h. Sin promesa de ritmo (§7).

**La primera ola, en detalle** (el mensaje: `_scratch/S190-PROMPT.md`):

- **Carril 1, Toasts.** Primero la guarda: una prueba de jest que cae si un archivo de `src/` o `app/` tiene `<Modal`
  y `useToast` sin `ToastHost`, vista roja hoy con los 22. Después, un `<ToastHost />` por modal, empezando por
  `highlights.tsx` (el resto de `R9-415`); en cada uno, mirar que su toast salga con el modal abierto (`R9-637`:
  «No todos dañan»). `R9-454` (la tinta del toast por variante y tema) y la medición de `numberOfLines` por defecto
  (`R9-638`) en `Toast.tsx`.
- **Carril 2, Sync.** `R9-163` (el cursor de `loadCursor` tras el `await`, sin mirar la sesión), `R9-164` (el
  retenido huérfano que no caduca; medir antes), `R9-148` y `R9-241` (lotes D).
- **Carril 3, Mesa y búsqueda.** `R9-58` (el flush al pasar a segundo plano), `R9-167` (los borradores viejos que
  pisan la ilustración), `R9-476` (los originales del pasaje viejo), `R9-430` (la búsqueda que mezcla versiones),
  `R9-169` y `R9-474` (lotes D).
- **Sonnet, a prueba: `R9-601`** (cinco stores de estudio que leen «vacío» si la lectura falla y lo escriben
  encima). Un patrón repetido en cinco archivos propios; el revisor y el script de verla fallar deciden si Sonnet
  queda para los lotes simples.

## 8. Los scripts de los puntos 4 y 8

- **`tools/revert-pieza.cjs.txt <sha> [prueba …] [--solo a,b] [--workers N]`** (punto 4). Saca del árbol solo el diff
  del commit en sus archivos de producción (`git apply -R`; lo que llegó después se queda), corre jest esperando
  rojo, restaura con `git checkout --` y exige el `git diff` vacío. Sale 0 solo con una prueba roja y el árbol limpio.
  **Probado contra `62d3cd94`:** rojo («the row deleted under the editor: Save tells the reader and keeps the
  draft», 1 de 2), restaurado limpio, sale 0. Control con el arreglo: 2 de 2 verdes. Control negativo,
  `--solo src/i18n/translations.ts`: verde, sale 1 («no discrimina»).
- **`tools/sesion.cjs.txt arranque [--fetch] [R9-NNN …]`** y **`cierre [<sha con CI verde>] [--validate]`** (punto 8).
  El arranque da git (rama, worktrees, ramas, `origin/main`), P1 + P2 y el conteo, y de cada id su cabecera y sus
  marcas. El cierre regenera el TSV, corre el validador y prettier de DOCS, y dice si cambió código desde el sha
  (entonces el validate entero; con `--validate` lo corre). El arranque, probado; el cierre, en el checkpoint de
  esta sesión.
- Ramas viejas en el principal, de antes de esta fase: cinco `fix/review-p0-*`. No se tocaron.
