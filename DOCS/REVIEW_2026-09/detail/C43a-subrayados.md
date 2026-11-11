# C43a — Subrayados: persistencia (Modo C, sesión 138)

**Estado: 🐛 BUG (P2) — `R9-562` (P2) y `R9-563` (P3); la hoja de edición tapada por el teclado suma a `R9-561`. La
persistencia: ✅ OK, y los arreglos de `R9-44` y `R9-50` se sostienen en vivo.** Agente 3, `emulator-5554` (segunda
ola, tras `pm clear`), APK debug vc73, Metro sobre `6e81d56`, en inglés, WEB, cuenta anónima, **FREE** (leído dos
veces; los subrayados no tienen gating: `highlights.tsx` no usa `isPremium`). Evidencia:
`_scratch/S138-sondas-agente-3/` (informe `S138-a3-informe.md.txt`; lecturas `S138-a3-<n>.db.txt` de `highlights` y
`notes` en `files/SQLite/bible.db`, sin `-wal`). Re-verificado por el orquestador: el camino de la ✕
(`[chapter].tsx:3170-3176` → `:1492-1502` → `HighlightService.ts:172-173`), el `Modal` de la hoja de edición
(`highlights.tsx:553-557`) y la búsqueda de las claves en `BUGS.md` y `detail/`.

## Lo medido (lectura de `highlights` tras cada paso; fríos con `force-stop`)

| Camino                                                                               | Resultado                                                                                 |
| ------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| Aplicar amarillo, verde y azul desde el lector (Marcos 2); frío                      | ✅ 3 filas, intactas tras el frío (`S138-a3-13-frio1.db.txt`)                             |
| Nota + categoría por la galería (Edit → categoría → nota → Save); editar y cambiar   | ✅                                                                                        |
| **Recolorear un subrayado CON nota (la clase de `R9-44`)**                           | ✅ mismo `id` y `created_at`, nota y categoría intactas (`S138-a3-24-recolor-v5.db.txt`)  |
| Recolorear en selección múltiple (uno con nota, otro sin subrayar)                   | ✅ el primero conserva todo; el segundo nace con NULL (`S138-a3-28-multi-naranja.db.txt`) |
| **Vaciar nota y categoría y guardar (la clase de `R9-50`)**                          | ✅ `note`/`category` en NULL, también tras fríos (`S138-a3-44`, `-45`, `-80`)             |
| Cuatro fríos seguidos                                                                | ✅ filas idénticas en cada uno                                                            |
| Corte inmediato tras tocar un color: a 0 s / a 0,3 s                                 | a 0 s no se escribe nada; a 0,3 s, entero, con la nota intacta (`S138-a3-59`, `-62`)      |
| Corte sin guardar con la hoja de edición abierta (`force-stop`; HOME + `force-stop`) | la fila intacta; el borrador se pierde                                                    |
| **La ✕ del selector del lector sobre un subrayado CON nota, dos veces (2:5 y 2:3)**  | 🐛 la fila desaparece con su nota y su categoría, sin confirmar (`R9-562`)                |
| Papelera de la galería sobre un subrayado con nota                                   | confirma («Remove this highlight?»), pero no nombra la nota                               |
| Atrás con la hoja de edición abierta                                                 | 🐛 el segundo atrás descarta el borrador sin avisar; gana el `Modal` (`R9-563`)           |
| Teclado abierto en la hoja de edición                                                | 🐛 tapa el campo de nota y Cancel/Save (`S138-a3-16-tecleado.png`; suma a `R9-561`)       |
| La nota del VERSÍCULO (tabla `notes`) frente a la ✕                                  | sobrevive: un versículo puede tener dos notas en dos tablas                               |

## Observaciones sin numerar

- La instalación arrancó FREE tras el `pm clear` de hoy (Ajustes → Extras: «Unlock with premium», el toggle de dev
  apagado): en la 115 y la 137, cada instalación nueva con la cuenta del AVD arrancaba premium. Dato de entorno.
- Un deep link `WARM` tras salir de la app con atrás cayó en Home sin abrir la galería; con la app al frente, sí.
- `uiautomator dump` falla en el Home animado («could not get idle state»): el script de espera agota su tope ahí.

## Sin medir

- La mitad en la nube de `R9-44`/`R9-45`/`R9-50` y la lápida que deja `R9-562` (cuenta anónima, sin sync).
- PREMIUM (sin gating); la ✕ sobre una selección múltiple con notas (por código, el mismo bucle `:1487-1502` las
  borraría todas); compartir y el modo agrupado de la galería; atrás con el selector de colores abierto.

## Receta

1. Herramientas: `S138-a3-ui.sh.txt` (`leer` copia `bible.db` con la app viva a `/c/tmp/s138-a3/`, fuera del repo, y
   vuelca `highlights` + `notes` con `S138-a3-leer.cjs.txt`; `frio`; `tapdump`; `link`) y `S138-a3-corte-color.sh.txt`
   (toque + espera + `force-stop` en un solo shell remoto).
2. Lector: `eternalbible://verse/Mark/2` → tocar el versículo → Highlight → selector en `y=2418` (gris `1001`, ✕
   `1121`: 120 px).
3. Galería: `eternalbible://highlights` → Edit → categoría → campo → texto sin «rr» → atrás (cierra el teclado) → Save.
4. Tras cada paso, `leer`; al final, Ajustes → Extras para el estado de premium.
