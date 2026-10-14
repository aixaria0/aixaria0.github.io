const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const wait=ms=>new Promise(r=>setTimeout(r,ms));
let seq=12,busy=false,envelopeTampered=false;
const workers=[
  {id:'worker-1',pid:4182,state:'READY',key:'a31f…9c2d',task:'idle'},
  {id:'worker-2',pid:4186,state:'READY',key:'b8a2…4f11',task:'execute'},
  {id:'worker-3',pid:4191,state:'READY',key:'ce07…81aa',task:'observe'}
];
const faultCases={
  crash:{target:'WORKER-2',sub:'SIGKILL / PROCESS LOSS',title:'Crash recovery',body:'Process loss is captured as a journal event before any retry. Recovery restores worker-2 under the same signing identity.',gate:'IDENTITY CONTINUITY',negative:'WRONG KEY MUST FAIL',events:[['EXECUTE','task accepted',''],['FAILURE','process lost','bad'],['RECORD','failure journaled',''],['RESTART','same identity',''],['RETRY','task replayed',''],['VERIFY','evidence accepted','good']]},
  identity:{target:'WORKER-2',sub:'KEY DRIFT / RESTART',title:'Identity continuity failure',body:'A restarted process is not accepted merely because it has the same worker label. The stable worker signing identity must remain continuous.',gate:'STABLE ED25519 KEY',negative:'NEW KEY MUST FAIL',events:[['EXECUTE','task accepted',''],['FAILURE','process lost','bad'],['RESTART','new process',''],['IDENTITY','key mismatch','bad'],['VERIFY','blocked','bad'],['RESULT','rejected','bad']]},
  tamper:{target:'RESULT ENVELOPE',sub:'SHA-256 / SIGNATURE',title:'Tampered result rejection',body:'Changing returned output breaks the evidence binding. Local verification must reject the envelope instead of trusting the success label.',gate:'HASH + SIGNATURE',negative:'MUTATED OUTPUT FAILS',events:[['RESULT','bytes returned',''],['HASH','digest computed',''],['MUTATE','output changed','bad'],['VERIFY','hash mismatch','bad'],['SIGNATURE','not promoted','bad'],['RESULT','rejected','bad']]},
  history:{target:'JOURNAL EDGE',sub:'REPLAY CONTRACT',title:'History mutation detection',body:'Persisted history is replayed against explicit transition semantics. The first illegal edge is surfaced even if later events look terminal and successful.',gate:'TRANSITION CONTRACT',negative:'MUTATED EDGE FAILS',events:[['LOAD','journal opened',''],['REPLAY','edges 1–3 valid',''],['MUTATE','edge 4 changed','bad'],['DIVERGE','first mismatch','bad'],['HALT','later success ignored',''],['REPORT','seq + index','good']]}
};
const replayCases={
  clean:{result:'REPLAY VERIFIED',text:'All persisted edges satisfy the selected runtime transition contract.',div:'NONE',tone:'good',states:['good','good','good','good','good','good','good'],labels:['REQUEST','SCHEDULE','EXECUTE','OBSERVE','VERIFY','COMPLETE','AUDIT']},
  mutated:{result:'DIVERGENCE DETECTED',text:'A persisted edge was mutated. Replay stops at the first inconsistent transition instead of trusting the later terminal state.',div:'SEQ 0006 / EDGE 04',tone:'bad',states:['good','good','good','bad','bad','bad','bad'],labels:['REQUEST','SCHEDULE','EXECUTE','MUTATED','VERIFY','COMPLETE','AUDIT']},
  missing:{result:'REPLAY REJECTED',text:'The event lineage contains a gap. A continuous transition chain cannot be established from the supplied journal.',div:'MISSING EVENT / EDGE 03',tone:'warn',states:['good','good','missing','missing','missing','missing','missing'],labels:['REQUEST','SCHEDULE','MISSING','UNKNOWN','UNKNOWN','UNKNOWN','UNKNOWN']},
  illegal:{result:'ILLEGAL TRANSITION',text:'A terminal state is followed by a new execution edge. The transition contract rejects the history at that exact boundary.',div:'EDGE 06 / TERMINAL→EXECUTE',tone:'bad',states:['good','good','good','good','good','bad','bad'],labels:['REQUEST','EXECUTE','VERIFY','RECOVER','COMPLETE','EXECUTE','AUDIT']}
};
function now(){return new Date().toLocaleTimeString([], {hour12:false,hour:'2-digit',minute:'2-digit',second:'2-digit'});}
function addJournal(event,worker,detail,tone=''){
  seq++; $('#seqCode').textContent='SEQ '+String(seq).padStart(4,'0');
  const row=document.createElement('div'); row.className='journal-line '+tone;
  row.innerHTML=`<span>${String(seq).padStart(4,'0')}</span><b>${event}</b><span>${worker}</span><em>${detail}</em>`;
  $('#journalStream').prepend(row); while($('#journalStream').children.length>18)$('#journalStream').lastElementChild.remove();
  $('#envSeq').textContent=String(seq).padStart(4,'0');
}
function renderWorkers(){
  $('#workerMatrix').innerHTML=workers.map(w=>`<div class="worker-cell ${w.state==='DEAD'?'dead':w.state==='WARN'?'warn':''}"><i class="status-dot"></i><strong>${w.id}</strong><code>pid ${w.pid}</code><dl><div><dt>state</dt><dd>${w.state}</dd></div><div><dt>key</dt><dd>${w.key}</dd></div><div><dt>task</dt><dd>${w.task}</dd></div></dl></div>`).join('');
  const ready=workers.filter(w=>w.state==='READY').length; $('#workerQuorum').textContent=`${ready} / 3`;
  $$('.hero-worker').forEach((el,i)=>{const w=workers[i];el.querySelector('small').textContent=w.state;el.style.opacity=w.state==='DEAD'?'.38':'1';});
}
function setHero(mode,readout,tone='violet'){$('#heroMode').textContent=mode;$('#heroReadout').textContent=readout;$('#heroMode').style.color=tone==='orange'?'var(--orange)':tone==='red'?'var(--red)':'var(--violet)';}
function setTelemetry(kind){
  const map={healthy:[72,46,'STABLE','RUNNING','CONFIRMED','VERIFIED'],fault:[39,83,'FAULT','RECOVERY','CHECKING','PENDING'],blocked:[28,67,'BLOCKED','HALTED','FAILED','REJECTED'],recovered:[88,61,'RECOVERED','RUNNING','CONFIRMED','VERIFIED']};
  const v=map[kind]; $('#dialExec').textContent=v[0];$('#dialJournal').textContent=v[1];$$('.dial')[0].style.setProperty('--p',v[0]);$$('.dial')[1].style.setProperty('--p',v[1]);$('#telemetryState').textContent=v[2];$('#controllerState').textContent=v[3];$('#identityContinuity').textContent=v[4];$('#lastEvidence').textContent=v[5];
}
function setMachine(step,status,detail){
  const nodes=$$('.sm-node');nodes.forEach((n,i)=>{n.className='sm-node';if(i<step)n.classList.add('done');});
  if(nodes[step]) nodes[step].classList.add(step===2?'fail':step===3?'recover':step===4?'good':'current');
  $('#workflowState').textContent=status;$('#workflowDetail').textContent=detail;
  $('#workflowState').style.color=status.includes('REJECT')||status.includes('BLOCK')?'var(--red)':status.includes('RECOVER')?'var(--orange)':'var(--violet)';
}
function resetRuntime(){
  workers[0].state=workers[1].state=workers[2].state='READY';workers[1].key='b8a2…4f11';workers[1].task='execute';renderWorkers();setTelemetry('healthy');setMachine(1,'RUNNING / HEALTHY','All three worker identities are available and the current transition chain remains internally coherent.');setHero('HEALTHY','journal coherent / replay ready');$('#recoveryMetric').textContent='ARMED';$('#envSig').textContent='VALID';envelopeTampered=false;renderChecks();addJournal('RESET','controller','runtime model restored');
}
async function runCrash(){
  if(busy)return;busy=true;$('#recoveryMetric').textContent='ACTIVE';setHero('FAULT INJECTED','worker-2 process loss recorded','orange');workers[1].state='DEAD';workers[1].task='interrupted';renderWorkers();setTelemetry('fault');setMachine(2,'WORKER FAILURE DETECTED','Process loss is recorded before any retry is attempted.');addJournal('FAILURE','worker-2','process exited unexpectedly','bad');await wait(550);
  setMachine(3,'RECOVERY / RESTARTING','The controller restores worker-2 and checks stable signing identity before retry.');addJournal('RECOVER','worker-2','restart requested','warn');await wait(650);
  workers[1].pid+=17;workers[1].state='READY';workers[1].task='retry';renderWorkers();addJournal('IDENTITY','worker-2','stable key b8a2…4f11 confirmed');await wait(500);
  addJournal('RETRY','worker-2','interrupted task replayed');setMachine(4,'VERIFYING EVIDENCE','Signed result evidence is checked after the recovered execution.');await wait(500);
  addJournal('VERIFY','worker-2','signature + result hash accepted');workers[1].task='idle';renderWorkers();setTelemetry('recovered');setMachine(5,'COMPLETED / REPLAY READY','Workflow completed after crash recovery. Persisted history is ready for deterministic replay audit.');setHero('RECOVERED','identity continuous / evidence verified');$('#recoveryMetric').textContent='VERIFIED';busy=false;
}
async function breakIdentity(){if(busy)return;busy=true;workers[1].state='WARN';workers[1].key='e991…BAD';renderWorkers();setTelemetry('blocked');setMachine(3,'RECOVERY IDENTITY DRIFT','The restarted process presents a different signing key. Recovery cannot be promoted.');addJournal('IDENTITY','worker-2','expected b8a2…4f11 / got e991…BAD','bad');$('#envKey').textContent='e991…BAD';$('#envSig').textContent='REJECTED';renderChecks('identity');setHero('BLOCKED','worker identity continuity failed','red');$('#recoveryMetric').textContent='BLOCKED';busy=false;}
function tamperResult(){envelopeTampered=true;$('#envHash').textContent='sha256:tampered';$('#envSig').textContent='REJECTED';$('#lastEvidence').textContent='REJECTED';renderChecks('tamper');addJournal('TAMPER','worker-2','result hash no longer binds output','bad');setHero('EVIDENCE REJECTED','tampered result cannot be promoted','red');}
$$('.worker-controls button').forEach(b=>b.addEventListener('click',()=>{const f=b.dataset.fault;if(f==='kill')runCrash();if(f==='identity')breakIdentity();if(f==='tamper')tamperResult();if(f==='reset')resetRuntime();}));
function renderChecks(mode='normal'){
  const rows=[
    ['result hash','SHA-256 binds returned bytes',mode==='tamper'?'FAIL':'PASS'],
    ['worker signature','Ed25519 signature validates envelope',mode==='tamper'?'BLOCKED':mode==='identity'?'FAIL':'PASS'],
    ['identity continuity','restart retains worker key',mode==='identity'?'FAIL':'PASS'],
    ['journal binding','event sequence references execution','PASS'],
    ['external truth','not established by local evidence','UNKNOWN']
  ];
  $('#checkMatrix').innerHTML=rows.map(r=>{const cls=r[2]==='PASS'?'pass':r[2]==='FAIL'?'fail':'warn';return `<div class="check-row ${cls}"><div><b>${r[0]}</b><small>${r[1]}</small></div><span>${r[2]}</span></div>`}).join('');
}
$('#tamperEnvelope').addEventListener('click',()=>{if(envelopeTampered){resetRuntime();$('#tamperEnvelope').textContent='TAMPER OUTPUT';$('#envHash').textContent='sha256:8a31…fe90';$('#envKey').textContent='b8a2…4f11';}else{tamperResult();$('#tamperEnvelope').textContent='RESTORE ENVELOPE';}});
function chooseFault(name){const f=faultCases[name];$$('.fault-case').forEach(b=>b.classList.toggle('active',b.dataset.case===name));$('#faultTarget').textContent=f.target;$('#faultSub').textContent=f.sub;$('#faultTitle').textContent=f.title;$('#faultBody').textContent=f.body;$('#faultGate').textContent=f.gate;$('#faultNegative').textContent=f.negative;$('#faultTimeline').innerHTML=f.events.map((e,i)=>`<div class="fault-event ${e[2]}"><span>0${i+1}</span><b>${e[0]}</b><span>${e[1]}</span></div>`).join('');$('#faultProgress').style.width='0';$('#runFault').dataset.case=name;}
$$('.fault-case').forEach(b=>b.addEventListener('click',()=>chooseFault(b.dataset.case)));
$('#runFault').addEventListener('click',async()=>{if(busy)return;busy=true;const name=$('#runFault').dataset.case||'crash',f=faultCases[name],events=$$('.fault-event');$('#runFault').textContent='SCENARIO RUNNING…';for(let i=0;i<events.length;i++){events.forEach((e,j)=>e.classList.toggle('active',i===j));$('#faultProgress').style.width=((i+1)/events.length*100)+'%';addJournal(f.events[i][0],name,f.events[i][1],f.events[i][2]);await wait(330);}if(name==='crash')await runCrashCore();if(name==='identity'){workers[1].key='e991…BAD';workers[1].state='WARN';renderWorkers();setTelemetry('blocked');renderChecks('identity');}if(name==='tamper')tamperResult();if(name==='history')drawReplay('mutated');$('#runFault').textContent='RUN SCENARIO';busy=false;});
async function runCrashCore(){workers[1].state='DEAD';renderWorkers();setTelemetry('fault');await wait(220);workers[1].pid+=9;workers[1].state='READY';workers[1].key='b8a2…4f11';workers[1].task='idle';renderWorkers();setTelemetry('recovered');setHero('RECOVERED','fault scenario passed local gates');}
function drawReplay(name){const r=replayCases[name];$$('.replay-case').forEach(b=>b.classList.toggle('active',b.dataset.replay===name));$('#replayMap').innerHTML=r.states.map((s,i)=>`<div class="edge ${s}"><span>EDGE ${String(i+1).padStart(2,'0')}</span><b>${r.labels[i]}</b><small>${s==='good'?'VALID TRANSITION':s==='bad'?'CONTRACT VIOLATION':'NO EVENT'}</small></div>`).join('');$('#replayResult').textContent=r.result;$('#replayText').textContent=r.text;$('#firstDivergence').textContent=r.div;$('#replayResult').style.color=r.tone==='good'?'var(--mint)':r.tone==='warn'?'var(--orange)':'var(--red)';if(name!=='clean')addJournal('AUDIT','replay',r.div,r.tone==='warn'?'warn':'bad');}
$$('.replay-case').forEach(b=>b.addEventListener('click',()=>drawReplay(b.dataset.replay)));
function seed(){renderWorkers();renderChecks();chooseFault('crash');drawReplay('clean');['REQUEST accepted','SCHEDULE worker-2','EXECUTE started','OBSERVE result hash','VERIFY Ed25519 evidence','JOURNAL WAL commit'].reverse().forEach((m,i)=>setTimeout(()=>{const [event,...rest]=m.split(' ');addJournal(event,'runtime',rest.join(' '));},i*70));}
seed();
// Ambient topology field
const canvas=$('#field'),ctx=canvas.getContext('2d');let W=0,H=0,DPR=1,pts=[];
function resize(){DPR=Math.min(devicePixelRatio||1,2);W=innerWidth;H=innerHeight;canvas.width=W*DPR;canvas.height=H*DPR;canvas.style.width=W+'px';canvas.style.height=H+'px';ctx.setTransform(DPR,0,0,DPR,0,0);pts=Array.from({length:Math.min(95,Math.max(35,Math.floor(W/24)))},()=>({x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.08,vy:(Math.random()-.5)*.08,t:Math.random()>.75?'o':'v'}));}
function animate(){ctx.clearRect(0,0,W,H);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=W;if(p.x>W)p.x=0;if(p.y<0)p.y=H;if(p.y>H)p.y=0}for(let i=0;i<pts.length;i++)for(let j=i+1;j<pts.length;j++){const a=pts[i],b=pts[j],d=Math.hypot(a.x-b.x,a.y-b.y);if(d<135){const orange=a.t==='o'||b.t==='o';ctx.strokeStyle=orange?`rgba(255,138,52,${(1-d/135)*.035})`:`rgba(161,108,255,${(1-d/135)*.045})`;ctx.lineWidth=.65;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke()}}requestAnimationFrame(animate)}addEventListener('resize',resize,{passive:true});resize();animate();
