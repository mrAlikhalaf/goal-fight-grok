/* Goal Fight · Lobby v2 prototype. Vanilla JS, no network, no deps. */
(function(){
'use strict';
var $=function(s,r){return (r||document).querySelector(s);},$$=function(s,r){return Array.prototype.slice.call((r||document).querySelectorAll(s));};
var params=new URLSearchParams(location.search),STILL=params.has('still');
var stage=$('#stage'),body=document.body,H=1080,SW=2400;
if(STILL)body.classList.add('still');
if(params.get('dev')==='0')body.classList.add('nodev');
function later(fn,ms){return setTimeout(fn,ms);}
function p2(v){return (v<10?'0':'')+v;}
function nf(n){return Math.round(n).toLocaleString('en-US');}

/* ================= adaptive stage: height 1080, width 1920..2560 (16:9 .. 21.3:9) ================= */
function fit(){
  var ar=innerWidth/innerHeight;SW=Math.round(Math.max(1920,Math.min(2560,ar*H)));
  var s=Math.min(innerWidth/SW,innerHeight/H),sx=Math.round(56+(SW-1920)*0.07);
  stage.style.setProperty('--sw',SW+'px');stage.style.setProperty('--sx',sx+'px');stage.style.transform='scale('+s+')';
  body.classList.toggle('narrow',SW<2100);
}
addEventListener('resize',fit);fit();

/* ================= roster (spec §3) ================= */
var CH=[
 {id:'rivo',n:'ريفو',a:'الآس',c:'GF-01',acc:'#3b8cff',acc2:'#1f4fd0',s:[['ركلة البرق','i-bolt','sk-p'],['الجدار الحديدي','i-wall','sk-b']],st:'owned',say:'جاهز!'},
 {id:'brak',n:'براك',a:'الدبابة',c:'GF-02',acc:'#ff4a3a',acc2:'#a01020',s:[['اللكمة الثقيلة','i-fist','sk-p'],['الدرع الصخري','i-wall','sk-b']],st:'owned',say:'هاا!'},
 {id:'ziro',n:'زيرو',a:'السريع',c:'GF-03',acc:'#d8ff3a',acc2:'#7aa800',s:[['الاندفاع','i-dash','sk-p'],['الشقلبة الخلفية','i-star','sk-b']],st:'trial',trial:'2ي',say:'امسكني!'},
 {id:'mako',n:'ماكو',a:'المخادع',c:'GF-04',acc:'#b45cff',acc2:'#5a8a10',s:[['قنبلة الفخ','i-boom','sk-p'],['الكرة الوهمية','i-ball','sk-b']],st:'locked',gem:1200,say:'خدعة!'},
 {id:'kiro',n:'كيرو',a:'التقني',c:'GF-05',acc:'#1fd8b4',acc2:'#0a7a6a',s:[['التسديدة المقوّسة','i-curve','sk-p'],['لمسة المغناطيس','i-magnet','sk-b']],st:'locked',gem:1200,say:'بالمسطرة.'},
 {id:'fero',n:'فيرو',a:'المقاتل',c:'GF-06',acc:'#ff8a1a',acc2:'#a83a00',s:[['سلسلة اللكمات','i-fist','sk-p'],['الأبركت الناري','i-boom','sk-b']],st:'locked',gem:900,say:'تعالى!'},
 {id:'nira',n:'نيرا',a:'الظل',c:'GF-07',acc:'#9a6bff',acc2:'#4a1fb0',s:[['خطوة الظل','i-moon','sk-p'],['الصعق الخاطف','i-bolt','sk-b']],st:'owned',say:'ورايا…'},
 {id:'luma',n:'لوما',a:'المتحكّمة',c:'GF-08',acc:'#8fdcff',acc2:'#2a7ad0',s:[['طلقة التجميد','i-snow','sk-b'],['الحاجز الجليدي','i-wall','sk-b']],st:'locked',gem:1500,say:'تجمّد!'},
 {id:'vela',n:'فيلا',a:'البهلوانة',c:'GF-09',acc:'#ff7a5a',acc2:'#c03a2a',s:[['القفزة المزدوجة','i-star','sk-p'],['الشقلبة الهوائية','i-dash','sk-b']],st:'locked',gem:1500,say:'طيران!'},
 {id:'zaya',n:'زايا',a:'المفاجأة',c:'GF-10',acc:'#ff3aa8',acc2:'#a0106a',s:[['الانفجار','i-boom','sk-p'],['صندوق الفوضى','i-gift','sk-b']],st:'locked',gem:1800,say:'بوم!'}
];
var TAC={n:'القنبلة',ic:'i-bomb',t:'24س'};
CH.forEach(function(c){['front','34','back','face'].forEach(function(k){var i=new Image();i.src='assets/chars/'+c.id+'-'+k+'.png';});});

/* ================= stadium painted once (2560 wide, centred) ================= */
var seed=20261009;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}
(function paint(){
  var c=$('#stadium'),g=c.getContext('2d'),W=2560,cx=1280,curve=function(x){var d=(x-cx)/1250;return d*d*90;};
  var sky=g.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#030820');sky.addColorStop(.55,'#0b1c55');sky.addColorStop(1,'#1a2f72');g.fillStyle=sky;g.fillRect(0,0,W,H);
  var tiers=[[70,250,'#101c4e','#1a2a6a'],[262,452,'#13225c','#20357c'],[464,640,'#172a68','#26408c']];
  tiers.forEach(function(t){g.beginPath();g.moveTo(0,t[0]+curve(0));for(var x=0;x<=W;x+=40)g.lineTo(x,t[0]+curve(x));for(x=W;x>=0;x-=40)g.lineTo(x,t[1]+curve(x));g.closePath();
    var gr=g.createLinearGradient(0,t[0],0,t[1]);gr.addColorStop(0,t[2]);gr.addColorStop(1,t[3]);g.fillStyle=gr;g.fill();
    g.beginPath();for(x=0;x<=W;x+=40){var y=t[1]+curve(x);x?g.lineTo(x,y):g.moveTo(x,y);}g.lineWidth=8;g.strokeStyle='#0a1238';g.stroke();g.lineWidth=3;g.strokeStyle='rgba(140,190,255,.5)';g.stroke();});
  var off=document.createElement('canvas');off.width=W;off.height=H;var o=off.getContext('2d');
  var pal=['#f1f4ff','#2f7bff','#1b2a7a','#ffd23f','#d8e2f0','#3a58c8','#ff9a3a','#0e1748','#e8b860'];
  tiers.forEach(function(t,ti){for(var row=t[0]+16;row<t[1]-8;row+=15){for(var x=-10;x<W+10;x+=12+rnd()*4){
    var y=row+curve(x)+(rnd()*4-2),d=Math.abs(x-cx)/1350;o.globalAlpha=Math.min(1,Math.max(.16,1-d*.95)*(.36+ti*.14));
    o.fillStyle=pal[(rnd()*pal.length)|0];o.beginPath();o.ellipse(x,y,5.4,6,0,0,6.283);o.fill();o.fillStyle='rgba(5,10,40,.55)';o.fillRect(x-6,y+5,12,6);}}});
  g.save();g.filter='blur(2.2px)';g.drawImage(off,0,0);g.restore();
  var haze=g.createLinearGradient(0,60,0,700);haze.addColorStop(0,'rgba(6,12,44,.4)');haze.addColorStop(1,'rgba(30,60,140,.14)');g.fillStyle=haze;g.fillRect(0,60,W,640);
  /* season accent (Desert Kings): warm horizon glow behind the hero */
  var warm=g.createRadialGradient(cx,620,40,cx,620,900);warm.addColorStop(0,'rgba(255,170,70,.22)');warm.addColorStop(1,'rgba(255,170,70,0)');g.fillStyle=warm;g.fillRect(0,0,W,700);
  g.beginPath();g.moveTo(0,0);g.lineTo(W,0);for(var x=W;x>=0;x-=40)g.lineTo(x,66+curve(x)*.6);g.closePath();var rf=g.createLinearGradient(0,0,0,90);rf.addColorStop(0,'#02041a');rf.addColorStop(1,'#0a1440');g.fillStyle=rf;g.fill();
  var top=686,vpY=-900;for(var k=-16;k<16;k++){var xb0=cx+k*170,xb1=xb0+170,f=(top-vpY)/(H-vpY),xt0=cx+(xb0-cx)*f,xt1=cx+(xb1-cx)*f;
    g.beginPath();g.moveTo(xt0,top);g.lineTo(xt1,top);g.lineTo(xb1,H);g.lineTo(xb0,H);g.closePath();g.fillStyle=(k&1)?'#2c9638':'#34aa40';g.fill();}
  var sh=g.createLinearGradient(0,top,0,H);sh.addColorStop(0,'rgba(4,20,40,.55)');sh.addColorStop(.35,'rgba(4,20,40,.1)');sh.addColorStop(1,'rgba(2,10,20,.5)');g.fillStyle=sh;g.fillRect(0,top,W,H-top);
  var hl=g.createRadialGradient(cx,880,20,cx,880,720);hl.addColorStop(0,'rgba(210,255,200,.38)');hl.addColorStop(1,'rgba(210,255,200,0)');g.fillStyle=hl;g.fillRect(0,top,W,H-top);
  g.strokeStyle='rgba(255,255,255,.7)';g.lineWidth=5;g.beginPath();g.moveTo(0,702);g.lineTo(W,702);g.stroke();
  g.beginPath();g.ellipse(cx,890,440,112,0,0,6.283);g.stroke();
  g.beginPath();g.moveTo(0,750);g.lineTo(330,750);g.lineTo(170,H);g.stroke();g.beginPath();g.moveTo(W,750);g.lineTo(W-330,750);g.lineTo(W-170,H);g.stroke();
})();
(function(){var t=['GOAL FIGHT','★ أونلاين 1 ضد 1 ★','الموسم 4 · ملوك الصحراء','GOAL FIGHT','★ كأس الصحراء ★'],h='';for(var r=0;r<6;r++)t.forEach(function(s){h+='<span>'+s+'</span>';});$('#ledTrack').innerHTML=h;
  var fh='';for(var i=0;i<20;i++){var x=(rnd()*2500+30)|0,y=(100+rnd()*480)|0;fh+='<i style="left:'+x+'px;top:'+y+'px;animation-delay:-'+(rnd()*4).toFixed(2)+'s;animation-duration:'+(3+rnd()*3).toFixed(2)+'s"></i>';}$('#flashes').innerHTML=fh;
  var mh='';for(i=0;i<16;i++){var mx=(rnd()*2560-80)|0;mh+='<i style="left:'+mx+'px;--dx:'+((rnd()*160-80)|0)+'px;animation-duration:'+(9+rnd()*8).toFixed(1)+'s;animation-delay:-'+(rnd()*14).toFixed(1)+'s;transform:scale('+(.5+rnd()*.8).toFixed(2)+')"></i>';}
  var cf=$('#confetti');cf.style.cssText='position:absolute;inset:0;left:calc(50% - 1280px);width:2560px;pointer-events:none';cf.innerHTML=mh;})();

/* ================= events (max 6) ================= */
var EV=[
  {n:'كأس الصحراء',s:'live',ic:'i-trophy',t:1*86400+6*3600+12*60+40},
  {n:'ويكند الذهب المضاعف',s:'live',ic:'i-coin',t:3*3600+45*60+10},
  {n:'جنون القنابل',s:'notyet',ic:'i-bomb',t:1*3600+20*60+5},
  {n:'تجربة مجانية: زيرو',s:'notyet',ic:'i-shirt',t:9*3600+5*60},
  {n:'الهدف الذهبي',s:'soon',ic:'i-star',t:1*86400+2*3600},
  {n:'بطولة الجمعة',s:'soon',ic:'i-flag',t:5*86400+14*3600}];
var LBL={live:'مفعلة الآن',notyet:'غير مفعلة بعد',soon:'قادمة'},PRE={live:'تنتهي خلال',notyet:'تبدأ خلال',soon:'تبدأ خلال'};
function fmt(sec){sec=Math.max(0,sec|0);var d=(sec/86400)|0,hh=((sec%86400)/3600)|0,mm=((sec%3600)/60)|0,ss=sec%60;return (d?d+'ي ':'')+p2(hh)+':'+p2(mm)+(d?'':':'+p2(ss));}
var t0=Date.now();function el(){return STILL?0:((Date.now()-t0)/1000)|0;}
function evRowHTML(e,i){return '<svg viewBox="0 0 100 100"><use href="#'+e.ic+'"/></svg><span class="nm">'+e.n+'</span><span class="chip '+e.s+'">'+LBL[e.s]+'</span><span class="cd"><small>'+PRE[e.s]+'</small><bdi data-i="'+i+'">'+fmt(e.t-el())+'</bdi></span>';}
$('#evList').innerHTML=EV.map(function(e,i){return '<li class="ev '+e.s+'">'+evRowHTML(e,i)+'</li>';}).join('');
$('#evCount').textContent=EV.length;if(!EV.length)$('#ticker').style.display='none';
var tkI=0,tkRow=$('#tkRow');
function paintTicker(anim){var e=EV[tkI];tkRow.innerHTML=evRowHTML(e,tkI);tkRow.className='tk-row'+(anim?' in':'');}
paintTicker(false);
if(!STILL)setInterval(function(){if(!EV.length)return;tkRow.className='tk-row out';later(function(){tkI=(tkI+1)%EV.length;paintTicker(true);},300);},4200);

/* ================= wallet ================= */
var MAXT=10,W0={gold:12480,gems:356,tickets:7},W={},shown={},state='normal';
function resetWallet(){W={gold:W0.gold,gems:W0.gems,tickets:W0.tickets};shown={gold:W.gold,gems:W.gems,tickets:W.tickets};}
resetWallet();
var curEl={gold:$('#cGold'),gems:$('#cGems'),tickets:$('#cTk')};
var CUR={gold:{ic:'i-coin',name:'ذهب'},gems:{ic:'i-gem',name:'جوهرة'},tickets:{ic:'i-ticket',name:'تذكرة'},usd:{ic:null,name:''}};
function paintCur(k){var e=curEl[k];if(state!=='normal'){e.textContent='—';return;}
  if(k==='tickets')e.innerHTML='<bdi dir="ltr">'+shown.tickets+'/'+MAXT+'</bdi>';else e.textContent=nf(shown[k]);}
function paintWallet(){['gold','gems','tickets'].forEach(paintCur);$('#refill').style.visibility=W.tickets>=MAXT?'hidden':'';}
function bump(k){var c=curEl[k].closest('.cur');c.classList.remove('bump');void c.offsetWidth;c.classList.add('bump');later(function(){c.classList.remove('bump');},450);}
var countRaf={};
function countTo(k,to){W[k]=to;if(k==='tickets'){shown.tickets=to;paintWallet();bump(k);return;}
  var from=shown[k],ts=performance.now(),dur=Math.min(1100,450+Math.abs(to-from)/12);cancelAnimationFrame(countRaf[k]);bump(k);
  (function step(now){var p=Math.min(1,(now-ts)/dur),e=1-Math.pow(1-p,3);shown[k]=from+(to-from)*e;paintCur(k);if(p<1)countRaf[k]=requestAnimationFrame(step);else{shown[k]=to;paintCur(k);}})(ts);paintWallet();}
function scale(){return stage.getBoundingClientRect().width/SW;}
function center(e){var s=scale(),r=e.getBoundingClientRect(),o=stage.getBoundingClientRect();return {x:(r.left+r.width/2-o.left)/s,y:(r.top+r.height/2-o.top)/s};}
function fakeAt(c){return {getBoundingClientRect:function(){var s=scale(),o=stage.getBoundingClientRect();return {left:o.left+c.x*s-50,top:o.top+c.y*s-50,width:100,height:100};}};}
function fly(k,n,fromEl,done){
  var target=$('.cur[data-k="'+k+'"] .cur-ic'),a=fromEl?center(fromEl):{x:SW/2,y:540},b=center(target),count=Math.max(3,Math.min(8,Math.round(Math.log(n+1)*1.4))),landed=false;
  for(var i=0;i<count;i++)(function(i){var s=document.createElementNS('http://www.w3.org/2000/svg','svg');s.setAttribute('viewBox','0 0 100 100');s.setAttribute('class','fly');s.innerHTML='<use href="#'+CUR[k].ic+'"/>';stage.appendChild(s);
    var sx=a.x-42+(Math.random()*140-70),sy=a.y-42+(Math.random()*80-40),mx=(sx+b.x)/2+(Math.random()*240-120),my=Math.min(sy,b.y)-120-Math.random()*80;
    var an=s.animate([{transform:'translate('+sx+'px,'+sy+'px) scale(.3)',opacity:0},{transform:'translate('+sx+'px,'+(sy-30)+'px) scale(1.1)',opacity:1,offset:.22},{transform:'translate('+mx+'px,'+my+'px) scale(.95)',opacity:1,offset:.6},{transform:'translate('+(b.x-42)+'px,'+(b.y-42)+'px) scale(.55)',opacity:.9}],{duration:820,delay:i*70,easing:'cubic-bezier(.45,0,.6,1)',fill:'both'});
    an.onfinish=function(){s.remove();if(!landed){landed=true;done&&done();}};})(i);}
function give(k,n,fromEl){if(k==='tickets'){var to=Math.min(MAXT,W.tickets+n);W.tickets=to;fly(k,n,fromEl,function(){countTo('tickets',to);});return;}var to2=W[k]+n;W[k]=to2;fly(k,n,fromEl,function(){countTo(k,to2);});}
var toastT;function toast(m,ms){var t=$('#toast');$('#toastTxt').textContent=m;t.classList.remove('show');void t.offsetWidth;t.classList.add('show');clearTimeout(toastT);toastT=later(function(){t.classList.remove('show');},ms||1900);}

/* ================= press feedback ================= */
var PRESS='button,.mode,.ropt,.pack,.rc,.ev',pressed=null;
document.addEventListener('pointerdown',function(e){var b=e.target.closest(PRESS);if(!b||b.disabled||b.id==='heroHit')return;pressed=b;b.classList.add('is-press');
  var host=b.querySelector(':scope > .rb-ic')||b,size=Math.max(host.offsetWidth,host.offsetHeight)*1.25,r=document.createElement('i');r.className='rip';r.style.width=r.style.height=size+'px';host.appendChild(r);later(function(){r.remove();},520);},{passive:true});
function release(){if(pressed){pressed.classList.remove('is-press');pressed=null;}}
['pointerup','pointercancel','pointerleave'].forEach(function(ev){document.addEventListener(ev,release,{passive:true});});addEventListener('blur',release);

/* ================= modal manager ================= */
var stack=[],hooks={open:{},close:{}};
function modal(id){return document.getElementById('m-'+id);}
function openM(id,opt){var m=modal(id);if(!m)return;if(stack.indexOf(m)>=0)stack.splice(stack.indexOf(m),1);m.classList.remove('closing','stack2','stack3','stack4');m._closing=false;
  stack.push(m);if(stack.length>1)m.classList.add('stack'+Math.min(4,stack.length));if(hooks.open[id])hooks.open[id](opt||{});m.classList.add('open');body.classList.add('has-modal');}
function closeM(m,cb,quiet){if(typeof m==='string')m=modal(m);if(!m||!m.classList.contains('open')||m._closing){cb&&cb();return;}
  m._closing=true;var i=stack.indexOf(m);if(i>=0)stack.splice(i,1);if(!stack.length)body.classList.remove('has-modal');var id=m.id.slice(2);if(!quiet&&hooks.close[id])hooks.close[id]();
  m.classList.add('closing');later(function(){m.classList.remove('open','closing','stack2','stack3','stack4');m._closing=false;cb&&cb();},200);}
function closeAll(cb,quiet){var l=stack.slice();if(!l.length){cb&&cb();return;}l.forEach(function(m,i){closeM(m,i===l.length-1?cb:null,quiet);});}
$$('[data-modal]').forEach(function(m){m.addEventListener('click',function(e){var c=e.target.closest('[data-close]');if(c&&m.contains(c))closeM(m);});});
function needOnline(msg){if(state==='loading'){toast('لحظة… لسه بيحمّل');return false;}if(state==='offline'){toast(msg||'الميزة دي محتاجة اتصال بالإنترنت');return false;}return true;}

/* ================= character select ================= */
var cur=0,heroEl=$('#hero'),wrap=$('#charWrap'),imgF=$('#charFront'),imgA=$('#charAlt'),plate=$('#plate');
$('#plDots').innerHTML=CH.map(function(){return '<i></i>';}).join('');
function skHTML(s){return '<span class="pl-sk" title="'+s[0]+'"><span class="sk-ic '+s[2]+'"><svg viewBox="0 0 100 100"><use href="#'+s[1]+'"/></svg></span><em>'+s[0]+'</em></span>';}
function paintChar(){
  var c=CH[cur];
  stage.style.setProperty('--acc',c.acc);stage.style.setProperty('--acc2',c.acc2);
  imgF.src='assets/chars/'+c.id+'-front.png';imgF.alt=c.n;imgA.src='assets/chars/'+c.id+'-34.png';$('#charBack').src='assets/chars/'+c.id+'-back.png';
  $('#plName').textContent=c.n;$('#plArch').textContent=c.a;$('#plCode').textContent=c.c;
  $$('#plDots i').forEach(function(d,i){d.classList.toggle('on',i===cur);});
  $('#plSkills').innerHTML=skHTML(c.s[0])+skHTML(c.s[1])+'<span class="pl-sk tac" title="مهارة تكتيكية"><span class="sk-ic sk-t"><svg viewBox="0 0 100 100"><use href="#'+TAC.ic+'"/></svg></span><em>'+TAC.n+'</em><i class="tac-t">'+TAC.t+'</i></span>';
  plate.classList.toggle('locked',c.st==='locked');plate.classList.toggle('trial',c.st==='trial');
  $('#plLockTxt').textContent=c.st==='trial'?'تجربة · متبقي '+c.trial:'مقفلة';
  $('#changeTxt').innerHTML=c.st==='locked'?'فتح <span class="gem-p"><svg viewBox="0 0 100 100"><use href="#i-gem"/></svg><bdi dir="ltr">'+nf(c.gem)+'</bdi></span>':'التشكيلة';
  $('#mtMe').textContent=c.n+' · '+c.a;var fav=$('#pfFav');if(fav)fav.textContent=c.n;
    $$('#devChars button').forEach(function(b,i){b.classList.toggle('on',i===cur);});
}
function select(i,dir){
  i=((i%CH.length)+CH.length)%CH.length;if(i===cur&&dir!=null)return;
  if(STILL||dir==null){cur=i;paintChar();return;}
  wrap.style.setProperty('--dir',(dir>0?-80:80)+'px');hideBubble();
  wrap.classList.remove('swap-in');wrap.classList.add('swap-out');stopMove();seqI=0;loop();
  later(function(){cur=i;paintChar();wrap.classList.remove('swap-out');void wrap.offsetWidth;wrap.classList.add('swap-in');later(function(){wrap.classList.remove('swap-in');},480);},190);
}
$('#nextChar').addEventListener('click',function(){select(cur+1,1);});
$('#prevChar').addEventListener('click',function(){select(cur-1,-1);});
document.addEventListener('keydown',function(e){if(stack.length||matchOpen)return;if(e.key==='ArrowLeft')select(cur+1,1);if(e.key==='ArrowRight')select(cur-1,-1);});
/* swipe on hero + tap to taunt */
var sw0=null;$('#heroHit').addEventListener('pointerdown',function(e){sw0={x:e.clientX,t:Date.now()};});
$('#heroHit').addEventListener('pointerup',function(e){if(!sw0)return;var dx=(e.clientX-sw0.x)/scale();sw0=null;if(Math.abs(dx)>70){dx<0?select(cur+1,1):select(cur-1,-1);}else taunt();});
/* ================= HERO MOTION: per-character action loop (2D cutouts, transform/opacity only) ================= */
var bubble=$('#bubble'),vfx=$('#vfx'),vfxB=$('#vfxBack'),mvEl=$('#mv'),shadowEl=$('.hero-shadow'),bgEl=$('.bg'),mvName=$('#moveName');
var IMG={front:imgF,'34':imgA,back:$('#charBack')};
var SIG={rivo:'ضربة البرق',brak:'الزلزال',ziro:'الاندفاع',mako:'قنبلة الفخ',kiro:'التسديدة المقوّسة',fero:'سلسلة اللكمات',nira:'خطوة الظل',luma:'طلقة التجميد',vela:'الشقلبة الهوائية',zaya:'الانفجار'};
var running=null;
function TF(x,y,r,sx,sy,k,pv){x=x||0;y=y||0;r=r||0;sx=sx==null?1:sx;sy=sy==null?1:sy;k=k||0;pv=pv||0;
  return 'translate('+x+'px,'+y+'px)'+(pv?' translateY(-'+pv+'px) rotate('+r+'deg) translateY('+pv+'px)':' rotate('+r+'deg)')+' skewX('+k+'deg) scale('+sx+','+sy+')';}
function Move(d,name){this.d=d;this.anims=[];this.els=[];this.name=name;}
Move.prototype.A=function(el,frames,start,len,opt){opt=opt||{};var a=el.animate(frames,{duration:len,delay:start,fill:opt.fill||'both',easing:opt.easing||'linear'});a.id='mv';this.anims.push(a);return a;};
/* body track: [[offset,x,y,r,sx,sy,skew,pivot,opacity,easing]] */
Move.prototype.body=function(k){var f=k.map(function(p){var o={offset:p[0],transform:TF(p[1],p[2],p[3],p[4],p[5],p[6],p[7])};if(p[8]!=null)o.opacity=p[8];if(p[9])o.easing=p[9];return o;});
  if(f[0].offset!==0)f.unshift({offset:0,transform:'none'});if(f[f.length-1].offset!==1)f.push({offset:1,transform:f[f.length-1].transform});this.A(mvEl,f,0,this.d,{fill:'none'});};
/* pose track: [[offset,'front'|'34'|'back']] instant swaps */
Move.prototype.pose=function(list){var self=this;['front','34','back'].forEach(function(k){var f=[];list.forEach(function(p,i){var v=p[1]===k?1:0;if(i&&f.length)f.push({offset:p[0],opacity:f[f.length-1].opacity});f.push({offset:p[0],opacity:v});});
  if(f[0].offset!==0)f.unshift({offset:0,opacity:k==='front'?1:0});f.push({offset:1,opacity:f[f.length-1].opacity});self.A(IMG[k],f,0,self.d,{fill:'none'});});};
Move.prototype.shadow=function(k){this.A(shadowEl,k.map(function(p){return {offset:p[0],transform:'scale('+p[1]+')',opacity:p[2]};}),0,this.d,{fill:'none'});};
/* fx: cls, inner html, x (from centre), y, frames, start ms, length ms, back layer? */
Move.prototype.fx=function(cls,html,x,y,frames,start,len,opt){opt=opt||{};var e=document.createElement(opt.tag||'div');e.className='fx '+cls;if(opt.tag==='img')e.src=html;else if(html)e.innerHTML=html;
  e.style.left='calc(50% + '+x+'px)';e.style.top=y+'px';(opt.back?vfxB:vfx).appendChild(e);this.els.push(e);this.A(e,frames,start,len,{easing:opt.easing||'ease-out',fill:'forwards'});return e;};
function svg(id){return '<svg viewBox="0 0 100 100"><use href="#'+id+'"/></svg>';}
function O(t,op,ex){var o={transform:t,opacity:op};if(ex)o.easing=ex;return o;}
/* reusable fx */
Move.prototype.dust=function(x,y,t,dir,n){n=n||3;for(var i=0;i<n;i++){var dx=(dir||(i%2?1:-1))*(40+i*45),s=.6+i*.2;this.fx('fx-dust','',x,y-10,[O('translate(0,0) scale(.3)',.95),O('translate('+dx+'px,-'+(30+i*14)+'px) scale('+(1.3+s)+')',0)],t+i*40,600);}};
Move.prototype.ring=function(x,y,t,s){this.fx('fx-ring','',x,y,[O('scale(.15)',1),O('scale('+(s||2.4)+')',0)],t,620);};
Move.prototype.flash=function(x,y,t,s){this.fx('fx-flash','',x,y,[O('scale(.2)',0),O('scale('+(s||.8)+')',1),O('scale('+((s||.8)*1.4)+')',0)],t,420);};
Move.prototype.stars=function(x,y,t,n,r){for(var i=0;i<n;i++){var a=i/n*6.283+.3,R=(r||160)*(.7+((i*37)%10)/20);this.fx('fx-star','',x,y,[O('translate(0,0) scale(.2) rotate(0)',1),O('translate('+(Math.cos(a)*R|0)+'px,'+(Math.sin(a)*R|0)+'px) scale(1.2) rotate(90deg)',1),O('translate('+(Math.cos(a)*R*1.3|0)+'px,'+(Math.sin(a)*R*1.3|0)+'px) scale(.3) rotate(180deg)',0)],t+i*25,700);}};
Move.prototype.smoke=function(x,y,t,n){for(var i=0;i<(n||4);i++){var dx=((i*53)%120)-60,dy=-((i*31)%80);this.fx('fx-smoke','',x+dx,y+dy,[O('scale(.2)',.95),O('translate(0,-40px) scale(1.5)',0)],t+i*35,650);}};
Move.prototype.word=function(txt,x,y,t){this.fx('fx-word','',x,y,[O('translate(-50%,0) scale(.2) rotate(-12deg)',0,'cubic-bezier(.2,1.8,.4,1)'),O('translate(-50%,0) scale(1.1) rotate(-6deg)',1),O('translate(-50%,-20px) scale(1) rotate(-6deg)',1),O('translate(-50%,-50px) scale(.9) rotate(-6deg)',0)],t,900).textContent=txt;};
Move.prototype.lines=function(x,y,t,rot,flip){this.fx('fx-lines','',x,y,[O('rotate('+(rot||0)+'deg) translateX(0) scaleX('+(flip?-1:1)+')',0),O('rotate('+(rot||0)+'deg) translateX('+(flip?-60:60)+'px) scaleX('+(flip?-1:1)+')',.9),O('rotate('+(rot||0)+'deg) translateX('+(flip?-140:140)+'px) scaleX('+(flip?-1:1)+')',0)],t,380);};
Move.prototype.ghost=function(pose,x,t,flip){this.fx('fx-ghost',IMG[pose].src,x,258,[O('scaleX('+(flip?-1:1)+')',.55),O('scaleX('+(flip?-1:1)+')',0)],t,380,{tag:'img',back:true});};
Move.prototype.ball=function(points,start,len,back){/* points: [[offset,x,y,scale,opacity]] relative to idle ball spot */
  this.fx('fx-ball',svg('i-ball'),150+0,838,points.map(function(p){return {offset:p[0],transform:'translate('+(p[1]-150)+'px,'+(p[2]-838)+'px) scale('+p[3]+') rotate('+(p[0]*1440)+'deg)',opacity:p[4]==null?1:p[4]};}),start,len,{easing:'linear',back:back});};
Move.prototype.say=function(t,len,txt,face){var c=CH[cur];$('#bubbleTxt').textContent=txt||c.say;$('#bubbleFace').src=face||('assets/chars/'+c.id+(c.id==='rivo'?'-face-laugh':'-face')+'.png');
  this.A(bubble,[O('scale(.3) rotate(-8deg)',0,'cubic-bezier(.2,1.7,.4,1)'),{offset:.15,transform:'scale(1) rotate(-4deg)',opacity:1},{offset:.85,transform:'scale(1) rotate(-4deg)',opacity:1},O('scale(.8) rotate(-4deg)',0)],t,len);};
Move.prototype.shake=function(t,amp){var a=amp||10;this.A(bgEl,[O('translate(0,0)',1),O('translate('+a+'px,'+(-a)+'px)',1),O('translate('+(-a)+'px,'+(a*.6)+'px)',1),O('translate('+(a*.5)+'px,'+(a*.4)+'px)',1),O('translate(0,0)',1)],t,320,{fill:'none'});};
Move.prototype.title=function(t,len){mvName.textContent=SIG[CH[cur].id];this.A(mvName,[O('translateX(-50%) translateY(14px) scale(.7)',0,'cubic-bezier(.2,1.6,.4,1)'),{offset:.15,transform:'translateX(-50%) scale(1)',opacity:1},{offset:.85,transform:'translateX(-50%) scale(1)',opacity:1},O('translateX(-50%) translateY(-8px)',0)],t,len);};
Move.prototype.usesBall=function(){this.ballBusy=true;};

var MOVES={
 kick:function(){var m=new Move(1700);m.usesBall();
  m.body([[.18,10,6,-5,1.03,.96],[.3,-14,-10,6,.97,1.04,-4,0,null,'ease-out'],[.42,-8,0,3],[.7,0,0,0]]);
  m.pose([[0,'front'],[.12,'34'],[.62,'front']]);
  m.ball([[0,150,838,1],[.42,46,850,1],[.5,40,846,1.05],[.78,-150,600,3.2],[1,-260,520,5.4,0]],0,1000);
  m.flash(40,830,480,.5);m.dust(40,880,500,0,3);m.lines(-120,640,520,-35,true);return m;},
 celebrate:function(){var m=new Move(2100);
  m.body([[.1,0,0,0,1.06,.9],[.25,0,-150,0,.96,1.06,0,0,null,'ease-out'],[.3,0,-168,0,.96,1.04],[.38,0,-170,0,-.96,1.04],[.46,0,-150,0,1,1.02,0,0,null,'ease-in'],[.6,0,0,0,1.1,.88],[.68,0,0,0,1,1],[.78,0,-24,0,1,1.02],[.84,0,0,0,1,1]]);
  m.pose([[0,'front'],[.22,'34'],[.3,'back'],[.38,'34'],[.46,'front'],[.7,'34'],[.95,'front']]);
  m.shadow([[0,1,1],[.3,.5,.45],[.46,.6,.5],[.6,1.15,1],[1,1,1]]);
  m.stars(0,420,600,6,200);m.dust(0,880,1260,0,4);m.say(1350,1300);return m;},
 sig:{
  rivo:function(){var m=new Move(2200);m.usesBall();m.title(0,2000);
   m.ball([[0,150,838,1],[.3,70,420,1],[.42,20,470,1],[.46,10,470,1.1],[.68,-200,560,3.6],[.8,-300,580,5.6,0],[1,-300,580,5.6,0]],0,1400);
   m.body([[.12,0,0,0,1.06,.9],[.25,0,-130,-6,.96,1.06,0,280,null,'ease-out'],[.38,0,-150,-16,1,1,0,280],[.42,-10,-140,10,1.02,.98,-6,280],[.55,0,0,0,1.1,.88,0,0,null,'ease-in'],[.65,0,0,0]]);
   m.pose([[0,'front'],[.2,'34'],[.6,'front']]);m.shadow([[0,1,1],[.3,.55,.5],[.45,.6,.5],[.55,1.15,1]]);
   m.flash(10,470,620,.7);m.fx('fx-ico',svg('i-bolt'),-60,500,[O('scale(.3) rotate(-20deg)',0),O('translate(-80px,20px) scale(1.4) rotate(-10deg)',1),O('translate(-200px,60px) scale(2) rotate(0)',0)],660,420);
   m.lines(-80,520,640,-20,true);m.dust(0,880,1200,0,3);m.say(1400,800,'جاهز!','assets/chars/rivo-face-smirk.png');return m;},
  ziro:function(){var m=new Move(2000);m.title(0,1800);
   m.body([[.1,0,0,0,1.04,.96,12],[.22,-340,0,0,1.12,.92,18,0,null,'ease-in'],[.3,-372,0,0,1,1,-8],[.42,-350,0,0,1,1,0],[.5,-350,0,0,-1,1,0],[.6,-10,0,0,-1.12,.92,-18,0,null,'ease-in'],[.68,12,0,0,-1,1,6],[.76,0,0,0,-1,1,0],[.8,0,0,0,1,1,0]]);
   m.pose([[0,'front'],[.08,'34'],[.44,'front'],[.5,'34'],[.8,'front']]);
   m.shadow([[0,1,1],[.22,1.1,.6],[.3,1,1],[.6,1.1,.6],[.7,1,1]]);
   [[-80,200],[-180,280],[-280,360]].forEach(function(g){m.ghost('34',g[0],g[1]);});[[-280,1040],[-170,1110],[-60,1180]].forEach(function(g){m.ghost('34',g[0],g[1],true);});
   m.lines(-170,620,200);m.lines(-170,620,1020,0,true);m.dust(-370,880,560,1,3);m.dust(10,880,1300,-1,2);m.say(1450,600);return m;},
  brak:function(){var m=new Move(2100);m.title(0,1900);
   m.body([[.15,0,0,0,1.1,.86],[.35,0,-190,0,.94,1.08,0,0,null,'ease-out'],[.45,0,-200,0,.96,1.05,0,0,null,'ease-in'],[.53,0,10,0,1.18,.8],[.62,0,0,0,1.08,.92],[.75,0,0,0,1,1]]);
   m.pose([[0,'front'],[.15,'34'],[.53,'front']]);m.shadow([[0,1,1],[.35,.55,.4],[.45,.5,.4],[.53,1.35,1],[.7,1,1]]);
   var t=1110;m.ring(0,884,t,2.6);m.ring(0,884,t+120,3.4);m.shake(t,14);m.dust(-80,884,t,-1,4);m.dust(80,884,t,1,4);m.flash(0,860,t,.9);m.word('هاا!',0,300,t);
   for(var i=0;i<6;i++){var a=-2.6+i*.42;m.fx('fx-dot','',0,870,[O('translate(0,0) scale(1)',1),O('translate('+(Math.cos(a)*260|0)+'px,'+(Math.sin(a)*200|0)+'px) scale(.4)',0)],t,500);}return m;},
  vela:function(){var m=new Move(2000);m.title(0,1800);
   m.body([[.12,0,0,0,1.08,.88],[.25,0,-200,0,.96,1.08,0,300,null,'ease-out'],[.5,-40,-260,-360,1,1,0,300],[.62,0,0,-360,1.1,.88,0,300,null,'ease-in'],[.72,0,0,-360,1,1,0,300],[1,0,0,-360,1,1,0,300]]);
   m.pose([[0,'front'],[.2,'34'],[.6,'front']]);m.shadow([[0,1,1],[.4,.45,.4],[.62,1.15,1],[.7,1,1]]);
   m.stars(-20,330,420,8,220);m.stars(0,600,700,5,160);m.dust(0,880,1240,0,3);m.say(1400,600);return m;},
  nira:function(){var m=new Move(2000);m.title(0,1800);
   m.body([[.15,0,0,0,.96,1.04,0,0,1],[.2,0,-20,0,.6,1.2,0,0,0],[.22,-320,0,0,.6,1.2,0,0,0],[.3,-320,0,0,1,1,0,0,1,'cubic-bezier(.2,1.6,.4,1)'],[.55,-320,0,0,1,1,0,0,1],[.6,-320,-20,0,.6,1.2,0,0,0],[.62,0,0,0,.6,1.2,0,0,0],[.7,0,0,0,1,1,0,0,1,'cubic-bezier(.2,1.6,.4,1)'],[1,0,0,0,1,1,0,0,1]]);
   m.pose([[0,'front'],[.25,'34'],[.62,'front']]);m.shadow([[0,1,1],[.2,.2,0],[.3,1,1],[.6,.2,0],[.7,1,1]]);
   m.ghost('front',0,360);m.smoke(0,600,340,5);m.smoke(-320,600,420,5);m.smoke(-320,600,1160,4);m.smoke(0,600,1220,4);m.stars(-320,520,460,5,150);m.say(1450,550);return m;},
  luma:function(){var m=new Move(2100);m.title(0,1900);
   m.body([[.1,0,-12,0,.98,1.03],[.45,0,-12,0,1,1.03],[.5,4,-12],[.55,-4,-12],[.6,3,-12],[.65,0,0],[.8,0,0]]);
   m.pose([[0,'front'],[.12,'34'],[.7,'front']]);
   m.fx('fx-ice','',0,884,[O('scale(.15)',0),{offset:.2,transform:'scale(1)',opacity:1},{offset:.8,transform:'scale(1.1)',opacity:.9},O('scale(1.2)',0)],400,1500,{back:true});
   m.fx('fx-frost','',0,560,[O('scale(.4)',0),{offset:.3,transform:'scale(1)',opacity:1},O('scale(1.1)',0)],420,900);
   for(var i=0;i<9;i++){var a=i/9*6.283;m.fx('fx-ico',svg('i-snow'),0,520,[O('translate(0,0) scale(.2) rotate(0)',0),{offset:.25,transform:'translate('+(Math.cos(a)*170|0)+'px,'+(Math.sin(a)*170|0)+'px) scale(.6) rotate(90deg)',opacity:1},O('translate('+(Math.cos(a)*330|0)+'px,'+(Math.sin(a)*300|0)+'px) scale(.4) rotate(240deg)',0)],440+i*30,1000);}
   m.stars(0,480,500,6,240);m.say(1450,600);return m;},
  mako:function(){var m=new Move(2200);m.title(0,2000);
   m.body([[.12,12,0,6,.97,1.02],[.25,-12,0,-8,1.04,.97,-4],[.35,0,0,0],[.6,0,0,0],[.65,0,-50,0,.97,1.04,0,0,null,'ease-out'],[.72,0,0,0,1.05,.95],[.8,0,-28,0],[.86,0,0,0]]);
   m.pose([[0,'front'],[.1,'34'],[.35,'front'],[.6,'34'],[.92,'front']]);
   m.fx('fx-ico',svg('i-bomb'),60,470,[O('translate(0,0) rotate(0) scale(.9)',1),{offset:.5,transform:'translate(-230px,-150px) rotate(300deg) scale(.9)',opacity:1,easing:'ease-in'},O('translate(-460px,380px) rotate(600deg) scale(.8)',1)],550,560,{easing:'ease-out'});
   var t=1110;m.fx('fx-ico',svg('i-boom'),-400,820,[O('scale(.2) rotate(0)',1,'cubic-bezier(.2,1.6,.4,1)'),{offset:.4,transform:'scale(2) rotate(20deg)',opacity:1},O('scale(2.4) rotate(30deg)',0)],t,600);
   m.smoke(-400,800,t+60,5);m.dust(-400,880,t,0,4);m.flash(-400,800,t,.6);m.shake(t,7);m.say(1500,650);return m;},
  fero:function(){var m=new Move(2000);m.title(0,1800);
   m.body([[.08,6,0,0,1,1,-4],[.12,-32,0,0,1.03,1,9],[.18,0,0,0],[.23,-36,0,0,1.03,1,10],[.3,0,0,0],[.38,-40,0,0,1.04,1,11],[.45,0,0,0,1.06,.92],[.58,-20,-90,-10,.96,1.08,0,0,null,'ease-out'],[.7,0,0,0,1.08,.92],[.8,0,0,0]]);
   m.pose([[0,'front'],[.1,'34'],[.18,'front'],[.23,'34'],[.3,'front'],[.38,'34'],[.45,'front'],[.55,'34'],[.72,'front']]);
   [[-180,520,240],[-190,470,460],[-180,540,760]].forEach(function(p){m.fx('fx-ico',svg('i-boom'),p[0],p[1],[O('scale(.3) rotate(0)',1),O('scale(1) rotate(25deg)',1),O('scale(1.2) rotate(35deg)',0)],p[2],300);m.lines(p[0]+60,p[1],p[2],0,true);});
   m.fx('fx-ico',svg('i-boom'),-150,320,[O('scale(.3)',1,'cubic-bezier(.2,1.6,.4,1)'),O('scale(1.8) rotate(20deg)',1),O('scale(2.2) rotate(30deg)',0)],1160,420);m.word('بام!',-230,300,1160);m.shake(1160,6);m.dust(0,880,1400,0,2);return m;},
  kiro:function(){var m=new Move(2300);m.usesBall();m.title(0,2100);
   m.body([[.15,8,4,-4,1.02,.97],[.25,-10,-6,5,.98,1.03,-6,0,null,'ease-out'],[.4,0,0,0]]);
   m.pose([[0,'front'],[.1,'34'],[.45,'front']]);
   var P=[[.27,40,850],[.36,-150,700],[.45,-330,560],[.55,-440,420],[.65,-440,300],[.75,-330,210],[.85,-180,170]];
   m.ball([[0,150,838,1],[.25,46,850,1]].concat(P.map(function(p,i){return [p[0],p[1],p[2],1-i*.07];})).concat([[1,-80,170,.5,0]]),0,2300);
   for(var i=1;i<P.length;i++){var a=P[i-1],b=P[i];for(var j=0;j<2;j++){var f=j/2,x=a[1]+(b[1]-a[1])*f,y=a[2]+(b[2]-a[2])*f;m.fx('fx-dot','',x|0,y|0,[O('scale(1)',1),O('scale(.2)',0)],(a[0]+(b[0]-a[0])*f)*2300,800);}}
   m.flash(40,840,600,.5);m.dust(40,880,600,0,2);m.say(1500,650);return m;},
  zaya:function(){var m=new Move(2000);m.title(0,1800);
   m.body([[.15,0,0,0,1.1,.86],[.3,0,-100,6,.92,1.1,0,0,null,'ease-out'],[.45,0,-115,-6,1,1],[.6,0,0,0,1.12,.88,0,0,null,'ease-in'],[.7,0,0,0,1,1]]);
   m.pose([[0,'front'],[.3,'back'],[.4,'34'],[.6,'front']]);m.shadow([[0,1,1],[.4,.5,.4],[.6,1.15,1],[.7,1,1]]);
   var t=330;m.fx('fx-ico',svg('i-boom'),0,560,[O('scale(.1) rotate(0)',1,'cubic-bezier(.2,1.5,.4,1)'),{offset:.35,transform:'scale(4) rotate(18deg)',opacity:1},O('scale(4.8) rotate(28deg)',0)],t,800,{back:true});
   m.flash(0,560,t,1.2);m.shake(t,10);m.stars(0,520,t,10,330);m.smoke(0,860,t,5);m.word('بوم!',230,330,t+80);m.dust(0,880,1200,0,3);m.say(1350,650);return m;}
 }
};
function stopMove(){if(!running)return;running.anims.forEach(function(a){try{a.cancel();}catch(e){}});running.els.forEach(function(e){e.remove();});heroEl.classList.remove('busy');running=null;}
function play(kind,freezeT){
  stopMove();var c=CH[cur],m=kind==='sig'?MOVES.sig[c.id]():MOVES[kind]();running=m;if(m.ballBusy)heroEl.classList.add('busy');
  if(freezeT!=null){m.anims.forEach(function(a){a.pause();a.currentTime=freezeT*m.d;});return m;}
  var me=m;later(function(){if(running===me)stopMove();},m.d+40);return m;}
function hideBubble(){stopMove();}
function taunt(){play('sig');}
var SEQ=['sig','kick','celebrate'],seqI=0,loopT;
function loop(){clearTimeout(loopT);loopT=later(function(){if(!document.hidden&&!stack.length&&!matchOpen&&!running&&!wrap.classList.contains('swap-in')){play(SEQ[seqI%SEQ.length]);seqI++;}loop();},running?(running.d+1800):2400);}
if(!STILL)loop();

/* roster popup */
function renderRoster(){
  $('#roster').innerHTML=CH.map(function(c,i){var tag=c.st==='locked'?'<span class="rc-tag">💎 <bdi dir="ltr">'+nf(c.gem)+'</bdi></span>':c.st==='trial'?'<span class="rc-tag">تجربة</span>':'';
    return '<button class="rc '+c.st+(i===cur?' sel':'')+'" data-i="'+i+'" style="--c:'+c.acc2+'">'+tag+'<img src="assets/chars/'+c.id+'-front.png" alt=""><b class="gt">'+c.n+'</b><small>'+c.a+'</small></button>';}).join('');
}
hooks.open.roster=renderRoster;
$('#roster').addEventListener('click',function(e){var b=e.target.closest('.rc');if(!b)return;var i=+b.dataset.i;closeM('roster',function(){select(i,i>cur?1:-1);});});
$('#devChars').innerHTML=CH.map(function(c,i){return '<button data-i="'+i+'">'+c.n+'</button>';}).join('');
$('#devChars').addEventListener('click',function(e){var b=e.target.closest('button');if(b)select(+b.dataset.i,+b.dataset.i>cur?1:-1);});

/* ================= PLAY ================= */
var DIFF={easy:'سهل',mid:'متوسط',hard:'صعب'},diff='mid';
$('#playBtn').addEventListener('click',function(){if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}openM('play');});
$('#trainBtn').addEventListener('click',function(){if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}openM('play',{focus:'bot'});});
$$('.diff button').forEach(function(b){b.addEventListener('click',function(e){e.stopPropagation();diff=b.dataset.diff;$$('.diff button').forEach(function(x){x.classList.toggle('on',x===b);});});});
$$('.mode').forEach(function(m){function go(e){if(e.target.closest('.diff'))return;startMode(m.dataset.mode);}m.addEventListener('click',go);m.addEventListener('keydown',function(e){if(e.key==='Enter')go(e);});});
function startMode(mode){
  var c=CH[cur];
  if((mode==='online'||mode==='room')&&state==='offline'){toast('اللعب عبر الإنترنت يتطلب اتصالًا. جرّب ضد البوت');return;}
  if(mode==='online'&&c.st==='locked'){toast(c.n+' مقفلة… جرّبها في التدريب أو ضد البوت',2400);return;}
  if(mode==='online'&&W.tickets<1){toast('مفيش تذاكر كفاية');openM('shop',{cat:'tickets'});return;}
  if(mode==='train'){closeAll(function(){toast('التدريب · '+c.n+' (خارج نطاق النموذج)',2200);});return;}
  closeAll(function(){startMatch(mode);});
}
var match=$('#match'),matchOpen=false,mT=[],mClock,mMode,ticketHeld=false;
function startMatch(mode,staticOnly){
  mMode=mode;matchOpen=true;mT.forEach(clearTimeout);mT=[];clearInterval(mClock);ticketHeld=false;hideBubble();
  var opp=CH[(cur+3+((Math.random()*5)|0))%CH.length];$('#mtOpImg').src='assets/chars/'+opp.id+'-face.png';
  match.className='match open searching'+(mode==='bot'?' isbot':'');
  $('#mtTitle').textContent={bot:'جاري تجهيز المباراة…',online:'جاري البحث عن خصم…',room:'بانتظار صديقك…'}[mode];
  $('#mtSub').textContent={bot:'ضد البوت · '+DIFF[diff],online:'أونلاين 1 ضد 1 · رتبة ذهبي',room:'مع صديق · الرمز GF-7K2Q'}[mode];
  $('#mtOpName').textContent='؟؟؟';$('#mtOpSub').textContent=mode==='room'?'شارك الرمز مع صديقك':'بانتظار خصم';
  var ts=Date.now();$('#mtTimer').textContent='00:00';if(staticOnly)return;
  mClock=setInterval(function(){var s=((Date.now()-ts)/1000)|0;$('#mtTimer').textContent=p2((s/60)|0)+':'+p2(s%60);},250);
  mT.push(later(function(){
    match.classList.remove('searching');match.classList.add('found');
    if(mode==='online'){countTo('tickets',W.tickets-1);ticketHeld=true;} /* spec §10.2: ticket consumed only once a valid opponent is found */
    $('#mtTitle').textContent={bot:'البوت جاهز!',online:'تم العثور على خصم!',room:'صديقك انضم!'}[mode];
    $('#mtOpName').textContent=mode==='bot'?'بوت · '+DIFF[diff]:mode==='room'?'سارة':'صقر_الملعب';
    $('#mtOpSub').textContent=mode==='bot'?'ذكاء اصطناعي':opp.n+' · '+opp.a;clearInterval(mClock);
    [3,2,1].forEach(function(n,i){mT.push(later(function(){$('#mtSub').textContent='تبدأ المباراة خلال '+n;},700+i*650));});
    mT.push(later(function(){endMatch();toast('هنا تبدأ المباراة (خارج نطاق النموذج)',2400);},700+3*650));
  },{bot:1400,online:3200,room:3800}[mode]));
}
function endMatch(){matchOpen=false;mT.forEach(clearTimeout);clearInterval(mClock);match.classList.add('closing');later(function(){match.className='match';},250);}
function cancelMatch(){endMatch();toast(ticketHeld?'تم الإلغاء':'تم الإلغاء · التذكرة ما اتخصمتش');}
$('#mtCancel').addEventListener('click',cancelMatch);
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){if(matchOpen){cancelMatch();return;}if(stack.length)closeM(stack[stack.length-1]);}
  if((e.key==='d'||e.key==='D'||e.key==='`')&&!e.ctrlKey&&!e.metaKey&&!e.altKey)$('#dev').classList.toggle('open');});

/* ================= NOTIFICATIONS ================= */
var notifShown=false;
function setNotif(v){var t=$('.tgl[data-set="notif"]');t.classList.toggle('on',v);t.setAttribute('aria-checked',v);}
hooks.open.notif=function(){notifShown=true;};
$('#notifOn').addEventListener('click',function(){setNotif(true);closeM('notif');toast('تم تفعيل الإشعارات');});

/* ================= RENTAL (trial ended) ================= */
var rentSel=$('.ropt.on');
$$('.ropt').forEach(function(o){o.addEventListener('click',function(){rentSel=o;$$('.ropt').forEach(function(x){x.classList.toggle('on',x===o);});$('#rentPrice').textContent=nf(+o.dataset.price);});});
hooks.open.rent=function(){var c=CH[cur];$('#rentImg').src='assets/chars/'+c.id+'-front.png';$('#rentName').innerHTML=c.n+' <em>·</em> '+c.a;
  $('#rentText').textContent='عجبك '+c.n+'؟ استأجره واحتفظ بـ'+c.s[0][0]+' و'+c.s[1][0]+'.';
  $('#rentSkills').innerHTML=c.s.map(function(s){return '<span><i class="sk-ic '+s[2]+'"><svg viewBox="0 0 100 100"><use href="#'+s[1]+'"/></svg></i>'+s[0]+'</span>';}).join('');};
$('#rentGo').addEventListener('click',function(){var d=+rentSel.dataset.days,c=CH[cur];
  tryBuy({name:'استئجار '+c.n+' · '+(d===1?'يوم واحد':d+' أيام'),icon:'i-shirt',cost:{cur:'gold',n:+rentSel.dataset.price},after:function(){toast(c.n+' بقى معاك '+(d===1?'يوم كامل':d+' أيام')+'!',2200);}});});

/* ================= SHOP ================= */
var PACKS={
  gold:[{amt:1000,k:'gold',cost:{cur:'gems',n:20}},{amt:6000,k:'gold',cost:{cur:'gems',n:100},flag:'+20%'},{amt:15000,k:'gold',cost:{cur:'gems',n:400},flag:'الأفضل قيمة'}],
  gems:[{amt:80,k:'gems',cost:{cur:'usd',n:'0.99'}},{amt:500,k:'gems',cost:{cur:'usd',n:'4.99'},flag:'الأكثر شراءً'},{amt:1200,k:'gems',cost:{cur:'usd',n:'9.99'},flag:'+25%'}],
  tickets:[{amt:1,k:'tickets',cost:{cur:'gold',n:300}},{amt:3,k:'tickets',cost:{cur:'gold',n:800}},{amt:'fill',k:'tickets',cost:{cur:'gold',n:1800},flag:'ملء كامل'}]};
var shopCat='gold';
function priceHTML(c){return c.cur==='usd'?'<span><bdi dir="ltr">$'+c.n+'</bdi></span>':'<svg viewBox="0 0 100 100"><use href="#'+CUR[c.cur].ic+'"/></svg><span><bdi dir="ltr">'+nf(c.n)+'</bdi></span>';}
function renderShop(cat){shopCat=cat;$$('#shopTabs button').forEach(function(b){b.classList.toggle('on',b.dataset.cat===cat);});
  $('#packs').innerHTML=PACKS[cat].map(function(p,i){var ic=CUR[p.k].ic,n=Math.min(3,i+1),art='';for(var j=0;j<n;j++)art+='<svg viewBox="0 0 100 100"><use href="#'+ic+'"/></svg>';
    var amt=p.amt==='fill'?'<bdi dir="ltr">'+MAXT+'/'+MAXT+'</bdi>':'<bdi dir="ltr">'+nf(p.amt)+'</bdi>';
    var sub=p.k==='gold'?'ذهب':p.k==='gems'?'جوهرة':p.amt==='fill'?'املأ كل التذاكر':(p.amt===1?'تذكرة':'تذاكر');
    return '<div class="pack" data-i="'+i+'"><span class="halo"></span>'+(p.flag?'<i class="pack-flag">'+p.flag+'</i>':'')+'<div class="pack-art n'+n+'">'+art+'</div><b class="gt pack-amt">'+amt+'</b><small class="pack-sub">'+sub+'</small><button class="gbtn '+(p.cost.cur==='usd'?'g-gold':'g-green')+' shine">'+priceHTML(p.cost)+'</button></div>';}).join('');}
$('#shopTabs').addEventListener('click',function(e){var b=e.target.closest('button');if(b)renderShop(b.dataset.cat);});
$('#packs').addEventListener('click',function(e){var x=e.target.closest('.pack');if(!x)return;var p=PACKS[shopCat][+x.dataset.i],n=p.amt;
  if(p.k==='tickets'){if(W.tickets>=MAXT){toast('التذاكر مليانة ('+MAXT+'/'+MAXT+')');return;}if(n==='fill')n=MAXT-W.tickets;else if(W.tickets+n>MAXT){toast('الحد الأقصى '+MAXT+' تذاكر');return;}}
  tryBuy({name:nf(n)+' '+(p.k==='gold'?'ذهب':p.k==='gems'?'جوهرة':(n===1?'تذكرة':'تذاكر')),icon:CUR[p.k].ic,cost:p.cost,gain:{k:p.k,n:n}});});
hooks.open.shop=function(o){renderShop(o.cat||shopCat);};
$$('.plus').forEach(function(b){b.addEventListener('click',function(){if(!needOnline('المحفظة تتطلب اتصالًا'))return;openM('shop',{cat:b.dataset.buy});});});

/* ================= purchase confirm / not enough ================= */
var pending=null;
function tryBuy(item){if(!needOnline('المحفظة تتطلب اتصالًا'))return;var c=item.cost;if(c.cur!=='usd'&&W[c.cur]<c.n){openM('nogold',{item:item});return;}openM('confirm',{item:item});}
function amtHTML(c,n){return '<svg viewBox="0 0 100 100"><use href="#'+CUR[c].ic+'"/></svg><bdi dir="ltr">'+nf(n)+'</bdi>';}
hooks.open.confirm=function(o){var it=o.item;pending=it;$('#cfIcon').setAttribute('href','#'+it.icon);$('#cfName').textContent=it.name;var c=it.cost,rows=$$('.pop-confirm .cf-rows div');
  if(c.cur==='usd'){$('#cfPrice').innerHTML='<bdi dir="ltr">$'+c.n+'</bdi>';rows[1].style.display='none';rows[2].querySelector('span').textContent='الدفع';$('#cfAfter').innerHTML='تجريبي';$('#cfAfter').className='';}
  else{$('#cfPrice').innerHTML=amtHTML(c.cur,c.n);rows[1].style.display='';rows[2].querySelector('span').textContent='بعد الشراء';$('#cfHave').innerHTML=amtHTML(c.cur,W[c.cur]);$('#cfAfter').innerHTML=amtHTML(c.cur,W[c.cur]-c.n);$('#cfAfter').className='neg';}};
$('#cfGo').addEventListener('click',function(){var it=pending;if(!it)return;pending=null;var from=center($('.pop-confirm .cf-item'));
  closeAll(function(){if(it.cost.cur!=='usd')countTo(it.cost.cur,W[it.cost.cur]-it.cost.n);if(it.gain){give(it.gain.k,it.gain.n,fakeAt(from));toast('تم الشراء: '+it.name);}it.after&&it.after();});});
hooks.open.nogold=function(o){var it=o.item,c=it.cost,isGold=c.cur==='gold';pending=null;
  $('#ngTitle').textContent=isGold?'الذهب غير كافٍ':'الجواهر غير كافية';$$('.ngU').forEach(function(u){u.setAttribute('href','#'+CUR[c.cur].ic);});
  $('#ngNeed').textContent=nf(c.n-W[c.cur]);$('#ngUnit').textContent=isGold?'ذهب':'جوهرة';$('#ngPrice').innerHTML=amtHTML(c.cur,c.n);$('#ngHave').innerHTML=amtHTML(c.cur,W[c.cur]);$('#ngHave').className='neg';
  $('#ngGoIc').setAttribute('href','#i-gem');$('#ngGoTxt').textContent=isGold?'احصل على ذهب':'احصل على جواهر';$('#ngGo').dataset.cat=isGold?'gold':'gems';};
$('#ngGo').addEventListener('click',function(){var cat=this.dataset.cat||'gold';closeM('nogold',function(){var sh=modal('shop');if(sh.classList.contains('open'))renderShop(cat);else openM('shop',{cat:cat});});});
/* plate button: loadout (owned) / unlock (locked) */
$('#changeBtn').addEventListener('click',function(){var c=CH[cur];if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}
  if(c.st==='locked'){tryBuy({name:'فتح '+c.n+' · '+c.a,icon:'i-shirt',cost:{cur:'gems',n:c.gem},after:function(){c.st='owned';paintChar();toast(c.n+' انضم لفريقك!',2200);}});return;}
  toast('التشكيلة: مهارتين + مهارة تكتيكية · الشاشة الجاية',2200);});

/* ================= rewards: daily + wheel ================= */
var rewardPending=null;
function openReward(src,items,entry){rewardPending={items:items,entry:entry};$('#rwSrc').innerHTML=src;
  $('#rwItems').innerHTML=items.map(function(it){return '<div class="rw-it"><svg viewBox="0 0 100 100"><use href="#'+CUR[it.k].ic+'"/></svg><b class="gt"><bdi dir="ltr">+'+nf(it.n)+'</bdi></b><small>'+(it.k==='gold'?'ذهب':it.k==='gems'?'جواهر':'تذاكر')+'</small></div>';}).join('');openM('reward');}
function claimReward(){var r=rewardPending;if(!r)return;rewardPending=null;var tiles=$$('#rwItems .rw-it');
  r.items.forEach(function(it,i){var t=tiles[i],c=t?center(t):null;later(function(){give(it.k,it.n,c&&fakeAt(c));},i*120);});
  if(r.entry){var d=$('.rb[data-entry="'+r.entry+'"]');d.classList.add('seen','claimed');}}
hooks.close.reward=claimReward;$('#rwGo').addEventListener('click',function(){closeM('reward');});
$$('.rb').forEach(function(d){var ok=document.createElement('span');ok.className='ok';ok.innerHTML='<svg viewBox="0 0 100 100"><use href="#i-check"/></svg>';d.querySelector('.rb-ic').appendChild(ok);});
var dailyDone=false;
function entry(k){return $('.rb[data-entry="'+k+'"]');}
entry('daily').addEventListener('click',function(){if(!needOnline('المكافآت تتطلب اتصالًا'))return;if(dailyDone){toast('استلمت مكافأة النهارده. ارجع بكرة!');return;}
  dailyDone=true;openReward('المكافأة اليومية · اليوم <bdi dir="ltr">4</bdi> من <bdi dir="ltr">7</bdi>',[{k:'gold',n:500},{k:'gems',n:10},{k:'tickets',n:1}],'daily');});
entry('pass').addEventListener('click',function(){if(!needOnline())return;this.classList.add('seen');toast('بطاقة القتال · المستوى 12 · المسار المجاني والمميز · الشاشة الجاية',2400);});
entry('friends').addEventListener('click',function(){if(!needOnline())return;toast('الأصدقاء · 3 متصلين · الشاشة الجاية');});
entry('events').addEventListener('click',function(){if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}openM('events');});
entry('missions').addEventListener('click',function(){if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}openM('missions');});
$('#ticker').addEventListener('click',function(){openM('events');});
$('#evList').addEventListener('click',function(e){var li=e.target.closest('.ev');if(li)toast(li.querySelector('.nm').textContent+' · '+li.querySelector('.chip').textContent);});
/* wheel */
var PRIZES=[{k:'gold',n:500},{k:'gems',n:15},{k:'tickets',n:1},{k:'gold',n:1500},{k:'gems',n:50},{k:'gold',n:250},{k:'tickets',n:2},{k:'gold',n:3000}];
var SEG=['#ff4d3d','#ffd53d','#43a8ff','#77e33d','#b65cff','#ff9a2a','#2fd0c0','#ff6ab0'],SEGD=['#a8101a','#b88a00','#1858d6','#2c9e17','#6a1fb0','#b85400','#138a80','#b02a70'];
(function(){var R=262,h='<defs><radialGradient id="gWgl" cx=".5" cy=".5" r=".5"><stop offset=".55" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".22"/></radialGradient></defs>';
  h+='<circle r="296" fill="#4a2600"/><circle r="290" fill="url(#gGold)" stroke="#5a2a00" stroke-width="6"/>';
  for(var i=0;i<8;i++){var a0=(i*45-22.5-90)*Math.PI/180,a1=(i*45+22.5-90)*Math.PI/180;h+='<path d="M0 0 L'+(R*Math.cos(a0)).toFixed(1)+' '+(R*Math.sin(a0)).toFixed(1)+' A'+R+' '+R+' 0 0 1 '+(R*Math.cos(a1)).toFixed(1)+' '+(R*Math.sin(a1)).toFixed(1)+' Z" fill="'+SEG[i]+'" stroke="'+SEGD[i]+'" stroke-width="4"/>';}
  h+='<circle r="'+R+'" fill="url(#gWgl)"/>';
  for(i=0;i<8;i++){var p=PRIZES[i];h+='<g transform="rotate('+(i*45)+')"><use href="#'+CUR[p.k].ic+'" x="-44" y="-172" width="88" height="88"/><text y="-196" direction="ltr" unicode-bidi="embed" text-anchor="middle" font-family="Lalezar,Cairo,sans-serif" font-size="44" fill="#fff" stroke="#0a1238" stroke-width="10" paint-order="stroke" stroke-linejoin="round">'+nf(p.n)+'</text></g>';}
  for(i=0;i<16;i++){var a=i*22.5*Math.PI/180;h+='<circle cx="'+(276*Math.sin(a)).toFixed(1)+'" cy="'+(-276*Math.cos(a)).toFixed(1)+'" r="8" fill="'+(i%2?'#fff6c0':'#fff')+'" stroke="#8a4b00" stroke-width="2.5"/>';}
  $('#bigWheel').innerHTML=h;})();
var wheelRot=0,spun=false,spinning=false,wTimer,wheelEnd=0;
function wheelLabel(){var b=$('#spinBtn');if(spun){var s=Math.max(0,((wheelEnd-Date.now())/1000)|0);b.disabled=true;$('#spinTxt').innerHTML='اللفة الجاية <bdi dir="ltr">'+p2((s/3600)|0)+':'+p2(((s%3600)/60)|0)+':'+p2(s%60)+'</bdi>';}
  else{b.disabled=spinning;$('#spinTxt').textContent=spinning?'بتلف…':'لفة مجانية';}}
hooks.open.wheel=function(){wheelLabel();clearInterval(wTimer);if(!STILL)wTimer=setInterval(wheelLabel,1000);};hooks.close.wheel=function(){clearInterval(wTimer);};
entry('wheel').addEventListener('click',function(){if(!needOnline('المكافآت تتطلب اتصالًا'))return;openM('wheel');});
$('#spinBtn').addEventListener('click',function(){if(spun||spinning)return;spinning=true;wheelLabel();
  var idx=params.has('wheel')?(+params.get('wheel'))%8:(Math.random()*8)|0,c0=((wheelRot%360)+360)%360,target=wheelRot+360*6+((360-idx*45-c0)%360+360)%360+(Math.random()*24-12);
  var rot=$('#wheelRot'),ptr=$('.wheel-ptr');ptr.classList.add('tick');var an=rot.animate([{transform:'rotate('+wheelRot+'deg)'},{transform:'rotate('+target+'deg)'}],{duration:4200,easing:'cubic-bezier(.12,.62,.08,1)',fill:'forwards'});
  wheelRot=target;later(function(){ptr.classList.remove('tick');},3300);
  an.onfinish=function(){rot.style.transform='rotate('+target+'deg)';an.cancel();spinning=false;spun=true;wheelEnd=Date.now()+24*3600*1000-1000;wheelLabel();entry('wheel').classList.add('spent');
    var p=PRIZES[idx];later(function(){closeM('wheel',function(){openReward('عجلة الحظ · لفة مجانية',[p],null);});},450);};});

/* ================= profile / settings / inbox / leaderboard ================= */
$('#avatarBtn').addEventListener('click',function(){openM('profile');});
$('#pfFull').addEventListener('click',function(){toast('الملف الكامل · الشاشة الجاية');});
$('#rankBox').addEventListener('click',function(){if(!needOnline())return;toast('المتصدرين · ذهبي 62 · الشاشة الجاية');});
$('#settingsBtn').addEventListener('click',function(){openM('settings');});
$('#inboxBtn').addEventListener('click',function(){if(!needOnline())return;$('#inboxBadge').style.display='none';toast('البريد · رسالتين: تعويض صيانة + هدية الموسم');});
$$('.tgl').forEach(function(t){t.addEventListener('click',function(){var on=!t.classList.contains('on');if(t.dataset.set==='notif'){setNotif(on);toast(on?'تم تفعيل الإشعارات':'تم إيقاف الإشعارات');return;}
  t.classList.toggle('on',on);t.setAttribute('aria-checked',on);toast((t.dataset.set==='sound'?'المؤثرات الصوتية':'الموسيقى')+': '+(on?'تشغيل':'إيقاف'));});});
$('#langSeg').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.lang==='en'){b.classList.add('on');b.previousElementSibling.classList.remove('on');toast('English version: next deliverable');
  later(function(){b.classList.remove('on');b.previousElementSibling.classList.add('on');},900);}});

/* ================= missions ================= */
var MS0=[{n:'اكسب 3 مباريات',p:3,t:3,rw:{k:'gold',n:300},ic:'i-trophy',tile:'t-blue'},{n:'سجّل 10 أهداف',p:10,t:10,rw:{k:'tickets',n:1},ic:'i-ball',tile:'t-green'},
  {n:'العب بشخصيتين مختلفتين',p:2,t:2,rw:{k:'gold',n:200},ic:'i-shirt',tile:'t-purple'},{n:'استخدم مهارة تكتيكية 5 مرات',p:3,t:5,rw:{k:'gold',n:200},ic:'i-bomb',tile:'t-red'}],MS;
function resetMissions(){MS=MS0.map(function(m){return {n:m.n,p:m.p,t:m.t,rw:m.rw,ic:m.ic,tile:m.tile,done:false};});}resetMissions();
function msLeft(){return MS.filter(function(m){return m.p>=m.t&&!m.done;}).length;}
function paintBadge(){var b=$('#msBadge'),n=msLeft();b.textContent=n;b.style.display=n?'':'none';}
function renderMissions(){$('#msList').innerHTML=MS.map(function(m,i){var ready=m.p>=m.t&&!m.done,act=m.done?'<span class="ms-done"><svg viewBox="0 0 100 100"><use href="#i-check"/></svg>تم</span>':ready?'<button class="gbtn g-green sm shine" data-claim="'+i+'"><span>استلام</span></button>':'<span class="ms-wait">لسه شوية</span>';
  return '<li class="ms'+(ready?' ready':'')+'"><span class="set-ic '+m.tile+'"><svg viewBox="0 0 100 100"><use href="#'+m.ic+'"/></svg></span><div class="ms-body"><b>'+m.n+'</b><div class="ms-bar"><i style="width:'+(Math.min(1,m.p/m.t)*100)+'%"></i><span><bdi dir="ltr">'+m.p+'/'+m.t+'</bdi></span></div></div><span class="ms-rw"><svg viewBox="0 0 100 100"><use href="#'+CUR[m.rw.k].ic+'"/></svg><bdi dir="ltr">+'+nf(m.rw.n)+'</bdi></span>'+act+'</li>';}).join('');}
hooks.open.missions=renderMissions;
$('#msList').addEventListener('click',function(e){var b=e.target.closest('[data-claim]');if(!b)return;if(!needOnline('المكافآت تتطلب اتصالًا'))return;var m=MS[+b.dataset.claim];m.done=true;give(m.rw.k,m.rw.n,b);paintBadge();renderMissions();if(!msLeft())toast('استلمت كل المهام الجاهزة!');});

/* ================= dock ================= */
$$('.dk').forEach(function(d){d.addEventListener('click',function(){var t=d.dataset.tab;if(state==='loading'){toast('لحظة… لسه بيحمّل');return;}
  if(t==='chars')openM('roster');else if(t==='shop'){if(!needOnline('المتجر يتطلب اتصالًا'))return;openM('shop',{cat:'gold'});}
  else if(t==='loadout')toast('التشكيلة: '+CH[cur].n+' · مهارتين + '+TAC.n+' · الشاشة الجاية',2200);
  else if(t==='leader'){if(!needOnline())return;toast('المتصدرين · عالمي / منطقتك / أصدقاء · الشاشة الجاية',2200);}});});

/* ================= states ================= */
function setState(s){if(['normal','offline','loading'].indexOf(s)<0)s='normal';state=s;body.classList.remove('st-normal','st-offline','st-loading');body.classList.add('st-'+s);
  $$('[data-bind="name"]').forEach(function(e){e.textContent=s==='loading'?'لاعب':'علي';});
  $$('[data-bind="rank"]').forEach(function(e){e.innerHTML=s==='loading'?'الرتبة —':'<svg viewBox="0 0 100 100"><use href="#i-rank"/></svg>ذهبي · 62';});
  $$('#devStates button').forEach(function(b){b.classList.toggle('on',b.dataset.state===s);});paintWallet();}
var retrying=false;$('#retryBtn').addEventListener('click',function(){if(retrying)return;retrying=true;setState('loading');later(function(){retrying=false;setState('normal');toast('تم الاتصال بالخوادم');},1800);});

/* ================= live countdowns ================= */
var tk=4*60+32;
function tick(){var e=el(),t=Math.max(0,tk-e);$('#tkTimer').textContent=p2((t/60)|0)+':'+p2(t%60);
  if(spun){var w=Math.max(0,((wheelEnd-Date.now())/1000)|0);$('#wheelTimer').textContent=p2((w/3600)|0)+':'+p2(((w%3600)/60)|0)+':'+p2(w%60);}
  $$('bdi[data-i]').forEach(function(b){b.textContent=fmt(EV[+b.dataset.i].t-e);});}
if(!STILL)setInterval(tick,1000);

/* ================= dev ================= */
$('#devPill').addEventListener('click',function(){$('#dev').classList.toggle('open');});
$('#devStates').addEventListener('click',function(e){var b=e.target.closest('button');if(b)setState(b.dataset.state);});
function demo(name){
  if(name==='match'){closeAll(function(){startMatch('online',STILL);});return;}
  if(name==='taunt'||name==='kick'||name==='celebrate'){closeAll(function(){play(name==='taunt'?'sig':name);},true);return;}
  if(matchOpen)endMatch();
  closeAll(function(){
    if(name==='confirm')openM('confirm',{item:{name:'6,000 ذهب',icon:'i-coin',cost:{cur:'gems',n:100},gain:{k:'gold',n:6000}}});
    else if(name==='nogold')openM('nogold',{item:{name:'استئجار ريفو · 7 أيام',icon:'i-shirt',cost:{cur:'gold',n:14000}}});
    else if(name==='reward')openReward('المكافأة اليومية · اليوم <bdi dir="ltr">4</bdi> من <bdi dir="ltr">7</bdi>',[{k:'gold',n:500},{k:'gems',n:10},{k:'tickets',n:1}],null);
    else if(name==='shop')openM('shop',{cat:params.get('cat')||'gold'});
    else openM(name);
  },true);}
$('#devPops').addEventListener('click',function(e){var b=e.target.closest('button');if(b)demo(b.dataset.pop);});
$('#devReset').addEventListener('click',function(){resetWallet();resetMissions();paintBadge();dailyDone=false;spun=false;entry('wheel').classList.remove('spent');
  $$('.rb').forEach(function(d){d.classList.remove('seen','claimed');});paintWallet();toast('تمت إعادة الضبط');});

/* ================= boot ================= */
var ci=CH.findIndex(function(c){return c.id===params.get('char');});
select(ci>=0?ci:0);
setState(params.get('state')||'normal');
if(params.get('spent')==='1'){spun=true;wheelEnd=Date.now()+(5*3600+12*60)*1000;entry('wheel').classList.add('spent');tick();}
var pp=params.get('popup');if(pp)demo(pp);
if(!STILL&&!pp&&params.get('notif')!=='0')later(function(){if(state==='normal'&&!stack.length&&!matchOpen&&!notifShown)openM('notif');},2200);
/* still frames for PNG renders */
var POSE={juggle:430,bshadow:430,breathe:1300,shadow:1300,wheel:900,freeB:0,hop:400};
window.freezeAt=function(ms){document.getAnimations().forEach(function(a){if(a.id==='mv')return;var n=a.animationName,t=(n&&POSE[n]!=null)?POSE[n]:ms;a.pause();a.currentTime=t;});};
document.fonts.ready.then(function(){
  if(STILL){if(params.get('move'))play(params.get('move'),+(params.get('t')||.4));
    var imgs=$$('img').filter(function(i){return !i.complete;});
    Promise.all(imgs.map(function(i){return new Promise(function(r){i.onload=i.onerror=r;});})).then(function(){requestAnimationFrame(function(){freezeAt(+params.get('still')||900);body.dataset.ready='1';});});}
  else body.dataset.ready='1';});
window.GFI={setState:setState,open:demo,select:select,cur:function(){return cur;},chars:CH,toast:toast,wallet:function(){return W;},taunt:taunt,play:play};
})();
