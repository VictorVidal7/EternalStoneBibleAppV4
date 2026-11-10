# C27a — Ajustes: borrar cuenta y reset de datos (Modo C, sesión 137)

**Estado: EN CURSO, sin hallazgo todavía.** Agente 2, `emulator-5556`, cortado por el límite de uso con el reset de
la Biblia a medio recargar. Evidencia: `_scratch/S137-sondas-agente-2/` (informe `S137-a2-informe.md.txt`,
`S137-a2-24-durante-reset.rk.txt`).

## Lo medido

- Antes del reset: KJV descargada y elegida como versión de lectura (93 302 versículos), más los datos sembrados de
  `C26b` (favorito, nota, subrayado, mazo, repaso, Mesa).
- Ajustes → «Gestionar datos» → reset de la Biblia → confirmar. Logcat quedó más de 8 min en «Loading RVR1960 Bible
  data...»; Metro tardó 161,6 s solo en empaquetar `bible-data-rvr1960.ts` (en parte, costo del build de debug).
- A los ~9 min: `verses` = 0, las tres banderas `@bible_data_loaded_*` borradas (también la de KJV),
  `@bible_version` sigue en `KJV`. Lo del usuario, intacto: favoritos, notas, subrayados, repasos, mazo y Mesa.

## Sin medir

- **«Borrar cuenta» y «Cerrar sesión»:** con la cuenta anónima no existen en la UI (`app/(tabs)/settings.tsx:541`).
  Necesitan una cuenta de Google de PRUEBA (como `C26a`).
- El final de la recarga y la lectura después.
- **Si KJV se pierde.** Por lectura del agente, el reset borra los versículos de todas las versiones y recarga solo
  RVR1960 y WEB, y el diálogo no lo dice; falta verlo en el aparato, y qué muestra el lector con KJV elegida y sin
  versículos. **Sin re-verificar por el orquestador:** es lo primero de la 138.
- La búsqueda tras el reset, cerrar la app a mitad de la recarga, y otros resets fuera de «Gestionar datos».
