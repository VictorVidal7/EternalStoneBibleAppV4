# S8 — revisión con ojo fresco del diff de la sesión 7 (antes de mergear)

**Sesión 8, 2026-09-15.** Victor pidió explícitamente que un chat nuevo revisara su propio
diff antes de mergearlo: 876 líneas de código que tocan respaldo, restauración, sync y la
Mesa, verificadas por él mismo. **Veredicto: sin defectos bloqueantes. MERGEADO y PUSHEADO a
`main`** (fast-forward, `63f124c..8fe24f1`).

Este archivo existe para que **nadie vuelva a re-verificar estas cinco cosas**. Son las que
sostenían el diff entero; si alguna hubiera fallado, el arreglo habría sido peor que el bug.

## Lo que se comprobó a mano (no por lectura plausible)

1. **`deleted: false` no puede resucitar un borrado.** El sello solo es seguro si
   `pullAllLocal` nunca devuelve lápidas. **Los 5 adaptadores comprobados:**
   `getAllHighlights` / `getNotes` leen filas vivas, `favorites` y `memoryDeck` leen estado
   vivo en memoria, `reviewEvents` devuelve `[]` a propósito. **Y el OTRO call site de
   `pullAllLocal`** (`SyncEngine.ts:948`, `exportLocalData`) **solo cuenta filas** — está
   bien no haberlo sellado.
2. **`nullifyUndefined` no produce conflictos fantasma.** `valuesEqual`
   (`SyncEngine.ts:186-187`) hace `a == null && b == null → true`: equipara `null` y
   `undefined` de verdad. El comentario del arreglo no miente.
3. **`MAX(longest_streak, ?)` no puede dar NULL.** El `max()` escalar de SQLite devuelve
   NULL si CUALQUIER argumento lo es — pero la columna es `DEFAULT 0`, **no hay ni un
   `ALTER TABLE` en todo el repo**, la semilla es `INSERT OR IGNORE (id, updated_at)` y los
   dos escritores pasan por `num()`, que siempre devuelve un número finito.
4. **Las 21 etiquetas de sección del export coinciden EXACTAMENTE con las del import.** Era
   el punto de mayor riesgo: una errata en el `exportLabel` de `queuePair` desactivaría una
   guarda **en silencio**. Verificadas una por una contra `buildBackup`, incluidas las dos no
   obvias: `sideBySide → 'readerPreferences'` y las **dos** claves de tema → `'appTheme'`.
   Cobertura completa, sin huecos.
5. **El borrado le sigue ganando a la escritura en la cola.** `upsertQueueEntry`
   **reemplaza** (no fusiona), y `queueDelete` pone `deleted: true` **después** del
   `...base`. Ningún llamador de `queueWrite` pretende escribir una lápida (19 call sites).

Además: los dos `existing` del lector son bloques hermanos (no hay sombra ni TDZ); el
`cancelLabel` opcional de `ConfirmDialog` es retrocompatible con sus ~33 llamadores; y
`nullifyUndefined` deja el upsert de favoritos **más** seguro, porque un `undefined` en un
array de binds de SQL puede lanzar y un `null` liga limpio.

**Fail-first re-verificado a mano en 4 arreglos** (`R9-27`, `R9-45`, `R9-47`, `R9-49`):
revertido cada uno, la prueba falla; restaurado, pasa.

## Tres cosas señaladas (ninguna bloqueaba el merge)

- **El ledger exageraba la cobertura.** Decía «cada uno con prueba de regresión» y era falso
  — ver la corrección al principio de `BUGS.md`. **`R9-28` sigue sin prueba.**
- **Comportamiento nuevo, sin documentar:** el bulk push inicial ahora puede **revivir** una
  fila que la nube tiene como lápida. Está acotado a la primera vez por uid — el momento de
  «migrar mis datos locales a esta cuenta» — así que es defendible, pero es un cambio
  semántico real que el diff no menciona.
- **Nimiedad:** el `return` temprano por `!table` en `load()` ocurre **antes** de incrementar
  `loadRunRef`, así que una carga vieja podría aplicarse si `table` pasara a null en vuelo.
  El peor caso es pantalla obsoleta, no pérdida (`handleNoteBlur` guarda por `!table`), y el
  stepper no puede provocarlo.

## Lección de método que costó un rato

**Un revert mal hecho se ve EXACTAMENTE igual que una prueba que no discrimina.** Al
comprobar `R9-46`, el primer revert «pasó» — y no era que la prueba fuera mala: el `sed`
había parcheado el `catch` de `valuesEqual` (línea 193) en vez de `applyRemoteChange` (762),
porque el patrón `return false;` aparecía antes en el archivo. **Antes de concluir que una
prueba no discrimina, `diff` el revert y confirmá que tocó la línea que creías.**

---

## ⚠️ Correcciones de la sesión 22 (doble check con Opus 5.5, punto 4)

Las líneas citadas son las de este archivo ANTES de agregar esta sección. Detalle: `S22-doble-check-puntos-3-4.md`.

- `:22-25`, «los dos escritores pasan por `num()`»: solo el del restore pasa por ahí; `recomputeReadingStreak` pasa por `computeStreaks`. La conclusión (no puede dar NULL) se sostiene.
- `:31-33`, «19 call sites» de `queueWrite`: las llamadas reales eran **15** (el 19 contaba comentarios y la definición), y hoy siguen siendo 15.
- `:36`, «~33 llamadores» de `ConfirmDialog`: hoy son 22. La retrocompatibilidad se sostiene.
- `:40-41`, «revertido cada uno, la prueba falla»: es cierto con el arreglo ENTERO y falso pieza por pieza (sesión 21: `R9-131`, `R9-138`, `R9-139`, `R9-140`, y 1 de 9 piezas en `R9-47`).
- `:45-46`, «`R9-28` sigue sin prueba»: dejó de ser cierto en `aa70be0` (sesión 11). Lo que queda es `R9-116`.
