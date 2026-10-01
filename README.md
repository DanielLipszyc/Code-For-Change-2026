# Swamp Spotter
## Code For Change 2026

A mobile-friendly invasive plant species mapper built with Next.js, TypeScript, Supabase, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** Supabase (Postgres)
- **Auth:** Clerk
- **Styling:** Tailwind CSS
- **Linting:** ESLint

## Features

- 📱 Mobile-first responsive design
- 🎨 Modern UI with Tailwind CSS
- ⚡ Faster dashboard data loads through short-lived server-side caching
- 🌿 Guided dashboard onboarding for new users
- 🧪 Demo dashboard access for local testing (`/dashboard?demo=1`)
- 🖼️ Optimized image loading for the home page slideshow
- 📦 PWA-ready with manifest

## Pages

1. **Home** (`/`) - Landing page with features and account creation
2. **About** (`/about`) - Mission, values, and team info
3. **Submit** (`/submit`) - Plant sighting submission form
4. **Invasive Plant Guide** (`/guide`) - Information about each species
5. **My Log** (`/log`) - Searchable log of user's submissions
6. **Dashboard** (`/dashboard`) - Onboarding-focused activity summary and network overview
7. **Map** (`/map`) - Interactive invasive plant species map

## Performance Notes

- Dashboard payloads are cached for a short interval to reduce repeated database and Clerk lookups.
- New users see a guided onboarding section that directs them to report, explore, and track progress.
- The home page slideshow avoids loading all slide images at once by rendering only the active and adjacent images.

## Demo Access

For local testing without a Clerk account, use the demo login button on the sign-in page or visit:

```text
/dashboard?demo=1
```

This enables a local demo user so the dashboard can be tested for onboarding, follow toggles, and summary cards during development.

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

### Environment variables

Create a `.env.local` file in the project root:

```bash
# Clerk (https://dashboard.clerk.com -> API Keys)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Supabase (Project Settings -> API Keys)
SUPABASE_URL=https://<project-ref>.supabase.co
SUPABASE_SECRET_KEY=sb_secret_...   # the "Secret key", server-only, never expose to the browser

# Optional: enables the photo-based plant ID feature
GEMINI_API_KEY=...
```

### Database setup

Open the Supabase dashboard, go to **SQL Editor**, paste the contents of
[`supabase/schema.sql`](supabase/schema.sql), and run it. This creates the
`submissions` and `sightings` tables.

### Installation

```bash
# Install dependencies
npm install

# Run development server
npm run dev

# Build for production
npm run build

# Start production server
npm start
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Testing

```bash
npm test
```

This runs ESLint, TypeScript typechecking, the Vitest API/unit suite, a production build, and Playwright browser workflows. Run the unit/API layer alone with `npm run test:unit`. Browser tests require Chromium, installed with `npx playwright install chromium`.

GitHub Actions runs the same checks, CodeQL SAST, dependency review, a production npm audit report, an OWASP ZAP baseline scan, and a k6 load profile. Add `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` and `CLERK_SECRET_KEY` as repository Actions secrets so the production build and browser server can initialize Clerk. Start a higher-volume k6 stress run with **Actions → Integration tests → Run workflow → Run the higher-volume stress profile**. Dependabot checks npm and GitHub Actions dependencies weekly.

## Project Structure

```
src/
├── app/
│   ├── layout.tsx        # Root layout with navigation
│   ├── page.tsx          # Home page
│   ├── globals.css       # Global styles
│   ├── about/
│   │   └── page.tsx      # About page
│   ├── map/
│   │   └── page.tsx      # map page
│   ├── dashboard/
│   │   └── page.tsx      # Dashboard page
│   └── contact/
│       └── page.tsx      # Contact page
└── components/
    └── Navigation.tsx    # Mobile-responsive navigation
```

## License

See [LICENSE](LICENSE) for details.
