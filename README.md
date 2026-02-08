# Swamp Spotter
# Code For Change 2026

A mobile-friendly invasive plant species mapper built with Next.js, TypeScript, MongoDB, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Database:** MongoDB
- **Styling:** Tailwind CSS
- **Linting:** ESLint

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
6. **Map** (`/Map`) - Interactive invasive plant species map

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn

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