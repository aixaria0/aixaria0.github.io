import './system-field.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
const isFa = document.documentElement.lang === 'fa';
const localeText = (en, fa) => isFa ? fa : en;
const languageFa = {Python:'پایتون',Rust:'راست',TypeScript:'تایپ‌اسکریپت',JavaScript:'جاوااسکریپت','Lean 4':'لین ۴'};
const projects = $$('[data-project]');
let category = 'all';
let expanded = false;

function filterProjects(animate = false) {
  let count = 0;
  for (const project of projects) {
    const show = category === 'all' ? expanded || project.dataset.selected === 'true' : project.dataset.categories.split('|').includes(category);
    project.hidden = !show;
    project.classList.remove('filter-enter');
    if (show) { count++; if (animate && !reducedMotion.matches) project.classList.add('filter-enter'); }
  }
  $$('.filter').forEach(button => button.setAttribute('aria-pressed', String(button.dataset.filter === category)));
  $('#work-count').textContent = isFa ? `${count.toLocaleString('fa-IR')} پروژه` : `${count} project${count === 1 ? '' : 's'}`;
  $('#work-empty').hidden = count > 0;
  const showAll = $('#show-all');
  showAll.hidden = category !== 'all';
  showAll.setAttribute('aria-expanded', String(expanded));
  showAll.textContent = expanded ? localeText('Back to selected work ↖','بازگشت به پروژه‌های برگزیده ↖') : isFa ? `دیدن همهٔ ${projects.length.toLocaleString('fa-IR')} پروژه ↗` : `Explore all ${projects.length} projects ↗`;
}
// Install handlers before revealing progressively enhanced controls.
$$('.filter').forEach(button => button.addEventListener('click', () => {
  category = button.dataset.filter;
  filterProjects(true);
}));
$('#show-all').addEventListener('click', () => {
  expanded = !expanded;
  filterProjects(true);
  if (!expanded) $('#work').scrollIntoView({behavior: reducedMotion.matches ? 'instant' : 'smooth'});
});
$('#reset-filter').addEventListener('click', () => { category = 'all'; filterProjects(); $('.filter').focus(); });
filterProjects();
$$('[data-js-only]').forEach(element => { element.hidden = false; });
$('.locale-switch').addEventListener('click', event => { if(location.hash) event.currentTarget.href=event.currentTarget.pathname+location.hash; });

const menuButton = $('.menu-toggle');
const menu = $('#mobile-nav');
function closeMenu(restoreFocus = false) {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label',localeText('Open navigation','باز کردن فهرست'));
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label',open ? localeText('Close navigation','بستن فهرست') : localeText('Open navigation','باز کردن فهرست'));
});
menu.addEventListener('click', event => { if(event.target.closest('a')) closeMenu(); });
document.addEventListener('keydown', event => { if(event.key === 'Escape' && !menu.hidden) closeMenu(true); });
document.addEventListener('click', event => { if(!menu.hidden && !event.target.closest('.site-header')) closeMenu(); });
window.matchMedia('(min-width:601px)').addEventListener('change',event=>{if(event.matches)closeMenu();});

const persianDialog = $('#persian-dialog');
$('#open-persian').addEventListener('click', () => persianDialog.showModal());
persianDialog.querySelector('.dialog-close').addEventListener('click', () => persianDialog.close());
persianDialog.addEventListener('click',event=>{
  const r=persianDialog.getBoundingClientRect();
  if(event.target === persianDialog && (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom)) persianDialog.close();
});
$('#year').textContent = isFa ? new Date().getFullYear().toLocaleString('fa-IR',{useGrouping:false}) : new Date().getFullYear();

if ('IntersectionObserver' in window) {
  const navObserver = new IntersectionObserver(entries=>{
    for(const entry of entries) if(entry.isIntersecting) {
      $$('.desktop-nav a[href^="#"]').forEach(a=>{ if(a.hash === '#'+entry.target.id)a.setAttribute('aria-current','location');else a.removeAttribute('aria-current'); });
    }
  },{rootMargin:'-15% 0px -60% 0px',threshold:0});
  $$('section[id]').forEach(section=>navObserver.observe(section));
}

const CACHE_KEY = 'sunaria-public-activity-v1';
const TTL = 15 * 60 * 1000;
const MAX_AGE = 7 * 24 * 60 * 60 * 1000;
let busy = false;
const allowedRepositories = new Map(projects.map(p => {
  const source=p.querySelector('.project-links a');
  return [new URL(source.href).pathname.toLowerCase().replace(/\/$/,''), source.href];
}));
function readCache() {
  try {
    const cache=JSON.parse(localStorage.getItem(CACHE_KEY));
    if(!cache || !Array.isArray(cache.rows) || !Number.isFinite(cache.time) || cache.time > Date.now() || Date.now()-cache.time > MAX_AGE)return null;
    return {...cache,rows:validRows(cache.rows)};
  } catch { return null; }
}
function validRows(rows) {
  if(!Array.isArray(rows)) throw Error('Invalid activity response');
  return rows.filter(row=>{
    try { const u=new URL(row.html_url); return u.origin==='https://github.com' && allowedRepositories.has(u.pathname.toLowerCase().replace(/\/$/,'')) && row.private===false && typeof row.name==='string' && Number.isFinite(Date.parse(row.pushed_at)); } catch { return false; }
  }).map(row=>({name:row.name,html_url:row.html_url,private:false,pushed_at:row.pushed_at,language:typeof row.language==='string' ? row.language : 'Source'}))
    .sort((a,b)=>Date.parse(b.pushed_at)-Date.parse(a.pushed_at)).slice(0,4);
}
function showActivity(rows) {
  const fragment=document.createDocumentFragment();
  if(!rows.length){ const message=document.createElement('p'); message.className='activity-empty'; message.textContent=localeText('No recent public repository activity was returned. Explore the source links above.','فعالیت عمومی تازه‌ای دریافت نشد. برای بررسی، به پیوندهای مخزن مراجعه کنید.'); fragment.append(message); }
  for(const row of rows){
    const item=document.createElement('div'); item.className='activity-row';
    const anchor=document.createElement('a'); anchor.href=row.html_url; anchor.target='_blank'; anchor.rel='noopener noreferrer';
    if(isFa){const name=document.createElement('bdi');name.dir='ltr';name.textContent=row.name;anchor.append(name,document.createTextNode(' ↗'));}else anchor.textContent=row.name+' ↗';
    const language=document.createElement('span'); language.textContent=isFa?(languageFa[row.language]||(row.language==='Source'?'کد':row.language)):row.language;
    if(isFa&&!languageFa[row.language]&&row.language!=='Source')language.dir='ltr';
    const time=document.createElement('time');time.dateTime=new Date(row.pushed_at).toISOString().slice(0,10);time.textContent=time.dateTime;time.dir='ltr';
    item.append(anchor,language,time);fragment.append(item);
  }
  $('#activity-list').replaceChildren(fragment);
}
async function refreshActivity(force = false) {
  if(busy)return;
  const cached=readCache();
  const status=$('#github-status');
  if(cached){ showActivity(cached.rows); status.textContent=localeText('Cached GitHub activity · ','فعالیت ذخیره‌شدهٔ گیت‌هاب · ')+new Date(cached.time).toLocaleDateString(isFa?'fa-IR-u-ca-gregory':'en-GB',{day:'numeric',month:'short'}); if(!force && Date.now()-cached.time < TTL)return; }
  busy=true;
  const button=$('#refresh-activity');button.disabled=true;button.setAttribute('aria-busy','true');
  status.textContent=localeText('Checking public GitHub activity…','در حال بررسی فعالیت عمومی گیت‌هاب…');
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6000);
  try {
    const response=await fetch('https://api.github.com/users/aixaria0/repos?type=owner&sort=pushed&per_page=100',{signal:controller.signal,headers:{Accept:'application/vnd.github+json'},credentials:'omit'});
    if(!response.ok)throw Error(`GitHub returned ${response.status}`);
    const rows=validRows(await response.json());
    showActivity(rows);
    try {localStorage.setItem(CACHE_KEY,JSON.stringify({time:Date.now(),rows}));}catch{}
    status.textContent=rows.length ? localeText('Updated from public GitHub repositories','فعالیت مخزن‌های عمومی گیت‌هاب به‌روز شد') : localeText('GitHub returned no matching public activity','فعالیت عمومیِ منطبق در گیت‌هاب پیدا نشد');
  } catch {
    status.textContent=cached ? localeText('GitHub unavailable · showing cached activity','گیت‌هاب در دسترس نیست · نمایش داده‌های ذخیره‌شده') : localeText('GitHub unavailable · showing repository snapshot','گیت‌هاب در دسترس نیست · نمایش نمای ثبت‌شدهٔ مخزن‌ها');
  } finally {
    clearTimeout(timeout);busy=false;button.disabled=false;button.removeAttribute('aria-busy');
  }
}
$('#refresh-activity').addEventListener('click',()=>refreshActivity(true));
// Below-the-fold metadata never competes with the initial render.
let activityAutoRequested=false;
const autoRefreshActivity=()=>{if(activityAutoRequested)return;activityAutoRequested=true;refreshActivity();};
if('IntersectionObserver' in window){
  const activityObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){activityObserver.disconnect();autoRefreshActivity();}},{rootMargin:'200px'});
  activityObserver.observe($('.activity-section'));
} else { window.addEventListener('load',autoRefreshActivity,{once:true}); }
// Motion is tied to visibility; the first paint has no network dependency.
document.documentElement.classList.add('js');
const motionTargets=$$('.research-instruments .instrument, .project.featured');
if('IntersectionObserver' in window){
  const motionObserver=new IntersectionObserver(entries=>{
    for(const entry of entries)entry.target.classList.toggle('motion-visible',entry.isIntersecting);
  },{rootMargin:'80px'});
  motionTargets.forEach(element=>motionObserver.observe(element));
}else motionTargets.forEach(element=>element.classList.add('motion-visible'));

// Astral motion: a deterministic causal DAG sits behind Fibonacci growth.
const astralCanvas = $('#astral-field');
if (astralCanvas) {
  const hero = astralCanvas.closest('.astral-hero');
  const ctx = astralCanvas.getContext('2d', {alpha:true, desynchronized:true});
  const GOLD='190,142,79', COOL='182,207,219', GREEN='104,184,139', IVORY='239,232,219';
  const PHI=(1+Math.sqrt(5))/2, GOLDEN=Math.PI*(3-Math.sqrt(5));
  const coarse=matchMedia('(pointer:coarse)').matches, compact=()=>innerWidth<760||innerHeight<560;
  let w=0,h=0,dpr=1,raf=0,last=0,active=false,heroVisible=true,stars=[],segments=[],nodes=[],links=[],causal=[];
  let pointerX=0,pointerY=0,targetX=0,targetY=0,frameMs=16.6;
  const rand=(()=>{let a=0x51a7f19d;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();
  const tree=(x,y,angle,len,depth,tone,birth=0)=>{
    if(depth<0||len<4)return;
    const sway=(rand()-.5)*.075, a=angle+sway, x2=x+Math.cos(a)*len, y2=y+Math.sin(a)*len;
    segments.push({x1:x,y1:y,x2,y2,phase:rand(),tone,depth,birth,bend:(rand()-.5)*len*.34});
    if(depth===0)return;
    const spread=.27+GOLDEN*.11+(rand()-.5)*.08, shrink=.68+.05*rand();
    tree(x2,y2,a-spread,len*shrink,depth-1,tone,birth+1);
    tree(x2,y2,a+spread,len*shrink,depth-1,tone,birth+1);
    if(depth>2&&rand()>.63)tree(x2,y2,a+(rand()-.5)*spread*.5,len*shrink*.80,depth-2,tone,birth+1.35);
  };
  const rebuild=()=>{
    stars=[];segments=[];nodes=[];links=[];causal=[];
    const small=compact(), starCount=small?34:78, depth=small?4:5;
    for(let i=0;i<starCount;i++)stars.push({x:rand()*w,y:rand()*h,r:.3+rand()*.95,a:.10+rand()*.32,p:rand()*6.283});
    tree(w*.012,h*.36,-.08,w*(small?.22:.205),depth,'gold');
    tree(w*.03,h*.61,-.28,w*(small?.18:.17),depth,'gold');
    if(!small)tree(w*.12,h*.26,.10,w*.125,5,'gold');
    tree(w*.988,h*.36,Math.PI+.08,w*(small?.22:.205),depth,'cool');
    tree(w*.97,h*.61,Math.PI+.28,w*(small?.18:.17),depth,'cool');
    if(!small)tree(w*.88,h*.26,Math.PI-.10,w*.125,5,'green');
    const n=small?14:24;
    for(let i=0;i<n;i++){
      const side=i<n/2?-1:1, q=i%(n/2), a=q*GOLDEN;
      const rx=w*(small?.23:.30), ry=h*(small?.17:.24), cx=w*.5,cy=h*.38;
      nodes.push({x:cx+side*Math.abs(Math.cos(a))*rx*(.48+rand()*.5),y:cy+Math.sin(a)*ry*(.48+rand()*.55),p:rand(),tone:side<0?'gold':(q%3===0?'green':'cool')});
    }
    const max=w*.12;
    for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],d=Math.hypot(a.x-b.x,a.y-b.y);
      if(d<max&&(a.tone===b.tone||rand()>.86))links.push({a,b,d,max,tone:a.tone});
    }
    if(!small){
      // Edges always advance in column order. Cross-lane messages merge at later events.
      for(const side of [0,1]){
        const xs=side ? [.79,.85,.92,.985] : [.015,.08,.15,.21];
        const tone=side ? COOL : GOLD;
        for(let lane=0;lane<4;lane++){
          const y=h*(.18+lane*.082);
          for(let col=0;col<3;col++){
            causal.push({x1:w*xs[col],y1:y,x2:w*xs[col+1],y2:y,tone,phase:(col+lane*.31)/5});
          }
        }
        for(let lane=0;lane<3;lane++){
          causal.push({x1:w*xs[1],y1:h*(.18+lane*.082),x2:w*xs[2],y2:h*(.18+(lane+1)*.082),tone,phase:(lane+.4)/4});
        }
      }
    }
  };
  const resize=()=>{
    const r=hero.getBoundingClientRect();w=Math.max(1,Math.round(r.width));h=Math.max(1,Math.round(r.height));
    dpr=Math.min(devicePixelRatio||1,compact()?1:1.25);frameMs=compact()?33:0;
    astralCanvas.width=Math.round(w*dpr);astralCanvas.height=Math.round(h*dpr);astralCanvas.style.width=w+'px';astralCanvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);rebuild();draw(performance.now(),true);
  };
  const col=t=>t==='gold'?GOLD:t==='green'?GREEN:COOL;
  const orbit=(cx,cy,rx,ry,rot,color,alpha,dash=[])=>{ctx.save();ctx.translate(cx+pointerX,cy+pointerY);ctx.rotate(rot);ctx.scale(1,ry/rx);ctx.beginPath();ctx.arc(0,0,rx,0,6.283);ctx.setLineDash(dash);ctx.strokeStyle=`rgba(${color},${alpha})`;ctx.lineWidth=.72;ctx.stroke();ctx.restore();ctx.setLineDash([])};
  const curve=(s,time,grow)=>{
    const local=Math.max(0,Math.min(1,(grow*8-s.birth)/1.1));if(local<=0)return;
    const color=col(s.tone), pulse=.56+.22*Math.sin(time*.0007+s.phase*6.28), ex=s.x1+(s.x2-s.x1)*local, ey=s.y1+(s.y2-s.y1)*local;
    const mx=(s.x1+ex)/2,my=(s.y1+ey)/2,b=s.bend*local;
    ctx.beginPath();ctx.moveTo(s.x1+pointerX,s.y1+pointerY);ctx.quadraticCurveTo(mx-b*.18+pointerX,my+b+pointerY,ex+pointerX,ey+pointerY);ctx.strokeStyle=`rgba(${color},${(.30+s.depth*.045)*pulse})`;ctx.lineWidth=.45+s.depth*.12;ctx.stroke();
    if(local>.92&&s.depth<=1){ctx.beginPath();ctx.arc(ex+pointerX,ey+pointerY,.75,0,6.283);ctx.fillStyle=`rgba(${color},.72)`;ctx.fill();}
  };
  const draw=(time,staticFrame=false)=>{
    if(!ctx||!w||!h)return;ctx.clearRect(0,0,w,h);pointerX+=(targetX-pointerX)*.045;pointerY+=(targetY-pointerY)*.045;ctx.globalCompositeOperation='lighter';
    for(const s of stars){const tw=staticFrame?1:(.68+.32*Math.sin(time*.0011+s.p));ctx.beginPath();ctx.arc(s.x+pointerX*.18,s.y+pointerY*.18,s.r,0,6.283);ctx.fillStyle=`rgba(${IVORY},${s.a*tw})`;ctx.fill();}
    const cx=w*.5,cy=h*.37,cycle=(time%12000)/12000,grow=cycle<.72?Math.min(1,cycle/.54):1;
    orbit(cx,cy,w*.29,h*.13,time*.000014,GOLD,.15,[2,8]);orbit(cx,cy,w*.225,h*.19,-time*.000011,COOL,.10,[1,10]);orbit(cx,cy,w*.355,h*.09,time*.000007,GREEN,.065,[1,14]);
    for(const s of segments)curve(s,time,grow);
    for(const l of links){const alpha=.035*(1-l.d/l.max);ctx.beginPath();ctx.moveTo(l.a.x+pointerX,l.a.y+pointerY);ctx.lineTo(l.b.x+pointerX,l.b.y+pointerY);ctx.strokeStyle=`rgba(${col(l.tone)},${alpha})`;ctx.lineWidth=.45;ctx.stroke();}
    for(const a of nodes){const c=col(a.tone),glow=.6+.4*Math.sin(time*.0013+a.p*8);ctx.beginPath();ctx.arc(a.x+pointerX,a.y+pointerY,.95+glow*.38,0,6.283);ctx.fillStyle=`rgba(${c},${.28+glow*.24})`;ctx.fill();}
    for(const e of causal){
      ctx.beginPath();ctx.moveTo(e.x1,e.y1);ctx.lineTo(e.x2,e.y2);
      ctx.strokeStyle=`rgba(${e.tone},.14)`;ctx.lineWidth=.7;ctx.stroke();
      const progress=staticFrame?.48:(time*.00016+e.phase)%1;
      ctx.beginPath();ctx.arc(e.x1+(e.x2-e.x1)*progress,e.y1+(e.y2-e.y1)*progress,1.35,0,6.283);
      ctx.fillStyle=`rgba(${e.tone},.43)`;ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';if(!staticFrame&&active&&!reducedMotion.matches)raf=requestAnimationFrame(loop);
  };
  const loop=time=>{if(frameMs&&time-last<frameMs){raf=requestAnimationFrame(loop);return}last=time;draw(time)};
  const syncMotion=()=>{
    const shouldRun=heroVisible&&!document.hidden&&!reducedMotion.matches&&!navigator.connection?.saveData;
    active=shouldRun;
    if(active&&!raf)raf=requestAnimationFrame(loop);
    if(!active&&raf){cancelAnimationFrame(raf);raf=0;}
  };
  if(!coarse)hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();targetX=(e.clientX-r.left-r.width/2)*.010;targetY=(e.clientY-r.top-r.height/2)*.010},{passive:true});
  hero.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});
  let resizeFrame=0;
  const scheduleResize=()=>{if(!resizeFrame)resizeFrame=requestAnimationFrame(()=>{resizeFrame=0;resize()})};
  if('ResizeObserver'in window)new ResizeObserver(scheduleResize).observe(hero);
  else window.addEventListener('resize',scheduleResize,{passive:true});
  if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{heroVisible=entry.isIntersecting;syncMotion()},{threshold:.01}).observe(hero);
  document.addEventListener('visibilitychange',syncMotion);
  reducedMotion.addEventListener?.('change',()=>{draw(performance.now(),true);syncMotion()});
  resize();syncMotion();
}

// Animate registry-derived metrics only when they enter the viewport.
const metricValues=$$('[data-count]');
const formatMetric=n=>new Intl.NumberFormat(isFa?'fa-IR':'en-US').format(Math.round(n));
const animateMetric=el=>{
  const end=Number(el.dataset.count);if(!Number.isFinite(end)||reducedMotion.matches){el.textContent=formatMetric(end||0);return}
  const start=performance.now(),duration=780;
  const tick=now=>{const p=Math.min(1,(now-start)/duration),e=1-Math.pow(1-p,3);el.textContent=formatMetric(end*e);if(p<1)requestAnimationFrame(tick)};requestAnimationFrame(tick);
};
if('IntersectionObserver'in window&&metricValues.length){const io=new IntersectionObserver(entries=>{for(const entry of entries)if(entry.isIntersecting){animateMetric(entry.target);io.unobserve(entry.target)}},{threshold:.45});metricValues.forEach(el=>io.observe(el))}else metricValues.forEach(el=>animateMetric(el));

// Repository atlas filters keep all public work visible by default.
const atlasCards=$$('.atlas-card[data-family]');
$$('[data-atlas-filter]').forEach(button=>button.addEventListener('click',()=>{
  const family=button.dataset.atlasFilter;
  $$('[data-atlas-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));
  for(const card of atlasCards)card.hidden=family!=='all'&&card.dataset.family!==family;
}));
