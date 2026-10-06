/* Énergie — routage Ciqual 2025 / FCÉN 2026.
 * N'altère pas le catalogue canadien ; conserve les identifiants Ciqual préfixés
 * dans les repas guidés pour que les aliments déjà enregistrés restent stables.
 */
(function(root){
  'use strict';
  const cnf = root.ENERGIE_CNF_SEARCH;
  const records = Array.isArray(root.ENERGIE_CIQUAL_CATALOG) ? root.ENERGIE_CIQUAL_CATALOG : [];
  if (!cnf || !records.length) { console.warn('Ciqual indisponible : recherche FCÉN inchangée.'); return; }
  const PREFIX='CIQUAL:';
  const byId=new Map(records.map(row=>[PREFIX+row[0],row]));
  const normalize=v=>String(v||'').toLocaleLowerCase('fr-FR').replace(/œ/g,'oe').replace(/æ/g,'ae').normalize('NFD').replace(/[\u0300-\u036f]/g,'').replace(/[’']/g,' ').replace(/[^a-z0-9]+/g,' ').replace(/\s+/g,' ').trim();
  const words=v=>normalize(v).split(' ').filter(t=>t.length>1&&!['de','des','du','la','le','les','au','aux','un','une','sans','avec'].includes(t));
  const state=v=>/\b(cru|crue|raw)\b/.test(normalize(v))?'raw':/\b(cuit|cuite|cuisson|bouilli|bouillie|etouffee|roti|rotie|grille|frit|frite)\b/.test(normalize(v))?'cooked':null;
  const strip=text=>cnf.stripQuantity?cnf.stripQuantity(text):normalize(text);
  function score(row,text,options={}){
    const query=strip(text), name=normalize(row[1]);
    if(!query||query.length<3||!Number.isFinite(row[2])||!cnf.isCandidateAllowed(text,row[1],options))return -Infinity;
    const singular=v=>v.length>3&&v.endsWith('s')?v.slice(0,-1):v;
    const qt=words(query).map(singular),nt=words(name).map(singular),base=normalize(row[1].split(',')[0]);
    if(!qt.length||!qt.every(t=>nt.includes(t)))return -Infinity;
    const wanted=state(query),candidate=state(name);
    if(wanted && candidate && wanted!==candidate)return -Infinity;
    let n=qt.length===nt.length?960:700;
    if(query===name)n+=600;
    if(query===base)n+=420;
    if(name.startsWith(query+' '))n+=140;
    if(wanted && wanted===candidate)n+=220;
    if(!wanted && candidate==='raw')n+=35;
    if(!wanted && candidate==='cooked')n+=5;
    if(/\b(aliment moyen)\b/.test(name))n-=85;
    // Ne pas sélectionner par défaut une préparation non explicitement demandée.
    if(!wanted&&/\b(sauce|sucre|sucree|conserve|preemballe|marinade|friture|vinaigrette)\b/.test(name) && !/\b(sauce|sucre|conserve|vinaigrette|friture)\b/.test(query))n-=250;
    n-=Math.max(0,nt.length-qt.length)*17;
    return n;
  }
  function rank(text,limit=12,allowPreparationChoice=false){
    const out=[];
    for(const row of records){const s=score(row,text,{allowPreparationChoice});if(s>=600)out.push({row,s});}
    out.sort((a,b)=>b.s-a.s||String(a.row[0]).localeCompare(String(b.row[0])));
    return out.slice(0,limit).map(({row})=>row);
  }
  function publicRow(row){return row?{id:PREFIX+row[0],nameFr:row[1],nameEn:'',portions:[],source:'ciqual',sourceVersion:'2025'}:null;}
  function nutritionForGrams(id,grams){
    const row=byId.get(String(id)), g=Number(grams);
    if(!row||!Number.isFinite(g)||g<=0)return null;
    const out={};
    ['calories','protein','carbs','fat','fiber','sugars','sodium'].forEach((k,j)=>{
      const v=row[j+2];out[k]=typeof v==='number'&&Number.isFinite(v)?Math.round(v*g/100*1000)/1000:null;
    });
    return {...out,source:'ciqual',nutritionSource:'ciqual',confidence:'high',estimated:true,
      basis:`${g} g · ${row[1]} · Ciqual 2025`,ciqualFoodId:row[0],ciqualNameFr:row[1],
      cnfFoodId:PREFIX+row[0],cnfNameFr:row[1],sourceVersion:'2025'};
  }
  function find(text){
    if(cnf.requiresClarification(text)||cnf.naturalCount(text)!=null)return null;
    const candidates=rank(text,2),row=candidates[0];if(!row)return null;
    const second=candidates[1];
    if(second && score(row,text)-score(second,text)<45 &&
       Math.abs(row[2]-second[2])>Math.max(10,row[2]*0.2))return null;
    // Une référence par 100 g n'est PAS une portion visuellement inférée.
    // Une quantité explicitement précisée en grammes peut toutefois être appliquée.
    const explicit=String(text).match(/\b(\d+(?:[.,]\d+)?)\s*(kg|g|grammes?)\b/i);
    const g=explicit?(Number(explicit[1].replace(',','.'))*(explicit[2].toLowerCase()==='kg'?1000:1)):100;
    const food=nutritionForGrams(PREFIX+row[0],g);
    return food?{...food,keys:[row[1]],portion:explicit?`${g} g`:'100 g (référence)',gramsPerPortion:g,tags:[],
      nutritionSource:'ciqual',nutritionSourceLabel:'Anses — Ciqual 2025',cnfCatalogMatch:true}:null;
  }
  const preferred=()=>root.ENERGIE_LOCALE==='fr-FR'?'ciqual':'cnf';
  const ciqual=Object.freeze({find,search:(text,limit=12)=>rank(text,Math.max(1,Math.min(30,Number(limit)||12)),true).map(publicRow),getById:id=>publicRow(byId.get(String(id))),nutritionForGrams});
  const router=Object.freeze({...cnf,version:3,
    find:text=>preferred()==='ciqual'?(ciqual.find(text)||cnf.find(text)):(cnf.find(text)||ciqual.find(text)),
    search:(text,limit)=>{const a=preferred()==='ciqual'?ciqual:cnf,b=preferred()==='ciqual'?cnf:ciqual;const result=a.search(text,limit);return result.length?result:b.search(text,limit);},
    getById:id=>String(id).startsWith(PREFIX)?ciqual.getById(id):cnf.getById(id),
    nutritionForGrams:(id,grams)=>String(id).startsWith(PREFIX)?ciqual.nutritionForGrams(id,grams):cnf.nutritionForGrams(id,grams)
  });
  root.ENERGIE_CIQUAL_SEARCH=ciqual;
  root.ENERGIE_CNF_SEARCH=router;
  // Textes UI uniquement ; les fonctions de recherche et de calcul restent inchangées.
  function updateGuidedLabels(){
    if(!root.document)return;
    const fr=preferred()==='ciqual';
    const set=(selector,value)=>{const node=document.querySelector(selector);if(node)node.textContent=value;};
    set('#openCnfGuidedEntry .meal-cnf-guided-icon',fr?'🇫🇷':'🇨🇦');
    set('#openCnfGuidedEntry strong',fr?'Saisie guidée Ciqual':'Saisie guidée FCÉN');
    set('#openCnfGuidedEntry small',fr?'Anses · France':'Santé Canada');
    set('#cnfGuidedMealDialog .dialog-header h2',fr?'🇫🇷 Saisie guidée avec Ciqual':'🇨🇦 Saisie guidée avec le FCÉN');
    set('#cnfGuidedMealDialog .cnf-guided-intro',fr
      ? 'Recherche un aliment dans Ciqual 2025 (Anses, France), choisis sa quantité, puis ajoute-le au repas. Si aucune correspondance suffisamment fiable n’est trouvée, le FCÉN de Santé Canada prend le relais.'
      : 'Recherche un aliment dans le FCÉN de Santé Canada, choisis sa quantité, puis ajoute-le au repas. Si aucune correspondance suffisamment fiable n’est trouvée, Ciqual 2025 (Anses, France) prend le relais.');
    set('#mealGuidedEntryRequirement','La saisie guidée nutritionnelle est obligatoire dans tes préférences.');
    set('#cnfGuidedMealDialog .cnf-guided-note',fr
      ? 'Valeurs calculées à partir des fiches choisies et des quantités saisies. Priorité : Ciqual 2025 (Anses) ; secours : FCÉN (Santé Canada). Les recettes et produits peuvent varier.'
      : 'Valeurs calculées à partir des fiches choisies et des quantités saisies. Priorité : FCÉN (Santé Canada) ; secours : Ciqual 2025 (Anses). Les recettes et produits peuvent varier.');
    set('#nutritionSourceInline',fr
      ? 'Références officielles : Ciqual 2025 (Anses, France) en priorité, puis FCÉN (Santé Canada) si la recherche française ne trouve pas de correspondance suffisamment fiable. Les quantités et préparations réelles peuvent varier.'
      : 'Références officielles : FCÉN (Santé Canada) en priorité, puis Ciqual 2025 (Anses, France) si la recherche canadienne ne trouve pas de correspondance suffisamment fiable. Les quantités et préparations réelles peuvent varier.');
  }
  root.ENERGIE_CIQUAL_REFRESH_LABELS=updateGuidedLabels;
  if(root.document){if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',updateGuidedLabels);else updateGuidedLabels();}
  if(typeof module!=='undefined'&&module.exports)module.exports={ciqual,router,score};
})(typeof window!=='undefined'?window:globalThis);
