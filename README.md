# TimeSnap (PWA)

Static PWA port of the Google AI Studio "TimeSnap" app, served from GitHub Pages at `/timesnap-app/`.
Analysis runs on a Cloudflare Worker (`worker/`) holding `GEMINI_API_KEY` as a secret — no key in client or repo.

- Dev: `npm install && npm run dev`
- Build for Pages: `npm run build:pages` → `docs/` (committed; Pages source = `main` / `docs`)
- API base URL: `config.ts` (`DEFAULT_API_BASE` = https://timesnap-api.timesnapx.workers.dev). For local testing append `?api=http://localhost:8787`.
- Worker: `cd worker && npx wrangler secret put GEMINI_API_KEY && npx wrangler deploy` (deployed as timesnap-api on timesnapx.workers.dev)
- Tests: `npm run mock-api` (MOCK worker stub, fake data) + `node mock/e2e.mjs`; `node worker/test-local.mjs` (stubbed Gemini).

Vault data lives in `localStorage` key `snaps-storage` (same key as the original).
