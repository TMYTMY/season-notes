/* =====================================================================
 * FRAMEWORK v1 — 主題無關嘅生涯／抉擇引擎
 * 唔識 F1、唔識任何題材；所有題材內容由 PACK 提供（src/packs/*.js）
 * 規格：FRAMEWORK.md
 * ===================================================================== */
'use strict';
var PACKS = window.PACKS || (window.PACKS = {});
var PACK_ID = (function(){
  try{ return new URLSearchParams(location.search).get('pack') || window.DEFAULT_PACK || 'f1'; }
  catch(e){ return window.DEFAULT_PACK || 'f1'; }
})();
var PACK = PACKS[PACK_ID] || PACKS[window.DEFAULT_PACK] || PACKS[Object.keys(PACKS)[0]];
var L = PACK.labels;

/* 卡牌註冊：pack 只提供陣列，framework 負責 id */
var CARD = {};
PACK.cats.forEach(function(cat){
  (PACK.cards[cat]||[]).forEach(function(c,i){
    c.id = cat+'-'+(i+1); c.cat = cat; CARD[c.id] = c;
  });
});

/* ============ 工具 ============ */
const $ = id => document.getElementById(id);
const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
function hash(s){let h=2166136261;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,16777619);}return h>>>0;}
function mulberry(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296;};}
function shuffle(arr,rnd){const a=arr.slice();for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));const t=a[i];a[i]=a[j];a[j]=t;}return a;}

/* ============ 常數 ============ */
function newCareer(){
  return {v:2, seed:(Math.random()*1e9)|0, round:1, races:PACK.meta.rounds,
    points:0, rep:0, fit:100, results:[], repLog:[], rivalPts:{}, decks:{}, race:null, done:false,
    field:PACK.meta.field||12,
    name:PACK.create.defaultName, style:Object.keys(PACK.archetypes)[0]};
}
let C=newCareer();
let R=null;
let hasSave=false;
let activeScreen='scCreate';
let beatGen=0;
let resolving=false;

function save(){
  try{
    localStorage.setItem(PACK.meta.saveKey, JSON.stringify(C));
    const d=$('saveDot'); if(d){d.classList.add('on'); setTimeout(()=>d.classList.remove('on'),700);}
  }catch(e){}
}
function loadSave(){
  try{
    const raw=localStorage.getItem(PACK.meta.saveKey);
    if(!raw) return false;
    const o=JSON.parse(raw);
    if(!o||o.v!==2||!Array.isArray(o.results)) return false;
    C=Object.assign(newCareer(),o);
    R=C.race||null;
    hasSave=true;
    return true;
  }catch(e){ return false; }
}
function clearSave(){ try{localStorage.removeItem(PACK.meta.saveKey);}catch(e){} }

/* 牌庫 */
function initDecks(){
  C.decks={};
  PACK.cats.forEach(cat=>{
    const rnd=mulberry(hash(C.seed+'|'+cat));
    C.decks[cat]={order:shuffle(PACK.cards[cat].map(c=>c.id),rnd), idx:0, last:null};
  });
}
function drawCard(cat){
  const d=C.decks[cat];
  if(!d){ initDecks(); return drawCard(cat); }
  if(d.idx>=d.order.length){
    const rnd=mulberry(hash(C.seed+'|'+cat+'|'+C.round+'|'+d.order.join(',')));
    d.order=shuffle(PACK.cards[cat].map(c=>c.id),rnd);
    d.idx=0;
    if(d.order[0]===d.last&&d.order.length>1){ const t=d.order[0]; d.order[0]=d.order[1]; d.order[1]=t; }
  }
  const id=d.order[d.idx++];
  d.last=id;
  return id;
}
function makeRace(){
  const rnd=mulberry(hash(C.seed+'|round'+C.round+'|cards'));
  const cats=shuffle(PACK.cats.slice(),rnd);
  const cards=cats.map(cat=>drawCard(cat));
  const startPos=6+Math.floor(rnd()*4);
  return {cards:cards, beats:0, pos:startPos, startPos:startPos, risk:0, log:[], crashed:false, laps:30, result:null};
}

/* ============ 場景渲染 ============ */
let laneEls=[], carEls={}, playerF=.52, rivalF=[.6,.66], anim=null, rafId=null, lastTs=0, curCat='straight';
let CARW=22, CARH=11;

function carSVG(spec,w,h,isMe){
  // 俯視 F1 剪影：車鼻 → 前翼 → 座艙 → 側箱 → 尾翼 ＋ 四條胎
  const W=w, H=h;
  const k=(v)=>+(v).toFixed(2);
  let g='<g class="car" transform="translate(0,0)">';
  // 四條胎
  const tyre=(x,y)=>'<rect x="'+k(x-W*0.13)+'" y="'+k(y-H*0.19)+'" width="'+k(W*0.26)+'" height="'+k(H*0.38)+'" rx="'+k(H*0.10)+'" fill="#080c12" opacity=".92"/>';
  g+=tyre(W*0.26, -H*0.52)+tyre(W*0.26, H*0.52)+tyre(-W*0.24,-H*0.52)+tyre(-W*0.24,H*0.52);
  // 主體
  const body='M '+k(W*0.50)+' 0 '+
    'L '+k(W*0.30)+' '+k(-H*0.16)+' '+
    'L '+k(W*0.10)+' '+k(-H*0.26)+' '+
    'L '+k(-W*0.16)+' '+k(-H*0.30)+' '+
    'L '+k(-W*0.34)+' '+k(-H*0.44)+' '+
    'L '+k(-W*0.50)+' '+k(-H*0.44)+' '+
    'L '+k(-W*0.50)+' '+k(H*0.44)+' '+
    'L '+k(-W*0.34)+' '+k(H*0.44)+' '+
    'L '+k(-W*0.16)+' '+k(H*0.30)+' '+
    'L '+k(W*0.10)+' '+k(H*0.26)+' '+
    'L '+k(W*0.30)+' '+k(H*0.16)+' Z';
  g+='<path d="'+body+'" fill="'+spec.c+'" stroke="'+(isMe?'#fff3d0':'rgba(6,10,18,.85)')+'" stroke-width="'+(isMe?1.4:0.9)+'" stroke-linejoin="round"/>';
  // 前翼
  g+='<rect x="'+k(W*0.42)+'" y="'+k(-H*0.40)+'" width="'+k(W*0.09)+'" height="'+k(H*0.80)+'" rx="'+k(H*0.06)+'" fill="'+spec.c+'" opacity=".95"/>';
  // 尾翼
  g+='<rect x="'+k(-W*0.52)+'" y="'+k(-H*0.46)+'" width="'+k(W*0.10)+'" height="'+k(H*0.92)+'" rx="'+k(H*0.05)+'" fill="'+spec.c+'" opacity=".95"/>';
  // 座艙
  g+='<ellipse cx="'+k(W*0.04)+'" cy="0" rx="'+k(W*0.10)+'" ry="'+k(H*0.20)+'" fill="#0b1018" opacity=".9"/>';
  if(isMe){
    g+='<circle cx="'+k(W*0.04)+'" cy="0" r="'+k(Math.max(1.6,H*0.10))+'" fill="#f7e3ae"/>';
    g+='<text x="0" y="'+k(-H*0.86)+'" text-anchor="middle" font-family="ui-monospace,monospace" '+
       'font-size="'+k(Math.max(11,H*0.85))+'" font-weight="700" fill="#f7e3ae">"+L.selfMark+"</text>';
  }
  g+='</g>';
  return '<g class="car"><g transform="scale(1,'+(1/1.55)+')">'+g.replace('<g class="car" transform="translate(0,0)">','<g>')+'</g></g>';
}

function paintScene(cat,preserve){
  const sc=PACK.scenes[cat]();
  curCat=cat;
  const box=$('scene').getBoundingClientRect();
  const bw=box.width||760, bh=box.height||172;
  const sx=bw/800, sy=bh/172;
  CARW=clamp(36/Math.max(sx,.05),18,72);
  CARH=clamp(17/Math.max(sy,.05),9,30);
  const svg=$('sceneSvg');
  const isStatic=!sc.lanes||!sc.lanes.length;
  let cars='';
  if(!isStatic){
    cars+=carSVG({c:'#f2c14e',r:'#fff3d0'},CARW,CARH,true);
    cars+=carSVG(sc.cars[0],CARW,CARH,false);
    cars+=carSVG(sc.cars[1],CARW,CARH,false);
  }
  const ZK=sc.zoom||1.55, ZC=sc.zoomCenter||126;
  svg.setAttribute('viewBox','0 0 800 172');
  svg.setAttribute('preserveAspectRatio', isStatic?'xMidYMid slice':'none');
  svg.innerHTML='<g id="sceneAll" transform="translate(0,'+ZC+') scale(1,'+ZK+') translate(0,-'+ZC+')">'
    + sc.svg + (isStatic?'':'<g id="carLayer">'+cars+'</g>') + '</g>';
  const groups=svg.querySelectorAll('#carLayer .car');
  carEls={me:groups[0],r1:groups[1],r2:groups[2]};
  laneEls=[svg.querySelector('#ln0'),svg.querySelector('#ln1'),svg.querySelector('#ln2')];
  $('sceneCap').textContent=sc.cap;
  $('sceneSpd').textContent=sc.spd;
  if(isStatic){ return; }
  if(!preserve){
    playerF=sc.init.me.f; rivalF=[sc.init.rv[0].f,sc.init.rv[1].f];
  }
  placeAt(carEls.me,sc.init.me.lane,playerF);
  placeAt(carEls.r1,sc.init.rv[0].lane,rivalF[0]);
  placeAt(carEls.r2,sc.init.rv[1].lane,rivalF[1]);
  carEls.me.setAttribute('opacity','1');
}
function placeAt(g,lane,frac){
  if(!g) return;
  const p=laneEls[lane]||laneEls[1]||laneEls[0];
  if(!p) return;
  const L=p.getTotalLength();
  const pt=p.getPointAtLength(L*clamp(frac,0,1));
  g.setAttribute('transform','translate('+pt.x.toFixed(1)+','+pt.y.toFixed(1)+')');
}
function setMsg(txt,kind){
  const m=$('sceneMsg');
  m.textContent=txt; m.className='sceneMsg on'+(kind?' '+kind:'');
  $('sceneFlash').className='flash on'+(kind==='bad'?' bad':'');
  $('scene').classList.toggle('shake',kind==='bad');
}
function clearMsg(){
  $('sceneMsg').className='sceneMsg';
  $('sceneFlash').className='flash';
  $('scene').classList.remove('shake');
}
function easeInOut(p){return p<.5?2*p*p:1-Math.pow(-2*p+2,2)/2;}

function runAnim(o){
  if(!carEls.me){ anim=null; return; }   // static 場景：無車可動
  anim={t:0,dur:o.dur||1.7,from:playerF,to:o.to,lane:o.lane,crash:!!o.crash,back:!!o.back};
  carEls.me.setAttribute('opacity','1');
  lastTs=0;
  if(!rafId) rafId=requestAnimationFrame(tick);
}
function tick(ts){
  if(!anim||!carEls.me){ rafId=null; return; }
  if(!lastTs) lastTs=ts;
  const dt=Math.min(.05,(ts-lastTs)/1000); lastTs=ts;
  anim.t+=dt;
  const p=Math.min(1,anim.t/anim.dur), e=easeInOut(p);
  playerF=anim.from+(anim.to-anim.from)*e;
  if(anim.crash){
    const lane=laneEls[anim.lane]||laneEls[1];
    const L=lane.getTotalLength();
    const pt=lane.getPointAtLength(L*clamp(playerF,0,1));
    carEls.me.setAttribute('transform','translate('+pt.x.toFixed(1)+','+pt.y.toFixed(1)+') rotate('+((1-p)*18).toFixed(1)+')');
    carEls.me.setAttribute('opacity',String(1-p*0.5));
  }else{
    placeAt(carEls.me,anim.lane,playerF);
  }
  if(anim.back){
    rivalF[0]=rivalF[0]-0.055*e;
    placeAt(carEls.r1,1,rivalF[0]);
  }
  if(p<1){ rafId=requestAnimationFrame(tick); }
  else { rafId=null; anim=null; }
}

/* ============ 畫面流程 ============ */
function show(id){
  document.querySelectorAll('.screen').forEach(s=>s.classList.remove('on'));
  const el=$(id); if(!el) return;
  el.classList.add('on');
  activeScreen=id;
  document.body.dataset.screen=id;
  if(window.innerWidth<980) window.scrollTo(0,0);
}

function paintHud(){
  $('hPts').textContent=C.points;
  $('hRep').textContent=(C.rep>0?'+':'')+C.rep;
  $('hFit').textContent=C.fit;
  $('hudRace').textContent='ROUND '+C.round+' · '+C.races;
  $('hudRace2').textContent='ROUND '+C.round+' · '+C.races;
  $('hPts2').textContent=C.points;
  $('hRep2').textContent=(C.rep>0?'+':'')+C.rep;
  $('hPts3').textContent=C.points;
  $('hRep3').textContent=(C.rep>0?'+':'')+C.rep;
  $('hudSeason').textContent=L.seasonWord+' '+PACK.meta.season;
  if(R){
    $('sPos').textContent='P'+R.pos;
    if($('hPos')) $('hPos').textContent='P'+R.pos;
    $('sRisk').textContent=R.risk+'%';
    $('sTrack').textContent=R.pos<=3?L.trackFront:(R.pos<=7?L.trackMid:L.trackBack);
  }
  // progress dots
  let dots='';
  for(let i=0;i<C.races;i++){
    const r=C.results[i];
    let cls='';
    if(r) cls = r.dnf?'dnf':(r.pos<=3?'podium':'done');
    else if(i===C.round-1) cls='cur';
    dots+='<i class="'+cls+'"></i>';
  }
  const pr=$('rounds'); if(pr) pr.innerHTML=dots;
}

function startCareer(){
  const nm=($('nameIn').value||'KAI').trim().toUpperCase().slice(0,12)||'KAI';
  C=newCareer();
  C.name=nm; C.style=document.querySelector('#styles .opt.sel')?document.querySelector('#styles .opt.sel').dataset.s:'brake';
  initDecks();
  R=null; hasSave=true;
  save();
  startRace();
}
function startRace(){
  if(!R){ R=makeRace(); C.race=R; save(); }
  else { C.race=R; }
  playerF=.52; rivalF=[.6,.66]; anim=null;
  clearMsg();
  $('log').innerHTML='<span class="log-empty">'+L.recordEmpty+'</span>';
  paintHud();
  show('scRace');
  renderBeat();
}

function hideAdvance(){
  const b=$('advanceBtn');
  if(!b) return;
  b.hidden=true;
  b.disabled=false;
  b.onclick=null;
}
function showAdvance(last, gen){
  const b=$('advanceBtn');
  if(!b || gen!==beatGen) return;
  b.hidden=false;
  b.disabled=false;
  b.textContent=last?L.seeResult:L.nextDecision;
  b.onclick=function(){
    if(gen!==beatGen || !R) return;
    b.disabled=true;
    resolving=false;
    clearMsg();
    R.beats++;
    C.race=R;
    save();
    if(R.beats<R.cards.length) renderBeat();
    else finishRace();
  };
  if(window.innerWidth<980) b.scrollIntoView({block:'nearest',inline:'nearest'});
}
function renderBeat(){
  beatGen++;
  resolving=false;
  hideAdvance();
  const id=R.cards[R.beats], card=CARD[id];
  if(!card){ finishRace(); return; }
  $('beatLbl').textContent='DECISION '+(R.beats+1)+' / '+R.cards.length+'  ·  '+card.cat.toUpperCase();
  if(window.innerWidth<980) window.scrollTo(0,0);
  $('beatTitle').textContent=card.t;
  $('beatPrompt').textContent=card.p;
  $('radio').textContent='「'+card.r+'」';
  $('radioWho').textContent=card.who||'RACE ENGINEER';
  $('cons').classList.remove('on');
  $('cons').textContent='';
  clearMsg();
  paintScene(card.cat,false);
  paintHud();
  if(R.log&&R.log.length) renderLog();
  $('sPhase').textContent=L.phases[R.beats]||L.phaseFallback;
  const wrap=$('opts'); wrap.innerHTML='';
  card.o.forEach((o,i)=>{
    const btn=document.createElement('button');
    const rk=Math.round((o.fx&&o.fx.risk?o.fx.risk:0)*PACK.archetypes[C.style].riskMul);
    const sev=rk===0?'sev0':(rk<10?'sev1':(rk<25?'sev2':'sev3'));
    btn.className='btn'+(rk>=14?' danger':(rk===0?' safe':''));
    const riskHTML='<span class="risk '+sev+'">'+(rk?L.riskWord+' '+rk+'%':L.safe)+'</span>';
    btn.innerHTML='<span>'+o.t+'</span><small>'+o.s+'</small>'+riskHTML;
    btn.onclick=()=>choose(i);
    wrap.appendChild(btn);
  });
  document.body.dataset.beat=String(R.beats);
  document.body.dataset.cat=card.cat;
}

function choose(i){
  const card=CARD[R.cards[R.beats]];
  const o=card.o[i];
  const fx=o.fx||{};
  const riskPct=Math.round((fx.risk||0)*PACK.archetypes[C.style].riskMul);
  const crashChance=riskPct*0.45+R.risk*0.10;
  const crash=crashChance>0 && Math.random()*100<crashChance;

  R.risk=Math.min(95,Math.round(R.risk*0.55+riskPct));
  if(fx.d&&!crash) R.pos=clamp(R.pos-fx.d,1,12);
  if(fx.rep) C.rep+=fx.rep;
  if(fx.fit) C.fit=clamp(C.fit+fx.fit,30,100);
  R.laps=Math.max(2,R.laps-5);
  if(crash) R.crashed=true;
  R.log.push({t:card.t,l:o.l});
  if(fx.rep) C.repLog.push({round:C.round,d:fx.rep,t:o.t});
  renderLog();
  paintHud();

  const btns=Array.prototype.slice.call(document.querySelectorAll('#opts .btn'));
  btns.forEach(function(x,idx){
    x.disabled=true;
    if(idx===i) x.classList.add('picked');
    else x.classList.add('is-out');
  });
  resolving=true;
  const gen=beatGen;
  const last=R.beats+1>=R.cards.length;
  $('cons').textContent=o.l;
  $('cons').classList.add('on');
  hideAdvance();

  const lane=i===0?0:(i===1?1:2);
  let to=playerF,msg=L.samePlace,kind='';
  if(crash){ to=playerF+0.02; msg=L.crashMsg; kind='bad'; }
  else if((fx.d||0)>0){ to=0.82; msg=L.overtake+' +'+fx.d+' '+L.places; kind='ok'; }
  else if((fx.d||0)<0){ to=0.34; msg=L.overtaken+' '+fx.d+' '+L.places; kind='bad'; }
  else { to=Math.min(0.72,playerF+0.02); }

  runAnim({lane:lane,to:to,crash:crash,back:!crash&&(fx.d||0)>0,dur:1.7});
  setTimeout(function(){
    if(gen!==beatGen) return;
    setMsg(msg,kind);
    showAdvance(last, gen);
  }, crash?800:620);
}

function renderLog(){
  if(!R||!R.log.length) return;
  $('log').innerHTML=R.log.map(function(x){
    return '<div class="log-item"><span style="color:var(--faint)">·</span> '+x.l+'</div>';
  }).join('');
  $('log').scrollTop=0;
}

/* ============ 賽果 ============ */
function finishRace(){
  beatGen++;
  resolving=false;
  hideAdvance();
  document.body.dataset.race='done';
  const dnf=!!R.crashed;
  let pos=R.pos- PACK.archetypes[C.style].bonus + (Math.floor(Math.random()*3)-1);
  if(C.fit<55) pos+=1;
  pos=clamp(pos,1,12);
  if(dnf) pos=12;
  const pts=dnf?0:PACK.scoring[pos-1];
  const repGain=dnf?-1:(pos<=3?3:(pos<=6?1:0));
  C.points+=pts;
  C.rep+=repGain;
  C.fit=clamp(C.fit-(dnf?8:4),30,100);
  if(repGain) C.repLog.push({round:C.round,d:repGain,t:(dnf?L.dnf+' · ':('P'+pos+' · '))+PACK.entities.circuits[(C.round-1)%PACK.entities.circuits.length].s});

  // 全場名次（其他 11 架）
  const order=[];
  const pool=shuffle(PACK.entities.rivals.slice(),mulberry(hash(C.seed+'|order'+C.round)));
  for(let p=1;p<=12;p++){
    if(p===pos) order.push({p:p,name:C.name,team:'AURORA JR',me:true});
    else order.push({p:p,name:pool.pop()||'—',team:PACK.entities.teams[(p*3+C.round)%PACK.entities.teams.length],me:false});
  }
  order.forEach(function(e){ if(!e.me) C.rivalPts[e.name]=(C.rivalPts[e.name]||0)+PACK.scoring[e.p-1]; });

  const res={round:C.round,pos:pos,dnf:dnf,pts:pts,rep:repGain,circuit:PACK.entities.circuits[(C.round-1)%PACK.entities.circuits.length],order:order};
  R.result=res;
  C.results.push(res);
  C.race=R;
  save();
  renderResult(res);
  show('scResult');
}

function renderResult(res){
  $('hudRace2').textContent=L.roundWord+' '+res.round+' · '+C.races;
  $('hPts2').textContent=C.points;
  $('hRep2').textContent=(C.rep>0?'+':'')+C.rep;
  $('resEyebrow').textContent=L.roundWord+' '+res.round+' · '+res.circuit.n;
  $('resPos').innerHTML='P'+res.pos+'<small>'+L.ofField+C.field+'</small>';
  $('resPts').textContent=res.dnf?'DNF':(res.pts?('+'+res.pts+' '+L.pointsSuffix):L.noPoints);
  $('resHead').textContent=res.dnf?L.dnf:(res.pos<=3?L.podium:(res.pos<=6?L.pointsFinish:L.finished));
  $('resStory').innerHTML=PACK.narrative.story({res:res,C:C,R:R,style:PACK.archetypes[C.style].label});
  let rows='<div class="rrow"><span>'+L.colPos+'</span><span>'+L.colName+'</span><span>'+L.colTeam+'</span><span>'+L.colPts+'</span></div>';
  res.order.forEach(function(e){
    rows+='<div class="rrow'+(e.me?' me':'')+'"><span>'+e.p+'</span><span>'+e.name+'</span>'+
      '<span class="rrow-team">'+e.team+'</span><span>'+PACK.scoring[e.p-1]+'</span></div>';
  });
  $('resTable').innerHTML=rows;
  $('nextBtn').textContent = res.round<C.races ? L.nextRace : L.seeSeason;
  paintHud();
}

function backToRace(){
  if(C.done){ renderSeason(true); show('scSeason'); return; }
  if(R&&R.result){ renderResult(R.result); show('scResult'); return; }
  if(R&&resolving){ show('scRace'); return; }
  if(R){ show('scRace'); renderBeat(); return; }
  show('scCreate');
}
$('backBtn').onclick=backToRace;
$('resumeRaceBtn').onclick=backToRace;
function resetCareer(){
  beatGen++;
  resolving=false;
  hideAdvance();
  clearSave(); hasSave=false;
  C=newCareer(); R=null;
  $('seedLine').textContent=L.seedWord+' · hk'+String(Math.abs(C.seed)%1000000).padStart(6,'0');
  $('nameIn').value=PACK.create.defaultName;
  $('continueBtn').style.display='none';
  $('continueBtn').textContent=L.continueCareer;
  $('startBtn').textContent=PACK.create.cta;
  document.querySelectorAll('#styles .opt').forEach(function(x){
    x.classList.toggle('sel',x.dataset.s===Object.keys(PACK.archetypes)[0]);
  });
  paintHud();
  show('scCreate');
}
$('newSeasonBtn').onclick=resetCareer;
$('restartBtn').onclick=resetCareer;

document.querySelectorAll('.radio-inline-wave i').forEach(function(b,i){
  b.style.animationDelay=(i*0.13)+'s';
  b.style.height=(4+Math.random()*10)+'px';
});

/* ============ 背景賽道剪影 ============ */
(function art(){
  const pts=[[706,392],[520,394],[262,394],[168,380],[116,332],[102,270],[132,214],[198,194],
    [252,176],[286,130],[332,90],[406,72],[472,78],[522,106],[554,150],[598,176],[652,174],[696,148],
    [718,182],[728,240],[724,300],[716,352]];
  const d=pts.map(function(p,i){return (i?'L':'M')+p[0]+' '+p[1];}).join(' ')+' Z';
  $('art').innerHTML='<svg viewBox="0 0 834 504" preserveAspectRatio="xMidYMid meet">'+
    '<path d="'+d+'" fill="none" stroke="#f2c14e" stroke-width="26" stroke-linejoin="round"/>'+
    '<path d="'+d+'" fill="none" stroke="#05080f" stroke-width="16" stroke-linejoin="round"/></svg>';
})();

/* ============ 載入 / 續玩 ============ */
function resume(){
  if(!hasSave) return false;
  if(C.done){ renderSeason(true); show('scSeason'); return true; }
  if(R){
    if(R.result){ renderResult(R.result); show('scResult'); return true; }
    show('scRace');
    renderBeat();
    return true;
  }
  if(C.results.length&&C.results.length>=C.races){ endSeason(); return true; }
  if(C.results.length){ C.round=C.results.length+1; startRace(); return true; }
  return false;
}

function boot(){
  const loaded=loadSave();
  if(loaded){
    $('seedLine').textContent=L.seedWord+' · hk'+String(Math.abs(C.seed)%1000000).padStart(6,'0');
    $('nameIn').value=C.name;
    document.querySelectorAll('#styles .opt').forEach(function(x){
      x.classList.toggle('sel',x.dataset.s===C.style);
    });
    $('continueBtn').style.display='block';
    $('continueBtn').textContent=L.continueCareer.replace(' →','')+' · '+L.roundWord+' '+
      Math.min(C.round,C.races)+' / '+C.races+(C.done?' · '+L.seasonEnd:'')+' →';
    $('startBtn').textContent=L.restartShort;
    if(C.done||R||C.results.length){ resume(); }
  }else{
    C=newCareer();
    $('seedLine').textContent=L.seedWord+' · hk'+String(Math.abs(C.seed)%1000000).padStart(6,'0');
  }
  paintHud();
}

/* fit */
function fit(){
  const st=$('stage');
  if(window.innerWidth<980){
    st.style.transform='none'; st.style.width='100%'; st.style.height='auto';
    document.documentElement.style.overflowY='auto';
    return;
  }
  document.documentElement.style.overflowY='hidden';
  st.style.width='1440px'; st.style.height='900px';
  const s=Math.min(window.innerWidth/1490,window.innerHeight/950,1.3);
  st.style.transform='scale('+s+')';
}
let rz=null;
window.addEventListener('resize',function(){
  fit();
  clearTimeout(rz);
  rz=setTimeout(function(){
    if(activeScreen==='scRace'&&R&&R.beats<R.cards.length){
      const card=CARD[R.cards[R.beats]];
      if(card) paintScene(card.cat,true);
    }
  },180);
});
fit();
document.body.dataset.screen='scCreate';

/* dev hook */
window.__dev={ get C(){return C;}, get R(){return R;}, choose:choose,
  state:function(){return {round:C.round,pos:R&&R.pos,risk:R&&R.risk,points:C.points,beats:R&&R.beats,screen:activeScreen};},
  clear:function(){clearSave();C=newCareer();},
  preview:function(seed){
    const bs=C.seed, br=C.round, bd=JSON.parse(JSON.stringify(C.decks));
    C.seed=seed; initDecks();
    const out=[];
    for(let r=1;r<=8;r++){
      C.round=r;
      const rnd=mulberry(hash(C.seed+'|round'+r+'|cards'));
      out.push(shuffle(PACK.cats.slice(),rnd).map(function(cat){return drawCard(cat);}));
    }
    C.seed=bs; C.round=br; C.decks=bd;
    return out;
  } };


/* ============ 賽季（narrative 由 pack 提供） ============ */

function renderSeason(final){
  const wide=window.innerWidth>=980;
  $('seasonEyebrow').textContent=L.seasonWord+' '+PACK.meta.season+' · '+PACK.meta.subject+' · '+C.name;
  $('seasonTitle').textContent=final?L.seasonFinal:L.seasonTable;
  let rows='',cum=0;
  for(let i=0;i<C.races;i++){
    const r=C.results[i], cir=PACK.entities.circuits[i];
    if(r){
      cum+=r.pts;
      rows+='<div class="srow'+(r.round===C.round?' me':'')+'"><span>R'+(i+1)+'</span><span>'+cir.s+'</span>'+
        '<span>'+(r.dnf?'—':('P'+r.pos))+'</span><span>'+(r.dnf?'DNF':r.pts)+'</span><span>'+cum+'</span></div>';
    }else{
      rows+='<div class="srow pending"><span>R'+(i+1)+'</span><span>'+cir.s+'</span><span>—</span><span>—</span><span>'+cum+'</span></div>';
    }
  }
  $('seasonRows').innerHTML=rows;

  const board=[{name:C.name,team:PACK.meta.subjectShort||PACK.meta.subject,pts:C.points,me:true}];
  Object.keys(C.rivalPts).forEach(function(k){ board.push({name:k,team:'—',pts:C.rivalPts[k],me:false}); });
  board.sort(function(a,b){return b.pts-a.pts;});
  let st='';
  board.slice(0,12).forEach(function(e,i){
    st+='<div class="crow'+(e.me?' me':'')+'"><span>'+(i+1)+'</span><span class="crow-name">'+e.name+'</span>'+
      '<span class="crow-team">'+e.team+'</span><span>'+e.pts+'</span></div>';
  });
  $('standings').innerHTML=st;

  if(!C.repLog.length){
    $('repLog').innerHTML='<span class="small">'+L.repLogEmpty+'</span>';
  }else{
    $('repLog').innerHTML=C.repLog.slice().reverse().map(function(x){
      return '<div><b>'+(x.d>0?'+':'')+x.d+'</b><em>R'+x.round+'</em>'+x.t+'</div>';
    }).join('');
  }
  paintHud();

  if(final){
    $('resumeRaceBtn').style.display='none';
    const podiums=C.results.filter(function(r){return !r.dnf&&r.pos<=3;}).length;
    const dnfs=C.results.filter(function(r){return r.dnf;}).length;
    const tier=(C.points>=48||(podiums>=2&&C.points>=32))?'A':((C.points>=22||podiums>=1)?'B':'C');
    const n=PACK.narrative.seasonEnd({tier:tier,C:C,podiums:podiums,dnfs:dnfs,style:PACK.archetypes[C.style].label});
    $('seasonEnd').style.display='block';
    $('seasonEnd').innerHTML='<div class="tierBox '+(tier==='A'?'a':(tier==='C'?'c':''))+'">'+
      '<div class="eyebrow">'+n.eyebrow+'</div><h2>'+n.head+'</h2>'+
      '<div class="story">'+n.body+'</div></div>';
    $('newSeasonBtn').textContent=L.newSeason;
    $('newSeasonBtn').style.display='inline-block';
    $('restartBtn').style.display='none';
    $('backBtn').style.display='none';
  }else{
    $('seasonEnd').style.display='none';
    $('resumeRaceBtn').textContent=(R&&R.result)?L.backToResult:L.backToRace2;
    $('resumeRaceBtn').style.display='inline-block';
    $('newSeasonBtn').style.display='none';
    $('restartBtn').style.display='inline-block';
    $('backBtn').style.display='inline-block';
  }
  if(!wide) $('backBtn').style.minHeight='44px';
}

function endSeason(){
  C.done=true; C.race=null; R=null;
  save();
  renderSeason(true);
  show('scSeason');
}


/* ============ 建立頁（由 pack.create 生成） ============ */

function renderCreate(){
  const c=PACK.create;
  document.title=PACK.meta.title+' — '+PACK.meta.subject;
  const brand=document.querySelector('#scCreate .brand');
  if(brand) brand.innerHTML='<i></i> '+L.brand+' <span>'+L.brandSub+'</span>';
  const eb=$('createEyebrow'); if(eb) eb.textContent=c.eyebrow;
  const h=$('createHeadline'); if(h) h.innerHTML=c.headline.join('<br>');
  const lede=$('createLede'); if(lede) lede.textContent=c.lede;
  const nl=$('labelName'); if(nl) nl.textContent=c.nameLabel;
  const sl=$('labelStyle'); if(sl) sl.textContent=c.styleLabel;
  const tl=$('labelTeam'); if(tl) tl.textContent=c.teamLabel;
  const tv=$('teamValue'); if(tv) tv.textContent=c.teamValue;
  const ni=$('nameIn'); if(ni) ni.value=c.defaultName;
  const st=$('styles');
  if(st){
    st.innerHTML=Object.keys(PACK.archetypes).map(function(k,i){
      const a=PACK.archetypes[k];
      return '<div class="opt'+(i===0?' sel':'')+'" data-s="'+k+'"><b>'+a.label+'</b><span>'+a.note+'</span></div>';
    }).join('');
    st.querySelectorAll('.opt').forEach(function(o){
      o.onclick=function(){
        st.querySelectorAll('.opt').forEach(function(x){x.classList.remove('sel');});
        o.classList.add('sel');
      };
    });
  }
  const sb=$('startBtn'); if(sb) sb.textContent=c.cta;
  const rw=$('radioWho'); if(rw) rw.textContent=c.radioWho;
  const rf=$('radio'); if(rf) rf.textContent=c.radioFirst;
  const hu=$('hudBrand');
  if(hu) hu.innerHTML='<i></i> '+L.brand+' <span id="hudRace">'+L.roundWord+' 1 · '+PACK.meta.rounds+'</span>';
}

/* 靜態 label 由 data-l 注入 */
function injectLabels(){
  document.querySelectorAll('[data-l]').forEach(function(el){
    const k=el.dataset.l;
    if(L[k]!=null) el.textContent=L[k];
  });
}

/* ============ 事件綁定（renderCreate 之後） ============ */
function bindEvents(){
  $('startBtn').onclick=function(){
    if(hasSave && !C.done && C.results.length>0){ clearSave(); hasSave=false; }
    startCareer();
  };
  $('continueBtn').onclick=function(){ resume(); };
  $('nextBtn').onclick=function(){
    if(!R||!R.result) return;
    if(C.round<C.races){ C.round++; C.race=null; R=null; save(); startRace(); }
    else { endSeason(); }
  };
  $('tableBtn').onclick=function(){ renderSeason(false); show('scSeason'); };
  $('tableBtn2').onclick=function(){ renderSeason(false); show('scSeason'); };
}

renderCreate();
bindEvents();
injectLabels();

/* 開機 */
boot();
