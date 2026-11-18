# Sesión 167: arreglos de la revisión de la 166 (`R9-603` a `R9-611`)

> 2026-11-18. Opus 5.5 principal, esfuerzo `high`, terminal. 3 agentes a pedido de Victor. Rama `fix/s167`
> (`3631c411` a `c9dd3b05`, 8 commits) sobre `de2d0f56`. Sin medir en vivo.

## 1. Estado de partida

main = origin/main = `de2d0f56`. Validador: 283 abiertos de 611 (0 P0, 9 P1, 91 P2, 182 P3, un aviso).

## 2. El reparto

| Agente | Hallazgos                              | Archivo principal                                   | Rama          |
| ------ | -------------------------------------- | --------------------------------------------------- | ------------- |
| A1     | `R9-603`, `R9-604`, `R9-606`, `R9-607` | `src/features/audio/context/AudioPlayerContext.tsx` | `fix/s167-a1` |
| A2     | `R9-605`                               | `app/(tabs)/verse/[book]/[chapter].tsx`             | `fix/s167-a2` |
| A3     | `R9-608`, `R9-609`, `R9-610`, `R9-611` | `src/services/BackupService.ts`, pruebas del tema   | `fix/s167-a3` |

Los tres: `general-purpose`, Opus 5.5, esfuerzo `high`, en worktree. Reglas comunes:
`_scratch/S167-agentes-reglas.md.txt`. El orquestador integró con `cherry-pick`, sin choques.

## 3. Los arreglos

| Commit     | Hallazgo           | Qué                                                                                |
| ---------- | ------------------ | ---------------------------------------------------------------------------------- |
| `3631c411` | `R9-604`           | `@audio_preferences` se valida campo por campo; un no-objeto es «sin preferencias» |
| `0d538666` | `R9-603`           | Sin voz en el archivo, mismo idioma: queda la voz de aquí, en pantalla y en disco  |
| `07bea40d` | `R9-606`           | Lo mismo con la lista de voces vacía                                               |
| `f0183309` | `R9-607`           | `savePreferences` en cola: el disco coincide con la pantalla                       |
| `b0c9342d` | `R9-605`           | El lector escribe el progreso una vez por capítulo abierto                         |
| `f3fb0e9c` | `R9-608`, `R9-611` | La importación no escribe un idioma ni una versión que esta app no conoce          |
| `4f6fb3ee` | `R9-610`           | Sin la clave en el origen, el respaldo no lleva el modo dual                       |
| `c9dd3b05` | `R9-609`           | Dos pruebas que caen sin `modeSeq` y sin `colorSeq`                                |

Por qué ahí:

- **Audio.** El arreglo va en el lector del disco, donde el dato todavía es crudo. La regla de la 165 («la voz es
  del aparato; con el mismo idioma, se queda») se calcula una vez (`holdable`) y la usan los dos caminos.
- **Lector.** Solo dos lugares escriben `reading_progress` id=1: el lector y `importBackup`. Una recarga del
  mismo capítulo no es una lectura nueva. Ceder ante una restauración reciente pedía una ventana de tiempo.
- **Idioma y versión.** Al importar, la elección de aquí todavía está en disco; en frío ya se perdió. La regla es
  la misma que la de su lector (`useLanguage.tsx:38`, `useBibleVersion.tsx:121`).
- **Modo dual.** Se alinea con las otras tres claves del lector. Un archivo viejo con `false` no distingue
  «nunca tocado» de «apagado»: sigue apagándolo, para no perder un apagado real.

Dos pruebas de la 165 fijaban lo malo y se corrigieron: `audioPreferencesRestoreSignal.test.tsx:167` (`R9-603`)
y el «CONTROL: a bad saved value» de `languageRestoreSignal.test.tsx` (`R9-608`).

## 4. Revert por pieza

| Pieza quitada                           | Caída                                                | Quién            |
| --------------------------------------- | ---------------------------------------------------- | ---------------- |
| El lector validado en la relectura      | `TypeError` con `"null"`, vivo y frío; `Received: 9` | A1               |
| `selectedVoice: holdable` y su guardado | 3 de 28 caen en `audioPreferencesRestoreSignal*`     | A1 y orquestador |
| `keepHeld` sin `voices.length`          | pantalla `undefined`                                 | A1               |
| La cola de `savePreferences`            | disco `playbackSpeed: 2.5`                           | A1               |
| La guarda `progressWrittenForRef`       | `"WRITE Juan 3:1"` tras el `IMPORT`; 1 de 2 cae      | A2 y orquestador |
| La regla de `@bible_version`            | 1 de 4 cae en `backupUnusableLocalValues.test.tsx`   | A3 y orquestador |
| La regla de `@app_language`             | disco `"xx"`, en frío `"es"`                         | A3               |
| La línea del export de `sideBySide`     | `Expected: "1", Received: "0"`                       | A3               |
| `modeSeq` / `colorSeq`                  | `Received: "dark"` / `Received: "forest"`            | A3               |

Las tres re-verificaciones del orquestador: revert, prueba roja, restaurar, `git status` limpio.

## 5. Vecinos (sondas de los agentes, borradas)

- **Audio:** archivo sin la clave o sin `local`, aparato sin copia, arranque sin clave, dos importaciones
  seguidas (sin bucle), copia propia con voz presente aquí: como antes. Solo el reproductor lee la clave.
- **Lector:** arranque en frío (3 cargas, ahora 1 escritura), modo dual, archivo sin versión o sin posición,
  abrir otro capítulo y volver: escriben como antes. Cambio deliberado: cambiar la versión a mano en el mismo
  capítulo ya no reescribe el puntero (solo cambiaba la hora, que nada lee salvo la exportación).
- **Idioma y versión:** sin copia local, sección degradada, sin `local`, otras claves de `local`, mayúsculas
  distintas. Siete pantallas leen `@bible_version` del disco: antes podían recibir `NBLA`.
- **Modo dual:** origen sin clave, `0` y `1`, con el hook real: 0 escrituras de vuelta.

## 6. Nuevo

- `R9-612` (P3): un capítulo vacío y luego una versión restaurada con texto: la primera carga real pisa
  «Continuar leyendo». Se dejó: contar la carga vacía cambiaría el paso a mano de vacía a con texto.

`R9-439`: un idioma basura ya no llega al disco; el caso medido allí no cambia. `R9-410`: sin cambios.

## 7. Sin medir

- Nada en el emulador: el audio con el motor TTS real, la lista vacía de Android, el lector montado.
- Si `router.push` crea un segundo lector (la guarda es por pantalla y cubre los dos casos).

## 8. Estado al cerrar

`NODE_ENV=development npm run validate`: 426 suites, 5060 pruebas, en verde (en `fix/s167`). Validador: 275
abiertos de 612 (0 P0, 9 P1, 88 P2, 177 P3, un aviso), 0 avisos y 0 errores. `fix/s167` y `docs/review-s167`
esperan el OK de Victor. La 168 revisa este diff con emulador (audio y arranque); después, la V4.
