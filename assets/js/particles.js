/* One persistent population moves between the flowing field and each figure. */
(() => {
  const story = document.querySelector('.particle-story'), canvas = document.querySelector('#particle-field');
  if (!story || !canvas) return;
  const button = document.querySelector('#particle-toggle'), figures = [...document.querySelectorAll('[data-figure]')];
  let heroLight=1;
  function updateHeroTone(){ heroLight=1-Math.max(0,Math.min(1,window.scrollY/(innerHeight*.85))); document.body.style.setProperty('--hero-light',heroLight.toFixed(3)); document.body.classList.toggle('hero-bright',heroLight>.55); }
  updateHeroTone(); addEventListener('scroll',updateHeroTone,{passive:true}); addEventListener('resize',updateHeroTone,{passive:true});
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  if (reduced.matches || localStorage.getItem('cz-motion') === 'reduced') { if (button) button.hidden = true; return; }
  const ctx = canvas.getContext('2d'); if (!ctx) return;
  const clamp = n => Math.max(0, Math.min(1, n));
  const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  let w, h, points = [], active = -1, releaseUntil = 0, time = 0, last = performance.now(), enabled = true, frame;
  const weights = [0,0,0], mouse = {x:.5,y:.5,active:false}; let mx=.5, my=.5;
  function resize(){ w=innerWidth; h=innerHeight; const d=Math.min(devicePixelRatio || 1, 1.5); canvas.width=w*d; canvas.height=h*d; canvas.style.width=w+'px'; canvas.style.height=h+'px'; ctx.setTransform(d,0,0,d,0,0); }
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove', e => {mouse.x=e.clientX/w; mouse.y=e.clientY/h; mouse.active=true;},{passive:true});
  document.addEventListener('pointerleave',()=>mouse.active=false);
  function draw(now){
    const dt=Math.min(.04,Math.max(0,(now-last)/1000)); last=now; if(enabled) time+=dt;
    const rects=figures.map(x=>x.getBoundingClientRect());
    const raw=rects.map((r,j)=>{let anchor=j===2?.5:(w<=760?.70:.5);let dist=Math.abs((r.top+r.bottom)/2-h*anchor)/h;let u=clamp((.36-dist)/.20);return u*u*(3-2*u)});
    let desired=raw.indexOf(Math.max(...raw)); if(raw[desired]<.015) desired=-1;
    if(enabled){if(active>=0&&active!==desired){weights[active]=0;active=-1;releaseUntil=time+.85} if(active<0&&desired>=0&&time>=releaseUntil)active=desired; if(active>=0)weights[active]+=(raw[active]-weights[active])*(1-Math.exp(-dt*1.15));}
    const strength=Math.min(1,weights.reduce((a,b)=>a+b,0)), mix=weights.map(v=>strength>0?v/strength:0);
    mx+=(mouse.x-mx)*.035; my+=(mouse.y-my)*.035; ctx.clearRect(0,0,w,h);
    for(const p of points){
      if(enabled){let x=p.x,y=p.y,own=strength,tx=x,ty=y;
        let flowX=(Math.sin(y*8+time*.23+p.z*2)+.5*Math.sin((x+y)*9-time*.2+p.seed*4))*.095;
        let flowY=(Math.cos(x*7-time*.21+p.z*3)+.5*Math.cos((y-x)*8+time*.18+p.seed*5))*.08;
        if(own>.001){tx=0;ty=0;for(let j=0;j<3;j++){let t=p.targets[j],r=rects[j],xx=t.x,yy=t.y;
          if(j===2){
            // Circular Keplerian orbits, projected as an inclined disc. The original
            // image supplies the luminous structure; this is not GR ray tracing.
            let scale=w<=760?1.85:1, cx=w<=760?.5:.685, cy=w<=760?.58:.5;
            xx=w<=760?.5+(xx-.685)*scale:xx;
            yy=cy+(yy-.5)*(r.width/r.height)*scale/(2.4*.667);
            let ox=(xx-cx)*r.width, oy=(yy-cy)*r.height/.66;
            let orbitalRadius=Math.max(.16,Math.hypot(ox,oy)/Math.min(w,h));
            let orbit=time*.065/Math.pow(.45+orbitalRadius,1.5);
            let cs=Math.cos(orbit),sn=Math.sin(orbit);
            xx=cx+(ox*cs-oy*sn)/r.width;
            yy=cy+(ox*sn+oy*cs)*.66/r.height;
            p.orbit=orbit;
          }
          tx+=(r.left+xx*r.width)/w*mix[j];ty+=(r.top+yy*r.height)/h*mix[j];}tx=clamp(tx);ty=clamp(ty);}
        let dx=x-mouse.x,dy=y-mouse.y,dist=Math.sqrt(dx*dx+(dy*h/w)**2),repel=mouse.active&&dist<.11?(1-dist/.11)*.035:0;
        let edgeX=x<.02?(.02-x)*1.4:x>.98?(.98-x)*1.4:0,edgeY=y<.02?(.02-y)*1.4:y>.98?(.98-y)*1.4:0;
        let damp=Math.exp(-(1.4+own*4.2)*dt); p.vx=(p.vx+(flowX*(1-own*.94)+(tx-x)*own*10+edgeX+dx*repel)*dt)*damp;p.vy=(p.vy+(flowY*(1-own*.94)+(ty-y)*own*10+edgeY+dy*repel)*dt)*damp;p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.x<.002){p.x=.002;p.vx=Math.abs(p.vx)*.65}else if(p.x>.998){p.x=.998;p.vx=-Math.abs(p.vx)*.65}if(p.y<.002){p.y=.002;p.vy=Math.abs(p.vy)*.65}else if(p.y>.998){p.y=.998;p.vy=-Math.abs(p.vy)*.65}
      }
      const homeAmount=strength*mix[0], lineAmount=strength*mix[2], homeLight=p.targets[0].v, flowLight=p.targets[2].v, alpha=p.alpha*(1-homeAmount-lineAmount)+(Math.pow(homeLight,.45)*.95)*homeAmount+(.07+flowLight*.74)*lineAmount, radius=p.radius*(1-homeAmount-lineAmount)+(.45+homeLight*1.65)*homeAmount+(.35+flowLight*.7)*lineAmount;
      const shade=Math.round(20*heroLight+229*(1-heroLight)),tone=`rgba(${shade},${shade},${shade},${alpha})`;
      let growth=clamp((lineAmount-.24)/.65);growth=growth*growth*(3-2*growth);
      ctx.beginPath();
      if(growth>.005){
        const t=p.targets[2], angle=t.angle+(p.orbit||0)+.055*Math.sin(time*.13+t.phase), length=t.length*Math.min(w,h)/800*growth,dx=Math.cos(angle)*length*.5,dy=Math.sin(angle)*length*.5;
        ctx.strokeStyle=tone;ctx.lineWidth=radius*2*(1-growth)+(.35+flowLight*.95)*growth;ctx.lineCap='round';ctx.moveTo(p.x*w-dx,p.y*h-dy);ctx.lineTo(p.x*w+dx,p.y*h+dy);ctx.stroke();
      }else{ctx.fillStyle=tone;ctx.arc(p.x*w,p.y*h,radius,0,Math.PI*2);ctx.fill();}
    }
    frame=requestAnimationFrame(draw);
  }
  if(button) button.addEventListener('click',()=>{enabled=!enabled;last=performance.now();button.textContent=enabled?'暂停粒子 Ⅱ':'播放粒子 ▶';button.setAttribute('aria-pressed',String(enabled));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame)} else if(points.length){last=performance.now();frame=requestAnimationFrame(draw)}});
  fetch(story.dataset.particleSource).then(r=>{if(!r.ok)throw Error('particle data unavailable');return r.json()}).then(data=>{
    resize();const rect=figures[0].getBoundingClientRect();points=data.forms[0].map((target,i)=>{const v=data.brightness[i]||0,b=Math.pow(Math.max(0,(v-.045)/.955),.8);return{x:(rect.left+target.x*rect.width)/w,y:(rect.top+target.y*rect.height)/h,vx:0,vy:0,z:random(i+544),seed:random(i+87),targets:data.forms.map(a=>a[i]),alpha:.045+b*.95,radius:.18+b*1.42}});document.body.classList.add('particles-ready'); if(!document.hidden)frame=requestAnimationFrame(draw);
  }).catch(()=>{if(button)button.hidden=true});
})();
