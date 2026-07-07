/** DDL compartido entre el worker (sqlite-wasm) y los tests (node:sqlite). */
export const SCHEMA = `
CREATE TABLE IF NOT EXISTS sources (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  type TEXT NOT NULL DEFAULT 'rss',
  url TEXT NOT NULL UNIQUE,
  title TEXT,
  category_hint TEXT,
  active INTEGER NOT NULL DEFAULT 1,
  last_fetched TEXT
);

CREATE TABLE IF NOT EXISTS cards (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  source_id INTEGER REFERENCES sources(id),
  content_hash TEXT NOT NULL UNIQUE,
  original_url TEXT,
  title TEXT NOT NULL,
  summary TEXT NOT NULL,
  category TEXT NOT NULL,
  source_type TEXT NOT NULL,
  citation TEXT,
  citation_source TEXT,
  protected INTEGER NOT NULL DEFAULT 0,
  est_read_min INTEGER NOT NULL DEFAULT 2,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS interactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  card_id INTEGER NOT NULL REFERENCES cards(id),
  type TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_interactions_card ON interactions(card_id);
CREATE INDEX IF NOT EXISTS idx_cards_created ON cards(created_at);
`
