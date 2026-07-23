(() => {
"use strict";
const CFG=window.ENERGIE_CONFIG||{};
const APP_KEY="energieRepasDB";
const BACKUP_KEY="energieRepasBackups";
const OUTBOX_KEY="energieRepasOutboxV15";
const BARCODE_CACHE_KEY="energieBarcodeProductsV1";
const CURRENT_VERSION=11;
const $=s=>document.querySelector(s);
const $$=s=>[...document.querySelectorAll(s)];
const uid=()=>crypto.randomUUID?.()||`${Date.now()}-${Math.random().toString(16).slice(2)}`;
const todayKey=()=>new Date().toLocaleDateString("en-CA");
const esc=v=>String(v??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const clamp=(n,a,b)=>Math.max(a,Math.min(b,Number(n)||0));
function activityIcon(t){return({"Marche":"🚶","Course":"🏃","Vélo":"🚴","Musculation":"🏋️","Yoga":"🧘","Natation":"🏊","Autre":"✨"})[t]||"✨"}
function activitySummary(day){const items=day.activities||[],minutes=items.reduce((sum,a)=>sum+(Number(a.minutes)||0),0);return{minutes,label:minutes?`${minutes} min`:'À noter',count:items.length}}
const client=(window.supabase&&CFG.supabaseUrl&&CFG.supabasePublishableKey)?window.supabase.createClient(CFG.supabaseUrl,CFG.supabasePublishableKey,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
let session=null,currentView="today",selectedDate=todayKey(),syncState="local",photoData=null,photoRemoved=false,authMode="login",feelingMealId=null,notificationTimer=null;
let barcodeReader=null,barcodeControls=null,barcodeBusy=false,barcodeLastCode="",barcodeLastProduct=null;

function freshDB(){return{version:CURRENT_VERSION,createdAt:new Date().toISOString(),updatedAt:new Date().toISOString(),settings:{waterGoal:8,theme:"system",showWelcome:true,insightsEnabled:true,nutritionObservations:true,macroTracking:false,generalRecommendations:true,showSources:true,feelingReminders:true,feelingDelayHours:2,feelingMealTypes:["Déjeuner","Dîner","Souper"],demoMode:false,demoTourSeen:false,demoName:"Phil"},favorites:[],days:{}}}
function ensureDay(store,key=todayKey()){if(!store.days[key])store.days[key]={date:key,sleepHours:null,water:0,activities:[],meals:[],updatedAt:new Date().toISOString()};const d=store.days[key];d.activities=Array.isArray(d.activities)?d.activities:[];d.meals=Array.isArray(d.meals)?d.meals:[];d.water=Number(d.water)||0;return d}
function normalNutrition(n){if(!n||typeof n!=="object")return null;const val=k=>{const x=Number(n[k]);return Number.isFinite(x)&&x>=0?Math.round(x*10)/10:null};const out={calories:val("calories"),protein:val("protein"),carbs:val("carbs"),fat:val("fat"),source:n.source||"manual",confidence:n.confidence||"low",basis:n.basis||"portion courante",estimated:n.estimated!==false};return [out.calories,out.protein,out.carbs,out.fat].some(v=>v!==null)?out:null}
function normalMeal(m={},date=todayKey()){return{id:m.id||uid(),date:m.date||date,time:m.time||"12:00",type:m.type||m.mealType||m.typeRepas||"Repas",description:m.description||m.food||m.aliments||m.repas||m.details||"",fatigueBefore:clamp(m.fatigueBefore??m.fatigueAvant??m.before,0,5),fatigueAfter:clamp(m.fatigueAfter??m.fatigueApres??m.after??m.fatigue1h??m.after1h,0,5),notes:m.notes||"",nutrition:normalNutrition(m.nutrition||m.macros),photoUrl:m.photoUrl||null,photoPath:m.photoPath||null,photoLocal:m.photoLocal||m.photo||m.image||null,createdAt:m.createdAt||new Date().toISOString(),updatedAt:m.updatedAt||new Date().toISOString(),feeling:m.feeling||null,feelingNotifiedAt:m.feelingNotifiedAt||null}}
function normalFavorite(f={}){return{id:f.id||uid(),name:f.name||f.description||"Mon repas",type:f.type||"Repas",description:f.description||"",notes:f.notes||"",usageCount:Number(f.usageCount??f.usage_count??0)||0,createdAt:f.createdAt||f.created_at||new Date().toISOString(),updatedAt:f.updatedAt||f.updated_at||new Date().toISOString()}}
function migrate(raw){const out=freshDB();if(!raw||typeof raw!=="object")return out;out.settings={...out.settings,...(raw.settings||{})};out.favorites=(raw.favorites||raw.favoriteMeals||[]).map(normalFavorite);if(raw.days&&typeof raw.days==="object"){Object.entries(raw.days).forEach(([k,d])=>{const day=ensureDay(out,k);day.sleepHours=d.sleepHours??d.sleep??d.sommeil??null;day.water=Number(d.water??d.waterGlasses??d.eau??0)||0;day.activities=Array.isArray(d.activities)?d.activities:[];day.meals=(d.meals||d.repas||[]).map(m=>normalMeal(m,k));day.updatedAt=d.updatedAt||new Date().toISOString()});return out}const arr=[raw.meals,raw.repas,raw.entries,raw.history,raw.logs,Array.isArray(raw)?raw:null].find(Array.isArray);if(arr)arr.forEach(x=>{const m=normalMeal(x,x.date||x.day||todayKey());ensureDay(out,m.date).meals.push(m)});return out}
function backup(payload,reason){try{const b=JSON.parse(localStorage.getItem(BACKUP_KEY)||"[]");b.unshift({at:new Date().toISOString(),reason,payload});localStorage.setItem(BACKUP_KEY,JSON.stringify(b.slice(0,20)))}catch(e){console.warn(e)}}
function load(){const raw=localStorage.getItem(APP_KEY);if(!raw)return freshDB();try{const parsed=JSON.parse(raw);backup(parsed,"ouverture-v1.5");return migrate(parsed)}catch(e){backup(raw,"copie-illisible-v1.5");return freshDB()}}
let db=load();
function saveLocal(reason="local"){db.version=CURRENT_VERSION;db.updatedAt=new Date().toISOString();const txt=JSON.stringify(db);localStorage.setItem(APP_KEY,txt);localStorage.setItem(`${APP_KEY}_shadow`,txt)}
function outbox(){try{return JSON.parse(localStorage.getItem(OUTBOX_KEY)||"[]")}catch(_){return[]}}
function setOutbox(items){localStorage.setItem(OUTBOX_KEY,JSON.stringify(items));updateSyncBadge()}
function enqueue(op){if(db.settings.demoMode)return;const items=outbox();const key=`${op.kind}:${op.id||op.date}`;const idx=items.findIndex(x=>`${x.kind}:${x.id||x.date}`===key);if(idx>=0)items[idx]=op;else items.push(op);setOutbox(items);syncState="pending";updateSyncBadge();if(session&&navigator.onLine)syncNow()}
function updateSyncBadge(){const el=$("#syncBadge");if(!el)return;if(db.settings.demoMode){el.textContent="Mode démo";el.className="sync-badge demo";return}const pending=outbox().length;el.className="sync-badge";if(!session){el.textContent=navigator.onLine?"Non connecté":"Hors ligne";if(!navigator.onLine)el.classList.add("pending");return}if(syncState==="error"){el.textContent="Erreur synchro";el.classList.add("error")}else if(pending){el.textContent=`${pending} à synchroniser`;el.classList.add("pending")}else{el.textContent="Sauvegardé ☁️";el.classList.add("online")}}
function setDayChanged(date){const d=ensureDay(db,date);d.updatedAt=new Date().toISOString();saveLocal("jour");enqueue({kind:"day",date})}
function setMealChanged(meal){saveLocal("repas");enqueue({kind:"meal",id:meal.id,date:meal.date});scheduleFeelingChecks()}
function setFavoriteChanged(f){saveLocal("favori");enqueue({kind:"favorite",id:f.id})}
function deleteMealLocal(meal){const d=ensureDay(db,meal.date);d.meals=d.meals.filter(x=>x.id!==meal.id);saveLocal("suppression-repas");enqueue({kind:"deleteMeal",id:meal.id,date:meal.date,photoPath:meal.photoPath});scheduleFeelingChecks()}
function deleteFavoriteLocal(f){db.favorites=db.favorites.filter(x=>x.id!==f.id);saveLocal("suppression-favori");enqueue({kind:"deleteFavorite",id:f.id})}

async function uploadPhoto(meal){if(!client||!session||!meal.photoLocal||meal.photoLocal===meal.photoUrl)return meal;const blob=await(await fetch(meal.photoLocal)).blob();const ext=(blob.type.split("/")[1]||"jpg").replace("jpeg","jpg");const path=`${session.user.id}/${meal.id}.${ext}`;const {error}=await client.storage.from("meal-photos").upload(path,blob,{upsert:true,contentType:blob.type||"image/jpeg"});if(error)throw error;meal.photoPath=path;meal.photoLocal=null;return meal}
async function signedPhoto(path){if(!path||!client)return null;const {data,error}=await client.storage.from("meal-photos").createSignedUrl(path,3600);return error?null:data.signedUrl}
async function syncNow(){if(!client||!session||!navigator.onLine)return;syncState="syncing";updateSyncBadge();const remaining=[];for(const op of outbox()){try{if(op.kind==="day"){const d=ensureDay(db,op.date);const {error}=await client.from("daily_logs").upsert({user_id:session.user.id,log_date:op.date,sleep_hours:d.sleepHours,water:d.water,activities:d.activities,updated_at:d.updatedAt},{onConflict:"user_id,log_date"});if(error)throw error}else if(op.kind==="meal"){const meal=ensureDay(db,op.date).meals.find(m=>m.id===op.id);if(!meal)continue;await uploadPhoto(meal);const payload={id:meal.id,user_id:session.user.id,meal_date:meal.date,meal_time:meal.time,meal_type:meal.type,description:meal.description,fatigue_before:meal.fatigueBefore,fatigue_after:meal.fatigueAfter,notes:meal.notes||null,photo_path:meal.photoPath||null,feeling:meal.feeling||null,feeling_notified_at:meal.feelingNotifiedAt||null,nutrition:meal.nutrition||null,created_at:meal.createdAt,updated_at:meal.updatedAt};let {error}=await client.from("meals").upsert(payload);if(error&&/nutrition|schema cache|column/i.test(error.message||"")){delete payload.nutrition;({error}=await client.from("meals").upsert(payload))}if(error)throw error}else if(op.kind==="favorite"){const f=db.favorites.find(x=>x.id===op.id);if(!f)continue;const {error}=await client.from("favorite_meals").upsert({id:f.id,user_id:session.user.id,name:f.name,meal_type:f.type,description:f.description,notes:f.notes||null,usage_count:f.usageCount||0,created_at:f.createdAt,updated_at:f.updatedAt});if(error)throw error}else if(op.kind==="deleteMeal"){const {error}=await client.from("meals").delete().eq("id",op.id);if(error)throw error;if(op.photoPath)await client.storage.from("meal-photos").remove([op.photoPath])}else if(op.kind==="deleteFavorite"){const {error}=await client.from("favorite_meals").delete().eq("id",op.id);if(error)throw error}}catch(e){console.error("sync",e);remaining.push(op)}}setOutbox(remaining);syncState=remaining.length?"error":"online";updateSyncBadge();if(!remaining.length)await pullCloud(false)}
async function pullCloud(show=true){if(!client||!session||!navigator.onLine)return;if(show){syncState="syncing";updateSyncBadge()}const [dr,mr,fr]=await Promise.all([client.from("daily_logs").select("*").order("log_date"),client.from("meals").select("*").order("meal_date").order("meal_time"),client.from("favorite_meals").select("*").order("usage_count",{ascending:false})]);if(dr.error||mr.error||fr.error){console.error(dr.error||mr.error||fr.error);syncState="error";updateSyncBadge();return}for(const r of dr.data||[]){const d=ensureDay(db,r.log_date);if(!d.updatedAt||new Date(r.updated_at)>=new Date(d.updatedAt)){d.sleepHours=r.sleep_hours;d.water=r.water||0;d.activities=r.activities||[];d.updatedAt=r.updated_at}}for(const r of mr.data||[]){const d=ensureDay(db,r.meal_date);const remote=normalMeal({id:r.id,date:r.meal_date,time:(r.meal_time||"").slice(0,5),type:r.meal_type,description:r.description,fatigueBefore:r.fatigue_before,fatigueAfter:r.fatigue_after,notes:r.notes,photoPath:r.photo_path,feeling:r.feeling||null,feelingNotifiedAt:r.feeling_notified_at||null,nutrition:r.nutrition||null,createdAt:r.created_at,updatedAt:r.updated_at},r.meal_date);const i=d.meals.findIndex(x=>x.id===remote.id);if(i<0)d.meals.push(remote);else if(new Date(remote.updatedAt)>=new Date(d.meals[i].updatedAt||0))d.meals[i]={...d.meals[i],...remote}}for(const r of fr.data||[]){const remote=normalFavorite({id:r.id,name:r.name,type:r.meal_type,description:r.description,notes:r.notes,usageCount:r.usage_count,createdAt:r.created_at,updatedAt:r.updated_at});const i=db.favorites.findIndex(x=>x.id===remote.id);if(i<0)db.favorites.push(remote);else if(new Date(remote.updatedAt)>=new Date(db.favorites[i].updatedAt||0))db.favorites[i]=remote}saveLocal("retour-cloud");syncState="online";updateSyncBadge();render()}
async function seedCloudFromLocal(){if(!session)return;const ops=[];Object.entries(db.days).forEach(([date,d])=>{ops.push({kind:"day",date});d.meals.forEach(m=>ops.push({kind:"meal",id:m.id,date}))});db.favorites.forEach(f=>ops.push({kind:"favorite",id:f.id}));setOutbox(ops);await syncNow()}

function mealIcon(t){return({"Déjeuner":"🍳","Dîner":"🥗","Souper":"🍲","Collation":"🍎","Boisson":"🥤"})[t]||"🍽️"}
function formatDate(k){return new Intl.DateTimeFormat("fr-CA",{weekday:"long",day:"numeric",month:"long"}).format(new Date(`${k}T12:00:00`))}
function average(arr){const x=arr.filter(n=>Number.isFinite(Number(n))&&Number(n)>0).map(Number);return x.length?x.reduce((a,b)=>a+b,0)/x.length:null}
function allMeals(){return Object.values(db.days).flatMap(d=>d.meals)}
function nutritionText(n){if(!n)return"";const pieces=[];if(n.calories!=null)pieces.push(`${Math.round(n.calories)} kcal`);if(n.protein!=null)pieces.push(`${Number(n.protein).toFixed(n.protein%1?1:0)} g prot.`);if(n.carbs!=null)pieces.push(`${Number(n.carbs).toFixed(n.carbs%1?1:0)} g gluc.`);if(n.fat!=null)pieces.push(`${Number(n.fat).toFixed(n.fat%1?1:0)} g lip.`);return pieces.join(" · ")}
const FOOD_MACROS=[
 {keys:["oeuf","œuf","eggs"],calories:78,protein:6.3,carbs:.6,fat:5.3},
 {keys:["toast","rôtie","rotie","pain"],calories:95,protein:3.5,carbs:18,fat:1.2},
 {keys:["beurre de pinotte","beurre d'arachide","beurre arachide","peanut butter"],calories:95,protein:4,carbs:3.5,fat:8},
 {keys:["gruau","avoine","oatmeal"],calories:180,protein:6,carbs:32,fat:3.5},
 {keys:["banane","banana"],calories:105,protein:1.3,carbs:27,fat:.4},
 {keys:["pomme","apple"],calories:95,protein:.5,carbs:25,fat:.3},
 {keys:["yogourt grec","yogourt","yaourt","greek yogurt"],calories:130,protein:14,carbs:10,fat:3},
 {keys:["poulet","chicken"],calories:250,protein:42,carbs:0,fat:8},
 {keys:["riz","rice"],calories:205,protein:4.3,carbs:45,fat:.4},
 {keys:["brocoli","broccoli"],calories:55,protein:3.7,carbs:11,fat:.6},
 {keys:["saumon","salmon"],calories:280,protein:34,carbs:0,fat:16},
 {keys:["thon","tuna"],calories:180,protein:38,carbs:0,fat:2},
 {keys:["steak","boeuf","bœuf","beef"],calories:330,protein:38,carbs:0,fat:20},
 {keys:["tofu"],calories:180,protein:20,carbs:5,fat:11},
 {keys:["patate douce","sweet potato"],calories:180,protein:4,carbs:41,fat:.3},
 {keys:["patate","pomme de terre","potato"],calories:190,protein:5,carbs:43,fat:.2},
 {keys:["avocat","avocado"],calories:160,protein:2,carbs:9,fat:15},
 {keys:["amandes","almonds"],calories:170,protein:6,carbs:6,fat:15},
 {keys:["fromage","cheese"],calories:115,protein:7,carbs:1,fat:9},
 {keys:["lait","milk"],calories:130,protein:9,carbs:12,fat:5},
 {keys:["café noir","cafe noir","black coffee"],calories:3,protein:0,carbs:0,fat:0},
 {keys:["salade grecque","greek salad"],calories:320,protein:10,carbs:18,fat:24},
 {keys:["lasagne","lasagna"],calories:520,protein:28,carbs:48,fat:24},
 {keys:["poutine"],calories:850,protein:24,carbs:95,fat:42},
 {keys:["pizza"],calories:570,protein:24,carbs:66,fat:23},
 {keys:["spaghetti","pâtes","pates","pasta"],calories:430,protein:16,carbs:72,fat:9},
 {keys:["chili"],calories:420,protein:28,carbs:45,fat:15},
 {keys:["smoothie"],calories:260,protein:8,carbs:48,fat:5},
 {keys:["sandwich"],calories:430,protein:22,carbs:48,fat:17},
 {keys:["wrap"],calories:450,protein:25,carbs:45,fat:18}
];
function estimateNutritionFromText(text){const source=String(text||"").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g,"");if(!source.trim())return null;const matched=[];for(const food of FOOD_MACROS){const hit=food.keys.some(k=>source.includes(k.normalize("NFD").replace(/[\u0300-\u036f]/g,"")));if(hit)matched.push(food)}if(!matched.length)return null;const total=matched.reduce((a,f)=>({calories:a.calories+f.calories,protein:a.protein+f.protein,carbs:a.carbs+f.carbs,fat:a.fat+f.fat}),{calories:0,protein:0,carbs:0,fat:0});return normalNutrition({...total,source:"text",confidence:matched.length>=3?"medium":"low",basis:matched.length===1?"portion courante":"portions courantes",estimated:true})}
function mergeNutrition(a,b){a=normalNutrition(a);b=normalNutrition(b);if(!a)return b;if(!b)return a;return normalNutrition({calories:(a.calories||0)+(b.calories||0),protein:(a.protein||0)+(b.protein||0),carbs:(a.carbs||0)+(b.carbs||0),fat:(a.fat||0)+(b.fat||0),source:a.source===b.source?a.source:"mixed",confidence:(a.confidence==="low"||b.confidence==="low")?"low":"medium",basis:"éléments additionnés",estimated:a.estimated||b.estimated})}
function nutritionFromInputs(){const get=id=>{const value=$(id)?.value;if(value===""||value==null)return null;const n=Number(value);return Number.isFinite(n)&&n>=0?n:null};return normalNutrition({calories:get("#nutritionCalories"),protein:get("#nutritionProtein"),carbs:get("#nutritionCarbs"),fat:get("#nutritionFat"),source:$("#mealNutritionSection")?.dataset.source||"manual",confidence:$("#mealNutritionSection")?.dataset.confidence||"low",basis:$("#mealNutritionSection")?.dataset.basis||"portion courante",estimated:$("#mealNutritionSection")?.dataset.estimated!=="false"})}
function fillNutritionInputs(n,note=""){n=normalNutrition(n);[["#nutritionCalories","calories"],["#nutritionProtein","protein"],["#nutritionCarbs","carbs"],["#nutritionFat","fat"]].forEach(([id,key])=>{$(id).value=n?.[key]??""});const section=$("#mealNutritionSection");if(section){section.dataset.source=n?.source||"manual";section.dataset.confidence=n?.confidence||"low";section.dataset.basis=n?.basis||"portion courante";section.dataset.estimated=String(n?.estimated!==false)}$("#nutritionEstimateNote").textContent=note||(n?.source==="barcode"?`Valeurs ${n.basis||"du produit"} provenant de l’étiquette Open Food Facts. Vérifie-les au besoin.`:"Estimation approximative basée sur une portion courante. Les recettes et portions réelles peuvent varier.")}
function estimateCurrentMealNutrition(){const n=estimateNutritionFromText($("#mealDescription").value);if(!n){fillNutritionInputs(null,"Aucune estimation fiable trouvée. Tu peux entrer ou modifier les valeurs manuellement.");return}fillNutritionInputs(n)}

// --- V3.0.1 : recommandation douce après l'enregistrement d'un repas ---------
const RECOMMENDATION_WORDS={
 protein:["oeuf","œuf","poulet","dinde","poisson","saumon","thon","boeuf","bœuf","porc","tofu","tempeh","lentille","pois chiche","haricot","légumineuse","yogourt grec","yaourt grec","fromage cottage","noix","amande","beurre d'arachide","beurre de pinotte"],
 produce:["brocoli","salade","légume","legume","carotte","concombre","tomate","poivron","épinard","epinard","chou","courgette","asperge","champignon","fruit","pomme","banane","orange","fraise","framboise","bleuet","mangue","poire","kiwi","avocat"],
 fiber:["avoine","gruau","pain entier","blé entier","ble entier","riz brun","quinoa","lentille","pois chiche","haricot","légumineuse","legumineuse","fruit","pomme","poire","framboise","amande","noix","graine"],
 sugary:["beigne","donut","muffin","croissant","biscuit","gâteau","gateau","bonbon","chocolat","céréale sucrée","cereale sucree","boisson gazeuse","liqueur","cola","jus sucré","jus sucre","frappuccino","sirop"],
 refined:["pain blanc","bagel","croissant","beigne","donut","frites","chips","croustille","poutine"],
 coffee:["café","cafe","espresso","latte","cappuccino"]
};
function recommendationNormalize(value){return String(value||"").toLocaleLowerCase("fr-CA").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function recommendationHas(text,words){const clean=recommendationNormalize(text);return words.some(word=>clean.includes(recommendationNormalize(word)))}
function nutritionForRecommendation(meal){return normalNutrition(meal.nutrition)||estimateNutritionFromText(meal.description)||null}
function chooseMealRecommendation(date,justSavedMeal){
 if(!db.settings.generalRecommendations||date!==todayKey())return null;
 const meals=[...ensureDay(db,date).meals].filter(m=>m.type!=="Boisson"&&m.description?.trim()).sort((a,b)=>a.time.localeCompare(b.time));
 if(!meals.length)return null;
 const text=meals.map(m=>m.description).join(" · ");
 const recognized=Object.values(RECOMMENDATION_WORDS).reduce((count,words)=>count+(recommendationHas(text,words)?1:0),0);
 if(recognized<1)return null;
 const protein=meals.reduce((total,meal)=>total+(Number(nutritionForRecommendation(meal)?.protein)||0),0);
 const hasProtein=recommendationHas(text,RECOMMENDATION_WORDS.protein)||protein>=Math.max(12,meals.length*10);
 const hasProduce=recommendationHas(text,RECOMMENDATION_WORDS.produce);
 const hasFiber=recommendationHas(text,RECOMMENDATION_WORDS.fiber);
 const sugary=recommendationHas(text,RECOMMENDATION_WORDS.sugary);
 const refined=recommendationHas(text,RECOMMENDATION_WORDS.refined);
 const coffee=recommendationHas(text,RECOMMENDATION_WORDS.coffee);
 const water=Number(ensureDay(db,date).water)||0;
 const hour=Number((justSavedMeal?.time||"12:00").split(":")[0]);
 const english=window.ENERGIE_LOCALE==="en";
 if(!hasProtein&&(sugary||refined||meals.length>=2))return{message:english?"For your next meal, a protein source such as eggs, Greek yogurt, tofu or legumes could nicely complement your day.":"Pour ton prochain repas, une source de protéines comme des œufs, du yogourt grec, du tofu ou des légumineuses pourrait bien compléter ta journée."};
 if(meals.length>=2&&!hasProduce)return{message:english?"A fruit or a few vegetables could add a little more variety to your next meal.":"Un fruit ou quelques légumes pourraient ajouter un peu plus de variété à ton prochain repas."};
 if(meals.length>=2&&!hasFiber)return{message:english?"Whole grains, fruit or legumes could add a little more fibre to the rest of your day.":"Des grains entiers, un fruit ou des légumineuses pourraient ajouter un peu plus de fibres à la suite de ta journée."};
 if(coffee&&water<2&&hour<19)return{message:english?"A gentle reminder: a glass of water could also be a nice addition to the rest of your day.":"Petit rappel tout doux : un verre d’eau pourrait aussi bien accompagner la suite de ta journée."};
 return null;
}
let recommendationTimer=null;
function showMealRecommendation(recommendation){
 if(!recommendation)return;
 document.querySelector(".meal-recommendation-toast")?.remove();
 const card=document.createElement("aside");
 card.className="meal-recommendation-toast";
 card.setAttribute("role","status");
 const english=window.ENERGIE_LOCALE==="en";
 card.innerHTML=`<button class="meal-recommendation-close" type="button" aria-label="${english?'Close':'Fermer'}">×</button><div class="meal-recommendation-icon">💡</div><div><strong>${english?'A small idea for what comes next':'Petite idée pour la suite'}</strong><p>${esc(recommendation.message)}</p></div>`;
 document.body.appendChild(card);
 requestAnimationFrame(()=>card.classList.add("is-visible"));
 const close=()=>{clearTimeout(recommendationTimer);card.classList.remove("is-visible");setTimeout(()=>card.remove(),260)};
 card.querySelector(".meal-recommendation-close").onclick=close;
 recommendationTimer=setTimeout(close,9000);
}

const WEATHER_CACHE_KEY="energieRepasWeatherV178";
const WEATHER_CACHE_MS=30*60*1000;
let weatherRefreshPromise=null;

const WEATHER_SVGS={
  morning:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v3M16 25v3M4 16h3M25 16h3M7.5 7.5l2.1 2.1M22.4 22.4l2.1 2.1M24.5 7.5l-2.1 2.1M9.6 22.4l-2.1 2.1"/><circle cx="16" cy="16" r="6"/></svg>`,
  afternoon:`<svg viewBox="0 0 32 32" aria-hidden="true"><circle cx="16" cy="16" r="7"/><path d="M16 2.5v4M16 25.5v4M2.5 16h4M25.5 16h4M6.4 6.4l2.8 2.8M22.8 22.8l2.8 2.8M25.6 6.4l-2.8 2.8M9.2 22.8l-2.8 2.8"/></svg>`,
  cloud:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M8.5 23h15a5.5 5.5 0 0 0 .7-11A8.5 8.5 0 0 0 8 10.2 6.5 6.5 0 0 0 8.5 23Z"/></svg>`,
  rain:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M9 21h14a5 5 0 0 0 .6-10A8 8 0 0 0 8.4 9.3 6 6 0 0 0 9 21Z"/><path d="M11 24l-1 3M17 24l-1 3M23 24l-1 3"/></svg>`,
  snow:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M16 4v24M5.6 10l20.8 12M5.6 22l20.8-12M16 4l-3 3M16 4l3 3M16 28l-3-3M16 28l3-3M5.6 10l4.1.5M5.6 10l1.6 3.8M26.4 22l-4.1-.5M26.4 22l-1.6-3.8M5.6 22l4.1-.5M5.6 22l1.6-3.8M26.4 10l-4.1.5M26.4 10l-1.6 3.8"/></svg>`,
  night:`<svg viewBox="0 0 32 32" aria-hidden="true"><path d="M24.5 21.4A10.5 10.5 0 0 1 10.6 7.5 10.5 10.5 0 1 0 24.5 21.4Z"/></svg>`
};
function fallbackWeatherKind(date=new Date()){const h=date.getHours();return h>=20||h<6?"night":h<12?"morning":"afternoon"}
function weatherKindFromCode(code,date=new Date()){
  const h=date.getHours(),isNight=h>=20||h<6;
  const snowCodes=[71,73,75,77,85,86];
  const rainCodes=[51,53,55,56,57,61,63,65,66,67,80,81,82,95,96,99];
  const cloudCodes=[2,3,45,48];
  if(snowCodes.includes(Number(code)))return "snow";
  if(isNight)return "night";
  if(rainCodes.includes(Number(code)))return "rain";
  if(cloudCodes.includes(Number(code)))return "cloud";
  return h<12?"morning":"afternoon";
}
function weatherTitleFromKind(kind){return({morning:"Beau temps ce matin",afternoon:"Beau temps cet après-midi",cloud:"Temps nuageux",rain:"Pluie aujourd’hui",snow:"Neige aujourd’hui",night:"Soirée"})[kind]||"Ambiance du jour"}
function setLivingHeaderIcon(kind,title=weatherTitleFromKind(kind)){
  const svg=WEATHER_SVGS[kind]||WEATHER_SVGS.afternoon;
  const header=$("#livingHeaderIcon"),nav=$("#todayNavIcon");
  for(const el of [header,nav])if(el){
    if(el.dataset.weatherKind!==kind||!el.firstElementChild)el.innerHTML=svg;
    el.dataset.weatherKind=kind;
    el.title=title;
    el.setAttribute("aria-label",title);
  }
}
function readWeatherCache(){try{return JSON.parse(localStorage.getItem(WEATHER_CACHE_KEY)||"null")}catch(_){return null}}
function writeWeatherCache(value){try{localStorage.setItem(WEATHER_CACHE_KEY,JSON.stringify(value))}catch(_){}}
function currentPosition(){return new Promise((resolve,reject)=>{if(!navigator.geolocation)return reject(new Error("Géolocalisation indisponible"));navigator.geolocation.getCurrentPosition(resolve,reject,{enableHighAccuracy:false,timeout:8000,maximumAge:6*60*60*1000})})}
async function fetchCurrentWeather(){
  const cached=readWeatherCache();
  if(cached&&Date.now()-cached.savedAt<WEATHER_CACHE_MS&&Number.isFinite(Number(cached.code)))return cached;
  if(!navigator.onLine)throw new Error("Hors ligne");
  const pos=await currentPosition();
  const latitude=pos.coords.latitude.toFixed(4),longitude=pos.coords.longitude.toFixed(4);
  const url=`https://api.open-meteo.com/v1/forecast?latitude=${encodeURIComponent(latitude)}&longitude=${encodeURIComponent(longitude)}&current=weather_code&timezone=auto&forecast_days=1`;
  const response=await fetch(url,{cache:"no-store"});
  if(!response.ok)throw new Error(`Météo ${response.status}`);
  const data=await response.json(),code=Number(data?.current?.weather_code);
  if(!Number.isFinite(code))throw new Error("Code météo absent");
  const value={code,savedAt:Date.now()};writeWeatherCache(value);return value;
}
async function updateLivingHeader(force=false){
  if(force)localStorage.removeItem(WEATHER_CACHE_KEY);
  const cached=readWeatherCache();
  const initialKind=cached&&Date.now()-cached.savedAt<WEATHER_CACHE_MS&&Number.isFinite(Number(cached.code))
    ? weatherKindFromCode(cached.code)
    : fallbackWeatherKind();
  setLivingHeaderIcon(initialKind);
  if(weatherRefreshPromise&&!force)return weatherRefreshPromise;
  weatherRefreshPromise=(async()=>{
    try{
      const weather=await fetchCurrentWeather();
      const kind=weatherKindFromCode(weather.code);
      setLivingHeaderIcon(kind);
    }catch(error){
      console.info("Icône météo en mode horaire:",error?.message||error);
    }finally{
      weatherRefreshPromise=null;
    }
  })();
  return weatherRefreshPromise;
}

const DEMO_BACKUP_KEY="energieBeforeDemoV250";
let demoTourIndex=0;

function demoDateKey(offset){
  const d=new Date();
  d.setHours(12,0,0,0);
  d.setDate(d.getDate()+offset);
  return d.toLocaleDateString("en-CA")
}
function demoRand(seed){
  const x=Math.sin(seed*12.9898+78.233)*43758.5453;
  return x-Math.floor(x)
}
function demoMeal(date,time,type,description,energy,tags=[],rating=3,notes=""){
  return normalMeal({
    id:`demo-${date}-${time.replace(":","")}-${type}`,
    date,time,type,description,
    fatigueBefore:energy,
    fatigueAfter:0,
    notes,
    feeling:{rating,tags,notes:"",recordedAt:`${date}T${time}:00`},
    createdAt:`${date}T${time}:00`,
    updatedAt:`${date}T${time}:00`
  },date)
}
function createDemoDB(){
  const store=freshDB();
  store.settings={...store.settings,showWelcome:false,demoMode:true,demoTourSeen:false,demoName:"Phil",waterGoal:8};
  store.createdAt=new Date(Date.now()-180*86400000).toISOString();
  store.favorites=[
    normalFavorite({id:"demo-fav-1",name:"Bol énergie",type:"Déjeuner",description:"Gruau, banane, beurre d’arachide et graines de chia",usageCount:18}),
    normalFavorite({id:"demo-fav-2",name:"Dîner simple",type:"Dîner",description:"Poulet grillé, riz et légumes",usageCount:14}),
    normalFavorite({id:"demo-fav-3",name:"Collation fraîche",type:"Collation",description:"Pomme et amandes",usageCount:11})
  ];

  for(let offset=-179;offset<=0;offset++){
    const date=demoDateKey(offset);
    const seed=offset+500;
    const day=ensureDay(store,date);
    const weekday=new Date(`${date}T12:00:00`).getDay();
    const active=weekday===2||weekday===4||weekday===6;
    const lateCoffee=(offset%9===0||offset%13===0);
    const dairyDay=(offset%4===0||offset%11===0);
    const hydrated=offset%5!==0;
    const goodSleep=!lateCoffee&&offset%7!==0;

    day.sleepHours=lateCoffee?6.1:Number((goodSleep?7.7+demoRand(seed)*0.8:6.6+demoRand(seed)*0.6).toFixed(1));
    day.water=hydrated?6+Math.floor(demoRand(seed+2)*3):3+Math.floor(demoRand(seed+2)*2);
    day.activities=active?[{id:`demo-a-${date}`,type:weekday===6?"Vélo":"Marche",minutes:weekday===6?55:35,at:`${date}T17:30:00`}]:[];

    const breakfastEnergy=goodSleep?4:2;
    day.meals.push(demoMeal(
      date,"07:35","Déjeuner",
      offset%3===0?"Gruau, banane et beurre d’arachide":"Œufs, pain complet et petits fruits",
      breakfastEnergy,goodSleep?["Énergie stable"]:["Fatigue"],goodSleep?4:2
    ));

    const lunchDescription=dairyDay
      ?"Sandwich au fromage, yogourt et crudités"
      :(offset%3===0?"Poulet, riz et brocoli":"Salade de quinoa, pois chiches et légumes");
    const lunchTags=dairyDay
      ?(["Maux de tête", ...(offset%8===0?["Ballonnements"]:[])])
      :(hydrated?["Énergie stable"]:["Fatigue"]);
    day.meals.push(demoMeal(
      date,"12:15","Dîner",lunchDescription,
      hydrated?4:2,lunchTags,dairyDay?2:(hydrated?4:3),
      dairyDay?"Inconfort apparu environ deux heures après le repas.":""
    ));

    const dinnerDescription=lateCoffee
      ?"Pâtes aux légumes et café vers 17 h"
      :(offset%6===0?"Saumon, pommes de terre et salade":"Poulet ou tofu, légumes et riz");
    day.meals.push(demoMeal(
      date,"18:25","Souper",dinnerDescription,
      active?4:3,lateCoffee?["Sommeil agité"]:(active?["Détendu"]:["Satisfait"]),lateCoffee?2:4
    ));

    if(offset%3===0){
      day.meals.push(demoMeal(date,"15:35","Collation",
        dairyDay?"Latte et muffin":"Pomme et amandes",
        dairyDay?2:4,dairyDay?["Maux de tête"]:["Énergie stable"],dairyDay?2:4));
    }
    day.updatedAt=`${date}T21:00:00`;
  }
  return store
}
function demoDiscoveryHtml(){
  if(!db.settings.demoMode)return "";
  return `<section class="demo-discoveries" id="demoDiscoveries">
    <div class="demo-discoveries-heading">
      <div class="demo-heading-mascot"><img src="assets/icon.svg" alt=""></div>
      <div><p class="eyebrow">Ce que tes données racontent</p><h2>4 tendances ressortent après 180 jours</h2><p>Ces observations décrivent des associations dans ce journal fictif. Elles ne prouvent pas qu’un aliment cause un symptôme.</p></div>
    </div>
    <div class="demo-insight-grid">
      <article class="card demo-insight-card demo-insight-strong">
        <div class="demo-insight-top"><span class="demo-signal">Tendance forte</span><strong>82 %</strong></div>
        <div class="demo-insight-icon">🥛</div>
        <h3>Produits laitiers et maux de tête</h3>
        <p>Les repas contenant du lait, du yogourt ou du fromage sont plus souvent suivis d’un mal de tête dans ce journal.</p>
        <div class="demo-comparison"><span><b>31 %</b><small>avec produits laitiers</small></span><i>contre</i><span><b>8 %</b><small>sans produits laitiers</small></span></div>
        <div class="demo-inline-proof"><b>Pourquoi cette tendance?</b><span>16 maux de tête après 52 repas avec produits laitiers, contre une fréquence nettement plus faible sans eux.</span></div><button class="why-demo-insight" type="button" data-demo-detail="lactose">Voir tous les détails →</button>
      </article>
      <article class="card demo-insight-card">
        <div class="demo-insight-top"><span class="demo-signal moderate">Tendance modérée</span><strong>74 %</strong></div>
        <div class="demo-insight-icon">☕</div>
        <h3>Café tardif et sommeil plus court</h3>
        <p>Les journées où un café est noté après 16 h sont associées à une nuit plus courte.</p>
        <div class="demo-comparison"><span><b>6 h 08</b><small>avec café tardif</small></span><i>contre</i><span><b>7 h 46</b><small>sans café tardif</small></span></div>
        <div class="demo-inline-proof"><b>Pourquoi cette tendance?</b><span>La nuit moyenne est plus courte après les journées comprenant un café après 16 h.</span></div><button class="why-demo-insight" type="button" data-demo-detail="coffee">Voir tous les détails →</button>
      </article>
      <article class="card demo-insight-card">
        <div class="demo-insight-top"><span class="demo-signal moderate">Tendance modérée</span><strong>69 %</strong></div>
        <div class="demo-insight-icon">💧</div>
        <h3>Hydratation et fatigue d’après-midi</h3>
        <p>Les journées avec moins de quatre verres sont plus souvent accompagnées d’une énergie faible.</p>
        <div class="demo-comparison"><span><b>46 %</b><small>faible hydratation</small></span><i>contre</i><span><b>17 %</b><small>bonne hydratation</small></span></div>
        <div class="demo-inline-proof"><b>Pourquoi cette tendance?</b><span>Les journées sous quatre verres contiennent plus souvent une note d’énergie faible.</span></div><button class="why-demo-insight" type="button" data-demo-detail="water">Voir tous les détails →</button>
      </article>
      <article class="card demo-insight-card">
        <div class="demo-insight-top"><span class="demo-signal emerging">Observation émergente</span><strong>61 %</strong></div>
        <div class="demo-insight-icon">🚶</div>
        <h3>Activité et humeur plus détendue</h3>
        <p>Après au moins 30 minutes d’activité, le ressenti « détendu » apparaît plus souvent en soirée.</p>
        <div class="demo-comparison"><span><b>2,4×</b><small>plus fréquent</small></span><i>sur</i><span><b>48</b><small>journées actives</small></span></div>
        <div class="demo-inline-proof"><b>Pourquoi cette tendance?</b><span>Le ressenti « détendu » apparaît 2,4 fois plus souvent après au moins 30 minutes d’activité.</span></div><button class="why-demo-insight" type="button" data-demo-detail="activity">Voir tous les détails →</button>
      </article>
    </div>
    <p class="demo-legal-note">🍏⚡ Énergie observe des tendances personnelles. Pour toute préoccupation médicale, consulte un professionnel de la santé.</p>
  </section>`
}
function demoBannerHtml(){
  if(!db.settings.demoMode)return "";
  return `<section class="demo-mode-banner" id="demoModeBanner">
    <span><img src="assets/icon.svg" alt=""> <b>Mode démo</b></span>
    <p>Tu explores le journal fictif de Phil.</p>
    <button type="button" id="leaveDemoQuick">Commencer mon journal</button>
  </section>`
}
function bindDemoChrome(){
  $("#leaveDemoQuick")?.addEventListener("click",leaveDemoMode);
  $$(".why-demo-insight").forEach(button=>button.addEventListener("click",()=>{
    const details={
      lactose:["Produits laitiers et maux de tête","Sur 52 repas contenant des produits laitiers, 16 sont suivis d’un mal de tête. Sur les autres repas, cette observation apparaît beaucoup moins souvent. L’application présente donc une association à surveiller, pas une intolérance confirmée."],
      coffee:["Café tardif et sommeil","La durée de sommeil moyenne est plus faible après les 20 journées où un café a été inscrit après 16 h. D’autres facteurs peuvent aussi expliquer cette différence."],
      water:["Hydratation et énergie","Les notes d’énergie faible sont plus fréquentes lors des journées comptant moins de quatre verres. Les données ne permettent pas d’affirmer que le manque d’eau en est la cause."],
      activity:["Activité et détente","Le mot « détendu » est noté plus souvent après les journées comprenant au moins 30 minutes d’activité. Cette observation pourrait devenir plus fiable avec davantage de données."]
    };
    const [title,body]=details[button.dataset.demoDetail]||["Observation",""];
    $("#sourceTitle").textContent=title;
    $("#sourceContent").innerHTML=`<div class="demo-detail-mascot"><img src="assets/icon.svg" alt=""></div><p>${body}</p><div class="notice info-notice"><strong>À retenir</strong><p>Une association n’est pas une preuve de cause à effet et ne constitue pas un diagnostic.</p></div>`;
    $("#sourceDialog").showModal()
  }))
}
function renderDemoChrome(){
  document.body.classList.toggle("is-demo-mode",!!db.settings.demoMode);
  const appRoot=$("#app");
  if(db.settings.demoMode&&appRoot&&!$("#demoModeBanner")){
    appRoot.insertAdjacentHTML("afterbegin",demoBannerHtml())
  }
  bindDemoChrome()
}
const EXPERIENCE_KEY="energieExperienceV260";
const demoTourSteps=[
  {view:"today",target:".journal-progress",title:"Une journée, en un coup d’œil",text:"Phil voit immédiatement ses repas, son niveau d’énergie et la progression de sa journée.",proof:"3 repas principaux, sommeil, activité et hydratation sont réunis sans transformer le journal en questionnaire."},
  {view:"today",target:".meal-quick-grid",title:"Noter un repas reste rapide",text:"Chaque repas conserve seulement le contexte utile : ce qui a été mangé, l’heure, l’énergie avant et le ressenti après.",proof:"La démo contient plus de 640 repas fictifs répartis sur six mois."},
  {view:"today",target:".wellbeing-detail-grid",title:"Le contexte change l’interprétation",text:"Le sommeil, l’eau et l’activité aident à éviter d’attribuer trop vite une mauvaise journée à un seul aliment.",proof:"Énergie observe plusieurs facteurs ensemble, sans prétendre identifier une cause."},
  {view:"history",target:".timeline",title:"Les journées deviennent une histoire",text:"L’historique regroupe les entrées par mois, semaine et journée pour rendre les répétitions faciles à retrouver.",proof:"Les résumés restent consultables; rien n’est caché derrière une conclusion automatique."},
  {view:"insights",target:".dashboard-overview, .grid",title:"Les graphiques donnent du recul",text:"Avec suffisamment de données, les moyennes et les variations deviennent visibles sans devoir relire chaque journée.",proof:"Les graphiques décrivent l’historique. Ils ne jugent pas les choix et ne fixent aucun objectif médical."},
  {view:"insights",target:"#demoDiscoveries",title:"Énergie fait ressortir des associations",text:"Dans le journal fictif de Phil, certains contextes apparaissent plus souvent avant certains ressentis.",proof:"Une association est un signal à observer, jamais une preuve qu’un aliment cause un symptôme."},
  {view:"insights",target:".demo-insight-card",title:"Chaque tendance montre ses preuves",text:"Le niveau de confiance, les groupes comparés et l’explication sont visibles directement dans la carte.",proof:"Par exemple : 31 % de maux de tête avec produits laitiers, contre 8 % sans eux dans cette démo."},
  {view:"profile",target:".demo-profile-card",title:"Tu gardes toujours le contrôle",text:"Le profil permet de revoir la visite, de quitter la démo, de gérer les observations et de choisir la sauvegarde.",proof:"Les données fictives sont isolées. En quittant la démo, le vrai journal est restauré."}
];

function markExperienceSeen(){
  try{localStorage.setItem(EXPERIENCE_KEY,"1")}catch(_){}
}
function showExperienceLaunchIfNeeded(force=false){
  if(db.settings.demoMode)return;
  let seen=false;
  try{seen=localStorage.getItem(EXPERIENCE_KEY)==="1"}catch(_){}
  const launch=$("#experienceLaunch");
  if(launch)launch.hidden=!force&&seen
}
function closeExperienceLaunch(){const launch=$("#experienceLaunch");if(launch)launch.hidden=true}
function startEmptyExperience(){
  markExperienceSeen();
  closeExperienceLaunch();
  db.settings.showWelcome=false;
  db.settings.demoMode=false;
  db.settings.demoTourSeen=true;
  saveLocal("premiere-ouverture-journal");
  currentView="today";
  selectedDate=todayKey();
  render()
}
function startDemoMode(){
  try{
    if(!localStorage.getItem(DEMO_BACKUP_KEY))localStorage.setItem(DEMO_BACKUP_KEY,JSON.stringify(db))
  }catch(error){console.warn("Copie avant démo non enregistrée",error)}
  markExperienceSeen();
  closeExperienceLaunch();
  db=createDemoDB();
  selectedDate=todayKey();
  currentView="today";
  try{saveLocal("demarrage-demo")}catch(error){console.warn("Démo locale temporaire",error)}
  render();
  requestAnimationFrame(()=>requestAnimationFrame(startDemoTour))
}
function leaveDemoMode(){
  if(!confirm("Quitter la démo et revenir à ton journal? Les données fictives seront retirées."))return;
  let restored=null;
  try{const backup=localStorage.getItem(DEMO_BACKUP_KEY);if(backup)restored=migrate(JSON.parse(backup))}catch(error){console.warn("Restauration impossible",error)}
  db=restored||freshDB();
  db.settings.showWelcome=false;
  db.settings.demoMode=false;
  db.settings.demoTourSeen=true;
  try{localStorage.removeItem(DEMO_BACKUP_KEY);localStorage.removeItem(OUTBOX_KEY)}catch(_){}
  selectedDate=todayKey();currentView="today";
  saveLocal("fin-demo");
  closeDemoGuide();
  render()
}
function clearDemoTourTarget(){$$(".demo-focus").forEach(el=>el.classList.remove("demo-focus"))}
function findDemoTourTarget(selector){for(const part of String(selector||"").split(",")){const target=$(part.trim());if(target)return target}return null}
function closeDemoGuide(){
  clearDemoTourTarget();
  const guide=$("#demoGuide");if(guide)guide.hidden=true;
  document.body.classList.remove("demo-guide-open")
}
function revealDemoTarget(target){
  if(!target)return;
  target.classList.add("demo-focus");
  target.scrollIntoView({behavior:"smooth",block:"center"})
}
function showDemoTourStep(){
  const step=demoTourSteps[demoTourIndex];
  if(!step){finishDemoTour();return}
  if(currentView!==step.view){currentView=step.view;if(step.view==="today")selectedDate=todayKey();render()}
  requestAnimationFrame(()=>requestAnimationFrame(()=>{
    const guide=$("#demoGuide");if(!guide||guide.hidden)return;
    clearDemoTourTarget();
    const target=findDemoTourTarget(step.target);
    $("#demoTourProgress").textContent=`Étape ${demoTourIndex+1} sur ${demoTourSteps.length}`;
    $("#demoTourProgressBar").style.width=`${Math.round((demoTourIndex+1)/demoTourSteps.length*100)}%`;
    $("#demoTourTitle").textContent=step.title;
    $("#demoTourText").textContent=step.text;
    $("#demoTourProof").textContent=step.proof;
    $("#previousDemoTour").disabled=demoTourIndex===0;
    $("#nextDemoTour").textContent=demoTourIndex===demoTourSteps.length-1?"Voir la conclusion":"Continuer";
    revealDemoTarget(target)
  }))
}
function startDemoTour(){
  if(!db.settings.demoMode)return;
  demoTourIndex=0;
  const guide=$("#demoGuide");if(!guide)return;
  guide.hidden=false;
  document.body.classList.add("demo-guide-open");
  showDemoTourStep()
}
function finishDemoTour(){
  closeDemoGuide();
  db.settings.demoTourSeen=true;
  try{saveLocal("visite-demo")}catch(_){}
  const dialog=$("#demoFinalDialog");if(dialog&&!dialog.open)dialog.showModal()
}
function leaveDemoTourEarly(){
  closeDemoGuide();
  db.settings.demoTourSeen=true;
  try{saveLocal("visite-demo-ignoree")}catch(_){}
}
function continueExploringDemo(){
  $("#demoFinalDialog")?.close();
  currentView="insights";render();
  setTimeout(()=>$("#demoDiscoveries")?.scrollIntoView({behavior:"smooth",block:"start"}),100)
}

function render(){if(selectedDate>todayKey())selectedDate=todayKey();document.documentElement.dataset.theme=db.settings.theme==="dark"?"dark":"";updateLivingHeader();$("#todayLabel").textContent=currentView==="today"?formatDate(selectedDate):formatDate(todayKey());$$('.nav-item').forEach(b=>b.classList.toggle('active',b.dataset.view===currentView));updateSyncBadge();({today:renderToday,history:renderHistory,insights:renderInsights,profile:renderProfile}[currentView]||renderToday)();renderDemoChrome()}
function mealCard(m,opts={}){const feeling=m.feeling;return `<article class="card meal-card" data-meal="${m.id}" data-date="${m.date}"><div class="meal-thumb">${m.photoUrl||m.photoLocal?`<img src="${esc(m.photoUrl||m.photoLocal)}" alt="">`:mealIcon(m.type)}</div><div><h3>${esc(m.description)}</h3><div class="meal-meta">${esc(m.time)} · ${esc(t(m.type))}${opts.showDate?` · ${esc(formatDate(m.date))}`:""}</div>${db.settings.macroTracking&&m.nutrition?`<div class="meal-macros">≈ ${esc(nutritionText(m.nutrition))}</div>`:""}<div class="chips"><span class="chip">Énergie avant ${m.fatigueBefore||'—'}/5</span>${feeling?`<span class="chip feeling-chip">${feelingEmoji(feeling.rating)} ${t("Ressenti")} ${feeling.rating}/5</span>`:""}</div></div><div class="meal-actions">${isFeelingEligible(m)?`<button class="feeling-meal" data-feeling="${m.id}" title="${feeling?'Modifier le ressenti':'Ajouter un ressenti'}">${feeling?'😊':'＋😊'}</button>`:""}<button class="favorite-meal" data-favorite="${m.id}" title="Ajouter aux favoris">☆</button><button class="delete-meal" data-delete="${m.id}" title="Supprimer">×</button></div></article>`}
function bindMealCards(){$$('[data-meal]').forEach(c=>c.onclick=e=>{if(e.target.closest('button'))return;selectedDate=c.dataset.date||selectedDate;openMeal(c.dataset.meal)});$$('[data-delete]').forEach(b=>b.onclick=e=>{e.stopPropagation();const card=b.closest('[data-meal]'),d=ensureDay(db,card.dataset.date),m=d.meals.find(x=>x.id===b.dataset.delete);if(m&&confirm('Supprimer ce repas?')){deleteMealLocal(m);render()}});$$('[data-favorite]').forEach(b=>b.onclick=e=>{e.stopPropagation();const card=b.closest('[data-meal]'),m=ensureDay(db,card.dataset.date).meals.find(x=>x.id===b.dataset.favorite);if(m)createFavoriteFromMeal(m)});$$('[data-feeling]').forEach(b=>b.onclick=e=>{e.stopPropagation();const card=b.closest('[data-meal]');selectedDate=card.dataset.date;openFeeling(b.dataset.feeling)});hydratePhotoUrls()}
function mealTypeSummary(meals,type){const list=meals.filter(m=>m.type===type).sort((a,b)=>a.time.localeCompare(b.time));return type==='Collation'?list:list.slice(0,1)}function openSnackManager(){const d=ensureDay(db,selectedDate),snacks=d.meals.filter(m=>m.type==='Collation').sort((a,b)=>a.time.localeCompare(b.time)),list=$('#snackManagerList');list.innerHTML=snacks.length?snacks.map(m=>`<article class="snack-manager-item"><button type="button" class="snack-manager-main" data-edit-snack="${m.id}"><span>🍎</span><span><strong>${esc(m.description)}</strong><small>${esc(m.time)}</small></span></button><button type="button" class="snack-manager-delete" data-delete-snack="${m.id}" aria-label="Supprimer ${esc(m.description)}">🗑️</button></article>`).join(''):'<p class="muted small">Aucune collation enregistrée.</p>';$$('[data-edit-snack]').forEach(b=>b.onclick=()=>{$('#snackManagerDialog').close();openMeal(b.dataset.editSnack)});$$('[data-delete-snack]').forEach(b=>b.onclick=()=>{const m=d.meals.find(x=>x.id===b.dataset.deleteSnack);if(m&&confirm(`Supprimer « ${m.description} »?`)){deleteMealLocal(m);openSnackManager();render()}});$('#addAnotherSnack').onclick=()=>{$('#snackManagerDialog').close();openMeal(null,'Collation')};$('#snackManagerDialog').showModal()}
function mealQuickCard(type,icon,meals){const found=mealTypeSummary(meals,type),main=found[0],count=found.length;const done=type==='Collation'?count>0:!!main;const subtitle=type==='Collation'?(count?`${count} collation${count>1?'s':''} notée${count>1?'s':''}`:'Plusieurs possibles'):(main?`${esc(main.description)} · ${esc(main.time)}`:'À ajouter');const actionIcon=main&&type!=='Collation'?`<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 20h4.2L19 9.2a2 2 0 0 0 0-2.8L17.6 5a2 2 0 0 0-2.8 0L4 15.8V20Zm2-3.4 10.2-10.2 1.4 1.4L7.4 18H6v-1.4Z"/></svg>`:'+';const actionLabel=main&&type!=='Collation'?`Modifier ${type}`:`Ajouter ${type}`;return `<button class="meal-quick-card ${done?'is-complete':''}" data-quick-meal="${esc(type)}" ${main&&type!=='Collation'?`data-edit-meal="${main.id}"`:''} aria-label="${esc(actionLabel)}"><span class="meal-quick-icon">${done&&type!=='Collation'?'✓':icon}</span><span><strong>${esc(t(type))}</strong><small>${subtitle}</small></span><span class="meal-quick-action">${actionIcon}</span></button>`}
function changeJournalDay(offset){const nextDate=addDaysKey(selectedDate,offset);if(nextDate>todayKey())return;selectedDate=nextDate;render()}
function bindJournalSwipe(){const target=$("#journalView");if(!target)return;let startX=0,startY=0;target.addEventListener('touchstart',e=>{const t=e.changedTouches[0];startX=t.clientX;startY=t.clientY},{passive:true});target.addEventListener('touchend',e=>{const t=e.changedTouches[0],dx=t.clientX-startX,dy=t.clientY-startY;if(Math.abs(dx)>65&&Math.abs(dx)>Math.abs(dy)*1.4)changeJournalDay(dx>0?-1:1)},{passive:true})}
const FEELING_TAGS=[
  {id:"headache",emoji:"🤕",label:"Mal de tête",group:"symptom"},{id:"stomachache",emoji:"🤢",label:"Mal de ventre",group:"symptom"},{id:"bloating",emoji:"🎈",label:"Ballonnements",group:"symptom"},{id:"nausea",emoji:"🤮",label:"Nausées",group:"symptom"},{id:"fatigue",emoji:"😴",label:"Fatigue",group:"symptom"},{id:"dizziness",emoji:"😵",label:"Étourdissements",group:"symptom"},{id:"reflux",emoji:"🔥",label:"Reflux",group:"symptom"},{id:"gas",emoji:"💨",label:"Gaz",group:"symptom"},{id:"energy",emoji:"⚡",label:"Plein d’énergie",group:"positive"},{id:"good_mood",emoji:"😊",label:"Bonne humeur",group:"positive"},{id:"focus",emoji:"🧠",label:"Bonne concentration",group:"positive"},{id:"easy_digestion",emoji:"😌",label:"Digestion facile",group:"positive"},{id:"feeling_good",emoji:"💪",label:"Je me sens bien",group:"positive"}
];
function feelingEmoji(r){return ["","😞","😐","🙂","😄","😁"][Number(r)||0]||"🙂"}
function isFeelingEligible(m){return ["Déjeuner","Dîner","Souper","Collation"].includes(m.type)}
function mealDateTime(m){return new Date(`${m.date}T${m.time||"12:00"}:00`)}
function feelingDueAt(m){return new Date(mealDateTime(m).getTime()+(Number(db.settings.feelingDelayHours)||2)*3600000)}
function pendingFeelings(){const enabled=db.settings.feelingReminders!==false,types=db.settings.feelingMealTypes||["Déjeuner","Dîner","Souper"];return allMeals().filter(m=>enabled&&types.includes(m.type)&&!m.feeling&&feelingDueAt(m)<=new Date()).sort((a,b)=>feelingDueAt(b)-feelingDueAt(a))}
function feelingCardHtml(){const pending=pendingFeelings(),todayMeals=ensureDay(db,selectedDate).meals.filter(isFeelingEligible),answered=todayMeals.filter(m=>m.feeling);if(pending.length){const m=pending[0];return `<section class="card feeling-overview is-pending"><div class="feeling-overview-icon">😊</div><div><p class="eyebrow">${t("Ressenti")}</p><h3>${pending.length} réponse${pending.length>1?'s':''} en attente</h3><p class="muted small">Après ${m.type.toLowerCase()} · ${formatDate(m.date)}</p></div><button class="primary small" id="answerFeeling" data-id="${m.id}" data-date="${m.date}">Répondre</button></section>`}const last=[...answered].sort((a,b)=>`${b.date}${b.time}`.localeCompare(`${a.date}${a.time}`))[0];return `<section class="card feeling-overview"><div class="feeling-overview-icon">${last?feelingEmoji(last.feeling.rating):'😊'}</div><div><p class="eyebrow">${t("Ressenti")}</p><h3>${last?`Dernier ressenti : ${last.feeling.rating}/5`:'Aucun ressenti en attente'}</h3><p class="muted small">${last?'Tu peux le modifier depuis le repas.':'Les rappels apparaîtront après tes repas principaux.'}</p></div></section>`}
function openFeeling(id){const m=allMeals().find(x=>x.id===id);if(!m)return;feelingMealId=id;$("#feelingMealContext").textContent=`Après ${m.type.toLowerCase()} · ${m.time}`;makeFeelingRatings(m.feeling?.rating||3);const selected=new Set(m.feeling?.tags||[]);$("#feelingTags").innerHTML=FEELING_TAGS.map(t=>`<button type="button" class="feeling-tag ${selected.has(t.id)?'active':''}" data-feeling-tag="${t.id}"><span>${t.emoji}</span>${esc(t.label)}</button>`).join('');$$('[data-feeling-tag]').forEach(b=>b.onclick=()=>b.classList.toggle('active'));$("#feelingNotes").value=m.feeling?.notes||'';$("#feelingDialog").showModal()}
function makeFeelingRatings(value){const wrap=$("#feelingRating");wrap.dataset.value=String(value);wrap.innerHTML=[1,2,3,4,5].map(n=>`<button type="button" class="feeling-rating-button ${n===Number(value)?'active':''}" data-rating="${n}" aria-label="Ressenti ${n} sur 5"><span>${feelingEmoji(n)}</span><small>${n}</small></button>`).join('');$$('[data-rating]').forEach(b=>b.onclick=()=>{wrap.dataset.value=b.dataset.rating;$$('[data-rating]').forEach(x=>x.classList.toggle('active',x===b))})}
async function requestFeelingNotifications(){if(!('Notification'in window))return false;if(Notification.permission==='granted')return true;if(Notification.permission==='denied')return false;return (await Notification.requestPermission())==='granted'}
function notifyDueFeelings(){if(db.settings.feelingReminders===false||!('Notification'in window)||Notification.permission!=='granted')return;for(const m of pendingFeelings()){if(m.feelingNotifiedAt)continue;try{new Notification(`🍏⚡ ${t('Ressenti')}`,{body:t(`Comment te sens-tu après ton ${m.type.toLowerCase()} ?`),icon:'assets/icon-192.png',tag:`feeling-${m.id}`});m.feelingNotifiedAt=new Date().toISOString();setMealChanged(m)}catch(_){}}}
function scheduleFeelingChecks(){clearTimeout(notificationTimer);notifyDueFeelings();if(db.settings.feelingReminders===false)return;const upcoming=allMeals().filter(m=>(db.settings.feelingMealTypes||[]).includes(m.type)&&!m.feeling&&feelingDueAt(m)>new Date()).sort((a,b)=>feelingDueAt(a)-feelingDueAt(b))[0];if(upcoming){notificationTimer=setTimeout(()=>{notifyDueFeelings();render()},Math.min(2147483647,Math.max(1000,feelingDueAt(upcoming)-new Date())))}}
function renderToday(){const d=ensureDay(db,selectedDate),goal=db.settings.waterGoal||8,meals=[...d.meals].sort((a,b)=>a.time.localeCompare(b.time)),avgBefore=average(meals.map(m=>m.fatigueBefore)),activity=activitySummary(d);const water=Array.from({length:goal},(_,i)=>`<button class="drop ${i<d.water?'filled':''}" data-water="${i+1}">💧</button>`).join("");const principal=['Déjeuner','Dîner','Souper'].filter(t=>meals.some(m=>m.type===t)).length;const dayLabel=relativeDayLabel(selectedDate);const sleepPct=d.sleepHours==null?0:Math.min(100,Math.max(0,Number(d.sleepHours)/8*100));const activityChips=(d.activities||[]).slice(0,3).map(a=>`<span class="activity-chip">${activityIcon(a.type)} ${esc(a.type)}</span>`).join('');$("#app").innerHTML=`${!navigator.onLine?'<div class="offline-banner">Tu es hors ligne. Les changements seront synchronisés plus tard.</div>':''}<div id="journalView"><section class="journal-date-nav"><button class="journal-arrow" id="previousDay" aria-label="Jour précédent">‹</button><button class="journal-date-main" id="goToday"><span>${esc(dayLabel)}</span><strong>${esc(formatDate(selectedDate))}</strong></button><button class="journal-arrow ${selectedDate>=todayKey()?'is-disabled':''}" id="nextDay" aria-label="Jour suivant" ${selectedDate>=todayKey()?'disabled aria-disabled="true"':''}>›</button></section><section class="journal-progress card"><div><p class="eyebrow">Journal</p><h2>${principal}/3 ${t("repas principaux")}</h2><p class="muted small">${meals.length?`${meals.length} entrée${meals.length>1?'s':''} aujourd’hui`:'Commence par ton prochain repas'}</p></div><div class="progress-ring" style="--progress:${principal/3*360}deg"><strong>${principal}</strong><small>/3</small></div></section>${feelingCardHtml()}<section class="meal-quick-grid">${mealQuickCard('Déjeuner','🍳',meals)}${mealQuickCard('Dîner','🥪',meals)}${mealQuickCard('Souper','🍝',meals)}${mealQuickCard('Collation','🍎',meals)}</section><section class="wellbeing-detail-grid"><button class="card sleep-card edit-sleep"><div class="wellness-head"><span class="wellness-icon">😴</span><div><small>Sommeil</small><strong>${d.sleepHours!=null?`${d.sleepHours} h`:'À noter'}</strong></div><b>›</b></div><div class="sleep-bar"><i style="width:${sleepPct}%"></i></div></button><button class="card activity-card edit-activity"><div class="wellness-head"><span class="wellness-icon">${(d.activities||[])[0]?activityIcon(d.activities[0].type):'🚶'}</span><div><small>Activité</small><strong>${activity.label}</strong></div><b>›</b></div><div class="activity-chip-row">${activityChips||'<span class="muted small">Choisir une activité</span>'}</div></button></section><section class="wellbeing-grid"><section class="card wellbeing-card fatigue-card"><span>⚡</span><div><small>Énergie avant</small><strong>${avgBefore==null?'—':avgBefore.toFixed(1)+'/5'}</strong></div></section></section><section class="card hydration-card"><div class="row"><div class="hydration-heading"><span>💧 <small>(500 ml)</small></span><h3>Hydratation</h3></div><strong>${d.water}/${goal}</strong></div><div class="water-row">${water}</div></section></div>`;$("#previousDay").onclick=()=>changeJournalDay(-1);if(!$("#nextDay").disabled)$("#nextDay").onclick=()=>changeJournalDay(1);$("#goToday").onclick=()=>{selectedDate=todayKey();render()};$('.edit-sleep')?.addEventListener('click',openSleep);$('.edit-activity')?.addEventListener('click',openActivity);$$('[data-quick-meal]').forEach(b=>b.onclick=()=>{const type=b.dataset.quickMeal,edit=b.dataset.editMeal;if(type==='Collation'&&mealTypeSummary(meals,'Collation').length)openSnackManager();else if(edit)openMeal(edit);else openMeal(null,type)});$$('[data-water]').forEach(b=>b.onclick=()=>{d.water=Number(b.dataset.water)===d.water?d.water-1:Number(b.dataset.water);setDayChanged(selectedDate);render()});$('#answerFeeling')?.addEventListener('click',e=>{selectedDate=e.currentTarget.dataset.date;openFeeling(e.currentTarget.dataset.id)});bindJournalSwipe()}

async function hydratePhotoUrls(){if(!session)return;let changed=false;for(const d of Object.values(db.days))for(const m of d.meals)if(m.photoPath&&!m.photoUrl){m.photoUrl=await signedPhoto(m.photoPath);changed=changed||!!m.photoUrl}if(changed){saveLocal('liens-photo');render()}}
function localDate(date){return new Date(`${date}T12:00:00`)}
function monthKey(date){return date.slice(0,7)}
function monthLabel(key){return localDate(`${key}-15`).toLocaleDateString('fr-CA',{month:'long',year:'numeric'}).replace(/^./,c=>c.toUpperCase())}
function mondayKey(date){const d=localDate(date),day=(d.getDay()+6)%7;d.setDate(d.getDate()-day);return d.toLocaleDateString('en-CA')}
function addDaysKey(date,days){const d=localDate(date);d.setDate(d.getDate()+days);return d.toLocaleDateString('en-CA')}
function weekLabel(key){return `Semaine du ${localDate(key).toLocaleDateString('fr-CA',{day:'numeric',month:'short'})} au ${localDate(addDaysKey(key,6)).toLocaleDateString('fr-CA',{day:'numeric',month:'short',year:'numeric'})}`}
function relativeDayLabel(date){if(date===todayKey())return "Aujourd’hui";if(date===addDaysKey(todayKey(),-1))return "Hier";return localDate(date).toLocaleDateString('fr-CA',{weekday:'long',day:'numeric',month:'long'}).replace(/^./,c=>c.toUpperCase())}
function isFavoriteMeal(m){const norm=x=>String(x||'').trim().toLowerCase();return db.favorites.some(f=>norm(f.description)===norm(m.description)&&norm(f.type)===norm(m.type))}
function historyStats(meals){const avg=average(meals.map(m=>m.fatigueBefore)),fav=meals.filter(isFavoriteMeal).length,times=meals.map(m=>m.time).filter(Boolean).sort();return{count:meals.length,avg,fav,first:times[0]||null,last:times.at(-1)||null}}
function miniStatsHtml(stats,scope='day'){return `<div class="timeline-stats"><span>🍽️ ${stats.count}</span><span>⚡ ${stats.avg==null?'—':stats.avg.toFixed(1)+'/5'}</span>${stats.fav?`<span>⭐ ${stats.fav}</span>`:''}${scope==='day'&&stats.first?`<span>🕒 ${stats.first}${stats.last!==stats.first?'–'+stats.last:''}</span>`:''}</div>`}
function dayInsight(meals){if(!meals.length)return '';const avg=average(meals.map(m=>m.fatigueBefore));if(meals.length>=3)return `Tu as enregistré ${meals.length} repas. Ce suivi régulier donnera davantage de contexte aux tendances futures.`;if(avg!=null&&avg<=2)return `L’énergie notée avant les repas est plutôt faible pour cette journée, selon les données enregistrées.`;if(avg!=null&&avg>=4)return `L’énergie notée avant les repas est plutôt élevée pour cette journée. Cela ne permet pas d’en déterminer la cause.`;return `Cette journée contribue progressivement à mieux décrire tes habitudes.`}
function dayContext(date){const d=ensureDay(db,date);return{sleep:d.sleepHours,water:d.water||0,activities:(d.activities||[]).length}}
function periodStats(meals){const base=historyStats(meals),dates=[...new Set(meals.map(m=>m.date))],contexts=dates.map(dayContext),sleepVals=contexts.map(x=>Number(x.sleep)).filter(Number.isFinite),water=contexts.reduce((sum,x)=>sum+x.water,0),activeDays=contexts.filter(x=>x.activities>0).length,types={};meals.forEach(m=>types[m.type]=(types[m.type]||0)+1);const topType=Object.entries(types).sort((a,b)=>b[1]-a[1])[0];return{...base,days:dates.length,avgSleep:sleepVals.length?sleepVals.reduce((a,b)=>a+b,0)/sleepVals.length:null,water,activeDays,topType:topType?.[0]||null}}
function summaryTiles(stats,scope='day'){const tiles=[`<div><span>🍽️</span><strong>${stats.count}</strong><small>repas</small></div>`,`<div><span>⚡</span><strong>${stats.avg==null?'—':stats.avg.toFixed(1)+'/5'}</strong><small>fatigue moyenne</small></div>`];if(scope!=='day')tiles.push(`<div><span>📅</span><strong>${stats.days||0}</strong><small>jours suivis</small></div>`);if(stats.fav)tiles.push(`<div><span>⭐</span><strong>${stats.fav}</strong><small>favoris</small></div>`);if(stats.avgSleep!=null)tiles.push(`<div><span>😴</span><strong>${stats.avgSleep.toFixed(1)} h</strong><small>sommeil moyen</small></div>`);if(stats.water)tiles.push(`<div><span>💧</span><strong>${stats.water}</strong><small>verres notés</small></div>`);return `<div class="period-summary-grid">${tiles.join('')}</div>`}
function periodObservation(stats,scope){if(!stats.count)return'';if(scope==='month'&&stats.days>=14)return`Tu as documenté ${stats.days} journées ce mois-ci. Ce volume permet de dégager des tendances plus représentatives, sans établir de lien de cause à effet.`;if(scope==='week'&&stats.days>=5)return`Cette semaine contient ${stats.count} repas répartis sur ${stats.days} jours. La régularité du suivi améliore le contexte des observations.`;if(stats.topType)return`Le type de repas le plus souvent enregistré est « ${stats.topType} ». Cette information est descriptive seulement.`;return`Ce résumé repose uniquement sur les données que tu as enregistrées.`}
function journeySummary(meals){if(!meals.length)return'';const dates=meals.map(m=>m.date).sort(),first=dates[0],days=Math.max(1,Math.round((localDate(todayKey())-localDate(first))/86400000)+1),months=new Set(dates.map(monthKey)).size;return `<section class="journey-card card"><div><p class="eyebrow">Ton parcours</p><h3>${days} jour${days>1?'s':''} de suivi</h3><p class="muted small">Depuis le ${esc(localDate(first).toLocaleDateString('fr-CA',{day:'numeric',month:'long',year:'numeric'}))}</p></div><div class="journey-numbers"><span><strong>${meals.length}</strong><small>repas</small></span><span><strong>${new Set(dates).size}</strong><small>journées</small></span><span><strong>${months}</strong><small>mois</small></span></div></section>`}
function renderHistoryDay(date,meals,open=false){const stats={...periodStats(meals),...dayContext(date)},sorted=[...meals].sort((a,b)=>a.time.localeCompare(b.time));return `<details class="timeline-day" ${open?'open':''}><summary><div class="timeline-marker"></div><div class="timeline-summary"><strong>${esc(relativeDayLabel(date))}</strong>${miniStatsHtml(stats)}</div><span class="timeline-chevron">›</span></summary><div class="timeline-day-body"><section class="daily-summary"><div><span class="eyebrow">Résumé de la journée</span><p>${esc(dayInsight(meals))}</p></div>${summaryTiles(stats,'day')}</section><div class="stack timeline-meals">${sorted.map(m=>mealCard(m)).join('')}</div></div></details>`}
function renderHistoryWeek(key,meals,open=false){const byDay={};meals.forEach(m=>(byDay[m.date]??=[]).push(m));const dates=Object.keys(byDay).sort().reverse(),stats=periodStats(meals);return `<details class="timeline-week" ${open?'open':''}><summary><div><strong>${esc(weekLabel(key))}</strong>${miniStatsHtml(stats,'week')}</div><span class="timeline-chevron">›</span></summary><div class="timeline-week-body"><section class="period-summary"><p>${esc(periodObservation(stats,'week'))}</p>${summaryTiles(stats,'week')}</section>${dates.map((date,i)=>renderHistoryDay(date,byDay[date],open&&i<2)).join('')}</div></details>`}
function renderHistoryGroups(meals){if(!meals.length)return `<section class="card empty"><div class="food-art">🔎</div><p>Aucun résultat.</p></section>`;const byMonth={};meals.forEach(m=>{const mk=monthKey(m.date);((byMonth[mk]??={})[mondayKey(m.date)]??=[]).push(m)});const months=Object.keys(byMonth).sort().reverse();return `<div class="smart-timeline">${months.map((mk,mi)=>{const weeks=byMonth[mk],weekKeys=Object.keys(weeks).sort().reverse(),monthMeals=weekKeys.flatMap(k=>weeks[k]),stats=periodStats(monthMeals);return `<details class="timeline-month" ${mi===0?'open':''}><summary><div><span class="timeline-month-label">${esc(monthLabel(mk))}</span>${miniStatsHtml(stats,'month')}</div><span class="timeline-chevron">›</span></summary><div class="timeline-month-body"><section class="period-summary month-summary"><p>${esc(periodObservation(stats,'month'))}</p>${summaryTiles(stats,'month')}</section>${weekKeys.map((wk,wi)=>renderHistoryWeek(wk,weeks[wk],mi===0&&wi===0)).join('')}</div></details>`}).join('')}</div>`}
function renderHistory(){const meals=allMeals().sort((a,b)=>`${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));const types=['Tous','Déjeuner','Dîner','Souper','Collation','Boisson'];$("#app").innerHTML=`<section class="hero"><p class="eyebrow">Smart Timeline</p><h2>Ton historique, organisé naturellement</h2><p>Les repas sont regroupés par journée, semaine et mois pour rester faciles à consulter avec le temps.</p></section><section class="card search-card"><input id="mealSearch" type="search" placeholder="Rechercher un aliment, une note ou une date…" autocomplete="off"><div class="filter-label">Période</div><div class="filter-row"><button class="filter-chip active" data-range="all">Tout</button><button class="filter-chip" data-range="7">7 jours</button><button class="filter-chip" data-range="30">Ce mois</button><button class="filter-chip" data-range="365">Cette année</button></div><div class="filter-label">Type de repas</div><div class="filter-row">${types.map((mealType,i)=>`<button class="filter-chip ${i===0?'active':''}" data-type="${esc(mealType)}">${esc(t(mealType))}</button>`).join('')}</div><div class="filter-row"><button class="filter-chip" data-special="favorite">⭐ Favoris</button><button class="filter-chip" data-energy="low">Énergie faible</button><button class="filter-chip" data-energy="high">Énergie élevée</button></div></section><section class="section-title"><h2>Chronologie</h2><span id="resultCount" class="muted small">${meals.length} repas</span></section><div id="historyResults">${renderHistoryGroups(meals)}</div>`;let range='all',type='Tous',favoriteOnly=false,energy=null;const apply=()=>{const q=$("#mealSearch").value.trim().toLowerCase();const cutoff=range==='all'?null:new Date(Date.now()-Number(range)*86400000);const filtered=meals.filter(m=>(!cutoff||localDate(m.date)>=cutoff)&&(type==='Tous'||m.type===type)&&(!favoriteOnly||isFavoriteMeal(m))&&(!energy||(energy==='low'?m.fatigueBefore>0&&m.fatigueBefore<=2:m.fatigueBefore>=4))&&`${m.description} ${m.type} ${m.notes} ${m.date}`.toLowerCase().includes(q));$("#resultCount").textContent=`${filtered.length} repas`;$("#historyResults").innerHTML=renderHistoryGroups(filtered);bindMealCards()};$("#mealSearch").oninput=apply;$$('[data-range]').forEach(b=>b.onclick=()=>{range=b.dataset.range;$$('[data-range]').forEach(x=>x.classList.toggle('active',x===b));apply()});$$('[data-type]').forEach(b=>b.onclick=()=>{type=b.dataset.type;$$('[data-type]').forEach(x=>x.classList.toggle('active',x===b));apply()});$('[data-special="favorite"]').onclick=e=>{favoriteOnly=!favoriteOnly;e.currentTarget.classList.toggle('active',favoriteOnly);apply()};$$('[data-energy]').forEach(b=>b.onclick=()=>{energy=energy===b.dataset.energy?null:b.dataset.energy;$$('[data-energy]').forEach(x=>x.classList.toggle('active',x.dataset.energy===energy));apply()});bindMealCards()}
function renderFavoriteList(list){return list.length?list.sort((a,b)=>b.usageCount-a.usageCount).map(f=>`<article class="card favorite-card"><div class="favorite-icon">${mealIcon(f.type)}</div><div><h3>${esc(f.name)}</h3><p>${esc(f.description)}</p><small class="muted">Utilisé ${f.usageCount||0} fois</small></div><div class="favorite-actions"><button class="primary small" data-use-favorite="${f.id}">Utiliser</button><button class="delete-meal" data-delete-favorite="${f.id}">×</button></div></article>`).join(''):`<section class="card empty"><div class="food-art">⭐</div><p>Ajoute un repas existant à tes favoris avec l’étoile.</p></section>`}
function bindFavoriteActions(){$$('[data-use-favorite]').forEach(b=>b.onclick=()=>useFavorite(b.dataset.useFavorite));$$('[data-delete-favorite]').forEach(b=>b.onclick=()=>{const f=db.favorites.find(x=>x.id===b.dataset.deleteFavorite);if(f&&confirm(`Supprimer « ${f.name} » des favoris?`)){deleteFavoriteLocal(f);render()}})}
function insightConfidence(count){if(count>=20)return{label:"Élevée",cls:"high"};if(count>=8)return{label:"Moyenne",cls:"medium"};return{label:"Préliminaire",cls:"low"}}
function timeToMinutes(t){const [h,m]=String(t||"00:00").split(":").map(Number);return h*60+m}
function formatMinutes(n){if(!Number.isFinite(n))return"—";const h=Math.floor(n/60)%24,m=Math.round(n%60);return`${h} h ${String(m).padStart(2,"0")}`}
const SOURCES={canada:{name:"Santé Canada — Guide alimentaire canadien",url:"https://www.canada.ca/fr/sante-canada/services/guide-alimentaire.html"},processed:{name:"Santé Canada — Limiter les aliments hautement transformés",url:"https://www.canada.ca/fr/sante-canada/services/guide-alimentaire/explorez/recommandations-matiere-alimentation-saine/limitez-hautement-transformes.html"},labels:{name:"Santé Canada — Symbole nutritionnel sur le devant de l’emballage",url:"https://www.canada.ca/fr/sante-canada/services/aliments-nutrition/etiquetage-nutritionnel/devant-emballage.html"},who:{name:"Organisation mondiale de la Santé — Alimentation saine",url:"https://www.who.int/news-room/fact-sheets/detail/healthy-diet"}};
function buildPersonalInsights(meals){const cards=[];if(!meals.length)return cards;const valid=meals.filter(m=>m.fatigueBefore>0);const byType={};valid.forEach(m=>(byType[m.type]??=[]).push(m.fatigueBefore));const least=Object.entries(byType).filter(([,v])=>v.length>=2).map(([k,v])=>[k,average(v),v.length]).sort((a,b)=>b[1]-a[1])[0];if(least){cards.push({icon:"🍽️",title:"Énergie observée avant certains repas",text:`Avant tes repas « ${least[0]} », ton énergie enregistrée est en moyenne de ${least[1].toFixed(1)}/5. Cela décrit ton historique sans expliquer la cause.`,confidence:insightConfidence(least[2]),basis:`Basé sur ${least[2]} repas enregistrés.`,kind:"personal"})}const times=valid.map(m=>timeToMinutes(m.time));if(times.length>=3)cards.push({icon:"⏰",title:"Ton horaire habituel",text:`Tu enregistres tes repas vers ${formatMinutes(average(times))} en moyenne.`,confidence:insightConfidence(times.length),basis:`Basé sur ${times.length} repas enregistrés.`,kind:"personal"});const weekdays={};valid.forEach(m=>{const day=new Date(`${m.date}T12:00:00`).toLocaleDateString('fr-CA',{weekday:'long'});(weekdays[day]??=[]).push(m.fatigueBefore)});const best=Object.entries(weekdays).filter(([,v])=>v.length>=2).map(([k,v])=>[k,average(v),v.length]).sort((a,b)=>b[1]-a[1])[0];if(best)cards.push({icon:"📅",title:"Journée associée à plus d’énergie",text:`Le ${best[0]}, ton énergie avant les repas est en moyenne de ${best[1].toFixed(1)}/5 dans les données disponibles.`,confidence:insightConfidence(best[2]),basis:`Basé sur ${best[2]} repas enregistrés ce jour de la semaine.`,kind:"personal"});return cards.slice(0,3)}
function countKeywordMeals(meals,words){return meals.filter(m=>words.some(w=>`${m.description} ${m.notes}`.toLowerCase().includes(w))).length}
function buildNutritionObservations(meals){if(!db.settings.nutritionObservations||!meals.length)return[];const recent=meals.filter(m=>new Date(`${m.date}T23:59:59`)>=new Date(Date.now()-7*86400000));if(recent.length<3)return[];const groups=[{icon:"🍬",title:"Aliments possiblement plus sucrés",words:["boisson gazeuse","liqueur","bonbon","chocolat","biscuit","gâteau","gateau","beigne","donut","sirop","jus","crème glacée","creme glacee","céréales sucrées","cereales sucrees"],min:3,text:"Plusieurs descriptions récentes mentionnent des aliments souvent associés à davantage de sucres. Tu pourrais simplement vérifier les étiquettes ou varier certains choix, si cet objectif est important pour toi.",source:[SOURCES.labels,SOURCES.who]},{icon:"🧂",title:"Aliments possiblement plus salés",words:["chips","croustille","pizza","charcuterie","bacon","saucisse","ramen","soupe en conserve","repas congelé","repas congele","fast food","poutine"],min:3,text:"Plusieurs descriptions récentes mentionnent des aliments qui peuvent être plus riches en sodium. Les portions et les recettes font une grande différence; l’étiquette demeure la meilleure référence.",source:[SOURCES.labels,SOURCES.processed]},{icon:"🧈",title:"Gras saturés à surveiller dans les choix fréquents",words:["frit","frite","poutine","bacon","saucisse","crème","creme","beurre","fromage","pizza","croissant","pâtisserie","patisserie"],min:3,text:"Certains aliments notés fréquemment peuvent contenir davantage de gras saturés. Il ne s’agit pas d’un jugement sur un repas; la variété au fil du temps est ce qui compte.",source:[SOURCES.labels,SOURCES.canada]},{icon:"🥦",title:"Peu de végétaux repérés dans les descriptions",inverse:true,words:["légume","legume","salade","brocoli","carotte","tomate","épinard","epinard","poivron","haricot","lentille","pois chiche","fruit","pomme","banane","bleuet","fraise"],min:2,text:"L’application repère peu de fruits, légumes ou légumineuses dans les repas récents. Les descriptions peuvent être incomplètes; tu pourrais préciser les accompagnements pour obtenir une observation plus juste.",source:[SOURCES.canada]}];return groups.flatMap(g=>{const count=countKeywordMeals(recent,g.words),trigger=g.inverse?count<g.min:count>=g.min;if(!trigger)return[];return[{...g,text:db.settings.generalRecommendations?g.text:g.text.split(". ")[0]+".",confidence:insightConfidence(recent.length),basis:`Estimation par mots-clés dans ${recent.length} repas des 7 derniers jours. Les quantités et valeurs nutritives ne sont pas connues.`,kind:"nutrition"}]}).slice(0,3)}
function insightHtml(x,i){const sourceButton=db.settings.showSources?`<button class="text-button why-insight" data-insight="${i}">Pourquoi je vois ceci?</button>`:"";return`<article class="card insight-card"><div class="insight-icon">${x.icon}</div><div><div class="insight-heading"><span class="insight-type">${t(x.kind==='nutrition'?'Observation nutritionnelle estimée':'Observation personnelle')}</span><h3>${esc(x.title)}</h3></div><p>${esc(x.text)}</p><div class="insight-footer"><span class="confidence ${x.confidence.cls}">Confiance ${x.confidence.label.toLowerCase()}</span>${sourceButton}</div></div></article>`}
function openInsightWhy(x){$("#sourceTitle").textContent="Pourquoi je vois ceci?";const refs=(x.source||[]).map(s=>`<li><a href="${s.url}" target="_blank" rel="noopener">${esc(s.name)} ↗</a></li>`).join('');$("#sourceContent").innerHTML=`<p>${esc(x.basis||'Cette observation utilise les données disponibles dans l’application.')}</p><div class="notice"><strong>Limites importantes</strong><p>Cette observation est automatisée et informative. Elle ne constitue ni un diagnostic, ni une preuve de causalité, ni un remplacement d’un avis professionnel.</p></div>${refs?`<h3>Sources générales</h3><ul class="source-list">${refs}</ul>`:'<p class="muted small">Cette carte repose uniquement sur tes données personnelles.</p>'}`;$("#sourceDialog").showModal()}
function renderInsights(){const realMeals=allMeals(),usePreview=!db.settings.demoMode&&realMeals.length<8&&sessionStorage.getItem('dashboardPreview')!=="off";const demo=[{date:todayKey(),time:"07:30",type:"Déjeuner",description:"Yogourt grec, bleuets et granola",fatigueBefore:3},{date:todayKey(),time:"12:10",type:"Dîner",description:"Poulet, riz et brocoli",fatigueBefore:2},{date:todayKey(),time:"18:20",type:"Souper",description:"Pizza et salade",fatigueBefore:3},{date:"2026-07-18",time:"07:45",type:"Déjeuner",description:"Céréales sucrées et jus",fatigueBefore:3},{date:"2026-07-18",time:"12:30",type:"Dîner",description:"Poulet, riz et brocoli",fatigueBefore:2},{date:"2026-07-17",time:"18:00",type:"Souper",description:"Poutine",fatigueBefore:4},{date:"2026-07-16",time:"07:20",type:"Déjeuner",description:"Yogourt grec, bleuets et granola",fatigueBefore:2},{date:"2026-07-15",time:"12:05",type:"Dîner",description:"Poulet, riz et brocoli",fatigueBefore:2},{date:"2026-07-14",time:"18:40",type:"Souper",description:"Pizza",fatigueBefore:3},{date:"2026-07-13",time:"08:10",type:"Déjeuner",description:"Œufs et rôties",fatigueBefore:3}];const meals=usePreview?demo:realMeals,before=average(meals.map(m=>m.fatigueBefore));const last7=meals.filter(m=>new Date(`${m.date}T23:59:59`)>=new Date(Date.now()-7*86400000));const freq={};meals.forEach(m=>{const key=m.description.trim();if(key)freq[key]=(freq[key]||0)+1});const common=Object.entries(freq).sort((a,b)=>b[1]-a[1]).slice(0,5),avgTime=average(meals.map(m=>timeToMinutes(m.time)));let insights=db.settings.insightsEnabled?buildPersonalInsights(meals):[];insights=insights.concat(buildNutritionObservations(meals));const dates=[...new Set(meals.map(m=>m.date))].sort().slice(-14);const bars=dates.map(date=>{const vals=meals.filter(m=>m.date===date).map(m=>m.fatigueBefore),a=average(vals)||0;return `<i style="height:${Math.max(8,a/5*100)}%" title="${esc(date)} : ${a.toFixed(1)}"></i>`}).join('');const previewBanner=realMeals.length<8?`<section class="preview-banner"><div><strong>${usePreview?'👀 Mode aperçu activé':'📊 Tes vraies données'}</strong><p>${usePreview?'Des données exemples montrent la présentation. Elles ne sont jamais sauvegardées.':'Le tableau de bord utilise seulement tes repas enregistrés.'}</p></div><button class="secondary small" id="togglePreview">${usePreview?'Voir mes données':'Voir l’aperçu'}</button></section>`:"";$("#app").innerHTML=`<section class="hero"><p class="eyebrow">Tableau de bord & observations</p><h2>Observe tes habitudes sans jugement</h2><p>Les cartes décrivent des tendances possibles. Elles ne posent aucun diagnostic et ne prouvent jamais qu’un aliment cause un effet.</p></section>${previewBanner}<div class="grid"><section class="card stat-card"><span>🍽️</span><h3>Repas — 7 jours</h3><div class="metric">${last7.length}</div></section><section class="card stat-card"><span>📚</span><h3>Repas au total</h3><div class="metric">${meals.length}</div></section><section class="card stat-card"><span>⚡</span><h3>Énergie avant</h3><div class="metric">${before==null?'—':before.toFixed(1)+'/5'}</div></section><section class="card stat-card"><span>⏰</span><h3>Heure moyenne</h3><div class="metric metric-small">${formatMinutes(avgTime)}</div></section><section class="card wide"><h3>Énergie avant — jours récents</h3><div class="spark">${bars||'<span class="muted">Pas encore assez de données.</span>'}</div><div class="chart-scale"><span>énergie faible</span><span>énergie élevée</span></div></section><section class="card wide"><h3>Repas les plus fréquents</h3><div class="ranking">${common.length?common.map(([name,count],i)=>`<div><span>${i+1}</span><strong>${esc(name)}</strong><em>${count}×</em></div>`).join(''):'<p class="muted">Ajoute quelques repas pour voir le classement.</p>'}</div></section></div><div class="section-title"><h2>🧠 Observations</h2><span class="muted small">${insights.length} carte${insights.length>1?'s':''}</span></div><div class="insight-grid">${insights.length?insights.map(insightHtml).join(''):`<section class="card empty wide"><div class="food-art">🧠</div><p>${db.settings.insightsEnabled||db.settings.nutritionObservations?'Continue d’enregistrer tes repas pour obtenir des observations.':'Les observations sont désactivées dans les paramètres.'}</p></section>`}</div>${demoDiscoveryHtml()}${usePreview&&!db.settings.demoMode?'<p class="preview-footnote">Les valeurs du mode aperçu sont fictives et servent uniquement à prévisualiser la présentation.</p>':''}`;$("#togglePreview")?.addEventListener('click',()=>{sessionStorage.setItem('dashboardPreview',usePreview?'off':'on');renderInsights()});$$('.why-insight').forEach(b=>b.onclick=()=>openInsightWhy(insights[Number(b.dataset.insight)]))}
function toggleSetting(id,key){$(id).onchange=e=>{db.settings[key]=e.target.checked;saveLocal(`parametre-${key}`);render()}}
function renderProfile(){const backups=(()=>{try{return JSON.parse(localStorage.getItem(BACKUP_KEY)||'[]').length}catch(_){return 0}})();$("#app").innerHTML=`<section class="hero"><p class="eyebrow">Profil et préférences</p><h2>${session?esc(session.user.email):'Protège ton historique'}</h2><p>${session?'La synchronisation Supabase est active.':'La copie locale seule peut disparaître sur iPhone.'}</p></section><div class="stack"><section class="card">${session?`<div class="settings-row"><div><h3>Compte connecté</h3><p class="muted small">${esc(session.user.email)}</p></div><button class="secondary" id="syncNow">Synchroniser</button></div><button class="danger" id="signOut">Se déconnecter</button>`:`<h3>Sauvegarde en ligne</h3><p class="muted">Connecte-toi afin que les repas et favoris soient enregistrés dans Supabase.</p><button class="primary" id="signIn">Se connecter</button>`}</section><section class="card"><h3>Observations et recommandations</h3><p class="muted small">Tu gardes le contrôle sur ce qui apparaît dans le tableau de bord.</p><label class="toggle-row"><span><strong>Insights personnels</strong><small>Tendances calculées à partir de ton historique</small></span><input id="settingInsights" type="checkbox" ${db.settings.insightsEnabled?'checked':''}></label><label class="toggle-row"><span><strong>Macros facultatives (bêta)</strong><small>Estime calories, protéines, glucides et lipides. Tout reste modifiable et approximatif.</small></span><input id="settingMacros" type="checkbox" ${db.settings.macroTracking?'checked':''}></label><label class="toggle-row"><span><strong>Observations nutritionnelles</strong><small>Estimations prudentes selon les descriptions saisies</small></span><input id="settingNutrition" type="checkbox" ${db.settings.nutritionObservations?'checked':''}></label><label class="toggle-row"><span><strong>Suggestions générales</strong><small>Conseils facultatifs et non moralisateurs</small></span><input id="settingRecommendations" type="checkbox" ${db.settings.generalRecommendations?'checked':''}></label><label class="toggle-row"><span><strong>Afficher les sources</strong><small>Ajoute « Pourquoi je vois ceci? » aux cartes</small></span><input id="settingSources" type="checkbox" ${db.settings.showSources?'checked':''}></label></section><section class="card"><div class="settings-row"><div><h3>Message d’information</h3><p class="muted small">Revoir les limites et l’utilisation prévue de l’application</p></div><button class="secondary" id="showWelcomeAgain">Afficher</button></div></section><section class="card"><h3>😊 ${t("Ressenti")}</h3><p class="muted small">Choisis si et quand l’application te rappelle de noter ton ressenti après un repas.</p><label class="toggle-row"><span><strong>Rappels de ressenti</strong><small>Désactive ceci pour ne recevoir aucun rappel</small></span><input id="settingFeelingReminders" type="checkbox" ${db.settings.feelingReminders!==false?'checked':''}></label><div id="feelingReminderOptions" class="feeling-settings ${db.settings.feelingReminders===false?'is-disabled':''}"><p class="settings-label">Repas concernés</p><div class="settings-check-grid">${['Déjeuner','Dîner','Souper','Collation'].map(t=>`<label class="setting-option"><input type="checkbox" data-feeling-meal-type="${t}" ${(db.settings.feelingMealTypes||[]).includes(t)?'checked':''}><span>${mealIcon(t)} ${window.t(t)}</span></label>`).join('')}</div><label>Délai après le repas<select id="feelingDelay"><option value="1" ${Number(db.settings.feelingDelayHours)===1?'selected':''}>1 heure</option><option value="2" ${Number(db.settings.feelingDelayHours)===2?'selected':''}>2 heures</option><option value="3" ${Number(db.settings.feelingDelayHours)===3?'selected':''}>3 heures</option></select></label><button class="secondary small" id="enableNotifications" type="button">Autoriser les notifications</button><p class="muted tiny">Sur le Web, les rappels système dépendent des permissions du navigateur et peuvent nécessiter que l’app soit ouverte. Les ressentis dus restent toujours visibles dans le Journal.</p></div></section><section class="card"><div class="settings-row"><div><h3>Objectif d'eau</h3><p class="muted small">Nombre de gouttes affichées</p></div><input id="waterGoal" type="text" inputmode="numeric" pattern="[0-9]*" autocomplete="one-time-code" autocorrect="off" autocapitalize="off" spellcheck="false" enterkeyhint="done" value="${db.settings.waterGoal||8}" style="width:80px"></div></section><section class="section-title"><h2>⭐ ${t("Mes favoris")}</h2><span class="muted small">${db.favorites.length}</span></section><div id="profileFavoritesList" class="stack">${renderFavoriteList(db.favorites)}</div>${db.settings.demoMode?`<section class="card demo-profile-card"><div class="settings-row"><div><h3>🧪 Mode démo actif</h3><p class="muted small">Tu explores 180 jours de données fictives de Phil.</p></div><span class="demo-pill">Phil</span></div><div class="dialog-actions"><button class="secondary" id="replayDemoTour">Revoir la visite</button><button class="primary" id="leaveDemoProfile">Revenir à mon journal</button></div></section>`:`<section class="card demo-entry-card"><div class="demo-entry-visual"><img src="assets/icon.svg" alt=""><span>▶</span></div><div><p class="eyebrow">Découvrir Énergie</p><h3>Explorer le journal fictif de Phil</h3><p class="muted small">Parcours 180 jours de repas, de sommeil, d’hydratation, de graphiques et de tendances guidées.</p></div><button class="primary" id="launchDemoProfile">Découvrir la démo</button></section>`}<section class="card"><h3>Sauvegarde supplémentaire</h3><p class="muted small">${backups} copie(s) locale(s) de sécurité.</p><div class="dialog-actions"><button class="secondary" id="exportData">Exporter JSON</button><button class="secondary" id="importData">Importer JSON</button></div></section><section class="card"><p class="muted small">Énergie V${esc(CFG.appVersion||'3.0.0')}</p></section></div>`;$("#signIn")?.addEventListener("click",()=>{setAuthMode("login");$("#authMessage").textContent="";$("#authDialog").showModal()});$("#syncNow")?.addEventListener('click',async()=>{await syncNow();await pullCloud()});$("#signOut")?.addEventListener('click',async()=>{await client.auth.signOut();session=null;render()});$("#waterGoal").onchange=e=>{db.settings.waterGoal=clamp(e.target.value,1,20);saveLocal('objectif-eau');render()};toggleSetting('#settingInsights','insightsEnabled');toggleSetting('#settingMacros','macroTracking');toggleSetting('#settingNutrition','nutritionObservations');toggleSetting('#settingRecommendations','generalRecommendations');toggleSetting('#settingSources','showSources');const feelingToggle=$('#settingFeelingReminders');if(feelingToggle)feelingToggle.onchange=async e=>{db.settings.feelingReminders=e.target.checked;saveLocal('rappels-ressenti');if(e.target.checked)await requestFeelingNotifications();scheduleFeelingChecks();renderProfile()};$$('[data-feeling-meal-type]').forEach(c=>c.onchange=()=>{db.settings.feelingMealTypes=$$('[data-feeling-meal-type]:checked').map(x=>x.dataset.feelingMealType);saveLocal('repas-rappels-ressenti');scheduleFeelingChecks()});$('#feelingDelay')?.addEventListener('change',e=>{db.settings.feelingDelayHours=Number(e.target.value);saveLocal('delai-ressenti');scheduleFeelingChecks()});$('#enableNotifications')?.addEventListener('click',async()=>{const ok=await requestFeelingNotifications();alert(ok?'Notifications autorisées.':'Les notifications ne sont pas autorisées dans ce navigateur.')});$("#showWelcomeAgain").onclick=()=>$("#welcomeDialog").showModal();$("#launchDemoProfile")?.addEventListener("click",()=>showExperienceLaunchIfNeeded(true));$("#replayDemoTour")?.addEventListener("click",startDemoTour);$("#leaveDemoProfile")?.addEventListener("click",leaveDemoMode);bindFavoriteActions();$("#exportData").onclick=exportData;$("#importData").onclick=()=>$("#importFile").click()}


// --- Ajout rapide par code-barres -------------------------------------------------
function barcodeCache(){try{return JSON.parse(localStorage.getItem(BARCODE_CACHE_KEY)||"{}")||{}}catch(_){return{}}}
function saveBarcodeCache(code,product){try{const cache=barcodeCache();cache[code]={...product,savedAt:new Date().toISOString()};const entries=Object.entries(cache).sort((a,b)=>String(b[1].savedAt).localeCompare(String(a[1].savedAt))).slice(0,150);localStorage.setItem(BARCODE_CACHE_KEY,JSON.stringify(Object.fromEntries(entries)))}catch(e){console.warn("cache code-barres",e)}}
function cleanBarcode(value){return String(value||"").replace(/\D/g,"").slice(0,18)}
function stopBarcodeCamera(){try{barcodeControls?.stop?.()}catch(_){}barcodeControls=null;const video=$("#barcodeVideo");if(video?.srcObject){video.srcObject.getTracks().forEach(t=>t.stop());video.srcObject=null}barcodeReader=null;barcodeBusy=false}
function setBarcodeStatus(text){const el=$("#barcodeCameraStatus");if(el)el.textContent=text}
function resetBarcodeResult(){barcodeLastCode="";barcodeLastProduct=null;$("#barcodeResult").hidden=true;$("#barcodeProductName").value="";$("#barcodeBrand").textContent="";$("#barcodeProductImage").hidden=true;$("#barcodeProductImage").removeAttribute("src")}
function appendScannedFood(name){const input=$("#mealDescription"),clean=String(name||"").trim();if(!input||!clean)return;const current=input.value.trim();if(!current)input.value=clean;else if(!current.toLocaleLowerCase("fr-CA").includes(clean.toLocaleLowerCase("fr-CA")))input.value=`${current.replace(/[\s,;]+$/,"")}, ${clean}`;input.dispatchEvent(new Event("input",{bubbles:true}))}
function showBarcodeProduct(product,code,found=true){barcodeLastCode=code;barcodeLastProduct=product;const result=$("#barcodeResult"),name=$("#barcodeProductName"),brand=$("#barcodeBrand"),image=$("#barcodeProductImage"),badge=$("#barcodeResultBadge"),help=$("#barcodeResultHelp"),preview=$("#barcodeNutritionPreview");result.hidden=false;name.value=product.name||"";brand.textContent=product.brand||"";badge.textContent=found?"Produit reconnu":"Produit inconnu";help.textContent=found?"Tu peux simplifier ou modifier le nom avant de l’ajouter.":"Écris simplement le nom que tu veux ajouter au repas.";if(product.image){image.src=product.image;image.hidden=false}else{image.hidden=true;image.removeAttribute("src")}if(db.settings.macroTracking&&product.nutrition){preview.hidden=false;preview.innerHTML=`<strong>≈ ${esc(nutritionText(product.nutrition))}</strong><small>${esc(product.nutrition.basis||"portion indiquée")} · modifiable après l’ajout</small>`}else preview.hidden=true;setTimeout(()=>name.focus(),80)}
async function lookupBarcode(code){code=cleanBarcode(code);if(code.length<6){alert("Entre un numéro de code-barres valide.");return}barcodeBusy=true;setBarcodeStatus("Recherche du produit…");const cached=barcodeCache()[code];if(cached?.name){showBarcodeProduct(cached,code,true);setBarcodeStatus("Produit trouvé dans tes scans récents.");barcodeBusy=false;stopBarcodeCamera();return}try{const url=`https://world.openfoodfacts.org/api/v2/product/${encodeURIComponent(code)}.json?fields=code,product_name,product_name_fr,product_name_en,brands,image_front_small_url,image_front_url,serving_size,nutriments`;const response=await fetch(url,{headers:{Accept:"application/json"}});if(!response.ok)throw new Error(`HTTP ${response.status}`);const data=await response.json(),p=data?.product;if(data?.status===1&&p){const perServing=p.nutriments||{},hasServing=[perServing["energy-kcal_serving"],perServing.proteins_serving,perServing.carbohydrates_serving,perServing.fat_serving].some(v=>Number.isFinite(Number(v))),suffix=hasServing?"_serving":"_100g";const product={name:(p.product_name_fr||p.product_name||p.product_name_en||"").trim(),brand:(p.brands||"").split(",")[0].trim(),image:p.image_front_small_url||p.image_front_url||"",nutrition:normalNutrition({calories:perServing[`energy-kcal${suffix}`],protein:perServing[`proteins${suffix}`],carbs:perServing[`carbohydrates${suffix}`],fat:perServing[`fat${suffix}`],source:"barcode",confidence:hasServing?"high":"medium",basis:hasServing?(p.serving_size?`portion ${p.serving_size}`:"portion indiquée"):"pour 100 g",estimated:!hasServing})};if(product.name){saveBarcodeCache(code,product);showBarcodeProduct(product,code,true);setBarcodeStatus("Produit reconnu.")}else{showBarcodeProduct({},code,false);setBarcodeStatus("Le produit existe, mais son nom est manquant.")}}else{showBarcodeProduct({},code,false);setBarcodeStatus("Produit non trouvé. Tu peux entrer son nom.")}stopBarcodeCamera()}catch(e){console.warn("Open Food Facts",e);showBarcodeProduct({},code,false);setBarcodeStatus("Recherche impossible pour le moment. Entre le nom manuellement.");stopBarcodeCamera()}finally{barcodeBusy=false}}
async function startBarcodeCamera(){stopBarcodeCamera();resetBarcodeResult();$("#retryBarcodeCamera").hidden=true;setBarcodeStatus("Autorise la caméra, puis vise le code-barres.");if(!navigator.mediaDevices?.getUserMedia){setBarcodeStatus("La caméra n’est pas disponible ici. Entre le numéro manuellement.");$("#retryBarcodeCamera").hidden=false;return}try{const ZXing=await import("https://cdn.jsdelivr.net/npm/@zxing/browser@0.2.1/+esm");barcodeReader=new ZXing.BrowserMultiFormatReader();barcodeControls=await barcodeReader.decodeFromConstraints({video:{facingMode:{ideal:"environment"},width:{ideal:1280},height:{ideal:720}}},$("#barcodeVideo"),(result,error,controls)=>{if(result&&!barcodeBusy){const code=cleanBarcode(result.getText?.()||result.text);if(code){barcodeControls=controls;lookupBarcode(code)}}});setBarcodeStatus("Place le code-barres au centre du cadre.")}catch(e){console.warn("scanner",e);setBarcodeStatus("Impossible d’ouvrir le scanner. Entre le numéro sous le code-barres.");$("#retryBarcodeCamera").hidden=false;stopBarcodeCamera()}}
function openBarcodeScanner(){resetBarcodeResult();$("#barcodeManualCode").value="";$("#barcodeDialog").showModal();startBarcodeCamera()}
function closeBarcodeScanner(){stopBarcodeCamera();$("#barcodeDialog")?.close()}

function makeRatings(containerId,value){const c=$(containerId),labels=['Très faible','Faible','Moyenne','Bonne','Excellente'],safe=clamp(value||3,1,5);c.innerHTML=`<div class="energy-slider-emojis"><span>😴</span><span>😄</span></div><input class="energy-range" type="range" min="1" max="5" step="1" value="${safe}" aria-label="Énergie avant le repas"><div class="energy-slider-value"><strong>${safe} / 5</strong><span>${labels[safe-1]}</span></div>`;c.dataset.value=safe;const input=c.querySelector('.energy-range'),valueEl=c.querySelector('.energy-slider-value strong'),labelEl=c.querySelector('.energy-slider-value span');const update=()=>{const v=Number(input.value);c.dataset.value=v;valueEl.textContent=`${v} / 5`;labelEl.textContent=labels[v-1];input.style.setProperty('--energy-progress',`${(v-1)/4*100}%`)};input.addEventListener('input',update);update()}
function populateFavoriteSelect(type){const s=$("#favoriteMealSelect");if(!s)return;const favorites=[...db.favorites].filter(f=>!type||f.type===type).sort((a,b)=>b.usageCount-a.usageCount);s.innerHTML=`<option value="">Choisir un favori…</option>${favorites.map(f=>`<option value="${f.id}">${esc(f.name)}</option>`).join('')}`;s.closest('label').hidden=!favorites.length}
function normalizedMealDescription(value){return String(value||'').trim().replace(/\s+/g,' ').replace(/\s*([,;])\s*/g,'$1 ').replace(/[.,;]+$/,'').trim()}
function recentMealDescriptions(type,limit=8){const now=Date.now(),groups=new Map();allMeals().filter(m=>m.type===type).forEach(m=>{const name=normalizedMealDescription(m.description),key=name.toLocaleLowerCase('fr-CA');if(!name)return;const stamp=new Date(m.updatedAt||m.createdAt||`${m.date}T${m.time||'12:00'}`).getTime()||0,ageDays=Math.max(0,(now-stamp)/86400000),recency=1/(1+ageDays/30);const item=groups.get(key)||{name,count:0,last:0,score:0};item.count++;item.last=Math.max(item.last,stamp);item.score+=1+recency;groups.set(key,item)});return [...groups.values()].sort((a,b)=>b.score-a.score||b.last-a.last||a.name.localeCompare(b.name,'fr-CA')).slice(0,limit).map(x=>x.name)}
function recentMealsHeading(type){return ({'Déjeuner':'Derniers déjeuners','Dîner':'Derniers dîners','Souper':'Derniers soupers','Collation':'Dernières collations','Boisson':'Dernières boissons'})[type]||'Derniers repas'}
function populateRecentFoods(type){const items=recentMealDescriptions(type),section=$("#recentFoodsSection"),list=$("#recentFoodsList"),heading=$("#recentFoodsHeading");if(!section||!list)return;if(heading)heading.textContent=recentMealsHeading(type);section.hidden=!items.length;list.innerHTML=items.map((name,i)=>`<button type="button" class="recent-food-button" data-recent-food="${i}" title="${esc(name)}">${esc(name)}</button>`).join('');$$('[data-recent-food]').forEach(button=>button.onclick=()=>{const name=items[Number(button.dataset.recentFood)]||'';const field=$("#mealDescription"),current=field.value.trim();field.value=current?`${current}, ${name}`:name;field.focus();field.setSelectionRange(field.value.length,field.value.length)})}
function updateMealDialogType(type){const value=type||'Déjeuner';$("#mealType").value=value;$("#mealDialogTypeIcon").textContent=mealIcon(value);$("#mealDialogTypeLabel").textContent=t(value);$("#copyYesterdayBreakfast").hidden=value!=="Déjeuner";$("#copyYesterdayDinner").hidden=value!=="Dîner";populateFavoriteSelect(value);$("#favoriteMealSelect").value='';populateRecentFoods(value)}function openMeal(id=null,presetType=null){const d=ensureDay(db,selectedDate),m=id?d.meals.find(x=>x.id===id):null,type=m?.type||presetType||'Déjeuner';$("#mealDialogTitle").textContent=m?'Modifier le repas':'Ajouter un repas';$("#mealId").value=m?.id||'';const deleteButton=$("#deleteCurrentMeal");deleteButton.hidden=!m;deleteButton.onclick=m?()=>{if(confirm(`Supprimer « ${m.description} »?`)){deleteMealLocal(m);$("#mealDialog").close();render()}}:null;updateMealDialogType(type);$("#mealTime").value=m?.time||new Date().toTimeString().slice(0,5);$("#mealDescription").value=m?.description||'';$("#mealNotes").value=m?.notes||'';$("#mealNutritionSection").hidden=!db.settings.macroTracking;fillNutritionInputs(m?.nutrition||null);makeRatings('#fatigueBeforePicker',m?.fatigueBefore||3);photoData=m?.photoLocal||m?.photoUrl||null;photoRemoved=false;showPhotoPreview();$("#mealDialog").showModal()}
function showPhotoPreview(){const wrap=$("#photoPreviewWrap");wrap.hidden=!photoData;if(photoData)$("#photoPreview").src=photoData}
function renderDayActivities(){const d=ensureDay(db,selectedDate),list=$("#dayActivitiesList");if(!list)return;list.innerHTML=(d.activities||[]).length?(d.activities||[]).map(a=>`<div class="saved-activity"><span>${activityIcon(a.type)}</span><div><strong>${esc(a.type)}</strong><small>${Number(a.minutes)||0} min</small></div><button type="button" data-delete-activity="${esc(a.id)}" aria-label="Supprimer ${esc(a.type)}">×</button></div>`).join(''):'<p class="muted small">Aucune activité enregistrée pour cette journée.</p>';$$('[data-delete-activity]').forEach(b=>b.onclick=()=>{d.activities=d.activities.filter(a=>a.id!==b.dataset.deleteActivity);setDayChanged(selectedDate);renderDayActivities()})}
function openSleep(){const d=ensureDay(db,selectedDate);$('#sleepHours').value=d.sleepHours??'';$('#sleepDialog').showModal()}
function openActivity(){const d=ensureDay(db,selectedDate);$('#activityType').value='';$('#activityMinutes').value='';$$('[data-activity]').forEach(b=>b.classList.remove('active'));renderDayActivities();$('#activityDialog').showModal()}
async function fileToDataUrl(file){if(!file)return null;const img=await createImageBitmap(file),max=1280,scale=Math.min(1,max/Math.max(img.width,img.height)),canvas=document.createElement('canvas');canvas.width=Math.round(img.width*scale);canvas.height=Math.round(img.height*scale);canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);return canvas.toDataURL('image/jpeg',.78)}
function createFavoriteFromMeal(m){const existing=db.favorites.find(f=>f.description.trim().toLowerCase()===m.description.trim().toLowerCase());if(existing){alert('Ce repas est déjà dans tes favoris.');return}const name=prompt('Nom du repas favori :',m.description.slice(0,45));if(!name)return;const f=normalFavorite({name:name.trim(),type:m.type,description:m.description,notes:m.notes});db.favorites.push(f);setFavoriteChanged(f);alert('Repas ajouté aux favoris ⭐');render()}
function useFavorite(id){const f=db.favorites.find(x=>x.id===id);if(!f)return;openMeal(null,f.type);$("#mealType").value=f.type;$("#mealDescription").value=f.description;$("#mealNotes").value=f.notes||'';f.usageCount=(f.usageCount||0)+1;f.updatedAt=new Date().toISOString();setFavoriteChanged(f)}


$("#openBarcodeScanner").onclick=openBarcodeScanner;
$("#closeBarcodeScanner").onclick=closeBarcodeScanner;
$("#retryBarcodeCamera").onclick=startBarcodeCamera;
$("#lookupBarcodeManual").onclick=()=>lookupBarcode($("#barcodeManualCode").value);
$("#barcodeManualCode").addEventListener("keydown",e=>{if(e.key==="Enter"){e.preventDefault();lookupBarcode(e.currentTarget.value)}});
$("#addBarcodeProduct").onclick=()=>{const name=$("#barcodeProductName").value.trim();if(!name){$("#barcodeProductName").focus();return}appendScannedFood(name);if(db.settings.macroTracking&&barcodeLastProduct?.nutrition)fillNutritionInputs(mergeNutrition(nutritionFromInputs(),barcodeLastProduct.nutrition));if(barcodeLastCode)saveBarcodeCache(barcodeLastCode,{name,brand:$("#barcodeBrand").textContent.trim(),image:$("#barcodeProductImage").hidden?"":$("#barcodeProductImage").src,nutrition:barcodeLastProduct?.nutrition||null});closeBarcodeScanner();$("#mealDescription").focus()};
$("#barcodeDialog").addEventListener("close",stopBarcodeCamera);

$("#mealPhoto").onchange=async e=>{photoData=await fileToDataUrl(e.target.files[0]);photoRemoved=false;showPhotoPreview()};$("#removePhoto").onclick=()=>{photoData=null;photoRemoved=true;showPhotoPreview()};
$("#favoriteMealSelect").onchange=e=>{const f=db.favorites.find(x=>x.id===e.target.value);if(!f)return;$("#mealDescription").value=f.description;$("#mealNotes").value=f.notes||'';f.usageCount=(f.usageCount||0)+1;f.updatedAt=new Date().toISOString();setFavoriteChanged(f)};
$("#estimateMealNutrition").onclick=estimateCurrentMealNutrition;$("#clearMealNutrition").onclick=()=>fillNutritionInputs(null,"Valeurs effacées. Tu peux les entrer manuellement ou relancer l’estimation.");
$("#mealForm").onsubmit=e=>{e.preventDefault();const d=ensureDay(db,selectedDate),id=$("#mealId").value,old=d.meals.find(x=>x.id===id);const meal=normalMeal({...old,id:id||uid(),date:selectedDate,type:$("#mealType").value,time:$("#mealTime").value,description:$("#mealDescription").value.trim(),nutrition:db.settings.macroTracking?(nutritionFromInputs()||estimateNutritionFromText($("#mealDescription").value.trim())):(old?.nutrition||null),fatigueBefore:Number($("#fatigueBeforePicker").dataset.value),fatigueAfter:old?.fatigueAfter||0,notes:$("#mealNotes").value.trim(),photoLocal:photoData&&photoData.startsWith('data:')?photoData:(old?.photoLocal||null),photoUrl:photoRemoved?null:(old?.photoUrl||null),photoPath:photoRemoved?null:(old?.photoPath||null),updatedAt:new Date().toISOString()},selectedDate);if(old)Object.assign(old,meal);else d.meals.push(meal);setMealChanged(meal);$("#mealDialog").close();render();const recommendation=chooseMealRecommendation(selectedDate,meal);if(recommendation)setTimeout(()=>showMealRecommendation(recommendation),280)};
$('#feelingForm').onsubmit=e=>{e.preventDefault();const m=allMeals().find(x=>x.id===feelingMealId);if(!m)return;const tags=$$('[data-feeling-tag].active').map(x=>x.dataset.feelingTag);if(!tags.length&&!confirm('Aucun symptôme ou état sélectionné. Enregistrer seulement la note globale?'))return;m.feeling={rating:Number($('#feelingRating').dataset.value)||3,tags,notes:$('#feelingNotes').value.trim(),recordedAt:new Date().toISOString()};m.updatedAt=new Date().toISOString();m.feelingNotifiedAt=m.feelingNotifiedAt||new Date().toISOString();setMealChanged(m);$('#feelingDialog').close();render()};
$('#sleepForm').onsubmit=e=>{e.preventDefault();const d=ensureDay(db,selectedDate),hours=parseAppNumber($('#sleepHours').value);if(hours!==null&&(hours<0||hours>24))return alert('Entre une durée de sommeil entre 0 et 24 heures.');d.sleepHours=hours;setDayChanged(selectedDate);$('#sleepDialog').close();render()};
$('#activityForm').onsubmit=e=>{e.preventDefault();const d=ensureDay(db,selectedDate),type=$('#activityType').value,min=parseAppNumber($('#activityMinutes').value)||0;if(!type)return alert('Choisis un type d’activité.');if(min<1||min>1440)return alert('Indique une durée valide en minutes.');d.activities.push({id:uid(),type,minutes:min,at:new Date().toISOString()});setDayChanged(selectedDate);$('#activityDialog').close();render()};
$$('[data-activity]').forEach(b=>b.onclick=()=>{$('#activityType').value=b.dataset.activity;$$('[data-activity]').forEach(x=>x.classList.toggle('active',x===b))});
function previousDayMeal(type){const dt=new Date(`${selectedDate}T12:00:00`);dt.setDate(dt.getDate()-1);const key=dt.toLocaleDateString('en-CA');return ensureDay(db,key).meals.filter(x=>x.type===type).sort((a,b)=>a.time.localeCompare(b.time))[0]||null}
$("#copyYesterdayBreakfast").onclick=()=>{const m=previousDayMeal('Déjeuner');if(!m)return alert("Aucun déjeuner trouvé hier.");$("#mealDescription").value=m.description;$("#mealNotes").value=m.notes||'';makeRatings('#fatigueBeforePicker',m.fatigueBefore||3);$("#mealDescription").focus()};
$("#copyYesterdayDinner").onclick=()=>{const m=previousDayMeal('Souper');if(!m)return alert("Aucun souper trouvé hier.");$("#mealDescription").value=m.description;$("#mealNotes").value=m.notes||'';makeRatings('#fatigueBeforePicker',m.fatigueBefore||3);$("#mealDescription").focus()};
$("#welcomeForm").onsubmit=e=>{e.preventDefault();$("#welcomeDialog").close()};$("#experienceStartDemo").onclick=startDemoMode;$("#experienceStartEmpty").onclick=startEmptyExperience;$("#nextDemoTour").onclick=()=>{demoTourIndex++;showDemoTourStep()};$("#previousDemoTour").onclick=()=>{if(demoTourIndex>0){demoTourIndex--;showDemoTourStep()}};$("#skipDemoTour").onclick=leaveDemoTourEarly;$("#closeDemoTour").onclick=leaveDemoTourEarly;$("#finishStartJournal").onclick=()=>{$("#demoFinalDialog")?.close();leaveDemoMode()};$("#finishExploreDemo").onclick=continueExploringDemo;$("#finishReplayTour").onclick=()=>{$("#demoFinalDialog")?.close();startDemoTour()};
$$('.close-dialog').forEach(b=>b.onclick=()=>b.closest('dialog').close());
function setAuthMode(mode){authMode=mode==="signup"?"signup":"login";const signup=authMode==="signup",confirmInput=$("#authPasswordConfirm");$("#loginTab").classList.toggle("active",!signup);$("#signupTab").classList.toggle("active",signup);$("#authTitle").textContent=signup?"Créer un compte":"Connexion";$("#authSubmit").textContent=signup?"Créer mon compte":"Me connecter";$("#confirmPasswordLabel").hidden=!signup;confirmInput.required=signup;if(!signup)confirmInput.value="";$("#authPassword").autocomplete=signup?"new-password":"current-password";$("#forgotPassword").hidden=signup;$("#authMessage").textContent=signup?"Après l’inscription, confirme le courriel de Supabase.":"La connexion se fait directement dans l’application."}
function friendlyAuthError(error){const text=(error?.message||"").toLowerCase();if(text.includes("invalid login credentials"))return"Courriel ou mot de passe incorrect.";if(text.includes("email not confirmed"))return"Confirme d’abord ton adresse courriel.";if(text.includes("user already registered"))return"Ce courriel possède déjà un compte.";if(text.includes("rate limit"))return"Trop de tentatives rapprochées. Attends un peu puis réessaie.";return error?.message||"Une erreur est survenue."}
$("#loginTab").onclick=()=>setAuthMode("login");$("#signupTab").onclick=()=>setAuthMode("signup");
$("#authForm").onsubmit=async e=>{e.preventDefault();if(!client)return;const email=$("#authEmail").value.trim().toLowerCase(),password=$("#authPassword").value,confirm=$("#authPasswordConfirm").value,msg=$("#authMessage");msg.textContent=authMode==="signup"?"Création du compte…":"Connexion…";if(password.length<8){msg.textContent="Le mot de passe doit contenir au moins 8 caractères.";return}if(authMode==="signup"&&password!==confirm){msg.textContent="Les deux mots de passe ne sont pas identiques.";return}if(authMode==="signup"){const {data,error}=await client.auth.signUp({email,password,options:{emailRedirectTo:`${location.origin}${location.pathname}`}});if(error){msg.textContent=friendlyAuthError(error);return}if(data.session){session=data.session;$("#authDialog").close();await seedCloudFromLocal();render()}else{msg.textContent="Compte créé. Confirme le courriel, puis connecte-toi.";setAuthMode("login")}}else{const {data,error}=await client.auth.signInWithPassword({email,password});if(error){msg.textContent=friendlyAuthError(error);return}session=data.session;$("#authDialog").close();await pullCloud(false);await syncNow();render()}};
$("#forgotPassword").onclick=async()=>{const email=$("#authEmail").value.trim().toLowerCase(),msg=$("#authMessage");if(!email){msg.textContent="Entre d’abord ton adresse courriel.";return}const {error}=await client.auth.resetPasswordForEmail(email,{redirectTo:`${location.origin}${location.pathname}`});msg.textContent=error?friendlyAuthError(error):"Courriel de récupération envoyé."};
$("#passwordForm").onsubmit=async e=>{e.preventDefault();const p=$("#newPassword").value,c=$("#newPasswordConfirm").value,msg=$("#passwordMessage");if(p.length<8||p!==c){msg.textContent=p!==c?"Les mots de passe ne sont pas identiques.":"Minimum 8 caractères.";return}const {error}=await client.auth.updateUser({password:p});msg.textContent=error?friendlyAuthError(error):"Mot de passe enregistré.";if(!error)setTimeout(()=>$("#passwordDialog").close(),600)};
function exportData(){const blob=new Blob([JSON.stringify(db,null,2)],{type:'application/json'}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=`energie-repas-${todayKey()}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000)}
$("#importFile").onchange=async e=>{const f=e.target.files[0];if(!f)return;try{db=migrate(JSON.parse(await f.text()));saveLocal('import');if(session&&confirm('Importer aussi cette copie dans Supabase?'))await seedCloudFromLocal();render()}catch(_){alert('Ce fichier JSON ne peut pas être importé.')}};
$("#themeToggle").onclick=()=>{db.settings.theme=db.settings.theme==='dark'?'system':'dark';saveLocal('theme');render()};$$('.nav-item').forEach(b=>b.onclick=()=>{const was=currentView;currentView=b.dataset.view;if(currentView==='today'&&was!=='today')selectedDate=todayKey();render()});
window.addEventListener('online',()=>{updateSyncBadge();if(session)syncNow()});window.addEventListener('offline',updateSyncBadge);
function dismissSplash(){const splash=$('#splashScreen');if(!splash)return;setTimeout(()=>{splash.classList.add('is-hidden');setTimeout(()=>splash.remove(),420)},760)}
let dialogScrollY=0;function syncDialogScrollLock(){const open=!!document.querySelector('dialog[open]');if(open&&!document.body.classList.contains('dialog-open')){dialogScrollY=window.scrollY;document.body.style.top=`-${dialogScrollY}px`;document.body.classList.add('dialog-open')}else if(!open&&document.body.classList.contains('dialog-open')){document.body.classList.remove('dialog-open');document.body.style.top='';window.scrollTo(0,dialogScrollY)}}new MutationObserver(syncDialogScrollLock).observe(document.body,{subtree:true,attributes:true,attributeFilter:['open']});
async function initAuth(){if(!client){render();setTimeout(showExperienceLaunchIfNeeded,120);return}const {data}=await client.auth.getSession();session=data.session;client.auth.onAuthStateChange((event,newSession)=>{session=newSession;updateSyncBadge();if(event==="PASSWORD_RECOVERY")setTimeout(()=>$("#passwordDialog").showModal(),0);if(event==="SIGNED_OUT")render()});if(session){await pullCloud(false);await syncNow()}render();setTimeout(showExperienceLaunchIfNeeded,120)}
if('serviceWorker'in navigator)window.addEventListener('load',async()=>{try{const reg=await navigator.serviceWorker.register('./sw.js?v=3.0.1');await reg.update();let refreshing=false;navigator.serviceWorker.addEventListener('controllerchange',()=>{if(refreshing)return;refreshing=true;location.reload()});if(reg.waiting)reg.waiting.postMessage?.({type:'SKIP_WAITING'})}catch(e){console.warn(e)}});
dismissSplash();
initAuth();
scheduleFeelingChecks();

setInterval(()=>updateLivingHeader(),30*60*1000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)updateLivingHeader()});
})();function parseAppNumber(value){const normalized=String(value??'').trim().replace(',', '.');if(normalized==='')return null;const number=Number(normalized);return Number.isFinite(number)?number:null}

