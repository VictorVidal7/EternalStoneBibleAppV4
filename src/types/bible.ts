export interface BibleVerse {
  id: number;
  book: string;
  bookNumber: number;
  chapter: number;
  verse: number;
  text: string;
  version: string;
}

export interface BibleBook {
  id: number;
  name: string;
  testament: 'old' | 'new';
  chapters: number;
  abbr: string;
}

export interface BibleChapter {
  book: string;
  chapter: number;
  verses: BibleVerse[];
}

export interface Bookmark {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  createdAt: string;
}

export interface Note {
  id: string;
  book: string;
  chapter: number;
  verse: number;
  text: string;
  note: string;
  createdAt: string;
  updatedAt: string;
}

export interface ReadingProgress {
  book: string;
  chapter: number;
  verse: number;
  timestamp: string;
}

export interface BibleVersion {
  id: string;
  name: string;
  abbreviation: string;
  language: string;
  year?: string;
}
