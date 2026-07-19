
const KEY = "energie_repas_v1";
let meals = JSON.parse(localStorage.getItem(KEY) || "[]");
let deferredPrompt = null;

const $ = id => document.getElementById(id);
const save = () => { localStorage.setItem(KEY, JSON.stringify(meals)); render(); };
const fmt = iso => new Date(iso).toLocaleString("fr-CA",{dateStyle:"medium",timeStyle:"short"});
const esc = s => (s||"").replace(/[&<>"']/g, m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));

function setNow(){
  const d = new Date(); d.setMinutes(d.getMinutes()-d.getTimezoneOffset());
  $("mealTime").value = d.toISOString().slice(0,16);
}
function avg(arr){ const v=arr.filter(x=>Number.isFinite(x)); return v.length ? v.reduce((a,b)=>a+b,0)/v.length : null; }

function render(){
  const today = new Date().toDateString();
  const todayMeals = meals.filter(m=>new Date(m.time).toDateString()===today);
  $("todayMeals").textContent = todayMeals.length;
  const fatigueVals = todayMeals.flatMap(m=>[m.before,m.after1,m.after3]).filter(v=>Number.isFinite(v));
  const a = avg(fatigueVals); $("avgFatigue").textContent = a===null ? "—" : a.toFixed(1);
  const sleeps = todayMeals.map(m=>m.sleep).filter(v=>Number.isFinite(v));
  const s = avg(sleeps); $("sleepToday").textContent = s===null ? "—" : s.toFixed(1)+" h";

  const sorted = [...meals].sort((a,b)=>new Date(b.time)-new Date(a.time));
  $("mealList").innerHTML = sorted.length ? sorted.slice(0,20).map(m=>`
    <div class="meal">
      ${m.photo ? `<img src="${m.photo}" alt="">` : `<div class="photo-placeholder">🍽️</div>`}
      <div><h3>${esc(m.text)}</h3><p>${fmt(m.time)} · ${esc(m.size)} · avant ${m.before}/10${Number.isFinite(m.after1)?` · 1 h ${m.after1}/10`:""}${Number.isFinite(m.after3)?` · 3 h ${m.after3}/10`:""}</p></div>
      <span class="badge">${Number.isFinite(m.after3)?"Complet":"À suivre"}</span>
    </div>`).join("") : "Aucun repas enregistré.";

  const pending = sorted.filter(m=>!Number.isFinite(m.after1)||!Number.isFinite(m.after3));
  $("pendingList").innerHTML = pending.length ? pending.map(m=>`
    <div class="pending"><div><strong>${esc(m.text)}</strong><div class="empty">${fmt(m.time)}</div></div>
    <button onclick="openFollow('${m.id}')">Compléter</button></div>`).join("") : "Aucun suivi en attente.";

  renderTrends();
}

function renderTrends(){
  const completed = meals.filter(m=>Number.isFinite(m.after1)||Number.isFinite(m.after3));
  if(completed.length<3){ $("trendList").innerHTML="Ajoute au moins 3 suivis complétés pour voir les tendances."; return; }
  const words = {};
  completed.forEach(m=>{
    const tokens=(m.text.toLowerCase().match(/[a-zàâçéèêëîïôûùüÿñæœ]{3,}/g)||[])
      .filter(w=>!["avec","dans","pour","sans","une","des","les","aux","sur","mon","mes","repas"].includes(w));
    [...new Set(tokens)].forEach(w=>{
      words[w]??={n:0,d1:[],d3:[]}; words[w].n++;
      if(Number.isFinite(m.after1)) words[w].d1.push(m.after1-m.before);
      if(Number.isFinite(m.after3)) words[w].d3.push(m.after3-m.before);
    });
  });
  const rows=Object.entries(words).filter(([,v])=>v.n>=2).map(([w,v])=>({w,...v,a1:avg(v.d1),a3:avg(v.d3)}))
    .sort((a,b)=>(b.a3??b.a1??-99)-(a.a3??a.a1??-99)).slice(0,8);
  $("trendList").innerHTML = rows.length ? rows.map(r=>`
    <div class="trend"><strong>${esc(r.w)} · ${r.n} repas</strong>
    <span>Variation moyenne : ${r.a1===null?"—":(r.a1>=0?"+":"")+r.a1.toFixed(1)} à 1 h · ${r.a3===null?"—":(r.a3>=0?"+":"")+r.a3.toFixed(1)} à 3 h</span></div>`).join("")
    : "Pas encore assez de répétitions d’un même aliment.";
}

$("openForm").onclick=()=>{ $("mealForm").reset(); setNow(); $("fatigueBefore").value=5; $("beforeOut").textContent=5; $("photoPreview").classList.add("hidden"); $("mealDialog").showModal(); };
$("closeDialog").onclick=()=>$("mealDialog").close();
$("closeFollow").onclick=()=>$("followDialog").close();
$("fatigueBefore").oninput=e=>$("beforeOut").textContent=e.target.value;
$("fatigueAfter1").oninput=e=>$("after1Out").textContent=e.target.value;
$("fatigueAfter3").oninput=e=>$("after3Out").textContent=e.target.value;

$("mealPhoto").onchange = e=>{
  const f=e.target.files[0]; if(!f)return;
  const reader=new FileReader(); reader.onload=()=>{$("photoPreview").src=reader.result;$("photoPreview").classList.remove("hidden");}; reader.readAsDataURL(f);
};

$("mealForm").onsubmit=e=>{
  e.preventDefault();
  const sleep = parseFloat($("sleepHours").value);
  meals.push({
    id: crypto.randomUUID ? crypto.randomUUID() : String(Date.now()),
    time:$("mealTime").value,
    text:$("mealText").value.trim(),
    size:$("mealSize").value,
    before:Number($("fatigueBefore").value),
    after1:null, after3:null,
    sleep:Number.isFinite(sleep)?sleep:null,
    notes:$("notes").value.trim(),
    photo:$("photoPreview").classList.contains("hidden")?null:$("photoPreview").src
  });
  save(); $("mealDialog").close();
};

window.openFollow=id=>{
  const m=meals.find(x=>x.id===id); if(!m)return;
  $("followId").value=id; $("followMealName").textContent=m.text;
  $("fatigueAfter1").value=Number.isFinite(m.after1)?m.after1:5; $("after1Out").textContent=$("fatigueAfter1").value;
  $("fatigueAfter3").value=Number.isFinite(m.after3)?m.after3:5; $("after3Out").textContent=$("fatigueAfter3").value;
  $("followDialog").showModal();
};
$("followForm").onsubmit=e=>{
  e.preventDefault(); const m=meals.find(x=>x.id===$("followId").value); if(!m)return;
  m.after1=Number($("fatigueAfter1").value); m.after3=Number($("fatigueAfter3").value);
  save(); $("followDialog").close();
};

$("exportBtn").onclick=()=>{
  const headers=["Date","Repas","Taille","Fatigue avant","Fatigue 1 h","Fatigue 3 h","Sommeil","Notes"];
  const q=v=>`"${String(v??"").replaceAll('"','""')}"`;
  const csv=[headers.join(","),...meals.map(m=>[m.time,m.text,m.size,m.before,m.after1,m.after3,m.sleep,m.notes].map(q).join(","))].join("\n");
  const a=document.createElement("a"); a.href=URL.createObjectURL(new Blob(["\ufeff"+csv],{type:"text/csv"})); a.download="suivi-energie-repas.csv"; a.click();
};
$("clearBtn").onclick=()=>{ if(confirm("Effacer définitivement tous les repas enregistrés sur cet appareil?")){meals=[];save();} };

window.addEventListener("beforeinstallprompt",e=>{e.preventDefault();deferredPrompt=e;$("installBtn").classList.remove("hidden");});
$("installBtn").onclick=async()=>{ if(!deferredPrompt)return; deferredPrompt.prompt(); await deferredPrompt.userChoice; deferredPrompt=null; $("installBtn").classList.add("hidden"); };

if("serviceWorker" in navigator) navigator.serviceWorker.register("sw.js");
setNow(); render();
