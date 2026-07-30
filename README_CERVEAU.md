# Énergie V3.8.0 — Cerveau d’Énergie

## Nouveaux fichiers

- `brain/utils.js` : normalisation du texte et utilitaires partagés
- `brain/database.js` : transforme la base `foods.js` en fiches stables avec identifiants, catégories et nutriments
- `brain/recipes.js` : premiers repas composés
- `brain/parser.js` : reconnaissance des aliments, catégories, nutriments, mots inconnus et confiance
- `brain/confidence.js` : niveaux de confiance
- `brain/profile.js` : analyse d’une journée et construction d’un profil alimentaire
- `brain/index.js` : API publique `window.EnergieBrain` et alias `window.Brain`

## API disponible

```js
Brain.parseMeal("Overnight oats avec yogourt grec et bleuets")
Brain.analyzeDay(meals)
Brain.buildProfile(meals)
Brain.getFood(foodId)
Brain.confidence(0.82)
Brain.diagnostics()
```

## Compatibilité

L’ancien tableau `window.ENERGIE_FOODS` reste intact. `app.js` utilise maintenant `EnergieBrain.legacyFoods` lorsqu’il est disponible, avec repli automatique sur l’ancien système.

## Test rapide dans la console du navigateur

```js
Brain.parseMeal("Toast beurre de pinottes et banane")
Brain.parseMeal("Bibimbap maison")
Brain.diagnostics()
```
