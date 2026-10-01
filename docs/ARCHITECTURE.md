# Architecture

Swamp Spotter is one Next.js app (App Router). Clerk handles sign-in and Supabase
(Postgres) stores the data. The browser never talks to Supabase: every read and
write goes through the app's server code, which holds the secret key.

## Where code goes

| Folder               | What goes there                                                       | Rule                                                                                                       |
| -------------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `src/app/`           | Pages and API routes                                                  | Routing and UI only. A route handler checks its input, calls `src/server/`, and returns a response.        |
| `src/server/`        | Anything that uses secrets, the database, Clerk's API or outside APIs | Every file starts with `import "server-only"`, so the build fails if browser code imports it.              |
| `src/lib/`           | Helpers used by both the browser and the server                       | No secrets, no network calls.                                                                              |
| `src/data/`          | Static data                                                           | `plants.ts` is the only copy of the species list; the guide, forms, validation and plant ID all read it.   |
| `src/types/`         | Types shared by the browser and the server                            | `Submission` (types/submission.ts) is the one shape the API and pages use.                                 |
| `src/components/`    | UI used by more than one page                                         | A component used by a single page lives next to it in a `_components/` folder, and moves here once reused. |
| `src/components/ui/` | Building blocks: `Dialog`, `useConfirm()`, `useToast()`               | Use these instead of `window.confirm()` and `alert()`.                                                     |
| `services/`          | Separate services, such as the plant ID model                         | Their own language and deploy. The app reaches them only through `src/server/`.                            |
| `supabase/`          | Database schema                                                       | `schema.sql` is safe to re-run; re-running it is how a database picks up changes.                          |
| `e2e/`               | Browser tests (Playwright)                                            | See [Testing and checks](#testing-and-checks).                                                             |

The main server modules:

- `server/submissions.ts`: every query on the submissions table, with the
  visibility and ownership rules built in
- `server/dashboard.ts`: the dashboard's numbers and the follow toggle
- `server/authz.ts`: who the user is (`getViewer()`) and their role
- `server/http.ts`: reading request bodies (size limit plus schema) and the
  `{ error }` response shape every endpoint uses
- `server/env.ts`: environment variables, checked at startup

### Route groups

Pages are grouped by purpose. Folder names in parentheses don't appear in URLs,
so `src/app/(app)/map/page.tsx` is served at `/map`.

- `(site)`: home, about, guide
- `(auth)`: sign-in, sign-up (Clerk)
- `(app)`: dashboard, log, map, submit. These have a shared loading screen
  (`loading.tsx`) and error screen (`error.tsx`).

## How requests flow

**Pages load their data on the server.** `/map`, `/log` and `/dashboard` are
server components: they ask `server/` for exactly what this user may see and
hand it to a client component (in `_components/`) for the interactive parts. The
page arrives with its data, with no fetch after it loads.

**Changes go through the API.** Submitting a sighting, for example:

1. `/submit` sends `POST /api/submissions`.
2. The middleware lets it through (anonymous submissions are allowed; see
   `lib/routeAccess.ts`).
3. The route handler reads the body with a size limit and validates it against
   `createSubmissionSchema` (`lib/schemas.ts`), applies the rate limit, then calls
   `createSubmission()` in `server/submissions.ts`.

**Photos are served separately.** Lists never include photo data. Each
submission has a `photoUrl` (`/api/submissions/<id>/photo`) with the same
visibility rules, so the browser downloads only the photos it shows. Photos are
still stored as base64 in the `submissions` table; moving them to Supabase
Storage only changes `getPhoto()` and that route.

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
  is on with no policies, so the public key can't read or write anything.
- **Input:** every request body is size-limited and validated by a schema in
  `lib/schemas.ts`. Plant names must come from the plant list, notes are
  length-limited, and photos must be inline JPEG, PNG or WebP. The photo route
  only ever serves those formats.
- **Output:** pages render user text as text, never as HTML (map popups use
  `textContent`). CSV exports neutralize cells that would run as spreadsheet
  formulas.
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

- **Unit tests** sit next to the code they test: `authz.ts` → `authz.test.ts`.
  They run with Vitest (`npm test`) and mock every outside service.
- **Browser tests** in `e2e/` run with Playwright (`npm run test:e2e`) on a
  desktop and a phone-sized screen. They start a dev server with your
  `.env.local`, read the real database, and never sign in or write anything. To
  run them in CI, add Clerk and Supabase test keys as GitHub secrets. Testing
  signed-in flows also needs a Clerk test account.
- `npm run check` runs lint, typecheck, format check and unit tests. CI runs the
  same checks plus a production build on every pull request.
- Prettier formats everything; don't format by hand.
