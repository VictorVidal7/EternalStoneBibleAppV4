# A1 — Premium: `PremiumContext` + RevenueCat + entitlements

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 3 (2026-09-03) · Estado
> **🐛 BUG** (2 hallazgos P0: `R9-9`, `R9-10`)

## Alcance

Revisado: `src/context/PremiumContext.tsx` (113 L), `src/lib/premium/premiumStore.ts`
(33 L), `src/lib/offering/entitlementCache.ts` (49 L),
`src/lib/offering/offeringService.ts` (380 L — el único módulo que habla con
`react-native-purchases`), y los dos call sites que gobiernan el ciclo de vida:
`app/_layout.tsx:250` (`initialize()`) y `src/context/AuthContext.tsx:297-299`
(`linkUser()`). Más el barrido de los 55 archivos que consumen `usePremium`.

**Fuera de alcance aquí** (tienen su propia fila): `offeringService`'s compra/donación
y `giftCodeService` → `A2`; la implementación web → `A6`; el ejercicio en vivo de las
rutas de dinero → `C15`, `C39`, `C55`, `C56`.

## Lo que ya cubren los tests (no re-derivado)

`__tests__/PremiumContext.test.tsx` (5 casos), `__tests__/premiumStore.test.ts`,
`__tests__/offeringService.test.ts` (337 L), más ~30 suites de pantalla que siembran
`ENTITLEMENT_CACHE_KEY` directamente para probar su gating. Cubren: default bloqueado,
lectura de una compra persistida, cambio en vivo **`false → true`**, y el gateo del
override `__DEV__`.

**El hueco:** ninguna prueba ejercita la dirección contraria — caché en `'true'` y
RevenueCat reportando la entitlement **inactiva**. Ahí están los dos hallazgos.

---

## 🐛 `R9-9` (P0, severidad **alta**) — la revocación de la entitlement no se propaga nunca

`src/lib/offering/offeringService.ts:121`

```ts
async function handleCustomerInfo(info: CustomerInfo): Promise<void> {
  const unlocked = isEntitlementActive(info);
  if (unlocked === lastKnownUnlocked) return; // ← ln 121
  lastKnownUnlocked = unlocked;
  await setCachedEntitlement(unlocked); // ← ln 123, nunca se alcanza
  for (const cb of listeners) { ... }    // ← ln 124-133, nunca se alcanza
}
```

`lastKnownUnlocked` se inicializa a `false` en cada arranque del proceso
(`offeringService.ts:112`). Por lo tanto, en cualquier arranque donde RevenueCat
reporte la entitlement **inactiva**, el `unlocked === lastKnownUnlocked` (`false ===
false`) corta la función **antes** de escribir la caché y **antes** de notificar a los
listeners. Un `'true'` viejo en la caché de `expo-secure-store` no se corrige jamás.

`PremiumContext` se siembra de esa caché en el montaje
(`PremiumContext.tsx:57-61`) y después solo escucha **cambios**
(`PremiumContext.tsx:64-66`) — un cambio que, por lo anterior, no va a llegar. El
resultado es que el servicio **sabe** que la entitlement está inactiva y la UI muestra
premium igual.

**Nada lo repara después:** un `grep` de `SecureStore` sobre `src/` + `app/` devuelve
**cero** usos fuera del propio `entitlementCache.ts`. Ni el cierre de sesión, ni el
borrado de cuenta, ni el reset de datos de Ajustes limpian esa clave. Y `linkUser()`
está documentado a propósito para **no** revocar en el sign-out
(`offeringService.ts:200-205`, citado desde `AuthContext.tsx:296-298`). Solo una
desinstalación borraría el valor.

### Repro (verificado, no inferido)

Sonda temporal en `_scratch/` (gitignoreado), contra el `PremiumContext` y el
`offeringService` reales con el mock oficial de `react-native-purchases`:

| Caso                                                       | `isPremium` | caché en disco | `getLastKnownEntitlement()` |
| ---------------------------------------------------------- | ----------- | -------------- | --------------------------- |
| **1** caché `'true'` + RevenueCat **inactiva** (reembolso) | `true` ❌   | `'true'` ❌    | `false` ✅                  |
| **2** caché `'true'` + `linkUser('uid-B')` sin entitlement | `true` ❌   | `'true'` ❌    | —                           |
| **3** _(control)_ caché vacía + RevenueCat **activa**      | `true` ✅   | `'true'` ✅    | —                           |

El control (caso 3) pasa: **la concesión sí se propaga**. El defecto es asimétrico —
solo falla la dirección que quita el acceso.

### Escenarios de fallo concretos

1. **Reembolso / compra revocada.** Google Play reembolsa → RevenueCat revoca `extras`
   → en el siguiente arranque en frío el usuario conserva premium **para siempre** en
   ese dispositivo. Es dinero: acceso pagado que ya no se pagó.
2. **Dispositivo compartido / cambio de cuenta** (caso 2). A compra; se mata la app; B
   inicia sesión con su cuenta. `linkUser(uid_B)` trae una `CustomerInfo` sin
   entitlement, el dedupe la descarta, y **B tiene premium permanente**. Es el mismo
   patrón de fuga entre cuentas que ya mordió una vez en otra superficie (memoria
   `essb-restore-banner-shared-device-fix`).
3. **Override `__DEV__`.** `setPremium(true)` escribe `'true'` en la **misma** caché que
   lee producción (`premiumStore.ts:31-33`) sin tocar RevenueCat. En un build de debug
   eso queda pegado; solo afecta a builds de desarrollo, pero explica por qué el efecto
   puede parecer "normal" en pruebas locales y esconder el bug real.

### Corroboración aguas abajo

`src/components/settings/ColorThemeSettings.tsx:60-74` tiene un `useEffect` cuyo
comentario nombra el escenario textualmente — _"If a premium theme was active and the
entitlement is later revoked (e.g. a refund), fall back to a free theme"_. Ese revert
depende de que `isPremium` pase a `false`, que es justo lo que `R9-9` impide en un
arranque en frío. Lo mismo en `ReaderPreferencesSheet.tsx:128-150`. Es decir: los
consumidores se escribieron **asumiendo** que la revocación se propaga, y no se propaga.

### Forma del arreglo (no aplicado — charter §1)

El dedupe de `handleCustomerInfo` es correcto para no notificar de más; lo que está mal
es tomar `false` como estado inicial conocido cuando en realidad es _"todavía no sé"_.
Opciones, de menor a mayor cambio: (a) sembrar `lastKnownUnlocked` desde la caché en
`initialize()` antes del primer `getCustomerInfo()`; (b) escribir siempre la caché
(`setCachedEntitlement`) aunque no haya cambio, y dejar el dedupe solo para la
notificación a listeners; (c) hacer `lastKnownUnlocked: boolean | null` con `null` =
sin resolver. Nótese que `getLastKnownEntitlement()` (`offeringService.ts:378`) ya
existe y **no tiene ningún consumidor de producción** — solo tests; es el accesorio
natural para que `PremiumContext` consulte el estado ya resuelto al suscribirse, pero
por sí solo no basta (devuelve `false` tanto para "revocada" como para "aún sin
resolver", que es exactamente la ambigüedad que causa el bug).

---

## 🐛 `R9-10` (P0, severidad **media**) — la lectura tardía de la caché pisa el valor real de RevenueCat

`src/context/PremiumContext.tsx:54-72`

```ts
useEffect(() => {
  let mounted = true;
  (async () => {
    const unlocked = await getPremiumUnlocked(); // ← lectura de SecureStore
    if (mounted) {
      setIsPremium(unlocked); // ← ln 59: pisa incondicionalmente
      setIsLoading(false);
    }
  })();
  const unsubscribe = onEntitlementChange(unlocked => {
    if (mounted) setIsPremium(unlocked); // ← ln 65
  });
  ...
```

Las dos escrituras de estado no tienen orden garantizado. La lectura de caché arranca
primero pero resuelve cuando resuelve; si el push de RevenueCat llega **antes**, la
lectura tardía sobrescribe el valor autoritativo con el viejo. Contradice de frente el
contrato que declara el propio docstring del módulo (`PremiumContext.tsx:5-8`): _"those
come from RevenueCat's CustomerInfo … and win over anything written here"_.

**Repro (verificado, determinista, sin timers):** sonda que difiere la resolución de
`getPremiumUnlocked()` con una promesa controlada, y entremedio dispara `initialize()`
con la entitlement **activa**:

```
tras push de RevenueCat -> isPremium = true
tras resolver la caché  -> isPremium = false   ← usuario que pagó, app bloqueada
isLoading = false
```

**Escenario:** usuario que sí pagó, en un arranque en frío donde la primera lectura de
`expo-secure-store` es lenta (inicialización del keystore de Android) y la caché aún no
refleja la compra (reinstalación, o una escritura previa que falló — `entitlementCache.ts:43-48`
**se traga los errores de escritura** y solo avisa por `logger.warn`). Queda premium
bloqueado toda la sesión.

**Por qué es severidad media y no alta:** se auto-repara en el siguiente arranque, porque
`handleCustomerInfo` sí escribió `'true'` en la caché antes de notificar
(`offeringService.ts:123`). Es un bloqueo de una sesión, no permanente. Y la ventana
exige que SecureStore sea más lento que el primer push de RevenueCat, que no es lo
habitual. Pero el usuario afectado es, por definición, uno que **ya pagó**.

**Forma del arreglo (no aplicado):** ignorar el resultado de la lectura de caché si un
valor del listener ya llegó (un `ref` de "ya resuelto por RevenueCat" basta), en vez de
`setIsPremium` incondicional en la línea 59.

---

## ✅ Verificado OK en esta fila

- **Fail-closed en el hook opcional.** `usePremiumOptional()` devuelve `undefined` sin
  provider, y el único consumidor de producción
  (`src/features/audio/context/AudioPlayerContext.tsx:221-223`) degrada con
  `premiumCtx?.isPremium ?? false` — bloqueado, no desbloqueado. Correcto.
- **`isLoading` está bien tratado en los gates.** Los consumidores que revierten estado
  premium (`ColorThemeSettings.tsx:66-68`, `ReaderPreferencesSheet.tsx:134`,
  `InterlinearSheet.tsx:106`, `OfferingSheet.tsx:109`, `AudioResumeRestorer.tsx:49`)
  chequean `!premiumLoading` explícitamente para no revertir durante la lectura inicial.
  No hay parpadeo de bloqueado→desbloqueado ni revert espurio.
- **La clave de RevenueCat commiteada es realmente pública.** `offeringService.ts:34`,
  prefijo `goog_` = _public SDK key_ de Android, equivalente a un `apiKey` de Firebase.
  La secreta (REST) vive solo en el backend de Vercel. Consistente con `B2`/`B3`.
- **Sin fuga de listeners.** `onEntitlementChange` devuelve el `unsubscribe` y
  `PremiumContext` lo llama en el cleanup junto con el flag `mounted`
  (`PremiumContext.tsx:68-71`).
- **`initialize()` es idempotente y no bloquea el arranque** — `configured` corta la
  re-entrada, y `app/_layout.tsx:250` la lanza con `.catch(() => undefined)` dentro de
  un `Promise.all` en un `void (async …)`. Un fallo de red en el arranque deja el
  listener registrado, así que un push posterior sigue funcionando.
- **Mapeo de resultados de compra.** `outcomeFromError` (`offeringService.ts:261-282`)
  cubre cancelado (por código **y** por el `userCancelled` deprecado) y ya-comprado.
  `purchaseDonation` correctamente **no** llama a `handleCustomerInfo` — el consumible
  no otorga entitlement.
- **`refreshEntitlement()` invalida la caché del SDK antes de releer**
  (`offeringService.ts:358`), que es lo que exige la doc de RevenueCat para una
  concesión fuera de banda (canje de gift code). Bien resuelto.
- **Los gift codes conceden `duration: 'lifetime'`**
  (`vercel/gift-code-redeem/api/redeem.ts:55`), así que la expiración de una concesión
  promocional **no** es una vía adicional para `R9-9`.

## Observaciones menores (no son hallazgos)

- `getLastKnownEntitlement()` (`offeringService.ts:378`) no tiene consumidores de
  producción, solo `__tests__/offeringService.test.ts`. No lo registro como código
  muerto porque es parte de la superficie de arreglo de `R9-9`; si `R9-9` se arregla por
  la vía (a) o (c), este export pasa a tener sentido. Revisar en `A31`.
- `entitlementCache.ts` se traga los errores de escritura (`:43-48`) y de lectura
  (`:27-33`), ambos con `logger.warn` y default `false`. El default de lectura es
  fail-closed y correcto; el de escritura es el que alimenta el escenario de `R9-10`.

## Nota de método (para las próximas sesiones)

Las sondas se escribieron en `DOCS/REVIEW_2026-09/_scratch/` y se **borraron** al
cerrar la fila. **Gotcha detectado:** `_scratch/` está en `.gitignore` pero **no** en
`jest.config.js` — `testMatch` incluye `**/?(*.)+(spec|test).[jt]s?(x)` y
`testPathIgnorePatterns` solo excluye `node_modules/` y `.claude/`. Un `*.test.tsx`
olvidado ahí **se suma a la suite** de `npm test` sin aparecer en `git status`. Borrar
siempre las sondas al terminar la fila.
