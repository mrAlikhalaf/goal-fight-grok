(function(){
'use strict';
var W=2400,H=1080,stage=document.getElementById('stage');
var params=new URLSearchParams(location.search), STILL=params.has('still');

/* ---- fit 2400x1080 design to any screen (contain) ---- */
function fit(){var s=Math.min(innerWidth/W,innerHeight/H);stage.style.transform='scale('+s+')';}
addEventListener('resize',fit);fit();

/* ---- seeded RNG so the crowd is identical every load ---- */
var seed=20261003;function rnd(){seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;}

/* ---- stadium painted once on canvas (cheap at runtime) ---- */
function paintStadium(){
  var c=document.getElementById('stadium'),g=c.getContext('2d');
  // sky
  var sky=g.createLinearGradient(0,0,0,700);sky.addColorStop(0,'#030820');sky.addColorStop(.5,'#0a1a52');sky.addColorStop(1,'#14307a');
  g.fillStyle=sky;g.fillRect(0,0,W,H);
  var cx=1210, curve=function(x){var d=(x-cx)/1200;return d*d*90;};
  // stands tiers (bowl curve)
  var tiers=[[70,250,'#101c4e','#1a2a6a'],[262,452,'#13225c','#20357c'],[464,648,'#172a68','#26408c']];
  tiers.forEach(function(t){
    g.beginPath();g.moveTo(0,t[0]+curve(0));
    for(var x=0;x<=W;x+=40)g.lineTo(x,t[0]+curve(x));
    for(x=W;x>=0;x-=40)g.lineTo(x,t[1]+curve(x));
    g.closePath();var gr=g.createLinearGradient(0,t[0],0,t[1]);gr.addColorStop(0,t[2]);gr.addColorStop(1,t[3]);g.fillStyle=gr;g.fill();
    // railing
    g.beginPath();for(x=0;x<=W;x+=40){var y=t[1]+curve(x);x?g.lineTo(x,y):g.moveTo(x,y);}
    g.lineWidth=8;g.strokeStyle='#0a1238';g.stroke();g.lineWidth=3;g.strokeStyle='rgba(140,190,255,.55)';g.stroke();
  });
  // crowd heads (drawn on an offscreen layer, then softly blurred for depth of field)
  var off=document.createElement('canvas');off.width=W;off.height=H;var main=g;g=off.getContext('2d');
  var pal=['#f1f4ff','#2f7bff','#1b2a7a','#ffd23f','#d8e2f0','#3a58c8','#ff5a4a','#0e1748'];
  tiers.forEach(function(t,ti){
    for(var row=t[0]+16;row<t[1]-8;row+=15){
      for(var x=-10;x<W+10;x+=12+rnd()*4){
        var y=row+curve(x)+(rnd()*4-2), d=Math.abs(x-cx)/1300;
        var light=Math.max(.18,1-d*0.95)*(0.38+ti*0.14);
        g.globalAlpha=Math.min(1,light);
        g.fillStyle=pal[(rnd()*pal.length)|0];
        g.beginPath();g.ellipse(x,y,5.4,6,0,0,6.283);g.fill();
        g.fillStyle='rgba(5,10,40,.55)';g.fillRect(x-6,y+5,12,6);
      }
    }
  });
  g.globalAlpha=1;
  g.globalAlpha=1;
  g=main;g.save();g.filter='blur(1.6px)';g.drawImage(off,0,0);g.restore();
  var haze=g.createLinearGradient(0,60,0,700);haze.addColorStop(0,'rgba(6,12,44,.35)');haze.addColorStop(1,'rgba(30,60,140,.12)');g.fillStyle=haze;g.fillRect(0,60,W,640);
  // roof silhouette
  g.beginPath();g.moveTo(0,0);g.lineTo(W,0);for(var x=W;x>=0;x-=40)g.lineTo(x,66+curve(x)*.6);g.closePath();
  var rf=g.createLinearGradient(0,0,0,90);rf.addColorStop(0,'#02041a');rf.addColorStop(1,'#0a1440');g.fillStyle=rf;g.fill();
  g.beginPath();for(x=0;x<=W;x+=40){var yy=66+curve(x)*.6;x?g.lineTo(x,yy):g.moveTo(x,yy);}g.lineWidth=4;g.strokeStyle='rgba(120,170,255,.6)';g.stroke();
  // pitch with perspective mowing stripes
  var top=698,vpY=-900,vpX=cx;
  for(var k=-14;k<14;k++){
    var xb0=cx+k*170,xb1=xb0+170,f=(top-vpY)/(H-vpY);
    var xt0=vpX+(xb0-vpX)*f,xt1=vpX+(xb1-vpX)*f;
    g.beginPath();g.moveTo(xt0,top);g.lineTo(xt1,top);g.lineTo(xb1,H);g.lineTo(xb0,H);g.closePath();
    g.fillStyle=(k&1)?'#2f9a3a':'#37ad42';g.fill();
  }
  var shade=g.createLinearGradient(0,top,0,H);shade.addColorStop(0,'rgba(4,20,40,.55)');shade.addColorStop(.35,'rgba(4,20,40,.1)');shade.addColorStop(1,'rgba(2,10,20,.45)');
  g.fillStyle=shade;g.fillRect(0,top,W,H-top);
  var hl=g.createRadialGradient(cx,900,20,cx,900,700);hl.addColorStop(0,'rgba(200,255,200,.35)');hl.addColorStop(1,'rgba(200,255,200,0)');
  g.fillStyle=hl;g.fillRect(0,top,W,H-top);
  // pitch lines
  g.strokeStyle='rgba(255,255,255,.75)';g.lineWidth=5;
  g.beginPath();g.moveTo(0,714);g.lineTo(W,714);g.stroke();
  g.beginPath();g.moveTo(cx,714);g.lineTo(cx,H);g.stroke();
  g.beginPath();g.ellipse(cx,905,420,112,0,0,6.283);g.stroke();
  g.fillStyle='rgba(255,255,255,.85)';g.beginPath();g.ellipse(cx,905,14,5,0,0,6.283);g.fill();
  // penalty boxes far left/right
  g.beginPath();g.moveTo(0,760);g.lineTo(300,760);g.lineTo(150,H);g.stroke();
  g.beginPath();g.moveTo(W,760);g.lineTo(W-300,760);g.lineTo(W-150,H);g.stroke();
}
paintStadium();

/* ---- LED boards ---- */
var led=document.getElementById('ledTrack'),txt=['GOAL FIGHT','★ قتال 1 ضد 1 ★','GOAL FIGHT','الموسم 4','GOAL FIGHT','★ كأس الصحراء ★'],h='';
for(var r=0;r<6;r++)txt.forEach(function(t){h+='<span>'+t+'</span>';});led.innerHTML=h;

/* ---- camera flashes ---- */
var fl=document.getElementById('flashes'),fh='';
for(var i=0;i<18;i++){var x=(rnd()*2300+50)|0,y=(110+rnd()*500)|0;fh+='<i style="left:'+x+'px;top:'+y+'px;animation-delay:-'+(rnd()*4).toFixed(2)+'s;animation-duration:'+(3+rnd()*3).toFixed(2)+'s"></i>';}
fl.innerHTML=fh;

/* ---- stats (out of 10) ---- */
var stats=[['السرعة',8,'i-bolt'],['القفز',6,'i-star'],['مدى الضربة',7,'i-ball'],['الصلابة',9,'i-wall']],sh='';
stats.forEach(function(s){var segs='';for(var k=0;k<10;k++)segs+='<i'+(k<s[1]?' class="on"':'')+'></i>';
  sh+='<div class="stat"><div class="stat-top"><span><svg viewBox="0 0 100 100"><use href="#'+s[2]+'"/></svg>'+s[0]+'</span><b>'+s[1]+'<small>/10</small></b></div><div class="segs">'+segs+'</div></div>';});
document.getElementById('stats').innerHTML=sh;

/* ---- events (max 6). status: live | notyet | soon ---- */
var now=Date.now();
var EV=[
  {n:'كأس الصحراء',s:'live',ic:'i-trophy',t:1*86400+6*3600+12*60+40},
  {n:'ضربات الترجيح',s:'live',ic:'i-ball',t:3*3600+45*60+10},
  {n:'تحدي القبضة',s:'notyet',ic:'i-fist',t:1*3600+20*60+5},
  {n:'ليلة الحارس',s:'notyet',ic:'i-glove',t:9*3600+5*60},
  {n:'معركة الأساطير',s:'soon',ic:'i-star',t:1*86400+2*3600},
  {n:'بطولة الجمعة',s:'soon',ic:'i-flag',t:5*86400+14*3600}
];
var LBL={live:'مفعلة الآن',notyet:'غير مفعلة بعد',soon:'قادمة'},PRE={live:'تنتهي خلال',notyet:'تبدأ خلال',soon:'تبدأ خلال'};
function fmt(sec){sec=Math.max(0,sec|0);var d=(sec/86400)|0,hh=((sec%86400)/3600)|0,mm=((sec%3600)/60)|0,ss=sec%60;
  var p=function(v){return (v<10?'0':'')+v;};return (d?d+'ي ':'')+p(hh)+':'+p(mm)+(d?'':':'+p(ss));}
function fmtFull(sec){var d=(sec/86400)|0,r=sec%86400,p=function(v){return (v<10?'0':'')+v;};
  return (d?d+'ي ':'')+p((r/3600)|0)+':'+p(((r%3600)/60)|0)+':'+p(r%60);}
var list=document.getElementById('evList');
if(!EV.length){document.getElementById('events').style.display='none';}
list.innerHTML=EV.slice(0,6).map(function(e,i){
  return '<li class="ev '+e.s+'"><svg viewBox="0 0 100 100"><use href="#'+e.ic+'"/></svg><span class="nm">'+e.n+'</span>'+
    '<span class="chip '+e.s+'">'+LBL[e.s]+'</span><span class="cd"><small>'+PRE[e.s]+'</small><bdi data-i="'+i+'">'+fmt(e.t)+'</bdi></span></li>';}).join('');
/* events collapse/expand is wired in interact.js (animated) */

/* ---- live countdowns ---- */
var tk=4*60+32, wh=2*3600+14*60+9, start=Date.now();
function tick(){
  var el=((Date.now()-start)/1000)|0,p=function(v){return (v<10?'0':'')+v;};
  var t=Math.max(0,tk-el);document.getElementById('tkTimer').textContent=p((t/60)|0)+':'+p(t%60);
  var w=window.GF_wheelEnd?Math.max(0,((window.GF_wheelEnd-Date.now())/1000)|0):Math.max(0,wh-el);document.getElementById('wheelTimer').textContent=p((w/3600)|0)+':'+p(((w%3600)/60)|0)+':'+p(w%60);
  document.getElementById('featTimer').textContent=fmtFull(Math.max(0,EV[0].t-el));
  list.querySelectorAll('bdi[data-i]').forEach(function(b){var e=EV[+b.dataset.i];b.textContent=fmt(e.t-el);});
}
if(!STILL)setInterval(tick,1000);

/* ---- still frame for screenshots: freeze every animation at a chosen moment ---- */
var POSE={bounce:150,bshadow:150,roll:150,breathe:1300,shadow:1300,wheel:900};
window.freezeAt=function(ms){document.getAnimations().forEach(function(a){var n=a.animationName,t=(n&&POSE[n]!=null)?POSE[n]:ms;
  if(n==='roll'&&a.effect&&a.effect.target&&a.effect.target.closest('.play'))t=ms;a.pause();a.currentTime=t;});};
if(STILL){var ms=+params.get('still')||900;document.fonts.ready.then(function(){requestAnimationFrame(function(){freezeAt(ms);document.body.dataset.ready='1';});});}
else document.fonts.ready.then(function(){document.body.dataset.ready='1';});
window.GF={STILL:STILL,params:params,fmt:fmt,EV:EV};
})();
