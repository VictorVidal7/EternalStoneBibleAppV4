# C26b — Respaldar/restaurar (`BackupService`) (Modo C, sesión 137)

**Estado: 🐛 BUG (P3): `R9-557`.** Agente 2, `emulator-5556`. Evidencia: `_scratch/S137-sondas-agente-2/` (informe
`S137-a2-informe.md.txt`; lecturas `*.rk.txt` de `bible.db` y RKStorage; capturas, dumps, logcat).

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

## Sin medir

- **Los toasts del modal «Datos».** El agente no vio ningún toast en su instancia: ni `importError`/`importPartial`
  dentro del modal, ni fuera (copiar versículo, el toggle de dev). Por lectura, `ToastContext.tsx:118-126` admite que
  un toast se dibuja en la ventana principal y puede quedar DETRÁS de un `Modal` nativo, y todas las acciones del
  respaldo viven dentro del `Modal` de `DataSettings.tsx`. Falta separar «tapado por el Modal» de «no se dibuja en
  esta instancia»: un toast fuera de cualquier modal, con `uiautomator dump` en la misma llamada que el toque.
- El aviso de sync del diálogo y la subida tras importar (cuenta anónima, no hay sync).

## Receta

1. Sembrar con valores raros y leer `bible.db` + RKStorage por `exec-out run-as … cat` (`S137-a2-leer.sh.txt`).
2. Ajustes → «Gestionar datos» → Exportar → capturar la hoja → ATRÁS; leer el JSON de `cache/` con `run-as`
   (`S137-a2-json.cjs.txt`).
3. `MSYS_NO_PATHCONV=1 adb push <archivo> /sdcard/Download/<x>.json`; Importar → «Downloads» local → «Importar y
   reemplazar» → leer el almacenamiento (`S137-a2-importar.sh.txt <archivo> <etiqueta> [cancelar]`).
4. Archivos de prueba: `S137-a2-archivos.cjs.txt` (malformado, truncado, otra app) y `S137-a2-parcial.cjs.txt`.
