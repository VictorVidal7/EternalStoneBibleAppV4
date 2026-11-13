# S147 — revisión del diff de la 146 (`R9-574` y la tanda V1b: de quién es el premium)

> **Sesión 147 (2026-11-13).** En un chat nuevo, en la terminal, con **Fable 5.2 como modelo principal** y esfuerzo
> `high`. **Victor pidió 2 agentes** a mitad de la sesión (fork, cada uno en su worktree): el 1, los reverts por
> pieza, la cascada y las pruebas; el 2, la matriz de la V1b corrida de nuevo y extendida. El orquestador hizo los
> puntos 5 a 10 y re-verificó con sonda propia lo portante del agente 2. Alcance: `ee262bf5..14dea172`. **No se
> tocó la app.** Sin emulador: **nada de esto está medido en vivo**.
>
> **Resultado.** Los cinco arreglos de la 146 hacen lo que dicen: las 21 piezas vuelven a caer por la razón
> escrita, las dos matrices salen idénticas, y lo commiteado da igual con los dos supuestos sobre RevenueCat.
> **Nueve hallazgos nuevos: un P2 (`R9-580`, una regresión de `R9-119`) y ocho P3 (`R9-581` a `R9-588`).** El P2
> va primero en la 148.

## 1. Cómo se trabajó

- **Agente 1** (`_scratch/S147-a1-informe.md.txt`): los lotes de la 146 otra vez, 33 piezas más finas, la cascada
  prueba por prueba (`-t`), el orden aleatorio y la tabla prueba → pieza. Herramientas y salidas: `S147-a1-*`.
- **Agente 2** (`_scratch/S147-a2-informe.md.txt`): la sonda de la V1b leída entera, corrida contra `14dea172` y
  contra `ee262bf5`, y extendida con 27 filas, cada una con U y con N (`S147-a2-sonda-v1b.test.tsx.txt`;
  `S147-a2-matriz-ext-{despues,antes}{,-U,-N}.txt`).
- **Orquestador:** la matriz de `R9-574` y sus filas nuevas (`S147-sonda574.sh.txt`, `S147-matriz574-extra.txt`);
  una sonda propia sobre el servicio real y el mock commiteado (`S147-sonda-propia.test.ts.txt`, salida
  `S147-sonda-propia.out.txt`); la sonda extendida del agente 2 corrida en el árbol principal
  (`S147-a2-matriz-ext-orq*.txt`: idéntica a la del agente); el SDK leído (`S147-aar.sh.txt`); los `grep` de
  consumidores, los textos, los comentarios y la propuesta sin commitear.
- **Lo que NO re-verificó el orquestador** (el límite de uso cortó la sesión): del agente 1, los tres expects de
  `R9-584` que pasan con y sin el reintento, y la prueba que depende del orden (`R9-588`). Están medidos por el
  agente, con su sonda y sus salidas en `_scratch`.

## 2. Cada arreglo arregla lo que dice (puntos 1 a 3)

- **Los lotes de la 146:** `574a` a `574f`, `135a` a `135k`, `579a`, `579b` y `18i` caen con el mismo número y las
  mismas pruebas que las tablas de la 146, con la razón leída en la primera que cae. Ningún revert abortó.
  `rev119` hace caer hoy 5 y no 4: la quinta es la prueba de `R9-135` de `AuthContext.test.tsx`, que entró un
  commit después; la cuenta de la 146 era cierta en `3190815b`.
- **Las piezas finas** (`S147-a1-lotefino.out.txt`). Con cero caídas y que SÍ hacen falta: el segundo `try/catch`
  de `logInAs` y el orden borrar/procesar (`l-try2`, `l-orden`); los `try/catch` de `pendingLink.ts` (`k-tryset`
  es portante; `k-tryget` solo cambia el log); `notActivated` en «ya comprado» de la hoja (`o-owned`); el lugar
  del bloque en `initialize()` (`i-lugar`). Redundantes o equivalentes por construcción: `!Purchases.isAnonymous`
  (lo cubre el `try/catch`), `stored !== null`, el `|| null`, `deleteItemAsync` frente a `setItemAsync('')`. Del
  mock: ninguna de 196 pruebas depende de que su `logIn` cambie el id (`m-login`); el id lo dice siempre la prueba
  a mano. Todo esto es `R9-584`.
- **La cascada.** Lo que la 146 declara (`135e`, `135i`: tres pruebas caen por un `mockRejectedValueOnce` sin
  consumir) se comprueba. **No lo declara para `135a` y `135j`**, donde pasa lo mismo: «un logIn que sale bien
  borra el pendiente» cae en el lote y pasa sola. Las cuentas de 8 y 7 de la 146 incluyen una que no cae por la
  razón escrita.
- **El orden aleatorio** (8 semillas, 5 suites, código bueno): ninguna prueba del diff cae. Cae una que no es del
  diff, `R9-38 — deleteAccount` (`AuthContext.test.tsx:1200`), también en `ee262bf5`: `R9-588`.
- **Las pruebas contra las reglas.** El productor es real en las cuatro suites. **Tres expects afirman algo que el
  mock no puede decir** (`offeringService.test.ts:813`, `:822-823`, `AuthContext.test.tsx:1617-1618`): con un
  solo `customerInfo` global vacío, `premium = false` sale igual sin el reintento. Ninguna prueba afirma de quién
  quedan las compras.

## 3. La matriz de la V1b, corrida de nuevo y extendida (puntos 4 y 6)

- **Idéntica** a `S146-matriz-v1b-despues.txt` contra HEAD, y a `-antes` contra `ee262bf5`. Cambian solo las filas
  1, 2, 3, 3b y 10. **Las filas 6b y 8 son byte a byte iguales antes y después, con U y con N.**
- **Qué supone el simulador y qué tapa** (informe del agente 2, §1). Lo que importa: las filas 4 y 4b («canje
  siendo anónimo») **no miden nada real**: el `fetch` simulado concede a cualquier token, y el servidor rechaza
  el anónimo (`R9-583`).
- **El criterio de los dos supuestos se cumple:** lo commiteado da igual con U y con N. Las filas que ya dependían
  del supuesto antes del diff son cuatro y no dos: 6b, 8, 5d (la cuenta llega con el SDK ya configurado en un
  arranque) y C1 (el `linkUser` del canje). Ninguna cambió.
- **El reintento no crea ni empeora** «RevenueCat en una cuenta con las compras en un id anónimo»: solo anota
  fuera de un `$RCAnonymousID` (filas 8b y 5e) y RevenueCat no vuelve a un id anónimo. Lo inexacto es la frase
  «no hay compras anónimas en juego» (detalle de la 146 §5): **leído en el AAR 10.16.1**,
  `IdentityManager.currentUserIsAnonymous` decide con la regex `^\$RCAnonymousID:([a-f0-9]{32})$`. Un uid anónimo
  de Firebase enlazado por un build anterior a `3190815b` no es anónimo para el SDK, y ahí pueden estar las
  compras de quien pagó (fila G1 y bloque C de la sonda propia). Da lo mismo que el camino sin fallo (G2).

Lo que la 146 no midió, fila por fila (la tabla completa: informe del agente 2, §3):

| Caso                                                                    | Qué pasa                                                                                             | Hallazgo                    |
| ----------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- | --------------------------- |
| Ana sale; el anónimo crea su cuenta por link y compra (6c)              | la compra queda en el cliente de ana; en otro aparato la cuenta nueva no tiene extras y ana sí       | `R9-580`                    |
| El `logIn` de beto rechaza tarde, con carla ya enlazada (B2)            | queda anotado beto; la compra de carla hace `logIn(beto)` y queda en beto                            | `R9-581`                    |
| La cuenta anotada sale (o se elimina) antes del reintento (A1, A2, F)   | en el mismo proceso, comprar o restaurar hace `logIn` de esa cuenta; tras un frío, no                | `R9-582`                    |
| Dos fallos seguidos de cuentas distintas (B1)                           | queda anotada la última; bien                                                                        | ninguno                     |
| El canje con cuenta, `logIn` fallando, RevenueCat en su id anónimo (C2) | `success` sin extras; no lo recuperan el frío, «Restaurar» ni otro canje. Igual en `ee262bf5`        | suma a `R9-135`             |
| `expo-secure-store` falla al anotar, al leer o al borrar (D1 a D3)      | se registra y no rompe; sin disco vuelve el `R9-135` de antes en los fríos; un resto viejo es inocuo | ninguno (pruebas: `R9-584`) |
| `linkUser` con `getCustomerInfo()` del arranque en vuelo (E1)           | la respuesta vieja llega después y gana ese proceso                                                  | `R9-587`                    |

## 4. `R9-574` y `R9-579` (puntos 5 y 8)

- La matriz de la 146, corrida de nuevo: idéntica, en los dos idiomas.
- **El filtro supone que todo lo que no es una donación es una ofrenda** (`R9-585`): una transacción de un
  producto ajeno, o sin `productIdentifier`, da «Tu ofrenda ya está registrada». En el repo solo figuran
  `ofrenda_1..3` y `donacion_1..4`; la consola de Play no se abrió. El reembolso sigue sin medir.
- **`offering.restoreNotFound`** se muestra en un solo camino (`OfferingSheet.tsx:200`) y se sostiene en los dos
  idiomas con la cuenta vacía, con solo donaciones y con un pago pendiente. No se propone reemplazo.
- **El toast de la donación** (`R9-586`): sale también cuando los extras ya se veían por la caché y RevenueCat no
  había respondido en el arranque (fila 13). El texto, usado en la donación, se sostiene cuando sí restauró.

## 5. Quién consume lo que cambió (punto 7)

`linkUser`: `AuthContext.tsx:373` y `giftCodeService.ts:201`. `RestoreOutcome` y `'notActivated'`: `OfferingSheet`
(tres lugares) y `DonationSheet`. `getLastKnownEntitlement`: `DonationSheet.tsx:125`. `pendingLink`: solo el
servicio. La web: las variantes `.web.tsx` no importan el servicio, y `pendingLink.ts` importa
`expo-secure-store` igual que `entitlementCache.ts`, que el servicio ya importaba. Sin exposición nueva.

## 6. Los comentarios y docstrings (punto 9): `R9-583`

Los dos comentarios de `R9-119` dicen lo que hace el código, salvo «anonymous or not» (el canje siendo anónimo no
existe). `notePendingLink` y la cabecera de `pendingLink.ts` dicen «ANOTHER account» donde la guarda es «un id que
no es `$RCAnonymousID`» (entra también la misma cuenta: bloque D). «That is the state every cold start leaves» es
falso: el SDK recuerda su usuario. `hasOfferingPurchase` afirma como hecho que un pendiente no figura en el
`CustomerInfo`, que está sin medir. El comentario de `giftCodeService.ts:187-189` quedó viejo.

## 7. Las dos piezas sin commitear (punto 10)

La tabla de la 146 (§6) es correcta. Tres cosas que no dice:

- **La pieza P2 se puede partir.** Con RevenueCat fuera de un `$RCAnonymousID`, enlazar tras el
  `linkWithCredential` es seguro con los dos supuestos (fila 6e) y arregla `R9-580`. Solo la mitad «desde un id
  anónimo» espera la medición.
- **P1 lee `earlyUid`, que también escribe el canje.** Hoy es inalcanzable para un anónimo, pero P1 debería tomar
  el uid solo de `AuthContext`.
- **Quién cae en cada fila.** La 5b (un uid nuevo para RevenueCat) es el caso común: todo el que pasó de anónimo
  a Google por link. La 5c (un uid que RevenueCat ya conocía, con RevenueCat anónimo en ese aparato) pide un
  `logIn` fallido al iniciar sesión. La medición decide igual.

## 8. Sin medir en vivo (ni bueno ni malo)

Las listas de la 146 (§9) y de la 145 (§11) siguen enteras. Se agrega: si Firebase avisa tras
`linkWithCredential` (decide `R9-580`, además de la fila 6b); si el SDK serializa dos `logIn` y en qué orden
entrega un `getCustomerInfo` pedido antes (`R9-581`, `R9-587`); si `restorePurchases` transfiere; si en un arranque
real la cuenta puede llegar después de `initialize()` (fila 5d); qué responde `isAnonymous()` en el dispositivo con
un uid anónimo de Firebase enlazado (leído: false); si un respaldo de Android restaura `expo-secure-store` o las
preferencias de RevenueCat; si hay o hubo otro producto único en Play.

## 9. Archivos de la sesión (`_scratch`)

`S147-a1-*` y `S147-a2-*` (los agentes); `S147-sonda574.sh.txt`, `S147-sonda574-extra.txt`, `S147-matriz574.txt` y
`S147-matriz574-extra.txt`; `S147-sonda-propia.test.ts.txt`, `.sh.txt` y `.out.txt`; `S147-aar.sh.txt`;
`S147-CIERRE-PROMPT.md` (escrito al llegar al límite de uso; el checkpoint se hizo igual en la misma sesión).
