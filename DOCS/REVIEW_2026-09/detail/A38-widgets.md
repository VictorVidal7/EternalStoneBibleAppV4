# A38 — Widgets (`src/widgets/`, `features/widgets`, el widget nativo)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 129 (2026-11-04, en el mismo chat que la 128;
> con 8 agentes a pedido de Victor, 1 en esta fila) · Estado **🐛 BUG** (cerrada en la 129)

> **Resultado:** 3 hallazgos, todos P3, ninguno P0: `R9-515` (el «VERSO DEL DÍA» del escritorio queda un día atrás
> buena parte del día), `R9-516` (la cabecera en español con el teléfono en inglés) y `R9-517` (comillas dobladas
> en 33 versículos en inglés). Una nota suma a `R9-471` (el toque del widget nativo abre el capítulo arriba) y otra
> CORRIGE `R9-451`: el widget nativo existe y está registrado. Los 396 textos del widget son letra por letra los de
> la base.

> **Cómo se midió:** un agente (relanzado como agente nuevo tras el corte, en worktree, sobre `523e9a8`) que solo
> midió: `src/widgets/` (`VerseWidget.tsx`, `WidgetTaskHandler.ts`, `index.ts`), `src/screens/WidgetsDemoScreen.tsx`,
> `app/features/widgets.tsx` y el widget nativo: `plugins/widget-files/VerseWidgetProvider.kt` (generado por
> `scripts/build-widget-verses.js`), `plugins/with-verse-widget.js` (cargado por `app.json:24`) y sus xml. La sonda
> (`_scratch/S129-sondas-agente-6/S129-a6-widgetNativo.test.tsx.txt`, 8/8) lee el `.kt` y reproduce su lógica con
> los datos reales; re-medida igual en el principal con `TZ=America/Mexico_City`. Lo ya dicho por `R9-451`, `R9-471`,
> `R9-172`, `A14`, `A24`, `A27`, `A30`, `A31` y Fable (área 37, ✅) no se re-derivó, salvo la premisa falsa de
> `R9-451`.

## Hallazgos

- **`R9-515` (P3):** `verse_widget_info.xml:13` (`updatePeriodMillis` 24 h desde el registro), sin
  `DATE_CHANGED`/`TIME_SET` en el `receiver` (`with-verse-widget.js:87-97`) y `refreshAll` (`.kt:350-359`) sin
  llamador: colocado a las 20:00, muestra el versículo de ayer hasta las 20:00 del día siguiente.
- **`R9-516` (P3):** `@string/verse_widget_label` solo en `values/` (`with-verse-widget.js:112-131`).
- **`R9-517` (P3):** `.kt:322` envuelve en comillas textos WEB que ya las traen (33 de 198).

## Notas a hallazgos viejos (sin número)

- **`R9-451` (corrección):** «no hay widget nativo registrado» es falso (`app.json:24`, desde `f5f02cc`); el
  widget nativo sigue el idioma del teléfono con RVR1960/WEB fijas, a propósito (`.kt:31-42`). La vista previa no
  se le parece en versión, fondo (`VerseWidget.tsx:74-76` contra `verse_widget_bg.xml:8-14`) ni cabecera.
- **`R9-471`:** el widget nativo arma `?highlight=` (`.kt:330-332`), el 196.º sitio, fuera del JS.
- `detail/A14:124` llama «tarea sin cabeza» al `WidgetTaskHandler`: nada la registra; solo corre dentro de la app
  (`_layout.tsx:242` y la vista previa).

## Revisado sin hallazgo

- La lista del widget es la de la app (198 = 198, mismo orden); los 396 textos (RVR1960 y WEB) son los de
  `bible-seed.db`; el índice del día coincide con el de la app los 365 días de 2026 (sin horario de verano: el `.kt`
  lo calcula bien y la app no, `R9-172`); el paquete del `.kt` coincide con `app.json:53`; `FLAG_IMMUTABLE`;
  `exported="true"` es lo normal; el widget se ve sin haber abierto la app; `WidgetsDemoScreen` sin premium y con
  los dos idiomas; `src/widgets/index.ts` es un barril muerto (`A31:63`).
- Ayuda a `A39`: las 42 entradas de `BIBLE_FACTS` existen en RVR1960 y WEB, ids únicos
  (`S129-a6-factsRefs.test.ts.txt`, 1/1); «Abrir en el lector» manda `?verse=`.

## Sin medir

- **Modo C:** `R9-515` en el escritorio (colocar a una hora, adelantar el reloj); el toque con la app abierta
  (`FLAG_ACTIVITY_CLEAR_TOP`); versículos largos con `maxLines="5"`; la vista del selector de widgets.
- Si la tarjeta del inicio dobla las comillas con WEB (otra fila).

**Cruce con las vecinas (§5, sesión 116):** `A39` (Datos bíblicos) comparte la familia de `R9-430`; `R9-172` (el
día del año en la app) sigue abierto y es la otra mitad del desfase del widget.
