# Mémoire alimentaire personnalisée — Sprint 1

## Inclus

- Nouveau module `brain/memory-engine.js`.
- Apprentissage local automatique lors de l’ajout ou de la modification d’un repas.
- Détection de recettes personnelles par nom et alias.
- Fréquence des ingrédients et classement : toujours, souvent, parfois, rare.
- Calcul progressif de confiance.
- Possibilité technique de renommer, oublier et restaurer une mémoire.
- Le parseur consulte maintenant la mémoire personnelle et retourne `personalMemory`.
- Stockage local sous la clé `energie-food-memory-v1`.

## API disponible

```js
Brain.learnMeal(meal)
Brain.learnMeals(meals)
Brain.memory.findBest(text)
Brain.memory.list()
Brain.memory.rename(id, label)
Brain.memory.forget(id)
Brain.memory.restore(id)
Brain.memory.exportState()
Brain.saveMemory()
```

## Limites volontaires du Sprint 1

- Pas encore de synchronisation Supabase.
- Pas encore d’interface « Repas appris ».
- Les anciennes entrées ne sont pas automatiquement importées : seules les nouvelles sauvegardes alimentent la mémoire, sauf appel manuel à `Brain.learnMeals(...)`.

Ces éléments sont prévus pour les prochains sprints.
