(function (root) {
  "use strict";

  const catalog = Array.isArray(root.ENERGIE_CNF_CATALOG) ? root.ENERGIE_CNF_CATALOG : [];

  const normalize = (value) => String(value || "")
    .toLocaleLowerCase("fr-CA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const stateWords = {
    raw: ["cru", "crue", "raw"],
    cooked: ["cuit", "cuite", "cooked"],
    boiled: ["bouilli", "bouillie", "boiled"],
    fried: ["frit", "frite", "fried"],
    baked: ["four", "grille", "grillee", "baked", "broiled", "roasted", "roti", "rotie"],
    canned: ["conserve", "canned"],
    dried: ["seche", "sechee", "dried", "dehydrate", "dehydrated"],
    frozen: ["surgele", "surgelee", "frozen"],
  };

  function stripQuantity(text) {
    return normalize(text)
      .replace(/\b\d+(?:[.,]\d+)?\s*(?:kg|g|gramme|grammes|grams|ml|millilitre|millilitres|l|litre|litres|tasse|tasses|cup|cups|tbsp|tsp)\b/g, " ")
      .replace(/\b(?:de|des|du|d|un|une|le|la|les)\b/g, " ")
      .replace(/\s+/g, " ")
      .trim();
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
    return Object.entries(stateWords)
      .filter(([, words]) => words.some((word) => n.includes(word)))
      .map(([key]) => key);
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
    const fr = normalize(row?.[1]);
    const en = normalize(row?.[2]);
    return {
      fr,
      en,
      primaryFr: fr.split(" ").slice(0, fr.includes(" ") ? undefined : 1).join(" "),
      primaryEn: en.split(" ").slice(0, en.includes(" ") ? undefined : 1).join(" "),
      firstFr: normalize(String(row?.[1] || "").split(",")[0]),
      firstEn: normalize(String(row?.[2] || "").split(",")[0]),
    };
  }

  function scoreRow(row, text) {
    const query = stripQuantity(text);
    if (!query) return -Infinity;
    const d = descriptor(row);
    const aliases = [d.fr, d.en, d.firstFr, d.firstEn].filter(Boolean);
    let score = -Infinity;

    for (const alias of aliases) {
      if (query === alias) score = Math.max(score, alias === d.fr || alias === d.en ? 1200 : 900);
      else if ((` ${query} `).includes(` ${alias} `)) score = Math.max(score, 720 + alias.split(" ").length * 20);
      else if ((` ${alias} `).includes(` ${query} `) && query.split(" ").length >= 2) score = Math.max(score, 620 + query.split(" ").length * 20);
    }

    // Le FCÉN nomme souvent les aliments comme « Poisson, tilapia, ... ».
    // Permettre un nom simple (« tilapia ») s'il apparaît comme mot entier,
    // tout en laissant l'étape d'ambiguïté refuser les correspondances serrées.
    const queryWords = query.split(" ").filter((word) => word.length >= 4);
    const candidateText = ` ${normalize(`${row?.[1] || ""} ${row?.[2] || ""}`)} `;
    if (queryWords.length && queryWords.every((word) => candidateText.includes(` ${word} `))) {
      score = Math.max(score, 690 + queryWords.length * 35);
    }

    if (!Number.isFinite(score)) return score;

    const wantedStates = states(text);
    const candidateStates = states(`${row?.[1] || ""} ${row?.[2] || ""}`);
    score += stateCompatibility(wantedStates, candidateStates).bonus;

    const qualifiers = Math.max(0, normalize(row?.[1]).split(" ").length - d.firstFr.split(" ").length);
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
    if (!wanted) return portions[0] || null;
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

  function foodFromRow(row, text) {
    const [id, fr, en, nutrition, portions] = row;
    const kind = quantityKind(text);
    let grams = 100;
    let portion = "100 g";

    if (kind !== "g") {
      const selected = findPortion(row, kind);
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
    const candidate = ` ${normalize(`${row?.[1] || ""} ${row?.[2] || ""}`)} `;
    const qualifiers = [
      ["feuille", "feuilles", "green", "greens"],
      ["congele", "congelee", "congelees", "frozen"],
      ["conserve", "canned"],
      ["seche", "sechee", "sechees", "dried", "dehydrate", "dehydrated"],
      ["sucre", "sucree", "sucrees", "sweetened", "sugar added"],
      ["jus", "juice"],
      ["compote", "sauce"],
      ["granola", "cereale", "cereales", "cereal", "topping", "garniture"],
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
    if (!catalog.length) return null;

    // Pour certains aliments très courants, le FCÉN contient de nombreuses
    // variantes proches. Énergie choisit une référence FCÉN cuite courante par
    // défaut plutôt que de retomber sur l'ancienne base faute de pouvoir
    // départager des dizaines de fiches équivalentes.
    const preferred = preferredCommonFood(text);
    if (preferred) return foodFromRow(preferred, text);

    const ranked = [];
    for (const row of catalog) {
      let score = scoreRow(row, text);
      if (!Number.isFinite(score)) continue;
      if (hasUnrequestedQualifier(row, text)) score -= 140;
      if (score >= 600) ranked.push({ row, score });
    }
    if (!ranked.length) return null;
    ranked.sort((a, b) => b.score - a.score);
    const first = ranked[0], second = ranked[1];
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
        const similar = ranked.filter(({ row, score }) => {
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
        if (averaged) return averaged;
      }
    }
    return foodFromRow(first.row, text);
  }

  const api = Object.freeze({ version: 1, find, scoreRow, stripQuantity, quantityKind });
  root.ENERGIE_CNF_SEARCH = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
