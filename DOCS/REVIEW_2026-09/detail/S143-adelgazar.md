# S143 — adelgazar los docs y dejar el arranque liviano (2026-11-12)

Sesión de solo docs, en la terminal, sin agentes y sin emulador, con Fable 5.2 como principal, en el mismo chat que
la 142 (a pedido de Victor). No se tocó el código de la app ni `BUGS.md`, y no se re-severizó nada.

## 1. Qué cambió

| archivo        | antes           | después                                   |
| -------------- | --------------- | ----------------------------------------- |
| `CONTINUAR.md` | 342 KB          | 58 KB                                     |
| `INDEX.md`     | 289 KB          | 29 KB                                     |
| `REGLAS.md`    | (la §5)         | nuevo, 114 KB: las 275 reglas, tal cual   |
| `RECETAS.md`   |                 | nuevo, 2,4 KB: lo mecánico de cada sesión |
| `historial/`   |                 | nuevo, 7 archivos: lo que salió, tal cual |
| `tools/`       | (en `_scratch`) | nuevo: generador, validador y veredictos  |

- **`CONTINUAR.md` conserva:** qué leer (el arranque liviano), cómo se comprueba git, la §3, la §4 con el orden de
  las tandas, el resumen de reglas (§5) y la §6 a la §9 tal cual.
- **`INDEX.md` conserva:** la frontera (cinco líneas), el ledger de los Modos A a D y una línea por sesión.

- **A `historial/`:** la cabecera de cada sesión, «Lee esto antes de nada», los mensajes de cada sesión, la §1 y la
  §2 de antes, y los párrafos por sesión de la §4 (de `CONTINUAR.md`); la frontera en prosa y la bitácora de las
  sesiones 1 a 141 (de `INDEX.md`).
- **Ninguna regla se retiró.** La §5 entera pasó a `REGLAS.md`; en `CONTINUAR.md` queda un resumen por tema,
  escrito a partir de los 275 titulares. Las lecciones de las sesiones 12 a 24 están en
  `historial/CONTINUAR-lee-esto-antes-de-nada.md`.
- **El estado de git ya no se escribe en los docs.** La §2 dice cómo se pregunta.
- **`tools/`:** `estado.cjs.txt`, `validar-estado.cjs.txt` y `veredictos-s142.txt`. Llevan `.txt` para que eslint,
  prettier y jest no los tomen. Regenerado desde ahí, el TSV sale idéntico byte a byte; el validador da 0 avisos y
  0 errores.

## 2. Cómo se comprobó que no se perdió nada

`_scratch/S143-cobertura.cjs.txt`, contra las copias de antes (`_scratch/S143-antes-*.txt`):

- De las 7 717 líneas no vacías de los dos archivos, **todas** están, iguales, en algún archivo de después, menos
  dos, que son los dos títulos cambiados a propósito (el de `CONTINUAR.md` y el de la §5).
- Los 511 `R9-N` distintos que nombraban, las 16 líneas con decisiones de Victor y los encabezados siguen.
- La numeración de las secciones de `CONTINUAR.md` no cambió: «§4», «§7» y «§8» siguen apuntando a lo mismo.

## 3. El orden de las tandas (decisión delegada)

Victor delegó la decisión el 2026-11-12 («mis decisiones las dejo a tu mejor consideración»). Quedó escrita en
`CONTINUAR.md` §4, con su criterio, y Victor puede cambiarla:

1. **V1, dinero:** `R9-16`, `R9-17`, `R9-18`, `R9-19` (con `R9-135`).
2. **V2, sync que pierde en silencio:** `R9-128` (con `R9-132`), `R9-37`, `R9-127`, `R9-126`.
3. **V3, respaldo y la Mesa:** `R9-129` y `R9-131`, `R9-30` (con `R9-60`, `R9-117`), `R9-52`.
4. **V4, cuenta y cuota:** `R9-25`, `R9-29`, y el texto de `R9-24`.
5. **V5, lector y planes:** `R9-41`, `R9-40`, `R9-54` (con `R9-55`, `R9-64`), `R9-51`.
6. **V6, CI y repo:** `R9-107` (con `R9-2`, `R9-5`, `R9-6`).
7. Después, los cuatro P3 de la 141 y las tandas 2 a 9 de la 140, con los P2 viejos repartidos por área.

El porqué: los 20 P1 abiertos son todos viejos y van antes que cualquier P2. Entre ellos, primero lo que le pasa a
quien paga (y es un solo servicio), después lo que pierde datos sin avisar, después lo que conviene cerrar antes de
lanzar, y al final lo visible y lo barato. Lo que toca Pages, Vercel o la consola de Firebase sigue pidiendo el OK
de Victor aparte, y las decisiones de producto siguen en la §8, donde se agregaron cuatro (`R9-119`, `R9-24`,
`R9-118`, `R9-136`).

## 4. Lo que no se hizo

- No se borró ninguna memoria: `MEMORY.md` se adelgazó moviendo los índices por sesión a un archivo aparte.
- `BUGS.md` (1,29 MB) no se tocó: su adelgazamiento no estaba en el alcance.
- La §3, la §6, la §7 y la §8 de `CONTINUAR.md` quedaron tal cual, con su prosa vieja: una regla o un hecho no se
  retira sin comprobar que dejó de regir, y eso no se midió aquí.
