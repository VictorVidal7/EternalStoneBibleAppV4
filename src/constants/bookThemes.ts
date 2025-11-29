/**
 * 🎨 DYNAMIC BOOK THEMES
 *
 * Temas visuales únicos para cada libro de la Biblia
 * Cada libro tiene su propia paleta de colores y gradientes
 * Para la gloria de Dios y del Rey Jesús
 */

export interface BookTheme {
  name: string;
  gradient: readonly [string, string, string];
  gradientDark: readonly [string, string, string];
  primary: string;
  accent: string;
  description: string;
  emoji: string;
}

/**
 * Temas del Antiguo Testamento
 */
const OLD_TESTAMENT_THEMES: Record<string, BookTheme> = {
  // Pentateuco - Tonos tierra y creación
  Genesis: {
    name: 'Genesis',
    gradient: ['#22c55e', '#16a34a', '#15803d'] as const,
    gradientDark: ['#166534', '#14532d', '#052e16'] as const,
    primary: '#16a34a',
    accent: '#22c55e',
    description: 'Creación - Verde vida',
    emoji: '🌱',
  },
  Exodus: {
    name: 'Exodus',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Libertad - Dorado fuego',
    emoji: '🔥',
  },
  Leviticus: {
    name: 'Leviticus',
    gradient: ['#a855f7', '#9333ea', '#7e22ce'] as const,
    gradientDark: ['#6b21a8', '#581c87', '#3b0764'] as const,
    primary: '#9333ea',
    accent: '#a855f7',
    description: 'Santidad - Púrpura real',
    emoji: '👑',
  },
  Numbers: {
    name: 'Numbers',
    gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
    gradientDark: ['#155e75', '#164e63', '#083344'] as const,
    primary: '#0891b2',
    accent: '#06b6d4',
    description: 'Peregrinación - Azul cielo',
    emoji: '⛺',
  },
  Deuteronomy: {
    name: 'Deuteronomy',
    gradient: ['#eab308', '#ca8a04', '#a16207'] as const,
    gradientDark: ['#854d0e', '#713f12', '#422006'] as const,
    primary: '#ca8a04',
    accent: '#eab308',
    description: 'Ley - Oro sabiduría',
    emoji: '📜',
  },

  // Libros Históricos - Tonos tierra y realeza
  Joshua: {
    name: 'Joshua',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    gradientDark: ['#991b1b', '#7f1d1d', '#450a0a'] as const,
    primary: '#dc2626',
    accent: '#ef4444',
    description: 'Conquista - Rojo valentía',
    emoji: '⚔️',
  },
  Judges: {
    name: 'Judges',
    gradient: ['#f97316', '#ea580c', '#c2410c'] as const,
    gradientDark: ['#9a3412', '#7c2d12', '#431407'] as const,
    primary: '#ea580c',
    accent: '#f97316',
    description: 'Liberación - Naranja fuego',
    emoji: '🛡️',
  },
  Ruth: {
    name: 'Ruth',
    gradient: ['#ec4899', '#db2777', '#be185d'] as const,
    gradientDark: ['#9f1239', '#831843', '#500724'] as const,
    primary: '#db2777',
    accent: '#ec4899',
    description: 'Lealtad - Rosa amor',
    emoji: '💝',
  },
  '1 Samuel': {
    name: '1 Samuel',
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    gradientDark: ['#5b21b6', '#4c1d95', '#2e1065'] as const,
    primary: '#7c3aed',
    accent: '#8b5cf6',
    description: 'Reino - Violeta real',
    emoji: '👑',
  },
  '2 Samuel': {
    name: '2 Samuel',
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    gradientDark: ['#5b21b6', '#4c1d95', '#2e1065'] as const,
    primary: '#7c3aed',
    accent: '#8b5cf6',
    description: 'Reino - Violeta real',
    emoji: '👑',
  },
  '1 Kings': {
    name: '1 Kings',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Gloria - Dorado templo',
    emoji: '🏛️',
  },
  '2 Kings': {
    name: '2 Kings',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Gloria - Dorado templo',
    emoji: '🏛️',
  },
  '1 Chronicles': {
    name: '1 Chronicles',
    gradient: ['#0ea5e9', '#0284c7', '#0369a1'] as const,
    gradientDark: ['#075985', '#0c4a6e', '#082f49'] as const,
    primary: '#0284c7',
    accent: '#0ea5e9',
    description: 'Historia - Azul memoria',
    emoji: '📖',
  },
  '2 Chronicles': {
    name: '2 Chronicles',
    gradient: ['#0ea5e9', '#0284c7', '#0369a1'] as const,
    gradientDark: ['#075985', '#0c4a6e', '#082f49'] as const,
    primary: '#0284c7',
    accent: '#0ea5e9',
    description: 'Historia - Azul memoria',
    emoji: '📖',
  },
  Ezra: {
    name: 'Ezra',
    gradient: ['#14b8a6', '#0d9488', '#0f766e'] as const,
    gradientDark: ['#115e59', '#134e4a', '#042f2e'] as const,
    primary: '#0d9488',
    accent: '#14b8a6',
    description: 'Restauración - Turquesa renovación',
    emoji: '🔨',
  },
  Nehemiah: {
    name: 'Nehemiah',
    gradient: ['#14b8a6', '#0d9488', '#0f766e'] as const,
    gradientDark: ['#115e59', '#134e4a', '#042f2e'] as const,
    primary: '#0d9488',
    accent: '#14b8a6',
    description: 'Reconstrucción - Turquesa murallas',
    emoji: '🧱',
  },
  Esther: {
    name: 'Esther',
    gradient: ['#ec4899', '#db2777', '#be185d'] as const,
    gradientDark: ['#9f1239', '#831843', '#500724'] as const,
    primary: '#db2777',
    accent: '#ec4899',
    description: 'Valentía - Rosa realeza',
    emoji: '👸',
  },

  // Libros Poéticos - Tonos celestiales y profundos
  Job: {
    name: 'Job',
    gradient: ['#64748b', '#475569', '#334155'] as const,
    gradientDark: ['#1e293b', '#0f172a', '#020617'] as const,
    primary: '#475569',
    accent: '#64748b',
    description: 'Prueba - Gris resistencia',
    emoji: '⛈️',
  },
  Psalms: {
    name: 'Psalms',
    gradient: ['#3b82f6', '#2563eb', '#1d4ed8'] as const,
    gradientDark: ['#1e40af', '#1e3a8a', '#172554'] as const,
    primary: '#2563eb',
    accent: '#3b82f6',
    description: 'Alabanza - Azul adoración',
    emoji: '🎵',
  },
  Proverbs: {
    name: 'Proverbs',
    gradient: ['#eab308', '#ca8a04', '#a16207'] as const,
    gradientDark: ['#854d0e', '#713f12', '#422006'] as const,
    primary: '#ca8a04',
    accent: '#eab308',
    description: 'Sabiduría - Oro conocimiento',
    emoji: '💡',
  },
  Ecclesiastes: {
    name: 'Ecclesiastes',
    gradient: ['#71717a', '#52525b', '#3f3f46'] as const,
    gradientDark: ['#27272a', '#18181b', '#09090b'] as const,
    primary: '#52525b',
    accent: '#71717a',
    description: 'Reflexión - Gris contemplación',
    emoji: '🤔',
  },
  'Song of Solomon': {
    name: 'Song of Solomon',
    gradient: ['#f43f5e', '#e11d48', '#be123c'] as const,
    gradientDark: ['#9f1239', '#881337', '#4c0519'] as const,
    primary: '#e11d48',
    accent: '#f43f5e',
    description: 'Amor - Rojo pasión',
    emoji: '❤️',
  },

  // Profetas Mayores - Tonos intensos
  Isaiah: {
    name: 'Isaiah',
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    gradientDark: ['#5b21b6', '#4c1d95', '#2e1065'] as const,
    primary: '#7c3aed',
    accent: '#8b5cf6',
    description: 'Profecía - Púrpura visión',
    emoji: '🔮',
  },
  Jeremiah: {
    name: 'Jeremiah',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    gradientDark: ['#991b1b', '#7f1d1d', '#450a0a'] as const,
    primary: '#dc2626',
    accent: '#ef4444',
    description: 'Juicio - Rojo advertencia',
    emoji: '⚠️',
  },
  Lamentations: {
    name: 'Lamentations',
    gradient: ['#6b7280', '#4b5563', '#374151'] as const,
    gradientDark: ['#1f2937', '#111827', '#030712'] as const,
    primary: '#4b5563',
    accent: '#6b7280',
    description: 'Lamento - Gris tristeza',
    emoji: '😢',
  },
  Ezekiel: {
    name: 'Ezekiel',
    gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
    gradientDark: ['#155e75', '#164e63', '#083344'] as const,
    primary: '#0891b2',
    accent: '#06b6d4',
    description: 'Visión - Cyan revelación',
    emoji: '👁️',
  },
  Daniel: {
    name: 'Daniel',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Sabiduría - Oro profético',
    emoji: '🦁',
  },

  // Profetas Menores - Tonos variados
  Hosea: {
    name: 'Hosea',
    gradient: ['#ec4899', '#db2777', '#be185d'] as const,
    gradientDark: ['#9f1239', '#831843', '#500724'] as const,
    primary: '#db2777',
    accent: '#ec4899',
    description: 'Amor fiel - Rosa devoción',
    emoji: '💕',
  },
  Joel: {
    name: 'Joel',
    gradient: ['#84cc16', '#65a30d', '#4d7c0f'] as const,
    gradientDark: ['#3f6212', '#365314', '#1a2e05'] as const,
    primary: '#65a30d',
    accent: '#84cc16',
    description: 'Restauración - Verde esperanza',
    emoji: '🌾',
  },
  Amos: {
    name: 'Amos',
    gradient: ['#f97316', '#ea580c', '#c2410c'] as const,
    gradientDark: ['#9a3412', '#7c2d12', '#431407'] as const,
    primary: '#ea580c',
    accent: '#f97316',
    description: 'Justicia - Naranja pasión',
    emoji: '⚖️',
  },
  Obadiah: {
    name: 'Obadiah',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    gradientDark: ['#991b1b', '#7f1d1d', '#450a0a'] as const,
    primary: '#dc2626',
    accent: '#ef4444',
    description: 'Juicio - Rojo ira',
    emoji: '⚡',
  },
  Jonah: {
    name: 'Jonah',
    gradient: ['#0ea5e9', '#0284c7', '#0369a1'] as const,
    gradientDark: ['#075985', '#0c4a6e', '#082f49'] as const,
    primary: '#0284c7',
    accent: '#0ea5e9',
    description: 'Misericordia - Azul mar',
    emoji: '🐋',
  },
  Micah: {
    name: 'Micah',
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    gradientDark: ['#5b21b6', '#4c1d95', '#2e1065'] as const,
    primary: '#7c3aed',
    accent: '#8b5cf6',
    description: 'Profecía - Púrpura esperanza',
    emoji: '🌟',
  },
  Nahum: {
    name: 'Nahum',
    gradient: ['#dc2626', '#b91c1c', '#991b1b'] as const,
    gradientDark: ['#7f1d1d', '#450a0a', '#1a0000'] as const,
    primary: '#b91c1c',
    accent: '#dc2626',
    description: 'Venganza - Rojo oscuro',
    emoji: '⚔️',
  },
  Habakkuk: {
    name: 'Habakkuk',
    gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
    gradientDark: ['#155e75', '#164e63', '#083344'] as const,
    primary: '#0891b2',
    accent: '#06b6d4',
    description: 'Fe - Cyan confianza',
    emoji: '🙏',
  },
  Zephaniah: {
    name: 'Zephaniah',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Juicio - Dorado fuego',
    emoji: '🔥',
  },
  Haggai: {
    name: 'Haggai',
    gradient: ['#14b8a6', '#0d9488', '#0f766e'] as const,
    gradientDark: ['#115e59', '#134e4a', '#042f2e'] as const,
    primary: '#0d9488',
    accent: '#14b8a6',
    description: 'Reconstrucción - Turquesa edificación',
    emoji: '🏗️',
  },
  Zechariah: {
    name: 'Zechariah',
    gradient: ['#a855f7', '#9333ea', '#7e22ce'] as const,
    gradientDark: ['#6b21a8', '#581c87', '#3b0764'] as const,
    primary: '#9333ea',
    accent: '#a855f7',
    description: 'Visiones - Púrpura místico',
    emoji: '✨',
  },
  Malachi: {
    name: 'Malachi',
    gradient: ['#eab308', '#ca8a04', '#a16207'] as const,
    gradientDark: ['#854d0e', '#713f12', '#422006'] as const,
    primary: '#ca8a04',
    accent: '#eab308',
    description: 'Promesa - Oro pacto',
    emoji: '🤝',
  },
};

/**
 * Temas del Nuevo Testamento
 */
const NEW_TESTAMENT_THEMES: Record<string, BookTheme> = {
  // Evangelios - Tonos brillantes y esperanzadores
  Matthew: {
    name: 'Matthew',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Rey - Dorado realeza',
    emoji: '👑',
  },
  Mark: {
    name: 'Mark',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    gradientDark: ['#991b1b', '#7f1d1d', '#450a0a'] as const,
    primary: '#dc2626',
    accent: '#ef4444',
    description: 'Siervo - Rojo servicio',
    emoji: '🙌',
  },
  Luke: {
    name: 'Luke',
    gradient: ['#22c55e', '#16a34a', '#15803d'] as const,
    gradientDark: ['#166534', '#14532d', '#052e16'] as const,
    primary: '#16a34a',
    accent: '#22c55e',
    description: 'Hijo del Hombre - Verde humanidad',
    emoji: '🌿',
  },
  John: {
    name: 'John',
    gradient: ['#3b82f6', '#2563eb', '#1d4ed8'] as const,
    gradientDark: ['#1e40af', '#1e3a8a', '#172554'] as const,
    primary: '#2563eb',
    accent: '#3b82f6',
    description: 'Hijo de Dios - Azul divino',
    emoji: '✝️',
  },

  // Hechos y Epístolas Paulinas
  Acts: {
    name: 'Acts',
    gradient: ['#f97316', '#ea580c', '#c2410c'] as const,
    gradientDark: ['#9a3412', '#7c2d12', '#431407'] as const,
    primary: '#ea580c',
    accent: '#f97316',
    description: 'Espíritu Santo - Naranja fuego',
    emoji: '🔥',
  },
  Romans: {
    name: 'Romans',
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    gradientDark: ['#5b21b6', '#4c1d95', '#2e1065'] as const,
    primary: '#7c3aed',
    accent: '#8b5cf6',
    description: 'Justificación - Púrpura verdad',
    emoji: '⚖️',
  },
  '1 Corinthians': {
    name: '1 Corinthians',
    gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
    gradientDark: ['#155e75', '#164e63', '#083344'] as const,
    primary: '#0891b2',
    accent: '#06b6d4',
    description: 'Unidad - Cyan comunidad',
    emoji: '🤝',
  },
  '2 Corinthians': {
    name: '2 Corinthians',
    gradient: ['#06b6d4', '#0891b2', '#0e7490'] as const,
    gradientDark: ['#155e75', '#164e63', '#083344'] as const,
    primary: '#0891b2',
    accent: '#06b6d4',
    description: 'Ministerio - Cyan servicio',
    emoji: '💼',
  },
  Galatians: {
    name: 'Galatians',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Libertad - Dorado cadenas rotas',
    emoji: '🔓',
  },
  Ephesians: {
    name: 'Ephesians',
    gradient: ['#8b5cf6', '#7c3aed', '#6d28d9'] as const,
    gradientDark: ['#5b21b6', '#4c1d95', '#2e1065'] as const,
    primary: '#7c3aed',
    accent: '#8b5cf6',
    description: 'Iglesia - Púrpura cuerpo',
    emoji: '⛪',
  },
  Philippians: {
    name: 'Philippians',
    gradient: ['#ec4899', '#db2777', '#be185d'] as const,
    gradientDark: ['#9f1239', '#831843', '#500724'] as const,
    primary: '#db2777',
    accent: '#ec4899',
    description: 'Gozo - Rosa alegría',
    emoji: '😊',
  },
  Colossians: {
    name: 'Colossians',
    gradient: ['#eab308', '#ca8a04', '#a16207'] as const,
    gradientDark: ['#854d0e', '#713f12', '#422006'] as const,
    primary: '#ca8a04',
    accent: '#eab308',
    description: 'Supremacía - Oro Cristo',
    emoji: '👑',
  },
  '1 Thessalonians': {
    name: '1 Thessalonians',
    gradient: ['#14b8a6', '#0d9488', '#0f766e'] as const,
    gradientDark: ['#115e59', '#134e4a', '#042f2e'] as const,
    primary: '#0d9488',
    accent: '#14b8a6',
    description: 'Esperanza - Turquesa espera',
    emoji: '⏰',
  },
  '2 Thessalonians': {
    name: '2 Thessalonians',
    gradient: ['#14b8a6', '#0d9488', '#0f766e'] as const,
    gradientDark: ['#115e59', '#134e4a', '#042f2e'] as const,
    primary: '#0d9488',
    accent: '#14b8a6',
    description: 'Perseverancia - Turquesa firmeza',
    emoji: '💪',
  },
  '1 Timothy': {
    name: '1 Timothy',
    gradient: ['#22c55e', '#16a34a', '#15803d'] as const,
    gradientDark: ['#166534', '#14532d', '#052e16'] as const,
    primary: '#16a34a',
    accent: '#22c55e',
    description: 'Liderazgo - Verde crecimiento',
    emoji: '🌱',
  },
  '2 Timothy': {
    name: '2 Timothy',
    gradient: ['#22c55e', '#16a34a', '#15803d'] as const,
    gradientDark: ['#166534', '#14532d', '#052e16'] as const,
    primary: '#16a34a',
    accent: '#22c55e',
    description: 'Fidelidad - Verde perseverancia',
    emoji: '🎯',
  },
  Titus: {
    name: 'Titus',
    gradient: ['#0ea5e9', '#0284c7', '#0369a1'] as const,
    gradientDark: ['#075985', '#0c4a6e', '#082f49'] as const,
    primary: '#0284c7',
    accent: '#0ea5e9',
    description: 'Orden - Azul estructura',
    emoji: '📋',
  },
  Philemon: {
    name: 'Philemon',
    gradient: ['#ec4899', '#db2777', '#be185d'] as const,
    gradientDark: ['#9f1239', '#831843', '#500724'] as const,
    primary: '#db2777',
    accent: '#ec4899',
    description: 'Perdón - Rosa reconciliación',
    emoji: '🤗',
  },

  // Epístolas Generales
  Hebrews: {
    name: 'Hebrews',
    gradient: ['#f59e0b', '#d97706', '#b45309'] as const,
    gradientDark: ['#92400e', '#78350f', '#451a03'] as const,
    primary: '#d97706',
    accent: '#f59e0b',
    description: 'Sumo Sacerdote - Dorado sagrado',
    emoji: '🕊️',
  },
  James: {
    name: 'James',
    gradient: ['#84cc16', '#65a30d', '#4d7c0f'] as const,
    gradientDark: ['#3f6212', '#365314', '#1a2e05'] as const,
    primary: '#65a30d',
    accent: '#84cc16',
    description: 'Fe práctica - Verde acción',
    emoji: '🌾',
  },
  '1 Peter': {
    name: '1 Peter',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    gradientDark: ['#991b1b', '#7f1d1d', '#450a0a'] as const,
    primary: '#dc2626',
    accent: '#ef4444',
    description: 'Sufrimiento - Rojo prueba',
    emoji: '⛑️',
  },
  '2 Peter': {
    name: '2 Peter',
    gradient: ['#ef4444', '#dc2626', '#b91c1c'] as const,
    gradientDark: ['#991b1b', '#7f1d1d', '#450a0a'] as const,
    primary: '#dc2626',
    accent: '#ef4444',
    description: 'Crecimiento - Rojo madurez',
    emoji: '📈',
  },
  '1 John': {
    name: '1 John',
    gradient: ['#f43f5e', '#e11d48', '#be123c'] as const,
    gradientDark: ['#9f1239', '#881337', '#4c0519'] as const,
    primary: '#e11d48',
    accent: '#f43f5e',
    description: 'Amor - Rojo corazón',
    emoji: '❤️',
  },
  '2 John': {
    name: '2 John',
    gradient: ['#f43f5e', '#e11d48', '#be123c'] as const,
    gradientDark: ['#9f1239', '#881337', '#4c0519'] as const,
    primary: '#e11d48',
    accent: '#f43f5e',
    description: 'Verdad - Rojo amor verdadero',
    emoji: '💖',
  },
  '3 John': {
    name: '3 John',
    gradient: ['#f43f5e', '#e11d48', '#be123c'] as const,
    gradientDark: ['#9f1239', '#881337', '#4c0519'] as const,
    primary: '#e11d48',
    accent: '#f43f5e',
    description: 'Hospitalidad - Rojo comunión',
    emoji: '🏡',
  },
  Jude: {
    name: 'Jude',
    gradient: ['#f97316', '#ea580c', '#c2410c'] as const,
    gradientDark: ['#9a3412', '#7c2d12', '#431407'] as const,
    primary: '#ea580c',
    accent: '#f97316',
    description: 'Contender - Naranja batalla',
    emoji: '⚔️',
  },

  // Apocalipsis
  Revelation: {
    name: 'Revelation',
    gradient: ['#a855f7', '#9333ea', '#7e22ce'] as const,
    gradientDark: ['#6b21a8', '#581c87', '#3b0764'] as const,
    primary: '#9333ea',
    accent: '#a855f7',
    description: 'Apocalipsis - Púrpura gloria',
    emoji: '🌅',
  },
};

/**
 * Temas combinados AT + NT
 */
export const BOOK_THEMES: Record<string, BookTheme> = {
  ...OLD_TESTAMENT_THEMES,
  ...NEW_TESTAMENT_THEMES,
};

/**
 * Tema por defecto (Celestial)
 */
export const DEFAULT_THEME: BookTheme = {
  name: 'Default',
  gradient: ['#4A90E2', '#5B9FED', '#6EADFF'] as const,
  gradientDark: ['#1E3A5F', '#2C4B73', '#3A5C87'] as const,
  primary: '#4A90E2',
  accent: '#5B9FED',
  description: 'Celestial - Azul cielo',
  emoji: '✨',
};

/**
 * Obtener tema por nombre de libro
 */
export function getBookTheme(bookName: string): BookTheme {
  return BOOK_THEMES[bookName] || DEFAULT_THEME;
}

/**
 * Verificar si un libro tiene tema personalizado
 */
export function hasCustomTheme(bookName: string): boolean {
  return bookName in BOOK_THEMES;
}
