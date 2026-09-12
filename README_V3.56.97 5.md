# Énergie v3.56.97 — Saisie repas/collation et photo IA

- Les brouillons de nouveau repas sont maintenant séparés par type (Déjeuner, Dîner, Souper, Collation) afin qu’une saisie ne réapparaisse jamais dans un autre type de repas.
- L’ancien brouillon générique `mealForm:nouveau`, responsable de contaminations entre types de repas, est ignoré/nettoyé.
- Le bouton X de la fenêtre Repas ferme maintenant toujours la fenêtre au lieu d’enregistrer implicitement un repas valide.
- Les analyses photo IA ont un délai maximal de 25 secondes : en cas de blocage du service, l’interface revient avec un message d’erreur au lieu de rester indéfiniment en analyse.
- Même protection pour l’analyse IA des collations rapides.
- Aucun changement à la logique ni au stockage des ressentis à suivre.
