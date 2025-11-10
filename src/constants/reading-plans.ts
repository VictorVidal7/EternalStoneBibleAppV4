// Planes de lectura bíblica

export interface ReadingPlanDay {
  day: number;
  readings: {
    book: string;
    chapter: number;
    verses?: string; // e.g., "1-10" o undefined para todo el capítulo
  }[];
}

export interface ReadingPlan {
  id: string;
  name: string;
  description: string;
  duration: number; // días
  icon: string;
  color: string;
  days: ReadingPlanDay[];
}

// Plan: Nuevo Testamento en 30 días
const newTestament30Days: ReadingPlan = {
  id: 'nt-30',
  name: 'Nuevo Testamento en 30 Días',
  description: 'Lee todo el Nuevo Testamento en un mes',
  duration: 30,
  icon: 'book-outline',
  color: '#3498DB',
  days: [
    { day: 1, readings: [{ book: 'Mateo', chapter: 1 }, { book: 'Mateo', chapter: 2 }, { book: 'Mateo', chapter: 3 }] },
    { day: 2, readings: [{ book: 'Mateo', chapter: 4 }, { book: 'Mateo', chapter: 5 }] },
    { day: 3, readings: [{ book: 'Mateo', chapter: 6 }, { book: 'Mateo', chapter: 7 }, { book: 'Mateo', chapter: 8 }] },
    { day: 4, readings: [{ book: 'Mateo', chapter: 9 }, { book: 'Mateo', chapter: 10 }] },
    { day: 5, readings: [{ book: 'Mateo', chapter: 11 }, { book: 'Mateo', chapter: 12 }] },
    { day: 6, readings: [{ book: 'Mateo', chapter: 13 }, { book: 'Mateo', chapter: 14 }] },
    { day: 7, readings: [{ book: 'Mateo', chapter: 15 }, { book: 'Mateo', chapter: 16 }, { book: 'Mateo', chapter: 17 }] },
    { day: 8, readings: [{ book: 'Mateo', chapter: 18 }, { book: 'Mateo', chapter: 19 }, { book: 'Mateo', chapter: 20 }] },
    { day: 9, readings: [{ book: 'Mateo', chapter: 21 }, { book: 'Mateo', chapter: 22 }] },
    { day: 10, readings: [{ book: 'Mateo', chapter: 23 }, { book: 'Mateo', chapter: 24 }] },
    { day: 11, readings: [{ book: 'Mateo', chapter: 25 }, { book: 'Mateo', chapter: 26 }] },
    { day: 12, readings: [{ book: 'Mateo', chapter: 27 }, { book: 'Mateo', chapter: 28 }, { book: 'Marcos', chapter: 1 }] },
    { day: 13, readings: [{ book: 'Marcos', chapter: 2 }, { book: 'Marcos', chapter: 3 }, { book: 'Marcos', chapter: 4 }] },
    { day: 14, readings: [{ book: 'Marcos', chapter: 5 }, { book: 'Marcos', chapter: 6 }] },
    { day: 15, readings: [{ book: 'Marcos', chapter: 7 }, { book: 'Marcos', chapter: 8 }, { book: 'Marcos', chapter: 9 }] },
    { day: 16, readings: [{ book: 'Marcos', chapter: 10 }, { book: 'Marcos', chapter: 11 }, { book: 'Marcos', chapter: 12 }] },
    { day: 17, readings: [{ book: 'Marcos', chapter: 13 }, { book: 'Marcos', chapter: 14 }] },
    { day: 18, readings: [{ book: 'Marcos', chapter: 15 }, { book: 'Marcos', chapter: 16 }, { book: 'Lucas', chapter: 1 }] },
    { day: 19, readings: [{ book: 'Lucas', chapter: 2 }, { book: 'Lucas', chapter: 3 }, { book: 'Lucas', chapter: 4 }] },
    { day: 20, readings: [{ book: 'Lucas', chapter: 5 }, { book: 'Lucas', chapter: 6 }] },
    { day: 21, readings: [{ book: 'Lucas', chapter: 7 }, { book: 'Lucas', chapter: 8 }] },
    { day: 22, readings: [{ book: 'Lucas', chapter: 9 }, { book: 'Lucas', chapter: 10 }] },
    { day: 23, readings: [{ book: 'Lucas', chapter: 11 }, { book: 'Lucas', chapter: 12 }] },
    { day: 24, readings: [{ book: 'Lucas', chapter: 13 }, { book: 'Lucas', chapter: 14 }, { book: 'Lucas', chapter: 15 }] },
    { day: 25, readings: [{ book: 'Lucas', chapter: 16 }, { book: 'Lucas', chapter: 17 }, { book: 'Lucas', chapter: 18 }] },
    { day: 26, readings: [{ book: 'Lucas', chapter: 19 }, { book: 'Lucas', chapter: 20 }, { book: 'Lucas', chapter: 21 }] },
    { day: 27, readings: [{ book: 'Lucas', chapter: 22 }, { book: 'Lucas', chapter: 23 }] },
    { day: 28, readings: [{ book: 'Lucas', chapter: 24 }, { book: 'Juan', chapter: 1 }, { book: 'Juan', chapter: 2 }] },
    { day: 29, readings: [{ book: 'Juan', chapter: 3 }, { book: 'Juan', chapter: 4 }, { book: 'Juan', chapter: 5 }] },
    { day: 30, readings: [{ book: 'Juan', chapter: 6 }, { book: 'Juan', chapter: 7 }] },
  ],
};

// Plan: Salmos en 30 días
const psalms30Days: ReadingPlan = {
  id: 'psalms-30',
  name: 'Salmos en 30 Días',
  description: 'Lee el libro de Salmos completo en un mes',
  duration: 30,
  icon: 'musical-notes-outline',
  color: '#9B59B6',
  days: Array.from({ length: 30 }, (_, i) => ({
    day: i + 1,
    readings: Array.from({ length: 5 }, (_, j) => ({
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
  duration: 31,
  icon: 'bulb-outline',
  color: '#F39C12',
  days: Array.from({ length: 31 }, (_, i) => ({
    day: i + 1,
    readings: [{ book: 'Proverbios', chapter: i + 1 }],
  })),
};

// Plan: Evangelios en 40 días
const gospels40Days: ReadingPlan = {
  id: 'gospels-40',
  name: 'Los 4 Evangelios en 40 Días',
  description: 'Conoce la vida de Jesús a través de los cuatro evangelios',
  duration: 40,
  icon: 'heart-outline',
  color: '#E74C3C',
  days: [
    // Mateo (28 capítulos en ~10 días)
    { day: 1, readings: [{ book: 'Mateo', chapter: 1 }, { book: 'Mateo', chapter: 2 }, { book: 'Mateo', chapter: 3 }] },
    { day: 2, readings: [{ book: 'Mateo', chapter: 4 }, { book: 'Mateo', chapter: 5 }] },
    { day: 3, readings: [{ book: 'Mateo', chapter: 6 }, { book: 'Mateo', chapter: 7 }] },
    { day: 4, readings: [{ book: 'Mateo', chapter: 8 }, { book: 'Mateo', chapter: 9 }] },
    { day: 5, readings: [{ book: 'Mateo', chapter: 10 }, { book: 'Mateo', chapter: 11 }] },
    { day: 6, readings: [{ book: 'Mateo', chapter: 12 }, { book: 'Mateo', chapter: 13 }] },
    { day: 7, readings: [{ book: 'Mateo', chapter: 14 }, { book: 'Mateo', chapter: 15 }] },
    { day: 8, readings: [{ book: 'Mateo', chapter: 16 }, { book: 'Mateo', chapter: 17 }, { book: 'Mateo', chapter: 18 }] },
    { day: 9, readings: [{ book: 'Mateo', chapter: 19 }, { book: 'Mateo', chapter: 20 }, { book: 'Mateo', chapter: 21 }] },
    { day: 10, readings: [{ book: 'Mateo', chapter: 22 }, { book: 'Mateo', chapter: 23 }] },
    { day: 11, readings: [{ book: 'Mateo', chapter: 24 }, { book: 'Mateo', chapter: 25 }] },
    { day: 12, readings: [{ book: 'Mateo', chapter: 26 }, { book: 'Mateo', chapter: 27 }] },
    { day: 13, readings: [{ book: 'Mateo', chapter: 28 }, { book: 'Marcos', chapter: 1 }] },
    // Marcos (16 capítulos en ~7 días)
    { day: 14, readings: [{ book: 'Marcos', chapter: 2 }, { book: 'Marcos', chapter: 3 }] },
    { day: 15, readings: [{ book: 'Marcos', chapter: 4 }, { book: 'Marcos', chapter: 5 }] },
    { day: 16, readings: [{ book: 'Marcos', chapter: 6 }, { book: 'Marcos', chapter: 7 }] },
    { day: 17, readings: [{ book: 'Marcos', chapter: 8 }, { book: 'Marcos', chapter: 9 }] },
    { day: 18, readings: [{ book: 'Marcos', chapter: 10 }, { book: 'Marcos', chapter: 11 }] },
    { day: 19, readings: [{ book: 'Marcos', chapter: 12 }, { book: 'Marcos', chapter: 13 }] },
    { day: 20, readings: [{ book: 'Marcos', chapter: 14 }, { book: 'Marcos', chapter: 15 }, { book: 'Marcos', chapter: 16 }] },
    // Lucas (24 capítulos en ~10 días)
    { day: 21, readings: [{ book: 'Lucas', chapter: 1 }, { book: 'Lucas', chapter: 2 }] },
    { day: 22, readings: [{ book: 'Lucas', chapter: 3 }, { book: 'Lucas', chapter: 4 }] },
    { day: 23, readings: [{ book: 'Lucas', chapter: 5 }, { book: 'Lucas', chapter: 6 }] },
    { day: 24, readings: [{ book: 'Lucas', chapter: 7 }, { book: 'Lucas', chapter: 8 }] },
    { day: 25, readings: [{ book: 'Lucas', chapter: 9 }, { book: 'Lucas', chapter: 10 }] },
    { day: 26, readings: [{ book: 'Lucas', chapter: 11 }, { book: 'Lucas', chapter: 12 }] },
    { day: 27, readings: [{ book: 'Lucas', chapter: 13 }, { book: 'Lucas', chapter: 14 }] },
    { day: 28, readings: [{ book: 'Lucas', chapter: 15 }, { book: 'Lucas', chapter: 16 }] },
    { day: 29, readings: [{ book: 'Lucas', chapter: 17 }, { book: 'Lucas', chapter: 18 }, { book: 'Lucas', chapter: 19 }] },
    { day: 30, readings: [{ book: 'Lucas', chapter: 20 }, { book: 'Lucas', chapter: 21 }, { book: 'Lucas', chapter: 22 }] },
    { day: 31, readings: [{ book: 'Lucas', chapter: 23 }, { book: 'Lucas', chapter: 24 }] },
    // Juan (21 capítulos en ~9 días)
    { day: 32, readings: [{ book: 'Juan', chapter: 1 }, { book: 'Juan', chapter: 2 }] },
    { day: 33, readings: [{ book: 'Juan', chapter: 3 }, { book: 'Juan', chapter: 4 }] },
    { day: 34, readings: [{ book: 'Juan', chapter: 5 }, { book: 'Juan', chapter: 6 }] },
    { day: 35, readings: [{ book: 'Juan', chapter: 7 }, { book: 'Juan', chapter: 8 }] },
    { day: 36, readings: [{ book: 'Juan', chapter: 9 }, { book: 'Juan', chapter: 10 }] },
    { day: 37, readings: [{ book: 'Juan', chapter: 11 }, { book: 'Juan', chapter: 12 }] },
    { day: 38, readings: [{ book: 'Juan', chapter: 13 }, { book: 'Juan', chapter: 14 }, { book: 'Juan', chapter: 15 }] },
    { day: 39, readings: [{ book: 'Juan', chapter: 16 }, { book: 'Juan', chapter: 17 }, { book: 'Juan', chapter: 18 }] },
    { day: 40, readings: [{ book: 'Juan', chapter: 19 }, { book: 'Juan', chapter: 20 }, { book: 'Juan', chapter: 21 }] },
  ],
};

// Plan: Génesis (historia de orígenes)
const genesisMonth: ReadingPlan = {
  id: 'genesis-month',
  name: 'Génesis - El Principio',
  description: 'Descubre el origen de todo en el libro de Génesis',
  duration: 25,
  icon: 'planet-outline',
  color: '#27AE60',
  days: Array.from({ length: 25 }, (_, i) => {
    const chaptersPerDay = i < 24 ? 2 : 2;
    const startChapter = i * 2 + 1;
    return {
      day: i + 1,
      readings: Array.from({ length: chaptersPerDay }, (_, j) => ({
        book: 'Génesis',
        chapter: startChapter + j,
      })).filter(r => r.chapter <= 50),
    };
  }),
};

export const READING_PLANS: ReadingPlan[] = [
  proverbsMonth,
  psalms30Days,
  gospels40Days,
  newTestament30Days,
  genesisMonth,
];

export function getReadingPlanById(id: string): ReadingPlan | undefined {
  return READING_PLANS.find(plan => plan.id === id);
}
