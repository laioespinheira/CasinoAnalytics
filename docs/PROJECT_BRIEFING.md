# Casino Analytics Studio — Project Briefing

> **Purpose:** Paste this whole file into Claude (or any LLM) as the first message to bring it
> fully up to speed on this project, then chat. It is self-contained — current as of June 2026
> and reflects the live code in `master`. For deeper internals see `docs/PROJECT_CONTEXT.md`.

---

## 1. What this is

**Casino Analytics Studio** is an interactive casino-operations workbench. It pairs an
**interactive 3D casino floor** (React Three Fiber) with **analytics panels**. An analyst filters
the floor by zone, week, day, hour, machine type, game, occupancy, and customer tier; the floor
recolors (heat map or occupancy gradient) and right-side drawer panels explain *where revenue and
demand concentrate* and *where banks are capacity-constrained*.

- **Production:** https://casino-floormap.vercel.app
- **Repo:** https://github.com/laioespinheira/CasinoAnalytics (production branch `master`)
- **Data:** Real FY26-derived metrics shipped as pre-built JSON files (no live API). Some legacy
  analytics dashboards still use mock generators.

---

## 2. Tech stack & commands

| Layer | Choice |
|-------|--------|
| UI | React 18, Vite 7, Tailwind 4 (plus heavy inline styles) |
| 3D | Three.js `^0.178`, `@react-three/fiber` `^8`, `@react-three/drei` `^9` |
| GUI controls | `lil-gui` (lighting/color dev panel) |
| Data build | Python 3 + `pyarrow`/`pandas` |
| Hosting | Vercel (Git-connected, auto-deploy on push to `master`) |

```bash
npm install && npm run dev                    # local dev (Vite; see vite.config.js for port — 3000)
npm run build:data                            # rebuild casino_data.json (needs local CSV + egm parquet)
python scripts/build_customer_tier_data.py    # rebuild customer_tier_data.json (needs floorpulse parquet + CSV)
npm run build                                 # production bundle -> dist/
npm run lint                                  # eslint (js,jsx), max-warnings 0
git push origin master                        # primary deploy path (Vercel builds; does NOT run Python)
npm run deploy                                # CLI fallback: npx vercel --prod --yes
```

**Important:** Vercel does **not** run the Python data builds. The committed `public/assets/*.json`
(`casino_data.json` ~30 MB, `customer_tier_data.json`) ship as-is — rebuild locally and commit the
JSON when source data changes. `vercel.json` pins the Vite preset and sets a 1-year immutable
cache on `/assets/*.json`; `.vercelignore` keeps parquet/CSV/`.bak`/notebooks/`scripts/`/`docs/`/
`photos/` out of the deploy.

---

## 3. Architecture & data flow

```
Local-only sources                Build (run locally)            React app (committed JSON)
------------------                -------------------            --------------------------
casino_data.csv  ───┐
egm_fy26_extract.parquet ─→ build_casino_dataset.py ─→ casino_data.json ─────┐
                                                                              ├─→ useCasinoData.js ─→ 3D floor + panels
floorpulse_masked.parquet ─→ build_customer_tier_data.py ─→ customer_tier_data.json ─→ useCustomerTierData.js ─→ Customer Demand panel
casino_data.csv  ───┘
```

- **Runtime fetch:** `useCasinoData.js` fetches `/assets/casino_data.json`;
  `useCustomerTierData.js` lazily fetches `/assets/customer_tier_data.json` when its panel opens.
- **Join chain:** parquet `Location`/`CasinoLocation` = CSV `machineFullName` → catalog
  `blender_id` → 3D mesh object name in the GLB. A row's `blender_id` is the mesh it colors.
- **3D asset:** `public/models/casino_floor_map.glb` (~12 MB, committed).
- **Top-level views:** `App.jsx` switches `currentView` between `analytics` (dashboards) and `3d`
  (the floor). In 3D, `viewMode` is one of `overall`, `heatmap`, `comparison`, `time`. All the
  rich panels and the customer-tier features live in **`heatmap`** mode.

---

## 4. Data model — DD vs non-DD (key concept)

The main JSON is **column-oriented** (`{ field: [v0, v1, …] }`); the hook reshapes it into row
objects, parses `turnover`/`stroke` to floats, and merges zones D/E/F into `Zone DD`.

Rows split into two classes by whether `date` is set:

- **DD rows** (`date` = e.g. `"2026-01-15"`, `week_ending` set): real ratings data with full
  metrics — `occupancy` (measured float `[0,1]`), `win`, `avg_bet`, `dominant_tier`.
- **Non-DD rows** (`date === null`, `week_ending === null`): older weekday-averaged data for the
  rest of the floor. `win`/`avg_bet`/`occupancy`/`dominant_tier` are `null`.

A "DD machine" has ≥1 DD row; a "non-DD machine" has only non-DD rows.

| Field | Notes |
|-------|-------|
| `blender_id` | Machine id; also the 3D mesh name |
| `machineFullName` | Display name |
| `zone` | e.g. `Zone DD`, `Zone A`; D/E/F merged to `Zone DD` at load |
| `location` | Bank/table label within a zone |
| `machineType` | `eTGs`, `Tables`, `Classic`, `Round Banks`, … |
| `game_type` | Single canonical game title (August week-1 pin, see below) |
| `weekday` | Real field on every row (do NOT derive from `date`) |
| `hour` | Hour of day (number or `"H:00"`) |
| `date`, `week_ending` | DD only; `null` for non-DD |
| `turnover`, `stroke` | Float metrics (both classes) |
| `occupancy` | Measured fraction `[0,1]` = minutes seated / 60. DD only |
| `win`, `avg_bet`, `dominant_tier` | DD only |

**Occupancy semantics:** `occupancy` is a real measured float (not derived from turnover).
`OCCUPANCY_THRESHOLD = 0.85` (named export from `useCasinoData.js`) is the data-derived "knee" of
the peak-hour distribution and defines "occupied / high demand / saturated". Per-machine occupancy
across filtered rows = **mean** of valid (non-null) values.

**August week-1 `game_type` pin:** `build_casino_dataset.py` pins each machine to its
highest-turnover title during 2025-08-01..2025-08-07, so the UI shows one canonical game per
machine instead of "multiple titles this hour". Fallbacks: top FY game by turnover, then CSV
`game_type`.

---

## 5. Filters

`App.filters` is the single source of truth, passed to both the floor and the panels:

```js
{ zone, machineType: [], gameType, occupancy, dayOfWeek, hourOfDay, weekEnding }
// default: { zone:'all', machineType:[], gameType:'all', occupancy:'vacant',
//           dayOfWeek:'all', hourOfDay:'all', weekEnding:'all' }
```

- Entering heatmap mode sets defaults `hourOfDay:6, dayOfWeek:'Saturday', weekEnding:'all'`.
- `NavigationBar` holds local filter state and emits via `onFilterChange`; `App` merges
  (`setFilters(prev => ({ ...prev, ...newFilters }))`) so App-only fields survive.
- **`getFilteredData(filters)` rules:** `zone`/`machineType[]`/`gameType`/`dayOfWeek` (via
  `row.weekday`)/`hourOfDay` match both classes. `weekEnding` matches `row.week_ending`, which
  **naturally excludes non-DD rows** (theirs is null); `'all'` includes everything. `occupancy`:
  `'all'` = no filter, `'occupied'` = `>= 0.85`, otherwise `< 0.85` (null-occupancy rows dropped
  when a specific occupancy filter is set). Results cached in a small ref-based LRU (~16 entries).
- Most panel helpers call `getFilteredData({ ...filters, occupancy:'all' })` then apply a
  **DD-only guard** (`.filter(r => r.date != null)`). The heat map intentionally shows both classes.

---

## 6. `useCasinoData` API (hook: `src/hooks/useCasinoData.js`)

| Export | Purpose |
|--------|---------|
| `casinoData`, `loading`, `error` | Raw reshaped dataset + load state |
| `OCCUPANCY_THRESHOLD` | `0.85` constant, reused by 3D + cards + tier hook |
| `getFilteredData(filters)` | Rows matching all filters (cached) |
| `getDataByBlenderId(id)` | First catalog row for a machine |
| `getHeatMapData` / `getDailyHeatMapData(filters)` | Per-machine / day-level heat aggregation + percentiles |
| `getZoneAggregates` / `getBankAggregates(filters)` | Per-zone / per-bank rollups (DD-guarded) |
| `getDDBankRanking` / `getBankRankings(filters)` | Bank rankings by avg turnover |
| `getBankTrend(bankKey, filters)` | Hourly trend buckets for one bank |
| `getZoneOccupancy(zone, filters)` | Mean-based occupancy metrics (headline = mean fill %, plus ≥85% saturation count) + `occupancyDrivers` |
| `getZoneGameMix(zone, filters)` | Games with `machineIds`, sorted by total turnover |
| `getPerformanceInsights(zone, filters)` | Banks, game families, pockets, verdict, drivers — feeds `InsightPanel` |
| `getMachineMetrics(blenderId, filters)` | Single-machine slice, or a truthy `{ noData: true, … }` sentinel |
| `getUniqueLocations` / `getMachinesByLocation` | Catalog lookups |

`getMachineMetrics` returns a **truthy** `noData` sentinel (not `null`) so `… || fallback` callers
don't reintroduce stale data; `MachineDetailCard` renders a no-data state from it.

---

## 7. 3D floor coloring & interaction (`CasinoModel.jsx`)

- Colors: `MUTED_GRAY '#374151'` (non-DD / low-occupancy DD in binary mode),
  `NO_DATA_GRAY '#9ca3af'` (DD machine with data elsewhere but **no rows in the current filter**).
- **Heatmap mode:** color by **mean turnover per machine-hour** (not sum) so multi-week DD
  machines don't drown out weekday-averaged non-DD machines; percentiles recompute over those means.
- **Overall/occupancy mode:** specific hour → binary (mean occ `>= 0.85` red, else muted); no
  specific hour → continuous blue→orange→red occupancy gradient (interpolated in **sRGB component
  space**, a custom helper, to avoid purple midpoints).
- **Highlighting:** when a panel row is selected, `App` turns `highlightTarget.machineIds` into a
  `Set` (`highlightedMachineIds`) and the model **dims everything not in the set**. Only
  `machineIds` matters to the floor; the highlight `type`/`key` are panel-side identity.
- **Interaction:** non-DD machines aren't clickable for detail (minimal name+zone tooltip only).
  DD machines: first click pins `MachineTooltip`, second click opens `MachineDetailCard`. Bank
  hover shows `BankHoverTooltip` ("Averaged data only" for non-DD banks).

---

## 8. Panels & views

- **Analytics dashboard** (`BasicDashboard.jsx` + friends): legacy view, partly mock data
  (`src/data/casinoMockData.js`, `src/utils/mockDataGenerator.js`).
- **Heatmap right-drawer panels** — two **mutually-exclusive** drawers, toggled by buttons in
  `NavigationBar` ("Insights" indigo, "Customer Demand" sky-blue); opening one closes the other,
  closing both clears the highlight. Only present in `viewMode === 'heatmap'`:
  - **`InsightPanel.jsx`** ← `getPerformanceInsights` (+ `getZoneOccupancy` as `occupancy`). The
    **merged performance + occupancy panel**. Area-snapshot hero (turnover, occupancy %,
    high-demand count), verdict, generated "commercial readout", revenue-leading banks, product
    drivers (game families), demand drivers (busiest banks + most-played products), and revenue-
    concentration "pockets". *(This replaced the older `OccupancyPanel` + `GameMixPanel`, which are
    still in the tree but no longer imported — legacy/dead.)*
  - **`CustomerDemandPanel.jsx`** ← `useCustomerTierData.getCustomerDemandInsights`. The customer-
    tier lens (see §9). Tier snapshot hero, stat cards, commercial readout, demand hotspots,
    flagged capacity constraints, and product drivers — all allocated to the selected tier.
- **Comparison mode** (`ComparisonPanel`, `FloorSummaryPanel`): exists; partly mock data.

`highlightTarget` shape: `{ type, key, label, machineIds }`. `type` ∈ `'bank' | 'family' | 'pocket'`
(InsightPanel) or `'tier_select' | 'tier_hotspot' | 'tier_family'` (CustomerDemandPanel).

---

## 9. Customer Demand lens (the newest feature)

A demand-side overlay: "which customer tiers drive this slot, and where are they capacity-
constrained?" — without ever shipping patron-level data.

- **Hook:** `src/hooks/useCustomerTierData.js`,
  `useCustomerTierData(casinoData, getFilteredData, enabled)`. **Lazy:** fetches the tier JSON only
  the first time `enabled` is true (panel opened), guarded by a `requestedRef`. **DD-only.**
- **Share-based allocation (the trick):** the JSON stores **stable shares** per
  `(blender_id, weekday, hour, tier)` — `share_turnover`, `share_stroke`, `share_occ` (each the
  tier's fraction of that machine-hour cell, averaged over weeks) — **not** absolute sums. At
  runtime the hook multiplies those shares by the floor's **actual week-specific filtered**
  turnover/stroke/occupancy, so tier totals reconcile **exactly** with the floor for any filter.
  `selectedTier === 'all'` uses share `1` (the whole floor).
- **`getCustomerDemandInsights(filters, selectedTier)`** → `{ tier, snapshot, floorAvgBet,
  hotspots, constraints, products, topZones, tierMachineIds, saturationThreshold }`, or a status
  object `{ loading }` / `{ error }` / `{ empty, noMatch }`. Bank `flag` ∈ `tier_demand_hotspot`,
  `product_supply_constraint`, `fully_occupied_low_avg_bet` (saturated but avg bet < 90% of floor),
  `premium_underutilised` (PLATINUM/BLACK soft despite supply). Thresholds:
  `SATURATION_THRESHOLD = 0.85`, `TIER_DOMINANCE_SHARE = 0.4`, `UNDERUTILISED_THRESHOLD = 0.4`.
- **Build:** `scripts/build_customer_tier_data.py` reads `floorpulse_masked.parquet` (masked rating
  sessions, local-only), explodes each session across the hours it touches (seconds-apportioned
  turnover/win/strokes, mirroring `casino data wrangling.ipynb`), joins the CSV catalog, merges
  D/E/F → `Zone DD`, computes per-cell tier shares, and writes `customer_tier_data.json` (columnar,
  rounded shares, **aggregated counts only — no patron_key/names**).

---

## 10. Game families (`src/utils/gameFamilies.js`)

- Titles with ` - ` → family is the prefix (`TREE OF WEALTH - JADE ETERNITY` → `TREE OF WEALTH`).
- Titles without ` - ` → auto-cluster by first two words when ≥2 titles share that prefix.
- `familyIndex` built once from the catalog via `buildTwoWordFamilyIndex`, passed into
  `parseGameFamily`. The Python build re-implements the same logic so families match.

---

## 11. Project layout

```
CasinoAnalytics/
├─ docs/  PROJECT_BRIEFING.md (this) · PROJECT_CONTEXT.md (detailed) · PROJECT_STATUS.md (older)
├─ public/
│  ├─ assets/  casino_data.json · customer_tier_data.json   (committed runtime JSON)
│  │           casino_data.csv                               (catalog + intraday shape; build input)
│  │           egm_fy26_extract.parquet · floorpulse_masked.parquet   (local-only build inputs)
│  └─ models/  casino_floor_map.glb
├─ scripts/  build_casino_dataset.py · build_customer_tier_data.py
├─ src/
│  ├─ App.jsx                       (views, filters, panels, highlight wiring)
│  ├─ hooks/  useCasinoData.js · useCustomerTierData.js
│  ├─ components/  CasinoScene.jsx · CasinoModel.jsx · NavigationBar.jsx
│  │              InsightPanel.jsx · CustomerDemandPanel.jsx          (active drawers)
│  │              OccupancyPanel.jsx · GameMixPanel.jsx               (LEGACY — not imported)
│  │              MachineTooltip.jsx · MachineDetailCard.jsx · BankHoverTooltip.jsx · BankLabel.jsx
│  │              ComparisonPanel.jsx · FloorSummaryPanel.jsx · BasicDashboard.jsx · GUI.jsx
│  ├─ utils/  gameFamilies.js · format.js · analyticsEngine.js · mockDataGenerator.js
│  └─ data/   casinoMockData.js
├─ vercel.json · .vercelignore · package.json · vite.config.js
```

---

## 12. Known limitations / candidate next steps

- **Mock vs real:** the analytics dashboard and comparison mode still use mock generators.
- **Legacy panels:** `OccupancyPanel.jsx` / `GameMixPanel.jsx` are dead code — candidates for
  deletion now that `InsightPanel` covers them.
- **README drift:** root `README.md` still references CSV fetch and port 5173 (actual: JSON, 3000).
- **Large committed JSON (~30 MB):** fine for now; consider CDN/lazy-load or Git LFS later.
- **Bundle size:** production JS is large (Vite warns); code-splitting optional.
- **First-click vs detail:** first-click `MachineTooltip` may briefly show zeroed metrics for a
  no-data DD machine before the second-click no-data card.
- **Tests:** none yet for `gameFamilies.js`, `getFilteredData` (weekEnding/occupancy),
  `getZoneOccupancy` mean math, or the tier-share allocation.

---

## 13. Good things to chat about

1. Should the legacy `OccupancyPanel`/`GameMixPanel` be deleted, or kept for reference?
2. Validate the tier-share allocation: does reconstructed tier turnover sum back to the floor for
   edge filters (sparse hours, single week)?
3. Wire comparison mode and the analytics dashboard to real (parquet-backed) data.
4. Move the ~30 MB JSON off git (CDN) and lazy-load per zone?
5. Add a test suite (game families, filters, occupancy means, tier allocation).
6. Bring `README.md` in line with the real data flow and ports.
