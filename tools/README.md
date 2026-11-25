# tools/

## card_audit.py

每次改 `career.html` 嘅卡／判定之後跑一次。任何 agent（Hermes／Cursor／Codex）都可以用，唔需要我喺場。

```bash
python3 -m pip install playwright
python3 -m playwright install chromium

python3 tools/card_audit.py --file career.html        # 本機檔
python3 tools/card_audit.py                           # 打 live
python3 tools/card_audit.py --url http://127.0.0.1:8000/career.html
```

檢查兩層，有問題 exit 1：

1. **資料層** — 每個選項都有 `JUDGE` 記錄；`chk` 係合法屬性；難度映射後落喺 40–58；失敗效果 key 合法；有失敗句而且唔同成功句。
2. **DOM 層** — 逐張卡真 `renderCard()`，數畫面有冇「成功率／無風險」標籤；技能解鎖後 y14a 要變 4 個掣。

輸出示例：

```
base options  102
judged / auto 64 / 38
DOM badges    102 / 102 rendered options
skill option  OK (4 buttons)
PASS — every option has a judgment and renders a badge.
```

加卡／加選項之後，記得同步加 `JUDGE['<cardId>:<index>']`，否則 audit 會報 `NO JUDGE`。
