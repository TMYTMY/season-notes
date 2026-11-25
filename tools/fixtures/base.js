var CARDS=[], JUDGE={}, ENTRY={}, ROUTE19={}, ROUTE20={}, ROUTE20B={};

function mkCard(id,y,kind){
  var c={id:id,y:y,kind:kind,t:'標題',p:'一句前提。',o:[]};
  ['甲','乙','丙'].forEach(function(n,i){
    c.o.push({t:'選項'+n,s:'短標籤',fx:{feel:1},l:'結果句。'});
    JUDGE[id+':'+i]= i===0 ? {chk:'feel',dc:50,f:{feel:1},l:'失敗句。'} : {auto:1};
  });
  return c;
}

for(var yr=14;yr<=17;yr++){
  for(var n=1;n<=11;n++){
    CARDS.push(mkCard('c'+yr+'_'+(n<10?'0'+n:''+n),yr,n%2?'tech':'social'));
  }
}

['f4','rally','street'].forEach(function(r){
  ROUTE19[r]=[];
  ROUTE20B[r]=[];
  for(var i=1;i<=4;i++) ROUTE19[r].push(mkCard('r19_'+r+'_'+i,19,'tech'));
  ROUTE20[r]=mkCard('r20_'+r,20,'social');
  for(var j=1;j<=5;j++) ROUTE20B[r].push(mkCard('r20b_'+r+'_'+j,20,'tech'));
  ENTRY[r]=mkCard('entry-'+r,18,'tech');
});

CARDS[0].o[1].fx.record=1;

function judgeOf(card,i){
  if(!card||!card.id)return null;
  return JUDGE[card.id+':'+i]||null;
}
function dcBase(jd){
  var v=Math.round(40+(jd.dc-40)*0.8);
  return Math.max(40,Math.min(58,v));
}
