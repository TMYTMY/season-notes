#!/usr/bin/env python3
"""Balance simulation over seeded playthroughs, one block per route.

Runs N seeds through the behaviour harness on every route and reports what
the numbers say: final attribute distribution, chapter-report band
distribution, roll win rate, injury rate, and how much of the card pool a
route actually shows. Writes the same data as JSON so two runs can be diffed.

Usage:
  python3 tools/balance.py --runs 3 --out /tmp/balance.json
  python3 tools/balance.py --runs 10 --door f4 --out /tmp/f4.json

Requires: playwright (pip install playwright; playwright install chromium),
or PLAYWRIGHT_CHROME_PATH pointing at a Chromium binary.
"""
import argparse
import json
import statistics
import sys
from collections import Counter
from datetime import datetime, timezone
from pathlib import Path

from playwright.sync_api import sync_playwright

from play_test import DOORS, card_pool, career_url, drive, launch, open_page

ATTRS = ("rea", "drv", "men", "sta", "feel", "nerve", "disc")


def fmt(value):
    if value is None:
        return "—"
    if isinstance(value, float):
        if value.is_integer():
            return str(int(value))
        return ("%.1f" % value).rstrip("0").rstrip(".")
    return str(value)


def spread(values):
    if not values:
        return {"min": None, "median": None, "max": None}
    return {
        "min": min(values),
        "median": statistics.median(values),
        "max": max(values),
    }


def rate(part, whole):
    return round(part / whole, 4) if whole else 0.0


def aggregate(playthroughs, pool_total):
    attrs = {a: spread([p["attributes"][a] for p in playthroughs]) for a in ATTRS}
    bands = Counter(p["band"] or "none" for p in playthroughs)
    checks = sum(p["checks"] for p in playthroughs)
    wins = sum(p["wins"] for p in playthroughs)
    injured = sum(1 for p in playthroughs if p["inj"] > 0)
    seen = set()
    for p in playthroughs:
        seen.update(p["cards"])
    decisions = [p["decisions"] for p in playthroughs]
    return {
        "runs": len(playthroughs),
        "decisions": spread(decisions),
        "attributes": attrs,
        "bands": dict(sorted(bands.items())),
        "roll": {"checks": checks, "wins": wins, "win_rate": rate(wins, checks)},
        "injury": {"runs": injured, "rate": rate(injured, len(playthroughs))},
        "coverage": {
            "seen": len(seen),
            "total": pool_total,
            "rate": rate(len(seen), pool_total),
            "ids": sorted(seen),
        },
    }


def print_block(title, agg):
    print(title)
    print("  attr     min  median  max")
    for a in ATTRS:
        row = agg["attributes"][a]
        print("  %-4s %6s %7s %5s" % (a, fmt(row["min"]), fmt(row["median"]), fmt(row["max"])))
    bands = " · ".join("%s %d" % (b, n) for b, n in agg["bands"].items()) or "none"
    roll = agg["roll"]
    inj = agg["injury"]
    cov = agg["coverage"]
    dec = agg["decisions"]
    print("  bands        %s" % bands)
    print("  rolls        %d/%d won (%.1f%%)" % (roll["wins"], roll["checks"], roll["win_rate"] * 100))
    print("  injuries     %d/%d runs (%.1f%%)" % (inj["runs"], agg["runs"], inj["rate"] * 100))
    print("  coverage     %d/%d card ids (%.1f%%)" % (cov["seen"], cov["total"], cov["rate"] * 100))
    print("  decisions    min %s · median %s · max %s" % (fmt(dec["min"]), fmt(dec["median"]), fmt(dec["max"])))
    print("")


def main():
    ap = argparse.ArgumentParser(description="Run seeded playthroughs and report balance.")
    ap.add_argument("--runs", type=int, default=3, help="playthroughs per route")
    ap.add_argument("--seed", type=int, default=11, help="first seed; each run adds one")
    ap.add_argument("--door", choices=("all",) + DOORS, default="all")
    ap.add_argument("--out", default="balance.json", help="JSON output path")
    ap.add_argument("--file", help="alternate career.html path")
    args = ap.parse_args()

    doors = DOORS if args.door == "all" else (args.door,)
    if args.runs < 1:
        print("--runs must be at least 1")
        sys.exit(2)

    routes = {}
    playthroughs = []
    errors = []
    pool_total = 0

    with sync_playwright() as p:
        browser = launch(p)
        for door in doors:
            rows = []
            for i in range(args.runs):
                seed = args.seed + i
                context, page, page_errors = open_page(browser, career_url(seed, door, args.file))
                if not pool_total:
                    pool_total = card_pool(page)["total"]
                result = drive(page, door, seed, check_resume=False)
                context.close()
                final = result["final"]
                report = final["report"] or {}
                row = {
                    "door": door,
                    "seed": seed,
                    "decisions": final["decisions"],
                    "band": report.get("band"),
                    "score": report.get("score"),
                    "route": report.get("route"),
                    "attributes": final["attributes"],
                    "checks": final["checks"],
                    "wins": final["wins"],
                    "inj": final["inj"],
                    "crashes": final["crashes"],
                    "cards": result["cards_seen"],
                    "endKind": final["endKind"],
                    "pageErrors": page_errors,
                }
                errors += page_errors
                rows.append(row)
                playthroughs.append(row)
            routes[door] = aggregate(rows, pool_total)
        browser.close()

    doc = {
        "generated": datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%SZ"),
        "career": str(Path(args.file).resolve() if args.file else Path(__file__).resolve().parent.parent / "career.html"),
        "runs_per_route": args.runs,
        "seeds": [args.seed + i for i in range(args.runs)],
        "card_pool": pool_total,
        "routes": routes,
        "overall": aggregate(playthroughs, pool_total),
        "playthroughs": playthroughs,
    }

    out = Path(args.out)
    out.parent.mkdir(parents=True, exist_ok=True)
    out.write_text(json.dumps(doc, ensure_ascii=False, indent=2) + "\n")

    for door in doors:
        print_block("%s · %d %s · seeds %d–%d"
                    % (door, args.runs, "run" if args.runs == 1 else "runs", args.seed, args.seed + args.runs - 1),
                    routes[door])
    if len(doors) > 1:
        print_block("all routes · %d %s" % (len(playthroughs), "run" if len(playthroughs) == 1 else "runs"), doc["overall"])
    print("card pool      %d ids" % pool_total)
    print("wrote          %s" % out.resolve())

    if errors:
        print("\nFAIL — %d page error(s)" % len(errors))
        for item in errors[:5]:
            print("  - " + item)
        sys.exit(1)
    if any(p["endKind"] != "settle" for p in playthroughs):
        print("\nFAIL — a playthrough did not reach the chapter report")
        sys.exit(1)


if __name__ == "__main__":
    main()
