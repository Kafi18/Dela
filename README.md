# Shareholder Voting App

## Quick start after clone

### One-click launcher (Windows)

Double-click `START_PROJECT.bat` in the project root.

It will:
- check Node.js,
- install dependencies if `node_modules` is missing,
- create `server/.env` from template if needed,
- open backend and frontend in separate terminal windows.

If this is your first run, open `server/.env`, set `DB_PASSWORD`, and run `START_PROJECT.bat` again.

---

1. Install dependencies:

```bash
npm install
```

2. Create local server env file from template:

```bash
npm run setup
```

3. Open `server/.env` and set a real Postgres password in `DB_PASSWORD`.

The backend always reads **`server/.env`** (even if you run `npm` from the repo root), so credentials are not lost because of the working directory.

Make sure Postgres is running and database `shareholder_voting` exists.
If it does not exist, create it once:

```bash
createdb shareholder_voting
```

4. Start frontend and backend together:

```bash
npm run dev:all
```

Frontend: `http://localhost:5173`  
Backend health check: `http://localhost:4000/api/health`

## Alternative (separate terminals)

Terminal 1:

```bash
npm run dev
```

Terminal 2:

```bash
npm run dev:server
```

## Common issues

- `vite is not recognized` -> run `npm install`.
- `client password must be a string` -> check `server/.env`, set `DB_PASSWORD`.
- `database "shareholder_voting" does not exist` -> create DB with `createdb shareholder_voting`.
- UI shows `Ошибка сервера` -> open backend health URL and backend terminal logs.
- Cannot log into your real account -> PostgreSQL must be reachable and `DB_PASSWORD` in `server/.env` must match your Postgres user. Until then only demo logins work (`user@example.com` / `user123`).
