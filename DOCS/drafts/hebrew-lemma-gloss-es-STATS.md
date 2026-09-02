# A3 — Hebrew per-lemma Spanish gloss: scope & quality report

_Generated 2026-09-02 by `scripts/build-hebrew-lemma-gloss-es.js`._
_Draft artifact for a scope decision — nothing here is wired into the app._

## The headline number

A reader looking at an average OT verse sees a mix of content words and
grammatical particles. Of the **305,008** Hebrew word rows in the pack,
**6,078** (1.99%) carry no Strong's number at all
(prefixes, particles) and are permanently out of scope. So **98.01% is the
absolute ceiling**, not 100%.

| Scope choice                                                   | Lemmas with a Spanish gloss | Running-token coverage |
| -------------------------------------------------------------- | --------------------------- | ---------------------- |
| **mechanical only** (auto-safe, Spanish ready)                 | 3190                        | **19.81%**             |
| **mechanical + proper-noun** (proper = English placeholder ⚠️) | 5832                        | **31.54%**             |
| all 8503 used lemmas (ceiling)                                 | 8503                        | 98.01%                 |
| _held back for human drafting_                                 | 2460                        | 66.38% of tokens       |

> The held-back bucket is a minority of _lemmas_ but the **majority of running
> tokens** (66.38%) — a handful of very high-frequency words
> (אֵת, עַל, אֲשֶׁר, כִּי, הָיָה, אָמַר, כֹּל, the divine name …) dominate the
> token count, and every one of them is a real translation judgment.

⚠️ **2642 of the values in the draft JSON are English** (TBESH forms like
"Hezekiah", "Jerusalem", "LORD"). They are listed under `_properNouns` and need
an RVR1960-conventional Spanish spelling pass (Ezequías, Jerusalén, Jehová/SEÑOR)
before A3 could ship. Only the 3190 mechanical
values are Spanish today.

## Bucket counts

| Bucket                                               | Lemmas   | % of used lemmas | Occurrences | % of running tokens |
| ---------------------------------------------------- | -------- | ---------------- | ----------- | ------------------- |
| proper-noun                                          | 2642     | 31.1%            | 35,789      | 11.73%              |
| mechanical                                           | 3401     | 40.0%            | 60,687      | 19.90%              |
| &nbsp;&nbsp;↳ with a Spanish draft                   | 3190     |                  | 60,423      | 19.81%              |
| &nbsp;&nbsp;↳ blank (no definition_es, untranslated) | 211      |                  | 264         | 0.09%               |
| judgment / held-back                                 | 2460     | 28.9%            | 202,454     | 66.38%              |
| **total used lemmas**                                | **8503** | 100%             | **298,930** | 98.01%              |

Classifier:

- **proper-noun** = the lemma has NO lexical (non-name, non-fragment) TBESH
  sub-entry — every sense TBESH records is a personal / place / title name.
- **mechanical** = not proper, not on the held-back denylist, not a
  high-frequency function word, ONE normalized `gloss_en` form covers ≥ 0.85
  of actual occurrences, ≤ 3 recurring senses, AND a clean terse Spanish draft
  was producible (from the vetted `definition_es` head or the curated EN→ES
  map).
- **judgment** = everything else + the denylist + the function-word rule.

### vs. the pre-scoping estimates

|                             | estimate        | actual                         | note                      |
| --------------------------- | --------------- | ------------------------------ | ------------------------- |
| used Hebrew lemmas          | 8,503           | 8503                           | confirmed                 |
| `strongs IS NULL` rows      | ~6,078          | 6078                           | confirmed                 |
| Hebrew word rows            | ~305,008        | 305008                         | confirmed                 |
| proper-noun bucket          | ~2,649          | 2642                           | confirmed (±noise)        |
| mechanical bucket           | ~2,600          | 3190 ready + 211 pending EN→ES | larger — see method note  |
| judgment bucket             | ~3,250          | 2460                           | smaller — see method note |
| lemmas with `definition_es` | ~8,193          | 8193                           | confirmed                 |
| lemmas with NO Spanish      | ~310 (~419 occ) | 310 (419 occ)                  | confirmed                 |

**Method note — why mechanical came out larger than the ~2,600 estimate.**
The estimate predated two things this pipeline added: (1) a **dominant-share test
computed from actual OT usage** (`original_words.gloss_en`), which confirms that
a large class of concrete common nouns/verbs — king, day, house, hand, water,
sword, gold, the cardinal numbers — genuinely carry one sense ≥ 85% of the time;
(2) a **curated in-source EN→ES map** (`TBESH_EN_ES`, 655 lemmas hit)
for exactly that unambiguous vocabulary, which lets those lemmas get a safe terse
gloss instead of being held only for want of a condensable `definition_es`.
Net effect: mechanical holds 19.81% of
running tokens and held-back is 66.38% (the estimate assumed ~73%).
The held-back bucket still contains every genuinely polysemous or weighted word;
the divergence is in the conservative direction (a real gloss where the estimate
expected none), but it is the user's call — raise the `≥ 0.85` threshold or
shrink the map to move the line back.

## The ~310 lemmas with no Spanish text at all

310 used lemmas have no `definition_es` in `strongs-defs-es.json`
(419 occurrences, 0.14% of running tokens). By bucket:

- proper-noun: **46** (get an English placeholder anyway)
- mechanical: **249** (211 still blank — no reviewed EN→ES translation)
- judgment: **15** (held back regardless)

Full list: `hebrew-lemma-gloss-es-review.csv`, filter `definition_es` empty.
First 40 (strongs · translit · bucket · occ):

`H4` ev · mechanical · 3  
`H19` iv.chah · mechanical · 1  
`H55` a.vakh · mechanical · 1  
`H79` a.vaq · mechanical · 2  
`H240` a.zen · mechanical · 1  
`H245` a.zan.yah · proper-noun · 1  
`H250` ez.ra.chi · proper-noun · 1  
`H258` a.chad · mechanical · 1  
`H287` a.chi.mot · proper-noun · 1  
`H318` o.cho.ren · mechanical · 1  
`H332` a.tar · mechanical · 1  
`H353` e.yal · mechanical · 1  
`H360` e.ya.lut · mechanical · 1  
`H363` i.lan · judgment · 6  
`H371` in · mechanical · 1  
`H482` e.lem · mechanical · 1  
`H498` el.u.zay · proper-noun · 1  
`H536` um.lal · mechanical · 1  
`H537` a.me.lal · mechanical · 1  
`H542` a.man · mechanical · 1  
`H598` a.nas · mechanical · 1  
`H632` e.sar · mechanical · 11  
`H633` e.sar · judgment · 7  
`H710` ar.ge.van · mechanical · 1  
`H773` ar.it · mechanical · 1  
`H782` a.re.shet · mechanical · 1  
`H852` at · judgment · 3  
`H866` et.nah · mechanical · 1  
`H867` et.ni · proper-noun · 1  
`H888` be.esh · mechanical · 1  
`H892` ba.vah · mechanical · 1  
`H921` be.dar · mechanical · 1  
`H939` bu.zah · mechanical · 1  
`H950` bu.qah · mechanical · 1  
`H956` but · mechanical · 1  
`H1056` ba.kah · proper-noun · 1  
`H1079` bal · mechanical · 1  
`H1084` bil.gay · proper-noun · 1  
`H1148` be.ni.nu · proper-noun · 1  
`H1159` ba.u · mechanical · 2

## Divine-name / theologically-weighted lemmas — where they landed

Every weighted lemma on the watchlist was kept OUT of the
mechanical bucket, either by the denylist or by a structural rule:

| strongs | translit   | bucket      | occ  | dominant share | tbesh gloss   | proposed |
| ------- | ---------- | ----------- | ---- | -------------- | ------------- | -------- |
| H3068   | ye.ho.vah  | proper-noun | 6516 | 1.00           | LORD          | LORD     |
| H430    | e.lo.him   | judgment    | 2600 | 0.99           | God           | —        |
| H410    | el         | judgment    | 241  | 0.95           | god           | —        |
| H433    | e.lo.ah    | judgment    | 57   | 1.00           | god           | —        |
| H136    | a.do.nai   | judgment    | 440  | 1.00           | Lord          | —        |
| H3069   | ye.ho.vih  | proper-noun | 306  | 1.00           | YHWH/God      | YHWH/God |
| H7706   | shad.day   | judgment    | 48   | 1.00           | Almighty      | —        |
| H2617   | che.sed    | judgment    | 247  | 0.81           | kindness      | —        |
| H1285   | be.rit     | judgment    | 284  | 1.00           | covenant      | —        |
| H8451   | to.rah     | judgment    | 219  | 0.79           | instruction   | —        |
| H7307   | ru.ach     | judgment    | 378  | 0.58           | spirit        | —        |
| H5315   | ne.phesh   | judgment    | 754  | 0.29           | soul          | —        |
| H3519   | ka.vod     | judgment    | 200  | 0.60           | glory         | —        |
| H6664   | tse.deq    | judgment    | 119  | 0.99           | righteousness | —        |
| H6666   | tse.da.qah | judgment    | 157  | 0.99           | righteousness | —        |
| H6944   | qo.desh    | judgment    | 469  | 0.42           | holiness      | —        |
| H2403   | chat.ta.ah | judgment    | 295  | 0.57           | sin           | —        |
| H2398   | cha.ta     | judgment    | 238  | 0.50           | to sin        | —        |
| H3722   | ki.pher    | judgment    | 102  | 0.69           | to atone      | —        |
| H1350   | ga.al      | judgment    | 104  | 0.51           | to redeem     | —        |
| H539    | a.man      | judgment    | 105  | 0.30           | be faithful   | —        |
| H8199   | sha.phat   | judgment    | 202  | 0.80           | to judge      | —        |
| H6588   | pe.sah     | judgment    | 93   | 0.98           | transgression | —        |
| H5771   | a.van      | judgment    | 231  | 0.89           | iniquity      | —        |
| H3444   | ye.shu.ah  | judgment    | 78   | 0.68           | salvation     | —        |
| H3467   | ya.sah     | judgment    | 205  | 0.50           | to save       | —        |
| H7965   | sha.lom    | judgment    | 237  | 0.79           | peace         | —        |
| H2896   | tov        | judgment    | 538  | 0.95           | good          | —        |
| H7451   | ra         | judgment    | 661  | 0.54           | bad           | —        |
| H7225   | re.shit    | judgment    | 51   | 0.43           | first         | —        |
| H1697   | da.var     | judgment    | 1439 | 0.69           | word          | —        |
| H5769   | o.lam      | judgment    | 438  | 0.41           | forever       | —        |
| H3820   | lev        | judgment    | 595  | 0.96           | heart         | —        |

### What the held-back rules actually moved out of "mechanical"

- **denylist** pulled back 19 lemma(s) that otherwise met the
  ≥0.85 / ≤3-senses bar: `H136` (lord), `H410` (god), `H430` (god), `H433` (god), `H530` (faithfulness), `H1285` (covenant), `H2580` (favor), `H2896` (good), `H3468` (salvation), `H3820` (heart), `H3824` (heart), `H5771` (iniquity), `H6588` (transgression), `H6662` (righteou), `H6664` (righteousness), `H6666` (righteousness), `H7356` (compassion), `H7706` (almighty), `H7812` (bow down)
- **function-word rule** (Morph type + ≥ 400 occ) pulled back
  11: `H408`, `H428`, `H589`, `H859`, `H1571`, `H1992`, `H2063`, `H2088`, `H3541`, `H3808`, `H8033`
- **not-condensable guard** demoted 71 candidate(s) whose
  `definition_es` is etymology-first or lexicographer's meta-language with no
  clean terse head (e.g. "partículas ligeras (volátiles)")

### Draft-gloss provenance (mechanical bucket)

- **2535** condensed from the vetted `definition_es` head
- **655** from the in-source curated EN→ES map (`TBESH_EN_ES`) —
  used for concrete common vocabulary and to override an etymology-first
  `definition_es` head that the word never carries in use (e.g. חֶרֶב H2719 →
  "espada", not the Strong's-lead "sequía")
- **211** still blank — a rare word with no `definition_es` and
  no map entry; needs a one-line manual EN→ES translation (trivial scope,
  0.09% of tokens), excluded from the JSON

> **Reviewer caveat.** `definition_es-head` glosses are condensed from
> openscriptures-style Strong's definitions, which occasionally lead with an
> ETYMOLOGICAL sense the word does not carry in use (a def opening "un eje;
> figurativamente, un magnate, príncipe" yields "eje" where the word means
> "señor"). The CSV puts `definition_es` next to `proposed_gloss` on every
> row so these are caught on a skim. The 655 `tbesh-map` glosses
> track the TBESH `Gloss` column (chosen to match primary usage) and do not
> have this failure mode.

## Sample draft glosses (mechanical bucket, spread across the frequency range)

| strongs | translit     | occ  | %tokens | tbesh gloss (EN) | definition_es (head)               | **proposed ES**             | source             |
| ------- | ------------ | ---- | ------- | ---------------- | ---------------------------------- | --------------------------- | ------------------ |
| H4428   | me.lekh      | 2525 | 0.828%  | king             | un rey                             | **rey**                     | tbesh-map          |
| H7243   | re.vi.i      | 56   | 0.018%  | fourth           | cuarto; también (fraccionalmente)… | **cuarto**                  | tbesh-map          |
| H6490   | piq.qud      | 24   | 0.008%  | precept          | o פִּקֻּד; de H6485 (פָּקַד); pro… | **designado**               | definition_es-head |
| H2611   | cha.neph     | 13   | 0.004%  | profane          | manchado (es decir, con pecado),…  | **manchado**                | definition_es-head |
| H3039   | ye.did       | 8    | 0.003%  | beloved          | amado                              | **amado**                   | definition_es-head |
| H8431   | to.che.let   | 6    | 0.002%  | hope             | esperanza (expectación)            | **esperanza**               | definition_es-head |
| H5799   | a.za.zel     | 4    | 0.001%  | Azazel           | macho cabrío de partida; el chivo… | **macho cabrío de partida** | definition_es-head |
| H4947   | mash.qoph    | 3    | 0.001%  | lintel           | un dintel                          | **dintel**                  | definition_es-head |
| H1781   | day.yan      | 2    | 0.001%  | judge            |                                    | **juez**                    | tbesh-map          |
| H5235   | ne.kher      | 2    | 0.001%  | misfortune       | algo extraño, es decir calamidad…  | **algo extraño**            | definition_es-head |
| H8531   | te.lat       | 2    | 0.001%  | third            | (arameo) un rango terciario        | **tercero**                 | tbesh-map          |
| H1465   | ge.vah       | 1    | 0.000%  | back             | la espalda, es decir (por extensi… | **espalda**                 | definition_es-head |
| H2476   | cha.lu.shah  | 1    | 0.000%  | weakness         | derrota                            | **derrota**                 | definition_es-head |
| H3745   | ke.raz       | 1    | 0.000%  | to proclaim      | (arameo) proclamar                 | **proclamar**               | definition_es-head |
| H4595   | ma.a.ta.phah | 1    | 0.000%  | overtunic        | una capa                           | **capa**                    | definition_es-head |
| H5451   | sib.bo.let   | 1    | 0.000%  | stream           | una espiga de grano                | **espiga de grano**         | definition_es-head |
| H6608   | pe.tach      | 1    | 0.000%  | opening          | apertura (figuradamente), es deci… | **apertura**                | definition_es-head |
| H7571   | re.tach      | 1    | 0.000%  | boiling          | una hervura                        | **hervura**                 | definition_es-head |

## Sample proper-noun placeholders (need the RVR1960 spelling pass)

| strongs | translit       | occ  | TBESH English | RVR1960 target (illustrative) |
| ------- | -------------- | ---- | ------------- | ----------------------------- |
| H3068   | ye.ho.vah      | 6516 | LORD          | _(e.g. Jehová / SEÑOR)_       |
| H3478   | yis.ra.el      | 2505 | Israel        | _(e.g. Israel)_               |
| H1732   | da.vid         | 1000 | David         | _(e.g. David)_                |
| H3063   | ye.hu.dah      | 819  | Judah         | _(e.g. Judá)_                 |
| H4872   | mo.sheh        | 765  | Moses         | _(e.g. Moisés)_               |
| H3389   | ye.ru.sha.laim | 643  | Jerusalem     | _(e.g. Jerusalén)_            |
| H4714   | mits.ra.yim    | 641  | Egypt         | _(e.g. Egipto)_               |
| H7586   | sha.ul         | 401  | Saul          | _(e.g. Saúl)_                 |

## gloss_en normalization — before / after audit

The dominant-share test depends on collapsing TAHOT's inflected contextual
glosses to a bare head form. Spot-check that the merges are sane (a wrong merge
inflates a lemma's dominant share and could mis-file it as mechanical):

| strongs | occ  | bucket      | dominant | top 5 normalized forms (form·count)                             |
| ------- | ---- | ----------- | -------- | --------------------------------------------------------------- |
| H1      | 1213 | judgment    | 0.63     | father·764 , ancestor·424 , parent·17 , ancestor its·3 , abi·2  |
| H2      | 9    | mechanical  | 1.00     | father·9                                                        |
| H6      | 184  | judgment    | 0.47     | perish·86 , destroy·67 , lost·22 , certain·4 , caus to stray·1  |
| H14     | 54   | mechanical  | 0.91     | will·49 , yield·3 , will descendant·1 , yield to·1              |
| H24     | 8    | judgment    | 0.75     | abib·6 , young barley ear·2                                     |
| H26     | 17   | proper-noun | 1.00     | abigail·17                                                      |
| H29     | 25   | proper-noun | 1.00     | abijah·25                                                       |
| H30     | 12   | proper-noun | 1.00     | abihu·12                                                        |
| H34     | 61   | mechanical  | 0.98     | needy·60 , needy its·1                                          |
| H40     | 66   | proper-noun | 0.98     | abimelech·65 , against abimelech·1                              |
| H41     | 12   | proper-noun | 1.00     | abinadab·12                                                     |
| H47     | 17   | mechanical  | 0.94     | mighty·16 , mighty its·1                                        |
| H48     | 11   | proper-noun | 1.00     | abiram·11                                                       |
| H52     | 25   | proper-noun | 0.96     | abishai·24 , abshai·1                                           |
| H53     | 110  | proper-noun | 0.98     | absalom·108 , abishalom·2                                       |
| H54     | 30   | proper-noun | 1.00     | abiathar·30                                                     |
| H56     | 39   | judgment    | 0.69     | mourn·27 , dri up·5 , dry up·3 , caus mourn·1 , caus to mourn·1 |
| H57     | 8    | judgment    | 0.63     | mourner·5 , mourn·3                                             |
| H60     | 24   | mechanical  | 1.00     | mourn·24                                                        |
| H61     | 11   | judgment    | 0.64     | but·7 , ind·4                                                   |
| H62     | 12   | proper-noun | 0.33     | maacah·4 , beth·4 , abel·3 , abel toward·1                      |
| H68     | 273  | mechanical  | 0.92     | ston·251 , weight·13 , ston its·8 , one of ston·1               |
| H69     | 8    | mechanical  | 0.88     | ston·7 , ston the·1                                             |
| H73     | 9    | mechanical  | 1.00     | sash·9                                                          |
| H74     | 63   | proper-noun | 1.00     | abner·63                                                        |
| H85     | 175  | proper-noun | 1.00     | abraham·175                                                     |

## Files

- `DOCS/drafts/hebrew-lemma-gloss-es.draft.json` — 5832 entries
  (3190 mechanical Spanish + 2642 proper-noun English placeholders)
- `DOCS/drafts/hebrew-lemma-gloss-es-review.csv` — 8503 rows, one per used lemma
- `scripts/build-hebrew-lemma-gloss-es.js` — this pipeline

## Licensing

Source is the STEPBible **TBESH** file (CC BY 4.0). Only the **`Gloss`** column
(index 6) is read; the **`Meaning`** column (index 7, Abridged BDB / Online
Bible, separate permission required) is firewalled — every data row is parsed as
`line.split('\t').slice(0, 7)` so index 7 never exists in memory, and the
column identity is asserted from the file's own header before parsing. The TBESH
file and `originals.db` are cached outside the repo and never committed.
