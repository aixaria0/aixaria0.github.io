const $ = (s, root=document) => root.querySelector(s);
const $$ = (s, root=document) => [...root.querySelectorAll(s)];
const data = await fetch('./data/registry.json', {cache:'no-store'}).then(r => { if(!r.ok) throw new Error(`registry data ${r.status}`); return r.json(); });

const labels = {
  'chimera-evidence-runtime':'CHIMERA / Evidence Runtime',
  'rchain-assurance':'RChain / Assurance',
  'quantum-formal':'Quantum / Formal',
  'research-operations':'Research Operations',
  'intelligence-security':'Intelligence / Security',
  'cultural-consumer':'Cultural Systems',
  'quantitative-systems':'Quantitative Systems',
  'registry-meta':'Registry / Meta',
  'legacy-scratch':'Legacy / Scratch'
};
const compact = n => new Intl.NumberFormat('en',{notation:'compact',maximumFractionDigits:1}).format(n ?? 0);
const num = n => new Intl.NumberFormat('en').format(n ?? 0);
const esc = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const state = {family:'all', query:''};

function renderHero(){
  const m=data.summary, e=data.engineering;
  const items=[
    [e.merged_prs,'MERGED PRS'],
    [e.authored_commits,'AUTHORED COMMITS'],
    [e.reviews,'PR REVIEWS'],
    [e.owned_repositories,'OWNED REPOSITORIES']
  ];
  $('#heroMetrics').innerHTML=items.map(([v,l])=>`<div class="metric"><b>${num(v)}</b><span>${l}</span></div>`).join('');
  $('#evidenceStats').innerHTML=[
    [e.test_artifacts,'TEST ARTIFACTS'],[e.negative_control_artifacts,'NEGATIVE CONTROLS'],[e.formal_artifacts,'FORMAL ARTIFACTS'],[e.evidence_artifacts,'EVIDENCE ARTIFACTS']
  ].map(([v,l])=>`<div class="estat"><b>${num(v)}</b><span>${l}</span></div>`).join('');
  $('#contribSummary').innerHTML=[
    [m.external_authored_prs,'AUTHORED'],[m.external_merged_prs,'MERGED'],[m.external_reviewed_prs,'REVIEWS']
  ].map(([v,l])=>`<div class="pill-stat"><b>${num(v)}</b><span>${l}</span></div>`).join('');
  $('#buildStamp').textContent='BUILD '+new Date(data.built_at).toISOString().slice(0,10);
}

function projectText(p){return [p.name,p.description,p.positioning,p.family,...(p.capabilities||[]),...(p.technology||[])].join(' ').toLowerCase()}
function visibleProjects(){
  let rows=data.projects.filter(p=>state.family==='all'||p.family===state.family);
  if(state.query){const q=state.query.toLowerCase().trim();rows=rows.filter(p=>projectText(p).includes(q))}
  return rows.sort((a,b)=>(a.resume_priority??999)-(b.resume_priority??999)||(b.evidence_surface?.score||0)-(a.evidence_surface?.score||0)||new Date(b.last_pushed_at||0)-new Date(a.last_pushed_at||0));
}

function renderFilters(){
  const families=[...new Set(data.projects.map(p=>p.family))].sort();
  $('#familyFilters').innerHTML=[['all','ALL'],...families.map(f=>[f,labels[f]||f])].map(([f,l])=>`<button class="filter ${state.family===f?'active':''}" data-family="${esc(f)}">${esc(l)}</button>`).join('');
  $$('.filter').forEach(b=>b.addEventListener('click',()=>{state.family=b.dataset.family;renderFilters();renderProjects()}));
}

function facetDots(p){
  const facets=p.evidence_surface?.facets||{};
  const keys=['ci','tests','evidence_artifacts','negative_controls','formal_artifacts'];
  return keys.map(k=>facets[k]?'●':'○').join(' ');
}
function renderProjects(){
  const rows=visibleProjects();
  $('#visibleCount').textContent=rows.length;
  $('#emptyState').hidden=rows.length>0;
  $('#projectGrid').innerHTML=rows.map(p=>{
    const tech=(p.technology||[]).slice(0,4).map(t=>`<span class="chip">${esc(t)}</span>`).join('');
    const score=p.evidence_surface?.score??0, max=p.evidence_surface?.max_score??14;
    const live=p.live_url?`<a class="card-live" href="${esc(p.live_url)}" target="_blank" rel="noreferrer" data-live-link>LIVE SITE ↗</a>`:'';
    return `<article class="project-card ${p.live_url?'has-live':''}" data-id="${esc(p.id)}" tabindex="0">
      <div class="project-top"><span class="family">${esc(labels[p.family]||p.family)}</span><span class="score">E ${score}/${max}</span></div>
      <h3>${esc(p.name)}</h3><p class="desc">${esc(p.positioning||p.description||'Evidence-bounded engineering project.')}</p>
      <div class="chips">${tech}</div>
      <div class="project-foot"><span>${facetDots(p)}</span><span>${live||`${esc(p.relation||'project')} ↗`}</span></div>
    </article>`
  }).join('');
  $$('.project-card').forEach(card=>{
    const open=()=>showProject(data.projects.find(p=>p.id===card.dataset.id));
    card.addEventListener('click',e=>{if(e.target.closest('[data-live-link]'))return;open()});card.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' ')open()});
  });
}
function list(items){return `<ul>${(items||[]).map(x=>`<li>${esc(x)}</li>`).join('')}</ul>`}
function showProject(p){
  if(!p)return;
  const tech=(p.technology||[]).slice(0,10).map(t=>`<span class="chip">${esc(t)}</span>`).join('');
  $('#dialogBody').innerHTML=`<div class="dialog-content">
    <p class="eyebrow">${esc(labels[p.family]||p.family)} / ${esc(p.relation||'PROJECT')}</p>
    <h3>${esc(p.name)}</h3><p>${esc(p.positioning||p.description||'')}</p>
    <div class="chips">${tech}</div>
    <div class="dialog-grid"><div class="dialog-box"><h4>CAPABILITIES</h4>${list(p.capabilities)}</div><div class="dialog-box"><h4>BOUNDARIES</h4>${list(p.boundaries)}</div></div>
    <div class="dialog-box"><h4>EVIDENCE SURFACE</h4><p style="color:#aaa;font:12px var(--mono)">score ${p.evidence_surface?.score??0}/${p.evidence_surface?.max_score??14} · ${(p.evidence_surface?.observed_facet_count??0)} observed facets · ${(p.activity?.merged_authored_prs??0)} merged authored PRs in repository</p></div>
    <div class="dialog-links">
      ${p.live_url?`<a class="dialog-link live-primary" href="${esc(p.live_url)}" target="_blank" rel="noreferrer">${esc(p.label||'OPEN LIVE SITE')} ↗</a>`:''}
      ${(p.related_repositories||[]).map(r=>`<a class="dialog-link" href="${esc(r.url)}" target="_blank" rel="noreferrer">${esc(r.label)} ↗</a>`).join('')}
      <a class="dialog-link" href="${esc(p.repository_url)}" target="_blank" rel="noreferrer">SOURCE REPOSITORY ↗</a>
    </div>
  </div>`;
  $('#projectDialog').showModal();
}

function renderContributions(){
  $('#contribRows').innerHTML=data.contributions.map(c=>`<tr><td>${esc(c.repository)}</td><td>${num(c.authored_prs)}</td><td>${num(c.merged_authored_prs)}</td><td>${num(c.open_authored_prs)}</td><td>${num(c.reviewed_prs)}</td><td>+${compact(c.additions)} / -${compact(c.deletions)}</td></tr>`).join('');
}

function renderImpact(){
  const e=data.engineering, r=data.rchain_impact;
  const cards=[
    {k:'01 / UPSTREAM ACCEPTANCE',v:r.merged_prs,t:'RChain merged PRs',d:`${num(r.authored_prs)} authored · ${num(r.reviews)} reviews · +${num(r.additions)} / −${num(r.deletions)} lines across ${num(r.changed_files)} changed files`},
    {k:'02 / ACCEPTED CHANGE',v:e.merged_prs,t:'Merged authored PRs',d:`${num(e.authored_prs)} authored PRs across owned and external repositories`},
    {k:'03 / AUTOMATION',v:e.checked_ci_workflows,t:'Checked-in CI workflows',d:`${num(e.registered_workflows)} registered workflows · ${num(e.sampled_actions_runs)} sampled Actions runs`},
    {k:'04 / VERIFICATION',v:e.test_artifacts,t:'Test artifacts',d:`${num(e.formal_artifacts)} formal · ${num(e.negative_control_artifacts)} negative-control · ${num(e.fuzz_property_artifacts)} fuzz/property artifacts`}
  ];
  $('#impactGrid').innerHTML=cards.map(c=>`<article class="impact-card"><span>${esc(c.k)}</span><b class="impact-value">${num(c.v)}</b><h3>${esc(c.t)}</h3><p>${esc(c.d)}</p></article>`).join('');
}

function renderRChainStack(){
  const order=[
    ['rchain-complier','01','ASSURANCE ENGINE','STRESS / REPLAY','Adversarial workloads, deterministic replay, fault paths, and bounded verdicts.'],
    ['rlsenti','02','EVIDENCE COMPILER','STRUCTURE EVIDENCE','Normalizes artifacts into linked witness envelopes, replay traces, and explicit claim boundaries.'],
    ['rchain-sentinel','03','BLOCK FORENSICS','INSPECT CLAIMS','Cross-node observation, fingerprints, conflict detection, and “why this block?” evidence.'],
    ['sovereign-lattice','04','CONSENSUS PLANE','QUORUM / PROVABILITY','PBFT-shaped quorum reasoning, BLS certificate paths, leader rotation, and selected formal invariants.']
  ];
  const rows=order.map(([id,n,role,verb,desc])=>({...(data.projects.find(p=>p.id===id)||{}),id,n,role,verb,desc}));
  $('#rchainLiveCount').textContent=`${rows.filter(p=>p.live_url).length} / ${rows.length}`;
  $('#rchainStack').innerHTML=rows.map((p,i)=>`<article class="rchain-node" data-stack="${esc(p.id)}">
    <div class="rchain-node-top"><span>${esc(p.n)} / ${esc(p.role)}</span><em>${p.live_url?'LIVE':'SOURCE'}</em></div>
    <h3>${esc(p.name||p.id)}</h3>
    <strong>${esc(p.verb)}</strong>
    <p>${esc(p.desc)}</p>
    <div class="rchain-node-evidence"><span>E ${p.evidence_surface?.score??0}/${p.evidence_surface?.max_score??14}</span><span>${p.activity?.merged_authored_prs??0} MERGED PRS</span></div>
    <div class="rchain-node-links">${p.live_url?`<a href="${esc(p.live_url)}" target="_blank" rel="noreferrer">OPEN LIVE ↗</a>`:''}<a href="${esc(p.repository_url||'#')}" target="_blank" rel="noreferrer">SOURCE ↗</a></div>
    ${i<rows.length-1?'<i class="rchain-flow" aria-hidden="true"><b></b></i>':''}
  </article>`).join('');
}

function renderFootprint(){
  const e=data.engineering;
  const metrics=[
    [e.owned_repositories,'OWNED REPOSITORIES',`${e.public_repositories} public / ${e.private_repositories} private`],
    [e.authored_commits,'AUTHORED COMMITS','default branches'],
    [e.authored_prs,'AUTHORED PRS','owned + external'],
    [e.merged_prs,'MERGED PRS','accepted change'],
    [e.reviews,'PR REVIEWS','excluding authored'],
    [e.authored_issues,'ISSUES','authored'],
    [e.checked_ci_workflows,'CI WORKFLOW FILES','checked-in'],
    [e.sampled_actions_runs,'ACTIONS RUNS','sampled'],
    [e.test_artifacts,'TEST ARTIFACTS','observed'],
    [e.formal_artifacts,'FORMAL ARTIFACTS','artifact presence'],
    [e.negative_control_artifacts,'NEGATIVE CONTROLS','adversarial surface'],
    [e.benchmark_artifacts,'BENCHMARK ARTIFACTS','observed'],
    [e.fuzz_property_artifacts,'FUZZ / PROPERTY','artifacts'],
    [e.evidence_artifacts,'EVIDENCE ARTIFACTS','receipts / traces / proofs'],
    [e.source_files,'SOURCE TREE FILES','across owned repositories']
  ];
  $('#footprintGrid').innerHTML=metrics.map(([v,l,n])=>`<div class="footprint-stat"><b class="footprint-value">${num(v)}</b><span>${esc(l)}</span><small>${esc(n)}</small></div>`).join('');
  const total=(e.top_languages||[]).reduce((n,x)=>n+(x.bytes||0),0)||1;
  $('#languageBars').innerHTML=(e.top_languages||[]).slice(0,6).map(x=>`<div class="lang-row"><div><b>${esc(x.language)}</b><span>${compact(x.bytes)}B</span></div><i><em style="width:${Math.max(2,(x.bytes/total)*100)}%"></em></i></div>`).join('');
  $('#upstreamDelta').innerHTML=`<p class="eyebrow">EXTERNAL PR CODE DELTA</p><div class="delta-numbers"><b>+${num(e.upstream_additions)}</b><b>−${num(e.upstream_deletions)}</b></div><p>${num(e.upstream_changed_files)} changed files across externally attributed authored PRs.</p><small>This is an upstream PR delta, not a total authored LOC claim.</small>`;
}

function renderPrivateWork(){
  const rows=(data.private_projects||[]);
  const featured=rows.filter(x=>x.featured).sort((a,b)=>(a.featured_rank??999)-(b.featured_rank??999));
  $('#privateFeatured').innerHTML=featured.map(p=>`<article class="private-card ${p.live_url?'has-live-artifact':''}"><div class="private-top"><span>PRIVATE SOURCE</span><em>${esc(p.evidence_grade)}</em></div><h3>${esc(p.name)}</h3><p>${esc(p.note||'Private research system.')}</p>${p.live_url?`<a class="private-live" href="${esc(p.live_url)}" target="_blank" rel="noreferrer">${esc(p.live_label||'OPEN LIVE ARTIFACT')} ↗</a>`:''}<div class="private-meta"><span>${esc(labels[p.family]||p.family)}</span><span>${esc(p.status)} / ${esc(p.relation)}</span></div></article>`).join('');
  $('#privateCount').textContent=num(rows.length);
  $('#privateIndex').innerHTML=rows.map(p=>p.live_url?`<a class="private-chip live-artifact" href="${esc(p.live_url)}" target="_blank" rel="noreferrer"><i></i><span>${esc(p.name)}</span><small>LIVE ↗</small></a>`:`<div class="private-chip"><i></i><span>${esc(p.name)}</span><small>${esc(labels[p.family]||p.family)}</small></div>`).join('');
}

function renderFullIndex(){
  const rows=data.full_index||[];
  $('#allRepoCount').textContent=num(rows.length);
  $('#fullRepoIndex').innerHTML=rows.map(p=>{
    const inner=`<div class="repo-index-name"><b>${esc(p.name)}</b><span>${esc(p.visibility.toUpperCase())}</span></div><div class="repo-index-meta"><span>${esc(labels[p.family]||p.family)}</span><span>${esc(p.status)} · ${esc(p.evidence_grade)}</span></div>`;
    if(p.live_url)return `<a class="repo-index-row ${p.visibility==='public'?'public':'private private-live-row'}" href="${esc(p.live_url)}" target="_blank" rel="noreferrer">${inner}<em>LIVE ARTIFACT ↗</em></a>`;
    return p.repository_url?`<a class="repo-index-row public" href="${esc(p.repository_url)}" target="_blank" rel="noreferrer">${inner}<em>SOURCE ↗</em></a>`:`<div class="repo-index-row private">${inner}<em>SOURCE PRIVATE</em></div>`;
  }).join('');
}

$('#searchInput').addEventListener('input',e=>{state.query=e.target.value;renderProjects()});
document.addEventListener('keydown',e=>{if(e.key==='/'&&!['INPUT','TEXTAREA'].includes(document.activeElement.tagName)){e.preventDefault();$('#searchInput').focus()}if(e.key==='Escape'&&$('#projectDialog').open)$('#projectDialog').close();if(e.key==='Escape'&&$('#persianDialog')?.open)$('#persianDialog').close()});
$('.dialog-close').addEventListener('click',()=>$('#projectDialog').close());
$('#projectDialog').addEventListener('click',e=>{if(e.target===$('#projectDialog'))$('#projectDialog').close()});
$('#openPersian')?.addEventListener('click',()=>$('#persianDialog').showModal());
$('.persian-close')?.addEventListener('click',()=>$('#persianDialog').close());
$('#persianDialog')?.addEventListener('click',e=>{if(e.target===$('#persianDialog'))$('#persianDialog').close()});

renderHero();renderImpact();renderFilters();renderProjects();renderRChainStack();renderFootprint();renderPrivateWork();renderFullIndex();renderContributions();

// --- motion / interaction layer -------------------------------------------
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function initSystemsField(){
  if(reduceMotion) return;
  const canvas=document.createElement('canvas');
  canvas.className='systems-canvas';
  canvas.setAttribute('aria-hidden','true');
  document.body.prepend(canvas);
  const ctx=canvas.getContext('2d',{alpha:true});
  let w=innerWidth,h=innerHeight,dpr=1,last=0,segments=[],nodes=[];
  const mobile=()=>innerWidth<700;
  const tablet=()=>innerWidth>=700&&innerWidth<1150;
  const seeded=(n)=>{const x=Math.sin(n*999.91)*43758.5453;return x-Math.floor(x)};

  function makeFractal(){
    segments=[];
    const depth=mobile()?8:tablet()?9:10; // 511 / 1023 / 2047 line segments
    const startX=w*(mobile()?.18:.12), startY=h*.96;
    const initial=Math.min(w,h)*(mobile()?.20:.24);
    let serial=1;
    const branch=(x,y,len,angle,d)=>{
      if(d<0) return;
      const nx=x+Math.cos(angle)*len, ny=y+Math.sin(angle)*len;
      segments.push({x,y,nx,ny,d,idx:serial++});
      if(d===0) return;
      const spread=.34+(seeded(serial)*.12-.06);
      const shrink=.72+(seeded(serial+7)*.055-.027);
      branch(nx,ny,len*shrink,angle-spread,d-1);
      branch(nx,ny,len*shrink,angle+spread,d-1);
    };
    branch(startX,startY,initial,-Math.PI/2,depth);
  }

  function makeConsensus(){
    const count=mobile()?18:tablet()?28:42;
    nodes=Array.from({length:count},(_,i)=>({
      x:seeded(i+13)*w,
      y:(.08+seeded(i+41)*.84)*h,
      r:i%11===0?2.2:1.1,
      phase:seeded(i+77)*Math.PI*2
    }));
  }

  function resize(){
    dpr=Math.min(devicePixelRatio||1,mobile()?1.15:1.5);
    w=innerWidth;h=innerHeight;
    canvas.width=Math.max(1,Math.floor(w*dpr));canvas.height=Math.max(1,Math.floor(h*dpr));
    canvas.style.width=w+'px';canvas.style.height=h+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    makeFractal();makeConsensus();
  }

  function draw(ts){
    requestAnimationFrame(draw);
    if(ts-last<33) return;last=ts;
    ctx.clearRect(0,0,w,h);

    // Consensus field: a verification pulse travels through the graph.
    const pulse=(ts%7200)/7200;
    const sx=w*(.74+.08*Math.sin(ts/5000)), sy=h*(.28+.10*Math.cos(ts/4200));
    const maxR=Math.hypot(w,h)*1.05, wave=pulse*maxR;
    const edgeLimit=mobile()?150:tablet()?185:220;
    for(let i=0;i<nodes.length;i++) for(let j=i+1;j<nodes.length;j++){
      const a=nodes[i],b=nodes[j],dist=Math.hypot(a.x-b.x,a.y-b.y);
      if(dist>edgeLimit) continue;
      const da=Math.hypot(a.x-sx,a.y-sy),db=Math.hypot(b.x-sx,b.y-sy);
      const active=Math.abs(((da+db)/2)-wave)<110;
      ctx.strokeStyle=active?'rgba(184,255,61,.115)':`rgba(145,145,158,${(1-dist/edgeLimit)*.055})`;
      ctx.lineWidth=active?.8:.45;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
    }
    for(const n of nodes){
      const d=Math.hypot(n.x-sx,n.y-sy),active=Math.abs(d-wave)<80;
      const breathe=.55+.45*Math.sin(ts/900+n.phase);
      ctx.fillStyle=active?`rgba(184,255,61,${.25+.35*breathe})`:`rgba(205,205,214,${.08+.05*breathe})`;
      ctx.beginPath();ctx.arc(n.x,n.y,n.r+(active?1.2:0),0,Math.PI*2);ctx.fill();
    }

    // Fractal: one line recursively becomes a dense evidence tree, then resets.
    const cycle=12000,local=ts%cycle;
    const build=Math.min(1,local/(cycle*.72));
    const eased=1-Math.pow(1-build,3);
    const shown=Math.floor(segments.length*eased);
    const fade=local>cycle*.83?1-(local-cycle*.83)/(cycle*.17):1;
    ctx.lineCap='round';
    for(let i=0;i<shown;i++){
      const seg=segments[i],depthAlpha=.022+(1-seg.d/11)*.045;
      const newest=i>shown-35;
      ctx.strokeStyle=newest?`rgba(184,255,61,${.13*fade})`:`rgba(162,162,174,${depthAlpha*fade})`;
      ctx.lineWidth=newest?.8:.48;
      ctx.beginPath();ctx.moveTo(seg.x,seg.y);ctx.lineTo(seg.nx,seg.ny);ctx.stroke();
    }
  }

  addEventListener('resize',resize,{passive:true});
  resize();requestAnimationFrame(draw);
}


function initEvidenceMatrix(){
  if(reduceMotion) return;
  const canvas=$('#evidenceMatrix');
  const section=$('.evidence-section');
  if(!canvas||!section) return;
  const ctx=canvas.getContext('2d',{alpha:true});
  const chars=['0','1'];
  let width=0,height=0,dpr=1,fontSize=14,columns=[],raf=0,last=0;
  const mobile=()=>innerWidth<700;

  function resize(){
    const r=section.getBoundingClientRect();
    dpr=Math.min(devicePixelRatio||1,mobile()?1:1.35);
    width=Math.max(1,r.width);height=Math.max(1,r.height);
    fontSize=mobile()?12:14;
    canvas.width=Math.floor(width*dpr);canvas.height=Math.floor(height*dpr);
    canvas.style.width=width+'px';canvas.style.height=height+'px';
    ctx.setTransform(dpr,0,0,dpr,0,0);
    const count=Math.ceil(width/fontSize);
    columns=Array.from({length:count},(_,i)=>({
      y:-Math.random()*height,
      speed:(mobile()?.45:.6)+Math.random()*(mobile()?.45:.75),
      seed:i*17+3,
      alpha:.16+Math.random()*.28
    }));
  }

  function draw(ts){
    raf=requestAnimationFrame(draw);
    if(ts-last<(mobile()?55:38)) return;last=ts;
    ctx.fillStyle='rgba(6,11,8,.105)';ctx.fillRect(0,0,width,height);
    ctx.font=`${fontSize}px ${getComputedStyle(document.documentElement).getPropertyValue('--mono')||'monospace'}`;
    ctx.textBaseline='top';
    for(let i=0;i<columns.length;i++){
      const col=columns[i],x=i*fontSize;
      const ch=chars[((Math.floor(col.y/fontSize)+col.seed+i)&1)];
      const head=Math.sin(ts/1100+i*.7)*.5+.5;
      ctx.fillStyle=`rgba(184,255,61,${col.alpha*(.45+.55*head)})`;
      ctx.fillText(ch,x,col.y);
      if(Math.random()>.74){ctx.fillStyle='rgba(223,255,207,.22)';ctx.fillText(chars[(i+Math.floor(ts/400))&1],x,col.y-fontSize)}
      col.y+=fontSize*col.speed;
      if(col.y>height+fontSize*8){col.y=-Math.random()*height*.45-fontSize*4;col.speed=(mobile()?.45:.6)+Math.random()*(mobile()?.45:.75)}
    }
  }

  const ro=new ResizeObserver(resize);ro.observe(section);resize();raf=requestAnimationFrame(draw);
  document.addEventListener('visibilitychange',()=>{if(document.hidden)cancelAnimationFrame(raf);else raf=requestAnimationFrame(draw)});
}

function initPageMotion(){
  const glow=document.createElement('div');glow.className='cursor-glow';document.body.append(glow);
  const scan=document.createElement('div');scan.className='scanline';scan.setAttribute('aria-hidden','true');document.body.append(scan);
  if(!reduceMotion && matchMedia('(pointer:fine)').matches){
    document.addEventListener('pointermove',e=>{
      document.documentElement.style.setProperty('--mx',e.clientX+'px');document.documentElement.style.setProperty('--my',e.clientY+'px');
      glow.style.left=e.clientX+'px';glow.style.top=e.clientY+'px';glow.classList.add('on');
    },{passive:true});document.addEventListener('pointerleave',()=>glow.classList.remove('on'));
  }
  const updateScroll=()=>{
    const max=document.documentElement.scrollHeight-innerHeight;const p=max>0?Math.min(100,scrollY/max*100):0;
    document.documentElement.style.setProperty('--scroll',p+'%');$('.topbar')?.classList.toggle('scrolled',scrollY>16);
  };addEventListener('scroll',updateScroll,{passive:true});updateScroll();

  const revealTargets=$$('.manifesto,.section-head,.controls,.impact-grid,.rchain-stack,.footprint-grid,.footprint-lower,.private-featured,.private-index,.repo-index,.evidence-flow,.evidence-stats,.contrib-summary,.table-wrap,.pipeline,.architecture-note,.footer');
  revealTargets.forEach((el,i)=>{el.dataset.reveal=i%3===1?'left':''});
  if('IntersectionObserver' in window&&!reduceMotion){
    const io=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.classList.add('in');io.unobserve(e.target)}}),{threshold:.12,rootMargin:'0px 0px -7%'});
    revealTargets.forEach(el=>io.observe(el));
  } else revealTargets.forEach(el=>el.classList.add('in'));
}

function animateNumber(el){
  if(!el||reduceMotion||el.dataset.counted) return;const raw=el.textContent.replace(/,/g,'');const target=Number(raw);if(!Number.isFinite(target))return;
  el.dataset.counted='1';const dur=900,start=performance.now();
  const step=t=>{const q=Math.min(1,(t-start)/dur),ease=1-Math.pow(1-q,3);el.textContent=num(Math.round(target*ease));if(q<1)requestAnimationFrame(step)};requestAnimationFrame(step);
}
function initCounters(){
  const els=$$('.metric b,.estat b,.pill-stat b,.count-badge b,.impact-value,.footprint-value');
  if('IntersectionObserver' in window&&!reduceMotion){const io=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){animateNumber(e.target);io.unobserve(e.target)}}),{threshold:.55});els.forEach(e=>io.observe(e))}else els.forEach(animateNumber);
}

function enhanceCards(){
  $$('.project-card').forEach((card,i)=>{
    card.classList.remove('stagger-in');card.style.setProperty('--delay',`${Math.min(i,8)*42}ms`);requestAnimationFrame(()=>card.classList.add('stagger-in'));
    if(reduceMotion||!matchMedia('(pointer:fine)').matches)return;
    card.addEventListener('pointermove',e=>{const r=card.getBoundingClientRect(),x=(e.clientX-r.left)/r.width,y=(e.clientY-r.top)/r.height;card.style.setProperty('--card-x',`${x*100}%`);card.style.setProperty('--card-y',`${y*100}%`);card.style.transform=`perspective(850px) rotateX(${(0.5-y)*3.6}deg) rotateY(${(x-0.5)*4.6}deg) translateY(-3px)`});
    card.addEventListener('pointerleave',()=>card.style.transform='');
  });
}

// Re-run card enhancement whenever filters/search replace the grid.
const baseRenderProjects=renderProjects;
renderProjects=function(){baseRenderProjects();enhanceCards();};

initSystemsField();initEvidenceMatrix();initPageMotion();
renderProjects();
initCounters();
