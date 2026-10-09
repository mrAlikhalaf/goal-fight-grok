/* Goal Fight lobby · interaction layer (popups, states, feedback). No network, no deps. */
(function(){
'use strict';
var GF=window.GF||{},params=GF.params||new URLSearchParams(location.search),STILL=!!GF.STILL;
var $=function(s,r){return (r||document).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var stage=$('#stage'),body=document.body;
if(STILL)body.classList.add('still');
if(params.get('dev')==='0')body.classList.add('nodev');
function later(fn,ms){return setTimeout(fn,ms);}

/* ================= wallet model ================= */
var W0={gold:12480,gems:356,tickets:3},W={},shown={},MAXT=5,state='normal';
function resetWallet(){W={gold:W0.gold,gems:W0.gems,tickets:W0.tickets};shown={gold:W.gold,gems:W.gems,tickets:W.tickets};}
resetWallet();
var curEl={gold:$('#cGold'),gems:$('#cGems'),tickets:$('#cTk')};
var CUR={gold:{ic:'i-coin',name:'ذهب'},gems:{ic:'i-gem',name:'جوهرة'},tickets:{ic:'i-ticket',name:'تذكرة'},usd:{ic:null,name:''}};
function nf(n){return Math.round(n).toLocaleString('en-US');}
function paintCur(k){
  var el=curEl[k];
  if(state!=='normal'){el.textContent='—';return;}
  if(k==='tickets')el.innerHTML='<bdi dir="ltr">'+shown.tickets+'/'+MAXT+'</bdi>';
  else el.textContent=nf(shown[k]);
}
function paintWallet(){['gold','gems','tickets'].forEach(paintCur);var r=$('#refill');if(r)r.style.visibility=W.tickets>=MAXT?'hidden':'';}
function bump(k){var c=curEl[k].closest('.cur');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');later(function(){c.classList.remove('bump');},450);}
var countRaf={};
function countTo(k,to){
  W[k]=to;
  if(k==='tickets'){shown.tickets=to;paintWallet();bump(k);return;}
  var from=shown[k],t0=performance.now(),dur=Math.min(1100,450+Math.abs(to-from)/12);
  cancelAnimationFrame(countRaf[k]);bump(k);
  (function step(now){var p=Math.min(1,(now-t0)/dur),e=1-Math.pow(1-p,3);shown[k]=from+(to-from)*e;paintCur(k);
    if(p<1)countRaf[k]=requestAnimationFrame(step);else{shown[k]=to;paintCur(k);}})(t0);
  paintWallet();
}

/* ================= helpers: stage coords, fly, toast ================= */
function scale(){return stage.getBoundingClientRect().width/2400;}
function center(el){var s=scale(),r=el.getBoundingClientRect(),o=stage.getBoundingClientRect();return {x:(r.left+r.width/2-o.left)/s,y:(r.top+r.height/2-o.top)/s};}
function fly(k,n,fromEl,done){
  var target=curEl[k].closest('.cur').querySelector('.cur-ic'),a=fromEl?center(fromEl):{x:1200,y:540},b=center(target);
  var count=Math.max(3,Math.min(8,Math.round(Math.log(n+1)*1.4))),landed=false;
  for(var i=0;i<count;i++)(function(i){
    var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 100 100');s.setAttribute('class','fly');
    s.innerHTML='<use href="#'+CUR[k].ic+'"/>';stage.appendChild(s);
    var sx=a.x-42+(Math.random()*140-70),sy=a.y-42+(Math.random()*80-40),mx=(sx+b.x)/2+(Math.random()*240-120),my=Math.min(sy,b.y)-120-Math.random()*80;
    var an=s.animate([{transform:'translate('+sx+'px,'+sy+'px) scale(.3)',opacity:0},{transform:'translate('+sx+'px,'+(sy-30)+'px) scale(1.1)',opacity:1,offset:.22},
      {transform:'translate('+mx+'px,'+my+'px) scale(.95)',opacity:1,offset:.6},{transform:'translate('+(b.x-42)+'px,'+(b.y-42)+'px) scale(.55)',opacity:.9}],
      {duration:820,delay:i*70,easing:'cubic-bezier(.45,0,.6,1)',fill:'both'});
    an.onfinish=function(){s.remove();if(!landed){landed=true;done&&done();}};
  })(i);
}
function give(k,n,fromEl){
  if(k==='tickets'){var to=Math.min(MAXT,W.tickets+n);W.tickets=to;fly(k,n,fromEl,function(){countTo('tickets',to);});return;}
  var to2=W[k]+n;W[k]=to2;fly(k,n,fromEl,function(){countTo(k,to2);});
}
var toastT;
function toast(msg,ms){var t=$('#toast');$('#toastTxt').textContent=msg;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toastT);toastT=later(function(){t.classList.remove('show');},ms||1900);}

/* ================= press feedback (squash + glow), mouse & touch ================= */
var PRESS='button,.ad,.mode,.ropt,.pack',pressed=null;
document.addEventListener('pointerdown',function(e){
  var el=e.target.closest(PRESS);if(!el||el.disabled)return;
  pressed=el;el.classList.add('is-press');
  var host=el.querySelector(':scope > .d-tile')||el,size=Math.max(host.offsetWidth,host.offsetHeight)*1.25,r=document.createElement('i');
  r.className='rip';r.style.width=r.style.height=size+'px';host.appendChild(r);later(function(){r.remove();},520);
},{passive:true});
function release(){if(pressed){pressed.classList.remove('is-press');pressed=null;}}
['pointerup','pointercancel','pointerleave','blur'].forEach(function(ev){(ev==='blur'?window:document).addEventListener(ev,release,{passive:true});});

/* ================= modal manager ================= */
var stack=[],hooks={open:{},close:{}};
function modal(id){return document.getElementById('m-'+id);}
function openM(id,opt){
  var m=modal(id);if(!m)return;
  if(stack.indexOf(m)>=0){stack.splice(stack.indexOf(m),1);}
  m.classList.remove('closing','stack2','stack3','stack4');m._closing=false;
  stack.push(m);if(stack.length>1)m.classList.add('stack'+Math.min(4,stack.length));
  if(hooks.open[id])hooks.open[id](opt||{});
  m.classList.add('open');body.classList.add('has-modal');
}
function closeM(m,cb,quiet){
  if(typeof m==='string')m=modal(m);
  if(!m||!m.classList.contains('open')||m._closing){cb&&cb();return;}
  m._closing=true;var i=stack.indexOf(m);if(i>=0)stack.splice(i,1);if(!stack.length)body.classList.remove('has-modal');
  var id=m.id.slice(2);if(!quiet&&hooks.close[id])hooks.close[id]();
  m.classList.add('closing');
  later(function(){m.classList.remove('open','closing','stack2','stack3','stack4');m._closing=false;cb&&cb();},200);
}
function closeAll(cb,quiet){var list=stack.slice();if(!list.length){cb&&cb();return;}list.forEach(function(m,i){closeM(m,i===list.length-1?cb:null,quiet);});}
$$('[data-modal]').forEach(function(m){
  m.addEventListener('click',function(e){var c=e.target.closest('[data-close]');if(c&&m.contains(c))closeM(m);});
});
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(matchOpen){cancelMatch();return;}if(stack.length)closeM(stack[stack.length-1]);}
  if((e.key==='d'||e.key==='D'||e.key==='`')&&!e.ctrlKey&&!e.metaKey&&!e.altKey)$('#dev').classList.toggle('open');
});

/* ================= gating by state ================= */
function needOnline(msg){
  if(state==='loading'){toast('لحظة… لسه بيحمّل');return false;}
  if(state==='offline'){toast(msg||'الميزة دي محتاجة اتصال بالإنترنت');return false;}
  return true;
}

/* ================= PLAY ================= */
var DIFF={easy:'سهل',mid:'متوسط',hard:'صعب'},diff='mid';
$('#playBtn').addEventListener('click',function(){if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}openM('play');});
$$('.diff button').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();diff=b.dataset.diff;
  $$('.diff button').forEach(function(x){x.classList.toggle('on',x===b);x.setAttribute('aria-checked',x===b);});});});
$$('.mode').forEach(function(m){
  function go(e){if(e.target.closest('.diff'))return;startMode(m.dataset.mode);}
  m.addEventListener('click',go);m.addEventListener('keydown',function(e){if(e.key==='Enter')go(e);});
});
function startMode(mode){
  if(mode!=='bot'&&state==='offline'){toast('اللعب عبر الإنترنت يتطلب اتصالًا. جرّب ضد البوت');return;}
  if(mode==='online'&&W.tickets<1){toast('مفيش تذاكر كفاية');openM('shop',{cat:'tickets'});return;}
  if(mode==='online')countTo('tickets',W.tickets-1);
  closeAll(function(){startMatch(mode);});
}

/* ---- matchmaking screen ---- */
var match=$('#match'),matchOpen=false,mT=[],mClock,mMode;
var OPP={online:['صقر_الملعب','ذهبي · 58'],room:['سارة','صديقة'],bot:['بوت','']};
function startMatch(mode,staticOnly){
  mMode=mode;matchOpen=true;mT.forEach(clearTimeout);mT=[];clearInterval(mClock);
  match.className='match open searching'+(mode==='bot'?' isbot':'');
  var title={bot:'جاري تجهيز المباراة…',online:'جاري البحث عن خصم…',room:'بانتظار صديقك…'}[mode];
  var sub={bot:'ضد البوت · '+DIFF[diff],online:'أونلاين سريع · رتبة ذهبي',room:'غرفة خاصة · الرمز GF-7K2Q'}[mode];
  $('#mtTitle').textContent=title;$('#mtSub').textContent=sub;$('#mtOpName').textContent='؟؟؟';$('#mtOpSub').textContent=mode==='room'?'شارك الرمز مع صديقك':'بانتظار خصم';
  var t0=Date.now(),p=function(v){return (v<10?'0':'')+v;};$('#mtTimer').textContent='00:00';
  if(staticOnly)return;
  mClock=setInterval(function(){var s=((Date.now()-t0)/1000)|0;$('#mtTimer').textContent=p((s/60)|0)+':'+p(s%60);},250);
  mT.push(later(function(){
    match.classList.remove('searching');match.classList.add('found');
    $('#mtTitle').textContent={bot:'البوت جاهز!',online:'تم العثور على خصم!',room:'صديقك انضم!'}[mode];
    $('#mtOpName').textContent=mode==='bot'?'بوت · '+DIFF[diff]:OPP[mode][0];
    $('#mtOpSub').textContent=mode==='bot'?'ذكاء اصطناعي':OPP[mode][1];
    clearInterval(mClock);
    [3,2,1].forEach(function(n,i){mT.push(later(function(){$('#mtSub').textContent='تبدأ المباراة خلال '+n;},700+i*650));});
    mT.push(later(function(){endMatch();toast('هنا تبدأ المباراة (خارج نطاق النموذج)',2400);},700+3*650));
  },{bot:1400,online:3200,room:3800}[mode]));
}
function endMatch(){matchOpen=false;mT.forEach(clearTimeout);clearInterval(mClock);match.classList.add('closing');later(function(){match.className='match';},250);}
function cancelMatch(){if(mMode==='online'&&match.classList.contains('searching'))countTo('tickets',Math.min(MAXT,W.tickets+1));endMatch();toast('تم الإلغاء');}
$('#mtCancel').addEventListener('click',cancelMatch);

/* ================= NOTIFICATIONS ================= */
var notifOn=false,notifShown=false;
function setNotif(v){notifOn=v;var t=$('.tgl[data-set="notif"]');t.classList.toggle('on',v);t.setAttribute('aria-checked',v);}
hooks.open.notif=function(){notifShown=true;};
$('#notifOn').addEventListener('click',function(){setNotif(true);closeM('notif');toast('تم تفعيل الإشعارات');});

/* ================= RENTAL ================= */
var rentSel=$('.ropt.on');
$$('.ropt').forEach(function(o){o.addEventListener('click',function(){rentSel=o;$$('.ropt').forEach(function(x){x.classList.toggle('on',x===o);});$('#rentPrice').textContent=nf(+o.dataset.price);});});
$('#changeBtn').addEventListener('click',function(){openM('rent');});
$('#rentGo').addEventListener('click',function(){
  var d=+rentSel.dataset.days;
  tryBuy({name:'استئجار ريفو · '+(d===1?'يوم واحد':d+' أيام'),icon:'i-shirt',cost:{cur:'gold',n:+rentSel.dataset.price},
    after:function(){toast('ريفو بقى معاك '+(d===1?'يوم كامل':d+' أيام')+'!',2200);}});
});

/* ================= SHOP ================= */
var PACKS={
  gold:[{amt:1000,k:'gold',cost:{cur:'gems',n:20}},{amt:6000,k:'gold',cost:{cur:'gems',n:100},flag:'+20%'},{amt:15000,k:'gold',cost:{cur:'gems',n:400},flag:'الأفضل قيمة'}],
  gems:[{amt:80,k:'gems',cost:{cur:'usd',n:'0.99'}},{amt:500,k:'gems',cost:{cur:'usd',n:'4.99'},flag:'الأكثر شراءً'},{amt:1200,k:'gems',cost:{cur:'usd',n:'9.99'},flag:'+25%'}],
  tickets:[{amt:1,k:'tickets',cost:{cur:'gold',n:300}},{amt:2,k:'tickets',cost:{cur:'gold',n:550}},{amt:'fill',k:'tickets',cost:{cur:'gold',n:1200},flag:'ملء كامل'}]
};
var shopCat='gold';
function priceHTML(c){return c.cur==='usd'?'<span><bdi dir="ltr">$'+c.n+'</bdi></span>':'<svg viewBox="0 0 100 100"><use href="#'+CUR[c.cur].ic+'"/></svg><span><bdi dir="ltr">'+nf(c.n)+'</bdi></span>';}
function renderShop(cat){
  shopCat=cat;$$('#shopTabs button').forEach(function(b){b.classList.toggle('on',b.dataset.cat===cat);});
  $('#packs').innerHTML=PACKS[cat].map(function(p,i){
    var ic=CUR[p.k].ic,n=Math.min(3,i+1),art='';for(var j=0;j<n;j++)art+='<svg viewBox="0 0 100 100"><use href="#'+ic+'"/></svg>';
    var amt=p.amt==='fill'?'<bdi dir="ltr">5/5</bdi>':'<bdi dir="ltr">'+nf(p.amt)+'</bdi>';
    var sub=p.k==='gold'?'ذهب':p.k==='gems'?'جوهرة':p.amt==='fill'?'املأ كل التذاكر':(p.amt===1?'تذكرة':'تذاكر');
    return '<div class="pack" data-i="'+i+'"><span class="halo"></span>'+(p.flag?'<i class="pack-flag">'+p.flag+'</i>':'')+
      '<div class="pack-art n'+n+'">'+art+'</div><b class="gt pack-amt">'+amt+'</b><small class="pack-sub">'+sub+'</small>'+
      '<button class="gbtn '+(p.cost.cur==='usd'?'g-gold':'g-green')+' shine">'+priceHTML(p.cost)+'</button></div>';
  }).join('');
}
$('#shopTabs').addEventListener('click',function(e){var b=e.target.closest('button');if(b)renderShop(b.dataset.cat);});
$('#packs').addEventListener('click',function(e){
  var el=e.target.closest('.pack');if(!el)return;var p=PACKS[shopCat][+el.dataset.i],n=p.amt;
  if(p.k==='tickets'){if(W.tickets>=MAXT){toast('التذاكر مليانة ('+MAXT+'/'+MAXT+')');return;}if(n==='fill')n=MAXT-W.tickets;
    else if(W.tickets+n>MAXT){toast('الحد الأقصى '+MAXT+' تذاكر');return;}}
  tryBuy({name:nf(n)+' '+(p.k==='gold'?'ذهب':p.k==='gems'?'جوهرة':(n===1?'تذكرة':'تذاكر')),icon:CUR[p.k].ic,cost:p.cost,gain:{k:p.k,n:n}});
});
hooks.open.shop=function(o){renderShop(o.cat||shopCat);};
$$('.plus').forEach(function(b){b.addEventListener('click',function(){if(!needOnline('المحفظة تتطلب اتصالًا'))return;openM('shop',{cat:b.dataset.buy});});});
$('#adSlot').addEventListener('click',function(){if(!needOnline('المحفظة تتطلب اتصالًا'))return;openM('shop',{cat:'gems'});});

/* ================= PURCHASE: confirm / not enough ================= */
var pending=null;
function tryBuy(item){
  if(!needOnline('المحفظة تتطلب اتصالًا'))return;
  var c=item.cost;
  if(c.cur!=='usd'&&W[c.cur]<c.n){openM('nogold',{item:item});return;}
  openM('confirm',{item:item});
}
function amtHTML(cur,n){return '<svg viewBox="0 0 100 100"><use href="#'+CUR[cur].ic+'"/></svg><bdi dir="ltr">'+nf(n)+'</bdi>';}
hooks.open.confirm=function(o){
  var it=o.item;pending=it;
  $('#cfIcon').setAttribute('href','#'+it.icon);$('#cfName').textContent=it.name;
  var c=it.cost,rows=$$('.pop-confirm .cf-rows div');
  if(c.cur==='usd'){$('#cfPrice').innerHTML='<bdi dir="ltr">$'+c.n+'</bdi>';rows[1].style.display='none';rows[2].querySelector('span').textContent='الدفع';$('#cfAfter').innerHTML='تجريبي';$('#cfAfter').className='';rows[2].style.display='';}
  else{$('#cfPrice').innerHTML=amtHTML(c.cur,c.n);rows[1].style.display='';rows[2].style.display='';rows[2].querySelector('span').textContent='بعد الشراء';
    $('#cfHave').innerHTML=amtHTML(c.cur,W[c.cur]);$('#cfAfter').innerHTML=amtHTML(c.cur,W[c.cur]-c.n);$('#cfAfter').className='neg';}
};
$('#cfGo').addEventListener('click',function(){
  var it=pending;if(!it)return;pending=null;
  var src=$('.pop-confirm .cf-item');var from=center(src);
  closeAll(function(){
    if(it.cost.cur!=='usd')countTo(it.cost.cur,W[it.cost.cur]-it.cost.n);
    if(it.gain){var fake={getBoundingClientRect:function(){var s=scale(),o=stage.getBoundingClientRect();return {left:o.left+from.x*s-50,top:o.top+from.y*s-50,width:100,height:100};}};
      give(it.gain.k,it.gain.n,fake);toast('تم الشراء: '+it.name);}
    it.after&&it.after();
  });
});
hooks.open.nogold=function(o){
  var it=o.item,c=it.cost,isGold=c.cur==='gold';pending=null;
  $('#ngTitle').textContent=isGold?'الذهب غير كافٍ':'الجواهر غير كافية';
  $$('.ngU').forEach(function(u){u.setAttribute('href','#'+CUR[c.cur].ic);});
  $('#ngNeed').textContent=nf(c.n-W[c.cur]);$('#ngUnit').textContent=isGold?'ذهب':'جوهرة';
  $('#ngPrice').innerHTML=amtHTML(c.cur,c.n);$('#ngHave').innerHTML=amtHTML(c.cur,W[c.cur]);$('#ngHave').className='neg';
  $('#ngGoIc').setAttribute('href',isGold?'#i-gem':'#i-gem');$('#ngGoTxt').textContent=isGold?'احصل على ذهب':'احصل على جواهر';
  $('#ngGo').dataset.cat=isGold?'gold':'gems';
};
$('#ngGo').addEventListener('click',function(){var cat=this.dataset.cat||'gold';closeM('nogold',function(){
  var sh=modal('shop');if(sh.classList.contains('open')){renderShop(cat);}else openM('shop',{cat:cat});});});

/* ================= REWARDS: daily + wheel ================= */
var rewardPending=null;
function openReward(src,items,entry){
  rewardPending={items:items,entry:entry};
  $('#rwSrc').innerHTML=src;
  $('#rwItems').innerHTML=items.map(function(it){return '<div class="rw-it"><svg viewBox="0 0 100 100"><use href="#'+CUR[it.k].ic+'"/></svg><b class="gt"><bdi dir="ltr">+'+nf(it.n)+'</bdi></b><small>'+(it.k==='gold'?'ذهب':it.k==='gems'?'جواهر':'تذاكر')+'</small></div>';}).join('');
  openM('reward');
}
function claimReward(){
  var r=rewardPending;if(!r)return;rewardPending=null;
  var tiles=$$('#rwItems .rw-it');
  r.items.forEach(function(it,i){var t=tiles[i];var c=t?center(t):null;
    var fake=c&&{getBoundingClientRect:function(){var s=scale(),o=stage.getBoundingClientRect();return {left:o.left+c.x*s-50,top:o.top+c.y*s-50,width:100,height:100};}};
    later(function(){give(it.k,it.n,fake);},i*120);});
  if(r.entry){var d=$('.d-item[data-entry="'+r.entry+'"]');d.classList.add('seen','claimed');}
}
hooks.close.reward=claimReward;
$('#rwGo').addEventListener('click',function(){closeM('reward');});
$$('.d-item').forEach(function(d){
  var ok=document.createElement('span');ok.className='ok';ok.innerHTML='<svg viewBox="0 0 100 100"><use href="#i-check"/></svg>';d.querySelector('.d-tile').appendChild(ok);
});
var dailyDone=false;
$('.d-item[data-entry="daily"]').addEventListener('click',function(){
  if(!needOnline('المكافآت تتطلب اتصالًا'))return;
  if(dailyDone){toast('استلمت مكافأة النهارده. ارجع بكرة!');return;}
  dailyDone=true;openReward('المكافأة اليومية · اليوم <bdi dir="ltr">4</bdi> من <bdi dir="ltr">7</bdi>',[{k:'gold',n:500},{k:'gems',n:10},{k:'tickets',n:1}],'daily');
});
['pass','friends'].forEach(function(k){$('.d-item[data-entry="'+k+'"]').addEventListener('click',function(){
  if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}
  this.classList.add('seen');toast((k==='pass'?'بطاقة القتال':'الأصدقاء')+' · قريبًا');});});

/* ---- luck wheel ---- */
var PRIZES=[{k:'gold',n:500},{k:'gems',n:15},{k:'tickets',n:1},{k:'gold',n:1500},{k:'gems',n:50},{k:'gold',n:250},{k:'tickets',n:2},{k:'gold',n:3000}];
var SEG=['#ff4d3d','#ffd53d','#43a8ff','#77e33d','#b65cff','#ff9a2a','#2fd0c0','#ff6ab0'],SEGD=['#a8101a','#b88a00','#1858d6','#2c9e17','#6a1fb0','#b85400','#138a80','#b02a70'];
(function buildWheel(){
  var R=262,h='<defs><radialGradient id="gWgl" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></radialGradient></defs>';
  h+='<circle r="296" fill="#4a2600"/><circle r="290" fill="url(#gGold)" stroke="#5a2a00" stroke-width="6"/>';
  for(var i=0;i<8;i++){
    var a0=(i*45-22.5-90)*Math.PI/180,a1=(i*45+22.5-90)*Math.PI/180;
    h+='<path d="M0 0 L'+(R*Math.cos(a0)).toFixed(1)+' '+(R*Math.sin(a0)).toFixed(1)+' A'+R+' '+R+' 0 0 1 '+(R*Math.cos(a1)).toFixed(1)+' '+(R*Math.sin(a1)).toFixed(1)+' Z" fill="'+SEG[i]+'" stroke="'+SEGD[i]+'" stroke-width="4"/>';
  }
  h+='<circle r="'+R+'" fill="url(#gWgl)"/>';
  for(i=0;i<8;i++){var p=PRIZES[i];
    h+='<g transform="rotate('+(i*45)+')"><use href="#'+CUR[p.k].ic+'" x="-44" y="-172" width="88" height="88"/>'+
      '<text y="-196" direction="ltr" unicode-bidi="embed" text-anchor="middle" font-family="Lalezar,Cairo,sans-serif" font-size="44" fill="#fff" stroke="#0a1238" stroke-width="10" paint-order="stroke" stroke-linejoin="round">'+nf(p.n)+'</text></g>';}
  for(i=0;i<16;i++){var a=i*22.5*Math.PI/180;h+='<circle cx="'+(276*Math.sin(a)).toFixed(1)+'" cy="'+(-276*Math.cos(a)).toFixed(1)+'" r="8" fill="'+(i%2?'#fff6c0':'#fff')+'" stroke="#8a4b00" stroke-width="2.5"/>';}
  $('#bigWheel').innerHTML=h;
})();
var wheelRot=0,spun=false,spinning=false,wTimer;
function wheelLabel(){
  var b=$('#spinBtn');
  if(spun){var s=Math.max(0,((window.GF_wheelEnd-Date.now())/1000)|0),p=function(v){return (v<10?'0':'')+v;};
    b.disabled=true;$('#spinTxt').innerHTML='اللفة الجاية <bdi dir="ltr">'+p((s/3600)|0)+':'+p(((s%3600)/60)|0)+':'+p(s%60)+'</bdi>';}
  else{b.disabled=spinning;$('#spinTxt').textContent=spinning?'بتلف…':'لف مجانًا';}
}
hooks.open.wheel=function(){wheelLabel();clearInterval(wTimer);if(!STILL)wTimer=setInterval(wheelLabel,1000);};
hooks.close.wheel=function(){clearInterval(wTimer);};
$('.d-item[data-entry="wheel"]').addEventListener('click',function(){if(!needOnline('المكافآت تتطلب اتصالًا'))return;openM('wheel');});
$('#spinBtn').addEventListener('click',function(){
  if(spun||spinning)return;spinning=true;wheelLabel();
  var idx=params.has('wheel')?(+params.get('wheel'))%8:(Math.random()*8)|0,cur=((wheelRot%360)+360)%360;
  var target=wheelRot+360*6+((360-idx*45-cur)%360+360)%360+(Math.random()*24-12);
  var rot=$('#wheelRot'),ptr=$('.wheel-ptr');ptr.classList.add('tick');
  var an=rot.animate([{transform:'rotate('+wheelRot+'deg)'},{transform:'rotate('+target+'deg)'}],{duration:4200,easing:'cubic-bezier(.12,.62,.08,1)',fill:'forwards'});
  wheelRot=target;
  later(function(){ptr.classList.remove('tick');},3300);
  an.onfinish=function(){
    rot.style.transform='rotate('+target+'deg)';an.cancel();
    spinning=false;spun=true;window.GF_wheelEnd=Date.now()+24*3600*1000-1000;wheelLabel();
    var p=PRIZES[idx];
    later(function(){closeM('wheel',function(){openReward('عجلة الحظ · لفة مجانية',[p],'wheel');});},450);
  };
});

/* ================= PROFILE / SETTINGS ================= */
$('#avatarBtn').addEventListener('click',function(){openM('profile');});
$('#pfFull').addEventListener('click',function(){toast('الملف الكامل · قريبًا');});
$('#settingsBtn').addEventListener('click',function(){openM('settings');});
$$('.tgl').forEach(function(t){t.addEventListener('click',function(){
  var on=!t.classList.contains('on');
  if(t.dataset.set==='notif'){setNotif(on);toast(on?'تم تفعيل الإشعارات':'تم إيقاف الإشعارات');return;}
  t.classList.toggle('on',on);t.setAttribute('aria-checked',on);
  toast((t.dataset.set==='sound'?'المؤثرات الصوتية':'الموسيقى')+': '+(on?'تشغيل':'إيقاف'));});});
$('#langSeg').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;
  if(b.dataset.lang==='en'){b.classList.add('on');b.previousElementSibling.classList.remove('on');toast('English version: next deliverable');
    later(function(){b.classList.remove('on');b.previousElementSibling.classList.add('on');},900);}});

/* ================= MISSIONS ================= */
var MS0=[
  {n:'اكسب 3 مباريات',p:3,t:3,rw:{k:'gold',n:300},ic:'i-trophy',tile:'t-blue'},
  {n:'سجّل 10 أهداف',p:10,t:10,rw:{k:'gems',n:10},ic:'i-ball',tile:'t-green'},
  {n:'العب ضد البوت مرتين',p:2,t:2,rw:{k:'tickets',n:1},ic:'i-bot',tile:'t-purple'},
  {n:'استخدم ركلة البرق 5 مرات',p:3,t:5,rw:{k:'gold',n:200},ic:'i-bolt',tile:'t-red'}],MS;
function resetMissions(){MS=MS0.map(function(m){return {n:m.n,p:m.p,t:m.t,rw:m.rw,ic:m.ic,tile:m.tile,done:false};});}
resetMissions();
function msLeft(){return MS.filter(function(m){return m.p>=m.t&&!m.done;}).length;}
function paintBadge(){var b=$('#msBadge'),n=msLeft();b.textContent=n;b.style.display=n?'':'none';b.classList.remove('bumped');void b.offsetWidth;b.classList.add('bumped');}
function renderMissions(){
  $('#msList').innerHTML=MS.map(function(m,i){
    var ready=m.p>=m.t&&!m.done,act=m.done?'<span class="ms-done"><svg viewBox="0 0 100 100"><use href="#i-check"/></svg>تم</span>':
      ready?'<button class="gbtn g-green sm shine" data-claim="'+i+'"><span>استلام</span></button>':'<span class="ms-wait">لسه شوية</span>';
    return '<li class="ms'+(ready?' ready':'')+'"><span class="set-ic '+m.tile+'"><svg viewBox="0 0 100 100"><use href="#'+m.ic+'"/></svg></span>'+
      '<div class="ms-body"><b>'+m.n+'</b><div class="ms-bar"><i style="width:'+(Math.min(1,m.p/m.t)*100)+'%"></i><span><bdi dir="ltr">'+m.p+'/'+m.t+'</bdi></span></div></div>'+
      '<span class="ms-rw"><svg viewBox="0 0 100 100"><use href="#'+CUR[m.rw.k].ic+'"/></svg><bdi dir="ltr">+'+nf(m.rw.n)+'</bdi></span>'+act+'</li>';}).join('');
}
hooks.open.missions=renderMissions;
$('#msList').addEventListener('click',function(e){
  var b=e.target.closest('[data-claim]');if(!b)return;if(!needOnline('المكافآت تتطلب اتصالًا'))return;
  var m=MS[+b.dataset.claim];m.done=true;give(m.rw.k,m.rw.n,b);paintBadge();renderMissions();
  if(!msLeft())toast('استلمت كل المهام الجاهزة!');
});

/* ================= BOTTOM TABS ================= */
var TAB_MODAL={chars:'rent',shop:'shop',missions:'missions',profile:'profile'},tabOwner=null;
function setTab(name){$$('.tab').forEach(function(t){t.classList.toggle('active',t.dataset.tab===name);});}
$$('.tab').forEach(function(t){t.addEventListener('click',function(){
  var name=t.dataset.tab;
  if(name==='home'){setTab('home');closeAll();return;}
  if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}
  setTab(name);tabOwner=TAB_MODAL[name];
  closeAll(function(){openM(TAB_MODAL[name],name==='shop'?{cat:'gold'}:{});},true);
});});
['rent','shop','missions','profile'].forEach(function(id){var prev=hooks.close[id];hooks.close[id]=function(){prev&&prev();if(tabOwner===id){tabOwner=null;setTab('home');}};});

/* ================= EVENTS collapse/expand ================= */
var evs=$('#events');
$('#evToggle').addEventListener('click',function(){
  if(evs.classList.contains('collapsed')){evs.classList.remove('collapsed');evs.classList.add('ev-anim');later(function(){evs.classList.remove('ev-anim');},650);}
  else{evs.classList.add('ev-out');later(function(){evs.classList.remove('ev-out');evs.classList.add('collapsed');},170);}
});
$$('#evList .ev').forEach(function(li){li.addEventListener('click',function(){if(state==='loading')return;
  toast(li.querySelector('.nm').textContent+' · '+li.querySelector('.chip').textContent);});});
$('.ev-feature').addEventListener('click',function(){if(state!=='loading')toast('كأس الصحراء · العب أونلاين وجمّع الكؤوس');});

/* ================= STATES ================= */
var SKEL='.xp,.ev,.ev-ftime,.d-timer,.ad';
function setState(s){
  if(['normal','offline','loading'].indexOf(s)<0)s='normal';state=s;
  body.classList.remove('st-normal','st-offline','st-loading');body.classList.add('st-'+s);
  $$(SKEL).forEach(function(el){el.classList.toggle('skel',s==='loading');});
  $$('[data-bind="name"]').forEach(function(el){el.textContent=s==='loading'?'لاعب':'علي';});
  $$('[data-bind="rank"]').forEach(function(el){el.innerHTML=s==='loading'?'الرتبة —':'<svg viewBox="0 0 100 100"><use href="#i-rank"/></svg>ذهبي · 62';});
  $$('#devStates button').forEach(function(b){b.classList.toggle('on',b.dataset.state===s);});
  paintWallet();
}
var retrying=false;
$('#retryBtn').addEventListener('click',function(){
  if(retrying)return;retrying=true;setState('loading');
  later(function(){retrying=false;setState('normal');toast('تم الاتصال بالخوادم');},1800);
});

/* ================= DEV SWITCHER ================= */
var dev=$('#dev');
$('#devPill').addEventListener('click',function(){dev.classList.toggle('open');});
$('#devStates').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setState(b.dataset.state);});
var DEMO_RENT7={name:'استئجار ريفو · 7 أيام',icon:'i-shirt',cost:{cur:'gold',n:14000}};
function demo(name){
  if(name==='match'){closeAll(function(){startMatch('online',STILL);});return;}
  if(matchOpen)endMatch();
  closeAll(function(){
    if(name==='confirm')openM('confirm',{item:{name:'6,000 ذهب',icon:'i-coin',cost:{cur:'gems',n:100},gain:{k:'gold',n:6000}}});
    else if(name==='nogold')openM('nogold',{item:DEMO_RENT7});
    else if(name==='reward')openReward('المكافأة اليومية · اليوم <bdi dir="ltr">4</bdi> من <bdi dir="ltr">7</bdi>',[{k:'gold',n:500},{k:'gems',n:10},{k:'tickets',n:1}],null);
    else if(name==='shop')openM('shop',{cat:params.get('cat')||'gold'});
    else openM(name);
  },true);
}
$('#devPops').addEventListener('click',function(e){var b=e.target.closest('button');if(b)demo(b.dataset.pop);});
$('#devReset').addEventListener('click',function(){
  resetWallet();resetMissions();paintBadge();dailyDone=false;spun=false;window.GF_wheelEnd=0;
  $$('.d-item').forEach(function(d){d.classList.remove('seen','claimed');});paintWallet();toast('تمت إعادة الضبط');});

/* ================= boot ================= */
setState(params.get('state')||'normal');
var pp=params.get('popup');
if(pp)demo(pp);
if(!STILL&&!pp&&params.get('notif')!=='0')later(function(){if(state==='normal'&&!stack.length&&!matchOpen&&!notifShown)openM('notif');},1600);
window.GFI={setState:setState,open:demo,toast:toast,wallet:function(){return W;}};
})();
