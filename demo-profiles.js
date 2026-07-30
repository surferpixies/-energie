(() => {
  "use strict";
  const DAY = 86400000;
  const profiles = {
    marie: {
      id:"marie", name:"Marie", icon:"👩‍⚕️", age:34, scenario:"Produits laitiers",
      summary:"Horaires variables, repas rapides et maux de tête qui diminuent après une réduction graduelle des produits laitiers.",
      color:"dairy"
    },
    alex: {
      id:"alex", name:"Alex", icon:"🏃", age:27, scenario:"Équilibre stable",
      summary:"Actif, régulier et varié. Ce profil vérifie que le Cerveau sait reconnaître la stabilité sans inventer de problème.",
      color:"balanced"
    },
    sophie: {
      id:"sophie", name:"Sophie", icon:"🌱", age:42, scenario:"Fibres et digestion",
      summary:"Télétravail, peu de fibres au départ, puis amélioration progressive de l’alimentation, de l’hydratation et du confort digestif.",
      color:"fiber"
    }
  };
  const rand = seed => { const x=Math.sin(seed*12.9898+78.233)*43758.5453; return x-Math.floor(x); };
  const keyFor = offset => { const d=new Date(); d.setHours(12,0,0,0); d.setDate(d.getDate()+offset); return d.toLocaleDateString("en-CA"); };
  const meal = (profile,date,time,type,description,energy,tags=[],rating=3,notes="") => ({
    id:`demo-${profile}-${date}-${time.replace(":","")}-${type}`, date,time,type,description,
    fatigueBefore:energy,fatigueAfter:0,notes,
    feeling:{rating,tags,notes:"",recordedAt:`${date}T${time}:00`},
    createdAt:`${date}T${time}:00`,updatedAt:`${date}T${time}:00`
  });
  function commonDay(store,date,seed,sleep,water,activity){
    store.days[date]={date,sleepHours:sleep,sleepTags:sleep<6.5?["frequent-wakings"]:[],sleepComment:"",water,activities:activity?[
      {id:`demo-a-${date}`,type:activity.type,minutes:activity.minutes,intensity:"moderate",at:`${date}T17:30:00`}
    ]:[],meals:[],supplementsTaken:[],updatedAt:`${date}T21:00:00`};
    return store.days[date];
  }
  function buildMarie(store,offset,date,seed){
    const phase=Math.floor((offset+179)/30); const weekday=new Date(`${date}T12:00:00`).getDay();
    const shift=(seed%7===0||seed%11===0); const late=shift&&rand(seed)>.45;
    const dairyChance=[.78,.72,.60,.42,.25,.18][Math.min(5,phase)];
    const dairy=rand(seed+3)<dairyChance; const missed=rand(seed+9)<.075;
    const sleep=Number((late?5.7+rand(seed)*.7:6.6+rand(seed)*1.4).toFixed(1));
    const water=3+Math.floor(rand(seed+2)*5); const day=commonDay(store,date,seed,sleep,water,weekday===0?{type:"Marche",minutes:35}:null);
    if(missed)return;
    if(rand(seed+4)>.12) day.meals.push(meal("marie",date,late?"09:10":"06:35","Déjeuner",dairy?"Cappuccino et toast au beurre d’arachide":"Café noir, œufs et rôties",sleep>=7?4:2,sleep<6.5?["fatigue"]:["energy"],sleep>=7?4:2));
    const lunch=dairy?(rand(seed)>.5?"Sandwich au fromage, crudités et yogourt":"Pâtes crémeuses au poulet et légumes"):(rand(seed)>.5?"Bol de riz, poulet et légumes":"Soupe, sandwich à la dinde et fruit");
    const headache=dairy&&rand(seed+7)<([.42,.40,.34,.30,.24,.20][Math.min(5,phase)]);
    day.meals.push(meal("marie",date,"12:20","Dîner",lunch,dairy?2:(water>=6?4:3),headache?["headache"]:(water<5?["fatigue"]:["feeling_good"]),headache?2:4,headache?"Mal de tête apparu dans l’après-midi.":""));
    const friday=weekday===5; const dinner=friday?(dairy?"Pizza au fromage et salade":"Pizza sans fromage et salade"):(dairy?"Poulet, pommes de terre et sauce crémeuse":"Saumon, pommes de terre et légumes");
    day.meals.push(meal("marie",date,"19:05","Souper",dinner,dairy?2:4,dairy&&rand(seed+6)<.2?["bloating"]:["feeling_good"],dairy?3:4));
    if(rand(seed+8)<.32) day.meals.push(meal("marie",date,"15:40","Collation",dairy?"Latte et muffin":"Pomme et amandes",3,headache?["headache"]:["energy"],headache?2:4));
  }
  function buildAlex(store,offset,date,seed){
    const weekday=new Date(`${date}T12:00:00`).getDay(); const missed=rand(seed+8)<.045;
    const sleep=Number((7.2+rand(seed)*1.1-(weekday===6?-.3:0)).toFixed(1)); const water=7+Math.floor(rand(seed+2)*3);
    const active=[1,2,4,6].includes(weekday); const day=commonDay(store,date,seed,sleep,water,active?{type:weekday===6?"Vélo":"Course",minutes:weekday===6?65:38}:null);
    if(missed)return;
    day.meals.push(meal("alex",date,"07:20","Déjeuner",seed%3===0?"Overnight oats, bleuets, chia et yogourt grec":"Œufs, pain complet, avocat et fruit",4,["energy"],4));
    day.meals.push(meal("alex",date,"12:10","Dîner",seed%2===0?"Poulet, quinoa, brocoli et poivrons":"Bol de tofu, riz brun et légumes",4,["feeling_good"],4));
    day.meals.push(meal("alex",date,"18:30","Souper",weekday===5?"Burger maison, pommes de terre et salade":"Saumon ou lentilles, légumes et riz",active?4:3,active?["good_mood"]:["feeling_good"],4));
    if(active||rand(seed+5)<.4)day.meals.push(meal("alex",date,"15:30","Collation","Banane, noix et fromage cottage",4,["energy"],4));
  }
  function buildSophie(store,offset,date,seed){
    const phase=Math.floor((offset+179)/30); const weekday=new Date(`${date}T12:00:00`).getDay(); const missed=rand(seed+10)<.08;
    const sleep=Number((6.7+rand(seed)*1.2).toFixed(1)); const water=Math.min(9,3+phase+Math.floor(rand(seed+2)*3));
    const active=phase>=2&&[2,4,0].includes(weekday); const day=commonDay(store,date,seed,sleep,water,active?{type:"Marche",minutes:25+phase*4}:null);
    if(missed)return;
    const highFiber=rand(seed+4)<[.08,.18,.35,.55,.70,.78][Math.min(5,phase)];
    day.meals.push(meal("sophie",date,"08:05","Déjeuner",highFiber?"Gruau, pomme, graines de chia et cannelle":"Rôties blanches et café",highFiber?4:2,sleep<6.5?["fatigue"]:["feeling_good"],3));
    day.meals.push(meal("sophie",date,"12:35","Dîner",highFiber?"Salade de quinoa, pois chiches, concombre et feta":"Sandwich jambon-fromage et croustilles",highFiber?4:2,[],3));
    const digestive=!highFiber&&rand(seed+7)<.42 || (highFiber&&phase<2&&rand(seed+7)<.22);
    day.meals.push(meal("sophie",date,"18:40","Souper",highFiber?(seed%2?"Chili aux haricots, riz brun et légumes":"Lentilles, légumes rôtis et quinoa"):(seed%2?"Pâtes sauce rosée":"Repas préparé et pain"),highFiber?4:2,digestive?["bloating","stomachache"]:["easy_digestion"],digestive?2:4,digestive?"Inconfort digestif en soirée.":""));
    if(rand(seed+5)<.35)day.meals.push(meal("sophie",date,"15:20","Collation",highFiber?"Pomme et amandes":"Biscuits et café",3,digestive?["bloating"]:["energy"],digestive?2:4));
  }
  function create(profileId="marie"){
    const p=profiles[profileId]||profiles.marie;
    const store={version:24,createdAt:new Date(Date.now()-180*DAY).toISOString(),updatedAt:new Date().toISOString(),settings:{waterGoal:8,theme:"system",showWelcome:false,insightsEnabled:true,nutritionObservations:true,macroTracking:true,generalRecommendations:true,showSources:true,professionalSupport:false,feelingReminders:false,feelingDelayHours:2,feelingMealTypes:["Déjeuner","Dîner","Souper"],supplements:[],demoMode:true,demoTourSeen:true,demoName:p.name,demoProfileId:p.id,demoReadOnly:true},favorites:[],days:{}};
    const favs={
      marie:[["Déjeuner rapide","Déjeuner","Cappuccino et toast au beurre d’arachide"],["Dîner de quart","Dîner","Sandwich, crudités et fruit"],["Pizza du vendredi","Souper","Pizza et salade"]],
      alex:[["Overnight oats","Déjeuner","Overnight oats, bleuets, chia et yogourt grec"],["Bol protéiné","Dîner","Poulet, quinoa et légumes"],["Collation entraînement","Collation","Banane et noix"]],
      sophie:[["Gruau pomme-chia","Déjeuner","Gruau, pomme, chia et cannelle"],["Salade pois chiches","Dîner","Quinoa, pois chiches et légumes"],["Chili maison","Souper","Chili aux haricots et riz brun"]]
    }[p.id];
    store.favorites=favs.map((f,i)=>({id:`demo-${p.id}-fav-${i}`,name:f[0],type:f[1],description:f[2],usageCount:8+i*4,createdAt:store.createdAt,updatedAt:store.updatedAt}));
    for(let offset=-179;offset<=0;offset++){
      const date=keyFor(offset),seed=offset+700+(p.id==="alex"?1000:p.id==="sophie"?2000:0);
      ({marie:buildMarie,alex:buildAlex,sophie:buildSophie}[p.id])(store,offset,date,seed);
    }
    return store;
  }
  window.EnergieDemoProfiles=Object.freeze({profiles,create});
})();
