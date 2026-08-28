# Énergie 3.56.2 — Calories modifiables par repas et collation

Mise à jour cumulative du dépôt existant : tous les ajouts de la 3.56.0 et les corrections de langue de la 3.56.1 sont conservés. Cette archive n'est pas une application autonome complète.

## Installation

1. Conserver une copie du dépôt actuellement déployé.
2. Extraire cette archive à sa racine, au même niveau que `index.html`.
3. Ajouter/remplacer les fichiers fournis, notamment `app.js`, `index.html`, `sw.js`, `i18n.js`, `personal-metrics.js`, `personal-metrics.css`, `meal-labels.css` et le nouveau `meal-calories.css`.
4. Ne pas supprimer les autres fichiers du dépôt (configurations, styles, scripts, ressources, `assets/`, `brain/`, manifeste).
5. Publier comme d'habitude, puis recharger Énergie et vérifier 3.56.2 en bas du Profil.

Les fichiers de tests ne sont pas nécessaires au fonctionnement de l'application.

## Fonctionnement

- Chaque formulaire de repas ou de collation possède un champ « Calories estimées (kcal) », visible sans ouvrir les options de nutrition.
- Le champ reprend la valeur disponible et accepte une correction manuelle, y compris zéro et les décimales avec virgule ou point.
- « Ajustées par vous » identifie une correction. Une nouvelle estimation, un scan ou un remplissage nutritionnel ne l'écrase pas.
- « Revenir à l’estimation automatique » recalcule les calories à partir de la description et retire la priorité manuelle, sans effacer les autres nutriments.
- Si aucune estimation n'est disponible après ce retour, le champ reste vide. Une absence de valeur n'est pas un zéro.
- Une saisie manuelle vide ou invalide ne valide pas le repas : entrer une valeur ou utiliser le bouton de retour à l'estimation.
- Les modifications suivent le mécanisme de brouillon automatique. Le total du Journal et le graphique d'Observations utilisent la correction dès la validation du repas par « Terminer » ou par le X lorsque le formulaire est valide.
- La restauration des anciens brouillons tient compte des nouveaux champs pour ne pas décaler les valeurs existantes.
- Le mode démo reste en lecture seule. Les autres nutriments ne sont pas rendus visibles dans la vue personnelle.

La valeur est conservée dans `nutrition.calories`, avec le marqueur `nutrition.caloriesManual`, au sein du JSON nutritionnel existant. Les sauvegardes et la synchronisation réutilisent ce champ : aucune nouvelle colonne SQL n'est nécessaire. Une ancienne base dépourvue de la colonne `nutrition` ne peut pas synchroniser ces corrections; la nouvelle version conserve alors l'opération en erreur plutôt que de supprimer silencieusement la correction.

## Vérifications

66 tests automatisés réussis (54 tests existants + 12 tests des calories), avec calculs, formulaires et callbacks de traduction sous DOM simulé. Vérifications de syntaxe JavaScript réussies. Les tests couvrent la priorité manuelle, le retour automatique, les décimales, zéro, les entrées invalides, les brouillons anciens/nouveaux, les mises à jour différées et les totaux incluant les collations.

Les tests de synchronisation utilisent un service simulé; aucun compte Supabase réel n'a été modifié et aucun déploiement n'a été effectué. La validation visuelle sur iPhone/Android reste à effectuer.

Pour rejouer les tests, installer `jsdom` dans l'environnement de développement, puis lancer :

```sh
node --test tests/personal-metrics.test.cjs tests/i18n-meals.test.cjs tests/i18n-dom.test.cjs tests/meal-calories.test.cjs
```

Le script Playwright de vérification linguistique est également fourni pour un environnement possédant les navigateurs requis.
