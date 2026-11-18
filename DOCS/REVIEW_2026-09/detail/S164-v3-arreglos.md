# Sesión 164 — V3: `R9-30` tanda 4, las claves de contenido que no son preferencias

> 2026-11-17. Opus 5.5 de principal, `high`, y 3 agentes a pedido de Victor (los tres `fork`, Opus 5.5 `high`,
> en worktrees). Rama `fix/s164-v3` (8 commits) y los docs en `docs/review-s164`, encima. Sin medir en vivo.

## 1. Estado de partida

- `main` = `origin/main` = `fc68b5cc`. CI verde.
- 275 abiertos de 602: 0 P0, 10 P1, 88 P2, 176 P3 y un aviso.

## 2. El reparto

| Agente | Claves                                                                                               | Rama          |
| ------ | ---------------------------------------------------------------------------------------------------- | ------------- |
| A1     | `@sermon_notes`, `@devotional_draft`                                                                 | `fix/s164-a1` |
| A2     | `@audio_bookmarks`, `@audio_listening_stats`, `@share_style_presets`, `@share_style_presets_compact` | `fix/s164-a2` |
| A3     | `@reading_daily_goal`, `@home_also_versions`, `lastReadPosition`                                     | `fix/s164-a3` |

Las reglas comunes: `_scratch/S164-agentes-reglas.md.txt`. Cada agente: un commit por escritor y uno final con
las listas. El orquestador integró con `cherry-pick` y resolvió a mano los choques de las listas.

## 3. Los arreglos

| Commit     | Qué                                                                                      |
| ---------- | ---------------------------------------------------------------------------------------- |
| `38b93a30` | El editor y la lista de sermones releen con la señal; `strict` en `getSermonNote`        |
| `f82e5c72` | El armador de devocionales cancela el autoguardado y relee el borrador con la señal      |
| `fd312c0a` | `@sermon_notes` y `@devotional_draft` pasan a `LOCAL_BACKUP_KEYS`                        |
| `1cf53fea` | La cola de audio relee los marcadores con la señal                                       |
| `727cc557` | Las 4 claves de audio y compartir pasan a `LOCAL_BACKUP_KEYS`                            |
| `45daf8c8` | Ajustes > Metas relee las tres metas con la señal (guarda `pickSeq`)                     |
| `183f5bd2` | Inicio: «Ver también en…» pasa a `useHomeAlsoVersions`, que relee con la señal           |
| `90b849d8` | `@reading_daily_goal` y `@home_also_versions` viajan; `lastReadPosition` va a `EXCLUDED` |

**`@sermon_notes`: pasa tal cual, sin migración por cuenta (decisión del orquestador).** Es una clave por
aparato para todas las cuentas, gratis y sin `prepKey`. `payload.local` también es por aparato y reemplaza el
valor del aparato: es la misma regla de las otras claves locales. Pasarla a una clave por cuenta es otro diseño,
con su migración, y nadie lo pidió. El escritor (`mutate()`) relee el disco. El editor `[id].tsx` escribía campos
enteros desde su copia: ahora cancela los tres guardados pendientes y relee estricto (como `R9-600`). Una sesión
que el archivo no trae se muestra como «no encontrada».

**`@devotional_draft`: pasa.** Es escritura del usuario sin otra vía de vuelta. El autoguardado del armador
escribía el formulario entero desde memoria. Un archivo sin borrador deja el del aparato.

**Audio y compartir: pasan las 4.** Las estadísticas de escucha no son un caché: son el único registro detrás de
Mi viaje. Los cuatro escritores releen el disco; solo la cola de audio guardaba la lista entera en memoria.

**Metas e Inicio: pasan.** Ajustes queda montado durante la importación, e Inicio también. Las dos pantallas
leían una sola vez. Las guardas de secuencia impiden que una relectura en vuelo pise un toque del usuario.

**`lastReadPosition`: a `EXCLUDED`.** `get/setLastReadPosition` (`ReadingProgressContext.tsx:225,258`) no tienen
llamadores en `src/` ni en `app/`. La posición real es la fila de SQLite, y el respaldo ya la restaura
(`BackupService.ts:1626`).

## 4. Revert por pieza

Los agentes revirtieron cada pieza y la vieron caer. El orquestador lo repitió para las suscripciones, en cada
worktree:

| Pieza revertida                    | Caen                              |
| ---------------------------------- | --------------------------------- |
| La suscripción del editor sermones | 4 de 6 («cuerpo PRE y»)           |
| La suscripción del armador         | 2 de 3 («Titulo PRE y»)           |
| La suscripción de la cola de audio | 1 de 2 (vuelve `pre`)             |
| La suscripción de Metas            | 1 de 2 (`["10","10","3"]`)        |
| La suscripción de Inicio           | 1 de 2 (`false` en vez de `true`) |

Del lado de los agentes, además: los `cancel()`, `strict`, `pickSeq`, `toggleSeq` y cada clave de la lista.
El `cancel()` del armador solo se distingue con una relectura lenta (700 ms).

## 5. Validate

`NODE_ENV=development npm run validate` sobre lo integrado, sin worktrees: 416 suites, 5003 pruebas, verde.

## 6. Para la 165

- Las 21 preferencias de `PENDING_R9_30`. Recomendación de la S160 §5: idioma, versión y lector viajan; los
  recordatorios van a `EXCLUDED` («la notificación se programa en el aparato»).
- Al cerrar `R9-30`: revisar la promesa de la interfaz (`translations.ts:4176`).
- `get/setLastReadPosition` son API muerta: borrarla no entró.

## 7. Sin medir

- Todo, sin emulador.
- Un `appendListening` en vuelo cuando aterriza la restauración: puede pisarla con el valor previo más su delta.
- El ritmo que muestra la cola no se relee con la señal: solo se ve viejo.
- Una restauración antes de la primera lectura del armador: puede traer el borrador viejo.
- El conteo de «llegaste al máximo» de sermones entre la restauración y la relectura de la lista.

## 8. Estado al cerrar

- `fix/s164-v3` (8 commits) y `docs/review-s164` encima: esperan el OK de Victor.
- 275 abiertos de 602: 0 P0, 10 P1, 88 P2, 176 P3 y un aviso. `R9-30` sigue abierto con 21 claves.
