(() => {
  "use strict";

  const FOOD = window.ENERGIE_FOOD_CATEGORIES;
  const VERSION = 3;
  const DEFAULT_LOCALE = "fr-CA";
  const DAY_MS = 86400000;

  const DEFAULT_OPTIONS = Object.freeze({
    lookbackDays: 180,
    limit: 3,
    minimumExposedDays: 5,
    minimumComparisonDays: 5,
    minimumAbsoluteDifference: 0.4,
    minimumRelativeDifference: 0.1,
    minimumEnergy: 1,
    maximumEnergy: 5
  });

  const TEXT = {
    "fr-CA": {
      lower: label => `Les journées où la catégorie « ${label.toLowerCase()} » est présente semblent être associées à une énergie plus faible.`,
      higher: label => `Les journées où la catégorie « ${label.toLowerCase()} » est présente semblent être associées à une meilleure énergie.`,
      slightLower: label => `Une légère tendance vers une énergie plus faible est observée les journées où la catégorie « ${label.toLowerCase()} » est présente, mais davantage de données seront nécessaires.`,
      slightHigher: label => `Une légère tendance vers une meilleure énergie est observée les journées où la catégorie « ${label.toLowerCase()} » est présente, mais davantage de données seront nécessaires.`,
      basis: ({label, exposedDays, comparisonDays, exposedAverage, comparisonAverage, frequency}) =>
        `${label} apparaît dans ${exposedDays} journées analysables (${Math.round(frequency * 100)} %). L’énergie moyenne est de ${formatNumber(exposedAverage)} ces journées-là, contre ${formatNumber(comparisonAverage)} durant ${comparisonDays} journées sans cette catégorie. Cette observation décrit uniquement une tendance dans ton propre journal.`,
      confidence: {
        new: "Peu de données",
        confirming: "Bonne tendance",
        established: "Très forte tendance"
      },
      maturity: {
        new: "Ton journal apprend encore",
        confirming: "Ton journal commence à détecter des tendances",
        established: "Ton journal connaît maintenant bien tes habitudes"
      }
    },
    "fr-FR": {
      lower: label => `Les journées où la catégorie « ${label.toLowerCase()} » est présente semblent être associées à une énergie plus faible.`,
      higher: label => `Les journées où la catégorie « ${label.toLowerCase()} » est présente semblent être associées à une meilleure énergie.`,
      slightLower: label => `Une légère tendance vers une énergie plus faible est observée les journées où la catégorie « ${label.toLowerCase()} » est présente, mais davantage de données seront nécessaires.`,
      slightHigher: label => `Une légère tendance vers une meilleure énergie est observée les journées où la catégorie « ${label.toLowerCase()} » est présente, mais davantage de données seront nécessaires.`,
      basis: ({label, exposedDays, comparisonDays, exposedAverage, comparisonAverage, frequency}) =>
        `${label} apparaît dans ${exposedDays} journées analysables (${Math.round(frequency * 100)} %). L’énergie moyenne est de ${formatNumber(exposedAverage)} ces jours-là, contre ${formatNumber(comparisonAverage)} durant ${comparisonDays} journées sans cette catégorie. Cette observation décrit uniquement une tendance dans votre propre journal.`,
      confidence: {
        new: "Peu de données",
        confirming: "Bonne tendance",
        established: "Très forte tendance"
      },
      maturity: {
        new: "Votre journal apprend encore",
        confirming: "Votre journal commence à détecter des tendances",
        established: "Votre journal connaît maintenant bien vos habitudes"
      }
    },
    en: {
      lower: label => `Days where the “${label.toLowerCase()}” category is present seem to be associated with lower energy.`,
      higher: label => `Days where the “${label.toLowerCase()}” category is present seem to be associated with better energy.`,
      slightLower: label => `A slight trend toward lower energy appears on days where the “${label.toLowerCase()}” category is present, but more data will be needed.`,
      slightHigher: label => `A slight trend toward better energy appears on days where the “${label.toLowerCase()}” category is present, but more data will be needed.`,
      basis: ({label, exposedDays, comparisonDays, exposedAverage, comparisonAverage, frequency}) =>
        `${label} appears on ${exposedDays} analyzable days (${Math.round(frequency * 100)}%). Average energy is ${formatNumber(exposedAverage)} on those days, compared with ${formatNumber(comparisonAverage)} across ${comparisonDays} days without this category. This observation only describes a trend within your own journal.`,
      confidence: {
        new: "Limited data",
        confirming: "Good trend",
        established: "Very strong trend"
      },
      maturity: {
        new: "Your journal is still learning",
        confirming: "Your journal is starting to detect trends",
        established: "Your journal now knows your habits well"
      }
    }
  };

  function localeText(locale) {
    return TEXT[locale] || TEXT[locale?.startsWith("en") ? "en" : "fr-CA"];
  }

  function formatNumber(value) {
    return Number(value).toFixed(1).replace(".", ",");
  }

  function average(values) {
    const valid = values.filter(Number.isFinite);
    return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : null;
  }

  function standardDeviation(values) {
    const valid = values.filter(Number.isFinite);
    if (valid.length < 2) return 0;
    const mean = average(valid);
    const variance = valid.reduce((sum, value) => sum + Math.pow(value - mean, 2), 0) / (valid.length - 1);
    return Math.sqrt(variance);
  }

  function clampEnergy(value, options) {
    const number = Number(value);
    if (!Number.isFinite(number)) return null;
    if (number < options.minimumEnergy || number > options.maximumEnergy) return null;
    return number;
  }

  function firstValidEnergy(candidates, options) {
    for (const candidate of candidates) {
      const value = clampEnergy(candidate, options);
      if (value != null) return value;
    }
    return null;
  }

  function extractMealEnergy(meal, options) {
    if (!meal || typeof meal !== "object") return null;

    return firstValidEnergy([
      meal.energyBefore,
      meal.energy_before,
      meal.energy,
      meal.energyLevel,
      meal.energy_level,
      meal.fatigueBefore != null ? 6 - Number(meal.fatigueBefore) : null,
      meal.fatigue_before != null ? 6 - Number(meal.fatigue_before) : null,
      meal.feeling?.energy,
      meal.feeling?.rating,
      meal.feelingRating,
      meal.feeling_rating
    ], options);
  }

  function extractDayEnergy(day, meals, options) {
    const direct = firstValidEnergy([
      day?.energy,
      day?.energyAverage,
      day?.averageEnergy,
      day?.energy_level,
      day?.energyLevel
    ], options);
    if (direct != null) return direct;

    return average(meals.map(meal => extractMealEnergy(meal, options)).filter(Number.isFinite));
  }

  function dateValue(key) {
    return new Date(`${key}T12:00:00`).getTime();
  }

  function mealText(meal) {
    return [
      meal?.description,
      meal?.name,
      meal?.title,
      meal?.food,
      meal?.foods,
      meal?.notes,
      meal?.ingredients
    ].flat().filter(Boolean).join(" ");
  }

  function normalizeDays(db, mealsOverride, options = {}) {
    const settings = {...DEFAULT_OPTIONS, ...options};
    const byDate = new Map();

    Object.entries(db?.days || {}).forEach(([date, day]) => {
      byDate.set(date, {
        ...day,
        date,
        meals: Array.isArray(day?.meals) ? [...day.meals] : []
      });
    });

    if (Array.isArray(mealsOverride)) {
      mealsOverride.forEach(meal => {
        if (!meal?.date) return;
        if (!byDate.has(meal.date)) byDate.set(meal.date, {date: meal.date, meals: []});
        const day = byDate.get(meal.date);
        const duplicate = meal.id && day.meals.some(item => item?.id === meal.id);
        if (!duplicate) day.meals.push(meal);
      });
    }

    return [...byDate.values()]
      .sort((a, b) => a.date.localeCompare(b.date))
      .map(day => enrichDay(day, settings));
  }

  function enrichDay(day, options) {
    const categoryIds = new Set();
    const categoryCounts = new Map();
    const meals = Array.isArray(day.meals) ? day.meals : [];

    meals.forEach(meal => {
      const ids = FOOD?.categoryIdsForText?.(mealText(meal)) || [];
      ids.forEach(id => {
        categoryIds.add(id);
        categoryCounts.set(id, (categoryCounts.get(id) || 0) + 1);
      });
    });

    const energyValues = meals.map(meal => extractMealEnergy(meal, options)).filter(Number.isFinite);
    const averageEnergy = extractDayEnergy(day, meals, options);

    return {
      ...day,
      meals,
      categoryIds,
      categoryCounts,
      energyValues,
      averageEnergy,
      hasUsableEnergy: Number.isFinite(averageEnergy)
    };
  }

  function confidence(exposedDays, comparisonDays, absoluteDifference, locale) {
    const sample = Math.min(exposedDays, comparisonDays);
    const text = localeText(locale);

    if (sample >= 30 && absoluteDifference >= 0.55) {
      return {level: "established", icon: "🌳", label: text.confidence.established, cls: "high"};
    }
    if (sample >= 12 && absoluteDifference >= 0.45) {
      return {level: "confirming", icon: "🌿", label: text.confidence.confirming, cls: "medium"};
    }
    return {level: "new", icon: "🌱", label: text.confidence.new, cls: "low"};
  }

  function trendStrength(absoluteDifference, pooledDeviation) {
    const standardized = pooledDeviation > 0 ? absoluteDifference / pooledDeviation : absoluteDifference;
    if (absoluteDifference >= 1 || standardized >= 0.8) return "strong";
    if (absoluteDifference >= 0.65 || standardized >= 0.5) return "moderate";
    return "slight";
  }

  function compareCategory(days, category, locale, options) {
    const eligible = days.filter(day => day.hasUsableEnergy && day.meals.length > 0);
    const exposed = eligible.filter(day => day.categoryIds.has(category.id));
    const comparison = eligible.filter(day => !day.categoryIds.has(category.id));

    if (exposed.length < options.minimumExposedDays || comparison.length < options.minimumComparisonDays) return null;

    const exposedValues = exposed.map(day => day.averageEnergy);
    const comparisonValues = comparison.map(day => day.averageEnergy);
    const exposedAverage = average(exposedValues);
    const comparisonAverage = average(comparisonValues);
    if (!Number.isFinite(exposedAverage) || !Number.isFinite(comparisonAverage)) return null;

    const difference = exposedAverage - comparisonAverage;
    const absoluteDifference = Math.abs(difference);
    const baseline = Math.max(Math.abs(comparisonAverage), 0.01);
    const relativeDifference = absoluteDifference / baseline;

    if (absoluteDifference < options.minimumAbsoluteDifference || relativeDifference < options.minimumRelativeDifference) return null;

    const pooledDeviation = average([
      standardDeviation(exposedValues),
      standardDeviation(comparisonValues)
    ]);
    const strength = trendStrength(absoluteDifference, pooledDeviation);
    const conf = confidence(exposed.length, comparison.length, absoluteDifference, locale);
    const label = FOOD?.getCategoryLabel?.(category.id, locale) || category.label || category.id;
    const text = localeText(locale);
    const direction = difference < 0 ? "lower" : "higher";
    const cautiousText = strength === "slight" || conf.level === "new"
      ? (direction === "lower" ? text.slightLower(label) : text.slightHigher(label))
      : (direction === "lower" ? text.lower(label) : text.higher(label));
    const frequency = exposed.length / eligible.length;
    const sampleBalance = Math.min(exposed.length, comparison.length) / Math.max(exposed.length, comparison.length);
    const score = absoluteDifference * Math.log2(Math.min(exposed.length, comparison.length) + 1) * (0.75 + sampleBalance * 0.25);

    return {
      id: `food-category:${category.id}:${direction}`,
      icon: category.icon || "🔎",
      title: label,
      text: cautiousText,
      statistic: formatNumber(exposedAverage),
      comparisonStatistic: formatNumber(comparisonAverage),
      confidence: conf,
      samples: {
        exposed: exposed.length,
        comparison: comparison.length,
        total: eligible.length
      },
      metrics: {
        frequency,
        exposedAverage,
        comparisonAverage,
        difference,
        absoluteDifference,
        relativeDifference,
        pooledDeviation,
        strength,
        direction
      },
      score,
      basis: text.basis({
        label,
        exposedDays: exposed.length,
        comparisonDays: comparison.length,
        exposedAverage,
        comparisonAverage,
        frequency
      }),
      kind: "food-category-energy",
      category: `food:${category.id}`,
      categoryId: category.id
    };
  }

  function foodObservations(days, locale, options) {
    if (!FOOD?.definitions) return [];
    return FOOD.definitions
      .map(category => compareCategory(days, category, locale, options))
      .filter(Boolean);
  }

  function journalMaturity(days, locale) {
    const text = localeText(locale);
    const documentedDays = days.filter(day => day.meals.length > 0).length;
    const analyzableDays = days.filter(day => day.hasUsableEnergy && day.meals.length > 0).length;

    if (analyzableDays >= 30) {
      return {icon: "🌳", label: text.maturity.established, days: documentedDays, analyzableDays, level: "established"};
    }
    if (analyzableDays >= 12) {
      return {icon: "🌿", label: text.maturity.confirming, days: documentedDays, analyzableDays, level: "confirming"};
    }
    return {icon: "🌱", label: text.maturity.new, days: documentedDays, analyzableDays, level: "new"};
  }

  function analyze(db, options = {}) {
    const settings = {...DEFAULT_OPTIONS, ...options};
    const locale = options.locale || db?.settings?.language || DEFAULT_LOCALE;
    const days = normalizeDays(db, options.meals, settings);
    const cutoff = Date.now() - Number(settings.lookbackDays) * DAY_MS;
    const recentDays = days.filter(day => dateValue(day.date) >= cutoff);

    const candidates = foodObservations(recentDays, locale, settings)
      .sort((a, b) => b.score - a.score);

    const observations = [];
    const selectedCategoryIds = [];
    const limit = Number(settings.limit) || DEFAULT_OPTIONS.limit;

    function exposureOverlap(firstId, secondId) {
      const eligible = recentDays.filter(day => day.hasUsableEnergy && day.meals.length > 0);
      let intersection = 0;
      let union = 0;
      eligible.forEach(day => {
        const first = day.categoryIds.has(firstId);
        const second = day.categoryIds.has(secondId);
        if (first || second) union += 1;
        if (first && second) intersection += 1;
      });
      return union ? intersection / union : 0;
    }

    for (const candidate of candidates) {
      const duplicatesExistingPattern = selectedCategoryIds.some(categoryId =>
        exposureOverlap(candidate.categoryId, categoryId) >= 0.85
      );
      if (duplicatesExistingPattern) continue;
      observations.push(candidate);
      selectedCategoryIds.push(candidate.categoryId);
      if (observations.length >= limit) break;
    }

    const analyzableDays = recentDays.filter(day => day.hasUsableEnergy && day.meals.length > 0).length;

    return {
      version: VERSION,
      foodCategoriesVersion: FOOD?.version || null,
      generatedAt: new Date().toISOString(),
      locale,
      maturity: journalMaturity(recentDays, locale),
      observations,
      analyzedDays: recentDays.length,
      analyzableDays,
      candidateCount: candidates.length,
      settings: {
        lookbackDays: Number(settings.lookbackDays),
        minimumExposedDays: Number(settings.minimumExposedDays),
        minimumComparisonDays: Number(settings.minimumComparisonDays),
        minimumAbsoluteDifference: Number(settings.minimumAbsoluteDifference),
        minimumRelativeDifference: Number(settings.minimumRelativeDifference)
      }
    };
  }

  window.EnergieObservationEngine = Object.freeze({
    version: VERSION,
    analyze,
    normalizeDays,
    extractMealEnergy
  });
})();
