# Backend Node.js + JWT Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the Python/FastAPI backend with an Express/TypeScript backend using JWT access+refresh token auth, and update the mobile client to match.

**Architecture:** New `backend/` directory with Express + TypeScript + better-sqlite3. Same SQLite database file, same API contracts, same endpoint paths. Mobile `client.js` swaps cookie handling for Bearer token + refresh mutex. `AuthContext.jsx` updated to store/clear both tokens.

**Tech Stack:** Node.js LTS, Express 4, TypeScript 5, better-sqlite3, jsonwebtoken, bcrypt, zod, express-rate-limit, cors, uuid

---

## File Map

**New files (backend):**
- `backend/package.json` — project config and scripts
- `backend/tsconfig.json` — TypeScript config
- `backend/.env.example` — environment variable template
- `backend/src/db/schema.ts` — `initDb()`: creates all tables including `refresh_tokens`
- `backend/src/db/seed.ts` — `seedCatalog()`: inserts catalog items if table is empty
- `backend/src/middleware/auth.ts` — `requireAuth`: validates Bearer token, attaches `req.userId`
- `backend/src/middleware/rateLimit.ts` — per-route rate limiters
- `backend/src/models/schemas.ts` — Zod schemas for all request bodies
- `backend/src/routers/auth.ts` — register, login, refresh, logout, me
- `backend/src/routers/catalog.ts` — GET /catalog, GET /catalog/responses, POST /catalog/respond
- `backend/src/routers/matches.ts` — GET /matches, POST /:id/seen, DELETE /:id
- `backend/src/routers/mood.ts` — GET /mood, PUT /mood, DELETE /mood
- `backend/src/routers/pairing.ts` — POST /pairing/create, POST /pairing/join, GET /pairing/status
- `backend/src/app.ts` — Express app factory (middleware stack, routers)
- `backend/src/index.ts` — entry point: init DB, seed, start server

**Modified files (mobile):**
- `mobile/src/api/client.js` — full rewrite: Bearer tokens, refresh mutex
- `mobile/src/context/AuthContext.jsx` — update login/register/logout for `{ user, accessToken, refreshToken }` response shape

---

## Chunk 1: Project Setup + Database

### Task 1: Scaffold the Node.js project

**Files:**
- Create: `backend/package.json`
- Create: `backend/tsconfig.json`
- Create: `backend/.env.example`

- [ ] **Step 1: Create directory structure**

```bash
mkdir -p backend/src/db backend/src/middleware backend/src/routers backend/src/models backend/src/types
```

- [ ] **Step 2: Create `backend/package.json`**

```json
{
  "name": "kinklink-api",
  "version": "1.0.0",
  "private": true,
  "scripts": {
    "dev": "ts-node-dev --respawn src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js"
  },
  "dependencies": {
    "bcrypt": "^5.1.1",
    "better-sqlite3": "^9.4.3",
    "cors": "^2.8.5",
    "dotenv": "^16.4.5",
    "express": "^4.19.2",
    "express-rate-limit": "^7.3.1",
    "jsonwebtoken": "^9.0.2",
    "uuid": "^9.0.1",
    "zod": "^3.23.8"
  },
  "devDependencies": {
    "@types/bcrypt": "^5.0.2",
    "@types/better-sqlite3": "^7.6.10",
    "@types/cors": "^2.8.17",
    "@types/express": "^4.17.21",
    "@types/jsonwebtoken": "^9.0.6",
    "@types/node": "^20.0.0",
    "@types/uuid": "^9.0.8",
    "ts-node-dev": "^2.0.0",
    "typescript": "^5.4.5"
  }
}
```

- [ ] **Step 3: Create `backend/tsconfig.json`**

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "dist",
    "rootDir": "src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true
  },
  "include": ["src"],
  "exclude": ["node_modules", "dist"]
}
```

- [ ] **Step 4: Create `backend/.env.example`**

```
PORT=8000
DB_PATH=./kinklink.db
ACCESS_TOKEN_SECRET=change_me_32_plus_bytes_hex
REFRESH_TOKEN_SECRET=change_me_32_plus_bytes_hex_different
NODE_ENV=production
```

- [ ] **Step 5: Create a real `.env` from the example**

```bash
cd backend
cp .env.example .env
# Edit .env and set real secrets:
# ACCESS_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
# REFRESH_TOKEN_SECRET=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
```

- [ ] **Step 6: Install dependencies**

```bash
cd backend
npm install
```

Expected: `node_modules/` created, no errors.

- [ ] **Step 7: Create `backend/.gitignore`**

```
node_modules/
dist/
.env
```

- [ ] **Step 8: Commit**

```bash
git add backend/package.json backend/package-lock.json backend/tsconfig.json backend/.env.example backend/.gitignore
git commit -m "feat: scaffold Node.js Express backend project"
```

---

### Task 2: Database schema

**Files:**
- Create: `backend/src/db/schema.ts`

- [ ] **Step 1: Create `backend/src/db/schema.ts`**

```typescript
import Database from 'better-sqlite3';
import path from 'path';

let _db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (!_db) {
    // Read DB_PATH here (not at module load time) so dotenv has already run
    const dbPath = process.env.DB_PATH ?? './kinklink.db';
    _db = new Database(path.resolve(dbPath));
    _db.pragma('journal_mode = WAL');
    _db.pragma('foreign_keys = ON');
  }
  return _db;
}

export function initDb(): void {
  const db = getDb();

  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id                       INTEGER PRIMARY KEY AUTOINCREMENT,
      username                 TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password_hash            TEXT    NOT NULL,
      display_name             TEXT    NOT NULL,
      avatar_color             TEXT    NOT NULL DEFAULT '#C4754B',
      couple_id                INTEGER REFERENCES couples(id),
      pairing_code             TEXT    UNIQUE,
      pairing_code_expires_at  TEXT,
      created_at               TEXT    NOT NULL DEFAULT (datetime('now'))
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

    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id         TEXT    PRIMARY KEY,
      user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
      expires_at TEXT    NOT NULL,
      created_at TEXT    NOT NULL DEFAULT (datetime('now'))
    );

    CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
  `);
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd backend
npx tsc --noEmit
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add backend/src/db/schema.ts
git commit -m "feat: add SQLite schema with refresh_tokens table"
```

---

### Task 3: Catalog seed data

**Files:**
- Create: `backend/src/db/seed.ts`

- [ ] **Step 1: Verify source seed data exists**

```bash
ls ../backend/seed.py 2>/dev/null || ls backend/seed.py 2>/dev/null || echo "MISSING: locate seed.py before proceeding"
```

The Python file `backend/seed.py` is the source of truth for all catalog items. If it is not present, locate it in the repository before writing seed.ts. Do not fabricate or omit items.

- [ ] **Step 2: Create `backend/src/db/seed.ts`**

Port all items from `backend/seed.py`'s `CATALOG` list. Format: `[title, category, description, emoji, tier]`.

```typescript
import { getDb } from './schema';

const CATALOG: [string, string, string, string, string][] = [
  // Foreplay
  ['Slow Massage', 'foreplay', 'Full body, no rush. Let the tension build on its own.', '🫶', 'standard'],
  ['Ice & Warmth', 'foreplay', 'Alternate between ice cubes and warm breath. Trace slow lines.', '🧊', 'quick'],
  ['Blindfolded Touch', 'foreplay', "One of you can't see. Every sensation becomes a surprise.", '🙈', 'standard'],
  ['Strip Tease', 'foreplay', 'Low lights, good music. Make a show of it.', '🎵', 'standard'],
  ['Oral Focus', 'foreplay', 'One person receives, no reciprocation expected. Just giving.', '💋', 'standard'],
  ['Dirty Talk', 'foreplay', 'Say what you want before you do it. Be explicit.', '🗣️', 'quick'],
  ['Body Worship', 'foreplay', 'Kiss every inch. Tell them what you love about each part.', '✨', 'standard'],
  ['Mutual Masturbation', 'foreplay', 'Watch each other. Show them exactly what you like.', '👀', 'standard'],
  ['Neck & Ears', 'foreplay', 'Just focus there. Breathing, kissing, whispering. Nothing else.', '🌬️', 'quick'],
  ['Teasing Only', 'foreplay', "Get close but don't finish. See how long you can both last.", '😈', 'standard'],
  ['Shower Together', 'foreplay', 'Soap each other up slowly. Let the hot water do its thing.', '🚿', 'quick'],
  ['Feather Touch', 'foreplay', "Barely-there fingertips across skin. Goosebumps guaranteed.", '🪶', 'quick'],
  ['Scalp Massage', 'foreplay', 'Slow, firm fingers through the hair. Melts tension immediately.', '🤲', 'quick'],
  ['Kissing Only', 'foreplay', 'Nothing else. Just mouths, for as long as you can stand it.', '😘', 'quick'],
  ['Biting & Marking', 'foreplay', 'Necks, shoulders, inner thighs. Leave something to remember.', '🐺', 'standard'],
  ['Inner Thigh Focus', 'foreplay', 'Get close but stay there. Tease until they beg you to move.', '🌡️', 'standard'],
  ['Hand Play', 'foreplay', 'Slow, deliberate. Pay attention to their reactions and adjust.', '🤍', 'standard'],
  ['Breathwork Together', 'foreplay', 'Sync your breathing. Press foreheads together. No rushing.', '🌬️', 'quick'],
  // Copy the remaining items from backend/seed.py CATALOG list exactly as they appear there.
  // Open backend/seed.py and transfer every tuple: (title, category, description, emoji, tier)
  // DO NOT skip any items — the mobile app's progress tracking depends on item count being consistent.
];

export function seedCatalog(): void {
  const db = getDb();

  // Use INSERT OR IGNORE keyed on title so this is safe to run against an existing
  // database that already has catalog rows (the live Python-seeded DB).
  // A row-count guard would silently skip on upgrade — this approach is idempotent.
  const insert = db.prepare(
    `INSERT OR IGNORE INTO catalog_items (title, category, description, emoji, tier)
     VALUES (?, ?, ?, ?, ?)`
  );
  const insertMany = db.transaction((items: typeof CATALOG) => {
    for (const item of items) insert.run(...item);
  });
  insertMany(CATALOG);

  const count = (db.prepare('SELECT COUNT(*) as n FROM catalog_items').get() as { n: number }).n;
  console.log(`catalog_items: ${count} rows total (seeded ${CATALOG.length} items, duplicates ignored)`);
}
```

**Important:** After writing the file, open `backend/seed.py` and copy every remaining item from the `CATALOG` list into the TypeScript array. The seed data is the source of truth — every item must match exactly (same title, category, description, emoji, tier).

- [ ] **Step 3: Verify TypeScript compiles**

```bash
cd backend
npx tsc --noEmit
```

- [ ] **Step 4: Commit**

```bash
git add backend/src/db/seed.ts
git commit -m "feat: add catalog seed data"
```

---

## Chunk 2: Auth Layer

### Task 4: Zod schemas

**Files:**
- Create: `backend/src/models/schemas.ts`

- [ ] **Step 1: Create `backend/src/models/schemas.ts`**

```typescript
import { z } from 'zod';

export const RegisterSchema = z.object({
  username: z
    .string()
    .trim()
    .min(2, 'Username must be 2–32 characters')
    .max(32, 'Username must be 2–32 characters')
    .regex(/^[a-zA-Z0-9_.-]+$/, 'Username may only contain letters, numbers, _ . -'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  display_name: z.string().trim().min(1, 'Display name is required').transform(v => v.slice(0, 40)),
});

export const LoginSchema = z.object({
  username: z.string().trim(),
  password: z.string(),
});

export const RefreshSchema = z.object({
  refreshToken: z.string().min(1),
});

export const LogoutSchema = z.object({
  refreshToken: z.string().min(1),
});

export const RespondSchema = z.object({
  item_id: z.number().int().positive(),
  response: z.enum(['yes', 'no', 'maybe']),
});

export const MoodSchema = z.object({
  mood: z.enum(['passionate', 'tender', 'playful', 'dominant', 'submissive', 'curious', 'lazy', 'wild']),
  expires_hours: z.number().int().min(1).max(48).default(8),
});

export const JoinSchema = z.object({
  code: z.string().trim().toUpperCase(),
});

// Helper: format Zod errors to match Python backend's { detail: "..." } shape
export function zodError(err: z.ZodError): string {
  return err.errors.map(e => `${e.path.join('.')}: ${e.message}`).join(', ');
}
```

- [ ] **Step 2: Compile check**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/models/schemas.ts
git commit -m "feat: add Zod validation schemas"
```

---

### Task 5: Auth middleware and rate limiters

**Files:**
- Create: `backend/src/middleware/auth.ts`
- Create: `backend/src/middleware/rateLimit.ts`

- [ ] **Step 1: Extend Express `Request` type to include `userId`**

Create `backend/src/types/express.d.ts`:

```typescript
declare namespace Express {
  interface Request {
    userId?: number;
  }
}
```

- [ ] **Step 2: Create `backend/src/middleware/auth.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET ?? '';

export function requireAuth(req: Request, res: Response, next: NextFunction): void {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    res.status(401).json({ detail: 'Not authenticated' });
    return;
  }

  const token = header.slice(7);
  try {
    const payload = jwt.verify(token, ACCESS_SECRET) as { userId: number };
    req.userId = payload.userId;
    next();
  } catch {
    res.status(401).json({ detail: 'Not authenticated' });
  }
}
```

- [ ] **Step 3: Create `backend/src/middleware/rateLimit.ts`**

```typescript
import rateLimit from 'express-rate-limit';

export const registerLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  message: { detail: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const loginLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { detail: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});

export const joinLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { detail: 'Too many requests, please try again later.' },
  standardHeaders: true,
  legacyHeaders: false,
});
```

- [ ] **Step 4: Compile check**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 5: Commit**

```bash
git add backend/src/middleware/ backend/src/types/
git commit -m "feat: add requireAuth middleware and rate limiters"
```

---

### Task 6: Auth router

**Files:**
- Create: `backend/src/routers/auth.ts`

- [ ] **Step 1: Create `backend/src/routers/auth.ts`**

```typescript
import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { getDb } from '../db/schema';
import { RegisterSchema, LoginSchema, RefreshSchema, LogoutSchema, zodError } from '../models/schemas';
import { requireAuth } from '../middleware/auth';
import { registerLimiter, loginLimiter } from '../middleware/rateLimit';

export const authRouter = Router();

const ACCESS_SECRET = process.env.ACCESS_TOKEN_SECRET ?? '';
const REFRESH_SECRET = process.env.REFRESH_TOKEN_SECRET ?? '';
const AVATAR_COLORS = [
  '#C4754B', '#7B9E6F', '#D4B878', '#8E7BB5',
  '#5B9BB5', '#C47474', '#74A899', '#B5875B',
];

function hashIndex(str: string): number {
  let h = 0;
  for (const c of str) h = (Math.imul(31, h) + c.charCodeAt(0)) | 0;
  return Math.abs(h);
}

function makeTokens(userId: number): { accessToken: string; refreshToken: string; tokenId: string; expiresAt: string } {
  const tokenId = uuidv4();
  const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString();
  const accessToken = jwt.sign({ userId }, ACCESS_SECRET, { expiresIn: '15m' });
  const refreshToken = jwt.sign({ userId, tokenId }, REFRESH_SECRET, { expiresIn: '30d' });
  return { accessToken, refreshToken, tokenId, expiresAt };
}

function getUserOut(userId: number) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return null;

  let partnerName: string | null = null;
  if (user.couple_id) {
    const couple = db.prepare('SELECT user_a_id, user_b_id FROM couples WHERE id = ?').get(user.couple_id) as any;
    if (couple) {
      const partnerId = couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
      const partner = db.prepare('SELECT display_name FROM users WHERE id = ?').get(partnerId) as any;
      if (partner) partnerName = partner.display_name;
    }
  }

  return {
    id: user.id,
    username: user.username,
    display_name: user.display_name,
    avatar_color: user.avatar_color,
    couple_id: user.couple_id ?? null,
    partner_name: partnerName,
  };
}

authRouter.post('/register', registerLimiter, (req: Request, res: Response): void => {
  const parsed = RegisterSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ detail: zodError(parsed.error) }); return; }

  const { username, password, display_name } = parsed.data;
  const db = getDb();

  const existing = db.prepare('SELECT id FROM users WHERE username = ?').get(username);
  if (existing) { res.status(400).json({ detail: 'Username already taken' }); return; }

  const color = AVATAR_COLORS[hashIndex(username) % AVATAR_COLORS.length];
  const passwordHash = bcrypt.hashSync(password, 12);

  const result = db.prepare(
    'INSERT INTO users (username, password_hash, display_name, avatar_color) VALUES (?,?,?,?)'
  ).run(username, passwordHash, display_name, color);

  const userId = result.lastInsertRowid as number;
  const { accessToken, refreshToken, tokenId, expiresAt } = makeTokens(userId);
  db.prepare('INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES (?,?,?)').run(tokenId, userId, expiresAt);

  res.status(201).json({ user: getUserOut(userId), accessToken, refreshToken });
});

authRouter.post('/login', loginLimiter, (req: Request, res: Response): void => {
  const parsed = LoginSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ detail: zodError(parsed.error) }); return; }

  const { username, password } = parsed.data;
  const db = getDb();

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(username) as any;
  if (!user || !bcrypt.compareSync(password, user.password_hash)) {
    res.status(401).json({ detail: 'Invalid username or password' });
    return;
  }

  const { accessToken, refreshToken, tokenId, expiresAt } = makeTokens(user.id);
  db.prepare('INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES (?,?,?)').run(tokenId, user.id, expiresAt);

  res.json({ user: getUserOut(user.id), accessToken, refreshToken });
});

authRouter.post('/refresh', (req: Request, res: Response): void => {
  const parsed = RefreshSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ detail: zodError(parsed.error) }); return; }

  const { refreshToken } = parsed.data;
  let payload: { userId: number; tokenId: string };
  try {
    payload = jwt.verify(refreshToken, REFRESH_SECRET) as any;
  } catch {
    res.status(401).json({ detail: 'Invalid or expired refresh token' });
    return;
  }

  const db = getDb();
  const stored = db.prepare(
    "SELECT * FROM refresh_tokens WHERE id = ? AND expires_at > datetime('now')"
  ).get(payload.tokenId) as any;

  if (!stored) {
    res.status(401).json({ detail: 'Refresh token revoked or expired' });
    return;
  }

  // Rotate: delete old, issue new
  db.prepare('DELETE FROM refresh_tokens WHERE id = ?').run(payload.tokenId);
  const { accessToken: newAccess, refreshToken: newRefresh, tokenId: newId, expiresAt } = makeTokens(payload.userId);
  db.prepare('INSERT INTO refresh_tokens (id, user_id, expires_at) VALUES (?,?,?)').run(newId, payload.userId, expiresAt);

  res.json({ accessToken: newAccess, refreshToken: newRefresh });
});

authRouter.post('/logout', (req: Request, res: Response): void => {
  const parsed = LogoutSchema.safeParse(req.body);
  if (!parsed.success) { res.status(204).end(); return; } // best-effort: if no token, still 204

  const { refreshToken } = parsed.data;
  try {
    const payload = jwt.verify(refreshToken, REFRESH_SECRET) as { tokenId: string };
    getDb().prepare('DELETE FROM refresh_tokens WHERE id = ?').run(payload.tokenId);
  } catch {
    // Token invalid — nothing to delete, still succeed
  }
  res.status(204).end();
});

authRouter.get('/me', requireAuth, (req: Request, res: Response): void => {
  const user = getUserOut(req.userId!);
  if (!user) { res.status(404).json({ detail: 'User not found' }); return; }
  res.json(user);
});
```

- [ ] **Step 2: Compile check**

```bash
cd backend && npx tsc --noEmit
```

- [ ] **Step 3: Commit**

```bash
git add backend/src/routers/auth.ts
git commit -m "feat: add auth router (register, login, refresh, logout, me)"
```

---

## Chunk 3: Remaining Routers + App Entry

### Task 7: Catalog router

**Files:**
- Create: `backend/src/routers/catalog.ts`

- [ ] **Step 1: Create `backend/src/routers/catalog.ts`**

> **Decision note:** The Python backend left `GET /catalog` unauthenticated. This Node rewrite intentionally gates all catalog routes behind `requireAuth` — the mobile app always has a valid session before browsing, and this keeps the API surface consistent. This is a deliberate tightening, not an oversight.

```typescript
import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';
import { RespondSchema, zodError } from '../models/schemas';
import { requireAuth } from '../middleware/auth';

export const catalogRouter = Router();

catalogRouter.use(requireAuth);

catalogRouter.get('/', (req: Request, res: Response): void => {
  const db = getDb();
  const items = db.prepare(
    'SELECT id, title, category, description, emoji, tier FROM catalog_items ORDER BY id'
  ).all();
  res.json(items);
});

catalogRouter.get('/responses', (req: Request, res: Response): void => {
  const db = getDb();
  const rows = db.prepare(
    'SELECT item_id, response FROM user_responses WHERE user_id = ?'
  ).all(req.userId!) as { item_id: number; response: string }[];

  const result: Record<string, string> = {};
  for (const r of rows) result[String(r.item_id)] = r.response;
  res.json(result);
});

catalogRouter.post('/respond', (req: Request, res: Response): void => {
  const parsed = RespondSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ detail: zodError(parsed.error) }); return; }

  const { item_id, response } = parsed.data;
  const db = getDb();

  const item = db.prepare('SELECT id FROM catalog_items WHERE id = ?').get(item_id);
  if (!item) { res.status(404).json({ detail: 'Item not found' }); return; }

  db.prepare(`
    INSERT INTO user_responses (user_id, item_id, response)
    VALUES (?,?,?)
    ON CONFLICT(user_id, item_id) DO UPDATE SET response=excluded.response, responded_at=datetime('now')
  `).run(req.userId!, item_id, response);

  res.status(204).end();
});
```

- [ ] **Step 2: Compile check + commit**

```bash
cd backend && npx tsc --noEmit
git add backend/src/routers/catalog.ts
git commit -m "feat: add catalog router"
```

---

### Task 8: Matches router

**Files:**
- Create: `backend/src/routers/matches.ts`

- [ ] **Step 1: Create `backend/src/routers/matches.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';
import { requireAuth } from '../middleware/auth';

export const matchesRouter = Router();

matchesRouter.use(requireAuth);

function requireCouple(userId: number): number | null {
  const db = getDb();
  const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(userId) as any;
  return user?.couple_id ?? null;
}

function getPartnerId(userId: number, coupleId: number): number {
  const db = getDb();
  const couple = db.prepare('SELECT user_a_id, user_b_id FROM couples WHERE id = ?').get(coupleId) as any;
  return couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
}

matchesRouter.get('/', (req: Request, res: Response): void => {
  const coupleId = requireCouple(req.userId!);
  if (!coupleId) { res.status(403).json({ detail: 'Not paired' }); return; }

  const partnerId = getPartnerId(req.userId!, coupleId);
  const db = getDb();

  const rows = db.prepare(`
    SELECT
      ci.id, ci.title, ci.category, ci.description, ci.emoji, ci.tier,
      MAX(ur.responded_at) AS matched_at,
      CASE WHEN ms.item_id IS NOT NULL THEN 1 ELSE 0 END AS seen
    FROM user_responses ur
    JOIN catalog_items ci ON ci.id = ur.item_id
    LEFT JOIN match_seen ms ON ms.item_id = ci.id AND ms.user_id = ?
    WHERE ur.response = 'yes'
      AND ur.item_id IN (
          SELECT item_id FROM user_responses
          WHERE user_id = ? AND response = 'yes'
      )
      AND ur.user_id IN (?, ?)
    GROUP BY ci.id
    HAVING COUNT(DISTINCT ur.user_id) = 2
    ORDER BY matched_at DESC
  `).all(req.userId!, partnerId, req.userId!, partnerId) as any[];

  res.json(rows.map(r => ({ ...r, seen: Boolean(r.seen) })));
});

matchesRouter.post('/:itemId/seen', (req: Request, res: Response): void => {
  const coupleId = requireCouple(req.userId!);
  if (!coupleId) { res.status(403).json({ detail: 'Not paired' }); return; }

  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(itemId)) { res.status(400).json({ detail: 'Invalid item ID' }); return; }

  getDb().prepare(
    'INSERT OR IGNORE INTO match_seen (user_id, item_id) VALUES (?,?)'
  ).run(req.userId!, itemId);

  res.status(204).end();
});

matchesRouter.delete('/:itemId', (req: Request, res: Response): void => {
  const coupleId = requireCouple(req.userId!);
  if (!coupleId) { res.status(403).json({ detail: 'Not paired' }); return; }

  const itemId = parseInt(req.params.itemId, 10);
  if (isNaN(itemId)) { res.status(400).json({ detail: 'Invalid item ID' }); return; }

  const db = getDb();
  db.prepare(`
    INSERT INTO user_responses (user_id, item_id, response)
    VALUES (?,?,'no')
    ON CONFLICT(user_id, item_id) DO UPDATE SET response='no', responded_at=datetime('now')
  `).run(req.userId!, itemId);

  db.prepare('DELETE FROM match_seen WHERE user_id = ? AND item_id = ?').run(req.userId!, itemId);

  res.status(204).end();
});
```

- [ ] **Step 2: Compile check + commit**

```bash
cd backend && npx tsc --noEmit
git add backend/src/routers/matches.ts
git commit -m "feat: add matches router"
```

---

### Task 9: Mood router

**Files:**
- Create: `backend/src/routers/mood.ts`

- [ ] **Step 1: Create `backend/src/routers/mood.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { getDb } from '../db/schema';
import { MoodSchema, zodError } from '../models/schemas';
import { requireAuth } from '../middleware/auth';

export const moodRouter = Router();

moodRouter.use(requireAuth);

function requireCouple(userId: number): number | null {
  const user = getDb().prepare('SELECT couple_id FROM users WHERE id = ?').get(userId) as any;
  return user?.couple_id ?? null;
}

function getPartnerId(userId: number, coupleId: number): number {
  const couple = getDb().prepare('SELECT user_a_id, user_b_id FROM couples WHERE id = ?').get(coupleId) as any;
  return couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
}

function activeMood(row: any): string | null {
  if (!row) return null;
  return new Date(row.expires_at) > new Date() ? row.mood : null;
}

moodRouter.put('/', (req: Request, res: Response): void => {
  const parsed = MoodSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ detail: zodError(parsed.error) }); return; }

  const coupleId = requireCouple(req.userId!);
  if (!coupleId) { res.status(403).json({ detail: 'Not paired' }); return; }

  const partnerId = getPartnerId(req.userId!, coupleId);
  const { mood, expires_hours } = parsed.data;
  const expiresAt = new Date(Date.now() + expires_hours * 60 * 60 * 1000).toISOString();

  const db = getDb();
  db.prepare(`
    INSERT INTO user_mood (user_id, mood, expires_at)
    VALUES (?,?,?)
    ON CONFLICT(user_id) DO UPDATE SET mood=excluded.mood, expires_at=excluded.expires_at, updated_at=datetime('now')
  `).run(req.userId!, mood, expiresAt);

  const partnerRow = db.prepare('SELECT mood, expires_at FROM user_mood WHERE user_id = ?').get(partnerId) as any;
  const partnerMood = activeMood(partnerRow);

  res.json({ mine: mood, partner: partnerMood ?? null });
});

moodRouter.get('/', (req: Request, res: Response): void => {
  const coupleId = requireCouple(req.userId!);
  if (!coupleId) { res.status(403).json({ detail: 'Not paired' }); return; }

  const partnerId = getPartnerId(req.userId!, coupleId);
  const db = getDb();

  const myRow = db.prepare('SELECT mood, expires_at FROM user_mood WHERE user_id = ?').get(req.userId!) as any;
  const partnerRow = db.prepare('SELECT mood, expires_at FROM user_mood WHERE user_id = ?').get(partnerId) as any;

  const myMood = activeMood(myRow);
  const partnerMood = activeMood(partnerRow);

  res.json({ mine: myMood, partner: myMood && partnerMood ? partnerMood : null });
});

moodRouter.delete('/', (req: Request, res: Response): void => {
  getDb().prepare('DELETE FROM user_mood WHERE user_id = ?').run(req.userId!);
  res.status(204).end();
});
```

- [ ] **Step 2: Compile check + commit**

```bash
cd backend && npx tsc --noEmit
git add backend/src/routers/mood.ts
git commit -m "feat: add mood router"
```

---

### Task 10: Pairing router

**Files:**
- Create: `backend/src/routers/pairing.ts`

- [ ] **Step 1: Create `backend/src/routers/pairing.ts`**

```typescript
import { Router, Request, Response } from 'express';
import { randomBytes } from 'crypto';
import { getDb } from '../db/schema';
import { JoinSchema, zodError } from '../models/schemas';
import { requireAuth } from '../middleware/auth';
import { joinLimiter } from '../middleware/rateLimit';

export const pairingRouter = Router();

pairingRouter.use(requireAuth);

const CODE_CHARS = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no I, O, 0, 1

function genCode(length = 6): string {
  let code = '';
  while (code.length < length) {
    const byte = randomBytes(1)[0];
    if (byte < CODE_CHARS.length * Math.floor(256 / CODE_CHARS.length)) {
      code += CODE_CHARS[byte % CODE_CHARS.length];
    }
  }
  return code;
}

function getUserOut(userId: number) {
  const db = getDb();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as any;
  if (!user) return null;
  let partnerName: string | null = null;
  if (user.couple_id) {
    const couple = db.prepare('SELECT user_a_id, user_b_id FROM couples WHERE id = ?').get(user.couple_id) as any;
    if (couple) {
      const pid = couple.user_a_id === userId ? couple.user_b_id : couple.user_a_id;
      const p = db.prepare('SELECT display_name FROM users WHERE id = ?').get(pid) as any;
      if (p) partnerName = p.display_name;
    }
  }
  return { id: user.id, username: user.username, display_name: user.display_name, avatar_color: user.avatar_color, couple_id: user.couple_id ?? null, partner_name: partnerName };
}

pairingRouter.post('/create', (req: Request, res: Response): void => {
  const db = getDb();
  const user = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(req.userId!) as any;
  if (user?.couple_id) { res.status(400).json({ detail: 'Already paired' }); return; }

  let code = '';
  for (let i = 0; i < 10; i++) {
    const candidate = genCode();
    if (!db.prepare('SELECT id FROM users WHERE pairing_code = ?').get(candidate)) {
      code = candidate;
      break;
    }
  }
  if (!code) { res.status(500).json({ detail: 'Could not generate unique code' }); return; }

  const expiresAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
  db.prepare('UPDATE users SET pairing_code = ?, pairing_code_expires_at = ? WHERE id = ?').run(code, expiresAt, req.userId!);

  res.json({ code });
});

pairingRouter.post('/join', joinLimiter, (req: Request, res: Response): void => {
  const parsed = JoinSchema.safeParse(req.body);
  if (!parsed.success) { res.status(400).json({ detail: zodError(parsed.error) }); return; }

  const db = getDb();
  const me = db.prepare('SELECT couple_id FROM users WHERE id = ?').get(req.userId!) as any;
  if (me?.couple_id) { res.status(400).json({ detail: 'Already paired' }); return; }

  const code = parsed.data.code;
  const other = db.prepare('SELECT * FROM users WHERE pairing_code = ?').get(code) as any;
  if (!other) { res.status(404).json({ detail: 'Code not found' }); return; }
  if (other.id === req.userId!) { res.status(400).json({ detail: 'Cannot pair with yourself' }); return; }
  if (other.couple_id) { res.status(400).json({ detail: 'This code has already been used' }); return; }

  if (other.pairing_code_expires_at) {
    if (new Date(other.pairing_code_expires_at) < new Date()) {
      res.status(410).json({ detail: 'Pairing code has expired' });
      return;
    }
  }

  const result = db.prepare('INSERT INTO couples (user_a_id, user_b_id) VALUES (?,?)').run(other.id, req.userId!);
  const coupleId = result.lastInsertRowid;

  db.prepare(
    'UPDATE users SET couple_id = ?, pairing_code = NULL, pairing_code_expires_at = NULL WHERE id IN (?,?)'
  ).run(coupleId, other.id, req.userId!);

  res.json(getUserOut(req.userId!));
});

pairingRouter.get('/status', (req: Request, res: Response): void => {
  const user = getDb().prepare('SELECT couple_id, pairing_code FROM users WHERE id = ?').get(req.userId!) as any;
  res.json({ paired: Boolean(user?.couple_id), pairing_code: user?.pairing_code ?? null });
});
```

- [ ] **Step 2: Compile check + commit**

```bash
cd backend && npx tsc --noEmit
git add backend/src/routers/pairing.ts
git commit -m "feat: add pairing router"
```

---

### Task 11: App factory and entry point

**Files:**
- Create: `backend/src/app.ts`
- Create: `backend/src/index.ts`

- [ ] **Step 1: Create `backend/src/app.ts`**

```typescript
import express from 'express';
import cors from 'cors';
import { authRouter } from './routers/auth';
import { catalogRouter } from './routers/catalog';
import { matchesRouter } from './routers/matches';
import { moodRouter } from './routers/mood';
import { pairingRouter } from './routers/pairing';

export function createApp() {
  const app = express();

  app.use(cors()); // Mobile app is not browser-bound; no origin restriction needed
  app.use(express.json());

  app.use('/api/auth', authRouter);
  app.use('/api/catalog', catalogRouter);
  app.use('/api/matches', matchesRouter);
  app.use('/api/mood', moodRouter);
  app.use('/api/pairing', pairingRouter);

  app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

  // Global error handler
  app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error(err);
    res.status(500).json({ detail: 'Internal server error' });
  });

  return app;
}
```

- [ ] **Step 2: Create `backend/src/index.ts`**

```typescript
import 'dotenv/config';
import { initDb } from './db/schema';
import { seedCatalog } from './db/seed';
import { createApp } from './app';

initDb();
seedCatalog();

const PORT = parseInt(process.env.PORT ?? '8000', 10);
const app = createApp();

app.listen(PORT, () => {
  console.log(`KinkLink API running on port ${PORT}`);
});
```

Note: `dotenv/config` requires installing `dotenv`:
```bash
cd backend && npm install dotenv && npm install -D @types/dotenv
```
(If dotenv is not already in package.json, add it.)

- [ ] **Step 3: Full compile**

```bash
cd backend && npx tsc
```

Expected: `dist/` directory created, no errors.

- [ ] **Step 4: Start the server**

```bash
cd backend && npm run dev
```

Expected output: `KinkLink API running on port 8000` and `Seeded N catalog items`

- [ ] **Step 5: Smoke test the health endpoint**

```bash
curl http://localhost:8000/api/health
```

Expected: `{"status":"ok"}`

- [ ] **Step 6: Smoke test register + login**

```bash
# Register
curl -s -X POST http://localhost:8000/api/auth/register \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser","password":"password123","display_name":"Test"}' | jq .

# Should return: { user: {...}, accessToken: "...", refreshToken: "..." }

# Login
curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser","password":"password123"}' | jq .
```

- [ ] **Step 7: Smoke test /auth/me with Bearer token**

```bash
ACCESS=$(curl -s -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"testuser","password":"password123"}' | jq -r .accessToken)

curl -s http://localhost:8000/api/auth/me \
  -H "Authorization: Bearer $ACCESS" | jq .
```

Expected: user object

- [ ] **Step 8: Commit**

```bash
git add backend/src/app.ts backend/src/index.ts
git commit -m "feat: add Express app factory and server entry point"
```

---

## Chunk 4: Mobile Client Update

### Task 12: Rewrite `client.js`

**Files:**
- Modify: `mobile/src/api/client.js`

- [ ] **Step 1: Rewrite `mobile/src/api/client.js`**

```javascript
import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE = 'https://apikinklink.amoreapp.net/api';
const ACCESS_KEY = 'kl_access_token';
const REFRESH_KEY = 'kl_refresh_token';

export async function storeTokens(accessToken, refreshToken) {
  await AsyncStorage.multiSet([[ACCESS_KEY, accessToken], [REFRESH_KEY, refreshToken]]);
}

export async function clearTokens() {
  await AsyncStorage.multiRemove([ACCESS_KEY, REFRESH_KEY]);
}

async function getTokens() {
  const pairs = await AsyncStorage.multiGet([ACCESS_KEY, REFRESH_KEY]);
  return {
    accessToken: pairs[0][1],
    refreshToken: pairs[1][1],
  };
}

// Refresh mutex: prevents multiple concurrent refresh calls
let refreshPromise = null;

async function refreshAccessToken() {
  if (refreshPromise) return refreshPromise;

  refreshPromise = (async () => {
    const { refreshToken } = await getTokens();
    if (!refreshToken) throw new Error('No refresh token');

    const res = await fetch(`${API_BASE}/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refreshToken }),
    });

    if (!res.ok) {
      await clearTokens();
      throw new Error('Session expired');
    }

    const { accessToken, refreshToken: newRefresh } = await res.json();
    await storeTokens(accessToken, newRefresh);
    return accessToken;
  })().finally(() => {
    refreshPromise = null;
  });

  return refreshPromise;
}

async function request(path, options = {}, isRetry = false) {
  const { accessToken } = await getTokens();

  const headers = {
    'Content-Type': 'application/json',
    ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
    ...options.headers,
  };

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers });

  if (res.status === 401 && !isRetry) {
    try {
      await refreshAccessToken();
    } catch {
      throw new Error('Session expired');
    }
    return request(path, options, true);
  }

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const detail = body.detail;
    const message = Array.isArray(detail)
      ? detail.map((e) => e.msg).join(', ')
      : typeof detail === 'string'
      ? detail
      : `Request failed: ${res.status}`;
    throw new Error(message);
  }

  if (res.status === 204) return null;
  return res.json();
}

const client = {
  get: (path) => request(path),
  post: (path, data) => request(path, { method: 'POST', body: JSON.stringify(data) }),
  put: (path, data) => request(path, { method: 'PUT', body: JSON.stringify(data) }),
  delete: (path) => request(path, { method: 'DELETE' }),
};

export default client;
```

- [ ] **Step 2: Commit**

```bash
git add mobile/src/api/client.js
git commit -m "feat: rewrite client.js with JWT Bearer tokens and refresh mutex"
```

---

### Task 13: Update `AuthContext.jsx`

**Files:**
- Modify: `mobile/src/context/AuthContext.jsx`

- [ ] **Step 1: Update `mobile/src/context/AuthContext.jsx`**

```jsx
import { createContext, useState, useCallback, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import client, { storeTokens, clearTokens } from '../api/client';

export const AuthContext = createContext(null);

function toUser(raw) {
  return {
    id: raw.id,
    username: raw.username,
    displayName: raw.display_name,
    avatarColor: raw.avatar_color,
    coupleId: raw.couple_id ?? null,
    partnerName: raw.partner_name ?? null,
  };
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // On mount: attempt to restore session via /auth/me
  // client.js will silently refresh the access token if it's expired
  useEffect(() => {
    client
      .get('/auth/me')
      .then((raw) => setUser(toUser(raw)))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (username, password) => {
    setLoading(true);
    try {
      const { user: raw, accessToken, refreshToken } = await client.post('/auth/login', { username, password });
      await storeTokens(accessToken, refreshToken);
      const u = toUser(raw);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const register = useCallback(async (username, password, displayName) => {
    setLoading(true);
    try {
      const { user: raw, accessToken, refreshToken } = await client.post('/auth/register', { username, password, display_name: displayName });
      await storeTokens(accessToken, refreshToken);
      const u = toUser(raw);
      setUser(u);
      return u;
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    // Read refresh token directly from AsyncStorage (not via client.js) so no
    // token-refresh attempt runs before we delete the session.
    const refreshToken = await AsyncStorage.getItem('kl_refresh_token').catch(() => null);
    await client.post('/auth/logout', { refreshToken }).catch(() => {});
    await clearTokens();
    setUser(null);
  }, []);

  const pair = useCallback(async (code) => {
    setLoading(true);
    try {
      const raw = await client.post('/pairing/join', { code });
      setUser(toUser(raw));
    } finally {
      setLoading(false);
    }
  }, []);

  const createPairingCode = useCallback(async () => {
    const data = await client.post('/pairing/create');
    return data.code;
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, pair, createPairingCode, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}
```

**Note on `logout`:** The logout implementation reads the refresh token directly from AsyncStorage (rather than going through `client.js`) because we don't want a token-refresh to run right before deleting the session. Simplify if preferred: import `AsyncStorage` at the top of the file and call `AsyncStorage.getItem('kl_refresh_token')` directly.

- [ ] **Step 2: Commit**

```bash
git add mobile/src/context/AuthContext.jsx
git commit -m "feat: update AuthContext for JWT login/register/logout"
```

---

### Task 14: End-to-end verification

- [ ] **Step 1: Run mobile app against the new backend**

```bash
# In backend/
npm run dev

# In mobile/
npm start
```

- [ ] **Step 2: Test the full auth flow in the app**

1. Register a new account → should land on tab navigator
2. Force-quit and reopen app → should stay logged in (session restored via /auth/me)
3. Browse items and swipe → responses should persist
4. Open Matches tab → matches should appear if applicable
5. Log out → should return to landing screen

- [ ] **Step 3: Test token refresh**

With the server running and the app open:
```bash
# Wait for the 15-minute access token to expire (or temporarily set ACCESS_TOKEN_SECRET to a different value to force invalidation, then restore it)
# Or: shorten expiresIn in makeTokens to '10s' for testing, then restore to '15m'
```

Expected: app continues working silently after access token expires.

- [ ] **Step 4: Update the systemd service for production**

Edit `/etc/systemd/system/kinklink-api.service`:
```ini
[Unit]
Description=KinkLink API (Node.js)
After=network.target

[Service]
Type=simple
WorkingDirectory=/path/to/backend
EnvironmentFile=/path/to/backend/.env
ExecStart=/usr/bin/node dist/index.js
Restart=on-failure

[Install]
WantedBy=multi-user.target
```

Then:
```bash
cd backend && npm run build
sudo systemctl daemon-reload
sudo systemctl restart kinklink-api
sudo systemctl status kinklink-api
```

- [ ] **Step 5: Final commit**

```bash
git add .
git commit -m "feat: complete Node.js/JWT backend rewrite and mobile client update"
```
