'use strict';

const Database = require('better-sqlite3');
const path     = require('path');

const DATA_DIR = process.env.DATA_DIR || __dirname;
const DB_PATH  = path.join(DATA_DIR, 'bookings.db');

let db;

function getDb() {
  if (!db) {
    db = new Database(DB_PATH);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');
    initSchema();
  }
  return db;
}

function initSchema() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS bookings (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      service         TEXT    NOT NULL,
      price           REAL    NOT NULL,
      duration        INTEGER NOT NULL,
      date            TEXT    NOT NULL,
      time            TEXT    NOT NULL,
      first_name      TEXT    NOT NULL,
      last_name       TEXT    NOT NULL,
      email           TEXT    NOT NULL,
      phone           TEXT    NOT NULL,
      note            TEXT    DEFAULT '',
      google_event_id TEXT    DEFAULT NULL,
      created_at      TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS availability (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      day_of_week  INTEGER NOT NULL UNIQUE,
      is_available INTEGER NOT NULL DEFAULT 1,
      start_time   TEXT    NOT NULL DEFAULT '09:00',
      end_time     TEXT    NOT NULL DEFAULT '19:00'
    );

    CREATE TABLE IF NOT EXISTS blocked_dates (
      id     INTEGER PRIMARY KEY AUTOINCREMENT,
      date   TEXT    NOT NULL UNIQUE,
      reason TEXT    DEFAULT ''
    );

  `);

  // Seed availability Mon–Sat open, Sunday closed
  const seed = db.prepare(`
    INSERT OR IGNORE INTO availability (day_of_week, is_available, start_time, end_time)
    VALUES (?, ?, '09:00', '19:00')
  `);
  const seedAll = db.transaction(() => {
    seed.run(0, 0); // Sunday  — closed
    seed.run(1, 1); // Monday
    seed.run(2, 1); // Tuesday
    seed.run(3, 1); // Wednesday
    seed.run(4, 1); // Thursday
    seed.run(5, 1); // Friday
    seed.run(6, 1); // Saturday
  });
  seedAll();
}

module.exports = { getDb };
