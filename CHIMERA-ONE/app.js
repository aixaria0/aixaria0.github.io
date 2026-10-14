const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const wait=ms=>new Promise(r=>setTimeout(r,ms));

const SYSTEMS={
 one:{i:'00',title:'CHIMERA-ONE',role:'Sovereign control plane',est:'capability / provenance / bounded plan composition',ref:'automatic execution authority',desc:'Coordinates the constellation while keeping implementation, evidence and trust boundaries explicit.'},
 ritual:{i:'01',title:'RitualGraph',role:'Policy + invariants',est:'executable threat/state graph constraints',ref:'runtime authority by itself',desc:'Carries executable policy/state graphs and invariants that constrain what a plan may request or claim.'},
 ag:{i:'02',title:'Chimera-AG',role:'Measured routing + council',est:'bounded routing / synthesis observations',ref:'agreement as correctness',desc:'Provides measured specialist routing, council synthesis and verifier observations without promoting model consensus into truth.'},
 aether:{i:'03',title:'Aether Runtime',role:'Bounded execution',est:'allowlisted execution + recovery lineage',ref:'general unrestricted execution',desc:'Runs bounded work, records execution lineage and returns signed local evidence without erasing the execution boundary.'},
 complier:{i:'04',title:'RCHAIN-COMPLIER',role:'Deterministic assurance',est:'task-bound assurance + verifier receipts',ref:'network-wide finality',desc:'Produces deterministic assurance artifacts and separately attributable verifier receipts for selected RChain-shaped tasks.'},
 omega:{i:'05',title:'CHIMERA-OMEGA',role:'Evidence binding',est:'proof-carrying bounded evidence dimensions',ref:'external truth / witness independence',desc:'Binds exact evidence, provenance, policy and replay dimensions while preserving explicit UNKNOWN states.'},
 audit:{i:'06',title:'RChain Audit Pack',role:'Adversarial domain pack',est:'scenario / capture / first-divergence methodology',ref:'live public-target modification',desc:'Carries adversarial RChain-domain scenarios and first-divergence methodology under the repository’s operational guardrails.'}
};

function inspectSystem(key){const s=SYSTEMS[key]||SYSTEMS.one;$$('.map-node').forEach(n=>n.classList.toggle('active',n.dataset.sys===key));$$('.orbit-node').forEach(n=>n.classList.toggle('active',n.dataset.sys===key));if($('#sysIndex'))$('#sysIndex').textContent=s.i;if($('#sysTitle'))$('#sysTitle').textContent=s.title;if($('#sysRole'))$('#sysRole').textContent=s.role;if($('#sysDesc'))$('#sysDesc').textContent=s.desc;if($('#sysEst'))$('#sysEst').textContent=s.est;if($('#sysRef'))$('#sysRef').textContent=s.ref;if($('#visualTitle'))$('#visualTitle').textContent=s.title;if($('#visualCopy'))$('#visualCopy').textContent=s.desc;}
$$('.map-node,.orbit-node').forEach(n=>n.addEventListener('click',()=>inspectSystem(n.dataset.sys)));
inspectSystem('one');

const PLANS={
 change:{objective:'Analyze this system change',domain:'general',status:'VALID / NOT EXECUTED',detail:'Compiled into a bounded cross-repository capability DAG. Planner output is not execution authority.',nodes:[['INDEX','knowledge fabric'],['POLICY','RitualGraph'],['ROUTE','Chimera-AG'],['REVIEW','OMEGA'],['REPORT','provenance']]},
 staking:{objective:'Falsify this staking claim',domain:'rchain-audit',status:'VALID / DOMAIN-BOUND',detail:'Restricted to the adversarial RChain audit domain. No live public-target modification is authorized.',nodes:[['DOMAIN','audit pack'],['SCENARIO','adversarial'],['ASSURE','COMPLIER'],['BIND','OMEGA'],['REPORT','first divergence']]},
 evidence:{objective:'Review saved evidence',domain:'offline-review',status:'NARROW ADAPTER / SAVED INPUT',detail:'Selects one pinned offline review path. General planner execution remains intentionally unavailable.',nodes:[['PIN','source/context'],['CAPTURE','saved bytes'],['VERIFY','OMEGA'],['ATTEST','optional'],['REPORT','bounded result']]}
};
let planKey='change';
function randomDigest(){return 'sha256:'+Array.from({length:4},()=>Math.random().toString(16).slice(2,6)).join('');}
function renderPlan(key,animate=false){planKey=key;const p=PLANS[key];$('#objectiveInput').value=p.objective;$$('.domain-pill').forEach(b=>b.classList.toggle('active',b.dataset.plan===key));$('#planStatus').textContent=p.status;$('#planDetail').textContent=p.detail;$('#planDigest').textContent=randomDigest();$('#planDag').innerHTML=p.nodes.map((n,i)=>`<div class="dag-node ${i===p.nodes.length-1?'locked':''}"><span>${String(i+1).padStart(2,'0')}</span><b>${n[0]}</b><small>${n[1]}</small></div>`).join('');if(animate)$('#planDag').animate([{opacity:.25,transform:'translateY(8px)'},{opacity:1,transform:'none'}],{duration:340,easing:'ease-out'});}
$$('.domain-pill').forEach(b=>b.addEventListener('click',()=>renderPlan(b.dataset.plan,true)));
$('#compileBtn').addEventListener('click',async()=>{const b=$('#compileBtn'),v=$('#objectiveInput').value.trim();b.textContent='COMPILING…';$('#planStatus').textContent='VALIDATING DAG';await wait(320);const p=PLANS[planKey];if(v) p.objective=v;renderPlan(planKey,true);b.textContent='COMPILE';});
renderPlan('change');

// Authority gates are a public browser model. General execution remains locked.
$$('.switch:not(.locked)').forEach(sw=>sw.addEventListener('click',()=>{sw.classList.toggle('on');const on=sw.classList.contains('on');sw.setAttribute('aria-checked',String(on));const label=sw.closest('.gate-row')?.querySelector('b')?.textContent||'gate';logLine(on?'OK':'INFO',`${label.toLowerCase()} ${on?'enabled':'disabled'} in browser model`);}));

const ADAPTERS={
 omega:{title:'Offline OMEGA review',status:'BOUNDED CAPTURE',detail:'Pinned saved input → offline verifier → native report → bounded process result.',steps:[['PIN','source + context'],['BUILD','fixed command'],['VERIFY','offline OMEGA'],['CAPTURE','native report'],['RETURN','bounded result']],logs:[['PIN','source/context selections loaded'],['BUILD','fixed offline command constructed'],['VERIFY','saved verifier path evaluated'],['CAPTURE','native report bytes preserved'],['RETURN','general execution authority unchanged']]},
 attest:{title:'Capture attestation',status:'ATTRIBUTED / LOCAL',detail:'Adds an Ed25519 sidecar and verifies selected saved bytes under explicit key and label pins.',steps:[['SELECT','saved capture'],['KEY','external selection'],['SIGN','Ed25519 sidecar'],['CHECK','saved bytes'],['RETURN','attribution only']],logs:[['SELECT','saved capture chosen'],['KEY','signer key pin selected'],['SIGN','sidecar attribution produced'],['CHECK','saved bytes + signature checked'],['RETURN','witness independence remains unknown']]},
 council:{title:'Council measurement',status:'MEASURED / NOT PROMOTED',detail:'Runs a bounded local-model experiment against a matched four-call baseline and preserves raw transcripts.',steps:[['PIN','suite + model'],['COUNCIL','four calls'],['BASELINE','matched calls'],['SCORE','fixed references'],['RETURN','measurement']],logs:[['PIN','source/suite/model selections loaded'],['COUNCIL','native transcript path selected'],['BASELINE','matched-call baseline selected'],['SCORE','fixed reference score recomputed'],['RETURN','model agreement not promoted']]},
 policy:{title:'Checked-program routing',status:'24/24 / FAMILY-LIMITED',detail:'Validates retained V3 evidence and selects a checked single-model route only for three exact typed task families.',steps:[['PIN','native suites'],['CHECK','evidence bytes'],['DERIVE','family route'],['VALIDATE','transfer suite'],['RETURN','bounded policy']],logs:[['PIN','regression + transfer suites selected'],['CHECK','native evidence digests matched'],['DERIVE','four checked single-model samples selected'],['VALIDATE','24/24 answers / zero false accepts'],['RETURN','policy remains family-limited']]}
};
let adapterKey='omega';
function renderAdapter(key){adapterKey=key;const a=ADAPTERS[key];$$('.adapter-case').forEach(b=>b.classList.toggle('active',b.dataset.adapter===key));$('#adapterTitle').textContent=a.title;$('#adapterStatus').textContent=a.status;$('#adapterDetail').textContent=a.detail;$('#labFlow').innerHTML=a.steps.map((s,i)=>`<div class="lab-step ${i<2?'ok':i===2?'pending':''}"><span>${String(i+1).padStart(2,'0')}</span><b>${s[0]}</b><small>${s[1]}</small></div>`).join('');$('#labConsole').innerHTML='';$('#runAdapter').textContent='RUN BROWSER MODEL';}
function logLine(kind,msg){const target=$('#labConsole');if(!target)return;const row=document.createElement('div');row.className='terminal-line '+(kind==='WARN'?'warn':kind==='FAIL'?'bad':'');row.innerHTML=`<time>${new Date().toLocaleTimeString([],{hour12:false})}</time><b>${kind}</b><span>${msg}</span>`;target.appendChild(row);target.scrollTop=target.scrollHeight;}
$$('.adapter-case').forEach(b=>b.addEventListener('click',()=>renderAdapter(b.dataset.adapter)));
$('#runAdapter').addEventListener('click',async()=>{const a=ADAPTERS[adapterKey],b=$('#runAdapter');b.disabled=true;b.textContent='RUNNING…';$('#adapterStatus').textContent='IN PROGRESS';$('#labConsole').innerHTML='';const steps=$$('.lab-step');for(let i=0;i<a.logs.length;i++){await wait(260);steps[i]?.classList.remove('pending');steps[i]?.classList.add('ok');logLine(i===a.logs.length-1?'INFO':'OK',a.logs[i][1]);}$('#adapterStatus').textContent=a.status;b.disabled=false;b.textContent='RUN AGAIN';});
renderAdapter('omega');

// Knowledge fabric: deterministic local demo data only.
const KNOWLEDGE=[
 {repo:'CHIMERA-ONE',path:'docs/ARCHITECTURE.md',tag:'control plane',hash:'2bc1…6fa0'},
 {repo:'CHIMERA-OMEGA',path:'docs/',tag:'evidence binding',hash:'9a0f…e21c'},
 {repo:'Chimera-AG',path:'docs/EVIDENCE_ROUTING.md',tag:'routing evidence',hash:'7f16…c0d9'},
 {repo:'Aether Runtime',path:'docs/verification-model.md',tag:'runtime evidence',hash:'0d2a…91f3'},
 {repo:'RCHAIN-COMPLIER',path:'tools/',tag:'assurance receipt',hash:'a821…5b7d'},
 {repo:'RitualGraph',path:'policy/',tag:'invariants',hash:'5ed2…112a'}
];
function doSearch(){const q=$('#fabricQuery').value.trim().toLowerCase();const rows=KNOWLEDGE.filter(x=>!q||Object.values(x).some(v=>v.toLowerCase().includes(q)));$('#searchResults').innerHTML=(rows.length?rows:KNOWLEDGE.slice(0,2)).map(x=>`<div class="search-hit"><b>${x.repo}</b><span>${x.path}<br>${x.tag}</span><code>${x.hash}</code></div>`).join('');}
$('#fabricSearch').addEventListener('click',doSearch);$('#fabricQuery').addEventListener('keydown',e=>{if(e.key==='Enter')doSearch()});doSearch();

// Command palette.
const commands=[
 ['Compile objective',()=>{location.hash='#command';setTimeout(()=>$('#objectiveInput').focus(),280)}],
 ['Inspect constellation',()=>location.hash='#constellation'],
 ['Open invocation lab',()=>location.hash='#lab'],
 ['Show routing evidence',()=>location.hash='#routing'],
 ['Query knowledge fabric',()=>{location.hash='#fabric';setTimeout(()=>$('#fabricQuery').focus(),280)}],
 ['Inspect CHIMERA-OMEGA',()=>{inspectSystem('omega');location.hash='#constellation'}]
];
function renderPalette(filter=''){const q=filter.toLowerCase();$('#paletteList').innerHTML=commands.filter(c=>c[0].toLowerCase().includes(q)).map((c,i)=>`<button class="palette-item" data-command="${commands.indexOf(c)}"><b>${c[0]}</b><span>RUN ↵</span></button>`).join('');$$('.palette-item').forEach(b=>b.addEventListener('click',()=>{commands[+b.dataset.command][1]();closePalette()}));}
function openPalette(){$('#paletteBackdrop').classList.add('open');$('#paletteInput').value='';renderPalette();setTimeout(()=>$('#paletteInput').focus(),50)}function closePalette(){$('#paletteBackdrop').classList.remove('open')}
$('#paletteInput').addEventListener('input',e=>renderPalette(e.target.value));$('#paletteBackdrop').addEventListener('click',e=>{if(e.target.id==='paletteBackdrop')closePalette()});document.addEventListener('keydown',e=>{if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();openPalette()}if(e.key==='Escape')closePalette()});$('#commandHint').addEventListener('click',openPalette);

// Ambient constellation field.
const canvas=$('#cosmos'),ctx=canvas.getContext('2d');let W=0,H=0,DPR=1,pts=[];function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);const n=Math.max(35,Math.min(100,Math.floor(W/22)));pts=Array.from({length:n},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.045,vy:(Math.random()-.5)*.045,r:Math.random()*.9+.2}))}function frame(){ctx.clearRect(0,0,W,H);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0}for(let i=0;i<pts.length;i++){for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<130){ctx.strokeStyle=`rgba(169,255,207,${(1-d/130)*.028})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}}for(const p of pts){ctx.fillStyle='rgba(200,225,218,.17)';ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,Math.PI*2);ctx.fill()}requestAnimationFrame(frame)}addEventListener('resize',resize,{passive:true});resize();frame();

// Hero parallax, fine pointers only.
const singularity=$('.singularity');if(singularity&&matchMedia('(pointer:fine)').matches){singularity.addEventListener('pointermove',e=>{const r=singularity.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;$('.core-diamond').style.transform=`rotate(45deg) rotateX(${-y*4}deg) rotateY(${x*4}deg)`});singularity.addEventListener('pointerleave',()=>$('.core-diamond').style.transform='rotate(45deg)')}
