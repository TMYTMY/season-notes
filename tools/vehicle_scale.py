#!/usr/bin/env python3
"""Print drawn vehicle size per class against the ticket table.

Renders each class alone on a blank 160x90 canvas through the real
career-px.js, measures the raster bounding box, and converts the drawn
pixels back to metres at 10.6 px/m.

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
TOL = 0.20

MEASURE_JS = r"""(keys) => {
  const cv = document.createElement('canvas');
  cv.width = 160; cv.height = 90;
  const out = [];
  for (const k of keys) {
    PX.gallery(cv, k, {driver: false, person: false, ground: false});
    const d = cv.getContext('2d').getImageData(0, 0, 160, 90).data;
    let x0 = 999, x1 = -1, y0 = 999, y1 = -1;
    for (let y = 0; y < 90; y++) {
      for (let x = 0; x < 160; x++) {
        const i = (y * 160 + x) * 4;
        if (d[i] || d[i + 1] || d[i + 2]) {
          if (x < x0) x0 = x; if (x > x1) x1 = x;
          if (y < y0) y0 = y; if (y > y1) y1 = y;
        }
      }
    }
    out.push({key: k, w: x1 - x0 + 1, h: y1 - y0 + 1});
  }
  return out;
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
        drawn = {r["key"]: r for r in page.evaluate(MEASURE_JS, keys)}
        b.close()

    by = {v["key"]: v for v in meta}
    rows = []
    print("%-11s %-9s %-9s %-9s %-8s %-6s" % ("class", "len px", "len m", "ticket m", "delta", "ok"))
    allok = True
    for k in keys:
        v, d = by[k], drawn[k]
        lm = d["w"] / PPM
        hm = d["h"] / PPM
        dl = (lm - v["len_m"]) / v["len_m"]
        dh = (hm - v["h_m"]) / v["h_m"]
        ok = abs(dl) <= TOL and abs(dh) <= TOL
        allok = allok and ok
        print("%-11s %-9d %-9.2f %-9.2f %-8s %-6s" % (
            v["name"], d["w"], lm, v["len_m"], "%+.0f%%" % (dl * 100), "yes" if ok else "NO"))
        rows.append({
            "class": v["name"], "len_px": d["w"], "h_px": d["h"],
            "len_m": round(lm, 2), "h_m": round(hm, 2),
            "ticket_len_m": v["len_m"], "ticket_h_m": v["h_m"],
            "wheel_px": v["wheel_px"], "pass": ok,
        })
    print()
    print("%-11s %-9s %-9s %-9s %-8s %-6s" % ("class", "h px", "h m", "ticket m", "delta", "ok"))
    for k in keys:
        v, d = by[k], drawn[k]
        hm = d["h"] / PPM
        dh = (hm - v["h_m"]) / v["h_m"]
        print("%-11s %-9d %-9.2f %-9.2f %-8s %-6s" % (
            v["name"], d["h"], hm, v["h_m"], "%+.0f%%" % (dh * 100),
            "yes" if abs(dh) <= TOL else "NO"))
    out = ROOT / ".scratch" / "F1-framework" / "art" / "vehicle_scale.json"
    out.write_text(json.dumps({"px_per_m": PPM, "rows": rows}, ensure_ascii=False, indent=2))
    print()
    print("page errors:", errs if errs else "none")
    print("table:", out.relative_to(ROOT))
    print("verdict:", "PASS" if allok and not errs else "FAIL")
    return 0 if allok and not errs else 1


if __name__ == "__main__":
    sys.exit(main())
