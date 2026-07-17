/**
 * Sistema de Resaltado de Versículos
 * Permite a los usuarios resaltar versículos con diferentes colores y categorías
 */

export interface Highlight {
  id: string;
  verseId: string; // formato: "book:chapter:verse" ej: "Genesis:1:1"
  bookId: string;
  chapter: number;
  verse: number;
  color: HighlightColor;
  category?: HighlightCategory;
  note?: string;
  createdAt: number;
  updatedAt: number;
}

export enum HighlightColor {
  YELLOW = '#FFF59D',
  GREEN = '#A5D6A7',
  BLUE = '#90CAF9',
  PURPLE = '#CE93D8',
  PINK = '#F48FB1',
  ORANGE = '#FFCC80',
  RED = '#EF9A9A',
  GRAY = '#E0E0E0',
}

export enum HighlightCategory {
  PROMISE = 'promise',
  PRAYER = 'prayer',
  COMMANDMENT = 'commandment',
  WISDOM = 'wisdom',
  PROPHECY = 'prophecy',
  FAVORITE = 'favorite',
  MEMORIZE = 'memorize',
  STUDY = 'study',
}

export const HIGHLIGHT_COLOR_NAMES: Record<HighlightColor, string> = {
  [HighlightColor.YELLOW]: 'Amarillo',
  [HighlightColor.GREEN]: 'Verde',
  [HighlightColor.BLUE]: 'Azul',
  [HighlightColor.PURPLE]: 'Morado',
  [HighlightColor.PINK]: 'Rosa',
  [HighlightColor.ORANGE]: 'Naranja',
  [HighlightColor.RED]: 'Rojo',
  [HighlightColor.GRAY]: 'Gris',
};

export const HIGHLIGHT_CATEGORY_NAMES: Record<HighlightCategory, string> = {
  [HighlightCategory.PROMISE]: 'Promesa',
  [HighlightCategory.PRAYER]: 'Oración',
  [HighlightCategory.COMMANDMENT]: 'Mandamiento',
  [HighlightCategory.WISDOM]: 'Sabiduría',
  [HighlightCategory.PROPHECY]: 'Profecía',
  [HighlightCategory.FAVORITE]: 'Favorito',
  [HighlightCategory.MEMORIZE]: 'Memorizar',
  [HighlightCategory.STUDY]: 'Estudio',
};

export const HIGHLIGHT_CATEGORY_ICONS: Record<HighlightCategory, string> = {
  [HighlightCategory.PROMISE]: '🤝',
  [HighlightCategory.PRAYER]: '🙏',
  [HighlightCategory.COMMANDMENT]: '📜',
  [HighlightCategory.WISDOM]: '💡',
  [HighlightCategory.PROPHECY]: '🔮',
  [HighlightCategory.FAVORITE]: '💙',
  [HighlightCategory.MEMORIZE]: '🧠',
  [HighlightCategory.STUDY]: '📖',
};
