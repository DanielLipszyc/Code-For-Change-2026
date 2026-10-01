# Architecture

Swamp Spotter is one Next.js app (App Router). Clerk handles sign-in and Supabase
(Postgres) stores the data. The browser never talks to Supabase: every read and
write goes through the app's server code, which holds the secret key.

## Where code goes

| Folder            | What goes there                                                       | Rule                                                                                                       |
| ----------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/app/`        | Pages and API routes                                                  | Routing and UI only. A route handler checks its input, calls `src/server/`, and returns a response.        |
| `src/server/`     | Anything that uses secrets, the database, Clerk's API or outside APIs | Every file starts with `import "server-only"`, so the build fails if browser code imports it.              |
| `src/lib/`        | Helpers used by both the browser and the server                       | No secrets, no network calls.                                                                              |
| `src/data/`       | Static data                                                           | `plants.ts` is the only copy of the species list; the guide, forms, validation and plant ID all read it.   |
| `src/types/`      | Types shared by the browser and the server                            |                                                                                                            |
| `src/components/` | UI used by more than one page                                         | A component used by a single page lives next to it in a `_components/` folder, and moves here once reused. |
| `services/`       | Separate services, such as the plant ID model                         | Their own language and deploy. The app reaches them only through `src/server/`.                            |
| `supabase/`       | Database schema                                                       | `schema.sql` is safe to re-run; re-running it is how a database picks up changes.                          |

### Route groups

Pages are grouped by purpose. Folder names in parentheses don't appear in URLs,
so `src/app/(app)/map/page.tsx` is served at `/map`.

- `(site)`: home, about, guide
- `(auth)`: sign-in, sign-up (Clerk)
- `(app)`: dashboard, log, map, submit

## How a request flows

Submitting a sighting, for example:

1. `/submit` (a client component) sends `POST /api/submissions`.
2. The route handler gets the user from Clerk, applies the rate limit
   (`server/rateLimit.ts`), validates every field (`lib/submissionInput.ts`) and
   inserts the row (`server/db.ts`).
3. The map and log read it back through `GET /api/submissions`, which returns
   approved reports to everyone and pending ones only to their owner and admins.

## Security model

- **Identity:** Clerk session. Admins have `role: "admin"` in Clerk public
  metadata (set with `npm run promote-admin`); everyone else is a regular user.
- **Database:** only server code holds the Supabase secret key. Row Level Security
  is on with no policies, so the public key can't read or write anything.
- **Authorization:** every API handler checks the user itself; middleware is only
  a first layer. Ownership and admin checks live in `server/authz.ts`.
- **Stored text:** plant names must come from the plant list and notes are
  length-limited. Pages render user text as text, never as HTML.
- **Abuse:** per-user and per-IP rate limits are stored in Postgres
  (`hit_rate_limit` in `schema.sql`), so they hold across server instances.

## Plant identification

Switched off with `PLANT_ID_ENABLED` in `lib/features.ts`. The code is in
`src/server/identify/`:

- `index.ts`: `identifyPlant()`, the only function the API route calls
- `gemini.ts`: the current model call
- `match.ts`: maps any model's reply to a species on the plant list. Users only
  ever see the matched plant, never the model's raw text.

To switch models, add a file next to `gemini.ts` and call it from `index.ts`.
The model service itself will live in `services/plant-id/`.

## Testing and checks

- Unit tests sit next to the code they test: `authz.ts` → `authz.test.ts`.
  They run with Vitest (`npm test`) and mock every outside service.
- `npm run check` runs lint, typecheck, format check and tests. CI runs the same
  checks plus a production build on every pull request.
- Prettier formats everything; don't format by hand.
