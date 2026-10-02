<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Project dictionary (LLM Wiki)

TravelHues uses the [LLM Wiki](https://gist.github.com/karpathy/442a6bf555914893e9891c11519de94f) pattern (`raw/references/llm-wiki-pattern.md`). **Before** exploring or implementing non-trivial work, read `wiki/index.md` and relevant wiki pages (see `.cursor/rules/llm-wiki.mdc`). **After** substantive code or contract changes, update `wiki/` per `wiki/SCHEMA.md`, refresh `wiki/index.md`, and append `wiki/log.md`. Use the **llm-wiki** skill for ingest, lint, or large updates. Treat `seed/` as immutable raw input; link from `wiki/sources/`.
