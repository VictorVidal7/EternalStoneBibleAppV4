export const CREATE_TABLES = `
-- Main verses table
CREATE TABLE IF NOT EXISTS verses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  book_id INTEGER NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  version TEXT NOT NULL DEFAULT 'RVR1960',
  UNIQUE(book_id, chapter, verse, version)
);

-- FTS5 virtual table for fast full-text search
CREATE VIRTUAL TABLE IF NOT EXISTS verses_fts USING fts5(
  book_name,
  chapter,
  verse,
  text,
  content='verses',
  content_rowid='id'
);

-- Triggers to keep FTS table in sync
CREATE TRIGGER IF NOT EXISTS verses_ai AFTER INSERT ON verses BEGIN
  INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
  VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
END;

CREATE TRIGGER IF NOT EXISTS verses_ad AFTER DELETE ON verses BEGIN
  INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
  VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
END;

CREATE TRIGGER IF NOT EXISTS verses_au AFTER UPDATE ON verses BEGIN
  INSERT INTO verses_fts(verses_fts, rowid, book_name, chapter, verse, text)
  VALUES('delete', old.id, old.book_name, old.chapter, old.verse, old.text);
  INSERT INTO verses_fts(rowid, book_name, chapter, verse, text)
  VALUES (new.id, new.book_name, new.chapter, new.verse, new.text);
END;

-- Notes table
CREATE TABLE IF NOT EXISTS notes (
  id TEXT PRIMARY KEY,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  verse_text TEXT NOT NULL,
  note TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

-- Reading progress table
CREATE TABLE IF NOT EXISTS reading_progress (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  timestamp TEXT NOT NULL
);

-- Favorites table
CREATE TABLE IF NOT EXISTS favorites (
  id TEXT PRIMARY KEY,
  verse_id TEXT NOT NULL,
  book_name TEXT NOT NULL,
  chapter INTEGER NOT NULL,
  verse INTEGER NOT NULL,
  text TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'other',
  rating INTEGER NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  tags TEXT,
  note TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

-- Review events table (Sprint 45) — append-only SRS review log.
-- One immutable row per review; powers the insights heatmap + retention.
CREATE TABLE IF NOT EXISTS review_events (
  id TEXT PRIMARY KEY,
  verse_key TEXT NOT NULL,
  book_name TEXT NOT NULL,
  grade TEXT NOT NULL,
  box_before INTEGER NOT NULL,
  box_after INTEGER NOT NULL,
  interval_days INTEGER,
  reviewed_at INTEGER NOT NULL
);

-- Indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_verses_book_chapter ON verses(book_id, chapter);
CREATE INDEX IF NOT EXISTS idx_verses_version ON verses(version);
CREATE INDEX IF NOT EXISTS idx_notes_reference ON notes(book_name, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_favorites_reference ON favorites(book_name, chapter, verse);
CREATE INDEX IF NOT EXISTS idx_favorites_category ON favorites(category);
CREATE INDEX IF NOT EXISTS idx_favorites_rating ON favorites(rating);
CREATE INDEX IF NOT EXISTS idx_review_events_reviewed_at ON review_events(reviewed_at);
CREATE INDEX IF NOT EXISTS idx_review_events_verse_key ON review_events(verse_key);
`;

export const INITIAL_READING_PROGRESS = `
INSERT OR REPLACE INTO reading_progress (id, book_name, chapter, verse, timestamp)
VALUES (1, 'Juan', 3, 16, datetime('now'));
`;
