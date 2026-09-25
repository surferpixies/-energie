import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const output = path.join(root, "www");

const runtimeFiles = [
  "index.html",
  "app.js",
  "nutrition-corrections.js",
  "config.js",
  "i18n.js",
  "foods.js",
  "food-categories.js",
  "dish-knowledge.js",
  "observation-engine.js",
  "demo-profiles.js",
  "personal-metrics.js",
  "onboarding-images.js",
  "styles.css",
  "portrait.css",
  "observation-detail.css",
  "personal-metrics.css",
  "meal-labels.css",
  "meal-calories.css",
  "positive-feelings.css",
  "feelings-navigation.css",
  "meal-form-compact.css",
  "meal-form-width-fix.css",
  "meal-feelings-simple.css",
  "meal-quick-fill.css",
  "beverage-edit.css",
  "steps-tracking.css",
  "journal-summary.css",
  "onboarding.css",
  "meal-stage-cards.css",
  "manifest.webmanifest",
  "sw.js",
  "surferpixies-signature.png"
];

const brainFiles = [
  "utils.js",
  "database.js",
  "recipes.js",
  "memory-engine.js",
  "parser.js",
  "confidence.js",
  "profile.js",
  "insight-engine.js",
  "index.js"
];

async function copyFile(relativePath) {
  const source = path.join(root, relativePath);
  const destination = path.join(output, relativePath);
  await mkdir(path.dirname(destination), { recursive: true });
  await cp(source, destination);
}

async function copyActiveAssets() {
  const assetRoot = path.join(root, "assets");
  const entries = await readdir(assetRoot, { recursive: true, withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isFile() || / \\d+\\.[^.]+$/.test(entry.name)) continue;
    const source = path.join(entry.parentPath, entry.name);
    const relativePath = path.relative(root, source);
    await copyFile(relativePath);
  }
}

await rm(output, { recursive: true, force: true });
await mkdir(output, { recursive: true });

for (const file of runtimeFiles) await copyFile(file);
for (const file of brainFiles) await copyFile(path.join("brain", file));
await copyActiveAssets();

console.log("Énergie v3.56.125 préparée dans www pour Capacitor Android.");
