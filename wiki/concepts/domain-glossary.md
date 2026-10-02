# Domain glossary (app)

Shared product terms used in UI and `src/lib/types.ts`. API persistence details: **travelhues-api** wiki.

| Term | Meaning |
|------|---------|
| **Story** | Creator travel narrative keyed by slug; contains spots, itineraries, media. |
| **Spot** | Typed place (`stay`, `food`, `activity`, etc.) with geo, cost, images. |
| **Itinerary** | Multi-day plan with blocks (notes + spot references) and optional reservations. |
| **Hue** | Short-form video content in the hues feed (HLS stream URLs from API). |
| **Glimpse** | Lightweight story preview row; filterable via API `GET /glimpses`. |
| **Studio** | Creator workspace for managing story pieces, plans, storefront. |
| **TCC** | Travel creator console flows under `/login/tcc` and related studio paths. |
| **Storefront** | Creator commerce surface (posts, purchases). |
| **Trip** | Traveler trip planning / saved journey UX under `/trips`. |

When adding terms, link to the module page under `wiki/modules/` once it exists.
