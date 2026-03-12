import aiosqlite
import os

DB_PATH = os.environ.get("DB_PATH", "kinklink.db")


async def get_db() -> aiosqlite.Connection:
    db = await aiosqlite.connect(DB_PATH)
    db.row_factory = aiosqlite.Row
    try:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")
        yield db
    finally:
        await db.close()


async def init_db():
    async with aiosqlite.connect(DB_PATH) as db:
        await db.execute("PRAGMA journal_mode=WAL")
        await db.execute("PRAGMA foreign_keys=ON")

        await db.executescript("""
            CREATE TABLE IF NOT EXISTS users (
                id           INTEGER PRIMARY KEY AUTOINCREMENT,
                username     TEXT    NOT NULL UNIQUE COLLATE NOCASE,
                password_hash TEXT   NOT NULL,
                display_name TEXT    NOT NULL,
                avatar_color TEXT    NOT NULL DEFAULT '#C4754B',
                couple_id    INTEGER REFERENCES couples(id),
                pairing_code TEXT    UNIQUE,
                pairing_code_expires_at TEXT,
                created_at   TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS couples (
                id        INTEGER PRIMARY KEY AUTOINCREMENT,
                user_a_id INTEGER NOT NULL REFERENCES users(id),
                user_b_id INTEGER NOT NULL REFERENCES users(id),
                paired_at TEXT    NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS catalog_items (
                id          INTEGER PRIMARY KEY AUTOINCREMENT,
                title       TEXT NOT NULL,
                category    TEXT NOT NULL,
                description TEXT NOT NULL DEFAULT '',
                emoji       TEXT NOT NULL DEFAULT '',
                tier        TEXT NOT NULL DEFAULT 'standard',
                created_at  TEXT NOT NULL DEFAULT (datetime('now'))
            );

            CREATE TABLE IF NOT EXISTS user_responses (
                user_id      INTEGER NOT NULL REFERENCES users(id),
                item_id      INTEGER NOT NULL REFERENCES catalog_items(id),
                response     TEXT    NOT NULL CHECK(response IN ('yes','no','maybe')),
                responded_at TEXT    NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (user_id, item_id)
            );

            CREATE TABLE IF NOT EXISTS match_seen (
                user_id  INTEGER NOT NULL REFERENCES users(id),
                item_id  INTEGER NOT NULL REFERENCES catalog_items(id),
                seen_at  TEXT    NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY (user_id, item_id)
            );

            CREATE TABLE IF NOT EXISTS user_mood (
                id         INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id    INTEGER NOT NULL UNIQUE REFERENCES users(id),
                mood       TEXT    NOT NULL,
                expires_at TEXT    NOT NULL,
                updated_at TEXT    NOT NULL DEFAULT (datetime('now'))
            );
        """)
        await db.commit()
