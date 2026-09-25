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
    if (!Number.isFinite(score)) return score;

    const wantedStates = states(text);
    const candidateStates = states(`${row?.[1] || ""} ${row?.[2] || ""}`);
    if (wantedStates.length) {
      if (wantedStates.some((state) => candidateStates.includes(state))) score += 180;
      else score -= 420;
    } else {
      score -= candidateStates.length * 18;
    }

    const qualifiers = Math.max(0, normalize(row?.[1]).split(" ").length - d.firstFr.split(" ").length);
    score -= Math.min(120, qualifiers * 4);
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

  function find(text) {
    if (!catalog.length) return null;
    const ranked = [];
    for (const row of catalog) {
      const score = scoreRow(row, text);
      if (Number.isFinite(score) && score >= 600) ranked.push({ row, score });
    }
    if (!ranked.length) return null;
    ranked.sort((a, b) => b.score - a.score);
    const first = ranked[0], second = ranked[1];
    if (second && first.score - second.score < 45) {
      const firstBase = descriptor(first.row).firstFr || descriptor(first.row).firstEn;
      const secondBase = descriptor(second.row).firstFr || descriptor(second.row).firstEn;
      if (firstBase === secondBase) return null;
    }
    return foodFromRow(first.row, text);
  }

  const api = Object.freeze({ version: 1, find, scoreRow, stripQuantity, quantityKind });
  root.ENERGIE_CNF_SEARCH = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
