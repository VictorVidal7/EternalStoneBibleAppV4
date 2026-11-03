# A27 — Deep links (`+native-intent.tsx`, params por pantalla)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 123 (2026-11-03, sin agentes) · Estado
> **🐛 BUG**
>
> **Resultado:** 2 hallazgos nuevos (`R9-460` y `R9-461`, P3), ninguno P0; más la mitad de deep links de
> `R9-457` (`A26`). Los enlaces que la app emite y los avisos abren la pantalla correcta y validan sus params;
> lo que falla es lo que no es de ninguna ruta (la pantalla por defecto de expo-router, en inglés y con
> «Sitemap») y un `d` repetido, que tira la app entera a la pantalla de error.
>
> **Cómo se midió:** como en `A26`, con la navegación REAL de expo-router 57 (`renderRouter`) sobre los layouts
> de la app, el `redirectSystemPath` real de `+native-intent.tsx` y la pantalla real del estudio compartido.
> Dos sondas con `_scratch/S116-correr.cjs.txt`: `S123-enlaces.test.tsx.txt` (4 pruebas) y
> `S123-onboardingEnlace.test.tsx.txt` (2).

## El área

Los enlaces que llegan de verdad: los que la app emite (`bundle.ts:483-543`: `features/together`,
`features/study-shared` y `features/devotional-shared`, con el payload `d=`, por App Link —`app.json`,
`intentFilters`, `https://eternalstonebible.github.io` con `pathPrefix: "/o"`— o por `eternalbible://`), los
avisos (`PropheticReminderRouter.tsx:31-46`: `features/prophecies?start=<n>` y `features/facts`; los otros
cuatro tipos no tienen destino) y el widget (sin destino: abre la app). Los params que lee cada pantalla: 36
`useLocalSearchParams` en `app/`. Lo de `detail/A13-lector-capitulo.md`, «Para la fila A27», no se re-midió.
Lo ya cubierto: `togetherBundle.test.ts` (el decodificador), `C16` y `C56` (los deep links a pantallas premium
retienen en free, en frío y en caliente).

## Hallazgos

**`R9-460` (P3): un enlace que no es de ninguna ruta abre la pantalla por defecto de expo-router, en inglés y
con un «Sitemap» de todas las rutas.**

- La app no tiene `app/+not-found.tsx`, y `app.json` no pone `extra.router.sitemap: false`
  (`expo-router/build/global-state/utils.js:14-17`: el sitemap se agrega salvo que se apague). La pantalla es
  `views/Unmatched.js:51-104`: «Unmatched Route», «Page could not be found.», «Go back» y «Sitemap».
- **Repro:** el App Link sin su `#d=` (`https://eternalstonebible.github.io/o/`): `redirectSystemPath`
  (`+native-intent.tsx:27-36`) no halla payload y deja pasar la URL, y expo-router abre `/o/`
  (`fork/extractPathFromURL.js:18-25`: `href` sin el origen). Igual con un `eternalbible://` mal escrito, o el
  de una versión más nueva con una ruta que esta no tiene (`encodeStudyLink` emite el esquema directo,
  `bundle.ts:538-540`).
- **Sonda:** `S123-enlaces`, prueba 2: el `redirectSystemPath` real devuelve la URL tal cual, la ruta es `/o/` y
  se monta `expo-router-unmatched` con los cuatro textos en inglés. Control (prueba 1): con `#d=<payload>`, va a
  `/features/together?d=…`.
- **Propuesta (sin escribir):** un `+not-found.tsx` traducido que lleve a Home, y `sitemap: false`.

**`R9-461` (P3): un enlace compartido con el `d` repetido tira la app entera a la pantalla de error.**

- `useLocalSearchParams` da un arreglo cuando la clave se repite, y `decodeTogetherParam` hace `param.trim()` sin
  mirar el tipo (`bundle.ts:751-752`). Lo llaman en el render `study-shared/index.tsx:103-107` y
  `devotional-shared/index.tsx:91-95`, y en un efecto `together/index.tsx:179-182`. El `ErrorBoundary` envuelve
  `AppContent` entero (`app/_layout.tsx:448-450`): toda la app queda en la pantalla de error, y «Reintentar»
  vuelve a la misma ruta.
- **Repro:** `eternalbible://features/study-shared?d=<payload>&d=<payload>` (solo con un enlace hecho a mano; la
  app nunca lo emite). Salir exige cerrar la app.
- **Sonda:** `S123-enlaces`, prueba 4: el render lanza «param.trim is not a function». Control (prueba 3): con un
  solo `d`, la pantalla se monta.
- **Propuesta (sin escribir):** normalizar `d` (`Array.isArray(d) ? d[0] : d`) o que el decodificador rechace lo
  que no es `string`.

## Revisado sin hallazgo

- `redirectSystemPath` con payload (prueba 1) y su `try` (nunca lanza). `pathPrefix: "/o"` no choca con las
  otras rutas de Pages (`/packs/`, `/privacidad/`).
- `prophecies?start=`: `Number.isInteger` y el rango (`prophecies/index.tsx:104-108`); fuera de rango, la intro.
  Los avisos se re-agendan al arrancar (`refreshPropheticReminders`), así que el índice no queda viejo tras una
  actualización.
- Una invitación a un plan que esta versión no tiene: «plan desconocido» (`together/index.tsx:140-144`).
- Un enlace en frío con el onboarding sin terminar sobrevive: al terminar se abre el estudio
  (`S123-onboardingEnlace`, con la forma de `AppContent`, `_layout.tsx:335-349`). Control: con el onboarding
  hecho, igual.
- Resaltados empuja `/verse/${item.bookId}` (`highlights.tsx:216`), pero `bookId` es el nombre canónico
  (`:96`): el lector lo resuelve.
- **Ya anotados, sin número:** lo de `detail/A13` (un libro que `getBookByName` no reconoce deja el spinner para
  siempre; `/verse/Juan/abc` da «Juan NaN»). Solo por un enlace escrito a mano, y no tiran la app.

## Sin medir

- Los 44 `push` a `/verse/<libro>/…` desde datos de la app (`grep` de `/verse/${`): casi todos salen de
  `getBookById`/`getBookByName`; los que pasan un texto de datos (`christ.nav.book`, `content.christNavBook`,
  `note.book`, `favorite.book`) no se barrieron contra la igualdad exacta de `getBookByName` (`bible.ts:676`).
  Fable los recorrió en vivo sin hallazgo.
- Un segundo enlace en caliente sobre `together` con una invitación ya abierta, si el segundo es inválido.
- Con un `d` repetido en frío, si Android relanza el mismo intent desde Recientes (Modo C).

## Cruce con las filas vecinas

- `R9-457` (`A26`) es la otra mitad de los enlaces en frío: la pantalla queda sin nada debajo.
- `A12` (superficies de crash) no tenía `R9-461`: el disparador es un param, no un dato guardado.
