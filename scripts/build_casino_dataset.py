"""
Join FY26 parquet metrics to the CSV machine catalog (blender_id / zone / location).
Output: public/assets/casino_data.json — same row shape as casino_data.csv for the app.

Join key: parquet "Location" == CSV "machineFullName" (EGM seat / asset id).

Grain: For each machine, weekday, and **one** game title (canonical assignment), average
that game's daily turnover (and stroke) over all calendar dates of that weekday in the
parquet extract. Within each day, hourly values use the original CSV intraday **shape**
(normalized weights per hour) so totals match the parquet daily average while
hour-by-hour values vary for heatmaps.

**game_type** is pinned per machine from **August week 1** (Aug 1–7) in the parquet:
the game with the highest turnover that week. Only that title is emitted per machine.

Machines with no parquet rows keep their original CSV rows unchanged.
"""
from __future__ import annotations

import csv
import json
from collections import defaultdict
from datetime import date, datetime
from pathlib import Path

import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
CSV_PATH = ROOT / "public" / "assets" / "casino_data.csv"
PARQUET_PATH = ROOT / "public" / "assets" / "egm_fy26_extract.parquet"
OUT_PATH = ROOT / "public" / "assets" / "casino_data.json"

MERGED_ZONES = {"Zone D", "Zone E", "Zone F"}


def norm_zone(z: str) -> str:
    z = (z or "").strip()
    return "Zone DD" if z in MERGED_ZONES else z


def to_date_str(dt) -> str:
    if dt is None:
        return ""
    if isinstance(dt, datetime):
        return dt.date().isoformat()
    if isinstance(dt, date):
        return dt.isoformat()
    if hasattr(dt, "date") and callable(dt.date):
        return dt.date().isoformat()
    s = str(dt)
    return s[:10] if len(s) >= 10 else s


def to_date(dt) -> date | None:
    if dt is None:
        return None
    if isinstance(dt, datetime):
        return dt.date()
    if isinstance(dt, date):
        return dt
    if hasattr(dt, "date") and callable(dt.date):
        return dt.date()
    s = str(dt)
    if len(s) >= 10:
        try:
            return date.fromisoformat(s[:10])
        except ValueError:
            return None
    return None


def detect_august_week1_range() -> tuple[date, date]:
    """Return Aug 1–7 for the only August year present in the parquet."""
    august_years: set[int] = set()
    pf = pq.ParquetFile(PARQUET_PATH)
    for batch in pf.iter_batches(columns=["Date"], batch_size=65536):
        for dt in batch.column(0).to_pylist():
            d = to_date(dt)
            if d and d.month == 8:
                august_years.add(d.year)
    if not august_years:
        raise SystemExit("No August dates found in parquet")
    if len(august_years) > 1:
        raise SystemExit(f"Expected one August year, found: {sorted(august_years)}")
    year = next(iter(august_years))
    return date(year, 8, 1), date(year, 8, 7)


def build_canonical_game_by_bid(
    daily_raw: dict[tuple[str, str, str], dict[str, float]],
    week_start: date,
    week_end: date,
) -> dict[str, str]:
    """Per machine: game with highest turnover during August week 1."""
    week_tot: dict[tuple[str, str], float] = defaultdict(float)
    for (bid, ds, g), agg in daily_raw.items():
        d = date.fromisoformat(ds)
        if week_start <= d <= week_end:
            week_tot[(bid, g)] += agg["turnover"]

    by_bid: dict[str, list[tuple[str, float]]] = defaultdict(list)
    for (bid, g), t in week_tot.items():
        by_bid[bid].append((g, t))

    canonical: dict[str, str] = {}
    for bid, pairs in by_bid.items():
        pairs.sort(key=lambda x: -x[1])
        canonical[bid] = pairs[0][0]
    return canonical


def fallback_game_for_bid(
    bid: str,
    game_tot: dict[tuple[str, str], float],
    fallback_rows: list[dict],
) -> str:
    pairs = [(g, game_tot[(bid, g)]) for (b, g) in game_tot if b == bid]
    if pairs:
        pairs.sort(key=lambda x: -x[1])
        return pairs[0][0]
    for r in fallback_rows:
        if r.get("blender_id") == bid and (r.get("game_type") or "").strip():
            return (r.get("game_type") or "").strip()
    return "Unknown"


def weekday_name_from_date_str(ds: str) -> str:
    d = date.fromisoformat(ds)
    return d.strftime("%A")


def parse_csv_rows():
    """Full CSV rows with zone merge; catalog by machineFullName; fallback rows list."""
    catalog_by_mfn: dict[str, dict] = {}
    fallback_rows: list[dict] = []

    with CSV_PATH.open(newline="", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            z = norm_zone(row.get("zone", ""))
            mfn = (row.get("machineFullName") or "").strip()
            bid = (row.get("blender_id") or "").strip()
            if mfn and mfn not in catalog_by_mfn and bid:
                catalog_by_mfn[mfn] = {
                    "blender_id": bid,
                    "object_id": row.get("object_id", ""),
                    "location": row.get("location", ""),
                    "machineFullName": mfn,
                    "machineType": row.get("machineType", ""),
                    "zone": z,
                }
            fallback_rows.append(
                {
                    "blender_id": bid,
                    "object_id": row.get("object_id", ""),
                    "location": row.get("location", ""),
                    "machineFullName": mfn,
                    "day": row.get("day", ""),
                    "hour": row.get("hour", ""),
                    "stroke": float(row.get("stroke") or 0) or 0,
                    "turnover": float(row.get("turnover") or 0) or 0,
                    "machineType": row.get("machineType", ""),
                    "zone": z,
                    "game_type": row.get("game_type", ""),
                }
            )
    return catalog_by_mfn, fallback_rows


def csv_hour_to_index(hour_val) -> int | None:
    if hour_val is None:
        return None
    if isinstance(hour_val, int) and 0 <= hour_val <= 23:
        return hour_val
    s = str(hour_val).strip()
    if not s:
        return None
    if ":" in s:
        part = s.split(":")[0]
        try:
            h = int(part)
            return h if 0 <= h <= 23 else None
        except ValueError:
            return None
    try:
        h = int(s)
        return h if 0 <= h <= 23 else None
    except ValueError:
        return None


def build_csv_hour_weights(fallback_rows: list[dict]) -> dict[tuple[str, str], list[float]]:
    """Per (blender_id, weekday): 24 weights summing to 1 from CSV turnover shape (all games)."""
    raw: dict[tuple[str, str], list[float]] = defaultdict(lambda: [0.0] * 24)
    for r in fallback_rows:
        bid = r.get("blender_id") or ""
        day = r.get("day") or ""
        if not bid or not day:
            continue
        hi = csv_hour_to_index(r.get("hour"))
        if hi is None:
            continue
        raw[(bid, day)][hi] += float(r.get("turnover") or 0) or 0.0

    weights: dict[tuple[str, str], list[float]] = {}
    for key, arr in raw.items():
        s = sum(arr)
        if s <= 0:
            weights[key] = [1.0 / 24.0] * 24
        else:
            weights[key] = [x / s for x in arr]
    return weights


def scan_parquet(catalog_by_mfn: dict[str, dict]):
    """
    daily_game[(blender_id, date_str, game)] -> {turnover, stroke}
    """
    daily_game: dict[tuple[str, str, str], dict[str, float]] = defaultdict(
        lambda: {"turnover": 0.0, "stroke": 0.0}
    )

    pf = pq.ParquetFile(PARQUET_PATH)
    cols = ["Location", "Date", "Game Name", "Turnover", "Stroke"]
    for batch in pf.iter_batches(columns=cols, batch_size=65536):
        d = batch.to_pydict()
        locs = d["Location"]
        dates = d["Date"]
        games = d["Game Name"]
        tos = d["Turnover"]
        sts = d["Stroke"]
        for i in range(len(locs)):
            loc = str(locs[i] or "").strip()
            cat = catalog_by_mfn.get(loc)
            if not cat:
                continue
            bid = cat["blender_id"]
            ds = to_date_str(dates[i])
            if len(ds) < 10:
                continue
            g = str(games[i] or "").strip() or "Unknown"
            t = float(tos[i] or 0) or 0.0
            s = float(sts[i] or 0) or 0.0
            key = (bid, ds, g)
            daily_game[key]["turnover"] += t
            daily_game[key]["stroke"] += s

    return daily_game


def build_output_rows():
    catalog_by_mfn, fallback_rows = parse_csv_rows()
    daily_raw = scan_parquet(catalog_by_mfn)
    aug_start, aug_end = detect_august_week1_range()
    canonical_game_by_bid = build_canonical_game_by_bid(daily_raw, aug_start, aug_end)

    all_bids_csv = sorted({r["blender_id"] for r in fallback_rows if r["blender_id"]})
    bids_with_parquet = {k[0] for k in daily_raw}

    game_tot: dict[tuple[str, str], float] = defaultdict(float)
    for (bid, _ds, g), agg in daily_raw.items():
        game_tot[(bid, g)] += agg["turnover"]

    top_games_by_bid: dict[str, list[str]] = {}
    for bid in bids_with_parquet:
        g = canonical_game_by_bid.get(bid) or fallback_game_for_bid(bid, game_tot, fallback_rows)
        top_games_by_bid[bid] = [g]

    top_set_by_bid = {b: set(gs) for b, gs in top_games_by_bid.items()}
    daily_game: dict[tuple[str, str, str], dict[str, float]] = defaultdict(
        lambda: {"turnover": 0.0, "stroke": 0.0}
    )
    for (bid, ds, g), agg in daily_raw.items():
        ts = top_set_by_bid.get(bid, set())
        g2 = g if g in ts else "Other"
        k = (bid, ds, g2)
        daily_game[k]["turnover"] += agg["turnover"]
        daily_game[k]["stroke"] += agg["stroke"]

    by_date: dict[tuple[str, str], dict[str, dict[str, float]]] = defaultdict(
        lambda: defaultdict(lambda: {"turnover": 0.0, "stroke": 0.0})
    )
    for (bid, ds, g), agg in daily_game.items():
        by_date[(bid, ds)][g]["turnover"] += agg["turnover"]
        by_date[(bid, ds)][g]["stroke"] += agg["stroke"]

    dates_by_bid_wd: dict[tuple[str, str], set[str]] = defaultdict(set)
    for (bid, ds) in by_date:
        wd = weekday_name_from_date_str(ds)
        dates_by_bid_wd[(bid, wd)].add(ds)

    avg_game_wd: dict[tuple[str, str, str], tuple[float, float]] = {}
    for (bid, wd), ds_set in dates_by_bid_wd.items():
        if not ds_set:
            continue
        n = len(ds_set)
        games_here: set[str] = set()
        for ds in ds_set:
            games_here.update(by_date[(bid, ds)].keys())
        for g in games_here:
            total_t = sum(
                by_date[(bid, ds)].get(g, {"turnover": 0.0})["turnover"] for ds in ds_set
            )
            total_s = sum(
                by_date[(bid, ds)].get(g, {"stroke": 0.0})["stroke"] for ds in ds_set
            )
            avg_game_wd[(bid, wd, g)] = (total_t / n, total_s / n)

    days_order = [
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
        "Sunday",
    ]
    bid_to_cat = {c["blender_id"]: c for c in catalog_by_mfn.values()}

    fb_index: dict[tuple[str, str, str], dict] = {}
    for r in fallback_rows:
        key = (r["blender_id"], r["day"], r["hour"])
        if key not in fb_index:
            fb_index[key] = r

    hour_weights = build_csv_hour_weights(fallback_rows)

    out: list[dict] = []

    for bid in all_bids_csv:
        if bid not in bids_with_parquet:
            for r in fallback_rows:
                if r["blender_id"] != bid:
                    continue
                out.append({**r, "turnover": round(r["turnover"], 4), "stroke": round(r["stroke"], 4)})
            continue

        cat = bid_to_cat.get(bid)
        if not cat:
            cat = next((c for c in catalog_by_mfn.values() if c["blender_id"] == bid), None)
        if not cat:
            continue

        games_for_bid = top_games_by_bid.get(bid) or ["Unknown"]

        for day in days_order:
            wh = hour_weights.get((bid, day))
            if wh is None:
                wh = [1.0 / 24.0] * 24
            for game in games_for_bid:
                ag = avg_game_wd.get((bid, day, game))
                daily_t = ag[0] if ag else 0.0
                daily_s = ag[1] if ag else 0.0

                for hour in range(24):
                    hour_s = f"{hour}:00"
                    fb = fb_index.get((bid, day, hour_s))
                    w = wh[hour]
                    out.append(
                        {
                            "blender_id": bid,
                            "object_id": (fb or {}).get("object_id") or cat["object_id"],
                            "location": cat["location"],
                            "machineFullName": cat["machineFullName"],
                            "day": day,
                            "hour": hour_s,
                            "stroke": round(daily_s * w, 4),
                            "turnover": round(daily_t * w, 4),
                            "machineType": cat["machineType"],
                            "zone": cat["zone"],
                            "game_type": game,
                        }
                    )

    return out


def main():
    if not PARQUET_PATH.exists():
        raise SystemExit(f"Missing parquet: {PARQUET_PATH}")
    if not CSV_PATH.exists():
        raise SystemExit(f"Missing csv: {CSV_PATH}")

    aug_start, aug_end = detect_august_week1_range()
    rows = build_output_rows()
    OUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    with OUT_PATH.open("w", encoding="utf-8") as f:
        json.dump(rows, f, separators=(",", ":"))

    multi = 0
    seen: dict[tuple[str, str, str], set[str]] = defaultdict(set)
    for r in rows:
        key = (r["blender_id"], r["day"], r["hour"])
        seen[key].add(r.get("game_type") or "")
    multi = sum(1 for gs in seen.values() if len(gs) > 1)

    print(f"August week 1 game_type window: {aug_start} .. {aug_end}")
    print(f"Wrote {len(rows)} rows to {OUT_PATH}")
    print(f"Size MB: {OUT_PATH.stat().st_size / (1024 * 1024):.2f}")
    print(f"Slots with 2+ game_type at same hour: {multi} (expect 0 for parquet machines)")


if __name__ == "__main__":
    main()
