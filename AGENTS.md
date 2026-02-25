# AGENTS.md

## Cursor Cloud specific instructions

### Architecture Overview
This is a monorepo with 4 independent packages (no workspace manager). See `README.md` for full architecture details.

| Package | Path | Port | Package Manager |
|---------|------|------|-----------------|
| **frontend** (Next.js 16) | `frontend/` | 3000 | npm (`package-lock.json`) |
| **mcp-server** (MCP stdio) | `mcp-server/` | stdio | npm (`package-lock.json`) |
| **agent-loop** (Express) | `agent-loop/` | 3003 | npm (no lockfile) |
| **scripts** (CLI) | `scripts/` | N/A | npm (`package-lock.json`) |

### Running the Frontend
```bash
cd frontend && npm run dev
```
- Requires `.env.local` with `SUPABASE_URL`, `SUPABASE_KEY`, and `NEXT_PUBLIC_PRIVY_APP_ID`.
- `NEXT_PUBLIC_PRIVY_APP_ID` must be exactly 25 characters long to pass Privy SDK validation. A dummy value like `clxxxxxxxxxxxxxxxxxxxxxxx` (25 chars) allows the UI to render, but wallet connection won't work without a real Privy app ID.
- `next build` fails at static page prerendering without a real Privy app ID. Use `next dev` for development.
- The Supabase client is initialized at module scope (`src/lib/supabase.ts`), so even placeholder values must be provided or the server crashes.

### Lint
```bash
cd frontend && npx eslint
```
Pre-existing lint warnings/errors exist in the codebase (unused vars, `no-explicit-any`, React hook warnings). These are not blocking.

### External Dependencies
- **Supabase** (cloud-hosted PostgreSQL) — no local Supabase; all data flows through cloud.
- **Privy** — wallet connection / auth. Requires a real Privy app ID for wallet features.
- **LI.FI API** — DeFi execution engine (external).
- **Anthropic API** — only needed for `agent-loop`.

### Key Gotchas
- The README says `pnpm install` for frontend, but the actual lockfile is `package-lock.json`. Use `npm install` for all packages.
- There is no root `package.json` — each package must have dependencies installed independently.
- `agent-loop` has no lockfile; `npm install` generates one fresh.
- No Docker, no test suites, no CI configuration. The `scripts/` package contains LI.FI API integration test scripts that hit live mainnet APIs.
