# TravelHues ecosystem

Three repositories share product vocabulary and API contracts. Each repo has its own `wiki/`; keep this page aligned across repos when links or ports change.

| Repo | Role | Default local |
|------|------|----------------|
| `travelhues-app` | Consumer/creator Next.js PWA | `npm run dev` |
| `travelhues-api` | NestJS API + Supabase content | `npm run start:dev` → port **4000** |
| `travelhues-admin` | Story/settings admin desk | `npm run dev -- --port 3002` |

Typical checkout layout: sibling folders under the same parent directory (for example `Documents/travelhues-app`, `travelhues-api`, `travelhues-admin`).

## Integration

- App and admin call the API via `NEXT_PUBLIC_API_URL`.
- App default API base when unset: see `src/lib/api.ts`.
- Admin uses API `ADMIN_TOKEN` as `Authorization: Bearer <token>`.
- Content schema: `travelhues-api/supabase/migrations/`.
- Shared client types: `travelhues-app/src/lib/types.ts`.

## Wiki workflow

1. Put immutable inputs in `raw/` (app also uses `seed/` for fixtures; link from `wiki/sources/`).
2. Distill into `wiki/` in the repo that owns the concern; cross-link from other repos instead of duplicating long prose.
3. When API or env contracts change, update **travelhues-api** wiki first, then app/admin concept pages.
