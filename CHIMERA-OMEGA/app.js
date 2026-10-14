const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];

const LENS={
  integrity:{state:'CONFIRMED',label:'artifact integrity',wedge:0},
  authorization:{state:'POLICY-LOCAL',label:'authorization',wedge:1},
  observation:{state:'UNKNOWN',label:'independent observation',wedge:2},
  truth:{state:'UNKNOWN',label:'external truth',wedge:3}
};
$$('.lens-tag').forEach(btn=>btn.addEventListener('mouseenter',()=>focusLens(btn.dataset.lens)));$$('.lens-tag').forEach(btn=>btn.addEventListener('click',()=>focusLens(btn.dataset.lens)));
function focusLens(key){const d=LENS[key],lens=$('#evidenceLens');lens.classList.add('focus');$$('.lens-tag').forEach(b=>b.classList.toggle('active',b.dataset.lens===key));$$('.lens-wedge').forEach((w,i)=>w.classList.toggle('active',i===d.wedge));$('#lensState').textContent=d.state;$('#lensLabel').textContent=d.label;}
$('#evidenceLens').addEventListener('mouseleave',()=>{$('#evidenceLens').classList.remove('focus');$$('.lens-tag').forEach(b=>b.classList.remove('active'));$$('.lens-wedge').forEach(w=>w.classList.remove('active'));$('#lensState').textContent='BOUNDED';$('#lensLabel').textContent='trace equality';});

const CASES={
  match:{verdict:'LOCALLY SUPPORTED',detail:'All supplied commitments match under the selected bounded predicate.',divergence:'NONE',integrity:'CONFIRMED',exit:'EXIT 0',cols:['match','match','match','match']},
  diverge:{verdict:'CONTRADICTED',detail:'The package remains structurally valid, but observed state diverges from the expected sequence.',divergence:'INDEX 2',integrity:'CONFIRMED',exit:'EXIT 1',cols:['match','match','mismatch','mismatch']},
  tamper:{verdict:'REJECTED',detail:'The selected package digest no longer matches. Semantic verification is not promoted past the integrity gate.',divergence:'NOT ASSESSED',integrity:'FAILED',exit:'EXIT 2',cols:['tampered','tampered','tampered','tampered']},
  unknown:{verdict:'INSUFFICIENT',detail:'The package is valid, but the supplied evidence cannot establish every requested dimension.',divergence:'UNKNOWN',integrity:'CONFIRMED',exit:'EXIT 3',cols:['match','match','unknown','unknown']}
};
let currentCase='match';
function renderCase(name){currentCase=name;const c=CASES[name];$$('.case-tab').forEach(b=>b.classList.toggle('active',b.dataset.case===name));$('#caseVerdict').textContent=c.verdict;$('#caseDetail').textContent=c.detail;$('#caseDivergence').textContent=c.divergence;$('#caseIntegrity').textContent=c.integrity;$('#caseExit').textContent=c.exit;$('#caseVerdict').style.color=name==='match'?'#183f6b':name==='diverge'||name==='tamper'?'#e23d28':'#4f4c46';$('#traceLines').innerHTML=c.cols.map((state,i)=>`<div class="trace-column ${state}"><span>STATE ${String(i).padStart(2,'0')}</span><b>${state==='match'?'MATCH':state==='mismatch'?'Δ DIVERGENCE':state==='tampered'?'DIGEST FAIL':'NO EVIDENCE'}</b></div>`).join('');}
$$('.case-tab').forEach(btn=>btn.addEventListener('click',()=>renderCase(btn.dataset.case)));renderCase('match');
$('#falsifyButton').addEventListener('click',async()=>{const b=$('#falsifyButton');b.textContent='MUTATION INJECTED';renderCase(currentCase==='match'?'diverge':'tamper');await new Promise(r=>setTimeout(r,950));b.textContent='INJECT NEGATIVE CONTROL';});

const ANATOMY={
  kernel:{idx:'01',title:'Evidence Kernel',body:'Validates claim and target binding, traverses provenance, recomputes trace equality, locates first divergence and runs mutation controls.',yes:'artifact-level bounded predicate',no:'external truth · finality'},
  kv:{idx:'02',title:'KV Adapter',body:'Executes a bounded deterministic local state machine, preserves raw snapshots and emits content-addressed receipts bound into the existing evidence envelope.',yes:'raw snapshot → commitment binding',no:'remote authority · independent observation'},
  observer:{idx:'03',title:'Observer Plane',body:'Re-observes the supplied local execution artifact through a separate executable and code path, producing a deterministic corroborating receipt.',yes:'artifact corroboration',no:'operator independence · truth'},
  witness:{idx:'04',title:'Witness Plane',body:'Attaches offline Ed25519 attribution to exact observer bytes, then evaluates authorization against separately selected caller-pinned policy.',yes:'signature + policy-local authorization',no:'real-world identity · freshness · truth'},
  aether:{idx:'05',title:'Aether Lineage',body:'Verifies selected signed operation and lineage bindings from a separately pinned context while preserving full journal-chain verification as a separate question.',yes:'selected lineage bindings',no:'general runtime truth promotion'},
  compiler:{idx:'06',title:'RCHAIN-COMPLIER Import',body:'Imports pinned assurance packages and native verifier reports while preserving their attributed PASS / FAIL / BLOCKED result as external evidence.',yes:'package / report binding',no:'verdict laundering · implicit trust'},
  audit:{idx:'07',title:'Audit Archive',body:'Binds saved audit captures to a reviewer-selected manifest and observation roles, preserving raw bytes and unavailable artifacts.',yes:'selected archive integrity',no:'finding truth · production impact'}
};
function inspectAnatomy(key){const d=ANATOMY[key];$$('.an-node').forEach(b=>b.classList.toggle('active',b.dataset.anatomy===key));$('#anatomyInspector').innerHTML=`<p>SELECTED / ${d.idx}</p><h3>${d.title}</h3><div class="inspector-rule"></div><p class="body">${d.body}</p><div class="inspector-pair"><span>ESTABLISHES</span><b>${d.yes}</b></div><div class="inspector-pair"><span>REFUSES TO PROMOTE</span><b>${d.no}</b></div>`;}
$$('.an-node').forEach(btn=>btn.addEventListener('click',()=>inspectAnatomy(btn.dataset.anatomy)));

// Section-aware vertical index
const sections=$$('.chapter[id]');const navLinks=$$('#railNav a');const observer=new IntersectionObserver(entries=>{entries.forEach(e=>{if(e.isIntersecting){navLinks.forEach(a=>a.classList.toggle('active',a.dataset.section===e.target.id));}})},{rootMargin:'-35% 0px -55% 0px',threshold:0});sections.forEach(s=>observer.observe(s));

// Bespoke pointer treatment
const cursor=$('#cursorOrbit');if(matchMedia('(pointer:fine)').matches){addEventListener('pointermove',e=>{cursor.style.left=e.clientX+'px';cursor.style.top=e.clientY+'px'});$$('a,button').forEach(el=>{el.addEventListener('pointerenter',()=>cursor.classList.add('hot'));el.addEventListener('pointerleave',()=>cursor.classList.remove('hot'));});}

// Lens parallax: different from the other sites' canvas-network motion
const lens=$('#evidenceLens');if(matchMedia('(pointer:fine)').matches){lens.addEventListener('pointermove',e=>{const r=lens.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;lens.querySelector('svg').style.transform=`translate(${x*7}px,${y*7}px) rotate(${x*1.8}deg)`;lens.querySelector('.lens-center').style.transform=`translate(calc(-50% + ${x*-5}px),calc(-50% + ${y*-5}px))`;});lens.addEventListener('pointerleave',()=>{lens.querySelector('svg').style.transform='';lens.querySelector('.lens-center').style.transform='translate(-50%,-50%)';});}

// Editorial reveal: stagger only, no generic cards
const reveal=$$('.thesis-layout > *, .casebook-head > *, .anatomy-grid > *, .limit-side li, .protocol-score article');const rio=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting){e.target.animate([{opacity:0,transform:'translateY(24px)'},{opacity:1,transform:'translateY(0)'}],{duration:560,easing:'cubic-bezier(.2,.7,.2,1)',fill:'both'});rio.unobserve(e.target)}}),{threshold:.08});reveal.forEach(el=>rio.observe(el));

// Mobile index toggle
const menu=$('#menuButton');menu?.addEventListener('click',()=>{$('.mobile-head').classList.toggle('open');});
