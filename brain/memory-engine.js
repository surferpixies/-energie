(() => {
  "use strict";

  const U = window.EnergieBrainModules?.utils;
  if (!U) throw new Error("EnergieBrain: utils.js doit être chargé avant memory-engine.js");

  const VERSION = 1;
  const DEFAULTS = Object.freeze({
    minimumOccurrences: 2,
    reliableConfidence: 0.68,
    maximumMemories: 250,
    storageKey: "energie-food-memory-v1"
  });

  const nowIso = () => new Date().toISOString();
  const uid = () => (globalThis.crypto?.randomUUID?.() || `memory-${Date.now()}-${Math.random().toString(16).slice(2)}`);
  const clone = value => JSON.parse(JSON.stringify(value));

  function normalizeLabel(value) {
    return U.normalize(value)
      .replace(/\b(mon|ma|mes|le|la|les|un|une|du|de|des|avec)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function normalizeIngredient(value) {
    return U.normalize(value)
      .replace(/^\d+(?:[.,]\d+)?\s*/, "")
      .replace(/\b(tasse|tasses|cup|cups|g|kg|ml|l|c a soupe|c a the|cuillere|cuilleres|portion|tranche|tranches)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function splitMealText(text) {
    const raw = String(text || "").trim();
    if (!raw) return { label: "", ingredients: [] };

    const separators = /\s*(?:,|;|\+|\||\n|\bavec\b|\bwith\b)\s*/i;
    const parts = raw.split(separators).map(x => x.trim()).filter(Boolean);
    if (parts.length <= 1) return { label: raw, ingredients: [] };

    return {
      label: parts[0],
      ingredients: U.unique(parts.slice(1).map(normalizeIngredient).filter(x => x.length > 1))
    };
  }

  function ingredientStats(ingredients = {}, occurrences = 0) {
    return Object.entries(ingredients)
      .map(([name, count]) => ({
        name,
        count: Number(count) || 0,
        probability: occurrences ? Number(((Number(count) || 0) / occurrences).toFixed(2)) : 0
      }))
      .sort((a, b) => b.probability - a.probability || b.count - a.count || a.name.localeCompare(b.name));
  }

  function classifyIngredients(memory) {
    const stats = ingredientStats(memory.ingredients, memory.occurrences);
    return {
      always: stats.filter(x => x.probability >= 0.85),
      often: stats.filter(x => x.probability >= 0.5 && x.probability < 0.85),
      sometimes: stats.filter(x => x.probability >= 0.2 && x.probability < 0.5),
      rare: stats.filter(x => x.probability < 0.2)
    };
  }

  function computeConfidence(memory, settings = DEFAULTS) {
    const occurrences = Number(memory?.occurrences) || 0;
    if (!occurrences) return 0;
    const repetition = Math.min(1, occurrences / 8);
    const aliases = Math.min(1, (memory.aliases?.length || 1) / 3);
    const ingredientCount = Object.keys(memory.ingredients || {}).length;
    const ingredientEvidence = ingredientCount ? Math.min(1, ingredientCount / 4) : 0.45;
    const confidence = 0.18 + repetition * 0.57 + aliases * 0.08 + ingredientEvidence * 0.17;
    return Number(Math.min(0.99, confidence).toFixed(2));
  }

  function canonicalMemory(input = {}) {
    const label = String(input.label || input.name || input.description || "").trim();
    const normalizedLabel = normalizeLabel(input.normalizedLabel || label);
    return {
      id: input.id || uid(),
      label: label || normalizedLabel || "Repas appris",
      normalizedLabel,
      aliases: U.unique([normalizedLabel, ...(input.aliases || []).map(normalizeLabel)].filter(Boolean)),
      mealTypes: { ...(input.mealTypes || {}) },
      ingredients: { ...(input.ingredients || {}) },
      occurrences: Number(input.occurrences) || 0,
      confidence: Number(input.confidence) || 0,
      firstSeenAt: input.firstSeenAt || nowIso(),
      lastSeenAt: input.lastSeenAt || nowIso(),
      sourceMealIds: U.unique(input.sourceMealIds || []).slice(-50),
      isForgotten: Boolean(input.isForgotten),
      metadata: { ...(input.metadata || {}) }
    };
  }

  function emptyState(settings = {}) {
    return {
      version: VERSION,
      settings: { ...DEFAULTS, ...settings },
      memories: [],
      updatedAt: nowIso()
    };
  }

  function migrateState(raw, settings = {}) {
    if (!raw || typeof raw !== "object") return emptyState(settings);
    const state = emptyState({ ...(raw.settings || {}), ...settings });
    state.memories = (Array.isArray(raw.memories) ? raw.memories : []).map(canonicalMemory);
    state.updatedAt = raw.updatedAt || nowIso();
    return state;
  }

  function createStore(initialState = null, options = {}) {
    let state = migrateState(initialState, options);

    function findByLabel(label) {
      const normalized = normalizeLabel(label);
      if (!normalized) return null;
      return state.memories.find(memory => !memory.isForgotten && (
        memory.normalizedLabel === normalized ||
        memory.aliases.includes(normalized)
      )) || null;
    }

    function findBest(text, options = {}) {
      const normalized = U.normalize(text);
      if (!normalized) return null;
      const candidates = state.memories
        .filter(memory => !memory.isForgotten && memory.occurrences >= (options.minimumOccurrences ?? state.settings.minimumOccurrences))
        .map(memory => {
          const aliases = U.unique([memory.normalizedLabel, ...(memory.aliases || [])]).filter(Boolean);
          const exact = aliases.some(alias => normalized === alias);
          const contained = aliases.some(alias => U.containsTerm(normalized, alias));
          const tokenOverlap = Math.max(0, ...aliases.map(alias => {
            const tokens = U.words(alias);
            return tokens.length ? tokens.filter(token => U.words(normalized).includes(token)).length / tokens.length : 0;
          }));
          const score = exact ? 1 : contained ? 0.9 : tokenOverlap >= 0.75 ? 0.72 + tokenOverlap * 0.16 : 0;
          return { memory, score: Number(score.toFixed(2)) };
        })
        .filter(x => x.score > 0)
        .sort((a, b) => b.score - a.score || b.memory.confidence - a.memory.confidence);
      if (!candidates.length) return null;
      const best = candidates[0];
      return {
        ...clone(best.memory),
        matchConfidence: best.score,
        ingredientGroups: classifyIngredients(best.memory),
        isReliable: best.memory.confidence >= state.settings.reliableConfidence
      };
    }

    function learnMeal(meal = {}, analysis = null, options = {}) {
      const description = String(meal.description || meal.name || meal.text || "").trim();
      if (!description) return { learned: false, reason: "empty-description", memory: null };

      const parsed = splitMealText(description);
      const recipe = analysis?.recipes?.[0] || null;
      const inferredLabel = recipe?.aliases?.find(alias => U.containsTerm(description, alias)) || recipe?.id || parsed.label || description;
      const normalizedLabel = normalizeLabel(inferredLabel);
      if (!normalizedLabel) return { learned: false, reason: "empty-label", memory: null };

      let memory = findByLabel(normalizedLabel);
      const created = !memory;
      if (!memory) {
        memory = canonicalMemory({ label: parsed.label || inferredLabel, normalizedLabel });
        state.memories.push(memory);
      }

      const aliases = [normalizedLabel, normalizeLabel(parsed.label), normalizeLabel(description)];
      recipe?.aliases?.forEach(alias => aliases.push(normalizeLabel(alias)));
      memory.aliases = U.unique([...(memory.aliases || []), ...aliases.filter(Boolean)]).slice(0, 20);
      memory.occurrences += 1;
      memory.lastSeenAt = meal.updatedAt || meal.createdAt || nowIso();
      memory.firstSeenAt = memory.firstSeenAt || memory.lastSeenAt;
      if (meal.id) memory.sourceMealIds = U.unique([...(memory.sourceMealIds || []), meal.id]).slice(-50);
      if (meal.type) memory.mealTypes[meal.type] = (Number(memory.mealTypes[meal.type]) || 0) + 1;

      const ingredients = U.unique([
        ...parsed.ingredients,
        ...(analysis?.foods || []).map(item => normalizeIngredient(item.food?.names?.["fr-CA"] || item.matchedAlias || item.id)).filter(Boolean)
      ]);
      ingredients.forEach(name => { memory.ingredients[name] = (Number(memory.ingredients[name]) || 0) + 1; });

      memory.confidence = computeConfidence(memory, state.settings);
      memory.metadata.lastAnalysisConfidence = Number(analysis?.confidence) || null;
      memory.metadata.lastUnknownWords = Array.isArray(analysis?.unknownWords) ? analysis.unknownWords.slice(0, 20) : [];
      state.updatedAt = nowIso();

      if (state.memories.length > state.settings.maximumMemories) {
        state.memories.sort((a, b) => new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
        state.memories = state.memories.slice(0, state.settings.maximumMemories);
      }

      return { learned: true, created, memory: clone(memory) };
    }

    function learnMany(meals = [], parseMeal = null, options = {}) {
      const results = [];
      for (const meal of meals) {
        const analysis = typeof parseMeal === "function" ? parseMeal(meal.description || meal.name || meal.text || "", { ...options, memory: false }) : null;
        results.push(learnMeal(meal, analysis, options));
      }
      return { learnedCount: results.filter(x => x.learned).length, results, state: exportState() };
    }

    function forget(idOrLabel) {
      const normalized = normalizeLabel(idOrLabel);
      const memory = state.memories.find(x => x.id === idOrLabel || x.normalizedLabel === normalized || x.aliases.includes(normalized));
      if (!memory) return false;
      memory.isForgotten = true;
      memory.lastSeenAt = nowIso();
      state.updatedAt = nowIso();
      return true;
    }

    function restore(idOrLabel) {
      const normalized = normalizeLabel(idOrLabel);
      const memory = state.memories.find(x => x.id === idOrLabel || x.normalizedLabel === normalized || x.aliases.includes(normalized));
      if (!memory) return false;
      memory.isForgotten = false;
      state.updatedAt = nowIso();
      return true;
    }

    function rename(id, label) {
      const memory = state.memories.find(x => x.id === id);
      const normalized = normalizeLabel(label);
      if (!memory || !normalized) return false;
      memory.aliases = U.unique([memory.normalizedLabel, ...(memory.aliases || [])]);
      memory.label = String(label).trim();
      memory.normalizedLabel = normalized;
      memory.aliases = U.unique([normalized, ...memory.aliases]);
      state.updatedAt = nowIso();
      return true;
    }

    function list(options = {}) {
      return state.memories
        .filter(memory => options.includeForgotten || !memory.isForgotten)
        .map(memory => ({ ...clone(memory), ingredientGroups: classifyIngredients(memory) }))
        .sort((a, b) => b.occurrences - a.occurrences || new Date(b.lastSeenAt) - new Date(a.lastSeenAt));
    }

    function exportState() { return clone(state); }
    function replaceState(next) { state = migrateState(next, options); return exportState(); }

    return Object.freeze({
      version: VERSION,
      learnMeal,
      learnMany,
      findByLabel: label => { const value = findByLabel(label); return value ? clone(value) : null; },
      findBest,
      list,
      forget,
      restore,
      rename,
      exportState,
      replaceState,
      diagnostics: () => ({ version: VERSION, memories: state.memories.length, active: state.memories.filter(x => !x.isForgotten).length })
    });
  }

  function loadLocal(storage = globalThis.localStorage, options = {}) {
    try {
      const raw = storage?.getItem(options.storageKey || DEFAULTS.storageKey);
      return createStore(raw ? JSON.parse(raw) : null, options);
    } catch (error) {
      console.warn("EnergieBrain Memory: lecture locale impossible", error);
      return createStore(null, options);
    }
  }

  function saveLocal(store, storage = globalThis.localStorage, options = {}) {
    try {
      storage?.setItem(options.storageKey || DEFAULTS.storageKey, JSON.stringify(store.exportState()));
      return true;
    } catch (error) {
      console.warn("EnergieBrain Memory: sauvegarde locale impossible", error);
      return false;
    }
  }

  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.memory = Object.freeze({
    version: VERSION,
    defaults: DEFAULTS,
    createStore,
    loadLocal,
    saveLocal,
    splitMealText,
    normalizeLabel,
    classifyIngredients,
    computeConfidence
  });
})();
