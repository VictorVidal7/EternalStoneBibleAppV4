# Sesión 168: revisión del diff de la 167 (`R9-603` a `R9-611`), con emulador

> 2026-11-18. Opus 5.5 principal, esfuerzo `high`, terminal. 3 agentes a pedido de Victor. Diff
> `de2d0f56..c9dd3b05` (8 commits). Sin cambios de código.

## 1. Estado de partida

main = origin/main = `3d82d031`. Validador: 275 abiertos de 612 (0 P0, 9 P1, 88 P2, 177 P3, un aviso).

## 2. El reparto

| Agente | Área                                 | Modelo y esfuerzo | Hallazgos               |
| ------ | ------------------------------------ | ----------------- | ----------------------- |
| R1     | Audio (`AudioPlayerContext.tsx`)     | Opus 5.5, `high`  | ninguno; dos notas      |
| R2     | Lector (`[chapter].tsx`)             | Opus 5.5, `high`  | uno, P3, lo trae la 167 |
| R3     | Respaldo (`BackupService.ts`) y tema | Opus 5.5, `high`  | dos, previos            |

Los tres: `general-purpose`, en worktree, solo sondas (borradas). Reglas comunes:
`_scratch/S168-agentes-reglas.md.txt`. El orquestador usó el emulador en paralelo.

## 3. Veredicto

Los nueve arreglos se sostienen. Cada revert por pieza tumba su prueba por la razón correcta (los tres agentes).
`router.push` nunca crea un segundo lector (R2: `mounts=1`, `unmounts=0` en todos los casos).

## 4. Hallazgos nuevos

| Id       | Sev. | Qué                                                                              | Origen     |
| -------- | ---- | -------------------------------------------------------------------------------- | ---------- |
| `R9-613` | P3   | Restaurar, ir a un capítulo vacío y volver: no escribe el capítulo de partida    | `b0c9342d` |
| `R9-614` | P3   | Un modo o tema de color desconocido en el archivo: en frío se pierde la elección | previo     |

Suma medida a `R9-558` (P2, sin P2 nuevo): restaurar una versión del catálogo sin descargar deja siete pantallas
sin texto. Ya estaba anotado en la §8 de la 165, sin entrada.

### `R9-613` (sonda propia, re-verificada)

Prueba de `R9-605` copiada; `getChapter` devuelve `[]` para Juan 4. Lector en Juan 3, importar (Génesis 1:5),
Juan 4, Juan 3:

| Lector     | Juan 4 vacío                        | Juan 4 con texto (control)         |
| ---------- | ----------------------------------- | ---------------------------------- |
| HEAD       | sin escrituras; puntero Génesis 1:5 | `WRITE Juan 4:1`, `WRITE Juan 3:1` |
| `de2d0f56` | `WRITE Juan 3:1`                    | igual que HEAD                     |

La carga vacía no cambia `progressWrittenForRef`: sigue en `Juan/3`. Es la misma raíz que `R9-612`, al revés.
Contradice el §5 de la 167 («abrir otro capítulo y volver escribe»). P3: pide una versión sin ese capítulo.

### `R9-614` (sonda propia, re-verificada)

`ThemeProvider` real e `importBackup` real. Aquí `dark`/`ocean`; archivo `appTheme` = `sepia`/`nebula`:

`{"live":{"mode":"dark","color":"ocean"},"disk":["sepia","nebula"],"cold":{"mode":"auto","color":"midnight"},"failed":[]}`

Control `light`/`forest`: vivo, disco y frío iguales. `BackupService.ts:1384-1391` acepta cualquier texto. Es el
patrón de `R9-608` en `user.appTheme`. `R9-410` cubre el `constructor` que tumba la app, no esto. Igual en
`de2d0f56` (R3).

### Suma a `R9-558` (sonda de R3)

Pantalla real del detalle de tema, `getVerse` falso que solo responde para las versiones instaladas. Archivo con
`@bible_version` = `RV1909` (del catálogo, sin descargar): disco `RV1909`, nueve «texto no disponible». Control
`KJV` instalada: texto. El lector cae a RVR1960 en vivo y en frío. Igual en `de2d0f56`. La propuesta de la 141
(la red de seguridad escribe la clave) curaría los dos caminos.

## 5. En vivo (AVD `Pixel_9_Pro` de solo lectura, APK debug vc73, Metro, cuenta gratis)

| Paso                                                 | Resultado                                                                             |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------- |
| Abrir desde Inicio (Gálatas 2)                       | 1 escritura: Gálatas 2:1                                                              |
| Enlace `eternalbible://verse/Romanos/8`, en caliente | 1 escritura: Romanos 8:1                                                              |
| Inicio → Gálatas 2 otra vez                          | 1 escritura                                                                           |
| Búsqueda «Hechos 2» → «Ir a Hechos 2»                | 1 escritura                                                                           |
| Exportar sin modo dual tocado                        | `readerPreferences: {}` en el archivo                                                 |
| Importar (WEB, Génesis 1:5) con el lector montado    | disco Génesis 1:5 y `WEB`; el lector muestra «Romans 8» (recargó en WEB) y no escribe |
| Importar G1 (voz real `es-es-x-eee-local`, 1.5x)     | disco con esa voz y 1.5                                                               |
| Importar G2 (sin voz, mismo idioma, 2.5x)            | disco: voz retenida, velocidad 2; pantalla 2x                                         |
| Arranque en frío                                     | disco igual: voz retenida, 2, `WEB`                                                   |

El chip «EN» del reproductor con `selectedLanguage: "es"` es por diseño: sigue el idioma del texto cargado
(`narrationVoice.ts:205`).

## 6. Notas sin entrada

- R1: la cola de `savePreferences` se traba si una operación de AsyncStorage nunca termina. Teórico: el código
  viejo también esperaría. Un rechazo no la traba (medido).
- R1: la prueba en vivo de `R9-604` no cae al quitar el lector validado (el error queda dentro del `try`). La
  prueba en frío sí cae: la pieza tiene una prueba que discrimina.
- R3: `@reader_secondary_version` con `""` en el archivo borra la elección de aquí. Previo, sin medir más.

## 7. Sin medir

- La voz retenida EN PANTALLA con el motor real (el texto era WEB; la lista mostrada era la inglesa). Lo cubre la
  prueba de R1 en jest.
- La lista vacía real de Android tras el selector de archivos.
- Un archivo de la 167 importado por un build viejo, en el aparato (R3 lo midió en jest: sin error, modo dual
  intacto).
- La velocidad premium en una cuenta premium en vivo.

## 8. Estado al cerrar

Cerrado en `docs/review-s168`: las entradas `R9-613` y `R9-614` en `BUGS.md`, la suma a `R9-558`, el TSV,
`INDEX.md` y `CONTINUAR.md`. Validador: 277 abiertos de 614 (0 P0, 9 P1, 88 P2, 179 P3, un aviso). Sin P2 nuevos: según «Según el riesgo», la 169 es la V4.
