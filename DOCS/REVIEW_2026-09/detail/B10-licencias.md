# B10 — Licencias de dependencias vs. app comercial de pago

> Modo B · Prioridad **P2** · Sesión 136 (2026-11-10, chat nuevo, en la terminal, SIN agentes, Opus 5.5) · Estado
> **🐛 BUG** (cerrada en la 136) · Base: `55a7412`. Raíz, `functions/`, `vercel/gift-code-redeem` y lo nativo del
> AAB de vc74.

> **Resultado:** el veredicto tiene dos mitades. **¿Puede salir en una app de pago? Sí:** nada de lo que se publica
> es copyleft (ni GPL, LGPL, AGPL ni SSPL; el MPL-2.0 que aparece es de herramientas de build), y los SDK cerrados
> (Google Play, Amazon) se pueden redistribuir dentro de una app. **¿Se cumplen sus condiciones? No:** `R9-554` (la
> app no trae ningún aviso de terceros: las licencias MIT, BSD, ISC y Apache de lo que entra al bundle (de las 1007
> dependencias de producción del lockfile) y de las 99 librerías nativas piden incluir su aviso, y las fuentes de íconos Entypo, CC BY-SA 4.0, y Font Awesome, OFL, piden
> atribución). De paso, `R9-555` (desde `B9`: el AAB lleva las 19 familias de íconos y la app usa 2; 2,4 MB). Los
> dos P3, ninguno P0.

## Cómo se midió

- **npm:** los tres lockfiles son v3 y traen `license` y `dev` por paquete (raíz 1867 de 1872; `functions/` 284 de
  285; `vercel/` 315 de 316). `_scratch/S136-B10-licencias.cjs.txt` cuenta producción (sin `dev: true`) y desarrollo
  y lista lo no permisivo con su ruta: `S136-B10-lic-_.out.txt`, `S136-B10-lic-functions.out.txt`,
  `S136-B10-lic-vercel-gift-code-redeem.out.txt`.
- **Nativo (npm no lo ve):** las 99 coordenadas Maven de `BUNDLE-METADATA/com.android.tools.build.libraries/dependencies.pb`
  del AAB de vc74, y el merge del release (`detail/B6`).
- **Fuentes:** las 38 del AAB, con el aviso de licencia de su tabla `name` (`S136-B10-fuentes.cjs.txt`, salida
  `S136-B10-fuentes.out.txt`); íconos: `S136-B10-iconos.out.txt`.

## Primera mitad: qué se publica y bajo qué licencia

- **Raíz, producción:** MIT 782 · Apache-2.0 71 · ISC 52 · BSD-3-Clause 33 · BlueOak-1.0.0 22 · BSD-2-Clause 12 ·
  MPL-2.0 12 · «MIT AND OFL-1.1» 8 · el resto, permisivas o duales con una permisiva (un «BSD-3-Clause OR GPL-2.0»).
  Lo que no es permisiva:
  - **MPL-2.0:** `lightningcss` y sus 11 binarios por plataforma: los usa la config de Metro para CSS al
    construir (llegan por `expo` → `@expo/metro-config`); un binario de Node no entra al bundle. No se publica.
  - **«MIT AND OFL-1.1»:** las 8 familias de `@expo-google-fonts` (el código, MIT; las fuentes, OFL). Se publican:
    ver la segunda mitad.
  - **Sin campo `license`:** `exit@0.1.2` (MIT, formato viejo `licenses`, de jest) y `simply-deferred@3.0.0` (MIT
    por su `LICENSE`, de `expensify-common`, que no entra al bundle: `detail/B8`).
- **Raíz, desarrollo:** todo permisivo salvo `url-template` («BSD»), `deep-freeze` («public domain») y tres sin
  campo (`fuzzy`, `limiter`, `valid-url`). No se publica.
- **`functions/`** (no desplegado): permisivas; `limiter@1.1.5` sin campo es MIT (formato viejo). **`vercel/`**
  (desplegado, en el servidor): producción permisiva (el mismo `limiter`); el MPL-2.0 de `edge-runtime` y el
  `@bytecodealliance/preview2-shim` son de `@vercel/node` (dev).
- **Nativo (99 librerías):** AndroidX, Kotlin, Square (OkHttp, Okio), Facebook (Hermes, Fresco, fbjni, SoLoader),
  gRPC, Guava, Protobuf, Glide y sus plugins, AndroidSVG, BlurView, ShortcutBadger, RevenueCat: Apache-2.0, MIT o
  BSD. Cerrados pero redistribuibles dentro de una app: Play services, Firebase, `billingclient`, `installreferrer`
  (términos de Google) y el IAP de Amazon (`com.amazon.device`, vía RevenueCat).
- **Ninguna LGPL**, que importaría: `LICENCE.txt` prohíbe la ingeniería inversa, y la LGPL exige permitirla para
  depurar la librería modificada.

## Segunda mitad: las condiciones

- **Las 18 fuentes de texto cumplen:** las de `@expo-google-fonts` llevan su copyright y el aviso OFL (Roboto Slab,
  Apache) en los metadatos, que el OFL 1.1 acepta («machine-readable metadata fields within text or binary files»).
  Material Symbols (de `expo-symbols`, vía `expo-router`) es Apache-2.0.
- **Lo demás, no** → `R9-554`.

## Hallazgos

- **`R9-554` (P3)** — La app no trae avisos de terceros en ningún lugar: no hay pantalla de licencias ni de
  créditos (la búsqueda completa, sin cortar, de «open source», «licencia», «third-party», «créditos», «atribución»,
  «attribution», «acerca de» en `app/` y `src/`, sin `bible-data-*`: 41 líneas, y lo único es la atribución de
  CONTENIDO, «openbible.info (CC BY)» y «STEPBible (CC BY)», `translations.ts:829`, `:855`, `:908`, `:7395`:
  `_scratch/S136-B10-avisos.out.txt`; la app ya atribuye su contenido, no su software), el bundle es bytecode de Hermes (sin los encabezados de licencia del JS) y el AAB solo trae algunos
  `META-INF/androidx/*/LICENSE.txt`. **Camino (a la licencia):** cada copia de la app de pago que se distribuye
  incumple condiciones que el licenciante pone para usar su código: MIT, ISC y BSD piden reproducir el copyright y
  la licencia en la distribución binaria; Apache-2.0, dar una copia de la licencia y los `NOTICE`; Entypo (CC BY-SA
  4.0) y Font Awesome (OFL 1.1), atribución (esas dos licencias son dato de conocimiento: el paquete instalado no las
  dice, su `LICENSE` es el MIT del código, y las dos fuentes no traen aviso en sus metadatos, medido). Las fuentes de íconos van en el AAB aunque
  no se usen (`R9-555`). Riesgo bajo de reclamo, arreglo barato. **Propuesta (sin escribir):** generar en el build la
  lista de licencias de lo que se publica (las dependencias JS de producción y las librerías Maven) y mostrarla en
  Ajustes → Acerca de; o quitar lo que no se usa antes (`R9-553`, `R9-555`) para achicarla.
- **`R9-555` (P3, de paso desde `B9`)** — El AAB de vc74 lleva las 19 fuentes de `@expo/vector-icons` (4 076 840 B
  sin comprimir) y la app usa dos familias: `Ionicons` (1300 menciones) y `MaterialCommunityIcons` (11). Las otras 17
  pesan 2 379 456 B. **Causa:** 159 archivos importan desde la raíz (`from '@expo/vector-icons'`), que re-exporta las
  19 (`node_modules/@expo/vector-icons/build/Icons.js`), y Metro empaqueta todo lo que se requiere: en el bundle de
  Hermes están `Entypo`, `FontAwesome6` y `Zocial` (`_scratch/S136-B9-bundle.out.txt`), y `expo-router` solo nombra
  `@expo/vector-icons` en un comentario, así que nadie más pide las 17. **Camino:** el
  instalado y la descarga cargan 2,4 MB de fuentes que nunca se dibujan, y entre ellas dos que piden atribución
  (`R9-554`). **Propuesta (sin escribir):** importar `@expo/vector-icons/Ionicons` y
  `@expo/vector-icons/MaterialCommunityIcons` (existen) y medir el AAB.

## Fuera de alcance

- Las licencias de los textos bíblicos y del contenido (RVR1960, NKJV, diccionarios): no son dependencias; las
  llevan sus memorias y `reference_essb-theology-content-sourcing`.
- `LICENCE.txt` (licencia propietaria, «Copyright (c) 2024») en un repo público: no es de dependencias.

## Sin medir

- Si Play o el IAP de Amazon piden un aviso propio en la app (sus términos no se leyeron aquí).
- Las licencias de las 99 librerías Maven son de conocimiento, no leídas de cada POM.
