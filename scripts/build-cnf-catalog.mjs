import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const sourcePath = path.join(root, "data", "cnf-2026", "foods.json");
const outputPath = path.join(root, "cnf-catalog.js");

const foods = JSON.parse(await readFile(sourcePath, "utf8"));

const normalize = (value) => String(value || "")
  .toLocaleLowerCase("fr-CA")
  .normalize("NFD")
  .replace(/[\u0300-\u036f]/g, "")
  .replace(/[’']/g, " ")
  .replace(/[^a-z0-9]+/g, " ")
  .replace(/\s+/g, " ")
  .trim();

function usefulPortion(p) {
  const text = normalize(`${p?.fr || ""} ${p?.en || ""}`);
  if (!Number.isFinite(Number(p?.grams)) || Number(p.grams) <= 0) return false;
  if (/refuse|non comestible|core|noyau|bone|os|skin|peau|yield|rendement/.test(text)) return false;
  return true;
}

function portionRank(p) {
  const text = normalize(`${p?.fr || ""} ${p?.en || ""}`);
  let score = 0;
  if (/^250 ml\b|\b250 ml\b/.test(text)) score += 90;
  if (/\b1 (medium|moyen|moyenne|fruit|tranche|slice|piece|morceau|barre|sandwich|fajita|oeuf|egg)\b/.test(text)) score += 80;
  if (/\b125 ml\b/.test(text)) score += 55;
  if (/\b100 ml\b/.test(text)) score += 45;
  if (/\b30 ml\b/.test(text)) score += 35;
  if (/\b15 ml\b/.test(text)) score += 25;
  if (/\b100 g\b/.test(text)) score -= 30;
  if (/guide alimentaire|food guide/.test(text)) score -= 20;
  return score;
}

const compact = foods
  .filter((food) => Number.isFinite(Number(food?.nutritionPer100g?.calories)))
  .map((food) => {
    const portions = (food.portions || [])
      .filter(usefulPortion)
      .sort((a, b) => portionRank(b) - portionRank(a))
      .slice(0, 6)
      .map((p) => [Number(p.grams), p.fr || "", p.en || ""]);
    const fr = food.names?.fr || "";
    const en = food.names?.en || "";
    return [
      String(food.cnfFoodId),
      fr,
      en,
      food.nutritionPer100g || {},
      portions,
    ];
  });

const runtime = `// Généré depuis le FCÉN 2026. Ne pas modifier à la main.
(function (root) {
  "use strict";
  root.ENERGIE_CNF_CATALOG = Object.freeze(${JSON.stringify(compact)});
  root.ENERGIE_CNF_CATALOG_META = Object.freeze({
    edition: 2026,
    source: "Health Canada / Santé Canada",
    foods: ${compact.length}
  });
  if (typeof module !== "undefined" && module.exports) module.exports = root.ENERGIE_CNF_CATALOG;
})(typeof window !== "undefined" ? window : globalThis);
`;

await writeFile(outputPath, runtime);
console.log(`Catalogue runtime FCÉN généré: ${compact.length} aliments → cnf-catalog.js`);
