#!/usr/bin/env python3
"""Prove every card-audit check fires, one broken fixture per check."""
import json
import re
import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
AUDIT = ROOT / "card_audit.py"
FIXTURES = ROOT / "fixtures"

CASES = [
    ("01-missing-judge.html", r"^NO JUDGE: c14_01:0 ", "judge coverage"),
    ("02-missing-fail-fx.html", r"^missing fail fx: c14_02:0$", "failure effect object"),
    ("03-missing-fail-line.html", r"^missing fail line: c14_03:0$", "failure result line"),
    ("04-fail-equals-success.html", r"^fail line equals success line: c14_04:0$", "distinct failure line"),
    ("05-heat-effect.html", r"removed resource 'heat' in fx: c14_05:1", "removed resource"),
    ("06-premise-too-long.html", r"^premise over 60: c14_06 = 61 chars$", "premise ceiling"),
    ("07-sublabel-too-long.html", r"^sub-label over 18: c14_07:1 = 19 chars$", "sub-label ceiling"),
    ("08-result-too-long.html", r"^result line over 30: c14_08:1 = 31 chars$", "result ceiling"),
    ("09-year-count.html", r"^card count y17: 10 \(budget 11\)$", "per-year budget"),
    ("10-route-count.html", r"^card count route f4: 9 \(budget 10\)$", "per-route budget"),
]


def run(fixture):
    proc = subprocess.run(
        [sys.executable, str(AUDIT), "--file", str(fixture), "--data-only", "--json"],
        capture_output=True,
        text=True,
    )
    stdout = proc.stdout.strip().splitlines()
    if not stdout:
        return proc.returncode, [], proc.stderr
    try:
        report = json.loads(stdout[-1])
    except json.JSONDecodeError:
        return proc.returncode, [], proc.stderr or proc.stdout
    return proc.returncode, report.get("problems", []), proc.stderr


def main():
    failures = 0

    rc, problems, err = run(FIXTURES / "ok.html")
    if rc == 0 and not problems:
        print("PASS  baseline — valid 74-card pool clears every check (ok.html)")
    else:
        failures += 1
        print("FAIL  baseline — expected exit 0 with no problems, got exit %d %s %s"
              % (rc, problems, err.strip()))

    for name, pattern, label in CASES:
        rc, problems, err = run(FIXTURES / name)
        hit = len(problems) == 1 and re.search(pattern, problems[0])
        if rc == 1 and hit:
            print("PASS  %s — %s fires on %s" % (label, problems[0], name))
        else:
            failures += 1
            print("FAIL  %s — expected exactly one /%s/ problem and exit 1, got exit %d %s %s"
                  % (label, pattern, rc, problems, err.strip()))

    if failures:
        print("\n%d fixture(s) failed." % failures)
    else:
        print("\nALL %d checks proved by fixtures." % (len(CASES) + 1))
    sys.exit(1 if failures else 0)


if __name__ == "__main__":
    main()
