// Planes de lectura bíblica

import type {TranslationKeys} from '../i18n/translations';
import {BIBLE_BOOKS} from './bible';
import {getRegisteredCustomPlanById} from '../lib/reading/customPlans';

export interface ReadingPlanDay {
  day: number;
  readings: {
    book: string;
    chapter: number;
    verses?: string; // e.g., "1-10" o undefined para todo el capítulo
  }[];
}

/** Clave de traducción del plan dentro de `t.readingPlans`. */
export type ReadingPlanI18nKey =
  | 'proverbs'
  | 'psalms'
  | 'gospels'
  | 'newTestament'
  | 'genesis'
  | 'bibleYear'
  | 'redemption'
  | 'wisdom'
  | 'firstSteps'
  | 'iam'
  | 'parables'
  | 'miracles'
  | 'namesOfGod'
  | 'fruitOfSpirit'
  | 'heroesOfFaith'
  | 'propheticThread';

export interface ReadingPlan {
  id: string;
  /** Nombre por defecto (español). Para mostrarlo usa `getLocalizedPlan`. */
  name: string;
  /** Descripción por defecto (español). Para mostrarla usa `getLocalizedPlan`. */
  description: string;
  /**
   * Clave para resolver nombre/descripción traducidos vía i18n. Ausente en los
   * planes personalizados del usuario (Sprint 108), que no tienen traducción y
   * muestran su nombre tal cual.
   */
  i18nKey?: ReadingPlanI18nKey;
  duration: number; // días
  icon: string;
  color: string;
  days: ReadingPlanDay[];
  /** Plan creado por el usuario (no curado), resuelto desde el registro local. */
  custom?: boolean;
}

// Plan: Nuevo Testamento en 30 días
const newTestament30Days: ReadingPlan = {
  id: 'nt-30',
  name: 'Nuevo Testamento en 30 Días',
  description: 'Lee todo el Nuevo Testamento en un mes',
  i18nKey: 'newTestament',
  duration: 30,
  icon: 'book-outline',
  color: '#3498DB',
  days: [
    {
      day: 1,
      readings: [
        {book: 'Mateo', chapter: 1},
        {book: 'Mateo', chapter: 2},
        {book: 'Mateo', chapter: 3},
      ],
    },
    {
      day: 2,
      readings: [
        {book: 'Mateo', chapter: 4},
        {book: 'Mateo', chapter: 5},
      ],
    },
    {
      day: 3,
      readings: [
        {book: 'Mateo', chapter: 6},
        {book: 'Mateo', chapter: 7},
        {book: 'Mateo', chapter: 8},
      ],
    },
    {
      day: 4,
      readings: [
        {book: 'Mateo', chapter: 9},
        {book: 'Mateo', chapter: 10},
      ],
    },
    {
      day: 5,
      readings: [
        {book: 'Mateo', chapter: 11},
        {book: 'Mateo', chapter: 12},
      ],
    },
    {
      day: 6,
      readings: [
        {book: 'Mateo', chapter: 13},
        {book: 'Mateo', chapter: 14},
      ],
    },
    {
      day: 7,
      readings: [
        {book: 'Mateo', chapter: 15},
        {book: 'Mateo', chapter: 16},
        {book: 'Mateo', chapter: 17},
      ],
    },
    {
      day: 8,
      readings: [
        {book: 'Mateo', chapter: 18},
        {book: 'Mateo', chapter: 19},
        {book: 'Mateo', chapter: 20},
      ],
    },
    {
      day: 9,
      readings: [
        {book: 'Mateo', chapter: 21},
        {book: 'Mateo', chapter: 22},
      ],
    },
    {
      day: 10,
      readings: [
        {book: 'Mateo', chapter: 23},
        {book: 'Mateo', chapter: 24},
      ],
    },
    {
      day: 11,
      readings: [
        {book: 'Mateo', chapter: 25},
        {book: 'Mateo', chapter: 26},
      ],
    },
    {
      day: 12,
      readings: [
        {book: 'Mateo', chapter: 27},
        {book: 'Mateo', chapter: 28},
        {book: 'Marcos', chapter: 1},
      ],
    },
    {
      day: 13,
      readings: [
        {book: 'Marcos', chapter: 2},
        {book: 'Marcos', chapter: 3},
        {book: 'Marcos', chapter: 4},
      ],
    },
    {
      day: 14,
      readings: [
        {book: 'Marcos', chapter: 5},
        {book: 'Marcos', chapter: 6},
      ],
    },
    {
      day: 15,
      readings: [
        {book: 'Marcos', chapter: 7},
        {book: 'Marcos', chapter: 8},
        {book: 'Marcos', chapter: 9},
      ],
    },
    {
      day: 16,
      readings: [
        {book: 'Marcos', chapter: 10},
        {book: 'Marcos', chapter: 11},
        {book: 'Marcos', chapter: 12},
      ],
    },
    {
      day: 17,
      readings: [
        {book: 'Marcos', chapter: 13},
        {book: 'Marcos', chapter: 14},
      ],
    },
    {
      day: 18,
      readings: [
        {book: 'Marcos', chapter: 15},
        {book: 'Marcos', chapter: 16},
        {book: 'Lucas', chapter: 1},
      ],
    },
    {
      day: 19,
      readings: [
        {book: 'Lucas', chapter: 2},
        {book: 'Lucas', chapter: 3},
        {book: 'Lucas', chapter: 4},
      ],
    },
    {
      day: 20,
      readings: [
        {book: 'Lucas', chapter: 5},
        {book: 'Lucas', chapter: 6},
      ],
    },
    {
      day: 21,
      readings: [
        {book: 'Lucas', chapter: 7},
        {book: 'Lucas', chapter: 8},
      ],
    },
    {
      day: 22,
      readings: [
        {book: 'Lucas', chapter: 9},
        {book: 'Lucas', chapter: 10},
      ],
    },
    {
      day: 23,
      readings: [
        {book: 'Lucas', chapter: 11},
        {book: 'Lucas', chapter: 12},
      ],
    },
    {
      day: 24,
      readings: [
        {book: 'Lucas', chapter: 13},
        {book: 'Lucas', chapter: 14},
        {book: 'Lucas', chapter: 15},
      ],
    },
    {
      day: 25,
      readings: [
        {book: 'Lucas', chapter: 16},
        {book: 'Lucas', chapter: 17},
        {book: 'Lucas', chapter: 18},
      ],
    },
    {
      day: 26,
      readings: [
        {book: 'Lucas', chapter: 19},
        {book: 'Lucas', chapter: 20},
        {book: 'Lucas', chapter: 21},
      ],
    },
    {
      day: 27,
      readings: [
        {book: 'Lucas', chapter: 22},
        {book: 'Lucas', chapter: 23},
      ],
    },
    {
      day: 28,
      readings: [
        {book: 'Lucas', chapter: 24},
        {book: 'Juan', chapter: 1},
        {book: 'Juan', chapter: 2},
      ],
    },
    {
      day: 29,
      readings: [
        {book: 'Juan', chapter: 3},
        {book: 'Juan', chapter: 4},
        {book: 'Juan', chapter: 5},
      ],
    },
    {
      day: 30,
      readings: [
        {book: 'Juan', chapter: 6},
        {book: 'Juan', chapter: 7},
      ],
    },
  ],
};

// Plan: Salmos en 30 días
const psalms30Days: ReadingPlan = {
  id: 'psalms-30',
  name: 'Salmos en 30 Días',
  description: 'Lee el libro de Salmos completo en un mes',
  i18nKey: 'psalms',
  duration: 30,
  icon: 'musical-notes-outline',
  color: '#9B59B6',
  days: Array.from({length: 30}, (_, i) => ({
    day: i + 1,
    readings: Array.from({length: 5}, (_, j) => ({
      book: 'Salmos',
      chapter: i * 5 + j + 1,
    })).filter(r => r.chapter <= 150),
  })),
};

// Plan: Proverbios en un mes
const proverbsMonth: ReadingPlan = {
  id: 'proverbs-month',
  name: 'Sabiduría Diaria (Proverbios)',
  description: 'Un capítulo de Proverbios cada día',
  i18nKey: 'proverbs',
  duration: 31,
  icon: 'bulb-outline',
  color: '#F39C12',
  days: Array.from({length: 31}, (_, i) => ({
    day: i + 1,
    readings: [{book: 'Proverbios', chapter: i + 1}],
  })),
};

// Plan: Evangelios en 40 días
const gospels40Days: ReadingPlan = {
  id: 'gospels-40',
  name: 'Los 4 Evangelios en 40 Días',
  description: 'Conoce la vida de Jesús a través de los cuatro evangelios',
  i18nKey: 'gospels',
  duration: 40,
  icon: 'heart-outline',
  color: '#E74C3C',
  days: [
    // Mateo (28 capítulos en ~10 días)
    {
      day: 1,
      readings: [
        {book: 'Mateo', chapter: 1},
        {book: 'Mateo', chapter: 2},
        {book: 'Mateo', chapter: 3},
      ],
    },
    {
      day: 2,
      readings: [
        {book: 'Mateo', chapter: 4},
        {book: 'Mateo', chapter: 5},
      ],
    },
    {
      day: 3,
      readings: [
        {book: 'Mateo', chapter: 6},
        {book: 'Mateo', chapter: 7},
      ],
    },
    {
      day: 4,
      readings: [
        {book: 'Mateo', chapter: 8},
        {book: 'Mateo', chapter: 9},
      ],
    },
    {
      day: 5,
      readings: [
        {book: 'Mateo', chapter: 10},
        {book: 'Mateo', chapter: 11},
      ],
    },
    {
      day: 6,
      readings: [
        {book: 'Mateo', chapter: 12},
        {book: 'Mateo', chapter: 13},
      ],
    },
    {
      day: 7,
      readings: [
        {book: 'Mateo', chapter: 14},
        {book: 'Mateo', chapter: 15},
      ],
    },
    {
      day: 8,
      readings: [
        {book: 'Mateo', chapter: 16},
        {book: 'Mateo', chapter: 17},
        {book: 'Mateo', chapter: 18},
      ],
    },
    {
      day: 9,
      readings: [
        {book: 'Mateo', chapter: 19},
        {book: 'Mateo', chapter: 20},
        {book: 'Mateo', chapter: 21},
      ],
    },
    {
      day: 10,
      readings: [
        {book: 'Mateo', chapter: 22},
        {book: 'Mateo', chapter: 23},
      ],
    },
    {
      day: 11,
      readings: [
        {book: 'Mateo', chapter: 24},
        {book: 'Mateo', chapter: 25},
      ],
    },
    {
      day: 12,
      readings: [
        {book: 'Mateo', chapter: 26},
        {book: 'Mateo', chapter: 27},
      ],
    },
    {
      day: 13,
      readings: [
        {book: 'Mateo', chapter: 28},
        {book: 'Marcos', chapter: 1},
      ],
    },
    // Marcos (16 capítulos en ~7 días)
    {
      day: 14,
      readings: [
        {book: 'Marcos', chapter: 2},
        {book: 'Marcos', chapter: 3},
      ],
    },
    {
      day: 15,
      readings: [
        {book: 'Marcos', chapter: 4},
        {book: 'Marcos', chapter: 5},
      ],
    },
    {
      day: 16,
      readings: [
        {book: 'Marcos', chapter: 6},
        {book: 'Marcos', chapter: 7},
      ],
    },
    {
      day: 17,
      readings: [
        {book: 'Marcos', chapter: 8},
        {book: 'Marcos', chapter: 9},
      ],
    },
    {
      day: 18,
      readings: [
        {book: 'Marcos', chapter: 10},
        {book: 'Marcos', chapter: 11},
      ],
    },
    {
      day: 19,
      readings: [
        {book: 'Marcos', chapter: 12},
        {book: 'Marcos', chapter: 13},
      ],
    },
    {
      day: 20,
      readings: [
        {book: 'Marcos', chapter: 14},
        {book: 'Marcos', chapter: 15},
        {book: 'Marcos', chapter: 16},
      ],
    },
    // Lucas (24 capítulos en ~10 días)
    {
      day: 21,
      readings: [
        {book: 'Lucas', chapter: 1},
        {book: 'Lucas', chapter: 2},
      ],
    },
    {
      day: 22,
      readings: [
        {book: 'Lucas', chapter: 3},
        {book: 'Lucas', chapter: 4},
      ],
    },
    {
      day: 23,
      readings: [
        {book: 'Lucas', chapter: 5},
        {book: 'Lucas', chapter: 6},
      ],
    },
    {
      day: 24,
      readings: [
        {book: 'Lucas', chapter: 7},
        {book: 'Lucas', chapter: 8},
      ],
    },
    {
      day: 25,
      readings: [
        {book: 'Lucas', chapter: 9},
        {book: 'Lucas', chapter: 10},
      ],
    },
    {
      day: 26,
      readings: [
        {book: 'Lucas', chapter: 11},
        {book: 'Lucas', chapter: 12},
      ],
    },
    {
      day: 27,
      readings: [
        {book: 'Lucas', chapter: 13},
        {book: 'Lucas', chapter: 14},
      ],
    },
    {
      day: 28,
      readings: [
        {book: 'Lucas', chapter: 15},
        {book: 'Lucas', chapter: 16},
      ],
    },
    {
      day: 29,
      readings: [
        {book: 'Lucas', chapter: 17},
        {book: 'Lucas', chapter: 18},
        {book: 'Lucas', chapter: 19},
      ],
    },
    {
      day: 30,
      readings: [
        {book: 'Lucas', chapter: 20},
        {book: 'Lucas', chapter: 21},
        {book: 'Lucas', chapter: 22},
      ],
    },
    {
      day: 31,
      readings: [
        {book: 'Lucas', chapter: 23},
        {book: 'Lucas', chapter: 24},
      ],
    },
    // Juan (21 capítulos en ~9 días)
    {
      day: 32,
      readings: [
        {book: 'Juan', chapter: 1},
        {book: 'Juan', chapter: 2},
      ],
    },
    {
      day: 33,
      readings: [
        {book: 'Juan', chapter: 3},
        {book: 'Juan', chapter: 4},
      ],
    },
    {
      day: 34,
      readings: [
        {book: 'Juan', chapter: 5},
        {book: 'Juan', chapter: 6},
      ],
    },
    {
      day: 35,
      readings: [
        {book: 'Juan', chapter: 7},
        {book: 'Juan', chapter: 8},
      ],
    },
    {
      day: 36,
      readings: [
        {book: 'Juan', chapter: 9},
        {book: 'Juan', chapter: 10},
      ],
    },
    {
      day: 37,
      readings: [
        {book: 'Juan', chapter: 11},
        {book: 'Juan', chapter: 12},
      ],
    },
    {
      day: 38,
      readings: [
        {book: 'Juan', chapter: 13},
        {book: 'Juan', chapter: 14},
        {book: 'Juan', chapter: 15},
      ],
    },
    {
      day: 39,
      readings: [
        {book: 'Juan', chapter: 16},
        {book: 'Juan', chapter: 17},
        {book: 'Juan', chapter: 18},
      ],
    },
    {
      day: 40,
      readings: [
        {book: 'Juan', chapter: 19},
        {book: 'Juan', chapter: 20},
        {book: 'Juan', chapter: 21},
      ],
    },
  ],
};

// Plan: Génesis (historia de orígenes)
const genesisMonth: ReadingPlan = {
  id: 'genesis-month',
  name: 'Génesis - El Principio',
  description: 'Descubre el origen de todo en el libro de Génesis',
  i18nKey: 'genesis',
  duration: 25,
  icon: 'planet-outline',
  color: '#27AE60',
  days: Array.from({length: 25}, (_, i) => {
    const chaptersPerDay = i < 24 ? 2 : 2;
    const startChapter = i * 2 + 1;
    return {
      day: i + 1,
      readings: Array.from({length: chaptersPerDay}, (_, j) => ({
        book: 'Génesis',
        chapter: startChapter + j,
      })).filter(r => r.chapter <= 50),
    };
  }),
};

// Plan: Toda la Biblia en un año (365 días, orden canónico).
// Generado a partir de la tabla canónica de libros para no duplicar datos: se
// aplanan los 1189 capítulos en orden y se reparten lo más uniformemente
// posible en 365 días (≈3-4 capítulos diarios). El reparto usa límites
// proporcionales (floor) para no perder ni repetir capítulos; un día puede
// cerrar un libro y abrir el siguiente, lo cual es natural en un plan anual.
const BIBLE_YEAR_DAYS = 365;
const allCanonicalChapters: {book: string; chapter: number}[] = [...BIBLE_BOOKS]
  .sort((a, b) => a.id - b.id)
  .flatMap(b =>
    Array.from({length: b.chapters}, (_, i) => ({
      book: b.name,
      chapter: i + 1,
    })),
  );
const bibleInAYear: ReadingPlan = {
  id: 'bible-year',
  name: 'Toda la Biblia en un Año',
  description: 'Recorre toda la Escritura en 365 días, en orden canónico',
  i18nKey: 'bibleYear',
  duration: BIBLE_YEAR_DAYS,
  icon: 'calendar-outline',
  color: '#1D4ED8',
  days: Array.from({length: BIBLE_YEAR_DAYS}, (_, i) => {
    const total = allCanonicalChapters.length;
    const start = Math.floor((i * total) / BIBLE_YEAR_DAYS);
    const end = Math.floor(((i + 1) * total) / BIBLE_YEAR_DAYS);
    return {day: i + 1, readings: allCanonicalChapters.slice(start, end)};
  }),
};

// Plan: Cristo en toda la Biblia (la historia de la redención).
// Un capítulo clave por día, de Génesis a Apocalipsis, trazando el hilo del
// evangelio: cómo toda la Escritura apunta al Señor Jesús (Lc 24:27). No es
// un recorrido completo de un libro, sino las cumbres de la promesa cumplida
// en Cristo — para crecer en el conocimiento de Él (2 Pe 3:18).
const REDEMPTION_CHAPTERS: {book: string; chapter: number}[] = [
  {book: 'Génesis', chapter: 1}, // La creación por la Palabra
  {book: 'Génesis', chapter: 3}, // La caída y la primera promesa (3:15)
  {book: 'Génesis', chapter: 22}, // Abraham e Isaac: la sustitución
  {book: 'Éxodo', chapter: 12}, // El cordero de la Pascua
  {book: 'Levítico', chapter: 16}, // El día de la expiación
  {book: 'Números', chapter: 21}, // La serpiente de bronce (Jn 3:14)
  {book: 'Deuteronomio', chapter: 18}, // El profeta como Moisés
  {book: '2 Samuel', chapter: 7}, // El pacto con David: trono eterno
  {book: 'Salmos', chapter: 22}, // La cruz anunciada
  {book: 'Salmos', chapter: 110}, // El Señor a la diestra: sacerdote y rey
  {book: 'Isaías', chapter: 7}, // Emanuel
  {book: 'Isaías', chapter: 9}, // Un niño nos es nacido
  {book: 'Isaías', chapter: 53}, // El siervo sufriente
  {book: 'Jeremías', chapter: 31}, // El nuevo pacto
  {book: 'Ezequiel', chapter: 36}, // Un corazón nuevo
  {book: 'Daniel', chapter: 7}, // El Hijo del Hombre
  {book: 'Miqueas', chapter: 5}, // Belén
  {book: 'Zacarías', chapter: 9}, // Tu rey viene, humilde
  {book: 'Lucas', chapter: 1}, // La anunciación
  {book: 'Lucas', chapter: 2}, // El nacimiento de Jesús
  {book: 'Juan', chapter: 1}, // El Verbo hecho carne
  {book: 'Juan', chapter: 3}, // De tal manera amó Dios
  {book: 'Mateo', chapter: 5}, // El reino del Rey
  {book: 'Marcos', chapter: 10}, // Rescate por muchos (10:45)
  {book: 'Juan', chapter: 19}, // La crucifixión
  {book: 'Lucas', chapter: 24}, // La resurrección y "todas las Escrituras"
  {book: 'Hechos', chapter: 2}, // El Señor exaltado, Pentecostés
  {book: 'Romanos', chapter: 8}, // Ninguna condenación, más que vencedores
  {book: 'Hebreos', chapter: 9}, // El sacrificio de una vez para siempre
  {book: 'Apocalipsis', chapter: 5}, // El Cordero que fue inmolado
  {book: 'Apocalipsis', chapter: 21}, // Cielo nuevo y tierra nueva
];
const redemptionStory: ReadingPlan = {
  id: 'redemption-31',
  name: 'Cristo en toda la Biblia',
  description:
    'La historia de la redención: 31 pasajes clave que apuntan a Jesús, de Génesis a Apocalipsis',
  i18nKey: 'redemption',
  duration: REDEMPTION_CHAPTERS.length,
  icon: 'sparkles-outline',
  color: '#9D174D',
  days: REDEMPTION_CHAPTERS.map((reading, i) => ({
    day: i + 1,
    readings: [reading],
  })),
};

// Plan: Sabiduría diaria (un Salmo y un Proverbio cada día).
// Empareja un Salmo escogido con el capítulo de Proverbios del día (1..31) —
// la oración cantada de los Salmos junto a la sabiduría práctica de los
// Proverbios, una combinación devocional muy querida.
const WISDOM_PSALMS = [
  1, 8, 16, 19, 23, 27, 32, 34, 37, 40, 42, 46, 51, 63, 73, 84, 90, 91, 96, 100,
  103, 107, 111, 116, 121, 126, 130, 138, 139, 145, 150,
];
const wisdomDaily: ReadingPlan = {
  id: 'wisdom-31',
  name: 'Sabiduría Diaria: Salmo y Proverbio',
  description:
    'Cada día un Salmo y un capítulo de Proverbios, para empezar o cerrar el día',
  i18nKey: 'wisdom',
  duration: WISDOM_PSALMS.length,
  icon: 'leaf-outline',
  color: '#D97706',
  days: WISDOM_PSALMS.map((psalm, i) => ({
    day: i + 1,
    readings: [
      {book: 'Salmos', chapter: psalm},
      {book: 'Proverbios', chapter: i + 1},
    ],
  })),
};

// Plan: Primeros pasos con Jesús (21 días).
// Un camino suave para nuevos creyentes y para volver a empezar: quién es
// Jesús, el amor del Padre, el Sermón del Monte, la cruz y la resurrección, y
// la vida nueva en el Espíritu. Un capítulo manejable por día.
const FIRST_STEPS_CHAPTERS: {book: string; chapter: number}[] = [
  {book: 'Juan', chapter: 1}, // Quién es Jesús
  {book: 'Juan', chapter: 3}, // Nacer de nuevo / de tal manera amó Dios
  {book: 'Lucas', chapter: 15}, // El amor del Padre por el perdido
  {book: 'Juan', chapter: 4}, // La mujer junto al pozo
  {book: 'Marcos', chapter: 1}, // Jesús comienza su ministerio
  {book: 'Mateo', chapter: 5}, // El Sermón del Monte (I)
  {book: 'Mateo', chapter: 6}, // El Sermón del Monte (II): oración
  {book: 'Mateo', chapter: 7}, // El Sermón del Monte (III)
  {book: 'Salmos', chapter: 23}, // El Señor es mi pastor
  {book: 'Salmos', chapter: 1}, // Los dos caminos
  {book: 'Juan', chapter: 6}, // El pan de vida
  {book: 'Juan', chapter: 10}, // El buen pastor
  {book: 'Lucas', chapter: 24}, // La resurrección
  {book: 'Hechos', chapter: 2}, // Nace la iglesia
  {book: 'Romanos', chapter: 5}, // Paz con Dios
  {book: 'Romanos', chapter: 6}, // Muertos al pecado, vivos para Dios
  {book: 'Romanos', chapter: 8}, // La vida en el Espíritu
  {book: '1 Corintios', chapter: 13}, // El amor
  {book: 'Filipenses', chapter: 4}, // Gozo, oración, contentamiento
  {book: 'Efesios', chapter: 2}, // Salvos por gracia
  {book: 'Juan', chapter: 15}, // Permaneced en mí
];
const firstSteps: ReadingPlan = {
  id: 'first-steps-21',
  name: 'Primeros pasos con Jesús',
  description:
    'Un camino suave de 21 días para nuevos creyentes y para volver a empezar',
  i18nKey: 'firstSteps',
  duration: FIRST_STEPS_CHAPTERS.length,
  icon: 'footsteps-outline',
  color: '#0891B2',
  days: FIRST_STEPS_CHAPTERS.map((reading, i) => ({
    day: i + 1,
    readings: [reading],
  })),
};

// Plan: Los "Yo soy" de Jesús — siete declaraciones de Cristo en Juan, una por
// día, cada una con un breve contexto fiel (Sprint 99). Un plan corto y
// profundamente cristocéntrico: quién es Jesús, dicho por Él mismo.
const iamSayings: ReadingPlan = {
  id: 'iam-7',
  name: 'Los "Yo soy" de Jesús',
  description:
    'Siete días en el Evangelio de Juan: quién es Jesús, dicho por Él mismo',
  i18nKey: 'iam',
  duration: 7,
  icon: 'sparkles-outline',
  color: '#7C3AED',
  days: [
    {day: 1, readings: [{book: 'Juan', chapter: 6, verses: '25-40'}]},
    {day: 2, readings: [{book: 'Juan', chapter: 8, verses: '12-30'}]},
    {day: 3, readings: [{book: 'Juan', chapter: 10, verses: '1-10'}]},
    {day: 4, readings: [{book: 'Juan', chapter: 10, verses: '11-30'}]},
    {day: 5, readings: [{book: 'Juan', chapter: 11, verses: '17-44'}]},
    {day: 6, readings: [{book: 'Juan', chapter: 14, verses: '1-14'}]},
    {day: 7, readings: [{book: 'Juan', chapter: 15, verses: '1-17'}]},
  ],
};

// Plan: Las parábolas de Jesús — una parábola por día, cada una con un breve
// contexto fiel (Sprint 100). Las historias con que el Señor enseñó el reino.
const parablesOfJesus: ReadingPlan = {
  id: 'parables-10',
  name: 'Las parábolas de Jesús',
  description:
    'Diez días entre las historias con que Jesús enseñó el reino de Dios',
  i18nKey: 'parables',
  duration: 10,
  icon: 'leaf-outline',
  color: '#0EA5A4',
  days: [
    {day: 1, readings: [{book: 'Lucas', chapter: 15, verses: '11-32'}]},
    {day: 2, readings: [{book: 'Lucas', chapter: 10, verses: '25-37'}]},
    {day: 3, readings: [{book: 'Mateo', chapter: 13, verses: '1-23'}]},
    {day: 4, readings: [{book: 'Mateo', chapter: 13, verses: '24-43'}]},
    {day: 5, readings: [{book: 'Lucas', chapter: 15, verses: '1-10'}]},
    {day: 6, readings: [{book: 'Mateo', chapter: 18, verses: '21-35'}]},
    {day: 7, readings: [{book: 'Mateo', chapter: 25, verses: '1-13'}]},
    {day: 8, readings: [{book: 'Mateo', chapter: 25, verses: '14-30'}]},
    {day: 9, readings: [{book: 'Lucas', chapter: 18, verses: '9-14'}]},
    {day: 10, readings: [{book: 'Lucas', chapter: 14, verses: '15-24'}]},
  ],
};

// Plan: Los milagros de Jesús — una señal por día (Sprint 100). Las obras con
// que el Señor mostró su poder y su compasión, y reveló quién es.
const miraclesOfJesus: ReadingPlan = {
  id: 'miracles-10',
  name: 'Los milagros de Jesús',
  description: 'Diez días ante las señales con que Jesús mostró quién es',
  i18nKey: 'miracles',
  duration: 10,
  icon: 'flash-outline',
  color: '#2563EB',
  days: [
    {day: 1, readings: [{book: 'Juan', chapter: 2, verses: '1-11'}]},
    {day: 2, readings: [{book: 'Marcos', chapter: 4, verses: '35-41'}]},
    {day: 3, readings: [{book: 'Juan', chapter: 6, verses: '1-15'}]},
    {day: 4, readings: [{book: 'Mateo', chapter: 14, verses: '22-33'}]},
    {day: 5, readings: [{book: 'Marcos', chapter: 5, verses: '21-43'}]},
    {day: 6, readings: [{book: 'Juan', chapter: 9, verses: '1-12'}]},
    {day: 7, readings: [{book: 'Lucas', chapter: 7, verses: '11-17'}]},
    {day: 8, readings: [{book: 'Marcos', chapter: 2, verses: '1-12'}]},
    {day: 9, readings: [{book: 'Lucas', chapter: 17, verses: '11-19'}]},
    {day: 10, readings: [{book: 'Juan', chapter: 11, verses: '1-44'}]},
  ],
};

// Plan: Los nombres de Dios — siete días conociendo a Dios por los nombres con
// que se revela en su Palabra (Sprint 100), cada uno con un breve contexto.
const namesOfGod: ReadingPlan = {
  id: 'names-of-god-7',
  name: 'Los nombres de Dios',
  description: 'Siete días conociendo a Dios por los nombres con que se revela',
  i18nKey: 'namesOfGod',
  duration: 7,
  icon: 'flame-outline',
  color: '#B45309',
  days: [
    {day: 1, readings: [{book: 'Génesis', chapter: 22, verses: '1-14'}]},
    {day: 2, readings: [{book: 'Éxodo', chapter: 3, verses: '1-15'}]},
    {day: 3, readings: [{book: 'Éxodo', chapter: 17, verses: '8-16'}]},
    {day: 4, readings: [{book: 'Salmos', chapter: 23}]},
    {day: 5, readings: [{book: 'Jueces', chapter: 6, verses: '11-24'}]},
    {day: 6, readings: [{book: 'Éxodo', chapter: 15, verses: '22-27'}]},
    {day: 7, readings: [{book: 'Salmos', chapter: 91}]},
  ],
};

// Plan: El fruto del Espíritu — una gracia por día (Sprint 101). Las nueve
// facetas del fruto que el Espíritu cultiva en el creyente (Gálatas 5:22-23),
// cada una leída en un pasaje que la encarna y la cumple en Cristo.
const fruitOfSpirit: ReadingPlan = {
  id: 'fruit-of-spirit-9',
  name: 'El fruto del Espíritu',
  description:
    'Nueve días por el fruto que el Espíritu cultiva en el creyente (Gálatas 5:22-23)',
  i18nKey: 'fruitOfSpirit',
  duration: 9,
  icon: 'flower-outline',
  color: '#16A34A',
  days: [
    {day: 1, readings: [{book: '1 Corintios', chapter: 13, verses: '1-13'}]},
    {day: 2, readings: [{book: 'Filipenses', chapter: 4, verses: '4-9'}]},
    {day: 3, readings: [{book: 'Juan', chapter: 14, verses: '25-27'}]},
    {day: 4, readings: [{book: 'Santiago', chapter: 5, verses: '7-11'}]},
    {day: 5, readings: [{book: 'Efesios', chapter: 4, verses: '29-32'}]},
    {day: 6, readings: [{book: 'Romanos', chapter: 12, verses: '9-21'}]},
    {day: 7, readings: [{book: 'Mateo', chapter: 25, verses: '14-23'}]},
    {day: 8, readings: [{book: 'Mateo', chapter: 11, verses: '28-30'}]},
    {day: 9, readings: [{book: '1 Corintios', chapter: 9, verses: '24-27'}]},
  ],
};

// Plan: Los héroes de la fe — un recorrido por los testigos de Hebreos 11
// (Sprint 101), de Abel a la cruz. Cada día lee la historia de un creyente que
// confió en Dios, y el plan termina puestos los ojos en Jesús, meta de la fe.
const heroesOfFaith: ReadingPlan = {
  id: 'heroes-of-faith-8',
  name: 'Los héroes de la fe',
  description:
    'Ocho días entre los testigos de la fe de Hebreos 11, de Abel a Cristo',
  i18nKey: 'heroesOfFaith',
  duration: 8,
  icon: 'shield-outline',
  color: '#9333EA',
  days: [
    {day: 1, readings: [{book: 'Génesis', chapter: 4, verses: '1-10'}]},
    {day: 2, readings: [{book: 'Génesis', chapter: 6, verses: '11-22'}]},
    {day: 3, readings: [{book: 'Génesis', chapter: 12, verses: '1-9'}]},
    {day: 4, readings: [{book: 'Génesis', chapter: 22, verses: '1-18'}]},
    {day: 5, readings: [{book: 'Éxodo', chapter: 14, verses: '10-31'}]},
    {day: 6, readings: [{book: 'Josué', chapter: 6, verses: '1-20'}]},
    {day: 7, readings: [{book: 'Hebreos', chapter: 11}]},
    {day: 8, readings: [{book: 'Hebreos', chapter: 12, verses: '1-3'}]},
  ],
};

// Plan: El hilo profético (Hilo profético robustness round 3) — the
// chapter-level, day-by-day companion to the interactive Hilo profético
// (app/features/prophecies). Unlike `redemptionStory` above (a hand-picked
// 31-chapter highlights tour), this plan is DERIVED straight from
// MESSIANIC_PROPHECIES: one day per prophecy/shadow pair, in the thread's own
// order, reading that step's OT and NT CHAPTER (not just the single verse) for
// full context. Two entries that land on the exact same chapter pair (e.g. two
// Psalm 118 verses both fulfilled in the same Matthew 21 chapter) are merged
// into one day so the list never repeats a reading back-to-back — hence 70
// days for 72 catalog entries. Regenerate by re-running the entries through
// the same book+chapter+merge logic if the dataset grows again.
const PROPHETIC_THREAD_READINGS: ReadingPlanDay[] = [
  {
    day: 1,
    readings: [
      {book: 'Génesis', chapter: 3},
      {book: 'Gálatas', chapter: 4},
    ],
  },
  {
    day: 2,
    readings: [
      {book: 'Génesis', chapter: 22},
      {book: 'Gálatas', chapter: 3},
    ],
  },
  {
    day: 3,
    readings: [
      {book: 'Génesis', chapter: 49},
      {book: 'Hebreos', chapter: 7},
    ],
  },
  {
    day: 4,
    readings: [
      {book: 'Números', chapter: 24},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 5,
    readings: [
      {book: '2 Samuel', chapter: 7},
      {book: 'Lucas', chapter: 1},
    ],
  },
  {
    day: 6,
    readings: [
      {book: 'Isaías', chapter: 7},
      {book: 'Mateo', chapter: 1},
    ],
  },
  {
    day: 7,
    readings: [
      {book: 'Miqueas', chapter: 5},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 8,
    readings: [
      {book: 'Isaías', chapter: 9},
      {book: 'Lucas', chapter: 2},
    ],
  },
  {
    day: 9,
    readings: [
      {book: 'Oseas', chapter: 11},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 10,
    readings: [
      {book: 'Jeremías', chapter: 31},
      {book: 'Mateo', chapter: 2},
    ],
  },
  {
    day: 11,
    readings: [
      {book: 'Isaías', chapter: 11},
      {book: 'Romanos', chapter: 15},
    ],
  },
  {
    day: 12,
    readings: [
      {book: 'Malaquías', chapter: 3},
      {book: 'Marcos', chapter: 1},
    ],
  },
  {
    day: 13,
    readings: [
      {book: 'Isaías', chapter: 40},
      {book: 'Mateo', chapter: 3},
    ],
  },
  {
    day: 14,
    readings: [
      {book: 'Malaquías', chapter: 4},
      {book: 'Mateo', chapter: 17},
    ],
  },
  {
    day: 15,
    readings: [
      {book: 'Deuteronomio', chapter: 18},
      {book: 'Hechos', chapter: 3},
    ],
  },
  {
    day: 16,
    readings: [
      {book: 'Isaías', chapter: 61},
      {book: 'Lucas', chapter: 4},
    ],
  },
  {
    day: 17,
    readings: [
      {book: 'Isaías', chapter: 9},
      {book: 'Mateo', chapter: 4},
    ],
  },
  {
    day: 18,
    readings: [
      {book: 'Isaías', chapter: 35},
      {book: 'Mateo', chapter: 11},
    ],
  },
  {
    day: 19,
    readings: [
      {book: 'Salmos', chapter: 78},
      {book: 'Mateo', chapter: 13},
    ],
  },
  {
    day: 20,
    readings: [
      {book: 'Zacarías', chapter: 9},
      {book: 'Mateo', chapter: 21},
    ],
  },
  {
    day: 21,
    readings: [
      {book: 'Isaías', chapter: 42},
      {book: 'Mateo', chapter: 12},
    ],
  },
  {
    day: 22,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Mateo', chapter: 8},
    ],
  },
  {
    day: 23,
    readings: [
      {book: 'Salmos', chapter: 118},
      {book: 'Mateo', chapter: 21},
    ],
  },
  {
    day: 24,
    readings: [
      {book: 'Salmos', chapter: 8},
      {book: 'Mateo', chapter: 21},
    ],
  },
  {
    day: 25,
    readings: [
      {book: 'Isaías', chapter: 28},
      {book: '1 Pedro', chapter: 2},
    ],
  },
  {
    day: 26,
    readings: [
      {book: 'Salmos', chapter: 69},
      {book: 'Juan', chapter: 2},
    ],
  },
  {
    day: 27,
    readings: [
      {book: 'Isaías', chapter: 49},
      {book: 'Hechos', chapter: 13},
    ],
  },
  {
    day: 28,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Juan', chapter: 1},
    ],
  },
  {
    day: 29,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Juan', chapter: 12},
    ],
  },
  {
    day: 30,
    readings: [
      {book: 'Salmos', chapter: 41},
      {book: 'Juan', chapter: 13},
    ],
  },
  {
    day: 31,
    readings: [
      {book: 'Zacarías', chapter: 11},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 32,
    readings: [
      {book: 'Zacarías', chapter: 13},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 33,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Mateo', chapter: 27},
    ],
  },
  {
    day: 34,
    readings: [
      {book: 'Isaías', chapter: 50},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 35,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: '1 Pedro', chapter: 2},
    ],
  },
  {
    day: 36,
    readings: [
      {book: 'Salmos', chapter: 22},
      {book: 'Juan', chapter: 20},
    ],
  },
  {
    day: 37,
    readings: [
      {book: 'Salmos', chapter: 22},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 38,
    readings: [
      {book: 'Salmos', chapter: 69},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 39,
    readings: [
      {book: 'Salmos', chapter: 22},
      {book: 'Mateo', chapter: 27},
    ],
  },
  {
    day: 40,
    readings: [
      {book: 'Salmos', chapter: 34},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 41,
    readings: [
      {book: 'Zacarías', chapter: 12},
      {book: 'Juan', chapter: 19},
    ],
  },
  {
    day: 42,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Mateo', chapter: 27},
    ],
  },
  {
    day: 43,
    readings: [
      {book: 'Isaías', chapter: 53},
      {book: 'Lucas', chapter: 22},
    ],
  },
  {
    day: 44,
    readings: [
      {book: 'Deuteronomio', chapter: 21},
      {book: 'Gálatas', chapter: 3},
    ],
  },
  {
    day: 45,
    readings: [
      {book: 'Salmos', chapter: 16},
      {book: 'Hechos', chapter: 2},
    ],
  },
  {
    day: 46,
    readings: [
      {book: 'Salmos', chapter: 2},
      {book: 'Hechos', chapter: 13},
    ],
  },
  {
    day: 47,
    readings: [
      {book: 'Salmos', chapter: 110},
      {book: 'Hechos', chapter: 2},
    ],
  },
  {
    day: 48,
    readings: [
      {book: 'Salmos', chapter: 68},
      {book: 'Efesios', chapter: 4},
    ],
  },
  {
    day: 49,
    readings: [
      {book: 'Salmos', chapter: 45},
      {book: 'Hebreos', chapter: 1},
    ],
  },
  {
    day: 50,
    readings: [
      {book: 'Salmos', chapter: 110},
      {book: 'Hebreos', chapter: 5},
    ],
  },
  {
    day: 51,
    readings: [
      {book: 'Daniel', chapter: 7},
      {book: 'Mateo', chapter: 26},
    ],
  },
  {
    day: 52,
    readings: [
      {book: 'Joel', chapter: 2},
      {book: 'Romanos', chapter: 10},
    ],
  },
  {
    day: 53,
    readings: [
      {book: 'Amós', chapter: 9},
      {book: 'Hechos', chapter: 15},
    ],
  },
  {
    day: 54,
    readings: [
      {book: 'Salmos', chapter: 102},
      {book: 'Hebreos', chapter: 1},
    ],
  },
  {
    day: 55,
    readings: [
      {book: 'Salmos', chapter: 8},
      {book: 'Hebreos', chapter: 2},
    ],
  },
  {
    day: 56,
    readings: [
      {book: 'Isaías', chapter: 65},
      {book: 'Apocalipsis', chapter: 21},
    ],
  },
  {
    day: 57,
    readings: [
      {book: 'Éxodo', chapter: 12},
      {book: '1 Corintios', chapter: 5},
    ],
  },
  {
    day: 58,
    readings: [
      {book: 'Números', chapter: 21},
      {book: 'Juan', chapter: 3},
    ],
  },
  {
    day: 59,
    readings: [
      {book: 'Génesis', chapter: 22},
      {book: 'Juan', chapter: 1},
    ],
  },
  {
    day: 60,
    readings: [
      {book: 'Éxodo', chapter: 16},
      {book: 'Juan', chapter: 6},
    ],
  },
  {
    day: 61,
    readings: [
      {book: 'Éxodo', chapter: 17},
      {book: '1 Corintios', chapter: 10},
    ],
  },
  {
    day: 62,
    readings: [
      {book: 'Éxodo', chapter: 25},
      {book: 'Juan', chapter: 1},
    ],
  },
  {
    day: 63,
    readings: [
      {book: 'Levítico', chapter: 16},
      {book: 'Hebreos', chapter: 9},
    ],
  },
  {
    day: 64,
    readings: [
      {book: 'Génesis', chapter: 14},
      {book: 'Hebreos', chapter: 7},
    ],
  },
  {
    day: 65,
    readings: [
      {book: 'Levítico', chapter: 23},
      {book: '1 Corintios', chapter: 15},
    ],
  },
  {
    day: 66,
    readings: [
      {book: 'Jonás', chapter: 1},
      {book: 'Mateo', chapter: 12},
    ],
  },
  {
    day: 67,
    readings: [
      {book: 'Génesis', chapter: 2},
      {book: '1 Corintios', chapter: 15},
    ],
  },
  {
    day: 68,
    readings: [
      {book: 'Éxodo', chapter: 26},
      {book: 'Hebreos', chapter: 10},
    ],
  },
  {
    day: 69,
    readings: [
      {book: 'Levítico', chapter: 16},
      {book: 'Hebreos', chapter: 9},
    ],
  },
  {
    day: 70,
    readings: [
      {book: 'Josué', chapter: 21},
      {book: 'Hebreos', chapter: 4},
    ],
  },
];
const propheticThread: ReadingPlan = {
  id: 'prophetic-thread-70',
  name: 'El hilo profético',
  description:
    'El Antiguo y el Nuevo Testamento, capítulo a capítulo: 70 días recorriendo cada profecía y su cumplimiento en Cristo',
  i18nKey: 'propheticThread',
  duration: PROPHETIC_THREAD_READINGS.length,
  icon: 'git-network-outline',
  color: '#6366f1',
  days: PROPHETIC_THREAD_READINGS,
};

export const READING_PLANS: ReadingPlan[] = [
  firstSteps,
  iamSayings,
  parablesOfJesus,
  miraclesOfJesus,
  namesOfGod,
  fruitOfSpirit,
  heroesOfFaith,
  redemptionStory,
  propheticThread,
  gospels40Days,
  newTestament30Days,
  wisdomDaily,
  psalms30Days,
  proverbsMonth,
  genesisMonth,
  bibleInAYear,
];

export function getReadingPlanById(id: string): ReadingPlan | undefined {
  return (
    READING_PLANS.find(plan => plan.id === id) ??
    getRegisteredCustomPlanById(id)
  );
}

/**
 * Resuelve el nombre y la descripción del plan en el idioma activo de la UI.
 * Cae al texto por defecto (español) si la clave i18n no estuviera presente.
 */
export function getLocalizedPlan(
  plan: ReadingPlan,
  t: TranslationKeys,
): {name: string; description: string} {
  const localized = plan.i18nKey ? t.readingPlans?.[plan.i18nKey] : undefined;
  return {
    name: localized?.name ?? plan.name,
    description: localized?.description ?? plan.description,
  };
}

/**
 * A brief, faithful one-line context for a plan's given day, in the active UI
 * language, or undefined when the plan carries none (Sprint 99). Topical plans
 * (e.g. the "I am" sayings) add a `context` array to their i18n entry, indexed
 * by day; most plans have no per-day note. Typed loosely so only the plans that
 * opt in carry the field.
 */
export function getPlanDayContext(
  plan: ReadingPlan,
  day: number,
  t: TranslationKeys,
): string | undefined {
  const entry = plan.i18nKey
    ? (t.readingPlans?.[plan.i18nKey] as
        | {context?: readonly string[]}
        | undefined)
    : undefined;
  return entry?.context?.[day - 1];
}
