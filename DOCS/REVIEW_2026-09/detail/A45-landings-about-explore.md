# A45 — Landings compartidos + about-book + explore-all

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 135 (2026-11-10, chat nuevo, en la terminal,
> CON agentes a pedido de Victor: 13 en tres tandas, Opus 5.5) · Estado **🐛 BUG** (cerrada en la 135)

> **Resultado:** 8 hallazgos, ninguno P0, todos P3: `R9-536` («Devocional · 1 días»), `R9-537` (el «Hoy» del
> devocional compartido y de explore-all no avanza con la pantalla abierta de un día para otro), `R9-538` (los
> landings alinean por número entre la versión de quien envía y la de quien recibe: con RV1909, el pez de Jonás),
> `R9-539` (14 citas de `book-intros` entre «» que no son literales en ninguna versión del idioma), `R9-540` (tres
> afirmaciones de `book-intros` que el texto desmiente: 1 Reyes, el «16 veces» de Filipenses, dos rangos cortos),
> `R9-541` (el mismo enlace dos veces deja dos landings), `R9-542` (el `accessibilityLabel` fijo tapa la nota de
> quien comparte) y `R9-543` (P3 bajo: la intro del estudio compartido sigue a la versión y sus rótulos a la
> interfaz).

> **Cómo se midió:** Victor pidió agentes en su mensaje propio («Podrías mandar 3 agentes?», y después dos veces
> «otros 5»), por encima del «SIN agentes» del mensaje pegado. Reparto y reglas: `_scratch/S135-agentes-reglas.md.txt`,
> `S135b-…` y `S135c-…`; informes en `_scratch/S135-a<N>-informe.md.txt`, sondas en `_scratch/S135-sondas-agente-<N>/`.
> Esta fila: agentes 1 (los landings y `decodeTogetherParam`), 2 (about-book y explore-all), 4 (el landing montado),
> 5 y 12 (las citas y el sentido de `book-intros`), 6 (el índice diario) y 13 (rótulos e idioma). El orquestador
> re-midió en el principal la sonda de cada hallazgo (todas dieron lo mismo) y leyó las líneas citadas. Los 4 packs
> de Pages, bajados una vez a `%TEMP%/S135-packs` con `_scratch/S134-packs.cjs.txt` (manifiesto `232bdf30…`, los
> cuatro OK). Sobre `e4474a8` (el código es el de `f3bee15`).

## Hallazgos

- **`R9-536`:** `devotional-shared/index.tsx:257`, sin clave singular. Sonda `S135-a1-landings` 1a.
- **`R9-537`:** `devotional-shared/index.tsx:162-169` y `explore-all/index.tsx:117-125` (`useMemo` con un
  `new Date()` tomado una vez). Sondas `S135-a1-landings` 2a/2b y `S135-a6-indiceDiario` 3/4.
- **`R9-538`:** `devotional-shared:111-127`, `study-shared:137-203`; el paquete no trae la versión. Sonda
  `S135-a1-landings` 3a-3c (pack RV1909; Ro 16:25-27 con WEB, sin descarga).
- **`R9-539`:** `about-book/[book].tsx:152-157` + `book-intros.ts` (14 líneas, en `BUGS.md`). Sondas `S135-a2-…`
  y `S135-a5-citasIntro2`.
- **`R9-540`:** `book-intros.ts:290`/`:301`, `:1238`/`:1249`, `:1121`/`:1132`, `:1265`/`:1276`. Sonda
  `S135-a12-sentidoIntro` (7/7).
- **`R9-541`:** `together/index.tsx:161-174`. Sonda `S135-a4-montado` (5/5).
- **`R9-542`:** `devotional-shared:273`, `:324-327` (medido); `study-shared:354`, `settings.tsx:613`, `:643` (por
  lectura). Sonda `S135-a13-rotulos` 1a/1b.
- **`R9-543`:** `study-shared:133`, `:213`, `:325`, `:489` frente a `about-book:50`. Sonda `S135-a13-rotulos`
  2a-2c.

## ✅ con su evidencia

- **El decodificador** (`bundle.ts:574-705`, `:750-761`): todo campo acotado (libro ≤ 66, capítulo ≤ 150,
  versículo ≤ 200), notas y título re-saneados; un enlace truncado, fabricado o de un `v` mayor muestra «No pudimos
  abrir…», no tira la app. El `d` es base64url y ningún landing llama a `decodeURIComponent`: no hay doble
  decodificación (agente 1).
- **La versión o el idioma cambiados con el landing abierto:** la versión está en las dependencias de los dos
  efectos (`:154`, `:236`) con su guarda `active` (agente 1). Los landings no guardan nada; «Abrir en mi Mesa»
  empuja la Mesa con el nombre canónico (la Mesa, Pendiente).
- **Un segundo enlace con el landing montado** (el «sin medir» del agente 1): todo enlace real pasa por `together`,
  que empuja una instancia nueva con `rows []`; las filas viejas bajo el título nuevo solo se dan con el esquema
  directo (`encodeStudyLink`/`encodeCalLink`, que nadie usa fuera de `bundle.ts`): no alcanzable, fragilidad sin
  número (agente 4, prueba 4).
- **about-book:** los versículos clave (66 libros, 400 fichas, 200 referencias) existen en las 6 versiones, inicio
  y fin de cada rango, y son iguales en es y en (`S135-a2-versosClave.cjs.txt`); solo Os 11:8 cae en un capítulo de
  otra versificación, con el mismo texto. Navega con `push` a `/verse/…?verse=N` (`:72-82`), sin `replace`; no lee
  la versión; sin rótulos con número. La paridad es/en de `author`, `date`, `keyVerses`, números y referencias, ✅
  en los 66 (agente 12). Las 40 referencias de otro libro existen y dicen lo que se afirma (agente 5).
- **explore-all:** el `useFocusEffect` (`:97-107`) cancela bien y no le faltan dependencias; un id viejo cae al
  defecto (`exploreRecency.test.ts:44,75`); las rutas de las categorías ya se verificaron en la 125; sin filtro,
  búsqueda ni premium. Home y explore-all, montadas a la misma hora, muestran lo mismo (las mismas funciones).
- **El índice del día en el cambio de hora** ya es `R9-172` (S25): re-medido igual (agente 6, prueba 2,
  `TZ=Europe/Madrid`); explore-all es una superficie más que su lista no nombraba (anotado allí).
- **Rótulos:** todos los tokens con número de las 6 pantallas tienen su singular, salvo `R9-536`; 0 literales en
  JSX y en etiquetas de accesibilidad (`S135-a13-barrido.cjs.txt`, 88 filas).

## Medido de paso

- **`R9-549`** (`A34`, Mi camino, `periodRecap.ts:94-104`): salió del barrido del índice diario (agente 6).
- La Mesa (`prep/index.tsx:1361-1364`, `:613`): `R9-540` y `R9-543` llegarían ahí, por lectura (Pendiente).
- El hub de profecías (`prophecies/index.tsx:382`) tiene la forma de `R9-537`, por lectura, sin número (`A33`).

## Sin medir

- `study-shared:443`, `ss.by.replace('{{who}}', bundle.ti)` con `$&` en el título: el barrido de `.replace` de
  `A37`, en el Pendiente.
- «Abrir en mi Mesa» con otra Mesa ya en la pila (familia de `R9-502`/`R9-507`; la Mesa, Pendiente).
- Del estudio al devocional con la pila, y la invitación a un plan abierta dos veces: simétricos por lectura.
- `singleTask`/`onNewIntent` y lo que TalkBack lee de verdad (`R9-542`): Modo C.
- Las afirmaciones históricas de `book-intros` (fechas, «400 años»): estimaciones tradicionales por diseño
  (`:11-13`); las comillas rectas de 2 Ts («hombre de pecado») y 2 Jn («la señora elegida»).
- Home cruzando la medianoche: el «sin medir» de `detail/A19:81` (Pendiente).

## Cruce con las vecinas

- `A37` (`:66-67`): su «sin medir» de la versificación en los landings quedó medido como `R9-538`.
- `A27` (`R9-461`, el `d` repetido) y `R9-457` (el atrás en frío): `R9-541` es otro camino de la misma pila.
- `A46`: `R9-542` toca también el aviso de conflictos de Ajustes, por lectura.
- `A19`/`A39`: `R9-537` tiene la forma de sus «sin medir» (Home y el hub de facts abiertos de un día para otro).
