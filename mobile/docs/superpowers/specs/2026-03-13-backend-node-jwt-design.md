# KinkLink Backend Rewrite: Node.js + Express + JWT

**Date:** 2026-03-13
**Status:** Approved

## Overview

Replace the existing Python/FastAPI backend with a Node.js/Express/TypeScript backend. The API contract (all endpoints, request/response shapes, HTTP status codes) remains identical so the mobile app requires only a targeted update to its `client.js` auth layer. The key change is replacing session-cookie auth with JWT access + refresh tokens.

## Stack

| Concern | Choice |
|---|---|
| Runtime | Node.js (LTS) |
| Framework | Express + TypeScript |
| Database | SQLite via `better-sqlite3` (sync) |
| JWT | `jsonwebtoken` |
| Password hashing | `bcrypt` |
| Validation | `zod` |
| Rate limiting | `express-rate-limit` |

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
  expires_at TEXT    NOT NULL,
  created_at TEXT    NOT NULL DEFAULT (datetime('now'))
);
```

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
| POST | `/api/auth/logout` | Bearer | Deletes refresh token row from DB |
| GET | `/api/auth/me` | Bearer | Returns current user |

### requireAuth Middleware

```
Authorization: Bearer <accessToken>
```

Verifies signature and expiry. On failure: `401 { detail: "Not authenticated" }`. On success: attaches `req.userId` for downstream route handlers.

### Token Rotation

On `/auth/refresh`:
1. Verify refresh token signature and expiry
2. Look up `tokenId` in `refresh_tokens` — reject if not found (already rotated or logged out)
3. Delete old row
4. Issue new access token + new refresh token with new `tokenId`
5. Insert new row

This means each refresh token is single-use. A stolen refresh token used after the legitimate client has already rotated it will be rejected.

## Error Response Shape

Preserved from the Python backend so the mobile error-parsing code is unchanged:

```json
{ "detail": "Human-readable message" }
```

Zod validation errors are formatted to match: `"fieldName: message"` joined with `, ` for multiple errors.

## Mobile Client Changes (`src/api/client.js`)

The API base URL and all endpoint paths stay the same.

**AsyncStorage keys:**
- `kl_access_token` — replaces `kl_session`
- `kl_refresh_token`

**Request flow:**
1. Read access token from AsyncStorage
2. Attach `Authorization: Bearer <token>` header
3. If response is `401`: call `/auth/refresh` with stored refresh token
4. On successful refresh: store new tokens, retry original request once
5. On refresh failure (token expired/revoked): clear both tokens, throw so `AuthContext` handles redirect to login

**`AuthContext` changes:**
- `login` and `register` store `accessToken` + `refreshToken` from response body (instead of relying on `Set-Cookie`)
- `logout` clears both AsyncStorage keys after calling `/auth/logout`
- No structural changes to the context shape — all screens unaffected

## Environment Variables

```
PORT=8000
DB_PATH=./kinklink.db
ACCESS_TOKEN_SECRET=<random 32+ byte hex>
REFRESH_TOKEN_SECRET=<random 32+ byte hex>
NODE_ENV=production
```

## Deployment

The Node backend is a drop-in replacement for the Python one. Deploy to the same host, update the systemd service (`kinklink-api.service`) to run `node dist/index.js`. The mobile app's `API_BASE` URL does not change.

## Out of Scope

- Changing any endpoint path or response shape
- Migrating existing user sessions (users will need to log in once after cutover)
- Adding new features
