# CAMPO — reportes de Victor en dispositivo real (2026-09-07)

> Fuera del ledger por modo · Sesión 5 (2026-09-07) · Estado **🐛 BUG** (4 hallazgos:
> `R9-40`..`R9-43`, ninguno P0)

## Qué es este archivo

Los 4 puntos que Victor observó **usando la app en su OnePlus 11** y reportó con capturas
a mitad de la sesión 5. No salieron de una fila del índice: son observación de campo, que
es material de **Modo C**, pero **el mecanismo de los 4 se confirmó estáticamente** (Modo
A) sin necesidad de emulador. Se registran aquí para no diluir las filas del ledger y
porque cruzan tres áreas distintas (`A13` lector, `A32` Mesa, `A14`/ajustes).

**Ninguno se arregló** — sigue rigiendo el charter §1. Cada uno lleva la forma del arreglo
y, donde importa, el riesgo de tocarlo.

**Método:** los 4 se persiguieron hasta la línea que los produce, con `grep`/lectura sobre
`main` limpio. Ninguno cuelga de una inferencia sobre la captura.

---

## 🐛 `R9-40` (P1) — ningún `fetch` de la app tiene timeout

**Capturas 2 y 3.** «Buscando versiones disponibles…» girando indefinidamente; en otro
momento, «No se pudo cargar el catálogo» con «Reintentar». Victor: _"se queda así
buscando… ahorita ya funciona pero ayer no se veían las versiones disponibles"_.

`src/lib/database/version-download-service.ts:32-43`:

```ts
const res = await fetch(`${CATALOG_URL}?t=${Date.now()}`);
```

Sin `AbortController`, sin `AbortSignal.timeout`, sin `Promise.race`. El `fetch` de React
Native **no trae timeout por defecto**, así que contra una red que completa el handshake y
luego no responde —portal cautivo, wifi de hotel, señal degradada— la promesa **nunca se
asienta**.

El consumidor no tiene salida para ese caso:

```ts
const load = useCallback(async () => {
  setLoading(true);
  setLoadError(false);
  try {
    setCatalog(await fetchVersionCatalog());
  } catch {
    setLoadError(true);
  } finally {
    setLoading(false);
  }
}, []);
```

`ManageVersionsSection.tsx:59-68`. Si el `await` no vuelve, **el `finally` no corre**:
`loading` se queda en `true` para siempre y `loadError` nunca se pone, así que el botón
«Reintentar» —que solo se pinta por `loadError`— **no aparece**. La única salida del
usuario es salir de Ajustes. Eso es exactamente la captura 2; la captura 3 es la otra
rama, la que sí rechazó.

**Las dos manifestaciones y la intermitencia ("ayer no, hoy sí") son la firma esperada de
un fetch sin timeout sobre una red variable**, no de un servidor caído: el catálogo se
sirve de GitHub Pages, que no se cae por un día.

**El alcance es mayor que esta pantalla.** `grep -rn "AbortController\|AbortSignal.timeout"
src/` → **cero resultados**. Los 6 call sites de `fetch` de la app están todos sin timeout:

| Archivo                                      | Línea | Qué hace                            |
| -------------------------------------------- | ----- | ----------------------------------- |
| `lib/database/version-download-service.ts`   | 34    | catálogo de versiones (éste)        |
| `lib/database/originals-download-service.ts` | 82    | metadatos de idiomas originales     |
| `lib/offering/giftCodeService.ts`            | 158   | **canje de código regalo (dinero)** |
| `lib/database/data-loader.web.ts`            | 64    | packs de la web                     |
| `lib/database/data-loader.web.ts`            | 128   | bootstrap de la web                 |
| `lib/reading/redLetterText.web.ts`           | 66    | letra roja de la web                |

El de `giftCodeService.ts:158` es el que más pesa: es la **ruta de dinero**. Su `try/catch`
mapea el rechazo a `{status:'error', message:'Network error'}`, correcto — pero un
**cuelgue** no rechaza, así que el canje se queda girando sin mensaje ni salida. Cruza con
`R9-16` (`restore()` confunde "no tienes compra" con "falló la red"): la misma familia de
"la red que no responde no está modelada".

**Forma del arreglo (no aplicado):** `signal: AbortSignal.timeout(10_000)` en los 6 call
sites (está disponible en Hermes/RN 0.86; si no, `AbortController` + `setTimeout`), y en el
catálogo tratar el `AbortError` como `loadError` para que aparezca «Reintentar». Vale la
pena hacerlo de una sola pasada por los 6: es el mismo cambio seis veces y deja la app sin
un solo `fetch` capaz de colgarse.

---

## 🐛 `R9-41` (P1) — «Crepúsculo» deja la barra de acciones del versículo ilegible

**Captura 5.** Victor: _"a veces no se alcanza a ver bien las opciones… aquí tengo un tema
de la App, más tema oscuro, más tema exclusivo de lectura, y así se ven las opciones cuando
presiono un versículo"_. En la captura las 8 acciones («Escuchar», «Copiar», «Compartir»,
«Nota», «Favoritos», «Resaltar», «Comparar», «Imagen») están sobre un panel claro y apenas
se distinguen.

**Es un bug duro, no una impresión.** `app/(tabs)/verse/[book]/[chapter].tsx:719-722`:

```ts
const readerIsDark =
  readerPrefs.theme === 'system'
    ? isDark
    : readerPrefs.theme === 'night' || readerPrefs.theme === 'high-contrast';
```

y `:3076-3080`:

```ts
backgroundColor: readerIsDark
  ? staticColors.navySurface98
  : staticColors.glassWhite98,
```

mientras el texto sale de `effectiveColors.text`, que **sí** viene de la paleta de lectura
(`resolveReaderTheme`, `:708`).

`readerIsDark` **enumera a mano** los temas oscuros y la lista se quedó en los dos que
existían cuando se escribió. `crepusculo` se añadió después (T6.3, exclusivo de ofrenda) y
es **true-dark** — `src/styles/readerThemes.ts`:

```ts
crepusculo: {
  background: '#0D1220',
  text: '#DCE3F0',   // casi blanco
  ...
}
```

Con `crepusculo` seleccionado: `readerIsDark === false` → fondo
`staticColors.glassWhite98` = `rgba(255, 255, 255, 0.98)` (`designTokens.ts:462`), texto
`#DCE3F0`. **Contraste ≈ 1.15:1.** El mínimo WCAG AA para texto normal es 4.5:1. Los íconos usan
`effectiveColors.primary` = `#7FA8D9`, que sobre el mismo blanco da ≈ **2.5:1** — por eso
en la captura se adivinan pero las etiquetas no. El contador «1 versículo» de la cabecera
usa también `effectiveColors.text`, y en la captura es igual de invisible: coincide punto
por punto con lo que predice el código.

La ironía está en el comentario que precede a la variable, que dice exactamente para qué
existe: _"Drives the floating selection bar so its `effectiveColors.text` stays legible
when the reading theme differs from the app theme"_. La intención era justo ésta; lo que
falló fue mantener la lista al añadir una paleta.

**Alcance exacto, verificado:**

- `readerIsDark` tiene **un solo consumidor** (`:3078`, el fondo de la barra) — así que el
  daño se limita a la barra de acciones, no al resto del lector.
- **Solo `crepusculo` está afectado.** De los 3 exclusivos T6.3, `musgo` (`#F1F3EA`) y
  `niebla` (`#F2F4F7`) son superficies **claras** con texto oscuro, así que el fondo blanco
  les queda bien por accidente. `crepusculo` es el único dark que no está en la lista.
- **`readerIsDark` no tiene ningún test** (`grep` sobre `__tests__/`: 0). Sí existe
  `readerThemesContrast.test`, que valida los pares texto/fondo **dentro** de cada paleta —
  pero este bug es un par **cruzado** (texto de la paleta sobre fondo del token estático),
  que ese test no puede ver.

**Forma del arreglo (no aplicado).** El parche mínimo es añadir `'crepusculo'` a la
condición, pero deja la mina armada para el siguiente tema oscuro. Mejor: **derivar** la
oscuridad de la paleta en vez de enumerarla — un campo `isDark: boolean` en
`ReaderThemeColors` (explícito, revisable, y el type-checker obliga a rellenarlo al añadir
un tema), o calcular la luminancia de `background` en `readerThemes.ts` y exportar un
`isReaderThemeDark(theme, appIsDark)`. Con eso, `chapter.tsx` deja de saber nada de nombres
de temas. Añadir de paso el test que hoy no existe.

---

## 💡 `R9-42` (P2) — el ícono de bocina no tiene margen

**Captura 4.** Victor: _"me gustaría que el ícono de la bocina tuviera al menos un poquito
de margen **sin afectar el problema que ha habido con que se cortan las palabras** el cual
finalmente fue arreglado hace un tiempo"_.

`app/(tabs)/verse/[book]/[chapter].tsx:2583-2591`:

```ts
const nowPlayingIconStyle = {
  position: 'absolute' as const,
  left: -(fontSizes.sm + spacing['0.5']),   // -(14 + 2) = -16
  top: ...,
};
```

y el contenedor, `:3742-3750`:

```ts
verseItem: {
  paddingHorizontal: spacing.md,   // 16
  ...
}
```

`verseContent` es hijo directo de `verseItem`, así que su borde izquierdo es el borde de
contenido de la tarjeta. Con `left: -16` sobre un canalón de 16, **el ícono consume el
canalón entero** y su borde izquierdo cae exactamente sobre el borde de la tarjeta: margen
izquierdo **0 px**. Los 2 px de holgura (`spacing['0.5']`) están todos asignados al lado
derecho, entre el ícono y el número de versículo.

**Sobre la preocupación de Victor — se puede descartar, para el ajuste del `left`.** El
ícono es `position: 'absolute'` con `pointerEvents="none"`, es decir **fuera de flujo**:
mover su `left` no cambia una sola métrica del `<Text>`. La saga del recorte se cerró en el
`<Text>` (`textBreakStrategy: 'simple'` + `paddingRight` derivado del tamaño de fuente,
Sprint 110/112), y el propio comentario del ícono explica que se hizo absoluto **para** no
volver a tocar el flujo del texto (Sprint 82 metía un espaciador en línea y eso sí recortaba
la última palabra en algunos motores OEM). Cambiar `left` es seguro.

**La restricción real no es de riesgo, es de espacio.** Canalón 16 px, ícono 14 px → **2 px
de holgura total**. No hay forma de darle margen a la izquierda sin quitárselo a la derecha.
Las salidas, por orden de invasividad:

1. Repartir la holgura: `left: -(fontSizes.sm + 1)` → 1 px por lado. Gratis, pero es casi
   nada — probablemente no se note.
2. Achicar el ícono a 12 px y recentrarlo: gana 2 px más de holgura (4 en total, 2 por
   lado). El ícono se ve algo más pequeño.
3. Ampliar el canalón: `verseItem.paddingLeft` a 20-22. Es el que de verdad resuelve, y el
   único que **sí reflowa** el texto — estrecha la columna. No toca la holgura anti-recorte
   (que es del lado derecho y es un `paddingRight` proporcional), pero cambia dónde caen los
   saltos de línea en todos los versículos. Merece una mirada en dispositivo antes de
   quedarse con él.

Es una decisión de diseño de Victor, no un arreglo mecánico — por eso queda como 💡.

**DECIDIDO por Victor (2026-09-07): la opción 1, repartir la holgura.**
`left: -(fontSizes.sm + spacing['0.5'])` → `left: -(fontSizes.sm + 1)`, o sea −16 → −15:
1 px por lado. Una línea, sin reflow, sin riesgo para la saga del recorte. **No hace falta
volver a plantear las otras dos opciones** — quedan aquí solo como constancia de por qué
se eligió ésta.

---

## 🐛 `R9-43` (P2) — «Comparar versiones» de la Mesa: cero separación vertical

**Captura 1.** Victor: _"esta parte se ve encimada en Comparar versiones"_. En la captura,
«Elige hasta 3 versiones para comparar» está pegado a los chips `RVR1960`/`WEB`, y el
número de versículo «23» queda pegado justo debajo del chip.

`app/features/prep/index.tsx:2155-2222`. En la rama premium la tarjeta rinde tres hijos
consecutivos, y **ninguno aporta separación vertical**:

| Elemento            | Estilo                                                   | Separación vertical                   |
| ------------------- | -------------------------------------------------------- | ------------------------------------- |
| contenedor          | `sectionCard` (`:3121-3126`) — `padding`, `marginBottom` | **sin `gap`**                         |
| texto de ayuda      | `helpMeta` (`:3249`) — `{fontSize: fontSizes.xs}`        | **ninguna**                           |
| fila de chips       | `chipWrap` (`:3273`) — `row`/`wrap`/`gap: spacing.sm`    | **ninguna** (el `gap` es entre chips) |
| bloque de versículo | `compareVerseBlock` (`:3360`) — `marginBottom`, `gap`    | **sin `marginTop`**                   |

El `gap` de `chipWrap` separa los chips **entre sí**, no del contenido de arriba y abajo; y
el `marginBottom` de `compareVerseBlock` separa un bloque del siguiente, no el primer bloque
de los chips. Así que hint → chips → «23» se apilan a 0 px.

Las otras ramas de la misma tarjeta (`onlyOneInstalled`, bloqueada, error) no lo sufren
porque usan contenedores que sí traen `gap` propio (`originalWordsDownloadWrap`,
`originalWordsLockedRow`) — por eso el defecto solo se ve con premium activo y 2+ versiones
instaladas, que es la configuración de Victor.

**Forma del arreglo (no aplicado).** Añadir `gap: spacing.sm` a `sectionCard` lo arreglaría
de raíz **y de paso en todas las tarjetas de la Mesa** — que es a la vez su atractivo y su
riesgo: `sectionCard` se usa en toda la pantalla (3467 L) y el cambio movería espaciados ya
aceptados en muchos sitios. La opción acotada, y la que recomendaría sin verlo en
dispositivo, es local a esta tarjeta: `marginTop` en `compareVerseBlock` y un
`marginVertical` en el `chipWrap` de aquí.

---

## Notas de método

- Los 4 son de dispositivo real pero **ninguno necesitó emulador para confirmarse**: la
  captura dio el síntoma y el código dio la línea. Es un buen recordatorio de que la
  frontera Modo A / Modo C es de _entorno_, no de _tipo de bug_.
- `R9-41` es el tercer caso de esta revisión con la misma forma que los P0 de la sesión 3:
  **una lista enumerada a mano que se quedó atrás cuando se añadió un miembro**, invisible
  para `tsc`, jest y CI porque enumerar strings no es un exhaustive check. Un `switch`
  sobre el union `ReaderTheme` (o el campo en la interfaz) lo habría hecho un error de
  compilación.
- `R9-40` es el mismo eje que los P0 de sync: **la dirección que no se prueba**. Nadie
  ejercita "la red acepta y no contesta"; todos los `catch` de la app asumen que un fallo
  de red **rechaza**.
