# Revisión adversarial — ELECCIÓN, Sección 3 "La tradición reformada (calvinista)"

- Objetivo: solo el cuerpo (bodyEs) de la Sección 3 del borrador integrado.
- Fuente revisada: `DOCS/drafts/eleccion-integrated-draft.md` @ branch `content/dictionary-eleccion-multiview` (commit da393ad), leído con `git show` (el worktree de este agente se ramificó de main @ 8644a6c, que no contiene el borrador).
- Contexto leído: Secciones 1, 2 y 4 del mismo archivo; `DOCS/drafts/eleccion-orchestrator.md`.
- Fuentes primarias confesionales: crcna.org/welcome/beliefs/confessions/canons-dort (Cánones de Dort, texto por artículo); opc.org/wcf.html (Westminster).
- Verificación bíblica: `assets/bible-seed.db`, tabla `verses`, `version='RVR1960'`, vía `node:sqlite`.

---

## VEREDICTO GLOBAL

**La sección es confesionalmente sólida y está lista para sign-off tras una corrección menor.**
La capa que la tarea señaló como más débil —los números de artículo de Dort/Westminster, sacados de resúmenes de terceros— resultó **enteramente correcta**: los 10 grupos de citas confesionales verifican contra fuente primaria sin un solo desajuste. Las 33 referencias bíblicas resuelven; los 13 fragmentos entrecomillados son RVR1960 verbatim. La reprobación está tratada con el cuidado asimétrico propio de Dort (no determinismo duro, no doble predestinación simétrica). Redención particular y llamamiento eficaz usan los términos propios de la tradición, con las etiquetas populares marcadas como tales y en cursiva (no entrecomilladas). Longitud y tono equilibrados con la Sección 2.

**Conteo de hallazgos:** 0 BLOCKER · 1 SHOULD-FIX · 2 NICE-TO-HAVE.

---

## HALLAZGOS

### [SHOULD-FIX] 1 — Caracterización velada de la postura contraria ("un gesto genérico")

**Ubicación:** Segundo punto, último párrafo.

**Frase exacta:**

> Para esta tradición, la cruz no fue un gesto genérico, sino el precio pagado, con nombre y rostro, por cada uno de los suyos.

**Problema:** El adjetivo "genérico" describe —y desvaloriza— la posición de redención universal, que es exactamente lo que la Sección 2 confiesa en su segundo artículo ("murió por todos los hombres y por cada hombre"). Aunque la frase no nombra el arminianismo y va precedida de "Para esta tradición", el contraste peyorativo ("gesto genérico" vs. "con nombre y rostro") hace trabajo retórico contra la otra vista. Esto choca con:

- La decisión de diseño explícita: la Sección 3 no debe caracterizar, contrastar ni rebatir la vista arminiana; todo contraste es tarea del orquestador (Secciones 1 y 4).
- La Sección 2, que es escrupulosamente limpia: no contiene ni una sola pulla recíproca contra la vista reformada.
- La propia Sección 4, que instruye al lector: _"Ninguna de las dos posturas enseña que la persona se salve a sí misma, y presentar así a la otra es describirla mal."_ "Un gesto genérico" es la entrada haciendo una versión suave de justamente eso. Es incoherencia interna, no solo violación de la regla.

**Fix mínimo propuesto (sustractivo):** eliminar la cláusula negativa. La frase queda en pie:

> Para esta tradición, la cruz fue el precio pagado, con nombre y rostro, por cada uno de los suyos.

---

### [NICE-TO-HAVE] 2 — Rango de cita sobredimensionado en Ez 36

**Ubicación:** Tercer y cuarto punto, segundo párrafo.

**Frase exacta:**

> cumpliendo la promesa "Os daré corazón nuevo... y quitaré de vuestra carne el corazón de piedra" (Ez 36:26-27)

**Problema:** Ambos fragmentos entrecomillados son verbatim de RVR1960 **Ez 36:26** (la elipsis "..." reemplaza legítimamente ", y pondré espíritu nuevo dentro de vosotros;"). El texto citado no toma nada de Ez 36:27. El rango `26-27` es defendible porque v27 ("pondré dentro de vosotros mi Espíritu... y haré que andéis en mis estatutos") respalda el punto contiguo sobre la renovación de la voluntad, pero un lector que coteje verá que la comilla es solo de v26.

**Fix mínimo propuesto:** cambiar `(Ez 36:26-27)` por `(Ez 36:26)`; o, si se quiere conservar v27, dejar el rango y aceptar el desfase (bajo impacto).

---

### [NICE-TO-HAVE] 3 — Colocación de la cita `(Dort III/IV.1,3)` sobre una glosa que Dort no hace

**Ubicación:** Tercer y cuarto punto, primer párrafo, frase final.

**Frase exacta:**

> Cuando esta tradición llama a esto "depravación total" no afirma que cada persona sea tan mala como podría ser, sino que el pecado alcanza y daña todas las facultades —mente, voluntad y afectos—: una corrupción que lo abarca todo, no una maldad llevada al extremo (Dort III/IV.1,3).

**Problema:** La cita cierra toda la frase, incluida la aclaración "no afirma que cada persona sea tan mala como podría ser" / "no una maldad llevada al extremo". Esa matización es la glosa estándar reformada del término popular "depravación total", pero **no está en los artículos citados**. Lo que Dort III/IV.1 (todas las facultades eran santas) y III/IV.3 (todas quedaron corrompidas) sí sostienen es la corrupción de todas las facultades. La frase ya está enmarcada como uso de la tradición ("Cuando esta tradición llama a esto..."), así que no es sobrealcance grave, solo una cita que abarca de más.

**Fix mínimo propuesto:** mover `(Dort III/IV.1,3)` para que se ancle a la cláusula "el pecado alcanza y daña todas las facultades —mente, voluntad y afectos—" y dejar la aclaración sobre "depravación total" sin cita, como nota de uso de la tradición. Ej.: "...sino que el pecado alcanza y daña todas las facultades —mente, voluntad y afectos— (Dort III/IV.1,3): una corrupción que lo abarca todo, no una maldad llevada al extremo."

---

## VERIFICADO LIMPIO (detalle)

### 1. Citas confesionales — TODAS correctas contra fuente primaria

| Cita en el borrador | Uso en el texto                                                                                                                                                                                      | Verificación (Cánones de Dort, CRCNA / WCF, OPC)                                                                                                                                                                                                                                                                                                                          |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Dort I.1            | Dios sería justo si dejara a todos en la ruina                                                                                                                                                       | ✅ I.1: "God would have done no one an injustice if it had been his will to leave the entire human race in sin and under the curse".                                                                                                                                                                                                                                      |
| Dort I.6-7          | Definición de elección: propósito eterno e inmutable, antes de la fundación del mundo, por sola gracia, según el beneplácito de su voluntad, número determinado de personas en Cristo para salvación | ✅ I.7: "Election is God's unchangeable purpose by which... Before the foundation of the world, by sheer grace, according to the free good pleasure of his will, he chose in Christ to salvation a definite number of particular people". I.6 aporta "eternal decree". Rango correcto.                                                                                    |
| Dort I.9            | La fe y la santidad son fruto, no causa, de la elección                                                                                                                                              | ✅ I.9: "not on the basis of foreseen faith... or of any other good quality"; elección "for the purpose of faith... holiness".                                                                                                                                                                                                                                            |
| Westminster 3.5     | Elección sin previsión de fe ni de nada en la criatura como causa                                                                                                                                    | ✅ WCF 3.5: "without any foresight of faith, or good works... or any other thing in the creature, as conditions, or causes moving him thereunto".                                                                                                                                                                                                                         |
| Dort I.15           | Decretó pasar por alto a algunos y dejarlos en la miseria en que se hundieron por su culpa, sin darles la fe salvadora                                                                               | ✅ I.15: "to leave them in the common misery into which, by their own fault, they have plunged themselves; not to grant them saving faith and the grace of conversion". "others are passed by in the eternal decree".                                                                                                                                                     |
| Westminster 3.7     | "pasar por alto"                                                                                                                                                                                     | ✅ WCF 3.7: "to pass by; and to ordain them to dishonor and wrath for their sin".                                                                                                                                                                                                                                                                                         |
| Dort I.15           | Niega expresamente que Dios sea autor del pecado                                                                                                                                                     | ✅ I.15: "the decree of reprobation, which does not at all make God the author of sin (a blasphemous thought!) but rather its... just judge and avenger".                                                                                                                                                                                                                 |
| Dort I.16           | Palabra pastoral: fe débil que anhela volverse a Dios no debe temer la reprobación                                                                                                                   | ✅ I.16: los que aún no experimentan fe viva pero "desire to turn to God"... "ought not to be alarmed at the mention of reprobation".                                                                                                                                                                                                                                     |
| Dort II.3           | Suficiencia infinita: sacrificio único y perfecto, más que suficiente para el mundo entero                                                                                                           | ✅ II.3: "of infinite value and worth, more than sufficient to atone for the sins of the whole world".                                                                                                                                                                                                                                                                    |
| Dort II.5           | El evangelio debe ofrecerse sin distinción ni discriminación a todas las naciones                                                                                                                    | ✅ II.5: "announced and declared without differentiation or discrimination to all nations and people".                                                                                                                                                                                                                                                                    |
| Dort II.8           | Por el consejo eterno del Padre, la muerte redime infaliblemente a los escogidos y compra para ellos la fe misma, el Espíritu y todos los dones                                                      | ✅ II.8: "the... saving effectiveness of his Son's costly death should work itself out in all the elect"; "grant them faith (which, along with all the other saving gifts of the Holy Spirit, he acquired for them by his death)".                                                                                                                                        |
| Dort III/IV.1       | Dios creó al ser humano bueno, a su imagen; por su propia voluntad se apartó                                                                                                                         | ✅ III/IV.1: creado santo en mente, voluntad y afectos; se apartó "by his own free will".                                                                                                                                                                                                                                                                                 |
| Dort III/IV.3       | Concebidos en pecado, hijos de ira, muertos, incapaces de todo bien salvador; sin la gracia regeneradora no quieren ni pueden volverse a Dios                                                        | ✅ III/IV.3: "conceived in sin... born children of wrath, unfit for any saving good... dead in their sins"; "without the grace of the regenerating Holy Spirit they are neither willing nor able to return to God".                                                                                                                                                       |
| Dort III/IV.1,3     | Corrupción de todas las facultades (corrección de un anterior III/IV.4)                                                                                                                              | ✅ El cambio es correcto: la corrupción de todas las facultades sale de Art. 1 (todas eran santas) + Art. 3 (todas corruptas), no de Art. 4 (luz natural).                                                                                                                                                                                                                |
| Dort III/IV.11-12   | Regeneración: ilumina la mente, abre y ablanda el corazón, infunde vida en la voluntad; comparada con creación y resurrección; no es mera persuasión moral; no puede quedar frustrada                | ✅ III/IV.11: "opens the closed heart, softens the hard heart... infuses new qualities into the will, making the dead will alive". III/IV.12: "does not happen only by outward teaching, by moral persuasion"; "not less than or inferior in power to that of creation or of raising the dead"; "certainly, unfailingly, and effectively reborn".                         |
| Dort III/IV.14      | La fe es don de Dios, infundida, no solo puesta a su alcance                                                                                                                                         | ✅ III/IV.14: "not in the sense that it is offered by God for people to choose, but that it is in actual fact bestowed, breathed and infused".                                                                                                                                                                                                                            |
| Dort III/IV.16      | Eficaz no es forzada: no trata a nadie como un tronco o una piedra; sana e inclina con dulzura y con poder; quien rehusaba viene libremente                                                          | ✅ III/IV.16: "does not act in people as if they were blocks and stones; nor does it... coerce a reluctant will by force, but spiritually revives, heals, reforms, and—in a manner at once pleasing and powerful—bends it back".                                                                                                                                          |
| Westminster 10.1    | Llamamiento eficaz; renueva la voluntad; vienen libremente                                                                                                                                           | ✅ WCF 10.1: "renewing their wills... effectually drawing them to Jesus Christ: yet so, as they come most freely, being made willing by his grace".                                                                                                                                                                                                                       |
| Dort V.1,3,6        | Los creyentes verdaderos siguen débiles y a veces caen en pecados graves; Dios no retira del todo su Espíritu ni les permite perder la adopción ni caer en perdición definitiva                      | ✅ V.1 (libres del dominio del pecado, no de la carne en esta vida); V.3 (no podrían mantenerse por sí solos, pero Dios los preserva hasta el fin); V.6 ("does not take the Holy Spirit from his own completely, even when they fall grievously... Neither does God let them fall... forfeit the grace of adoption and the state of justification... into eternal ruin"). |
| Dort V.8            | Descansa en la libre misericordia de Dios, la inmutabilidad de su propósito, el mérito e intercesión permanente de Cristo, el sello del Espíritu                                                     | ✅ V.8: "by God's undeserved mercy"; "God's plan cannot be changed... the merit of Christ as well as his interceding and preserving cannot be nullified; and the sealing of the Holy Spirit can neither be invalidated nor wiped out". Los cuatro fundamentos coinciden.                                                                                                  |
| Dort V.10           | Seguridad no de revelación especial, sino de las promesas de Dios, el testimonio del Espíritu y el anhelo de una buena conciencia y buenas obras                                                     | ✅ V.10: "not... from some private revelation... but from faith in the promises of God... from the testimony of the Holy Spirit... and finally from a serious and holy pursuit of a clear conscience and of good works".                                                                                                                                                  |
| Dort V.12-14        | Produce humildad, gratitud y piedad; no vuelve descuidado; mueve a usar los medios (Palabra, oración, sacramentos)                                                                                   | ✅ V.12 (raíz de humildad, piedad, oraciones fervientes); V.13 (mayor cuidado de andar en los caminos del Señor, no descuido); V.14 (Dios preserva la obra "by the hearing and reading of the gospel... and also by the use of the sacraments"). Rango correcto; "la oración" se apoya en V.12.                                                                           |

Nota de método: la extracción de Dort I–IV y Westminster se hizo con prompts neutros contra fuente primaria. La extracción de Dort V usó un prompt que enumeraba el contenido esperado; se contrastó igualmente artículo por artículo y coincide, pero esa capa no es "independiente" en sentido estricto.

### 2. Reprobación (check 2) — bien manejada

La Sección 3 cumple los tres requisitos:

- **Asimetría explícita:** "a los suyos Dios los escoge y los lleva activamente a la vida; a los demás los deja en su propio pecado" — corresponde a Dort I.6/I.15 (ablanda a los elegidos; deja a los demás en su dureza / en la miseria en que se hundieron por su culpa). No hay "doble predestinación" simétrica cruda.
- **Niega que Dios sea autor del pecado:** explícito, citado a Dort I.15 (correcto — I.15 lo dice literalmente).
- **Nota pastoral:** "quien tiene una fe débil pero anhela de veras volverse a Dios no debe temer ser reprobado" (Dort I.16, correcto).
- **Sin determinismo duro:** el lenguaje es consistentemente pasivo para los no elegidos ("pasar por alto", "dejarlos", "los deja en su propio pecado", "en que ellos mismos se hundieron por su culpa"). De hecho la sección es _más_ contenida que Dort I.15, que continúa hasta "condenar y castigar eternamente" — omisión que va del lado seguro.

### 3. Redención particular / llamamiento eficaz (check 3) — correcto

- Términos propios primero: "redención particular o definida", "llamamiento eficaz o gracia eficaz".
- Etiquetas populares marcadas y en _cursiva_, nunca entrecomilladas: "(conocida popularmente como _expiación limitada_)", "(conocida popularmente como _gracia irresistible_)". Es exacto: la teología reformada suele preferir "redención definida" / "gracia eficaz".
- La expiación limitada se presenta **precedida** de la afirmación de suficiencia infinita de Dort II.3 ("más que suficiente para expiar los pecados del mundo entero") y del ofrecimiento libre a todas las naciones (II.5) y de Jn 6:37 ("nadie que venga a Cristo será jamás rechazado"). No se presenta como "Cristo murió por pocos".
- "Irresistible" correctamente matizada con Dort III/IV.16: "eficaz no significa forzada... no violenta la voluntad ni trata a nadie como un tronco o una piedra, sino que la sana y la inclina con dulzura y con poder". La frase "un tronco o una piedra" es lenguaje de Dort III/IV.16 ("blocks and stones") y va **sin comillas** (paráfrasis), lo cual es correcto.

### 4. Referencias bíblicas (check 4) — 33/33 resuelven; 13/13 comillas verbatim RVR1960

Fragmentos entrecomillados verificados verbatim contra `bible-seed.db` (RVR1960):

| Ref         | Fragmento entrecomillado                                                   | Verbatim                                                     |
| ----------- | -------------------------------------------------------------------------- | ------------------------------------------------------------ |
| Ro 9:11     | "no por las obras sino por el que llama"                                   | ✅                                                           |
| Jn 15:16    | "No me elegisteis vosotros a mí, sino que yo os elegí a vosotros"          | ✅                                                           |
| Ro 9:20     | "¿quién eres tú, para que alterques con Dios?"                             | ✅                                                           |
| Ro 11:33    | "¡Oh profundidad de las riquezas de la sabiduría y de la ciencia de Dios!" | ✅                                                           |
| Jn 10:11,15 | "por las ovejas"                                                           | ✅ (en ambos vs.)                                            |
| Ef 5:25     | "amó a la iglesia, y se entregó a sí mismo por ella"                       | ✅                                                           |
| Hch 20:28   | "la iglesia del Señor, la cual él ganó por su propia sangre"               | ✅                                                           |
| Ef 2:3      | "hijos de ira"                                                             | ✅                                                           |
| Jn 6:44     | "Ninguno puede venir a mí, si el Padre que me envió no le trajere"         | ✅                                                           |
| Ez 36:26    | "Os daré corazón nuevo... y quitaré de vuestra carne el corazón de piedra" | ✅ (elipsis legítima; ver hallazgo 2 sobre el rango de cita) |
| Hch 16:14   | "el Señor abrió el corazón"                                                | ✅                                                           |
| Hch 13:48   | "creyeron todos los que estaban ordenados para vida eterna"                | ✅                                                           |
| Jn 10:28    | "no perecerán jamás, ni nadie las arrebatará de mi mano"                   | ✅                                                           |

Referencias no entrecomilladas (paráfrasis / alusión) que resuelven: Ro 9:16; Ef 1:4-5; Ef 1:11; 2 Ts 2:13; Ro 8:29-30; Jn 6:37; Jn 6:39; Ef 2:1-3; Ro 3:10-11; 1 Co 2:14; Jn 6:65; Ez 36:27; Ef 2:4-5; Ef 2:8; Fil 1:29; Sal 110:3; Ro 8:38-39; 1 P 1:5; Fil 1:6; 1 Co 1:8-9; 2 Ti 2:19. Todas existen en RVR1960.

Observación (sin acción): "El hombre natural no percibe las cosas del Espíritu de Dios" (1 Co 2:14) y "somos guardados por el poder de Dios mediante la fe" (1 P 1:5) están casi verbatim pero **sin comillas** — es la dirección segura y es coherente con el ajuste ya aplicado a 2 P 1:10 en la Sección 4. Sin problema.

### 5. Disciplina de comillas (check 5) — limpia

No hay comillas sobre texto no-RVR1960 en ningún punto. La única comilla técnica es el scare-quote permitido "depravación total". Todo lo confesional (Dort, Westminster, Calvino) va parafraseado y sin comillas. Cumple la decisión de diseño.

### 6. Cross-caracterización (check 6)

Un solo caso: "un gesto genérico" (ver hallazgo SHOULD-FIX 1). Fuera de eso, la sección no describe ni rebate la vista arminiana.

Casos considerados y **descartados** como hallazgo:

- "No se funda en una fe o una santidad que Dios previera en la criatura" — niega la elección por fe prevista, que es el mecanismo de la Sección 2, pero es la definición misma de elección incondicional y está literalmente en Dort I.9 / WCF 3.5. No se puede exponer la vista reformada sin decirlo; no nombra ni caricaturiza a la otra parte.
- "Pablo lo afirma de Jacob y Esaú" (Ro 9:11) — enmarcado a nivel de sección ("La tradición reformada... confiesa") y simétrico con el "Jesús lo dice sin rodeos" de la Sección 2. La cláusula citada ("conforme a la elección... no por las obras sino por el que llama") es texto del versículo; el borrador no fuerza aquí el alcance (individual vs. corporativo). Aceptable dentro de una sección "esto es lo que sostiene la tradición".

### 7. Longitud / equilibrio (check 7)

- Sección 3: 7.681 caracteres / 1.371 palabras. Sección 2: 7.427 caracteres / 1.303 palabras. Diferencia +3,4 % / +5,2 %: equilibrada.
- Estructura paralela: 5 puntos numerados en el orden del documento propio; proof-texts entretejidos; cierre pastoral cálido; remate "toda la alabanza/gloria pertenece a Dios" en ambas.
- Tono: equivalente. La Sección 3 es algo más lírica en el segundo punto ("con nombre y rostro", "de la elección eterna a la gloria final"); la Sección 2 es algo más densa en advertencias en el quinto artículo. Ninguna es injusta con su propia tradición ni con la otra. La única asimetría real es que la Sección 3 tiene la frase contrastiva del hallazgo 1 y la Sección 2 tiene cero.

### 8. Sobrealcance teológico (check 8)

Sin sobrealcance sustantivo. La sección usa recurrentemente "La Escritura enseña / Jesús lo dice / Pablo lo afirma / La Escritura lo muestra" para introducir sus proof-texts, pero: (a) está enmarcado a nivel de sección y de entrada (gloss y Sección 1: "presenta cada postura en sus propios términos, sin arbitrar"); (b) la Sección 2 hace exactamente lo mismo con simetría; (c) la tarea reconoce que esto es inherente a una sección "esto es lo que sostiene la tradición". El único punto donde una cita confesional cubre de más una glosa está tratado como NICE-TO-HAVE 3 (no es "la Biblia dice", es un artículo de Dort abarcando de más).

### Consistencia con Secciones 1 y 4 — sin conflicto

- "Sínodo de Dort (1618-1619)" (Secc. 1) vs. "Cánones de Dort (1619)" (Secc. 3): consistente (el sínodo sesionó dos años; los cánones se adoptaron en 1619).
- Atribución de la _Institución_ de Calvino al libro III (Secc. 3) coherente con la mención de la _Institución_ en Secc. 1.
- El párrafo de Dort II.5 en la Sección 3 (evangelio ofrecido "sin distinción ni discriminación", "nadie que venga a Cristo será jamás rechazado") es lo que hace honesta —y no un maquillaje— la afirmación de terreno común de la Sección 4 ("El evangelio se ofrece de veras a todos").
- La Sección 3 no toca la vista arminiana; todo el contraste queda, como debe, en las Secciones 1 y 4.
- "los sacramentos" (Dort V.14) se conserva deliberadamente por decisión de diseño — no se marca.

---

## RECOMENDACIÓN

Aplicar el fix sustractivo del hallazgo SHOULD-FIX 1 (eliminar "no fue un gesto genérico, sino"). Los dos NICE-TO-HAVE son opcionales y de bajo impacto. Con eso, la Sección 3 está lista para el sign-off de Victor.
