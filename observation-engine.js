(() => {
  "use strict";

  const FOOD = window.ENERGIE_FOOD_CATEGORIES;
  const DEFAULT_LOCALE = "fr-CA";
  const DAY_MS = 86400000;
  const NEGATIVE_TAGS = new Set(["headache","stomachache","bloating","nausea","fatigue","dizziness","reflux","gas"]);
  const POSITIVE_TAGS = new Set(["energy","good_mood","focus","easy_digestion","feeling_good"]);
  const TAG_LABELS = {
    headache:["🤕","un mal de tête"], stomachache:["🤢","un mal de ventre"], bloating:["🎈","des ballonnements"],
    nausea:["🤮","des nausées"], fatigue:["😴","de la fatigue"], dizziness:["😵","des étourdissements"],
    reflux:["🔥","du reflux"], gas:["💨","des gaz"], energy:["⚡","une bonne énergie"],
    good_mood:["😊","une bonne humeur"], focus:["🧠","une bonne concentration"],
    easy_digestion:["😌","une digestion facile"], feeling_good:["💪","le fait de te sentir bien"]
  };

  const average = values => values.length ? values.reduce((sum, value) => sum + Number(value || 0), 0) / values.length : null;
  const percent = value => `${Math.round(value * 100)} %`;
  const dateValue = key => new Date(`${key}T12:00:00`).getTime();

  function normalizeDays(db, mealsOverride) {
    const byDate = new Map();
    Object.entries(db?.days || {}).forEach(([date, day]) => {
      byDate.set(date, {
        date,
        sleepHours: Number.isFinite(Number(day.sleepHours)) ? Number(day.sleepHours) : null,
        water: Number(day.water) || 0,
        activityMinutes: (day.activities || []).reduce((sum, activity) => sum + (Number(activity.minutes) || 0), 0),
        meals: Array.isArray(day.meals) ? day.meals : []
      });
    });
    if (Array.isArray(mealsOverride)) {
      mealsOverride.forEach(meal => {
        if (!meal?.date) return;
        if (!byDate.has(meal.date)) byDate.set(meal.date, {date:meal.date,sleepHours:null,water:0,activityMinutes:0,meals:[]});
        const day = byDate.get(meal.date);
        if (!day.meals.some(item => item.id && item.id === meal.id)) day.meals.push(meal);
      });
    }
    return [...byDate.values()].sort((a,b) => a.date.localeCompare(b.date)).map(day => enrichDay(day));
  }

  function enrichDay(day) {
    const categoryIds = new Set();
    const outcomes = new Set();
    const ratings = [];
    day.meals.forEach(meal => {
      FOOD?.categoryIdsForText(`${meal.description || ""} ${meal.notes || ""}`).forEach(id => categoryIds.add(id));
      const feeling = meal.feeling;
      if (!feeling) return;
      if (Number.isFinite(Number(feeling.rating))) ratings.push(Number(feeling.rating));
      (feeling.tags || []).forEach(tag => outcomes.add(tag));
    });
    return {...day, categoryIds, outcomes, averageFeeling:average(ratings)};
  }

  function confidence(exposed, comparison, difference) {
    const sample = Math.min(exposed, comparison);
    if (sample >= 18 && difference >= .28) return {level:"established",icon:"🌳",label:"Tendance bien établie",cls:"high"};
    if (sample >= 9 && difference >= .22) return {level:"confirming",icon:"🌿",label:"Tendance qui se confirme",cls:"medium"};
    return {level:"new",icon:"🌱",label:"Nouvelle tendance",cls:"low"};
  }

  function compareBinary(days, predicate, outcome, descriptor, icon, category, direction="more") {
    const eligible = days.filter(day => day.meals.length && day.meals.some(meal => meal.feeling));
    const exposed = eligible.filter(predicate);
    const comparison = eligible.filter(day => !predicate(day));
    if (exposed.length < 4 || comparison.length < 4) return null;
    const exposedHits = exposed.filter(day => day.outcomes.has(outcome)).length;
    const comparisonHits = comparison.filter(day => day.outcomes.has(outcome)).length;
    const exposedRate = exposedHits / exposed.length;
    const comparisonRate = comparisonHits / comparison.length;
    const rawDifference = exposedRate - comparisonRate;
    const difference = direction === "less" ? -rawDifference : rawDifference;
    if (difference < .18 || exposedHits < 2) return null;
    const [outcomeIcon, outcomeLabel] = TAG_LABELS[outcome] || ["🔎", outcome];
    const conf = confidence(exposed.length, comparison.length, difference);
    return {
      id:`${category}-${outcome}-${direction}`,
      icon: icon || outcomeIcon,
      title: descriptor.title,
      text: descriptor.text(outcomeLabel),
      statistic: percent(exposedRate),
      comparisonStatistic: percent(comparisonRate),
      confidence: conf,
      samples: {exposed:exposed.length, comparison:comparison.length, exposedHits, comparisonHits},
      score: difference * Math.log2(Math.min(exposed.length, comparison.length) + 1),
      basis:`Observé sur ${exposed.length} journées correspondant à cette habitude, comparées à ${comparison.length} autres journées. Le ressenti « ${outcomeLabel} » apparaît dans ${percent(exposedRate)} de ces journées, contre ${percent(comparisonRate)} dans les autres journées.`,
      kind:"discovery",
      category
    };
  }

  function categoryLabel(category, locale = DEFAULT_LOCALE) {
    return FOOD?.getCategoryLabel?.(category.id, locale) || category.labels?.[locale] || category.label || category.id;
  }

  function foodObservations(days, locale = DEFAULT_LOCALE) {
    if (!FOOD) return [];
    const cards = [];
    FOOD.definitions.forEach(foodCategory => {
      const label = categoryLabel(foodCategory, locale);
      [...NEGATIVE_TAGS].forEach(outcome => {
        const card = compareBinary(days, day => day.categoryIds.has(foodCategory.id), outcome, {
          title: label,
          text: outcomeLabel => `Les journées où tu notes ${label.toLowerCase()} semblent être plus souvent accompagnées de ${outcomeLabel}.`
        }, foodCategory.icon, `food:${foodCategory.id}`);
        if (card) cards.push(card);
      });
      [...POSITIVE_TAGS].forEach(outcome => {
        const card = compareBinary(days, day => day.categoryIds.has(foodCategory.id), outcome, {
          title: label,
          text: outcomeLabel => `Les journées où tu notes ${label.toLowerCase()} semblent être plus souvent associées à ${outcomeLabel}.`
        }, foodCategory.icon, `food:${foodCategory.id}`);
        if (card) cards.push(card);
      });
    });
    return cards;
  }

  function habitObservations(days, waterGoal) {
    const cards = [];
    const sleepDays = days.filter(day => day.sleepHours != null);
    const sleepAverage = average(sleepDays.map(day => day.sleepHours));
    if (sleepAverage != null) {
      [...NEGATIVE_TAGS].forEach(outcome => {
        const card = compareBinary(days, day => day.sleepHours != null && day.sleepHours < sleepAverage - .5, outcome, {
          title:"Sommeil plus court que d’habitude",
          text: outcomeLabel => `Lorsque tu dors moins que ton habitude personnelle, tes journées sont plus souvent accompagnées de ${outcomeLabel}.`
        }, "🌙", "habit:sleep");
        if (card) cards.push(card);
      });
    }
    [...POSITIVE_TAGS].forEach(outcome => {
      const hydration = compareBinary(days, day => day.water >= Math.max(1, Number(waterGoal) || 8), outcome, {
        title:"Hydratation atteinte",
        text: outcomeLabel => `Les journées où tu atteins ton objectif d’eau sont plus souvent associées à ${outcomeLabel}.`
      }, "💧", "habit:water");
      if (hydration) cards.push(hydration);
      const activity = compareBinary(days, day => day.activityMinutes >= 30, outcome, {
        title:"Journées plus actives",
        text: outcomeLabel => `Après les journées où tu bouges au moins 30 minutes, tu notes plus souvent ${outcomeLabel}.`
      }, "🚶", "habit:activity");
      if (activity) cards.push(activity);
    });
    return cards;
  }

  function journalMaturity(days) {
    const documented = days.filter(day => day.meals.length).length;
    const feelingDays = days.filter(day => day.meals.some(meal => meal.feeling)).length;
    if (feelingDays >= 60) return {icon:"🌳",label:"Ton journal connaît maintenant bien tes habitudes",days:documented,feelingDays,level:"established"};
    if (feelingDays >= 20) return {icon:"🌿",label:"Ton journal commence à détecter des tendances",days:documented,feelingDays,level:"confirming"};
    return {icon:"🌱",label:"Ton journal apprend encore",days:documented,feelingDays,level:"new"};
  }

  function analyze(db, options={}) {
    const days = normalizeDays(db, options.meals);
    const cutoff = Date.now() - (Number(options.lookbackDays) || 180) * DAY_MS;
    const recentDays = days.filter(day => dateValue(day.date) >= cutoff);
    const locale = options.locale || db?.settings?.language || DEFAULT_LOCALE;
    const candidates = [...foodObservations(recentDays, locale), ...habitObservations(recentDays, db?.settings?.waterGoal)]
      .sort((a,b) => b.score - a.score);
    const selected = [];
    const usedCategories = new Set();
    for (const card of candidates) {
      if (usedCategories.has(card.category)) continue;
      selected.push(card);
      usedCategories.add(card.category);
      if (selected.length === (Number(options.limit) || 3)) break;
    }
    return {version:2, foodCategoriesVersion:FOOD?.version || null, generatedAt:new Date().toISOString(), maturity:journalMaturity(recentDays), observations:selected, analyzedDays:recentDays.length};
  }

  window.EnergieObservationEngine = Object.freeze({version:2, analyze, normalizeDays});
})();
