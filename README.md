# Swamp Spotter

## Code For Change 2026

A mobile-friendly invasive plant species mapper built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database and photos:** Supabase (Postgres and Storage)
- **Auth:** Clerk
- **Map:** Leaflet with OpenStreetMap tiles
- **Plant ID:** BioCLIP 2 on Modal (`services/plant-id/`)
- **Offline:** IndexedDB and a service worker (Serwist)
- **Styling:** Tailwind CSS
- **Testing:** Vitest, Playwright
- **Linting and formatting:** ESLint, Prettier

## Features

- 📱 Mobile-first responsive design
- 📡 Works offline: reports are saved on the device and sent when there's a connection
- 🗺️ A map that loads with its sightings and stays put while you filter
- 🤖 AI plant suggestions from a photo
- 🌎 English, Spanish, and Portuguese interface with a saved language preference
- 🧪 Read-only sample dashboard demo for local development only
- 📦 Installable (web app manifest and service worker)

## Pages

1. **Home** (`/`) - Landing page with features and account creation
2. **About** (`/about`) - Mission, values, and team info
3. **Submit** (`/submit`) - Plant sighting submission form; works offline
4. **Drafts** (`/drafts`) - Reports saved on this device, waiting to be finished or sent
5. **Invasive Plant Guide** (`/guide`) - Species information and identification tips in English, Spanish, and Portuguese
6. **My Log** (`/log`) - Searchable log of user's submissions
7. **Map** (`/map`) - Interactive invasive plant species map, with a List view
8. **Dashboard** (`/dashboard`) - Personal stats and other observers

### Languages

Choose English, Spanish, or Portuguese from the language selector in the navigation.
Your choice is saved in this browser and applied across the app. Plant names and
identification tips in the guide and report forms are localized while report data
continues to use each plant's canonical English name.

### Local demo

While running `npm run dev`, open
[`http://localhost:3000/dashboard?demo=1`](http://localhost:3000/dashboard?demo=1)
to view the dashboard with sample data without signing in. The demo is read-only.
It is enabled only when `NODE_ENV` is `development`; production builds and
production routes never expose the demo.

## Getting Started

### Prerequisites

- Node.js 22 or newer
- npm

### Environment variables

Copy the example file and fill in your keys:

```bash
cp .env.example .env.local
```

[`.env.example`](.env.example) explains where each value comes from. Never commit `.env.local`.

### Database setup

Open the Supabase dashboard, go to **SQL Editor**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
tables and the private `submission-photos` Storage bucket. The script is safe to
re-run, and re-running it is how an existing database picks up schema changes.

If the database has photos from before they moved to Storage, move them once:

```bash
npm run photos:move-to-storage              # lists what it would move
npm run photos:move-to-storage -- --apply   # moves them
```

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command                          | What it does                                                           |
| -------------------------------- | ---------------------------------------------------------------------- |
| `npm run dev`                    | Start the development server                                           |
| `npm run build`                  | Build for production                                                   |
| `npm start`                      | Run the production build                                               |
| `npm test`                       | Run the unit tests (`npm run test:watch` to rerun)                     |
| `npm run test:e2e`               | Run the browser tests (see below)                                      |
| `npm run test:perf`              | Check the map's loading time (runs on its own)                         |
| `npm run lint`                   | Lint with ESLint                                                       |
| `npm run typecheck`              | Type-check with TypeScript                                             |
| `npm run format`                 | Format everything with Prettier                                        |
| `npm run check`                  | Lint, typecheck, format check and tests in one go                      |
| `npm run promote-admin`          | Make a user an admin: `npm run promote-admin <email>`                  |
| `npm run plant-id:species`       | Regenerate the plant ID model's species list from `src/data/plants.ts` |
| `npm run photos:move-to-storage` | Move photos stored in the database to Storage (see above)              |

### Browser tests

The browser tests build the app and start the production server with your
`.env.local`, and only read data. Install the browser once, then run them:

```bash
npx playwright install chromium
npm run test:e2e
```

## Project Structure

```
src/
├── app/
│   ├── (site)/        # Home, about, guide
│   ├── (auth)/        # Sign-in, sign-up
│   ├── (app)/         # Dashboard, log, map, submit, drafts (each page's own UI in _components/)
│   ├── api/           # API routes
│   └── sw.ts          # Service worker
├── server/            # Server-only code: database, photos, auth checks, rate limits, plant ID
├── client/            # Browser-only code: offline report store and sender
├── lib/               # Helpers shared by browser and server
├── data/              # Plant list and county boundary
├── types/
├── components/        # Shared UI; ui/ has Dialog, confirm and toast
└── middleware.ts
e2e/                   # Browser tests (Playwright)
services/plant-id/     # The plant ID model (Python, deployed on Modal)
scripts/               # Admin and data scripts
supabase/              # Database schema
docs/                  # Architecture notes
```

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for what goes where and why.

## Contributing

1. Branch from `main`.
2. Run `npm run check` before opening a pull request.
3. CI must pass before merging.

## License

See [LICENSE](LICENSE) for details.
