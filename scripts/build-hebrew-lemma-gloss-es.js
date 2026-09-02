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
      e = {occ: 0, glossCounts: new Map(), rawTop: null, rawTopN: 0};
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
  db.close();
  return {totalH, nullStrongsH, lemmas};
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
    });
  }

  writeOutputs({records, totalH, nullStrongsH, esDefs, auditSamples});
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
  const head = [
    'strongs',
    'translit',
    'bucket',
    'tbesh_gloss',
    'definition_es',
    'dominant_gloss_share',
    'recurring_senses',
    'tbesh_sense_count',
    'occurrences',
    'pct_running_tokens',
    'proposed_gloss',
    'proposed_source',
    'held_reason',
  ];
  const lines = [head.join(',')];
  for (const r of records) {
    lines.push(
      [
        r.strongs,
        r.translit,
        r.bucket,
        trunc(r.tbeshGloss, 60),
        trunc(r.defEs || '', 80),
        r.dominantShare.toFixed(3),
        r.recurringSenses,
        r.tbeshSenseCount,
        r.occ,
        r.pctTokens.toFixed(4),
        r.proposed,
        r.proposedSource,
        r.heldReason,
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

main();
