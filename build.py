#!/usr/bin/env python3
"""build.py — 把 src/ 組裝成單一離線 HTML。

用法：
    python3 build.py              # 預設 pack = f1
    PACK=bistro python3 build.py  # 換預設主題

輸出：season-notes.html（根目錄，可直接雙擊／上 GitHub Pages）
換主題＝換 src/packs/*.js，framework 同 ui 唔使改。
"""
import glob
import os

ROOT = os.path.dirname(os.path.abspath(__file__))
SRC = os.path.join(ROOT, "src")
DEFAULT_PACK = os.environ.get("PACK", "f1")

read = lambda p: open(p, encoding="utf-8").read()

css = read(os.path.join(SRC, "_css.css"))
body = read(os.path.join(SRC, "ui.html"))
framework = read(os.path.join(SRC, "framework.js"))

pack_files = sorted(glob.glob(os.path.join(SRC, "packs", "*.js")))
# 預設 pack 排先，其餘照檔名
pack_files.sort(key=lambda p: (os.path.basename(p) != DEFAULT_PACK + ".js",
                               os.path.basename(p)))
packs = "\n\n".join(read(p) for p in pack_files)
pack_ids = [os.path.basename(p)[:-3] for p in pack_files]

html = f"""<!DOCTYPE html>
<html lang="zh-Hant">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<meta name="theme-color" content="#0d1322">
<title>Notes</title>
<style>
{css}
</style>
</head>
<body>
{body}
<script>window.PACKS = {{}}; window.DEFAULT_PACK = {DEFAULT_PACK!r};</script>
<script>
{packs}
</script>
<script>
{framework}
</script>
</body>
</html>
"""

out = os.path.join(ROOT, "season-notes.html")
open(out, "w", encoding="utf-8").write(html)

print(f"built {out}")
print(f"  packs: {', '.join(pack_ids)}  (default: {DEFAULT_PACK})")
print(f"  size : {len(html):,} bytes")
