(() => {
"use strict";

const APP_KEY = "energieRepasDB";
const BACKUP_KEY = "energieRepasBackups";
const CURRENT_VERSION = 2;
const LEGACY_KEYS = [
  "energieRepasData","energie_et_repas","energyMeals","mealTrackerData",
  "fatigueMeals","repasFatigue","energieRepas","appData"
];

const $ = s => document.querySelector(s);
const $$ = s => [...document.querySelectorAll(s)];
const todayKey = () => new Date().toLocaleDateString("en-CA");
const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(16).slice(2)}`;
const esc = v => String(v ?? "").replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp = (n,a,b) => Math.max(a,Math.min(b,Number(n)||0));

function emptyDB(){
  return {
    version: CURRENT_VERSION,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    settings: { waterGoal: 8, theme: "system" },
    days: {}
  };
}

function normalizeMeal(raw = {}, fallbackDate = todayKey()){
  return {
    id: raw.id || uid(),
    date: raw.date || raw.day || fallbackDate,
    time: raw.time || raw.heure || "12:00",
    type: raw.type || raw.mealType || raw.typeRepas || "Repas",
    description: raw.description || raw.food || raw.aliments || raw.repas || raw.details || "",
    category: raw.category || raw.categorie || "Autre",
    quantity: raw.quantity || raw.quantite || "",
    fatigueBefore: Number(raw.fatigueBefore ?? raw.fatigueAvant ?? raw.before ?? 0),
    fatigue1h: Number(raw.fatigue1h ?? raw.after1h ?? raw.fatigueApres1h ?? 0),
    fatigue3h: Number(raw.fatigue3h ?? raw.after3h ?? raw.fatigueApres3h ?? 0),
    notes: raw.notes || "",
    photo: raw.photo || raw.image || null,
    createdAt: raw.createdAt || new Date().toISOString()
  };
}

function ensureDay(db, key = todayKey()){
  if(!db.days[key]) db.days[key] = {
    date:key, sleepHours:null, sleepQuality:null, water:0,
    activities:[], meals:[], createdAt:new Date().toISOString()
  };
  const d = db.days[key];
  d.activities = Array.isArray(d.activities) ? d.activities : [];
  d.meals = Array.isArray(d.meals) ? d.meals : [];
  d.water = Number(d.water)||0;
  return d;
}

function migrate(raw){
  const fresh = emptyDB();
  if(!raw || typeof raw !== "object") return fresh;

  if(raw.version === CURRENT_VERSION && raw.days){
    const db = {...fresh, ...raw, settings:{...fresh.settings,...raw.settings}, days:{}};
    Object.entries(raw.days).forEach(([key,d])=>{
      db.days[key] = {
        date:key,
        sleepHours:d.sleepHours ?? d.sleep ?? null,
        sleepQuality:d.sleepQuality ?? null,
        water:Number(d.water ?? d.waterGlasses ?? 0)||0,
        activities:Array.isArray(d.activities)?d.activities:[],
        meals:(d.meals||[]).map(m=>normalizeMeal(m,key)),
        createdAt:d.createdAt||new Date().toISOString()
      };
    });
    return db;
  }

  // Formats journaliers proches de V2.
  if(raw.days && typeof raw.days === "object"){
    const db = fresh;
    Object.entries(raw.days).forEach(([key,d])=>{
      db.days[key] = {
        date:key,
        sleepHours:d.sleepHours ?? d.sleep ?? d.sommeil ?? null,
        sleepQuality:d.sleepQuality ?? d.qualiteSommeil ?? null,
        water:Number(d.water ?? d.waterGlasses ?? d.eau ?? 0)||0,
        activities:Array.isArray(d.activities)?d.activities:[],
        meals:(d.meals||d.repas||[]).map(m=>normalizeMeal(m,key))
      };
    });
    db.settings = {...fresh.settings,...(raw.settings||{})};
    return db;
  }

  // Anciens formats basés sur un tableau de repas.
  const candidates = [
    raw.meals, raw.repas, raw.entries, raw.history, raw.logs,
    Array.isArray(raw) ? raw : null
  ].find(Array.isArray);

  if(candidates){
    const db = fresh;
    candidates.forEach(item=>{
      const meal = normalizeMeal(item);
      const day = ensureDay(db, meal.date);
      day.meals.push(meal);
      if(day.sleepHours == null) day.sleepHours = item.sleepHours ?? item.sleep ?? item.sommeil ?? null;
      if(!day.water) day.water = Number(item.water ?? item.eau ?? item.waterGlasses ?? 0)||0;
    });
    return db;
  }
  return fresh;
}

function createBackup(payload, reason="auto"){
  try{
    const backups = JSON.parse(localStorage.getItem(BACKUP_KEY) || "[]");
    backups.unshift({at:new Date().toISOString(),reason,payload});
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0,10)));
  }catch(e){ console.warn("Backup impossible", e); }
}

function discoverLegacy(){
  const found = [];
  for(let i=0;i<localStorage.length;i++){
    const key = localStorage.key(i);
    if(key === APP_KEY || key === BACKUP_KEY) continue;
    try{
      const val = JSON.parse(localStorage.getItem(key));
      if(val && (Array.isArray(val) || val.meals || val.repas || val.entries || val.days)) found.push({key,val});
    }catch(_){}
  }
  for(const key of LEGACY_KEYS){
    if(found.some(x=>x.key===key)) continue;
    try{
      const val = JSON.parse(localStorage.getItem(key));
      if(val) found.push({key,val});
    }catch(_){}
  }
  return found;
}

function loadDB(){
  const existing = localStorage.getItem(APP_KEY);
  if(existing){
    try{
      const parsed = JSON.parse(existing);
      if(parsed.version !== CURRENT_VERSION) createBackup(parsed,"avant-migration");
      return migrate(parsed);
    }catch(e){
      createBackup(existing,"données-illisibles");
    }
  }
  const legacy = discoverLegacy();
  if(legacy.length){
    createBackup(legacy,"import-automatique-ancien-format");
    const merged = emptyDB();
    legacy.forEach(({val})=>{
      const part = migrate(val);
      Object.entries(part.days).forEach(([key,d])=>{
        const target = ensureDay(merged,key);
        target.meals.push(...d.meals.filter(m=>!target.meals.some(x=>x.id===m.id)));
        if(target.sleepHours == null) target.sleepHours = d.sleepHours;
        if(!target.water) target.water = d.water;
        target.activities.push(...d.activities);
      });
    });
    return merged;
  }
  return emptyDB();
}

let db = loadDB();
let currentView = "today";

function saveDB(reason="save"){
  db.updatedAt = new Date().toISOString();
  localStorage.setItem(APP_KEY, JSON.stringify(db));
  // Shadow copy: a second independent copy on every save.
  localStorage.setItem(`${APP_KEY}_shadow`, JSON.stringify(db));
  if(reason === "important") createBackup(db,"sauvegarde-importante");
}

function formatDate(key, opts={weekday:"long",day:"numeric",month:"long"}){
  return new Date(`${key}T12:00:00`).toLocaleDateString("fr-CA",opts);
}
function avg(arr){ const nums=arr.filter(n=>Number.isFinite(Number(n))).map(Number); return nums.length?nums.reduce((a,b)=>a+b,0)/nums.length:null; }
function mealEmoji(type){
  return ({Déjeuner:"🥣",Dîner:"🥗",Souper:"🍲",Collation:"🍎",Boisson:"☕"})[type] || "🍽️";
}
function photoOrEmoji(m){
  return m.photo ? `<img class="meal-thumb" src="${m.photo}" alt="">` : `<div class="meal-thumb">${mealEmoji(m.type)}</div>`;
}

function render(){
  $("#todayLabel").textContent = formatDate(todayKey(),{weekday:"long",day:"numeric",month:"long"});
  $$(".nav-item").forEach(b=>b.classList.toggle("active",b.dataset.view===currentView));
  ({today:renderToday,history:renderHistory,insights:renderInsights,profile:renderProfile}[currentView])();
}

function renderToday(){
  const d = ensureDay(db);
  const goal = db.settings.waterGoal || 8;
  const fatigue = avg(d.meals.map(m=>m.fatigueBefore));
  const activity = d.activities.reduce((s,a)=>s+(Number(a.minutes)||0),0);
  const waterDrops = Array.from({length:goal},(_,i)=>`<button class="drop ${i<d.water?"filled":""}" data-water="${i+1}" aria-label="Mettre l'eau à ${i+1} verres">💧</button>`).join("");
  const meals = [...d.meals].sort((a,b)=>a.time.localeCompare(b.time));

  $("#app").innerHTML = `
    <section class="hero">
      <div class="row">
        <div><p class="eyebrow">Ton tableau du jour</p><h2>${greeting()}</h2><p>${dailyMessage(d)}</p></div>
        <div class="mascot">${fatigue!=null&&fatigue>6?"🥱":"🌱"}</div>
      </div>
    </section>

    <section class="grid">
      <article class="card">
        <div class="row"><span>😴</span><button class="secondary small" id="editDay">Modifier</button></div>
        <h3>Sommeil</h3><div class="metric">${d.sleepHours ?? "—"}${d.sleepHours!=null?" h":""}</div>
        <div class="muted small">${d.sleepQuality!=null?`Qualité ${d.sleepQuality}/10`:"À indiquer une fois"}</div>
      </article>
      <article class="card">
        <div class="row"><span>🚶</span><button class="secondary small" id="addActivity">Ajouter</button></div>
        <h3>Activité</h3><div class="metric">${activity} min</div>
        <div class="muted small">${d.activities.map(a=>esc(a.type)).join(", ") || "Aucune activité inscrite"}</div>
      </article>
      <article class="card wide">
        <div class="row"><div><span>💧</span><h3>Hydratation</h3></div><button class="secondary small" id="minusWater">−1</button></div>
        <div class="water-row">${waterDrops}</div>
        <div class="row"><strong>${d.water} / ${goal} verres</strong><span class="muted small">${Math.round(Math.min(1,d.water/goal)*100)} %</span></div>
      </article>
      <article class="card wide">
        <div class="row"><div><span>⚡</span><h3>Énergie observée</h3></div><div class="metric">${fatigue==null?"—":(10-fatigue).toFixed(1)}</div></div>
        <div class="progress"><span style="width:${fatigue==null?0:(10-fatigue)*10}%"></span></div>
        <p class="muted small">Basé sur la fatigue indiquée avant tes repas; ce n'est pas un diagnostic.</p>
      </article>
    </section>

    ${nutritionNudge(d)}

    <div class="section-title"><h2>Repas d'aujourd'hui</h2><button class="primary" id="addMeal">+ Ajouter</button></div>
    <section class="stack">
      ${meals.length ? meals.map(mealCard).join("") : `<article class="card empty"><div class="food-art">🍓🥑</div><h3>Ton assiette est encore vide</h3><p class="muted">Ajoute ton premier repas de la journée.</p></article>`}
    </section>`;

  $("#editDay").onclick = openDayDialog;
  $("#addActivity").onclick = openDayDialog;
  $("#addMeal").onclick = ()=>openMealDialog();
  $("#minusWater").onclick = ()=>{ d.water=Math.max(0,d.water-1); saveDB(); render(); };
  $$("[data-water]").forEach(btn=>btn.onclick=()=>{
    const n=Number(btn.dataset.water); d.water = d.water===n ? n-1 : n; saveDB(); render();
  });
  $$("[data-edit-meal]").forEach(btn=>btn.onclick=()=>openMealDialog(btn.dataset.editMeal));
  $$("[data-delete-meal]").forEach(btn=>btn.onclick=()=>{
    if(confirm("Supprimer ce repas?")){ d.meals=d.meals.filter(m=>m.id!==btn.dataset.deleteMeal); saveDB("important"); render(); }
  });
}

function greeting(){
  const h=new Date().getHours();
  return h<11?"Bon matin 👋":h<17?"Bonjour 👋":"Bonsoir 👋";
}
function dailyMessage(d){
  if(!d.sleepHours) return "Commence par inscrire ton sommeil.";
  if(d.water<2 && new Date().getHours()>13) return "Une petite gorgée ferait du bien à ta journée.";
  if(!d.meals.length) return "Prêt à découvrir ce qui nourrit ton énergie?";
  return "Chaque donnée t'aide à mieux comprendre ton énergie.";
}
function nutritionNudge(d){
  if(d.meals.length<2) return "";
  const sweet=d.meals.filter(m=>/sucr|boisson énergisante/i.test(m.category)).length;
  const fatty=d.meals.filter(m=>/gras|frit/i.test(m.category)).length;
  let msg="";
  if(sweet>=2) msg="Ta journée semble déjà assez sucrée. Au prochain repas, pense à quelque chose de plus riche en fibres ou en protéines.";
  else if(fatty>=2) msg="Tu as noté plusieurs repas riches ou frits aujourd'hui. Un prochain repas plus léger pourrait équilibrer la journée.";
  if(!msg) return "";
  return `<div class="notice"><strong>🌿 Petite suggestion</strong><p>${msg}</p><span class="small muted">Suggestion générale, sans jugement et sans valeur médicale.</span></div>`;
}
function mealCard(m){
  return `<article class="card meal-card">
    ${photoOrEmoji(m)}
    <div>
      <div class="row"><div><h3>${esc(m.type)} · ${esc(m.time)}</h3><div class="meal-meta">${esc(m.description)}</div></div>
      <div><button class="icon-button" data-edit-meal="${m.id}" aria-label="Modifier">✎</button></div></div>
      <div class="chips"><span class="chip">${esc(m.category)}</span><span class="chip">Fatigue ${m.fatigueBefore}/10</span>${m.quantity?`<span class="chip">${esc(m.quantity)}</span>`:""}</div>
      <button class="danger small" data-delete-meal="${m.id}">Supprimer</button>
    </div>
  </article>`;
}

function renderHistory(){
  const days=Object.values(db.days).sort((a,b)=>b.date.localeCompare(a.date));
  $("#app").innerHTML=`<section class="hero"><div class="row"><div><p class="eyebrow">Ton journal</p><h2>Historique</h2><p>Une journée à la fois, sans pression.</p></div><div class="mascot">📖</div></div></section>
  <section class="stack">${days.length?days.map(d=>{
    const mins=(d.activities||[]).reduce((s,a)=>s+(Number(a.minutes)||0),0);
    return `<article class="card history-day"><div class="row"><div><h3>${formatDate(d.date)}</h3><div class="mini-stats"><span>🍽️ ${d.meals.length}</span><span>💧 ${d.water}</span><span>🚶 ${mins} min</span><span>😴 ${d.sleepHours??"—"} h</span></div></div><span>›</span></div></article>`;
  }).join(""):`<article class="card empty">Aucune journée enregistrée.</article>`}</section>`;
}

function renderInsights(){
  const meals=Object.values(db.days).flatMap(d=>d.meals||[]);
  const last7=Object.values(db.days).sort((a,b)=>a.date.localeCompare(b.date)).slice(-7);
  const avgFat=avg(meals.map(m=>m.fatigue1h-m.fatigueBefore));
  const bars=last7.map(d=>{
    const v=avg((d.meals||[]).map(m=>10-m.fatigueBefore))??0;
    return `<i title="${d.date}: ${v.toFixed(1)}" style="height:${Math.max(7,v*10)}%"></i>`;
  }).join("");
  const insight = meals.length<10
    ? `Encore ${10-meals.length} repas avant une première tendance plus crédible.`
    : avgFat>1.5 ? `Ta fatigue augmente en moyenne de ${avgFat.toFixed(1)} point après 1 heure. Observe surtout les catégories récurrentes.`
    : `Ta fatigue après 1 heure demeure plutôt stable dans les données actuelles.`;
  $("#app").innerHTML=`<section class="hero"><div class="row"><div><p class="eyebrow">Ton laboratoire personnel</p><h2>Découvertes</h2><p>Des tendances, jamais des diagnostics.</p></div><div class="mascot">🧠</div></div></section>
  <section class="grid">
    <article class="card wide"><h3>Énergie — 7 derniers jours</h3><div class="spark">${bars||"<span class='muted'>Pas encore de données</span>"}</div></article>
    <article class="card"><h3>Repas suivis</h3><div class="metric">${meals.length}</div></article>
    <article class="card"><h3>Variation à 1 h</h3><div class="metric">${avgFat==null?"—":`${avgFat>=0?"+":""}${avgFat.toFixed(1)}`}</div></article>
    <article class="card wide"><span>🌱</span><h3>Première lecture</h3><p>${insight}</p><p class="muted small">Une corrélation n'établit pas une cause.</p></article>
  </section>`;
}

function renderProfile(){
  const backups=JSON.parse(localStorage.getItem(BACKUP_KEY)||"[]");
  $("#app").innerHTML=`<section class="hero"><div class="row"><div><p class="eyebrow">Préférences et sécurité</p><h2>Profil</h2><p>Tes données restent dans ton navigateur.</p></div><div class="mascot">⚙️</div></div></section>
  <section class="stack">
    <article class="card settings-row"><div><h3>Objectif d'eau</h3><p class="muted small">Nombre de verres par jour</p></div><input id="waterGoal" type="number" min="1" max="20" value="${db.settings.waterGoal}" style="width:90px"></article>
    <article class="card"><h3>Protection des données</h3><p class="muted">Copie principale + copie miroir locale. ${backups.length} sauvegarde(s) de migration ou d'action importante.</p><div class="dialog-actions"><button class="secondary" id="exportBtn">Exporter JSON</button><button class="secondary" id="importBtn">Importer JSON</button><button class="secondary" id="restoreBackup">Restaurer la dernière sauvegarde</button></div></article>
    <article class="card"><h3>Version</h3><p>Énergie & Repas V1.2 · données V${CURRENT_VERSION}</p><p class="muted small">Avant toute future migration, une sauvegarde est créée automatiquement.</p></article>
  </section>`;
  $("#waterGoal").onchange=e=>{db.settings.waterGoal=clamp(e.target.value,1,20);saveDB();};
  $("#exportBtn").onclick=exportData;
  $("#importBtn").onclick=()=>$("#importFile").click();
  $("#restoreBackup").onclick=()=>{
    if(!backups.length) return alert("Aucune sauvegarde disponible.");
    if(confirm("Restaurer la sauvegarde la plus récente? Les données actuelles seront d'abord sauvegardées.")){
      createBackup(db,"avant-restauration"); db=migrate(backups[0].payload); saveDB("important"); render();
    }
  };
}

function openDayDialog(){
  const d=ensureDay(db);
  $("#sleepHours").value=d.sleepHours??"";
  $("#sleepQuality").value=d.sleepQuality??"";
  $("#activityMinutes").value="";
  $("#dayDialog").showModal();
}
$("#dayForm").addEventListener("submit",e=>{
  e.preventDefault(); const d=ensureDay(db);
  const sh=$("#sleepHours").value, sq=$("#sleepQuality").value, mins=$("#activityMinutes").value;
  d.sleepHours=sh===""?null:clamp(sh,0,24); d.sleepQuality=sq===""?null:clamp(sq,0,10);
  if(Number(mins)>0) d.activities.push({id:uid(),type:$("#activityType").value,minutes:clamp(mins,0,1440),at:new Date().toISOString()});
  saveDB("important"); $("#dayDialog").close(); render();
});

function openMealDialog(id=null){
  const d=ensureDay(db), m=id?d.meals.find(x=>x.id===id):null;
  $("#mealId").value=m?.id||"";
  $("#mealType").value=m?.type||guessMealType();
  $("#mealTime").value=m?.time||new Date().toTimeString().slice(0,5);
  $("#mealDescription").value=m?.description||"";
  $("#mealCategory").value=m?.category||"Repas équilibré";
  $("#mealQuantity").value=m?.quantity||"";
  [["fatigueBefore","fatigueBeforeOut"],["fatigue1h","fatigue1hOut"],["fatigue3h","fatigue3hOut"]].forEach(([a,b])=>{
    $( "#"+a).value=m?.[a]??3; $("#"+b).value=$( "#"+a).value;
  });
  $("#mealNotes").value=m?.notes||"";
  $("#mealPhoto").value="";
  $("#mealDialogTitle").textContent=m?"Modifier le repas":"Ajouter un repas";
  $("#mealDialog").showModal();
}
function guessMealType(){ const h=new Date().getHours(); return h<10?"Déjeuner":h<15?"Dîner":h<20?"Souper":"Collation"; }
$$('input[type="range"]').forEach(r=>r.addEventListener("input",()=>$("#"+r.id+"Out").value=r.value));

async function imageToDataURL(file){
  if(!file) return null;
  const img=await createImageBitmap(file);
  const max=900, scale=Math.min(1,max/Math.max(img.width,img.height));
  const c=document.createElement("canvas"); c.width=Math.round(img.width*scale); c.height=Math.round(img.height*scale);
  c.getContext("2d").drawImage(img,0,0,c.width,c.height);
  return c.toDataURL("image/jpeg",.78);
}
$("#mealForm").addEventListener("submit",async e=>{
  e.preventDefault(); const d=ensureDay(db), id=$("#mealId").value;
  const old=id?d.meals.find(m=>m.id===id):null;
  const photo=await imageToDataURL($("#mealPhoto").files[0]) || old?.photo || null;
  const meal=normalizeMeal({
    id:id||uid(),date:todayKey(),time:$("#mealTime").value,type:$("#mealType").value,
    description:$("#mealDescription").value,category:$("#mealCategory").value,
    quantity:$("#mealQuantity").value,fatigueBefore:$("#fatigueBefore").value,
    fatigue1h:$("#fatigue1h").value,fatigue3h:$("#fatigue3h").value,
    notes:$("#mealNotes").value,photo,createdAt:old?.createdAt
  });
  if(old) d.meals=d.meals.map(m=>m.id===id?meal:m); else d.meals.push(meal);
  saveDB("important"); $("#mealDialog").close(); render();
});

$("#copyYesterdayBreakfast").onclick=()=>{
  const y=new Date(); y.setDate(y.getDate()-1); const key=y.toLocaleDateString("en-CA");
  const m=db.days[key]?.meals?.find(x=>x.type==="Déjeuner");
  if(!m) return alert("Aucun déjeuner trouvé hier.");
  $("#mealType").value="Déjeuner"; $("#mealDescription").value=m.description; $("#mealCategory").value=m.category;
  $("#mealQuantity").value=m.quantity||""; $("#mealNotes").value=m.notes||"";
};

function exportData(){
  const blob=new Blob([JSON.stringify({exportedAt:new Date().toISOString(),app:"Énergie & Repas",data:db},null,2)],{type:"application/json"});
  const a=document.createElement("a"); a.href=URL.createObjectURL(blob); a.download=`energie-repas-${todayKey()}.json`; a.click(); URL.revokeObjectURL(a.href);
}
$("#importFile").addEventListener("change",async e=>{
  const file=e.target.files[0]; if(!file)return;
  try{
    const parsed=JSON.parse(await file.text()); const candidate=parsed.data||parsed;
    createBackup(db,"avant-import"); db=migrate(candidate); saveDB("important"); alert("Importation réussie."); render();
  }catch(err){alert("Le fichier n'a pas pu être importé.");}
  e.target.value="";
});

$$(".nav-item").forEach(b=>b.onclick=()=>{currentView=b.dataset.view;render();window.scrollTo({top:0,behavior:"smooth"});});
$("#themeToggle").onclick=()=>{
  const dark=document.documentElement.dataset.theme==="dark";
  document.documentElement.dataset.theme=dark?"light":"dark";
  db.settings.theme=dark?"light":"dark"; saveDB();
};
function applyTheme(){
  const t=db.settings.theme||"system";
  const dark=t==="dark" || (t==="system"&&matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme=dark?"dark":"light";
}
applyTheme(); saveDB(); render();
if("serviceWorker" in navigator) navigator.serviceWorker.register("./sw.js").catch(console.warn);
})();
