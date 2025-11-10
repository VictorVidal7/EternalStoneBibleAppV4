export const readingPlans = [
  {
    id: 'bible-in-a-year',
    name: 'La Biblia en un Año',
    description: 'Lee toda la Biblia en 365 días',
    duration: 365,
    readings: [
      { day: 1, passages: ['Génesis 1-3', 'Mateo 1'] },
      { day: 2, passages: ['Génesis 4-6', 'Mateo 2'] },
      // ... más días ...
    ]
  },
  {
    id: 'nt-in-90-days',
    name: 'Nuevo Testamento en 90 Días',
    description: 'Lee el Nuevo Testamento en 90 días',
    duration: 90,
    readings: [
      { day: 1, passages: ['Mateo 1-3'] },
      { day: 2, passages: ['Mateo 4-6'] },
      // ... más días ...
    ]
  },
  // ... más planes ...
];