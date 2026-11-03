# A31 — Código muerto: exports sin usar, archivos huérfanos

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 125 (2026-11-03, chat nuevo; con 8 agentes a
> pedido de Victor, 2 en esta fila) · Estado **🐛 BUG**

> **Resultado:** 1 hallazgo (`R9-472`, P3: cada bundle lleva las pantallas de la otra plataforma, unos 970 KB de
> fuente en web), ninguno P0. Ninguna copia muerta esconde hoy un defecto al que llegue un usuario: de 17 pares
> vivo/muerto, ninguno diverge con daño. Lo muerto pesa poco (los 105 exports de valor muertos de verdad, 22 987
> bytes; los 9 archivos huérfanos, 0 en el bundle). Lo que pesa es lo que expo-router empaqueta sin usar.

> **Cómo se midió:** dos agentes (`fork` en worktree, sobre `12f46df`) que solo midieron: el 7, un resolvedor con
> el parser de TypeScript (imports de valor y de tipo, re-exports, `require`, `import()`, los 8 alias de
> `tsconfig.json`, los sufijos `.web`/`.native`/`.ios`/`.android`, los `index`; raíces: los 85 archivos de `app/`;
> 522 archivos de código y 377 de prueba, 0 imports sin resolver) y las copias vivas contra las muertas; el 8, lo
> que Metro empaqueta sin usar. La sonda del hallazgo se re-midió igual en el principal. Las listas, sueltas en el
> `_scratch` principal (`S125-a7-exports-sin-usar.tsv.txt`, `S125-a7-archivos-huerfanos.tsv.txt`,
> `S125-a7-metodos-sin-llamador.tsv.txt`, `S125-a7-variantes-sin-export.tsv.txt`); los informes y los scripts, en
> `_scratch/S125-sondas-agente-{7,8}/`.

## El área

| Lista                              | Resultado                                                                                                                                                                                                                       |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Exports sin un uso vivo            | 907: 487 de valor (**105 sin uso ni en su propio archivo**; 382 son un `export` de más), 309 de tipo, 111 re-exports (55 en el barril `src/features/audio/index.ts`). 333 los usa solo una prueba.                              |
| Archivos huérfanos                 | **9, 16 519 bytes**, ninguno importado por pruebas: `AnimatedBottomNav.tsx`, `bookNames.js`, `ShareStylePicker.tsx`, `theme.js`, …                                                                                              |
| Métodos de clase sin llamador vivo | 26 (cota baja: por nombre); 7 los cubre una prueba (`SyncEngine.__*ForTests`, `getConflicts`).                                                                                                                                  |
| Variantes de plataforma            | 14 pares `.web`, todos con su hermano y los dos lados en uso; 5 nombres que faltan en una variante, sin daño (solo los importa la misma plataforma o una prueba); ningún caso como `R9-13`. No hay `.native`/`.ios`/`.android`. |

## Hallazgos

- **`R9-472` (P3):** `_ctx.web.js` / `_ctx.android.js` de expo-router toman todo `app/**/*.tsx`; Metro no filtra el
  `require.context` por plataforma y `getRoutesCore.js:222-225` descarta después: en web, 6 pantallas nativas
  (359 704 bytes) y lo que solo ellas importan (73 módulos, 969 987 bytes, el 6,07 % del fuente del repo en el
  bundle web, más cuatro paquetes); en Android, 6 `.web.tsx` (47 269 bytes; 9 módulos, 79 876 bytes). Sonda:
  `S125-a8-ctxPlataforma` (el regex y el `getRoutes` reales), 2/2; el sourcemap del release de Android lo confirma.

## Revisado sin hallazgo

- **Copias vivas contra muertas (agente 7), 17 pares:**
  - `nextPlaylistIndex`: la muerta tiene prueba; la viva (`AudioPlayerContext.tsx:555-567`) es distinta (deja
    ganar al temporizador «fin de capítulo») pero tiene la suya (`audioQueueOptions.test.tsx:133-160`).
  - `PREMIUM_TEMPLATES`: sale del mismo campo `tier` que el gate vivo `isTemplateUnlocked`.
  - `encodeBundleLink`/`encodeStudyLink`/`encodeCalLink`: el mismo `encodeBundleParam` que el vivo
    `encodeHttpsLink`, que está probado.
  - Sin copia viva: `remoteToReviewEvent`, `resetAllHints` (sin cablear, lo dice el código), `redLetterVersionIds`
    (la costura de `R9-78`).
  - Equivalentes o triviales: `referenceChain` (contra `constellation.tsx:328-334`), `kidsStoryPlanDay`,
    `isSameChapter`, `getTheologyEntryById`; `setPrepSeriesPassageNote` (ninguna pantalla escribe esa nota).
  - `useSleepTimer`: sin usos ni pruebas; el temporizador vivo está en `AudioPlayerContext`.
  - `BadgeSystem.checkAndUnlockBadges` (`:576-618`): la copia muerta **conserva el defecto** que la viva
    (`persistNewlyUnlockedBadges`) corrigió (`titleUnlock` por `title_unlock`, `INSERT` sin `OR IGNORE`). Nadie la
    llama: latente, vuelve si alguien la conecta.
  - `AchievementService.trackShare` sin llamadores: ya es `R9-445`.
  - `ShareStylePicker.tsx` no tiene gate de premium, pero nada la monta: los 12 modales vivos usan
    `PremiumShareExtras`, que sí lo tiene.
  - `AnimatedBottomNav.tsx`: el arreglo de movimiento reducido `e224aa4` se aplicó sobre esta nav muerta (sus dos
    imports están comentados en `chapter/[book].tsx:35` y `[chapter].tsx:120-122`); la barra viva
    (`app/(tabs)/_layout.tsx`) no tiene esa animación: no quedó una copia viva sin arreglar.
  - `clearAllData` e `isFavorite` de la base: sin llamadores (`clearAllData` borraría solo versículos, favoritos y
    notas: riesgo latente, no alcanzable).
  - `getLastKnownEntitlement`: queda, es parte del arreglo de `R9-9` (`detail/A1`:228). `getLastReadPosition`: solo
    pruebas (agente 1).
  - `widgets/index.ts`: el barril está muerto; el handler vivo se importa directo en `app/_layout.tsx:75`.
  - `HIGHLIGHT_CATEGORY_NAMES`/`HIGHLIGHT_COLOR_NAMES`, las misiones de `languageUtils.ts:110-150`, los presets de
    `SVGCircularProgress.tsx:210-300` y los `ShareService.*` de `detail/A22`: en la lista, sin copia viva que diverja.
- **Lo que expo-router registra (agente 8):** los 85 archivos de `app/` tienen `export default` (salvo
  `+native-intent.tsx`, que el contexto excluye) y a cada ruta navega alguien (`S125-a8-rutas.out.txt`); las 7 sin
  referencia por URL son pestañas. No hay helpers dentro de `app/` que se registren como ruta.
- **El peso de lo muerto (agente 8):** los 91 exports de valor sin uso ni en su archivo que viven en módulos vivos
  suman 22 987 bytes (`S125-a8-pesoExports.out.txt`), el 0,1 % del fuente del repo en el bundle de Android; los 78
  `export default` sin usar son alias. Los 9 huérfanos no están en el sourcemap del release (0 bytes). Los datos
  bíblicos (`bible-data-rvr1960.ts` y `bible-data-web.ts`, 8 MB de fuente cada uno) no son código muerto: son el
  respaldo vivo de `data-loader.ts:25-43` y `database/index.ts:1178-1182`.

## Sin medir

- El peso minificado y comprimido del sobrante web de `R9-472` (`npx expo export --platform web`), y si algún paquete
  de `node_modules` trae igual esos cuatro paquetes.
- Si un módulo vivo importa el barril `src/features/audio/index.ts` (Metro sin tree shaking empaquetaría sus 55
  re-exports muertos).
- `PredictiveCache.recordReadingPattern` sin llamadores: la caché predictiva nunca aprende (a lo sumo rendimiento).
- `SyncEngine.getConflicts` sin llamador vivo: qué lee la pantalla de conflictos en su lugar.
- La copia viva `persistNewlyUnlockedBadges` no tiene prueba (cobertura, para la tanda de `A23`).
- Los miembros de los `value` de los contextos (`clearChapter`, `detail/A15`:163) y de los objetos literales: el
  resolvedor no los ve.

## Cruce con las filas vecinas

- `A30`: la rama «cancelado» muerta de `settings.tsx:156-168` es la cara visible de `R9-468`.
- `A6` (paridad web/nativo, `detail/A6`:313-318) vio el `[chapter].tsx` nativo en el bundle web sin medir el peso:
  `R9-472` lo mide.
- `B9` (dependencias sin usar en `package.json`, Modo B): los cuatro paquetes que solo trae el sobrante web de
  `R9-472` son candidatos a mirar ahí.
