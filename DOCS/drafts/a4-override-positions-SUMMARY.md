# A4-chico positional-overlay override rows — generation summary

_Mechanical output only. No Spanish content proposed here; senseLabel is the raw TBESH English gloss. Read-only against cached research data + a local DB copy — nothing in the main app was touched._

## Total

**616 override rows** generated across the 27 Tier-A1 lemmas (research doc's estimate: ~617). Delta from 617: -1, fully accounted for: H6030's "to sing" sense (H6030C, raw TBESH/TAHOT count 15) has one raw occurrence at `Psa.88.0(88.1)#08` — a Psalm superscription, filed at verse 0 in TAHOT's own numbering. assets/bible-seed.db (like the real app pack) has no verse-0 row for any Psalm, so build-originals-pack.js's own dead-verse gate drops it — this script reproduces that gate exactly (see build-originals-pack.js's parseStep() doc comment, case 1). The other 26 lemmas' override counts match their raw TBESH/TAHOT occurrence counts exactly (verified per-lemma). The corpus-wide gate stats below (478 dead-verse drops, 152 "=X" LXX-retroversion skips, 62 reposition bumps) are reported for transparency but only the one row above actually lands on an override dStrong.

## DB verification

- notFound (generated key has no row in original_words): **0**
- strongsMismatch (row exists but base strongs differs): **0**

## A3-dominant-sense cross-check

8 of 27 lemmas: A3's shipped gloss (assets/hebrew-lemma-gloss-es.json) does NOT clearly match the TAHOT-frequency-dominant core sense computed here. 4 more are UNRESOLVED (ambiguous enough that this pass could not confidently adjudicate) — flagged for the translator's pass, not asserted as errors.

**MISMATCH (8):**

- **H6862** (tsar): A3 "estrecho" (narrow) = the SMALLEST sense (8 occ), not dominant "enemy" (69)
- **H2790** (cha.rash): A3 "rascar" (to scratch/engrave) = non-dominant "to plow/plot" (27), not dominant "be quiet" (47)
- **H2717** (cha.rev): A3 "resecar" (to dry out) = non-dominant "to dry" (16), not dominant "to destroy" (20)
- **H2563** (cho.mer): A3 "burbujeo" (bubbling) does not clearly map to ANY listed TBESH sense for this lemma (clay/homer/heap) — likely an unrelated/erroneous A3 draft, flagged for the translator
- **H8577** (tan): A3 "monstruo marino o terrestre" (sea/land monster) = non-dominant "serpent" group (13), not dominant "jackal" (14); near-tied counts (14 vs 13)
- **H3867** (la.vah): A3 "juntar / unir" (to join/unite) = non-dominant "to join" (12), not dominant "to borrow" (14); near-tied counts
- **H5035** (ne.vel): A3 "odre para líquidos" (wineskin) = non-dominant "bag" (11), not dominant "harp" (27)
- **H6743** (tsa.lach): A3 "empujar hacia adelante" (to push forward) = non-dominant "to rush" (10), not dominant "to prosper" (55)

**UNRESOLVED (4):**

- **H6887** (tsa.rar): A3 "estrechar" (to tighten) is a general root sense compatible with several nuances (vex/constrain/distress); cannot confidently map to one dStrong
- **H2502** (cha.lats): A3 "quitar" (to remove) plausibly derives from the same "draw out" root as dominant "to rescue" (23), but could also read as "to arm/gird" (21); not confidently adjudicated
- **H7114** (qa.tser): A3 "recortar" (to trim/cut short) sits between dominant "to reap" (34, cutting grain) and non-dominant "be short" (15); not confidently adjudicated
- **H2254** (cha.val): TBESH occurrence counts TIE exactly (12 vs 12, "to pledge" vs "to destroy"); dominant chosen by deterministic tiebreak (dStrong letter), NOT by evidence — A3 "enrollar apretadamente" (wrap tightly) is loosely compatible with "to pledge" (binding collateral) but not conclusively adjudicated

_Regardless of bucket, override rows were generated for EVERY non-dominant dStrong occurrence of all 27 lemmas — the flag changes nothing about which rows exist; it is a signal that A3's own default gloss may also need a look._

## Per-lemma breakdown

| base  | translit | dominant core (occ) | tie? | A3 gloss                    | cross-check | override dStrongs | override rows |
| ----- | -------- | ------------------- | ---- | --------------------------- | ----------- | ----------------- | ------------- |
| H5608 | sa.phar  | to recount (107)    |      | recontar / relatar          | MATCH       | 1                 | 52            |
| H2691 | cha.tser | court (145)         |      | patio                       | MATCH       | 1                 | 46            |
| H3384 | ya.ra    | to show (47)        |      | enseñar / arrojar           | MATCH       | 1                 | 33            |
| H5971 | am       | people (1835)       |      | pueblo                      | MATCH       | 1                 | 31            |
| H6862 | tsar     | enemy (69)          |      | estrecho                    | MISMATCH    | 3                 | 40            |
| H7227 | rav      | many (423)          |      | abundante                   | MATCH       | 1                 | 29            |
| H4853 | mas.sa   | burden (38)         |      | carga                       | MATCH       | 1                 | 28            |
| H2790 | cha.rash | be quiet (47)       |      | rascar                      | MISMATCH    | 1                 | 27            |
| H6887 | tsa.rar  | to vex (26)         |      | estrechar                   | UNRESOLVED  | 4                 | 28            |
| H352  | a.yil    | ram (156)           |      | carnero                     | MATCH       | 3                 | 31            |
| H3651 | ken      | so (734)            |      | así / correcto              | MATCH       | 2                 | 31            |
| H2502 | cha.lats | to rescue (23)      |      | quitar                      | UNRESOLVED  | 1                 | 21            |
| H5869 | a.yin    | eye (835)           |      | ojo                         | MATCH       | 1                 | 17            |
| H2470 | cha.lah  | be weak (59)        |      | debilitarse                 | MATCH       | 1                 | 16            |
| H2717 | cha.rev  | to destroy (20)     |      | resecar                     | MISMATCH    | 2                 | 20            |
| H3885 | lun      | to lodge (69)       |      | detenerse                   | MATCH       | 1                 | 15            |
| H6030 | un       | to answer (315)     |      | responder                   | MATCH       | 2                 | 15            |
| H7114 | qa.tser  | to reap (34)        |      | recortar                    | UNRESOLVED  | 1                 | 15            |
| H6643 | tse.vi   | beauty (19)         |      | esplendor                   | MATCH       | 1                 | 14            |
| H2563 | cho.mer  | clay (15)           |      | burbujeo                    | MISMATCH    | 2                 | 16            |
| H8577 | tan      | jackal (14)         |      | monstruo marino o terrestre | MISMATCH    | 2                 | 13            |
| H2254 | cha.val  | to pledge (12)      | YES  | enrollar apretadamente      | UNRESOLVED  | 2                 | 15            |
| H3867 | la.vah   | to borrow (14)      |      | juntar / unir               | MISMATCH    | 1                 | 12            |
| H5035 | ne.vel   | harp (27)           |      | odre para líquidos          | MISMATCH    | 1                 | 11            |
| H1481 | gur      | to sojourn (81)     |      | peregrinar / morar          | MATCH       | 2                 | 16            |
| H1984 | ha.lal   | to boast (151)      |      | alabar                      | MATCH       | 2                 | 14            |
| H6743 | tsa.lach | to prosper (55)     |      | empujar hacia adelante      | MISMATCH    | 1                 | 10            |

## Observation (not a bug): TBESH sense tag vs TAHOT's own contextual gloss can diverge

Spot-checking H6030A ("to dwell", Isa 13:22 pos 1) against original_words shows TAHOT's own `gloss_en` for that exact word is "and it will sing" — not "dwell". This is a known scholarly disagreement about a rare/disputed root (jackals "dwelling"/"howling" in ruins), not a script error: TBESH's dStrong classification and STEPBible's per-occurrence interlinear gloss are two different editorial layers that don't always agree. Worth a translator's second look on this one row specifically before committing a Spanish sense label.

## Parse stats (full 4-file Hebrew TAHOT pass)

- total word rows parsed: 305500
- "=X" LXX-retroversion rows skipped: 152
- dead-verse rows dropped (not in assets/bible-seed.db): 478
- position-collision reposition bumps applied: 62
- rows matching an override dStrong (pre-verify): 616
