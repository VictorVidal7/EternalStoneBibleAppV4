# A4-chico: sense-specific Spanish glosses for 27 polysemous Hebrew lemmas

**STATUS: DRAFT for Victor's review. Nothing here is wired into the app.**
`assets/hebrew-gloss-es-v1.json` was NOT touched, `HEBREW_GLOSS_ES_VERSION` was NOT
bumped, nothing was merged. This file only proposes what a future `hebrew_gloss_es`
per-occurrence row (`book_id, chapter, verse, position, glossEs`) could say for the
listed verse, for a specific dStrong sense. Positions are NOT included — I don't have
the tagged TAHOT source locally (see "Method & limits" below), so exact word-position
numbers still need to be pulled from the originals pack before any row could actually
be inserted.

## Method & limits (read this before the tables)

- **ES glosses**: short (1–3 words), matching A3's terse register. Checked against
  `scripts/strongs-defs-es.json` (full Strong's definition, for sense) and against
  `assets/hebrew-lemma-gloss-es.json` (A3's ~8,503 base-lemma glosses, for vocabulary
  reuse + collision detection).
- **A3 cross-check**: for every lemma I looked up A3's current shipped gloss and note
  whether it reflects the numerically-dominant sense. Several don't — see "A3 mismatches"
  below.
- **Collision check**: I grepped every proposed ES word against all 8,503 A3 base
  glosses (exact string match on each `/`-separated term) and against the other 77
  proposed glosses in this batch. Real collisions are flagged inline. Many common
  concepts (enemy, destroy, praise, kill…) already have 2–6 existing Hebrew synonyms
  sharing the obvious Spanish word in A3 — that's expected Hebrew synonymy, not an
  error, and I've said so explicitly rather than forcing artificial distinctions.
- **Citations**: verified against `assets/bible-seed.db` (`version='RVR1960'`) directly
  — every reference below is a real, correctly-quoted RVR1960 verse. Per the brief, the
  citation doesn't have to _prove_ the Spanish gloss by itself, just be legible support.
  Where RVR1960's own printed word at that verse differs from my proposed gloss, I say
  so explicitly (marked "print:"). That's common and not itself an error — RVR1960 is a
  free translation, not a gloss table — but it's the kind of thing Victor should see
  before signing off.
- **What I could NOT verify**: I do not have the STEPBible TAHOT tagged Hebrew text
  locally (checked — not in this repo; it's fetched from a separate GitHub Pages pack
  at runtime), so I cannot confirm which exact dStrong tag sits at which exact word
  position. All citations were chosen from lexical/contextual knowledge of these words
  and then verified as _real, legible_ RVR1960 verses — not verified against the
  tagged source. Five rows below are flagged **[UNCERTAIN ROOT]** or **[NO CITATION]**
  where I could not find a confident match this way; those need a tagged-text check
  (or Victor's own read) before they're used for anything beyond discussion.

---

## H5608 — safar (A3 base gloss: **"recontar / relatar"**)

| dStrong | EN gloss (n)     | ES gloss       | Citation                                                         | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ---------------- | -------------- | ---------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H5608A  | to recount (107) | **recontar**   | Salmos 19:1 — "Los cielos **cuentan** la gloria de Dios"         | Matches A3, dominant sense.                                                                                                                                                                                                                                                                                                                                                                                                                              |
| H5608B  | secretary (52)   | **secretario** | 1 Reyes 4:3 — "Elihoref y Ahías, hijos de Sisa, **secretarios**" | Exact print match. Deliberately NOT "escriba" — H5613 (the noun _sofer_) already owns "escriba" in A3; "secretario" keeps the royal-court-official sense distinct. Note: RVR1960 renders this SAME lemma "escriba" at 2 Samuel 8:17 ("Seraías era escriba") — RVR1960 itself isn't consistent between "escriba" and "secretario" for this word, so either gloss is textually defensible; I picked "secretario" for the collision-avoidance reason above. |

A3 check: dominant sense (recontar, 107) matches A3's first term. Consistent.

---

## H2691 — chatser (A3 base gloss: **"patio"**)

| dStrong | EN gloss (n) | ES gloss  | Citation                                                   | Notes                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------ | --------- | ---------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2691A  | court (145)  | **atrio** | Éxodo 27:9 — "harás asimismo el **atrio** del tabernáculo" | **A3 mismatch-adjacent**: A3's base gloss is "patio"; RVR1960's own consistent word for the tabernacle/temple-court sense of this exact lemma is "atrio", not "patio". Both are accurate synonyms of "court", but "atrio" is the register RVR1960 readers will actually recognize from Exodus/Levítico. Flagging for Victor to decide whether to keep A3's "patio" as the lemma default or align it. |
| H2691B  | village (46) | **aldea** | Josué 15:45 — "Ecrón con sus villas y sus **aldeas**"      | Collision: "aldea" is already the A3 gloss for TWO other base lemmas (H2333, H3723). This is a real triple-overlap, but it reflects genuine Hebrew synonymy (Hebrew has several near-synonyms for "unwalled village/hamlet"); RVR1960 itself doesn't disambiguate them either. Flagging rather than forcing an artificial third word.                                                                |

A3 check: dominant sense (court, 145) is what A3 means by "patio" — consistent in concept, though see the atrio/patio register note above.

---

## H3384 — yara (A3 base gloss: **"enseñar / arrojar"**)

| dStrong | EN gloss (n)  | ES gloss     | Citation                                                                                | Notes                                                                                                                                                                                                                                                                                  |
| ------- | ------------- | ------------ | --------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H3384B  | to show (47)  | **enseñar**  | Éxodo 15:25 — "Jehová le **mostró** un árbol"                                           | Matches A3's first term, dominant sense. (Print here is "mostró", a direct synonym of "enseñar" — same verb family.)                                                                                                                                                                   |
| H3384A  | to shoot (33) | **disparar** | 1 Samuel 20:36 — "Corre y busca las saetas que yo **tirare**... él **tiraba** la saeta" | A3 already lists "arrojar" for this sense; I'm proposing "disparar" as a more precise refinement (specifically archery, matching the "shoot an arrow" sense) rather than the more generic "throw". Not a hard error either way — flagging as a suggested refinement, not a correction. |

A3 check: A3's compound gloss already covers both senses fairly (enseñar listed first, matching the dominant 47-vs-33 split). Consistent.

---

## H5971 — am (A3 base gloss: **"pueblo"**)

| dStrong | EN gloss (n)          | ES gloss      | Citation                                                                                                                         | Notes                                                                                                                                                                                                                                             |
| ------- | --------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H5971A  | people (1757)         | **pueblo**    | Éxodo 3:7 — "he visto la aflicción de mi **pueblo**"                                                                             | Matches A3 exactly, overwhelmingly dominant sense.                                                                                                                                                                                                |
| H5971K  | people: soldiers (77) | **soldados**  | 2 Samuel 18:1–2 — "David... pasó revista al **pueblo**... envió David al **pueblo**, una tercera parte bajo el mando de Joab..." | RVR1960 prints the generic "pueblo" here too (Spanish doesn't lexicalize this military-muster sub-sense separately) — the "soldiers" reading comes from context (mustering troops for battle), not a distinct printed word. Free of collision.    |
| H5971B  | kinsman (31)          | **pariente**  | Génesis 25:8 — "murió Abraham... y **fue unido a su pueblo**"                                                                    | Classic Hebrew death-idiom ("gathered to his people/kin"). Free of collision.                                                                                                                                                                     |
| H5971L  | people: creatures (1) | **criaturas** | Proverbios 30:25 — "Las hormigas, **pueblo** no fuerte"                                                                          | The single OT occurrence — ants called "am" (a people/nation) in the "four small but wise creatures" proverb. Free of collision. Nice, low-stakes citation: printed word is still "pueblo", the "creature" reading is purely from context (ants). |

A3 check: dominant sense (people, 1757) matches A3 exactly. Consistent — this lemma is the cleanest of the batch.

---

## H6862 — tsar (A3 base gloss: **"estrecho"**)

**A3 MISMATCH — flag prominently.** Total occurrences across the 4 senses = 109;
"enemy" (69) is the numerically dominant sense, but A3's single shipped gloss
"estrecho" reflects the minority "narrow" sense (only 8 occurrences). Victor should
know the current base-lemma default leans literal/etymological rather than
frequency-representative here.

| dStrong | EN gloss (n)  | ES gloss        | Citation                                                                           | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------- | --------------- | ---------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H6862C  | enemy (69)    | **adversario**  | Salmos 27:12 — "No me entregues a la voluntad de mis **enemigos**"                 | Print: "enemigos". I chose "adversario" instead of "enemigo" specifically because "enemigo" is already the A3 gloss for FIVE other lemmas (H341, H6145, H6146, H7790, H8324) — picking a synonym here reduces interlinear crowding. If Victor prefers matching the print exactly, "enemigo" is equally valid; flagging the choice either way.                                                                                                                        |
| H6862B  | distress (31) | **tribulación** | Isaías 25:4 — "fortaleza al menesteroso en su **aflicción**"                       | Print: "aflicción" (which is already A3's gloss for 4 other lemmas — another reason I avoided it here). "Tribulación" is collision-free.                                                                                                                                                                                                                                                                                                                             |
| H6862A  | narrow (8)    | **estrecho**    | Números 22:26 — "se puso en una **angostura**"                                     | Matches A3's own base gloss exactly — this IS the sense A3 currently shows. Print is "angostura" (same concept, noun form) rather than "estrecho" itself, but clearly the same idea.                                                                                                                                                                                                                                                                                 |
| H6862D  | hard (1)      | **aprieto**     | 1 Samuel 13:6 — "estaban en **estrecho** (porque el pueblo estaba en **aprieto**)" | Nice citation: this verse uses TWO different renderings of this same lemma back to back ("estrecho" and "aprieto"), illustrating the narrow/hard-strait overlap directly. Alt.: Deuteronomio 15:18 prints "duro" for this same lemma elsewhere ("No te parezca **duro**...") if Victor prefers matching the English gloss word more literally — "duro" has one collision (Aramaic H4995), "aprieto" has one collision (H6695); either is a light, defensible choice. |

---

## H7227 — rav (A3 base gloss: **"abundante"**)

| dStrong | EN gloss (n) | ES gloss      | Citation                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| ------- | ------------ | ------------- | ------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H7227A  | many (423)   | **abundante** | Génesis 6:5 — "la maldad de los hombres era **mucha** en la tierra" | Matches A3, overwhelmingly dominant sense, exact print match.                                                                                                                                                                                                                                                                                                                                                                                |
| H7227B  | chief (29)   | **capitán**   | Jonás 1:6 — "Y el **patrón** de la nave se le acercó"               | Print: "patrón" (ship's captain/skipper) — a good illustration of "rav" = chief/head. I proposed "capitán" as a more broadly recognizable Spanish word for the "chief/leader" sense; "patrón" itself is free of collision too if Victor prefers matching print. Note the SAME concept ("leader/chief") recurs in this batch at H352C — I deliberately used a different word there ("líder") to avoid an intra-batch collision; see that row. |

---

## H4853 — massa (A3 base gloss: **"carga"**)

**Theological note**: "oracle" here is the prophetic-genre term (the heading formula
"מַשָּׂא / massa" that opens many prophetic denunciations, e.g. "Carga de Babilonia",
"Carga de Damasco"). Scholars have long debated whether these headings mean "burden"
(a heavy judgment to be borne) or simply "utterance/oracle" — the two senses are
etymologically the same root, deliberately or coincidentally. Worth Victor's attention
since this is a recognizable prophetic-book structural marker, not just vocabulary.

| dStrong | EN gloss (n) | ES gloss     | Citation                                                                                 | Notes                                                                                                                  |
| ------- | ------------ | ------------ | ---------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| H4853A  | burden (38)  | **carga**    | 2 Reyes 5:17 — "¿de esta tierra no se dará a tu siervo la **carga** de un par de mulas?" | Matches A3 exactly, dominant sense, exact print match.                                                                 |
| H4853B  | oracle (28)  | **profecía** | Isaías 13:1 — "**Profecía** sobre Babilonia"                                             | Exact print match. Collision-free. See theological note above — flagging this one for Victor's attention specifically. |

---

## H2790 — charash (A3 base gloss: **"rascar"**)

**A3 mismatch.** A3's "rascar" (to scratch) is the bare etymological root gloss and
doesn't clearly correspond to either split sense — the numerically dominant sense
("be quiet", 47) isn't represented in A3 at all.

| dStrong | EN gloss (n)      | ES gloss   | Citation                                                  | Notes                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | ----------------- | ---------- | --------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2790B  | be quiet (47)     | **callar** | Números 30:4 — "su padre **callare** a ello"              | Dominant sense, not reflected in A3's current gloss at all. Exact print match. One collision (H5535) — flagging lightly, common concept.                                                                                                                                                                                                                                                                                    |
| H2790A  | to plow/plot (27) | **arar**   | 1 Samuel 8:12 — "los pondrá... a que **aren** sus campos" | Exact print match, literal-plow half of this dStrong (the "plot/scheme" figurative half isn't separately citable from the same word here). One collision: H1240, a _biblical Aramaic_ word (Daniel/Ezra portions) also glossed "arar" in A3 — different language within the same Strong's H-number range, low practical overlap risk since Aramaic-tagged words won't appear in Hebrew OT books. Flagging for completeness. |

---

## H6887 — tsarar (A3 base gloss: **"estrechar"**)

**A3 mismatch.** Dominant sense is "to vex" (26), not "to constrain" (23, the sense
A3's "estrechar" reflects) — close numerically, so this is a soft flag, not a hard
error. Also note H6887A ("to confine") has **zero** occurrences in the OT — every
attested use of this lemma is one of the other four senses.

| dStrong | EN gloss (n)      | ES gloss      | Citation                                                                                           | Notes                                                                                                                                                                                                                                                                                                                                        |
| ------- | ----------------- | ------------- | -------------------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H6887D  | to vex (26)       | **hostigar**  | Números 33:55 — "los que dejareis... **os afligirán** sobre la tierra"                             | Print: "afligirán". Dominant sense; not reflected in A3 today. Collision-free.                                                                                                                                                                                                                                                               |
| H6887B  | to constrain (23) | **estrechar** | Salmos 129:1–2 — "Mucho **me han angustiado** desde mi juventud... mas no prevalecieron contra mí" | Matches A3 exactly (self-consistent). Print here is "angustiado", not "estrechar" — **[flag]** I could not find a citation where RVR1960's print literally uses a narrow/press word for this specific sense; this citation supports the general "oppressive pressure" concept but not the "estrechar" wording directly. Worth a second look. |
| H6887C  | to distress (4)   | **angustiar** | 1 Samuel 30:6 — "Y David **se angustió** mucho"                                                    | Exact print match. Note this and H6887B end up conceptually adjacent (constrain vs. distress are close synonyms in English too) — I used different ES words for the two ("estrechar" vs "angustiar") specifically so they don't collide with each other within this same lemma.                                                              |
| H6887E  | to rival (1)      | **rivalizar** | Levítico 18:18 — "para **hacerla su rival**"                                                       | The single OT occurrence (co-wife rivalry law). Near-exact print match ("su rival" — RVR1960 uses the noun form; I propose the verb "rivalizar" to match the dStrong's verbal sense). Collision-free.                                                                                                                                        |
| H6887A  | to confine (0)    | **confinar**  | **[NO CITATION — 0 occurrences]**                                                                  | Included per the brief's "translate all senses" instruction, but there is no verse to cite: this sense is attested zero times in the actual text. Flagging explicitly rather than inventing one.                                                                                                                                             |

---

## H352 — ayil (A3 base gloss: **"carnero"**)

| dStrong | EN gloss (n)  | ES gloss      | Citation                                                                     | Notes                                                                                                                                                                                                                                                                                                                                                                           |
| ------- | ------------- | ------------- | ---------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H352A   | ram (156)     | **carnero**   | Génesis 22:13 — "he aquí a sus espaldas un **carnero** trabado en un zarzal" | Matches A3 exactly, dominant sense, exact print match.                                                                                                                                                                                                                                                                                                                          |
| H352B   | pillar (22)   | **poste**     | Ezequiel 40:10 — "también de una medida los **postes** de un lado y otro"    | Print match (Ezekiel's temple-vision architecture). Collision-free. (Considered "pilastra"/"columna" — "columna" collides with 3 existing lemmas, H547/H5982/H8490 — "poste" avoids that entirely and matches what RVR1960 actually prints here.)                                                                                                                               |
| H352C   | leader (5)    | **líder**     | Éxodo 15:15 — "los **caudillos** de Edom se turbarán"                        | Print: "caudillos" — a very clean, well-known match (Song of the Sea). I used "líder" rather than "jefe" specifically because "jefe" is already the A3 gloss for FOUR other lemmas (H1169, H5387, H5632, H8269) — and because H7227B in this same batch also means "chief/leader" and needed a distinct word too (I used "capitán" there). "Líder" is collision-free.           |
| H352D   | terebinth (4) | **terebinto** | Isaías 1:29 — "os avergonzarán las **encinas** que amasteis"                 | Print: "encinas" (oaks) — RVR1960 renders this tree word as "oak" here rather than "terebinth"; the two are frequently conflated across Bible translations (both are the same family of sacred/shade trees mentioned in patriarchal narratives). "Terebinto" is the more botanically standard rendering and is collision-free; flagging the translation variance for awareness. |

A3 check: dominant sense (ram, 156) matches A3 exactly. Consistent.

---

## H3651 — ken (A3 base gloss: **"así / correcto"**)

| dStrong | EN gloss (n) | ES gloss     | Citation                                                                   | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| ------- | ------------ | ------------ | -------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H3651C  | so (734)     | **así**      | Génesis 1:7 — "Y **fue así**"                                              | Matches A3, overwhelmingly dominant sense, exact print match.                                                                                                                                                                                                                                                                                                                                                                                                                           |
| H3651A  | right (22)   | **correcto** | Números 27:7 — "**Bien** dicen las hijas de Zelofehad"                     | Matches A3's second term. Print is "bien" (rightly/correctly said) rather than "correcto" itself — same concept, adverbial form.                                                                                                                                                                                                                                                                                                                                                        |
| H3651B  | as (9)       | **como**     | Génesis 41:13 — "aconteció que **como** él nos lo interpretó, **así** fue" | **[UNCERTAIN ROOT]** — this is the weakest citation in the batch. "Ken" as a bare comparative "as" (rather than "so"/"thus") is hard to pin to one clean example without the tagged text; this verse shows the como...así correlative pattern where "ken" plausibly underlies "así" (not "como"), which would actually make it a H3651C example, not H3651B. Flagging for a tagged-text check before using this row for anything. One collision either way: "como" collides with H3644. |

---

## H2502 — chalats (A3 base gloss: **"quitar"**)

A3's "quitar" (to strip/remove) is the etymological root sense and doesn't map
cleanly onto either derived sense below — a soft flag, since the two senses are
nearly tied in frequency (23 vs. 21) so there's no single obviously-dominant sense
A3 should have picked instead.

| dStrong | EN gloss (n)   | ES gloss     | Citation                                                                | Notes                                                                                                                                             |
| ------- | -------------- | ------------ | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2502A  | to rescue (23) | **rescatar** | Éxodo 15:16 — "hasta que haya pasado este pueblo que tú **rescataste**" | Exact print match (Song of the Sea). One collision: H1350 (go'el, "redeemer/kinsman-redeemer" — a related theological concept, expected overlap). |
| H2502B  | to arm (21)    | **armar**    | Números 32:17 — "nosotros **nos armaremos** e iremos con diligencia"    | Exact print match. Collision-free.                                                                                                                |

---

## H5869 — ayin (A3 base gloss: **"ojo"**)

| dStrong | EN gloss (n)          | ES gloss       | Citation                                                                | Notes                                                                                                                                                                                                                                                                                                                                                                          |
| ------- | --------------------- | -------------- | ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H5869A  | eye (467)             | **ojo**        | Génesis 3:6 — "era agradable a los **ojos**"                            | Matches A3 exactly. Note: this sense alone (467) plus its "seeing/appearance" sub-senses (210 + 156) together make "eye" overwhelmingly dominant for this lemma overall — no real A3 mismatch here, just a lot of internal sub-division.                                                                                                                                       |
| H5869H  | eye: seeing (210)     | **mirada**     | Génesis 6:8 — "Noé halló gracia ante los **ojos** de Jehová"            | The very common "in the sight/eyes of" idiom (finding favor, being right in someone's eyes). Print is "ojos" — the "seeing/perceiving" nuance is contextual, not a separate printed word. One collision (H2380) — flagging lightly.                                                                                                                                            |
| H5869I  | eye: appearance (156) | **aspecto**    | Levítico 13:55 — "si no hubiere mudado de **aspecto** la plaga"         | Exact print match — this dStrong maps well onto the recurring "color/appearance" idiom used throughout Leviticus 13's skin-disease diagnostic law (an "eye" = visual appearance idiom, distinct from literal eyeball). One collision (H4758, mar'eh — a genuinely different Hebrew "appearance" word; real but low-confusion since they're conceptually near-synonyms anyway). |
| H5869M  | spring (17)           | **fuente**     | Génesis 16:7 — "junto a una **fuente** de agua en el desierto"          | Exact print match (Hagar at the spring). Three existing collisions (H3595, H4002, H5033) — common concept (Hebrew has several "water source" near-synonyms), flagging as expected.                                                                                                                                                                                             |
| H5869K  | eye: sin (2)          | **mal de ojo** | Deuteronomio 15:9 — "mires con **malos ojos** a tu hermano menesteroso" | Print: "malos ojos" — near-exact match for the "evil eye" (= stinginess/envy) idiom. Only 2 OT occurrences total. Collision-free, and deliberately kept literal ("mal de ojo" rather than fully idiomatic "envidia") to preserve the visible "ojo" root for interlinear coherence with the rest of this lemma's rows.                                                          |

---

## H2470 — chalah (A3 base gloss: **"debilitarse"**)

| dStrong | EN gloss (n)          | ES gloss          | Citation                                                                            | Notes                                                                                                                                                                                                                                                                                                                                              |
| ------- | --------------------- | ----------------- | ----------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2470H  | be weak: ill (38)     | **enfermar**      | 2 Reyes 13:14 — "Estaba Eliseo **enfermo** de la enfermedad de que murió"           | Dominant sense, exact print match. Two light collisions (H4834, H5136).                                                                                                                                                                                                                                                                            |
| H2470B  | to beg (16)           | **suplicar**      | Ester 7:7 — "se quedó Amán para **suplicar** a la reina Ester por su vida"          | Exact print match. Collision-free.                                                                                                                                                                                                                                                                                                                 |
| H2470I  | be weak: grieved (12) | **entristecerse** | 2 Samuel 13:2 — "estaba Amnón **angustiado** hasta enfermarse por Tamar su hermana" | Print: "angustiado" — the lovesickness/grief sense (Amnón over Tamar). "Entristecerse" is collision-free; I avoided "angustiar"/"angustiarse" here specifically because I'd already used that exact word for H6887C above (a different lemma) and didn't want two different Hebrew roots showing the identical Spanish word within the same batch. |
| H2470A  | be weak: weak (9)     | **debilitarse**   | Jueces 16:7 — "entonces **me debilitaré** y seré como cualquiera de los hombres"    | Matches A3 exactly, exact print match (Sansón to Dalila).                                                                                                                                                                                                                                                                                          |

---

## H2717 — charev (A3 base gloss: **"resecar"**)

Soft flag: A3's "resecar" (dry out) leans toward the literal/etymological sense; the
numerically dominant sense is "destroy" (20) vs. "dry" (16) — close enough that this
isn't a hard mismatch, but worth noting A3 didn't pick the more frequent one.

| dStrong | EN gloss (n)    | ES gloss    | Citation                                                                                            | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------- | --------------- | ----------- | --------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2717B  | to destroy (20) | **arrasar** | Levítico 26:31 — "**asolaré** vuestros santuarios"                                                  | Print: "asolaré" (close synonym of "arrasar", both mean "raze/devastate"). Dominant sense, not what A3's current gloss reflects. Collision-free ("arrasar"); I avoided "destruir" deliberately since it's already the A3 gloss for SIX other lemmas.                                                                                                                                                                                                              |
| H2717A  | to dry (16)     | **secar**   | Job 14:11 — "el río se agota y **se seca**"                                                         | Matches A3's "resecar" closely (consistent). Exact print match.                                                                                                                                                                                                                                                                                                                                                                                                   |
| H2717C  | to slay (4)     | **matar**   | Josué 10:35 — "la hirieron a filo de espada; y aquel día **mató** a todo lo que en ella tenía vida" | **[UNCERTAIN ROOT]** — "a filo de espada" more likely tags the related noun _chereb_ ("sword", H2719) rather than this verb lemma; I can't confirm from print alone which exact word in this verse carries the H2717 tag. The general "slay in battle" sense is plausible and well-attested for this dStrong, but this specific citation needs a tagged-text spot-check before use. Four existing collisions on "matar" — very common verb, flagging as expected. |

---

## H3885 — lun (A3 base gloss: **"detenerse"**)

| dStrong | EN gloss (n)    | ES gloss      | Citation                                                                                | Notes                                                                                                                                                                                                                                                                                                                                   |
| ------- | --------------- | ------------- | --------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H3885A  | to lodge (69)   | **pernoctar** | Génesis 28:11 — "**durmió** allí, porque ya el sol se había puesto"                     | Dominant sense. Print is "durmió" (contextual — Jacob stopping for the night at Betel) rather than a lodging-specific word; "pernoctar" is more precise than A3's generic "detenerse". One collision (H956, itself glossed "alojarse / pernoctar" — a genuine synonym, low confusion risk).                                             |
| H3885B  | to grumble (15) | **murmurar**  | Éxodo 16:2 — "toda la congregación... **murmuró** contra Moisés y Aarón en el desierto" | **Theological note**: this is THE wilderness-murmuring motif (Éxodo 15–17, Números 14 etc.) — a recurring, theologically significant pattern of Israel's unbelief in the desert, referenced later in the NT (1 Corintios 10:10). Worth flagging as more than a vocabulary item. Exact print match. Two light collisions (H1897, H7279). |

---

## H6030 — anah (A3 base gloss: **"responder"**)

| dStrong | EN gloss (n)    | ES gloss      | Citation                                                     | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| ------- | --------------- | ------------- | ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H6030B  | to answer (315) | **responder** | Números 32:20 — "Entonces les **respondió** Moisés"          | Matches A3 exactly, overwhelmingly dominant sense, exact print match.                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| H6030C  | to sing (15)    | **cantar**    | Éxodo 15:21 — "María les **respondía**: **Cantad** a Jehová" | Nice illustrative citation — RVR1960's own text shows the answer/sing overlap directly (Miriam "respondía" by leading a song), which is exactly why this lemma has both senses. Two light collisions (H7442, H7891).                                                                                                                                                                                                                                                                                                                             |
| H6030A  | to dwell (1)    | **asentarse** | **[NO CITATION FOUND]**                                      | The single OT occurrence of this sense. I could not confidently identify which verse carries this reading without the tagged source — a candidate I considered (Eclesiastés 5:19–20, a well-known "occupied/answers him" translation crux) does not hold up: RVR1960's actual printed text there ("Dios le llenará de alegría el corazón") doesn't legibly support either reading, so per the brief's "don't invent a reference" instruction I'm leaving this row without a citation rather than forcing a weak one. Needs a tagged-text lookup. |

---

## H7114 — qatser (A3 base gloss: **"recortar"**)

**A3 mismatch.** Dominant sense is "to reap" (34), not reflected in A3 at all; A3's
"recortar" (to trim/shorten) aligns with the minority "be short" sense (15).

| dStrong | EN gloss (n)  | ES gloss    | Citation                                                                                         | Notes                                                                                                                                            |
| ------- | ------------- | ----------- | ------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| H7114B  | to reap (34)  | **segar**   | Levítico 19:9 — "Cuando **siegues** la mies de tu tierra, no **segarás** hasta el último rincón" | Dominant sense, exact print match, collision-free.                                                                                               |
| H7114A  | be short (15) | **congoja** | Éxodo 6:9 — "no escuchaban a Moisés a causa de la **congoja** de espíritu"                       | Matches A3's underlying sense (the "qotser ruach" = "shortness of spirit" idiom = impatience/discouragement). Exact print match. Collision-free. |

---

## H6643 — tsevi (A3 base gloss: **"esplendor"**)

| dStrong | EN gloss (n) | ES gloss      | Citation                                                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ------------ | ------------- | ------------------------------------------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H6643A  | beauty (19)  | **esplendor** | Isaías 4:2 — "el renuevo de Jehová será para **hermosura y gloria**"     | Matches A3 exactly (self-consistent choice). Print uses "hermosura y gloria" — close synonyms of "esplendor", not the identical word.                                                                                                                                                                                                                                                                    |
| H6643B  | gazelle (14) | **gacela**    | 2 Samuel 2:18 — "Asael era **ligero de pies como una gacela** del campo" | Exact print match. One collision (H2169, also "gacela") — a genuine Hebrew synonym pair; Hebrew nature poetry frequently pairs near-synonym animal words (this lemma's dual "beauty/gazelle" sense is itself a well-known poetic pun — 2 Samuel 1:19's "tu gloria" over Israel plausibly puns on "your gazelle" too). Flagging as an interesting case for awareness, not necessarily something to "fix". |

---

## H2563 — chomer (A3 base gloss: **"burbujeo"**)

**Strong A3 mismatch.** A3's "burbujeo" (bubbling — the etymological root image) doesn't
match ANY of the three attested senses at all and will read as confusing/opaque to an
app user. Flagging this one hardest of the batch.

| dStrong | EN gloss (n) | ES gloss           | Citation                                                                             | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| ------- | ------------ | ------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2563A  | clay (15)    | **barro**          | Isaías 64:8 — "nosotros **barro**, y tú el que nos formaste"                         | Dominant sense, exact print match, collision-free.                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| H2563C  | homer (13)   | **homer (medida)** | Levítico 27:16 — "un **homer** de siembra de cebada se valorará en cincuenta siclos" | **Technical/measurement term — precision matters here.** RVR1960 does NOT translate this as "coro" (RVR1960's word for the related-but-different _kor_ unit, H3734) — it transliterates "homer" directly, consistently (also Ezequiel 45:11). I'm following RVR1960's own convention rather than inventing a translation, since Bible dry-measure equivalences are themselves a contested area — flagging so nobody "corrects" this to "coro" and conflates two different ancient units. |
| H2563B  | heap (3)     | **montón**         | Éxodo 8:14 — "Y las **juntaron en montones**" (the plague-of-frogs heaps)            | Exact print match — and a nice confirmation: the underlying Hebrew here is the reduplicated "chŏmārim chŏmārim" ("heaps upon heaps"), literally this same root. Five existing collisions on "montón" — very common word, flagging as expected.                                                                                                                                                                                                                                           |

---

## H8577 — tan (A3 base gloss: **"monstruo marino o terrestre"**)

**A3 mismatch + real collision, both worth flagging together.** This is a genuine
three-way Hebrew homonym (jackal / sea-monster / snake) that even lexicons argue
about untangling. A3's "monstruo marino o terrestre" is a reasonable umbrella gloss
but doesn't surface "jackal" at all — even though jackal (14) is this lemma's most
frequent attested sense.

| dStrong | EN gloss (n)         | ES gloss      | Citation                                                                 | Notes                                                                                                                                                                                                                                                                                                                                                                                                           |
| ------- | -------------------- | ------------- | ------------------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H8577A  | jackal (14)          | **chacal**    | Isaías 13:22 — "aullarán hienas, y **chacales** en sus casas de deleite" | Dominant sense, not surfaced by A3's current gloss at all. Exact print match. **Real collision**: H7776 is ALSO glossed "chacal" in A3 (its Strong's definition is literally "un chacal") — a true Hebrew near-synonym pair (shu'al/tan), not a translation slip on my part. Flagging for Victor's awareness; I don't have a good disambiguated alternative since "chacal" is simply the correct word for both. |
| H8577N  | serpent: monster (8) | **dragón**    | Isaías 27:1 — "**matará al dragón** que está en el mar"                  | Exact print match — and a strong theological citation (the Leviatán/sea-dragon judgment oracle, cosmic-battle imagery). Collision-free (avoids A3's existing "monstruo" at H8565).                                                                                                                                                                                                                              |
| H8577M  | serpent: snake (5)   | **serpiente** | Deuteronomio 32:33 — "**Veneno de serpientes** es su vino"               | Exact print match. Two collisions (H5175 nachash — the primary "serpent" word, expected overlap; H6848).                                                                                                                                                                                                                                                                                                        |

---

## H2254 — chaval (A3 base gloss: **"enrollar apretadamente"**)

A3's literal "to bind tightly" root sense reasonably underlies "to pledge" (collateral
= something bound/tied) but doesn't obviously cover "destroy" or "labour" — a mild,
not urgent, flag.

| dStrong | EN gloss (n)     | ES gloss           | Citation                                                                                                          | Notes                                                                                                                                                                                                                                    |
| ------- | ---------------- | ------------------ | ----------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H2254A  | to pledge (12)   | **empeñar**        | Éxodo 22:26 — "Si **tomares en prenda** el vestido de tu prójimo"                                                 | Tied for dominant sense. Print: "tomares en prenda" (same pledge/collateral concept, noun form). One collision (H5670) — a real Hebrew synonym pair for "pledge", expected.                                                              |
| H2254B  | to destroy (12)  | **arruinar**       | Cantares 2:15 — "las zorras... que **echan a perder** las viñas"                                                  | Tied for dominant sense. Print: "echan a perder" (close synonym of "arruinar/destruir"). One collision (H2255).                                                                                                                          |
| H2254C  | be in labour (3) | **estar de parto** | Isaías 26:17 — "Como la **mujer encinta** cuando se acerca el alumbramiento, **gime y da gritos en sus dolores**" | **Theological note**: labor-pains imagery is a recurring OT/NT figure for the anguish of divine judgment / the last days (cf. also Miqueas 4:9–10, 1 Tesalonicenses 5:3) — worth flagging as more than plain vocabulary. Collision-free. |

---

## H3867 — lavah (A3 base gloss: **"juntar / unir"**)

| dStrong | EN gloss (n)   | ES gloss           | Citation                                                                              | Notes                                                                                                                                                                                                       |
| ------- | -------------- | ------------------ | ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H3867B  | to borrow (14) | **pedir prestado** | Salmos 37:21 — "El impío **toma prestado**, y no paga"                                | Narrowly dominant sense (14 vs. 12) — A3's single gloss picked the "join" sense instead, though the two are close enough that this isn't a hard mismatch. Exact print match (phrase collision-free).        |
| H3867A  | to join (12)   | **unir**           | Génesis 29:34 — "esta vez **se unirá** mi marido conmigo... llamó su nombre **Leví**" | Matches A3 exactly. **Textual note**: this is the etymological pun behind the tribal name Leví itself (from this verb) — a nice, citable naming etymology, not just a random occurrence. Exact print match. |

---

## H5035 — nevel (A3 base gloss: **"odre para líquidos"**)

**Strong A3 mismatch, theologically/liturgically visible.** A3's "odre" (wineskin/bag)
reflects the minority sense (11 occurrences); "harp" (27) is dominant and is one of
the two standard instruments named constantly throughout the Psalms' worship
vocabulary (paired with "kinnor"/H3658 in phrases like "con arpa y salterio" —
e.g. Salmos 33:2, 92:3, 150:3). A reader who looks this word up expecting "harp" in a
worship psalm and finds "odre" (wineskin) in the base lemma default will reasonably
be confused. Recommend Victor prioritize this one.

| dStrong | EN gloss (n) | ES gloss     | Citation                                                                              | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| ------- | ------------ | ------------ | ------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| H5035B  | harp (27)    | **salterio** | Salmos 33:2 — "Aclamad a Jehová con **arpa**; Cantadle con **salterio** y decacordio" | Dominant sense; not reflected in A3 today. Exact print match. Deliberately "salterio", NOT "arpa" — H3658 (kinnor) already owns "arpa" in A3, and this exact verse shows BOTH instruments named in the same line, which is precisely the collision this word choice avoids: an interlinear reader looking at this verse would see "arpa" (kinnor) and "salterio" (nevel) as two visibly different words, matching what RVR1960 itself prints. (Bonus cross-check: the Aramaic cognate H6460, in Daniel 3's instrument list, is independently glossed "salterio" in A3 too — same instrument, different chapter's language tag, so this is a validating, not a conflicting, overlap.) |
| H5035A  | bag (11)     | **odre**     | Job 32:19 — "se rompe como **odres** nuevos"                                          | Matches A3 exactly. Exact print match. Two existing collisions (H2573, H4997, both also "odre") — real synonym cluster (Hebrew has multiple skin-bag/wineskin words), expected.                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                      |

---

## H1481 — gur (A3 base gloss: **"peregrinar / morar"**)

| dStrong | EN gloss (n)    | ES gloss       | Citation                                                                              | Notes                                                                                                                                                                                                                                                                                              |
| ------- | --------------- | -------------- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1481A  | to sojourn (81) | **peregrinar** | Génesis 47:9 — "Los días de los años de mi **peregrinación** son ciento treinta años" | Matches A3, dominant sense, exact print match (Jacob before Pharaoh).                                                                                                                                                                                                                              |
| H1481C  | to dread (10)   | **temer**      | Números 22:3 — "Moab **tuvo gran temor**... se angustió Moab"                         | Print: "tuvo gran temor" (close match). Three light collisions (H3025, H3372 — H3372/yare is the primary "fear" word, expected overlap, H7297).                                                                                                                                                    |
| H1481B  | to quarrel (6)  | **reñir**      | Génesis 26:20 — "los pastores de Gerar **riñeron** con los pastores de Isaac"         | **[UNCERTAIN ROOT]** — exact print match on "riñeron", but I can't rule out from print alone that this specific verb form tags a different, closely-related "strive/contend" root (riv, H7378) rather than this lemma. Flagging for a tagged-text spot-check. Collision-free either way ("reñir"). |

---

## H1984 — halal (A3 base gloss: **"alabar"**)

**The single most theologically weighted lemma in this batch — this is the root of
"Hallelujah" (halelu-Yah = "praise Yah", H1984B specifically).** It also, via the same
root, covers boasting, foolishness, and frenzied/raving behavior — a genuinely wide
semantic range worth Victor's own read before any of these five rows are used, not
just the dominant one.

| dStrong | EN gloss (n)             | ES gloss       | Citation                                                                                                                                        | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| ------- | ------------------------ | -------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H1984B  | to boast: praise (122)   | **alabar**     | Salmos 150:1 — "**Alabad** a Dios en su santuario"                                                                                              | Matches A3 exactly, dominant sense, exact print match. This is the "Hallelujah" sense. One collision worth naming specifically: H3034 (yadah, "to give thanks/praise") — the other major OT praise-verb, constantly paired with this one in the Psalms (e.g. "alabad y load"). Expected, liturgically-motivated overlap, not an error.                                                                                                                                                    |
| H1984H  | to boast: boast (24)     | **jactarse**   | Jeremías 9:23–24 — "No se **alabe** el sabio en su sabiduría... mas **alábese** en esto el que se hubiere de alabar: en entenderme y conocerme" | **Theological note**: this is the classic "let him who boasts, boast in this: that he knows me" passage (quoted in 1 Corintios 1:31 / 2 Corintios 10:17) — genuine glorying is redirected from wisdom/might/riches to knowing God. Worth flagging as a passage in its own right, not just a vocabulary example. Print uses the same root ("alabe"/"alábese") rather than "jactarse" — same word family, different English-gloss nuance (self-glorying vs. praise of God). Collision-free. |
| H1984C  | to be foolish (10)       | **enloquecer** | 1 Samuel 21:13 — "**se fingió loco** entre ellos"                                                                                               | David feigning madness before Aquis/Abimelec. Print: "se fingió loco" (close synonym). Collision-free.                                                                                                                                                                                                                                                                                                                                                                                    |
| H1984I  | to boast: rave madly (5) | **desvariar**  | 1 Samuel 18:10 — "un espíritu malo de parte de Dios tomó a Saúl, y él **desvariaba** en medio de la casa"                                       | **[UNCERTAIN ROOT]** — exact print match on "desvariaba", but I could not confirm this verb-form is tagged to THIS lemma rather than a different root (some sources associate this exact verse with a "prophesy/rave" verb from a different root, naba). Genuinely hard to disambiguate from H1984C without the tagged source — the two senses (foolish / rave madly) are close neighbors of the same root anyway. Flagging for a spot-check.                                             |
| H1984A  | to shine (4)             | **brillar**    | Job 29:3 — "cuando **hacía resplandecer** su lámpara sobre mi cabeza"                                                                           | The literal root sense underlying all the others (halal = "to be clear/bright", hence praise = "shine forth about someone", boast = "shine about oneself", foolish = manic brightness/frenzy). Print: "hacía resplandecer" (close synonym). Three light collisions.                                                                                                                                                                                                                       |

---

## H6743 — tsalach (A3 base gloss: **"empujar hacia adelante"**)

| dStrong | EN gloss (n)    | ES gloss      | Citation                                                                      | Notes                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ------- | --------------- | ------------- | ----------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| H6743B  | to prosper (55) | **prosperar** | Génesis 39:2 — "Jehová estaba con José, y fue **varón próspero**"             | Matches A3's general sense well (dominant). Print: "varón próspero" (close synonym). Collisions include H6744, a related form of this SAME root (expected/harmonious, not a distinct-word problem).                                                                                                                                                                                                                                                                         |
| H6743A  | to rush (10)    | **arremeter** | Jueces 14:6 — "el **Espíritu de Jehová vino sobre** Sansón... con gran poder" | **Theological note**: this is the recurring "Spirit of the LORD rushed/came powerfully upon" formula marking charismatic empowerment of the judges (also Jueces 14:19, 15:14, 1 Samuel 10:6, 11:6) — a structurally significant phrase in Judges' theology of leadership, not just a vocabulary item. Print doesn't use "arremeter" itself ("vino sobre... con gran poder" is the idiom) — contextual support rather than a direct word match. One light collision (H5590). |

---

## Summary for Victor

**78 senses across 27 lemmas.** Every row's Notes cell states its own collision/flag
status; the tiers below are a strict re-read of those same Notes cells, not a separate
judgment call, so they should match one-to-one if Victor spot-checks any row. A few
rows legitimately carry more than one flag (e.g. H5035B is both an A3 mismatch _and_
a deliberate collision-avoidance choice) — in those cases the row is counted once,
under whichever tier is most consequential, in this priority order: **uncertain/no
citation > A3 mismatch > collision resolved by word choice > light expected
collision > clean**. Counts sum to 78.

| Tier                                  | Count  | Meaning                                                                                                                                                                                                                                                                             |
| ------------------------------------- | ------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Clean**                             | **32** | Matches A3 (or is a narrow, non-urgent refinement of it), citation is a real exact/near-exact print match, no collision of any kind noted.                                                                                                                                          |
| **Light expected collision**          | **21** | A real overlap with an existing A3 gloss (or another row here) that I kept as-is because it reflects genuine Hebrew synonymy (several Hebrew words legitimately share one obvious Spanish translation) — noted, not "fixed".                                                        |
| **Collision resolved by word choice** | **10** | I deliberately picked a less-obvious Spanish word specifically to avoid a collision I judged too confusing to leave (e.g. "secretario" not "escriba", "salterio" not "arpa", "poste" not "columna") — an editorial call worth Victor's eyes even though the row is otherwise sound. |
| **A3 mismatch**                       | **8**  | The lemma's current base-lemma gloss does not reflect this sense's numerically-dominant status — flagged regardless of whether this specific row's own citation/collision is otherwise clean.                                                                                       |
| **Uncertain / no citation**           | **7**  | Either the citation's root-tagging can't be confirmed without the TAHOT source, the citation doesn't cleanly support the specific gloss word, or (one row) no citation exists at all. Needs a tagged-text check or Victor's own read before use.                                    |

**Clean (32):** H5608A, H3384B, H3384A, H5971A, H5971K, H5971B, H5971L, H6862A,
H7227A, H4853A, H4853B, H6887C, H6887E, H352A, H352D, H3651C, H3651A, H2502B,
H5869A, H5869K, H2470B, H2470A, H2717A, H6030B, H7114A, H6643A, H2254C, H3867B,
H3867A, H1481A, H1984H, H1984C.

**Light expected collision (21):** H2691B, H6862D, H2790A, H2502A, H5869H, H5869I,
H5869M, H2470H, H3885A, H3885B, H6030C, H6643B, H2563B, H8577M, H2254A, H5035A,
H1481C, H1984B, H1984A, H6743B, H6743A.

**Collision resolved by word choice (10):** H5608B (secretario, not escriba),
H6862B (tribulación, not aflicción), H7227B (capitán, not jefe), H352B (poste, not
columna), H352C (líder, not jefe), H2470I (entristecerse, not angustiar — avoids
colliding with H6887C inside this same batch), H2717B (arrasar, not destruir),
H2563C ("homer" transliterated, not "coro"), H8577N (dragón, not monstruo),
H2254B (arruinar, not arrasar — avoids colliding with H2717B inside this same batch).

**A3 mismatch (8):** H2691A (patio vs. contextual "atrio"), H6862C (estrecho/8 vs.
dominant enemy/69), H2790B (rascar vs. dominant "be quiet"/47), H6887D (estrechar/23
vs. dominant "vex"/26, close), H7114B (recortar vs. dominant "reap"/34), H2563A
(burbujeo — doesn't match ANY of the three attested senses, hardest flag), H8577A
(doesn't surface "jackal" despite it being dominant), H5035B (odre/11 vs. dominant
"harp"/27 — the most user-visible mismatch, since it's Psalms worship vocabulary).

**Uncertain / no citation (7):** H6887B (citation is real but the word-fit to
"estrechar" is weak — flagged for a second look), H6887A (0 occurrences in the OT,
no citation possible), H3651B (as — root uncertain), H2717C (to slay — may be
tagging the related noun "sword" instead), H6030A (to dwell — no citation found;
refused to invent one), H1481B (to quarrel — root uncertain), H1984I (rave madly —
root uncertain, closely bordering H1984C).

**Most theologically significant judgment calls, for priority review:**

1. **H1984 (halal) — the Hallelujah root.** Five senses spanning "praise" down to
   "rave madly", sharing one root. The dominant/liturgical sense (H1984B, "alabar")
   is solid, but two of the minor senses (H1984I "rave madly", and to a lesser
   extent H1984C "be foolish") sit on genuinely contested lexical ground — I've
   flagged H1984I as uncertain rather than asserting it confidently.
2. **H5035 (nevel) — harp vs. wineskin.** A3's current base gloss shows the
   minority sense in exactly the context (Psalms worship instruments) where users
   are most likely to look the word up. I'm fairly confident in "salterio" as the
   disambiguated fix (validated by the Daniel 3 Aramaic cognate independently
   landing on the same word), but this is the one I'd want Victor to sign off on
   before anything downstream depends on it.
3. **H4853 (massa) "carga"/"oráculo" and H2254C "estar de parto"** — both touch
   prophetic-genre and judgment-day imagery respectively. Not mistranslations, just
   flagged because they carry more theological weight than an average vocabulary
   entry and deserve a slower read than the mechanical rows.

**Most theologically significant judgment calls, for priority review:**

1. **H1984 (halal) — the Hallelujah root.** Five senses spanning "praise" down to
   "rave madly", sharing one root. The dominant/liturgical sense (H1984B, "alabar")
   is solid, but two of the minor senses (H1984I "rave madly", and to a lesser
   extent H1984C "be foolish") sit on genuinely contested lexical ground — I've
   flagged H1984I as uncertain rather than asserting it confidently.
2. **H5035 (nevel) — harp vs. wineskin.** A3's current base gloss shows the
   minority sense in exactly the context (Psalms worship instruments) where users
   are most likely to look the word up. I'm fairly confident in "salterio" as the
   disambiguated fix (validated by the Daniel 3 Aramaic cognate independently
   landing on the same word), but this is the one I'd want Victor to sign off on
   before anything downstream depends on it.
3. **H4853 (massa) "carga"/"oráculo" and H2254C "estar de parto"** — both touch
   prophetic-genre and judgment-day imagery respectively. Not mistranslations, just
   flagged because they carry more theological weight than an average vocabulary
   entry and deserve a slower read than the mechanical rows.

**Files touched**: only `DOCS/drafts/a4-positional-overlay-glosses.md` (this file).
`assets/hebrew-gloss-es-v1.json`, `HEBREW_GLOSS_ES_VERSION`, and every other repo file
are untouched. Nothing merged, nothing pushed.
