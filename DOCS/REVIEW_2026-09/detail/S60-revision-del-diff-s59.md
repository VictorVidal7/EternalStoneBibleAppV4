# Sesión 60 — revisión del diff de la 59 (2026-10-05)

En el mismo chat que la 58 y la 59 (Victor: «Continua por favor»), solo en la terminal, sin agentes
y sin tocar código, con `_scratch/S60-PROMPT.md`. Revisa `4a757ce..37ba5f7`: los arreglos de
`R9-276` (`fb7696f`) y `R9-275` (`37ba5f7`).

- **Rama:** `docs/review-s60-diff-s59` (solo docs), sin mergear hasta el OK de Victor.
- **Estado al empezar:** `main` = `origin/main` = `6667c40` (el checkpoint de la 59, mergeado y
  pusheado con el OK de Victor; las ramas de la 59, borradas tras `git cherry` vacío).
- **El motor no cambió:** `git diff --stat 4a757ce 37ba5f7 -- src/lib/sync` vacío;
  `SyncEngine.ts` = `S55-SyncEngine-R271.ts.txt` (`cmp`), NUL 0. Sin matriz.
- **Resultado: ningún hallazgo nuevo.** No queda ningún P0 abierto; 276 hallazgos.
- **Una advertencia sobre la independencia:** la revisión la hizo el mismo chat que escribió los
  arreglos. Las sondas son nuevas y buscan romperlos, pero no es una mirada fresca.

## 0. Cómo se midió

`_scratch/S60-prep.test.ts.txt` + `S60-prep.cjs.txt <out> [viejo|hoy|<commit>] [filtro -t]` (el
arnés de la 58: stores, joins e `importBackup` reales, con la puerta en `withTransactionAsync`).
Dos sondas: `NOTA` y `RESPALDO` (`S60-prep-hoy.out.txt`). Ninguna muestra daño, así que no hizo
falta el «¿lo abrió la 59?» con `4a757ce`.

## 1. `R9-276`, la nota

- **El turno de la nota no se traba:** solo hace llamadas de almacenamiento y no pide nunca el de
  la Mesa. `prepMultiSet` lo pide dentro del de la Mesa, y nadie lo pide a la inversa.
- **Basura** (`basura`: un objeto JSON): se lee como un uid, su unión no encuentra nada, y la nota
  se borra. **Una lista sucia** (`listaSucia`: con un número, un vacío y un `null`): se devuelve la
  cuenta válida y la nota se borra.
- **Ilegible** (`ilegible`: la nota no se lee nunca): `releasePrepAccount` no puede anotar (avisa) y
  une igual; la Mesa de Ana llega a la «sin cuenta»; el arranque siguiente termina sin trabarse. Lo
  único que se pierde es el reintento, como dice el comentario. Al quitar la cuenta de la nota
  (que tampoco se lee), el aviso dice «Failed to give the Mesa back» aunque la unión terminó: una
  línea de log inexacta, sin efecto (la nota no cambió, y el arranque siguiente no encuentra nada
  que unir).
- **La nota de antes** (un uid suelto) cuya unión vuelve a fallar: queda como estaba y se relee en
  cada arranque (`FALLA siempre` de la 58, re-corrida en la 59).
- **Una nota que crece** (`crece`: `d` trabada, con su Mesa ilegible; en el proceso se borran `e` y
  `f`): `e` y `f` se devuelven, `d` se queda sola en la nota, y los dos arranques terminan.

## 2. `R9-276`, el arranque

`finishRelease` lee la nota una vez y devuelve cada cuenta por su lado; las claves esperan a todas,
y una trabada cuesta una lectura fallida por arranque. Dos devoluciones que quitan su uid casi a la
vez se ordenan en el turno de la nota (la lectura y la escritura van juntas). Nadie más escribe la
nota al arrancar: `deleteAccount` necesita una sesión, que llega después del primer estado.

## 3. `R9-275`, quién escribe para una cuenta devuelta

- **Escritores de `@prep_*`** (`grep`, como en la 58): los cuatro stores (`prepWrite`), el respaldo
  (`prepMultiSet`) y `joinPrep` (migración, adopción y devolución). Ningún otro.
- **Cada store lee y escribe la misma clave dentro de su turno** (`run(resolved)`: `getItem` y
  `setItem` sobre `resolved`), así que la redirección es coherente: edita el mapa de la «sin
  cuenta».
- **Los lectores** (`getAll*`) usan la cuenta de ahora: entre la devolución y el estado nulo, la
  pantalla de Ana ve su Mesa vacía (la clave ya no existe). Es de antes de la 59 y dura lo que tarda
  el estado nulo.
- **`keyAccount`:** ninguna base es prefijo de otra con `:`, y `@prep_release_pending` y
  `@prep_by_account` no casan con ninguna. Un uid de Firebase no tiene `:`; si lo tuviera, el corte
  igual toma todo lo que sigue a la base.

## 4. `R9-275`, el store redirigido

- **Con la devolución sin terminar** (su unión falló): la cuenta no está en `givenBack`, lo escrito
  va a su clave sobre la Mesa entera que sigue allí, y el arranque siguiente lo une a la «sin
  cuenta» (gana lo más nuevo, que es esa entrada completa y editada). Nada se parte.
- **Contra la adopción de otra cuenta en el mismo proceso** (por lectura): una escritura para Ana
  que llegara a su turno después de que Beto entrara y adoptara la «sin cuenta» crearía allí una
  entrada parcial, separada de la de Beto (sin perder nada). Hace falta que el turno retenga esa
  escritura desde antes del estado nulo hasta después del inicio de sesión de Beto (selector de
  Google incluido): no es alcanzable. Antes de la 59, esa escritura se perdía bajo el uid de Ana.

## 5. `R9-275`, el respaldo

`RESPALDO`, con la cuenta borrada durante la restauración (SQLite retenido; CONTROL `bien`):

- **La unión del respaldo falla** (`uneFalla`): la restauración dice que salió bien; R queda bajo
  `:ana` con la nota, y el arranque siguiente lo devuelve (la «sin cuenta» queda con P y R).
- **El `multiSet` falla** (`escribeFalla`): la restauración lo dice (`asyncStorageWriteFailed`, sin
  `prepNotes`), la nota queda, y el arranque siguiente no encuentra nada que unir y la borra.
- **Si falla la nota:** se escribe y se une igual; solo se pierde el reintento (por lectura, como en
  `releasePrepAccount`).
- **Los comentarios:** el del encabezado corregido en la 59 («written and then given back by the
  same join as that Mesa»: la unión es `joinPrep(uid, null, true)`, la de `giveBack`) y el de
  `prepMultiSet` («the note's turn takes no Mesa turn»; «a give-back that fails here keeps its
  note»): ciertos, medidos arriba.

## 6. Las pruebas nuevas

- Las tres construyen su caso, y la 59 las vio caer con cada pieza (`S59-rev.cjs.txt`). La del
  store retiene la unión de la devolución y pide las escrituras mientras está retenida (controles
  `retenida: 1`, `antesDeAbrir: 0`); la del respaldo retiene SQLite (control `retenida`,
  `antesDeBorrar`); la de la nota, la unión que falla (control `anaSeQuedo`).
- **`mismoTurno`:** con la estructura de hoy es equivalente por construcción. La continuación del
  `await oneAtATime(...)` de `giveBack` corre una microtarea después de la unión; la tarea siguiente
  del turno, dos (`turn = run.then(…)` y después `turn.then(fn)`). Importaría si entre la unión y
  `givenBack.add` hubiera otro `await` (por ejemplo, quitar la nota antes): por eso se queda
  dentro del turno.

## 7. Los comentarios nuevos, caso por caso

Ciertos todos: `RELEASE_KEY`, `finishRelease` («each on its own»), `noteReleases` (fuera del turno
de la Mesa, para no agrandar la ventana tras `deleteUser`), `givenBack` («only this process can hold
a write for them»: las claves salen de la cuenta con sesión, y una cuenta borrada no vuelve a
tenerla), `prepWrite`, `prepMultiSet`, `giveBack` y el encabezado. El de `BackupService` («if their
account was deleted meanwhile, its Mesa is given back after»): cierto también con la devolución sin
terminar (la nota la termina en el arranque siguiente).

## 8. Lo siguiente

El hilo de la Mesa (`R9-59` → `R9-269` → `R9-273`..`R9-276`) queda cerrado. Lo que sigue lo elige
Victor entre los pendientes; la recomendación es `R9-267` (P2: una lectura fallida del mazo de
memoria lo deja en `{}`, y el efecto de persistencia lo escribe encima), junto con la parte de
`MemoryDeckContext` de `R9-133`, que es el mismo archivo.
