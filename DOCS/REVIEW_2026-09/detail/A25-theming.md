# A25 — Theming: `useTheme` + barrido de hex literales

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 122 (2026-11-03, en el mismo chat que la
> 121; con 3 agentes a pedido de Victor) · Estado **🐛 BUG**
>
> **Resultado:** 3 hallazgos (`R9-454` P2, `R9-455` y `R9-456` P3), ninguno P0. Los encabezados, el relleno
> primario y los temas de lectura respetan el tema; lo que falla es la tinta blanca fija sobre colores que en
> oscuro o en alto contraste son claros: los avisos, las etiquetas de rareza y las cifras del recuadro de Home.
>
> **Cómo se midió:** un agente (`fork` en worktree, sobre `680c287`), que solo midió, con los objetos de tema
> REALES (la paleta compuesta como `useTheme.tsx:1207-1230`: 16 temas × claro/oscuro, más alto contraste) y el
> contraste WCAG calculado sobre los colores renderizados. Dos sondas con `_scratch/S116-correr.cjs.txt`,
> re-medidas iguales en el principal: `S122-paletas.test.tsx.txt` y `S122-chipsInmersivo.test.ts.txt`; dos
> barridos de código (`S122-a3-blancoSobrePrimario.cjs.txt`, `S122-a3-blancoSobreEstado.cjs.txt`). La copia
> del agente, con su informe, en `_scratch/S122-sondas-agente-3/`.

## El área

Los colores fijos en `app/**`, `src/components/**`, `src/features/**` y `src/screens/**` (69 archivos con hex
literales, la mayoría definiciones de tema que no cuentan: `useTheme.tsx` 501, `bookThemes.ts` 268,
`src/styles/*`, `imageTemplates.ts`, `rarityColors.ts`). eslint ya avisa `react-native/no-color-literals`
(`eslint.config.mjs:55`, `warn`): el conteo no es un hallazgo. Lo ya dicho, no re-derivado: `themes`,
`themeContrast` (success y error como TEXTO sobre el fondo), `themeHeaderContrast` (el primer color del
degradado de los encabezados), `highContrastTheme`, `readerThemes`, `readerThemesContrast`, `immersiveTheme`,
`ColorThemeSettings`, `ReaderPreferencesSheetPremiumThemes`, `achievementModalTheme`, `rarityColors`. `R9-41`
(el tema «Crepúsculo» y la barra de acciones: la lista a mano de `readerIsDark`) sigue abierto y es otra raíz.

## Hallazgos

**`R9-454` (P2): los avisos (toasts) quedan ilegibles en modo oscuro y en «Alto contraste».**

- `src/components/Toast.tsx:78-104` pinta texto e ícono en `'#ffffff'` fijo sobre `colors.success`, `error`,
  `warning` e `info`; el mensaje es de 16 px normal (`:289`): pide 4.5:1. En oscuro esos colores son claros
  (`useTheme.tsx:1022-1024`: `#f87171`, `#10b981`, `#fbbf24`; info por tema, p. ej. `#cbd5e1` en midnight, el
  tema por defecto, `:1109`); en alto contraste, `HIGH_CONTRAST_COLORS` (`:1073-1076`). Desde `5f26509`.
- **Repro:** cualquier `toast.success/error/warning/info` (`ToastContext.tsx:76-97`) con el modo oscuro o «Alto
  contraste» en Ajustes. A menudo el aviso de error es la única señal de que algo no se guardó.
- **Sonda:** `_scratch/S122-paletas.test.tsx.txt`, prueba 1 (el `Toast` real con la paleta real, 132
  combinaciones renderizadas): 68 bajo 3:1 y 103 bajo 4.5:1. Oscuro: success 2.54, error 2.77, warning 1.67,
  info 1.48–2.72; alto contraste: 1.74, 2.78, 1.9, 1.56; claro: success 3.77, warning 3.56. Control: la
  variante default da 15.84. El barrido `blancoSobreEstado` (relleno de estado con blanco fijo cerca) solo halla
  estos 4 sitios.
- **P2:** en «Alto contraste», el modo pensado para baja visión, ningún aviso se lee. **Propuesta (sin
  escribir):** una tinta por variante, oscura en oscuro y en alto contraste.

**`R9-455` (P3): las etiquetas de rareza de la colección de insignias tienen poco contraste en cualquier tema.**

- `src/screens/BadgeCollectionScreen.tsx:160-168`: un mapa fijo por rareza (common `#9CA3AF`, rare `#3B82F6`,
  epic `#8B5CF6`, legendary `#F59E0B`, mythic `#EC4899`) bajo texto `staticColors.white` de 8, 10 y 12 px
  (`:1052-1055`, `:1096-1099`, `:1170-1173`), en la tarjeta (`:569-575`), los títulos (`:650-652`) y el detalle
  (`:711-713`). La misma cosa de dos formas: el mapa canónico es `src/lib/achievements/rarityColors.ts:24-56`,
  con otros valores y variante oscura.
- **Repro:** Ajustes → «Mis títulos» (o `eternalbible://features/badges`): «COMÚN» y «LEGENDARIO», blanco sobre
  gris y sobre ámbar.
- **Sonda:** `_scratch/S122-chipsInmersivo.test.ts.txt`, prueba 1 (el mapa y los estilos del código de hoy):
  common 2.54, rare 3.68, epic 4.23, legendary 2.15, mythic 3.53: los 5 bajo 4.5:1. Control: texto del tema sobre
  su fondo, 17.85.
- **Propuesta (sin escribir):** color y tinta de `rarityColors`.

**`R9-456` (P3): de mañana, con 6 temas, las cifras blancas del recuadro de cabecera de Home caen sobre un color
claro.**

- `app/(tabs)/index.tsx:803-865`: un `LinearGradient` diagonal de `gradient.headerColors` de (0,0) a (1,1); la
  fila de `StatsCard` va al pie (`StatsCard.tsx:83-84`, `:169-175`: el valor en `#ffffff` de 18 px, la etiqueta
  en `rgba(255,255,255,0.75)` de 9 px). `themeHeaderContrast` solo fija el primer color.
- **Repro:** Home entre las 5 y las 12 h (`getTimeOfDay`, `useTheme.tsx:39-44`) con ocean, forest, sunset,
  esmeralda, arena o aurora.
- **Sonda:** `S122-paletas`, prueba 2 (16 temas × 4 horas): control, el primer color pasa 3:1 en 64 de 64; el
  valor, bajo 3:1 contra el último color en 6 (ocean 2.77, forest 2.28, sunset 2.8, esmeralda 2.54, arena
  2.94, aurora 2.49, todos de mañana); la etiqueta de 9 px, bajo 4.5:1 en 18. Midnight (por defecto), en
  ninguna.
- **Límite:** que la fila caiga sobre el último color es por lectura del código (Home no montada).

## Revisado sin hallazgo

- Los íconos blancos sobre los degradados de unas 15 cabeceras: los fija `themeHeaderContrast`.
- Blanco fijo sobre `colors.primary`: el barrido `blancoSobrePrimario` da 0; `onPrimary`, en 261 líneas.
- `UserStatsPanel.tsx:94-132`, `:248-270`: pares fijos en claro, los del tema en oscuro, por `isDark` (alto
  contraste también reporta `isDark`, `useTheme.tsx:1211`).
- El modo inmersivo en alto contraste usa su paleta (`immersiveTheme`). `pulpit.tsx:67-69`, escenario oscuro a
  propósito; `settings.tsx:827`, el color de marca de Google; los tintes de estado de `prophecies/index.tsx:1445-1457`
  y `memory/practice.tsx:412-425`, ya medidos por `themeContrast`.

## No alcanzable

- `ImmersiveReader.tsx:586-593`: los fondos «nature» y «paper» no se usan (`backgroundType` fijo en
  `'celestial'`, `:156`, sin setter).

## Sin medir

- **El texto del modo inmersivo** (`ImmersiveReader.tsx:579-584`, `:697`, `#f1f5f9` fijo, decisión comentada en
  `:688-696`): contra el color del medio del degradado, bajo 4.5:1 en 11 de 64; bajo 3:1 (texto grande) solo
  sunset de mañana, 2.56 (`S122-chipsInmersivo`, prueba 2). Lleva sombra `rgba(0,0,0,0.5)`: se decide en el
  dispositivo (Modo C).
- `AchievementCard.tsx:188` (`#fbbf24`) y `WeeklyChallengeCard.tsx:33` (`#f59e0b`): íconos decorativos, leídos.
- **Alcance sin recorrer:** `VersionComparisonScreen.tsx:620-622`, `:1406`; `app/features/journey/index.tsx`
  (19 literales); `chapter/[book].tsx:359`, `:556`; los `StyleSheet` con `color: staticColors.white` (113
  líneas) cuyo fondo se pone en línea desde otro estilo (el barrido por cercanía no los ve).
