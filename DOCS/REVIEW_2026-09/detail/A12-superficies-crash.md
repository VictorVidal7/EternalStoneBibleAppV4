# A12 — Superficies de crash: error boundaries, promesas sin catch

> Modo A (auditoría estática) · Prioridad **P0** · Sesión 6 (2026-09-14) · Estado
> **EN CURSO — PARCIAL, NO CERRADA**
>
> **Por qué está a medias.** La empezó el orquestador en el árbol principal mientras corría
> el fan-out de 4. Victor pidió a mitad de sesión bajar el ritmo para no agotar el límite de
> uso de 5 h, así que se paró aquí, **a propósito y con el margen intacto**. Lo de abajo son
> **tres observaciones verificadas por `grep` pero SIN el escenario de fallo alcanzable
> demostrado**, que es lo que exige el estándar de evidencia del Modo A (charter §3). Por eso
> **ninguna entró todavía a `BUGS.md`**: son hilos abiertos, no hallazgos.

## Qué se alcanzó a mirar

- `src/components/ErrorBoundary.tsx` (leído entero) y `src/components/ErrorBoundary.web.tsx`
  (leído el encabezado y la clase).
- `app/_layout.tsx:425-472` y `app/_layout.web.tsx:288-318` — los dos árboles de providers.
- `grep` de manejadores globales y de tests del área.

## Hilo 1 — el `ErrorBoundary` es el wrapper MÁS INTERNO de los dos layouts

`app/_layout.tsx:448` · `app/_layout.web.tsx:302`

En nativo cuelga por dentro de **17 providers**; en web, por dentro de **11**. Es decir: un
throw durante el render de **cualquier** provider —`LanguageProvider`, `ThemeProvider`,
`ServicesProvider`, `AuthProvider`, `SyncEngineProvider`, `PremiumProvider`…— **no lo agarra
el boundary**, y el usuario ve el pantallazo en blanco que el propio docstring del componente
dice que existe para evitar:

> _"Catches render errors anywhere below it in the tree — without this, a throw in any of the
> ~60 route screens produced a blank white screen with no recovery path."_

La frase clave es **"below it"**: los ~60 route screens sí están cubiertos; los 17 providers
que envuelven al boundary, no.

**Lo que falta para que esto sea un hallazgo:** demostrar que **algún** provider puede lanzar
durante el render. Los `throw new Error('useX must be used within…')` que hay en 21 sitios de
`src/context/` están en los **hooks consumidores**, que viven por debajo del boundary y por lo
tanto **sí** quedan cubiertos (y ya están reportados por otra vía en `R9-14`). Hay que buscar
otra cosa: un `JSON.parse` en un inicializador de `useState`, un `useMemo` que indexe sin
guarda, un `!` no-nulo sobre algo que puede faltar. **Sin eso, esto no pasa de observación
estructural.**

Pista concreta ya localizada por la fila `A11`, que vale la pena perseguir primero:
`CustomPlansContext.tsx:69` **parsea `@custom_plans` sin validar**. `CustomPlansProvider` está
por encima del boundary en el árbol nativo.

## Hilo 2 — cero manejadores globales de error en toda la app

`grep -rn "setGlobalHandler\|unhandledrejection\|unhandledRejection\|ErrorUtils" src app
--include=*.ts --include=*.tsx` (excluyendo `__tests__`) → **cero resultados**.

No hay `ErrorUtils.setGlobalHandler` (nativo) ni listener de `unhandledrejection` (web). Una
promesa que rechaza sin `catch` no la ve nadie: ni el usuario, ni el `logger`, ni Crashlytics
por esta vía. Es el complemento exacto del hilo 1 — el boundary solo atrapa errores de
**render**, nunca los asíncronos ni los de manejadores de evento.

**Lo que falta:** contar y clasificar las promesas flotantes reales del repo (`.then` sin
`.catch`, `async` en `useEffect` sin `try`, llamadas fire-and-forget). Hasta tener ese
inventario, esto es una ausencia, no un defecto medido. **Ya hay dos casos conocidos de otras
filas que caerían acá:** `R9-52` (la Mesa se traga todo fallo de escritura) y el patrón general
de `R9-40` (ningún `fetch` con timeout).

## Hilo 3 — el `ErrorBoundary` nativo no tiene ni un test; el web sí

`grep -rln "ErrorBoundary" __tests__ src app --include=*.test.ts --include=*.test.tsx` →
`__tests__/ErrorBoundary.web.test.tsx`, `__tests__/webStubProviders.test.tsx`,
`__tests__/_layout.test.tsx`. **Ninguno cubre `src/components/ErrorBoundary.tsx`.**

Es el punto ciego conocido del repo **al revés de lo habitual**: normalmente `tsc`/jest
resuelven siempre al archivo nativo y el `.web` queda sin cubrir; aquí el que tiene test es el
`.web` (por ruta explícita) y el desatendido es el nativo, que es el que corre en producción
para el 100 % de los usuarios reales (la app está en Play Store; la web es secundaria).

**Lo que falta:** comprobar si `reset()` es una recuperación real o un bucle. `reset()`
(`ErrorBoundary.tsx:38-40`) solo hace `setState({error: null})`; si el estado que causó el
throw vive en un provider **por encima** del boundary, "Reintentar" re-renderiza exactamente
el mismo árbol roto y vuelve a lanzar. El `.web` **ya razonó este problema** para su clase de
error de OPFS (`ErrorBoundary.web.tsx`, encabezado) y por eso añadió un camino de "Borrar datos
y recargar"; el nativo no tiene equivalente.

## Por dónde seguir cuando se retome

1. Perseguir `CustomPlansContext.tsx:69` (y cualquier otro `JSON.parse` sin validar en un
   provider) hasta un escenario de fallo alcanzable. Si se demuestra, el hilo 1 se convierte en
   un P0 real: un `@custom_plans` corrupto = app inarrancable sin desinstalar.
2. Inventariar las promesas flotantes con `grep` de `.then(` sin `.catch(` y de
   `useEffect(() => { void ` / `useEffect(() => { (async`.
3. Decidir si `reset()` puede entrar en bucle, y si el árbol de providers debería tener un
   **segundo** boundary por fuera de todo (el patrón habitual es uno externo mínimo, sin
   dependencias de contexto, más el actual por dentro).
