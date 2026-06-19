# 🤝 Comunidad en Eternal Bible — Documento de diseño

**Estado:** Propuesta para decisión (Sprint 103, 2026-06-19)
**Decisión tomada en S103:** _"Diseñar un doc primero"_ antes de construir nada.
**Autor:** revisión profunda Eternal Bible · _Para la gloria de Dios Todopoderoso ✨_

---

## 1. Propósito

El usuario planteó una idea de comunidad "parecida a lo que tiene la Biblia
YouVersion, pero hay que evaluarlo". Este documento evalúa esa idea con criterio
pastoral y técnico, define qué se haría y qué **no**, propone una arquitectura, y
da una **recomendación** — sin escribir todavía una sola línea de código de
comunidad. La app hoy es **100 % offline / sin backend**; cualquier comunidad real
es un cambio arquitectónico mayor, por eso merece esta decisión explícita.

> "Y considerémonos unos a otros para estimularnos al amor y a las buenas obras;
> no dejando de congregarnos... antes exhortándonos." — Hebreos 10:24-25

---

## 2. Principios pastorales (no negociables)

Toda comunidad que construyamos debe **edificar**, no alimentar la vanidad ni la
comparación. Estos principios gobiernan cada decisión de producto:

1. **Nada de exhibicionismo espiritual.** "Guardaos de hacer vuestra justicia
   delante de los hombres, para ser vistos de ellos" (Mateo 6:1). Esto descarta
   de raíz el feed público de "logros".
2. **Sin métricas de vanidad.** Nada de seguidores, "me gusta", rachas públicas,
   ni rankings. La comparación roba el gozo y enorgullece (Gálatas 6:4).
3. **Privacidad primero.** Lo que alguien lee, siente o memoriza es suyo. Hoy ya
   es device-local (notas, sentimientos, historial). Una comunidad solo comparte
   lo que el usuario **decide** compartir, de forma explícita y revocable.
4. **Edificación mutua, no audiencia.** El fin es "estimularnos al amor y a las
   buenas obras" (Heb 10:24-25): oración, ánimo, rendición de cuentas — no
   construir una plataforma social.
5. **Protección de los vulnerables.** Moderación real, reporte y bloqueo, y
   cuidado especial con menores. Una app de la Biblia no puede ser un canal de
   abuso o acoso.
6. **Fidelidad doctrinal.** Cualquier contenido textual compartible se mantiene
   anclado en la Escritura; la app no se vuelve foro de debate teológico abierto.

---

## 3. Lo que NO haremos (límites deliberados)

| ❌ Descartado                         | Por qué                                           |
| ------------------------------------- | ------------------------------------------------- |
| Feed público global                   | Vanidad, comparación, moderación inviable         |
| Seguidores / "me gusta" / rankings    | Métricas de vanidad (Mt 6:1; Gá 6:4)              |
| Perfiles públicos descubribles        | Privacidad, riesgo para menores                   |
| Mensajería 1:1 abierta entre extraños | Vector de abuso/grooming                          |
| Comentarios públicos en versículos    | Debate doctrinal sin moderación, ruido            |
| Compartir highlights/notas al feed    | Lo privado debe seguir siendo privado por defecto |

---

## 4. Lo que SÍ podría hacerse — comunidad **acotada y privada**

El modelo viable es **grupos pequeños privados, por invitación**, cercano a
Hebreos 10:24-25 (congregarse, exhortarse) y a la rendición de cuentas sana:

- **Grupos por invitación** (código o enlace), no descubribles públicamente.
  Pensados para una familia, una clase, un grupo de oración, un discipulado.
- **Peticiones de oración** dentro del grupo: pedir y marcar "estoy orando por
  ti" (un gesto de cuidado, no un "like"). Sin contador público de "oraciones".
- **Ánimo "hoy leí / hoy medité"**: un compañero puede ver que el grupo está
  constante y enviar una palabra de ánimo — **rendición de cuentas, no exhibición**.
- **Plan compartido**: un líder propone un plan de lectura (los 14+ que ya
  existen) y el grupo lo recorre junto; cada quien ve el avance _agregado y
  opcional_ del grupo, nunca un ranking individual.
- **Un versículo de ánimo del día** que el líder/maestro puede enviar al grupo.

Todo esto se integra naturalmente con lo que la app ya tiene: planes de lectura,
oración ([`app/features/prayer`](../app/features/prayer)), constancia, y la nueva
**Mesa de preparación** (un líder podría compartir el bosquejo en markdown a su
clase — eso ya funciona hoy vía el export, **sin backend**).

---

## 5. El salto arquitectónico (offline → backend)

Hoy la app **no tiene cuentas ni servidor de datos de usuario**. Una comunidad
real exige, como mínimo:

1. **Autenticación** (Firebase Auth): correo/Apple/Google. Hoy no hay login.
2. **Base de datos en la nube** (Firestore): grupos, miembros, invitaciones,
   peticiones, mensajes de ánimo. Hoy todo es SQLite local + AsyncStorage.
3. **Reglas de seguridad** estrictas (Firestore Security Rules): que un usuario
   solo lea/escriba en los grupos a los que pertenece. Es el punto más delicado.
4. **Moderación**: reportar, bloquear, roles de líder, y un proceso para
   atender reportes (¿quién los revisa?).
5. **Privacidad y cumplimiento**: política de privacidad, consentimiento,
   exportación y **borrado** de datos (GDPR/CCPA), y consideraciones para menores
   (consentimiento parental).
6. **Costos e infra**: Firestore factura por lecturas/escrituras/almacenamiento;
   moderación es costo humano continuo.

> ⚠️ Esto convierte una app offline en un **servicio en línea con datos de
> personas**. Es responsabilidad seria — pastoral, legal y operativa — no una
> tanda más.

---

## 6. Modelo de datos propuesto (borrador Firestore)

```
users/{uid}
  displayName, photoUrl?, createdAt, locale
  (NUNCA: notas/highlights/sentimientos — esos siguen device-local)

groups/{groupId}
  name, createdBy(uid), createdAt, inviteCode, planId?, memberCount

groups/{groupId}/members/{uid}
  role: 'leader' | 'member', joinedAt, displayName

groups/{groupId}/prayers/{prayerId}
  authorUid, text, createdAt, prayingCount, status: 'open'|'answered'
  groups/{groupId}/prayers/{prayerId}/praying/{uid}  // "estoy orando"

groups/{groupId}/encouragements/{msgId}
  authorUid, text | verseRef, createdAt

reports/{reportId}
  reporterUid, groupId, targetType, targetId, reason, createdAt, status
```

Reglas clave: lectura/escritura en `groups/{id}/**` **solo** si
`exists(groups/{id}/members/{auth.uid})`; borrar grupo solo el `leader`;
los datos privados del estudio personal **no** entran a Firestore.

---

## 7. Moderación y seguridad

- **Reportar y bloquear** en cada pieza de contenido (petición, ánimo).
- **Roles de líder**: quien crea el grupo modera, puede remover miembros y
  borrar contenido.
- **Sin descubrimiento público**: unirse requiere código/enlace de un grupo
  existente; no hay buscador de personas ni de grupos.
- **Menores**: o se exige 13+/16+ con consentimiento, o se restringe la
  comunidad a cuentas verificadas de adultos. Decisión legal pendiente.
- **Cola de reportes**: necesita un responsable humano. Sin alguien que la
  atienda, **no se debe lanzar** la función.

---

## 8. Riesgos y mitigaciones

| Riesgo                              | Mitigación                                                                    |
| ----------------------------------- | ----------------------------------------------------------------------------- |
| Vanidad / comparación               | Sin métricas públicas; diseño de "cuidado" no "audiencia"                     |
| Abuso / acoso / grooming            | Solo grupos privados por invitación; reportar/bloquear; sin DM entre extraños |
| Carga de moderación                 | Roles de líder + cola de reportes + límites de tamaño de grupo                |
| Costos de Firestore                 | Paginación, límites, denormalización cuidadosa                                |
| Privacidad / legal                  | Política clara, consentimiento, export+borrado, revisión legal                |
| Distrae del propósito (la Palabra)  | Comunidad como **apoyo** a la lectura, nunca como centro                      |
| Complejidad ↑ en una app hoy simple | Hacerlo opcional y aislado; no tocar el núcleo offline                        |

---

## 9. Alternativa más simple (recomendada como primer paso)

**Compartir sin red social.** Mucho del valor pastoral se logra **sin backend**:

- La **Mesa de preparación** ya exporta el bosquejo en markdown → un maestro lo
  comparte con su clase por WhatsApp/correo **hoy**.
- Compartir un **plan de lectura** como enlace/imagen para que otros lo sigan en
  su propia app, cada quien con su progreso local.
- Un **versículo/devocional para enviar** (ya existe el compartir versículos).

Esto entrega "hagámoslo juntos" con **cero** riesgo de moderación, privacidad o
costo de servidor. Es el 20 % de esfuerzo que da el 80 % del bien pastoral.

---

## 10. Plan por fases (si se decide avanzar a backend)

- **Fase 0 — Compartir (sin backend).** Export de Mesa de preparación (✅ hecho
  en S103), compartir plan, compartir devocional. _Recomendado primero._
- **Fase 1 — Cuentas (Firebase Auth).** Login opcional; sin comunidad aún. Base
  para sincronizar (opcional) y para identidad.
- **Fase 2 — Grupos privados (MVP).** Crear/unirse por código; peticiones de
  oración con "estoy orando"; reportar/bloquear; rol de líder. Sin feed.
- **Fase 3 — Ánimo y plan compartido.** "Hoy leí" + plan de grupo con avance
  agregado. Revisión pastoral de cada superficie.
- **Fase 4 — Endurecer.** Moderación a escala, métricas de salud (privadas),
  cumplimiento legal, soporte.

Cada fase es una decisión de producto independiente; ninguna se lanza sin que
exista quién modere.

---

## 11. Esfuerzo estimado (orden de magnitud)

| Fase                        | Esfuerzo aprox.       |
| --------------------------- | --------------------- |
| Fase 0 (compartir)          | Pequeño (días)        |
| Fase 1 (auth)               | Mediano (1-2 semanas) |
| Fase 2 (grupos MVP)         | Grande (semanas)      |
| Fase 3 (ánimo + plan grupo) | Grande (semanas)      |
| Fase 4 (endurecer)          | Continuo              |

---

## 12. Recomendación

1. **Empezar por la Fase 0** (compartir sin backend). Entrega valor "juntos"
   alineado a Hebreos 10:24-25, sin abrir la responsabilidad de un servicio
   social. Parte ya existe (export de la Mesa de preparación).
2. **No construir la comunidad social todavía.** Solo avanzar a Fase 1+ si: (a)
   hay un compromiso claro de **moderación humana**, (b) se acepta el costo
   legal/operativo, y (c) el usuario confirma que el bien pastoral justifica
   complicar una app hoy simple y offline.
3. **Si se avanza, hacerlo acotado y privado** (grupos por invitación), **nunca**
   un feed público con métricas de vanidad.

> "Sobre todo, tened entre vosotros ferviente amor; porque el amor cubrirá
> multitud de pecados." — 1 Pedro 4:8

_Documento vivo: actualícese cuando se tome la siguiente decisión._
