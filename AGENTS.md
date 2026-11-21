# AGENTS.md

## Project Context

This is a Base44 app repository. Treat it as user-owned application code, keep changes focused on the user's request, and preserve existing project conventions.

Start with `README.md` for local setup, environment variables, and publish workflow.

## Base44 References

- CLI overview: https://docs.base44.com/developers/references/cli/get-started/overview.md
- Agent skills: https://docs.base44.com/developers/backend/overview/skills.md

If your agent supports Agent Skills, install or update Base44 skills before Base44-specific work:

```bash
npx skills add base44/skills
```

## Key Files

- `src/`: frontend application source.
- `src/api/base44Client.js`: frontend Base44 SDK client.
- `vite.config.js`: Vite config and Base44 Vite plugin setup.
- `.env.local`: local-only environment values; never commit secrets.

## Working Notes

- **Backend local** : Express + MySQL dans `server/` (voir README). Le frontend ne dépend plus de Base44 : `src/api/client.js` remplace `@base44/sdk` en gardant la même surface (`base44.entities`, `base44.auth`, `base44.functions`).
- **Dev** : 3 processus — MySQL, `cd server && npm run dev` (API :3001), `npm run dev` (Vite, proxy `/api` → :3001). Ne jamais lancer le frontend seul sans l'API : toutes les données passeront par `/api`.
- **Auth** : JWT dans `localStorage('token')` ; les routes `/api/apps/:appId/auth/*` et `/api/apps/public/login-info/*` sont conservées pour compatibilité avec `src/lib/authMfaFlow.js` (MFA non implémentée, `mfa_policy: 'none'`).
- **Emails** : `server/mailer.js` logue en console ; brancher SMTP ici pour l'activer.
- **Uploads** : `POST /api/upload` (multer) → `server/uploads`, servi sous `/api/uploads`.
- **Entités** : stockées en JSON dans la table `records` ; les RLS des `base44/entities/*.jsonc` sont reproduites dans `server/entities.js` (`ENTITIES`).
- **Config** : `server/.env` (gitignoré) — voir `server/.env.example`.
- Run the relevant checks from `package.json` before finishing code changes (`lint`, `typecheck`, `build`).
