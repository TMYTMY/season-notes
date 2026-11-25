#!/usr/bin/env python3
"""Behaviour harness: one seeded career run, driven by clicking.

Loads career.html with a fixed seed, plays every screen through its real
buttons, and asserts what a player can observe: at least 26 decisions, the
20-year-old chapter report, no page errors, a v5 save that reloads to the
same card, and a 390 px layout without horizontal overflow or tap targets
under 44 px.

Usage:
  python3 tools/play_test.py --door f4 --seed 11
  python3 tools/play_test.py --door street --seed 11 --shots /tmp/shots
  python3 tools/play_test.py --door rally --seed 11 --twice

Requires: playwright (pip install playwright; playwright install chromium),
or PLAYWRIGHT_CHROME_PATH pointing at a Chromium binary.
"""
import argparse
import os
import sys
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
DOORS = ("f4", "rally", "street")
MIN_DECISIONS = 26

IDLE_JS = r"""() => {
  const on = id => {
    const el = document.querySelector(id);
    return !!(el && el.classList.contains('on'));
  };
  if (on('#scIntro')) return 'intro';
  if (on('#scEnd')) return 'end';
  if (on('#scAlloc')) {
    const btn = document.querySelector('#btnAlloc');
    const left = document.querySelector('#leftPts');
    if (!btn || !left) return '';
    return (!btn.disabled || left.textContent === '10') ? 'alloc' : '';
  }
  if (on('#scDoor')) {
    const b = document.querySelector('#doorOpts button.opt');
    return b && !b.disabled ? 'door' : '';
  }
  if (on('#scCard')) {
    const box = document.querySelector('#cardOpts');
    const b = box && box.querySelector('button.opt');
    return b && !b.disabled && box.dataset.locked !== '1' ? 'card' : '';
  }
  return '';
}"""

UI_JS = r"""() => {
  const on = [...document.querySelectorAll('section')].filter(s => s.classList.contains('on'))[0];
  const snap = window.__snapshot();
  const beat = snap.beats && snap.beats[snap.bi];
  return {
    section: on ? on.id : null,
    year: snap.year,
    bi: snap.bi,
    card: beat && beat.card ? {id: beat.card.id, t: beat.card.t} : null,
    kicker: (document.querySelector('#cardKicker') || {}).textContent || '',
    title: (document.querySelector('#cardTitle') || {}).textContent || '',
    options: [...document.querySelectorAll('#cardOpts button.opt')].map(b => b.textContent.trim())
  };
}"""

STATS_JS = r"""() => {
  const s = window.__snapshot();
  return {
    decisions: s.stat.decisions,
    checks: s.stat.checks,
    wins: s.stat.wins,
    fails: s.stat.fails,
    crashes: s.stat.crashes,
    inj: s.inj,
    log: s.log.length,
    over: !!s.over,
    endKind: s.endKind,
    report: s.report || null,
    attributes: s.a,
    route: s.door || s.forced || null,
    used: s.used || []
  };
}"""

MOBILE_JS = r"""() => {
  const vw = window.innerWidth;
  const sw = Math.max(document.documentElement.scrollWidth, document.body.scrollWidth);
  const bad = [];
  document.querySelectorAll('button, a[href], [role="button"]').forEach(el => {
    if (el.offsetParent === null) return;
    const r = el.getBoundingClientRect();
    if (r.width === 0 || r.height === 0) return;
    if (r.width < 44 || r.height < 44) {
      bad.push({
        el: el.id || String(el.className) || el.tagName,
        w: Math.round(r.width),
        h: Math.round(r.height)
      });
    }
  });
  return {vw: vw, sw: sw, bad: bad};
}"""

POOL_JS = r"""() => {
  const ids = new Set();
  const add = c => { if (c && c.id) ids.add(c.id); };
  CARDS.forEach(add);
  ['f4', 'rally', 'street'].forEach(r => {
    add(ENTRY[r]);
    (ROUTE19[r] || []).forEach(add);
    const t = ROUTE20[r];
    (Array.isArray(t) ? t : [t]).forEach(add);
    (ROUTE20B[r] || []).forEach(add);
  });
  EXAM.forEach(add);
  return {total: ids.size, ids: [...ids]};
}"""

SAVE_JS = r"""() => {
  const raw = localStorage.getItem('career.save.v5');
  if (!raw) return {present: false};
  try {
    const o = JSON.parse(raw);
    return {present: true, v: o.v, year: o.year, decisions: o.stat && o.stat.decisions, endKind: o.endKind};
  } catch (e) {
    return {present: true, bad: String(e)};
  }
}"""


def launch(p):
    return p.chromium.launch(
        args=["--no-sandbox"],
        executable_path=os.environ.get("PLAYWRIGHT_CHROME_PATH") or None,
    )


def open_page(browser, url, width=390, height=844):
    context = browser.new_context(
        viewport={"width": width, "height": height},
        reduced_motion="reduce",
    )
    page = context.new_page()
    errors = []
    page.on("pageerror", lambda e: errors.append(str(e)))
    page.goto(url, wait_until="domcontentloaded")
    page.wait_for_function("() => typeof window.__snapshot === 'function'", timeout=20000)
    return context, page, errors


def career_url(seed, door, path=None):
    target = Path(path).resolve() if path else ROOT / "career.html"
    return "%s?seed=%d&door=%s" % (target.as_uri(), seed, door)


def wait_idle(page, timeout=60000):
    page.wait_for_function(IDLE_JS, timeout=timeout)
    return page.evaluate(IDLE_JS)


def click_js(page, selector, index=None):
    if index is None:
        page.evaluate("sel => document.querySelector(sel).click()", selector)
    else:
        page.evaluate(
            "args => document.querySelectorAll(args[0])[args[1]].click()",
            [selector, index],
        )


def ui(page):
    return page.evaluate(UI_JS)


def stats(page):
    return page.evaluate(STATS_JS)


def snapshot(page):
    return page.evaluate("() => window.__snapshot()")


def audit_mobile(page):
    return page.evaluate(MOBILE_JS)


def card_pool(page):
    return page.evaluate(POOL_JS)


def save_state(page):
    return page.evaluate(SAVE_JS)


def assign_points(page):
    rows = [3, 2, 2, 1, 1, 1]
    page.evaluate(
        """rows => {
          document.querySelectorAll('#allocList .arow').forEach((row, i) => {
            const plus = row.querySelector('[data-d="1"]');
            for (let n = 0; n < rows[i]; n++) plus.click();
          });
        }""",
        rows,
    )


def door_index(page, door):
    labels = page.evaluate("() => [...document.querySelectorAll('#doorOpts button.opt')].map(b => b.textContent)")
    names = {"f4": "F4", "rally": "Rally", "street": "街頭"}
    for i, label in enumerate(labels):
        if names[door] in label:
            return i
    return 0


def choose(title, count, step, seed, retries):
    if title == "肥佬":
        return 0 if retries < 3 else 1
    if title == "波箱":
        return 1
    if count <= 1:
        return 0
    return (step + seed) % count


def record_view(page, audit):
    view = audit_mobile(page)
    audit["views"] += 1
    audit["max_scroll"] = max(audit["max_scroll"], view["sw"])
    for bad in view["bad"]:
        key = "%s %dx%d" % (bad["el"], bad["w"], bad["h"])
        if key not in audit["violations"]:
            audit["violations"].append(key)


def take_shot(page, shots, door, seed, name):
    if not shots:
        return
    folder = Path(shots)
    folder.mkdir(parents=True, exist_ok=True)
    page.screenshot(path=str(folder / ("%s-%d-%s.png" % (door, seed, name))))


def resume_probe(page):
    before_state = snapshot(page)
    before_ui = ui(page)
    page.reload(wait_until="domcontentloaded")
    page.wait_for_function("() => typeof window.__snapshot === 'function'", timeout=20000)
    visible = page.is_visible("#btnResume")
    click_js(page, "#btnResume")
    wait_idle(page)
    after_state = snapshot(page)
    after_ui = ui(page)
    same_state = before_state == after_state
    same_screen = (
        before_ui["section"] == after_ui["section"]
        and before_ui["kicker"] == after_ui["kicker"]
        and before_ui["title"] == after_ui["title"]
        and before_ui["options"] == after_ui["options"]
    )
    return {
        "resume_button": visible,
        "year": before_state["year"],
        "card": before_ui["card"]["id"] if before_ui["card"] else None,
        "title": before_ui["title"],
        "same_screen": same_screen,
        "same_state": same_state,
        "after_year": after_state["year"],
        "after_card": after_ui["card"]["id"] if after_ui["card"] else None,
    }


def drive(page, door, seed, shots=None, check_resume=False, max_steps=400):
    audit = {"max_scroll": 0, "violations": [], "views": 0}
    trace = []
    resume = None
    retries = 0
    steps = 0
    saved_shot = set()
    while steps < max_steps:
        state = wait_idle(page)
        view = ui(page)
        record_view(page, audit)
        if state == "end":
            break
        if state == "intro":
            take_shot(page, shots, door, seed, "intro")
            click_js(page, "#btnStart")
        elif state == "alloc":
            take_shot(page, shots, door, seed, "alloc-%d" % view["year"])
            assign_points(page)
            click_js(page, "#btnAlloc")
        elif state == "door":
            take_shot(page, shots, door, seed, "doors")
            click_js(page, "#doorOpts button.opt", door_index(page, door))
        elif state == "card":
            if check_resume and resume is None and view["year"] == 16 and view["bi"] == 2:
                resume = resume_probe(page)
            if "card" not in saved_shot:
                take_shot(page, shots, door, seed, "card")
                saved_shot.add("card")
            if view["title"] == "肥佬":
                retries += 1
            pick = choose(view["title"], len(view["options"]), steps, seed, retries)
            before = stats(page)
            entry = {
                "year": view["year"],
                "card": view["card"]["id"] if view["card"] else None,
                "title": view["title"],
                "option": pick,
                "option_text": view["options"][pick] if view["options"] else "",
            }
            trace.append(entry)
            click_js(page, "#cardOpts button.opt", pick)
            wait_idle(page)
            after = stats(page)
            entry["check"] = after["checks"] > before["checks"]
            entry["win"] = after["wins"] > before["wins"]
            entry["decisions"] = after["decisions"]
        else:
            page.wait_for_function(IDLE_JS, timeout=60000)
            continue
        steps += 1
        wait_idle(page)
    final = stats(page)
    pool = card_pool(page)
    save = save_state(page)
    take_shot(page, shots, door, seed, "report")
    return {
        "door": door,
        "seed": seed,
        "steps": steps,
        "trace": trace,
        "final": final,
        "save": save,
        "resume": resume,
        "audit": audit,
        "pool": pool,
        "cards_seen": sorted({t["card"] for t in trace if t["card"]}),
        "options_seen": sorted({(t["card"], t["option"]) for t in trace if t["card"]}),
    }


def failures(result):
    out = []
    final = result["final"]
    if final["decisions"] < MIN_DECISIONS:
        out.append("decisions %d < %d" % (final["decisions"], MIN_DECISIONS))
    if final["endKind"] != "settle":
        out.append("chapter report not reached (endKind %r)" % final["endKind"])
    if not final["report"] or not final["report"].get("band"):
        out.append("chapter report has no band")
    if result["save"].get("present") is not True:
        out.append("save key career.save.v5 missing")
    elif result["save"].get("v") != 5:
        out.append("save version %r != 5" % result["save"].get("v"))
    resume = result["resume"]
    if not resume:
        out.append("resume probe never reached year 16")
    else:
        if not resume["resume_button"]:
            out.append("resume button hidden after reload")
        if not resume["same_screen"]:
            out.append("reload resumed on a different screen")
        if not resume["same_state"]:
            out.append("reload resumed with a different state")
    if result["audit"]["max_scroll"] > 390:
        out.append("horizontal overflow: scrollWidth %d" % result["audit"]["max_scroll"])
    if result["audit"]["violations"]:
        out.append("tap targets under 44 px: " + ", ".join(result["audit"]["violations"]))
    return out


def report(result, errors):
    final = result["final"]
    rep = final["report"] or {}
    resume = result["resume"] or {}
    print("door          %s · seed %d" % (result["door"], result["seed"]))
    print("decisions     %d (floor %d)" % (final["decisions"], MIN_DECISIONS))
    print("chapter       band %s · %s · score %s · route %s"
          % (rep.get("band", "—"), rep.get("bandName", "—"), rep.get("score", "—"), rep.get("route", "—")))
    print("page errors   %d" % len(errors))
    print("save          career.save.v5 · v%s · %s decisions"
          % (result["save"].get("v", "—"), result["save"].get("decisions", "—")))
    if resume:
        print("resume        y%s card %s · %s after reload"
              % (resume["year"], resume["card"], "identical" if resume["same_state"] and resume["same_screen"] else "different"))
    print("mobile 390    %s · %d target(s) under 44 px over %d screens"
          % ("no horizontal overflow" if result["audit"]["max_scroll"] <= 390 else "overflow %d px" % result["audit"]["max_scroll"],
             len(result["audit"]["violations"]),
             result["audit"]["views"]))


def clean_run(browser, seed, door, path):
    context, page, errors = open_page(browser, career_url(seed, door, path))
    result = drive(page, door, seed, check_resume=False)
    context.close()
    return result, errors


def main():
    ap = argparse.ArgumentParser(description="Drive one seeded career run and assert its behaviour.")
    ap.add_argument("--door", choices=DOORS, default="f4")
    ap.add_argument("--seed", type=int, default=11)
    ap.add_argument("--shots", help="directory for screenshots")
    ap.add_argument("--file", help="alternate career.html path")
    ap.add_argument("--twice", action="store_true", help="also prove determinism and seed spread with clean runs")
    args = ap.parse_args()

    with sync_playwright() as p:
        browser = launch(p)
        context, page, errors = open_page(browser, career_url(args.seed, args.door, args.file))
        result = drive(page, args.door, args.seed, shots=args.shots, check_resume=True)
        result["errors"] = list(errors)
        context.close()
        problems = failures(result)
        if errors:
            problems += ["pageerror: " + e for e in errors]
        report(result, errors)
        if args.twice:
            first, err_a = clean_run(browser, args.seed, args.door, args.file)
            second, err_b = clean_run(browser, args.seed, args.door, args.file)
            other, err_c = clean_run(browser, args.seed + 1, args.door, args.file)
            trace_equal = [
                (t["card"], t["option"], t["check"], t["win"]) for t in first["trace"]
            ] == [
                (t["card"], t["option"], t["check"], t["win"]) for t in second["trace"]
            ]
            report_equal = (
                (first["final"]["report"] or {}).get("score") == (second["final"]["report"] or {}).get("score")
                and (first["final"]["report"] or {}).get("band") == (second["final"]["report"] or {}).get("band")
                and first["final"]["checks"] == second["final"]["checks"]
                and first["final"]["wins"] == second["final"]["wins"]
            )
            spread = set(first["cards_seen"]) != set(other["cards_seen"])
            print("determinism   same seed: trace %s · report %s"
                  % ("identical" if trace_equal else "different",
                     "identical" if report_equal else "different"))
            print("seed spread   seed %d vs %d: %s"
                  % (args.seed, args.seed + 1,
                     "different card sets" if spread else "same card set"))
            if not trace_equal:
                problems.append("same seed produced a different decision trace")
            if not report_equal:
                problems.append("same seed produced a different report")
            if not spread:
                problems.append("seed %d and %d drew the same card set" % (args.seed, args.seed + 1))
            if err_a or err_b or err_c:
                problems.append("pageerror during determinism runs")
        browser.close()

    if problems:
        print("\nFAIL (%d)" % len(problems))
        for item in problems:
            print("  - " + item)
        sys.exit(1)
    print("\nPASS — full run, chapter report, save/resume and 390 px layout all hold.")


if __name__ == "__main__":
    main()
