---
name: eleccion-orchestrator-review
scope: ORCHESTRATOR-authored parts only — glossEs, Section 1, Section 4 (+ whole-entry coherence)
file reviewed: DOCS/drafts/eleccion-integrated-draft.md @ content/dictionary-eleccion-multiview (commit 208ee45)
reviewer: orchestrator-sections review agent
date: 2026-08-27
NOT for merge. Advisory only.
---

# ELECCIÓN — review of orchestrator sections (gloss + Sec. 1 + Sec. 4)

## VERDICT

**SOUND. No blockers.** Ship after the SHOULD-FIX items. The connective tissue is
genuinely even-handed, the citation sweep is clean, and the history checks out
against Britannica / Wikipedia / Christian History. Two SHOULD-FIX items (one is a
mechanical porting hazard the draft already warns about; one is a factual slip in
Sec. 1). Everything else is NICE-TO-HAVE polish.

---

## 0. STALE PREMISE — read first

The task brief states Section 1 "currently say[s] '2. reformada / 3. arminiana'" in
a header block and a numbered plan, and asks for an enumeration of every spot to
flip if arminian-first is chosen.

**That is not true of the current draft (208ee45).** Section 1's body contains **no
numbered plan and no section-number references to the two traditions at all.** The
"Cómo leer lo que sigue" paragraph is fully order-agnostic ("Las dos secciones
siguientes presentan cada tradición desde dentro... Lo que ambas confiesan en común
se recoge al final"). It was very likely already fixed in 208ee45.

**Only two things carry the section order:**

1. The two section headers — line 43 `## Sección 2 — "La tradición arminiana y wesleyana"` and line 91 `## Sección 3 — "La tradición reformada (calvinista)"`.
2. Status-note line 15 (`Orden de secciones 2 vs 3: PROPUESTO arminiana primero...`).

If the order flips to reformed-first, change those two places (swap header numbers +
reorder the two blocks; update line 15). Cosmetic: reorder status-note lines 13-14.
**Section 1 prose needs no change** (unless you add the optional ordering-principle
clause in NICE-TO-HAVE #6).

---

## SEVERITY-TAGGED FINDINGS

### BLOCKER

None.

### SHOULD-FIX

**S-1. Italic emphasis spans are underscore-delimited; app parser won't render them.**
The draft's own status note warns: _"el parser de la app NO reconoce `_guion_bajo_`...
al portear al JSON hay que volver a asterisco."_ All italic spans in the orchestrator
sections are currently `_..._`. If the JSON port misses any, they ship as literal
underscores in-app. **Exhaustive list for gloss + Sec. 1 (Sec. 4 has none):**

| line       | span                                     |
| ---------- | ---------------------------------------- |
| 23 (gloss) | `_cómo_`                                 |
| 29 (Sec.1) | `_elección_`                             |
| 29 (Sec.1) | `_sobre qué base_`                       |
| 29 (Sec.1) | `_de qué manera_`                        |
| 31 (Sec.1) | `_La esclavitud de la voluntad_`         |
| 31 (Sec.1) | `_Institución de la religión cristiana_` |
| 31 (Sec.1) | `_Remonstrancia_`                        |

That is **7 spans** (the bold `**headers**` are fine — the app does read `**`).
Fix: convert these 7 to `*...*` when porting to JSON, or now in the .md and set
prettier to leave them. Mechanical, but it's a written-down hazard — enumerating it
is what stops it slipping through.

**S-2. Sec. 1 — Arminius was pastor in Amsterdam, not Leiden.**
Line 31: _"Jacobo Arminio (1560-1609), pastor y profesor de teología en Leiden
(Países Bajos)"_. Arminius pastored in **Amsterdam (1588–1603)**; he was professor of
theology at **Leiden (1603–1609)**. As written, "pastor ... en Leiden" is a factual
error in a section that must be rigorous. (Sources: Britannica; EBSCO; New World
Encyclopedia — all agree.)
Minimal fix: _"...Jacobo Arminio (1560-1609), pastor en Ámsterdam y luego profesor de
teología en Leiden (Países Bajos), llegó a cuestionar..."_ — or simply drop "pastor
y" and keep "profesor de teología en Leiden".

### NICE-TO-HAVE

**N-1. Sec. 4 — Jn 3:5 "de agua" is one of the two most baptism-contested verses in
the NT, used in the one section whose whole job is that nobody winces.** Line 129's
only two proof texts are Jn 3:5 (_"de agua y del Espíritu"_) and Tit 3:5 (_"lavamiento
de la regeneración"_) — the two verses low-church readers most associate with
baptismal regeneration. **The prose does NOT smuggle sacramentalism** — the bullet's
gloss is _"La vida nueva la da Dios; no la produce el esfuerzo humano"_, which reads
the verses for Spirit-birth, not baptism. So this is not a neutrality breach. But
given it sits exactly on Victor's hard constraint, **this is a call for Victor, not
the reviewer.** Minimal fix if he wants it softened: **add** a third, un-contested
text rather than replace either — Jn 1:13 is ideal (RVR1960: _"los cuales no son
engendrados de sangre, ni de voluntad de carne, ni de voluntad de varón, sino de
Dios"_ — verbatim-verified, and it says outright "not of human will, but of God").

**N-2. Sec. 4 — header "La seguridad de la salvación es para consolar..."** (line 133)
may mildly jar a classical Arminian, whose final security is by their own account
conditional. The _body_ of the bullet is genuinely shared ground (both call the
believer to persevere, to use the means of grace, "a hacer firme su vocación y
elección"). Minimal fix: retitle to something about the _purpose_ of assurance, e.g.
_"La certeza que da el evangelio consuela; no envanece ni hace desesperar."_

**N-3. Sec. 1 — "muchos bautistas" appears on BOTH denominational lists** (line 37:
Reformed line "muchos bautistas"; Arminian line "muchas iglesias bautistas y
libres"). This is **accurate and actually good for neutrality** — the divide runs
_through_ denominations, not between them — but unacknowledged it looks like an
oversight. Minimal fix: one clause, e.g. _"...la línea divisoria atraviesa incluso a
los bautistas, presentes en ambos lados."_

**N-4. Sec. 1 — "la iglesia reformada neerlandesa convocó el Sínodo de Dort".**
The convocation was formally issued by the **States-General** (civil government),
though it _was_ the national synod of the Dutch Reformed Church. Slight imprecision.
Minimal fix: _"...se convocó el Sínodo de Dort (1618-1619)"_ or _"...la iglesia
reformada neerlandesa reunió su sínodo nacional en Dort"_.

**N-5. Sec. 1 vs Sec. 3 — "cinco capítulos de doctrina".**
Sec. 1 line 33 says the Canons are _"ordenados en cinco 'capítulos de doctrina'"_;
Sec. 3 line 93 says _"cinco Capítulos de la Doctrina (el tercero y el cuarto
unidos)"_. Not contradictory (five heads of doctrine, 3rd+4th share one section) but
Sec. 1 omits the merge. Minimal fix: add _"(el tercero y el cuarto van unidos)"_ to
Sec. 1 for consistency. Not wrong as-is.

**N-6. Named theologians — add ONE balanced sentence to Sec. 1.**
Only the founders survive anywhere in the entry (Calvino, Arminio, + Wesley, Lutero).
The later systematizers (Hodge, Boyce, Turretín / Episcopio, Watson, Miley) appear
**nowhere** — but symmetrically, so this is **not a neutrality defect**, only a
depth/credibility question for a premium entry. Recommendation: add one descriptive
sentence to "Quién sostiene cada postura" (after "...han estado en cada lado."), e.g.
_"Entre quienes han expuesto cada tradición se cuentan, en la línea reformada,
Francisco Turretín, Charles Hodge y —entre los bautistas— James P. Boyce; y en la
línea arminiana y wesleyana, Simón Episcopio, Richard Watson y John Miley."_
**Must stay equal weight on both sides.** Name-Hispanicization is the author's call
(the doc Hispanicizes only the most famous Reformation names).

**N-7. Whitefield/Wesley anecdote — optionally add the funeral-sermon fact.**
The anecdote (Sec. 4, closing) is factually sound as written (see §2 below). The
single most vivid, verifiable proof of the reconciliation — _Wesley preached
Whitefield's funeral sermon, at Whitefield's own request, in 1770_ — is not
mentioned. Optional add for concreteness.

**N-8. Gloss — doubled "y".** _"la reformada (calvinista) y la arminiana y wesleyana"_
reads awkwardly. Consider _"la arminiana-wesleyana"_. Cosmetic.

---

## DETAIL BY CHECK ITEM

### 1. Neutrality of Section 4 — PASS

All six common-ground bullets hold for **both** classical Calvinism and classical
Arminianism, in terms a Baptist/Pentecostal/non-denom evangelical affirms without
wincing:

- **"La salvación es enteramente de gracia"** — sola gratia, both sides. Ef 2:8-9. OK.
- **"El ser humano caído no puede salvarse solo"** — see item 4 finding below;
  the "arminianismo clásico ... con tanta firmeza" claim is FAIR and documented.
- **"El nuevo nacimiento es obra del Espíritu Santo"** — regeneration is God's work,
  both sides. See N-1 re proof-text choice (not a breach).
- **"El evangelio se ofrece de veras a todos"** — the well-meant offer. Backed by the
  entry's own Sec. 3 (_"el evangelio debe predicarse y ofrecerse sin distinción...
  (Dort II.5)"_) and by Dort III/IV.8 ("unfeignedly called"). Mainstream classical
  Calvinism affirms this; only hyper-Calvinism denies it. OK.
- **"La seguridad de la salvación es para consolar..."** — see N-2 (header only;
  body is shared).
- **"Lo esencial de la fe cristiana no está en juego"** — Trinity, deity/bodily
  resurrection of Christ, justification by faith, authority of Scripture. Clearly
  true; reinforces the in-family framing. OK.

**Positive findings worth stating:**

- Sec. 4 **deliberately drops "los sacramentos"** that Sec. 3 enumerates
  (Sec. 3 line 113: _"los medios que Dios señaló —su Palabra, la oración, los
  sacramentos—"_) and writes _"los medios que Dios ha dado"_ (line 133). The hard
  constraint is being **actively handled**, not accidentally satisfied.
- **No Sec. 4 bullet overstates the agreement.** Nothing claims consensus on the
  extent of the atonement or on whether a true believer can finally fall away — the
  two real disputes. The section is correctly scoped.
- No contrast anywhere against Rome / Orthodoxy. Contrast is strictly the two
  Protestant traditions. Hard constraint satisfied.

### 2. Whitefield / Wesley anecdote — ACCURATE, no material embellishment

Verified (Christianity Today / Christian History Institute / Wesley Center):

- Friends from Oxford; fellow-laborers in the 18th-c. Evangelical Revival. OK.
- Disagreed publicly on predestination — Wesley's 1739 sermon _Free Grace_, the 1741
  breach — and **never resolved it**. "discreparon con franqueza ... durante toda su
  vida" is fair (≈1739 to Whitefield's death 1770). OK.
- "agreed to differ, and still to love one another"; the 1741 dispute never again
  interrupted their mutual esteem. Whitefield willed each Wesley brother a mourning
  ring "in token of my indissoluble union with them ... notwithstanding our
  difference in judgment". "siguieron reconociéndose como hermanos en Cristo y
  colaboradores" — accurate.
- (Not in draft: Wesley preached Whitefield's funeral sermon at Whitefield's request, 1770. See N-7.)

The draft does not claim zero friction, only that they kept recognizing each other as
brothers across the arc — which is the accepted history. No embellishment to remove.

### 3. Section 1 history / dates — MOSTLY PASS (one error: S-2)

| claim                                                                  | verdict                                      |
| ---------------------------------------------------------------------- | -------------------------------------------- |
| Luther, _De servo arbitrio_ / _La esclavitud de la voluntad_, 1525     | OK (Dec 1525, reply to Erasmus 1524)         |
| Calvin, _Institutio_ (no date given)                                   | OK                                           |
| Arminio 1560–1609                                                      | OK                                           |
| Arminio "profesor de teología en Leiden"                               | OK (1603–1609)                               |
| Arminio "pastor ... en Leiden"                                         | **WRONG — pastored in Amsterdam. See S-2.**  |
| Remonstrance 1610, 5 articles, after Arminius's death, "remonstrantes" | OK                                           |
| Synod of Dort 1618–1619                                                | OK                                           |
| "la iglesia reformada neerlandesa convocó"                             | imprecise — States-General convoked. See N-4 |
| Canons rejected the 5 articles; "cinco capítulos de doctrina"          | OK (see N-5 re the 3rd/4th merge)            |
| remonstrant ministers deposed                                          | OK (~200 deprived of office, ~80 banished)   |
| Wesley 1703–1791, Methodism, "Arminian Magazine" era                   | OK                                           |

### 4. Section 1 fairness — PASS

- Correctly separates **not in dispute** (Scripture speaks of election; salvation by
  grace, not merit — Dt 7:6-8, Ro 8:33, Col 3:12, Ef 1:4, Ro 11:5) from **in
  dispute** (_"sobre qué base y de qué manera Dios elige, y qué consecuencias
  tiene"_). Clean.
- Frames both in language each side accepts: _"cuestionar la forma en que se enseñaba
  entonces la predestinación"_ — accurate (Arminius critiqued high/Bezan Calvinism
  and the _manner_ of teaching, not predestination as such); _"en su propia iglesia
  reformada"_ — fair to Arminians (he never left it).
- "Cómo surgió el debate" presents Reformed origins first — historically correct
  (Arminianism arose as a critique of established Reformed teaching); both sides
  accept this narrative.
- **"Quién sostiene cada postura"** — denominational mapping is accurate: Reformed
  line = most Presbyterian/Reformed, many (Reformed) Baptists, puritan-rooted
  evangelicalism; Arminian-Wesleyan line = Methodist/Holiness, Salvation Army, much
  of Pentecostalism, Free Will / General Baptists and free churches. Balanced closer
  ("Predicadores fieles del evangelio han estado en cada lado"). See N-3 re Baptists
  on both lists.

### 5. Every Bible citation in gloss + Sec. 1 + Sec. 4 — ALL VERIFIED

Checked against `assets/bible-seed.db`, `version='RVR1960'`, via `node:sqlite`.

| ref      | where        | quoted text                                                                                                       | verdict                                                                                               |
| -------- | ------------ | ----------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| Ef 1:4   | gloss, Sec.1 | "nos escogió en él antes de la fundación del mundo"                                                               | verbatim substring — OK                                                                               |
| Ro 8:28  | gloss        | "conforme a su propósito"                                                                                         | verbatim substring — OK                                                                               |
| Dt 7:6-8 | Sec.1        | allusion (no quote) — "no por su grandeza... sino porque los amó"                                                 | accurate to text — OK                                                                                 |
| Ro 8:33  | Sec.1        | "escogidos de Dios"                                                                                               | verbatim substring — OK                                                                               |
| Col 3:12 | Sec.1        | "escogidos de Dios"                                                                                               | verbatim substring — OK                                                                               |
| Ro 11:5  | Sec.1        | "ha quedado un remanente escogido por gracia"                                                                     | verbatim substring — OK                                                                               |
| Ef 2:8-9 | Sec.4        | "Por gracia sois salvos... para que nadie se gloríe"                                                              | verbatim; leading "Porque" dropped + "Por" capitalised (house style, see note) — OK                   |
| Jn 6:44  | Sec.4        | allusion (no quote)                                                                                               | supports "lo atraiga" — OK                                                                            |
| Ef 2:1   | Sec.4        | allusion (no quote)                                                                                               | supports "caído no puede" — OK                                                                        |
| Jn 3:5   | Sec.4        | "El que no naciere de agua y del Espíritu, no puede entrar en el reino de Dios"                                   | verbatim substring ("El" capitalised); see N-1                                                        |
| Tit 3:5  | Sec.4        | "nos salvó... por su misericordia, por el lavamiento de la regeneración y por la renovación en el Espíritu Santo" | verbatim; "..." correctly marks the omission of "no por obras... sino" — OK                           |
| 2 P 1:10 | Sec.4        | allusion, **no quotation marks**, 3rd person ("hacer firme su vocación y elección")                               | **KNOWN FIX CONFIRMED APPLIED.** RVR1960 reads "vuestra"; prose is 3rd person; correctly an allusion. |

**The 2 P 1:10 fix is the only citation issue that ever existed in these sections, and
it is resolved.** No other non-verbatim quote, no unresolved ref.

House-style note (not a defect): several quotes across the whole entry drop a leading
conjunction and re-capitalise without an ellipsis (Ef 2:8-9 "Porque"→"Por"; Jn 3:5
"que el que"→"El que"; and the same in Sec. 2/3). Consistent throughout; the quoted
words themselves are verbatim. Acceptable. Flag only if strict verbatim-with-ellipsis
is the house rule.

### 6. Redundancy vs trimmed closers / named theologians

The tradition sections' "who holds this" recaps were trimmed because Sec. 1 covers
denominations — **Sec. 1 does cover that ground** ("Quién sostiene cada postura").
Named post-founding theologians now appear nowhere, **symmetrically on both sides**,
so no neutrality problem. **Recommendation: add N-6** (one balanced sentence in
Sec. 1). Do it — cheap, factual, adds credibility to a premium entry — but keep it
equal weight both sides.

### 7. Gloss — PASS

- Even-handed: both view-clauses stated in acceptable terms; the Arminian clause is
  guarded against the semi-Pelagian caricature (_"su elección contempla de antemano
  la fe que Él mismo hace posible"_).
- Does not adjudicate: _"Esta entrada presenta cada postura en sus propios términos,
  sin arbitrar entre ellas."_
- No jargon — "monergismo" does not appear; "incondicionalmente" is plain.
- Layperson-readable. OK.
- Minor: see N-8 (doubled "y").

### 8. Whole-entry coherence — PASS

- Terminology consistent: "arminiana y wesleyana" in gloss / Sec. 1 / Sec. 2 header /
  Sec. 2 body; Sec. 4 uses "arminianismo clásico" once and "ambas tradiciones" —
  consistent.
- Hispanicisation consistent: Juan Calvino, Juan Wesley, Jacobo Arminio, Martín
  Lutero, Jorge Whitefield.
- Citation style consistent within each section ("(Ef 1:4)", "(Remonstrancia de 1610,
  art. 1)", "(Dort I.6-7)").
- "Cómo leer lo que sigue" **accurately previews** the structure: each tradition from
  within / in its own document order / common ground at the end. Matches Sec. 2, 3, 4.
- Sec. 1 is **order-agnostic** (see §0).

---

## ORDER QUESTION (Section 2 vs 3) — recommendation: KEEP arminian-first

Recommend **Sec. 2 = Arminian, Sec. 3 = Reformed** (current draft).

**Rationale (one strong reason):** order the two positions by the controversy's own
documents — the **Remonstrance (1610) precedes the Canons of Dort (1619)**, and Dort
was convened _specifically to judge the Remonstrance_. That is a neutral, statable
editorial principle that does not privilege either side.

**Counter-consideration for Victor:** reformed-first would match "the position being
critiqued comes first" and the app's Reformed-rooted core readership — but placing
the Reformed section last, immediately before "what they confess together", carries a
mild "home-team gets the last word" tilt. Neither order is perfectly neutral; the
document-chronology rationale is the cleanest tiebreak.

**Optional (N-6-style) neutraliser:** add one clause to "Cómo leer lo que sigue"
stating the principle — e.g. _"Se presentan primero los cinco artículos de la
Remonstrancia (1610) y después los Cánones de Dort (1619), en el orden en que se dio
la controversia."_ — which converts the order into an obviously-neutral choice.

**If Victor chooses reformed-first**, the flip touches only: (1) swap header numbers

- block order at lines 43 and 91; (2) status-note line 15; (3) cosmetic: status-note
  lines 13-14. **Section 1 prose needs no change.**
