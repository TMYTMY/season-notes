/* =====================================================================
 * PACK · bistro — 主廚生涯（BISTRO SEPT）
 * 證明：同一個 framework、同一套 UI，換呢個檔就變另一個遊戲。
 * ===================================================================== */

/* 靜態場景 helper：一塊漸變 + 地平線 + 任意裝飾 */
function stage(bg1,bg2,horizon,deco){
  return '<rect x="-20" y="-20" width="840" height="215" fill="'+bg1+'"/>'+
    '<rect x="-20" y="-20" width="840" height="'+(horizon+18)+'" fill="url(#gStage)"/>'+
    '<rect x="-20" y="'+(horizon-30)+'" width="840" height="34" fill="url(#gWarm)" opacity=".55"/>'+
    deco+
    '<path d="M-20 '+horizon+' L820 '+(horizon-6)+' L820 176 L-20 176 Z" fill="'+bg2+'"/>'+
    '<defs>'+
    '<linearGradient id="gStage" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="#243a58"/><stop offset="1" stop-color="#2f4a6d"/></linearGradient>'+
    '<linearGradient id="gWarm" x1="0" y1="0" x2="0" y2="1">'+
    '<stop offset="0" stop-color="#f2c14e" stop-opacity="0"/><stop offset="1" stop-color="#f2c14e" stop-opacity=".5"/></linearGradient>'+
    '</defs>';
}

PACKS.bistro = {
  meta:{
    id:'bistro',
    title:'MISE',
    saveKey:'bistro.save.v1',
    rounds:6,
    field:8,
    season:'2027',
    subject:'BISTRO SEPT',
    subjectShort:'SEPT'
  },

  labels:{
    brand:'MISE', brandSub:'主廚生涯',
    position:'名次', score:'評分', reputation:'名聲', fitness:'體力', table:'排行榜',
    stateTitle:'今晚狀態', statePhase:'時段', stateRisk:'失誤風險', statePlace:'廚房位置',
    recordTitle:'今晚紀錄', recordEmpty:'仲未有紀錄 —— 每個決定都會寫入呢度。',
    autosave:'● 自動存檔',
    roundWord:'WEEK', seasonWord:'SEASON', decisionWord:'DECISION',
    classification:'Scorecard', championship:'Leaderboard',
    repLogTitle:'名聲變化', repLogEmpty:'仲未有紀錄。',
    seasonFinal:'季終成績', seasonTable:'賽季評分', seasonEnd:'季終',
    newSeason:'開新一季 →', restart:'放棄 · 開新一季', restartShort:'開新一季（清除存檔）',
    backToRace:'返廚房', backToRace2:'返去幹活 →', backToResult:'返去成績 →',
    nextRace:'下一週 →', nextDecision:'下一個決定 →',
    seeResult:'睇今晚成績 →', seeSeason:'季終 · 睇成績 →', continueCareer:'繼續 →',
    trackFront:'爐頭', trackMid:'中段', trackBack:'洗碗位',
    phases:['備料','開門','第一輪','第二輪','甜點','收舖'], phaseFallback:'服務中',
    riskWord:'風險', safe:'安全', samePlace:'位置不變',
    crashMsg:'失手 · 打爛', overtake:'搶到 ·', overtaken:'被搶 ·', places:'位',
    dnf:'收舖', podium:'三星', pointsFinish:'有分', finished:'完成', noPoints:'冇分',
    pointsSuffix:'分', ofField:'／',
    colPos:'P', colName:'CHEF', colTeam:'餐廳', colPts:'PTS',
    seedWord:'種子', selfMark:'你', circuitWord:'場', cumWord:'累計'
  },

  create:{
    eyebrow:'BISTRO SEPT · 2027 季前',
    headline:['你 24 歲。','做咗三年 prep。<em>今晚有人請你頂爐頭</em>。'],
    lede:'六個星期、一張八人餐牌、一個唔夠人手嘅廚房。每週你會遇到六個決定 —— 幾時快、幾時等、幾時得罪供貨商。做得好，會有更大嘅餐廳打電話俾你。',
    nameLabel:'廚師名', defaultName:'ENZO',
    styleLabel:'風格',
    teamLabel:'餐廳', teamValue:'BISTRO SEPT · 二十四個位，開放式廚房',
    cta:'簽約，開始季前試菜 →',
    radioWho:'SOUS CHEF · SEPT', radioFirst:'「今晚滿座，唔好諗太多，先出咗頭盤。」'
  },

  archetypes:{
    fire:{label:'大火快炒',bonus:1,riskMul:1.25,note:'出餐快，易失手'},
    slow:{label:'慢火細做',bonus:0,riskMul:0.70,note:'慢少少，穩陣'},
    chefy:{label:'創意主導',bonus:1,riskMul:1.10,note:'驚喜大，風險高'}
  },

  cats:['pass','service','supplier','critic','staff','close'],
  scoring:[10,8,6,5,4,3,2,1],

  entities:{
    circuits:[
      {n:'BISTRO SEPT',s:'SEPT'},{n:'TABLE 12',s:'TABLE 12'},
      {n:'MARKET RUN',s:'MARKET'},{n:'THE CRITIC',s:'CRITIC'},
      {n:'STAFF NIGHT',s:'STAFF'},{n:'LAST SERVICE',s:'CLOSING'}
    ],
    rivals:['MAR','LUC','ODA','BRE','TAN','VIV','HOL','NEY'],
    teams:['SEPT','CASA NOVE','KILN','LAUREN','OMBRA','FENNEL','PARC','SALT']
  },

  scenes:{
    pass:()=>({cap:'PASS · 出餐口',spd:'7 張單',zoom:1,
      svg:stage('#25395a','#1c2f4d',104,
        '<rect x="238" y="96" width="720" height="10" rx="221" fill="#26313f"/>'+
        '<g fill="#f2c14e" opacity=".85"><rect x="274" y="86" width="26" height="10" rx="221"/>'+
        '<rect x="355" y="86" width="26" height="10" rx="221"/><rect x="436" y="86" width="26" height="10" rx="221"/></g>'+
        '<g opacity=".5" stroke="#8fa7c4" stroke-width="1.2" fill="none">'+
        '<path d="M60 130 L760 126"/><path d="M60 150 L760 146"/></g>')}),
    service:()=>({cap:'FLOOR · 全場滿座',spd:'24 位',zoom:1,
      svg:stage('#25395a','#1d3050',92,
        '<g fill="#2c405d" stroke="#3d5474"><rect x="256" y="104" width="90" height="26" rx="222"/>'+
        '<rect x="332" y="112" width="90" height="26" rx="222"/><rect x="414" y="104" width="90" height="26" rx="222"/>'+
        '<rect x="494" y="112" width="90" height="26" rx="222"/></g>'+
        '<g fill="#f2c14e" opacity=".5"><circle cx="265" cy="120" r="5"/><circle cx="288" cy="120" r="5"/>'+
        '<circle cx="342" cy="128" r="5"/><circle cx="364" cy="128" r="5"/></g>')}),
    supplier:()=>({cap:'MARKET · 早上六點',spd:'6 個箱',zoom:1,
      svg:stage('#263b5c','#1d3051',100,
        '<g fill="#2b3f5a" stroke="#3d5474"><rect x="274" y="96" width="70" height="46" rx="221"/>'+
        '<rect x="314" y="104" width="70" height="38" rx="221"/><rect x="355" y="90" width="70" height="52" rx="221"/></g>'+
        '<g stroke="#f2c14e" stroke-opacity=".7" stroke-width="2"><path d="M140 96 L140 84"/><path d="M330 90 L330 78"/></g>')}),
    critic:()=>({cap:'THE CRITIC · 第二道菜',spd:'1 位',zoom:1,
      svg:stage('#223454','#101a29',88,
        '<rect x="332" y="100" width="300" height="40" rx="223" fill="#243349" stroke="#3d5474"/>'+
        '<g fill="#f2c14e"><rect x="349" y="112" width="16" height="16" rx="221"/><rect x="360" y="112" width="16" height="16" rx="221"/>'+
        '<rect x="372" y="112" width="16" height="16" rx="221"/></g>'+
        '<g fill="#3a4a63"><rect x="445" y="112" width="16" height="16" rx="221"/><rect x="457" y="112" width="16" height="16" rx="221"/></g>')}),
    staff:()=>({cap:'STAFF NIGHT · 收工後',spd:'5 人',zoom:1,
      svg:stage('#25395a','#20334f',96,
        '<g fill="#33496a"><rect x="274" y="120" width="22" height="40" rx="224"/><rect x="310" y="120" width="22" height="40" rx="224"/>'+
        '<rect x="346" y="120" width="22" height="40" rx="224"/><rect x="382" y="120" width="22" height="40" rx="224"/></g>'+
        '<rect x="265" y="160" width="300" height="6" rx="221" fill="#f2c14e" opacity=".35"/>')}),
    close:()=>({cap:'LAST SERVICE · 收舖',spd:'23:40',zoom:1,
      svg:stage('#060b13','#1e3150',110,
        '<g opacity=".6" stroke="#8fa7c4" stroke-width="1" fill="none"><path d="M60 130 L760 126"/></g>'+
        '<rect x="368" y="112" width="140" height="8" rx="222" fill="#f2c14e" opacity=".5"/>'+
        '<g fill="#2c405d"><rect x="274" y="126" width="60" height="34" rx="221"/><rect x="499" y="126" width="60" height="34" rx="221"/></g>')})
  },

  narrative:{
    story:function(x){
      const res=x.res,C=x.C,R=x.R,styleName=x.style,pos=res.pos;
      if(res.dnf) return '第 '+R.laps+' 張單，你把嘢倒瀉喺 pass 口。<br><br>'+
        '你洗乾淨手，繼續。sous chef 冇鬧你，只係話：「慢返少少。」<br>'+
        '你嘅風格係<b>'+styleName+'</b> —— 今晚太快。<br><br>'+
        '<span class="small">體力 -8 · 名聲 -1</span>';
      if(pos<=3) return '你今晚做到第 '+pos+' 位。<br><br>'+
        '第二輪嗰道菜，客人叫咗侍應返嚟問係邊個做。<br>'+
        '呢個係你第 '+C.results.filter(function(r){return !r.dnf&&r.pos<=3;}).length+' 次入前三。<br><br>'+
        '<span class="small">名聲 +3（累計 '+(C.rep>0?'+':'')+C.rep+'）· 評分 +'+res.pts+'</span>';
      if(pos<=5) return 'P'+pos+'，有分。<br><br>出餐準時，冇退菜。sous chef 點咗下頭。<br><br>'+
        '<span class="small">名聲 +1（累計 '+(C.rep>0?'+':'')+C.rep+'）· 評分 +'+res.pts+'</span>';
      return 'P'+pos+'。'+(res.pts?'有 1 分。':'冇分。')+'<br><br>有一枱等到走。你在洗碗位諗咗好耐。<br><br>'+
        '<span class="small">體力 -4 · 下一週：再嚟。</span>';
    },
    seasonEnd:function(x){
      const C=x.C,tier=x.tier,podiums=x.podiums,dnfs=x.dnfs,styleName=x.style;
      const sig=C.name+' · '+styleName+' · 名聲 '+(C.rep>0?'+':'')+C.rep;
      if(tier==='A') return {eyebrow:'HEAD CHEF OFFER',head:'有人請你開自己嘅廚房',
        body:'季終之後第三日，電話響。<br><br>「我食過你六個星期。你嘅手勢我記得。下年，我哋有個位。」<br><br>'+
        '你望住自己對鞋。一年前你仲喺度切洋蔥。<br><br><span class="small">'+sig+' · 失手 '+dnfs+' 次</span>'};
      if(tier==='B') return {eyebrow:'TRIAL SHIFT',head:'試工機會 · 未係合約',
        body:'季終之後，你收到一個訊息：一晚試工，四個鐘，冇錢。<br><br>'+
        '「唔係合約。但如果你想嚟，我哋有位。」<br><br><span class="small">'+sig+'</span>'};
      return {eyebrow:'NO CALL',head:'冇人打嚟',
        body:'季終之後，電話冇響。<br><br>你成季 '+C.points+' 分。老闆話下季照樣開門，照樣請你。<br><br>'+
        '<span class="small">'+sig+'</span>'};
    }
  },

  cards:{
    pass:[
     {t:'第一張單入咗',p:'七張單同時落，pass 口得你一個。',r:'「你頂住先，我落樓攞貨。」',who:'SOUS CHEF · SEPT',o:[
       {t:'一張一張嚟',s:'穩，但慢',fx:{d:0,risk:3},l:'你順住做。出餐慢咗，但冇退菜。'},
       {t:'兩張同時開火',s:'快，但兩邊都要睇',fx:{d:2,risk:16},l:'你開兩個爐。有一碟差少少焦。'},
       {t:'叫樓面幫手',s:'借人，但欠人情',fx:{d:1,rep:-1,risk:6},l:'侍應幫你擺盤。佢面色唔太好。'}]},
     {t:'一碟退返嚟',p:'客人話太鹹。',r:'你自己試一啖，唔鹹。',who:'SOUS CHEF',o:[
       {t:'認，重做',s:'慢，但企得住',fx:{d:-1,rep:2,risk:0},l:'你重做一碟。客人走嗰陣同你點頭。'},
       {t:'照上，唔理',s:'快，但賭',fx:{d:0,rep:-2,risk:8},l:'你照上。之後冇再投訴，但冇人讚。'},
       {t:'出去解釋',s:'露面，有風險',fx:{d:1,risk:12},l:'你行出廚房解釋。客人笑咗。'}]},
     {t:'最後一張單，23:28',p:'廚房已經洗到一半。',r:'「仲有一張。你想點？」',who:'SOUS CHEF',o:[
       {t:'照做',s:'做完先收',fx:{d:1,fit:-3,risk:0},l:'你做完。走嗰陣成間舖黑晒。'},
       {t:'快炒，唔跟步驟',s:'快，但可能失手',fx:{d:1,risk:18},l:'你亂咁嚟。出咗，但你自己都唔想試。'},
       {t:'同客人講冇',s:'老實，但得罪',fx:{d:-2,rep:-1},l:'客人冇出聲，走咗。'}]}
    ],
    service:[
     {t:'十二人 party 遲到',p:'訂七點，七點九先到。',r:'「佢哋一到就全枱一齊上。」',who:'HEAD WAITER',o:[
       {t:'全部同時出',s:'壯觀，但亂',fx:{d:2,risk:17},l:'十二碟同時出。兩碟凍咗。'},
       {t:'分批出',s:'穩，但客人不滿',fx:{d:0,rep:-1,risk:3},l:'分三批。有人投訴點解唔齊。'},
       {t:'先出頭盤拖時間',s:'中間路線',fx:{d:1,risk:7},l:'你出頭盤。時間啱啱好。'}]},
     {t:'隔離枱等咗四十分鐘',p:'你哋漏咗一張單。',r:'「你話我知，我出去補救。」',who:'HEAD WAITER',o:[
       {t:'認錯，請佢一杯',s:'蝕錢，但留住人',fx:{d:-1,rep:3,risk:0},l:'你請咗一杯。佢下星期再嚟。'},
       {t:'賴系統',s:'保住面子',fx:{d:0,rep:-2,risk:5},l:'你賴系統。樓面知係你漏。'},
       {t:'即刻補一碟招牌',s:'用成本買時間',fx:{d:1,risk:9},l:'你出咗一碟招牌。佢冇再提。'}]},
     {t:'滿座，仲有人排隊',p:'門口企咗六個人。',r:'「你想加枱定叫人走？」',who:'SOUS CHEF',o:[
       {t:'加枱',s:'多做生意，但擠',fx:{d:1,risk:13},l:'你加咗兩張枱。廚房追得好辛苦。'},
       {t:'唔加，維持質素',s:'穩',fx:{d:0,rep:1,risk:2},l:'你冇加。客人等，但食物準。'},
       {t:'開外賣窗',s:'新做法',fx:{d:2,risk:15,rep:1},l:'你開外賣。廚房亂，但生意好。'}]}
    ],
    supplier:[
     {t:'魚販遲到',p:'六點半，貨未到。',r:'「今日嘅魚你仲要唔要？」',who:'SOUS CHEF',o:[
       {t:'等佢',s:'餐牌唔使改',fx:{d:0,risk:6},l:'你等到七點。餐牌照舊。'},
       {t:'去街市買',s:'自己搞，質素唔穩',fx:{d:1,risk:14,fit:-2},l:'你跑去街市。魚細條啲，但新鮮。'},
       {t:'改餐牌',s:'冇魚，做其他',fx:{d:-1,rep:1,risk:2},l:'你改咗餐牌。客人冇發覺。'}]},
     {t:'供應商加價 15%',p:'你嘅成本頂唔住。',r:'「你要唔要轉第二間？」',who:'OWNER',o:[
       {t:'照加，自己食',s:'質素保住',fx:{d:-1,rep:2,risk:3},l:'你照用。成本食咗你利潤。'},
       {t:'轉平價貨',s:'省錢，但味道變',fx:{d:1,rep:-2,risk:10},l:'你轉咗。有熟客問你換咗咩。'},
       {t:'同佢傾',s:'睇你牙力',fx:{d:1,risk:9},l:'你同佢傾到 8%。'}]},
     {t:'一批貨有問題',p:'菜葉邊爛咗。',r:'「用得唔得？今晚滿座。」',who:'SOUS CHEF',o:[
       {t:'唔用，掉',s:'蝕錢，但安全',fx:{d:-2,rep:2,risk:0},l:'你掉咗。餐牌少一道。'},
       {t:'揀好嘅用',s:'中間路線',fx:{d:0,risk:8},l:'你揀過先用。冇人發覺。'},
       {t:'照用',s:'危險',fx:{d:1,rep:-3,risk:20},l:'你照用。有人食剩晒。'}]}
    ],
    critic:[
     {t:'有人話枱邊嗰位係寫食評',p:'第二道菜準備上。',r:'「你信唔信？」',who:'HEAD WAITER',o:[
       {t:'照常出',s:'唔特別招呼',fx:{d:0,risk:2},l:'你照常出。'},
       {t:'加碼，出 signature',s:'搏一鋪',fx:{d:2,risk:15},l:'你出 signature。佢望住碟望咗好耐。'},
       {t:'親自出去',s:'露面',fx:{d:1,rep:1,risk:8},l:'你出去講咗兩句。佢笑。'}]},
     {t:'佢叫咗你招牌菜',p:'但今日嘅貨唔夠靚。',r:'「換唔換第二道？」',who:'SOUS CHEF',o:[
       {t:'照出',s:'賭',fx:{d:1,risk:18},l:'你照出。佢食晒。'},
       {t:'換一道更好',s:'穩',fx:{d:0,rep:1,risk:4},l:'你換咗。佢冇問。'},
       {t:'親自解釋',s:'坦白',fx:{d:1,rep:2,risk:6},l:'你行出去解釋。佢寫咗落簿。'}]},
     {t:'佢食完，叫埋單',p:'冇講任何嘢。',r:'「要唔要送杯嘢？」',who:'HEAD WAITER',o:[
       {t:'送',s:'成本買印象',fx:{d:0,rep:2,risk:2},l:'你送咗一杯。佢點頭走。'},
       {t:'唔送',s:'照規矩',fx:{d:0,risk:0},l:'你冇送。佢走咗。'},
       {t:'出去問一句',s:'直接',fx:{d:1,risk:10,rep:1},l:'你問佢覺得點。佢講咗一句：「醬太濃。」'}]}
    ],
    staff:[
     {t:'二廚想走',p:'佢話有人挖佢。',r:'「你想我留定走？」',who:'SECOND COOK',o:[
       {t:'留佢，俾多啲',s:'成本，但穩定',fx:{d:1,fit:-2,risk:3},l:'你留咗佢。成本高咗。'},
       {t:'由佢走',s:'少個人，你要頂',fx:{d:-1,fit:-5,risk:10},l:'佢走咗。你頂咗兩個位。'},
       {t:'叫佢留到下季',s:'拖住',fx:{d:0,risk:6},l:'佢答應留到季尾。'}]},
     {t:'洗碗位請假',p:'今晚得返四個人。',r:'「你想點排？」',who:'SOUS CHEF',o:[
       {t:'自己洗',s:'頂硬上',fx:{d:1,fit:-6,risk:5},l:'你洗咗成晚。手都皺。'},
       {t:'叫外援',s:'花錢',fx:{d:0,risk:3},l:'你叫咗個散工。'},
       {t:'減少出餐',s:'穩，但賺少',fx:{d:-1,rep:1,risk:2},l:'你減咗出餐量。'}]},
     {t:'有人喺廚房爆粗',p:'成隊都聽到。',r:'「你管唔管？」',who:'OWNER',o:[
       {t:'即刻制止',s:'立規矩',fx:{d:0,rep:1,risk:4},l:'你制止咗。氣氛凍咗一晚。'},
       {t:'私下講',s:'留面',fx:{d:1,risk:3},l:'你收工後同佢講。佢點頭。'},
       {t:'當冇事',s:'唔想搞大',fx:{d:0,rep:-2,risk:7},l:'你當冇事。有人唔服。'}]}
    ],
    close:[
     {t:'23:50，仲有一枱',p:'佢哋叫咗甜品。',r:'「廚房想收。」',who:'SOUS CHEF',o:[
       {t:'做',s:'做完先走',fx:{d:1,fit:-2,risk:2},l:'你做完。走嗰陣零晨十二點半。'},
       {t:'同佢講廚房收咗',s:'快，但得罪',fx:{d:-1,rep:-1,risk:3},l:'你叫樓面講。客人走咗。'},
       {t:'出預製甜品',s:'快，但唔係你嘅水準',fx:{d:0,risk:9},l:'你出咗雪櫃嗰碟。'}]},
     {t:'盤點，數字唔對',p:'差咗兩百蚊貨。',r:'「邊個負責？」',who:'OWNER',o:[
       {t:'自己認',s:'蝕錢，但企得住',fx:{d:0,rep:2,risk:2},l:'你認咗。老闆冇再問。'},
       {t:'查落去',s:'慢，但公道',fx:{d:0,fit:-2,risk:4},l:'你查到十二點。係記帳錯。'},
       {t:'當冇事',s:'危險',fx:{d:0,rep:-2,risk:8},l:'你冇出聲。下個月又差。'}]},
     {t:'季尾，有人嚟食飯',p:'一位舊客人，帶咗朋友。',r:'「佢話想見下煮嘢嗰個。」',who:'HEAD WAITER',o:[
       {t:'出去見',s:'露面',fx:{d:1,rep:2,risk:3},l:'你出去。佢介紹你畀朋友。'},
       {t:'唔出，廚房仲有嘢',s:'專注',fx:{d:2,fit:-2,risk:3},l:'你留喺廚房。出餐完美。'},
       {t:'出 signature 招呼',s:'搏',fx:{d:2,risk:13},l:'你出 signature。佢食完拍手。'}]}
    ]
  }
};
