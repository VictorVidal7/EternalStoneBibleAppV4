# Sesión 72 — revisión del diff de la 71 (2026-10-07)

En un chat nuevo, en la terminal, con 3 agentes en worktree que solo midieron (Victor: «podrías
mandar 3 agentes?»). Con `_scratch/S72-PROMPT.md`. Sin tocar código.

- **Estado al empezar:** `main` = `origin/main` = `863747d` (la 71 mergeada y pusheada con el OK de
  Victor; CI verde en el log, run `37582666564`, 3 jobs, Node v24.21.0, 374/4626). Los docs decían
  «sin mergear» para la 71: corregido aquí.
- **Rama:** `docs/review-s72-diff-s71` (solo docs), sin mergear hasta el OK de Victor.
- **Resultado:** lo medido de `R9-291` y `R9-290` se sostiene. 3 nuevos, P3, de pruebas: `R9-293`,
  `R9-294` y `R9-295` (este lo abrió la 71). Correcciones en `R9-289`, `R9-290`, `R9-291` y
  `R9-292`. Quedan 295 hallazgos, ningún P0.

## 0. Cómo se trabajó

- Un agente por punto: el 1 con `R9-291` y `R9-289`, el 2 con `R9-290` y el 3 con `R9-292`. Cada uno
  copió los scripts de `_scratch` a su worktree con `ROOT` propio, y corrió jest por ruta.
- **El worktree del agente 1 se borró solo al terminar, y se llevó su `_scratch`** (está en
  `.gitignore` y no cuenta como cambio). Su informe vino entero en su mensaje final. Los agentes 2 y
  3 copiaron su `_scratch` al principal antes de terminar, a pedido del orquestador:
  `_scratch/S72-sondas-agente-2/` y `_scratch/S72-sondas-agente-3/`.
- El orquestador re-midió en el árbol principal cada afirmación que se registra, con scripts
  regenerados con `ROOT` en el principal:
  - `S72-gen.cjs.txt` genera `S72-turno.cjs.txt` (las piezas del agente 1, rehechas desde
    `S71-turno1`, más la forma `vieja`, que es la prueba de `8c4fc9a`);
  - `S72-gen23.cjs.txt` genera `S72-sonda2.cjs.txt` (agente 2) y `S72-turno3.cjs.txt` (agente 3,
    más `sinColaLento25`), y copia las sondas `S72-suelta2`, `S72-devuelta` y `S72-retenido`
    (`.test.ts.txt`);
  - `S72-vieja3.cjs.txt` corre `S72-turno3` con la prueba de `8c4fc9a`.
- `git status` sin cambios en el código tras cada corrida (solo los docs de esta rama). Los worktrees
  ya no están.

## 1. `R9-291` (`b5164d7`): el control `turnoPedido`

- **Cae como dice el cierre** (agente 1, `S70-turno <pieza> prep`): `nada` pasa; `sinTurno` y
  `sinCola`, por el daño; `lentoSinTurno` y `lento`, solo en `turnoPedido: 0`; `sinColaLento`, por el
  daño.
- **Con `sinColaLento`, la razón es la vuelta.** La forma `dano` deja la puerta cerrada 20 vueltas, y
  un respaldo sin turno escribe dentro de ellas con la otra escritura retenida. La forma `pedido` sale
  en la vuelta 0, cuando el spy cuenta el pedido, antes de que el respaldo escriba (registro por
  vuelta del agente 1).
- **Ese mismo límite de 20 vueltas abre `R9-293`:** con la escritura 20 vueltas o más después del
  pedido, la prueba pasa con `turnoPedido: 1`. Re-medido: `sinColaLento19` cae por el daño;
  `sinColaLento20` y `25` pasan, y en el archivo cae solo `muere` en `colgadas: 0`, el mismo diff que
  `demoraDentro`. Con la prueba de `8c4fc9a`, `sinColaLento25` también pasa: no lo abrió la 71.
- **¿El spy puede contar otra llamada?** Hoy no: la unión usa el `oneAtATime` interno, y
  `savePrepNote`, `prepWrite`. Con un store que llamara por el objeto del módulo (`storePide`), daría
  2: un rojo raro, no un verde falso (la unión lo tapa). Sin número.

## 2. `R9-290` (`82bdc07`): `colgadas` y el margen

- **Cae como dice el cierre** (agente 2): `S71-sonda2 actual` con `nada` y `lento18` pasa, y con
  `notaTarde`, `notaTarde5` y `lento18notaTarde5` cae; `S70-turno lento prep`, en `muere` solo
  `colgadas` de 1 a 0; `S59-rev anotaRespaldo ver`, `ana: [R]` con el control en 1; `respaldo ver`,
  el de antes con `colgadas` en 0.
- **¿Alcanzan las 20 vueltas?** No, y ningún margen finito alcanza. Re-medido con `notaColgadaN`
  (la nota quitada N vueltas después si la devolución no volvió): `actual` cae con 19 y 20 y pasa con
  21; `vieja` pasa con 20 y 21. La 71 movió el corte una vuelta. Ninguna pieza cae en la vieja y pasa
  en la actual (`vigia19`, `vigia20`, agente 2): la ventana nueva contiene a la vieja, y después del
  corte todo son microtareas. Dicho en `R9-290`, sin número.
- **¿Un orden en que `colgadas` mienta?** Sí: `R9-295`. Con `releaseSinEsperar`, lo colgado es la
  devolución del borrado (`[John/3/16-21]`), no la del respaldo (`[John/3/16-21, Ps/23/1-6]`), y
  `colgadas` da 1 sin diff (re-medido con `quienActual`). Con la prueba vieja cae con el mismo diff:
  la 71 abrió el control que confirma el rojo, no el rojo.
- **El arreglo medido, `colgadaCon`:** sin pieza pasa; `releaseSinEsperar` y `toqueYNota` caen en él
  (re-medido). Cierra también lo dicho sin número de la 71.
- **Además (agente 2):** los casos de un mismo `it` no están aislados. Dicho en `R9-290`.

## 3. `R9-292`

- **Se sostiene** (agente 3): `sueltaAntes5 prep`, 5/5; `sueltaAntes5 suelta` cae; `nada suelta`
  pasa; `sinTurno suelta` cae.
- **Pero la sonda de la 71 no construía la pérdida:** su mock no retenía la unión (corrección en
  `R9-292`). Con `suelta2`, re-medido, `sueltaAntes5` pierde lo restaurado entero con
  `restaurado: true`.
- **¿Lo produce el teléfono?** Alcanzable, en ventanas de milisegundos (las referencias, en la
  entrada). P3 se sostiene.
- **Una regresión más natural, que nadie ve:** `turnoSoloGone` (`R9-294`). Re-medido: 5/5 con la
  prueba actual y con la de `8c4fc9a`, 998/998 en el suite, pasa `suelta2`, y en la sonda `devuelta`
  pierde lo restaurado.
- **El arreglo de los tres juntos:** la sonda `retenido` (re-medida: sin pieza pasa; `sinTurno`,
  `sueltaAntes5`, `turnoSoloGone` y `sinColaLento25` caen en `bConRespaldoRetenido: 1`).

## 4. La corrección de la 71 en `R9-289`

- **Se sostiene** (agente 1): `sinColaLento archivo` pasa 3/3; `sinColaLentoEnTurno` cae en los
  avisos.
- Su apoyo («la prueba de `R9-273` ve la pieza») vale solo por debajo de 20 vueltas: `R9-293`.
- **¿Número?** Recomendación: no. La regresión de `R9-287` cae igual, y lo que tiene consecuencia
  ya es `R9-293`. Queda a criterio de Victor.

## 5. Que sea solo la prueba

`git diff --stat 8c4fc9a 82bdc07`: `__tests__/backupPrepTurn.test.ts`, 30 inserciones y 5 borrados.
Nada más.

## 6. Lo que no se hizo

- No se arregló nada (sesión de revisión).
- `npm run validate` no corre: la rama es solo docs. Prettier sobre `DOCS/REVIEW_2026-09/**/*.md`.

## 7. La lección

- **Un control de llegada tiene que nombrar QUÉ llegó, no que algo pasó.** Tres veces en un mismo
  archivo:
  - `turnoPedido` cuenta el pedido, no la escritura (`R9-293`);
  - `colgadas` cuenta un colgado de la clave, no la devolución del respaldo (`R9-295`);
  - la sonda `suelta` contaba dos retenciones, y no eran las que importaban (`R9-292`).
- Corré la demora también DESPUÉS del paso que el control cuenta, y leé el contenido de lo que el
  control ve, no su conteo.
