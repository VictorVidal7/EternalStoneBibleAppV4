# C42a — Notas de versículo: persistencia (Modo C, sesión 137)

**Estado: EN CURSO, casi todo sin medir.** Agente 3, `emulator-5554` (segunda ola), cortado por el límite de uso:
la primera carga tras el `pm clear` tardó ~8 min en «Preparing...». Evidencia: `_scratch/S137-sondas-agente-3/`
(informe `S137-a3-informe.md.txt`; herramienta `S137-a3-ui.sh.txt`).

## Lo medido

- Las notas viven en la tabla `notes` de `files/SQLite/bible.db` (`src/lib/database/index.ts:540-549`), no en
  AsyncStorage; los subrayados, en `highlights` (`src/lib/highlights/HighlightService.ts:24-37`, `UNIQUE(verse_id)`).
- Crear una nota desde el lector (Génesis 1:4, `S137A3-nota-777`): la fila está en `notes`, con el libro canónico
  (`Genesis`) y el texto recortado (`S137-a3-13-tras-crear.db.txt`).

## Sin medir

- Que la nota sobreviva a `force-stop` y frío; editar, borrar y vaciar-y-guardar, por el lector y por la pestaña
  Notas; los cortes sin guardar (`force-stop` con el editor abierto; HOME + `force-stop`); `R9-57` en vivo.
- **El control de toasts** (para `C26b`): tras guardar la primera nota apareció el modal del logro «Primera
  Reflexión» en vez del toast (`S137-a3-12-toast-guardar.xml.txt`). Falta editar la misma nota y guardar, ya sin
  logro, con el `uiautomator dump` en la misma llamada.
- **Observación sin numerar ni buscar en `BUGS.md`:** con el teclado abierto, la hoja de nota no sube; el campo y
  «GUARDAR NOTA» quedan tapados (`S137-a3-10b-toast.png`). Buscar su clave (`NoteEditorModal`,
  `KeyboardAvoidingView`) antes de llamarlo nuevo.
