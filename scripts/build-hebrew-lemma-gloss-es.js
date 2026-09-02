/**
 * 📜 build-hebrew-lemma-gloss-es — DECISION-SUPPORT ARTIFACT pipeline for "A3".
 *
 * A3 (PROPOSED, not built): show a terse SPANISH inline gloss under every Hebrew
 * word in the Old-Testament word list. Today those inline glosses still render
 * the English `gloss_en` from the originals pack, because TAHOT (the Hebrew
 * source) carries no Spanish gloss column — unlike TAGNT (Greek). Tapping a word
 * already shows the faithful Spanish `definition_es`; the only gap A3 fills is
 * the one-line at-a-glance gloss.
 *
 * THIS SCRIPT DOES NOT BUILD THE FEATURE. It produces the review artifacts the
 * user will look at before deciding scope:
 *   - DOCS/drafts/hebrew-lemma-gloss-es.draft.json   (safe buckets only)
 *   - DOCS/drafts/hebrew-lemma-gloss-es-review.csv    (one row per used lemma)
 *   - DOCS/drafts/hebrew-lemma-gloss-es-STATS.md      (bucket + coverage report)
 *
 * ── SOURCES ────────────────────────────────────────────────────────────────
 *   1. originals.db (STEPBible TAHOT + openscriptures Strong's, CC BY / PD) —
 *      the built study pack. `original_words` gives per-occurrence contextual
 *      `gloss_en`; that distribution per Strong's is how polysemy is measured.
 *      NOT committed (32.7 MB download). Path via argv[2], default
 *      ~/Desktop/originals-pack/originals.db.
 *   2. STEPBible TBESH — "Translators Brief lexicon of Extended Strongs for
 *      Hebrew", CC BY 4.0, github.com/STEPBible/STEPBible-Data. Downloaded to
 *      an OS temp cache (the file's own licence: "do not redistribute it
 *      yourself"), NEVER copied into the repo.
 *
 *      ⚠️ LICENSING FIREWALL — the TBESH `Meaning` column (index 7) is Abridged
 *      BDB by Online Bible and needs separate permission this project does not
 *      have. This script reads the `Gloss` column (index 6) ONLY. Every data
 *      row is parsed as `line.split('\t').slice(0, 7)` so index 7 does not even
 *      exist in memory. The column identity is asserted from the file's own
 *      header text before any data row is read.
 *   3. scripts/strongs-defs-es.json — OUR faithful Spanish translations of the
 *      public-domain openscriptures Strong's definitions (already vetted, grown
 *      batch by batch). The preferred source for a mechanical draft gloss.
 *
 * ── CLASSIFIER (3 buckets) ─────────────────────────────────────────────────
 *   proper-noun   TBESH Morph marks the lemma a proper noun (`N:` prefix).
 *                 Emit the TBESH English form + a flag; an RVR1960-conventional
 *                 Spanish spelling pass (Ezequías, not Hezekiah) comes LATER.
 *   mechanical    Not proper, not on the held-back denylist, ONE normalized
 *                 `gloss_en` form covers >= 0.85 of occurrences, <= 3 recurring
 *                 senses, and a clean Spanish draft could be produced. Safe to
 *                 auto-assign a per-lemma default.
 *   judgment      Everything else — polysemous, theologically weighted, or a
 *                 high-frequency grammatical word. Listed for human drafting,
 *                 NOT auto-assigned, NOT in the JSON.
 *
 * Requires Node >= 22 (node:sqlite). Usage:
 *   node scripts/build-hebrew-lemma-gloss-es.js [originalsDbPath]
 *
 * Para la gloria de Dios Todopoderoso ✨
 */
'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const {execFileSync} = require('child_process');
const {DatabaseSync} = require('node:sqlite');

const ROOT = path.resolve(__dirname, '..');
const OUT_DIR = path.join(ROOT, 'DOCS', 'drafts');
const ES_JSON = path.join(__dirname, 'strongs-defs-es.json');
const ORIGINALS_DB =
  process.argv[2] ||
  path.join(os.homedir(), 'Desktop', 'originals-pack', 'originals.db');

const CACHE = path.join(os.tmpdir(), 'hebrew-lemma-gloss-src');
const TBESH_FILE = path.join(CACHE, 'TBESH.txt');
const TBESH_URL =
  'https://raw.githubusercontent.com/STEPBible/STEPBible-Data/master/Lexicons/' +
  encodeURIComponent(
    'TBESH - Translators Brief lexicon of Extended Strongs for Hebrew - STEPBible.org CC BY.txt',
  );

// ── Strong's normalisation — MUST match build-originals-pack.js so the join
//    against the pack's already-normalised `original_words.strongs` is exact. ──
function normalizeStrongs(raw) {
  if (!raw) return null;
  const m = raw
    .replace(/[{}]/g, '')
    .trim()
    .match(/^([HG])0*(\d+)/);
  if (!m) return null;
  const lang = m[1];
  const num = parseInt(m[2], 10);
  if (!num) return null;
  if (lang === 'H' && num >= 9000) return null;
  return `${lang}${num}`;
}

/** "H0001G" → "H1G", "H0834" → "H834" — for comparing a dStrong token to a base. */
function stripZeros(tok) {
  return (tok || '').trim().replace(/^([HG])0+(\d)/, '$1$2');
}

// ── HELD-BACK denylist ─────────────────────────────────────────────────────
// Forced into `judgment` no matter how dominant one gloss_en form is. Three
// groups; STATS.md reports which lemmas this actually pulled out of mechanical.
const DENYLIST = new Set([
  // (a) task-specified: object marker, top prepositions/relatives/particles,
  //     "to be" / "to say", and the theologically weighted core.
  'H853',
  'H5921',
  'H413',
  'H834',
  'H3605',
  'H3588',
  'H1961',
  'H559',
  'H1285',
  'H2617',
  'H8451',
  'H5315',
  'H7307',
  'H3519',
  'H6664',
  'H6666',
  // (b) divine names & titles — a gloss here is never "mechanical".
  'H430',
  'H433',
  'H410',
  'H136',
  'H3068',
  'H3069',
  'H7706',
  'H5945',
  'H136',
  'H6635',
  // (c) soteriological / cultic / anthropological core — "sense of the whole"
  //     carries doctrine (nephesh, ruach, lev, chesed, torah …).
  'H6944',
  'H2403',
  'H2398',
  'H3722',
  'H1350',
  'H1353',
  'H6662',
  'H6663',
  'H539',
  'H530',
  'H8199',
  'H4941',
  'H4397',
  'H5771',
  'H6588',
  'H5162',
  'H3444',
  'H3468',
  'H7965',
  'H2896',
  'H7451',
  'H1697',
  'H7223',
  'H3820',
  'H3824',
  'H7355',
  'H7356',
  'H2580',
  'H7812',
  'H5647',
  'H3372',
]);

// (d) high-frequency grammatical words are held back structurally, by TBESH
//     morph Type + occurrence count (see classify()). These morph Types are
//     function-word classes; a frequent member of one steers the reading of a
//     clause, so a single default gloss is unsafe.
const FUNCTION_MORPH_TYPES = new Set([
  'Prep',
  'Conj',
  'Cond',
  'Cor',
  'Intg',
  'Neg',
  'RelP',
  'DemP',
  'ImpP',
  'PerP',
  'PosP',
  'RefP',
  'Part',
  'Adv',
]);
const FUNCTION_HOLD_MIN_OCC = 400;

// Divine-name / theologically-weighted watchlist for the STATS breakdown
// (superset of the denylist's weighted members + a few worth eyeballing).
const WEIGHTED_WATCH = [
  'H3068',
  'H430',
  'H410',
  'H433',
  'H136',
  'H3069',
  'H7706',
  'H2617',
  'H1285',
  'H8451',
  'H7307',
  'H5315',
  'H3519',
  'H6664',
  'H6666',
  'H6944',
  'H2403',
  'H2398',
  'H3722',
  'H1350',
  'H539',
  'H8199',
  'H6588',
  'H5771',
  'H3444',
  'H3467',
  'H7965',
  'H539',
  'H2896',
  'H7451',
  'H7225',
  'H1697',
  'H5769',
  'H3820',
  'H5315',
];

// ── gloss_en normalisation ─────────────────────────────────────────────────
// TAHOT's per-occurrence gloss_en is CONTEXTUAL and inflected: "in [the]
// beginning of", "God your", "and he created", "covenant loyalti<es> of". To
// tell whether ONE sense dominates we have to strip the inflectional
// scaffolding down to a bare head form. This is a heuristic feeding a REVIEW
// csv a human checks — not a linguistic claim. STATS.md prints a before/after
// audit so the merges are visible.
const LEAD_STOP = new Set([
  'and',
  'to',
  'for',
  'in',
  'of',
  'on',
  'o',
  'a',
  'an',
  'the',
  'at',
  'with',
  'from',
  'as',
  'according',
  'by',
  'into',
  'unto',
  'upon',
  'some',
  'that',
  'not',
  'no',
  'do',
  'did',
  'does',
  'so',
  'then',
  'when',
  'who',
  'which',
  'like',
  'than',
  'more',
  'about',
]);
const SUBJ_PRON = new Set(['he', 'she', 'it', 'i', 'we', 'you', 'they']);
const AUX = new Set([
  'have',
  'has',
  'had',
  'been',
  'being',
  'be',
  'am',
  'is',
  'are',
  'was',
  'were',
  'will',
  'shall',
  'may',
  'let',
  'would',
  'should',
  'can',
  'could',
  'must',
  'might',
  'going',
]);
const TRAIL_PRON = new Set([
  'his',
  'her',
  'my',
  'your',
  'our',
  'their',
  'them',
  'him',
  'it',
  'you',
  'us',
  'me',
  'they',
  'she',
  'he',
]);

/** Light suffix stemmer — collapses English tense/number on the head words so
 *  "create / created / creates / creating" and "stone / stones" count as one
 *  form. Deliberately crude; it feeds a share heuristic, not a parser. */
function stem(w) {
  if (w.length <= 3) return w;
  let s = w.toLowerCase();
  s = s.replace(/ies$/, 'y');
  s = s.replace(/(sses|shes|ches|xes)$/, m => m.slice(0, -2));
  s = s.replace(/([^s])s$/, '$1');
  s = s.replace(/(ing|edly|edness|ed|eth|est|en|ly)$/, '');
  s = s.replace(/e$/, '');
  if (s.length < 2) return w;
  return s;
}

function normGloss(raw) {
  if (!raw) return '';
  let s = String(raw).toLowerCase();
  // Angle/round/square markup: TAHOT uses <..> and [..] BOTH for standalone
  // helper words ("<the>", "[obj.]", "[am]") AND for an English morpheme glued
  // to the previous word ("loyalti<es>", "god<s>"). Join the glued form, drop
  // the standalone one.
  s = s.replace(/([a-z])[<[]([a-z]{1,3})[>\]]/g, '$1$2');
  s = s.replace(/<[^>]*>/g, ' ').replace(/\[[^\]]*\]/g, ' ');
  s = s.replace(/\([^)]*\)/g, ' ');
  s = s.replace(/[^a-z\s-]/g, ' ');
  s = s.replace(/\s+/g, ' ').trim();
  let toks = s.split(' ').filter(Boolean);
  // strip leading fillers / subject pronouns / auxiliaries (iterative)
  let changed = true;
  while (changed && toks.length > 1) {
    changed = false;
    const t = toks[0];
    if (LEAD_STOP.has(t) || SUBJ_PRON.has(t) || AUX.has(t)) {
      toks.shift();
      changed = true;
    }
  }
  // strip trailing possessive/object pronouns + trailing construct "of"
  changed = true;
  while (changed && toks.length > 1) {
    changed = false;
    const t = toks[toks.length - 1];
    if (TRAIL_PRON.has(t) || t === 'of') {
      toks.pop();
      changed = true;
    }
  }
  return toks.map(stem).join(' ').trim();
}

// ── definition_es → terse head-sense draft gloss ───────────────────────────
// The Spanish is already vetted; we only condense it. If the head still reads
// like lexicographer's meta-language (openscriptures style: "en el sentido
// ordinario", "por implicación", ...) it is NOT a safe at-a-glance gloss —
// reject and let a human draft it.
const META_LANGUAGE =
  /(en el sentido|por implicaci[óo]n|espec[íi]ficament\w*|espec[íi]fic[oa]s?|propiament\w*|es decir|figurad\w*|figurativ\w*|literalment\w*|\bliteral\b|por extensi[óo]n|por analog[íi]a|en abstracto|\babstract[oa]\b|usad[oa] (?:especialmente|espec[íi]ficamente|como|en|para|de)|denominativ\w*|primitiv[oa]|una ra[íi]z|patron[íi]mic\w*|gentilici\w*|(?:de|con) origen extranjero|correlativ[oa]|part[íi]cula|conjunci[óo]n|preposici[óo]n)/i;

function headSense(defEs) {
  if (!defEs) return null;
  let s = String(defEs).trim();
  // Drop a leading etymology clause. openscriptures Hebrew defs very often lead
  // with "de H#### (עִבְרִית); propiamente, …" — the actual gloss is downstream.
  for (let k = 0; k < 3; k++) {
    const before = s;
    s = s.replace(
      /^(?:un(?:a)?\s+)?(?:numeral|patron[íi]mico|correlaci[óo]n|forma|variaci[óo]n|variante|plural|dual|femenino|masculino|contracci[óo]n|abreviaci[óo]n|derivado|participio(?:\s+\w+){0,2}|el mismo que|lo mismo que|igual que|una forma de|(?:una?\s+)?ra[íi]z primitiva)?\s*(?:de|del|de la|igual que|lo mismo que|una forma de)?\s*h\d+[a-z]?\s*(?:\([^)]*\))?\s*[;:,]?\s*/i,
      '',
    );
    s = s.replace(/^(?:o|u|y|e)\s+[^\s;()]*[;,]\s*/i, ''); // "o מָקֹם; …"
    s = s.replace(
      /^\((?:arameo|caldeo|hebreo|intensivamente|causativamente|reflexivamente|figurativamente|literalmente|colectivamente|denominativo|transitivo|intransitivo)\)[,;]?\s*/i,
      '',
    );
    s = s.replace(
      /^(?:propiamente|literalmente|figuradamente|figurativamente|espec[íi]ficamente|estrictamente|generalmente|usualmente|com[úu]nmente|popularmente|probablemente|posiblemente|quiz[áa]s?|acaso|transitivamente|intransitivamente|causativamente|reflexivamente|colectivamente|concretamente|abstractamente)[,;]?\s*/i,
      '',
    );
    if (s === before) break;
  }
  // remove any Hebrew / non-latin residue and tidy
  s = s.replace(/[^\p{L}\p{M}\s,;:.'’()/«»"—–-]/gu, ' ');
  s = s
    .replace(/[֐-׿]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  // drop any LEADING parenthetical ("(solo adverbial) en arameo" → "en arameo",
  // "(colectiva y abstractamente) virginidad" → "virginidad")
  for (let k = 0; k < 3; k++) {
    const b = s;
    s = s.replace(/^\([^)]*\)[,;]?\s*/, '').trim();
    if (s === b) break;
  }
  // first sense segment (before ; , parenthetical, colon, dash, slash)
  s = s.split(/;|\s\(|:\s|\s—\s|\s–\s|\s\/\s/)[0].trim();
  // if it is still a comma list, keep the first 1-2 items when short
  const commaParts = s
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  if (commaParts.length > 1) {
    s = commaParts[0];
    const second = commaParts[1] || '';
    const secondOk =
      second.length >= 4 &&
      !/^(o|y|e|u|es decir|como|etc|de|a|del?)\b/i.test(second);
    if (s.length <= 18 && secondOk && (s + ', ' + second).length <= 30) {
      s = s + ', ' + second;
    }
  }
  s = s.replace(/\.$/, '').replace(/\s+/g, ' ').trim().toLowerCase();
  // strip a leading article — a terse gloss reads better as "rey" than "un rey"
  s = s.replace(/^(?:un|una|unos|unas|el|la|los|las)\s+/, '');
  s = s.replace(/[\s,;:]+$/, '').trim();
  if (!s || s.length > 34) return null;
  if (META_LANGUAGE.test(s)) return null;
  if (/\bh\d/i.test(s)) return null; // leftover Strong's cross-reference
  if (/[()]/.test(s)) return null; // unbalanced / leftover parenthetical
  if (
    /^(?:de|del|o|y|e|u|un|una|el|la|los|las|a|que|se|con|por|para)\b/.test(
      s,
    ) &&
    s.split(' ').length <= 2
  ) {
    return null;
  }
  if (/^(o|y|e|u|un|una|el|la|los|las|de|a|que|se)$/.test(s)) return null;
  if (s.split(' ').length > 5) return null;
  return s;
}

// ── Curated EN → ES map for the common, UNAMBIGUOUS TBESH glosses ──────────
// Hand-reviewed, in-source (auditable). Two jobs:
//  1. fill mechanical lemmas that have no `definition_es`;
//  2. override a `definition_es` head that leads with an ETYMOLOGICAL sense
//     openscriptures inherited but that the word never actually carries in
//     use — e.g. H2719 חֶרֶב is always "sword", though its Strong's entry
//     opens "drought" (it derives from חרב "to be waste"). The TBESH Gloss
//     column + actual gloss_en usage both say "sword"; this map says espada.
// STRICTLY unambiguous entries only. CSV marks these rows source = "tbesh-map".
const TBESH_EN_ES = {
  // numerals
  one: 'uno',
  two: 'dos',
  three: 'tres',
  four: 'cuatro',
  five: 'cinco',
  six: 'seis',
  seven: 'siete',
  eight: 'ocho',
  nine: 'nueve',
  ten: 'diez',
  hundred: 'cien',
  thousand: 'mil',
  'ten thousand': 'diez mil',
  first: 'primero',
  second: 'segundo',
  third: 'tercero',
  fourth: 'cuarto',
  fifth: 'quinto',
  half: 'mitad',
  double: 'doble',
  // body
  hand: 'mano',
  head: 'cabeza',
  eye: 'ojo',
  mouth: 'boca',
  lip: 'labio',
  ear: 'oído',
  nose: 'nariz',
  face: 'rostro',
  foot: 'pie',
  arm: 'brazo',
  finger: 'dedo',
  tongue: 'lengua',
  tooth: 'diente',
  bone: 'hueso',
  flesh: 'carne',
  blood: 'sangre',
  skin: 'piel',
  hair: 'cabello',
  belly: 'vientre',
  womb: 'vientre',
  neck: 'cuello',
  shoulder: 'hombro',
  knee: 'rodilla',
  forehead: 'frente',
  palm: 'palma',
  heel: 'talón',
  // kinship / persons
  father: 'padre',
  mother: 'madre',
  son: 'hijo',
  daughter: 'hija',
  brother: 'hermano',
  sister: 'hermana',
  wife: 'esposa',
  husband: 'marido',
  child: 'niño',
  boy: 'muchacho',
  girl: 'muchacha',
  'young man': 'joven',
  widow: 'viuda',
  orphan: 'huérfano',
  servant: 'siervo',
  'servant/slave': 'siervo',
  slave: 'esclavo',
  maidservant: 'sierva',
  king: 'rey',
  queen: 'reina',
  prince: 'príncipe',
  priest: 'sacerdote',
  prophet: 'profeta',
  elder: 'anciano',
  judge: 'juez',
  shepherd: 'pastor',
  enemy: 'enemigo',
  friend: 'amigo',
  neighbor: 'prójimo',
  people: 'pueblo',
  nation: 'nación',
  family: 'familia',
  man: 'hombre',
  woman: 'mujer',
  'human/mankind': 'ser humano',
  // time
  day: 'día',
  night: 'noche',
  morning: 'mañana',
  evening: 'tarde',
  year: 'año',
  month: 'mes',
  week: 'semana',
  'new moon': 'luna nueva',
  today: 'hoy',
  forever: 'para siempre',
  'appointed time': 'tiempo señalado',
  // nature / place
  earth: 'tierra',
  land: 'tierra',
  ground: 'suelo',
  world: 'mundo',
  heaven: 'cielo',
  heavens: 'cielos',
  sky: 'cielo',
  sea: 'mar',
  river: 'río',
  water: 'agua',
  waters: 'aguas',
  fire: 'fuego',
  wind: 'viento',
  rain: 'lluvia',
  dew: 'rocío',
  cloud: 'nube',
  sun: 'sol',
  moon: 'luna',
  star: 'estrella',
  light: 'luz',
  darkness: 'oscuridad',
  mountain: 'monte',
  hill: 'collado',
  rock: 'roca',
  stone: 'piedra',
  dust: 'polvo',
  sand: 'arena',
  field: 'campo',
  wilderness: 'desierto',
  desert: 'desierto',
  valley: 'valle',
  road: 'camino',
  way: 'camino',
  path: 'senda',
  gate: 'puerta',
  door: 'puerta',
  city: 'ciudad',
  town: 'ciudad',
  village: 'aldea',
  house: 'casa',
  home: 'hogar',
  tent: 'tienda',
  wall: 'muro',
  pit: 'fosa',
  grave: 'sepultura',
  border: 'frontera',
  place: 'lugar',
  region: 'región',
  island: 'isla',
  garden: 'huerto',
  // plants / animals / food
  tree: 'árbol',
  wood: 'madera',
  branch: 'rama',
  root: 'raíz',
  seed: 'semilla',
  grass: 'hierba',
  fruit: 'fruto',
  vine: 'vid',
  vineyard: 'viña',
  grain: 'grano',
  wheat: 'trigo',
  barley: 'cebada',
  bread: 'pan',
  wine: 'vino',
  oil: 'aceite',
  honey: 'miel',
  milk: 'leche',
  salt: 'sal',
  flour: 'harina',
  meat: 'carne',
  animal: 'animal',
  beast: 'bestia',
  cattle: 'ganado',
  ox: 'buey',
  bull: 'toro',
  cow: 'vaca',
  sheep: 'oveja',
  lamb: 'cordero',
  goat: 'cabra',
  ram: 'carnero',
  donkey: 'asno',
  horse: 'caballo',
  camel: 'camello',
  lion: 'león',
  bear: 'oso',
  wolf: 'lobo',
  dog: 'perro',
  bird: 'ave',
  eagle: 'águila',
  dove: 'paloma',
  fish: 'pez',
  serpent: 'serpiente',
  snake: 'serpiente',
  locust: 'langosta',
  fly: 'mosca',
  bee: 'abeja',
  worm: 'gusano',
  deer: 'ciervo',
  // materials / objects
  gold: 'oro',
  silver: 'plata',
  bronze: 'bronce',
  iron: 'hierro',
  copper: 'cobre',
  sword: 'espada',
  spear: 'lanza',
  bow: 'arco',
  arrow: 'flecha',
  shield: 'escudo',
  chariot: 'carro',
  ship: 'barco',
  vessel: 'vasija',
  pot: 'olla',
  cup: 'copa',
  basket: 'canasta',
  rope: 'cuerda',
  cord: 'cuerda',
  garment: 'vestido',
  clothing: 'ropa',
  robe: 'manto',
  cloak: 'manto',
  sackcloth: 'cilicio',
  sandal: 'sandalia',
  crown: 'corona',
  ring: 'anillo',
  bed: 'cama',
  chair: 'silla',
  throne: 'trono',
  table: 'mesa',
  altar: 'altar',
  lamp: 'lámpara',
  staff: 'vara',
  rod: 'vara',
  yoke: 'yugo',
  net: 'red',
  book: 'libro',
  scroll: 'rollo',
  letter: 'carta',
  money: 'dinero',
  // common nouns (abstract but unambiguous)
  name: 'nombre',
  word: 'palabra',
  voice: 'voz',
  sound: 'sonido',
  work: 'obra',
  deed: 'obra',
  strength: 'fuerza',
  power: 'poder',
  might: 'poderío',
  fear: 'temor',
  joy: 'alegría',
  gladness: 'alegría',
  sorrow: 'dolor',
  weeping: 'llanto',
  tears: 'lágrimas',
  anger: 'ira',
  wrath: 'furor',
  song: 'cántico',
  dream: 'sueño',
  vision: 'visión',
  dance: 'danza',
  gift: 'regalo',
  wages: 'salario',
  price: 'precio',
  debt: 'deuda',
  number: 'número',
  portion: 'porción',
  measure: 'medida',
  weight: 'peso',
  boundary: 'límite',
  midst: 'medio',
  end: 'fin',
  beginning: 'principio',
  likeness: 'semejanza',
  image: 'imagen',
  form: 'forma',
  shape: 'forma',
  after: 'después, detrás',
  where: 'dónde',
  how: 'cómo',
  why: 'por qué',
  when: 'cuándo',
  thus: 'así',
  commandment: 'mandamiento',
  // adjectives
  great: 'grande',
  small: 'pequeño',
  big: 'grande',
  little: 'poco',
  good: 'bueno',
  evil: 'malo',
  bad: 'malo',
  new: 'nuevo',
  old: 'viejo',
  young: 'joven',
  high: 'alto',
  low: 'bajo',
  tall: 'alto',
  deep: 'profundo',
  wide: 'ancho',
  long: 'largo',
  short: 'corto',
  heavy: 'pesado',
  strong: 'fuerte',
  weak: 'débil',
  rich: 'rico',
  poor: 'pobre',
  wise: 'sabio',
  foolish: 'necio',
  clean: 'limpio',
  unclean: 'inmundo',
  full: 'lleno',
  empty: 'vacío',
  dry: 'seco',
  hot: 'caliente',
  cold: 'frío',
  sweet: 'dulce',
  bitter: 'amargo',
  hard: 'duro',
  near: 'cercano',
  far: 'lejano',
  last: 'último',
  whole: 'entero',
  alone: 'solo',
  // verbs — TBESH glosses verbs as "to X"; the leading "to" is KEPT in the key
  // so a verb never collides with a same-spelt noun ("to bow" vs "bow"/arco,
  // "to love" vs "love"/amor).
  'to create': 'crear',
  'to make': 'hacer',
  'to build': 'edificar',
  'to plant': 'plantar',
  'to sow': 'sembrar',
  'to reap': 'segar',
  'to gather': 'recoger',
  'to scatter': 'esparcir',
  'to eat': 'comer',
  'to drink': 'beber',
  'to walk': 'andar',
  'to run': 'correr',
  'to flee': 'huir',
  'to pursue': 'perseguir',
  'to sit': 'sentarse',
  'to rise': 'levantarse',
  'to fall': 'caer',
  'to return': 'volver',
  'to enter': 'entrar',
  'to go out': 'salir',
  'to bring': 'traer',
  'to carry': 'llevar',
  'to send': 'enviar',
  'to throw': 'arrojar',
  'to take': 'tomar',
  'to give': 'dar',
  'to buy': 'comprar',
  'to sell': 'vender',
  'to see': 'ver',
  'to hear': 'oír',
  'to know': 'conocer',
  'to understand': 'entender',
  'to remember': 'recordar',
  'to forget': 'olvidar',
  'to speak': 'hablar',
  'to tell': 'contar',
  'to call': 'llamar',
  'to cry': 'clamar',
  'to shout': 'gritar',
  'to sing': 'cantar',
  'to weep': 'llorar',
  'to mourn': 'lamentar',
  'to laugh': 'reír',
  'to rejoice': 'alegrarse',
  'to love': 'amar',
  'to hate': 'aborrecer',
  'to wash': 'lavar',
  'to anoint': 'ungir',
  'to pour': 'derramar',
  'to fill': 'llenar',
  'to open': 'abrir',
  'to shut': 'cerrar',
  'to break': 'quebrar',
  'to tear': 'rasgar',
  'to cut': 'cortar',
  'to burn': 'quemar',
  'to kindle': 'encender',
  'to kill': 'matar',
  'to slay': 'matar',
  'to smite': 'herir',
  'to strike': 'golpear',
  'to die': 'morir',
  'to live': 'vivir',
  'to heal': 'sanar',
  'to save': 'salvar',
  'to help': 'ayudar',
  'to deliver': 'librar',
  'to guard': 'guardar',
  'to hide': 'esconder',
  'to seek': 'buscar',
  'to find': 'hallar',
  'to lose': 'perder',
  'to wait': 'esperar',
  'to believe': 'creer',
  'to obey': 'obedecer',
  'to serve': 'servir',
  'to pray': 'orar',
  'to bless': 'bendecir',
  'to curse': 'maldecir',
  'to swear': 'jurar',
  'to rule': 'gobernar',
  'to reign': 'reinar',
  'to fight': 'pelear',
  'to tremble': 'temblar',
  'to sleep': 'dormir',
  'to dwell': 'habitar',
  'to wander': 'vagar',
  'to ascend': 'subir',
  'to descend': 'descender',
  'to command': 'mandar',
  'to plunder': 'saquear',
  'to roar': 'rugir',
  'to draw': 'sacar',
  'to spread': 'extender',
  'to pierce': 'traspasar',
  'to destroy': 'destruir',
  'to reject': 'rechazar',
  'to embrace': 'abrazar',
  'to stumble': 'tropezar',
  // misc unambiguous nouns/adjectives
  yes: 'sí',
  please: 'por favor',
  here: 'aquí',
  there: 'allí',
  outer: 'exterior',
  inner: 'interior',
  autumn: 'otoño',
  harvest: 'cosecha',
  survivor: 'sobreviviente',
  concubine: 'concubina',
  mina: 'mina',
  utterance: 'oráculo',
  fork: 'tenedor',
  robbery: 'robo',
  hedge: 'seto',
  perfumer: 'perfumista',
  nakedness: 'desnudez',
  birthright: 'primogenitura',
  melon: 'melón',
  crib: 'pesebre',
  manger: 'pesebre',
  sash: 'faja',
  sinew: 'tendón',
  flint: 'pedernal',
  dirge: 'endecha',
  broth: 'caldo',
  sevenfold: 'siete veces',
  ephod: 'efod',
  razor: 'navaja',
  kiln: 'horno',
  spittle: 'saliva',
  slumber: 'somnolencia',
  partridge: 'perdiz',
  ark: 'arca',
  indignation: 'indignación',
  foreign: 'extranjero',
  rampart: 'baluarte',
  chaff: 'paja',
  heron: 'garza',
};

// Per-lemma overrides where the bare English gloss is ambiguous but the
// specific Strong's is not. Small and explicit on purpose.
const STRONGS_OVERRIDE = {
  H7198: 'arco', // qeshet — the weapon (vs. H7812 shachah "to bow down", held)
  H160: 'amor', // ahavah — the noun (vs. H157 aheb "to love")
  H1730: 'amado', // dod
};

function translateTbesh(strongs, tbeshRawGloss) {
  if (STRONGS_OVERRIDE[strongs]) return STRONGS_OVERRIDE[strongs];
  if (!tbeshRawGloss) return null;
  // normalise the RAW TBESH gloss (keep a leading "to " — verbs need it)
  const raw = tbeshRawGloss
    .toLowerCase()
    .replace(/`/g, '')
    .split(/:\s/)[0]
    .replace(/\([^)]*\)/g, '')
    .replace(/[.,;:!?]+$/, '')
    .replace(/\s+/g, ' ')
    .trim();
  // Exact match only. A "to X" verb gloss must have its own "to X" key — it is
  // NEVER resolved via the bare "X" noun key ("to bow" ≠ bow/arco).
  if (Object.prototype.hasOwnProperty.call(TBESH_EN_ES, raw))
    return TBESH_EN_ES[raw];
  return null;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * A3 FULL-COVERAGE LAYER  (branch feature/hebrew-lemma-gloss-es)
 *
 * The pipeline above buckets all 8,503 used lemmas and drafts the mechanical +
 * proper-noun ones. This layer extends that to a FIRST-PASS Spanish gloss for
 * EVERY used lemma — the owner-approved A3 scope (all 8,503 as one project).
 * Emits, in addition to the decision-support artifacts:
 *   assets/hebrew-lemma-gloss-es.json            flat {H####:"gloss"}, all 8,503
 *   DOCS/drafts/hebrew-lemma-gloss-es-REVIEW.md   the owner's review package
 * Nothing here wires the data into the app (that is P2, a separate change).
 *
 * OWNER DECISIONS baked in:
 *   1. Coverage = ALL used lemmas (judgment / held-back bucket included).
 *   2. Divine names / titles == the RVR1960 on-screen form (Jehová, not Yahvé;
 *      Dios; Señor …), verified verse-by-verse against assets/bible-seed.db.
 *   3. FREE, shipped as a bundled JSON (not a pack rebuild).
 *   4. Owner reviews: the ~2.6k proper-noun spellings (skim) + the theologically
 *      loaded lemmas (close read); mechanical bulk spot-checked. So every
 *      low-confidence / weighted / particle / divine call is FLAGGED here.
 * ═══════════════════════════════════════════════════════════════════════════ */

const GLOSS_MAXLEN = 40;

// ── (2) Divine names & titles — gloss == what the RVR1960 verse prints.
//    PER-WORD: H136 "Señor" + H3069 "Jehová" compose the printed "Señor Jehová"
//    pair — H3069 must NOT carry the whole phrase. Every entry is flagged.
const DIVINE_NAMES_ES = {
  H3068: 'Jehová', //  YHWH — RVR1960 "Jehová" (its own definition_es concurs)
  H3069: 'Jehová', //  YHWH pointed as elohim — prints "Jehová" in "Señor Jehová"
  H430: 'Dios', //      elohim
  H433: 'Dios', //      Eloah
  H410: 'Dios', //      El
  H426: 'Dios', //      Aramaic elah (Esdras / Daniel)
  H136: 'Señor', //     Adonai
  H3050: 'JAH', //      Yah
  H7706: 'Todopoderoso', // Shaddai
  H5945: 'Altísimo / superior', // Elyon — ~half divine title, ~half plain adj.
};

// ── The 8 named grammatical particles — compact best-effort, every one flagged.
const PARTICLE_ES = {
  H853: 'introduce el complemento directo', // ʾet — no lexical sense at all
  H5921: 'sobre / encima / contra', // ʿal
  H413: 'a / hacia', // ʾel
  H834: 'que / el cual', // ʾasher
  H3605: 'todo / cada / cualquiera', // kol
  H3588: 'porque / que / cuando', // ki
  H1961: 'ser / estar / haber / suceder', // hayah
  H559: 'decir', // ʾamar
};

// ── Weighted / covenant / soteriological / anthropological core. Compound
//    glosses on purpose; each is flagged for the owner's close read. Aligned
//    to how RVR1960 renders the word most often.
const WEIGHTED_ES = {
  H1285: 'pacto', // berit  (RVR tb "alianza / concierto")
  H2617: 'misericordia / amor leal', // hesed
  H8451: 'ley / instrucción', // torah
  H5315: 'alma / vida / ser', // nephesh  (tb persona, deseo, garganta)
  H7307: 'espíritu / viento / aliento', // ruaj
  H3519: 'gloria / honra', // kavod  (lit. "peso")
  H6664: 'justicia / rectitud', // tsedeq
  H6666: 'justicia / rectitud', // tsedaqah
  H6944: 'santidad / lo santo', // qodesh
  H2403: 'pecado / ofrenda por el pecado', // chattaah
  H2398: 'pecar / errar el blanco', // chata
  H3722: 'expiar / hacer expiación', // kipper  (lit. "cubrir")
  H1350: 'redimir / rescatar', // gaal  (el pariente redentor, goel)
  H1353: 'redención / rescate', // geullah
  H6662: 'justo', // tsaddiq
  H6663: 'ser justo / justificar', // tsadaq
  H539: 'creer / confiar / ser fiel', // aman  (hifil "creer", Gn 15:6)
  H530: 'fidelidad / fe', // emunah
  H8199: 'juzgar / gobernar', // shaphat
  H4941: 'juicio / derecho / ordenanza', // mishpat
  H4397: 'mensajero / ángel', // malak
  H5771: 'iniquidad / culpa', // avon
  H6588: 'transgresión / rebelión', // pesha
  H5162: 'consolar / arrepentirse', // najam
  H3444: 'salvación / liberación', // yeshuah
  H3468: 'salvación / liberación', // yesha
  H3467: 'salvar / librar', // yasha (verbo)
  H7965: 'paz / bienestar', // shalom
  H2896: 'bueno / bien', // tov
  H7451: 'malo / mal / calamidad', // ra
  H1697: 'palabra / asunto / cosa', // davar
  H7223: 'primero / anterior', // rishon
  H3820: 'corazón / mente', // lev
  H3824: 'corazón / mente', // levav
  H7355: 'compadecerse / amar', // racham (verbo)
  H7356: 'misericordia / compasión / entrañas', // rachamim
  H2580: 'gracia / favor', // chen
  H7812: 'postrarse / adorar', // shajah  (lit. "inclinarse")
  H5647: 'servir / trabajar / labrar', // avad
  H3372: 'temer / reverenciar', // yare
  H6635: 'ejército / hueste', // tsava  (título "Jehová de los ejércitos")
  H2233: 'simiente / descendencia', // zera
  H6942: 'santificar / consagrar', // qadash
  H4899: 'ungido', // mashiaj  ("el Mesías")
  H7522: 'voluntad / beneplácito / favor', // ratzon
  H1254: 'crear', // bara  (sujeto siempre Dios en Qal)
  H120: 'hombre / ser humano', // adam  (tb el nombre propio Adán)
  H127: 'tierra / suelo', // adamah
  H8085: 'oír / escuchar / obedecer', // shama
  H3045: 'conocer / saber', // yada
};

// ── Targeted fixes for high-frequency judgment lemmas whose auto-draft is an
//    etymology leak, a bad gloss_en merge, or too verbose. NOT flagged (these
//    are unambiguous common words) unless noted; the owner spot-checks.
const JUDGMENT_FIX_ES = {
  H2088: 'este / esto',
  H5769: 'eternidad / para siempre',
  H7225: 'principio / primicia',
  H6963: 'voz / sonido',
  H7121: 'llamar / proclamar / invocar',
  H1696: 'hablar',
  H854: 'con / junto a',
  H369: 'no hay / nada',
  H4100: 'qué / cómo',
  H582: 'hombre / gente',
  H5750: 'aún / todavía',
  H6258: 'ahora',
  H8478: 'debajo / en lugar de',
  H8432: 'medio / en medio',
  H5439: 'alrededor',
  H905: 'solo / aparte',
  H4481: 'de / desde',
  H637: 'también / aún más',
  H639: 'nariz / ira',
  H1366: 'frontera / territorio',
  H3627: 'objeto / utensilio / vasija',
  H4616: 'para que / por causa de',
  H6485: 'visitar / castigar / encargar',
  H3644: 'como',
  H571: 'verdad / fidelidad',
  H3162: 'juntos',
  H4605: 'arriba',
  H312: 'otro',
  H1984: 'alabar',
  H3034: 'alabar / dar gracias',
  H1431: 'engrandecer / crecer',
  H3190: 'hacer bien / ir bien',
  H5387: 'príncipe / jefe',
  H6828: 'norte',
  H2534: 'furor / ira',
  H899: 'vestido / ropa',
  H4758: 'aspecto / apariencia / visión',
  H7130: 'interior / entrañas / medio',
  H2022: 'monte / montaña',
  H8269: 'príncipe / jefe / oficial',
  H3541: 'así',
  H113: 'señor / amo',
  H2142: 'recordar / acordarse',
  H4639: 'obra / hecho',
  H1129: 'edificar',
  H3651: 'así / correcto',
  H995: 'entender / discernir',
  H5375: 'levantar / llevar / perdonar',
  H6440: 'rostro / delante de',
  H5648: 'hacer (arameo)',
};

// ── (proper nouns without any definition_es, 46 hapax) — hand transliteration
//    to the Spanish-Bible convention. Every one flagged (owner skims).
const PROPER_FALLBACK_ES = {
  H245: 'Azanías',
  H250: 'ezraíta',
  H287: 'Ahimot',
  H498: 'Eluzai',
  H867: 'Etni',
  H1056: 'Baca',
  H1084: 'Bilgai',
  H1148: 'Beninú',
  H1180: 'Baali',
  H1183: 'Bealías',
  H1202: 'Baasías',
  H1337: 'Bat-rabim',
  H1381: 'Gebal',
  H1452: 'gederatita',
  H1862: 'Darda',
  H2059: 'Vasni',
  H2293: 'Haguía',
  H2432: 'Hilén',
  H2741: 'harufita',
  H2769: 'Hermón',
  H2812: 'Hasabna',
  H2979: 'Jeaterai',
  H3084: 'José',
  H3125: 'griego',
  H3132: 'Joela',
  H3134: 'Joezer',
  H3643: 'Quimam',
  H4047: 'Magpías',
  H4077: 'medo',
  H4235: 'Mahol',
  H4344: 'Macbanai',
  H4706: 'Mizar',
  H4913: 'Masal',
  H4925: 'Mismana',
  H5109: 'Nebai',
  H5538: 'Sila',
  H6046: 'Anem',
  H6052: 'Anán',
  H6401: 'Pilha',
  H6543: 'persa',
  H6859: 'Sefata',
  H7029: 'Cisi',
  H7615: 'sabeo',
  H7733: 'Sobec',
  H7759: 'sulamita',
  H8430: 'Toa',
};

// Explicit review flags: strongs -> {kind, note}. kind ∈ particle | divine |
// weighted | fix | proper-fallback | low-confidence | untranslated.
const A3_FLAGS = new Map();
function flagLemma(strongs, kind, note) {
  if (!A3_FLAGS.has(strongs)) A3_FLAGS.set(strongs, {kind, note: note || ''});
}
for (const s of Object.keys(PARTICLE_ES))
  flagLemma(
    s,
    'particle',
    'partícula gramatical polisémica — sin equivalente 1:1',
  );
for (const s of Object.keys(DIVINE_NAMES_ES))
  flagLemma(s, 'divine', 'nombre / título divino — debe reflejar RVR1960');
for (const s of Object.keys(WEIGHTED_ES))
  flagLemma(s, 'weighted', 'término teológicamente cargado — lectura atenta');
for (const s of Object.keys(PROPER_FALLBACK_ES))
  flagLemma(
    s,
    'proper-fallback',
    'nombre propio sin definition_es — translit. a mano',
  );

// Notes shown verbatim in the review for specific divine / particle calls.
const A3_NOTES = {
  H853: 'ʾet: RVR1960 no lo traduce (no tiene forma en español). Opciones: «(objeto directo)» · «—» (omitir del interlineal) · dejar el gloss_en actual. Aparece ~10.9k veces.',
  H3069:
    'aparece casi siempre en la pareja «Señor Jehová» (H136 + H3069); por palabra, H3069 imprime «Jehová».',
  H430: 'plural; RVR1960 usa «dioses» para dioses falsos y, raras veces, «jueces». ~2.6k ocurrencias.',
  H410: 'RVR1960 casi siempre «Dios»; unas pocas veces «poderoso».',
  H3050:
    'RVR1960 imprime «JAH» (Sal 68:4) pero «Jehová» dentro de compuestos / Éx 15:2.',
  H7706:
    'RVR1960 alterna «Todopoderoso» (Gn 17:1) y «Omnipotente» (Gn 28:3; 35:11).',
  H5945:
    '~mitad título divino «Altísimo», ~mitad adjetivo común «de arriba / superior» (puerta, estanque…).',
  H6635:
    'la palabra es «ejército»; el título «Jehová de los ejércitos» es H3068 + H6635.',
  H2617:
    'hesed: RVR1960 mayormente «misericordia»; tb «bondad / favor». Compuesto propuesto para reflejar el sentido de pacto.',
  H5162:
    'najam: nifal «arrepentirse / compadecerse», piel «consolar» — dos sentidos casi iguales en frecuencia.',
  H2233:
    'zera: lit. «semilla»; incluye la descendencia (y la simiente mesiánica, Gn 3:15).',
  H4899: 'mashiaj: «ungido»; el NT lo toma como «Mesías / Cristo».',
};

/** Enforce the gloss contract: <=40 chars, no markup, cut on a word/segment
 *  boundary (never a bare "…"), no leading/trailing punctuation. */
function capClean(s, max = GLOSS_MAXLEN) {
  if (!s) return '';
  let t = String(s)
    .replace(/[<>[\]{}*`_#|~]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  t = t
    .replace(/^[\s./;:,–—-]+/, '')
    .replace(/[\s./;:,]+$/, '')
    .trim();
  if (t.length <= max) return t;
  let cut = t.slice(0, max + 1);
  const seps = [
    cut.lastIndexOf(' / '),
    cut.lastIndexOf(', '),
    cut.lastIndexOf('; '),
    cut.lastIndexOf(' '),
  ];
  const at = Math.max(...seps);
  if (at > max * 0.45) cut = cut.slice(0, at);
  return cut.replace(/[\s./;:,/]+$/, '').trim();
}

/** Drop a leading Spanish etymology / cross-reference clause from a
 *  definition_es (proper-noun path). */
function stripEsEtymology(s) {
  let t = String(s || '').trim();
  for (let k = 0; k < 5; k++) {
    const b = t;
    t = t.replace(
      /^\((?:arameo|caldeo|hebreo|gentilicio|patron[íi]mico|forma\s+\w+)[^)]*\)[,;:]?\s*/i,
      '',
    );
    t = t.replace(
      /^(?:lo mismo que|igual que|el mismo que|(?:una?\s+)?forma\s+(?:de|alargada de|abreviada de|prolongada de)|variaci[óo]n de|variante de|patron[íi]micamente de|contracci[óo]n de|probablemente de|quiz[áa]s? de|aparentemente de|de|del)\s+h?\d+[a-z]?\s*(?:\([^)]*\))?\s*[;:,.]?\s*/i,
      '',
    );
    t = t.replace(/^(?:o|u)\s+[^\s;,()]+\s*[;,]\s*/i, '');
    if (t === b) break;
  }
  return t.trim();
}

/** Proper-noun → RVR1960-conventional Spanish spelling, from the vetted
 *  definition_es (openscriptures-ES already uses Reina-Valera spellings). */
function properNounEs(rec) {
  const hand = PROPER_FALLBACK_ES[rec.strongs];
  if (hand) return {gloss: capClean(hand), source: 'hand-translit'};

  const raw = rec.defEs ? stripEsEtymology(rec.defEs) : '';
  if (raw) {
    // gentilic: "un/una X o habitante/descendiente de Y" → X (lowercase)
    const gm = raw.match(/^un[oa]?\s+([a-záéíóúüñ]+(?:-[a-záéíóúüñ]+)*)\b/i);
    if (
      gm &&
      /^un[oa]?\s+[a-záéíóúüñ-]+\s+(?:o\b|,\s|$)/i.test(raw) &&
      !/^un[oa]?\s+(?:rey|hijo|ciudad|lugar|monte|r[íi]o|pozo|valle|hombre|mujer|profeta|sacerdote|nombre|t[íe]rmino|pariente|descendiente|eunuco|israelita|edomita)\b/i.test(
        raw,
      )
    ) {
      return {gloss: capClean(gm[1].toLowerCase()), source: 'defEs-gentilic'};
    }
    let name = raw.split(/[;(]/)[0];
    name = name.split(/,\s/)[0].trim();
    name = name
      .replace(/\s*=.*$/, '')
      .replace(/\s+es decir.*$/i, '')
      .replace(/[.;:,\s]+$/, '')
      .trim();
    name = name.replace(/\s+o\s+/i, ' / ');
    if (name && /[A-Za-zÀ-ÿ]/.test(name) && name.length <= GLOSS_MAXLEN + 8) {
      return {gloss: capClean(name), source: 'defEs-name'};
    }
  }
  // last resort — crude English→Spanish transliteration (always flagged)
  return {
    gloss: capClean(translitName(rec.tbeshGloss || rec.rawTop || '')),
    source: 'auto-translit',
  };
}

function translitName(en) {
  let s = String(en || '')
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[`'"]/g, '')
    .split(/[,;/]/)[0]
    .trim();
  if (!s) return '';
  s = s
    .replace(/ites?$/i, 'ita')
    .replace(/ean$/i, 'eo')
    .replace(/iah$/i, 'ías')
    .replace(/jah$/i, 'ías')
    .replace(/th/gi, 't')
    .replace(/ph/gi, 'f')
    .replace(/kh/gi, 'j')
    .replace(/ch/gi, 'c')
    .replace(/sh/gi, 's')
    .replace(/ck/gi, 'c')
    .replace(/h$/i, '');
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/** Permissive condense of a definition_es head — the tail-of-tail safety net
 *  when headSense() (which rejects meta-language) returns null. */
function looseHead(defEs) {
  if (!defEs) return null;
  let s = String(defEs).trim();
  for (let k = 0; k < 3; k++) {
    const b = s;
    s = s.replace(
      /^(?:una?\s+)?ra[íi]z\s+(?:primitiva|denominativa)[^;.]*[;.]\s*/i,
      '',
    );
    s = s.replace(
      /^(?:de|del|de la|una forma de|variante de|variaci[óo]n de|lo mismo que|igual que)\s+h?\d+[a-z]?\s*(?:\([^)]*\))?\s*[;:,.]?\s*/i,
      '',
    );
    s = s.replace(
      /^(?:propiamente|literalmente|figuradamente|figurativamente|espec[íi]ficamente|por implicaci[óo]n|es decir|por extensi[óo]n|por analog[íi]a|generalmente|usualmente|com[úu]nmente|probablemente|quiz[áa]s?|(?:tal vez)|acaso|as[íi] llamad[oa])[,;: ]+/i,
      '',
    );
    s = s.replace(/^\([^)]*\)[,;:]?\s*/, '');
    if (s === b) break;
  }
  s = s
    .replace(/[֐-׿]+/g, ' ')
    .replace(/\bh\d+[a-z]?\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  s = s.split(/;|\s\(|:\s|\s—\s|\s–\s/)[0].trim();
  const parts = s
    .split(',')
    .map(p => p.trim())
    .filter(Boolean);
  if (parts.length) {
    s = parts[0];
    if (
      parts[1] &&
      parts[1].length >= 4 &&
      !/^(o|y|e|u|es decir|como|etc|de|a|del?)\b/i.test(parts[1]) &&
      (s + ' / ' + parts[1]).length <= GLOSS_MAXLEN
    ) {
      s = s + ' / ' + parts[1];
    }
  }
  s = capClean(s).toLowerCase();
  s = s.replace(/^(?:un|una|unos|unas|el|la|los|las)\s+/, '');
  if (!s || s.length < 2) return null;
  if (
    /^(?:de|del|o|y|e|u|a|que|se|con|por|para)\b/.test(s) &&
    s.split(' ').length <= 2
  )
    return null;
  return capClean(s);
}

/** TBESH head-gloss (English) → terse Spanish. Fallback ONLY when there is no
 *  usable definition_es (task rule: definition_es first, TBESH second). */
const TBESH_HEAD_ES = {
  above: 'arriba / encima',
  acceptable: 'aceptable',
  accident: 'accidente / suceso',
  account: 'cuenta / relato',
  acquaintance: 'conocido',
  add: 'añadir',
  adultery: 'adulterio',
  affair: 'asunto',
  afflict: 'afligir',
  affliction: 'aflicción',
  aggitate: 'agitar',
  all: 'todo',
  allotted: 'asignado',
  also: 'también',
  ambassador: 'embajador / mensajero',
  answer: 'responder',
  anything: 'algo / nada',
  apple: 'manzana',
  'aromatic powder': 'polvo aromático',
  artisan: 'artesano',
  associate: 'asociarse / compañero',
  attach: 'unir / adherir',
  baked: 'cocido al horno',
  basin: 'tazón / fuente',
  'be able': 'poder',
  'be appalled': 'horrorizarse',
  'be ashamed': 'avergonzarse',
  'be beautiful': 'ser hermoso',
  'be bereaved': 'quedar sin hijos',
  'be brother-in-law': 'cumplir el deber de cuñado',
  'be displeased': 'disgustarse',
  'be dry': 'secarse',
  'be evil': 'ser malo',
  'be faithful': 'ser fiel',
  'be foolish': 'ser necio',
  'be good': 'ser bueno',
  'be gracious': 'tener piedad',
  'be humble': 'humillarse',
  'be humiliated': 'ser humillado',
  'be indignant': 'indignarse',
  'be like': 'ser semejante',
  'be lovely': 'ser amable',
  'be precious': 'ser precioso',
  'be safe': 'estar a salvo',
  'be shrewd': 'ser astuto',
  'be sick': 'enfermar',
  'be sorry': 'arrepentirse',
  'be sweet': 'ser dulce',
  'be tender': 'ser tierno',
  'be unfaithful': 'ser infiel / prevaricar',
  'be weak': 'debilitarse',
  'be weary/toil': 'fatigarse / afanarse',
  'be wide': 'ensancharse',
  'be willing': 'estar dispuesto',
  'bear tidings': 'traer noticias',
  beat: 'golpear / batir',
  beauty: 'hermosura',
  because: 'porque',
  before: 'antes / delante',
  bird: 'ave / pájaro',
  'bird of prey': 'ave de rapiña',
  bitterness: 'amargura',
  body: 'cuerpo',
  boil: 'hervir / llaga',
  boot: 'bota / calzado',
  border: 'borde / frontera',
  bottom: 'fondo',
  bough: 'rama',
  bow: 'arco / inclinarse',
  breast: 'pecho',
  broad: 'ancho',
  bruise: 'magulladura / herir',
  brushwood: 'maleza',
  buckler: 'escudo',
  bulwark: 'baluarte',
  burden: 'carga',
  butter: 'mantequilla / cuajada',
  'by day': 'de día',
  camp: 'campamento / acampar',
  cassia: 'casia',
  cast: 'arrojar / fundir',
  cease: 'cesar',
  celebrate: 'celebrar',
  channel: 'canal / cauce',
  chief: 'jefe / principal',
  choose: 'escoger',
  chop: 'cortar / talar',
  cleave: 'hender / adherirse',
  close: 'cerrar',
  clothe: 'vestir',
  'clothe in scarlet': 'vestir de escarlata',
  cloud: 'nube',
  club: 'garrote / maza',
  cluster: 'racimo',
  commander: 'comandante / jefe',
  confirm: 'confirmar',
  confuse: 'confundir',
  consent: 'consentir',
  conspiracy: 'conspiración',
  constrain: 'constreñir / apremiar',
  contempt: 'desprecio',
  contend: 'contender',
  continually: 'continuamente',
  continuance: 'continuidad / duración',
  counsel: 'consejo',
  count: 'contar',
  cover: 'cubrir',
  creep: 'arrastrarse / reptar',
  creeping: 'reptil',
  crime: 'crimen / delito',
  crowd: 'multitud',
  crushing: 'quebranto',
  'cry out': 'clamar',
  curve: 'curva / doblar',
  'cut off': 'cortar / talar',
  dance: 'danza / danzar',
  dark: 'oscuro',
  darkened: 'oscurecido',
  dawn: 'amanecer / alba',
  daylight: 'luz del día',
  decide: 'decidir',
  declare: 'declarar',
  decree: 'decreto',
  dedicate: 'dedicar',
  delay: 'tardar / demora',
  'delight in': 'deleitarse en',
  den: 'guarida',
  desire: 'desear / deseo',
  despise: 'despreciar',
  destitute: 'menesteroso / desamparado',
  devise: 'idear / tramar',
  dig: 'cavar',
  diminish: 'disminuir',
  disappear: 'desaparecer',
  discipline: 'disciplina / corrección',
  'dislocate/hang': 'dislocar / colgar',
  dismay: 'consternación / espanto',
  'distinguish oneself': 'distinguirse',
  distract: 'distraer',
  diversion: 'distracción',
  divide: 'dividir',
  divine: 'adivinar',
  dominion: 'dominio',
  'drawn sword': 'espada desenvainada',
  dream: 'sueño / soñar',
  drink: 'beber / bebida',
  ease: 'sosiego / alivio',
  elevation: 'elevación',
  emptiness: 'vacío / vanidad',
  enduring: 'perdurable',
  enquire: 'inquirir / preguntar',
  enrage: 'enfurecer',
  enrich: 'enriquecer',
  envy: 'envidia',
  error: 'error / yerro',
  escape: 'escapar / huida',
  establish: 'establecer / afirmar',
  excellence: 'excelencia',
  except: 'excepto',
  explain: 'explicar',
  fair: 'hermoso',
  faithfulness: 'fidelidad',
  fantasies: 'fantasías',
  fasting: 'ayuno',
  feast: 'fiesta / banquete',
  feed: 'alimentar / apacentar',
  fence: 'cerca / valla',
  filth: 'inmundicia',
  finally: 'finalmente',
  fine: 'multa',
  flood: 'diluvio / inundación',
  foe: 'enemigo / adversario',
  foliage: 'follaje',
  food: 'alimento / comida',
  'food offering': 'ofrenda de alimento',
  foothold: 'punto de apoyo',
  for: 'porque / para',
  ford: 'vado',
  forgetfulness: 'olvido',
  fowl: 'ave',
  fowler: 'cazador de aves',
  frame: 'estructura / armazón',
  from: 'de / desde',
  'fruit-stalk': 'pedúnculo',
  fuel: 'combustible / pábilo',
  furnace: 'horno',
  gain: 'ganancia / lucro',
  gallery: 'galería',
  generation: 'generación',
  gentleness: 'mansedumbre',
  glide: 'deslizarse',
  gloom: 'penumbra / tinieblas',
  'go either way': 'vacilar',
  'go left': 'ir a la izquierda',
  'go right': 'ir a la derecha',
  'go through': 'pasar por / atravesar',
  god: 'dios',
  'going down': 'descenso',
  goring: 'cornear',
  'great man': 'grande / notable',
  green: 'verde',
  grieved: 'afligido',
  'grow warm': 'calentarse',
  guide: 'guiar / guía',
  'hammered out': 'labrado a martillo',
  hamstring: 'desjarretar',
  harden: 'endurecer',
  hasten: 'apresurar',
  'have shade': 'dar sombra',
  hearth: 'hogar / brasero',
  herb: 'hierba',
  hew: 'labrar / cortar',
  hired: 'asalariado',
  hope: 'esperanza',
  hurry: 'apresurarse',
  hurt: 'herir / dañar',
  idol: 'ídolo',
  if: 'si',
  imprint: 'grabar / marca',
  incision: 'incisión / sajadura',
  incite: 'incitar',
  inheritance: 'heredad / herencia',
  injunction: 'mandato / precepto',
  innocence: 'inocencia',
  "isn't?": '¿acaso no?',
  jar: 'cántaro / vasija',
  jasper: 'jaspe',
  javelin: 'jabalina / venablo',
  jewelry: 'joyas / alhajas',
  join: 'juntar / unir',
  judge: 'juzgar / juez',
  keep: 'guardar',
  kor: 'coro',
  lady: 'señora / dama',
  learn: 'aprender',
  leave: 'dejar / abandonar',
  left: 'izquierda',
  lewdness: 'lascivia / perversión',
  loath: 'aborrecer / hastiarse',
  lock: 'cerrojo',
  lodge: 'alojarse / pernoctar',
  loin: 'lomo / cintura',
  long: 'anhelar',
  look: 'mirar',
  lord: 'señor',
  luxuriant: 'frondoso',
  'make clear': 'aclarar / declarar',
  mark: 'marca / señal',
  maskil: 'masquil',
  master: 'amo / señor',
  measure: 'medida / medir',
  meditation: 'meditación',
  medium: 'evocador de espíritus',
  meeting: 'reunión / asamblea',
  melody: 'melodía',
  melting: 'derretimiento',
  mighty: 'poderoso',
  mind: 'mente / ánimo',
  mire: 'cieno / lodo',
  mischief: 'maldad / daño',
  mistress: 'señora / ama',
  mixture: 'mezcla',
  mock: 'burlarse',
  moment: 'momento / instante',
  much: 'mucho',
  multiply: 'multiplicar',
  murder: 'asesinar / matar',
  music: 'música',
  muzzle: 'bozal',
  'nail/claw': 'uña / garra',
  navel: 'ombligo',
  need: 'necesidad',
  nettle: 'ortiga',
  nevertheless: 'sin embargo',
  'new wine': 'mosto / vino nuevo',
  noble: 'noble',
  nostril: 'nariz',
  numbering: 'censo / recuento',
  official: 'oficial / funcionario',
  opposite: 'enfrente / frente a',
  oppress: 'oprimir',
  oppression: 'opresión',
  outside: 'afuera / fuera',
  overcome: 'vencer',
  overflow: 'desbordar / rebosar',
  pain: 'dolor',
  palate: 'paladar',
  parched: 'reseco / árido',
  pass: 'pasar',
  pasture: 'pasto / dehesa',
  'pay brideprice': 'pagar la dote',
  peace: 'paz',
  peacock: 'pavo real',
  peak: 'cima / cumbre',
  penis: 'miembro viril',
  perish: 'perecer',
  pervert: 'pervertir / torcer',
  petition: 'petición',
  piece: 'pedazo / trozo',
  pine: 'languidecer',
  pity: 'compasión / lástima',
  plan: 'plan / designio',
  play: 'tocar / tañer',
  plot: 'trama / parcela',
  plowshare: 'reja de arado',
  point: 'punta',
  'practice sorcery': 'practicar hechicería',
  praise: 'alabanza',
  preacher: 'predicador',
  press: 'prensar / apretar',
  pressure: 'presión / opresión',
  pretext: 'pretexto',
  pride: 'soberbia / orgullo',
  princess: 'princesa',
  'profane/begin': 'profanar / comenzar',
  prosperity: 'prosperidad',
  proud: 'soberbio / altivo',
  purple: 'púrpura',
  quake: 'temblar',
  quiver: 'aljaba / carcaj',
  raft: 'balsa',
  ransomed: 'rescatado',
  'rash word': 'palabra precipitada',
  recognize: 'reconocer',
  recount: 'recontar / relatar',
  refuse: 'desecho / basura',
  reinforced: 'reforzado',
  remain: 'quedar / permanecer',
  remove: 'quitar / apartar',
  request: 'petición / solicitud',
  rest: 'descanso / reposo',
  riddle: 'enigma / acertijo',
  righteousness: 'justicia',
  'rock badger': 'conejo / damán',
  'roll up': 'enrollar',
  roof: 'techo / azotea',
  rottenness: 'podredumbre / carcoma',
  roundness: 'redondez',
  rove: 'vagar / merodear',
  ruin: 'ruina',
  rush: 'junco',
  'sabbath observance': 'reposo del sábado',
  salt: 'sal',
  salvation: 'salvación',
  sanctuary: 'santuario',
  satrap: 'sátrapa',
  seal: 'sello / sellar',
  search: 'buscar / escudriñar',
  security: 'seguridad',
  'set out': 'partir / ponerse en marcha',
  shade: 'sombra',
  shaking: 'temblor / sacudida',
  sharp: 'agudo / afilado',
  sharpen: 'afilar / aguzar',
  shattering: 'quebrantamiento',
  shave: 'afeitar / rasurar',
  shoot: 'brote / retoño',
  side: 'lado / costado',
  sight: 'vista',
  sign: 'señal',
  'signet ring': 'anillo de sellar',
  silence: 'silencio',
  sin: 'pecado',
  'skip about': 'brincar / saltar',
  slaughter: 'matanza / degüello',
  sleep: 'dormir / sueño',
  smear: 'untar / embadurnar',
  smell: 'oler / olor',
  snail: 'caracol / babosa',
  snatch: 'arrebatar',
  sneezing: 'estornudo',
  snow: 'nieve',
  sojourn: 'peregrinar / morar',
  sojourner: 'forastero / peregrino',
  soothe: 'aplacar / calmar',
  space: 'espacio',
  spark: 'chispa / centella',
  'split open': 'hender / partir',
  spot: 'mancha',
  stall: 'establo / pesebre',
  stand: 'estar de pie',
  statute: 'estatuto / ordenanza',
  steed: 'corcel',
  steward: 'mayordomo',
  still: 'aún / todavía',
  'stir up': 'agitar / despertar',
  stock: 'tronco / cepa',
  stone: 'piedra',
  strife: 'contienda / rencilla',
  strip: 'despojar / desnudar',
  strive: 'contender / esforzarse',
  struggle: 'luchar',
  succeed: 'prosperar',
  surely: 'ciertamente',
  surround: 'rodear / cercar',
  sustain: 'sostener',
  swerve: 'desviarse',
  'tear off': 'arrancar',
  theft: 'hurto / robo',
  that: 'que / aquel',
  then: 'entonces',
  therefore: 'por tanto',
  thing: 'cosa / asunto',
  thirty: 'treinta',
  thousands: 'millares',
  throng: 'multitud / tropel',
  thrust: 'empujar / clavar',
  'thumb/big toe': 'pulgar / dedo gordo',
  'to be dismayed': 'consternarse',
  tottering: 'tambaleante',
  touch: 'tocar',
  trade: 'comerciar / mercadería',
  travel: 'viajar',
  tread: 'pisar / hollar',
  tree: 'árbol',
  trouble: 'angustia / turbación',
  trust: 'confiar',
  turn: 'volverse / girar',
  'turn right': 'ir a la derecha',
  twenty: 'veinte',
  twist: 'torcer',
  'unleavened bread': 'pan sin levadura',
  urge: 'instar / apremiar',
  vileness: 'vileza / bajeza',
  viper: 'víbora',
  visibility: 'claridad',
  waking: 'vigilia',
  wandering: 'errante / vagar',
  ware: 'mercancía',
  washing: 'lavamiento',
  waste: 'desolación / asolar',
  watch: 'vigilar / guardia',
  'watch with envy': 'mirar con envidia',
  watcher: 'centinela / vigilante',
  weapon: 'arma',
  whistle: 'silbar / silbido',
  whom: 'a quien',
  window: 'ventana',
  wipe: 'limpiar / enjugar',
  wonder: 'maravilla / prodigio',
  wrestle: 'luchar',
  write: 'escribir',
  yesterday: 'ayer',
};

function tbeshHeadEs(headGloss) {
  if (!headGloss) return null;
  let h = String(headGloss).toLowerCase().replace(/`/g, '').trim();
  h = h.split(/:\s/)[0].trim();
  h = h
    .replace(/^to\s+/, '')
    .replace(/^\([^)]*\)\s*/, '')
    .trim();
  if (Object.prototype.hasOwnProperty.call(TBESH_HEAD_ES, h))
    return TBESH_HEAD_ES[h];
  // "to X" verbs whose bare head is also in the noun map are fine here
  return null;
}

// ── TBESH parse ───────────────────────────────────────────────────────────
function ensureTbesh() {
  fs.mkdirSync(CACHE, {recursive: true});
  if (fs.existsSync(TBESH_FILE) && fs.statSync(TBESH_FILE).size > 1_000_000) {
    return;
  }
  console.log('⬇️  TBESH (STEPBible-Data, CC BY 4.0) → temp cache');
  execFileSync('curl', [
    '-sL',
    '--max-time',
    '300',
    '-o',
    TBESH_FILE,
    TBESH_URL,
  ]);
  if (!fs.existsSync(TBESH_FILE) || fs.statSync(TBESH_FILE).size < 1_000_000) {
    throw new Error('TBESH download failed / too small');
  }
}

/** @returns {Map<string,{recs:Array,primary:object,properNoun:boolean,
 *                         tbeshGloss:string,senseCount:number}>} keyed by base Strong's */
function parseTbesh() {
  const lines = fs.readFileSync(TBESH_FILE, 'utf8').split(/\r?\n/);

  // Confirm column identity from the file's OWN header before touching data.
  const headerIdx = lines.findIndex(l => /^eStrong#\tdStrong\tuStrong/.test(l));
  if (headerIdx < 0) throw new Error('TBESH header row not found');
  const header = lines[headerIdx].split('\t').map(h => h.trim());
  //  index: 0 eStrong#  1 dStrong  2 uStrong  3 Hebrew  4 Transliteration
  //         5 Morph     6 Gloss    7 Meaning
  if (header[5] !== 'Morph' || header[6] !== 'Gloss') {
    throw new Error(
      `TBESH column layout unexpected: ${JSON.stringify(header.slice(0, 8))}`,
    );
  }
  if (header[7] !== 'Meaning') {
    throw new Error(
      'TBESH col 7 is not the expected "Meaning" (Abridged BDB) — aborting ' +
        'rather than risk reading a column we have no licence for',
    );
  }
  console.log(
    `   TBESH header confirmed: [${header
      .slice(0, 8)
      .join(' | ')}]  → reading col 6 "Gloss" only, col 7 "Meaning" firewalled`,
  );

  const byBase = new Map();
  for (let i = headerIdx + 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line || !/^[HG]\d/.test(line)) continue;
    // FIREWALL: slice(0, 7) — the "Meaning" column (index 7) never materialises.
    const c = line.split('\t').slice(0, 7);
    const base = normalizeStrongs(c[0]);
    if (!base) continue;
    const rec = {
      eStrong: c[0].trim(),
      dStrong: (c[1] || '').trim(),
      dTok: stripZeros((c[1] || '').split(/\s+/)[0]),
      hebrew: (c[3] || '').trim(),
      translit: (c[4] || '').trim(),
      morph: (c[5] || '').trim(),
      gloss: (c[6] || '').trim(),
    };
    if (!byBase.has(base)) byBase.set(base, []);
    byBase.get(base).push(rec);
  }

  return byBase; // Map<base, rawRecs[]> — resolved per-lemma in resolveLemma()
}

// Compound-NAME fragment rows ("Abi" + "-melech"): they carry a partial gloss
// like "(Huram)-abi", never a standalone lexical sense. NOT the same as a mere
// cross-reference ("in Aramaic of H1", "a Name of H29") whose own row is fine.
const FRAGMENT_RE = /\b(a Part of|combination of|a group of)\b/i;

/**
 * Resolve one base Strong's worth of TBESH sub-entries into a single primary
 * lexical sense. `domNormForm` is the dominant NORMALISED gloss_en form from
 * ACTUAL usage — used to disambiguate which lexical sub-entry is primary when
 * TBESH lists several (e.g. בַּיִת H1004 has sub-entries "place" / "house" /
 * a dozen "Beth-X" place names — usage says "house").
 */
function resolveLemma(base, recs, domNormForm) {
  // lexical (non-name, non-fragment) candidates
  const lexical = recs.filter(
    r => !/^N:/.test(r.morph) && !FRAGMENT_RE.test(r.dStrong),
  );
  const properNoun = lexical.length === 0;

  let primary;
  if (properNoun) {
    primary =
      recs.find(r => r.dTok === base + 'G') ||
      recs.find(r => r.dTok === base) ||
      recs[0];
  } else {
    const domStem = (domNormForm || '').split(' ').map(stem).filter(Boolean);
    const scored = lexical
      .map(r => {
        const headToks = normGloss(tbeshHead(r.gloss))
          .split(' ')
          .filter(Boolean);
        let score = 0;
        for (const ht of headToks) {
          if (domStem.includes(ht)) score += 3;
          else if (domStem.some(d => d.startsWith(ht) || ht.startsWith(d))) {
            score += 2;
          }
        }
        // a parenthetical in the gloss ("Garden (of Uzza)", "Salt (Sea)") marks
        // a named entity — prefer the clean common-noun sub-entry
        if (/[()]/.test(r.gloss)) score -= 2;
        if (
          /^[A-Z]/.test(r.gloss.trim()) &&
          !/^[A-Z]{2,}/.test(r.gloss.trim())
        ) {
          score -= 1; // Capitalised → likely a proper form
        }
        // tie-breakers: plain "=" beats "A" beats "B"; shorter suffix wins
        const suf = r.dTok.slice(base.length);
        const sufRank = suf === '' ? 0 : suf.charCodeAt(0) - 64; // A→1 …
        return {r, score, sufRank};
      })
      .sort((a, b) => b.score - a.score || a.sufRank - b.sufRank);
    primary = scored[0].r;
  }

  // Sense count: distinct head glosses across the lexical sub-entries (or, for
  // a name, across the name sub-entries), excluding "x: y" sub-sense rows.
  const pool = properNoun
    ? recs.filter(r => !FRAGMENT_RE.test(r.dStrong))
    : lexical;
  const senseHeads = new Set();
  for (const r of pool) {
    if (/:\s/.test(r.gloss)) continue; // "spirit: breath" — a sub-sense, not new
    const h = tbeshHead(r.gloss);
    if (h) senseHeads.add(h.toLowerCase());
  }

  return {
    recs,
    primary,
    properNoun,
    translit: primary.translit || (recs[0] && recs[0].translit) || '',
    hebrew: primary.hebrew || (recs[0] && recs[0].hebrew) || '',
    morph: primary.morph || '',
    tbeshGloss: cleanTbeshGloss(primary.gloss, properNoun),
    tbeshHeadGloss: tbeshHead(primary.gloss),
    senseCount: Math.max(1, senseHeads.size),
  };
}

/** Headword of a TBESH gloss: text before a " : " sense split, minus a
 *  leading "to " (verbs) and surrounding backticks. */
function tbeshHead(g) {
  if (!g) return '';
  let s = g.replace(/`/g, '').trim();
  s = s.split(/:\s/)[0].trim();
  s = s
    .replace(/^to\s+/i, '')
    .replace(/^\([^)]*\)\s*/, '')
    .trim();
  return s;
}

function cleanTbeshGloss(g, properNoun) {
  if (!g) return '';
  let s = g.replace(/`/g, '').replace(/\s+/g, ' ').trim();
  if (properNoun) return s; // English form, pending the RVR1960 spelling pass
  // non-proper: keep it terse — first sense segment
  s = s.split(/:\s/)[0].trim();
  return s;
}

// ── originals.db parse ────────────────────────────────────────────────────
function parseOriginals() {
  if (!fs.existsSync(ORIGINALS_DB)) {
    throw new Error(
      `originals.db not found at ${ORIGINALS_DB}\n` +
        'Pass a path as argv[2], or fetch ' +
        'https://eternalstonebible.github.io/packs/originals.db',
    );
  }
  const db = new DatabaseSync(ORIGINALS_DB);
  const totalH = db
    .prepare("SELECT COUNT(*) c FROM original_words WHERE lang='H'")
    .get().c;
  const nullStrongsH = db
    .prepare(
      "SELECT COUNT(*) c FROM original_words WHERE lang='H' AND strongs IS NULL",
    )
    .get().c;

  const lemmas = new Map(); // strongs -> { occ, glossCounts: Map }
  const rows = db
    .prepare(
      'SELECT strongs, gloss_en, COUNT(*) n FROM original_words ' +
        "WHERE lang='H' AND strongs IS NOT NULL GROUP BY strongs, gloss_en",
    )
    .all();
  for (const r of rows) {
    let e = lemmas.get(r.strongs);
    if (!e) {
      e = {
        occ: 0,
        glossCounts: new Map(),
        rawTop: null,
        rawTopN: 0,
        verses: [],
      };
      lemmas.set(r.strongs, e);
    }
    e.occ += r.n;
    if (r.n > e.rawTopN) {
      e.rawTopN = r.n;
      e.rawTop = r.gloss_en;
    }
    const k = normGloss(r.gloss_en || '') || '∅';
    e.glossCounts.set(k, (e.glossCounts.get(k) || 0) + r.n);
  }
  // Up to 8 spread-out occurrence verses per lemma — feeds the RVR1960
  // proper-noun spelling cross-check (see attestNameInRvr).
  const vrows = db
    .prepare(
      'SELECT strongs, book_id, chapter, verse FROM original_words ' +
        "WHERE lang='H' AND strongs IS NOT NULL " +
        'GROUP BY strongs, book_id, chapter, verse',
    )
    .all();
  for (const r of vrows) {
    const e = lemmas.get(r.strongs);
    if (e && e.verses.length < 400) {
      e.verses.push([r.book_id, r.chapter, r.verse]);
    }
  }
  for (const e of lemmas.values()) {
    if (e.verses.length > 8) {
      const step = e.verses.length / 8;
      e.verses = Array.from(
        {length: 8},
        (_, i) => e.verses[Math.floor(i * step)],
      );
    }
  }
  db.close();
  return {totalH, nullStrongsH, lemmas};
}

// ── RVR1960 verse text (assets/bible-seed.db) — for the proper-noun pass ───
let _rvrDb = null;
let _rvrStmt = null;
function rvrVerseText(bookId, chapter, verse) {
  if (_rvrDb === null) {
    const p = path.join(ROOT, 'assets', 'bible-seed.db');
    if (!fs.existsSync(p)) {
      _rvrDb = false;
      return null;
    }
    _rvrDb = new DatabaseSync(p);
    _rvrStmt = _rvrDb.prepare(
      "SELECT text FROM verses WHERE version='RVR1960' " +
        'AND book_id=? AND chapter=? AND verse=?',
    );
  }
  if (_rvrDb === false) return null;
  const row = _rvrStmt.get(bookId, chapter, verse);
  return row ? row.text : null;
}

/** Strip Spanish diacritics + lowercase, for accent-insensitive matching. */
function deaccent(s) {
  return String(s || '')
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase();
}

/**
 * Does RVR1960 print `candidate` (or its head token) in any of this lemma's
 * occurrence verses? Returns the actual attested surface form (accented, as
 * printed) or null. A miss means UNVERIFIED, never "wrong" — RVR1960
 * legitimately renders a name with a pronoun / omits it / uses a title in
 * many verses the Hebrew word appears in.
 */
function attestNameInRvr(verses, candidate) {
  if (!candidate || !verses || !verses.length) return null;
  const heads = candidate
    .split(/\s*\/\s*|\s+o\s+/i)
    .map(x => x.trim().split(/[\s-]/)[0])
    .filter(x => x && x.length >= 3);
  if (!heads.length) return null;
  for (const [b, c, v] of verses) {
    const text = rvrVerseText(b, c, v);
    if (!text) continue;
    const flat = deaccent(text);
    for (const h of heads) {
      const dh = deaccent(h);
      const idx = flat.indexOf(dh);
      if (idx < 0) continue;
      // whole-word-ish: boundary before, and the match covers a real word start
      const before = idx === 0 ? ' ' : flat[idx - 1];
      if (/[a-zñ]/.test(before)) continue;
      // recover the printed form from the ORIGINAL text at the same offset
      const m = text
        .slice(idx)
        .match(/^[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+(?:-[A-Za-zÁÉÍÓÚÜÑáéíóúüñ]+)*/);
      if (m) return m[0];
    }
  }
  return null;
}

// ── main ──────────────────────────────────────────────────────────────────
function main() {
  ensureTbesh();
  console.log('· parsing TBESH …');
  const tbesh = parseTbesh();
  console.log('· parsing originals.db …');
  const {totalH, nullStrongsH, lemmas} = parseOriginals();
  console.log('· loading strongs-defs-es.json …');
  const esDefs = JSON.parse(fs.readFileSync(ES_JSON, 'utf8'));
  delete esDefs._comment;

  const usedStrongs = [...lemmas.keys()].sort(
    (a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10),
  );

  const AUDIT_FORCE = new Set([
    'H1254',
    'H430',
    'H7225',
    'H2617',
    'H1',
    'H120',
    'H68',
    'H559',
    'H1961',
    'H3605',
    'H4428',
    'H3820',
    'H1004',
    'H5892',
    'H2719',
  ]);

  const records = [];
  const auditSamples = [];
  for (const strongs of usedStrongs) {
    const lem = lemmas.get(strongs);
    const dist = [...lem.glossCounts.entries()].sort((a, b) => b[1] - a[1]);
    const dominantForm = dist[0] ? dist[0][0] : '';
    const dominantShare = dist[0] ? dist[0][1] / lem.occ : 0;
    const recurringSenses = dist.filter(
      ([, n]) => n >= 2 && n / lem.occ >= 0.03,
    ).length;
    const defEs = esDefs[strongs] || null;
    const pctTokens = (lem.occ / totalH) * 100;

    const recs = tbesh.get(strongs);
    const t = recs
      ? resolveLemma(strongs, recs, dominantForm)
      : {
          properNoun: false,
          translit: '',
          hebrew: '',
          morph: '',
          tbeshGloss: '',
          tbeshHeadGloss: '',
          primary: {gloss: ''},
          senseCount: 1,
        };

    const morphType = (t.morph.split(':')[1] || '').split(/[-+]/)[0].trim();
    const functionHeld =
      FUNCTION_MORPH_TYPES.has(morphType) && lem.occ >= FUNCTION_HOLD_MIN_OCC;

    const fromMap = translateTbesh(strongs, t.primary.gloss || t.tbeshGloss);
    const fromDef = headSense(defEs);
    // Prefer the curated map for the concrete vocabulary it covers — it tracks
    // ACTUAL usage and sidesteps openscriptures' etymology-first heads. Fall
    // back to the vetted Spanish definition head. Neither ⇒ no safe draft.
    const draft = fromMap || fromDef || '';
    const draftSource = fromMap
      ? 'tbesh-map'
      : fromDef
        ? 'definition_es-head'
        : '';

    let bucket;
    let proposed = '';
    let proposedSource = '';
    let heldReason = '';

    if (t.properNoun) {
      bucket = 'proper-noun';
      proposed = t.tbeshGloss || lem.rawTop || '';
      proposedSource = 'tbesh-en-placeholder';
    } else if (DENYLIST.has(strongs)) {
      bucket = 'judgment';
      heldReason = 'denylist';
    } else if (functionHeld) {
      bucket = 'judgment';
      heldReason = `function-word (${morphType}, ${lem.occ} occ)`;
    } else if (dominantShare >= 0.85 && recurringSenses <= 3) {
      if (draft) {
        bucket = 'mechanical';
        proposed = draft;
        proposedSource = draftSource;
      } else if (!defEs) {
        bucket = 'mechanical';
        proposedSource = 'tbesh-untranslated';
      } else {
        bucket = 'judgment';
        heldReason = 'definition_es not condensable to a terse gloss';
      }
    } else {
      bucket = 'judgment';
      heldReason =
        dominantShare < 0.85
          ? `no dominant sense (top ${dominantShare.toFixed(2)})`
          : `${recurringSenses} recurring senses`;
    }

    if (
      (AUDIT_FORCE.has(strongs) ||
        (auditSamples.length < 34 && lem.occ >= 8)) &&
      !auditSamples.some(a => a.strongs === strongs)
    ) {
      auditSamples.push({
        strongs,
        occ: lem.occ,
        bucket,
        dominantShare,
        top: dist.slice(0, 5).map(([k, n]) => `${k}·${n}`),
      });
    }

    records.push({
      strongs,
      translit: t.translit || '',
      hebrew: t.hebrew || '',
      bucket,
      tbeshGloss: t.tbeshGloss,
      tbeshRawGloss: t.primary.gloss || '',
      defEs,
      dominantForm,
      dominantShare,
      recurringSenses,
      tbeshSenseCount: t.senseCount,
      occ: lem.occ,
      pctTokens,
      proposed,
      proposedSource,
      heldReason,
      morph: t.morph,
      wouldBeMechanical:
        !t.properNoun && dominantShare >= 0.85 && recurringSenses <= 3,
      _fromMap: fromMap,
      _fromDef: fromDef,
      _tbeshHeadGloss: t.tbeshHeadGloss || '',
      rawTop: lem.rawTop || '',
      verses: lem.verses || [],
    });
  }

  // ── A3 full-coverage pass — a first-pass Spanish gloss for EVERY lemma ────
  assignFullGloss(records);

  if (process.env.A3_DUMP) {
    fs.mkdirSync(OUT_DIR, {recursive: true});
    fs.writeFileSync(
      path.join(OUT_DIR, '_a3-dump.json'),
      JSON.stringify(
        records.map(r => ({...r, verses: undefined})),
        null,
        1,
      ),
    );
    console.log('   (A3_DUMP) wrote DOCS/drafts/_a3-dump.json');
  }

  writeOutputs({records, totalH, nullStrongsH, esDefs, auditSamples});
  writeA3Full({records, totalH, nullStrongsH});
}

/**
 * Resolve `fullGloss` + `fullSource` (+ review `flag`) for every used lemma.
 * Priority:
 *   1. hand maps (particle / divine / weighted / high-freq fix)
 *   2. proper-noun bucket → RVR1960 spelling from the vetted definition_es
 *      (+ an accent-insensitive cross-check against assets/bible-seed.db)
 *   3. mechanical bucket → the draft already produced by the classifier
 *   4. judgment / mechanical-blank →  definition_es head  (task: ES first)
 *                                  →  curated EN→ES map on the TBESH raw gloss
 *                                  →  TBESH head-gloss translated to ES
 *                                  →  permissive definition_es condense
 *                                  →  last resort: cleaned TBESH head + FLAG
 */
function assignFullGloss(records) {
  let dbChecked = 0;
  for (const r of records) {
    const s = r.strongs;
    let gloss = '';
    let source = '';

    if (PARTICLE_ES[s]) {
      gloss = PARTICLE_ES[s];
      source = 'hand-particle';
    } else if (DIVINE_NAMES_ES[s]) {
      gloss = DIVINE_NAMES_ES[s];
      source = 'hand-divine';
    } else if (WEIGHTED_ES[s]) {
      gloss = WEIGHTED_ES[s];
      source = 'hand-weighted';
    } else if (JUDGMENT_FIX_ES[s]) {
      gloss = JUDGMENT_FIX_ES[s];
      source = 'hand-fix';
    } else if (r.bucket === 'proper-noun') {
      const pn = properNounEs(r);
      gloss = pn.gloss;
      source = pn.source;
      // RVR1960 cross-check (accent-insensitive; a miss = unverified, not wrong)
      const attested = attestNameInRvr(r.verses, gloss);
      r._dbAttested = attested || '';
      dbChecked++;
      if (
        attested &&
        deaccent(attested) !== deaccent(gloss) &&
        deaccent(attested).split('-')[0] !== deaccent(gloss).split(/[ /]/)[0]
      ) {
        // RVR prints a materially different form — keep ours, flag for review
        flagLemma(
          s,
          'proper-mismatch',
          `RVR1960 imprime «${attested}» en un versículo de muestra`,
        );
      }
      if (pn.source === 'auto-translit')
        flagLemma(s, 'proper-fallback', 'transliteración automática — revisar');
    } else if (r.bucket === 'mechanical' && r.proposed) {
      gloss = capClean(r.proposed);
      source = r.proposedSource || 'mechanical';
    } else {
      // judgment + mechanical-blank + judgment-without-defEs
      const viaDef = headSense(r.defEs);
      const viaMap = r._fromMap || translateTbesh(s, r.tbeshRawGloss);
      const viaHead = tbeshHeadEs(r._tbeshHeadGloss);
      const viaLoose = looseHead(r.defEs);
      if (viaDef) {
        gloss = capClean(viaDef);
        source = 'definition_es-head';
      } else if (viaMap) {
        gloss = capClean(viaMap);
        source = 'tbesh-map';
      } else if (viaHead) {
        gloss = capClean(viaHead);
        source = 'tbesh-head-es';
      } else if (viaLoose) {
        gloss = capClean(viaLoose);
        source = 'definition_es-loose';
      } else {
        gloss = capClean(translitTbeshHeadFallback(r));
        source = 'UNTRANSLATED';
        flagLemma(s, 'untranslated', 'sin traducción automática fiable');
      }
      // Flag meaningful-frequency auto glosses so the owner has a review list.
      if (
        source !== 'UNTRANSLATED' &&
        r.occ >= 50 &&
        !A3_FLAGS.has(s) &&
        !r._fromDef
      ) {
        flagLemma(
          s,
          'low-confidence',
          `auto (${source}); ${r.occ} ocurrencias`,
        );
      }
    }

    r.fullGloss = capClean(gloss) || capClean(r.tbeshGloss) || '(?)';
    r.fullSource = source;
  }
  if (_rvrDb && _rvrDb !== false) {
    console.log(`   RVR1960 proper-noun cross-check: ${dbChecked} lemmas`);
  }
}

/** Absolute last-resort value so the JSON never has an empty — a cleaned
 *  English TBESH head. Always paired with an 'untranslated' flag. */
function translitTbeshHeadFallback(r) {
  const h = (r._tbeshHeadGloss || r.tbeshGloss || r.dominantForm || '').trim();
  return (
    h
      .replace(/[<>[\]{}*`_#|]/g, '')
      .replace(/\s+/g, ' ')
      .trim() || 'término'
  );
}

function csvCell(v) {
  const s = v === null || v === undefined ? '' : String(v);
  return /[",\r\n]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s;
}

function trunc(s, n) {
  if (!s) return '';
  return s.length <= n ? s : s.slice(0, n - 1).trimEnd() + '…';
}

function writeOutputs({records, totalH, nullStrongsH, esDefs, auditSamples}) {
  fs.mkdirSync(OUT_DIR, {recursive: true});

  const byBucket = k => records.filter(r => r.bucket === k);
  const mech = byBucket('mechanical');
  const proper = byBucket('proper-noun');
  const judg = byBucket('judgment');
  const sum = arr => arr.reduce((a, r) => a + r.occ, 0);

  // ── draft JSON ──────────────────────────────────────────────────────────
  const glossMap = {};
  const properList = [];
  for (const r of records) {
    if (r.bucket === 'mechanical' && r.proposed)
      glossMap[r.strongs] = r.proposed;
    if (r.bucket === 'proper-noun') {
      glossMap[r.strongs] = r.proposed; // English placeholder
      properList.push(r.strongs);
    }
  }
  const numKey = k => parseInt(k.slice(1), 10);
  const sortedGloss = {};
  for (const k of Object.keys(glossMap).sort((a, b) => numKey(a) - numKey(b))) {
    sortedGloss[k] = glossMap[k];
  }
  const json = {
    _comment:
      'DRAFT — A3 decision-support artifact, NOT wired into the app. Terse ' +
      "Spanish inline glosses keyed by base Strong's number. Values for keys " +
      'listed in _properNouns are ENGLISH placeholders from TBESH pending an ' +
      'RVR1960-conventional Spanish spelling pass (Ezequías, not Hezekiah). ' +
      'All other values are Spanish: condensed from the vetted definition_es ' +
      'head, or from a curated in-source EN→ES map for common unambiguous ' +
      'vocabulary. Held-back (judgment) lemmas are deliberately absent — the ' +
      'per-lemma provenance + every held reason is in the review CSV.',
    _source:
      'STEPBible TBESH (CC BY 4.0, Gloss column only) + originals pack ' +
      'gloss_en distribution + scripts/strongs-defs-es.json. ' +
      'Generated by scripts/build-hebrew-lemma-gloss-es.js',
    _generated: new Date().toISOString().slice(0, 10),
    _counts: {
      total_used_lemmas: records.length,
      mechanical: mech.filter(r => r.proposed).length,
      proper_noun_placeholders: properList.length,
      held_back_not_included: judg.length,
    },
    _properNouns: properList.slice().sort((a, b) => numKey(a) - numKey(b)),
    ...sortedGloss,
  };
  fs.writeFileSync(
    path.join(OUT_DIR, 'hebrew-lemma-gloss-es.draft.json'),
    JSON.stringify(json, null, 2) + '\n',
  );

  // ── review CSV ──────────────────────────────────────────────────────────
  // final_gloss / final_source / review_flag are the A3 full-coverage columns
  // (one Spanish gloss for EVERY lemma); proposed_gloss stays as the original
  // decision-support draft (mechanical + proper-noun buckets only).
  const head = [
    'strongs',
    'translit',
    'bucket',
    'final_gloss',
    'final_source',
    'review_flag',
    'definition_es',
    'dominant_gloss_share',
    'occurrences',
    'pct_running_tokens',
    'tbesh_gloss',
    'proposed_gloss',
    'proposed_source',
    'held_reason',
    'rvr1960_db_form',
  ];
  const lines = [head.join(',')];
  for (const r of records) {
    lines.push(
      [
        r.strongs,
        r.translit,
        r.bucket,
        r.fullGloss || '',
        r.fullSource || '',
        A3_FLAGS.get(r.strongs) ? A3_FLAGS.get(r.strongs).kind : '',
        trunc(r.defEs || '', 80),
        r.dominantShare.toFixed(3),
        r.occ,
        r.pctTokens.toFixed(4),
        trunc(r.tbeshGloss, 60),
        r.proposed,
        r.proposedSource,
        r.heldReason,
        r._dbAttested || '',
      ]
        .map(csvCell)
        .join(','),
    );
  }
  // RFC4180 quoting (see csvCell); LF line endings to match repo convention and
  // avoid git autocrlf churn — Excel / pandas / Numbers all accept LF-only CSV.
  fs.writeFileSync(
    path.join(OUT_DIR, 'hebrew-lemma-gloss-es-review.csv'),
    lines.join('\n') + '\n',
  );

  // ── STATS.md ────────────────────────────────────────────────────────────
  const pct = n => ((n / totalH) * 100).toFixed(2);
  const usedTokens = totalH - nullStrongsH;
  const ceiling = ((usedTokens / totalH) * 100).toFixed(2);

  const noEs = records.filter(r => !r.defEs);
  const noEsByBucket = {
    'proper-noun': noEs.filter(r => r.bucket === 'proper-noun').length,
    mechanical: noEs.filter(r => r.bucket === 'mechanical').length,
    judgment: noEs.filter(r => r.bucket === 'judgment').length,
  };
  const mechNoEsNoTx = records.filter(
    r => r.bucket === 'mechanical' && !r.proposed,
  );

  const denyMoved = records.filter(
    r => DENYLIST.has(r.strongs) && r.wouldBeMechanical,
  );
  const fnMoved = records.filter(
    r =>
      r.bucket === 'judgment' &&
      /^function-word/.test(r.heldReason) &&
      r.wouldBeMechanical,
  );
  const metaMoved = records.filter(
    r => r.heldReason === 'definition_es not condensable to a terse gloss',
  );
  const mapUsed = records.filter(r => r.proposedSource === 'tbesh-map');

  const fmtRow = r =>
    `| ${r.strongs} | ${r.translit} | ${r.bucket} | ${r.occ} | ` +
    `${r.dominantShare.toFixed(2)} | ${trunc(r.tbeshGloss, 22)} | ` +
    `${r.proposed || '—'} |`;

  // 15-20 sample draft glosses across the frequency range
  const withProposal = records.filter(
    r => r.proposed && r.bucket === 'mechanical',
  );
  withProposal.sort((a, b) => b.occ - a.occ);
  const pick = [];
  const bands = [
    [0, 5],
    [5, 10],
    [10, 15],
    [15, 20],
    [20, 25],
    [25, 40],
    [40, 60],
    [60, 90],
    [90, 130],
    [130, 999],
  ];
  const step = Math.max(1, Math.floor(withProposal.length / 18));
  for (let i = 0; i < withProposal.length && pick.length < 18; i += step) {
    pick.push(withProposal[i]);
  }

  const properSample = proper
    .filter(r => r.occ >= 50)
    .sort((a, b) => b.occ - a.occ)
    .slice(0, 8);

  const md = `# A3 — Hebrew per-lemma Spanish gloss: scope & quality report

_Generated ${new Date().toISOString().slice(0, 10)} by \`scripts/build-hebrew-lemma-gloss-es.js\`._
_Draft artifact for a scope decision — nothing here is wired into the app._

## The headline number

A reader looking at an average OT verse sees a mix of content words and
grammatical particles. Of the **${totalH.toLocaleString()}** Hebrew word rows in the pack,
**${nullStrongsH.toLocaleString()}** (${pct(nullStrongsH)}%) carry no Strong's number at all
(prefixes, particles) and are permanently out of scope. So **${ceiling}% is the
absolute ceiling**, not 100%.

| Scope choice | Lemmas with a Spanish gloss | Running-token coverage |
|---|---|---|
| **mechanical only** (auto-safe, Spanish ready) | ${mech.filter(r => r.proposed).length} | **${pct(sum(mech.filter(r => r.proposed)))}%** |
| **mechanical + proper-noun** (proper = English placeholder ⚠️) | ${mech.filter(r => r.proposed).length + proper.length} | **${pct(sum(mech.filter(r => r.proposed)) + sum(proper))}%** |
| all ${records.length} used lemmas (ceiling) | ${records.length} | ${ceiling}% |
| _held back for human drafting_ | ${judg.length} | ${pct(sum(judg))}% of tokens |

> The held-back bucket is a minority of *lemmas* but the **majority of running
> tokens** (${pct(sum(judg))}%) — a handful of very high-frequency words
> (אֵת, עַל, אֲשֶׁר, כִּי, הָיָה, אָמַר, כֹּל, the divine name …) dominate the
> token count, and every one of them is a real translation judgment.

⚠️ **${proper.length} of the values in the draft JSON are English** (TBESH forms like
"Hezekiah", "Jerusalem", "LORD"). They are listed under \`_properNouns\` and need
an RVR1960-conventional Spanish spelling pass (Ezequías, Jerusalén, Jehová/SEÑOR)
before A3 could ship. Only the ${mech.filter(r => r.proposed).length} mechanical
values are Spanish today.

## Bucket counts

| Bucket | Lemmas | % of used lemmas | Occurrences | % of running tokens |
|---|---|---|---|---|
| proper-noun | ${proper.length} | ${((proper.length / records.length) * 100).toFixed(1)}% | ${sum(proper).toLocaleString()} | ${pct(sum(proper))}% |
| mechanical | ${mech.length} | ${((mech.length / records.length) * 100).toFixed(1)}% | ${sum(mech).toLocaleString()} | ${pct(sum(mech))}% |
| &nbsp;&nbsp;↳ with a Spanish draft | ${mech.filter(r => r.proposed).length} | | ${sum(mech.filter(r => r.proposed)).toLocaleString()} | ${pct(sum(mech.filter(r => r.proposed)))}% |
| &nbsp;&nbsp;↳ blank (no definition_es, untranslated) | ${mechNoEsNoTx.length} | | ${sum(mechNoEsNoTx).toLocaleString()} | ${pct(sum(mechNoEsNoTx))}% |
| judgment / held-back | ${judg.length} | ${((judg.length / records.length) * 100).toFixed(1)}% | ${sum(judg).toLocaleString()} | ${pct(sum(judg))}% |
| **total used lemmas** | **${records.length}** | 100% | **${(totalH - nullStrongsH).toLocaleString()}** | ${ceiling}% |

Classifier:
- **proper-noun** = the lemma has NO lexical (non-name, non-fragment) TBESH
  sub-entry — every sense TBESH records is a personal / place / title name.
- **mechanical** = not proper, not on the held-back denylist, not a
  high-frequency function word, ONE normalized \`gloss_en\` form covers ≥ 0.85
  of actual occurrences, ≤ 3 recurring senses, AND a clean terse Spanish draft
  was producible (from the vetted \`definition_es\` head or the curated EN→ES
  map).
- **judgment** = everything else + the denylist + the function-word rule.

### vs. the pre-scoping estimates

| | estimate | actual | note |
|---|---|---|---|
| used Hebrew lemmas | 8,503 | ${records.length} | ${records.length === 8503 ? 'confirmed' : 'DIFFERS'} |
| \`strongs IS NULL\` rows | ~6,078 | ${nullStrongsH} | ${nullStrongsH === 6078 ? 'confirmed' : 'DIFFERS'} |
| Hebrew word rows | ~305,008 | ${totalH} | ${totalH === 305008 ? 'confirmed' : 'DIFFERS'} |
| proper-noun bucket | ~2,649 | ${proper.length} | ${Math.abs(proper.length - 2649) <= 20 ? 'confirmed (±noise)' : 'DIFFERS'} |
| mechanical bucket | ~2,600 | ${mech.filter(r => r.proposed).length} ready + ${mechNoEsNoTx.length} pending EN→ES | larger — see method note |
| judgment bucket | ~3,250 | ${judg.length} | smaller — see method note |
| lemmas with \`definition_es\` | ~8,193 | ${records.filter(r => r.defEs).length} | ${records.filter(r => r.defEs).length === 8193 ? 'confirmed' : 'DIFFERS'} |
| lemmas with NO Spanish | ~310 (~419 occ) | ${noEs.length} (${sum(noEs)} occ) | ${noEs.length === 310 ? 'confirmed' : 'DIFFERS'} |

**Method note — why mechanical came out larger than the ~2,600 estimate.**
The estimate predated two things this pipeline added: (1) a **dominant-share test
computed from actual OT usage** (\`original_words.gloss_en\`), which confirms that
a large class of concrete common nouns/verbs — king, day, house, hand, water,
sword, gold, the cardinal numbers — genuinely carry one sense ≥ 85% of the time;
(2) a **curated in-source EN→ES map** (\`TBESH_EN_ES\`, ${mapUsed.length} lemmas hit)
for exactly that unambiguous vocabulary, which lets those lemmas get a safe terse
gloss instead of being held only for want of a condensable \`definition_es\`.
Net effect: mechanical holds ${pct(sum(mech.filter(r => r.proposed)))}% of
running tokens and held-back is ${pct(sum(judg))}% (the estimate assumed ~73%).
The held-back bucket still contains every genuinely polysemous or weighted word;
the divergence is in the conservative direction (a real gloss where the estimate
expected none), but it is the user's call — raise the \`≥ 0.85\` threshold or
shrink the map to move the line back.

## The ~${noEs.length} lemmas with no Spanish text at all

${noEs.length} used lemmas have no \`definition_es\` in \`strongs-defs-es.json\`
(${sum(noEs)} occurrences, ${pct(sum(noEs))}% of running tokens). By bucket:

- proper-noun: **${noEsByBucket['proper-noun']}** (get an English placeholder anyway)
- mechanical: **${noEsByBucket.mechanical}** ${mechNoEsNoTx.length ? `(${mechNoEsNoTx.length} still blank — no reviewed EN→ES translation)` : '(all covered by the in-source EN→ES map)'}
- judgment: **${noEsByBucket.judgment}** (held back regardless)

Full list: \`hebrew-lemma-gloss-es-review.csv\`, filter \`definition_es\` empty.
First 40 (strongs · translit · bucket · occ):

${noEs
  .slice(0, 40)
  .map(r => `\`${r.strongs}\` ${r.translit || '?'} · ${r.bucket} · ${r.occ}`)
  .join('  \n')}

## Divine-name / theologically-weighted lemmas — where they landed

Every weighted lemma on the watchlist ${denyMoved.length + fnMoved.length + metaMoved.length > 0 ? 'was' : 'is'} kept OUT of the
mechanical bucket, either by the denylist or by a structural rule:

| strongs | translit | bucket | occ | dominant share | tbesh gloss | proposed |
|---|---|---|---|---|---|---|
${WEIGHTED_WATCH.filter((v, i, a) => a.indexOf(v) === i)
  .map(s => records.find(r => r.strongs === s))
  .filter(Boolean)
  .map(fmtRow)
  .join('\n')}

### What the held-back rules actually moved out of "mechanical"

- **denylist** pulled back ${denyMoved.length} lemma(s) that otherwise met the
  ≥0.85 / ≤3-senses bar: ${denyMoved.map(r => `\`${r.strongs}\` (${trunc(r.dominantForm, 16)})`).join(', ') || '—'}
- **function-word rule** (Morph type + ≥ ${FUNCTION_HOLD_MIN_OCC} occ) pulled back
  ${fnMoved.length}: ${fnMoved
    .slice(0, 25)
    .map(r => `\`${r.strongs}\``)
    .join(', ')}${fnMoved.length > 25 ? ' …' : ''}
- **not-condensable guard** demoted ${metaMoved.length} candidate(s) whose
  \`definition_es\` is etymology-first or lexicographer's meta-language with no
  clean terse head (e.g. "${(metaMoved[0] && trunc(metaMoved[0].defEs, 40)) || '—'}")

### Draft-gloss provenance (mechanical bucket)

- **${mech.filter(r => r.proposedSource === 'definition_es-head').length}** condensed from the vetted \`definition_es\` head
- **${mapUsed.length}** from the in-source curated EN→ES map (\`TBESH_EN_ES\`) —
  used for concrete common vocabulary and to override an etymology-first
  \`definition_es\` head that the word never carries in use (e.g. חֶרֶב H2719 →
  "espada", not the Strong's-lead "sequía")
- **${mechNoEsNoTx.length}** still blank — a rare word with no \`definition_es\` and
  no map entry; needs a one-line manual EN→ES translation (trivial scope,
  ${pct(sum(mechNoEsNoTx))}% of tokens), excluded from the JSON

> **Reviewer caveat.** \`definition_es-head\` glosses are condensed from
> openscriptures-style Strong's definitions, which occasionally lead with an
> ETYMOLOGICAL sense the word does not carry in use (a def opening "un eje;
> figurativamente, un magnate, príncipe" yields "eje" where the word means
> "señor"). The CSV puts \`definition_es\` next to \`proposed_gloss\` on every
> row so these are caught on a skim. The ${mapUsed.length} \`tbesh-map\` glosses
> track the TBESH \`Gloss\` column (chosen to match primary usage) and do not
> have this failure mode.

## Sample draft glosses (mechanical bucket, spread across the frequency range)

| strongs | translit | occ | %tokens | tbesh gloss (EN) | definition_es (head) | **proposed ES** | source |
|---|---|---|---|---|---|---|---|
${pick
  .map(
    r =>
      `| ${r.strongs} | ${r.translit} | ${r.occ} | ${r.pctTokens.toFixed(3)}% | ` +
      `${trunc(r.tbeshRawGloss, 22)} | ${trunc(r.defEs || '', 34)} | ` +
      `**${r.proposed}** | ${r.proposedSource} |`,
  )
  .join('\n')}

## Sample proper-noun placeholders (need the RVR1960 spelling pass)

| strongs | translit | occ | TBESH English | RVR1960 target (illustrative) |
|---|---|---|---|---|
${properSample
  .map(
    r =>
      `| ${r.strongs} | ${r.translit} | ${r.occ} | ${r.proposed} | _(e.g. ${rvrHint(
        r.proposed,
      )})_ |`,
  )
  .join('\n')}

## gloss_en normalization — before / after audit

The dominant-share test depends on collapsing TAHOT's inflected contextual
glosses to a bare head form. Spot-check that the merges are sane (a wrong merge
inflates a lemma's dominant share and could mis-file it as mechanical):

| strongs | occ | bucket | dominant | top 5 normalized forms (form·count) |
|---|---|---|---|---|
${auditSamples
  .slice(0, 26)
  .map(
    a =>
      `| ${a.strongs} | ${a.occ} | ${a.bucket} | ${a.dominantShare.toFixed(
        2,
      )} | ${a.top.join(' , ')} |`,
  )
  .join('\n')}

## Files

- \`DOCS/drafts/hebrew-lemma-gloss-es.draft.json\` — ${Object.keys(sortedGloss).length} entries
  (${mech.filter(r => r.proposed).length} mechanical Spanish + ${proper.length} proper-noun English placeholders)
- \`DOCS/drafts/hebrew-lemma-gloss-es-review.csv\` — ${records.length} rows, one per used lemma
- \`scripts/build-hebrew-lemma-gloss-es.js\` — this pipeline

## Licensing

Source is the STEPBible **TBESH** file (CC BY 4.0). Only the **\`Gloss\`** column
(index 6) is read; the **\`Meaning\`** column (index 7, Abridged BDB / Online
Bible, separate permission required) is firewalled — every data row is parsed as
\`line.split('\\t').slice(0, 7)\` so index 7 never exists in memory, and the
column identity is asserted from the file's own header before parsing. The TBESH
file and \`originals.db\` are cached outside the repo and never committed.
`;

  fs.writeFileSync(path.join(OUT_DIR, 'hebrew-lemma-gloss-es-STATS.md'), md);

  // Keep the generated .md / .json prettier-clean so `npm run format:check`
  // stays green after a regenerate (the CSV is exempt from that glob).
  prettify([
    path.join(OUT_DIR, 'hebrew-lemma-gloss-es-STATS.md'),
    path.join(OUT_DIR, 'hebrew-lemma-gloss-es.draft.json'),
  ]);

  console.log('\n✅ wrote:');
  console.log(
    `   DOCS/drafts/hebrew-lemma-gloss-es.draft.json  (${Object.keys(sortedGloss).length} entries)`,
  );
  console.log(
    `   DOCS/drafts/hebrew-lemma-gloss-es-review.csv   (${records.length} rows)`,
  );
  console.log(`   DOCS/drafts/hebrew-lemma-gloss-es-STATS.md`);
  console.log('\n— buckets —');
  console.log(
    `   proper-noun : ${proper.length}  (${pct(sum(proper))}% tokens)`,
  );
  console.log(
    `   mechanical  : ${mech.length}  (${pct(sum(mech))}% tokens)  [${mech.filter(r => r.proposed).length} with ES draft]`,
  );
  console.log(`   judgment    : ${judg.length}  (${pct(sum(judg))}% tokens)`);
  console.log(`   no-Spanish  : ${noEs.length}  (${sum(noEs)} occ)`);
  console.log(`   mech blank  : ${mechNoEsNoTx.length}`);
}

/** Best-effort `prettier --write` on the generated files so `format:check`
 *  stays green after a regenerate. Runs prettier's own CLI with THIS node —
 *  no PATH / npx dependency. Degrades silently if prettier isn't installed. */
function prettify(files) {
  let cli;
  try {
    cli = require.resolve('prettier/bin/prettier.cjs');
  } catch {
    console.warn(
      '   (prettier not installed — run `npm run format` if needed)',
    );
    return;
  }
  try {
    execFileSync(
      process.execPath,
      [cli, '--write', '--log-level', 'warn', ...files],
      {cwd: ROOT, stdio: 'ignore'},
    );
  } catch {
    console.warn('   (prettier pass failed — run `npm run format` if needed)');
  }
}

/** Illustrative RVR1960 spelling hint for the STATS proper-noun sample only. */
function rvrHint(en) {
  const map = {
    LORD: 'Jehová / SEÑOR',
    'The Lord': 'el Señor',
    'YHWH/God': 'Jehová el Señor',
    God: 'Dios',
    Jerusalem: 'Jerusalén',
    Israel: 'Israel',
    Judah: 'Judá',
    Moses: 'Moisés',
    David: 'David',
    Egypt: 'Egipto',
    Hezekiah: 'Ezequías',
    Aaron: 'Aarón',
    Pharaoh: 'Faraón',
    Jacob: 'Jacob',
    Joseph: 'José',
    Solomon: 'Salomón',
    Babylon: 'Babilonia',
    Benjamin: 'Benjamín',
    Ephraim: 'Efraín',
    Saul: 'Saúl',
    Aramean: 'arameo / Siria',
    Philistines: 'filisteos',
    Assyria: 'Asiria',
    Manasseh: 'Manasés',
    Zion: 'Sion',
  };
  return map[en] || 'Spanish spelling TBD';
}

// ═══ A3 full-coverage outputs ═══════════════════════════════════════════════

const FLAG_KIND_LABEL = {
  particle: 'Partícula gramatical',
  divine: 'Nombre / título divino',
  weighted: 'Término teológicamente cargado',
  fix: 'Corrección de alta frecuencia',
  'proper-fallback': 'Nombre propio sin definition_es',
  'proper-mismatch': 'Nombre propio: RVR1960 imprime otra forma',
  'low-confidence': 'Auto (frecuencia media) — verificar',
  untranslated: 'Sin traducción automática fiable',
};

function mdCell(v) {
  return String(v === null || v === undefined ? '' : v)
    .replace(/\|/g, '\\|')
    .replace(/\r?\n/g, ' ')
    .trim();
}

function writeA3Full({records, totalH}) {
  fs.mkdirSync(OUT_DIR, {recursive: true});
  const ASSET_DIR = path.join(ROOT, 'assets');
  const numKey = k => parseInt(k.slice(1), 10);

  // ── 1. the bundled dataset — flat {H####:"gloss"}, ALL used lemmas ───────
  const flat = {};
  for (const r of records) flat[r.strongs] = r.fullGloss;
  const sorted = {};
  for (const k of Object.keys(flat).sort((a, b) => numKey(a) - numKey(b))) {
    sorted[k] = flat[k];
  }

  // hard contract assertions — fail loudly rather than ship a broken asset
  const keys = Object.keys(sorted);
  const problems = [];
  if (keys.length !== records.length)
    problems.push(`key count ${keys.length} != ${records.length}`);
  for (const [k, v] of Object.entries(sorted)) {
    if (!/^H\d+$/.test(k)) problems.push(`bad key ${k}`);
    if (!v || !String(v).trim()) problems.push(`empty value for ${k}`);
    if (String(v).length > GLOSS_MAXLEN)
      problems.push(`over ${GLOSS_MAXLEN} chars: ${k} = "${v}" (${v.length})`);
    if (/[<>[\]{}*`_#|~]/.test(v)) problems.push(`markup in ${k} = "${v}"`);
  }
  if (problems.length) {
    console.error('\n❌ A3 dataset contract violations:');
    for (const p of problems.slice(0, 40)) console.error('   ' + p);
    throw new Error(
      `${problems.length} contract violation(s) — asset NOT written`,
    );
  }

  fs.writeFileSync(
    path.join(ASSET_DIR, 'hebrew-lemma-gloss-es.json'),
    JSON.stringify(sorted, null, 2) + '\n',
  );

  // ── 2. the review package ──────────────────────────────────────────────
  const bySrc = {};
  for (const r of records) bySrc[r.fullSource] = (bySrc[r.fullSource] || 0) + 1;
  const proper = records.filter(r => r.bucket === 'proper-noun');
  const attestedN = proper.filter(r => r._dbAttested).length;

  const flagged = [...A3_FLAGS.entries()]
    .map(([strongs, f]) => ({
      strongs,
      ...f,
      rec: records.find(r => r.strongs === strongs),
    }))
    .filter(x => x.rec)
    .sort((a, b) => b.rec.occ - a.rec.occ);
  const flaggedByKind = k => flagged.filter(x => x.kind === k);

  const theo = records
    .filter(
      r =>
        (r.fullSource === 'hand-weighted' ||
          r.fullSource === 'hand-divine' ||
          r.fullSource === 'hand-particle' ||
          A3_FLAGS.get(r.strongs)?.kind === 'low-confidence') &&
        r.bucket !== 'proper-noun',
    )
    .sort((a, b) => b.occ - a.occ);

  const L = [];
  L.push('# A3 — Glosa española por lema hebreo · Paquete de revisión');
  L.push('');
  L.push(
    `_Generado por \`scripts/build-hebrew-lemma-gloss-es.js\` · rama \`feature/hebrew-lemma-gloss-es\`._`,
  );
  L.push(
    '_BORRADOR para la aprobación del propietario. Nada de esto está cableado en la app (eso es P2)._',
  );
  L.push('');
  L.push('## Resumen');
  L.push('');
  L.push(`| | |`);
  L.push(`|---|---|`);
  L.push(`| Lemas hebreos usados (total) | **${records.length}** |`);
  L.push(
    `| Entradas en \`assets/hebrew-lemma-gloss-es.json\` | **${keys.length}** (todas, planas, ordenadas) |`,
  );
  L.push(
    `| Nombres propios | ${proper.length} (${attestedN} con forma RVR1960 confirmada en un versículo de muestra) |`,
  );
  L.push(
    `| Lemas marcados para revisión | **${flagged.length}** (${flaggedByKind('particle').length} partículas · ${flaggedByKind('divine').length} nombres divinos · ${flaggedByKind('weighted').length} términos cargados · ${flaggedByKind('low-confidence').length} auto frecuencia media · ${flaggedByKind('proper-fallback').length} translit. a mano · ${flaggedByKind('proper-mismatch').length} discrepancia RVR · ${flaggedByKind('untranslated').length} sin traducción)_ |`,
  );
  L.push('');
  L.push('Procedencia de la glosa (`fullSource`):');
  L.push('');
  L.push('| fuente | lemas |');
  L.push('|---|---|');
  for (const [k, n] of Object.entries(bySrc).sort((a, b) => b[1] - a[1]))
    L.push(`| ${mdCell(k)} | ${n} |`);
  L.push('');
  L.push(
    '- `hand-*` — mapa curado a mano en el script (partículas, nombres divinos, términos cargados, correcciones de alta frecuencia).',
  );
  L.push(
    '- `defEs-*` — nombre / glosa condensada de `scripts/strongs-defs-es.json` (español ya cotejado).',
  );
  L.push(
    '- `tbesh-map` / `tbesh-head-es` — glosa TBESH (col. `Gloss` únicamente; col. `Meaning`/BDB nunca se lee) traducida al español.',
  );
  L.push(
    '- `definition_es-loose` — condensación permisiva del `definition_es` (red de seguridad para la cola).',
  );
  L.push(
    '- `UNTRANSLATED` — sin traducción automática fiable; ver la lista al final.',
  );
  L.push('');

  // (iii) flagged particles / divine / weighted — AT THE TOP
  L.push('---');
  L.push('');
  L.push(
    '## 1. Partículas, nombres divinos y términos cargados (lectura atenta)',
  );
  L.push('');
  for (const kind of ['particle', 'divine', 'weighted']) {
    const rows = flaggedByKind(kind);
    if (!rows.length) continue;
    L.push(`### ${FLAG_KIND_LABEL[kind]} (${rows.length})`);
    L.push('');
    L.push(
      '| Strong | translit | ocurr. | glosa propuesta | TBESH (EN) | definition_es (extracto) | nota |',
    );
    L.push('|---|---|---:|---|---|---|---|');
    for (const x of rows) {
      const r = x.rec;
      L.push(
        `| ${r.strongs} | ${mdCell(r.translit)} | ${r.occ} | **${mdCell(r.fullGloss)}** | ${mdCell(trunc(r.tbeshRawGloss, 22))} | ${mdCell(trunc(r.defEs || '', 60))} | ${mdCell(A3_NOTES[r.strongs] || x.note)} |`,
      );
    }
    L.push('');
  }

  // (ii) theologically-loaded lemmas — proposed gloss + source defEs + confidence
  L.push('---');
  L.push('');
  L.push(
    `## 2. Lemas teológicamente cargados / de frecuencia media (${theo.length})`,
  );
  L.push('');
  L.push(
    '`conf.` = confianza: **alta** (mapa a mano) · media (auto de `definition_es`) · baja (auto de TBESH / condensación permisiva).',
  );
  L.push('');
  L.push(
    '| Strong | translit | ocurr. | glosa propuesta | fuente | conf. | definition_es (extracto) |',
  );
  L.push('|---|---|---:|---|---|---|---|');
  for (const r of theo) {
    const conf = /^hand-/.test(r.fullSource)
      ? 'alta'
      : /definition_es-head|tbesh-map/.test(r.fullSource)
        ? 'media'
        : 'baja';
    L.push(
      `| ${r.strongs} | ${mdCell(r.translit)} | ${r.occ} | **${mdCell(r.fullGloss)}** | ${mdCell(r.fullSource)} | ${conf} | ${mdCell(trunc(r.defEs || '', 70))} |`,
    );
  }
  L.push('');

  // (i) proper-noun spelling table
  L.push('---');
  L.push('');
  L.push(`## 3. Nombres propios — ortografía RVR1960 (${proper.length})`);
  L.push('');
  L.push(
    '`RVR1960 (BD)` = forma realmente impresa por RVR1960 en un versículo de muestra donde aparece el lema (búsqueda sin acentos contra `assets/bible-seed.db`). Vacío = no confirmado en la muestra (no implica que la propuesta sea incorrecta). ⚠️ = la BD imprime una forma distinta — revisar.',
  );
  L.push('');
  L.push(
    '| Strong | translit | TBESH (EN) | propuesta (RVR1960) | RVR1960 (BD) | ocurr. |',
  );
  L.push('|---|---|---|---|---|---:|');
  for (const r of [...proper].sort((a, b) => b.occ - a.occ)) {
    const mism =
      r._dbAttested &&
      deaccent(r._dbAttested).split('-')[0] !==
        deaccent(r.fullGloss).split(/[ /]/)[0]
        ? ' ⚠️'
        : '';
    L.push(
      `| ${r.strongs} | ${mdCell(r.translit)} | ${mdCell(r.tbeshGloss || r.rawTop)} | **${mdCell(r.fullGloss)}** | ${mdCell(r._dbAttested || '')}${mism} | ${r.occ} |`,
    );
  }
  L.push('');

  // untranslated tail
  const untx = records
    .filter(r => r.fullSource === 'UNTRANSLATED')
    .sort((a, b) => b.occ - a.occ);
  if (untx.length) {
    L.push('---');
    L.push('');
    L.push(
      `## 4. Sin traducción automática fiable (${untx.length}) — glosa provisional = cabeza TBESH limpiada`,
    );
    L.push('');
    L.push('| Strong | translit | ocurr. | glosa provisional | TBESH (EN) |');
    L.push('|---|---|---:|---|---|');
    for (const r of untx)
      L.push(
        `| ${r.strongs} | ${mdCell(r.translit)} | ${r.occ} | ${mdCell(r.fullGloss)} | ${mdCell(r._tbeshHeadGloss)} |`,
      );
    L.push('');
  }

  L.push('---');
  L.push('');
  L.push('## 5. El grueso mecánico');
  L.push('');
  L.push(
    `Las ~${records.filter(r => /mechanical|defEs-name|defEs-gentilic|tbesh-head-es|definition_es-head/.test(r.fullSource)).length} glosas restantes (vocabulario concreto, no marcadas) están en \`DOCS/drafts/hebrew-lemma-gloss-es-review.csv\` — una fila por lema, con \`final_gloss\`, \`final_source\`, \`definition_es\` y \`dominant_gloss_share\` en columnas contiguas para revisión por muestreo.`,
  );
  L.push('');

  fs.writeFileSync(
    path.join(OUT_DIR, 'hebrew-lemma-gloss-es-REVIEW.md'),
    L.join('\n') + '\n',
  );

  prettify([
    path.join(ASSET_DIR, 'hebrew-lemma-gloss-es.json'),
    path.join(OUT_DIR, 'hebrew-lemma-gloss-es-REVIEW.md'),
  ]);

  console.log('\n✅ A3 full-coverage:');
  console.log(
    `   assets/hebrew-lemma-gloss-es.json             (${keys.length} entries, all ≤${GLOSS_MAXLEN} chars, no markup)`,
  );
  console.log(
    `   DOCS/drafts/hebrew-lemma-gloss-es-REVIEW.md   (${flagged.length} flagged)`,
  );
  const cov = totalH
    ? ((records.reduce((a, r) => a + r.occ, 0) / totalH) * 100).toFixed(2)
    : '?';
  console.log(`   running-token coverage: ${cov}%  (ceiling for used lemmas)`);
}

main();
