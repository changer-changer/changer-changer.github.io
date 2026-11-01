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
  const style = new URLSearchParams(location.search).get('style');
  const dotOnly = style === 'dots', stripeMode = style === 'stripes';
  const random = n => { const x = Math.sin(n * 127.1 + 311.7) * 43758.5453; return x - Math.floor(x); };
  let orbitMap = null;
  const orbitImage = new Image();
  orbitImage.onload = () => { const c=document.createElement('canvas'); c.width=orbitImage.width; c.height=orbitImage.height; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(orbitImage,0,0); orbitMap={data:x.getImageData(0,0,c.width,c.height).data,w:c.width,h:c.height}; };
  orbitImage.src=story.dataset.orbitMap;
  let lensLight = null;
  if (stripeMode) {
    const source = new Image();
    source.onload = () => {
      const c = document.createElement('canvas'); c.width=160; c.height=90;
      const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(source,0,0,c.width,c.height);
      lensLight=x.getImageData(0,0,c.width,c.height).data;
    };
    source.src=figures[2].querySelector('img').src;
  }
  let w, h, points = [], active = -1, releaseUntil = 0, time = 0, last = performance.now(), enabled = true, frame;
  const weights = [0,0,0], mouse = {x:.5,y:.5,active:false}; let mx=.5, my=.5;
  function resize(){ w=innerWidth; h=innerHeight; const d=Math.min(devicePixelRatio || 1, 1.5); canvas.width=w*d; canvas.height=h*d; canvas.style.width=w+'px'; canvas.style.height=h+'px'; ctx.setTransform(d,0,0,d,0,0); }
  addEventListener('resize',resize,{passive:true});
  addEventListener('pointermove', e => {mouse.x=e.clientX/w; mouse.y=e.clientY/h; mouse.active=true;},{passive:true});
  document.addEventListener('pointerleave',()=>mouse.active=false);
  // The image is a precomputed Schwarzschild ray trace. Its brightness shapes
  // the lines; the displacement and the breathing motion are artistic.
  function drawStripes(amount, rect){
    if(amount<.005 || !lensLight) return;
    const mobile=w<=760, cx=rect.left+(mobile?.5:.685)*rect.width;
    const cy=rect.top+(mobile?.58:.5)*rect.height;
    const rx=Math.min(w*(mobile?.30:.18),h*.31), ry=rx*.64;
    const gap=mobile?14:15, step=mobile?6:9;
    ctx.lineWidth=mobile?.72:.85; ctx.lineCap='round';
    for(let y=-gap;y<h+gap;y+=gap){
      ctx.beginPath(); let open=false;
      for(let x=-step;x<=w+step;x+=step){
        const nx=(x-cx)/rx, ny=(y-cy)/ry, d=Math.hypot(nx,ny);
        const u=Math.round(80+(x-cx)/(rx*2.6)*80), v=Math.round(45+(y-cy)/(ry*3.2)*45);
        const lum=u>=0&&u<160&&v>=0&&v<90?lensLight[(v*160+u)*4]/255:0;
        const envelope=Math.exp(-Math.pow((d-1.05)*1.4,2));
        const push=(ny===0?0:Math.sign(ny))*ry*.30*envelope*(.8+.2*lum);
        const ripple=Math.sin(nx*3.5-time*.16+y*.018)*lum*2.1*envelope;
        const yy=y+push+ripple;
        if(d<.76){open=false;continue;}
        if(!open){ctx.moveTo(x,yy);open=true}else ctx.lineTo(x,yy);
      }
      ctx.strokeStyle=`rgba(242,244,239,${amount*.48})`;ctx.stroke();
      // A second, brighter pass is limited to the lensed rim.
      ctx.beginPath(); open=false;
      for(let x=cx-rx*1.8;x<=cx+rx*1.8;x+=step){
        const nx=(x-cx)/rx, ny=(y-cy)/ry, d=Math.hypot(nx,ny);
        if(d<.82 || d>1.28){open=false;continue;}
        const u=Math.round(80+(x-cx)/(rx*2.6)*80), v=Math.round(45+(y-cy)/(ry*3.2)*45);
        const lum=u>=0&&u<160&&v>=0&&v<90?lensLight[(v*160+u)*4]/255:0;
        const envelope=Math.exp(-Math.pow((d-1.05)*1.4,2));
        const yy=y+(ny===0?0:Math.sign(ny))*ry*.30*envelope*(.8+.2*lum)+Math.sin(nx*3.5-time*.16+y*.018)*lum*2.1*envelope;
        if(!open){ctx.moveTo(x,yy);open=true}else ctx.lineTo(x,yy);
      }
      ctx.strokeStyle=`rgba(250,250,247,${amount*.46})`;ctx.stroke();
    }
  }
  function draw(now){
    const dt=Math.min(.04,Math.max(0,(now-last)/1000)); last=now; if(enabled) time+=dt;
    const rects=figures.map(x=>x.getBoundingClientRect());
    const raw=rects.map((r,j)=>{let anchor=j===2?.5:(w<=760?.70:.5);let dist=Math.abs((r.top+r.bottom)/2-h*anchor)/h;let u=clamp((.36-dist)/.20);return u*u*(3-2*u)});
    let desired=raw.indexOf(Math.max(...raw)); if(raw[desired]<.015) desired=-1;
    if(enabled){if(active>=0&&active!==desired){weights[active]=0;active=-1;releaseUntil=time+.85} if(active<0&&desired>=0&&time>=releaseUntil)active=desired; if(active>=0)weights[active]+=(raw[active]-weights[active])*(1-Math.exp(-dt*1.15));}
    const strength=Math.min(1,weights.reduce((a,b)=>a+b,0)), mix=weights.map(v=>strength>0?v/strength:0);
    mx+=(mouse.x-mx)*.035; my+=(mouse.y-my)*.035; ctx.clearRect(0,0,w,h);
    for(const p of points){
      if(enabled && active===2 && orbitMap){
        // Timelike Schwarzschild geodesic in proper time (G = c = M = 1).
        // The material starts slightly below circular angular momentum, so it
        // spirals inward. At the inner edge it rejoins the continuous flow.
        let r=p.orbitR, L=p.orbitL, factor=Math.max(0,1-2/r)/p.orbitE;
        let dTau=dt*8*factor;
        const gravity=rr=>-1/(rr*rr)+L*L/(rr*rr*rr)-3*L*L/(rr*rr*rr*rr);
        p.orbitVr+=gravity(r)*dTau*.5; p.orbitR+=p.orbitVr*dTau;
        p.orbitPhi+=L/(r*r)*dTau; p.orbitVr+=gravity(Math.max(5.9,p.orbitR))*dTau*.5;
        if(p.orbitR<6.01){ p.orbitR=p.targets[2].diskR; p.orbitPhi=p.targets[2].diskPhi; p.orbitVr=-.008; }
      }
      if(enabled){let x=p.x,y=p.y,own=strength,tx=x,ty=y;
        let flowX=(Math.sin(y*8+time*.23+p.z*2)+.5*Math.sin((x+y)*9-time*.2+p.seed*4))*.095;
        let flowY=(Math.cos(x*7-time*.21+p.z*3)+.5*Math.cos((y-x)*8+time*.18+p.seed*5))*.08;
        if(own>.001){tx=0;ty=0;for(let j=0;j<3;j++){let t=p.targets[j],r=rects[j],xx=t.x,yy=t.y;
          if(j===2){
            let scale=w<=760?1.85:1;
            if(orbitMap){
              const a=((p.orbitPhi%(2*Math.PI))+2*Math.PI)%(2*Math.PI);
              const ix=Math.floor(a/(2*Math.PI)*orbitMap.w)%orbitMap.w;
              const iy=Math.min(orbitMap.h-1,Math.max(0,Math.round((p.orbitR-6)/12.9*(orbitMap.h-1))));
              const k=(iy*orbitMap.w+ix)*4;
              xx=.685+(orbitMap.data[k]/255-.5)*.67;
              yy=.5+(orbitMap.data[k+1]/255-.5)*.667;
            }
            xx=w<=760?.5+(xx-.685)*scale:xx;
            yy=(w<=760?.58:.5)+(yy-.5)*(r.width/r.height)*scale/(2.4*.667);
          }
          tx+=(r.left+xx*r.width)/w*mix[j];ty+=(r.top+yy*r.height)/h*mix[j];}tx=clamp(tx);ty=clamp(ty);}
        let dx=x-mouse.x,dy=y-mouse.y,dist=Math.sqrt(dx*dx+(dy*h/w)**2),repel=mouse.active&&dist<.11?(1-dist/.11)*.035:0;
        let edgeX=x<.02?(.02-x)*1.4:x>.98?(.98-x)*1.4:0,edgeY=y<.02?(.02-y)*1.4:y>.98?(.98-y)*1.4:0;
        let damp=Math.exp(-(1.4+own*4.2)*dt); p.vx=(p.vx+(flowX*(1-own*.94)+(tx-x)*own*10+edgeX+dx*repel)*dt)*damp;p.vy=(p.vy+(flowY*(1-own*.94)+(ty-y)*own*10+edgeY+dy*repel)*dt)*damp;p.x+=p.vx*dt;p.y+=p.vy*dt;
        if(p.x<.002){p.x=.002;p.vx=Math.abs(p.vx)*.65}else if(p.x>.998){p.x=.998;p.vx=-Math.abs(p.vx)*.65}if(p.y<.002){p.y=.002;p.vy=Math.abs(p.vy)*.65}else if(p.y>.998){p.y=.998;p.vy=-Math.abs(p.vy)*.65}
      }
      const disk=p.targets[2], diskR=disk.diskR||10, diskPhi=disk.diskPhi||0;
      // Circular orbital angular velocity in Schwarzschild coordinate time, M=1.
      const phiNow=p.orbitPhi;
      const diskTexture=phi=>.55+.25*Math.sin(3*phi+2.1*Math.log(diskR))+.2*Math.sin(11*phi-1.8*diskR);
      const illumination=Math.min(1.25,Math.max(.15,diskTexture(phiNow)/Math.max(.25,diskTexture(diskPhi))));
      const homeAmount=strength*mix[0], lineAmount=strength*mix[2], homeLight=p.targets[0].v, flowLight=Math.min(1,disk.v*illumination), alpha=p.alpha*(1-homeAmount-lineAmount)+(Math.pow(homeLight,.45)*.95)*homeAmount+(.13+flowLight*.82)*lineAmount, radius=p.radius*(1-homeAmount-lineAmount)+(.45+homeLight*1.65)*homeAmount+(.35+flowLight*.7)*lineAmount;
      const shade=Math.round(20*heroLight+229*(1-heroLight)),visibleAlpha=alpha*(stripeMode?1-lineAmount:1),tone=`rgba(${shade},${shade},${shade},${visibleAlpha})`;
      let growth=clamp((lineAmount-.24)/.65);growth=growth*growth*(3-2*growth);
      ctx.beginPath();
      if(growth>.005 && !dotOnly){
        const t=p.targets[2], r=rects[2];
        // Orient each mark along the visible disk's projected flow, with a
        // flatter angle through the broad upper and lower arcs.
        const cx=r.left+(w<=760?.5:.685)*r.width, cy=r.top+(w<=760?.58:.5)*r.height;
        const px=p.x*w-cx, py=p.y*h-cy;
        const angle=Math.atan2(-px*.28,py*2.3);
        const length=Math.min(11,Math.max(2,t.length*.72))*Math.min(1,Math.min(w,h)/650)*growth;
        const dx=Math.cos(angle)*length*.5,dy=Math.sin(angle)*length*.5;
        ctx.strokeStyle=tone;ctx.lineWidth=radius*2*(1-growth)+(.42+flowLight*.8)*growth;ctx.lineCap='round';ctx.moveTo(p.x*w-dx,p.y*h-dy);ctx.lineTo(p.x*w+dx,p.y*h+dy);ctx.stroke();
      }else{ctx.fillStyle=tone;ctx.arc(p.x*w,p.y*h,radius,0,Math.PI*2);ctx.fill();}
    }
    if(stripeMode) drawStripes(strength*mix[2],rects[2]);
    frame=requestAnimationFrame(draw);
  }
  if(button) button.addEventListener('click',()=>{enabled=!enabled;last=performance.now();button.textContent=enabled?'暂停粒子 Ⅱ':'播放粒子 ▶';button.setAttribute('aria-pressed',String(enabled));});
  document.addEventListener('visibilitychange',()=>{if(document.hidden){cancelAnimationFrame(frame)} else if(points.length){last=performance.now();frame=requestAnimationFrame(draw)}});
  fetch(story.dataset.particleSource).then(r=>{if(!r.ok)throw Error('particle data unavailable');return r.json()}).then(data=>{
    resize();const rect=figures[0].getBoundingClientRect();points=data.forms[0].map((target,i)=>{const v=data.brightness[i]||0,b=Math.pow(Math.max(0,(v-.045)/.955),.8);return{x:(rect.left+target.x*rect.width)/w,y:(rect.top+target.y*rect.height)/h,vx:0,vy:0,z:random(i+544),seed:random(i+87),targets:data.forms.map(a=>a[i]),alpha:.045+b*.95,radius:.18+b*1.42,
      orbitR:data.forms[2][i].diskR,orbitPhi:data.forms[2][i].diskPhi,orbitVr:-.008,
      orbitL:data.forms[2][i].diskR/Math.sqrt(data.forms[2][i].diskR-3)*(.965+.025*random(i+29)),
      orbitE:Math.sqrt((1-2/data.forms[2][i].diskR)*(1+(data.forms[2][i].diskR**2/(data.forms[2][i].diskR-3))*(.965+.025*random(i+29))**2/data.forms[2][i].diskR**2)+.008**2)}});document.body.classList.add('particles-ready'); if(!document.hidden)frame=requestAnimationFrame(draw);
  }).catch(()=>{if(button)button.hidden=true});
})();
