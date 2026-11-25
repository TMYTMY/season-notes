# tools/

## card_audit.py

每次改 `career.html` 或 `career-cards.js` 之後跑一次。任何 agent（Hermes／Cursor／Codex）都可以用，唔需要我喺場。

```bash
python3 -m pip install playwright
python3 -m playwright install chromium

python3 tools/card_audit.py --file career.html        # 本機檔
python3 tools/card_audit.py                           # 打 live
python3 tools/card_audit.py --url http://127.0.0.1:8000/career.html
```

有問題 exit 1，CI 直接 gate。檢查：

1. **Judge 覆蓋** — 每個選項要麼有 `JUDGE['<cardId>:<index>']`，要麼明確標示無風險（judge 係 `{auto:1}`，或選項有 `safe:true`／`free:true`／`risk:0`／`risk:'none'`）。冇 judge 會報 `NO JUDGE: <cardId>:<index>`。
2. **風險選項嘅失敗分支** — 一定要有非空 `f`（效果 object）同非空 `l`（失敗句）；失敗句唔可以同成功句一樣。
3. **效果 key** — 只准七個屬性加 `cash`、`fame`、`respect`、`inj`、`rel`、`route`、`mentor`、`family`、`rival`、`record`。`heat` 已刪除，任何 `fx` 或失敗效果再出現 `heat` 都會報 `removed resource 'heat'`。
4. **文字上限** — premise ≤ 60、選項副標 ≤ 18、結果句（成功同失敗）≤ 30 個字（Unicode code point）。超限會報實測長度。
5. **卡數預算** — 14–17 歲每年 11 張（`kind:'event'` 唔計），19–20 每條路線 10 張。唔啱會逐年逐路線列出實數同預算。
6. **DOM 層** — 逐張卡真 `renderCard()`，數畫面有冇「成功率／無風險」標籤；技能解鎖後 y14a 要變 4 個掣。

輸出示例：

```
base options  231
judged / auto 77 / 154
card counts   y14 11 · y15 11 · y16 11 · y17 11 · f4 10 · rally 10 · street 10
DOM badges    231 / 231 rendered options
skill option  OK (4 buttons)
PASS — every option has a judgment and renders a badge.
```

`--data-only` 會跳過 DOM 層，只做資料檢查；俾 fixture 用，唔好當正式 audit。

## run_fixtures.py

證明每一個檢查真係會 fire：每個 fixture 只帶一個缺陷，跑 `card_audit.py --data-only --json`，要求 exit 1、而且**只有一個** problem 命中預期訊息。

```bash
python3 tools/run_fixtures.py
```

輸出每個檢查一行 PASS，最後 `ALL 11 checks proved by fixtures.`；任何 fixture 冇 fire 或者 fire 多過一個檢查都會 FAIL 並 exit 1。CI 每次都會跑埋。

Fixture 一覽（`tools/fixtures/`）：

| 檔案 | 缺陷 |
| --- | --- |
| `ok.html` | 乾淨 baseline，74 張決策卡齊預算，必須 exit 0 |
| `01-missing-judge.html` | 風險選項冇 judge 條目 |
| `02-missing-fail-fx.html` | 失敗分支冇效果 object |
| `03-missing-fail-line.html` | 失敗分支冇結果句 |
| `04-fail-equals-success.html` | 失敗句同成功句一樣 |
| `05-heat-effect.html` | 效果引用已刪除嘅 `heat` |
| `06-premise-too-long.html` | premise 61 字（上限 60） |
| `07-sublabel-too-long.html` | 副標 19 字（上限 18） |
| `08-result-too-long.html` | 結果句 31 字（上限 30） |
| `09-year-count.html` | 17 歲少一張卡（10／11） |
| `10-route-count.html` | f4 路線少一張卡（9／10） |

`base.js` 用程式生成合法卡池（44 張年份卡＋30 張路線卡＋3 張 entry），fixture 只在其上改一個缺陷。

加卡／加選項之後，記得同步加 `JUDGE['<cardId>:<index>']`，否則 audit 會報 `NO JUDGE`。
