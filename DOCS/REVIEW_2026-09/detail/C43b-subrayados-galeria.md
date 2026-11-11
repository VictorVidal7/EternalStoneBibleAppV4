# C43b — Subrayados: colores y galería (Modo C, sesión 139)

**Estado: 🐛 BUG (P3) — `R9-566` (las muestras de color del filtro de la galería no tienen nombre para el lector de
pantalla) y `R9-567` (con un versículo seleccionado, el atrás sale del lector en vez de cerrar la selección). Los 8
colores, los filtros combinados, el modo agrupado y compartir: ✅ OK.** Sin agentes; el mismo entorno que `C42b`
(`emulator-5554`, APK debug vc73, Metro sobre `dd3568f`, español, RVR1960, cuenta anónima, **FREE**; los subrayados
no tienen gating, `C43a`). Evidencia: `_scratch/S139-sondas/` (lecturas `S139-<n>.db.txt` de `highlights`; los colores
pintados, con `_scratch/S139-pix.cjs.txt` sobre la captura). Lo que ya midieron el QA de Fable (crear, filtro por
color, búsqueda simple, editar, las dos vías de quitar) y `C43a` (persistencia, recolorear, vaciar, cortes, la ✕) no
se repitió.

## Lo medido

Siembra: los 8 colores del selector del lector, uno por versículo, en Génesis 1:1-8 (`S139-c4.db.txt`); después,
nota y categoría «Promesa» en 1:3 (azul, nota «Kappa luz») y 1:5 (rosa, nota «sigma») por la galería
(`S139-hl-edit.db.txt`).

| Camino                                                                   | Resultado                                                                                              |
| ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------ |
| El selector del lector: 8 colores + ✕                                    | ✅ cada uno con nombre («Resaltar en amarillo»…, `S139-pick4.xml.txt`)                                 |
| Los 8 colores guardados frente a la paleta                               | ✅ `#FFF59D` … `#E0E0E0`, los de `HighlightColor` (`src/lib/highlights/index.ts:19-28`)                |
| Los 8 colores PINTADOS en las muestras de la galería                     | ✅ idénticos a los guardados (`S139-gal1.png`, muestreados píxel a píxel)                              |
| Filtro por color (azul)                                                  | ✅ solo 1:3                                                                                            |
| Categoría «Promesa» → + rosa → + buscar `kappa` → todos los colores      | ✅ 1:3 y 1:5 → solo 1:5 → «Ningún resaltado coincide con el filtro» → solo 1:3 (`S139-fc1..4.xml.txt`) |
| Modo «Por color»                                                         | ✅ grupos en el orden de `HIGHLIGHT_COLOR_ORDER` (amarillo, naranja, rojo, rosa…), con su cuenta       |
| «Compartir mis resaltados» → compartir → atrás                           | ✅ la tarjeta («8 versículos resaltados») y la hoja del sistema; al volver, el modal se cierra solo    |
| **Las muestras del filtro de color con lector de pantalla**              | 🐛 8 botones con `content-desc=""` y sin texto (`S139-gal1.xml.txt`; `R9-566`)                         |
| **Atrás con un versículo seleccionado y el selector de colores abierto** | 🐛 el primer atrás sale del lector a la galería; el segundo, a Notas (`S139-at1..3.xml.txt`; `R9-567`) |

## Observaciones sin numerar

- Las muestras del filtro siguen el orden de los subrayados (el de creación), no `HIGHLIGHT_COLOR_ORDER` como los
  grupos: los dos órdenes conviven en la misma pantalla. Cosmético.
- El contador de la cabecera («8 versículos resaltados») no cambia con los filtros; la pestaña Notas hace lo mismo.
- El botón del modo dice «Lista» en pantalla y «Por color» al lector de pantalla (`highlights.tsx:386-405`: la
  etiqueta es la acción y el estado va en `selected`). No se midió con TalkBack.

## Sin medir

- La ✕ sobre una selección múltiple con notas (`C43a`), la mitad en la nube de `R9-44`/`R9-45`/`R9-50` (cuenta
  anónima) y PREMIUM (sin gating).
- Lo que TalkBack lee de verdad (el dump da el árbol de accesibilidad, no la voz); el modo agrupado con muchos
  subrayados; la galería con la versión en inglés.

## Receta

1. Lector: `link 'verse/Genesis/1?verse=1'` → cerrar el aviso de Foco (`1139,571`) → tocar el versículo → Resaltar
   (`505,2392`) → color en `y=2418` (amarillo `159` … gris `1001`, ✕ `1121`); tras el primero, el logro (`641,2022`).
2. Galería: `link highlights`; muestras en `y=704` desde `x=336` cada 132 px (sin nombre: el color se lee con
   `node S139-pix.cjs.txt <captura> x,y`); con categorías, la fila de categorías en `y=848`, el buscador en `679,1004`
   y «Por color» / «Compartir» en `y=1151`. Editar: lápiz → categoría (`y=2363`) → campo (`640,2078`) → texto → atrás
   → Guardar (`933,2676`).
3. `R9-567`: `link 'verse/Genesis/2?verse=1'` → tocar un versículo → Resaltar → atrás → `dump`.
