# Sesión 165 — V3: `R9-30` tanda 5 (las 21 preferencias) y el cierre de `R9-30`

> 2026-11-17. Opus 5.5 principal, esfuerzo `high`, terminal. 3 agentes a pedido de Victor. Rama `fix/s165-v3`
> (`dcd9d339` a `b61235db`, 11 commits) sobre `9d7a4e41`. Sin medir en vivo.

## 1. Estado de partida

main = origin/main = `9d7a4e41`. Validador: 275 abiertos de 602 (0 P0, 10 P1, 88 P2, 176 P3, un aviso).
`PENDING_R9_30` tenía 21 claves.

## 2. El reparto

| Agente | Claves                                                                                     | Rama          |
| ------ | ------------------------------------------------------------------------------------------ | ------------- |
| A1     | `@app_language`, `@app_high_contrast`, `@app_reduce_motion_override`                       | `fix/s165-a1` |
| A2     | `@bible_version`, `@reader_dual_layout`, `@reader_focus_mode`, `@reader_secondary_version` | `fix/s165-a2` |
| A3     | `@audio_preferences`, `@audio_selected_voice` y los 12 recordatorios                       | `fix/s165-a3` |

Los tres: `general-purpose`, Opus 5.5, esfuerzo `high`, en worktree. Las reglas comunes:
`_scratch/S165-agentes-reglas.md.txt`. El orquestador integró con `cherry-pick`. Resolvió a mano los choques de
las listas (`_scratch/S165-resolver.cjs.txt`). Juntó los dos commits del reproductor de A3 en uno.

## 3. Los arreglos

| Commit     | Qué                                                                                     |
| ---------- | --------------------------------------------------------------------------------------- |
| `dcd9d339` | `LanguageProvider` relee el idioma con la señal y vacía la caché de `languageUtils`     |
| `67e9a913` | `ThemeProvider` relee el modo, el tema de color y el alto contraste con la señal        |
| `f99831d7` | «Reducir animaciones» se relee con la señal                                             |
| `89e09485` | El lector pasa sus 4 claves a `useReaderDualPrefs`, que relee con la señal              |
| `4f93a3ab` | `BibleVersionProvider` relee la versión; una versión ausente cae como en el arranque    |
| `3f18b9bc` | El reproductor relee `@audio_preferences` con la señal (guarda `prefsPickSeq`)          |
| `0c418094` | Idioma, alto contraste y reducir animaciones pasan a `LOCAL_BACKUP_KEYS`                |
| `fb4abef3` | La versión y las 3 claves del lector pasan a `LOCAL_BACKUP_KEYS`                        |
| `4d17f396` | `@audio_preferences` pasa; los 12 recordatorios y `@audio_selected_voice`, a `EXCLUDED` |
| `f56bf254` | Una voz de otro teléfono no pisa la de este aparato (del orquestador)                   |
| `b61235db` | `PENDING_R9_30` queda vacía y se retira                                                 |

**Viajan 8.** Idioma, versión y lector, por la recomendación de la S160 §5. El alto contraste es una paleta de la
app, no un ajuste del sistema. «Reducir animaciones» se suma con OR al ajuste del aparato: llevarlo no quita nada.
`@audio_preferences` lleva velocidad, idioma del audio y dos interruptores: son portátiles.

**Van a `EXCLUDED` 13.** Los 12 recordatorios: la notificación se programa en el aparato, con su permiso.
Restaurados en ON, el ajuste mentiría y el arranque pediría el permiso solo. `@audio_selected_voice` es una clave
muerta: solo está declarada (`audioConstants.ts:109`).

**De paso.** El tema y el tema de color ya viajaban, pero no se releían: ahora sí (el mismo proveedor que el
contraste). `@reader_side_by_side` también ya viajaba: `useReaderDualPrefs` la relee.

**La voz (decisión del orquestador).** `@audio_preferences` lleva `selectedVoiceId`, una voz TTS del aparato que
la guardó. Con el arreglo de A3, una copia de otro teléfono soltaba la voz elegida aquí. Ahora la voz es del
aparato. Si el motor enumeró voces y la del archivo no está, se queda la de aquí. Lo mismo si el idioma del audio
no cambió: se queda en pantalla y en disco. Con otro idioma se suelta, como `setLanguage`.

## 4. Revert por pieza

Los agentes revirtieron cada pieza y la vieron caer (sus tablas, en el informe de cada uno). El orquestador lo
repitió sobre lo integrado (`_scratch/S165-piezas.sh.txt`, la llamada a `subscribeBackupRestored` anulada):

| Suscripción revertida      | Caen   |
| -------------------------- | ------ |
| `useLanguage.tsx`          | 1 de 3 |
| `useTheme.tsx`             | 1 de 2 |
| `AccessibilityPreferences` | 1 de 2 |
| `useBibleVersion.tsx`      | 2 de 3 |
| `useReaderDualPrefs.ts`    | 2 de 3 |
| `AudioPlayerContext.tsx`   | 3 de 5 |

La voz (`f56bf254`): sin el bloque, el disco guarda la voz ajena. Sin la condición del idioma, cae el caso del
inglés (queda una voz española). La retirada de la lista: una clave nueva sin lista sigue haciendo caer la
cobertura.

## 5. La promesa de la interfaz

`translations.ts:4169` y `:4177` (y `:10733`, `:10741` en inglés): «favoritos, notas, resaltados, progreso, logros
y preferencias». Todo lo nombrado viaja. Las únicas preferencias que no viajan son los recordatorios, a propósito.
**El texto no cambia.** No promete lo que no hace.

## 6. Validate

`NODE_ENV=development npm run validate` sobre lo integrado, sin worktrees: 423 suites, 5027 pruebas, verde. Lint:
0 errores.

## 7. Vecinos

- Un idioma restaurado reprograma los recordatorios activos en el idioma nuevo (`app/_layout.tsx:198`), una vez.
- Sin versión elegida, la versión sigue al idioma. Si el idioma llega antes que la relectura de la versión, puede
  haber un render con la versión del idioma. La versión explícita gana al final.
- Una velocidad premium restaurada en una cuenta gratis se baja una vez (lo previsto).
- Las pantallas que dependen del idioma recargan su contenido. El lector recarga el capítulo (`loadIdRef`).
- Nada escribe a la nube.

## 8. Sin medir

- Todo, sin emulador: el cambio de idioma en vivo, el lector montado durante la importación, el motor TTS real.
- El efecto del foco del lector (`[chapter].tsx:498`) no tiene prueba que dibuje el lector entero.
- Las siete pantallas que leen `@bible_version` del disco pueden tomar un id no instalado (pasaba antes).
- Un toque durante la relectura del reproductor la descarta entera, no solo su campo.

## 9. Estado al cerrar

`R9-30` ✅ ARREGLADO (tandas 1 a 5, sesiones 160 a 165). Validador: 274 abiertos de 602 (0 P0, 9 P1, 88 P2, 176
P3, un aviso). `fix/s165-v3` y `docs/review-s165` esperan el OK de Victor.
