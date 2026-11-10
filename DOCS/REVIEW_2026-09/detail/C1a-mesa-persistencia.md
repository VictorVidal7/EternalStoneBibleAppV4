# C1a — Mesa: persistencia y autoguardado de notas (Modo C, sesión 137)

**Estado: ✅ OK.** Agente 1, `emulator-5554`. Evidencia: `_scratch/S137-sondas-agente-1/` (informe
`S137-a1-informe.md.txt`, capturas, dumps y lecturas `*.rk.txt`).

## Entorno

Instancia de solo lectura de `Pixel_9_Pro` con el APK debug vc73, Metro del principal en `aab7ead`, `pm clear` y
onboarding (Español, RVR1960). Cuenta anónima: la Mesa se guarda en `@prep_notes` (sin uid) con
`@prep_by_account = 1` en RKStorage (`catalystLocalStorage`). La app arrancó premium sola (la ofrenda de la cuenta
del AVD, ver `C15`); FREE se midió con el toggle de dev apagado dentro del proceso.

Mecanismo (código de hoy): `handleNoteChange` agenda `debouncedSaveNote` (700 ms,
`app/features/prep/index.tsx:1071-1081`), `flush()` al desmontar (`:1089`) y `handleNoteBlur` guarda en blur
(`:1105-1130`). Nada escucha `AppState`.

## Lo medido (cada fila, con la lectura de `@prep_notes` tras un arranque en frío)

| Camino                                                                      | Resultado                                           |
| --------------------------------------------------------------------------- | --------------------------------------------------- |
| Escribir + blur                                                             | ✅ en RK y en la UI                                 |
| Repro de Fable, fila 1: escribir → atrás (cierra el teclado) → atrás (sale) | ✅ guardado: el bug de Fable está CERRADO           |
| Escribir, 2 s con el teclado abierto, `force-stop`                          | ✅ guardado                                         |
| Escribir y `force-stop` en el acto (< 700 ms)                               | perdido: es `R9-58`                                 |
| Escribir, HOME en el acto, 5 s en segundo plano, `force-stop`               | perdido: suma a `R9-58` (abajo)                     |
| Escribir, HOME, 30 s en segundo plano, volver                               | sin guardar a los 30 s; se guarda al volver         |
| Vaciar una sección; vaciar todas; frío                                      | ✅ sale del almacenamiento (`{}`), nada resucita    |
| Dos arranques en frío seguidos                                              | ✅                                                  |
| `R9-47` en vivo: 3 y 6 toques rápidos al stepper (16-21 ↔ 16-23)            | ✅ cada pasaje con SU prosa; almacenamiento intacto |
| FREE (toggle apagado en el proceso): editar → atrás → atrás                 | ✅ misma clave                                      |
| Plantilla «Narrativo» en un pasaje vacío; frío                              | ✅ `template: "narrative"` sellado con la escritura |
| Escribir y abrir en el acto el modal «Cómo usar la Mesa» → atrás → atrás    | ✅ guardado                                         |

Lectura: el selector de plantilla solo aparece con las notas vacías (`index.tsx:2351-2352`), así que no hay prosa
escondida por cambio de plantilla. Historial y Series navegan sin `flushDrafts` (`:960-976`), pero la Mesa queda
montada y el debounce corre en primer plano: sin pérdida por lectura; en el dispositivo es de `C6`/`C16`.

## Suma a `R9-58` (no es nuevo)

`R9-58` dice «matar la app pierde hasta 700 ms de tecleo». En el dispositivo, el temporizador del debounce no
corre con la app en segundo plano: a los 5 s y a los 30 s el texto no estaba en RKStorage, y se guardó a los ~4 s
de volver al primer plano (`S137-a1-f3c-*`, `S137-a1-f3d-*`). Si el proceso muere estando en segundo plano
(Recientes, OOM, actualización), se pierde lo tecleado desde la última pausa de 700 ms antes de salir, por mucho
que la app haya estado en segundo plano. Coincide con la corrección de la sesión 22 (hace falta `AppState` →
`flush()`). La severidad escrita se sostiene: el daño es la última frase, no la nota entera.

## Cruce con el Pendiente

Nada entró en la adopción ni en el cambio de cuenta de la Mesa (`R9-330`/`R9-327`).

## Receta

1. `eternalbible://features/prep?book=John&chapter=3&startVerse=16&endVerse=21` (`S137-a1-mesa.sh.txt`).
2. Escribir con `input text`; vaciar con `MOVE_END` + `DEL`×N (`S137-a1-borrar.sh.txt`).
3. Leer `@prep_notes`: `exec-out run-as com.eternalstonebible.app cat databases/RKStorage` a un `.db` local y
   `sqlite3`.
4. La ventana de `R9-58`: escribir, HOME en el acto, esperar 5-30 s, leer RK, después volver o `force-stop`.
5. `R9-47`: varios toques al stepper en un solo `adb shell "input tap …; input tap …"`.
