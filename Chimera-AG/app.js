const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));

const committee=$('#committee'),diversity=$('#diversity'),strictness=$('#strictness'),compression=$('#compression');
const workerBand=$('#workerBand');
const roles=['REASON','CODE','RESEARCH','CRITIC','MATH','MULTILINGUAL','PLANNER','REVIEW'];
const notes=['independent chain','implementation view','source synthesis','failure search','bounded solver','cross-language','task structure','gate pressure'];

function updateRangeLabels(){
  $('#committeeValue').textContent=committee.value;
  $('#diversityValue').textContent=diversity.value;
  $('#strictnessValue').textContent=strictness.value;
  $('#compressionValue').textContent=compression.value;
}
function renderWorkers(){
  const n=+committee.value; workerBand.innerHTML='';
  for(let i=0;i<8;i++){
    const cell=document.createElement('div');
    cell.className='worker-cell'+(i>=n?' dim':'');
    cell.innerHTML=`<i></i><small>W${i+1}</small><b>${roles[i]}</b><p>${i<n?notes[i]:'not selected'}</p>`;
    workerBand.appendChild(cell);
  }
  const d=+diversity.value/100,s=+strictness.value/100,c=+compression.value/100;
  const disagreement=clamp(.12+d*.46+(n-2)*.025-c*.08,.05,.82);
  const correlation=clamp(.68-d*.55+(n>6?.06:0),.06,.86);
  $('#disagreement').textContent=disagreement.toFixed(2);
  $('#correlation').textContent=correlation<.3?'LOW':correlation<.58?'MED':'HIGH';
  $('#pressure').textContent=s.toFixed(2);
  $('#disagreementBar').style.width=(disagreement*100)+'%';
  $('#correlationBar').style.width=(correlation*100)+'%';
  $('#pressureBar').style.width=(s*100)+'%';
  $('#synthMeter').style.width=compression.value+'%';
  const candidate=s>.78?'STRICT REVIEW':correlation>.58?'CHALLENGE':'CANDIDATE';
  $('#gateResult').textContent=candidate;
  $('#synthesisText').textContent=`${n} perspectives selected; ${Math.round(disagreement*100)}% modeled disagreement preserved for verifier review.`;
}
[committee,diversity,strictness,compression].forEach(el=>el.addEventListener('input',()=>{updateRangeLabels();renderWorkers()}));

const PRESETS={
  fast:{committee:2,diversity:38,strictness:48,compression:76,label:'FAST'},
  balanced:{committee:4,diversity:68,strictness:74,compression:56,label:'BALANCED'},
  adversarial:{committee:7,diversity:92,strictness:91,compression:34,label:'ADVERSARIAL'}
};
$$('[data-preset]').forEach(btn=>btn.addEventListener('click',()=>{
  const p=PRESETS[btn.dataset.preset];committee.value=p.committee;diversity.value=p.diversity;strictness.value=p.strictness;compression.value=p.compression;
  $$('.preset-row button').forEach(b=>b.classList.toggle('active',b===btn));$('#presetName').textContent=p.label;updateRangeLabels();renderWorkers();
}));

$('#runCouncil').addEventListener('click',async()=>{
  const b=$('#runCouncil');b.disabled=true;b.textContent='FAN-OUT…';
  $('#sessionId').textContent='CNL—'+Math.random().toString(16).slice(2,6).toUpperCase();
  $('#verifierA').textContent=$('#verifierB').textContent=$('#gateResult').textContent='PENDING';
  [...workerBand.children].forEach((c,i)=>{if(!c.classList.contains('dim'))setTimeout(()=>c.animate([{background:'rgba(137,156,255,.18)'},{background:'transparent'}],{duration:500}),i*70)});
  await wait(500);b.textContent='SYNTHESIZING…';$('#synthesisText').textContent='Compressing overlap while retaining disagreement and dissent…';
  await wait(520);b.textContent='VERIFYING…';
  const risk=$('#correlation').textContent,pressure=+strictness.value;
  $('#verifierA').textContent=risk==='HIGH'?'REJECT':'REVIEW';await wait(220);
  $('#verifierB').textContent=(risk==='HIGH'&&pressure>70)?'REJECT':'REVIEW';await wait(260);
  $('#gateResult').textContent=risk==='HIGH'?'BLOCKED':pressure>82?'STRICT REVIEW':'CANDIDATE';
  $('#synthesisText').textContent=`${committee.value} perspectives processed; disagreement remains explicit for review.`;
  b.disabled=false;b.textContent='RUN SYNTHESIS MODEL';
});

const routeData={
 reasoning:{committee:'R2 · M1 · V1',why:'reasoning coverage / bounded latency',weights:[.92,.45,.54,.28,.87,.36],labels:['Reasoner-α','Coder-β','Research-γ','Critic-δ','Math-ε','Polyglot-ζ']},
 coding:{committee:'C2 · P1 · V1',why:'implementation / planning / test pressure',weights:[.52,.94,.38,.62,.48,.31],labels:['Reasoner-α','Coder-β','Research-γ','Critic-δ','Math-ε','Polyglot-ζ']},
 research:{committee:'R1 · S2 · V1',why:'source diversity / synthesis pressure',weights:[.49,.36,.95,.72,.32,.58],labels:['Reasoner-α','Coder-β','Research-γ','Critic-δ','Math-ε','Polyglot-ζ']},
 multilingual:{committee:'P2 · R1 · V1',why:'cross-language coverage / verification',weights:[.42,.35,.62,.44,.29,.96],labels:['Reasoner-α','Coder-β','Research-γ','Critic-δ','Math-ε','Polyglot-ζ']}
};
let currentTask='reasoning';
function renderRoute(task=currentTask){
  currentTask=task; const d=routeData[task];
  $$('.task-selector button').forEach(b=>b.classList.toggle('active',b.dataset.task===task));
  const quality=+$('#quality').value/100,latency=+$('#latency').value/100,budget=+$('#budget').value;
  const scored=d.weights.map((w,i)=>({i,score:w*quality+(1-Math.abs(.55-w))*latency*.25})).sort((a,b)=>b.score-a.score);
  const selected=scored.slice(0,Math.max(1,Math.min(4,budget))).map(x=>x.i);
  $('#routePool').innerHTML=d.labels.map((name,i)=>`<div class="model-chip ${selected.includes(i)?'selected':''}"><i></i><b>${name}</b><span>fit ${(d.weights[i]*100|0)} / route ${task}</span></div>`).join('');
  $('#routeCommittee').textContent=d.committee;$('#routeWhy').textContent=d.why;$('#routePromotion').textContent='HUMAN-REVIEWED';
}
$$('[data-task]').forEach(b=>b.addEventListener('click',()=>renderRoute(b.dataset.task)));
['latency','budget','quality'].forEach(id=>$('#'+id).addEventListener('input',()=>{if(id==='latency')$('#latencyValue').textContent=$('#latency').value;if(id==='budget')$('#budgetValue').textContent=$('#budget').value;if(id==='quality')$('#qualityValue').textContent=$('#quality').value;renderRoute()}));
$('#reroute').addEventListener('click',()=>{renderRoute();$('#routePool').animate([{opacity:.35,transform:'translateY(5px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'})});

let correlated=false;
function renderTrap(){
  const labels=correlated?['same premise','same premise','same premise','critic detects trap']:['independent A','independent B','independent C','critic'];
  $('#trapWorkers').innerHTML=labels.map((x,i)=>`<div class="trap-worker ${correlated&&i<3?'correlated':''}"><span>W${i+1}</span><b>${i===3?'CRITIC':'WORKER'}</b><small>${x}</small></div>`).join('');
  $('#trapObservation').textContent=correlated?'HIGH AGREEMENT / LOW VALUE':'DIVERSE';
  $('#trapText').textContent=correlated?'Three workers repeat the same wrong premise. Agreement increased while evidential value collapsed.':'Independent disagreement gives verifiers something useful to inspect.';
  $('#toggleCorrelation').textContent=correlated?'RESTORE INDEPENDENCE':'INJECT CORRELATED PREMISE';
}
$('#toggleCorrelation').addEventListener('click',()=>{correlated=!correlated;renderTrap()});

function wait(ms){return new Promise(r=>setTimeout(r,ms))}
updateRangeLabels();renderWorkers();renderRoute();renderTrap();

// subtle routing-field pointer response; keeps geometry minimal
if(matchMedia('(pointer:fine)').matches){
  const field=$('#routingField');field.addEventListener('pointermove',e=>{const r=field.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;field.style.setProperty('--px',x);field.style.setProperty('--py',y);$('.rf-core').style.transform=`translate(-50%,-50%) translate(${x*8}px,${y*8}px)`});field.addEventListener('pointerleave',()=>$('.rf-core').style.transform='translate(-50%,-50%)');
}