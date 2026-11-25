#!/usr/bin/env python3
"""Card audit — every career.html option must carry a judgment.

Data layer:
  judge coverage for every option, legal effect keys, dc band 40-58,
  a failure branch with an effect object and a result line, failure text
  distinct from success text, no removed resources, text ceilings, and
  per-year / per-route card counts against the budget.

DOM layer:
  render every card and count the on-screen rate / risk-free badges,
  including the fourth option unlocked by the used-car skill.

Exits 1 on any problem, so CI can gate on it.

Usage:
  python3 tools/card_audit.py
  python3 tools/card_audit.py --file career.html
  python3 tools/card_audit.py --url http://127.0.0.1:8000/career.html
  python3 tools/card_audit.py --file tools/fixtures/ok.html --data-only

Requires: python3, playwright (pip install playwright; playwright install chromium).
"""
import argparse
import json
import os
import sys

from playwright.sync_api import sync_playwright

DATA_JS = r"""() => {
  const ATTRS=['rea','drv','men','sta','feel','nerve','disc'];
  const LEGAL=new Set([...ATTRS,'cash','fame','respect','inj','rel','route','mentor','family','rival','record']);
  const REMOVED=['heat'];
  const ROUTES=['f4','rally','street'];
  const YEAR_BUDGET=11, ROUTE_BUDGET=10;
  const len=s=>Array.from(s==null?'':String(s)).length;
  const rows=[], problems=[], seen=new Set();
  const yearCounts={}, routeCounts={};
  [14,15,16,17].forEach(y=>yearCounts[y]=0);
  ROUTES.forEach(r=>routeCounts[r]=0);
  const entries=[], ids=new Set();
  function add(c,src,route){
    if(!c||!c.id||ids.has(c.id))return;
    ids.add(c.id);
    entries.push({c:c,src:src,route:route||null});
  }
  function inspect(obj,key,kind){
    Object.keys(obj||{}).forEach(k=>{
      if(REMOVED.indexOf(k)>=0) problems.push("removed resource '"+k+"' in "+kind+": "+key);
      else if(!LEGAL.has(k)) problems.push('unknown '+kind+' key '+key+' '+k);
      const v=obj[k];
      if(v&&typeof v==='object'&&!Array.isArray(v)){
        Object.keys(v).forEach(n=>{
          if(REMOVED.indexOf(n)>=0) problems.push("removed resource '"+n+"' in "+kind+": "+key);
        });
      }
    });
  }
  CARDS.forEach(c=>add(c,'pool',ROUTES.indexOf(c.route)>=0?c.route:null));
  ROUTES.forEach(r=>{
    add(ENTRY[r],'entry',r);
    (ROUTE19[r]||[]).forEach(c=>add(c,'r19',r));
    const t=ROUTE20[r];
    if(Array.isArray(t)) t.forEach(c=>add(c,'r20',r)); else add(t,'r20',r);
    (ROUTE20B[r]||[]).forEach(c=>add(c,'r20b',r));
  });
  Object.keys(typeof RACE_CARDS==='object'&&RACE_CARDS?RACE_CARDS:{}).forEach(r=>{
    (RACE_CARDS[r]||[]).forEach(c=>add(c,'race',null));
  });
  entries.forEach(e=>{
    const c=e.c, y=(c.year!=null?c.year:c.y);
    if(c.kind!=='event' && y>=14 && y<=17) yearCounts[y]=(yearCounts[y]||0)+1;
    if(e.route && e.src!=='entry') routeCounts[e.route]=(routeCounts[e.route]||0)+1;
  });
  entries.forEach(e=>{
    const c=e.c;
    if(c.p!=null && len(c.p)>60) problems.push('premise over 60: '+c.id+' = '+len(c.p)+' chars');
    if(c.kind==='event') return;
    if(!Array.isArray(c.o)||!c.o.length){ problems.push('card has no options: '+c.id); return; }
    c.o.forEach((o,i)=>{
      const key=c.id+':'+i, jd=judgeOf(c,i);
      if(seen.has(key)) problems.push('duplicate judge key '+key);
      seen.add(key);
      const row={card:c.id,i:i,opt:o.t,auto:false};
      inspect(o.fx,key,'fx');
      if(o.s!=null && len(o.s)>18) problems.push('sub-label over 18: '+key+' = '+len(o.s)+' chars');
      if(o.l!=null && len(o.l)>30) problems.push('result line over 30: '+key+' = '+len(o.l)+' chars');
      const free=!!(jd&&jd.auto)||o.safe===true||o.free===true||o.risk===0||o.risk==='none';
      if(!jd&&!free){ problems.push('NO JUDGE: '+key+' ('+o.t+')'); rows.push(row); return; }
      if(free){
        row.auto=true; row.mode='auto';
        if(!o.fx) problems.push('auto option without fx: '+key);
      }else{
        row.mode='roll';
        if(ATTRS.indexOf(jd.chk)<0) problems.push('bad chk '+key+' = '+jd.chk);
        if(typeof jd.dc!=='number') problems.push('bad dc '+key);
        else{
          const m=dcBase(jd); row.dc=m;
          if(m<40||m>58) problems.push('dc out of band 40-58: '+key+' = '+m);
        }
        if(!jd.f||typeof jd.f!=='object'||!Object.keys(jd.f).length) problems.push('missing fail fx: '+key);
        else inspect(jd.f,key,'fail fx');
        if(jd.l==null||String(jd.l).trim()==='') problems.push('missing fail line: '+key);
        else{
          if(len(jd.l)>30) problems.push('failure line over 30: '+key+' = '+len(jd.l)+' chars');
          if(jd.l===o.l) problems.push('fail line equals success line: '+key);
        }
      }
      rows.push(row);
    });
    if(c.id==='y14a'){
      const k=c.id+':3', jd3=JUDGE[k];
      seen.add(k);
      if(!jd3) problems.push('NO JUDGE (skill option): '+k);
      else if(!jd3.auto){
        if(ATTRS.indexOf(jd3.chk)<0) problems.push('bad chk '+k);
        if(!jd3.f||!Object.keys(jd3.f).length) problems.push('empty fail fx '+k);
        if(!jd3.l||jd3.l.length<5) problems.push('missing fail line '+k);
      }
    }
  });
  const unused=Object.keys(JUDGE).filter(k=>!seen.has(k));
  [14,15,16,17].forEach(y=>{
    if(yearCounts[y]!==YEAR_BUDGET) problems.push('card count y'+y+': '+yearCounts[y]+' (budget '+YEAR_BUDGET+')');
  });
  ROUTES.forEach(r=>{
    if(routeCounts[r]!==ROUTE_BUDGET) problems.push('card count route '+r+': '+routeCounts[r]+' (budget '+ROUTE_BUDGET+')');
  });
  return {rows:rows, problems:problems, unused:unused,
          counts:{years:yearCounts, routes:routeCounts},
          judged:rows.filter(r=>r.mode==='roll').length, auto:rows.filter(r=>r.mode==='auto').length};
}"""

DOM_JS = r"""() => {
  const cards=[]; CARDS.forEach(c=>cards.push(c));
  ['f4','rally','street'].forEach(r=>{ cards.push(ENTRY[r]);
    (ROUTE19[r]||[]).forEach(c=>cards.push(c));
    const t=ROUTE20[r]; if(Array.isArray(t)) t.forEach(c=>cards.push(c)); else if(t) cards.push(t);
    (ROUTE20B[r]||[]).forEach(c=>cards.push(c)); });
  const bad=[]; let checked=0, badges=0;
  cards.forEach(c=>{
    if(!c||!c.o) return;
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
    ap.add_argument("--data-only", action="store_true", help="skip the DOM layer (fixtures)")
    args = ap.parse_args()

    target = "file://" + os.path.abspath(args.file) if args.file else args.url
    errors = []
    with sync_playwright() as p:
        browser = p.chromium.launch(
            args=["--no-sandbox"],
            executable_path=os.environ.get("PLAYWRIGHT_CHROME_PATH") or None,
        )
        page = browser.new_page()
        page.on("pageerror", lambda e: errors.append(str(e)))
        page.goto(target, wait_until="domcontentloaded")
        ready = "typeof JUDGE !== 'undefined' && typeof judgeOf === 'function'"
        if not args.data_only:
            ready += " && typeof renderCard === 'function'"
        page.wait_for_function("() => " + ready, timeout=15000)
        data = page.evaluate(DATA_JS)
        dom = None if args.data_only else page.evaluate(DOM_JS)
        browser.close()

    problems = list(data["problems"])
    if dom is not None:
        problems += list(dom["bad"])
        if dom["withSkill"] != 4:
            problems.append("skill option missing: expected 4 buttons, got %d" % dom["withSkill"])
        if dom["badges"] != dom["checked"]:
            problems.append("DOM badges %d != rendered options %d" % (dom["badges"], dom["checked"]))
    problems += list(data["unused"])
    if errors:
        problems += ["pageerror: " + e for e in errors]

    report = {
        "target": target,
        "base_options": len(data["rows"]),
        "judged": data["judged"],
        "auto": data["auto"],
        "skill_option": None if dom is None else dom["withSkill"] == 4,
        "dom_badges": None if dom is None else dom["badges"],
        "dom_checked": None if dom is None else dom["checked"],
        "counts": data["counts"],
        "problems": problems,
    }
    if args.json:
        print(json.dumps(report, ensure_ascii=False))
    else:
        years = report["counts"]["years"]
        routes = report["counts"]["routes"]
        print("target        %s" % report["target"])
        print("base options  %d" % report["base_options"])
        print("judged / auto %d / %d" % (report["judged"], report["auto"]))
        print("card counts   y14 %d · y15 %d · y16 %d · y17 %d · f4 %d · rally %d · street %d"
              % (years["14"], years["15"], years["16"], years["17"], routes["f4"], routes["rally"], routes["street"]))
        if dom is not None:
            print("DOM badges    %d / %d rendered options" % (report["dom_badges"], report["dom_checked"]))
            print("skill option  %s" % ("OK (4 buttons)" if report["skill_option"] else "MISSING"))
        if problems:
            print("\nPROBLEMS (%d)" % len(problems))
            for x in problems:
                print("  - " + x)
        else:
            print("\nPASS — every option has a judgment and renders a badge." if dom is not None
                  else "\nPASS — every card option has a judgment.")
    sys.exit(1 if problems else 0)


if __name__ == "__main__":
    main()
