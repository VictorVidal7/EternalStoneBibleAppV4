# C20b — Memoria: mazo, práctica, metas, insights (Modo C, sesión 139)

**Estado: 🐛 BUG (P2) — `R9-568` (los buscadores de libros no encuentran 17 libros escritos sin tilde: «exodo»,
«isaias»; el de «Agregar versículo» y el de la pestaña Biblia, medidos). El mazo, dos modos de práctica, la
calificación y los Insights en FREE y en PREMIUM: ✅ OK. De paso, «1 capítulos» en el selector (suma a `R9-524`).**
Sin agentes; el entorno de `C42b` (`emulator-5554`, APK debug vc73, Metro sobre `dd3568f`, español, RVR1960, cuenta
anónima). **FREE** hasta Insights; después, PREMIUM con el toggle de dev (`checked="true"`, `S139-aj6.xml.txt`;
no sobrevive a un frío). Evidencia: `_scratch/S139-sondas/` (`S139-mazo1.db.txt`: `@memory_deck` en RKStorage). Lo
que ya midió `C20a` (agregar, calificar, cortes, racha, quitar, metas, practicar sin calificar, Estadísticas en
premium) no se repitió.

## Lo medido

| Camino                                                                                   | Resultado                                                                                                                                                      |
| ---------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Mazo vacío → «Agregar versículo» → buscar libro → capítulo → 3 versículos                | ✅ «Agregar 3 versículos»; 3 tarjetas en caja 1, «Reto de la semana: domina 3» (`S139-mq-deck4.png`)                                                           |
| **Buscar libro: `exodo`, `levitico`** (sin tilde)                                        | 🐛 ninguno; `xodo` → Éxodo, `nesis` → Génesis, `juan` → los 4 (`S139-mq-*.xml.txt`; `R9-568`)                                                                  |
| **La pestaña Biblia: `exodo`, `isaias`**                                                 | 🐛 «No se encontraron resultados»; `xodo` → Éxodo (`S139-bib-*.xml.txt`; `R9-568`)                                                                             |
| La lista de libros del selector: 2 Juan, 3 Juan                                          | 🐛 «1 capítulos» (suma a `R9-524`)                                                                                                                             |
| Practicar → «Teclear» Juan 3:3 sin tildes, sin puntuación, con una mayúscula del teclado | ✅ «25 de 25 palabras correctas» (`S139-pr6.xml.txt`)                                                                                                          |
| «Llenar» Juan 3:5: `jesus` (sin tilde) en el hueco de «Jesús:», `mal` en otro            | ✅ «1 de 13 correctas»: el primero vale, el segundo y los vacíos no (`S139-pr10.xml.txt`)                                                                      |
| Calificar «Bueno» y «Otra vez»; leer el mazo                                             | ✅ 3:3 caja 2, vence mañana; 3:5 caja 1 (`S139-mazo1.db.txt`)                                                                                                  |
| Insights en FREE                                                                         | ✅ racha 1, «2/10 hoy», dominio, distribución, retención, calibración y «más difíciles» visibles; «Ver historial completo» y «Retención por libro» con candado |
| Tocar «Ver historial completo» en FREE → atrás                                           | ✅ abre la hoja de la ofrenda; atrás vuelve a Estadísticas (no se tocó ningún nivel)                                                                           |
| Insights en PREMIUM                                                                      | ✅ «Retención por libro»: Juan, 2 repasos; «Tendencia de retención» con su estado vacío                                                                        |

## Observaciones sin numerar

- **Para `C29` (Logros), no medido a fondo:** «Lee 500 versículos» (oro) salió tras abrir ~188 versículos
  distintos (Génesis 1 varias veces, Juan 1 y 3, Romanos 8, Salmos 23, Génesis 2); antes, «Lee 100» tras dos
  capítulos. Es la observación de la 138 (`C42a`): cada apertura parece contar de nuevo. Buscado en `BUGS.md`
  («500 versículos», «versesRead», «cada apertura»): no estaba.
- El teclado del emulador pone mayúsculas solo (una «El» en medio de la frase); la comparación las pliega.
- El plegado de `normalizeAnswer` (`src/lib/memory/recall.ts:66-72`) también acepta `n` por `ñ` («ano» por «año»):
  indulgente a propósito, con pruebas.

## Sin medir

- «Iniciales» y «Escribir» (el lienzo); las metas (las midió `C20a`); compartir el progreso y el reto de la
  semana; Insights con historia larga (el pronóstico de `R9-147`, el calendario); agregar desde Favoritos, el quiz,
  lectio, profecías.
- El suelo restaurado (cuenta de prueba, `C20a`).

## Receta

1. `link features/memory` → «Agregar versículo» (`641,1823` con el mazo vacío; `806,270` arriba) → buscador
   `676,863` → libro → capítulo → versículos → «Agregar N versículos» (`640,2700`); el logro, `641,2022`.
2. «Practicar N tarjetas» (`640,2210`) → modos en `y=782` (Revelar 181, Iniciales 411, Llenar 640, Escribir 870,
   Teclear 1099) → texto → atrás → desplazar → «Revisar» → calificar.
3. Insights: el ícono de barras (`1142,270`) o `link features/memory/insights`. Premium: Ajustes → Extras → el
   toggle de dev (frío = se apaga).
4. Pestaña Biblia: `link bible` → buscador `526,579`.
