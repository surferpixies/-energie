(function (root) {
  "use strict";

  const catalog = Array.isArray(root.ENERGIE_CNF_CATALOG) ? root.ENERGIE_CNF_CATALOG : [];

  const normalize = (value) => String(value || "")
    .toLocaleLowerCase("fr-CA")
    .replace(/œ/g, "oe")
    .replace(/æ/g, "ae")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  // La recherche FCÉN est appelée plusieurs fois pendant une même frappe
  // (reconnaissance, composition, calories). Ces caches gardent exactement
  // le même résultat tout en évitant de retraiter des milliers de fiches.
  const descriptorCache = new WeakMap();
  const rowMetaCache = new WeakMap();
  const stateCache = new Map();
  const findCache = new Map();

  const stateWords = {
    raw: ["cru", "crue", "crus", "crues", "raw"],
    cooked: ["cuit", "cuite", "cuits", "cuites", "cooked"],
    boiled: ["bouilli", "bouillie", "boiled"],
    fried: ["frit", "frite", "fried"],
    baked: ["four", "grille", "grillee", "baked", "broiled", "roasted", "roti", "rotie"],
    canned: ["conserve", "canned"],
    dried: ["sec", "secs", "seche", "sechee", "seches", "sechees", "dry", "dried", "dehydrate", "dehydrated"],
    frozen: ["surgele", "surgelee", "frozen"],
  };

  function stripQuantity(text) {
    return normalize(text)
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|gramme|grammes|grams|ml|millilitre|millilitres|l|litre|litres|tasse|tasses|cup|cups|tbsp|tsp)\b/g, " ")
      // A natural count at the beginning is quantity, not part of the food name.
      .replace(/^(?:\d+(?:[.,]\d+)?|un|une|one|deux|two|trois|three|quatre|four|cinq|five|six|sept|seven|huit|eight|neuf|nine|dix|ten)\s+/, "")
      // "filet(s) de X" describes the cut/portion. X must drive the FCÉN match.
      // Run this AFTER removing the leading count: "2 filets de sole" -> "sole".
      .replace(/^(?:filet|filets|fillet|fillets)\s+(?:de|des|du|d|of)\s+/, "")
      .replace(/\b(?:de|des|du|d|un|une|le|la|les)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  // Contrat commun FCÉN/Ciqual : tout terme alimentaire supplémentaire
  // doit être écrit. Seuls les descripteurs neutres de la fiche sont permis.
  const neutralWords = new Set(("rouge verte vert jaune mure mur moyenne durant toute annee ronde cerise orange cru crue cuit cuite frais fraiche raw cooked fresh poisson fish fruit legume vegetable aliment moyen toutes variete varietes espece especes peau pelure sans avec et ou a au aux de du des le la les en entier entiere tranche tranches morceau morceaux partie comestible pulpe chair graine graines pepin pepins removed skin peeled average all varieties species edible portion water eau egoutte egouttee drained bouilli bouillie boiled roti rotie roasted grille grillee baked broiled conserve canned enrichi enriched surgele surgelee frozen sec secs dry seche sechee dried non prepare preparee preparation sel salt ajoute ajoutee added teneur matiere grasse gras fat pour cent percent mg g ml" ).split(" "));
  const foodTokenCache = new Map();
  const foodTokens = value => {
    const key = String(value || "");
    if (foodTokenCache.has(key)) return foodTokenCache.get(key);
    const tokens = stripQuantity(key).split(" ")
    .map(word => word.length > 3 && word.endsWith("s") ? word.slice(0, -1) : word)
    // Formes de pâtes nature : une précision de forme n'ajoute aucun ingrédient.
    .map(word => ["spaghetti", "macaroni", "pasta", "pate"].includes(word) ? "pate" : word)
    .filter(Boolean);
    if (foodTokenCache.size > 20000) foodTokenCache.clear();
    foodTokenCache.set(key, tokens);
    return tokens;
  };
  function isCandidateAllowed(text, name, { allowPreparationChoice = false } = {}) {
    const query = new Set(foodTokens(text));
    const tokens = foodTokens(String(name).split(" · ")[0]);
    const preparation = ["seche", "sechee", "sec", "dry", "dried", "dehydrate", "deshydrate", "conserve", "canned", "frit", "frite", "fried", "roti", "rotie", "roasted", "bouilli", "bouillie", "boiled", "cuit", "cuite", "cooked", "huile", "oil"];
    if (!allowPreparationChoice && tokens.some(word => preparation.includes(word) && !query.has(word))) {
      const wanted = states(text), candidate = states(name);
      if (!wanted.length || !wanted.some(state => candidate.includes(state))) return false;
    }
    return tokens.length > 0 && tokens.every(word => query.has(word) || neutralWords.has(word));
  }
  function requiresClarification(text) {
    const query = stripQuantity(text);
    // Le poids sec/cuit et la conservation changent fortement les apports.
    return /\b(pates?|spaghettis?|macaronis?|pasta|riz|rice|poulet|chicken|thon|tuna)\b/.test(query) &&
      !/\b(cru[e]?s?|cuit[e]?s?|cooked|raw|secs?|seche[e]?s?|dry|dried|bouilli[e]?s?|boiled|roti[e]?s?|grille[e]?s?|roasted|conserve|canned|eau|water|huile|oil)\b/.test(query);
  }

  function naturalCount(text) {
    if (quantityKind(text)) return null;
    const match = normalize(text).match(/^(\d+(?:[.,]\d+)?|un|une|one|deux|two|trois|three)\s+/);
    if (!match) return null;
    const words = { un: 1, une: 1, one: 1, deux: 2, two: 2, trois: 3, three: 3 };
    const count = words[match[1]] ?? Number(match[1]);
    return Number.isFinite(count) && count > 0 ? count : null;
  }

  function quantityKind(text) {
    const n = normalize(text);
    if (/\b(?:kg|g|gramme|grammes|grams)\b/.test(n)) return "g";
    if (/\b(?:tasse|tasses|cup|cups)\b/.test(n)) return "cup";
    if (/\b(?:c a soupe|cuillere a soupe|cuilleres a soupe|tbsp)\b/.test(n)) return "tbsp";
    if (/\b(?:c a the|cuillere a the|cuilleres a the|tsp)\b/.test(n)) return "tsp";
    if (/\b(?:ml|millilitre|millilitres)\b/.test(n)) return "ml";
    return null;
  }

  function states(text) {
    const n = normalize(text);
    if (stateCache.has(n)) return stateCache.get(n);
    const result = Object.entries(stateWords)
      .filter(([, words]) => words.some((word) => (` ${n} `).includes(` ${word} `)))
      .map(([key]) => key);
    if (stateCache.size > 500) stateCache.clear();
    stateCache.set(n, result);
    return result;
  }

  function stateCompatibility(wanted, candidate) {
    if (!wanted.length) return { bonus: candidate.includes("raw") ? 55 : -candidate.length * 18 };
    // « cuit » est volontairement générique : bouilli, frit, rôti, etc. sont
    // tous des aliments cuits. Une préparation précise reste, elle, prioritaire.
    if (wanted.includes("cooked")) {
      const cookedStates = new Set(["cooked", "boiled", "fried", "baked"]);
      return candidate.some((state) => cookedStates.has(state))
        ? { bonus: 150 }
        : { bonus: -260 };
    }
    return wanted.some((state) => candidate.includes(state))
      ? { bonus: 180 }
      : { bonus: -420 };
  }

  function descriptor(row) {
    if (row && typeof row === "object" && descriptorCache.has(row)) return descriptorCache.get(row);
    const fr = normalize(row?.[1]);
    const en = normalize(row?.[2]);
    const value = {
      fr,
      en,
      primaryFr: fr.split(" ").slice(0, fr.includes(" ") ? undefined : 1).join(" "),
      primaryEn: en.split(" ").slice(0, en.includes(" ") ? undefined : 1).join(" "),
      firstFr: normalize(String(row?.[1] || "").split(",")[0]),
      firstEn: normalize(String(row?.[2] || "").split(",")[0]),
    };
    if (row && typeof row === "object") descriptorCache.set(row, value);
    return value;
  }

  function rowSearchMeta(row) {
    if (row && typeof row === "object" && rowMetaCache.has(row)) return rowMetaCache.get(row);
    const d = descriptor(row);
    const normalizedCombined = normalize(`${row?.[1] || ""} ${row?.[2] || ""}`);
    const value = {
      descriptor: d,
      candidateText: ` ${normalizedCombined} `,
      candidateStates: states(normalizedCombined),
      frWordCount: d.fr ? d.fr.split(" ").length : 0,
    };
    if (row && typeof row === "object") rowMetaCache.set(row, value);
    return value;
  }

  function scoreRow(row, text, options = {}) {
    const query = stripQuantity(text);
    if (!query || !isCandidateAllowed(text, row?.[1], options) && !isCandidateAllowed(text, row?.[2], options)) return -Infinity;
    const meta = rowSearchMeta(row);
    const d = meta.descriptor;
    const aliases = [d.fr, d.en, d.firstFr, d.firstEn].filter(Boolean);
    let score = -Infinity;

    for (const alias of aliases) {
      if (foodTokens(query).join(" ") === foodTokens(alias).join(" ")) score = Math.max(score, alias === d.fr || alias === d.en ? 1200 : 900);
      else if ((` ${query} `).includes(` ${alias} `)) score = Math.max(score, 720 + alias.split(" ").length * 20);
      else if ((` ${alias} `).includes(` ${query} `) && query.split(" ").length >= 2) score = Math.max(score, 620 + query.split(" ").length * 20);
    }

    // Le FCÉN nomme souvent les aliments comme « Poisson, tilapia, ... ».
    // Permettre un nom simple (« tilapia ») s'il apparaît comme mot entier,
    // tout en laissant l'étape d'ambiguïté refuser les correspondances serrées.
    const queryWords = foodTokens(query).filter((word) => word.length >= 3);
    const candidateText = ` ${foodTokens(meta.candidateText).join(" ")} `;
    if (queryWords.length && queryWords.every((word) => candidateText.includes(` ${word} `))) {
      score = Math.max(score, 690 + queryWords.length * 35);
    }

    if (!Number.isFinite(score)) return score;

    const wantedStates = states(text);
    const candidateStates = meta.candidateStates;
    score += stateCompatibility(wantedStates, candidateStates).bonus;

    // Éviter qu'un aliment composé dont le nom commence par la requête
    // (ex. « pomme cannelle ») gagne contre l'aliment générique « pomme ».
    // Les cas comme « tilapia » dans « Poisson, tilapia » ne sont pas touchés.
    if (d.firstFr && d.firstFr !== query && d.firstFr.startsWith(`${query} `)) score -= 240;
    if (d.firstEn && d.firstEn !== query && d.firstEn.startsWith(`${query} `)) score -= 240;

    const qualifiers = Math.max(0, meta.frWordCount - d.firstFr.split(" ").length);
    score -= Math.min(120, qualifiers * 4);

    // Éviter de confondre l'aliment lui-même avec une partie différente
    // (ex. « navet » vs « feuilles de navet ») lorsque l'utilisateur ne
    // demande pas explicitement cette partie.
    const queryText = ` ${query} `;
    const partQualifiers = [
      ["feuille", "feuilles", "greens", "leaves"],
      ["jus", "juice"],
      ["graine", "graines", "seed", "seeds"],
      ["germe", "germes", "sprout", "sprouts"],
      ["peau", "skin"],
      ["son", "bran"],
    ];
    for (const words of partQualifiers) {
      const candidateHasPart = words.some((word) => candidateText.includes(` ${word} `));
      const queryHasPart = words.some((word) => queryText.includes(` ${word} `));
      if (candidateHasPart && !queryHasPart) score -= 220;
      else if (candidateHasPart && queryHasPart) score += 80;
    }
    return score;
  }

  function findPortion(row, kind) {
    const portions = Array.isArray(row?.[4]) ? row[4] : [];
    const wanted = kind === "cup" ? /\b250 ml\b/
      : kind === "tbsp" ? /\b15 ml\b/
      : kind === "tsp" ? /\b5 ml\b/
      : null;
    if (!wanted) return null;
    return portions.find((p) => wanted.test(normalize(`${p?.[1] || ""} ${p?.[2] || ""}`))) || null;
  }

  function scaledNutrition(nutrition, grams) {
    const scale = Number(grams) / 100;
    const out = {};
    for (const [key, value] of Object.entries(nutrition || {})) {
      const n = Number(value);
      out[key] = Number.isFinite(n) ? Math.round(n * scale * 1000) / 1000 : null;
    }
    return out;
  }

  const catalogById = new Map(catalog.map((row) => [String(row?.[0]), row]));

  function preferredCommonFood(text) {
    const n = normalize(text);

    // « salade verte » désigne normalement une salade de feuilles/laitue,
    // pas une salade composée avec vinaigrette, pâtes, fromage, etc.
    // Utiliser une laitue simple comme référence FCÉN par défaut.
    if (/\b(salade verte|green salad|salade de laitue|lettuce salad)\b/.test(n)) {
      return catalogById.get("2398") || catalogById.get("2116") || null;
    }

    const hasChicken = /\b(poulet|chicken)\b/.test(n);
    if (!hasChicken) return null;

    const hasBreast = /\b(poitrine|breast)\b/.test(n);
    const wantedStates = states(text);

    if (hasBreast) {
      if (wantedStates.includes("raw")) return catalogById.get("841") || null;
      if (wantedStates.includes("fried")) return catalogById.get("603") || null;
      if (wantedStates.includes("cooked") || wantedStates.includes("baked") || wantedStates.length === 0)
        return catalogById.get("842") || null;
    }

    if (wantedStates.includes("raw")) return catalogById.get("565") || null;
    if (wantedStates.includes("fried")) return catalogById.get("566") || null;
    if (wantedStates.includes("cooked") || wantedStates.includes("baked") || wantedStates.length === 0)
      return catalogById.get("567") || null;

    return null;
  }

  function foodFromRow(row, text, { defaultGrams = null } = {}) {
    const [id, fr, en, nutrition, portions] = row;
    const kind = quantityKind(text),
      requestedDefaultGrams =
        Number(defaultGrams) > 0 ? Number(defaultGrams) : null;

    let grams = requestedDefaultGrams || 100;
    let portion = `${grams} g`;

    if (kind !== "g" && !(kind == null && requestedDefaultGrams != null)) {
      const count = naturalCount(text);
      const countPortions = count == null ? [] : (Array.isArray(portions) ? portions : []).filter(p =>
        /^1\s/.test(normalize(p?.[1])) &&
        !/\b(ml|g|kg|tasse|cup|tbsp|tsp|bol|bowl)\b/.test(normalize(p?.[1])) &&
        /\b(fruit|oeuf|egg|tranche|slice|piece|morceau|filet|fillet)\b/.test(normalize(p?.[1])));
      const size = normalize(text).match(/\b(petit|petite|small|gros|grosse|large|moyen|moyenne|medium)\b/)?.[1];
      const selected = count != null
        ? countPortions.find(p => size ? normalize(p[1] + " " + p[2]).includes(size) : /\b(moyen|medium)\b/.test(normalize(p[1] + " " + p[2]))) || (!size ? countPortions[0] : null)
        : findPortion(row, kind);
      if (count != null && !selected) return null;
      if (selected && Number(selected[0]) > 0) {
        grams = Number(selected[0]);
        portion = kind === "cup" ? "1 tasse"
          : kind === "tbsp" ? "1 c. à soupe"
          : kind === "tsp" ? "1 c. à thé"
          : selected[1] || selected[2] || "1 portion";
      }
    }

    const n = scaledNutrition(nutrition, grams);
    return {
      keys: [fr, en].filter(Boolean),
      calories: n.calories,
      protein: n.protein,
      carbs: n.carbs,
      fat: n.fat,
      fiber: n.fiber,
      sugars: n.sugars,
      sodium: n.sodium,
      portion,
      gramsPerPortion: grams,
      tags: [],
      nutritionSource: "cnf",
      nutritionSourceLabel: "Fichier canadien sur les éléments nutritifs (FCÉN) 2026 — Santé Canada",
      cnfFoodId: String(id),
      cnfNameFr: fr,
      cnfNameEn: en,
      cnfCatalogMatch: true,
    };
  }

  function hasUnrequestedQualifier(row, text) {
    const query = ` ${normalize(text)} `;
    const candidate = rowSearchMeta(row).candidateText;
    const qualifiers = [
      ["feuille", "feuilles", "green", "greens"],
      ["congele", "congelee", "congelees", "frozen"],
      ["conserve", "canned"],
      ["seche", "sechee", "sechees", "dried", "dehydrate", "dehydrated"],
      ["sucre", "sucree", "sucrees", "sweetened", "sugar added"],
      ["jus", "juice"],
      ["ketchup", "catsup"],
      ["compote", "sauce"],
      ["granola", "cereale", "cereales", "cereal", "topping", "garniture"],
      ["chevre", "goat"],
      ["brebis", "sheep"],
      ["soya", "soy"],
      ["tofu"],
      ["grec", "greek"],
      ["sel ajoute", "with salt"],
      ["marine", "marinee", "marinated"],
    ];
    return qualifiers.some((words) =>
      words.some((word) => candidate.includes(` ${word} `)) &&
      !words.some((word) => query.includes(` ${word} `))
    );
  }

  function averageSimilarFoods(items, text) {
    if (!Array.isArray(items) || items.length < 2) return null;

    const foods = items.map(({ row }) => foodFromRow(row, text));
    if (foods.some(food => !food)) return null;
    if (naturalCount(text) != null && foods.some(food =>
        food.portion !== foods[0].portion || food.gramsPerPortion !== foods[0].gramsPerPortion)) return null;
    const nutrientKeys = ["calories", "protein", "carbs", "fat", "fiber", "sugars", "sodium"];
    const averaged = { ...foods[0] };

    for (const key of nutrientKeys) {
      const values = foods.map((food) => Number(food?.[key])).filter(Number.isFinite);
      averaged[key] = values.length
        ? Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 1000) / 1000
        : null;
    }

    const gramValues = foods.map((food) => Number(food?.gramsPerPortion)).filter(Number.isFinite);
    if (gramValues.length) {
      averaged.gramsPerPortion = Math.round((gramValues.reduce((sum, value) => sum + value, 0) / gramValues.length) * 1000) / 1000;
    }

    averaged.cnfMatchType = "average";
    averaged.cnfFoodIds = foods.map((food) => food.cnfFoodId).filter(Boolean);
    averaged.cnfNamesFr = foods.map((food) => food.cnfNameFr).filter(Boolean);
    averaged.cnfNamesEn = foods.map((food) => food.cnfNameEn).filter(Boolean);
    averaged.cnfAverageCount = foods.length;
    averaged.cnfCatalogMatch = true;
    return averaged;
  }

  function find(text) {
    if (!catalog.length || requiresClarification(text)) return null;
    const cacheKey = normalize(text);
    if (findCache.has(cacheKey)) return findCache.get(cacheKey);

    const remember = (value) => {
      if (findCache.size > 300) findCache.clear();
      findCache.set(cacheKey, value);
      return value;
    };

    // Pour certains aliments très courants, le FCÉN contient de nombreuses
    // variantes proches. Énergie choisit une référence FCÉN cuite courante par
    // défaut plutôt que de retomber sur l'ancienne base faute de pouvoir
    // départager des dizaines de fiches équivalentes.
    const preferred = preferredCommonFood(text);
    if (preferred && Number.isFinite(scoreRow(preferred, text))) {
      const normalizedText = normalize(text),
        chickenWithoutQuantity =
          /\b(poulet|chicken)\b/.test(normalizedText) &&
          quantityKind(text) == null;

      return remember(
        foodFromRow(preferred, text, {
          defaultGrams: chickenWithoutQuantity ? 100 : null,
        }),
      );
    }

    const ranked = [];
    for (const row of catalog) {
      let score = scoreRow(row, text);
      if (!Number.isFinite(score)) continue;
      const unrequestedQualifier = hasUnrequestedQualifier(row, text);
      if (unrequestedQualifier) score -= 140;
      if (score >= 600) ranked.push({ row, score, unrequestedQualifier });
    }
    if (!ranked.length) return remember(null);

    // Quand au moins une fiche correspondant au texte sans qualificatif
    // supplémentaire existe, ignorer complètement les variantes que
    // l'utilisateur n'a pas demandées (conserve, séché, soya, chèvre, etc.).
    // Elles restent disponibles si l'utilisateur les précise explicitement.
    const cleanRanked = ranked.filter((item) => !item.unrequestedQualifier);
    const candidates = cleanRanked.length ? cleanRanked : ranked;
    candidates.sort((a, b) => b.score - a.score);
    const first = candidates[0], second = candidates[1];
    if (second && first.score - second.score < 45 &&
        Math.abs(Number(first.row[3]?.calories) - Number(second.row[3]?.calories)) >
          Math.max(10, Number(first.row[3]?.calories) * 0.2)) return remember(null);
    if (second && first.score - second.score < 45) {
      const firstBase = descriptor(first.row).firstFr || descriptor(first.row).firstEn;
      const secondBase = descriptor(second.row).firstFr || descriptor(second.row).firstEn;

      if (firstBase === secondBase) {
        // Plusieurs fiches FCÉN peuvent être pratiquement équivalentes pour
        // un aliment courant (variété, pelure, coupe, etc.). Après le scoring,
        // les états/préparations explicitement demandés par l'utilisateur ont
        // déjà été favorisés et les qualificatifs non demandés pénalisés.
        // Plutôt que d'abandonner vers l'ancien repli Énergie, moyenner les
        // meilleurs candidats réellement similaires.
        const firstStates = states(`${first.row?.[1] || ""} ${first.row?.[2] || ""}`);
        const wantedStates = states(text);
        const similar = candidates.filter(({ row, score }) => {
          if (first.score - score >= 45) return false;
          const d = descriptor(row);
          const base = d.firstFr || d.firstEn;
          if (base !== firstBase || hasUnrequestedQualifier(row, text)) return false;

          // Si l'utilisateur n'a pas précisé l'état, ne mélange pas cru,
          // cuit, séché, frit, etc. dans une même moyenne. On garde le
          // groupe correspondant au meilleur candidat.
          if (!wantedStates.length) {
            const rowStates = states(`${row?.[1] || ""} ${row?.[2] || ""}`);
            if (firstStates.length || rowStates.length) {
              return firstStates.some((state) => rowStates.includes(state));
            }
          }
          return true;
        });
        const averaged = averageSimilarFoods(similar, text);
        if (averaged) return remember(averaged);
      }
    }
    return remember(foodFromRow(first.row, text));
  }

  function publicRow(row) {
    if (!row) return null;
    const portions = (Array.isArray(row?.[4]) ? row[4] : [])
      .map((portion, index) => {
        const grams = Number(portion?.[0]);
        if (!Number.isFinite(grams) || grams <= 0) return null;
        return {
          id: `portion-${index}`,
          grams,
          labelFr: String(portion?.[1] || portion?.[2] || "1 portion"),
          labelEn: String(portion?.[2] || portion?.[1] || "1 serving"),
        };
      })
      .filter(Boolean);
    return {
      id: String(row?.[0] ?? ""),
      nameFr: String(row?.[1] || ""),
      nameEn: String(row?.[2] || ""),
      portions,
    };
  }

  function preferredGuidedIds(query) {
    const q = normalize(query);
    if (["oeuf","oeufs","egg","eggs"].includes(q))
      return ["125","130","133","129","132"];
    if (["riz","rice"].includes(q))
      return ["4475","4473"];
    return [];
  }

  function search(text, limit = 12) {
    const query = stripQuantity(text);
    const max = Math.max(1, Math.min(30, Number(limit) || 12));
    if (!query || query.length < 2) return [];
    const preferred = preferredGuidedIds(query);
    const ranked = [];
    for (const row of catalog) {
      let score = scoreRow(row, text, { allowPreparationChoice: true });
      if (!Number.isFinite(score)) continue;
      if (hasUnrequestedQualifier(row, text)) score -= 140;
      if (score >= 420) ranked.push({ row, score });
    }
    ranked.sort((a, b) => {
      const ai = preferred.indexOf(String(a.row?.[0] ?? ""));
      const bi = preferred.indexOf(String(b.row?.[0] ?? ""));
      if (ai >= 0 || bi >= 0) {
        if (ai < 0) return 1;
        if (bi < 0) return -1;
        if (ai !== bi) return ai - bi;
      }
      return b.score - a.score;
    });
    const seen = new Set();
    return ranked
      .filter(({ row }) => {
        const id = String(row?.[0] ?? "");
        if (!id || seen.has(id)) return false;
        seen.add(id);
        return true;
      })
      .slice(0, max)
      .map(({ row }) => publicRow(row));
  }

  function getById(id) {
    return publicRow(catalogById.get(String(id)) || null);
  }

  function nutritionForGrams(id, grams) {
    const row = catalogById.get(String(id));
    const amount = Number(grams);
    if (!row || !Number.isFinite(amount) || amount <= 0) return null;
    const nutrition = scaledNutrition(row?.[3] || {}, amount);
    return {
      calories: nutrition.calories,
      protein: nutrition.protein,
      carbs: nutrition.carbs,
      fat: nutrition.fat,
      fiber: nutrition.fiber,
      sugars: nutrition.sugars,
      sodium: nutrition.sodium,
      source: "cnf",
      confidence: "high",
      basis: `${Math.round(amount * 10) / 10} g · ${String(row?.[1] || "aliment FCÉN")}`,
      estimated: true,
      cnfFoodId: String(row?.[0] ?? ""),
      cnfNameFr: String(row?.[1] || ""),
      cnfNameEn: String(row?.[2] || ""),
    };
  }

  const api = Object.freeze({
    version: 2,
    find,
    search,
    getById,
    nutritionForGrams,
    scoreRow,
    stripQuantity,
    quantityKind,
    isCandidateAllowed,
    requiresClarification,
    naturalCount,
  });
  root.ENERGIE_CNF_SEARCH = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
