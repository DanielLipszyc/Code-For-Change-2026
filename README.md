# Swamp Spotter

## Code For Change 2026

A mobile-friendly invasive plant species mapper built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 15 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Postgres)
- **Auth:** Clerk
- **Styling:** Tailwind CSS
- **Testing:** Vitest
- **Linting and formatting:** ESLint, Prettier

## Features

- 📱 Mobile-first responsive design
- 🎨 Modern UI with Tailwind CSS
- ⚡ Fast page loads with Next.js App Router
- 📦 PWA-ready with manifest

## Pages

1. **Home** (`/`) - Landing page with features and account creation
2. **About** (`/about`) - Mission, values, and team info
3. **Submit** (`/submit`) - Plant sighting submission form
4. **Invasive Plant Guide** (`/guide`) - Information about each species
5. **My Log** (`/log`) - Searchable log of user's submissions
6. **Map** (`/map`) - Interactive invasive plant species map
7. **Dashboard** (`/dashboard`) - Personal stats and other observers

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
`submissions` and `follows` tables. The script is safe to re-run, and re-running
it is how an existing database picks up schema changes.

### Installation

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## Scripts

| Command                 | What it does                                          |
| ----------------------- | ----------------------------------------------------- |
| `npm run dev`           | Start the development server                          |
| `npm run build`         | Build for production                                  |
| `npm start`             | Run the production build                              |
| `npm test`              | Run the unit tests (`npm run test:watch` to rerun)    |
| `npm run lint`          | Lint with ESLint                                      |
| `npm run typecheck`     | Type-check with TypeScript                            |
| `npm run format`        | Format everything with Prettier                       |
| `npm run check`         | Lint, typecheck, format check and tests in one go     |
| `npm run promote-admin` | Make a user an admin: `npm run promote-admin <email>` |

## Project Structure

```
src/
├── app/
│   ├── (site)/        # Home, about, guide
│   ├── (auth)/        # Sign-in, sign-up
│   ├── (app)/         # Dashboard, log, map, submit
│   └── api/           # API routes
├── server/            # Server-only code: database, auth checks, rate limits, plant ID
├── lib/               # Helpers shared by browser and server
├── data/              # Plant list and county boundary
├── types/
├── components/
└── middleware.ts
services/              # Separate services (plant ID model)
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
