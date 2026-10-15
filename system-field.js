const canvas=document.querySelector('#system-field');
if(canvas){
  const ctx=canvas.getContext('2d',{alpha:true});
  const reduced=matchMedia('(prefers-reduced-motion: reduce)');
  const GOLD='205,160,96',SILVER='185,204,214',GREEN='104,190,145';
  const PHI=(1+Math.sqrt(5))/2,GOLDEN=Math.PI*2*(1-1/PHI);
  let w=0,h=0,dpr=1,raf=0,last=0,segments=[],tips=[],stars=[],running=true;
  const seed=()=>{let x=(innerWidth*2654435761^innerHeight*1597334677)>>>0;return()=>((x=Math.imul(x^x>>>15,1|x),x^=x+Math.imul(x^x>>>7,61|x),(x^x>>>14)>>>0)/4294967296)};
  const makeTree=(rand,x,y,a,len,depth,tone,birth=0)=>{
    if(depth<0||len<5)return;
    const bend=(rand()-.5)*.22, aa=a+bend, x2=x+Math.cos(aa)*len, y2=y+Math.sin(aa)*len;
    segments.push({x,y,x2,y2,a:aa,len,depth,tone,birth,phase:rand()});
    if(depth===0){tips.push({x:x2,y:y2,tone,phase:rand()});return;}
    const next=len/PHI, split=.28+GOLDEN*.22;
    makeTree(rand,x2,y2,aa-split,next,depth-1,tone,birth+1);
    makeTree(rand,x2,y2,aa+split,next,depth-1,tone,birth+1);
    if(depth>2&&rand()>.58)makeTree(rand,x2,y2,aa+(rand()-.5)*.18,next*.84,depth-2,tone,birth+1.4);
  };
  const rebuild=()=>{
    const rand=seed();segments=[];tips=[];stars=[];
    const compact=w<700, depth=compact?4:5, count=compact?42:92;
    for(let i=0;i<count;i++)stars.push({x:rand()*w,y:rand()*h,r:.3+rand()*1.05,p:rand()*6.28,tone:rand()>.72?'green':rand()>.5?'silver':'gold'});
    makeTree(rand,w*.02,h*.26,.10,w*(compact?.13:.095),depth,'silver');
    makeTree(rand,w*.98,h*.38,Math.PI-.12,w*(compact?.14:.105),depth,'green');
    makeTree(rand,w*.06,h*.78,-.42,w*(compact?.12:.09),depth,'green');
    makeTree(rand,w*.94,h*.72,Math.PI+.42,w*(compact?.12:.09),depth,'silver');
    if(!compact){makeTree(rand,w*.50,h*.96,-Math.PI/2,w*.075,4,'gold');makeTree(rand,w*.50,h*.04,Math.PI/2,w*.06,4,'silver');}
  };
  const resize=()=>{w=innerWidth;h=innerHeight;dpr=Math.min(devicePixelRatio||1,1.5);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);canvas.style.width=w+'px';canvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);rebuild();draw(performance.now(),true)};
  const color=t=>t==='green'?GREEN:t==='silver'?SILVER:GOLD;
  const spiral=(cx,cy,scale,time,tone,dir=1)=>{ctx.beginPath();for(let i=0;i<95;i++){const a=i*.16*dir+time*.000045*dir,r=scale*Math.pow(PHI,i/42)/PHI;const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r*.56;i?ctx.lineTo(x,y):ctx.moveTo(x,y)}ctx.strokeStyle=`rgba(${color(tone)},${tone==='gold'?.08:.12})`;ctx.lineWidth=.65;ctx.stroke()};
  const draw=(time,staticFrame=false)=>{
    ctx.clearRect(0,0,w,h);ctx.globalCompositeOperation='lighter';
    const cycle=(time%14000)/14000,grow=Math.min(1,cycle*1.85),fade=cycle>.82?1-(cycle-.82)/.18:1;
    for(const s of stars){const a=.10+.16*(.5+.5*Math.sin(time*.001+s.p));ctx.beginPath();ctx.arc(s.x,s.y,s.r,0,6.283);ctx.fillStyle=`rgba(${color(s.tone)},${a})`;ctx.fill()}
    spiral(w*.13,h*.22,w*.025,time,'silver',1);spiral(w*.87,h*.78,w*.023,time,'green',-1);spiral(w*.50,h*.52,w*.018,time,'gold',1);
    for(const s of segments){const local=Math.max(0,Math.min(1,(grow*8-s.birth)/1.15));if(local<=0)continue;const ex=s.x+(s.x2-s.x)*local,ey=s.y+(s.y2-s.y)*local,pulse=.72+.28*Math.sin(time*.0009+s.phase*8);ctx.beginPath();ctx.moveTo(s.x,s.y);ctx.quadraticCurveTo((s.x+ex)/2-Math.sin(s.a)*s.len*.08,(s.y+ey)/2+Math.cos(s.a)*s.len*.08,ex,ey);ctx.strokeStyle=`rgba(${color(s.tone)},${(.12+s.depth*.045)*pulse*fade})`;ctx.lineWidth=.5+s.depth*.13;ctx.stroke();if(local>.55){ctx.beginPath();ctx.arc(ex,ey,.7+s.depth*.08,0,6.283);ctx.fillStyle=`rgba(${color(s.tone)},${(.30+s.depth*.045)*fade})`;ctx.fill()}}
    const maxDist=Math.min(w,h)*.16;
    for(let i=0;i<tips.length;i++)for(let j=i+1;j<tips.length;j++){const a=tips[i],b=tips[j];if(a.tone!==b.tone)continue;const d=Math.hypot(a.x-b.x,a.y-b.y);if(d<maxDist){ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.strokeStyle=`rgba(${color(a.tone)},${(.065*(1-d/maxDist))*fade})`;ctx.lineWidth=.45;ctx.stroke()}}
    ctx.globalCompositeOperation='source-over';if(!staticFrame&&running&&!reduced.matches)raf=requestAnimationFrame(loop)
  };
  const loop=t=>{if(t-last<(w<700?48:32)){raf=requestAnimationFrame(loop);return}last=t;draw(t)};
  addEventListener('resize',resize,{passive:true});document.addEventListener('visibilitychange',()=>{running=!document.hidden;if(running&&!reduced.matches){cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}else cancelAnimationFrame(raf)});
  resize();if(!reduced.matches)raf=requestAnimationFrame(loop);
}
