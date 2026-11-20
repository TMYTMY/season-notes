# FRAMEWORK — 生涯／抉擇遊戲引擎

一個單檔、離線、手機優先的「每回合做選擇、累積後果」遊戲框架。
**引擎唔知題材存在**；所有世界觀、文案、數值、場景圖都來自一個 PACK。

```
src/
  framework.js     引擎（狀態機、存檔、選卡、結算、場景動畫、四個 screen）
  ui.html          版面骨架（只有 data-l 槽位，冇任何題材文字）
  _css.css         樣式（token 化）
  packs/f1.js      PACK：F1 車手生涯（現貨，8 場／30 卡）
  packs/bistro.js  PACK：餐廳主廚生涯（示範，6 週／18 卡，證明換主題即刻可用）
build.py           把以上縫成 season-notes.html
```

## 換主題要幾多功夫

```bash
# 1. 複製 src/packs/f1.js 做 src/packs/<新主題>.js
# 2. 改 meta / labels / create / archetypes / cats / scoring / entities / cards / narrative
# 3. 改 build.py 一行預設，或者用 query string 揀
python3 build.py                # 預設 pack
PACK=bistro python3 build.py    # 換預設
season-notes.html?pack=bistro   # 同一個檔，執行時切換
```

`framework.js`、`ui.html`、`_css.css` **一個字都唔使改**。

## PACK 規格

| 欄位 | 作用 |
|---|---|
| `meta.id` | pack 名（query string 用） |
| `meta.title` / `subject` | 產品名／主體（例：`SEASON NOTES` / `AURORA JUNIOR`） |
| `meta.saveKey` | localStorage key，每個 pack 獨立存檔 |
| `meta.rounds` / `field` | 一季幾場／同場幾多人 |
| `meta.season` | 年份或季度字串 |
| `labels{}` | **所有 UI 名詞**（位置、積分、聲望、體能、紀錄、按鈕…）。引擎只認 key，唔認字 |
| `create{}` | 建立頁：標題、開場白、欄位名、預設名、CTA、第一句無線電 |
| `archetypes{}` | 玩家風格；`riskMul` 影響所有選擇的風險倍率 |
| `cats[]` | 每場六個決策的類別（長度＝每場決策數） |
| `scoring[]` | 名次→分數表 |
| `entities.circuits[]` | 每場的地點（`{n,s}` 全名／簡寫） |
| `entities.rivals[]` / `teams[]` | 對手名／隊名池 |
| `cards{cat:[...]}` | 內容庫；每張 `{t:標題, p:處境, r:無線電, who:發話者, o:[{t,s,fx,l}]}` |
| `narrative.story(ctx)` | 賽後文案（`ctx.res/C/R/style`） |
| `narrative.seasonEnd(ctx)` | 季尾文案（`ctx.tier('A'\|'B'\|'C')/C/podiums/dnfs/style`）→ `{eyebrow,head,body}` |
| `scenes{cat:()=>({...})}` | 場景圖，見下 |

### 選擇數值 `fx`

`d` 名次變化、`risk` 風險 %、`rep` 聲望、`fit` 體能（負數扣）、`pts` 直接分。
`l` 係揀完之後寫入紀錄的一句話。

### 場景兩種形態

```js
// A. 賽道型（有車會動）—— F1 用
{cap:'STRAIGHT · 尾流', spd:'318 km/h',
 cars:[{c:'#d9533f'},{c:'#4ea0ff'}],              // 兩架對手顏色
 init:{me:{lane:1,f:.40}, rv:[{lane:1,f:.58},{lane:0,f:.62}]},
 lanes:['M …','M …','M …'],                        // 三條 SVG path
 svg:'…'}

// B. 靜態型（無車）—— 任何非賽車題材
{cap:'PASS · 出餐口', spd:'7 張單', zoom:1,        // zoom:1 = 唔做垂直放大
 svg:'…'}
```

`svg` 用 800×172 座標系。靜態型會用 `xMidYMid slice`（裁切、唔變形），
所以裝飾物件請放喺 **x 200–600** 之間，太貼邊會被裁走。

## 引擎已經有嘅嘢

- 四個 screen：建立／比賽／賽後／賽季
- 存檔（自動、可續玩、版本檢查 `v:2`）
- 每次抽卡避開重複（同一 seed 可重現整季）
- 每場六個決策，風險倍率、賽後結算、積分榜、聲望紀錄
- 選完有 2–3 秒動畫（爬頭／被爬／退賽）＋ picked 狀態
- 手機 390 零橫向溢出、按鈕 ≥44px、`prefers-reduced-motion`
- 季尾 tier 判定（分數＋頒獎台次數）→ 交畀 pack 寫文案

## 已知限制

- 場景係程序化 SVG，唔係插畫；換主題仍然要你（或者設計）畫新場景
- 每場固定六個決策（由 `cats.length` 決定，改長度會影響進度點與文案數組）
- 冇音效、冇多人、冇雲端存檔
- PACK 之間存檔分開，但**生涯唔會跨 pack 繼承**
