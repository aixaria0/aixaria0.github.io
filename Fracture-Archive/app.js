const $=(s,r=document)=>r.querySelector(s),$$=(s,r=document)=>[...r.querySelectorAll(s)];
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x));
const sci=(n,d=2)=>{if(!Number.isFinite(n))return '—';if(n===0)return '0';const e=Math.floor(Math.log10(Math.abs(n)));if(Math.abs(e)>=4)return `${(n/10**e).toFixed(d)}×10^${e}`;return n.toLocaleString(undefined,{maximumFractionDigits:d})};

// --- Hero: one fractured surface, five source volumes ---
const HERO={
 compression:{index:'I / COMPRESSION',type:'MODEL CLASS',status:'ARCHIVE / FIELD NOTES',detail:'Compression opens the archive: pruning, distillation and quantization recorded as engineering trade-offs, not slogans.'},
 pqc:{index:'II / POST-QUANTUM',type:'MODEL CLASS',status:'REFERENCE + EDUCATIONAL',detail:'Standardized parameter sizes sit beside deliberately small NTT and seed demonstrations. Structure is visible; production cryptography is not implied.'},
 holography:{index:'III / HOLOGRAPHY',type:'MODEL CLASS',status:'SCHEMATIC / CONCEPTUAL',detail:'Page-like entropy branches, generalized entropy and Jones-index structure are presented as inspectable conceptual models.'},
 hawking:{index:'IV / MICROSTATES',type:'MODEL CLASS',status:'FORMULA + TOY SPECTRUM',detail:'Hawking temperature and lifetime use compact formulas; emission-channel curves use qualitative graybody-inspired weights.'},
 pbh:{index:'V / PRIMORDIAL',type:'MODEL CLASS',status:'SCHEMATIC ENVELOPE',detail:'PBH constraints, minicluster distributions and lensing observables are simplified desk models, not survey likelihoods.'}
};
function selectShard(key){const d=HERO[key];$$('.shard').forEach(x=>x.classList.toggle('active',x.dataset.volume===key));$('#heroIndex').textContent=d.index;$('#heroType').textContent=d.type;$('#heroStatus').textContent=d.status;$('#heroDetail').textContent=d.detail;$('.lens-readout').animate([{opacity:.35,transform:'translateY(7px)'},{opacity:1,transform:'none'}],{duration:320,easing:'ease-out'});}
$$('.shard').forEach(b=>b.addEventListener('click',()=>selectShard(b.dataset.volume)));
const theatre=$('#fractureTheatre');if(theatre&&matchMedia('(pointer:fine)').matches){theatre.addEventListener('pointermove',e=>{const r=theatre.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;$$('.refraction').forEach((n,i)=>n.style.transform=`translate(${x*(18+i*9)}px,${y*(13+i*6)}px)`);});}

// --- Research kernels mirrored from Fracture Archive ---
const HBAR=1.054571817e-34,C=2.99792458e8,G=6.6743e-11,KB=1.380649e-23,M_SUN=1.98847e30,M_SUN_G=1.98847e33,MEV_J=1.602176634e-13,YEAR=365.25*24*3600;
const hawkingTK=m=>(HBAR*C**3)/(8*Math.PI*G*m*KB);
const hawkingMeV=m=>KB*hawkingTK(m)/MEV_J;
const gStar=t=>t>1e5?108.75:t>150?61.75:t>1?10.75:3.36;
const lifetime=(m,g=10.75)=>(5120*Math.PI*G*G*m**3)/(HBAR*C**4)/(g/10.75)/YEAR;
const pagePower=(m,g=10.75)=>7.8e-29*g*(M_SUN/Math.max(m,1e-6))**2;
const bose=x=>x>40?Math.exp(-x):1/(Math.exp(x)-1),fermi=x=>x>40?Math.exp(-x):1/(Math.exp(x)+1);
const spectrumCfg={scalar:[1,true,0],fermion:[.67,false,0],photon:[2.1,true,0],neutrino:[1.8,false,0],vector:[2,true,0],graviton:[.35,true,2]};
function spectrum(n=140){const out=[];for(let i=0;i<n;i++){const t=i/(n-1),x=.01*(20/.01)**t,row={x};for(const [k,[p,b,extra]] of Object.entries(spectrumCfg)){row[k]=p*x**(3+extra)*(b?bose(x):fermi(x));}out.push(row)}return out}
function normSpectrum(rows,fields){let peak=0;for(const r of rows)for(const k of fields)peak=Math.max(peak,r[k]);return rows.map(r=>{const o={x:r.x};for(const k of fields)o[k]=peak?r[k]/peak:0;return o})}
function pageCurve(n=180){return Array.from({length:n},(_,i)=>{const t=i/(n-1),hawking=Math.min(1,.08+1.15*t),island=t<.48?1.05:Math.max(.04,1.05-1.7*(t-.48));return{t,hawking,island,fine:Math.min(hawking,island)}})}
const generalizedEntropy=(area,sBulk,Gv=1)=>area/(4*Gv)+sBulk;
function fUpper(logM){let f=1;if(logM>=17&&logM<=21.5)f=Math.min(f,.05+.05*((logM-17)/4.5));if(logM>=16.5&&logM<=22.5)f=Math.min(f,.012*10**((logM-19.5)/3));if(logM>21)f=Math.min(f,.006*10**((logM-21)/2));if(logM<18.5)f=Math.min(f,.12*10**((logM-17)/1.5));return Math.max(4e-4,Math.min(1,f))}
function dnd(logM){const mu=19.5,s=1.2,g=Math.exp(-((logM-mu)**2)/(2*s*s)),tail=(10**logM/1e22)**-1*Math.exp(-Math.sqrt(1e22/10**logM));return g+.22*Math.min(tail,4)}
function pbhSeries(n=180){const a=Array.from({length:n},(_,i)=>{const x=16+7*i/(n-1);return{x,f:fUpper(x),d:dnd(x)}}),pk=Math.max(...a.map(x=>x.d));return a.map(x=>({...x,d:x.d/pk}))}
const gamma=(mG,f)=>2.5e-6*f*Math.sqrt(mG/1e20),events=(mG,f)=>1e10*gamma(mG,f),eHours=(mG,v=200)=>.21*24*Math.sqrt(Math.max(mG/M_SUN_G,1e-30))*(200/v);
function ntt(a,q=17,psi=3){const out=a.map(x=>((x%q)+q)%q);for(let m=1;m<out.length;m*=2){for(let start=0;start<out.length;start+=2*m){let w=1;for(let j=0;j<m;j++){const u=out[start+j],v=out[start+j+m]*w%q;out[start+j]=(u+v)%q;out[start+j+m]=(u-v+q)%q;w=w*psi%q}}}return out}
function toySecret(seed){let h=2166136261;for(let i=0;i<seed.length;i++){h^=seed.charCodeAt(i);h=Math.imul(h,16777619)}const hex=(n,len)=>{let s='',x=n>>>0;for(let i=0;i<len;i++){x=Math.imul(x^(x>>>15),2246822519);x=Math.imul(x^(x>>>13),3266489917);s+=(x>>>0).toString(16).padStart(8,'0')}return s.slice(0,len*2)};return{pk:hex(h,8),ct:hex(h^0x9e3779b9,8),ss:hex(h^0x85ebca6b,4)}}
const KEMS={512:{name:'ML-KEM-512',level:'Level 1',pk:800,sk:1632,ct:768,ss:32},768:{name:'ML-KEM-768',level:'Level 3',pk:1184,sk:2400,ct:1088,ss:32},1024:{name:'ML-KEM-1024',level:'Level 5',pk:1568,sk:3168,ct:1568,ss:32}};

const state={mode:'hawking',hawking:{logM:15,fields:['scalar','fermion','photon','neutrino']},holography:{time:.53,area:1.4,sbulk:.32},pbh:{logM:19.5,logF:-1,v:200},pqc:{seed:'fracture',level:768,vector:[1,2,3,4,5,6,7,8]}};
const modes={
 hawking:{title:'Hawking spectrum desk',tag:'FORMULA + TOY',boundary:'Temperature and lifetime use compact formulas. Channel curves are qualitative graybody-inspired weights, not precision emission tables.',axisX:'ω / T_H',axisY:'relative emission'},
 holography:{title:'Island / Page desk',tag:'SCHEMATIC',boundary:'The Page curve is a two-branch conceptual model. It is not a gravity solver or a numerical quantum-extremal-surface calculation.',axisX:'normalized time',axisY:'entropy / normalized'},
 pbh:{title:'PBH observatory desk',tag:'SCHEMATIC',boundary:'Constraint envelopes and event rates are simplified desk models. They are not current survey likelihoods, limits, or forecasts.',axisX:'log10 mass / g',axisY:'normalized / fraction'},
 pqc:{title:'Post-quantum structure desk',tag:'REFERENCE + EDUCATIONAL',boundary:'ML-KEM sizes are reference parameters. The NTT and seed-derived strings are educational demonstrations, not wire-compatible cryptography.',axisX:'coefficient',axisY:'Z₁₇ value'}
};

function controlRange(label,key,min,max,step,value,fmt=v=>v){return `<div class="control"><label><span>${label}</span><b data-out="${key}">${fmt(value)}</b></label><input type="range" data-control="${key}" min="${min}" max="${max}" step="${step}" value="${value}"></div>`}
function controlsFor(mode){
 const s=state[mode];
 if(mode==='hawking')return controlRange('log₁₀ mass / kg','logM',8,23,.05,s.logM,v=>v.toFixed(2))+`<div class="control"><label><span>radiation channels</span><b>${s.fields.length} enabled</b></label><div class="toggle-field">${Object.keys(spectrumCfg).map(k=>`<button data-field="${k}" class="${s.fields.includes(k)?'on':''}">${k.toUpperCase()}</button>`).join('')}</div></div>`;
 if(mode==='holography')return controlRange('normalized time','time',0,1,.005,s.time,v=>v.toFixed(3))+controlRange('area term','area',.1,4,.02,s.area,v=>v.toFixed(2))+controlRange('bulk entropy','sbulk',0,1.5,.01,s.sbulk,v=>v.toFixed(2));
 if(mode==='pbh')return controlRange('log₁₀ mass / g','logM',16,23,.02,s.logM,v=>v.toFixed(2))+controlRange('log₁₀ f_PBH','logF',-4,0,.02,s.logF,v=>v.toFixed(2))+controlRange('relative velocity / km s⁻¹','v',80,500,5,s.v,v=>Math.round(v));
 return `<div class="control"><label><span>seed / local demo</span><b>deterministic</b></label><input type="text" data-control="seed" value="${s.seed.replaceAll('"','&quot;')}" maxlength="28"></div><div class="control"><label><span>ML-KEM parameter set</span><b>${KEMS[s.level].level}</b></label><div class="toggle-field">${Object.keys(KEMS).map(k=>`<button data-level="${k}" class="${+k===s.level?'on':''}">${k}</button>`).join('')}</div></div>`;
}
function presetsFor(mode){if(mode==='hawking')return [['HOT','11'],['MID','15'],['COLD','20']].map(([n,v])=>`<button data-preset="${v}">${n}</button>`).join('');if(mode==='holography')return [['EARLY','.2'],['PAGE','.48'],['LATE','.82']].map(([n,v])=>`<button data-preset="${v}">${n}</button>`).join('');if(mode==='pbh')return [['LIGHT','17.2'],['WINDOW','19.5'],['HEAVY','22']].map(([n,v])=>`<button data-preset="${v}">${n}</button>`).join('');return ['fracture','archive','quantum'].map(v=>`<button data-preset="${v}">${v.toUpperCase()}</button>`).join('')}
function bindControls(){
 $$('[data-control]').forEach(el=>el.addEventListener('input',()=>{const k=el.dataset.control,v=el.type==='range'?+el.value:el.value;state[state.mode][k]=v;const out=$(`[data-out="${k}"]`);if(out)out.textContent=k==='v'?Math.round(v):(+v).toFixed(k==='time'?3:2);renderInstrument(false)}));
 $$('[data-field]').forEach(b=>b.addEventListener('click',()=>{const a=state.hawking.fields,k=b.dataset.field,i=a.indexOf(k);if(i>=0&&a.length>1)a.splice(i,1);else if(i<0)a.push(k);renderMode()}));
 $$('[data-level]').forEach(b=>b.addEventListener('click',()=>{state.pqc.level=+b.dataset.level;renderMode()}));
 $$('[data-preset]').forEach(b=>b.addEventListener('click',()=>{const v=b.dataset.preset,m=state.mode;if(m==='hawking')state.hawking.logM=+v;if(m==='holography')state.holography.time=+v;if(m==='pbh')state.pbh.logM=+v;if(m==='pqc')state.pqc.seed=v;renderMode()}));
}
function setReadouts(items){$('#readoutGrid').innerHTML=items.map(([a,b,c])=>`<div class="readout"><small>${a}</small><b>${b}</b><em>${c||''}</em></div>`).join('')}
function renderMode(){const m=state.mode,d=modes[m];$$('.mode').forEach(b=>b.classList.toggle('active',b.dataset.mode===m));$('#modeTitle').textContent=d.title;$('#modeTag').textContent=d.tag;$('#boundaryCopy').textContent=d.boundary;$('#axisX').textContent=d.axisX;$('#axisY').textContent=d.axisY;$('#controlsHost').innerHTML=controlsFor(m);$('#presetLine').innerHTML=presetsFor(m);bindControls();renderInstrument(true)}
$$('.mode').forEach(b=>b.addEventListener('click',()=>{state.mode=b.dataset.mode;renderMode()}));

const canvas=$('#scope'),ctx=canvas.getContext('2d');let plotTween=1;
function fitCanvas(){const r=canvas.getBoundingClientRect(),d=Math.min(devicePixelRatio||1,2);canvas.width=Math.max(1,Math.floor(r.width*d));canvas.height=Math.max(1,Math.floor(r.height*d));ctx.setTransform(d,0,0,d,0,0);return{w:r.width,h:r.height}}
function grid(w,h){ctx.clearRect(0,0,w,h);ctx.strokeStyle='rgba(255,255,255,.045)';ctx.lineWidth=1;for(let i=0;i<=8;i++){const x=25+(w-50)*i/8;ctx.beginPath();ctx.moveTo(x,18);ctx.lineTo(x,h-24);ctx.stroke()}for(let i=0;i<=5;i++){const y=18+(h-42)*i/5;ctx.beginPath();ctx.moveTo(25,y);ctx.lineTo(w-25,y);ctx.stroke()}}
const COLORS=['#64e6ff','#9878ff','#ff7081','#ffbd6a','#7bf4cf','#5d83ff'];
function line(points,w,h,color,width=1.7,dash=[]){if(!points.length)return;ctx.save();ctx.strokeStyle=color;ctx.lineWidth=width;ctx.setLineDash(dash);ctx.beginPath();points.forEach((p,i)=>{const x=25+p[0]*(w-50),y=h-24-p[1]*(h-42);i?ctx.lineTo(x,y):ctx.moveTo(x,y)});ctx.stroke();ctx.restore()}
function dot(x,y,w,h,color){ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=16;ctx.beginPath();ctx.arc(25+x*(w-50),h-24-y*(h-42),4.5,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}
function drawHawking(w,h){const s=state.hawking,rows=normSpectrum(spectrum(150),s.fields);s.fields.forEach((f,i)=>{const pts=rows.map(r=>[(Math.log10(r.x)-Math.log10(.01))/(Math.log10(20)-Math.log10(.01)),r[f]]);line(pts,w,h,COLORS[i%COLORS.length],1.6)});const mass=10**s.logM,t=hawkingMeV(mass),g=gStar(t),tau=lifetime(mass,g);$('#scopeLabel').textContent=`M = 10^${s.logM.toFixed(2)} kg`;setReadouts([['T_H',`${sci(hawkingTK(mass),2)} K`,'Hawking temperature'],['kT',`${sci(t,2)} MeV`,'thermal scale'],['τ',`${sci(tau,2)} yr`,'lifetime scaling'],['P',`${sci(pagePower(mass,g),2)} W`,'Page-style scaling']])}
function drawHolography(w,h){const s=state.holography,rows=pageCurve(180);line(rows.map(p=>[p.t,p.hawking/1.08]),w,h,'#ffbd6a',1.3,[5,7]);line(rows.map(p=>[p.t,p.island/1.08]),w,h,'#9878ff',1.3,[5,7]);line(rows.map(p=>[p.t,p.fine/1.08]),w,h,'#64e6ff',2.4);const i=Math.round(s.time*(rows.length-1)),p=rows[i];dot(p.t,p.fine/1.08,w,h,'#64e6ff');$('#scopeLabel').textContent=`t = ${s.time.toFixed(3)} / normalized`;setReadouts([['HAWKING',p.hawking.toFixed(3),'rising branch'],['ISLAND',p.island.toFixed(3),'competing branch'],['FINE',p.fine.toFixed(3),'min(saddles)'],['S_GEN',generalizedEntropy(s.area,s.sbulk).toFixed(3),'A/4G + S_bulk']])}
function drawPbh(w,h){const s=state.pbh,rows=pbhSeries(180);line(rows.map(p=>[(p.x-16)/7,p.f]),w,h,'#ff7081',1.8);line(rows.map(p=>[(p.x-16)/7,p.d]),w,h,'#9878ff',1.5);const mass=10**s.logM,f=10**s.logF,fu=fUpper(s.logM),x=(s.logM-16)/7;dot(x,clamp(fu),w,h,'#ffbd6a');$('#scopeLabel').textContent=`M = 10^${s.logM.toFixed(2)} g · f=${sci(f,2)}`;setReadouts([['f UPPER',sci(fu,2),'schematic envelope'],['M / M☉',sci(mass/M_SUN_G,2),'mass ratio'],['Γ',sci(gamma(mass,f),2),'events / star / yr'],['t_E',`${sci(eHours(mass,s.v),2)} h`,'simplified lensing']])}
function drawPqc(w,h){const s=state.pqc,out=ntt(s.vector),max=16,barW=(w-70)/out.length*.64;out.forEach((v,i)=>{const x=35+(w-70)*(i+.5)/out.length,y=(h-48)*v/max;ctx.fillStyle=COLORS[i%COLORS.length];ctx.shadowColor=ctx.fillStyle;ctx.shadowBlur=10;ctx.fillRect(x-barW/2,h-24-y,barW,y);ctx.shadowBlur=0});const d=toySecret(s.seed||'seed'),k=KEMS[s.level];$('#scopeLabel').textContent=`${k.name} · n=8 educational NTT`;setReadouts([['PUBLIC KEY',`${k.pk} B`,k.level],['CIPHERTEXT',`${k.ct} B`,'reference size'],['SHARED SECRET',`${k.ss} B`,'reference size'],['TOY DIGEST',d.ss.slice(0,12)+'…','seed-derived demo']])}
function renderInstrument(animate=true){if(animate)plotTween=0;const {w,h}=fitCanvas();grid(w,h);if(state.mode==='hawking')drawHawking(w,h);if(state.mode==='holography')drawHolography(w,h);if(state.mode==='pbh')drawPbh(w,h);if(state.mode==='pqc')drawPqc(w,h);$('#scopeState').textContent=state.mode==='pqc'?'LOCAL / EDUCATIONAL':'LOCAL MODEL';}
let resizeTimer;addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(()=>renderInstrument(false),80)});

// --- Archive cross-section ---
const CHAPTERS=[
 ['52','Structured pruning under a hard budget','compression','#9878ff'],['55','Quantization without hiding error','compression','#9878ff'],
 ['63','Entropy before key material','pqc','#64e6ff'],['71','Lattice hardness as an engineering boundary','pqc','#64e6ff'],['84','NTT: structure before implementation','pqc','#64e6ff'],['101','ML-KEM parameter surfaces','pqc','#64e6ff'],['117','ML-DSA and Falcon trade spaces','pqc','#64e6ff'],
 ['QEC','Bulk reconstruction as redundancy','holography','#5d83ff'],['MERA','Tensor networks as a geometric lens','holography','#5d83ff'],['QES','Generalized entropy and competing saddles','holography','#5d83ff'],
 ['TH','Horizon temperature from compact formulae','hawking','#ff7081'],['GB','Graybody weights and channel shape','hawking','#ff7081'],['PAGE','Information flow across a Page-like turn','hawking','#ff7081'],
 ['PBH','The asteroid-mass window','pbh','#ffbd6a'],['AX','Axion minicluster mass structure','pbh','#ffbd6a'],['LENS','Microlensing and femtolensing timescales','pbh','#ffbd6a']
];
function renderChapters(filter='all'){$('#chapterTape').innerHTML=CHAPTERS.filter(c=>filter==='all'||c[2]===filter).map(c=>`<article class="chapter" style="--chapter:${c[3]}"><small>${c[0]} / ${c[2].toUpperCase()}</small><b>${c[1]}</b><span>FIELD NOTE · ARCHIVE</span></article>`).join('')}
$$('#chapterFilter button').forEach(b=>b.addEventListener('click',()=>{$$('#chapterFilter button').forEach(x=>x.classList.toggle('active',x===b));renderChapters(b.dataset.filter)}));renderChapters();

// --- Ambient field ---
const amb=$('#ambient'),ac=amb.getContext('2d');let AW=0,AH=0,AD=1,pts=[];function resizeAmb(){AD=Math.min(devicePixelRatio||1,2);AW=innerWidth;AH=innerHeight;amb.width=AW*AD;amb.height=AH*AD;ac.setTransform(AD,0,0,AD,0,0);pts=Array.from({length:Math.max(32,Math.min(90,Math.floor(AW/22)))},()=>({x:Math.random()*AW,y:Math.random()*AH,vx:(Math.random()-.5)*.035,vy:(Math.random()-.5)*.035,r:Math.random()*.8+.15,c:Math.random()}))}function ambientFrame(){ac.clearRect(0,0,AW,AH);for(const p of pts){p.x+=p.vx;p.y+=p.vy;if(p.x<0)p.x=AW;if(p.x>AW)p.x=0;if(p.y<0)p.y=AH;if(p.y>AH)p.y=0;ac.fillStyle=p.c>.66?'rgba(255,112,129,.11)':p.c>.33?'rgba(100,230,255,.1)':'rgba(152,120,255,.1)';ac.beginPath();ac.arc(p.x,p.y,p.r,0,Math.PI*2);ac.fill()}requestAnimationFrame(ambientFrame)}addEventListener('resize',resizeAmb,{passive:true});resizeAmb();ambientFrame();
const aura=$('#cursorAura');if(matchMedia('(pointer:fine)').matches){addEventListener('pointermove',e=>{aura.style.left=e.clientX+'px';aura.style.top=e.clientY+'px';aura.style.opacity='1'},{passive:true});addEventListener('pointerleave',()=>aura.style.opacity='0')}

renderMode();
