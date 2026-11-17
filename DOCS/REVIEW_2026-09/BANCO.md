# El banco propio: errores reales de la IA en esta revisión

Siete tareas con la respuesta conocida. Cada una es un error que la IA cometió aquí, o un hallazgo que costó
encontrar. Sirven para comparar un esfuerzo con otro, o un modelo con otro, antes de cambiar un defecto
(`CONTINUAR.md` §7). Se corren solo cuando Victor lo pide.

## Cómo se corre

1. Una tarea por agente: `general-purpose`, `isolation: "worktree"`, con el `model` y el `effort` que se comparan.
2. El prompt del agente: las reglas de abajo y la consigna, tal cual. **Nunca la respuesta esperada.**
3. El orquestador califica cada respuesta con la lista «aprueba si». Una tarea aprueba solo si cumple todos los
   puntos.
4. El resultado va a `_scratch/BANCO-<fecha>-<config>.txt`: la tarea, aprueba o no, el porqué en una línea, y los
   tokens y las llamadas del agente.
5. Se compara por configuración: tareas aprobadas, tokens y minutos. Un defecto se cambia solo si la configuración
   más barata aprueba lo mismo.

**Reglas para el agente (se copian al prompt):**

- Primero `git reset --hard <base>` en tu worktree y `git log -1` para comprobarlo.
- Leé solo dentro de tu worktree. No leas `DOCS/REVIEW_2026-09/`, ni el árbol principal, ni `~/.claude/`.
- jest: `node C:/projects/EternalStoneBibleAppV4/node_modules/jest/bin/jest.js <rutas> --maxWorkers=2`.
- Una afirmación vale si la mediste: una sonda o una prueba que la muestre. Si solo la leíste, decilo.
- No commitees. Al final, `git diff -- src` vacío.
- Tu mensaje final: la respuesta, la evidencia (salida de la sonda) y lo que no mediste.

**Contaminación:** la memoria y los docs de sesiones posteriores nombran algunas respuestas. Por eso cada tarea
pide la medición, no solo el nombre.

## Cuándo recomendarlo

El orquestador se lo recomienda a Victor en el mensaje final de la sesión, en una línea («Recomiendo correr el
banco: <motivo>»), solo si se cumple uno de estos momentos. Victor decide si se corre y cuándo.

| Momento                                                 | Cómo se nota                                                                                     | Qué se compara                                        |
| ------------------------------------------------------- | ------------------------------------------------------------------------------------------------ | ----------------------------------------------------- |
| Salió un modelo nuevo, o cambió el modelo por defecto   | El id del modelo del entorno no está en «Última corrida» de abajo                                | El nuevo contra el de hoy, en los dos papeles         |
| Se quiere bajar un defecto (esfuerzo o modelo)          | Victor pide ahorrar, o el orquestador ve que una regla de §7 podría ser más barata               | La configuración barata contra la de hoy              |
| Un agente barato se equivocó dos veces                  | Dos afirmaciones de agentes Sonnet que la re-medición no sostuvo (en la misma sesión o seguidas) | Sonnet contra Opus en el papel de solo medir          |
| La cuota se va antes de terminar, dos sesiones seguidas | Cortes por límite o avisos de Victor de que se acaba                                             | Las configuraciones baratas, para ver qué se sostiene |
| Antes de una tanda grande nueva (por ejemplo, la V2)    | El mensaje de la sesión abre una tanda de varias sesiones                                        | Solo si el banco no corrió con los modelos de hoy     |

**Cuándo NO:** en medio de una sesión de arreglos (se termina primero); con la cuota baja ese día (mejor justo
después de un reinicio de 5 horas); si ya corrió con los mismos modelos y nada cambió.

**Cómo correrlo barato:** primero 3 tareas (B1, B4 y B5: un hallazgo, una cuenta y un llamador); las siete solo si
las tres dan distinto entre configuraciones.

## Última corrida

Ninguna. Modelos del entorno al escribir el banco (2026-11-16): Opus 5.5 (`claude-opus-5-5`) de principal, Fable 5.2
(`claude-fable-5-2`) de asesor, Sonnet 5.5 (`claude-sonnet-5-5`) para los agentes que solo miden.

## Las tareas

### B1 — el arranque sin red (`R9-594`, sesión 152)

- **Base:** `0b957e86`.
- **Consigna:** «En `src/lib/offering/offeringService.ts`, ¿hay un caso en que un pendiente en disco, de la cuenta
  que está en sesión, no se reintenta en todo el proceso? Medilo con una sonda sobre el servicio real.»
- **Aprueba si:** (1) nombra el rechazo del `getCustomerInfo()` de `initialize()`; (2) dice que el `catch` se salta
  la lectura del pendiente; (3) mide que la compra siguiente sale sin `logIn` de esa cuenta.
- **El error original:** ninguna sesión lo había visto; lo encontró un agente de la 152 al pasar.

### B2 — el CONTROL que pasa por accidente (`R9-591`, sesión 152)

- **Base:** `88fb8b33`.
- **Consigna:** «En `__tests__/AuthContext.test.tsx`, ¿hay una prueba cuyo CONTROL pasa por accidente? Mostralo con
  una pieza de `src/` que la haga pasar cuando no debería.»
- **Aprueba si:** (1) nombra «R9-582 — eliminar la cuenta borra el pendiente» y su `mockDeleteUser` que ningún
  `beforeEach` limpia; (2) su pieza salta `deleteUser` solo en el camino de esa prueba (por ejemplo, solo para
  `uid-beto`) y la prueba pasa igual.
- **El error original:** el orquestador de la 152 probó primero una pieza que quitaba `deleteUser` para todas las
  pruebas: también quitaba las llamadas anteriores, y no distinguía nada.

### B3 — los expects que no miden el reintento (`R9-584`, sesiones 147 y 152)

- **Base:** `88fb8b33`.
- **Consigna:** «En los `describe` de R9-135 de `offeringService.test.ts` y de `AuthContext.test.tsx`, ¿qué expects
  de lo que ve el usuario (premium sí o no) pasan con y sin el reintento? Las dos piezas: quitar el reintento antes
  de `restore()`, y quitar el reintento al final de `initialize()`. Medilo.»
- **Aprueba si:** (1) encuentra los tres: el de restore (`offeringService.test.ts:817`), el del arranque
  (`:826-827`) y el de `AuthContext.test.tsx:1619-1620`; (2) da la causa: el mock responde un solo `customerInfo`
  global, sea quien sea el usuario.
- **El error original:** las pruebas de la 146 se escribieron así, y la 147 lo midió sin que el orquestador lo
  re-verificara.

### B4 — la cascada (`R9-591`, sesiones 150 y 151)

- **Base:** `88fb8b33`.
- **Consigna:** «Quitá la línea `sessionUid = uid;` de `linkUser` en `offeringService.ts` y corré
  `offeringService.test.ts`, `AuthContext.test.tsx` y `AuthContextLinkPromptColdStart.test.tsx`. De las pruebas que
  caen, ¿cuáles caen por esa línea y cuáles en cascada? ¿Por qué hay cascada?»
- **Aprueba si:** (1) cuenta 15 caídas: 12 por la razón y 3 en cascada («un logIn que sale bien borra el
  pendiente», «forgetSessionAccount borra el pendiente del disco» y la de R9-580 «enlaza la cuenta nueva»); (2) da la
  causa: `__reset` del mock usa `mockClear`, que no vacía las colas `*Once`; (3) lo prueba corriendo cada prueba sola.
- **El error original:** la 150 escribió «9 por la razón, 4 en cascada y 2 sin leer».

### B5 — el llamador que espera (`R9-592`, sesión 151)

- **Base:** `d74242f8`.
- **Consigna:** «`linkUser` fija `sessionUid = uid` porque, dice su docstring, sus llamadores pasan la cuenta en
  sesión. ¿Es cierto para cada llamador? Si no, ¿qué pasa después? Medilo.»
- **Aprueba si:** (1) nombra el canje (`giftCodeService.ts`), que lee `currentUser` antes de `getIdToken`, del
  `fetch` y de `res.json()`; (2) mide un cierre de sesión durante el canje con el `logIn` fallando: el pendiente
  queda anotado y la compra de la sesión siguiente hace `logIn` de la cuenta que salió.
- **El error original:** la 150 escribió la regla sin mirar a cada llamador; la vio la revisión de la 151.

### B6 — el null que sí tiene consumidor (pieza o1, sesiones 151 y 152)

- **Base:** `88fb8b33`.
- **Consigna:** «`forgetSessionAccount` pone `pendingUid = null`. ¿Hay un caso observable en que esa línea cambie
  algo? Medilo con el servicio real.»
- **Aprueba si:** (1) encuentra el caso: la misma cuenta vuelve con su `logIn` en vuelo y compra; (2) mide que sin
  la línea hay un `logIn` de más del mismo uid; (3) dice que ningún dueño cambia.
- **El error original:** la 151 escribió «sin consumidor que lo distinga».

### B7 — la compra antes del primer evento (fila N1, sesiones 150 y 151)

- **Base:** `d74242f8`.
- **Consigna:** «En un arranque en frío, beto tiene un pendiente en disco y está en sesión, pero compra antes del
  primer evento de Firebase. ¿Hace daño? Medilo con el `AuthProvider` y los servicios reales.»
- **Aprueba si:** (1) mide que la compra queda en la cuenta anterior (ana) con `success`; (2) mide que, cuando llega
  el evento, el `logIn` de beto sale bien y beto termina sin premium.
- **El error original:** la 150 escribió «no daña, solo no corrige».

## Qué falta

Ninguna corrida todavía (ver «Cuándo recomendarlo»). La primera, cuando Victor la pida: por ejemplo Opus `high` contra Opus `medium`, o Opus
contra Sonnet para el papel de «solo medir», con las siete tareas. Costo esperado: unos 150 a 250 mil tokens por
tarea y configuración, según las tandas de agentes de esta revisión.
