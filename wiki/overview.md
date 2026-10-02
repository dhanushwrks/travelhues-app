# travelhues-app overview

Next.js 16 consumer and creator application: stories, itineraries, hues (short video), studio (creator desk), trips, storefront, glimpses, and embedded admin under `/admin`.

## Run

```bash
npm install
npm run dev
```

Requires `NEXT_PUBLIC_API_URL` pointing at **travelhues-api** for live data (see `src/lib/api.ts`).

## Code map

| Area | Path |
|------|------|
| Routes | `src/app/` |
| UI | `src/components/` |
| API client / remote | `src/lib/api.ts`, `src/lib/remote.ts` |
| Domain types | `src/lib/types.ts` |
| Seed fixtures (treat as raw) | `seed/` |

## Related

- [ecosystem.md](ecosystem.md)
- [concepts/domain-glossary.md](concepts/domain-glossary.md)
- [SCHEMA.md](SCHEMA.md)
