# C27a — Ajustes: borrar cuenta y reset de datos (Modo C, sesiones 137 y 138)

**Estado: 🐛 BUG (P2) — `R9-558` (P2) y `R9-559` (P3).** «Borrar cuenta» y «Cerrar sesión» quedan «sin medir» (cuenta
de Google de PRUEBA). Sesión 137: agente 2, `emulator-5556`, cortado con el reset a medio recargar
(`_scratch/S137-sondas-agente-2/`). Sesión 138: agente 1, `emulator-5554`, APK debug vc73, Metro sobre `6e81d56`,
cuenta anónima, en inglés (`_scratch/S138-sondas-agente-1/`, informe `S138-a1-informe.md.txt`). Re-verificado por
el orquestador: el código citado (`data-loader.ts:144-166`, `:14-43`; `[chapter].tsx:1952-1962`, `:2492`;
`study.tsx:155-158`; `translations.ts:4153-4154`), la lectura tras el reset (sin `-wal`: la base no está en WAL) y
la captura del lector en blanco.

## Lo medido

- **Antes del reset (137 y 138):** KJV descargada y elegida (KJV 31 102 + RVR1960 31 102 + WEB 31 098 = 93 302
  versículos, índice FTS igual; `S138-a1-08-con-kjv.rk.txt`, `S138-a1-09-kjv-elegida.rk.txt`), lector en KJV.
- **Lo que el reset dice que NO toca** (favoritos, notas, subrayados, repasos, mazo y Mesa): intacto, medido en la
  137 (`S137-a2-24-durante-reset.rk.txt`). No se re-midió.
- **El reset pierde KJV — `R9-558`.** Tras la recarga, en el MISMO proceso: KJV = 0 filas, sin su bandera,
  `@bible_version` = `KJV` (`S138-a1-17-tras-reset.rk.txt`); Ajustes sigue marcando KJV y Gestionar versiones dice
  «Installed» (`S138-a1-21-ajustes-kjv-instalada.png`); la búsqueda de «love» da «No results found»
  (`S138-a1-23-busqueda-love.png`). Tras el frío, el lector cae a WEB, Gestionar versiones ofrece «Download» sin
  aviso, la clave sigue en `KJV` y el modo estudio muestra «(text not available)» en dos fríos seguidos
  (`S138-a1-48-r3-estudio.png`, `S138-a1-49-r3-frio2.rk.txt`). Control: al elegir WEB a mano, la clave pasa a `WEB`
  y el estudio muestra el texto (`S138-a1-58-control-web.rk.txt`). Medido tres veces (dos en el mismo proceso).
- **El lector con 0 versículos — `R9-559`.** John 4 y Genesis 1 en KJV sin filas: cabecera y barra, cuerpo vacío, sin
  mensaje ni reintento (`S138-a1-19-lector-j4.png`, `S138-a1-35-r2-gen1.png`, 0 nodos «Verse» en el dump). La
  pantalla ya montada conserva el capítulo anterior: hay que ir a uno nuevo.
- **Recuperación ✅:** volver a bajar KJV funciona (31 102 filas, índice 93 302), tras el frío y sin frío
  («Remove» + «Download»; `S138-a1-42-r2-recuperada.rk.txt`). Sin red, el usuario se queda sin su versión.
- **Cerrar la app a mitad de la recarga ✅:** con 4 000 filas de RVR1960 y sin banderas
  (`S138-a1-54-r4-tras-kill.rk.txt`), el siguiente arranque recarga todo: 62 200 filas, índice sin duplicados,
  banderas de vuelta (`S138-a1-56-r4-tras-frio.rk.txt`); la búsqueda funciona.
- **Duración:** la recarga tarda 6-17 s en debug con Metro en caché. Los 8+ min de la 137 eran el primer
  empaquetado de `bible-data-rvr1960.ts`.
- **Dato para `C26b`:** el toast de éxito del reset (`DataSettings.tsx:81`) no se vio dentro del modal «Datos»: en
  el reset 2, 16 capturas idénticas por md5 cubren ~4,5 s tras el fin del spinner (más que los 3000 ms del toast;
  `S138-a1-33-reset2-r01..r16.png`). Ver `detail/C26b-respaldo.md`.
- **Observación sin numerar (no investigada, fuera de la fila):** tras cerrar el modal «Datos» y salir por deep
  link, volver a `eternalbible://settings` lo mostró abierto otra vez (dos veces).

## Sin medir

- **«Borrar cuenta» y «Cerrar sesión»:** con la cuenta anónima no existen en la UI (`app/(tabs)/settings.tsx:541`).
  Necesitan una cuenta de Google de PRUEBA (como `C26a`).
- El reset con datos del usuario sembrados en esta instancia (la 137 midió que no los borra; que no se desenganchan
  es por lectura: los datos del usuario no dependen de `verses.id`, `index.ts:540-577`,
  `HighlightService.ts:24-35`).
- Las otras seis pantallas que leen `@bible_version` directo (solo se midió el modo estudio).
- El reset y la nueva descarga sin red; el tiempo de recarga en release; la pantalla de inicio en el mismo proceso.

## Receta

1. Herramientas: `S138-a1-ui.sh.txt` (`leer` copia `bible.db` y RKStorage con la app VIVA por `run-as cat`) y
   `S138-a1-leer.cjs.txt` (versículos por versión, filas del índice, MATCH, banderas, `@bible_version`);
   `S138-a1-reset.sh.txt` (toca «Reset» y sondea el logcat cada 0,5 s; ráfaga de 16 capturas al fin, o `kill`).
2. Onboarding → Ajustes → Gestionar versiones → Download KJV → elegirla → lector (KJV) → `leer`.
3. «Manage data» → «Reset Bible Data» → «Reset» → `leer` SIN frío (con `R9-424`, un frío pasaría la versión a la
   empaquetada y taparía el caso) → cerrar el modal → lector en un capítulo NUEVO → Ajustes → búsqueda.
4. Frío → `leer` → lector → Ajustes → `eternalbible://features/study?book=John&chapter=3&verse=16` → segundo frío.
5. Recuperación: Download KJV → `leer`. Corte: `S138-a1-reset.sh.txt <tag> 892 1763 kill` → `leer` → frío → `leer`.
