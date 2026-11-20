/* =====================================================================
 * PACK · f1 — 車手生涯（AURORA JUNIOR）
 * 換主題＝換呢一個檔；framework 唔知 F1 存在。
 * 規格見 ../FRAMEWORK.md
 * ===================================================================== */
/* 場景 helper（pack 可以自備） */
function lt(x0,x1,y,step,w,op){
  let s='';
  for(let x=x0;x<x1;x+=step){s+='<rect x="'+x+'" y="'+y+'" width="'+(w||8)+'" height="2.6" fill="#f2c14e" opacity="'+(op||.35)+'"/>';}
  return s;
}
function kerbs(x0,x1,y,step){
  let s='';
  for(let i=0,x=x0;x<x1;x+=step,i++){
    s+='<rect x="'+x+'" y="'+y+'" width="'+step+'" height="4" fill="'+(i%2?'#e9e3d5':'#c8402f')+'" opacity=".8"/>';
  }
  return s;
}

PACKS.f1 = {
  meta:{
    id:'f1',
    title:'SEASON NOTES',
    saveKey:'seasonNotes.f1.v2',
    rounds:8,
    field:12,
    season:'2027',
    subject:'AURORA JUNIOR',
    subjectShort:'AURORA JR'
  },

  /* UI 名詞：framework 只認 key，唔認字 */
  labels:{
    brand:'SEASON NOTES',
    brandSub:'車手生涯',
    position:'位置',
    score:'積分',
    reputation:'聲望',
    fitness:'體能',
    table:'積分表',
    stateTitle:'今場狀態',
    statePhase:'賽段',
    stateRisk:'累積風險',
    statePlace:'賽道位置',
    recordTitle:'你嘅紀錄',
    recordEmpty:'仲未有紀錄 —— 每個選擇都會寫入呢度。',
    autosave:'● 自動存檔',
    roundWord:'ROUND',
    seasonWord:'SEASON',
    decisionWord:'DECISION',
    classification:'Classification',
    championship:'Championship',
    repLogTitle:'聲望變化',
    repLogEmpty:'仲未有紀錄。',
    seasonFinal:'季終成績',
    seasonTable:'賽季積分',
    seasonEnd:'季終',
    newSeason:'開始新賽季 →',
    restart:'放棄生涯 · 開新賽季',
    restartShort:'開新賽季（清除存檔）',
    backToRace:'返比賽',
    backToRace2:'返去比賽 →',
    backToResult:'返去成績 →',
    nextRace:'下一場 →',
    nextDecision:'下一個決定 →',
    seeResult:'睇今場成績 →',
    seeSeason:'季終 · 睇成績 →',
    continueCareer:'繼續生涯 →',
    trackFront:'前排',
    trackMid:'中段',
    trackBack:'後排',
    phases:['起步','第 5 圈','第 10 圈','第 15 圈','第 20 圈','最後 3 圈'],
    phaseFallback:'比賽',
    riskWord:'風險',
    safe:'安全',
    samePlace:'位置不變',
    crashMsg:'撞車 · 退賽',
    overtake:'爬頭成功 ·',
    overtaken:'被爬 ·',
    places:'位',
    dnf:'退賽',
    podium:'頒獎台',
    pointsFinish:'有分完賽',
    finished:'完成賽事',
    noPoints:'冇分',
    pointsSuffix:'分',
    ofField:'／',
    colPos:'P', colName:'CAR', colTeam:'TEAM', colPts:'PTS',
    seedWord:'種子',
    selfMark:'你',
    circuitWord:'賽道'
  },

  /* 建立頁文案 */
  create:{
    eyebrow:'F4 初級方程式 · 2027 季前',
    headline:['你今年 17 歲。','冇人識你，<em>但有人肯俾你一架車</em>。'],
    lede:'八場比賽、一支細車隊、一個唔算快嘅引擎。每場你會遇到六個決定 —— 幾時搏、幾時收、幾時得罪人。做得好，會有更大嘅車隊打電話俾你。',
    nameLabel:'車手名',
    defaultName:'KAI',
    styleLabel:'風格',
    teamLabel:'車隊',
    teamValue:'AURORA JUNIOR · 衛星隊，資源最少',
    cta:'簽約，開始季前測試 →',
    radioWho:'RACE ENGINEER · AURORA JR',
    radioFirst:'「第一次跑呢條賽道，慢慢嚟，先摸熟。」'
  },

  /* 風格（建立頁揀嘅，影響風險倍率） */
  archetypes:{
    brake:{label:'遲剎車',bonus:1,riskMul:1.25,note:'單圈快，風險高'},
    tyre:{label:'識保胎',bonus:0,riskMul:0.70,note:'慢少少，少出錯'},
    fight:{label:'硬淨',bonus:1,riskMul:1.10,note:'超車狠，得罪人多'}
  },

  cats:['straight','t1','tyre','sc','team','last'],
  scoring:[25,18,15,12,10,8,6,4,2,1,0,0],

  entities:{
    circuits:[
      {n:'CIRCUIT VALGRANDE',s:'VALGRANDE'},
      {n:'PORTE NOIRE',s:'PORTE NOIRE'},
      {n:'KESTREL RING',s:'KESTREL RING'},
      {n:'LAGO SABBIA',s:'LAGO SABBIA'},
      {n:'NORDFJORD',s:'NORDFJORD'},
      {n:'MONTE ARIDO',s:'MONTE ARIDO'},
      {n:'SABLE STRAIT',s:'SABLE STRAIT'},
      {n:'DUNMORE PARK',s:'DUNMORE PARK'}
    ],
    rivals:['BOS','HAL','ORT','LIN','RUI','ABB','KOV','MAR','NOV','VET','PAL','DUN'],
    teams:['VELOCE','MERIDIAN','KESTREL','NORDFJORD','TALON','HELIOS','SABLE','DRAKON','PRISM','VETRA','PALLAS','DUNMORE']
  },

  scenes:{

straight:()=>({
  cap:'STRAIGHT · 尾流',spd:'318 km/h',
  cars:[{c:'#d9533f',r:'rgba(255,255,255,.5)'},{c:'#4ea0ff',r:'rgba(255,255,255,.5)'}],
  init:{me:{lane:1,f:.40},rv:[{lane:1,f:.58},{lane:0,f:.62}]},
  lanes:['M -40 118 C 200 116 470 110 840 98','M -40 138 C 200 136 470 130 840 118','M -40 158 C 200 156 470 150 840 138'],
  svg:
  '<rect x="-20" y="-20" width="840" height="215" fill="#0a1220"/>'+
  '<rect x="-20" y="-20" width="840" height="96" fill="url(#gSk)"/>'+
  '<rect x="-20" y="26" width="840" height="40" fill="#0f1a2b"/>'+
  lt(-16,824,32,22,7,.30)+
  '<rect x="-20" y="66" width="840" height="5" fill="#070d16"/>'+
  '<path d="M-20 71 L820 62 L820 98 L-20 108 Z" fill="#0d1725"/>'+
  '<path d="M-20 98 L820 88 L820 176 L-20 176 Z" fill="url(#gRd)"/>'+
  '<path d="M-20 103 L820 93" stroke="#e9e3d5" stroke-opacity=".55" stroke-width="1.6" fill="none"/>'+
  '<path d="M-20 170 L820 160" stroke="#e9e3d5" stroke-opacity=".28" stroke-width="1.6" fill="none"/>'+
  '<path d="M-20 128 C 200 126 470 120 820 108" stroke="#e9e3d5" stroke-opacity=".2" stroke-width="1.4" stroke-dasharray="16 18" fill="none"/>'+
  '<path d="M-20 148 C 200 146 470 140 820 128" stroke="#e9e3d5" stroke-opacity=".2" stroke-width="1.4" stroke-dasharray="16 18" fill="none"/>'+
  '<g stroke="#8fa7c4" stroke-opacity=".16" stroke-width="1.1" fill="none">'+
    '<path d="M40 132 L210 130"/><path d="M40 142 L230 140"/><path d="M60 152 L250 150"/></g>'+
  '<g opacity=".55"><rect x="726" y="60" width="34" height="17" rx="2" fill="#0b1422" stroke="#2a3a55"/>'+
    '<rect x="731" y="66" width="5" height="5" fill="#f2c14e"/><rect x="739" y="66" width="5" height="5" fill="#f2c14e"/>'+
    '<rect x="747" y="66" width="5" height="5" fill="#3a4a63"/></g>'+
  '<g id="lns"><path id="ln0" d="M -40 118 C 200 116 470 110 840 98" fill="none" stroke="none"/>'+
    '<path id="ln1" d="M -40 138 C 200 136 470 130 840 118" fill="none" stroke="none"/>'+
    '<path id="ln2" d="M -40 158 C 200 156 470 150 840 138" fill="none" stroke="none"/></g>'+
  '<defs><linearGradient id="gSk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13223a"/><stop offset="1" stop-color="#0a1220"/></linearGradient>'+
    '<linearGradient id="gRd" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2e3846"/><stop offset="1" stop-color="#19222e"/></linearGradient></defs>'
}),
t1:()=>({
  cap:'TURN 1 · 三車並排',spd:'146 km/h',
  cars:[{c:'#d9533f',r:'rgba(255,255,255,.5)'},{c:'#4ea0ff',r:'rgba(255,255,255,.5)'}],
  init:{me:{lane:1,f:.42},rv:[{lane:0,f:.47},{lane:2,f:.49}]},
  lanes:['M -40 120 C 110 118 190 98 270 78 C 350 58 430 40 560 32 L 840 24',
         'M -40 146 C 110 144 190 124 270 104 C 350 84 430 66 560 58 L 840 50',
         'M -40 172 C 110 170 190 150 270 130 C 350 110 430 92 560 84 L 840 76'],
  svg:
  '<rect x="-20" y="-20" width="840" height="215" fill="#0a1220"/>'+
  '<rect x="-20" y="-20" width="840" height="110" fill="url(#gSk2)"/>'+
  '<rect x="-20" y="0" width="840" height="10" fill="#0f1a2b"/>'+
  '<path d="M-20 104 C 110 102 190 82 270 62 C 350 42 430 24 560 16 L 820 8 L 820 -20 L -20 -20 Z" fill="#0d1725"/>'+
  '<path d="M-40 146 C 110 144 190 124 270 104 C 350 84 430 66 540 58 L 840 50" stroke="#2b3543" stroke-width="86" fill="none" stroke-linecap="round"/>'+
  '<path d="M-40 146 C 110 144 190 124 270 104 C 350 84 430 66 540 58 L 840 50" stroke="#232c39" stroke-width="70" fill="none"/>'+
  '<path d="M-40 103 C 110 101 190 81 270 61 C 350 41 430 23 540 15 L 840 7" stroke="#e9e3d5" stroke-opacity=".45" stroke-width="2" fill="none"/>'+
  '<path d="M-40 189 C 110 187 190 167 270 147 C 350 127 430 109 540 101 L 840 93" stroke="#e9e3d5" stroke-opacity=".25" stroke-width="2" fill="none"/>'+
  '<g transform="rotate(-21 300 120)">'+kerbs(210,420,96,14)+'</g>'+
  '<path d="M-40 200 C 120 198 200 178 280 158 L 420 148 L 420 210 L -40 210 Z" fill="#1a1f26"/>'+
  '<g fill="#2b333d" opacity=".8">'+
    '<circle cx="60" cy="192" r="2.2"/><circle cx="96" cy="190" r="2"/><circle cx="140" cy="188" r="2.4"/>'+
    '<circle cx="190" cy="184" r="2"/><circle cx="238" cy="180" r="2.2"/><circle cx="300" cy="174" r="2"/>'+
    '<circle cx="352" cy="170" r="2.2"/><circle cx="120" cy="200" r="2"/><circle cx="270" cy="196" r="2.3"/></g>'+
  '<path d="M-40 96 C 110 94 190 74 270 54 C 350 34 430 16 560 8 L 840 0" stroke="#38506e" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="8 10" fill="none"/>'+
  '<g id="lns"><path id="ln0" d="M -40 120 C 110 118 190 98 270 78 C 350 58 430 40 560 32 L 840 24" fill="none" stroke="none"/>'+
    '<path id="ln1" d="M -40 146 C 110 144 190 124 270 104 C 350 84 430 66 560 58 L 840 50" fill="none" stroke="none"/>'+
    '<path id="ln2" d="M -40 172 C 110 170 190 150 270 130 C 350 110 430 92 560 84 L 840 76" fill="none" stroke="none"/></g>'+
  '<defs><linearGradient id="gSk2" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#16263f"/><stop offset="1" stop-color="#0a1220"/></linearGradient></defs>'
}),
tyre:()=>({
  cap:'TYRE WEAR · 胎溫 112°C',spd:'204 km/h',
  cars:[{c:'#d9533f',r:'rgba(255,255,255,.5)'},{c:'#4ea0ff',r:'rgba(255,255,255,.5)'}],
  init:{me:{lane:1,f:.44},rv:[{lane:1,f:.60},{lane:0,f:.30}]},
  lanes:['M -40 116 C 220 112 470 108 840 100','M -40 140 C 220 136 470 132 840 124','M -40 164 C 220 160 470 156 840 148'],
  svg:
  '<rect x="-20" y="-20" width="840" height="215" fill="#080e18"/>'+
  '<rect x="-20" y="-20" width="840" height="104" fill="url(#gSk3)"/>'+
  '<path d="M-20 100 L820 92 L820 176 L-20 176 Z" fill="url(#gRd3)"/>'+
  '<path d="M-20 104 L820 96" stroke="#e9e3d5" stroke-opacity=".4" stroke-width="1.6" fill="none"/>'+
  '<path d="M-20 170 L820 162" stroke="#e9e3d5" stroke-opacity=".22" stroke-width="1.6" fill="none"/>'+
  '<g stroke="#0d131c" stroke-opacity=".55" stroke-width="3" fill="none">'+
    '<path d="M-20 132 C 240 128 470 126 820 118"/><path d="M-20 136 C 240 132 470 130 820 122"/></g>'+
  '<g fill="#1b232f">'+
    '<ellipse cx="300" cy="150" rx="9" ry="2.6"/><ellipse cx="520" cy="142" rx="7" ry="2.2"/>'+
    '<ellipse cx="640" cy="136" rx="10" ry="3"/><ellipse cx="410" cy="156" rx="6" ry="2"/>'+
    '<ellipse cx="700" cy="146" rx="8" ry="2.4"/><ellipse cx="180" cy="158" rx="7" ry="2.2"/></g>'+
  '<g opacity=".9">'+
    '<rect x="654" y="18" width="128" height="60" rx="6" fill="#0c1523" stroke="#22314a"/>'+
    '<rect x="664" y="42" width="16" height="26" rx="2" fill="#3fbf8b" opacity=".85"/>'+
    '<rect x="686" y="36" width="16" height="32" rx="2" fill="#f2c14e" opacity=".9"/>'+
    '<rect x="708" y="30" width="16" height="38" rx="2" fill="#f2c14e"/>'+
    '<rect x="730" y="46" width="16" height="22" rx="2" fill="#d9533f" opacity=".8"/>'+
    '<rect x="752" y="54" width="16" height="14" rx="2" fill="#d9533f" opacity=".55"/></g>'+
  '<g opacity=".55" fill="#c9d2e0">'+
    '<ellipse cx="60" cy="150" rx="16" ry="6"/><ellipse cx="60" cy="140" rx="16" ry="6"/>'+
    '<ellipse cx="60" cy="130" rx="16" ry="6"/></g>'+
  '<g id="lns"><path id="ln0" d="M -40 116 C 220 112 470 108 840 100" fill="none" stroke="none"/>'+
    '<path id="ln1" d="M -40 140 C 220 136 470 132 840 124" fill="none" stroke="none"/>'+
    '<path id="ln2" d="M -40 164 C 220 160 470 156 840 148" fill="none" stroke="none"/></g>'+
  '<defs><linearGradient id="gSk3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#12203a"/><stop offset="1" stop-color="#080e18"/></linearGradient>'+
    '<linearGradient id="gRd3" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a323e"/><stop offset="1" stop-color="#171e28"/></linearGradient></defs>'
}),
sc:()=>({
  cap:'SAFETY CAR · 車群壓縮',spd:'92 km/h',
  cars:[{c:'#d9533f',r:'rgba(255,255,255,.5)'},{c:'#4ea0ff',r:'rgba(255,255,255,.5)'}],
  init:{me:{lane:1,f:.34},rv:[{lane:0,f:.40},{lane:2,f:.44}]},
  lanes:['M -40 114 C 220 110 470 106 840 98','M -40 138 C 220 134 470 130 840 122','M -40 162 C 220 158 470 154 840 146'],
  svg:
  '<rect x="-20" y="-20" width="840" height="215" fill="#070b13"/>'+
  '<rect x="-20" y="-20" width="840" height="104" fill="url(#gSk4)"/>'+
  '<g opacity=".6">'+lt(-16,824,20,30,10,.16)+'</g>'+
  '<path d="M-20 98 L820 90 L820 176 L-20 176 Z" fill="url(#gRd4)"/>'+
  '<path d="M-20 102 L820 94" stroke="#e9e3d5" stroke-opacity=".35" stroke-width="1.6" fill="none"/>'+
  '<g>'+
    '<rect x="0" y="76" width="840" height="7" fill="#101a28"/>'+
    kerbs(0,840,70,26)+'</g>'+
  '<rect x="512" y="72" width="46" height="26" rx="5" fill="#e9e3d5" opacity=".92"/>'+
  '<rect x="508" y="78" width="54" height="7" rx="3" fill="#f2c14e" class="blink"/>'+
  '<rect x="516" y="98" width="8" height="6" rx="1" fill="#0b1220"/>'+
  '<rect x="546" y="98" width="8" height="6" rx="1" fill="#0b1220"/>'+
  '<g fill="#f2c14e" opacity=".8"><rect x="620" y="66" width="4" height="4"/><rect x="632" y="66" width="4" height="4"/><rect x="644" y="66" width="4" height="4"/></g>'+
  '<g opacity=".4" fill="#d9533f"><rect x="700" y="120" width="90" height="3"/><rect x="700" y="132" width="90" height="3"/><rect x="700" y="144" width="90" height="3"/></g>'+
  '<g id="lns"><path id="ln0" d="M -40 114 C 220 110 470 106 840 98" fill="none" stroke="none"/>'+
    '<path id="ln1" d="M -40 138 C 220 134 470 130 840 122" fill="none" stroke="none"/>'+
    '<path id="ln2" d="M -40 162 C 220 158 470 154 840 146" fill="none" stroke="none"/></g>'+
  '<defs><linearGradient id="gSk4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#0e1a2c"/><stop offset="1" stop-color="#070b13"/></linearGradient>'+
    '<linearGradient id="gRd4" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#252d39"/><stop offset="1" stop-color="#151b24"/></linearGradient></defs>'
}),
team:()=>({
  cap:'TEAM ORDERS · 隊友前面',spd:'188 km/h',
  cars:[{c:'#f2efe6',r:'#c9b98a'},{c:'#4ea0ff',r:'rgba(255,255,255,.5)'}],
  init:{me:{lane:1,f:.42},rv:[{lane:1,f:.58},{lane:0,f:.24}]},
  lanes:['M -40 116 C 220 112 470 108 840 100','M -40 140 C 220 136 470 132 840 124','M -40 164 C 220 160 470 156 840 148'],
  svg:
  '<rect x="-20" y="-20" width="840" height="215" fill="#080e18"/>'+
  '<rect x="-20" y="-20" width="840" height="104" fill="url(#gSk5)"/>'+
  '<g opacity=".9">'+
    '<rect x="-20" y="24" width="270" height="52" fill="#101a2a"/>'+
    '<rect x="-20" y="18" width="270" height="8" fill="#1a2740"/>'+
    '<g fill="#f2c14e" opacity=".55"><rect x="10" y="38" width="26" height="5"/><rect x="10" y="50" width="26" height="5"/>'+
      '<rect x="48" y="38" width="26" height="5"/><rect x="48" y="50" width="26" height="5"/>'+
      '<rect x="86" y="38" width="26" height="5"/><rect x="86" y="50" width="26" height="5"/></g>'+
    '<path d="M236 24 L236 6" stroke="#3a4a63" stroke-width="2"/>'+
    '<path d="M236 8 C 262 12 262 30 236 34" stroke="#f2c14e" stroke-opacity=".5" stroke-width="1.4" fill="none"/>'+
    '<path d="M236 12 C 254 16 254 26 236 30" stroke="#f2c14e" stroke-opacity=".3" stroke-width="1.4" fill="none"/>'+
  '</g>'+
  '<path d="M-20 98 L820 90 L820 176 L-20 176 Z" fill="url(#gRd5)"/>'+
  '<path d="M-20 102 L820 94" stroke="#e9e3d5" stroke-opacity=".4" stroke-width="1.6" fill="none"/>'+
  '<path d="M-20 132 C 240 128 470 126 820 118" stroke="#e9e3d5" stroke-opacity=".18" stroke-width="1.4" stroke-dasharray="14 16" fill="none"/>'+
  '<g opacity=".7"><rect x="600" y="66" width="70" height="26" rx="3" fill="#0b1422" stroke="#2a3a55"/>'+
    '<rect x="608" y="72" width="8" height="14" fill="#f2c14e"/><rect x="622" y="72" width="8" height="14" fill="#f2c14e"/>'+
    '<rect x="640" y="72" width="22" height="3" fill="#3a4a63"/><rect x="640" y="79" width="16" height="3" fill="#3a4a63"/></g>'+
  '<g id="lns"><path id="ln0" d="M -40 116 C 220 112 470 108 840 100" fill="none" stroke="none"/>'+
    '<path id="ln1" d="M -40 140 C 220 136 470 132 840 124" fill="none" stroke="none"/>'+
    '<path id="ln2" d="M -40 164 C 220 160 470 156 840 148" fill="none" stroke="none"/></g>'+
  '<defs><linearGradient id="gSk5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#13203a"/><stop offset="1" stop-color="#080e18"/></linearGradient>'+
    '<linearGradient id="gRd5" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2b333f"/><stop offset="1" stop-color="#161d27"/></linearGradient></defs>'
}),
last:()=>({
  cap:'LAST 2 LAPS · 日落',spd:'272 km/h',
  cars:[{c:'#d9533f',r:'rgba(255,255,255,.5)'},{c:'#4ea0ff',r:'rgba(255,255,255,.5)'}],
  init:{me:{lane:1,f:.40},rv:[{lane:0,f:.56},{lane:1,f:.63}]},
  lanes:['M -40 114 C 220 110 470 106 840 98','M -40 138 C 220 134 470 130 840 122','M -40 162 C 220 158 470 154 840 146'],
  svg:
  '<rect x="-20" y="-20" width="840" height="215" fill="#0a0c15"/>'+
  '<rect x="-20" y="-20" width="840" height="110" fill="url(#gSk6)"/>'+
  '<circle cx="612" cy="46" r="26" fill="#f2c14e" opacity=".22"/>'+
  '<circle cx="612" cy="46" r="13" fill="#f6d98a" opacity=".55"/>'+
  '<path d="M-20 74 L300 62 L300 76 L-20 88 Z" fill="#151824"/>'+
  '<g fill="#f2c14e" opacity=".3"><rect x="20" y="66" width="3" height="3"/><rect x="44" y="65" width="3" height="3"/>'+
    '<rect x="70" y="64" width="3" height="3"/><rect x="98" y="63" width="3" height="3"/><rect x="130" y="62" width="3" height="3"/></g>'+
  '<path d="M-20 92 L820 84 L820 176 L-20 176 Z" fill="url(#gRd6)"/>'+
  '<path d="M-20 96 L820 88" stroke="#e9cf9f" stroke-opacity=".45" stroke-width="1.8" fill="none"/>'+
  '<path d="M-20 130 C 240 126 470 124 820 116" stroke="#e9cf9f" stroke-opacity=".16" stroke-width="1.4" stroke-dasharray="18 20" fill="none"/>'+
  '<g opacity=".8">'+
    '<rect x="704" y="96" width="16" height="20" rx="2" fill="#101a28" stroke="#3a4a63"/>'+
    '<rect x="744" y="92" width="16" height="20" rx="2" fill="#101a28" stroke="#3a4a63"/>'+
    '<rect x="784" y="88" width="16" height="20" rx="2" fill="#101a28" stroke="#3a4a63"/>'+
    '<rect x="707" y="101" width="10" height="3" fill="#f2c14e"/><rect x="747" y="97" width="10" height="3" fill="#f2c14e"/>'+
    '<rect x="787" y="93" width="10" height="3" fill="#d9533f"/></g>'+
  '<g opacity=".25" stroke="#f2c14e" stroke-width="1" fill="none">'+
    '<path d="M-20 158 L820 150"/><path d="M-20 166 L820 158"/></g>'+
  '<g id="lns"><path id="ln0" d="M -40 114 C 220 110 470 106 840 98" fill="none" stroke="none"/>'+
    '<path id="ln1" d="M -40 138 C 220 134 470 130 840 122" fill="none" stroke="none"/>'+
    '<path id="ln2" d="M -40 162 C 220 158 470 154 840 146" fill="none" stroke="none"/></g>'+
  '<defs><linearGradient id="gSk6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a2330"/><stop offset=".55" stop-color="#1c1626"/><stop offset="1" stop-color="#0a0c15"/></linearGradient>'+
    '<linearGradient id="gRd6" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#3a3038"/><stop offset="1" stop-color="#1a1822"/></linearGradient></defs>'
})

  },

  /* 敘事文案（framework 唔會自己作故事） */
  narrative:{
    story:function(x){
      const res=x.res, C=x.C, R=x.R, styleName=x.style;
      const pos=res.pos;
      if(res.dnf) return '第 '+R.laps+' 圈，架車停咗喺賽道邊。<br><br>'+
        '你行返 pit lane，工程師冇講嘢，只係遞咗支水俾你。<br>'+
        '你嘅風格係<b>'+styleName+'</b> —— 今次賭輸咗。<br><br>'+
        '<span class="small">體能 -8 · 聲望 -1 · 車隊仍然會俾你下一場。</span>';
      if(pos<=3) return '你喺 P'+pos+' 過終點。<br><br>'+
        '無線電傳嚟一陣雜音，然後有人講：「做得好。」<br>'+
        '呢個係你第 '+C.results.filter(function(r){return !r.dnf&&r.pos<=3;}).length+' 個<b>頒獎台</b> —— 亦係第一次，有人喺看台上記住你個名。<br><br>'+
        '<span class="small">聲望 +3（累計 '+(C.rep>0?'+':'')+C.rep+'）· 積分 +'+res.pts+' · 賽季累計 '+C.points+'</span>';
      if(pos<=6) return 'P'+pos+'，有分。<br><br>'+
        '唔算精彩，但工程師話：「你今日冇做錯嘢。」<br>'+
        '喺呢個級別，冇做錯嘢已經係一種本事。<br><br>'+
        '<span class="small">聲望 +1（累計 '+(C.rep>0?'+':'')+C.rep+'）· 積分 +'+res.pts+' · 下一場繼續。</span>';
      return 'P'+pos+'。'+(res.pts?'有 1 分。':'冇分。')+'<br><br>'+
        '你落車嗰刻，隔離車隊嘅人望都冇望你一眼。<br>'+
        '但你記得第 '+Math.max(2,R.laps)+' 圈嗰個彎 —— 你係對嘅，只係冇人見到。<br><br>'+
        '<span class="small">體能 -4 · 下一場：再嚟。</span>';
    },
    seasonEnd:function(x){
      const C=x.C, tier=x.tier;
      const podiums=x.podiums, dnfs=x.dnfs, styleName=x.style;
      const sig=C.name+' · '+styleName+' · 聲望 '+(C.rep>0?'+':'')+C.rep;
      if(tier==='A') return {eyebrow:'CONTRACT OFFER', head:'F3 合約 · 有車隊打電話嚟',
        body:'季終之後第三日，電話響。<br><br>'+
          '「我哋睇過你成季。'+podiums+' 次頒獎台、'+C.points+' 分。下年 F3，我哋有一個位。」<br><br>'+
          '你望住窗外。一年前你仲喺度求人俾你一架車。而家有人求你簽名。<br><br>'+
          '<span class="small">'+sig+' · DNF '+dnfs+' 次</span>'};
      if(tier==='B') return {eyebrow:'TEST OFFER', head:'F3 測試機會 · 未係合約',
        body:'季終之後，你收到一封電郵：一封 F3 車隊嘅測試邀請，兩日，一部舊車。<br><br>'+
          '「唔係合約。但如果你想嚟，我哋有位。」<br><br>'+
          '你今季 '+C.points+' 分、'+podiums+' 次頒獎台。唔夠好，但足夠令有人記住你。<br><br>'+
          '<span class="small">'+sig+'</span>'};
      return {eyebrow:'NO OFFER', head:'冇人打嚟',
        body:'季終之後，電話冇響。<br><br>'+
          '你成季 '+C.points+' 分、'+dnfs+' 次退賽。車隊叫你返嚟做模擬器測試 —— 即係話，下年仲係呢度。<br><br>'+
          '你收好頭盔。你知道自己唔係唔夠快，你係唔夠穩定。<br><br>'+
          '<span class="small">'+sig+'</span>'};
    }
  },

  /* 內容庫：6 類 × 5 張 */
  cards:{

straight:[
 {t:'排位賽，最後一圈',p:'車隊叫你用最後一圈幫隊友拉真空，但你仲未做出好時間。',
  r:'如果你仲想跑自己嘅圈，我明白。但佢係我哋爭車隊積分嘅人。',who:'RACE ENGINEER · AURORA JR',o:[
  {t:'照幫隊友拉真空',s:'排位跌 1 位，但車隊記住你',fx:{d:-1,rep:2},l:'你讓咗。隊友入到 Q3，領隊拍你膊頭。'},
  {t:'跑自己嘅圈',s:'你自己嘅排位，但得罪人',fx:{d:2,rep:-1},l:'你做出一個好圈。無線電靜咗三秒。'},
  {t:'兩樣都搏',s:'可能兩樣都拿，也可能兩樣都輸',fx:{d:1,risk:14},l:'你試，最後一個彎擦到牆，但圈速仲算數。'}]},
 {t:'直路尾流，三架車一串',p:'前面兩架車互相拉真空，你貼喺第三位，速度差 8 km/h。',
  r:'你係最快嗰架，但你要決定幾時抽出嚟。',who:'RACE ENGINEER',o:[
  {t:'早少少抽出嚟',s:'搶先機，但尾流未斷',fx:{d:2,risk:16},l:'你抽出去。前車冇預料，你搶咗個位。'},
  {t:'等多兩個彎',s:'等尾流拉盡先動手',fx:{d:1,risk:4},l:'你等到最後一刻。出彎嗰下你剛剛好過咗佢。'},
  {t:'保持距離，守住胎',s:'唔爭，留返後面',fx:{d:0,fit:3,risk:0},l:'你收一收。胎溫降咗，車仲好揸。'}]},
 {t:'水溫錶紅咗',p:'連續兩圈貼住前車，水溫升到 118 度。工程師叫你降溫。',
  r:'你可以收油兩秒，或者繼續貼，博佢快啲爆胎。',who:'RACE ENGINEER',o:[
  {t:'收油降溫',s:'保住引擎，但蝕位',fx:{d:-1,fit:2,risk:0},l:'你收咗兩秒。水溫回落，但後面嗰架過咗你。'},
  {t:'繼續貼',s:'博前車先頂唔順',fx:{d:1,risk:12},l:'你繼續貼。第三圈，前車讓開咗 —— 佢把車泊咗喺路邊。'},
  {t:'抽出去自己跑',s:'離開尾流，散熱快啲',fx:{d:0,risk:3},l:'你抽出嚟。冇咗尾流，但引擎終於可以呼吸。'}]},
 {t:'起步，兩邊都有車',p:'燈滅，你左邊係一架起步慢嘅車，右邊係你隊友。',
  r:'左邊嗰架慢咗半秒。你想點？',who:'RACE ENGINEER',o:[
  {t:'抽左邊',s:'搶兩個位，但兩架車好近',fx:{d:2,risk:10},l:'你抽左邊。兩架車嘅鏡幾乎碰埋，但你過咗。'},
  {t:'跟隊友後面',s:'安全，車隊會滿意',fx:{d:0,rep:1,risk:2},l:'你跟住隊友。領隊喺無線電講咗聲「好」。'},
  {t:'收油避免碰撞',s:'最安全，但輸位',fx:{d:-2,risk:0},l:'你收油。後面兩架車即刻貼上嚟。'}]},
 {t:'直路尾，煞車點前 80 米',p:'你前面嗰架車遲遲未決定入彎路線，你已經貼到 0.3 秒。',
  r:'你冇位，但你快。你自己揀。',who:'RACE ENGINEER',o:[
  {t:'外線遲剎車',s:'一個彎定勝負',fx:{d:3,risk:20},l:'你遲咗 30 米先踩。車尾擺咗一下，但你出彎喺佢前面。'},
  {t:'內線早剎，等佢出錯',s:'穩陣，等機會',fx:{d:0,risk:4},l:'你早剎。佢冇出錯，但你都冇輸位。'},
  {t:'收一收，保住架車',s:'唔搏，保住架車',fx:{d:-1,risk:0},l:'你收油。工程師冇講嘢，但你知佢鬆咗口氣。'}]}
],
t1:[
 {t:'第一個彎，三架車並排',p:'你外線有位。內線兩架車明顯會撞埋一齊，但你唔肯定幾時。',
  r:'外面有空間，但入面嗰兩個都唔收油。',who:'RACE ENGINEER',o:[
  {t:'收入內線搏位',s:'賺兩三個位，或者即刻收工',fx:{d:3,risk:22},l:'你插咗入去。有車擦到你尾翼，但仲行得。'},
  {t:'行外線等機會',s:'安全，但可能被夾',fx:{d:0,risk:6},l:'你走外線，讓咗個位，但保住架車。'},
  {t:'大力收油避開',s:'最安全，但輸位',fx:{d:-2,risk:0},l:'你避開咗。後面兩架車撞埋，賽道出黃旗。'}]},
 {t:'T1 之前有人鎖死輪胎',p:'前面架車鎖死，一團白煙。你可以行內線過，但會踩到佢啲膠粒。',
  r:'佢仲喺你前面，但你快過佢。',who:'RACE ENGINEER',o:[
  {t:'內線硬過',s:'踩住膠粒都要過',fx:{d:2,risk:14},l:'你踩住膠粒過咗。車震到手指發麻，但位係你嘅。'},
  {t:'等佢出彎先過',s:'穩陣少少',fx:{d:1,risk:5},l:'你等佢出彎。佢讓開半個位，你順勢過。'},
  {t:'收油，睇清楚先',s:'唔搏，保住架車',fx:{d:0,risk:0,fit:1},l:'你收油。雖然蝕位，但你睇清楚成個彎發生咩事。'}]},
 {t:'重新起步，第一彎',p:'安全車走咗，你前面一大堆車擠成一團。',
  r:'重開嗰刻係你今場最好嘅機會。',who:'RACE ENGINEER',o:[
  {t:'一次過搏兩個位',s:'重開亂戰，衝',fx:{d:2,risk:18},l:'你衝入去。兩架車讓咗，你由 P7 變 P5。'},
  {t:'穩住，等前面撞',s:'唔做第一個',fx:{d:0,risk:5},l:'你留喺後面。前面真係有人鎖死，但你冇位過。'},
  {t:'保守，守住後面',s:'唔貪，保住位置',fx:{d:-1,risk:0},l:'你守住線。後面嗰架試咗兩次都過唔到。'}]},
 {t:'隊友喺你隔籬',p:'你同隊友並排入 T1，車隊無線電未出聲。',
  r:'……（無線電靜咗）',who:'NO RADIO',o:[
  {t:'讓半個位俾隊友',s:'車隊會記住',fx:{d:-1,rep:2},l:'你收咗半個位。隊友過咗，賽後講咗聲多謝。'},
  {t:'唔讓，各安天命',s:'你自己嘅位',fx:{d:1,rep:-1,risk:8},l:'你冇讓。兩架車擦身而過，隊友望住你。'},
  {t:'一齊收油',s:'兩個都蝕，但冇人撞',fx:{d:-1,rep:1,risk:0},l:'兩個都收。車隊冇損失，但兩個都蝕位。'}]},
 {t:'T1 出口，你喺草地邊緣',p:'你出彎太闊，右邊兩條胎已經喺白線外。',
  r:'如果你而家收油，會即刻被人過。如果你唔收，會唔會出去？',who:'RACE ENGINEER',o:[
  {t:'唔收，硬食',s:'四個轆都要留喺賽道',fx:{d:1,risk:24},l:'你冇收。車彈咗一下，但你返到賽道，仲喺前面。'},
  {t:'收油返線',s:'保住架車',fx:{d:-2,risk:0},l:'你收油。兩架車過咗你，但架車完整。'},
  {t:'半收，壓住線',s:'中間路線',fx:{d:0,risk:9},l:'你半收。車壓住白線，裁判冇出聲。'}]}
],
tyre:[
 {t:'第 8 圈，胎開始跌',p:'你嘅軟胎已經 8 圈，後面嗰架用中胎。你估佢可以撐多十圈。',
  r:'佢條胎新過你，你撐唔到最後。你想早入站定係撐？',who:'RACE ENGINEER',o:[
  {t:'即刻入站（undercut）',s:'換新胎，賭佢出嚟喺你後面',fx:{d:1,risk:4},l:'你入站。出嚟啱啱喺佢前面，車隊做得好。'},
  {t:'撐多 3 圈',s:'保住賽道位置，但出嚟會落後',fx:{d:-1,risk:2},l:'你撐到第 11 圈。胎已經唔聽話，但位置仲喺。'},
  {t:'留喺外面賭安全車',s:'高風險高回報',fx:{d:0,risk:16},l:'你唔入站。每次過彎都滑，但安全車真係出咗。'}]},
 {t:'左前胎起泡',p:'左前胎起泡，每次入彎都震。工程師叫你減速 1.5 秒一圈。',
  r:'你可以慢，或者你繼續推，睇佢幾時爆。',who:'RACE ENGINEER',o:[
  {t:'減速保胎',s:'慢，但一定返到終點',fx:{d:-1,fit:2,risk:0},l:'你減速。後面嗰架貼咗上嚟，但條胎冇爆。'},
  {t:'繼續推',s:'博佢唔爆',fx:{d:1,risk:15},l:'你繼續推。條胎震到方向盤都震，但仲喺度。'},
  {t:'提早入站',s:'止蝕，換胎',fx:{d:0,risk:3},l:'你入站。早咗三圈，但至少唔使擔心。'}]},
 {t:'兩套胎，兩個策略',p:'你手上有兩套：一套軟胎可以跑 12 圈，一套硬胎可以跑 20 圈。',
  r:'你想用邊套？定係你想我哋幫你決定？',who:'RACE STRATEGIST',o:[
  {t:'軟胎，搏前三',s:'快，但尾段會跌',fx:{d:2,risk:10},l:'你揀軟胎。頭幾圈快到連工程師都吹口哨。'},
  {t:'硬胎，跑到尾',s:'慢，但唔使再入站',fx:{d:0,risk:2},l:'你揀硬胎。冇人過你，但你都過唔到人。'},
  {t:'跟隊友策略',s:'唔輸給隊友',fx:{d:1,rep:1,risk:4},l:'你跟隊友。兩個一齊入站，車隊好滿意。'}]},
 {t:'胎已經冇咗，後面貼到好近',p:'你胎壽命見底，後面嗰架每圈快 1.2 秒。仲有 6 圈。',
  r:'你守得住幾耐？我哋可以叫你入站，但你會跌到第八。',who:'RACE ENGINEER',o:[
  {t:'死守',s:'用盡路面擋佢',fx:{d:0,risk:12},l:'你守咗四圈。第五圈，佢終於過咗 —— 但你仲喺第三。'},
  {t:'入站保新胎',s:'放棄位置，換速度',fx:{d:-3,risk:0},l:'你入站。出嚟第八，但最後兩圈你係全場最快。'},
  {t:'迫佢犯錯',s:'用盡路面，賭佢衝出嚟',fx:{d:1,risk:20},l:'你封線封到盡。佢撞咗你一下，但你冇讓。'}]},
 {t:'賽後胎溫',p:'你落車，工程師遞咗個平板俾你：四條胎溫度差 40 度。',
  r:'你今場嘅開法，會唔會影響下場？',who:'PERFORMANCE COACH',o:[
  {t:'承認自己開得太狠',s:'車隊會覺得你成熟',fx:{rep:2,fit:-2},l:'你點頭。教練話：「識認，先會改。」'},
  {t:'話係車嘅問題',s:'推卸，但保住面子',fx:{rep:-2,fit:1},l:'你話係車。工程師冇反駁，但佢記住咗。'},
  {t:'唔出聲，記住數據',s:'自己消化',fx:{rep:0,fit:3},l:'你冇講嘢，只係望住個平板。下場你會記得。'}]}
],
sc:[
 {t:'安全車出動',p:'賽道壓縮，所有人距離拉近。你仲有一半賽程。',
  r:'安全車期間入站只蝕 9 秒。你想唔想換？',who:'RACE ENGINEER',o:[
  {t:'入站換新胎',s:'用平價入站換一套新胎',fx:{d:2,risk:3},l:'你入站，好快就出返嚟。呢個係免費嘅運氣。'},
  {t:'唔入站，保住位置',s:'重開嗰刻你有優勢',fx:{d:0,risk:5},l:'你選擇留喺賽道。重開嗰刻你頂住兩架車。'},
  {t:'入站，但只換兩條',s:'省時間，賭一半',fx:{d:1,risk:8},l:'你只換兩條。出嚟快，但車頭車尾唔平衡。'}]},
 {t:'安全車，你喺前列',p:'你喺前幾位，後面大部分車都入咗站，你唔入。',
  r:'如果你而家入站，你會跌出前五。如果你唔入，你要用舊胎跑 14 圈。',who:'RACE ENGINEER',o:[
  {t:'唔入，守住',s:'賭舊胎撐得住',fx:{d:0,risk:14},l:'你唔入。重開嗰刻你頂住，但胎一路跌。'},
  {t:'入站，接受第五',s:'用新胎追返',fx:{d:-4,risk:0},l:'你入站。出嚟第五，但你手上係全場最新嘅胎。'},
  {t:'賭對手中途要再入',s:'計數，唔搏即時',fx:{d:1,risk:9},l:'你唔入。你計啱咗 —— 前面兩架車最後都要再入站。'}]},
 {t:'安全車期間，無線電有雜音',p:'車隊叫你入站，但講到一半斷線。你唔肯定係咪講你。',
  r:'……（靜電）……pit……confirm……',who:'NO RADIO',o:[
  {t:'照入站',s:'如果係講你，就賺咗',fx:{d:-2,risk:2},l:'你入站。技師有啲意外，但佢哋反應好快。'},
  {t:'唔入，等下一個指令',s:'唔賭',fx:{d:1,risk:6},l:'你唔入。車隊之後確認嗰句係講隊友。'},
  {t:'問清楚先',s:'用一圈換確定',fx:{d:-1,risk:0},l:'你問清楚。雖然蝕位，但冇做錯決定。'}]},
 {t:'安全車走，前面一片混亂',p:'你就喺車群前面。你決定幾時加速。',
  r:'你控制節奏。你想幾時踩？',who:'RACE ENGINEER',o:[
  {t:'即刻踩，拉開',s:'唔俾後面機會',fx:{d:2,risk:10},l:'你即刻踩。後面兩架車反應慢咗半秒。'},
  {t:'慢慢加速，等後面迫埋',s:'迫佢哋犯錯',fx:{d:0,risk:3},l:'你慢慢加速。後面貼到好近，但冇人敢過。'},
  {t:'等最後一個彎先踩',s:'經典招式',fx:{d:1,risk:7},l:'你等到最後一個彎。後面嗰架預唔到，你拉開兩個車位。'}]},
 {t:'車群壓縮，煞車過熱',p:'跟咗五圈慢車，煞車溫度 780 度。重開之後你要即刻用盡佢。',
  r:'你可以冷卻一圈，但你會蝕位。',who:'RACE ENGINEER',o:[
  {t:'冷卻一圈',s:'保住煞車',fx:{d:-2,risk:0},l:'你冷卻一圈。煞車回復，但兩個位冇咗。'},
  {t:'照用',s:'賭佢頂得住',fx:{d:0,risk:16},l:'你照踩。煞車震得厲害，但冇失效。'},
  {t:'半冷卻，跟住前面',s:'中間路線',fx:{d:-1,risk:5},l:'你半冷卻。蝕咗一個位，但煞車仲喺。'}]}
],
team:[
 {t:'最後 8 圈，隊友喺你前面',p:'你比隊友快，但車隊無線電叫你讓位 —— 佢爭年度積分。',
  r:'我哋明白你想贏。但呢個係車隊決定。',who:'TEAM PRINCIPAL',o:[
  {t:'讓位',s:'車隊會記住，但你少幾個位',fx:{d:-2,rep:3},l:'你收油。賽後領隊話：「下年有你份。」'},
  {t:'唔讓，繼續追',s:'你自己嘅成績，但關係破裂',fx:{d:1,rep:-2},l:'你冇收油。無線電冇再出聲。'},
  {t:'讓，但條件係下場優先',s:'博一個承諾',fx:{d:-1,rep:1,risk:2},l:'你讓，同時要一個承諾。領隊停咗一秒，然後答「好」。'}]},
 {t:'車隊叫你慳油',p:'油量計算出錯，你要喺最後 10 圈慳 3% 油。',
  r:'你可以跟車尾流慳油，但你會冇機會超車。',who:'RACE ENGINEER',o:[
  {t:'跟尾流慳油',s:'慢，但一定捱到尾',fx:{d:-1,rep:1},l:'你跟住前面。油耗降返，你捱到終點。'},
  {t:'照推，賭計錯',s:'快，但可能冇油',fx:{d:1,risk:14},l:'你照推。最後一圈，油燈閃咗，但你過咗線。'},
  {t:'問隊友幫手拉',s:'用隊友嘅尾流',fx:{d:0,rep:1,risk:2},l:'你問隊友。佢拉咗你三圈，兩個都省到油。'}]},
 {t:'合約年',p:'你嘅合約今年完。領隊喺你耳邊講：「今日表現，我哋會記住。」',
  r:'你知唔知自己而家係第幾？',who:'TEAM PRINCIPAL',o:[
  {t:'搏一個頒獎台',s:'搏到就翻身',fx:{d:2,risk:16},l:'你搏。最後你上咗台，領隊喺台下望住你。'},
  {t:'穩穩陣陣拿分',s:'唔搏，保住合約',fx:{d:0,risk:2},l:'你穩住。有分，冇驚喜，但領隊點頭。'},
  {t:'幫隊友拿車隊分',s:'做隊友嘅後盾',fx:{d:-1,rep:3},l:'你幫隊友。賽後車隊積分多咗六分。'}]},
 {t:'二號車手',p:'你架車今場用舊規格引擎。工程師細聲講：「唔好講出去。」',
  r:'我哋今場冇辦法幫你。',who:'RACE ENGINEER',o:[
  {t:'照揸，用技術補',s:'用彎速補直路',fx:{d:1,risk:6},l:'你用彎速補。雖然直路慢，但你冇輸位。'},
  {t:'公開講',s:'記者會見',fx:{rep:-3,d:0},l:'你講咗。第二日報紙有標題，車隊好嬲。'},
  {t:'接受，幫隊友收集數據',s:'做一個好隊友',fx:{d:-1,rep:2,fit:1},l:'你接受。工程師話：「呢個人情，我記住。」'}]},
 {t:'隊友撞車，你喺隔籬',p:'隊友撞咗，安全車出動。車隊叫你入站，但你唔想。',
  r:'我哋需要你嘅分。',who:'TEAM PRINCIPAL',o:[
  {t:'入站，聽車隊',s:'穩陣拿分',fx:{d:-1,rep:2,risk:2},l:'你入站。出嚟第八，但胎新，你追上咗兩個位。'},
  {t:'唔入，自己判斷',s:'你覺得賽道位置更重要',fx:{d:1,rep:-1,risk:8},l:'你唔入。重開嗰刻你頂住，但車隊唔出聲。'},
  {t:'入站但要求換軟胎',s:'爭取最好嘅胎',fx:{d:0,risk:5},l:'你入站，要軟胎。技師猶豫咗一下，但照做。'}]}
],
last:[
 {t:'最後兩圈，前面嗰架失誤',p:'佢跑開咗，賽道內側有位。你嘅胎已經 20 圈。',
  r:'佢條胎都冇咗。你自己決定。',who:'RACE ENGINEER',o:[
  {t:'搏入內線',s:'一個彎決定成敗',fx:{d:2,risk:18},l:'你插咗入去。兩架車並排過咗個彎 —— 你贏咗。'},
  {t:'跟住，等佢自己出錯',s:'穩陣，但可能冇機會',fx:{d:0,risk:2},l:'你貼住佢。最後一圈，佢守得住。'},
  {t:'收油保車',s:'保住積分，唔搏',fx:{d:-1,risk:0},l:'你收油。有人話你唔夠狠。'}]},
 {t:'最後一圈，差 0.4 秒',p:'你冇 DRS，前面嗰架每個彎都守得死。',
  r:'最後一個彎。你只有一次機會。',who:'RACE ENGINEER',o:[
  {t:'外線大膽一搏',s:'一次過，或者撞',fx:{d:2,risk:22},l:'你走外線。兩架車差 10 厘米，但你過咗。'},
  {t:'內線假動作',s:'騙佢開門',fx:{d:1,risk:12},l:'你假動作。佢讓咗半個位，你即刻插上去。'},
  {t:'接受 P2',s:'保住亞軍',fx:{d:0,risk:0,rep:1},l:'你收油。P2 都係好成績，車隊有分。'}]},
 {t:'最後一圈，後面越嚟越近',p:'後面嗰架每圈快你 0.5 秒，你冇得再等。',
  r:'唔好犯錯。就係咁簡單。',who:'RACE ENGINEER',o:[
  {t:'保守跑線',s:'唔好犯錯',fx:{d:0,risk:2},l:'你保守跑線。後面追到 0.9 秒，但你守得住。'},
  {t:'推盡，拉開',s:'證明你唔止贏咁少',fx:{d:1,risk:13},l:'你推盡。最後一圈做出全場最快，贏 2.4 秒。'},
  {t:'提早收油，保引擎',s:'贏少啲都要贏',fx:{d:0,fit:2,risk:0},l:'你收油。贏 0.7 秒，但引擎溫度正常。'}]},
 {t:'最後兩圈，黃旗',p:'前面有車出咗去，黃旗。你可以超，但要小心。',
  r:'黃旗區域唔可以超車。你知嘅。',who:'RACE ENGINEER',o:[
  {t:'守法，唔超',s:'規矩要緊',fx:{d:-1,rep:2},l:'你冇超。賽後裁判讚你專業。'},
  {t:'照超，賭無人睇到',s:'快，但可能被罰',fx:{d:1,rep:-3,risk:12},l:'你超咗。賽後調查，你冇被罰，但車隊唔高興。'},
  {t:'超，但即刻讓返',s:'博個位再還',fx:{d:0,risk:3},l:'你超咗再讓返。冇人投訴，但你都冇賺。'}]},
 {t:'衝線前，車隊叫你減速',p:'你引擎溫度爆錶。工程師叫你最後半圈收油。',
  r:'你而家 P4。如果你收油，你可能變 P6。',who:'RACE ENGINEER',o:[
  {t:'收油，保引擎',s:'保住下場嘅引擎',fx:{d:-2,fit:3,risk:0},l:'你收油。P6，但引擎冇事。下場仲有得跑。'},
  {t:'唔收，衝埋佢',s:'P4 要緊',fx:{d:0,risk:18},l:'你冇收。引擎捱到終點，但聲音明顯唔同咗。'},
  {t:'收一半',s:'中間路線',fx:{d:-1,risk:6},l:'你收一半。P5，引擎溫度回落。'}]}
]

  }
};
