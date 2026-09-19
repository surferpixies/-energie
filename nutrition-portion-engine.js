(function (root) {
  "use strict";

  const FRACTIONS = {
    "¼": 0.25,
    "½": 0.5,
    "¾": 0.75,
    "⅓": 1 / 3,
    "⅔": 2 / 3,
    "⅛": 0.125,
    "⅜": 0.375,
    "⅝": 0.625,
    "⅞": 0.875,
  };

  function normalize(value) {
    return String(value || "")
      .toLocaleLowerCase("fr-CA")
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/œ/g, "oe")
      .replace(/æ/g, "ae")
      .replace(/[’']/g, " ")
      .replace(/[-–—]/g, " ")
      .replace(/\s+/g, " ")
      .trim();
  }

  function number(value) {
    const text = String(value || "").trim().replace(",", ".");
    if (FRACTIONS[text] != null) return FRACTIONS[text];
    const mixedUnicode = text.match(/^(\d+)\s*([¼½¾⅓⅔⅛⅜⅝⅞])$/);
    if (mixedUnicode) return Number(mixedUnicode[1]) + FRACTIONS[mixedUnicode[2]];
    const mixed = text.match(/^(\d+)\s+(\d+)\s*\/\s*(\d+)$/);
    if (mixed) return Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3]);
    const fraction = text.match(/^(\d+)\s*\/\s*(\d+)$/);
    if (fraction) return Number(fraction[2]) ? Number(fraction[1]) / Number(fraction[2]) : null;
    const parsed = Number(text);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }

  function unit(value) {
    const clean = normalize(value).replace(/\./g, "");
    if (/^(g|gramme|grammes|gram|grams)$/.test(clean)) return "g";
    if (/^(kg|kilogramme|kilogrammes)$/.test(clean)) return "kg";
    if (/^(ml|millilitre|millilitres)$/.test(clean)) return "ml";
    if (/^(l|litre|litres)$/.test(clean)) return "l";
    if (/^(tasse|tasses|cup|cups)$/.test(clean)) return "cup";
    if (/^(c a soupe|cuillere a soupe|cuilleres a soupe|tbsp)$/.test(clean)) return "tbsp";
    if (/^(c a the|cuillere a the|cuilleres a the|tsp)$/.test(clean)) return "tsp";
    if (/^(tranche|tranches|slice|slices)$/.test(clean)) return "slice";
    if (/^(bol|bols|bowl|bowls)$/.test(clean)) return "bowl";
    if (/^(portion|portions|serving|servings)$/.test(clean)) return "portion";
    if (/^(pot|pots|contenant|contenants|container|containers)$/.test(clean)) return "container";
    if (/^(paquet|paquets|sachet|sachets|package|packages)$/.test(clean)) return "package";
    if (/^(pointe|pointes)$/.test(clean)) return "slice";
    if (/^(morceau|morceaux|piece|pieces)$/.test(clean)) return "item";
    return null;
  }

  function normalizedQuantity(value, rawUnit) {
    const amount = number(value), canonical = unit(rawUnit);
    if (amount == null || !canonical) return null;
    if (canonical === "kg") return { value: amount * 1000, unit: "g" };
    if (canonical === "l") return { value: amount * 1000, unit: "ml" };
    return { value: amount, unit: canonical };
  }

  const NUMBER = "(\\d+(?:[.,]\\d+)?|\\d+\\s+\\d+\\s*\\/\\s*\\d+|\\d+\\s*\\/\\s*\\d+|\\d*\\s*[¼½¾⅓⅔⅛⅜⅝⅞])";
  const MEASURE_UNIT = "(kg|kilogrammes?|g|grammes?|grams?|ml|millilitres?|l|litres?|tasses?|cups?|c\\.?\\s*a\\s*soupe|cuilleres?\\s*a\\s*soupe|tbsp|c\\.?\\s*a\\s*the|cuilleres?\\s*a\\s*the|tsp)";
  const COUNT_UNIT = "(tranches?|slices?|bols?|bowls?|portions?|servings?|pots?|contenants?|containers?|paquets?|sachets?|packages?|pointes?|morceaux|pieces?)";

  function quantityFromText(text) {
    const raw = normalize(text);
    const wordFraction = raw.match(/\b(une?\s+demi(?:e)?|demi(?:e)?|un\s+quart|trois\s+quarts)\s+(tasses?|cups?|portions?|bols?)\b/);
    if (wordFraction) {
      const amount = /trois\s+quarts/.test(wordFraction[1])
        ? 0.75
        : /quart/.test(wordFraction[1])
          ? 0.25
          : 0.5;
      return normalizedQuantity(String(amount), wordFraction[2]);
    }
    const measured = raw.match(new RegExp(`${NUMBER}\\s*${MEASURE_UNIT}\\b`, "i"));
    if (measured) return normalizedQuantity(measured[1], measured[2]);
    const counted = raw.match(new RegExp(`${NUMBER}\\s*${COUNT_UNIT}\\b`, "i"));
    if (counted) return normalizedQuantity(counted[1], counted[2]);
    const leadingCount = raw.match(new RegExp(`^${NUMBER}(?=\\s+[a-z])`, "i"));
    const amount = leadingCount ? number(leadingCount[1]) : null;
    return amount == null ? null : { value: amount, unit: "item" };
  }

  function quantityOnlyFromText(text) {
    const raw = normalize(text);
    const numeric = new RegExp(`^${NUMBER}\\s*(?:${MEASURE_UNIT}|${COUNT_UNIT})$`, "i");
    const words = /^(?:une?\s+demi(?:e)?|demi(?:e)?|un\s+quart|trois\s+quarts)\s+(?:tasses?|cups?|portions?|bols?)$/i;
    return numeric.test(raw) || words.test(raw);
  }

  function referenceQuantity(portion) {
    const explicit = quantityFromText(portion);
    if (explicit) return explicit;
    const raw = normalize(portion);
    const leading = raw.match(new RegExp(`^${NUMBER}(?=\\s|$)`, "i"));
    const amount = leading ? number(leading[1]) : null;
    return amount == null ? null : { value: amount, unit: "item" };
  }

  function sizeMultiplier(text) {
    const raw = normalize(text).replace(/^(?:\d+(?:[.,]\d+)?|\d+\s*\/\s*\d+|[¼½¾⅓⅔⅛⅜⅝⅞])\s+/, "");
    if (/^(?:une?\s+)?demi(?:e)?(?:\s+portion)?\b|^(?:la\s+)?moitie\b/.test(raw)) return 0.5;
    if (/^(?:une?\s+)?(?:petit|petite)\b/.test(raw)) return 0.75;
    if (/^(?:une?\s+)?(?:grand|grande|genereux|genereuse)\b/.test(raw)) return 1.25;
    return 1;
  }

  function foodTags(food) {
    return (food?.tags || []).map(normalize);
  }

  function inferredGramsPerPortion(food, reference) {
    const direct = Number(food?.gramsPerPortion);
    if (direct > 0) return direct;
    if (!reference) return null;
    const tags = foodTags(food), portion = normalize(food?.portion), key = normalize(food?.keys?.[0]);
    const count = reference.value || 1;
    if (reference.unit === "tbsp") return 15 * count;
    if (reference.unit === "tsp") return 5 * count;
    if (reference.unit === "slice") return 30 * count;
    if (reference.unit === "cup") {
      if (tags.includes("fruit")) return 150 * count;
      if (tags.includes("legume")) return 150 * count;
      if (tags.includes("feculent")) return 190 * count;
      if (tags.includes("produit laitier")) return 245 * count;
      if (tags.includes("proteine")) return 170 * count;
      return 200 * count;
    }
    if (reference.unit === "bowl") return 350 * count;
    if (reference.unit === "container") return 175 * count;
    if (reference.unit === "portion") return 300 * count;
    if (reference.unit === "item") {
      if (/\b(oeuf|egg)\b/.test(key)) return 50 * count;
      if (tags.includes("fruit")) return 150 * count;
      if (tags.includes("legume")) return 150 * count;
      if (/\b(muffin|croissant|bagel)\b/.test(key)) return 85 * count;
    }
    if (/\btranche/.test(portion)) return 30 * count;
    return null;
  }

  function compatibleUnits(entered, reference) {
    if (!entered || !reference) return false;
    if (entered.unit === reference.unit) return true;
    // Un nombre placé devant le nom de l’aliment peut représenter des unités,
    // mais ne doit jamais transformer « 1 pizza » en « 1 pointe de pizza ».
    return entered.unit === "item" && reference.unit === "portion";
  }

  function scaleForSegment(segment, food) {
    const entered = quantityFromText(segment), explicitReference = referenceQuantity(food?.portion),
      size = sizeMultiplier(segment);
    let reference = explicitReference;
    if (!reference && Number(food?.gramsPerPortion) > 0)
      reference = { value: Number(food.gramsPerPortion), unit: "g" };
    if (entered?.unit === "g" && reference?.unit !== "g") {
      const grams = inferredGramsPerPortion(food, reference);
      if (grams > 0) {
        const scale = entered.value / grams * size;
        return Number.isFinite(scale) && scale > 0 && scale <= 20
          ? { scale, quantityUsed: true, approximate: !(Number(food?.gramsPerPortion) > 0) }
          : { scale: size, quantityUsed: size !== 1, approximate: true };
      }
    }
    if (!entered || !reference || !compatibleUnits(entered, reference) || reference.value <= 0)
      return { scale: size, quantityUsed: size !== 1, approximate: size !== 1 };
    const scale = entered.value / reference.value * size;
    return Number.isFinite(scale) && scale > 0 && scale <= 20
      ? { scale, quantityUsed: true, approximate: false }
      : { scale: size, quantityUsed: size !== 1, approximate: true };
  }

  function scaleForDish(text, referenceFood) {
    const entered = quantityFromText(text), size = sizeMultiplier(text);
    if (referenceFood) {
      const scaled = scaleForSegment(text, referenceFood);
      if (scaled.quantityUsed) {
        const amount = entered?.value;
        return {
          ...scaled,
          basis: entered?.unit === "g"
            ? `${Math.round(amount)} g · conversion de portion${scaled.approximate ? " approximative" : ""}`
            : `quantité indiquée${scaled.approximate ? " · conversion approximative" : ""}`,
        };
      }
    }
    if (entered?.unit === "g") {
      const scale = entered.value / 350 * size;
      return { scale, quantityUsed: true, approximate: true, basis: `${Math.round(entered.value)} g · portion-type approximative de 350 g` };
    }
    if (entered && ["portion", "bowl"].includes(entered.unit)) {
      const scale = entered.value * size;
      return { scale, quantityUsed: true, approximate: false, basis: `${entered.value.toLocaleString("fr-CA")} portion${entered.value > 1 ? "s" : ""}` };
    }
    if (size !== 1)
      return { scale: size, quantityUsed: true, approximate: true, basis: size < 1 ? "petite portion" : "portion généreuse" };
    return { scale: 1, quantityUsed: false, approximate: true, basis: "portion habituelle" };
  }

  const api = {
    number,
    unit,
    quantityFromText,
    quantityOnlyFromText,
    referenceQuantity,
    sizeMultiplier,
    inferredGramsPerPortion,
    scaleForSegment,
    scaleForDish,
  };
  root.ENERGIE_NUTRITION_PORTIONS = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
