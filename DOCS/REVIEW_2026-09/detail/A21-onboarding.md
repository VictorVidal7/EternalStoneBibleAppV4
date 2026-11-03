# A21 — Onboarding (`lib/onboarding`, `useOnboarding`)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 120 (2026-11-02/03, chat nuevo; con 2
> agentes a pedido de Victor) · Estado **✅ OK**
>
> **Resultado:** sin hallazgos. El asistente del primer arranque, su compuerta y las pistas contextuales
> aguantan un doble toque, el atrás de hardware y el proceso muerto a mitad. Un cruce queda en el Pendiente.
>
> **Cómo se midió:** el agente 2 (`fork` en worktree, sobre `76ca485`) leyó la fila entera contra las pruebas que
> ya la cubren; el orquestador re-verificó en el principal las líneas de la compuerta, del hook y del asistente.
> Sin sonda propia: lo que se descartó lo descartan las pruebas que ya hay o el código mismo (abajo).

## El área

`src/hooks/useOnboarding.tsx` (55 L), `src/hooks/useContextualHint.ts` (78 L), `src/lib/onboarding/`
(`contextualHints.ts` 188 L, `featureGuides.ts` 456 L), `src/components/onboarding/OnboardingScreen.tsx` (619 L) y
su compuerta en `app/_layout.tsx`. Lo ya dicho, no re-derivado: Fable, área 38 (el asistente de 5 pasos
recorrido en vivo tras `pm clear`, con la persistencia releída en AsyncStorage y el filtro de los temas premium).
Las pruebas que ya hay: `onboardingBackHandler`, `contextualHints` (19), `useContextualHint` (7),
`contextualHintBanner` (6), `featureGuides`, `featureGuideModal`, `_layout`.

## Revisado sin hallazgo

- **La marca (`useOnboarding.tsx:29-53`):** si la lectura falla, vuelve el asistente (pérdida sobrevivible y
  documentada); `complete()` pone el estado antes de escribir, así que dos toques en «Comenzar» dan dos
  escrituras iguales que no se pisan. Ningún `AsyncStorage.clear`/`getAllKeys()` de la app borra
  `@onboarding_completed` (grep vacío): ni un reset de datos ni un respaldo restaurado lo vuelven a mostrar.
- **La compuerta (`app/_layout.tsx:332-344`):** `null` pinta una vista vacía del color del tema (sin destello de
  ninguna de las dos), `false` el asistente, `true` el navegador.
- **El asistente (`OnboardingScreen.tsx`):** dos toques en un mismo render avanzan un paso; el atrás de hardware
  se consume siempre (`:91-96`, con su prueba); idioma, versión y tema se escriben al elegirlos (`:98-111`): si
  el SO mata la app a mitad, queda lo elegido y el asistente vuelve a salir. El paso del tema filtra los
  exclusivos (`:396-399`).
- **Versión contra idioma (`src/hooks/useBibleVersion.tsx:82-88`):** sin elección explícita, la versión sigue al
  idioma entre las instaladas; una versión elegida y un idioma cambiado después la dejan como está (es la
  elección del usuario).
- **Las pistas (`useContextualHint`, `contextualHints.ts`):** el contador de sesiones sube una vez por arranque,
  los descartes van por pista, todo con `catch`; el temporizador del banner se limpia al desmontar
  (`src/components/hints/ContextualHintBanner.tsx:116-126`). `featureGuides.ts` es contenido estático con sus pruebas.

**No alcanzable:**

- `dismissHint` lee, cambia y escribe un mapa JSON: dos descartes chocarían solo dentro del mismo tic, y los
  banners se descartan con segundos de diferencia.
- En la sesión del asistente el contador puede no contarla: las pistas salen en la 3.ª sesión en vez de la 2.ª,
  sin daño.
- El idioma que parpadea antes de que `useLanguage` hidrate: cosmético.

## Sin medir

- **Pendiente (cruce con `A14`):** `refreshInstalledVersions` (`src/hooks/useBibleVersion.tsx:59-69`) corre
  mientras se siembra la base en el primer arranque: es el «sin medir» de la copia del sembrado de `A14`.
- **Cruce con las vecinas:** el tema exclusivo que llega por un respaldo restaurado (`@app_color_theme` va en
  el respaldo, `src/services/BackupService.ts:117`) está escrito en `detail/A20-ajustes.md` (Pendiente, `C56`).
