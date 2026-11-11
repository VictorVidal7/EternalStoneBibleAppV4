# C42b — Notas: lista, búsqueda, edición (Modo C, sesión 139)

**Estado: 🐛 BUG (P3) — `R9-564` (tocar un chip de referencia vuelve a guardar la nota sin cambios) y `R9-565` (con el
editor abierto, un enlace a otro libro deja una cabecera mezclada). La lista, la búsqueda, los tres órdenes y
compartir: ✅ OK.** Sin agentes. `emulator-5554` (solo lectura, tras `pm clear`), APK debug vc73, Metro sobre
`dd3568f` (la rama de docs no cambia el JS), en español, RVR1960, cuenta anónima, **FREE** (Ajustes → Extras:
«Desbloquear con premium», el toggle de dev `checked="false"`, `S139-ajustes3.xml.txt`; las notas no consultan
premium, `C42a`). Evidencia: `_scratch/S139-sondas/` (lecturas `S139-<n>.db.txt` de `notes` en
`files/SQLite/bible.db`; herramientas `_scratch/S139-ui.sh.txt` y `_scratch/S139-leer.cjs.txt`). Lo que ya midió el
QA de Fable (crear, editar desde el lector, borrar, estado vacío) y `C42a` (persistencia, fríos, cortes) no se
repitió.

## Lo medido

Siembra: 4 notas en 4 libros, creadas en este orden: Génesis 1:3, Juan 1:1, Romanos 8:1, Salmos 23:1 (así el orden por
libro no coincide con el de creación; `S139-n4.db.txt`).

| Camino                                                                         | Resultado                                                                                                                                             |
| ------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------- |
| «Recientes» / «Antiguas» / «Por libro»                                         | ✅ Salmos-Romanos-Juan-Génesis / al revés / Génesis-Salmos-Juan-Romanos (`S139-lib.xml.txt`)                                                          |
| Buscar `genesis` (sin tilde)                                                   | ✅ solo Génesis 1:3 (`S139-b1.xml.txt`)                                                                                                               |
| Buscar `palabra` (la nota dice `PALABRA`)                                      | ✅ solo Juan 1:1                                                                                                                                      |
| Buscar `condenacion` (solo en el versículo: «condenación»; la nota, «condena») | ✅ solo Romanos 8:1: el texto del versículo entra en la búsqueda                                                                                      |
| Buscar `jehova pastor` (dos palabras, sin tilde)                               | ✅ solo Salmos 23:1                                                                                                                                   |
| Buscar `xyzq`                                                                  | ✅ «Ninguna nota coincide con tu búsqueda»                                                                                                            |
| La ✕ del buscador                                                              | ✅ vuelven las 4, con el orden elegido intacto                                                                                                        |
| Compartir como imagen → compartir → atrás                                      | ✅ la tarjeta y la hoja del sistema (`S139-comp2.png`); al volver, el modal se cierra solo (por diseño: `NoteImageModal.tsx:83`, `onShared: onClose`) |
| **Tocar el chip «Juan 3:16» de una nota SIN cambiarla**                        | 🐛 `updated_at` 14:17:30 → 14:24:35, la nota pasa al primer lugar de «Recientes» (`R9-564`)                                                           |
| **Enlace a Salmos 23 con el editor de la nota de Romanos 8:1 abierto**         | 🐛 la cabecera dice «Salmos 8:1»; GUARDAR guarda en Romanos 8:1 (`R9-565`)                                                                            |

**`R9-564`:** la lectura antes y después del toque (`S139-n4.db.txt`, `S139-chip-despues.db.txt`): misma `id`, mismo
texto, `updated_at` nuevo. «Recientes» pasa de Salmos-Romanos-Juan-Génesis a Génesis-Salmos-Romanos-Juan
(`S139-rec2.xml.txt`). Por código, el mismo `saveNote` cierra la hoja, saca el toast «Nota guardada» y encola un
`queueWrite` (`[chapter].tsx:1095-1104`); la ráfaga (`S139-chiptoque-r*.png`) no alcanzó a ver el toast.

**`R9-565`:** `S139-cabecera-mezclada.png`, `S139-cab3.xml.txt` (cabecera «Salmos 8:1», campo con la nota de Romanos) y
`S139-n3b.db.txt` (la fila nueva es `Romans 8:1`).

## Observaciones de `C42a`, cerradas

- **El chip que no sale tras un número: descartado como hallazgo.** Medido: en «Nota luz ver Juan 3:16 y dia 5 Juan
  1:1» sale solo el chip «Juan 3:16» (`S139-nota1.xml.txt`). Es la regla deliberada de `linkifyReferences`: un número
  suelto delante del libro se pega a la referencia y se re-valida (`parseReference.ts:211-240`,
  `extendMatchWithLeadingNumeral`, para que «2 Esd 7:20» no enlace a Esdras), con su prueba
  (`dictionaryCitationBounds.test.ts:246`). «5 Juan 1:1» no existe, así que no enlaza. Buscado en `BUGS.md`
  (`linkifyReferences`, `getReferencedVerses`, `extendMatchWithLeadingNumeral`, `numeral`): no estaba.
- **El re-guardado al tocar el chip:** ahora `R9-564`.

## Observaciones sin numerar

- Dos toques a GUARDAR (Romanos 8:1) no guardaron. El primero, sin efecto visible y **sin causa establecida**: el
  dump siguiente da el texto sin cambios, y el log de Metro entre 14:18:56 y 14:20:32 no tiene ningún error (solo el
  aviso de las voces de TTS). El segundo escribió un espacio en la nota: el teclado había vuelto a abrirse (la cara
  de `R9-561`). El tercero, con `mInputShown=false`, guardó. Sin número: no se reprodujo.
- «Antiguas» ordena por `updated_at`, no por `created_at` (`noteFilter.ts`, documentado y probado en
  `__tests__/noteFilter.test.ts`): una nota vieja editada hoy baja al final. Es de diseño.
- Entorno: Play actualizó WebView y mató la app una vez (`am_kill … due to installPackageLI`), como en la 115.

## Sin medir

- Borrar desde la lista con búsqueda activa; la búsqueda con la versión en inglés (la referencia del pajar sigue al
  idioma de la versión: `notes.tsx:109-117`, la forma de `R9-56`); notas de varios versículos.
- PREMIUM (sin gating); el sync y la cuenta (cuenta anónima).

## Receta

1. `S139-ui.sh.txt`: `link 'verse/Romans/8?verse=1'` → `dump <n> 'versículo 1,'` → `seq <n> - t=<versículo>
t=1046,2190 x=<texto%scon%sespacios> k=4` (Nota en `1046,2190`; atrás cierra el teclado) → `tap 640 2656` (GUARDAR,
   con el teclado cerrado: comprobá `dumpsys input_method | grep mInputShown`) → `leer <n>`.
2. Lista: `link notes`; buscador `679,735`, su ✕ `1166,735`; órdenes `180,882` / `459,882` / `726,882`.
3. `R9-564`: abrir la nota en el lector → atrás (teclado) → tocar el chip (`238,2442`) → `leer` → «Recientes».
4. `R9-565`: con la hoja abierta y el teclado cerrado, `link 'verse/Psalms/23?verse=1'` → `dump` → GUARDAR → `leer`.
