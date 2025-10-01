# Casino Analytics Studio

An interactive casino-operations workbench that pairs a 3D casino floor model with rich performance dashboards. The project explores how analysts can move between an immersive floor view and modern KPI visualisations while experimenting with styling, lighting, and data exploration flows.

## Project Goals
- Deliver a responsive analytics experience that feels modern, lightweight, and easy to scan.
- Visualise casino performance trends using mock data first, with the intention to plug in real feeds later.
- Showcase the 3D casino floor, including heat-map and occupancy overlays that react to dashboard filters.
- Iterate quickly on UI/UX ideas while keeping the tech stack approachable (React + Vite + Tailwind + React Three Fiber).

## Getting Started
```bash
npm install
npm run dev
```
Vite serves the app at `http://localhost:5173/` (default). Hot module reload is enabled for React and Three.js edits.

## Core Structure
- `src/App.jsx` – Top-level view switcher between the analytics dashboards and the 3D scene. Manages filters, lighting, and colour controls.
- `src/components/NavigationBar.jsx` – Sticky navigation with filter controls, hour slider, and the analytics/3D toggle.
- `src/components/BasicDashboard.jsx` – Primary analytics view backed by generated sample data. Includes headline metrics, trend cards, and performance tables.
- `src/components/CasinoScene.jsx` & `src/components/CasinoModel.jsx` – Orbit-enabled Three.js scene that loads the `casino_floor_map.glb` model and applies filter-driven highlights or heat-map palettes.
- `src/hooks/useCasinoData.js` – Fetches `/public/assets/casino_data.csv`, enriches the dataset with occupancy logic, and exposes helpers for filtering/heat maps.

## Data Sources
- `/src/data/casinoMockData.js` generates `sampleData` and summary stats used by the analytics dashboards.
- `/public/assets/casino_data.csv` powers the 3D scene overlays via the `useCasinoData` hook.
- Additional CSVs in `public/assets` are historical or backup datasets kept for reference.

## Working on the 3D Experience
- GLB model lives in `public/models/casino_floor_map.glb`.
- Heat map colours and occupancy highlights are currently controlled in `CasinoModel.jsx` (`getHeatMapColor` and the filter handlers).
- Lighting, camera, and LIL-GUI controls are all adjustable from the UI when the 3D view is active.

## UI/UX Notes
- Tailwind CSS is available for rapid styling in tandem with custom inline styles.
- The design direction is to stay minimal, with soft gradients, cards, and responsive grids.
- Filters and dashboards share the same state so future work can align the analytics tables with the 3D canvas.

## Next Steps
- Align dashboard metrics with the real CSV feed once data cleaning is complete.
- Continue polishing the navigation and card layout for mobile/tablet breakpoints.
- Introduce automated tests or visual regression snapshots when the UI stabilises.

