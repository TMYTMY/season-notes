#!/usr/bin/env python3
import json
import pathlib
import subprocess
import sys
import tempfile

ROOT = pathlib.Path(__file__).resolve().parents[1]
HTML = ROOT / "career.html"
START = "var RACE_SERIES={"
END = ("if(typeof module!=='undefined'&&module.exports)module.exports="
       "{RACE_SERIES:RACE_SERIES,raceSeriesOf:raceSeriesOf,raceDerive:raceDerive,"
       "raceLineup:raceLineup,raceCardText:raceCardText};")

HARNESS = r"""
const E=require(process.argv[2]);
const S=E.RACE_SERIES;
function rng(seed){let a=seed>>>0;return function(){a=(a+0x6D2B79F5)>>>0;let t=Math.imul(a^(a>>>15),1|a);t=(t+Math.imul(t^(t>>>7),61|t))^t;return ((t^(t>>>14))>>>0)/4294967296}}
const bands=[40,60,120,250,500,1000,2500,6000,12000];
const feats=['彎','車','雨','路面','終點'];
function draw(r,n){const out=[];for(let i=0;i<n;i++){out.push({prog:r(),feature:feats[Math.floor(r()*feats.length)],distBand:bands[Math.floor(r()*bands.length)]})}return out}
const series=['kart','f4','rally','mountain'];
const inv={};
series.forEach(function(key,si){
  const sp=S[key], r=rng(1600+si*7919);
  const v={draws:10000,cards:0,indexViol:0,toGoViol:0,distViol:0,limitViol:0,negViol:0};
  for(let d=0;d<10000;d++){
    const list=draw(r,1+Math.floor(r()*3));
    if(r()<0.35){
      list.splice(Math.floor(r()*(list.length+1)),0,{prog:0.86+r()*0.14,feature:'終點',distBand:bands[Math.floor(r()*bands.length)]});
    }
    const out=E.raceLineup(list,key);
    v.cards+=out.length;
    for(let i=0;i<out.length;i++){
      const x=out[i];
      const idx=x.form==='lap'?x.lap:(x.form==='stage'?x.stage:(x.corner||null));
      if(idx!==null&&idx!==undefined){
        if(i>0){
          const q=out[i-1];
          const qidx=q.form==='lap'?q.lap:(q.form==='stage'?q.stage:(q.corner||null));
          if(qidx!==null&&qidx!==undefined&&idx<qidx)v.indexViol++;
        }
        const lim=x.form==='lap'||x.form==='stage'?sp.limit:sp.corners;
        if(idx>lim||idx<1)v.limitViol++;
      }
      if(i>0&&!(x.toGo<out[i-1].toGo))v.toGoViol++;
      if(x.dist>x.toGo)v.distViol++;
      if(x.dist<0||x.toGo<0)v.negViol++;
    }
  }
  inv[key]=v;
});
const S20={key:'f4',form:'lap',name:'F4',limit:20,distance:5000,corners:0,cornerBased:false};
const ex=[0.18,0.40,0.62,0.90].map(function(p){return E.raceDerive({prog:p,feature:'彎',distBand:5000},S20)});
const exOk=ex.map(function(x){return x.lap}).join(',')==='4,8,13,18'&&
  ex.map(function(x){return x.toGo}).join(',')==='4100,3000,1900,500'&&
  ex.map(function(x){return x.dist}).join(',')==='2450,1800,1150,300';
const fr=rng(9091);
const fin={draws:1000,count:0,notOne:0,notLast:0,notLimit:0};
for(let d=0;d<1000;d++){
  const list=draw(fr,2+Math.floor(fr()*3));
  list.splice(Math.floor(fr()*(list.length+1)),0,{prog:0.9+fr()*0.1,feature:'終點',distBand:bands[Math.floor(fr()*bands.length)]});
  const out=E.raceLineup(list,{key:'f4',form:'lap',name:'F4',limit:20,distance:5000,corners:0,cornerBased:false});
  const fins=out.filter(function(x){return x.finish});
  fin.count+=fins.length;
  if(fins.length!==1)fin.notOne++;
  if(!out[out.length-1].finish)fin.notLast++;
  if(out[out.length-1].lap!==20)fin.notLimit++;
}
const forms=['kart','f4','rally','mountain'].map(function(k){
  const d=E.raceDerive({prog:0.45,feature:'彎',distBand:600},k);
  return {series:k,line:d.line,lap:d.lap,stage:d.stage,corner:d.corner,toGo:d.toGo,dist:d.dist};
});
const ordered=E.raceLineup([
  {prog:0.9,feature:'彎',distBand:800},
  {prog:0.2,feature:'車',distBand:800},
  {prog:0.98,feature:'終點',distBand:800},
  {prog:0.6,feature:'雨',distBand:800}
],'f4').map(function(x){return {prog:x.prog,lap:x.lap,toGo:x.toGo,finish:x.finish}});
console.log(JSON.stringify({inv:inv,example:ex,exampleOk:exOk,finish:fin,forms:forms,ordered:ordered}));
"""


def main():
    src = HTML.read_text(encoding="utf-8")
    start = src.index(START)
    end = src.index(END) + len(END)
    engine = src[start:end]
    with tempfile.TemporaryDirectory() as tmp:
        eng = pathlib.Path(tmp) / "engine.js"
        harness = pathlib.Path(tmp) / "harness.js"
        eng.write_text(engine, encoding="utf-8")
        harness.write_text(HARNESS, encoding="utf-8")
        proc = subprocess.run(
            ["node", str(harness), str(eng)],
            capture_output=True, text=True, timeout=180,
        )
    if proc.returncode != 0:
        print(proc.stdout)
        print(proc.stderr)
        return 1
    data = json.loads(proc.stdout)

    failures = []
    print("== invariants: 10,000 draws per series ==")
    print("series    cards   index   toGo   dist   limit   neg")
    for key, v in data["inv"].items():
        print("%-8s %7d %7d %6d %6d %7d %5d" % (
            key, v["cards"], v["indexViol"], v["toGoViol"], v["distViol"],
            v["limitViol"], v["negViol"]))
        for name in ("indexViol", "toGoViol", "distViol", "limitViol", "negViol"):
            if v[name]:
                failures.append("%s %s=%d" % (key, name, v[name]))

    print("\n== ticket example: 20 laps, 5,000 m ==")
    print("prog    lap   toGo   dist")
    for row in data["example"]:
        print("%.2f %6d %6d %6d" % (row["prog"], row["lap"], row["toGo"], row["dist"]))
    print("matches documented numbers:", "yes" if data["exampleOk"] else "NO")
    if not data["exampleOk"]:
        failures.append("ticket example mismatch")

    print("\n== finish feature: 1,000 draws ==")
    fin = data["finish"]
    print("finish cards seen %d; not-one %d; not-last %d; lap!=L %d" % (
        fin["count"], fin["notOne"], fin["notLast"], fin["notLimit"]))
    for name in ("notOne", "notLast", "notLimit"):
        if fin[name]:
            failures.append("finish %s=%d" % (name, fin[name]))

    print("\n== same situation, four series forms ==")
    for row in data["forms"]:
        print("%-8s %s" % (row["series"], row["line"]))
    kinds = {"kart": "圈", "f4": "圈", "rally": "段", "mountain": "彎"}
    for row in data["forms"]:
        if kinds[row["series"]] not in row["line"]:
            failures.append("%s missing %s noun" % (row["series"], kinds[row["series"]]))

    print("\n== finish forced last ==")
    for row in data["ordered"]:
        print("prog %.3f lap %s toGo %s finish %s" % (
            row["prog"], row["lap"], row["toGo"], row["finish"]))

    if failures:
        print("\nFAIL (%d)" % len(failures))
        for f in failures:
            print("  - " + f)
        return 1
    print("\nPASS — all invariants hold, 0 violations.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
