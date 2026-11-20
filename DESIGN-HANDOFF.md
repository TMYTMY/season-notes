# DESIGN HANDOFF — F1 車手生涯遊戲

> 分工：**Grok bot 出 UI/UX spec**；**Hermes 負責實作 code**（唔會自行改設計方向）。  
> 最後更新：2026-11-19 夜

## 1. 專案基本資料

- 產品：F1 車手生涯敘事遊戲（你係車手但唔揸車，一場＝6 個抉擇，8 場一季）
- 檔案：`home/games/season-notes.html`（**單一 HTML 檔**，CSS/JS 全內嵌）
- 現況：可玩完整一場；手機 390×844 與桌面 1500×950 已實測；正加入內容庫＋存檔＋賽季層

## 2. 硬性技術限制（設計前必須知）

| 限制 | 原因 |
|---|---|
| 單一 `.html`、零外部請求 | 公司電腦離線可開，proxy 會擋 CDN |
| 不可用 webfont | 只能系統字：`Georgia`（襯線）、`Noto Sans TC` / `PingFang TC` / `Microsoft JhengHei`（無襯線）、`ui-monospace`（數字） |
| 不可用外部圖檔／icon 庫 | 場景全部用內嵌 SVG 或 CSS 畫 |
| 手機直向優先 | 390×844 必須 `scrollWidth ≤ innerWidth`，可點元素 ≥44px |
| 動畫 ≤ 3 秒 | 每個抉擇後 2–3 秒結果動畫（爬頭成功／失敗／撞車） |
| 無音效 | Office 環境，預設靜音 |

## 3. Screen 清單（Grok 要出 spec 的對象）

| # | Screen | DOM 根 | 內容 |
|---|---|---|---|
| 1 | 建立車手 | `#scCreate` | 標題、說明、車手名輸入、風格三選一、開始按鈕、seed |
| 2 | 比賽（核心） | `#scRace` | HUD、賽道處境圖＋結果動畫、抉擇卡×3、狀態卡、無線電、紀錄 |
| 3 | 賽後成績 | `#scResult` | 名次大字、積分、敘事文、Classification 表、繼續 |

## 4. 現有結構（class 名，spec 用呢啲指位置）

```
.screen / .screen.on            畫面容器
.hud .right                     頂部狀態（積分／聲望／體能）
.scene                          賽道處境圖（內嵌 SVG #sceneSvg）
  .scene .cap / .spd            左上情境標籤 / 右上速度
  .sceneMsg                     結果動畫訊息 pill（.ok / .bad）
  .flash                        成功／失敗光暈
.moment .beat                   決策進度（DECISION 1 / 6）
.moment h2                      情境大標題
.moment .prompt                 情境描述
.opts .btn                      選項卡（.danger 有風險 / .safe 零風險）
  .opts .btn .risk              風險 badge（右側「風險 18%」）
.consequence                    後果文字（金句）
.side .card                     右欄卡：今場狀態／PIT RADIO／你嘅紀錄
.stat                           一行 label + 數值
.ticker（舊版，未用於生涯版）
.posBig                         賽後名次大字
.rrow / .rrow.me                Classification 一行
```

## 5. Design tokens（現值，Grok 可直接改呢個表）

```css
:root{
  --ink:#0d1322; --ink2:#080d18; --card:#121a2c; --card2:#0e1524;
  --line:#1e2a40; --line2:#27354e;
  --cream:#f2efe6; --tx:#e8ecf4; --slate:#b9c0cc; --muted:#7d8798;
  --gold:#f2c14e; --gold2:#d8a63a; --red:#d9533f; --green:#3fbf8b;
}
```

現有字級（可改，但要成個 scale 一齊改）：

- 情境大標 33px（手機 21px）／serif
- 選項文字 13.5px（手機 14.5px）／sans 700
- 選項副文 11.5px（手機 12.5px）／muted
- 狀態 label 12px、數值 mono 600
- 賽後名次 96px（手機 62px）／mono

## 6. 已知問題（Tommy 原話：「而家好難睇」）

1. 選項副文對比不足（`--muted` 在深底上偏暗）
2. 風險 badge 貼近文字，長文案會擠
3. 「今場狀態」卡與背景同色，只靠一條細線分隔
4. 頂部 HUD 數值字太細，同標題比例失衡
5. 賽道圖上方留白偏多，280 km/h 貼邊

## 7. 交收格式（建議 Grok 照呢個出）

每個 screen 一段，每段包含：

1. **Layout**：區塊順序、對齊、左右邊距、垂直節奏（用 px／8pt grid）
2. **Type scale**：每個文字角色的 size / weight / line-height / colour token
3. **Colour**：只用 token 名（例如 `--gold`），唔好直接寫 hex
4. **Component states**：default / hover / active / disabled / danger
5. **Spacing**：padding、gap、卡片內距
6. **Motion**：時長、easing、觸發條件（≤3 秒）

我收到 spec 之後：改 token 表 → 逐個 screen 對位 → 手機＋桌面實測（`pageerror` 0、零橫向溢出）→ 交截圖。

## 8. 實作邊界（唔好越界）

- Grok spec **唔需要**管：風險計算、seed 隨機、名次算法、文案語氣（廣東話口語）
- Hermes **唔會**自行改設計方向；spec 有衝突時會問，唔會自己揀
- 所有改動只限 `home/games/season-notes.html`（唔碰 vault）
