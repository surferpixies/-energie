# Énergie 3.56.4 — Ressentis positifs fixes et présentation séparée

Mise à jour cumulative de la 3.56.3. Les fonctionnalités précédentes sont conservées : profil personnel, poids, ménopause, calories modifiables, graphiques et corrections du français de France, ainsi que les observations positives et leurs preuves.

## Installation

1. Conserver une copie du dépôt actuel.
2. Extraire le ZIP à la racine du dépôt, au même niveau que `index.html`.
3. Ajouter/remplacer les fichiers fournis, en conservant tous les autres fichiers du dépôt. Cette archive de mise à jour n'est pas une application autonome complète.
4. Publier comme d'habitude et recharger Énergie. Vérifier la version 3.56.4 dans le Profil.

Aucune modification SQL n'est requise sur l'installation actuelle. Aucun déploiement ni changement de données Supabase réel n'a été effectué lors de la préparation de cette version.

## Ce qui change

- Les cinq ressentis positifs — bien-être, légèreté, satiété, énergie et calme — sont toujours disponibles avant/après les repas et collations, ainsi que dans les observations hors repas. Il n'est plus nécessaire de les choisir dans le Profil.
- Cette liste fixe ne signifie pas que les cinq ressentis sont automatiquement cochés ou enregistrés : la personne indique uniquement ce qu'elle souhaite consigner.
- Le Profil présente les positifs comme une liste informative, sans cases à cocher. Seuls les inconforts demeurent personnalisables; aucun inconfort peut aussi être choisi.
- Les sélecteurs montrent deux blocs distincts : **Ressentis positifs** (vert doux) et **Inconforts** (ocre doux), avec titres explicites et bordures. Les éléments restent en une seule colonne.
- « Tout va bien — rien de particulier » demeure séparé au-dessus des deux blocs. Les autres indications neutres ne sont pas classées comme positives ou négatives.
- Les mêmes repères sont utilisés dans les aperçus avant/après, les résumés repliés, les évolutions du Journal et de l'Historique, les observations hors repas et leur présentation dans le résumé de consultation.
- L'historique des ressentis et « Toutes les observations » affichent désormais séparément les faits positifs et les inconforts consignés, sans les confondre avec les tendances calculées.
- Le plan de suivi professionnel présente également la liste positive fixe, séparée des inconforts personnalisables.
- La recherche masque un bloc lorsqu'il ne contient aucun résultat, puis le réaffiche quand la recherche est effacée.

## Données conservées

Les identifiants et les scores des ressentis ne changent pas. Les anciens choix positifs du Profil ne limitent plus leur disponibilité. Le journal et les ressentis existants ne sont pas effacés.

Les brouillons utilisent les identifiants des éléments; la réorganisation visuelle ne doit donc pas décaler les scores ni les sélections. La compatibilité avec les brouillons antérieurs aux ressentis positifs est conservée.

Un positif à zéro reste explicitement « Absent » : il n'est pas affiché comme un ressenti positif présent ou comme « Tout va bien ». Les valeurs non renseignées restent inconnues. Les critères du moteur d'observations de la 3.56.3 sont inchangés; les observations positives ne constituent pas une preuve de bénéfice causal.

## Vérifications

99 tests automatisés réussis, comprenant les calculs et garde-fous existants, les calories, les traductions, la disponibilité automatique des cinq positifs, les blocs séparés, la recherche, les résumés, le Profil, les plans professionnels, les preuves et les brouillons. Les vérifications de syntaxe JavaScript réussissent.

Les tests d'interface utilisent un DOM simulé. La validation visuelle sur iPhone/Android reste à effectuer; aucun test sur un compte Supabase réel n'a été effectué.

Pour rejouer les tests, installer `jsdom` dans l'environnement de développement et exécuter :

```sh
node --test tests/personal-metrics.test.cjs tests/i18n-meals.test.cjs tests/i18n-dom.test.cjs tests/meal-calories.test.cjs tests/positive-feelings.test.cjs
```
