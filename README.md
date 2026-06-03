# Job Dashboard

A local-first job application tracker with GitHub-style activity heatmap and a clean, dev-tool aesthetic.

## Stack

- **Vite 5** + **React 18** + **TypeScript 5**
- **Tailwind CSS 3** with custom design tokens
- **Zustand 5** for state, persisted to `localStorage` (with **Zod** validation)
- **Framer Motion** for micro-interactions
- **date-fns** for time math
- **Lucide React** for icons

## Features

- 📊 **6-month activity heatmap** (GitHub-style) with Applications / Interviews toggle
- 📈 **Hero stats** (Applied / Written / 1st / 2nd / 3rd / Offer / Rejected) with response & offer rate
- 🗂 **Sortable, filterable table** with inline status changes
- 📝 **Detail drawer** with autosave and a full **status Timeline** (auto-recorded)
- ➕ Add / edit / delete applications via modal
- 💾 All data stored in `localStorage` — no server, no login
- ⌨️ Keyboard shortcut: press `N` to add a new application

## Design

- 100% light mode, designed to extend to dark later via CSS variables
- Tabular numbers everywhere (`font-feature-settings: 'tnum'`) for a "dashboard" feel
- Status palette is intentionally restrained: grayscale + a single green pop for `Offer`
- Inspired by GitHub, Linear, Vercel, Notion

## Scripts

```bash
npm install      # install dependencies
npm run dev      # start dev server (http://localhost:5173)
npm run build    # production build to dist/
npm run preview  # preview the production build
npm run lint     # type-check only
```

## Project structure

```
src/
├── App.tsx                  # top-level shell + state orchestration
├── main.tsx                 # React entry
├── index.css                # Tailwind base + global styles
├── components/
│   ├── ApplicationDrawer.tsx    # right-side detail panel + Timeline
│   ├── ApplicationForm.tsx      # add / edit modal
│   ├── ApplicationsTable.tsx    # main list with filter + sort
│   ├── Button.tsx
│   ├── Header.tsx               # sticky top bar
│   ├── Heatmap.tsx              # 6-month activity grid
│   ├── HeroStats.tsx            # 7 stat cells
│   ├── Input.tsx                # Input + Textarea
│   ├── Modal.tsx                # generic modal
│   ├── StatusBadge.tsx          # status pill
│   ├── StatusDropdown.tsx       # inline status picker
│   └── Toast.tsx                # ephemeral notifications
├── lib/
│   └── utils.ts                 # cn(), date helpers, stats, heatmap builder
├── store/
│   └── useStore.ts              # Zustand store with localStorage persistence
└── types/
    └── index.ts                 # Zod schemas + TS types
```

## Roadmap

- Dark mode (CSS variable structure is already in place)
- ⌘K command palette
- Import / export (JSON / CSV)
- Tags, salary, referrer fields
- Response-rate trend chart

## License

MIT — do whatever you want.
