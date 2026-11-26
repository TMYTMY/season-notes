#!/usr/bin/env python3
"""Print drawn vehicle size per class against the ticket 23 art table.

Renders each class alone on a blank 160x90 canvas through the real
career-px.js, measures the raster bounding box, and checks the drawn
length against the ticket band, the ratio to the 20 px person, and that
a seated driver is actually drawn above the bodywork.

Usage:
  python3 tools/vehicle_scale.py
  PLAYWRIGHT_CHROME_PATH=... python3 tools/vehicle_scale.py
"""
import json
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PPM = 10.6
ART = 0.85
PERSON_PX = 20
BANDS = {
    "kart": (24, 26),
    "street": (36, 39),
    "street-race": (36, 39),
    "f4": (40, 43),
    "f3": (44, 47),
    "f2": (44, 47),
    "f1": (48, 50),
    "rally": (38, 41),
}
RATIOS = {"kart": (1.20, 1.35), "f1": (2.40, 2.50)}

MEASURE_JS = r"""(keys) => {
  const cv = document.createElement('canvas');
  cv.width = 160; cv.height = 90;
  const ctx = cv.getContext('2d');
  function shot(key, driver) {
    PX.gallery(cv, key, {driver: driver, person: false, ground: false});
    const d = ctx.getImageData(0, 0, 160, 90).data;
    let x0 = 999, x1 = -1, y0 = 999, y1 = -1;
    const grid = [];
    for (let y = 0; y < 90; y++) {
      const row = [];
      for (let x = 0; x < 160; x++) {
        const i = (y * 160 + x) * 4;
        const v = (d[i] || d[i + 1] || d[i + 2]) ? ((d[i] << 16) | (d[i + 1] << 8) | d[i + 2]) : 0;
        row.push(v);
        if (v) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
      grid.push(row);
    }
    return {w: x1 - x0 + 1, h: y1 - y0 + 1, grid: grid};
  }
  const out = [];
  for (const k of keys) {
    const on = shot(k, true);
    const off = shot(k, false);
    let added = 0, pale = 0;
    for (let y = 0; y < 90; y++) {
      for (let x = 0; x < 160; x++) {
        const a = on.grid[y][x], b = off.grid[y][x];
        if (a && a !== b) {
          added++;
          const r = (a >> 16) & 255, g = (a >> 8) & 255, bl = a & 255;
          if (r > 200 && g > 200 && bl > 200) pale++;
        }
      }
    }
    out.push({key: k, len: on.w, h: on.h, body_h: off.h, added: added, pale: pale});
  }
  PX.gallery(cv, 'kart', {driver: false, person: true, ground: false, x: 220});
  const pd = ctx.getImageData(0, 0, 160, 90).data;
  let py0 = 999, py1 = -1;
  for (let y = 0; y < 90; y++) {
    for (let x = 0; x < 160; x++) {
      const i = (y * 160 + x) * 4;
      if (pd[i] || pd[i + 1] || pd[i + 2]) { if (y < py0) py0 = y; if (y > py1) py1 = y; }
    }
  }
  return {rows: out, person: py1 - py0 + 1};
}"""


def main():
    html = (ROOT / ".scratch" / "F1-framework" / "art" / "harness.html").as_uri()
    chrome = os.environ.get("PLAYWRIGHT_CHROME_PATH")
    with sync_playwright() as p:
        kw = {"args": ["--no-sandbox", "--allow-file-access-from-files"]}
        if chrome:
            kw["executable_path"] = chrome
        b = p.chromium.launch(**kw)
        page = b.new_page(viewport={"width": 1280, "height": 900})
        errs = []
        page.on("pageerror", lambda e: errs.append(str(e)))
        page.goto(html)
        page.wait_for_function("document.body.dataset.ready === '1'")
        meta = page.evaluate("PX.vehicles")
        keys = [v["key"] for v in meta]
        data = page.evaluate(MEASURE_JS, keys)
        b.close()

    by = {v["key"]: v for v in meta}
    person = data["person"]
    problems = []
    if person != PERSON_PX:
        problems.append("person %d px, want %d" % (person, PERSON_PX))

    print("%-11s %-6s %-6s %-6s %-8s %-6s %-5s %-5s %-6s" % (
        "class", "real m", "art px", "drawn", "band", "ratio", "h px", "drv", "ok"))
    rows = []
    for r in data["rows"]:
        v = by[r["key"]]
        name = v["name"]
        art = v["len_m"] * ART * PPM
        lo, hi = BANDS[name]
        ratio = r["len"] / float(person)
        ok = lo <= r["len"] <= hi
        if not ok:
            problems.append("%s %d px outside %d-%d" % (name, r["len"], lo, hi))
        bnd = RATIOS.get(name)
        rok = True if not bnd else bnd[0] <= ratio <= bnd[1]
        if not rok:
            problems.append("%s ratio %.2f outside %.2f-%.2f" % (name, ratio, bnd[0], bnd[1]))
        drv = r["added"] >= 12 and r["pale"] >= 3
        if not drv:
            problems.append("%s driver not drawn (changed %d, helmet %d)" % (name, r["added"], r["pale"]))
        good = ok and rok and drv
        print("%-11s %-6.1f %-6.1f %-6d %-8s %-6.2f %-5d %-5s %-6s" % (
            name, v["len_m"], art, r["len"], "%d-%d" % (lo, hi), ratio,
            r["h"], "%d/%d" % (r["added"], r["pale"]), "yes" if good else "NO"))
        rows.append({
            "class": name, "real_m": v["len_m"], "art_px": round(art, 1),
            "drawn_px": r["len"], "band": [lo, hi], "ratio": round(ratio, 2),
            "h_px": r["h"], "body_h_px": r["body_h"], "driver_px": r["added"],
            "helmet_px": r["pale"],
            "pass": good,
        })

    print()
    print("person %d px · art scale %.2f · %.1f px/m" % (person, ART, PPM))
    out = ROOT / ".scratch" / "F1-framework" / "art" / "vehicle_scale.json"
    out.write_text(json.dumps(
        {"px_per_m": PPM, "art_scale": ART, "person_px": person, "rows": rows},
        ensure_ascii=False, indent=2))
    print("page errors:", errs if errs else "none")
    print("table:", out.relative_to(ROOT))
    for msg in problems:
        print("problem:", msg)
    print("verdict:", "PASS" if not problems and not errs else "FAIL")
    return 0 if not problems and not errs else 1


if __name__ == "__main__":
    sys.exit(main())
