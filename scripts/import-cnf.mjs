import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "data", "cnf-2026");
await mkdir(outDir, { recursive: true });

const SOURCE = Object.freeze({
  publisher: "Health Canada / Santé Canada",
  dataset: "Canadian Nutrient File / Fichier canadien sur les éléments nutritifs",
  edition: "2026",
  licence: "Open Government Licence - Canada",
  datasetUrl: "https://open.canada.ca/data/en/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109",
  files: {
    foodNames: "https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/e1ffee62-58cb-4e3e-b359-115c658388ad/download/food_name.csv",
    nutrientAmounts: "https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/0ff718fc-1133-4154-80c5-3d619e6c63be/download/nutrient_amount.csv",
    nutrientNames: "https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/e0aca283-16b5-4eba-a54a-4994490a3262/download/nutrient_name.csv",
    measureWeights: "https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/bb76d816-3ac0-4749-8c4b-f0dbfd0fac76/download/measure_weight_conversion.csv",
    measureNames: "https://open.canada.ca/data/dataset/1b6139bd-ed7e-4043-bc28-ff00e10f3109/resource/104adbc9-f4cc-40b1-9aaa-08290648e24b/download/measure_name.csv"
  }
});

function parseCsv(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (quoted) {
      if (ch === '"' && text[i + 1] === '"') { field += '"'; i++; }
      else if (ch === '"') quoted = false;
      else field += ch;
    } else {
      if (ch === '"') quoted = true;
      else if (ch === ",") { row.push(field); field = ""; }
      else if (ch === "\n") {
        row.push(field.replace(/\r$/, ""));
        rows.push(row);
        row = []; field = "";
      } else field += ch;
    }
  }
  if (field.length || row.length) { row.push(field); rows.push(row); }
  if (!rows.length) return [];
  const headers = rows.shift().map(x => x.replace(/^\uFEFF/, "").trim());
  return rows.filter(r => r.some(v => String(v).trim() !== "")).map(values =>
    Object.fromEntries(headers.map((h, i) => [h, values[i] ?? ""]))
  );
}

const norm = s => String(s ?? "")
  .normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .toLowerCase().replace(/[^a-z0-9]+/g, "");

function getField(row, candidates) {
  const entries = Object.entries(row);
  for (const c of candidates) {
    const target = norm(c);
    const hit = entries.find(([k]) => norm(k) === target);
    if (hit) return hit[1];
  }
  return "";
}

async function fetchCsv(url, label) {
  console.log(`Téléchargement FCÉN: ${label}…`);
  const res = await fetch(url, { headers: { "User-Agent": "Energie-CNF-Importer/1.0" } });
  if (!res.ok) throw new Error(`${label}: HTTP ${res.status}`);
  return parseCsv(await res.text());
}

const [foodRows, nutrientRows, amountRows, measureWeightRows, measureNameRows] = await Promise.all([
  fetchCsv(SOURCE.files.foodNames, "noms des aliments"),
  fetchCsv(SOURCE.files.nutrientNames, "noms des nutriments"),
  fetchCsv(SOURCE.files.nutrientAmounts, "teneurs en nutriments"),
  fetchCsv(SOURCE.files.measureWeights, "conversions mesures/poids"),
  fetchCsv(SOURCE.files.measureNames, "noms des mesures")
]);

const nutrientMeta = new Map();
for (const row of nutrientRows) {
  const id = getField(row, ["NutrientID", "Nutrient Id", "Nutrient_ID", "Nutrient Code"]);
  if (!id) continue;
  nutrientMeta.set(String(id), {
    id: String(id),
    en: getField(row, ["NutrientName", "Nutrient Name", "NutrientNameE", "Nutrient Name English"]),
    fr: getField(row, ["NutrientNameF", "Nutrient Name French", "Nom de l'élément nutritif"]),
    unit: getField(row, ["Unit", "UnitName", "Unit Name"])
  });
}

function nutrientKind(meta) {
  const text = norm(`${meta.en} ${meta.fr}`);
  const unit = norm(meta.unit);
  if ((text.includes("energy") || text.includes("energie")) && (unit.includes("kcal") || text.includes("kcal"))) return "calories";
  if (text.includes("protein") || text.includes("proteine")) return "protein";
  if (text.includes("carbohydrate") || text.includes("glucide")) return "carbs";
  if ((text.includes("fat") || text.includes("lipide") || text.includes("gras")) && !text.includes("fattyacid")) return "fat";
  if (text.includes("fibre") || text.includes("fiber")) return "fiber";
  if (text.includes("sugar") || text.includes("sucre")) return "sugars";
  if (text.includes("sodium")) return "sodium";
  if (text.includes("potassium")) return "potassium";
  if (text.includes("calcium")) return "calcium";
  if (text === "iron" || text.includes("fer")) return "iron";
  return null;
}

const selectedNutrients = new Map();
for (const meta of nutrientMeta.values()) {
  const kind = nutrientKind(meta);
  if (kind && !selectedNutrients.has(kind)) selectedNutrients.set(kind, meta.id);
}

const amountsByFood = new Map();
for (const row of amountRows) {
  const foodId = String(getField(row, ["FoodID", "Food Id", "Food_ID"]));
  const nutrientId = String(getField(row, ["NutrientID", "Nutrient Id", "Nutrient_ID"]));
  if (!foodId || !nutrientId) continue;
  const kind = [...selectedNutrients.entries()].find(([, id]) => id === nutrientId)?.[0];
  if (!kind) continue;
  const raw = getField(row, ["NutrientValue", "Nutrient Value", "Amount", "Value"]);
  const value = Number(String(raw).replace(",", "."));
  if (!Number.isFinite(value)) continue;
  if (!amountsByFood.has(foodId)) amountsByFood.set(foodId, {});
  amountsByFood.get(foodId)[kind] = value;
}

const measuresByFood = new Map();
for (const row of measureWeightRows) {
  const foodId = String(getField(row, ["FoodID", "Food Id", "Food_ID"]));
  if (!foodId) continue;
  const grams = Number(String(getField(row, ["WeightInGrams", "Weight in Grams", "Weight", "GramWeight"])).replace(",", "."));
  const measureId = String(getField(row, ["MeasureID", "Measure Id", "Measure_ID"]));
  if (!Number.isFinite(grams) || grams <= 0) continue;
  if (!measuresByFood.has(foodId)) measuresByFood.set(foodId, []);
  measuresByFood.get(foodId).push({ measureId, grams });
}

const measureNames = new Map();
for (const row of measureNameRows) {
  const id = String(getField(row, ["MeasureID", "Measure Id", "Measure_ID"]));
  if (!id) continue;
  measureNames.set(id, {
    en: getField(row, ["MeasureName", "Measure Name", "MeasureNameE", "Measure Name English"]),
    fr: getField(row, ["MeasureNameF", "Measure Name French", "Nom de la mesure"])
  });
}

const foods = [];
for (const row of foodRows) {
  const id = String(getField(row, ["FoodID", "Food Id", "Food_ID", "Food Code"]));
  if (!id) continue;
  const en = getField(row, ["FoodDescription", "Food Description", "FoodName", "Food Name", "FoodDescriptionE"]);
  const fr = getField(row, ["FoodDescriptionF", "Food Description French", "FoodNameF", "Nom de l'aliment"]);
  const nutrition = amountsByFood.get(id) || {};
  const portions = (measuresByFood.get(id) || []).slice(0, 20).map(p => ({
    grams: p.grams,
    en: measureNames.get(p.measureId)?.en || "",
    fr: measureNames.get(p.measureId)?.fr || ""
  }));
  foods.push({
    cnfFoodId: id,
    names: { en, fr },
    nutritionPer100g: nutrition,
    portions
  });
}

foods.sort((a, b) => Number(a.cnfFoodId) - Number(b.cnfFoodId));

const metadata = {
  ...SOURCE,
  importedAt: new Date().toISOString(),
  counts: {
    foods: foods.length,
    nutrientNames: nutrientRows.length,
    nutrientAmounts: amountRows.length,
    measureWeights: measureWeightRows.length
  },
  selectedNutrients: Object.fromEntries(selectedNutrients)
};

await writeFile(path.join(outDir, "metadata.json"), JSON.stringify(metadata, null, 2) + "\n");
await writeFile(path.join(outDir, "foods.json"), JSON.stringify(foods) + "\n");

const runtime = `// Généré automatiquement depuis le FCÉN 2026 de Santé Canada. Ne pas modifier à la main.\n` +
  `window.ENERGIE_CNF_META = ${JSON.stringify(metadata)};\n` +
  `window.ENERGIE_CNF_FOODS = ${JSON.stringify(foods)};\n`;
await writeFile(path.join(root, "cnf-foods.js"), runtime);

console.log(`FCÉN 2026 importé: ${foods.length} aliments.`);
console.log("Fichiers générés: data/cnf-2026/metadata.json, data/cnf-2026/foods.json, cnf-foods.js");
