# A37 — Planes propios y Juntos (`CustomPlansContext`, `plan-builder`, `TogetherContext`, `features/together`)

> Modo A (auditoría estática, con sonda) · Prioridad **P2** · Sesión 129 (2026-11-04, en el mismo chat que la 128;
> con 8 agentes a pedido de Victor, 5 en esta fila) · Estado **🐛 BUG** (cerrada en la 129)

> **Resultado:** 9 hallazgos, ninguno P0: P2 `R9-506` (pegar el mensaje entero da «código no válido»), `R9-507`
> (tras editar un plan propio, el atrás muestra el plan viejo), `R9-508` (la vista previa promete un plan y se
> guarda otro, recortado a 400 días), `R9-509` (renombrar un plan de «Número de días» lo rearma y el progreso marca
> capítulos no leídos), `R9-511` (el devocional largo se comparte recortado y se borra el borrador) y `R9-512` (la
> invitación no lleva la duración elegida); P3 `R9-510`, `R9-513`, `R9-514`. Nota a `R9-30` (`@together_groups`).
> La ida y vuelta del paquete es exacta con emojis, chino, hebreo y caracteres raros; ningún enlace fabricado o
> truncado tumba la app.

> **Cómo se midió:** cinco agentes (relanzados como agentes nuevos tras un corte por el límite de 5 horas, en
> worktree, sobre `523e9a8`) que solo midieron: el 1, los planes propios (`CustomPlansContext.tsx`,
> `customPlans.ts`, lo de planes propios en `plan/[id].tsx`); el 2, el constructor (`plan-builder/index.tsx` 749 L);
> el 3, el paquete y el enlace (`bundle.ts` 792 L, `types.ts`, `+native-intent.tsx`, `web/o/index.html`); el 4, la
> pantalla de unirse y el contexto (`together/index.tsx` 565 L, `TogetherContext.tsx`); el 5, compartir
> (`ShareTogetherModal.tsx`, `ShareCustomPlanModal.tsx`, `devotionalDraft.ts`, y su llamador
> `devotional/index.tsx`). Cada sonda de un hallazgo se re-midió igual en el principal. `R9-506` lo encontraron los
> agentes 3, 4 y 5 por separado; `R9-507`, el 1 y el 2; `R9-508` y `R9-511`, el 2/3 y el 3/5: juntados. Informes y
> sondas en `_scratch/S129-sondas-agente-{1..5}/`. Lo ya dicho por `R9-30`, `R9-55`, `R9-64`, `R9-146`, `R9-457`,
> `R9-461`, `A11`, `A12`, `A26`, `A27`, `A29`, `A30`, `A6`, `B4`, `__tests__/customPlans*.test.ts`,
> `togetherBundle.test.ts`, `devotionalDraft.test.ts` y Fable (áreas 36 y 52, ✅) no se re-derivó.

## Hallazgos

- **`R9-506` (P2):** `together/index.tsx:61-67` pasa todo lo que sigue a `#d=` al decodificador, que rechaza el
  primer salto de línea; los mensajes del plan propio y del estudio piden pegar el mensaje entero.
- **`R9-507` (P2):** `plan-builder/index.tsx:231` (`replace` que apila otro `(tabs)`) + `CustomPlansContext.tsx:59-61`
  (el registro, un render atrasado): el plan borrado visible bajo el editado; un toque escribe progreso huérfano.
- **`R9-508` (P2):** `makeCustomPlanBundle` (`bundle.ts:339-360`) recorta a 400 días / 50 capítulos por día sin
  aviso; la vista previa (`:166-171`) no.
- **`R9-509` (P2):** el prellenado (`:142-146`, `inferPerDay`) rearma un plan de «Número de días» al renombrar, y
  `migratePlanProgress` copia los días tal cual.
- **`R9-510` (P3):** `StepperValueInput` (`:62-104`) solo aplica en `onBlur`, con `keyboardShouldPersistTaps`
  (`:277`); el desenfoque, Modo C.
- **`R9-511` (P2):** `makeCalBundle` (`bundle.ts:441-453`) corta a 12 000 y `devotional/index.tsx:288-289` borra el
  borrador; de la misma raíz, `makeStudyBundle` corta las notas de la Mesa a 4 000.
- **`R9-512` (P2):** `makePlanBundle` (`bundle.ts:318-332`) no lleva la duración de `getPlanDuration`.
- **`R9-513` (P3):** `onImport` (`together/index.tsx:235-242`) llama a `setPlanStart` aunque el plan ya exista.
- **`R9-514` (P3):** `.replace('{{plan}}', nombre)` con `$&` en el nombre (`plan/[id].tsx:531-534`, `:904-907`,
  `:239-241`); el patrón está en toda la app, sin barrer.

## Revisado sin hallazgo

- **El paquete:** ida y vuelta exacta de los 4 tipos con «», %, &, `?d=`, comillas, barra invertida, ñ, emoji
  compuesto, chino, hebreo, directa y por el App Link real; los 87 prefijos de un enlace truncado dan «inválido»;
  una versión futura pide actualizar; los 17 códigos `EB1` vuelven a su plan; los validadores (`:574-748`) cubren
  cada campo y un `__proto__` no contamina. Tamaño al tope: plan 19 085, estudio 29 683, devocional 22 365
  caracteres (cabe en WhatsApp).
- **Planes propios:** borrar (`:311-334`, el progreso que queda es `R9-146`), la carga con `Array.isArray`, un id que
  no existe (solo por `R9-507`), web sin `plan/[id]`.
- **El constructor:** la versión cambiada (guarda el nombre canónico), el nombre (vacío, `maxLength` = tope, el «%»
  no va a una URL), un libro de un capítulo, más días que capítulos, dos toques en «Crear» (se deduplica: P3 a lo
  sumo).
- **Unirse:** dos toques en «Importar» o «Unirme» sin daño; la invitación curada es idempotente; el idioma del que
  recibe; `dateToISO` en medianoche local.
- **Compartir:** la fecha local, el piso de la fecha al recompartir, `devotionalDraft` (guardado diferido de un solo
  objeto, con `flush`), el plan propio de punta a punta (mismo id y días, también la Biblia en 365).

## Sin medir

- Dos escrituras sin esperar en `CustomPlansContext.tsx:90-114` pierden un plan (`save(B)`+`save(C)` en el mismo
  render, medido), pero no hay un llamador que las encadene: sin número.
- El emoji partido en el tope, en Hermes (Modo C); la versificación entre emisor y receptor en
  `devotional-shared`/`study-shared` (familia de `R9-503`; medida en la 135 como `R9-538`); el doble toque en «Eliminar» y en las hojas modales
  (Modo C); el atrás en el paso «rango» del selector (Modo C, P3); un segundo enlace con una invitación abierta (el
  «sin medir» de `A27`, Pendiente); el `replace` de `together/index.tsx:232`, `:241`; `R9-507` (R2) en otros
  consumidores de `getReadingPlanById` (`[chapter].tsx:801`, `together/index.tsx:141`, `:213`); el barrido de
  `.replace('{{x}}', texto del usuario)`; «Comienza el {{date}}» sin año (cosmético).

**Cruce con las vecinas (§5, sesión 116):** `A38` y `A39` comparten la familia de `R9-430` (`R9-521`) y la del
`replace` que deja otra copia en la pila (`R9-502`, `R9-507`); `R9-30` suma `@together_groups`.
