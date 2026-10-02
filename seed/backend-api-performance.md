# Backend API performance checklist

Apply on the service behind `NEXT_PUBLIC_API_URL`.

## High impact

- **GET /me/stories**: Return a slim list for the studio shell, or paginate; avoid shipping full spot/plan graphs on every refresh.
- **POST /media**: Replace synchronous base64 `dataUrl` with presigned object storage uploads.
- **GET /stories/:slug**: Include optional `highlightVideoUrl` so story pages skip a glimpses list fetch.
- **GET /profiles**: Support `?usernames=u1,u2` batch for home creator rows.

## Data layer

- Indexes: `stories.country`, `stories.slug`, `stories.creator_id`, glimpse `story_slug`, search vectors.
- Log queries slower than 100ms; use connection pooling.

## HTTP

- Enable gzip/brotli on JSON responses.
- `Cache-Control: public, max-age=300` on `/countries`, `/spot-catalog`, and public `/settings` slices.

## Infra

- Keep API region close to Next deployment; HTTP keep-alive to the database.
- APM on handler time vs DB time per route.
