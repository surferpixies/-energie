import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import vm from "node:vm";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const cnfPath = path.join(root, "data", "cnf-2026", "foods.json");
const legacyPath = path.join(root, "foods.js");
const outDir = path.join(root, "data", "cnf-2026");
await mkdir(outDir, { recursive: true });

const cnf = JSON.parse(await readFile(cnfPath, "utf8"));
const legacyCode = await readFile(legacyPath, "utf8");
const sandbox = { window: {} };
vm.createContext(sandbox);
vm.runInContext(legacyCode, sandbox);
const legacy = Array.isArray(sandbox.window.ENERGIE_FOODS) ? sandbox.window.ENERGIE_FOODS : [];

const normalize = value => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tokens = value => new Set(normalize(value).split(/\s+/).filter(Boolean));
const overlapScore = (a, b) => {
  const A = tokens(a), B = tokens(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  const union = new Set([...A, ...B]).size;
  return union ? common / union : 0;
};

function candidateScore(alias, food) {
  const a = normalize(alias);
  const en = normalize(food.names?.en);
  const fr = normalize(food.names?.fr);
  let score = Math.max(overlapScore(a, en), overlapScore(a, fr));
  if (en === a || fr === a) score += 2;
  else if (en.startsWith(a) || fr.startsWith(a)) score += 0.8;
  else if (en.includes(a) || fr.includes(a)) score += 0.4;
  return score;
}

const rows = legacy.map((food, index) => {
  const aliases = food.keys || [];
  const candidates = cnf
    .map(item => ({ item, score: Math.max(...aliases.map(a => candidateScore(a, item))) }))
    .filter(x => x.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

  return {
    legacyIndex: index,
    alias: aliases[0] || "",
    aliases,
    current: {
      calories: food.calories,
      protein: food.protein,
      carbs: food.carbs,
      fat: food.fat,
      portion: food.portion,
      gramsPerPortion: food.gramsPerPortion || null
    },
    candidates: candidates.map(({ item, score }) => ({
      cnfFoodId: item.cnfFoodId,
      score: Number(score.toFixed(3)),
      en: item.names?.en || "",
      fr: item.names?.fr || "",
      nutritionPer100g: item.nutritionPer100g || {}
    }))
  };
});

await writeFile(path.join(outDir, "mapping-audit.json"), JSON.stringify(rows, null, 2) + "\n");

const csvEscape = value => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
};
const csv = [
  ["legacy_alias","current_portion","candidate_rank","cnf_food_id","score","cnf_fr","cnf_en","kcal_100g","protein_100g","carbs_100g","fat_100g"].join(","),
  ...rows.flatMap(row => row.candidates.map((c, i) => [
    row.alias,
    row.current.portion || "",
    i + 1,
    c.cnfFoodId,
    c.score,
    c.fr,
    c.en,
    c.nutritionPer100g.calories ?? "",
    c.nutritionPer100g.protein ?? "",
    c.nutritionPer100g.carbs ?? "",
    c.nutritionPer100g.fat ?? ""
  ].map(csvEscape).join(",")))
].join("\n") + "\n";

await writeFile(path.join(outDir, "mapping-audit.csv"), csv);
console.log(`Audit créé pour ${rows.length} fiches Énergie.`);
console.log("À valider manuellement avant toute substitution nutritionnelle.");
