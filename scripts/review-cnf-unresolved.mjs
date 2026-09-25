import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const foods = JSON.parse(await readFile(path.join(root, "data/cnf-2026/foods.json"), "utf8"));
const reviewed = JSON.parse(await readFile(path.join(root, "data/cnf-2026/mapping-reviewed.json"), "utf8"));

const normalize = value => String(value || "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();

const tokens = value => normalize(value).split(/\s+/).filter(Boolean);
const tokenSet = value => new Set(tokens(value));

const HINTS = {
  "mûres": ["blackberry raw", "mure crue", "blackberries"],
  "dattes": ["date deglet noor", "date dried", "datte sechee"],
  "laitue": ["lettuce raw", "laitue crue"],
  "asperges": ["asparagus cooked", "asperge bouillie", "asperge cuite"],
  "betterave": ["beet root cooked", "betterave racine cuite", "beet cooked"],
  "rutabaga": ["rutabaga cooked", "rutabaga bouilli"],
  "céréales": ["ready to eat cereal", "cereales pretes a manger"],
  "bacon": ["pork bacon cooked", "bacon porc cuit"],
  "thon": ["tuna canned water", "thon conserve eau", "tuna light canned"],
  "fromage à la crème": ["cream cheese regular", "fromage a la creme ordinaire"],
  "crème glacée": ["ice cream vanilla", "creme glacee vanille"],
  "barre granola": ["granola bar", "barre granola"],
  "beigne": ["doughnut plain", "beigne nature"],
  "gâteau au fromage": ["cheesecake", "gateau au fromage"],
  "smoothie": ["smoothie", "frappe smoothie"],
  "club sandwich": ["club sandwich", "sandwich club"],
  "pad thai": ["pad thai", "pad thai noodles"],
  "nuggets de poulet": ["chicken nuggets", "poulet croquette"],
  "salade de pâtes": ["pasta salad", "salade de pates"],
  "riz": ["white rice cooked", "riz blanc cuit", "rice cooked"],
  "fromage": ["cheddar cheese", "fromage cheddar"],
  "porc effiloché": ["pulled pork", "porc effiloche"],
  "fajitas": ["fajita", "fajitas"],
  "manioc": ["cassava cooked", "manioc cuit", "cassava boiled"],
  "fruits": []
};

const badGeneric = ["juice","jus","nectar","canned syrup","sirop","powder","poudre","babyfood","bebe","flour","farine","liquid only","liquide seulement"];

function scoreText(query, food) {
  const q = tokenSet(query);
  if (!q.size) return 0;
  const text = normalize(`${food.names?.en || ""} ${food.names?.fr || ""}`);
  const ft = tokenSet(text);
  let common = 0;
  for (const t of q) if (ft.has(t)) common++;
  let score = common / q.size;
  if (normalize(food.names?.en).startsWith(normalize(query)) || normalize(food.names?.fr).startsWith(normalize(query))) score += 0.8;
  if (normalize(food.names?.en).includes(normalize(query)) || normalize(food.names?.fr).includes(normalize(query))) score += 0.5;
  for (const bad of badGeneric) if (text.includes(bad) && !normalize(query).includes(bad)) score -= 0.25;
  return score;
}

const unresolved = reviewed.filter(x => !x.verified);
const output = unresolved.map(row => {
  const hints = HINTS[row.energieAlias] || [row.energieAlias];
  if (!hints.length) return {...row, reviewQueries: [], candidates: []};

  const candidates = foods
    .map(food => ({
      food,
      score: Math.max(...hints.map(q => scoreText(q, food)))
    }))
    .filter(x => x.score > 0.35)
    .sort((a,b) => b.score - a.score)
    .slice(0, 12)
    .map(({food, score}) => ({
      cnfFoodId: food.cnfFoodId,
      score: Number(score.toFixed(3)),
      fr: food.names?.fr || "",
      en: food.names?.en || "",
      nutritionPer100g: food.nutritionPer100g || {},
      portions: food.portions || []
    }));

  return {
    energieAlias: row.energieAlias,
    current: row.current,
    reviewQueries: hints,
    candidates
  };
});

await writeFile(
  path.join(root, "data/cnf-2026/mapping-review-candidates.json"),
  JSON.stringify(output, null, 2) + "\n"
);

const esc = v => {
  const s = String(v ?? "");
  return /[",\n]/.test(s) ? '"' + s.replaceAll('"','""') + '"' : s;
};
const csv = [
  ["energie_alias","current_portion","rank","cnf_food_id","score","cnf_fr","cnf_en","kcal_100g"].join(","),
  ...output.flatMap(row => row.candidates.map((c,i) => [
    row.energieAlias,
    row.current?.portion || "",
    i+1,
    c.cnfFoodId,
    c.score,
    c.fr,
    c.en,
    c.nutritionPer100g?.calories ?? ""
  ].map(esc).join(",")))
].join("\n") + "\n";

await writeFile(path.join(root, "data/cnf-2026/mapping-review-candidates.csv"), csv);

console.log(`Révision ciblée créée pour ${output.length} fiches non validées.`);
console.log("Fichiers: data/cnf-2026/mapping-review-candidates.json et .csv");
console.log("Aucune correspondance n'est validée automatiquement.");
