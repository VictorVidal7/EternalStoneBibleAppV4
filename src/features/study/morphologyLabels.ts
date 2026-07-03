/**
 * 📖 morphologyLabels — ES/EN human labels for the grammatical terms that
 * appear as attribute VALUES in the morphology code tables (see
 * [[morphologyCodes]]). This is a closed, finite dictionary of standard
 * Greek/Hebrew/Aramaic grammar terminology (parts of speech, cases, tenses,
 * moods, Hebrew verb stems…) — translating an established term is safe;
 * nothing here is invented lexicon or morphological content.
 *
 * Hebrew/Aramaic verb stem (binyan) names are conventionally NOT translated
 * in Spanish grammars either (a Spanish textbook still says "Qal", "Piel",
 * "Hifil"…) — kept as their standard Latinized spelling in both languages.
 *
 * Para la gloria de Dios Todopoderoso ✨
 */

export type MorphAttributeKey =
  | 'function'
  | 'tense'
  | 'voice'
  | 'mood'
  | 'person'
  | 'case'
  | 'number'
  | 'gender'
  | 'extra'
  | 'nameType'
  | 'originalLanguage'
  | 'adjNumber'
  | 'nameInOriginalLanguage'
  | 'form'
  | 'state'
  | 'stem';

type LabelDict = Record<string, {es: string; en: string}>;

const FUNCTION: LabelDict = {
  Adjective: {es: 'Adjetivo', en: 'Adjective'},
  Adverb: {es: 'Adverbio', en: 'Adverb'},
  'Adverb or adverb and particle combined': {
    es: 'Adverbio (o adverbio + partícula)',
    en: 'Adverb (or adverb + particle)',
  },
  'Aramaic transliterated word': {
    es: 'Palabra aramea transliterada',
    en: 'Aramaic transliterated word',
  },
  Conjunction: {es: 'Conjunción', en: 'Conjunction'},
  'Correlative or Interrogative pronoun': {
    es: 'Pronombre correlativo o interrogativo',
    en: 'Correlative or interrogative pronoun',
  },
  'Correlative pronoun': {
    es: 'Pronombre correlativo',
    en: 'Correlative pronoun',
  },
  'Definite article': {es: 'Artículo determinado', en: 'Definite article'},
  'Demonstrative pronoun': {
    es: 'Pronombre demostrativo',
    en: 'Demonstrative pronoun',
  },
  'Demonstrative pronoun+Conjunction': {
    es: 'Pronombre demostrativo + conjunción',
    en: 'Demonstrative pronoun + conjunction',
  },
  'Indeclinable Noun of Other type': {
    es: 'Sustantivo indeclinable (otro tipo)',
    en: 'Indeclinable noun (other type)',
  },
  'Indeclinable Proper Noun': {
    es: 'Nombre propio indeclinable',
    en: 'Indeclinable proper noun',
  },
  'Indefinite pronoun': {es: 'Pronombre indefinido', en: 'Indefinite pronoun'},
  Interjection: {es: 'Interjección', en: 'Interjection'},
  'Interrogative Particle': {
    es: 'Partícula interrogativa',
    en: 'Interrogative particle',
  },
  'Interrogative pronoun': {
    es: 'Pronombre interrogativo',
    en: 'Interrogative pronoun',
  },
  'Negative Particle': {es: 'Partícula negativa', en: 'Negative particle'},
  Noun: {es: 'Sustantivo', en: 'Noun'},
  Particle: {es: 'Partícula', en: 'Particle'},
  'Particle or Disjunctive': {
    es: 'Partícula o disyuntiva',
    en: 'Particle or disjunctive',
  },
  'Personal pronoun': {es: 'Pronombre personal', en: 'Personal pronoun'},
  'Possessive pronoun': {es: 'Pronombre posesivo', en: 'Possessive pronoun'},
  Preposition: {es: 'Preposición', en: 'Preposition'},
  Pronoun: {es: 'Pronombre', en: 'Pronoun'},
  'Reciprocal pronoun': {es: 'Pronombre recíproco', en: 'Reciprocal pronoun'},
  'Reflexive pronoun': {es: 'Pronombre reflexivo', en: 'Reflexive pronoun'},
  'Relative pronoun': {es: 'Pronombre relativo', en: 'Relative pronoun'},
  Suffix: {es: 'Sufijo', en: 'Suffix'},
  Verb: {es: 'Verbo', en: 'Verb'},
};

const CASE: LabelDict = {
  Accusative: {es: 'Acusativo', en: 'Accusative'},
  Dative: {es: 'Dativo', en: 'Dative'},
  Genitive: {es: 'Genitivo', en: 'Genitive'},
  Nominative: {es: 'Nominativo', en: 'Nominative'},
  Vocative: {es: 'Vocativo', en: 'Vocative'},
};

const NUMBER: LabelDict = {
  Dual: {es: 'Dual', en: 'Dual'},
  Plural: {es: 'Plural', en: 'Plural'},
  Singular: {es: 'Singular', en: 'Singular'},
};

const GENDER: LabelDict = {
  'Either gender': {es: 'Cualquier género', en: 'Either gender'},
  Feminine: {es: 'Femenino', en: 'Feminine'},
  Location: {es: 'Lugar', en: 'Location'},
  Masculine: {es: 'Masculino', en: 'Masculine'},
  Neuter: {es: 'Neutro', en: 'Neuter'},
  Title: {es: 'Título', en: 'Title'},
};

const EXTRA: LabelDict = {
  Abbreviated: {es: 'Abreviado', en: 'Abbreviated'},
  'Abbreviated Numeral': {es: 'Numeral abreviado', en: 'Abbreviated numeral'},
  Aeolic: {es: 'Eólico (forma dialectal)', en: 'Aeolic (dialect form)'},
  'Apocopated form': {es: 'Forma apocopada', en: 'Apocopated form'},
  'Attic Greek form': {es: 'Forma del griego ático', en: 'Attic Greek form'},
  Comparative: {es: 'Comparativo', en: 'Comparative'},
  'Contracted form': {es: 'Forma contracta', en: 'Contracted form'},
  'IRRegular or impure form': {
    es: 'Forma irregular o impura',
    en: 'Irregular or impure form',
  },
  'Indeclinable Letter': {es: 'Letra indeclinable', en: 'Indeclinable letter'},
  Interrogative: {es: 'Interrogativo', en: 'Interrogative'},
  Negative: {es: 'Negativo', en: 'Negative'},
  Numeral: {es: 'Numeral', en: 'Numeral'},
  Superlative: {es: 'Superlativo', en: 'Superlative'},
  Transitive: {es: 'Transitivo', en: 'Transitive'},
};

const NAME_TYPE: LabelDict = {
  Gentilic: {es: 'Gentilicio', en: 'Gentilic'},
  Individual: {es: 'Individuo', en: 'Individual'},
  'Individual Gentilic': {
    es: 'Individuo (gentilicio)',
    en: 'Individual gentilic',
  },
  Location: {es: 'Lugar', en: 'Location'},
  'Location Gentilic': {es: 'Lugar (gentilicio)', en: 'Location gentilic'},
  'Person Gentilic': {es: 'Persona (gentilicio)', en: 'Person gentilic'},
  'Person name Transcribed from Aramaic': {
    es: 'Nombre de persona transcrito del arameo',
    en: "Person's name transcribed from Aramaic",
  },
  Title: {es: 'Título', en: 'Title'},
  'Title Gentilic': {es: 'Título (gentilicio)', en: 'Title gentilic'},
  Type: {es: 'Tipo', en: 'Type'},
};

const ORIGINAL_LANGUAGE: LabelDict = {
  'Title Transcribed from Aramaic': {
    es: 'Título transcrito del arameo',
    en: 'Title transcribed from Aramaic',
  },
  'Transcribed from Aramaic': {
    es: 'Transcrito del arameo',
    en: 'Transcribed from Aramaic',
  },
  'Transcribed from Hebrew': {
    es: 'Transcrito del hebreo',
    en: 'Transcribed from Hebrew',
  },
};

const ADJ_NUMBER: LabelDict = {
  'Indeclinable Numeral': {
    es: 'Numeral indeclinable',
    en: 'Indeclinable numeral',
  },
};

const PERSON: LabelDict = {
  '1st': {es: '1ª persona', en: '1st person'},
  '1st Person': {es: '1ª persona', en: '1st person'},
  '2nd': {es: '2ª persona', en: '2nd person'},
  '2nd Person': {es: '2ª persona', en: '2nd person'},
  '2nd Plural': {es: '2ª persona plural', en: '2nd person plural'},
  '2nd Singular': {es: '2ª persona singular', en: '2nd person singular'},
  '3rd': {es: '3ª persona', en: '3rd person'},
  First: {es: '1ª persona', en: '1st person'},
  Second: {es: '2ª persona', en: '2nd person'},
  Third: {es: '3ª persona', en: '3rd person'},
};

const NAME_IN_ORIGINAL_LANGUAGE: LabelDict = {
  'Title Transcribed from Aramaic': {
    es: 'Título transcrito del arameo',
    en: 'Title transcribed from Aramaic',
  },
  'Title Transcribed from Hebrew': {
    es: 'Título transcrito del hebreo',
    en: 'Title transcribed from Hebrew',
  },
};

const TENSE: LabelDict = {
  '2nd Aorist': {es: 'Aoristo segundo', en: 'Second aorist'},
  '2nd Future': {es: 'Futuro segundo', en: 'Second future'},
  '2nd Perfect': {es: 'Perfecto segundo', en: 'Second perfect'},
  '2nd Pluperfect': {es: 'Pluscuamperfecto segundo', en: 'Second pluperfect'},
  '2nd Present': {es: 'Presente segundo', en: 'Second present'},
  Aorist: {es: 'Aoristo', en: 'Aorist'},
  Future: {es: 'Futuro', en: 'Future'},
  Imperfect: {es: 'Imperfecto', en: 'Imperfect'},
  Perfect: {es: 'Perfecto', en: 'Perfect'},
  Pluperfect: {es: 'Pluscuamperfecto', en: 'Pluperfect'},
  Present: {es: 'Presente', en: 'Present'},
  'indefinite tense': {es: 'Tiempo indefinido', en: 'Indefinite tense'},
};

const VOICE: LabelDict = {
  Active: {es: 'Activa', en: 'Active'},
  Middle: {es: 'Media', en: 'Middle'},
  'Middle Deponent': {es: 'Media deponente', en: 'Middle deponent'},
  'Middle or Passive': {es: 'Media o pasiva', en: 'Middle or passive'},
  'Middle or Passive Deponent': {
    es: 'Media o pasiva deponente',
    en: 'Middle or passive deponent',
  },
  Passive: {es: 'Pasiva', en: 'Passive'},
  'Passive Deponent': {es: 'Pasiva deponente', en: 'Passive deponent'},
  'Reflexive/iterative': {es: 'Reflexiva/iterativa', en: 'Reflexive/iterative'},
  'impersonal active': {es: 'Activa impersonal', en: 'Impersonal active'},
  'indefinite voice': {es: 'Voz indefinida', en: 'Indefinite voice'},
};

const MOOD: LabelDict = {
  Cohortative: {es: 'Cohortativo', en: 'Cohortative'},
  Imperative: {es: 'Imperativo', en: 'Imperative'},
  Indicative: {es: 'Indicativo', en: 'Indicative'},
  'Indicative/cohortative': {
    es: 'Indicativo/cohortativo',
    en: 'Indicative/cohortative',
  },
  'Indicative/jussive': {es: 'Indicativo/yusivo', en: 'Indicative/jussive'},
  Jussive: {es: 'Yusivo', en: 'Jussive'},
  jussive: {es: 'Yusivo', en: 'Jussive'},
  Optative: {es: 'Optativo', en: 'Optative'},
  Subjunctive: {es: 'Subjuntivo', en: 'Subjunctive'},
};

const FORM: LabelDict = {
  Common: {es: 'Común', en: 'Common'},
  Conditional: {es: 'Condicional', en: 'Conditional'},
  'Conjunction+Imperfect': {
    es: 'Conjunción + imperfectivo',
    en: 'Conjunction + imperfect',
  },
  Consecutive: {es: 'Consecutivo', en: 'Consecutive'},
  'Consecutive Imperfect': {
    es: 'Imperfectivo consecutivo',
    en: 'Consecutive imperfect',
  },
  'Consecutive Perfect': {
    es: 'Perfectivo consecutivo',
    en: 'Consecutive perfect',
  },
  Definite: {es: 'Determinado', en: 'Definite'},
  'Definite article': {es: 'Artículo determinado', en: 'Definite article'},
  Demonstrative: {es: 'Demostrativo', en: 'Demonstrative'},
  Directional: {es: 'Direccional', en: 'Directional'},
  Gentilic: {es: 'Gentilicio', en: 'Gentilic'},
  Imperative: {es: 'Imperativo', en: 'Imperative'},
  Imperfect: {es: 'Imperfectivo', en: 'Imperfect'},
  Infinitive: {es: 'Infinitivo', en: 'Infinitive'},
  Interjection: {es: 'Interjección', en: 'Interjection'},
  Interrogative: {es: 'Interrogativo', en: 'Interrogative'},
  Negative: {es: 'Negativo', en: 'Negative'},
  Numerical: {es: 'Numérico', en: 'Numerical'},
  'Numerical position': {
    es: 'Posición numérica (ordinal)',
    en: 'Numerical position (ordinal)',
  },
  'Object indicator': {es: 'Marcador de objeto directo', en: 'Object marker'},
  'Paragogic Hé': {es: 'He paragógica', en: 'Paragogic he'},
  'Paragogic Nun': {es: 'Nun paragógica', en: 'Paragogic nun'},
  Participle: {es: 'Participio', en: 'Participle'},
  'Participle passive': {es: 'Participio pasivo', en: 'Participle passive'},
  Perfect: {es: 'Perfectivo', en: 'Perfect'},
  Personal: {es: 'Personal', en: 'Personal'},
  Proper: {es: 'Propio', en: 'Proper'},
  Relative: {es: 'Relativo', en: 'Relative'},
  Title: {es: 'Título', en: 'Title'},
};

const STATE: LabelDict = {
  Absolute: {es: 'Absoluto', en: 'Absolute'},
  Construct: {es: 'Constructo', en: 'Construct'},
  Definite: {es: 'Determinado', en: 'Definite'},
};

// Hebrew/Aramaic verb stems (binyanim) — conventionally NOT translated; kept
// as the standard Latinized spelling in both languages (a Spanish grammar
// still says "Qal", "Piel", "Hifil"...).
const STEM: LabelDict = {
  Aphel: {es: 'Afel', en: 'Aphel'},
  Haphel: {es: 'Hafel', en: 'Haphel'},
  Hiphil: {es: 'Hifil', en: 'Hiphil'},
  Hishtaphel: {es: 'Hishtafel', en: 'Hishtaphel'},
  Hithpael: {es: 'Hitpael', en: 'Hithpael'},
  Hitpaal: {es: 'Hitpaal', en: 'Hitpaal'},
  Hitpael: {es: 'Hitpael', en: 'Hitpael'},
  Hitpeel: {es: 'Hitpeel', en: 'Hitpeel'},
  Hophal: {es: 'Hofal', en: 'Hophal'},
  Hothpaal: {es: 'Hotpaal', en: 'Hothpaal'},
  Ishtaphel: {es: 'Ishtafel', en: 'Ishtaphel'},
  Niphal: {es: 'Nifal', en: 'Niphal'},
  Nithpael: {es: 'Nitpael', en: 'Nithpael'},
  Pael: {es: 'Pael', en: 'Pael'},
  Peal: {es: 'Peal', en: 'Peal'},
  Peil: {es: 'Peil', en: 'Peil'},
  Piel: {es: 'Piel', en: 'Piel'},
  Polal: {es: 'Polal', en: 'Polal'},
  Pual: {es: 'Pual', en: 'Pual'},
  Qal: {es: 'Qal', en: 'Qal'},
  Shaphel: {es: 'Shafel', en: 'Shaphel'},
  Tiphil: {es: 'Tifil', en: 'Tiphil'},
};

const DICTS: Record<MorphAttributeKey, LabelDict> = {
  function: FUNCTION,
  case: CASE,
  number: NUMBER,
  gender: GENDER,
  extra: EXTRA,
  nameType: NAME_TYPE,
  originalLanguage: ORIGINAL_LANGUAGE,
  adjNumber: ADJ_NUMBER,
  person: PERSON,
  nameInOriginalLanguage: NAME_IN_ORIGINAL_LANGUAGE,
  tense: TENSE,
  voice: VOICE,
  mood: MOOD,
  form: FORM,
  state: STATE,
  stem: STEM,
};

/**
 * Human label for one morphology attribute value, in the given UI language.
 * Falls back to the raw value itself if it's ever outside this closed
 * dictionary (defensive — should not happen for data already validated
 * against the full STEPBible code tables, see [[morphologyDecoder]]).
 */
export function morphLabel(
  key: MorphAttributeKey,
  value: string,
  language: 'es' | 'en',
): string {
  return DICTS[key]?.[value]?.[language] ?? value;
}
