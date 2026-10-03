# Sesión 47 (2026-10-02): revisión del diff de la 46

**Modo:** en el mismo chat que la 45 y la 46, solo terminal, sin agentes y sin tocar código.
Siguió el mensaje (aa) de `CONTINUAR.md`.

**Estado al empezar:** `main` = `origin/main` = `87d14ce` (el checkpoint de la 46, mergeado y
pusheado; CI verde en el log, run `37085207637`, 368/4541). El último código es `e57fa16`, y
`_scratch/S46-SyncEngine-final.ts.txt` es su motor (comprobado con `cmp`).

**Diff revisado:** `b1f83f8..e57fa16`: la prueba de `R9-251` y tres comentarios (`R9-252`,
`queryFloors` y la prueba de la lectura sola).

**Resultado:** 1 nuevo, `R9-253` (P3, de la 46: el comentario de `R9-252`). Hallazgos: **253**.
Queda 1 P0 (`R9-38`).

---

## 1. La prueba de `R9-251`

- **¿Con qué piezas cae?** Medido con 12 piezas de a una contra la suite de sync
  (`_scratch/S47-varias.cjs.txt`; resumen en `S47-varias.out.txt`, cada corrida en
  `S47-rev-<pieza>.out.txt`; tras cada una, `cmp` igual y NUL 0):

  | Pieza                         | Cae `R9-251` | Por qué                                         |
  | ----------------------------- | ------------ | ----------------------------------------------- |
  | `R247unread`                  | sí           | consecuencia: «lo mio nuevo · mi respaldo»      |
  | `R234own`                     | sí           | consecuencia: la relectura no trae ningún sello |
  | `R234ret`                     | sí           | tabla del control `otro` (mecanismo)            |
  | `R238hoy`                     | sí           | tabla del control `otro` (mecanismo)            |
  | `R247unread` + `R234mem`      | sí           | consecuencia                                    |
  | `R247`, `R247piso`            | no           | sin retirada al llegar, como antes de la 44     |
  | `R247siempre`, `R248`, `R245` | no           | —                                               |
  | `R234mem`                     | no           | —                                               |
  | `R243vuelo`                   | —            | no se aplicó: su ancla es de antes de la 44     |

- **¿Sus controles del orden fallan si el orden cambia?** Leído: `lecturas` cuenta las lecturas de
  la tabla. Si la relectura empezara antes de la reversión, daría 2 en `rechazo`, y la aserción
  caería. Que procese después de las dos retiradas lo garantiza la puerta, que se abre al final.

## 2. Los comentarios

- **`R9-252`: no dice la verdad entera** (`S47-1`). «A restored backup settled it already,
  R9-190» vale para un respaldo bajo el piso (su eco sale de la query, y la lectura encuentra mi
  copia). Uno sobre el piso (`sobre`, de T + 10 s) se comporta como una edición: la marca sigue en
  la sesión (`["doc-c"]`, igual que `edita`), y tras reiniciar lo asienta LWW. Es `R9-253`. El
  resultado visible no cambia; la propuesta es «a restored backup below the floor».
- **`queryFloors`:** dice la verdad. Una entrega tardía con el `uid` de la cuenta siguiente
  calcula `takeBack` contra las anotaciones de esa cuenta, y ninguna tiene el reloj de un payload
  de la anterior.
- **La prueba de la lectura sola:** dice la verdad (las tres maneras de que el sello siga en la
  tabla).

## 3. Pendiente

- **Para la 48:** `R9-253` (una palabra en el comentario).
- Lo demás, como en el (z): `R9-240` (Modo C, con el OK de Victor), `R9-235`, `R9-241`,
  `R9-211`..`R9-214`, `R9-201`..`R9-203`, `R9-198`, `R9-205`, `R9-177`, `R9-38`, `A12`, `R9-164`,
  `R9-127`, `R9-173`, `R9-126`, `R9-133`.

## 4. La lección

- **Un comentario que enumera casos se mide caso por caso.** El de `R9-252` generalizó «un
  respaldo restaurado» a partir de la sonda de la 45, que tenía uno solo, bajo el piso.
