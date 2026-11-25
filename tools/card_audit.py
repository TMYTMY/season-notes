#!/usr/bin/env python3
"""Card audit — 每個 career.html 選項都必須有判定。

兩層檢查：
  1) 資料層：JUDGE 有冇覆蓋每個選項；chk 合法、dc 映射後落喺 40–58、
     失敗效果 key 合法、有失敗句、失敗句唔可以同成功句一樣。
  2) DOM 層：逐張卡真正 renderCard()，數畫面上有冇「成功率／無風險」標籤，
     包括技能解鎖後嘅第 4 個選項。

有問題會 exit 1，可以直接放 CI。

用法：
  python3 tools/card_audit.py                       # 打 live
  python3 tools/card_audit.py --file career.html    # 打本機檔
  python3 tools/card_audit.py --url http://127.0.0.1:8000/career.html

需要：python3、playwright（`pip install playwright` 然後 `playwright install chromium`）。
"""
import argparse
import json
import os
import sys

from playwright.sync_api import sync_playwright

DATA_JS = r"""() => {
  const ATTRS=['rea','drv','men','sta','feel','nerve','disc'];
  const LEGAL=new Set([...ATTRS,'cash','fame','heat','respect','inj','rel','route','mentor','family','rival']);
  const cards=[];
  CARDS.forEach(c=>cards.push(c));
  ['f4','rally','street'].forEach(r=>{
    cards.push(ENTRY[r]);
    (ROUTE19[r]||[]).forEach(c=>cards.push(c));
    if(ROUTE20[r]) cards.push(ROUTE20[r]);
    (ROUTE20B[r]||[]).forEach(c=>cards.push(c));
  });
  const rows=[], problems=[], seen=new Set();
  cards.forEach(c=>{
    c.o.forEach((o,i)=>{
      const key=c.id+':'+i, jd=judgeOf(c,i);
      if(seen.has(key)) problems.push('duplicate judge key '+key);
      seen.add(key);
      const row={card:c.id,i:i,opt:o.t,auto:!!(jd&&jd.auto)};
      Object.keys(o.fx||{}).forEach(k=>{ if(!LEGAL.has(k)) problems.push('unknown fx key '+key+' '+k); });
      if(!jd){ problems.push('NO JUDGE: '+key+' ('+o.t+')'); rows.push(row); return; }
      if(jd.auto){
        row.mode='auto';
        if(!o.fx) problems.push('auto option without fx: '+key);
      }else{
        row.mode='roll';
        if(ATTRS.indexOf(jd.chk)<0) problems.push('bad chk '+key+' = '+jd.chk);
        if(typeof jd.dc!=='number') problems.push('bad dc '+key);
        const m=dcBase(jd); row.dc=m;
        if(m<40||m>58) problems.push('dc out of band 40-58: '+key+' = '+m);
        if(!jd.f||!Object.keys(jd.f).length) problems.push('empty fail fx: '+key);
        else Object.keys(jd.f).forEach(k=>{ if(!LEGAL.has(k)) problems.push('illegal fail key '+key+' '+k); });
        if(!jd.l||jd.l.length<5) problems.push('missing fail line: '+key);
        if(jd.l===o.l) problems.push('fail line equals success line: '+key);
      }
      rows.push(row);
    });
    if(c.id==='y14a'){
      const k=c.id+':3', jd3=JUDGE[k];      // 二手車專家第 4 個選項
      seen.add(k);
      if(!jd3){ problems.push('NO JUDGE (skill option): '+k); }
      else if(!jd3.auto){
        if(ATTRS.indexOf(jd3.chk)<0) problems.push('bad chk '+k);
        if(!jd3.f||!Object.keys(jd3.f).length) problems.push('empty fail fx '+k);
        if(!jd3.l||jd3.l.length<5) problems.push('missing fail line '+k);
      }
    }
  });
  const unused=Object.keys(JUDGE).filter(k=>!seen.has(k));
  return {rows:rows, problems:problems, unused:unused,
          judged:rows.filter(r=>r.mode==='roll').length, auto:rows.filter(r=>r.mode==='auto').length};
}"""

DOM_JS = r"""() => {
  const cards=[]; CARDS.forEach(c=>cards.push(c));
  ['f4','rally','street'].forEach(r=>{ cards.push(ENTRY[r]);
    (ROUTE19[r]||[]).forEach(c=>cards.push(c)); if(ROUTE20[r])cards.push(ROUTE20[r]);
    (ROUTE20B[r]||[]).forEach(c=>cards.push(c)); });
  const bad=[]; let checked=0, badges=0;
  cards.forEach(c=>{
    renderCard(c);
    const btns=[...document.querySelectorAll('#cardOpts .opt')];
    if(btns.length!==c.o.length) bad.push(c.id+' button count '+btns.length+' vs '+c.o.length);
    btns.forEach((b,i)=>{ if(!b.querySelector('.rate')) bad.push(c.id+':'+i+' NO BADGE'); else badges++; });
    checked+=btns.length;
  });
  const prev=S.mod.usedcar; S.mod.usedcar=true;
  renderCard(CARDS.find(c=>c.id==='y14a'));
  const withSkill=[...document.querySelectorAll('#cardOpts .opt')].length;
  S.mod.usedcar=prev;
  return {checked:checked, badges:badges, bad:bad, withSkill:withSkill};
}"""


def main():
    ap = argparse.ArgumentParser(description="Audit every career.html option for a judgment.")
    ap.add_argument("--file", help="local career.html path (file://)")
    ap.add_argument("--url", default="https://tmytmy.github.io/season-notes/career.html")
    ap.add_argument("--json", action="store_true", help="print machine-readable result only")
    args = ap.parse_args()

    target = "file://" + os.path.abspath(args.file) if args.file else args.url
    errors, report = [], {}
    with sync_playwright() as p:
        browser = p.chromium.launch(
            args=["--no-sandbox"],
            executable_path=os.environ.get("PLAYWRIGHT_CHROME_PATH") or None,
        )
        page = browser.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(target, wait_until="domcontentloaded")
        page.wait_for_function("() => typeof JUDGE !== 'undefined' && typeof renderCard === 'function'", timeout=15000)
        data = page.evaluate(DATA_JS)
        dom = page.evaluate(DOM_JS)
        browser.close()

    problems = list(data["problems"]) + list(dom["bad"]) + list(data["unused"])
    if dom["withSkill"] != 4:
        problems.append("skill option missing: expected 4 buttons, got %d" % dom["withSkill"])
    if dom["badges"] != dom["checked"]:
        problems.append("DOM badges %d != rendered options %d" % (dom["badges"], dom["checked"]))
    if errors:
        problems += ["pageerror: " + e for e in errors]

    report = {
        "target": target,
        "base_options": len(data["rows"]),
        "judged": data["judged"],
        "auto": data["auto"],
        "skill_option": dom["withSkill"] == 4,
        "dom_badges": dom["badges"],
        "dom_checked": dom["checked"],
        "problems": problems,
    }
    if args.json:
        print(json.dumps(report, ensure_ascii=False))
    else:
        print("target        %s" % report["target"])
        print("base options  %d" % report["base_options"])
        print("judged / auto %d / %d" % (report["judged"], report["auto"]))
        print("DOM badges    %d / %d rendered options" % (report["dom_badges"], report["dom_checked"]))
        print("skill option  %s" % ("OK (4 buttons)" if report["skill_option"] else "MISSING"))
        if problems:
            print("\nPROBLEMS (%d)" % len(problems))
            for x in problems:
                print("  - " + x)
        else:
            print("\nPASS — every option has a judgment and renders a badge.")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
