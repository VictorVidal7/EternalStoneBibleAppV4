# C42a — Notas de versículo: persistencia (Modo C, sesiones 137 y 138)

**Estado: 🐛 BUG (P2) — `R9-561` (la hoja de nota tapada por el teclado). La persistencia: ✅ OK.** `R9-57`, medido en
vivo (suma a la entrada, sin re-severizar). Sesión 137: agente 3, `emulator-5554`, cortado tras crear la primera
nota (`_scratch/S137-sondas-agente-3/`). Sesión 138: agente 2, `emulator-5556`, APK debug vc73, Metro sobre
`6e81d56`, en español, PREMIUM, cuenta anónima (`_scratch/S138-sondas-agente-2/`, informe `S138-a2-informe.md.txt`,
sección 2; lecturas `S138-a2-<nombre>.db.txt` con el `ls` tomado tras cada `force-stop`). Re-verificado por el
orquestador: `NoteEditorModal.tsx` (sin `KeyboardAvoidingView`, `autoFocus` en `:230`) y la búsqueda de la clave en
`BUGS.md`.

## Almacenamiento

Las notas viven en la tabla `notes` de `files/SQLite/bible.db` (`src/lib/database/index.ts:540-549`), no en
AsyncStorage; la base va en modo journal (sin WAL): tras un corte puede quedar `bible.db-journal`, que la lectura
copia. Ni el editor (`NoteEditorModal.tsx`) ni la pestaña (`app/(tabs)/notes.tsx`) consultan premium.

## Lo medido (lectura de `notes` tras `force-stop` + frío en cada paso)

| Camino                                                                 | Resultado                                                                                |
| ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| Crear desde el lector (Génesis 1:3)                                    | ✅ fila con libro canónico (137 y 138)                                                   |
| Editar desde el lector + frío; dos fríos seguidos                      | ✅ texto nuevo, misma `id`, `updated_at` posterior (`S138-a2-c2-frio1.db.txt`)           |
| Pestaña Notas: tarjeta → lector → editor precargado → editar → frío    | ✅ (`S138-a2-n10-*.db.txt`)                                                              |
| Pestaña Notas: papelera → atrás con el diálogo de confirmación abierto | ✅ el diálogo se cierra, la nota sigue                                                   |
| Pestaña Notas: papelera → «Eliminar» → frío                            | ✅ la fila desaparece y sigue borrada (`S138-a2-n6-frio-tras-eliminar.db.txt`)           |
| Vaciar el campo (o dejar solo espacios) desde el lector                | GUARDAR queda `enabled="false"`: desde el lector no se puede borrar (`R9-57`)            |
| Corte sin guardar: teclado abierto → `force-stop`; HOME → `force-stop` | lo tecleado se pierde; lo guardado, intacto                                              |
| Corte JUSTO tras GUARDAR: a 0 s / a 0,3 s                              | a 0 s no queda (con `bible.db-journal`: la transacción se deshace limpia); a 0,3 s queda |

**`R9-57` en vivo:** el primer atrás cierra el teclado y el segundo cierra el editor y descarta el borrador sin
avisar, con la pila de saltos vacía y armada (nota con un chip de referencia → salto a Juan 3). La duda abierta de la
entrada: **gana el `Modal`**: el lector no navega y la pila no se consume.

**`R9-561`:** con el teclado abierto, la hoja no sube: el dump da el campo en `640,2166` y GUARDAR en `640,2656` con
el teclado (que empieza en y≈1850) y sin él (`S138-a2-07.xml.txt`, `S138-a2-08.xml.txt`, `S138-a2-07-editor.png`).
Visto en cada apertura del editor (también en la 137, `S137-a3-10b-toast.png`). Medido solo en Android 16.

## Observaciones sin numerar (no buscadas a fondo; fuera de la fila)

- Un crash NATIVO en uno de ~20 arranques en frío: `SIGSEGV` en `MountingCoordinator::pullTransaction` (hilo
  `mqt_v_js`; `S138-a2-crash-nativo.logcat.txt`). APK debug x86_64 con dos emuladores: puede ser del entorno. No
  está en `BUGS.md`.
- Un chip de referencia no se detecta si la referencia va después de un número (`S138A2-ref-777 Juan 3:16`).
- Tocar el chip vuelve a guardar la nota aunque no cambió (`NoteEditorModal.tsx:150-157`: `updated_at` cambia y se
  encola una escritura).
- Salió el logro «Lee 500 versículos» tras ~15 aperturas de Génesis 1: cada apertura parece contar de nuevo.
- Incidente sin efecto: dos toques del agente cayeron en el launcher; uno abrió la primera ejecución de Chrome
  («Continue as Victor»), donde no se tocó nada (se salió con atrás).

## Sin medir

- FREE (las notas no dependen del gating); el sync y la cuenta (cuenta anónima).
- La hoja tapada por el teclado en versiones de Android anteriores a la 16.

## Receta

1. Herramientas: `S138-a2-ui.sh.txt` (la de la 137 con la ráfaga de capturas y la lectura de `bible.db` con su
   `-journal`), `S138-a2-c42.sh.txt`, `S138-a2-corte-guardar.sh.txt`, `S138-a2-atras.sh.txt`, `S138-a2-pila.sh.txt`,
   `S138-a2-vaciar.sh.txt`. Las copias transitorias, en una carpeta FUERA del repo: una carpeta creada y borrada
   dentro de un worktree tiró Metro en la 138.
2. Lector → tocar un versículo → «Nota» → texto sin «rr» (en debug, dos «r» seguidas por `adb input text` recargan
   el JS) → GUARDAR → leer `notes`; `force-stop` + frío → leer.
3. Cortes: `force-stop` con el teclado abierto; HOME + `force-stop`; `input tap` + `am force-stop` en el mismo shell
   para el corte tras guardar (0 s y 0,3 s).
4. `R9-57`: atrás, atrás con el borrador escrito, con la pila vacía y tras el salto de un chip.
