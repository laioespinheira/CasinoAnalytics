"""Build aggregated, anonymised customer-tier demand data for the 3D floor.

Source : public/assets/floorpulse_masked.parquet  (real rating sessions, DD only)
Catalog: public/assets/casino_data.csv           (machineFullName -> blender_id/zone/...)
Output : public/assets/customer_tier_data.json    (columnar, aggregated counts only)

Tier data is DD-only because the source parquet (and the main notebook pipeline)
both restrict to EGMArea == "DD". This mirrors the existing DD-only panels.

The explosion of rating sessions across hour boundaries reproduces the logic in
"casino data wrangling.ipynb" so turnover / occupancy semantics match the main
dataset.

Privacy: the output contains aggregated metrics and distinct-count integers only.
No patron_key, names, or other identifiers are written.
"""

from pathlib import Path
import json
import re
import numpy as np
import pandas as pd
import pyarrow.parquet as pq

ROOT = Path(__file__).resolve().parents[1]
PARQUET_IN = ROOT / "public" / "assets" / "floorpulse_masked.parquet"
CSV_IN = ROOT / "public" / "assets" / "casino_data.csv"
JSON_OUT = ROOT / "public" / "assets" / "customer_tier_data.json"

# Zones D/E/F are presented as a single "Zone DD" in the app (see useCasinoData.js).
MERGED_ZONES = {"Zone D", "Zone E", "Zone F"}
DASH_SEP = " - "


# --- Game family parser (ported from src/utils/gameFamilies.js) --------------
def build_two_word_family_index(game_types):
    by_prefix = {}
    for gt in game_types:
        raw = (gt or "").strip()
        if not raw or DASH_SEP in raw:
            continue
        words = re.split(r"\s+", raw)
        if len(words) < 2:
            continue
        prefix = f"{words[0]} {words[1]}"
        by_prefix.setdefault(prefix, set()).add(raw)
    prefixes = [p for p, titles in by_prefix.items() if len(titles) >= 2]
    prefixes.sort(key=len, reverse=True)
    return prefixes


def parse_game_family(game_type, family_index):
    raw = (game_type or "Unknown").strip()
    if not raw:
        return "Unknown"
    dash_idx = raw.find(DASH_SEP)
    if dash_idx > 0:
        return raw[:dash_idx].strip()
    upper = raw.upper()
    for prefix in family_index:
        pu = prefix.upper()
        if upper == pu or upper.startswith(pu + " "):
            return prefix
    return raw


def explode_sessions(df):
    """One row per (session, hour-it-touches) with seconds-apportioned metrics."""
    s = df["RatingStartDateTime"].values.astype("datetime64[s]")
    e = df["RatingEndDateTime"].values.astype("datetime64[s]")

    h_start = s.astype("datetime64[h]")
    h_end = e.astype("datetime64[h]")
    n_hours = ((h_end - h_start) / np.timedelta64(1, "h")).astype(int) + 1

    idx = np.repeat(np.arange(len(df)), n_hours)
    offset = np.concatenate([np.arange(n) for n in n_hours])

    src = df.iloc[idx].reset_index(drop=True)
    hour_bucket = h_start[idx] + offset.astype("timedelta64[h]")

    bucket_start = hour_bucket
    bucket_end = hour_bucket + np.timedelta64(1, "h")
    overlap_start = np.maximum(s[idx], bucket_start)
    overlap_end = np.minimum(e[idx], bucket_end)
    seconds = (overlap_end - overlap_start) / np.timedelta64(1, "s")

    seconds_played = src["SecondsPlayed"].values
    with np.errstate(invalid="ignore", divide="ignore"):
        share = np.where(seconds_played > 0, seconds / seconds_played, 0)

    out = pd.DataFrame({
        "CasinoLocation": src["CasinoLocation"].values,
        "Tier": src["Tier"].values,
        "GameName": src["GameName"].values,
        "GamingDate": pd.to_datetime(hour_bucket),
        "hour": pd.to_datetime(hour_bucket).hour,
        "seconds": seconds,
        "turnover": src["Turnover"].values * share,
        "win": src["ActualWin"].values * share,
        "strokes": src["strokes"].values * share,
        "patron_key": src["patron_key"].values,
    })
    out = out[out["seconds"] > 0].reset_index(drop=True)
    return out


def main():
    print(f"Reading {PARQUET_IN.name} ...")
    df = pq.read_table(PARQUET_IN, use_pandas_metadata=False).to_pandas()
    df = df[df["EGMArea"] == "DD"].reset_index(drop=True)
    df["RatingStartDateTime"] = pd.to_datetime(df["RatingStartDateTime"])
    df["RatingEndDateTime"] = pd.to_datetime(df["RatingEndDateTime"])
    print(f"  {len(df):,} DD rows, {df['CasinoLocation'].nunique()} machines")

    exploded = explode_sessions(df)
    exploded["weekday"] = pd.to_datetime(exploded["GamingDate"]).dt.day_name()
    exploded["gaming_day"] = pd.to_datetime(exploded["GamingDate"]).dt.normalize()
    print(f"  exploded to {len(exploded):,} machine-hour-session rows")

    # Catalog: machineFullName -> blender_id / location / machineType / zone
    catalog = (pd.read_csv(CSV_IN)[
        ["machineFullName", "blender_id", "location", "machineType", "zone"]
    ].drop_duplicates("machineFullName"))
    catalog["zone"] = catalog["zone"].where(~catalog["zone"].isin(MERGED_ZONES), "Zone DD")

    exploded = exploded.merge(
        catalog, left_on="CasinoLocation", right_on="machineFullName", how="left"
    )
    unmatched = exploded["blender_id"].isna().sum()
    if unmatched:
        print(f"  dropping {unmatched:,} rows with no catalog match")
    exploded = exploded[exploded["blender_id"].notna()].reset_index(drop=True)

    family_index = build_two_word_family_index(exploded["GameName"].dropna().unique())
    exploded["game_family"] = exploded["GameName"].map(
        lambda g: parse_game_family(g, family_index)
    )

    tiers = sorted(exploded["Tier"].dropna().unique().tolist())
    print(f"  tiers: {tiers}")

    # --- Tier shares per (blender_id, weekday, hour, tier) -------------------
    # We store STABLE shares (averaged across the weeks), not absolute sums. The
    # frontend multiplies these by the floor's actual week-specific turnover /
    # occupancy, so the lens reconciles exactly with the floor for any filter.
    by_tier = (
        exploded.groupby(["blender_id", "weekday", "hour", "Tier"], as_index=False)
        .agg(
            turnover=("turnover", "sum"),
            strokes=("strokes", "sum"),
            seconds=("seconds", "sum"),
        )
    )

    cell = ["blender_id", "weekday", "hour"]
    totals = by_tier.groupby(cell, as_index=False).agg(
        turnover_tot=("turnover", "sum"),
        strokes_tot=("strokes", "sum"),
        seconds_tot=("seconds", "sum"),
    )
    by_tier = by_tier.merge(totals, on=cell, how="left")

    def share(num, den):
        return np.where(den > 0, num / den, 0.0)

    by_tier["share_turnover"] = share(by_tier["turnover"].values, by_tier["turnover_tot"].values)
    by_tier["share_stroke"] = share(by_tier["strokes"].values, by_tier["strokes_tot"].values)
    by_tier["share_occ"] = share(by_tier["seconds"].values, by_tier["seconds_tot"].values)

    # Keep only cells that contribute something for this tier.
    keep = (
        (by_tier["share_turnover"] > 0)
        | (by_tier["share_stroke"] > 0)
        | (by_tier["share_occ"] > 0)
    )
    by_tier = by_tier[keep].reset_index(drop=True)

    out_cols = ["blender_id", "weekday", "hour", "Tier",
                "share_turnover", "share_stroke", "share_occ"]
    rounders = {"share_turnover": 4, "share_stroke": 4, "share_occ": 4}

    by_share = {}
    for c in out_cols:
        series = by_tier[c]
        if c in rounders:
            series = series.round(rounders[c])
        by_share[c] = series.tolist()

    payload = {
        "generated_at": pd.Timestamp.utcnow().isoformat(),
        "grain": "tier SHARES per (blender_id, weekday, hour, tier); DD only",
        "tiers": tiers,
        "byShare": by_share,
    }

    with open(JSON_OUT, "w") as f:
        json.dump(payload, f, separators=(",", ":"), allow_nan=False)

    size_mb = JSON_OUT.stat().st_size / 1_000_000
    print(f"Wrote {JSON_OUT.name}: byShare={len(by_tier):,} rows, {size_mb:.1f} MB")


if __name__ == "__main__":
    main()
