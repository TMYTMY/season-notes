# tools/

## play_test.py

真行為測試：開 headless Chromium 載入 `career.html?seed=<n>`，逐個畫面撳真掣行完一局，再驗玩家見到嘅嘢。

```bash
python3 -m pip install playwright
python3 -m playwright install chromium

python3 tools/play_test.py --door f4 --seed 11
python3 tools/play_test.py --door street --seed 11 --shots /tmp/shots
python3 tools/play_test.py --door rally --seed 11 --twice
```

每個 run 會 assert：

1. **決策數** — 最少 26 個（正常一局 30 個）。
2. **Chapter report** — 行到 20 歲，有 band、score、route。
3. **零 pageerror**。
4. **Save key** — `localStorage['career.save.v5']` 存在、`v: 5`。
5. **Save-resume** — 16 歲中途 reload，撳「繼續上一局」，返到同一張卡，`__snapshot()` 同 reload 前完全一樣。
6. **390×844** — `scrollWidth` 唔超過 390，所有可見 `button`／`a[href]` 最少 44×44，逐個畫面檢查。

`--door` 用現有 `?door=` demo 參數行指定路線；`--shots DIR` 會將 intro／時間分配／卡／門／報告截圖寫入 DIR；`--twice` 另外跑兩次同 seed 加一次 seed+1，證明決策、骰、報告一致，而唔同 seed 會出唔同卡集（多花約 40 秒）。

Harness 用 `prefers-reduced-motion` 加速，但仍然行真 click flow。`PLAYWRIGHT_CHROME_PATH` 可以指定 Chromium binary，冇設就用 Playwright 內置嗰個。

選項 policy 固定，所以 seed 可重現：普通卡輪流揀 option index；18 歲波箱一定揀棍波；路試肥佬會再考，三次之後買牌，唔會揀「放棄考牌」提早收場。

## balance.py

同一個 seam 跑 N 個 seed × 每條路線，出數而唔係感覺：

```bash
python3 tools/balance.py --runs 3 --out /tmp/balance.json
python3 tools/balance.py --runs 10 --door f4 --seed 100 --out /tmp/f4.json
```

每條路線印一個 block：七個屬性 min／median／max、chapter band 分佈、roll 勝率、受傷率、卡池覆蓋（見過幾多個 card id／全池）、決策數分佈；最後印 `all routes` 合計。

```text
f4 · 3 runs · seeds 11–13
  attr     min  median  max
  rea      49      55    62
  ...
  bands        B 3
  rolls        29/42 won (69.0%)
  injuries     2/3 runs (66.7%)
  coverage     43/75 card ids (57.3%)
  decisions    min 30 · median 30 · max 30
```

JSON 寫去 `--out`，top-level keys：`generated`、`career`、`runs_per_route`、`seeds`、`card_pool`、`routes`、`overall`、`playthroughs`。`playthroughs` 每個 run 一行（seed、band、score、屬性、checks／wins、傷患、見過嘅卡），可以直接 diff 兩次改動。

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
