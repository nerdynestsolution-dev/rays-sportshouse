# Ray's SportsHouse — Soulard, St. Louis, MO 🐅🏈🥊

High-performance, multi-page static website (SSG) built with **Astro**, **Tailwind CSS**, and **Lucide Icons** for **Ray's SportsHouse** (`1732 S 9th St, St. Louis, MO 63104`), engineered for ultra-fast edge delivery on **Cloudflare Pages**.

## Quick Start

```bash
# Install dependencies
npm install

# Start local development server (http://localhost:4321)
npm run dev

# Build static production bundle into ./dist
npm run build

# Preview production build locally
npm run preview
```

## Updating Menu, Events, Specials & Hours (No Code Required)

All dynamic bar content lives in clean, modular JSON files inside `src/data/`:

- **`src/data/menu.json`**: Update food & drink categories (`Game Day Wings`, `Burgers`, `Sliders`, `Shareables`, `Draft Beers`, `Pitchers & Buckets`, `House Cocktails`, `Seltzers & Cans`), wing flavors, prices, descriptions, and the Square POS URL (`https://rayssportshouse.square.site/`).
- **`src/data/events.json`**: Update watch party schedules (Mizzou Football Saturdays, NFL Sunday Ticket & RedZone, UFC PPVs, F1 Grand Prix mornings, St. Louis CITY SC, Cardinals/Blues, and Wednesday Trivia).
- **`src/data/specials.json`**: Update Monday–Friday Happy Hour (`2:00 PM – 6:00 PM`), half-priced bar bites, Game Day specials, weekly operating hours, address, phone number, and Google Maps URLs.
- **`src/data/gallery.json`**: Add or update masonry photo gallery cards and tags.

## Cloudflare Pages Deployment Settings

- **Framework Preset**: `Astro`
- **Build Command**: `npm run build`
- **Build Output Directory**: `dist`
- **Node.js Version**: `20` or `22`
