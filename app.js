import './system-field.js';
const $ = selector => document.querySelector(selector);
const $$ = selector => [...document.querySelectorAll(selector)];
const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
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
  $('#work-count').textContent = `${count} project${count === 1 ? '' : 's'}`;
  $('#work-empty').hidden = count > 0;
  const showAll = $('#show-all');
  showAll.hidden = category !== 'all';
  showAll.setAttribute('aria-expanded', String(expanded));
  showAll.textContent = expanded ? 'Back to selected work ↖' : `Explore all ${projects.length} projects ↗`;
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

const menuButton = $('.menu-toggle');
const menu = $('#mobile-nav');
function closeMenu(restoreFocus = false) {
  menu.hidden = true;
  menuButton.setAttribute('aria-expanded','false');
  menuButton.setAttribute('aria-label','Open navigation');
  if (restoreFocus) menuButton.focus();
}
menuButton.addEventListener('click', () => {
  const open = menuButton.getAttribute('aria-expanded') !== 'true';
  menu.hidden = !open;
  menuButton.setAttribute('aria-expanded', String(open));
  menuButton.setAttribute('aria-label',open ? 'Close navigation' : 'Open navigation');
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
$('#year').textContent = new Date().getFullYear();

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
  if(!rows.length){ const message=document.createElement('p'); message.className='activity-empty'; message.textContent='No recent public repository activity was returned. Explore the source links above.'; fragment.append(message); }
  for(const row of rows){
    const item=document.createElement('div'); item.className='activity-row';
    const anchor=document.createElement('a'); anchor.href=row.html_url; anchor.target='_blank'; anchor.rel='noopener noreferrer'; anchor.textContent=row.name+' ↗';
    const language=document.createElement('span'); language.textContent=row.language;
    const time=document.createElement('time');time.dateTime=new Date(row.pushed_at).toISOString().slice(0,10);time.textContent=time.dateTime;
    item.append(anchor,language,time);fragment.append(item);
  }
  $('#activity-list').replaceChildren(fragment);
}
async function refreshActivity(force = false) {
  if(busy)return;
  const cached=readCache();
  const status=$('#github-status');
  if(cached){ showActivity(cached.rows); status.textContent='Cached GitHub activity · '+new Date(cached.time).toLocaleDateString('en-GB',{day:'numeric',month:'short'}); if(!force && Date.now()-cached.time < TTL)return; }
  busy=true;
  const button=$('#refresh-activity');button.disabled=true;button.setAttribute('aria-busy','true');
  status.textContent='Checking public GitHub activity…';
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),6000);
  try {
    const response=await fetch('https://api.github.com/users/aixaria0/repos?type=owner&sort=pushed&per_page=100',{signal:controller.signal,headers:{Accept:'application/vnd.github+json'},credentials:'omit'});
    if(!response.ok)throw Error(`GitHub returned ${response.status}`);
    const rows=validRows(await response.json());
    showActivity(rows);
    try {localStorage.setItem(CACHE_KEY,JSON.stringify({time:Date.now(),rows}));}catch{}
    status.textContent=rows.length ? 'Updated from public GitHub repositories' : 'GitHub returned no matching public activity';
  } catch {
    status.textContent=cached ? 'GitHub unavailable · showing cached activity' : 'GitHub unavailable · showing repository snapshot';
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
// A low-priority safety trigger keeps activity fresh even when an observer is delayed by a very long portfolio page.
window.addEventListener('load',()=>setTimeout(autoRefreshActivity,2200),{once:true});

// Astral motion system: deterministic, lightweight and decorative only.
document.documentElement.classList.add('js');
const astralCanvas = $('#astral-field');
if (astralCanvas) {
  const hero = astralCanvas.closest('.astral-hero');
  const ctx = astralCanvas.getContext('2d', {alpha:true});
  const GOLD='186,139,79', COOL='181,205,214', IVORY='238,232,220';
  let w=0,h=0,dpr=1,raf=0,last=0,active=true,stars=[],segments=[],nodes=[];
  let pointerX=0,pointerY=0,targetX=0,targetY=0;
  const rand=(()=>{let a=0x51a7f19d;return()=>{a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}})();
  const tree=(x,y,angle,len,depth,tone)=>{
    if(depth<0||len<4)return;
    const sway=(rand()-.5)*.09;
    const x2=x+Math.cos(angle+sway)*len, y2=y+Math.sin(angle+sway)*len;
    segments.push({x1:x,y1:y,x2,y2,phase:rand(),tone,depth,bend:(rand()-.5)*len*.38});
    if(depth===0)return;
    const spread=.24+rand()*.19, shrink=.68+rand()*.08;
    tree(x2,y2,angle-spread,len*shrink,depth-1,tone);
    tree(x2,y2,angle+spread,len*shrink,depth-1,tone);
    if(depth>2&&rand()>.56)tree(x2,y2,angle+(rand()-.5)*spread*.55,len*shrink*.82,depth-2,tone);
  };
  const rebuild=()=>{
    stars=[];segments=[];nodes=[];
    const compact=w<700||h<560;
    const starCount=compact?38:76;
    for(let i=0;i<starCount;i++)stars.push({x:rand()*w,y:rand()*h,r:.35+rand()*1.15,a:.12+rand()*.42,p:rand()*Math.PI*2});
    const depth=compact?4:5;
    tree(w*.10,h*.57,-.22,w*(compact?.14:.12),depth,'gold');
    tree(w*.90,h*.57,Math.PI+.22,w*(compact?.14:.12),depth,'cool');
    const n=compact?12:20;
    for(let i=0;i<n;i++){
      const side=i<n/2?-1:1, a=(i%(n/2))/(n/2)*Math.PI*1.35-Math.PI*.68;
      const rx=w*(compact?.24:.31), ry=h*(compact?.18:.25), cx=w*.5,cy=h*.39;
      nodes.push({x:cx+side*Math.abs(Math.cos(a))*rx*(.48+rand()*.55),y:cy+Math.sin(a)*ry*(.5+rand()*.65),p:rand(),tone:side<0?'gold':'cool'});
    }
  };
  const resize=()=>{
    const r=hero.getBoundingClientRect();w=Math.max(1,Math.round(r.width));h=Math.max(1,Math.round(r.height));dpr=Math.min(window.devicePixelRatio||1,1.5);
    astralCanvas.width=Math.round(w*dpr);astralCanvas.height=Math.round(h*dpr);astralCanvas.style.width=w+'px';astralCanvas.style.height=h+'px';ctx.setTransform(dpr,0,0,dpr,0,0);rebuild();draw(performance.now(),true);
  };
  const orbit=(cx,cy,rx,ry,rot,color,alpha,dash=[])=>{ctx.save();ctx.translate(cx+pointerX,cy+pointerY);ctx.rotate(rot);ctx.scale(1,ry/rx);ctx.beginPath();ctx.arc(0,0,rx,0,Math.PI*2);ctx.setLineDash(dash);ctx.strokeStyle=`rgba(${color},${alpha})`;ctx.lineWidth=.75;ctx.stroke();ctx.restore();ctx.setLineDash([])};
  const curve=(s,time)=>{
    const color=s.tone==='gold'?GOLD:COOL, pulse=.25+.18*Math.sin(time*.00055+s.phase*6.28);
    ctx.beginPath();const mx=(s.x1+s.x2)/2, my=(s.y1+s.y2)/2;
    ctx.moveTo(s.x1+pointerX,s.y1+pointerY);ctx.quadraticCurveTo(mx-s.bend*.18+pointerX,my+s.bend+pointerY,s.x2+pointerX,s.y2+pointerY);
    ctx.strokeStyle=`rgba(${color},${Math.max(.035,pulse*(.18+s.depth*.045))})`;ctx.lineWidth=.35+s.depth*.12;ctx.stroke();
    const t=(time*.000055+s.phase)%1, omt=1-t;
    const qx=omt*omt*s.x1+2*omt*t*(mx-s.bend*.18)+t*t*s.x2+pointerX;
    const qy=omt*omt*s.y1+2*omt*t*(my+s.bend)+t*t*s.y2+pointerY;
    ctx.beginPath();ctx.arc(qx,qy,.55+s.depth*.08,0,Math.PI*2);ctx.fillStyle=`rgba(${color},${.28+s.depth*.04})`;ctx.fill();
  };
  const draw=(time,staticFrame=false)=>{
    if(!ctx||!w||!h)return;ctx.clearRect(0,0,w,h);pointerX+=(targetX-pointerX)*.035;pointerY+=(targetY-pointerY)*.035;
    ctx.globalCompositeOperation='lighter';
    for(const s of stars){const tw=staticFrame?1:(.62+.38*Math.sin(time*.0012+s.p));ctx.beginPath();ctx.arc(s.x+pointerX*.22,s.y+pointerY*.22,s.r,0,Math.PI*2);ctx.fillStyle=`rgba(${IVORY},${s.a*tw})`;ctx.fill();}
    const cx=w*.5,cy=h*.37;
    orbit(cx,cy,w*.28,h*.13,time*.000018,GOLD,.16,[2,7]);
    orbit(cx,cy,w*.22,h*.19,-time*.000014,COOL,.11,[1,9]);
    orbit(cx,cy,w*.36,h*.09,time*.000009,IVORY,.08,[1,12]);
    for(const s of segments)curve(s,time);
    for(let i=0;i<nodes.length;i++){
      const a=nodes[i],color=a.tone==='gold'?GOLD:COOL;
      for(let j=i+1;j<nodes.length;j++){
        const b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,d=Math.hypot(dx,dy);
        if(d<w*.115 && a.tone===b.tone){ctx.beginPath();ctx.moveTo(a.x+pointerX,a.y+pointerY);ctx.lineTo(b.x+pointerX,b.y+pointerY);ctx.strokeStyle=`rgba(${color},${Math.max(0,.11-d/(w*.115)*.09)})`;ctx.lineWidth=.55;ctx.stroke();}
      }
      const glow=.6+.4*Math.sin(time*.0015+a.p*8);ctx.beginPath();ctx.arc(a.x+pointerX,a.y+pointerY,1.05+glow*.55,0,Math.PI*2);ctx.fillStyle=`rgba(${color},${.28+glow*.28})`;ctx.fill();
    }
    ctx.globalCompositeOperation='source-over';
    if(!staticFrame&&active&&!reducedMotion.matches)raf=requestAnimationFrame(loop);
  };
  const loop=time=>{if(time-last<33){raf=requestAnimationFrame(loop);return}last=time;draw(time)};
  hero.addEventListener('pointermove',e=>{const r=hero.getBoundingClientRect();targetX=(e.clientX-r.left-r.width/2)*.012;targetY=(e.clientY-r.top-r.height/2)*.012},{passive:true});
  hero.addEventListener('pointerleave',()=>{targetX=0;targetY=0},{passive:true});
  new ResizeObserver(resize).observe(hero);
  if('IntersectionObserver'in window)new IntersectionObserver(([entry])=>{active=entry.isIntersecting;if(active&&!raf&&!reducedMotion.matches)raf=requestAnimationFrame(loop);if(!active&&raf){cancelAnimationFrame(raf);raf=0;}},{threshold:.01}).observe(hero);
  document.addEventListener('visibilitychange',()=>{active=!document.hidden;if(active&&!reducedMotion.matches){if(raf)cancelAnimationFrame(raf);raf=requestAnimationFrame(loop)}else if(raf){cancelAnimationFrame(raf);raf=0}});
  resize();if(!reducedMotion.matches)raf=requestAnimationFrame(loop);
}

// Animate registry-derived metrics only when they enter the viewport.
const metricValues=$$('[data-count]');
const formatMetric=n=>new Intl.NumberFormat('en-US').format(Math.round(n));
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
