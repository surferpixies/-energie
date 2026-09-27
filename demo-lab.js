(() => {
  "use strict";

  // Énergie Demo Lab
  // Generates raw journal data only. It never injects Observation-engine results.
  // The real observation engine must discover (or reject) the hidden signal.
  const DAY = 86400000;
  const clamp = (n,min,max) => Math.max(min,Math.min(max,n));
  const hash = text => [...String(text)].reduce((h,c)=>((h<<5)-h+c.charCodeAt(0))|0,2166136261) >>> 0;
  const rng = seed => {
    let s=(seed>>>0)||1;
    return () => ((s=Math.imul(1664525,s)+1013904223>>>0)/4294967296);
  };
  const dateKey = (base,offset) => {
    const d=new Date(base); d.setHours(12,0,0,0); d.setDate(d.getDate()+offset);
    return d.toLocaleDateString("en-CA");
  };

  const foods = {
    dairy:["Yogourt grec, bleuets et granola","Pâtes au poulet, crème 15 %, parmesan et brocoli","Sandwich au cheddar, tomate et laitue","Fromage cottage, framboises et noix","Omelette au cheddar, rôties et fruit","Bol de yogourt grec, banane, noix et avoine","Poulet, pommes de terre, beurre et haricots verts","Pâtes aux légumes, crème 15 % et parmesan","Salade de quinoa, feta, concombre et tomates","Bagel, fromage à la crème et fruit","Gruau au lait, banane et cannelle","Lasagne au bœuf, mozzarella et légumes"],
    soy:["Bol de tofu, riz brun et brocoli","Edamames, quinoa et légumes","Soupe miso, tofu et nouilles","Smoothie au lait de soya, banane et avoine"],
    seafood:["Crevettes, riz et légumes","Moules, pommes de terre et salade","Pâtes aux crevettes et tomates","Bol de quinoa, crevettes et légumes"],
    fish:["Saumon, pommes de terre et haricots verts","Tilapia, riz et légumes","Truite, quinoa et salade"],
    gluten:["Rôties de blé entier, œufs et fruit","Pâtes au poulet et légumes","Sandwich à la dinde et crudités","Couscous, pois chiches et légumes"],
    legumes:["Chili aux haricots rouges et légumes","Lentilles, riz et légumes","Salade de pois chiches, tomates et concombre","Soupe aux lentilles et pain"],
    fruits:["Yogourt, fraises et bleuets","Pomme, amandes et fromage","Gruau, banane et framboises","Salade de fruits et yogourt"],
    vegetables:["Poulet, riz, brocoli et poivrons","Omelette aux légumes et rôties","Soupe de légumes et sandwich à la dinde"],
    allium:["Poulet sauté avec ail, oignon, riz et légumes","Pâtes tomate, ail, oignon et parmesan","Soupe aux poireaux, pain et salade"],
    caffeine:["Café filtre et déjeuner habituel","Latte et rôties au beurre d’arachide","Thé noir, yogourt et fruit"],
    processed:["Pizza, salade et boisson gazeuse","Repas surgelé et crudités","Burger, frites et salade"],
    high_fiber:["Gruau, chia, framboises et amandes","Lentilles, quinoa et légumes","Pois chiches, avocat et légumes"],
    fried:["Poulet frit, pommes de terre et salade","Poisson frit, riz et légumes","Frites, burger et crudités"],
    spicy:["Chili épicé aux haricots","Curry épicé au poulet et légumes","Tacos épicés, salsa et salade"],
    neutral:["Poulet, riz et légumes","Saumon, pommes de terre et salade","Soupe aux légumes, sandwich à la dinde et fruit","Quinoa, légumes et poulet","Bœuf sauté, riz et légumes","Salade de poulet, avocat, tomates et pain","Tilapia, couscous et haricots verts","Bol de riz, œuf, edamames et légumes","Dinde, patate douce et brocoli","Pâtes tomate, poulet et courgettes","Omelette aux légumes, pommes de terre et fruit","Soupe de lentilles, pain et salade"]
  };

  function categoriesFor(description){
    return window.ENERGIE_FOOD_CATEGORIES?.categoryIdsForText?.(description) || [];
  }
  function recognizedAs(description,target){
    return !target || categoriesFor(description).includes(target);
  }

  const commonMeals=[...new Set(Object.values(foods).flat())];
  function mealsWithCategory(target){ return commonMeals.filter(description=>recognizedAs(description,target)); }
  function mealsWithoutCategory(target){ return commonMeals.filter(description=>!recognizedAs(description,target)); }
  function pick(pool,random){ return pool[Math.floor(random()*pool.length)]; }

  const foodTargets=new Set(["dairy","soy","seafood","fish","gluten","legumes","fruits","vegetables","allium","processed","high_fiber","fried","spicy"]);
  function isFoodTarget(target){ return foodTargets.has(target); }
  function exposureChance(i,activeStart,activeEnd,random,before=.10,during=.60,after=.08){
    if(i<activeStart) return random()<before;
    if(i<=activeEnd) return random()<during;
    return random()<after;
  }

  function targetMeal(target,random){
    const pool=mealsWithCategory(target);
    if(!pool.length) throw new Error(`Laboratoire: aucun repas reconnu pour la catégorie ${target}.`);
    return pick(pool,random);
  }

  const scenarios = [
    {id:"dairy-digestion",group:"Alimentation",icon:"🥛",title:"Produits laitiers → inconfort digestif",target:"dairy",signal:"digestive",strength:.78,pattern:"exposure"},
    {id:"soy-digestion",group:"Alimentation",icon:"🌿",title:"Soya → inconfort digestif",target:"soy",signal:"digestive",strength:.76,pattern:"exposure"},
    {id:"seafood-digestion",group:"Alimentation",icon:"🦐",title:"Fruits de mer → inconfort digestif",target:"seafood",signal:"digestive",strength:.80,pattern:"withdrawal"},
    {id:"gluten-digestion",group:"Alimentation",icon:"🌾",title:"Aliments avec gluten → inconfort",target:"gluten",signal:"digestive",strength:.68,pattern:"exposure"},
    {id:"legumes-digestion",group:"Alimentation",icon:"🫘",title:"Légumineuses → ballonnements",target:"legumes",signal:"digestive",strength:.64,pattern:"dose"},
    {id:"allium-digestion",group:"Alimentation",icon:"🧄",title:"Ail/oignon/alliums → inconfort",target:"allium",signal:"digestive",strength:.74,pattern:"exposure"},
    {id:"fried-digestion",group:"Alimentation",icon:"🍟",title:"Aliments frits → lourdeur digestive",target:"fried",signal:"digestive",strength:.70,pattern:"exposure"},
    {id:"spicy-digestion",group:"Alimentation",icon:"🌶️",title:"Aliments épicés → inconfort",target:"spicy",signal:"digestive",strength:.70,pattern:"exposure"},
    {id:"processed-energy",group:"Alimentation",icon:"🍕",title:"Repas transformés → énergie plus basse",target:"processed",signal:"energy",strength:.65,pattern:"exposure"},
    {id:"fiber-improvement",group:"Évolution",icon:"🌾",title:"Fibres + hydratation → amélioration progressive",target:"high_fiber",signal:"positive",strength:.72,pattern:"ramp"},
    {id:"caffeine-sleep",group:"Sommeil",icon:"☕",title:"Caféine tardive → sommeil moins favorable",target:"caffeine",signal:"sleep",strength:.80,pattern:"timing"},
    {id:"short-sleep-fatigue",group:"Sommeil",icon:"😴",title:"Nuit courte → fatigue le lendemain",target:"sleep",signal:"energy",strength:.78,pattern:"sleep"},
    {id:"activity-positive",group:"Activité",icon:"🏃",title:"Journées actives → meilleur ressenti",target:"activity",signal:"positive",strength:.66,pattern:"activity"},
    {id:"hydration-positive",group:"Hydratation",icon:"💧",title:"Hydratation régulière → meilleur ressenti",target:"water",signal:"positive",strength:.64,pattern:"water"},
    {id:"weight-loss",group:"Poids",icon:"⚖️",title:"Période de perte de poids",target:"weight",signal:"weight_down",strength:.78,pattern:"weight_down"},
    {id:"weight-gain",group:"Poids",icon:"⚖️",title:"Période de prise de poids",target:"weight",signal:"weight_up",strength:.78,pattern:"weight_up"},
    {id:"withdrawal-rechallenge",group:"Évolution",icon:"🔄",title:"Retrait puis réintroduction",target:"dairy",signal:"digestive",strength:.82,pattern:"rechallenge"},
    {id:"dose-response",group:"Cas complexes",icon:"📈",title:"Effet de quantité",target:"legumes",signal:"digestive",strength:.72,pattern:"dose"},
    {id:"delayed-reaction",group:"Cas complexes",icon:"⏱️",title:"Réaction retardée 12–24 h",target:"soy",signal:"digestive",strength:.72,pattern:"delayed"},
    {id:"false-dairy-allium",group:"Tests pièges",icon:"🎭",title:"Faux coupable : fromage vs ail",target:"allium",decoy:"dairy",signal:"digestive",strength:.76,pattern:"confounder"},
    {id:"late-coffee-only",group:"Tests pièges",icon:"🕔",title:"Le café du matin est innocent",target:"caffeine",signal:"sleep",strength:.82,pattern:"timing"},
    {id:"random-no-signal",group:"Contrôles",icon:"🎲",title:"Aucune association réelle",target:"neutral",signal:"none",strength:0,pattern:"control"},
    {id:"too-few-exposures",group:"Contrôles",icon:"🔬",title:"Trop peu de données pour conclure",target:"seafood",signal:"digestive",strength:.80,pattern:"sparse"},
    {id:"coincidence-fades",group:"Contrôles",icon:"🫥",title:"Coïncidence temporaire qui disparaît",target:"dairy",signal:"digestive",strength:.75,pattern:"transient"},
    {id:"missing-data",group:"Robustesse",icon:"🧩",title:"Données manquantes et signal réel",target:"seafood",signal:"digestive",strength:.74,pattern:"missing"},
    {id:"chaotic-multifactor",group:"Cas complexes",icon:"🌪️",title:"Sommeil, repas et activité changent ensemble",target:"processed",signal:"energy",strength:.48,pattern:"chaotic"}
  ];

  function meal(id,date,time,type,description,tags=[],rating=4,notes=""){
    const scores=Object.fromEntries(tags.map(t=>[t,rating]));
    return {id,date,time,type,description,fatigueBefore:rating,fatigueAfter:0,feelingsBefore:{positive_wellbeing:3},notes,
      feeling:{rating,tags,scores,beforeScores:{positive_wellbeing:3},notes,recordedAt:`${date}T${time}:00`},
      createdAt:`${date}T${time}:00`,updatedAt:`${date}T${time}:00`};
  }

  function generate(scenarioId,options={}){
    const sc=scenarios.find(s=>s.id===scenarioId);
    if(!sc) throw new Error(`Scénario inconnu: ${scenarioId}`);
    const days=60;
    const variant=Number(options.variant)||1;
    const random=rng(hash(`${scenarioId}:${variant}`));
    const end=options.endDate?new Date(`${options.endDate}T12:00:00`):new Date();
    end.setHours(12,0,0,0);
    const start=new Date(end.getTime()-(days-1)*DAY);
    const activeStart=Math.floor(random()*5); // le phénomène commence naturellement dans les premiers jours (J1 à J5)
    const changeDay=10+Math.floor(random()*41); // amélioration/changement entre J10 et J50
    const activeEnd=Math.max(activeStart,changeDay-1);
    const activeDays=activeEnd-activeStart+1;
    const store={version:24,createdAt:start.toISOString(),updatedAt:new Date().toISOString(),
      settings:{waterGoal:8,theme:"system",showWelcome:false,insightsEnabled:true,nutritionObservations:true,macroTracking:true,
        generalRecommendations:true,showSources:true,professionalSupport:false,feelingReminders:false,supplements:[],
        demoMode:true,demoTourSeen:true,demoName:`Laboratoire — ${sc.title}`,demoProfileId:`lab-${sc.id}`,
        demoReadOnly:true,demoDataVersion:`lab-v1-${sc.id}-${variant}`,
        demoLab:{scenarioId:sc.id,variant,days,activeStart,activeEnd,activeDays}},
      favorites:[],days:{}};

    const weightScenario=sc.pattern==="weight_down"||sc.pattern==="weight_up";
    if(weightScenario){
      store.settings.trackWeight=true;
      store.settings.weightTracking=true;
      store.settings.weightUnit="kg";
      store.settings.profile={...(store.settings.profile||{}),weight:{mode:"provided",unit:"kg"}};
    }
    const baseWeight=82+(random()-.5)*5;
    const totalWeightChange=sc.pattern==="weight_down"?-(3.2+random()*1.8):sc.pattern==="weight_up"?(3.0+random()*1.8):0;

    let previousExposure=false;
    const rechallengeDay=Math.min(days-1,activeEnd+10+Math.floor(random()*9));
    for(let i=0;i<days;i++){
      const date=dateKey(start,i), progress=i/Math.max(1,days-1), inActiveWindow=i>=activeStart&&i<=activeEnd, activeProgress=inActiveWindow?((i-activeStart)/Math.max(1,activeDays-1)):0;
      const weekday=new Date(`${date}T12:00:00`).getDay();
      const beforeWindow=false, afterWindow=i>activeEnd;
      let exposure=exposureChance(i,activeStart,activeEnd,random,.08,.62,.08);
      if(afterWindow && i===rechallengeDay) exposure=true;
      if(sc.pattern==="withdrawal") exposure=exposureChance(i,activeStart,activeEnd,random,.08,.64,.04);
      if(sc.pattern==="rechallenge") exposure=exposureChance(i,activeStart,activeEnd,random,.08,.64,.04) || (afterWindow&&i===rechallengeDay);
      if(sc.pattern==="ramp") exposure=i<activeStart?random()<.12:inActiveWindow?random()<(0.18+activeProgress*.55):random()<.72;
      if(sc.pattern==="sparse") exposure=i===activeStart+2||i===Math.min(activeEnd,activeStart+7);
      if(sc.pattern==="transient") exposure=exposureChance(i,activeStart,activeEnd,random,.10,.50,.12);
      if(sc.pattern==="confounder") exposure=exposureChance(i,activeStart,activeEnd,random,.08,.56,.08);
      const missing=sc.pattern==="missing" && random()<.20;
      const chaotic=sc.pattern==="chaotic";
      const lateCoffee=(sc.pattern==="timing" && exposure && random()<(inActiveWindow?.72:.18));
      const activityChance=sc.pattern==="activity"?(i<activeStart?.25:inActiveWindow?.30:.68):(chaotic?.42:.36);
      const active=random()<activityChance;
      let water;
      if(sc.pattern==="water"){
        water=clamp(Math.round((i<activeStart?4:inActiveWindow?4.5:7.5)+random()*2),2,10);
      }else{
        water=clamp(Math.round((chaotic?3:5)+random()*4),2,10);
      }
      let sleep=6.6+random()*1.5;
      if(sc.pattern==="sleep"){
        const shortNightChance=i<activeStart?.22:inActiveWindow?.55:.12;
        if(random()<shortNightChance) sleep=5.1+random()*1.1;
      }
      if(lateCoffee && random()<sc.strength) sleep-=1.25+random()*.55;
      if(chaotic && exposure) sleep-=.6;
      sleep=Number(clamp(sleep,4.5,9).toFixed(1));
      const bedtimeMinutes=Math.round((22*60+15)+random()*120+(lateCoffee?55:0));
      const wakeMinutes=(bedtimeMinutes+Math.round(sleep*60))%(24*60);
      const fmt=m=>`${String(Math.floor((m%(24*60))/60)).padStart(2,"0")}:${String(m%60).padStart(2,"0")}`;
      const day={date,sleepHours:sleep,sleepStartTime:fmt(bedtimeMinutes),sleepEndTime:fmt(wakeMinutes),
        sleepTags:sleep<6.3?["frequent-wakings"]:[],sleepComment:"",water,
        activities:active?[{id:`lab-a-${date}`,type:weekday===6?"Vélo":"Marche",minutes:30+Math.floor(random()*35),intensity:"moderate",at:`${date}T17:30:00`}]:[],
        meals:[],observations:[],supplementsTaken:[],updatedAt:`${date}T21:00:00`};
      if(weightScenario && (i===0 || i===days-1 || i%7===0)){
        const trend=totalWeightChange*(i<activeStart?0:i>activeEnd?1:activeProgress);
        const noise=(random()-.5)*.55;
        day.weight=Number((baseWeight+trend+noise).toFixed(1));
        day.weightKg=day.weight;
      }

      if(!missing){
        const neutralBreakfasts=["Gruau, banane et noix","Omelette aux épinards, rôties et orange","Rôties au beurre d’arachide et banane","Œufs brouillés, pommes de terre et fruit","Bol d’avoine, pomme et noix","Pain doré, fraises et noix","Smoothie banane, avoine et beurre d’arachide","Bagel, œuf et avocat"];
        const dairyBreakfasts=["Yogourt grec, bleuets et avoine","Fromage cottage, framboises et granola"];
        const breakfastHasTarget=sc.target==="dairy" && (inActiveWindow?random()<.28:random()<.06);
        const recognizedDairyBreakfasts=dairyBreakfasts.filter(description=>recognizedAs(description,"dairy"));
        const breakfastPool=breakfastHasTarget?recognizedDairyBreakfasts:neutralBreakfasts;
        const breakfast=lateCoffee?`Café filtre, ${breakfastPool[Math.floor(random()*breakfastPool.length)]}`:breakfastPool[Math.floor(random()*breakfastPool.length)];
        const breakfastExposure=breakfastHasTarget && recognizedAs(breakfast,"dairy");
        const breakfastSymptom=breakfastExposure && sc.signal==="digestive" && random()<sc.strength;
        const breakfastTags=breakfastSymptom?["bloating",random()<.55?"gas":"cramps"]:["positive_wellbeing"];
        day.meals.push(meal(`lab-${date}-b`,date,"07:30","Déjeuner",breakfast,breakfastTags,breakfastSymptom?2:4,breakfastSymptom?"Inconfort digestif noté après le repas.":""));
        if(weightScenario){
          const down=sc.pattern==="weight_down";
          day.calories=Math.round((down?1850:2650)+(random()-.5)*260);
          if(down && random()<.58) day.activities.push({id:`lab-aw-${date}`,type:"Marche",minutes:25+Math.floor(random()*35),intensity:"moderate",at:`${date}T16:45:00`});
          if(!down && random()<.45) day.water=Math.max(3,day.water-1);
        }
        const nonTargetPool=isFoodTarget(sc.target)?mealsWithoutCategory(sc.target).filter(description=>!recognizedAs(description,"caffeine")):commonMeals.filter(description=>!recognizedAs(description,"caffeine"));
        let description=(exposure&&isFoodTarget(sc.target))?targetMeal(sc.target,random):pick(nonTargetPool.length?nonTargetPool:foods.neutral,random);
        if(sc.pattern==="confounder" && exposure) description=random()<.70?"Pâtes tomate, ail, oignon et parmesan":"Poulet sauté avec ail, oignon, riz et légumes";
        const isTransient=sc.pattern==="transient";
        let symptomProbability=exposure?sc.strength:(inActiveWindow?.07:.04);
        if(isTransient && progress>.25) symptomProbability=.10;
        if(sc.pattern==="control") symptomProbability=.10;
        if(sc.pattern==="confounder") symptomProbability=description.includes("ail")||description.includes("oignon")?.72:.06;
        else if(afterWindow && !["weight_down","weight_up"].includes(sc.pattern)) symptomProbability=.035;
        if(sc.pattern==="dose") symptomProbability=exposure?(random()<.5?.38:.82):.07;
        if(sc.pattern==="delayed") symptomProbability=.08;
        const symptom=random()<symptomProbability;
        const tags=sc.signal==="digestive"&&symptom?["bloating",random()<.55?"gas":"cramps"]:
          sc.signal==="energy"&&((exposure&&random()<sc.strength)||(sc.pattern==="sleep"&&sleep<6.3))?["fatigue"]:
          sc.signal==="positive"&&((exposure||inActiveWindow||water>=7)&&random()<sc.strength)?["energy","feeling_good"]:
          ["feeling_good"];
        const rating=tags.includes("bloating")?2:tags.includes("fatigue")?2:4;
        day.meals.push(meal(`lab-${date}-l`,date,"12:20","Dîner",description,tags,rating,tags.includes("bloating")?"Inconfort digestif noté après le repas.":""));
        const dinnerExposure=sc.target==="dairy" && (inActiveWindow?random()<.22:random()<.05);
        const dinnerNonTarget=isFoodTarget(sc.target)?mealsWithoutCategory(sc.target).filter(description=>!recognizedAs(description,"caffeine")):commonMeals.filter(description=>!recognizedAs(description,"caffeine"));
        const dinnerDescription=dinnerExposure?targetMeal("dairy",random):pick(dinnerNonTarget.length?dinnerNonTarget:foods.neutral,random);
        const dinnerSymptom=dinnerExposure&&sc.signal==="digestive"?random()<sc.strength:(sc.signal==="digestive"&&random()<.035);
        const dinnerTags=dinnerSymptom?["bloating",random()<.5?"gas":"cramps"]:["positive_wellbeing"];
        day.meals.push(meal(`lab-${date}-d`,date,"18:45","Souper",dinnerDescription,dinnerTags,dinnerSymptom?2:4,dinnerSymptom?"Inconfort digestif léger.":""));

        if(sc.pattern==="delayed" && previousExposure && random()<sc.strength){
          day.observations.push({id:`lab-ob-${date}`,date,time:"09:15",intensity:3,duration:"few_hours",tags:["bloating","cramps"],contexts:["food"],mealIds:[],notes:"Inconfort apparu ce matin, sans l’attribuer automatiquement au dernier repas.",createdAt:`${date}T09:15:00`,updatedAt:`${date}T09:15:00`});
        }
      }
      store.days[date]=day;
      previousExposure=exposure;
    }
    const labStats={target:sc.target,activeStart,activeEnd,activeDays,exposures:0,activeExposures:0,postExposures:0,negativeMeals:0};
    Object.values(store.days).forEach((day,idx)=>{
      (day.meals||[]).forEach(m=>{
        const hit=isFoodTarget(sc.target)&&recognizedAs(m.description,sc.target);
        if(hit){labStats.exposures++;if(idx>=activeStart&&idx<=activeEnd)labStats.activeExposures++;if(idx>activeEnd)labStats.postExposures++;}
        const tags=m.feeling?.tags||[];
        if(tags.some(t=>["bloating","gas","cramps","fatigue"].includes(t))) labStats.negativeMeals++;
      });
    });
    Object.defineProperty(store,"__labStats",{value:Object.freeze(labStats),enumerable:false,writable:false});
    Object.defineProperty(store,"__labTruth",{value:Object.freeze({target:sc.target,signal:sc.signal,pattern:sc.pattern,activeStart,activeEnd,activeDays}),enumerable:false,writable:false});
    return store;
  }

  function list(group=null){
    return scenarios.filter(s=>!group||s.group===group).map(s=>({...s}));
  }
  function groups(){ return [...new Set(scenarios.map(s=>s.group))]; }
  function randomScenario(options={}){
    const pool=list(options.group||null);
    if(!pool.length) throw new Error("Aucun scénario disponible.");
    const random=rng(hash(`random:${options.variant||Date.now()}:${options.group||"all"}`));
    return pool[Math.floor(random()*pool.length)];
  }

  window.EnergieDemoLab=Object.freeze({version:2,scenarios:Object.freeze(scenarios),list,groups,generate,randomScenario});
})();