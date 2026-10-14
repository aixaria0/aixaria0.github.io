const SCENARIOS={
  match:{verdict:"LOCALLY SUPPORTED",detail:"All supplied state commitments match under the selected bounded predicate.",divergence:"NONE",integrity:"CONFIRMED",result:"supported",evidence:"bound",digest:"c2fde1c46452cbe0…fee8c1c5",cells:["ok","ok","ok","ok"]},
  diverge:{verdict:"CONTRADICTED",detail:"The evidence remains structurally bound, but observed state diverges from the expected trace.",divergence:"INDEX 2",integrity:"CONFIRMED",result:"contradicted",evidence:"bound",digest:"7434c43f0bb8122a…9d115ea2",cells:["ok","ok","mismatch","mismatch"]},
  tamper:{verdict:"REJECTED",detail:"Evidence bytes no longer satisfy the externally selected digest boundary. No semantic verdict is promoted.",divergence:"NOT ASSESSED",integrity:"FAILED",result:"rejected",evidence:"tampered",digest:"digest mismatch / fail closed",cells:["tampered","tampered","tampered","tampered"]},
  unknown:{verdict:"INCONCLUSIVE",detail:"The supplied package does not establish every required dimension. OMEGA preserves the gap instead of guessing.",divergence:"UNKNOWN",integrity:"CONFIRMED",result:"unknown",evidence:"insufficient",digest:"1f4a0e983fca75d1…b3e6b118",cells:["ok","ok","unknown","unknown"]}
};
const labels=["s0","s1","s2","s3"];
const grid=document.querySelector("#trace-grid");
const verdict=document.querySelector("#verdict");
const detail=document.querySelector("#verdict-detail");
const divergence=document.querySelector("#divergence");
const integrity=document.querySelector("#integrity");
const resultLabel=document.querySelector("#result-label");
const evidenceLabel=document.querySelector("#evidence-label");
const digest=document.querySelector("#digest");
const mutate=document.querySelector("#mutate");
let current="match";
function drawTrace(kind){
  grid.innerHTML="";
  SCENARIOS[kind].cells.forEach((state,i)=>{
    const cell=document.createElement("div");
    cell.className="trace-cell "+state;
    cell.innerHTML=`<span>${labels[i].toUpperCase()} / ${String(i).padStart(2,"0")}</span><b>${state==="mismatch"?"Δ DETECTED":state==="tampered"?"INTEGRITY FAIL":state==="unknown"?"NO EVIDENCE":"MATCH"}</b>`;
    grid.appendChild(cell);
  });
}
function applyScenario(kind){
  current=kind;
  document.querySelectorAll(".scenario").forEach(x=>x.classList.toggle("active",x.dataset.scenario===kind));
  const s=SCENARIOS[kind];
  verdict.textContent=s.verdict;
  verdict.style.color=kind==="match"?"#d7ff66":kind==="diverge"?"#ff6e6e":kind==="tamper"?"#ffd15c":"#a4ada7";
  detail.textContent=s.detail; divergence.textContent=s.divergence; integrity.textContent=s.integrity;
  resultLabel.textContent=s.result; evidenceLabel.textContent=s.evidence; digest.textContent=s.digest;
  drawTrace(kind);
  document.querySelectorAll(".node").forEach(n=>n.classList.add("active"));
  if(kind==="tamper"){document.querySelector('[data-node="evidence"]').classList.remove("active");document.querySelector('[data-node="verdict"]').classList.remove("active");}
  document.querySelector("#session-id").textContent="SESSION "+Math.random().toString(16).slice(2,6).toUpperCase();
}
document.querySelectorAll(".scenario").forEach(btn=>btn.addEventListener("click",()=>applyScenario(btn.dataset.scenario)));
mutate.addEventListener("click",()=>{const before=mutate.textContent;mutate.textContent="MUTATION APPLIED";applyScenario(current==="match"?"diverge":"tamper");setTimeout(()=>{mutate.textContent=before},1100);});
drawTrace("match");
const canvas=document.querySelector("#field"); const ctx=canvas.getContext("2d"); let w=0,h=0,dpr=1,nodes=[];
function resize(){dpr=Math.min(devicePixelRatio||1,2);w=innerWidth;h=innerHeight;canvas.width=w*dpr;canvas.height=h*dpr;canvas.style.width=w+"px";canvas.style.height=h+"px";ctx.setTransform(dpr,0,0,dpr,0,0);const count=Math.max(25,Math.floor(w/42));nodes=Array.from({length:count},()=>({x:Math.random()*w,y:Math.random()*h,vx:(Math.random()-.5)*.11,vy:(Math.random()-.5)*.11,r:Math.random()*1.2+.3}));}
function tick(){ctx.clearRect(0,0,w,h);nodes.forEach(n=>{n.x+=n.vx;n.y+=n.vy;if(n.x<-10)n.x=w+10;if(n.x>w+10)n.x=-10;if(n.y<-10)n.y=h+10;if(n.y>h+10)n.y=-10});for(let i=0;i<nodes.length;i++)for(let j=i+1;j<nodes.length;j++){const a=nodes[i],b=nodes[j],dx=a.x-b.x,dy=a.y-b.y,dist=Math.hypot(dx,dy);if(dist<150){ctx.strokeStyle=`rgba(140,160,145,${(1-dist/150)*.07})`;ctx.lineWidth=.6;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}}nodes.forEach(n=>{ctx.fillStyle="rgba(215,255,102,.15)";ctx.beginPath();ctx.arc(n.x,n.y,n.r,0,Math.PI*2);ctx.fill()});requestAnimationFrame(tick);}
addEventListener("resize",resize,{passive:true});resize();tick();
const obs=new IntersectionObserver(entries=>entries.forEach(e=>{if(e.isIntersecting)e.target.classList.add("seen")}),{threshold:.12});
document.querySelectorAll(".arch-card,.protocol-step,.bound-col").forEach(el=>{el.style.opacity="0";el.style.transform="translateY(18px)";el.style.transition="opacity .55s ease, transform .55s ease";obs.observe(el)});
const style=document.createElement("style");style.textContent=".seen{opacity:1!important;transform:none!important}";document.head.appendChild(style);
