# Venn Backend Rewrite: Node.js + Express + JWT

**Date:** 2026-03-13
**Status:** Approved

## Overview

Replace the existing Python/FastAPI backend with a Node.js/Express/TypeScript backend. The API contract (all endpoints, request/response shapes, HTTP status codes) remains identical so the mobile app requires only a targeted update to its `client.js` auth layer. The key change is replacing session-cookie auth with JWT access + refresh tokens.

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js (LTS) |
| Framework | Express + TypeScript |
| Database | SQLite via `better-sqlite3` (sync, no async overhead for a two-person app) |
| JWT | `jsonwebtoken` |
| Password hashing | `bcrypt` |
| Validation | `zod` |
| Rate limiting | `express-rate-limit` |
| CORS | `cors` package, no origin restriction (mobile app is not browser-bound) |

**Note on `better-sqlite3`:** The synchronous driver is intentional. For a self-hosted two-user app there is no concurrent write pressure, and synchronous SQLite eliminates callback/promise overhead while making the code easier to reason about.

## Directory Structure

```
backend/
  src/
    db/
      schema.ts        # createTables() + initDb()
      seed.ts          # catalog seed data (ported from seed.py)
    middleware/
      auth.ts          # requireAuth middleware — validates Bearer token, attaches userId to req
      rateLimit.ts     # per-route rate limiters
    routers/
      auth.ts
      catalog.ts
      matches.ts
      mood.ts
      pairing.ts
    models/
      schemas.ts       # Zod schemas for all request bodies
    app.ts             # Express app factory (middleware, routers)
    index.ts           # Entry point — opens DB, seeds, starts server
  package.json
  tsconfig.json
  .env
```

## Database Schema Changes

All existing tables are preserved unchanged. One new table is added:

```sql
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         TEXT    PRIMARY KEY,          -- UUID, matches tokenId claim in JWT
  user_id    INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires_at TEXT    NOT NULL,             -- ISO 8601 UTC string, e.g. "2026-04-12T10:00:00.000Z"
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user ON refresh_tokens(user_id);
```

**`expires_at` usage:** On lookup, the server checks both the JWT `exp` claim and that the `expires_at` column has not passed. This provides a second layer of defence: even if a JWT is somehow issued with a far-future `exp`, the DB row enforces the intended 30-day window. Expired rows are not automatically pruned (acceptable at this scale); a future cleanup job could delete `WHERE expires_at < datetime('now')`.

Existing data survives — no migration required.

## JWT Auth Flow

### Tokens

- **Access token**: 15-minute expiry. Payload: `{ userId: number }`. Signed with `ACCESS_TOKEN_SECRET`.
- **Refresh token**: 30-day expiry. Payload: `{ userId: number, tokenId: string }`. Signed with `REFRESH_TOKEN_SECRET`. `tokenId` is a UUID stored in the `refresh_tokens` table, enabling server-side revocation.

### Auth Endpoints

All other endpoint paths/contracts are unchanged.

| Method | Path | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | None | Returns `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/login` | None | Returns `{ user, accessToken, refreshToken }` |
| POST | `/api/auth/refresh` | None | Body: `{ refreshToken }`. Rotates: invalidates old tokenId, issues new pair. Returns `{ accessToken, refreshToken }` |
| POST | `/api/auth/logout` | None (body: `{ refreshToken }`) | Deletes refresh token row from DB. Does not require a valid access token so logout works even when access token is expired. |
| GET | `/api/auth/me` | Bearer | Returns current user |

### requireAuth Middleware

```
Authorization: Bearer <accessToken>
```

Verifies signature and expiry. On failure: `401 { detail: "Not authenticated" }`. On success: attaches `req.userId` for downstream route handlers.

### Token Rotation

On `/auth/refresh`:
1. Verify refresh token signature and expiry
2. Look up `tokenId` in `refresh_tokens` AND check `expires_at > now()` — reject if not found or expired
3. Delete old row
4. Issue new access token + new refresh token with new `tokenId`
5. Insert new row

Each refresh token is single-use. A stolen token used after the legitimate client has rotated it will be rejected.

## Error Response Shape

Preserved from the Python backend so the mobile error-parsing code is unchanged:

```json
{ "detail": "Human-readable message" }
```

Zod validation errors are formatted to match: `"fieldName: message"` joined with `, ` for multiple errors.

## Mobile Client Changes (`src/api/client.js`)

The API base URL and all endpoint paths stay the same.

**AsyncStorage keys:**
- `vn_access_token` — replaces `vn_session`
- `vn_refresh_token`

**Security note:** AsyncStorage is unencrypted on Android. This is an acceptable trade-off for a self-hosted personal app. `expo-secure-store` would be stronger but has a 2KB size limit that JWT strings may approach on some devices.

**Request flow:**
1. Read access token from AsyncStorage
2. Attach `Authorization: Bearer <token>` header
3. If response is `401`: acquire refresh lock (see Concurrent Refresh below), call `/auth/refresh` with stored refresh token
4. On successful refresh: store new tokens, release lock, retry original request once
5. On refresh failure (token expired/revoked): clear both tokens, release lock, throw so `AuthContext` handles redirect to login

**Concurrent refresh (mutex pattern):**
`BrowseScreen` fires `GET /catalog` and `GET /catalog/responses` in parallel. If both hit `401` simultaneously, both must not independently attempt `/auth/refresh` — the second call would use an already-rotated token and force a logout.

`client.js` must maintain a module-level `refreshPromise` variable:
- When a `401` triggers a refresh and `refreshPromise` is null: set `refreshPromise = callRefreshEndpoint()`, await it, then set it back to null
- When a `401` triggers a refresh and `refreshPromise` is already set: await the existing promise (don't start a new one)
- All waiting requests reuse the new tokens from the shared promise result

**Startup `/auth/me` call:**
`AuthContext` calls `GET /auth/me` on mount to restore session. If the access token is expired at cold start, the `401` interceptor will fire and attempt a silent refresh before `AuthContext` receives a result. This is correct — the startup session check benefits from silent refresh just like any other request.

**`AuthContext` changes:**

The response shape for `login` and `register` changes from a flat user object to `{ user, accessToken, refreshToken }`. `AuthContext` must be updated accordingly:

```js
// Before (cookie-based):
const raw = await client.post('/auth/login', { username, password });
setUser(toUser(raw));

// After (JWT):
const { user: raw, accessToken, refreshToken } = await client.post('/auth/login', { username, password });
await AsyncStorage.multiSet([['vn_access_token', accessToken], ['vn_refresh_token', refreshToken]]);
setUser(toUser(raw));
```

`register` follows the same pattern. `logout` passes `{ refreshToken }` in the request body (read from AsyncStorage) and clears both keys afterwards.

No structural changes to the context shape — all screens unaffected.

## Environment Variables

```
PORT=8000
DB_PATH=./venn.db
ACCESS_TOKEN_SECRET=<random 32+ byte hex>
REFRESH_TOKEN_SECRET=<random 32+ byte hex>
NODE_ENV=production
```

## Deployment

The Node backend is a drop-in replacement for the Python one. Deploy to the same host, update the systemd service (`venn-api.service`) to run `node dist/index.js`. The mobile app's `API_BASE` URL does not change.

## Out of Scope

- Changing any endpoint path or response shape
- Migrating existing user sessions (users will need to log in once after cutover)
- Adding new features
- `PATCH /auth/me` for profile updates (pre-existing gap, not introduced here)
