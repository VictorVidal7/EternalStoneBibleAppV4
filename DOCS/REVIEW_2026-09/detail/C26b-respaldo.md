# C26b — Respaldar/restaurar (`BackupService`) (Modo C, sesiones 137 y 138)

**Estado: 🐛 BUG (P2): `R9-560` (P2, sesión 138) y `R9-557` (P3, sesión 137).** Sesión 137: agente 2,
`emulator-5556`, evidencia en `_scratch/S137-sondas-agente-2/` (informe `S137-a2-informe.md.txt`; lecturas `*.rk.txt`
de `bible.db` y RKStorage; capturas, dumps, logcat). Sesión 138, el control de toasts: agente 2, `emulator-5556`,
Metro sobre `6e81d56`, en español, PREMIUM, cuenta anónima (`_scratch/S138-sondas-agente-2/`, informe
`S138-a2-informe.md.txt`, sección 1), con un dato del agente 1 (`_scratch/S138-sondas-agente-1/`).

## Entorno

Instancia de solo lectura de `Pixel_9_Pro`, APK debug vc73, Metro en `aab7ead`, `pm clear` y onboarding (Español,
RVR1960). Cuenta anónima (sin sync). Premium por la ofrenda de la cuenta del AVD, con el toggle de dev encendido.
La hoja de compartir se capturó y se cerró con atrás; el import se hizo desde «Downloads» local.

## Lo medido (con lectura del almacenamiento antes y después)

| Camino                                                                                    | Resultado                                                 |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------- |
| Sembrar: nota, subrayado con nota y categoría, favorito, tarjeta + repaso, progreso, Mesa | leído en `bible.db` y RKStorage                           |
| Exportar → hoja de Android → atrás                                                        | ✅ `cache/eternalstone-backup-<fecha>.json`, 18 124 B     |
| El JSON frente a lo sembrado                                                              | ✅ todo está; `degradedSections: []` (fuera: `R9-30`)     |
| Borrar subrayado y favorito, nota nueva, editar la Mesa; importar                         | ✅ reemplaza, como dice el diálogo (lo nuevo se va)       |
| Dos fríos tras importar; importar el mismo archivo dos veces                              | ✅ igual; sin duplicados                                  |
| Cancelar en la confirmación                                                               | ✅ nada cambia                                            |
| Malformado (63 B) y truncado                                                              | ✅ `not valid JSON`; el almacenamiento no cambia          |
| De otra app sin `formatVersion`                                                           | ✅ `missing or invalid formatVersion`                     |
| De otra app con `formatVersion: 1`                                                        | **«Tu copia se importó correctamente» sin escribir nada** |
| Una sección con filas inválidas (`failedSections:["notes"]`)                              | **el mismo aviso de éxito; la Mesa sí cambió**            |

Observación (no hallazgo): la confirmación «Esto reemplazará tus datos… no se puede deshacer» se pide antes de
leer el archivo (`DataSettings.tsx:114-121`; `performImport` lo parsea en `:135-136`): con un archivo roto, el
usuario confirma un reemplazo que no ocurre.

## Hallazgo

- **`R9-557` (P3):** el diálogo bloqueante tras importar dice «Tu copia se importó correctamente» aunque una sección
  haya fallado o no se haya restaurado nada. `DataSettings.tsx:139-158` llama a `setRestartNoticeVisible(true)`
  también con `failedSections` (comentario «Shown for a partial import too»), y el diálogo (`:336-345`) usa un solo
  texto, `importRestartMessage` (`translations.ts:4185-4186`). Re-verificado por lectura en la 137. Ver `BUGS.md`.
- **`R9-560` (P2, sesión 138):** los toasts del modal «Datos» se dibujan DETRÁS del modal y no se ven. El toast es un
  `View` en la ventana principal (`ToastContext.tsx:114-135`; el comentario de `:118-126` acepta el caso como raro), y
  `DataSettings.tsx:288-311` es un `Modal` opaco a pantalla completa (otra ventana de Android) que contiene todas las
  acciones (`actionsContent`, `:170`, `:308`). Re-verificado por el orquestador: el código y la captura de la
  separación. Ver `BUGS.md`.

## El control de toasts (sesión 138)

El toast aparece ~0,7-1,0 s después del toque y dura ~3 s: la 137 capturaba tarde. Método: una ráfaga de 14
capturas arrancada en segundo plano ANTES del toque (cada ~0,4 s, 5 s), y el dump después.

| Brazo                                                                               | Resultado                                                                                                                                          |
| ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| Fuera, sin `Modal` cerca: lector → barra de selección (un `View`) → «Copiar»        | ✅ toast visible de ~0,9 a ~2,9 s (`S138-a2-t1-copiar-r4.png`)                                                                                     |
| Fuera: crear una nota (`saveNote` cierra el editor y llama a `toast.success`)       | ✅ visible a ~0,7 s; a ~2 s el `Modal` del logro se abre ENCIMA y lo tapa                                                                          |
| Fuera: editar la misma nota y guardar (sin logro)                                   | ✅ visible de ~0,7 a ~3,6 s (`S138-a2-t3-editar-r6-franja.png`)                                                                                    |
| Dentro: importar `S138A2-malformado.json` (63 B) desde Descargas, dos veces         | ❌ 0 de 14 capturas con toast; logcat `Backup import failed … not valid JSON`                                                                      |
| Separación: el mismo import, y cerrar el modal con la ✕ 1,15 s después de confirmar | el toast ROJO aparece en Ajustes en cuanto el modal se va (`S138-a2-t5-imp-y-cerrar-r10.png`) y se va a ~3,9 s de confirmar: estaba montado detrás |
| Dato del agente 1 (`C27a`): el toast de éxito del reset (`DataSettings.tsx:81`)     | ❌ 16 capturas idénticas por md5 durante ~4,5 s tras el fin del spinner                                                                            |

Medido: `importError` (`:164`) y el éxito del reset (`:81`). Por lectura, el mismo camino: `resetError` (`:83`),
`exportPartial`/`exportError` (`:104`, `:107`), el `importError` del selector (`:123`), `importPartial` (`:152`) e
`importSuccess` (`:154`). Observaciones sin numerar: el toast se dibuja a `top: 20` (`Toast.tsx:193-195`) y en
Android 16 (borde a borde) queda sobre la barra de estado; el de `importError` corta el texto a dos líneas.

## Sin medir

- Los toasts del modal salvo `importError` y el éxito del reset (van por lectura, el mismo camino).
- El aviso de sync del diálogo y la subida tras importar (cuenta anónima, no hay sync).

## Receta

1. Sembrar con valores raros y leer `bible.db` + RKStorage por `exec-out run-as … cat` (`S137-a2-leer.sh.txt`).
2. Ajustes → «Gestionar datos» → Exportar → capturar la hoja → ATRÁS; leer el JSON de `cache/` con `run-as`
   (`S137-a2-json.cjs.txt`).
3. `MSYS_NO_PATHCONV=1 adb push <archivo> /sdcard/Download/<x>.json`; Importar → «Downloads» local → «Importar y
   reemplazar» → leer el almacenamiento (`S137-a2-importar.sh.txt <archivo> <etiqueta> [cancelar]`).
4. Archivos de prueba: `S137-a2-archivos.cjs.txt` (malformado, truncado, otra app) y `S137-a2-parcial.cjs.txt`.
5. Toasts (138): la ráfaga de capturas en segundo plano antes del toque, y la separación con
   `(sleep 1.6; adb -s S shell input tap 102 230) &` (la ✕ del modal) antes de confirmar (informe del agente 2 de la
   138, receta). En debug, dos «r» seguidas tecleadas con `adb input text` recargan el JS: textos sin «rr».
