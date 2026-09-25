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

const tokens = value => normalize(value).split(/\s+/).filter(Boolean);
const tokenSet = value => new Set(tokens(value));

const overlapScore = (a, b) => {
  const A = tokenSet(a), B = tokenSet(b);
  if (!A.size || !B.size) return 0;
  let common = 0;
  for (const t of A) if (B.has(t)) common++;
  const union = new Set([...A, ...B]).size;
  return union ? common / union : 0;
};

const undesirableGeneric = [
  "juice","jus","nectar","canned","conserve","dried","seche","sechee","seches","sechees",
  "frozen","congele","congelee","sweetened","sucre","sucree","syrup","sirop","powder","poudre",
  "babyfood","bebe","puree","concentrate","concentre","drink","boisson"
];

const rawWords = ["raw","cru","crue","frais","fraiche"];

function qualifierPenalty(alias, description) {
  const a = normalize(alias);
  const d = normalize(description);
  let p = 0;
  if (!undesirableGeneric.some(w => a.includes(w))) {
    for (const w of undesirableGeneric) if (d.includes(w)) p += 0.28;
  }
  return p;
}

function preparationAdjustment(portion, food) {
  const p = normalize(portion);
  const en = normalize(food.names?.en);
  const fr = normalize(food.names?.fr);
  const d = `${en} ${fr}`;

  const wantsCooked = /\b(cuit|cuite|cuits|cuites|cooked|boiled|steamed|braised|baked|roasted)\b/.test(p);
  const wantsRaw = /\b(cru|crue|crus|crues|raw)\b/.test(p);

  let score = 0;
  if (wantsCooked) {
    if (/\b(cuit|cuite|cuits|cuites|cooked|boiled|steamed|braised|baked|roasted)\b/.test(d)) score += 0.9;
    if (/\b(cru|crue|crus|crues|raw)\b/.test(d)) score -= 0.9;
  } else if (wantsRaw) {
    if (/\b(cru|crue|crus|crues|raw)\b/.test(d)) score += 0.6;
    if (/\b(cuit|cuite|cuits|cuites|cooked|boiled|steamed|braised|baked|roasted)\b/.test(d)) score -= 0.6;
  }

  if (/\bfrit|frite|frits|frites|fried\b/.test(d) && !/\bfrit|frite|frits|frites|fried\b/.test(p)) score -= 0.8;
  if (/\bfarine|flour\b/.test(d) && !/\bfarine|flour\b/.test(p)) score -= 0.8;
  if (/\bliquide seulement|liquid only\b/.test(d)) score -= 0.8;

  return score;
}

function candidateScore(alias, food, portion = "") {
  const a = normalize(alias);
  const en = normalize(food.names?.en);
  const fr = normalize(food.names?.fr);

  const exact = en === a || fr === a;
  const start = en.startsWith(a + " ") || fr.startsWith(a + " ");
  const contains = en.includes(a) || fr.includes(a);

  let score = Math.max(overlapScore(a, en), overlapScore(a, fr));
  if (exact) score += 3;
  else if (start) score += 1.4;
  else if (contains) score += 0.35;

  // A generic whole-food alias should prefer the plain/raw item over juices,
  // canned/sweetened/dried variants. This only affects audit ranking.
  const genericAlias = tokens(a).length <= 3 &&
    !undesirableGeneric.some(w => a.includes(w));
  if (genericAlias && rawWords.some(w => en.includes(w) || fr.includes(w))) score += 0.45;

  score -= Math.max(
    qualifierPenalty(a, en),
    qualifierPenalty(a, fr)
  );

  // Avoid false positives where a short alias appears only as part of a compound
  // food name (e.g. "apple" -> "sugar-apple").
  const firstEn = tokens(en)[0] || "";
  const firstFr = tokens(fr)[0] || "";
  const firstAlias = tokens(a)[0] || "";
  if (tokens(a).length === 1 && firstAlias && firstEn !== firstAlias && firstFr !== firstAlias && !exact)
    score -= 0.55;

  score += preparationAdjustment(portion, food);
  return score;
}

function rankCandidates(aliases, food, portion) {
  return Math.max(...aliases.map(a => candidateScore(a, food, portion)));
}

function confidenceFor(candidates) {
  if (!candidates.length) return "none";
  const best = candidates[0]?.score ?? 0;
  const second = candidates[1]?.score ?? -Infinity;
  const gap = best - second;
  if (best >= 2.5 && gap >= 0.45) return "high";
  if (best >= 1.35 && gap >= 0.2) return "medium";
  return "review";
}

const rows = legacy.map((food, index) => {
  const aliases = food.keys || [];
  const candidates = cnf
    .map(item => ({ item, score: rankCandidates(aliases, item, food.portion || "") }))
    .filter(x => x.score > 0.15)
    .sort((a, b) => b.score - a.score)
    .slice(0, 8);

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
    confidence: confidenceFor(candidates),
    candidates: candidates.map(({ item, score }) => ({
      cnfFoodId: item.cnfFoodId,
      score: Number(score.toFixed(3)),
      en: item.names?.en || "",
      fr: item.names?.fr || "",
      nutritionPer100g: item.nutritionPer100g || {},
      portions: item.portions || []
    }))
  };
});

await writeFile(path.join(outDir, "mapping-audit.json"), JSON.stringify(rows, null, 2) + "\n");

const csvEscape = value => {
  const s = String(value ?? "");
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"', '""') + '"' : s;
};
const csv = [
  ["legacy_alias","current_portion","confidence","candidate_rank","cnf_food_id","score","cnf_fr","cnf_en","kcal_100g","protein_100g","carbs_100g","fat_100g"].join(","),
  ...rows.flatMap(row => row.candidates.map((c, i) => [
    row.alias,
    row.current.portion || "",
    row.confidence,
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

const summary = rows.reduce((acc, row) => {
  acc[row.confidence] = (acc[row.confidence] || 0) + 1;
  return acc;
}, {});
await writeFile(path.join(outDir, "mapping-summary.json"), JSON.stringify(summary, null, 2) + "\n");

console.log(`Audit créé pour ${rows.length} fiches Énergie.`);
console.log(`Confiance: ${JSON.stringify(summary)}`);
console.log("Aucune substitution nutritionnelle n'est effectuée automatiquement.");
