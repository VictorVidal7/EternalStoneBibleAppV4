# Sesión 173: arreglos de la revisión de la 172 (`R9-623` con `R9-465`, y `R9-622`)

2026-11-23. Opus 5.5 principal, `high`, sin agentes. Emulador `Pixel_9_Pro` `-read-only`, APK debug vc73, Metro.
Cortada a las ~100 llamadas con el código hecho y medido; la 173b (chat nuevo, sin código) cerró los docs. Estado de partida:
main = origin/main = `6b08fffa`; validador 0 y 0, 278 abiertos de 623.

Rama `fix/s173` (mergeada a main con el OK de Victor; CI verde, run 45337581392, 433 suites, 5121 pruebas): `41a2a356` (R9-623 y R9-465) y `2b126e75` (R9-622 decidido).

## 1. `R9-623` con `R9-465`: el temporizador de lectura (`41a2a356`)

- **ToastContext:** `value` con `useMemo` (los cinco callbacks ya eran estables). Antes, cada aviso y cada cierre
  daban un objeto nuevo.
- **Lector:** el temporizador de 5 s lee `markChapterRead`, `getPlanDuration`, `notifyAchievements`, `t` y `toast`
  por un ref (`trackingHelpersRef`); sus deps quedan en `verses`, `loading`, `achievementService`, `book`,
  `chapterNum` y `canonicalBook`. Un cambio de idioma tampoco lo re-agenda.
- **Pruebas** (providers REALES de Toast y de los planes): `__tests__/readerTrackingTimerRearm.test.tsx` (5) y
  `__tests__/toastContextStableValue.test.tsx` (2). `markChapterRead` se cuenta con un envoltorio cacheado por
  función original (misma estabilidad que la real).
- **Revert por pieza:** sin el `useMemo` cae la de Toast (5 identidades tras dos avisos); sin el ref cae el cambio
  de idioma (2 conteos); sin las dos caen además R9-465 (2 conteos) y R9-623 (el día vuelve tildado). Los controles
  (sin aviso, una vez; un capítulo recargado sí re-agenda; el provider sí dibuja el toast) quedan verdes.
- **Vecinos** (`_scratch/S173-vecinos.cjs.txt` y `S173-vecinos2.cjs.txt`, efectos con `toast` en sus deps, directos
  y por un callback, sobre los 54 archivos que usan `useToast` o `useSaveErrorToast`): solo tres efectos. El
  temporizador; el seguir-al-audio del lector (`followHandledRef` de guarda) y el aviso de voz de
  `MiniAudioPlayer` (`spainPromptFiredRef`): estabilizar solo les quita re-ejecuciones. Los ~50 `useCallback` con
  `toast` solo dejan de recrearse.
- 68 suites vecinas verdes; `npm run validate`: 433 suites, 5121 pruebas (+9), 0 errores de lint.

### En vivo (emulador, `_scratch/S173-vivo.sh.txt`; capturas `S172-sondas/S173-*.png` y `S172-s173-*`)

Plan `iam-7` empezado escribiendo RKStorage; enlace al lector de Juan 6; 5 s; enlace al plan (el lector queda
debajo); destildar el día 1; pestaña Ajustes → «Configure goals» → cambiar la meta diaria (aviso «guardado»; el
toast se dibuja detrás del modal nativo, el provider re-renderiza igual). Estado leído del disco tras cada paso.

| Paso                              | Con el arreglo      | Sin el arreglo (revert en el árbol)      |
| --------------------------------- | ------------------- | ---------------------------------------- |
| Leer Juan 6 5 s                   | `[1]`, 1 «Tracking» | `[1]`, 2 «Tracking» (su propio toast)    |
| Destildar el día 1                | `[]`                | `[]` (10 s quieto: sigue `[]`)           |
| Aviso de la meta en Ajustes, 14 s | `[]`, 1 «Tracking»  | `[1]`, otro «Tracking» 9 s tras el aviso |

- Es la ruta natural que la 172 dejó sin medir: el lector en la pila, otra pestaña, un aviso cualquiera.
- El constructor vacío ya no sirve de aviso ajeno: «Create and start» sale deshabilitado sin pasajes (la 172 lo usó).
- Revert restaurado con `git apply`; `git status` limpio. Emulador y Metro apagados.

## 2. `R9-622` decidido: la fusión conserva el sello más viejo (`2b126e75`)

- **Decisión:** queda el sello más viejo aunque sea anterior al inicio del plan editado. Porqué: el id de un plan
  propio es el hash de su nombre y sus días (`customPlans.ts:53`), así que el destino con ese id es el MISMO plan,
  terminado antes; `completedAt` es la primera vez que el plan se terminó (conservar-lo-ganado,
  `planCompletion.ts`), no un dato de la vuelta actual; y `restartPlan` ya deja un sello anterior al inicio nuevo.
  Tirarlo borraría un «plan terminado» real de la línea de tiempo y el texto «ya lo terminaste» del reinicio.
- Sin cambio de conducta: el comentario de `migratePlanProgress`, la prueba de la 171 con el porqué, una prueba
  con el caso de la 172 y un control con `restartPlan`. Mutación: quedarse solo con el sello del plan editado hace
  caer las dos pruebas de la fusión (sello `null`); restaurado. Sin pantalla que medir.
- Marca propuesta en BUGS.md: `✅ DECIDIDO (sesión 173, delegado: «decidir con porqué»)` con `2b126e75`.

## 3. Estado al cortar

- Cerrados (marcados por la 173b): `R9-623` (P2) y `R9-465` (P3) con `41a2a356`; `R9-622` (P3) decidido con
  `2b126e75`. Quedan **275 abiertos de 623** (0 P0, 3 P1, 87 P2, 184 P3 y un aviso): verificado con el
  validador tras `estado.cjs.txt tsv`.
- Sin entradas nuevas. Avisos de lint: 82 (las pruebas nuevas usan `any` en los mocks, como la sonda de la 124).
- La 174: con el código de la 173 tocando el lector y el Toast (no datos), **`R9-51` con el diseño del §3 de la
  171** (OK de Victor en la 173b).
