# A20 — Ajustes (`(tabs)/settings.tsx`, 1326 L)

> Modo A (auditoría estática, con sonda) · Prioridad **P1** · Sesión 120 (2026-11-02/03, chat nuevo; con 2
> agentes a pedido de Victor) · Estado **🐛 BUG**
>
> **Resultado:** 3 hallazgos (`R9-439`, `R9-440`, `R9-441`, P3), ninguno P0. La pantalla y sus secciones
> aguantan los toques dobles y los errores de escritura; lo que falla es un refresco de avisos que no se
> serializa, un texto del indicador de sync que nunca dice «sin conexión» con cola, y un enlace de correo sin
> salida.
>
> **Cómo se midió:** dos agentes (`fork` en worktree, sobre `76ca485`), que solo midieron: el 1, `settings.tsx`
> entera, su `.web`, `DataSettings`, `NotificationsSettings` + `NotificationReminderRow` y
> `ManageVersionsSection`; el 2, el resto de `src/components/settings` (después de `A21`). Tres sondas con
> `_scratch/S116-correr.cjs.txt`, cada una re-medida igual en el principal: `S120-notifDoble.test.ts.txt`,
> `S120-ajustesCuenta.test.tsx.txt` (la pantalla real montada) y `S120-feedbackSinCorreo.test.tsx.txt`. Las
> copias de los agentes, con su informe, en `_scratch/S120-sondas-agente-{1,2}/`.

## El área

`app/(tabs)/settings.tsx` (1326 L; el índice decía 1289), `settings.web.tsx` (232 L) y `src/components/settings/`
(14 archivos, ~3,9k L). Lo ya dicho, no re-derivado: Fable, áreas 24, 26, 27, 39 y 40 (apariencia, cuenta y
respaldo, recordatorios con el permiso del sistema, reset y borrar cuenta cancelados, Extras, donación y
accesibilidad, en vivo); el dinero y el gating de Extras, Donación y el canje los midió el Modo C en la 115
(`C15`, `C39`, `C16`, `C56`; `C55` sigue «sin medir»). Las pruebas que ya hay: `AccessibilitySettings`,
`ColorThemeSettings`, `DataSettings`, `DonationSettings`, `ExtrasSettings`, `functionalidadesSettings`,
`tipsAndGuidesSettings`. Los `R9` que ya nombraban Ajustes (de pasada casi todos): `R9-33` (el indicador, otra
rama), `R9-38`, `R9-412`, `R9-418`, `R9-424` y los de la Mesa y el dinero.

## Hallazgos

**`R9-439` (P3): dos cambios seguidos de idioma o de versión dejan el aviso del versículo del día agendado dos
veces.**

- `src/lib/notifications/NotificationService.ts:232-235`: `scheduleDailyVerseNotifications` cancela por tipo y
  agenda 14 días con un `await` del versículo por día; ni ella ni `refreshDailyVerseNotifications` (`:351-360`)
  se serializan. Lo dispara `app/_layout.tsx:180-198` (deps `[isLoading, language, selectedVersion.id]`).
- **Repro:** con el recordatorio activo, en Ajustes «English» y enseguida «Español» (`settings.tsx:365`, `:393`),
  o dos versiones seguidas (`:283`): los dos refrescos cancelan antes de que el otro agende, y los dos agendan.
  Dos avisos por día hasta el próximo arranque en frío o el próximo cambio.
- **Sonda:** `_scratch/S120-notifDoble.test.ts.txt`: a la vez, `{"total":28,"en":14,"es":14}`: rojo. Control,
  uno tras otro: `{"total":14,"en":14,"es":0}` (13 si la hora del aviso ya pasó hoy: el agente midió 13/26).
- **Propuesta (sin escribir):** serializar los refrescos, o descartar el viejo con un contador de generación.

**`R9-440` (P3): sin conexión y con cambios en cola, Ajustes dice «Sincronizando N cambios…».**

- `app/(tabs)/settings.tsx:96-99` devuelve «sincronizando» para todo `pendingWrites > 0` antes de mirar
  `isOnline`: las ramas `offlineWithQueue`/`offlineWithQueueSingular` (`:100-107`) no se alcanzan nunca (desde
  `1b94b78`; nada más usa esas claves).
- **Repro:** con cuenta y en modo avión, marcar un favorito y abrir Ajustes: «Sincronizando 1 cambio…» en vez
  de «Sin conexión — 1 cambio encolado».
- **Sonda:** `_scratch/S120-ajustesCuenta.test.tsx.txt`, prueba 1: «Sincronizando 2 cambios…»: rojo. Control
  1b (sin red, sin cola): «Sin conexión».
- **Propuesta (sin escribir):** mirar `isOnline` primero.

**`R9-441` (P3): «Reportar un problema» no hace nada si no hay app de correo.**

- `src/components/settings/FeedbackRow.tsx:51`: `void Linking.openURL(mailto)`; el rechazo no lo atrapa nadie:
  sin aviso, y la dirección no se ve. La hermana `src/features/audio/lib/openTtsSettings.ts:34-45` lo atrapa y
  cae a un respaldo.
- **Repro:** Ajustes → Acerca de → «Reportar un problema» en un teléfono sin cliente de correo.
- **Sonda:** `_scratch/S120-feedbackSinCorreo.test.tsx.txt`: `enganchada=false alert=0 direccionVisible=false`.
  Control: `openTtsSettings` resuelve y cae a su respaldo.
- **Propuesta (sin escribir):** `catch` con un aviso que muestre o copie la dirección.

## Revisado sin hallazgo

- **`settings.tsx`:** entrar con Google tiene su guardia y el botón se deshabilita (`:141-177`, `:398-399`); el
  contador de 10 s del indicador se limpia (`:80-85`); el aviso de escrituras descartadas (`:600-625`); el
  `useFocusEffect` solo usa un `ref` (`:122-126`: la lente de `R9-438` no aplica); borrar cuenta cierra el
  diálogo antes de esperar y el `finally` libera el botón (`:205-224`); la lista de versiones muestra solo las
  instaladas; Apariencia (`:420-560`): los tres botones llaman a `setThemeMode`, que atrapa su error
  (`src/hooks/useTheme.tsx:1177-1184`, re-verificado por el orquestador), y el resto del tramo monta las
  secciones de abajo.
- **`settings.web.tsx`:** sin estado asíncrono propio.
- **`NotificationsSettings` + `NotificationReminderRow`:** cada fila con su guardia mientras escribe, los chips
  deshabilitados (`Row:65`, `:84`) y visibles solo con el recordatorio activo (`:72`); con el permiso negado, el
  switch queda OFF.
- **`DataSettings` (importar):** guardia, el uri se vacía antes de leer, toast parcial y aviso de reinicio.
- **`ManageVersionsSection` (borrar):** limpia el objetivo antes de esperar y refresca las instaladas; borrar la
  versión que se lee cae a otra instalada (`src/hooks/useBibleVersion.tsx:84-95`).
- **El resto de `src/components/settings`** (agente 2): `GoalsSettings` (`:54-101`) carga una vez, pero es el
  único escritor de sus claves, que no van en el respaldo ni en sync (la regla de `R9-437` no aplica), y los
  lectores recargan en cada foco; `GoalOptionRow` solo presenta; `FunctionalidadesSettings` (`:76-80`) cierra
  el `Modal` antes del `router.push`, con su prueba; `TipsAndGuidesSettings` abre la guía encima, con su prueba;
  `ExtrasSettings` (`:35-52`) y `DonationSettings` (`:28-37`) con bandera `mounted`, y `configured` ya está
  puesto antes de que Ajustes pueda montar (`src/lib/offering/offeringService.ts:187` contra `app/_layout.tsx:236-251`);
  `AccessibilitySettings` y `ColorThemeSettings` delegan en hooks de `A28` (Fable y `C56` los probaron en vivo);
  `RedeemCodeSheet` (`:119-190`) reinicia el estado en cada apertura, `submitting` con `finally`, y un premium
  no gasta el código (`:153-160`).
- **Lo recorrido solo por sus manejadores** (`grep` de `onPress`/`disabled`; el resto es render y estilos):
  `NotificationsSettings.tsx:470-630`, `DataSettings.tsx:170-431`, `ManageVersionsSection.tsx:150-456`.

**No alcanzable:** tocar un recordatorio antes de que carguen sus preferencias; llegar a la sección de avisos
dentro de la ventana de un refresco.

## Sin medir

- **«Cerrar sesión» sigue activo con «Eliminar cuenta» en curso:** `settings.tsx:781-782` deshabilita solo el
  de borrar, y el de salir (`:758-760`) queda activo (medido en la UI: `S120-ajustesCuenta`, prueba 2,
  `signOut` llamado una vez con el borrado en vuelo). La consecuencia está en `src/context/AuthContext.tsx:691-727`
  (si el borrado en la nube falla tras salir, `engine.start(uid)` re-arranca el motor de una cuenta cerrada): sin
  medir, es de `AuthContext`/`SyncEngine` (`A4`) y cruza `R9-25` y `R9-38`. Junto: si `signOut` lanza, el toast
  dice «No se pudo iniciar sesión…» (`settings.tsx:190`; prueba 3), pero solo si Firebase `signOut` lanza.
- **Los otros cinco refrescos del mismo efecto** (`app/_layout.tsx:189-197`: memoria, oración, devoción,
  profecía, «¿Sabías qué?») siguen la forma de `R9-439` con dos cambios de idioma; sin sonda propia.
- **Exportar con una importación en curso** (`DataSettings.tsx:89-112`).
- **El permiso revocado desde el sistema** deja el switch de avisos en ON (P3 a lo sumo).
- **Pendiente (cruces):** «Restablecer datos» con una importación en curso (`DataSettings.tsx:207`, `:235`) es el
  reset de datos de `A14`; dos descargas a la vez en `ManageVersionsSection.tsx:96-127` (sin guardia por id) son
  el candidato de `A14`; cerrar y reabrir `RedeemCodeSheet` con el canje en vuelo (`:142-148` no mira
  `submitting`, la forma de `R9-435`) y su doble toque son de `C55`; el tema exclusivo que sobrevive sin pasar
  por Ajustes es el «sin medir» de `C56` (`detail/C56-gating-fuera-mesa.md:205-208`), con un segundo camino que
  `C56` no nombra: `@app_color_theme` va en el respaldo (`src/services/BackupService.ts:117`), y restaurar uno
  hecho con un tema exclusivo en una instalación sin premium lo deja hasta abrir Ajustes.
- **Cruce con las vecinas:** `A21` (onboarding) cerró ✅ y su único «sin medir» es el sembrado de `A14`; `A19`
  pedía mirar Ajustes con la lente de `R9-438` (hecho: el foco de Ajustes solo lee un `ref`); `R9-439` es la
  forma de las búsquedas fuera de orden de `A16` (una respuesta vieja que no se descarta) en el lado de la
  escritura.
