# Code For Change 2026

A mobile-friendly web application built with Next.js, TypeScript, and Tailwind CSS.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Linting:** ESLint

## Features

- 📱 Mobile-first responsive design
- 🎨 Modern UI with Tailwind CSS
- 🌙 Dark mode support
- ⚡ Fast page loads with Next.js App Router
- 📦 PWA-ready with manifest

## Pages

1. **Home** (`/`) - Landing page with hero and features
2. **About** (`/about`) - Mission, values, and team info
3. **Services** (`/services`) - Service offerings grid
4. **Dashboard** (`/dashboard`) - Interactive dashboard with stats
5. **Contact** (`/contact`) - Contact form and info

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
│   ├── services/
│   │   └── page.tsx      # Services page
│   ├── dashboard/
│   │   └── page.tsx      # Dashboard page
│   └── contact/
│       └── page.tsx      # Contact page
└── components/
    └── Navigation.tsx    # Mobile-responsive navigation
```

## License

See [LICENSE](LICENSE) for details.