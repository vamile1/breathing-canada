/* ═══════════════════════════════════════
   BREATHING CANADA — script.js
═══════════════════════════════════════ */
const P={bg:'#07111c',bg2:'#0b1522',text:'#eaf1fb',muted:'#a9b8cf',accent:'#7fc5ff',accent2:'#c4a8ff',accent3:'#ff9ecd',green:'#1d9e75'};

/* ─── DATA — modeled AQHI values (Canada 1-10+ scale) ─── */
/* Reflects documented patterns from ECCC NAPS data + Jain et al. Nature 2024 (2023 fire season) */
function generateData(){
  const days=[],stations=['Vancouver','Calgary','Edmonton','Toronto','Montréal','Ottawa','Halifax','Winnipeg','Québec City','Kelowna'];
  function rng(n){let x=Math.sin(n+1)*1e4;return x-Math.floor(x);}
  let i=0;
  for(let y=2022;y<=2024;y++)for(let m=0;m<12;m++){
    /* Baseline AQHI 1.5-3 — typical for Canadian cities outside wildfire seasons (Low Risk) */
    const base=2.0+Math.sin(m*.5)*0.7;
    /* 2023 wildfire season (May-Aug) — severe AQHI spikes 5-11+ */
    /* Source: 15M hectares burned, 29 mega-fires, Jain P et al. Nat Comm 2024 */
    const wf=(y===2023&&m>=4&&m<=7)?rng(i+99)*6+3:0;
    /* 2024 wildfire season (June-July) — second-worst on record, moderate spikes */
    const wf2024=(y===2024&&m>=5&&m<=6)?rng(i+150)*3+1:0;
    /* Temperature roughly matches Canadian seasonal pattern */
    const tb=-10+Math.sin((m-2)/11*Math.PI)*25;
    for(let d=0;d<28;d+=2){
      const s=rng(i++);
      const aqhiRaw=Math.max(1,Math.min(11.5,base+wf+wf2024+(s-.4)*1.2));
      const aqhi=Math.round(aqhiRaw);
      days.push({
        y,m,d,
        aqhi,
        temp:Math.round(tb+(rng(i)-.5)*8),
        hum:Math.round(55+Math.sin(m*.7)*22+(rng(i+1)-.5)*25),
        isWildfire:wf>2 || wf2024>1.5,
        station:stations[Math.floor(rng(i)*stations.length)],
        dateStr:new Date(y,m,d+1).toLocaleDateString('en-CA',{month:'short',day:'numeric',year:'numeric'})
      });
    }
  }
  return days;
}
const DATA=generateData();

/* Official AQHI risk categories: 1-3 Low, 4-6 Moderate, 7-10 High, 11+ Very High */
function aqhiColor(v){
  if(v<=3)return P.green;
  if(v<=6)return P.accent;
  if(v<=10)return P.accent2;
  return P.accent3;
}
function badgeInfo(v){
  if(v<=3)return{label:'Low Risk',bg:'#0d3328',fg:P.green,desc:'Ideal air quality for outdoor activities.'};
  if(v<=6)return{label:'Moderate Risk',bg:'#0e2a3d',fg:P.accent,desc:'At-risk groups should consider reducing strenuous outdoor activity.'};
  if(v<=10)return{label:'High Risk',bg:'#1e1540',fg:P.accent2,desc:'Reschedule strenuous outdoor activities. At-risk people should avoid outdoor exertion.'};
  return{label:'Very High Risk',bg:'#3d0e28',fg:P.accent3,desc:'Avoid all outdoor exertion. Everyone should stay indoors when possible.'};
}
const tip=document.getElementById('tip');
function showTip(html,e){tip.innerHTML=html;tip.style.opacity='1';tip.style.left=(e.clientX+16)+'px';tip.style.top=(e.clientY-10)+'px';}
function moveTip(e){tip.style.left=(e.clientX+16)+'px';tip.style.top=(e.clientY-10)+'px';}
function hideTip(){tip.style.opacity='0';}
function aqhiDisplay(v){return v>=11?'10+':String(v);}

/* ═══════ 1. HERO ═══════ */
(function initHero(){
  const canvas=document.getElementById('heroBg'),ctx=canvas.getContext('2d');
  let W,H;function resize(){W=canvas.width=canvas.offsetWidth;H=canvas.height=canvas.offsetHeight;}
  resize();window.addEventListener('resize',resize);
  const COLORS=[[127,197,255],[196,168,255],[255,158,205],[29,158,117]];
  const orbs=Array.from({length:22},(_,i)=>({x:Math.random(),y:Math.random(),vx:(Math.random()-.5)*.0004,vy:(Math.random()-.5)*.0004,r:100+Math.random()*200,col:COLORS[i%4],phase:Math.random()*Math.PI*2,breathe:.0008+Math.random()*.0006}));
  const drops=Array.from({length:55},(_,i)=>({x:Math.random(),y:Math.random(),r:1+Math.random()*3.5,phase:Math.random()*Math.PI*2,speed:.006+Math.random()*.005,drift:(Math.random()-.5)*.0003,col:COLORS[i%4]}));
  let tick=0;
  function frame(){
    tick++;ctx.clearRect(0,0,W,H);ctx.fillStyle='#07111c';ctx.fillRect(0,0,W,H);
    orbs.forEach(o=>{
      o.x+=o.vx+Math.sin(tick*.001+o.phase)*.0002;o.y+=o.vy+Math.cos(tick*.0012+o.phase)*.0002;
      if(o.x<-.4)o.x=1.4;if(o.x>1.4)o.x=-.4;if(o.y<-.4)o.y=1.4;if(o.y>1.4)o.y=-.4;
      const pulse=Math.max(0,.35+.65*Math.sin(tick*o.breathe+o.phase));const[r,g,b]=o.col;
      const rad=Math.max(1,o.r*(0.6+pulse*0.6));
      const grd=ctx.createRadialGradient(o.x*W,o.y*H,0,o.x*W,o.y*H,rad);
      grd.addColorStop(0,`rgba(${r},${g},${b},${.06+pulse*.1})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.beginPath();ctx.arc(o.x*W,o.y*H,rad,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
    });
    ctx.fillStyle='rgba(127,197,255,.032)';for(let x=44;x<W;x+=44)for(let y=44;y<H;y+=44){ctx.beginPath();ctx.arc(x,y,.8,0,Math.PI*2);ctx.fill();}
    drops.forEach(d=>{
      d.x+=d.drift+Math.sin(tick*.003+d.phase)*.0002;d.y+=Math.sin(tick*.002+d.phase)*.0002;
      if(d.x<-.02)d.x=1.02;if(d.x>1.02)d.x=-.02;
      const pulse=Math.max(0,.4+.6*Math.sin(tick*d.speed+d.phase));const[r,g,b]=d.col;
      const dRad=Math.max(1,d.r*(0.5+pulse*0.8));
      ctx.beginPath();ctx.arc(d.x*W,d.y*H,dRad,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${.3+pulse*.4})`;ctx.fill();
      const glRad=Math.max(1,d.r*3*pulse);
      const gl=ctx.createRadialGradient(d.x*W,d.y*H,0,d.x*W,d.y*H,glRad);
      gl.addColorStop(0,`rgba(${r},${g},${b},${pulse*.12})`);gl.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.beginPath();ctx.arc(d.x*W,d.y*H,glRad,0,Math.PI*2);ctx.fillStyle=gl;ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ═══════ 2. AQHI FEEL ═══════ */
(function initAqiFeel(){
  const section=document.getElementById('s-aqifeel'),canvas=document.getElementById('aqiFeelCanvas');
  const textEl=document.getElementById('aqiFeelText'),bannerEl=document.getElementById('aqiBannerReveal');
  if(!section||!canvas)return;
  const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  function onScroll(){
    const rect=section.getBoundingClientRect(),total=section.offsetHeight-window.innerHeight;
    const pct=Math.max(0,Math.min(1,-rect.top/total));
    ctx.clearRect(0,0,W,H);ctx.fillStyle='#07111c';ctx.fillRect(0,0,W,H);
    const gradPct=Math.min(1,pct/.45),gradientHeight=H*(.1+gradPct*.9);
    const grd=ctx.createLinearGradient(0,0,0,gradientHeight);
    const whiteR=220+gradPct*35,whiteG=210-gradPct*60,whiteB=200-gradPct*80;
    const redR=180+gradPct*50,redG=60+gradPct*20,redB=50+gradPct*20;
    grd.addColorStop(0,`rgba(${Math.round(whiteR)},${Math.round(whiteG)},${Math.round(whiteB)},${.15+gradPct*.45})`);
    grd.addColorStop(.4,`rgba(${Math.round(redR)},${Math.round(redG)},${Math.round(redB)},${.08+gradPct*.35})`);
    grd.addColorStop(.7,`rgba(120,40,35,${.05+gradPct*.2})`);
    grd.addColorStop(1,'rgba(7,17,28,0)');
    ctx.fillStyle=grd;ctx.fillRect(0,0,W,H);
    const titleFadeIn=Math.min(1,pct*4),titleFadeOut=pct>.3?Math.max(0,1-(pct-.3)/.15):1;
    textEl.style.opacity=titleFadeIn*titleFadeOut;
    textEl.style.transform=`translateY(${20*(1-titleFadeIn)}px)`;
    if(bannerEl){
      const bannerPct=Math.max(0,Math.min(1,(pct-.45)/.25));
      bannerEl.style.opacity=bannerPct;
      bannerEl.style.transform=`translateY(${40*(1-bannerPct)}px)`;
      if(bannerPct>0)bannerEl.classList.add('visible');else bannerEl.classList.remove('visible');
      const bannerFadeOut=pct>.8?Math.max(0,1-(pct-.8)/.2):1;
      bannerEl.style.opacity=bannerPct*bannerFadeOut;
    }
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

/* ═══════ 3. BANNER CHART — modeled ED visits (Ontario pattern, June 2023 spike per CMAJ) ═══════ */
(function initBanner(){
  const canvas=document.getElementById('bannerChart');if(!canvas)return;
  function rng(n){let x=Math.sin(n+77)*1e4;return x-Math.floor(x);}
  const labels=[],values=[];let i=0;
  for(let y=2022;y<=2024;y++)for(let m=0;m<12;m++){
    const base=110+Math.sin(m*.5)*30;
    /* June 2023 — sharp spike per CMAJ 197(17):E465 (early + late June episodes) */
    let wf=0;
    if(y===2023&&m===5)wf=rng(i+55)*280+260; /* June 2023: major spike */
    else if(y===2023&&m===6)wf=rng(i+58)*180+120; /* July 2023: tail */
    else if(y===2023&&m===4)wf=rng(i+57)*100+50; /* May 2023: early */
    else if(y===2024&&(m===5||m===6))wf=rng(i+62)*100+40; /* 2024 lighter season */
    labels.push(['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'][m]+' '+y);
    values.push(Math.round(Math.max(60,base+wf+(rng(i++)-.5)*40)));
  }
  new Chart(canvas,{type:'line',data:{labels,datasets:[{data:values,borderColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,ctx.chart.width,0);g.addColorStop(0,'rgba(255,255,255,.9)');g.addColorStop(.35,'rgba(255,200,150,.9)');g.addColorStop(.5,'rgba(255,80,60,.95)');g.addColorStop(.65,'rgba(255,200,150,.9)');g.addColorStop(1,'rgba(255,255,255,.9)');return g;},borderWidth:2,pointRadius:0,pointHoverRadius:5,pointHoverBackgroundColor:'#ff4444',fill:true,backgroundColor:ctx=>{const g=ctx.chart.ctx.createLinearGradient(0,0,ctx.chart.width,0);g.addColorStop(0,'rgba(255,255,255,.06)');g.addColorStop(.5,'rgba(255,60,40,.18)');g.addColorStop(1,'rgba(255,255,255,.06)');return g;},tension:.4}]},options:{responsive:true,maintainAspectRatio:false,animation:{duration:1800,easing:'easeInOutQuart'},plugins:{legend:{display:false},tooltip:{enabled:false,external(c){if(c.tooltip.opacity===0){hideTip();return;}const pt=c.tooltip.dataPoints[0];const r=canvas.getBoundingClientRect();showTip(`<strong>${pt.label}</strong><br>Modeled ED visits: <strong style="color:#ff5544">${pt.raw}</strong>`,{clientX:c.tooltip.caretX+r.left,clientY:c.tooltip.caretY+r.top});}}},scales:{x:{ticks:{color:'rgba(169,184,207,.35)',font:{size:9},maxRotation:0,callback(v,i){return i%4===0?this.getLabelForValue(v):''}},grid:{color:'rgba(255,255,255,.04)'},border:{color:'rgba(255,255,255,.08)'}},y:{ticks:{color:'rgba(169,184,207,.35)',font:{size:9}},grid:{color:'rgba(255,255,255,.04)'},border:{color:'rgba(255,255,255,.08)'}}}}});
})();

/* ═══════ 4. SCROLL STEPS ═══════ */
(function initScrollSteps(){
  const section=document.getElementById('s-explainer'),panels=document.querySelectorAll('.step-panel'),bar=document.getElementById('progressBar');
  if(!section||!panels.length)return;let current=-1;
  function show(n){if(n===current||n<0||n>=panels.length)return;panels.forEach((p,i)=>{p.classList.toggle('active',i===n);});bar.style.width=((n+1)/panels.length*100)+'%';current=n;}
  show(0);
  function onScroll(){const rect=section.getBoundingClientRect(),total=section.offsetHeight-window.innerHeight;if(total<=0)return;const pct=Math.max(0,Math.min(.999,-rect.top/total));show(Math.floor(pct*panels.length));}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

/* ═══════ 5. WILDFIRE ═══════ */
(function initWildfire(){
  const section=document.getElementById('s-wildfire'),canvas=document.getElementById('wildfireCanvas'),fill=document.getElementById('wfProgressFill'),lbl=document.getElementById('wfProgressLabel'),textWrap=document.getElementById('wfLabel');
  if(!canvas||!section)return;const ctx=canvas.getContext('2d');
  let W,H,progress=0,tick=0;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||window.innerHeight;draw(progress);}
  function leafPath(c,cx,cy,s,a){c.save();c.translate(cx,cy);c.rotate(a);c.beginPath();c.moveTo(0,-s);c.bezierCurveTo(s*.6,-s*.5,s*.7,s*.2,0,s);c.bezierCurveTo(-s*.7,s*.2,-s*.6,-s*.5,0,-s);c.restore();}
  function rng(n){let x=Math.sin(n+31)*1e4;return x-Math.floor(x);}
  const leaves=Array.from({length:42},(_,i)=>({cx:.1+rng(i*7)*.8,cy:.15+rng(i*7+1)*.72,size:22+rng(i*7+2)*28,angle:-Math.PI*.5+rng(i*7+3)*Math.PI*.6,sway:rng(i*7+4)*Math.PI*.08,swaySpeed:.003+rng(i*7+5)*.004,burnDelay:rng(i*7+6)*.6,burnDur:.25+rng(i*7+1)*.2,fallX:(rng(i*7+2)-.5)*.3,fallY:.15+rng(i*7+3)*.15,rot:rng(i*7+4)*Math.PI*2,ember:Array.from({length:6},(_,j)=>({dx:(rng(i*7+j)-.5)*.18,dy:-(rng(i*7+j+1)*.12+.03),r:1.5+rng(i*7+j+2)*2.5,fade:rng(i*7+j+3)}))}));
  function lerp(a,b,t){const ah=a.replace('#',''),bh=b.replace('#','');const ar=[parseInt(ah.slice(0,2),16),parseInt(ah.slice(2,4),16),parseInt(ah.slice(4,6),16)];const br=[parseInt(bh.slice(0,2),16),parseInt(bh.slice(2,4),16),parseInt(bh.slice(4,6),16)];return`rgb(${Math.round(ar[0]+(br[0]-ar[0])*t)},${Math.round(ar[1]+(br[1]-ar[1])*t)},${Math.round(ar[2]+(br[2]-ar[2])*t)})`;}
  function draw(p){tick++;ctx.clearRect(0,0,W,H);ctx.fillStyle=`rgba(7,17,28,${.15+p*.55})`;ctx.fillRect(0,0,W,H);if(p>.4){const hz=ctx.createLinearGradient(0,0,0,H*.5);hz.addColorStop(0,`rgba(40,25,15,${(p-.4)*.66})`);hz.addColorStop(1,'rgba(7,17,28,0)');ctx.fillStyle=hz;ctx.fillRect(0,0,W,H*.5);}
    leaves.forEach(lf=>{const lp=Math.max(0,Math.min(1,(p-lf.burnDelay)/lf.burnDur));const sw=Math.sin(tick*lf.swaySpeed)*lf.sway*(1-lp*.8);const cx=lf.cx*W+lf.fallX*W*lp*lp,cy=lf.cy*H+lf.fallY*H*lp*lp,sz=lf.size*(1-.35*lp),an=lf.angle+sw+lf.rot*lp*.3;
      let col;if(lp<.3)col=lerp('#2d6a3f','#8a9e2a',lp/.3);else if(lp<.6)col=lerp('#8a9e2a','#c45e10',(lp-.3)/.3);else if(lp<.85)col=lerp('#c45e10','#3a1a08',(lp-.6)/.25);else col=lerp('#3a1a08','#1a1a18',(lp-.85)/.15);
      leafPath(ctx,cx,cy,sz,an);ctx.fillStyle=col;ctx.fill();
      if(lp<.7){ctx.save();ctx.translate(cx,cy);ctx.rotate(an);ctx.beginPath();ctx.moveTo(0,-sz);ctx.lineTo(0,sz);ctx.strokeStyle=lp>.3?'rgba(100,40,10,.4)':'rgba(0,80,30,.25)';ctx.lineWidth=.8;ctx.stroke();ctx.restore();}
      if(lp>.15&&lp<.9){leafPath(ctx,cx,cy,sz,an);const fgR=Math.max(1,sz*1.2);const fg=ctx.createRadialGradient(cx,cy-Math.max(0,sz*.3),0,cx,cy,fgR);fg.addColorStop(0,`rgba(255,160,30,${Math.min(.8,(lp-.15)/.5*.9)})`);fg.addColorStop(1,'rgba(255,40,0,0)');ctx.fillStyle=fg;ctx.fill();}
      if(lp>.25&&lp<.95){const ei=Math.min(1,(lp-.25)/.5);lf.ember.forEach(em=>{const ex=cx+em.dx*W*ei*ei,ey=cy+em.dy*H*ei,er=em.r*(1-ei*.6);if(er<.5)return;ctx.beginPath();ctx.arc(ex,ey,er,0,Math.PI*2);ctx.fillStyle=`rgba(255,${Math.round(120+80*(1-ei))},20,${(1-ei*.7)*ei*1.5})`;ctx.fill();});}
    });
    if(p>.1){const sg=ctx.createRadialGradient(W*.72,H*.18,0,W*.72,H*.18,W*.35);sg.addColorStop(0,`rgba(255,140,30,${p*.2})`);sg.addColorStop(1,'rgba(7,17,28,0)');ctx.fillStyle=sg;ctx.fillRect(0,0,W,H);}
  }
  resize();window.addEventListener('resize',resize);
  function onScroll(){const rect=section.getBoundingClientRect(),total=section.offsetHeight-window.innerHeight;progress=Math.max(0,Math.min(1,-rect.top/total));fill.style.width=(progress*100)+'%';lbl.textContent=progress<.01?'Scroll to burn':progress<.3?'Fire spreading…':progress<.6?'The smoke thickens…':progress<.9?'Everything burns…':'The air is ash.';draw(progress);const ta=progress<.15?progress/.15:progress>.7?(1-(progress-.7)/.3):1;if(textWrap)textWrap.style.opacity=ta;}
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

/* ═══════ REVEAL ═══════ */
const ioReveal=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('visible');
  if(e.target.id==='s-threshold')setTimeout(()=>e.target.querySelectorAll('.thresh-bar').forEach(b=>b.style.width=b.dataset.pct+'%'),100);
  if(e.target.id==='s-cityimpact')setTimeout(()=>e.target.querySelectorAll('.city-bar').forEach(b=>b.style.width=b.dataset.pct+'%'),100);
}});},{threshold:.15});
document.querySelectorAll('.reveal-fade,.reveal-section').forEach(el=>ioReveal.observe(el));

/* ═══════ 6. SLIDER ═══════ */
const grid=document.getElementById('daysGrid'),dots=[],sliderBg=document.getElementById('sliderBgLayer');
DATA.forEach(day=>{const el=document.createElement('div');el.className='day-dot';el.style.background=aqhiColor(day.aqhi);el.style.opacity='.72';el.addEventListener('mouseenter',e=>showTip(`<strong>${day.dateStr}</strong><br>AQHI <strong style="color:${aqhiColor(day.aqhi)}">${aqhiDisplay(day.aqhi)}</strong><br>Temp ${day.temp}°C · Hum ${day.hum}%<br>${day.station}${day.isWildfire?'<br><em style="color:'+P.accent3+'">wildfire smoke</em>':''}`,e));el.addEventListener('mousemove',moveTip);el.addEventListener('mouseleave',hideTip);grid.appendChild(el);dots.push({el,aqhi:day.aqhi});});
const slider=document.getElementById('aqiSlider'),aqiNum=document.getElementById('aqiNum'),aqiBadge=document.getElementById('aqiBadge'),aqiDesc=document.getElementById('aqiDesc');

(function initLeafBg(){
  const canvas=document.getElementById('leafBgCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||800;}
  resize();window.addEventListener('resize',resize);
  function rng(n){let x=Math.sin(n+51)*1e4;return x-Math.floor(x);}
  const bgLeaves=Array.from({length:30},(_,i)=>({x:rng(i*5),y:rng(i*5+1),size:20+rng(i*5+2)*60,angle:rng(i*5+3)*Math.PI*2,opacity:.04+rng(i*5+4)*.08}));
  window._leafBgDraw=function(t){
    ctx.clearRect(0,0,W,H);
    bgLeaves.forEach(lf=>{
      ctx.save();ctx.translate(lf.x*W,lf.y*H);ctx.rotate(lf.angle);
      ctx.beginPath();ctx.moveTo(0,-lf.size);ctx.bezierCurveTo(lf.size*.6,-lf.size*.5,lf.size*.7,lf.size*.2,0,lf.size);ctx.bezierCurveTo(-lf.size*.7,lf.size*.2,-lf.size*.6,-lf.size*.5,0,-lf.size);
      const hue=Math.round(120-t*200);const sat=Math.round(50+t*20);const light=Math.round(45+t*15);
      ctx.strokeStyle=`hsla(${hue<0?hue+360:hue},${sat}%,${light}%,${lf.opacity+t*.06})`;ctx.lineWidth=1.2;ctx.stroke();
      ctx.beginPath();ctx.moveTo(0,-lf.size*.8);ctx.lineTo(0,lf.size*.8);ctx.strokeStyle=`hsla(${hue<0?hue+360:hue},${sat}%,${light}%,${lf.opacity*.5})`;ctx.lineWidth=.5;ctx.stroke();
      ctx.restore();
    });
  };
  window._leafBgDraw(0.3);
})();

function updateSlider(){
  const v=+slider.value,info=badgeInfo(v),col=aqhiColor(v);
  aqiNum.textContent=aqhiDisplay(v);aqiNum.style.color=col;
  aqiBadge.textContent=info.label;aqiBadge.style.background=info.bg;aqiBadge.style.color=info.fg;
  aqiDesc.textContent=info.desc;
  dots.forEach(({el,aqhi})=>{const dist=Math.abs(aqhi-v);el.style.opacity=dist<1?'1':dist<2?'.46':'.09';el.style.transform=dist<1?'scale(1.25)':'scale(1)';});
  const t=Math.max(0,Math.min(1,(v-1)/10));
  if(sliderBg){const r=Math.round(29+(255-29)*t),g=Math.round(158*(1-t)*(1-t)),b=Math.round(117+(205-117)*t);sliderBg.style.background=`radial-gradient(ellipse at 50% 60%,rgba(${r},${g},${b},.12) 0%,transparent 60%)`;}
  if(window._leafBgDraw)window._leafBgDraw(t);
}
slider.addEventListener('input',updateSlider);updateSlider();

/* ═══════ 7. WIND ═══════ */
(function initWind(){
  const canvas=document.getElementById('windCanvas');if(!canvas)return;const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||400;}resize();window.addEventListener('resize',resize);
  const particles=Array.from({length:120},()=>({x:Math.random(),y:Math.random(),vx:.001+Math.random()*.003,vy:(Math.random()-.5)*.0004,r:.5+Math.random()*2,a:.15+Math.random()*.4,col:Math.random()>.7?[255,158,205]:[169,184,207]}));
  let tick=0;
  function frame(){tick++;ctx.clearRect(0,0,W,H);particles.forEach(p=>{p.x+=p.vx;p.y+=p.vy+Math.sin(tick*.008+p.x*6)*.0003;if(p.x>1.05){p.x=-0.05;p.y=Math.random();}if(p.y<0)p.y=1;if(p.y>1)p.y=0;const[r,g,b]=p.col;const al=p.a*(.5+.5*Math.sin(tick*.02+p.x*10));ctx.beginPath();ctx.arc(p.x*W,p.y*H,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${al})`;ctx.fill();ctx.beginPath();ctx.moveTo(p.x*W,p.y*H);ctx.lineTo((p.x-p.vx*12)*W,(p.y-p.vy*12)*H);ctx.strokeStyle=`rgba(${r},${g},${b},${al*.4})`;ctx.lineWidth=p.r*.5;ctx.stroke();});requestAnimationFrame(frame);}
  frame();
})();

/* ═══════ 8. THRESHOLD BARS — AQHI risk categories ═══════ */
(function initThreshBars(){
  const wrap=document.getElementById('threshBars');if(!wrap)return;
  const thresholds=[2,3,4,6,7,10,11];const labels=['≥ 2','≥ 3','≥ 4 (Mod.)','≥ 6','≥ 7 (High)','≥ 10','≥ 10+ (V. High)'];
  thresholds.forEach((t,idx)=>{
    const count=DATA.filter(d=>d.aqhi>=t).length;const pct=Math.round(count/DATA.length*100);
    const row=document.createElement('div');row.className='thresh-row';
    const col=t<=3?'rgba(29,158,117,.85)':t<=6?'rgba(127,197,255,.85)':t<=10?'rgba(196,168,255,.85)':'rgba(255,158,205,.85)';
    row.innerHTML=`<div class="thresh-label">${labels[idx]}</div><div class="thresh-bar-wrap"><div class="thresh-bar" data-pct="${pct}" style="background:linear-gradient(to right,${col} 0%,${col} 100%);box-shadow:0 0 18px ${col.replace(',.85',',.3')},inset 0 1px 0 rgba(255,255,255,.15);"></div></div><div class="thresh-count">${count}</div>`;
    row.addEventListener('mouseenter',e=>showTip(`AQHI ≥ ${t}<br><strong>${count} days</strong> (${pct}% of monitoring days)`,e));
    row.addEventListener('mousemove',moveTip);row.addEventListener('mouseleave',hideTip);
    wrap.appendChild(row);
  });
})();

/* ═══════ 9. CITY IMPACT ═══════ */
(function initCityBars(){
  const wrap=document.getElementById('cityBars');if(!wrap)return;
  const cityData={};
  DATA.forEach(d=>{if(!cityData[d.station])cityData[d.station]={sum:0,count:0,wf:false};cityData[d.station].sum+=d.aqhi;cityData[d.station].count++;if(d.isWildfire)cityData[d.station].wf=true;});
  const sorted=Object.entries(cityData).map(([name,v])=>({name,avg:Math.round(v.sum/v.count*10)/10,wf:v.wf})).sort((a,b)=>b.avg-a.avg);
  const maxAqhi=Math.max(...sorted.map(c=>c.avg));
  sorted.forEach(city=>{
    const pct=Math.round(city.avg/maxAqhi*100);
    const col=city.wf?'linear-gradient(to right,rgba(200,100,160,.7),rgba(255,140,200,.85),rgba(255,200,230,.6))':'linear-gradient(to right,rgba(60,130,220,.8),rgba(120,210,255,.9),rgba(200,240,255,.7))';
    const glow=city.wf?'box-shadow:0 0 18px rgba(255,140,200,.25),inset 0 1px 0 rgba(255,255,255,.15)':'box-shadow:0 0 18px rgba(100,190,255,.25),inset 0 1px 0 rgba(255,255,255,.15)';
    const row=document.createElement('div');row.className='city-bar-row';
    row.innerHTML=`<div class="city-bar-label">${city.name}</div><div class="city-bar-track"><div class="city-bar" data-pct="${pct}" style="background:${col};${glow}"></div></div><div class="city-bar-val">${city.avg}</div>`;
    row.addEventListener('mouseenter',e=>showTip(`<strong>${city.name}</strong><br>Avg AQHI: <strong style="color:${aqhiColor(city.avg)}">${city.avg}</strong>${city.wf?'<br><em style="color:#ff9ecd">Wildfire-affected</em>':''}`,e));
    row.addEventListener('mousemove',moveTip);row.addEventListener('mouseleave',hideTip);
    wrap.appendChild(row);
  });
})();

/* ═══════ 10. HEAT TRAP ═══════ */
(function initHeatTrap(){
  const canvas=document.getElementById('heatTrapCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  let mouseX=W/2,mouseY=H/2;
  canvas.addEventListener('mousemove',e=>{const r=canvas.getBoundingClientRect();mouseX=e.clientX-r.left;mouseY=e.clientY-r.top;});
  canvas.addEventListener('mouseleave',()=>{mouseX=W/2;mouseY=H/2;});
  function rng(n){let x=Math.sin(n+19)*1e4;return x-Math.floor(x);}
  const particles=Array.from({length:80},(_,i)=>({x:rng(i*3)*W||Math.random()*800,y:rng(i*3+1)*H||Math.random()*600,vx:(rng(i*3+2)-.5)*1.5,vy:(rng(i*3+1)-.5)*1.5,r:2+rng(i*3+2)*4,col:rng(i)>.5?[255,158,205]:[196,168,255],phase:rng(i)*Math.PI*2}));
  let tick=0;
  function frame(){
    tick++;ctx.clearRect(0,0,W,H);
    const bg=ctx.createLinearGradient(0,0,W,H);bg.addColorStop(0,'rgba(10,30,60,.95)');bg.addColorStop(.5,`rgba(180,100,40,${.15+.1*Math.sin(tick*.005)})`);bg.addColorStop(1,'rgba(60,15,40,.9)');ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const mgr=ctx.createRadialGradient(mouseX,mouseY,0,mouseX,mouseY,160);mgr.addColorStop(0,'rgba(255,180,80,.12)');mgr.addColorStop(1,'rgba(255,180,80,0)');ctx.fillStyle=mgr;ctx.fillRect(0,0,W,H);
    particles.forEach(p=>{
      const dx=mouseX-p.x,dy=mouseY-p.y,dist=Math.sqrt(dx*dx+dy*dy)||1;
      if(dist<180){p.vx+=dx/dist*.15;p.vy+=dy/dist*.15;}
      p.vx+=Math.sin(tick*.01+p.phase)*.08;p.vy+=Math.cos(tick*.012+p.phase)*.08;
      if(dist<60){p.vx-=dx/dist*.6;p.vy-=dy/dist*.6;}
      p.vx*=.97;p.vy*=.97;p.x+=p.vx;p.y+=p.vy;
      if(p.x<-20)p.x=W+20;if(p.x>W+20)p.x=-20;if(p.y<-20)p.y=H+20;if(p.y>H+20)p.y=-20;
      const[r,g,b]=p.col;const al=.4+.3*Math.sin(tick*.015+p.phase);
      const grd=ctx.createRadialGradient(p.x,p.y,0,p.x,p.y,Math.max(1,p.r*5));grd.addColorStop(0,`rgba(${r},${g},${b},${al*.5})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);ctx.beginPath();ctx.arc(p.x,p.y,Math.max(1,p.r*5),0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${al})`;ctx.fill();
    });
    requestAnimationFrame(frame);
  }
  frame();
})();

/* ═══════ 11. SCATTER — Temperature × AQHI ═══════ */
(function initScatter(){
  const wrap=document.getElementById('scatterChart');
  if(!wrap||typeof d3==='undefined')return;
  const W=880,H=430,margin={top:20,right:30,bottom:45,left:50};
  const iW=W-margin.left-margin.right,iH=H-margin.top-margin.bottom;
  const svg=d3.select(wrap).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('preserveAspectRatio','xMidYMid meet');
  const g=svg.append('g').attr('transform',`translate(${margin.left},${margin.top})`);
  const xScale=d3.scaleLinear().domain([-35,25]).range([0,iW]);
  const yScale=d3.scaleLinear().domain([0,12]).range([iH,0]);
  g.append('g').attr('transform',`translate(0,${iH})`).call(d3.axisBottom(xScale).ticks(8).tickFormat(d=>d+'°C'))
    .selectAll('text').attr('fill','rgba(169,184,207,.5)').attr('font-size','9');
  g.append('g').call(d3.axisLeft(yScale).ticks(6))
    .selectAll('text').attr('fill','rgba(169,184,207,.5)').attr('font-size','9');
  g.selectAll('.domain,.tick line').attr('stroke','rgba(127,197,255,.1)');
  g.append('text').attr('x',iW/2).attr('y',iH+38).attr('text-anchor','middle').attr('fill','rgba(169,184,207,.5)').attr('font-size','10').text('Temperature (°C)');
  g.append('text').attr('x',-iH/2).attr('y',-38).attr('text-anchor','middle').attr('fill','rgba(169,184,207,.5)').attr('font-size','10').attr('transform','rotate(-90)').text('AQHI');
  g.append('g').selectAll('line').data(yScale.ticks(6)).join('line').attr('x1',0).attr('x2',iW).attr('y1',d=>yScale(d)).attr('y2',d=>yScale(d)).attr('stroke','rgba(127,197,255,.05)');
  g.append('g').selectAll('line').data(xScale.ticks(8)).join('line').attr('y1',0).attr('y2',iH).attr('x1',d=>xScale(d)).attr('x2',d=>xScale(d)).attr('stroke','rgba(127,197,255,.05)');
  const dots=g.selectAll('.scatter-dot').data(DATA).join('circle').attr('class','scatter-dot')
    .attr('cx',d=>xScale(d.temp)).attr('cy',d=>yScale(d.aqhi))
    .attr('r',0)
    .attr('fill',d=>{if(d.isWildfire)return'rgba(255,158,205,.55)';if(d.aqhi>6)return'rgba(196,168,255,.5)';return'rgba(127,197,255,.4)';})
    .attr('stroke',d=>{if(d.isWildfire)return'rgba(255,158,205,.8)';if(d.aqhi>6)return'rgba(196,168,255,.7)';return'rgba(127,197,255,.6)';})
    .attr('stroke-width',.5)
    .style('filter',d=>d.isWildfire?'drop-shadow(0 0 4px rgba(255,158,205,.3))':d.aqhi>6?'drop-shadow(0 0 3px rgba(196,168,255,.2))':'none');
  const obs=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){
    dots.transition().delay((_,i)=>i*2).duration(600).ease(d3.easeCubicOut).attr('r',d=>d.isWildfire?5:d.aqhi>6?4:3.5);
    obs.unobserve(e.target);
  }});},{threshold:.2});
  obs.observe(wrap);
  dots.on('mouseenter',function(e,d){
    d3.select(this).transition().duration(150).attr('r',8);
    showTip(`<strong>${d.dateStr}</strong><br>Temp: ${d.temp}°C · AQHI: <strong style="color:${aqhiColor(d.aqhi)}">${aqhiDisplay(d.aqhi)}</strong><br>${d.station}${d.isWildfire?'<br><em style="color:#ff9ecd">Wildfire smoke</em>':''}`,e);
  }).on('mousemove',function(e){moveTip(e);})
  .on('mouseleave',function(e,d){
    d3.select(this).transition().duration(150).attr('r',d.isWildfire?5:d.aqhi>6?4:3.5);
    hideTip();
  });
})();

/* ═══════ 12. CANADA MAP — modeled provincial AQHI averages ═══════ */
(function initCanadaMap(){
  const wrap=document.getElementById('canadaMap');if(!wrap)return;
  if(typeof d3==='undefined'||typeof topojson==='undefined'){
    wrap.innerHTML='<p style="text-align:center;color:#a9b8cf;padding:2rem;">Loading map…</p>';return;
  }
  /* Modeled values informed by wildfire impact distribution (Jain et al. 2024) */
  const provRegions=[
    {name:'British Columbia',id:'BC',aqhi:4.4,wf:true,cx:-125,cy:54},
    {name:'Alberta',id:'AB',aqhi:4.0,wf:true,cx:-115,cy:54},
    {name:'Saskatchewan',id:'SK',aqhi:2.7,wf:false,cx:-106,cy:52},
    {name:'Manitoba',id:'MB',aqhi:2.5,wf:false,cx:-98,cy:54},
    {name:'Ontario',id:'ON',aqhi:3.6,wf:true,cx:-85,cy:50},
    {name:'Quebec',id:'QC',aqhi:4.1,wf:true,cx:-72,cy:52},
    {name:'New Brunswick',id:'NB',aqhi:2.3,wf:false,cx:-66,cy:47},
    {name:'Nova Scotia',id:'NS',aqhi:2.1,wf:false,cx:-63,cy:45},
    {name:'P.E.I.',id:'PE',aqhi:1.9,wf:false,cx:-63,cy:46.5},
    {name:'Newfoundland',id:'NL',aqhi:1.8,wf:false,cx:-57,cy:50},
    {name:'Yukon',id:'YT',aqhi:3.1,wf:true,cx:-136,cy:63},
    {name:'N.W.T.',id:'NT',aqhi:3.3,wf:true,cx:-120,cy:64},
    {name:'Nunavut',id:'NU',aqhi:1.5,wf:false,cx:-90,cy:68}
  ];
  const overlay=document.createElement('div');overlay.className='prov-3d-overlay';
  overlay.innerHTML='<div class="prov-3d-card"><div class="prov-3d-scene" id="prov3dScene"></div><div class="prov-3d-info" id="prov3dInfo"></div></div><button class="prov-3d-close" id="prov3dClose">&times;</button>';
  document.body.appendChild(overlay);
  let currentCleanup=null;
  function closeOverlay(){
    overlay.classList.remove('active');
    if(currentCleanup){try{currentCleanup();}catch(_){}currentCleanup=null;}
  }
  document.getElementById('prov3dClose').addEventListener('click',closeOverlay);
  overlay.addEventListener('click',e=>{if(e.target===overlay)closeOverlay();});
  window.addEventListener('keydown',e=>{if(e.key==='Escape')closeOverlay();});
  function hexToThreeColor(hex){return new THREE.Color(hex);}
  function makeWindowTexture(widthUnits,heightUnits){
    const cols=Math.max(2,Math.round(widthUnits*1.6));
    const rows=Math.max(5,Math.round(heightUnits*1.8));
    const cell=16;
    const canvas=document.createElement('canvas');
    canvas.width=cols*cell;canvas.height=rows*cell;
    const c=canvas.getContext('2d');
    const grd=c.createLinearGradient(0,0,0,canvas.height);
    grd.addColorStop(0,'#0a1320');grd.addColorStop(1,'#14202f');
    c.fillStyle=grd;c.fillRect(0,0,canvas.width,canvas.height);
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        const lit=Math.random()>0.62;
        const wx=x*cell+3, wy=y*cell+4, ww=cell-6, wh=cell-7;
        if(lit){
          const r=178+Math.round(Math.random()*20);
          const g=172+Math.round(Math.random()*18);
          const b=158+Math.round(Math.random()*14);
          const a=.55+Math.random()*.18;
          c.fillStyle=`rgba(${r},${g},${b},${a})`;
          c.fillRect(wx,wy,ww,wh);
        }else{
          c.fillStyle='rgba(22,34,52,.55)';
          c.fillRect(wx,wy,ww,wh);
        }
      }
    }
    const tex=new THREE.CanvasTexture(canvas);
    tex.anisotropy=4;
    return tex;
  }
  function show3D(d){
    const scene3d=document.getElementById('prov3dScene');
    const info=document.getElementById('prov3dInfo');
    const col=aqhiColor(d.aqhi);const bi=badgeInfo(d.aqhi);
    info.innerHTML=`<div class="chapter-label">${d.id} · Province</div><h3>${d.name}</h3><div class="prov-aqi-big" style="color:${col}">${d.aqhi}</div><div class="prov-badge" style="background:${bi.bg};color:${bi.fg}">${bi.label}</div><p>${bi.desc}</p>${d.wf?'<p style="color:#ff9ecd;font-style:italic;">Affected by 2023 wildfire season</p>':''}<p style="font-size:.75rem;color:rgba(169,184,207,.5);margin-top:.8rem;">Skyline heights are scaled to relative AQHI values. Drag to orbit.</p>`;
    overlay.classList.add('active');
    scene3d.innerHTML='';
    if(currentCleanup){try{currentCleanup();}catch(_){}currentCleanup=null;}
    if(typeof THREE==='undefined'){scene3d.innerHTML='<p style="color:#a9b8cf;padding:2rem;text-align:center;">three.js is not loaded.</p>';return;}
    const W2=scene3d.clientWidth||600;
    const H2=scene3d.clientHeight||420;
    const scene=new THREE.Scene();
    scene.fog=new THREE.FogExp2(0x050a14,0.028);
    const camera=new THREE.PerspectiveCamera(45,W2/H2,0.1,500);
    const camTargetY=3;
    camera.position.set(0,22,26);camera.lookAt(0,camTargetY,0);
    const renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setSize(W2,H2);renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));
    renderer.setClearColor(0x050a14,0);scene3d.appendChild(renderer.domElement);
    scene.add(new THREE.AmbientLight(0x7fc5ff,0.55));
    const dl=new THREE.DirectionalLight(0xffffff,0.35);dl.position.set(4,12,6);scene.add(dl);
    const glow=new THREE.PointLight(new THREE.Color(col),0.8,40);glow.position.set(0,8,0);scene.add(glow);
    const baseGroup=new THREE.Group();scene.add(baseGroup);
    const baseRadius=8;
    const baseGeo=new THREE.CircleGeometry(baseRadius,64);
    const baseMat=new THREE.MeshBasicMaterial({color:hexToThreeColor(col),transparent:true,opacity:.28,side:THREE.DoubleSide});
    const base=new THREE.Mesh(baseGeo,baseMat);baseGroup.add(base);
    const ringGeo=new THREE.RingGeometry(baseRadius*0.96,baseRadius*1.02,64);
    const ringMat=new THREE.MeshBasicMaterial({color:hexToThreeColor(col),transparent:true,opacity:.85,side:THREE.DoubleSide});
    const ring=new THREE.Mesh(ringGeo,ringMat);baseGroup.add(ring);
    const ring2Geo=new THREE.RingGeometry(baseRadius*1.02,baseRadius*1.15,64);
    const ring2Mat=new THREE.MeshBasicMaterial({color:hexToThreeColor(col),transparent:true,opacity:.15,side:THREE.DoubleSide});
    const ring2=new THREE.Mesh(ring2Geo,ring2Mat);baseGroup.add(ring2);
    baseGroup.rotation.x=0;baseGroup.scale.setScalar(0.02);
    /* Scale buildings to AQHI (1-12 range × 1.8) */
    const bSc=d.aqhi*1.8;
    const barHeights=[bSc*0.95,bSc*0.6,bSc*0.8,bSc*0.45,bSc*0.85,bSc*0.55,bSc*0.7];
    const slotPositions=[{x:-4.2,z:-1.8,w:1.6,d:1.6},{x:-1.7,z:-3.0,w:1.5,d:1.5},{x:1.4,z:-2.2,w:1.7,d:1.5},{x:-3.2,z:1.4,w:1.4,d:1.4},{x:0.2,z:0.2,w:1.6,d:1.6},{x:3.0,z:1.6,w:1.5,d:1.5},{x:4.3,z:-0.6,w:1.4,d:1.4}];
    const skyscrapers=[];
    barHeights.forEach((h,i)=>{
      const pos=slotPositions[i];
      const targetH=Math.max(2.2,h);
      const tex=makeWindowTexture(pos.w,targetH);
      tex.wrapS=THREE.RepeatWrapping;tex.wrapT=THREE.RepeatWrapping;
      tex.repeat.set(1,Math.max(1,targetH/1.8));
      const sideMat=new THREE.MeshBasicMaterial({map:tex});
      const topMat=new THREE.MeshBasicMaterial({color:0x0a1422});
      const mats=[sideMat,sideMat,topMat,topMat,sideMat,sideMat];
      const geo=new THREE.BoxGeometry(pos.w,1,pos.d);
      const mesh=new THREE.Mesh(geo,mats);
      mesh.position.set(pos.x,0,pos.z);mesh.scale.y=0.01;mesh.visible=false;scene.add(mesh);
      const edges=new THREE.EdgesGeometry(geo);
      const edgeMat=new THREE.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.08});
      const edgeLine=new THREE.LineSegments(edges,edgeMat);
      edgeLine.position.copy(mesh.position);edgeLine.scale.y=0.01;edgeLine.visible=false;scene.add(edgeLine);
      skyscrapers.push({mesh,edge:edgeLine,targetH,delay:0.38+i*0.11});
    });
    let userAngle=0,userTarget=0,dragging=false,lastX=0;
    function onDown(e){dragging=true;lastX=(e.touches?e.touches[0].clientX:e.clientX);}
    function onMove(e){if(!dragging)return;const x=(e.touches?e.touches[0].clientX:e.clientX);userTarget+=(x-lastX)*0.005;lastX=x;}
    function onUp(){dragging=false;}
    renderer.domElement.addEventListener('mousedown',onDown);
    renderer.domElement.addEventListener('mousemove',onMove);
    window.addEventListener('mouseup',onUp);
    renderer.domElement.addEventListener('touchstart',onDown,{passive:true});
    renderer.domElement.addEventListener('touchmove',onMove,{passive:true});
    window.addEventListener('touchend',onUp);
    const start=performance.now();const INTRO=3800;let rafId;
    function animate(now){
      const t=Math.min(1,(now-start)/INTRO);
      const p1=Math.min(1,t/0.30);
      const easeP1=1-Math.pow(1-p1,3);
      baseGroup.scale.setScalar(0.02+easeP1*0.98);
      baseGroup.rotation.x=-Math.PI/2*easeP1;
      skyscrapers.forEach(s=>{
        const ts=Math.max(0,Math.min(1,(t-s.delay)/0.25));
        if(ts<=0)return;
        s.mesh.visible=true;s.edge.visible=true;
        const easeS=1-Math.pow(1-ts,3);
        const h=Math.max(0.02,easeS*s.targetH);
        s.mesh.scale.y=h;s.edge.scale.y=h;
        s.mesh.position.y=h/2;s.edge.position.y=h/2;
      });
      userAngle+=(userTarget-userAngle)*0.06;
      const ambientAngle=now*0.00018;
      const ang=userAngle+ambientAngle;
      const rad=26;
      camera.position.x=Math.sin(ang)*rad;camera.position.z=Math.cos(ang)*rad;
      camera.position.y=18+Math.sin(now*0.0004)*1.5;
      camera.lookAt(0,camTargetY,0);
      renderer.render(scene,camera);
      rafId=requestAnimationFrame(animate);
    }
    rafId=requestAnimationFrame(animate);
    function onResize(){const nw=scene3d.clientWidth,nh=scene3d.clientHeight;if(!nw||!nh)return;renderer.setSize(nw,nh);camera.aspect=nw/nh;camera.updateProjectionMatrix();}
    window.addEventListener('resize',onResize);
    currentCleanup=function(){
      cancelAnimationFrame(rafId);
      window.removeEventListener('resize',onResize);
      renderer.domElement.removeEventListener('mousedown',onDown);
      renderer.domElement.removeEventListener('mousemove',onMove);
      window.removeEventListener('mouseup',onUp);
      renderer.domElement.removeEventListener('touchstart',onDown);
      renderer.domElement.removeEventListener('touchmove',onMove);
      window.removeEventListener('touchend',onUp);
      scene.traverse(obj=>{if(obj.geometry)obj.geometry.dispose();if(obj.material){const mats=Array.isArray(obj.material)?obj.material:[obj.material];mats.forEach(m=>{if(m.map)m.map.dispose();m.dispose();});}});
      renderer.dispose();scene3d.innerHTML='';
    };
  }
  d3.json("https://cdn.jsdelivr.net/npm/world-atlas@2/countries-110m.json").then(geo=>{
    wrap.innerHTML='';
    const countries=topojson.feature(geo,geo.objects.countries);
    const canada=countries.features.filter(f=>+f.id===124);
    if(!canada.length){wrap.innerHTML='<p style="color:#a9b8cf;">Could not load Canada.</p>';return;}
    const W=950,H=620;
    const projection=d3.geoAzimuthalEqualArea().rotate([95,0]).center([0,62]).scale(750).translate([W/2,H/2]);
    const path=d3.geoPath().projection(projection);
    const svg=d3.select(wrap).append('svg').attr('viewBox',`0 0 ${W} ${H}`).attr('preserveAspectRatio','xMidYMid meet').style('width','100%').style('height','auto');
    const defs=svg.append('defs');
    const filt=defs.append('filter').attr('id','mapGlow').attr('x','-30%').attr('y','-30%').attr('width','160%').attr('height','160%');
    filt.append('feGaussianBlur').attr('stdDeviation','6').attr('result','blur');
    const fm=filt.append('feMerge');fm.append('feMergeNode').attr('in','blur');fm.append('feMergeNode').attr('in','SourceGraphic');
    const g=svg.append('g');
    g.selectAll('.canada-fill').data(canada).join('path').attr('d',path).attr('fill','rgba(127,197,255,.06)').attr('stroke','rgba(127,197,255,.25)').attr('stroke-width',1);
    const provG=g.selectAll('.prov-group').data(provRegions).join('g').attr('class','prov-group')
      .attr('transform',d=>{const[px,py]=projection([d.cx,d.cy]);return`translate(${px},${py})`;}).style('cursor','pointer');
    provG.append('circle').attr('r',20).attr('fill',d=>aqhiColor(d.aqhi)+'44').attr('stroke',d=>aqhiColor(d.aqhi)).attr('stroke-width',1.5).attr('filter','url(#mapGlow)').style('transition','all .3s');
    provG.append('text').attr('text-anchor','middle').attr('dominant-baseline','central').attr('fill','rgba(234,241,251,.85)').attr('font-size','9').attr('font-weight','600').attr('pointer-events','none').text(d=>d.id);
    provG.on('mouseenter',function(e,d){
      d3.select(this).select('circle').attr('r',26).attr('fill',aqhiColor(d.aqhi)+'77');
      showTip(`<strong>${d.name}</strong><br>Avg AQHI: <strong style="color:${aqhiColor(d.aqhi)}">${d.aqhi}</strong><br><em>Click for details</em>`,e);
    }).on('mousemove',function(e){moveTip(e);})
    .on('mouseleave',function(e,d){
      d3.select(this).select('circle').attr('r',20).attr('fill',aqhiColor(d.aqhi)+'44');hideTip();
    }).on('click',function(e,d){e.stopPropagation();hideTip();show3D(d);});
  }).catch(err=>{
    console.warn('TopoJSON load failed',err);
    wrap.innerHTML='<p style="text-align:center;color:#a9b8cf;padding:2rem;">Map could not be loaded.</p>';
  });
})();

/* ═══════ 13. MIDNIGHT ═══════ */
(function initMidnight(){
  const section=document.getElementById('s-midnight'),canvas=document.getElementById('midnightStars');
  const title=document.getElementById('midTitle'),p1=document.getElementById('midP1'),p2=document.getElementById('midP2'),p3=document.getElementById('midP3');
  if(!section||!canvas)return;const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||window.innerHeight*5;}
  resize();window.addEventListener('resize',resize);
  function rng(n){let x=Math.sin(n+77)*1e4;return x-Math.floor(x);}
  const stars=Array.from({length:300},(_,i)=>({x:rng(i*3),y:rng(i*3+1),r:.3+rng(i*3+2)*2,phase:rng(i*3+1)*Math.PI*2,speed:.005+rng(i*3+2)*.01,col:rng(i)>.8?[196,168,255]:rng(i)>.5?[127,197,255]:[234,241,251]}));
  let tick=0;
  function drawStars(){
    tick++;ctx.clearRect(0,0,W,H);
    stars.forEach(s=>{
      const tw=Math.max(0.01,.3+.7*(.5+.5*Math.sin(tick*s.speed+s.phase)));const[r,g,b]=s.col;
      const sR=Math.max(1,s.r*3);
      const grd=ctx.createRadialGradient(s.x*W,s.y*H,0,s.x*W,s.y*H,sR);
      grd.addColorStop(0,`rgba(${r},${g},${b},${tw*.15})`);grd.addColorStop(1,`rgba(${r},${g},${b},0)`);
      ctx.beginPath();ctx.arc(s.x*W,s.y*H,sR,0,Math.PI*2);ctx.fillStyle=grd;ctx.fill();
      ctx.beginPath();ctx.arc(s.x*W,s.y*H,Math.max(.5,s.r*tw),0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${tw})`;ctx.fill();
    });
    requestAnimationFrame(drawStars);
  }
  drawStars();
  function onScroll(){
    const rect=section.getBoundingClientRect(),total=section.offsetHeight-window.innerHeight;
    const pct=Math.max(0,Math.min(1,-rect.top/total));
    if(title)title.style.opacity=pct<.05?pct/.05:pct>.85?(1-(pct-.85)/.15):1;
    if(p1){const t=Math.max(0,Math.min(1,(pct-.1)/.15));p1.style.opacity=t;p1.style.transform=`translateY(${20*(1-t)}px)`;}
    if(p2){const t=Math.max(0,Math.min(1,(pct-.3)/.15));p2.style.opacity=t;p2.style.transform=`translateY(${20*(1-t)}px)`;}
    if(p3){const t=Math.max(0,Math.min(1,(pct-.5)/.15));p3.style.opacity=t;p3.style.transform=`translateY(${20*(1-t)}px)`;}
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

/* ═══════ 14. CRYSTAL ═══════ */
(function initStarsBg(){
  const canvas=document.getElementById('starsCanvas');if(!canvas)return;
  const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=canvas.offsetWidth||window.innerWidth;H=canvas.height=canvas.offsetHeight||window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  function rng(n){let x=Math.sin(n+42)*1e4;return x-Math.floor(x);}
  const stars=Array.from({length:200},(_,i)=>({x:rng(i*3),y:rng(i*3+1),r:.3+rng(i*3+2)*2.2,phase:rng(i*3+1)*Math.PI*2,speed:.005+rng(i*3+2)*.01,col:rng(i)>.8?[196,168,255]:rng(i)>.5?[127,197,255]:[234,241,251]}));
  let tick=0;
  function frame(){tick++;ctx.clearRect(0,0,W,H);stars.forEach(s=>{const tw=Math.max(.01,.3+.7*(.5+.5*Math.sin(tick*s.speed+s.phase)));const[r,g,b]=s.col;ctx.beginPath();ctx.arc(s.x*W,s.y*H,Math.max(.5,s.r*tw),0,Math.PI*2);ctx.fillStyle=`rgba(${r},${g},${b},${tw})`;ctx.fill();});requestAnimationFrame(frame);}
  frame();
})();

(function initCrystal(){
  const container=document.getElementById('crystalChart'),tipEl=document.getElementById('crystalTip');
  if(!container||typeof d3==='undefined')return;
  const MONTH_NAMES=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  function monthStats(year,month){const days=DATA.filter(d=>d.y===year&&d.m===month);if(!days.length)return null;const avg=Math.round(days.reduce((s,d)=>s+d.aqhi,0)/days.length*10)/10;const max=Math.max(...days.map(d=>d.aqhi));return{avg,max,wf:days.some(d=>d.isWildfire),poor:days.filter(d=>d.aqhi>6).length};}
  const nodes=[],links=[];
  nodes.push({id:'hub',label:'AQHI\n2022–24',type:'hub',r:40,info:'Canada-wide modeled AQHI data'});
  [2022,2023,2024].forEach(y=>{
    const yid=`y${y}`;nodes.push({id:yid,label:String(y),type:'year',r:28,info:`Year ${y}`});
    links.push({source:'hub',target:yid,w:2.5});
    MONTH_NAMES.forEach((mo,mi)=>{
      const st=monthStats(y,mi);if(!st)return;
      const mid=`${y}-${mi}`,type=st.wf?'wildfire':st.avg>5?'event':'month';
      nodes.push({id:mid,label:`${mo}\n${y}`,type,r:14+st.avg*2.2,stats:st,info:`${mo} ${y}<br>Avg AQHI <strong style="color:${aqhiColor(st.avg)}">${st.avg}</strong> · Max ${aqhiDisplay(st.max)}<br>High-risk days: ${st.poor}${st.wf?'<br><em style="color:#ff9ecd">Wildfire</em>':''}`});
      links.push({source:yid,target:mid,w:1.2});
      if(st.wf||st.max>8){const eid=`${mid}-peak`;nodes.push({id:eid,label:'★',type:'peak',r:10,info:`Peak AQHI ${aqhiDisplay(st.max)} in ${mo} ${y}`});links.push({source:mid,target:eid,w:.8});}
    });
  });
  const rect=container.getBoundingClientRect();const W=rect.width||700,H=rect.height||700;
  const svg=d3.select(container).append('svg').attr('width','100%').attr('height','100%').attr('viewBox',`0 0 ${W} ${H}`);
  const defs=svg.append('defs');const filt=defs.append('filter').attr('id','glow').attr('x','-50%').attr('y','-50%').attr('width','200%').attr('height','200%');
  filt.append('feGaussianBlur').attr('stdDeviation','4').attr('result','blur');const fm=filt.append('feMerge');fm.append('feMergeNode').attr('in','blur');fm.append('feMergeNode').attr('in','SourceGraphic');
  const g=svg.append('g');
  let crystalInteractive=false;
  const crystalZoom=d3.zoom().scaleExtent([.25,4])
    .filter(e=>e.type!=='wheel'||crystalInteractive)
    .on('zoom',e=>g.attr('transform',e.transform));
  svg.call(crystalZoom);
  svg.on('mousedown.activate touchstart.activate',()=>{crystalInteractive=true;});
  document.addEventListener('mousedown',e=>{const node=svg.node();if(node&&!node.contains(e.target))crystalInteractive=false;},true);
  const zInBtn=document.getElementById('crystalZoomIn'),zOutBtn=document.getElementById('crystalZoomOut');
  if(zInBtn)zInBtn.addEventListener('click',ev=>{ev.stopPropagation();svg.transition().duration(300).call(crystalZoom.scaleBy,1.4);});
  if(zOutBtn)zOutBtn.addEventListener('click',ev=>{ev.stopPropagation();svg.transition().duration(300).call(crystalZoom.scaleBy,1/1.4);});
  function nodeColor(d){if(d.type==='hub')return'#eaf1fb';if(d.type==='year')return'#7fc5ff';if(d.type==='wildfire')return'#ff9ecd';if(d.type==='peak')return'#ff6e9e';if(d.type==='event')return'#c4a8ff';return d.stats?aqhiColor(d.stats.avg):'#7f77dd';}
  const sim=d3.forceSimulation(nodes).force('link',d3.forceLink(links).id(d=>d.id).distance(d=>d.source.type==='hub'?170:d.source.type==='year'?115:70).strength(.6)).force('charge',d3.forceManyBody().strength(d=>d.type==='hub'?-900:-260)).force('center',d3.forceCenter(W/2,H/2)).force('collision',d3.forceCollide().radius(d=>d.r+10));
  const link=g.append('g').selectAll('line').data(links).join('line').attr('stroke','rgba(127,197,255,.2)').attr('stroke-width',d=>d.w||1);
  const nodeG=g.append('g').selectAll('g').data(nodes).join('g').attr('cursor','grab')
    .call(d3.drag().on('start',(e,d)=>{if(!e.active)sim.alphaTarget(.3).restart();d.fx=d.x;d.fy=d.y;}).on('drag',(e,d)=>{d.fx=e.x;d.fy=e.y;}).on('end',(e,d)=>{if(!e.active)sim.alphaTarget(0);d.fx=null;d.fy=null;}))
    .on('click',(e,d)=>{if(!d.info)return;tipEl.innerHTML=d.info;tipEl.style.display='block';tipEl.style.left=(e.clientX+14)+'px';tipEl.style.top=(e.clientY-10)+'px';e.stopPropagation();});
  nodeG.filter(d=>d.type==='hub').each(function(d){const el=d3.select(this);el.append('circle').attr('r',d.r*1.5).attr('fill','none').attr('stroke','rgba(234,241,251,.15)').attr('stroke-width',1.5);el.append('circle').attr('r',d.r).attr('fill','rgba(234,241,251,.06)').attr('stroke','#eaf1fb').attr('stroke-width',2).attr('filter','url(#glow)');});
  nodeG.filter(d=>d.type==='year').each(function(d){const el=d3.select(this);el.append('ellipse').attr('rx',d.r*1.8).attr('ry',d.r*.4).attr('fill','none').attr('stroke','rgba(127,197,255,.15)').attr('stroke-width',.6);el.append('circle').attr('r',d.r).attr('fill','rgba(127,197,255,.08)').attr('stroke','#7fc5ff').attr('stroke-width',1.5).attr('filter','url(#glow)');});
  nodeG.filter(d=>d.type==='month'||d.type==='wildfire'||d.type==='event').each(function(d){const el=d3.select(this),col=nodeColor(d);el.append('circle').attr('r',d.r).attr('fill',col+'33').attr('stroke',col).attr('stroke-width',1.2).attr('filter',d.type==='wildfire'?'url(#glow)':null);});
  nodeG.filter(d=>d.type==='peak').each(function(d){d3.select(this).append('text').attr('text-anchor','middle').attr('dominant-baseline','central').attr('fill',nodeColor(d)).attr('font-size',d.r*2.5).attr('filter','url(#glow)').attr('pointer-events','none').text('★');});
  nodeG.each(function(d){if(d.type==='peak')return;const lines=d.label.split('\n'),el=d3.select(this);lines.forEach((line,i)=>{el.append('text').attr('text-anchor','middle').attr('y',(i-(lines.length-1)/2)*(d.r>13?14:11)).attr('dominant-baseline','central').attr('fill','rgba(234,241,251,.9)').attr('font-size',d.r>24?15:d.r>15?12:10).attr('font-weight',d.type==='hub'||d.type==='year'?600:500).attr('pointer-events','none').text(line);});});
  sim.on('tick',()=>{link.attr('x1',d=>d.source.x).attr('y1',d=>d.source.y).attr('x2',d=>d.target.x).attr('y2',d=>d.target.y);nodeG.attr('transform',d=>`translate(${d.x},${d.y})`);});
  svg.on('click',()=>{tipEl.style.display='none';});
})();

/* ═══════ 15. DAWN ═══════ */
(function initDawn(){
  const section=document.getElementById('s-dawn'),canvas=document.getElementById('dawnCanvas'),svg=document.getElementById('forestScene');
  const title=document.getElementById('dawnTitle'),p1=document.getElementById('dawnP1'),p2=document.getElementById('dawnP2'),p3=document.getElementById('dawnP3');
  if(!section||!canvas||!svg)return;
  const ctx=canvas.getContext('2d');let W,H;
  function resize(){W=canvas.width=window.innerWidth;H=canvas.height=window.innerHeight;}
  resize();window.addEventListener('resize',resize);
  function rng(n){let x=Math.sin(n+77)*1e4;return x-Math.floor(x);}
  const stars=Array.from({length:160},(_,i)=>({x:rng(i*3),y:rng(i*3+1)*.65,r:.4+rng(i*3+2)*1.6,phase:rng(i*3+1)*Math.PI*2,speed:.005+rng(i*3+2)*.01,col:rng(i)>.8?[196,168,255]:rng(i)>.5?[127,197,255]:[234,241,251]}));
  let tick=0;
  const hillsLayer=document.getElementById('distantHills'),raysLayer=document.getElementById('forestRays'),treesLayer=document.getElementById('forestTrees'),groundLayer=document.getElementById('forestGround');
  hillsLayer.innerHTML=`<path d="M0 760 Q 220 720 440 740 T 880 735 T 1320 745 T 1600 738 L 1600 900 L 0 900 Z" fill="#2a4036" opacity=".55"/><path d="M0 820 Q 300 790 620 800 T 1200 795 T 1600 800 L 1600 900 L 0 900 Z" fill="#162520" opacity=".85"/>`;
  hillsLayer.style.opacity=0;
  groundLayer.innerHTML=`<rect x="0" y="868" width="1600" height="32" fill="url(#groundGrad)"/>`;
  groundLayer.style.opacity=0;
  raysLayer.innerHTML=`<ellipse cx="760" cy="60" rx="130" ry="780" fill="url(#rayGrad)" transform="rotate(-10 760 60)"/><ellipse cx="910" cy="60" rx="90" ry="780" fill="url(#rayGrad)" transform="rotate(-5 910 60)"/><ellipse cx="620" cy="60" rx="75" ry="780" fill="url(#rayGrad)" transform="rotate(-16 620 60)"/>`;
  raysLayer.style.opacity=0;
  function buildPine(hs,seed){
    const h=230*hs,tw=Math.max(5,9*hs),th=Math.max(24,46*hs),cw=90*hs;
    const layers=[];const N=5;
    for(let i=0;i<N;i++){
      const t=i/(N-1),w=cw*(1-t*0.22),yTop=-th-h*(0.25+t*0.7),yBot=-th-h*t*0.55,jitterX=(rng(seed*11+i)-0.5)*6,gradId=i<2?'pineDark':i<4?'pineMid':'pineLight',op=0.95-i*0.06;
      layers.push(`<polygon points="${-w/2+jitterX},${yBot} ${w/2+jitterX},${yBot} ${jitterX},${yTop}" fill="url(#${gradId})" opacity="${op}"/>`);
    }
    const brush=[];
    for(let i=0;i<7;i++){
      const s=rng(seed*13+i),bx=(s-0.5)*cw*0.85,by=-th-h*0.18-s*h*0.78,br=2.5+rng(seed*13+i+1)*4;
      brush.push(`<circle cx="${bx}" cy="${by}" r="${br}" fill="url(#pineLight)" opacity="${0.25+rng(seed*13+i+2)*0.3}"/>`);
    }
    return `<rect x="${-tw/2}" y="${-th}" width="${tw}" height="${th+3}" fill="url(#trunkGrad)"/>${layers.join('')}${brush.join('')}`;
  }
  const NUM_TREES=22,trees=[];
  for(let i=0;i<NUM_TREES;i++){
    const u=(i+0.5)/NUM_TREES,biased=u<0.5?0.5-Math.pow(1-u*2,1.6)*0.5:0.5+Math.pow((u-0.5)*2,1.6)*0.5,xPos=40+biased*1520+(rng(i*17)-0.5)*50,edgeFactor=Math.abs(u-0.5)*2,heightScale=0.45+edgeFactor*1.35+rng(i*7+1)*0.2,baseY=885-rng(i*7+2)*10,delay=rng(i*7+3)*0.28;
    trees.push({x:xPos,baseY,heightScale,delay,seed:i+1});
  }
  trees.forEach((t,i)=>{
    const g=document.createElementNS('http://www.w3.org/2000/svg','g');
    g.setAttribute('class','tree-group');
    g.setAttribute('transform',`translate(${t.x},${t.baseY}) scale(0)`);
    g.innerHTML=buildPine(t.heightScale,t.seed);
    treesLayer.appendChild(g);
  });
  function drawSky(pct){
    tick++;ctx.clearRect(0,0,W,H);
    const dawnT=Math.max(0,Math.min(1,(pct-0.15)/0.4)),skyT=Math.max(0,Math.min(1,(pct-0.5)/0.4));
    const topR=Math.round(4+skyT*130),topG=Math.round(8+skyT*180),topB=Math.round(18+skyT*225);
    const midR=Math.round(7+dawnT*200-skyT*90),midG=Math.round(17+dawnT*120+skyT*40),midB=Math.round(28+dawnT*80+skyT*150);
    const horR=Math.round(30+dawnT*220-skyT*100),horG=Math.round(40+dawnT*150-skyT*10),horB=Math.round(60+dawnT*80+skyT*110);
    const bg=ctx.createLinearGradient(0,0,0,H);
    bg.addColorStop(0,`rgb(${topR},${topG},${topB})`);
    bg.addColorStop(.6,`rgb(${midR},${midG},${midB})`);
    bg.addColorStop(1,`rgb(${horR},${horG},${horB})`);
    ctx.fillStyle=bg;ctx.fillRect(0,0,W,H);
    const starAlpha=Math.max(0,1-dawnT*1.6);
    if(starAlpha>0.01){
      stars.forEach(s=>{
        const tw=.3+.7*(.5+.5*Math.sin(tick*s.speed+s.phase));const[r,g,b]=s.col;
        ctx.beginPath();ctx.arc(s.x*W,s.y*H,Math.max(.5,s.r*tw),0,Math.PI*2);
        ctx.fillStyle=`rgba(${r},${g},${b},${tw*starAlpha})`;ctx.fill();
      });
    }
    if(dawnT>0.2){
      const intensity=Math.max(0,Math.min(dawnT*1.2,1-skyT*0.3));
      const glow=ctx.createRadialGradient(W*.55,H*.55,0,W*.55,H*.55,W*.7);
      glow.addColorStop(0,`rgba(255,210,145,${intensity*.28})`);
      glow.addColorStop(.5,`rgba(255,170,110,${intensity*.12})`);
      glow.addColorStop(1,'rgba(0,0,0,0)');
      ctx.fillStyle=glow;ctx.fillRect(0,0,W,H);
    }
  }
  function updateForest(pct){
    hillsLayer.style.opacity=Math.max(0,Math.min(1,(pct-0.22)/0.18));
    groundLayer.style.opacity=Math.max(0,Math.min(1,(pct-0.28)/0.17));
    raysLayer.style.opacity=Math.max(0,Math.min(1,(pct-0.42)/0.25))*0.9;
    const treeStart=0.32,treeEnd=0.95,treeNodes=treesLayer.querySelectorAll('.tree-group');
    treeNodes.forEach((el,i)=>{
      const t=trees[i],localStart=treeStart+t.delay*0.18,localT=Math.max(0,Math.min(1,(pct-localStart)/(treeEnd-localStart))),easeT=1-Math.pow(1-localT,2.2);
      el.setAttribute('transform',`translate(${t.x},${t.baseY}) scale(${easeT})`);
      el.style.opacity=easeT>0.01?1:0;
    });
  }
  function onScroll(){
    const rect=section.getBoundingClientRect(),total=section.offsetHeight-window.innerHeight,pct=Math.max(0,Math.min(1,-rect.top/total));
    canvas.style.opacity=rect.top<window.innerHeight&&rect.bottom>0?'1':'0';
    drawSky(pct);updateForest(pct);
    const txOut=pct>0.55?Math.max(0,1-(pct-0.55)/0.2):1;
    if(title){const t=pct<.08?pct/.08:1;title.style.opacity=t*txOut;}
    if(p1){const t=Math.max(0,Math.min(1,(pct-.1)/.12));p1.style.opacity=t*txOut;p1.style.transform=`translateY(${20*(1-t)}px)`;}
    if(p2){const t=Math.max(0,Math.min(1,(pct-.24)/.12));p2.style.opacity=t*txOut;p2.style.transform=`translateY(${20*(1-t)}px)`;}
    if(p3){const t=Math.max(0,Math.min(1,(pct-.38)/.12));p3.style.opacity=t*txOut;p3.style.transform=`translateY(${20*(1-t)}px)`;}
  }
  window.addEventListener('scroll',onScroll,{passive:true});onScroll();
})();

/* ═══════ FOOTER ═══════ */
document.getElementById('backToTop')?.addEventListener('click',()=>{window.scrollTo({top:0,behavior:'smooth'});});

/* ═══════ AMBIENT MUSIC ═══════ */
(function initAmbientMusic(){
  const btn=document.getElementById('musicToggle');
  if(!btn)return;
  let actx=null,master=null,filter=null,lfoGain=null,reverb=null,wet=null,dry=null,isPlaying=false,activeNodes=[],chordTimer=null,chordIdx=0,melodyTimer=null;
  const chords=[[110.00,164.81,220.00,261.63,329.63],[130.81,196.00,261.63,329.63,392.00],[146.83,220.00,293.66,349.23,440.00],[123.47,196.00,246.94,329.63,392.00]];
  const melody=[523.25,587.33,659.25,783.99,880.00,659.25,523.25,440.00];
  function makeReverb(c){const conv=c.createConvolver(),dur=c.sampleRate*4,buf=c.createBuffer(2,dur,c.sampleRate);for(let ch=0;ch<2;ch++){const data=buf.getChannelData(ch);for(let i=0;i<dur;i++)data[i]=(Math.random()*2-1)*Math.pow(1-i/dur,2.5);}conv.buffer=buf;return conv;}
  function playChord(freqs,duration){const now=actx.currentTime;freqs.forEach((freq,i)=>{[0,1].forEach(d=>{const osc=actx.createOscillator();osc.type=d===0?'sine':'triangle';osc.frequency.value=freq*(d===0?1:1.0035);const env=actx.createGain();env.gain.value=0;const peak=(0.10/freqs.length)*(d===0?1:0.5);env.gain.linearRampToValueAtTime(peak,now+2.2);env.gain.linearRampToValueAtTime(peak*0.85,now+duration*0.6);env.gain.linearRampToValueAtTime(0.0001,now+duration);osc.connect(env).connect(filter);osc.start(now);osc.stop(now+duration+0.3);activeNodes.push(osc,env);});});}
  function playMelodyNote(){if(!isPlaying)return;if(Math.random()>0.55){const freq=melody[Math.floor(Math.random()*melody.length)];const now=actx.currentTime;const osc=actx.createOscillator();osc.type='sine';osc.frequency.value=freq;const env=actx.createGain();env.gain.value=0;env.gain.linearRampToValueAtTime(0.045,now+0.4);env.gain.linearRampToValueAtTime(0.025,now+1.5);env.gain.linearRampToValueAtTime(0.0001,now+3.5);osc.connect(env).connect(filter);osc.start(now);osc.stop(now+3.7);activeNodes.push(osc,env);}}
  function nextChord(){if(!isPlaying)return;playChord(chords[chordIdx%chords.length],11);chordIdx++;}
  function start(){if(isPlaying)return;if(!actx)actx=new(window.AudioContext||window.webkitAudioContext)();if(actx.state==='suspended')actx.resume();master=actx.createGain();master.gain.value=0;master.gain.linearRampToValueAtTime(0.55,actx.currentTime+3);filter=actx.createBiquadFilter();filter.type='lowpass';filter.frequency.value=1100;filter.Q.value=0.7;const lfo=actx.createOscillator();lfo.frequency.value=0.07;lfoGain=actx.createGain();lfoGain.gain.value=300;lfo.connect(lfoGain).connect(filter.frequency);lfo.start();activeNodes.push(lfo,lfoGain);reverb=makeReverb(actx);dry=actx.createGain();dry.gain.value=0.45;wet=actx.createGain();wet.gain.value=0.55;filter.connect(dry).connect(master);filter.connect(reverb);reverb.connect(wet).connect(master);master.connect(actx.destination);chordIdx=0;isPlaying=true;nextChord();chordTimer=setInterval(nextChord,9500);melodyTimer=setInterval(playMelodyNote,4200);btn.classList.add('playing');btn.title='Pause ambient music';}
  function stop(){if(!isPlaying)return;isPlaying=false;if(chordTimer){clearInterval(chordTimer);chordTimer=null;}if(melodyTimer){clearInterval(melodyTimer);melodyTimer=null;}if(master&&actx){master.gain.cancelScheduledValues(actx.currentTime);master.gain.linearRampToValueAtTime(0,actx.currentTime+1.2);}setTimeout(()=>{activeNodes.forEach(n=>{try{if(n.stop)n.stop();n.disconnect&&n.disconnect();}catch(_){}});activeNodes=[];},1500);btn.classList.remove('playing');btn.title='Play ambient music';}
  btn.addEventListener('click',()=>{if(isPlaying)stop();else start();});
  document.addEventListener('visibilitychange',()=>{if(document.hidden&&isPlaying&&master&&actx){master.gain.cancelScheduledValues(actx.currentTime);master.gain.linearRampToValueAtTime(0,actx.currentTime+0.6);}else if(!document.hidden&&isPlaying&&master&&actx){master.gain.cancelScheduledValues(actx.currentTime);master.gain.linearRampToValueAtTime(0.55,actx.currentTime+1.5);}});
})();

/* ═══════ BLACK SPLASH ═══════ */
(function initSplash(){
  const splash=document.getElementById('splashOverlay');
  if(!splash)return;
  let dismissed=false;
  function dismiss(){if(dismissed)return;dismissed=true;splash.classList.add('hidden');setTimeout(()=>{splash.remove();},1300);}
  splash.addEventListener('click',dismiss);
})();

/* ═══════ SECTION NAV ═══════ */
(function initSectionNav(){
  const nav=document.getElementById('sectionNav');if(!nav)return;
  const items=Array.from(nav.querySelectorAll('.section-nav-item'));
  const sections=items.map(item=>{const id=item.getAttribute('href').slice(1);return{item,el:document.getElementById(id)};}).filter(s=>s.el);
  function update(){
    const mid=window.scrollY+window.innerHeight*0.35;
    let activeIdx=0;
    sections.forEach((s,i)=>{const top=s.el.offsetTop;if(top<=mid)activeIdx=i;});
    items.forEach((it,i)=>it.classList.toggle('active',i===activeIdx));
  }
  window.addEventListener('scroll',update,{passive:true});update();
})();