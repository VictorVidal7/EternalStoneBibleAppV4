# Sesión 166: revisión del diff de la 165 (`R9-30` tanda 5), con emulador

> 2026-11-18. Opus 5.5 principal, esfuerzo `high`, terminal. 3 agentes a pedido de Victor. Diff
> `9d7a4e41..b61235db` sobre `4bc9480a`. Sin cambios de código. Cortada por el límite de llamadas: el cierre
> sigue en `_scratch/S166-CIERRE-PROMPT.md`.

## 1. Estado de partida

main = origin/main = `4bc9480a`. Validador: 274 abiertos de 602 (0 P0, 9 P1, 88 P2, 176 P3, un aviso).

## 2. El reparto

| Agente | Área                                                       | Modelo y esfuerzo |
| ------ | ---------------------------------------------------------- | ----------------- |
| R1     | idioma, tema, contraste, reducir animaciones, las listas   | Opus 5.5, `high`  |
| R2     | versión, `useReaderDualPrefs`, el lector (`[chapter].tsx`) | Opus 5.5, `high`  |
| R3     | el reproductor: la voz, la velocidad premium, `EXCLUDED`   | Opus 5.5, `high`  |

Los tres: `general-purpose`, en worktree, sin commits, sondas borradas al terminar. Reglas comunes:
`_scratch/S166-agentes-reglas.md.txt`. Los tres terminaron con `git status` limpio.

## 3. Hallazgos

| Id       | Sev | Qué                                                                         | Lo trae            |
| -------- | --- | --------------------------------------------------------------------------- | ------------------ |
| `R9-603` | P2  | Una copia sin voz, mismo idioma, suelta la voz de aquí                      | `3f18b9bc`         |
| `R9-604` | P2  | `"null"` en `@audio_preferences` tumba el proveedor raíz, en vivo y en frío | previo; alcanzable |
| `R9-605` | P2  | La versión restaurada recarga el lector, que pisa «Continuar leyendo»       | `4f93a3ab`         |
| `R9-606` | P3  | Lista de voces vacía al llegar la señal: la voz de aquí se pierde           | `f56bf254`         |
| `R9-607` | P3  | Dos `savePreferences` a la vez: disco distinto de pantalla                  | `f56bf254`         |
| `R9-608` | P3  | Idioma basura del archivo: en frío se pierde el idioma elegido              | `0c418094`         |
| `R9-609` | P3  | Las pruebas del tema no caen sin las guardas del modo y del color           | `67e9a913`         |
| `R9-610` | P3  | Un respaldo sin modo dual lo apaga aquí, al instante                        | previo; `89e09485` |
| `R9-611` | P3  | Un id de versión fuera del catálogo: en frío la versión sigue al idioma     | `4f93a3ab`         |

Sumas a entradas abiertas:

- `R9-410` (P2): `67e9a913` hace que un tema `constructor` tire la app en el momento del import.
- `R9-439` (P3): un idioma restaurado sin versión elegida reprograma los avisos dos veces (14 → 28). S165 §7
  decía «una vez»: no se cumple.

Re-verificado con sonda propia del orquestador (`__tests__/s166-orq-audio.test.tsx`, borrada): `R9-603`
(`H1 null`), `R9-604` (`TypeError` en vivo y en frío) y `R9-606` (`H3 null`, disco con la voz ajena). `R9-605`,
`R9-608`, `R9-610` y `R9-611`, contra el código (`[chapter].tsx:928`, `useLanguage.tsx:38-45`,
`BackupService.ts:696`, `useBibleVersion.tsx:121`).

## 4. Lo que la revisión dio por bueno (con sonda)

- Revert por pieza, repetido por los agentes: cada suscripción quitada hace caer su prueba por la razón correcta.
  Excepción: las guardas `modeSeq` y `colorSeq` (`R9-609`).
- Idioma y versión en la misma restauración, orden natural: sin render intermedio ni escritura (R2).
- La voz de otro teléfono con id, mismo idioma: queda la de aquí en pantalla y en disco (R3, sonda propia).
- La velocidad premium en una cuenta gratis: baja una vez, sin bucle (R3).
- El lector montado: principal y acompañante cambian una vez, sin una versión ausente (R2).
- Un respaldo viejo sin las claves no resetea nada (R1, R2, R3), salvo el modo dual (`R9-610`).
- `@audio_selected_voice` es una clave muerta; ningún recordatorio viaja por otra vía (R3).
- Desmontaje durante la relectura: sin excepción ni `console.error` (los tres).

## 5. En vivo (AVD `Pixel_9_Pro` de solo lectura, APK debug vc73, Metro)

| Paso                                             | Resultado                                           |
| ------------------------------------------------ | --------------------------------------------------- |
| Estado A: inglés, WEB elegida, alto contraste ON | Disco: `en`, `WEB`, `true`                          |
| Exportar                                         | Archivo con `en`, `WEB`, `"true"` en `local`        |
| Estado B: español, RVR1960, contraste OFF        | Disco: `es`, `RVR1960`, `false`; pantalla «Ajustes» |
| Importar A                                       | «Data restored» en inglés; mismo pid (24190)        |
| Ajustes tras el diálogo                          | «Settings», WEB marcada, paleta de alto contraste   |

La pantalla cambió sin reiniciar. Capturas: `_scratch/S166-sondas/` (`S166-B-antes.png`, `S166-C-final.png`,
`S166-D-ajustes.png`). El diálogo sigue pidiendo cerrar la app: es el texto previsto (`DataSettings.tsx:60`).

Notas del entorno: con `--clear`, Metro tardó unos 20 minutos por bundle (tres bundles). El tema de color no se
midió (el toque no entró; el archivo A no lo lleva).

## 6. Sin medir

- El audio en vivo (la velocidad y la voz con el motor TTS real): `R9-606` depende de si Android devuelve la
  lista vacía tras el selector de archivos.
- «Reducir animaciones» y el lector montado, en vivo.
- `R9-605` en vivo (lector montado en otra pestaña durante la importación).

## 7. Estado al cerrar

Validador: 283 abiertos de 611 (0 P0, 9 P1, 91 P2, 182 P3, un aviso). Nada que mergear de código; la rama de
docs `docs/review-s166` espera el OK de Victor. Según §4 «Según el riesgo»: hay P2, así que la revisión sí abre
arreglos; Victor decide si van antes de la V4 o con ella.
