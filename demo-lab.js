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
    dairy:["Gruau au lait, banane et cannelle","Smoothie au lait, banane et fraises","Poulet, pommes de terre, brocoli et verre de lait","Riz, poulet, carottes et lait"],
    soy:["Bol de tofu, riz brun et brocoli","Edamames, quinoa et légumes","Soupe miso, tofu et nouilles","Smoothie au lait de soya, banane et avoine"],
    seafood:["Crevettes, riz et légumes","Moules, pommes de terre et salade","Pâtes aux crevettes et tomates","Bol de quinoa, crevettes et légumes"],
    fish:["Saumon, pommes de terre et haricots verts","Tilapia, riz et légumes","Truite, quinoa et salade"],
    gluten:["Pâtes, poulet et brocoli","Pain de blé entier, œufs et tomate","Orge, poulet et carottes","Seitan, riz et courgettes"],
    legumes:["Chili aux haricots rouges et légumes","Lentilles, riz et légumes","Salade de pois chiches, tomates et concombre","Soupe aux lentilles et pain"],
    fruits:["Yogourt, fraises et bleuets","Pomme, amandes et fromage","Gruau, banane et framboises","Salade de fruits et yogourt"],
    vegetables:["Poulet, riz, brocoli et poivrons","Omelette aux légumes et rôties","Soupe de légumes et sandwich à la dinde"],
    allium:["Poulet, riz, brocoli, ail et oignon","Saumon, pommes de terre, salade et ail","Quinoa, poulet, tomates et oignon"],
    caffeine:["Café filtre et déjeuner habituel","Latte et rôties au beurre d’arachide","Thé noir, yogourt et fruit"],
    processed:["Pizza, salade et boisson gazeuse","Repas surgelé et crudités","Burger, frites et salade"],
    high_fiber:["Gruau, chia, framboises et amandes","Lentilles, quinoa et légumes","Pois chiches, avocat et légumes"],
    fried:["Poulet frit, pommes de terre et salade","Poisson frit, riz et légumes","Frites, burger et crudités"],
    spicy:["Chili épicé aux haricots","Curry épicé au poulet et légumes","Tacos épicés, salsa et salade"],
    neutral:["Poulet, riz et légumes","Saumon, pommes de terre et salade","Soupe aux légumes, sandwich à la dinde et fruit","Quinoa, légumes et poulet","Bœuf sauté, riz et légumes","Salade de poulet, avocat, tomates et pain","Tilapia, couscous et haricots verts","Bol de riz, œuf, edamames et légumes","Dinde, patate douce et brocoli","Pâtes tomate, poulet et courgettes","Omelette aux légumes, pommes de terre et fruit","Soupe de lentilles, pain et salade"]
  };

  // Standard food scenarios use matched meal pairs: the exposed and control
  // meals stay as similar as possible so the Observation engine does not learn
  // a side ingredient merely because it travels with the intended test food.
  const matchedFoodPairs = Object.freeze({
    dairy:[
      ["Gruau au lait, banane et cannelle","Gruau à l'eau, banane et cannelle"],
      ["Poulet, pommes de terre, brocoli et verre de lait","Poulet, pommes de terre, brocoli et eau"],
      ["Riz, poulet, carottes et lait","Riz, poulet et carottes"]
    ],
    soy:[
      ["Tofu, riz et brocoli","Poulet, riz et brocoli"],
      ["Edamames, quinoa et tomates","Poulet, quinoa et tomates"],
      ["Tofu, pommes de terre et salade","Poulet, pommes de terre et salade"]
    ],
    seafood:[
      ["Crevettes, riz et brocoli","Poulet, riz et brocoli"],
      ["Moules, pommes de terre et salade","Poulet, pommes de terre et salade"],
      ["Pétoncles, quinoa et tomates","Poulet, quinoa et tomates"]
    ],
    gluten:[
      ["Pâtes, poulet et brocoli","Riz, poulet et brocoli"],
      ["Pain de blé entier, œufs et tomate","Gruau, œufs et tomate"],
      ["Orge, poulet et carottes","Quinoa, poulet et carottes"]
    ],
    legumes:[
      ["Lentilles, riz et brocoli","Poulet, riz et brocoli"],
      ["Pois chiches, quinoa et tomates","Poulet, quinoa et tomates"],
      ["Haricots rouges, pommes de terre et salade","Poulet, pommes de terre et salade"]
    ],
    allium:[
      ["Poulet, riz, brocoli, ail et oignon","Poulet, riz et brocoli"],
      ["Saumon, pommes de terre, salade et ail","Saumon, pommes de terre et salade"],
      ["Quinoa, poulet, tomates et oignon","Quinoa, poulet et tomates"]
    ],
    fried_foods:[
      ["Poulet frit, pommes de terre et salade","Poulet, pommes de terre et salade"],
      ["Poisson frit, riz et brocoli","Tilapia, riz et brocoli"],
      ["Frites, poulet et crudités","Pommes de terre, poulet et crudités"]
    ],
    spicy_foods:[
      ["Poulet épicé, riz et brocoli","Poulet, riz et brocoli"],
      ["Curry épicé au poulet et légumes","Poulet, riz et légumes"],
      ["Tacos épicés, salsa et salade","Tacos, salade et tomates"]
    ],
    processed_foods:[
      ["Pizza, poulet et salade","Poulet, pommes de terre et salade"],
      ["Frites, poulet et salade","Pommes de terre, poulet et salade"],
      ["Barre protéinée, banane et amandes","Banane et amandes"]
    ]
  });

  function categoriesFor(description){
    return window.ENERGIE_FOOD_CATEGORIES?.categoryIdsForText?.(description) || [];
  }
  function recognizedAs(description,target){
    if(!target) return true;
    if(categoriesFor(description).includes(target)) return true;
    if(target==="allium"){
      return (window.ENERGIE_FOOD_CATEGORIES?.foodsForText?.(description)||[]).some(food=>food.id==="allium");
    }
    return false;
  }

  const commonMeals=[...new Set(Object.values(foods).flat())];
  function mealsWithCategory(target){ return commonMeals.filter(description=>recognizedAs(description,target)); }
  function mealsWithoutCategory(target){ return commonMeals.filter(description=>!recognizedAs(description,target)); }
  function pick(pool,random){ return pool[Math.floor(random()*pool.length)]; }
  function pickDistinct(pool,used,random){
    const available=pool.filter(item=>!used.has(item));
    return pick(available.length?available:pool,random);
  }

  const foodTargets=new Set(["dairy","soy","seafood","fish","gluten","legumes","fruits","vegetables","allium","processed_foods","high_fiber","fried_foods","spicy_foods"]);
  function isFoodTarget(target){ return foodTargets.has(target); }
  function exposureChance(i,activeStart,activeEnd,random,before=.10,during=.60,after=.08){
    if(i<activeStart) return random()<before;
    if(i<=activeEnd) return random()<during;
    return random()<after;
  }

  function targetMeal(target,random,used=new Set()){
    const poolKey=({processed_foods:"processed",fried_foods:"fried",spicy_foods:"spicy"})[target]||target;
    const pool=(foods[poolKey]||commonMeals).filter(description=>recognizedAs(description,target));
    if(!pool.length) throw new Error(`Laboratoire: aucun repas reconnu pour la catégorie ${target}.`);
    return pickDistinct(pool,used,random);
  }

  function matchedScenarioMeal(target,exposed,random,used=new Set()){
    const pairs=matchedFoodPairs[target]||[];
    if(!pairs.length) return null;
    const valid=pairs.filter(pair=>{
      const description=exposed?pair[0]:pair[1];
      return !used.has(description) && (exposed ? recognizedAs(description,target) : !recognizedAs(description,target));
    });
    const pool=valid.length?valid:pairs.filter(pair=>exposed?recognizedAs(pair[0],target):!recognizedAs(pair[1],target));
    if(!pool.length) return null;
    const pair=pick(pool,random);
    return exposed?pair[0]:pair[1];
  }

  const foodScenarioTargets=new Set(["dairy","soy","seafood","gluten","legumes","allium","fried_foods","spicy_foods","processed_foods","high_fiber"]);
  function foodStoryExposure(sc,i,activeStart,activeEnd,rechallengeDay,random){
    if(!foodScenarioTargets.has(sc.target)) return null;
    if(sc.pattern==="sparse") return i===activeStart+2||i===Math.min(activeEnd,activeStart+7);
    if(sc.pattern==="ramp") return i<activeStart?random()<.10:i<=activeEnd?random()<(.20+((i-activeStart)/Math.max(1,activeEnd-activeStart))*.50):random()<.72;
    if(sc.pattern==="rechallenge") return exposureChance(i,activeStart,activeEnd,random,.08,.64,.04)||(i===rechallengeDay);
    if(sc.pattern==="transient") return exposureChance(i,activeStart,activeEnd,random,.10,.50,.12);
    if(sc.pattern==="confounder") return exposureChance(i,activeStart,activeEnd,random,.08,.56,.08)||(i===rechallengeDay);
    const base=exposureChance(i,activeStart,activeEnd,random,.08,.62,.07);
    return base||(i===rechallengeDay&&["exposure","withdrawal","dose"].includes(sc.pattern));
  }


  function standardFoodStory(sc){
    return foodScenarioTargets.has(sc.target) && ["exposure","withdrawal"].includes(sc.pattern);
  }
  function outcomeForFoodExposure(sc,exposed,inActiveWindow,afterWindow,random){
    if(!standardFoodStory(sc)) return null;
    const noise=inActiveWindow?.055:.035;
    const probability=exposed?(inActiveWindow?sc.strength:Math.max(.48,sc.strength-.16)):noise;
    const hit=random()<probability;
    if(sc.signal==="digestive") return hit?{tags:["bloating",random()<.55?"gas":"stomachache"],rating:random()<.35?4:3,note:"Inconfort digestif noté après le repas."}:{tags:["positive_wellbeing"],rating:3,note:""};
    if(sc.signal==="energy") return hit?{tags:random()<.45?["fatigue","brain_fog"]:["fatigue"],rating:4,note:"Énergie plus basse après le repas."}:{tags:["positive_wellbeing"],rating:3,note:""};
    return hit?{tags:["positive_energy","positive_wellbeing"],rating:4,note:""}:{tags:["positive_wellbeing"],rating:3,note:""};
  }

  const scenarios = [
    {id:"dairy-digestion",profileName:"Marie",group:"Alimentation",icon:"🥛",title:"Produits laitiers → inconfort digestif",target:"dairy",signal:"digestive",strength:.78,pattern:"exposure"},
    {id:"soy-digestion",profileName:"Camille",group:"Alimentation",icon:"🌿",title:"Soya → inconfort digestif",target:"soy",signal:"digestive",strength:.76,pattern:"exposure"},
    {id:"seafood-digestion",profileName:"Julie",group:"Alimentation",icon:"🦐",title:"Fruits de mer → inconfort digestif",target:"seafood",signal:"digestive",strength:.80,pattern:"exposure"},
    {id:"gluten-digestion",profileName:"Maxime",group:"Alimentation",icon:"🌾",title:"Aliments avec gluten → inconfort",target:"gluten",signal:"digestive",strength:.68,pattern:"exposure"},
    {id:"legumes-digestion",profileName:"Sarah",group:"Alimentation",icon:"🫘",title:"Légumineuses → ballonnements",target:"legumes",signal:"digestive",strength:.70,pattern:"exposure"},
    {id:"allium-digestion",profileName:"Antoine",group:"Alimentation",icon:"🧄",title:"Ail/oignon/alliums → inconfort",target:"allium",signal:"digestive",strength:.74,pattern:"exposure"},
    {id:"fried-digestion",profileName:"Léa",group:"Alimentation",icon:"🍟",title:"Aliments frits → lourdeur digestive",target:"fried_foods",signal:"digestive",strength:.70,pattern:"exposure"},
    {id:"spicy-digestion",profileName:"Thomas",group:"Alimentation",icon:"🌶️",title:"Aliments épicés → inconfort",target:"spicy_foods",signal:"digestive",strength:.70,pattern:"exposure"},
    {id:"processed-energy",profileName:"Émilie",group:"Alimentation",icon:"🍕",title:"Repas transformés → énergie plus basse",target:"processed_foods",signal:"energy",strength:.72,pattern:"exposure"},
    {id:"fiber-improvement",profileName:"Clara",group:"Évolution",icon:"🌾",title:"Fibres + hydratation → amélioration progressive",target:"high_fiber",signal:"positive",strength:.72,pattern:"ramp"},
    {id:"caffeine-sleep",profileName:"Nicolas",group:"Sommeil",icon:"☕",title:"Caféine tardive → sommeil moins favorable",target:"caffeine",signal:"sleep",strength:.80,pattern:"timing"},
    {id:"short-sleep-fatigue",profileName:"Audrey",group:"Sommeil",icon:"😴",title:"Nuit courte → fatigue le lendemain",target:"sleep",signal:"energy",strength:.78,pattern:"sleep"},
    {id:"activity-positive",profileName:"Julien",group:"Activité",icon:"🏃",title:"Journées actives → meilleur ressenti",target:"activity",signal:"positive",strength:.66,pattern:"activity"},
    {id:"hydration-positive",profileName:"Sophie",group:"Hydratation",icon:"💧",title:"Hydratation régulière → meilleur ressenti",target:"water",signal:"positive",strength:.64,pattern:"water"},
    {id:"weight-loss",profileName:"Gabriel",group:"Poids",icon:"⚖️",title:"Période de perte de poids",target:"weight",signal:"weight_down",strength:.78,pattern:"weight_down"},
    {id:"weight-gain",profileName:"Chloé",group:"Poids",icon:"⚖️",title:"Période de prise de poids",target:"weight",signal:"weight_up",strength:.78,pattern:"weight_up"},
    {id:"withdrawal-rechallenge",profileName:"Amélie",group:"Évolution",icon:"🔄",title:"Retrait puis réintroduction",target:"dairy",signal:"digestive",strength:.82,pattern:"rechallenge"},
    {id:"dose-response",profileName:"Vincent",group:"Cas complexes",icon:"📈",title:"Effet de quantité",target:"legumes",signal:"digestive",strength:.72,pattern:"dose"},
    {id:"delayed-reaction",profileName:"Élodie",group:"Cas complexes",icon:"⏱️",title:"Réaction retardée 12–24 h",target:"soy",signal:"digestive",strength:.72,pattern:"delayed"},
    {id:"false-dairy-allium",profileName:"Hugo",group:"Tests pièges",icon:"🎭",title:"Faux coupable : fromage vs ail",target:"allium",decoy:"dairy",signal:"digestive",strength:.76,pattern:"confounder"},
    {id:"late-coffee-only",profileName:"Isabelle",group:"Tests pièges",icon:"🕔",title:"Le café du matin est innocent",target:"caffeine",signal:"sleep",strength:.82,pattern:"timing"},
    {id:"random-no-signal",profileName:"Marc",group:"Contrôles",icon:"🎲",title:"Aucune association réelle",target:"neutral",signal:"none",strength:0,pattern:"control"},
    {id:"too-few-exposures",profileName:"Karine",group:"Contrôles",icon:"🔬",title:"Trop peu de données pour conclure",target:"seafood",signal:"digestive",strength:.80,pattern:"sparse"},
    {id:"coincidence-fades",profileName:"Simon",group:"Contrôles",icon:"🫥",title:"Coïncidence temporaire qui disparaît",target:"dairy",signal:"digestive",strength:.75,pattern:"transient"},
    {id:"missing-data",profileName:"Nadia",group:"Robustesse",icon:"🧩",title:"Données manquantes et signal réel",target:"seafood",signal:"digestive",strength:.74,pattern:"missing"},
    {id:"chaotic-multifactor",profileName:"Félix",group:"Cas complexes",icon:"🌪️",title:"Sommeil, repas et activité changent ensemble",target:"processed_foods",signal:"energy",strength:.48,pattern:"chaotic"}
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
        demoMode:true,demoTourSeen:true,demoName:sc.profileName||`Laboratoire — ${sc.title}`,demoProfileId:`lab-${sc.id}`,
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
      const foodExposure=foodStoryExposure(sc,i,activeStart,activeEnd,rechallengeDay,random);
      const exposure=foodExposure===null?exposureChance(i,activeStart,activeEnd,random,.08,.62,.08):foodExposure;
      const missing=sc.pattern==="missing" && random()<.28;
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
        const hasMatchedFoodPairs=standardFoodStory(sc) && (matchedFoodPairs[sc.target]?.length||0)>0;
        const breakfastHasTarget=standardFoodStory(sc) && !hasMatchedFoodPairs && (inActiveWindow?random()<.22:random()<.05);
        const targetBreakfasts=breakfastHasTarget?mealsWithCategory(sc.target).filter(description=>/yogourt|gruau|omelette|bagel|rôties|smoothie|fromage cottage|œuf|fruit|avoine/i.test(description)):[];
        const safeBreakfasts=isFoodTarget(sc.target)?neutralBreakfasts.filter(description=>!recognizedAs(description,sc.target)):neutralBreakfasts;
        const breakfastPool=breakfastHasTarget&&targetBreakfasts.length?targetBreakfasts:(safeBreakfasts.length?safeBreakfasts:neutralBreakfasts);
        const breakfastBase=pick(breakfastPool,random);
        const breakfast=lateCoffee?`Café filtre, ${breakfastBase}`:breakfastBase;
        const usedMeals=new Set([breakfastBase]);
        const breakfastExposure=breakfastHasTarget && recognizedAs(breakfast,sc.target);
        const breakfastOutcome=outcomeForFoodExposure(sc,breakfastExposure,inActiveWindow,afterWindow,random);
        const breakfastSymptom=breakfastOutcome?breakfastOutcome.rating<4:(breakfastExposure && sc.signal==="digestive" && random()<sc.strength);
        const breakfastTags=breakfastOutcome?breakfastOutcome.tags:(breakfastSymptom?["bloating",random()<.55?"gas":"cramps"]:["positive_wellbeing"]);
        day.meals.push(meal(`lab-${date}-b`,date,"07:30","Déjeuner",breakfast,breakfastTags,breakfastOutcome?.rating??(breakfastSymptom?2:4),breakfastOutcome?.note??(breakfastSymptom?"Inconfort digestif noté après le repas.":"")));
        if(weightScenario){
          const down=sc.pattern==="weight_down";
          day.calories=Math.round((down?1850:2650)+(random()-.5)*260);
          if(down && random()<.58) day.activities.push({id:`lab-aw-${date}`,type:"Marche",minutes:25+Math.floor(random()*35),intensity:"moderate",at:`${date}T16:45:00`});
          if(!down && random()<.45) day.water=Math.max(3,day.water-1);
        }
        const nonTargetPool=isFoodTarget(sc.target)?mealsWithoutCategory(sc.target).filter(description=>!recognizedAs(description,"caffeine")):commonMeals.filter(description=>!recognizedAs(description,"caffeine"));
        let description=hasMatchedFoodPairs
          ? matchedScenarioMeal(sc.target,Boolean(exposure),random,usedMeals)
          : (exposure&&isFoodTarget(sc.target))
            ? targetMeal(sc.target,random,usedMeals)
            : pickDistinct(nonTargetPool.length?nonTargetPool:foods.neutral,usedMeals,random);
        if(!description) description=(exposure&&isFoodTarget(sc.target))?targetMeal(sc.target,random,usedMeals):pickDistinct(nonTargetPool.length?nonTargetPool:foods.neutral,usedMeals,random);
        usedMeals.add(description);
        if(sc.pattern==="confounder" && exposure) description=random()<.70?"Pâtes tomate, ail, oignon et parmesan":"Poulet sauté avec ail, oignon, riz et légumes";
        const isTransient=sc.pattern==="transient";
        const lunchOutcome=outcomeForFoodExposure(sc,exposure,inActiveWindow,afterWindow,random);
        let symptomProbability=exposure?sc.strength:(inActiveWindow?.07:.04);
        if(isTransient && i>Math.min(activeEnd,activeStart+8)) symptomProbability=.09;
        if(sc.pattern==="control") symptomProbability=.10;
        if(sc.pattern==="confounder") symptomProbability=description.includes("ail")||description.includes("oignon")?.72:.06;
        else if(afterWindow && !["weight_down","weight_up"].includes(sc.pattern)) symptomProbability=.035;
        if(sc.pattern==="dose") { const highDose=random()<.45; symptomProbability=exposure?(highDose?.84:.34):.06; }
        if(sc.pattern==="delayed") symptomProbability=.05;
        const symptom=lunchOutcome?lunchOutcome.rating<4:random()<symptomProbability;
        const contextualSignal=["sleep","activity","water"].includes(sc.pattern);
        const positiveTrigger=sc.pattern==="activity"?active:sc.pattern==="water"?water>=7:(exposure||inActiveWindow);
        const tags=lunchOutcome?lunchOutcome.tags:sc.signal==="digestive"&&symptom?["bloating",random()<.55?"gas":"cramps"]:
          sc.signal==="energy"&&!contextualSignal&&exposure&&random()<sc.strength?["fatigue"]:
          sc.signal==="positive"&&!contextualSignal&&positiveTrigger&&random()<sc.strength?["energy","feeling_good"]:
          ["positive_wellbeing"];
        const rating=lunchOutcome?.rating??(tags.includes("bloating")?2:tags.includes("fatigue")?2:4);
        day.meals.push(meal(`lab-${date}-l`,date,"12:20","Dîner",description,tags,rating,lunchOutcome?.note??(tags.includes("bloating")?"Inconfort digestif noté après le repas.":"")));
        const dinnerExposure=standardFoodStory(sc) && (inActiveWindow?random()<.20:random()<.05);
        const dinnerNonTarget=isFoodTarget(sc.target)?mealsWithoutCategory(sc.target).filter(description=>!recognizedAs(description,"caffeine")):commonMeals.filter(description=>!recognizedAs(description,"caffeine"));
        let dinnerDescription=hasMatchedFoodPairs
          ? matchedScenarioMeal(sc.target,Boolean(dinnerExposure),random,usedMeals)
          : dinnerExposure
            ? targetMeal(sc.target,random,usedMeals)
            : pickDistinct(dinnerNonTarget.length?dinnerNonTarget:foods.neutral,usedMeals,random);
        if(!dinnerDescription) dinnerDescription=dinnerExposure?targetMeal(sc.target,random,usedMeals):pickDistinct(dinnerNonTarget.length?dinnerNonTarget:foods.neutral,usedMeals,random);
        const dinnerOutcome=outcomeForFoodExposure(sc,dinnerExposure,inActiveWindow,afterWindow,random);
        const dinnerSymptom=dinnerOutcome?dinnerOutcome.rating<4:(dinnerExposure&&sc.signal==="digestive"?random()<sc.strength:(sc.signal==="digestive"&&random()<.035));
        const dinnerTags=dinnerOutcome?dinnerOutcome.tags:(dinnerSymptom?["bloating",random()<.5?"gas":"cramps"]:
          sc.signal==="energy"&&dinnerExposure&&random()<sc.strength?["fatigue"]:
          sc.signal==="positive"&&dinnerExposure&&random()<sc.strength?["energy","feeling_good"]:
          ["positive_wellbeing"]);
        day.meals.push(meal(`lab-${date}-d`,date,"18:45","Souper",dinnerDescription,dinnerTags,dinnerOutcome?.rating??(dinnerSymptom?2:4),dinnerOutcome?.note??(dinnerSymptom?"Inconfort digestif léger.":"")));

        // Sommeil, activité et hydratation sont des contextes de journée.
        // On les consigne hors repas pour éviter que le moteur attribue par
        // hasard la fatigue ou le mieux-être au poisson, aux fritures, etc.
        if(sc.pattern==="sleep" && sleep<6.3){
          day.observations.push({id:`lab-sleep-${date}`,date,time:"14:30",intensity:4,duration:"few_hours",tags:["fatigue"],contexts:["sleep"],mealIds:[],notes:"Fatigue marquée pendant la journée après une nuit courte.",createdAt:`${date}T14:30:00`,updatedAt:`${date}T14:30:00`});
        }
        if(sc.pattern==="activity" && active && random()<sc.strength){
          day.observations.push({id:`lab-activity-${date}`,date,time:"20:15",intensity:4,duration:"few_hours",tags:["positive_wellbeing"],contexts:["activity"],mealIds:[],notes:"Meilleur ressenti général pendant une journée active.",createdAt:`${date}T20:15:00`,updatedAt:`${date}T20:15:00`});
        }
        if(sc.pattern==="water" && water>=7 && random()<sc.strength){
          day.observations.push({id:`lab-water-${date}`,date,time:"20:15",intensity:4,duration:"few_hours",tags:["positive_wellbeing"],contexts:["hydration"],mealIds:[],notes:"Meilleur ressenti général pendant une journée bien hydratée.",createdAt:`${date}T20:15:00`,updatedAt:`${date}T20:15:00`});
        }

        if(sc.pattern==="delayed" && previousExposure && random()<sc.strength){
          day.observations.push({id:`lab-ob-${date}`,date,time:"09:15",intensity:3,duration:"few_hours",tags:["bloating","cramps"],contexts:["food"],mealIds:[],notes:"Inconfort apparu ce matin, sans l’attribuer automatiquement au dernier repas.",createdAt:`${date}T09:15:00`,updatedAt:`${date}T09:15:00`});
        }
      }
      store.days[date]=day;
      previousExposure=exposure;
    }
    const labStats={target:sc.target,activeStart,activeEnd,activeDays,rechallengeDay,exposures:0,activeExposures:0,postExposures:0,negativeMeals:0,activeNegativeMeals:0,postNegativeMeals:0};
    Object.values(store.days).forEach((day,idx)=>{
      (day.meals||[]).forEach(m=>{
        const hit=isFoodTarget(sc.target)&&recognizedAs(m.description,sc.target);
        if(hit){labStats.exposures++;if(idx>=activeStart&&idx<=activeEnd)labStats.activeExposures++;if(idx>activeEnd)labStats.postExposures++;}
        const tags=m.feeling?.tags||[];
        if(tags.some(t=>["bloating","gas","cramps","fatigue"].includes(t))){labStats.negativeMeals++;if(idx>=activeStart&&idx<=activeEnd)labStats.activeNegativeMeals++;if(idx>activeEnd)labStats.postNegativeMeals++;}
      });
    });
    Object.defineProperty(store,"__labStats",{value:Object.freeze(labStats),enumerable:false,writable:false});
    Object.defineProperty(store,"__labTruth",{value:Object.freeze({target:sc.target,signal:sc.signal,pattern:sc.pattern,activeStart,activeEnd,activeDays,rechallengeDay}),enumerable:false,writable:false});
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

  window.EnergieDemoLab=Object.freeze({version:4,scenarios:Object.freeze(scenarios),list,groups,generate,randomScenario});
})();