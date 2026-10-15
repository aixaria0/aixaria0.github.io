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
if('IntersectionObserver' in window){
  const activityObserver=new IntersectionObserver(entries=>{if(entries.some(e=>e.isIntersecting)){activityObserver.disconnect();refreshActivity();}},{rootMargin:'200px'});
  activityObserver.observe($('.activity-section'));
} else { window.addEventListener('load',()=>refreshActivity(),{once:true}); }
