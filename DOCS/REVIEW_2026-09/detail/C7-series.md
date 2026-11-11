# C7 — Series: crear, agregar, reordenar, renombrar, borrar (Modo C, sesión 139)

**Estado: ✅ OK.** Sin hallazgos nuevos. Sin agentes; el entorno de `C42b` (`emulator-5554`, APK debug vc73, Metro
sobre `dd3568f`, español, RVR1960, cuenta anónima), **PREMIUM con el toggle de dev** (`checked="true"`,
`S139-aj9.xml.txt`), que se apaga en cada frío y en cada recarga del JS. Evidencia: `_scratch/S139-sondas/`
(`S139-se-crear.db.txt` y `S139-se-frio.db.txt`: `@prep_series` en RKStorage). La capa de datos
(`prepSeriesStore.ts`, su cola y su turno) ya la revisó el Modo A (`R9-305` y vecinos); el QA de Fable midió el
camino feliz completo (crear, agregar, duplicado, inválido, reordenar, quitar, renombrar, borrar con confirmación,
orden de la lista), que no se repitió.

## Lo medido

| Camino                                                          | Resultado                                                                                                                 |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| «Nueva serie» con tipo «Expositiva» → Crear                     | ✅ `sermonType: "expositiva"` en `@prep_series`, el chip marcado `selected` (`S139-se6.xml.txt`)                          |
| Agregar `exodo 3:1-6` e `isaias 53:5` (sin tilde) y `Juan 3:16` | ✅ «Éxodo 3:1-6», «Isaías 53:5», «Juan 3:16»; «0 de 3 con preparación iniciada» (`S139-se7.xml.txt`)                      |
| «Subir» en Juan 3:16                                            | ✅ Éxodo, Juan, Isaías (`S139-se9.xml.txt`)                                                                               |
| Renombrar (el campo viene con el nombre) → «Fe y paz II»        | ✅ en la cabecera                                                                                                         |
| `force-stop` y leer `@prep_series`                              | ✅ nombre nuevo, `passageKeys` canónicas en el orden nuevo (`Exodus/3/1-6`, `John/3/16`, `Isaiah/53/5`)                   |
| Tras el frío (FREE otra vez), la lista de series                | la serie queda tras el candado («Desbloquear con premium»); el dato sigue en el almacenamiento: el diseño que `C16` midió |

Agregar por referencia pliega tildes (`parseReference`); los buscadores de libros no (`R9-568`, de `C20b`): la
asimetría se ve en la misma Mesa.

## Observaciones sin numerar

- **Entorno (regla nueva):** teclear «Serie esperanza» con `adb input text` recargó el JS (mismo pid, servicios
  reiniciados): las dos «r», aunque no van seguidas, caen dentro de la ventana del doble R de React Native. La
  recarga apagó el toggle de dev. Los textos sintéticos, sin ninguna «r» repetida.
- **Para `C40` (accesibilidad), por el dump:** el campo del nombre de «Nueva serie» no tiene etiqueta ni texto de
  ejemplo (`content-desc=""`, `S139-se2.xml.txt`), y «Subir», «Bajar» y «Quitar de la serie» no dicen de qué pasaje
  (`S139-se8.xml.txt`). La clase de `R9-566`.

## Sin medir

- Borrar la serie y quitar un pasaje (el QA de Fable los midió); la fecha por pasaje y la vista «Por fecha»
  (`C8`, `C9`); exportar (`C10`); el sync de la serie (cuenta anónima).

## Receta

1. Premium: Ajustes → Extras → el toggle de dev (se apaga con el frío y con una recarga).
2. `link features/prep/series` → «Nueva serie» (`1148,264`) → nombre sin «r» repetida → tipo (`y=1403`) → atrás
   (teclado) → Crear (`884,1876`).
3. Pasaje: campo `556,857`, «Agregar pasaje» `1142,857`; por fila, «Subir» `934`, «Bajar» `1024`, «Quitar» `1114`;
   renombrar `1022,258`.
4. `S139-ui.sh.txt leer <n> rk '@prep_series'` y `frio <n> rk '@prep_series'`.
