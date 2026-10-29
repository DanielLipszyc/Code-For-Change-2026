# Architecture

Swamp Spotter is one Next.js app (App Router). Clerk handles sign-in and Supabase
(Postgres and Storage) stores the data. The browser never talks to Supabase: every
read and write goes through the app's server code, which holds the secret key.

## Where code goes

| Folder               | What goes there                                                        | Rule                                                                                                       |
| -------------------- | ---------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Pages and API routes                                                   | Routing and UI only. A route handler checks its input, calls `src/server/`, and returns a response.        |
| `src/server/`        | Anything that uses secrets, the database, Clerk's API or outside APIs  | Every file starts with `import "server-only"`, so the build fails if browser code imports it.              |
| `src/client/`        | Browser-only code: the offline report store and sender, photo resizing | Every file starts with `import "client-only"` (hooks: `"use client"`), so server code can't import it.     |
| `src/lib/`           | Helpers used by both the browser and the server                        | No secrets, no network calls.                                                                              |
| `src/data/`          | Static data                                                            | `plants.ts` is the only copy of the species list; the guide, forms, validation and plant ID all read it.   |
| `src/types/`         | Types shared by the browser and the server                             | `Submission` (types/submission.ts) is the one shape the API and pages use; `MapPoint` is its map subset.   |
| `src/components/`    | UI used by more than one page                                          | A component used by a single page lives next to it in a `_components/` folder, and moves here once reused. |
| `src/components/ui/` | Building blocks: `Dialog`, `useConfirm()`, `useToast()`                | Use these instead of `window.confirm()` and `alert()`.                                                     |
| `services/`          | Separate services: `plant-id/`, the BioCLIP model on Modal             | Their own language and deploy. The app reaches them only through `src/server/`.                            |
| `supabase/`          | Database schema                                                        | `schema.sql` is safe to re-run; re-running it is how a database picks up changes.                          |
| `scripts/`           | One-off and admin scripts, run with `tsx`                              | See the `package.json` scripts.                                                                            |
| `e2e/`               | Browser tests (Playwright)                                             | See [Testing and checks](#testing-and-checks).                                                             |

The main server modules:

- `server/submissions.ts`: every query on the submissions table, with the
  visibility and ownership rules built in, and the cache they're read through
- `server/photos.ts`: submission photos in Supabase Storage
- `server/dashboard.ts`: the dashboard's numbers and the follow toggle
- `server/authz.ts`: who the user is (`getViewer()`) and their role
- `server/http.ts`: reading request bodies (size limit plus schema) and the
  `{ error }` response shape every endpoint uses
- `server/env.ts`: environment variables, checked at startup
- `server/identify/`: plant identification (see below)

### Route groups

Pages are grouped by purpose. Folder names in parentheses don't appear in URLs,
so `src/app/(app)/map/page.tsx` is served at `/map`.

- `(site)`: home, guide
- `(auth)`: sign-in, sign-up (Clerk)
- `(app)`: dashboard, log, map, submit, drafts. These have a shared loading
  screen (`loading.tsx`) and error screen (`error.tsx`).

`app/~offline` is the page the service worker shows offline (see [Offline](#offline)).

## How requests flow

**Pages load their data on the server.** `/log` and `/dashboard` are server
components: they ask `server/` for exactly what this user may see and hand it to
a client component (in `_components/`) for the interactive parts. The page
arrives with its data, with no fetch after it loads.

**`/map` is the same for everyone, so it's built once and cached.** The page
carries every approved sighting as a `MapPoint` (only what the map draws, about
150 bytes each) from `listPublicMapPoints()`, which reads through Next's data
cache. Every write in `server/submissions.ts` clears the `submissions` cache
tag, so the next visit after a change rebuilds the page; an hourly rebuild
catches edits made outside the app. What depends on the viewer loads in the
browser afterwards: admins' pending reports (`/api/submissions?status=pending`)
and a sighting's full details when it's opened (`/api/submissions/<id>`,
started when its popup opens). The role in the browser only decides which
buttons to show; the API checks every change again.

The map itself (`map/_components/MapView.tsx`) is created once. Markers are
circles in one shared SVG layer, added and removed individually when filters
change, and popups are built when opened. The List tab shows the same
sightings, nearest first when the visitor's location is known.

**Changes go through the API.** Submitting a sighting, for example:

1. `/submit` saves the report on the device, then sends `POST /api/submissions`.
2. The middleware lets it through (anonymous submissions are allowed; see
   `lib/routeAccess.ts`).
3. The route handler reads the body with a size limit and validates it against
   `createSubmissionSchema` (`lib/schemas.ts`), applies the rate limit, then calls
   `createSubmission()` in `server/submissions.ts`, which stores the photo and
   then the row.

**Photos are served separately.** Lists never include photo data; they say
whether there is one (`hasPhoto`). Photos live in a private Storage bucket as
two JPEGs, the photo and a 320 px thumbnail, made with sharp when the report is
submitted (which also strips the camera's metadata). They're served by
`/api/submissions/<id>/photo` (`?size=thumb` for the thumbnail) with the same
visibility rules as the submission. Photos submitted before the bucket existed
are in the `image_data` column until `npm run photos:move-to-storage` moves them.

## Offline

Swamps have poor signal, so reporting works without a connection.

- **Saved reports** (`client/offline/reports.ts`): `/submit` saves every report
  on the device (IndexedDB) before sending it, so a dropped connection loses
  nothing. Reports are either queued (finished, sent automatically) or drafts
  (finished later on `/submit?draft=<id>`, for example to get an AI suggestion
  once online). `/drafts` lists them.
- **Sending** (`client/offline/send.ts`): `components/SavedReportsSync.tsx`,
  mounted in the root layout, sends queued reports when a page opens, when the
  browser comes back online, and when the tab comes back into view. A report is
  sent only as the account that saved it, or anonymously.
- **No duplicates, correct dates:** each saved report has its own ID, which
  becomes the submission's ID, and keeps the time it was spotted. A resent ID
  gets 409 and is treated as sent. The server accepts spotted-at times from the
  last 30 days and not in the future.
- **Service worker** (`app/sw.ts`, built with Serwist into `public/sw.js`):
  precaches the app's code; pages are fetched from the network first and kept,
  so a page opened once opens offline after. `/submit` and `/drafts` need
  sign-in, so they're stored once someone is signed in rather than precached.
  Pages never opened show `/~offline`. API responses (which depend on who's
  signed in) and map tiles (OpenStreetMap doesn't allow storing them) are never
  stored. The service worker is off in development.

## Security model

- **Identity:** Clerk session. Admins have `role: "admin"` in Clerk public
  metadata (set with `npm run promote-admin`); everyone else is a regular user.
- **Roles without a network call:** `getViewer()` reads the role from the Clerk
  session token when it carries it, and otherwise asks Clerk's API on every
  request. To turn this on: Clerk dashboard → Sessions → Customize session token →
  `{"metadata": "{{user.public_metadata}}"}`. A role change then takes effect when
  the token refreshes (within about a minute). Approving and deleting other
  people's reports always check the role with Clerk directly.
- **Access rules:** `lib/routeAccess.ts` lists what signed-out visitors may do:
  view the public pages, read approved submissions and their photos, and submit
  anonymously. Everything else requires sign-in. Every API handler checks the
  user again, so the middleware is only the first layer.
- **Ownership:** edit and delete queries include the owner check in the query
  itself (`server/submissions.ts`), so there's no gap between checking and
  writing. Other people's pending reports, and their Clerk IDs, are never sent.
- **Database:** only server code holds the Supabase secret key. Row Level Security
  is on with no policies, and the photo bucket is private with no policies, so the
  public key can't read or write anything.
- **Input:** every request body is size-limited and validated by a schema in
  `lib/schemas.ts`. Plant names must come from the plant list, notes are
  length-limited, and photos must be inline JPEG, PNG or WebP that sharp can
  read; they're re-encoded before they're stored. A client-chosen submission ID
  must be a UUID, and a stored photo is never replaced.
- **Output:** pages render user text as text, never as HTML (map popups use
  `textContent`). CSV exports neutralize cells that would run as spreadsheet
  formulas.
- **Abuse:** per-user and per-IP rate limits are stored in Postgres
  (`hit_rate_limit` in `schema.sql`), so they hold across server instances.

## Plant identification

Switched on with `PLANT_ID_ENABLED` in `lib/features.ts`. The model is BioCLIP 2,
served from `services/plant-id/` on Modal (see its README). The app's side is in
`src/server/identify/`:

- `index.ts`: `identifyPlant()`, the only function the API route calls
- `bioclip.ts`: the call to the model's endpoint, with Modal's proxy-auth token
- `match.ts`: maps the model's best guess to a species on the plant list, by
  scientific name first. Users only ever see the matched plant.

The model scores the species in `services/plant-id/species.json`, which is
generated from `plants.ts` (`npm run plant-id:species`); a unit test fails if the
two differ. To switch models, add a file next to `bioclip.ts` and call it from
`index.ts`.

## Testing and checks

- **Unit tests** sit next to the code they test: `authz.ts` → `authz.test.ts`.
  They run with Vitest (`npm test`) and mock every outside service. The offline
  store runs against `fake-indexeddb`; photo processing uses real sharp.
- **Browser tests** in `e2e/` run with Playwright (`npm run test:e2e`) on a
  desktop and a phone-sized screen, against a production build with your
  `.env.local`. They read the real database and never sign in or write anything,
  so signed-in flows (submitting, drafts) are covered by unit tests. To run them
  in CI, add Clerk and Supabase test keys as GitHub secrets.
- **Timing budget:** `npm run test:perf` checks that `/map` draws its sightings
  quickly. It runs alone, since parallel tests slow each other down.
- `npm run check` runs lint, typecheck, format check and unit tests. CI runs the
  same checks plus a production build on every pull request; the build sets
  `BUILD_WITHOUT_DATABASE=1` because `/map` is otherwise built from the database.
- Prettier formats everything; don't format by hand.

## Deploying a change to the database

`supabase/schema.sql` is re-run to apply changes, and code that needs a new
column must not be deployed before it. Order: run the schema in the Supabase SQL
Editor, then deploy, then run any data script the change mentions (for example
`npm run photos:move-to-storage -- --apply`).
