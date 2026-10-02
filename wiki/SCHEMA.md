# TravelHues LLM Wiki schema

Pattern source: [Karpathy LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) (copy in [`../raw/references/llm-wiki-pattern.md`](../raw/references/llm-wiki-pattern.md)).

## Repo scope

**travelhues-app** — Next.js consumer PWA (creators, travelers, studio, hues, trips, storefront, in-app admin). Documents UI flows, client types, `NEXT_PUBLIC_API_URL` usage, and product vocabulary.

Sibling wikis: `travelhues-api` (Nest API), `travelhues-admin` (legacy desk). See [ecosystem.md](ecosystem.md).

## Layers

| Layer | Path | Who writes |
|-------|------|------------|
| Raw sources | `raw/` | Humans (immutable for agents) |
| Wiki | `wiki/` | LLM maintains; humans review |
| Schema | `wiki/SCHEMA.md` | Humans + LLM co-evolve |
| Agent entry | `AGENTS.md` | Points agents at this wiki |

## Page types

- **overview.md** — What this repo is and how to run it.
- **ecosystem.md** — How the three repos connect (keep in sync across repos).
- **concepts/** — Glossary, domain models, conventions (one topic per file).
- **modules/** — Feature areas (e.g. `modules/studio.md`, `modules/hues-feed.md`).
- **sources/** — One summary page per ingested raw file (`sources/<slug>.md`).
- **decisions/** — ADR-style notes when behavior is non-obvious.

Use relative links between wiki pages. Prefer stable slugs over dates in filenames.

## Frontmatter (optional)

```yaml
---
title: Page title
tags: [concept, studio]
sources: [raw/seed/backend-api-performance.md]
updated: 2026-10-02
---
```

## Operations

### Ingest

1. Add file under `raw/` (or use existing `seed/` as raw; link from `sources/`).
2. Read source; discuss takeaways with the user if unclear.
3. Create or update `wiki/sources/<slug>.md`.
4. Update entity/concept/module pages touched (often many).
5. Update [index.md](index.md).
6. Append [log.md](log.md): `## [YYYY-MM-DD] ingest | <title>`.

### Query

1. Read `index.md`, then relevant pages.
2. Answer with citations as `wiki/path.md` or `src/...` paths.
3. If the answer is reusable, add a wiki page and index entry.

### Lint

On request or periodically:

- Contradictions between pages or vs `src/`.
- Stale API route lists vs `travelhues-api`.
- Orphan pages (no inbound links from index or other pages).
- Concepts used in code but missing concept pages.
- `ecosystem.md` drift vs sibling repos.

## Index and log

- **index.md** — Catalog by category with one-line summaries.
- **log.md** — Append-only; use consistent `## [date] type | title` headers.

## Skill

Use the project skill `.cursor/skills/llm-wiki/SKILL.md` for create/update workflows.
