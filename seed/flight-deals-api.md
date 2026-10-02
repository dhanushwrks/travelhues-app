# Flight deals API contract

Base URL: `NEXT_PUBLIC_API_URL` (default production host in app env).

## Traveler

### `GET /flight-deals?origin=BLR&limit=20`

Returns published, in-window deals for the origin IATA. Each item includes `storyPreview` when linked.

### `GET /flight-deals/:id`

Single deal with `tripType`, `storyPreview`, featured slugs/spot ids.

### `POST /flight-deals/:id/events`

Body: `{ "type": "impression" | "story_open" | ... , "metadata": {} }`

### `GET /r/flight-deals/:id/book`

302 redirect to affiliate URL with `sub_id` tracking param.

### `PATCH /me`

Body may include `homeAirport`: `BLR` | `BOM` | `HYD` | `DEL` | `MAA` or `""` to clear.

### `POST /purchases`

Optional `sourceDealId` (UUID) for attribution.

## Dev seed (travelhues-api)

On API startup, missing deals are upserted for each published story with itineraries: **five origins** (`BLR`, `BOM`, `DEL`, `HYD`, `MAA`) per destination. Missing **Hues** shorts are seeded (five `TH` previews linked to the first open story) when the store has none.

## Admin (Desk)

Bearer `ADMIN_TOKEN`.

- `GET /admin/flight-deals?origin=&status=`
- `POST /admin/flight-deals`
- `PATCH /admin/flight-deals/:id`
- `POST /admin/flight-deals/:id/archive`
- `POST /admin/flight-deals/import` — body `{ "rows": [...] }` or `{ "csv": "..." }`
- `GET /admin/flight-deals/story-suggestions?destinationCity=&country=`
- `GET /admin/flight-deals/analytics`

## CSV header

```
origin_iata,destination_iata,destination_city,destination_country,departure_date,return_date,price_inr,affiliate_url,affiliate_partner,headline,subtitle,story_creator_username,story_slug,featured_itinerary_slug,featured_spot_ids,valid_from,valid_until,priority,status,external_id
```

`featured_spot_ids` pipe-separated in CSV.

## Example deal (JSON)

```json
{
  "originIata": "BLR",
  "destinationIata": "BKK",
  "destinationCity": "Bangkok",
  "destinationCountry": "TH",
  "departureDate": "2026-11-01",
  "returnDate": "",
  "priceInr": 12999,
  "affiliateUrl": "https://partner.example/deeplink",
  "storyCreatorUsername": "creator",
  "storySlug": "bangkok",
  "status": "published",
  "validUntil": "2026-10-15T00:00:00.000Z"
}
```
