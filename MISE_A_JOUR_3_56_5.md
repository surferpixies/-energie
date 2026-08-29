# Énergie 3.56.5 — Saisie sans le bloc « Tout va bien »

Mise à jour cumulative de la 3.56.4, conservant la liste fixe des cinq ressentis positifs, les blocs séparés positifs/inconforts, les observations positives et tous les ajouts précédents.

## Changements

- Le bloc « Tout va bien — rien de particulier » et sa séparation ne sont plus affichés dans les saisies Avant et Après, y compris la saisie d'un point de départ manquant.
- Aucun bouton de remplacement n'est ajouté. La personne utilise les ressentis positifs et les inconforts existants.
- Le long texte sous l'ancien bloc est réduit à : « Positifs : 0 = pas ressenti · 1 = faible · 5 = très présent. »
- Les conseils de l'interface ne demandent plus d'utiliser l'ancien bouton avant un repas.
- L'ancien choix n'apparaît plus dans les résultats de recherche des saisies Avant/Après.

## Conservation des données

Aucune migration ne transforme une ancienne réponse en un nouveau ressenti positif. Les réponses historiques restent lisibles dans le journal et utilisables par les comparaisons existantes.

Pour préserver les anciens repas et les brouillons, leur état neutre est conservé en interne lors d'une réouverture sans changement de ressentis. Les contrôles de compatibilité sont masqués, non accessibles au clavier et sans espace visible. Lorsqu'un ressenti est nouvellement choisi ou son intensité modifiée, l'ancienne sélection neutre est retirée de cette saisie.

Un ancien état neutre Avant n'est plus prérempli dans une nouvelle saisie Après. Les autres ressentis conservent leur préremplissage habituel.

Le calcul des observations est inchangé : une valeur non renseignée n'est pas transformée automatiquement en zéro, et un ressenti positif ne crée pas de scores d'inconforts absents. Les observations hors repas ne sont pas modifiées par ce retrait ciblé sur Avant/Après.

## Installation

1. Conserver une copie du dépôt actuel.
2. Extraire cette archive à la racine du dépôt, au même niveau que `index.html`.
3. Ajouter/remplacer les fichiers fournis sans supprimer les autres fichiers, configurations et ressources. Ce ZIP de mise à jour n'est pas une application autonome complète.
4. Publier comme d'habitude, recharger l'application et vérifier 3.56.5 dans le Profil.

Aucune nouvelle table ou colonne Supabase n'est requise. Aucun déploiement ni changement de données Supabase réel n'a été effectué.

## Vérifications

103 tests automatisés réussis et syntaxe JavaScript vérifiée. Les tests couvrent les fonctions précédentes, les contrôles masqués, la recherche, la conservation des anciennes réponses et brouillons, ainsi que l'absence de préremplissage neutre dans une nouvelle saisie Après.

Les tests d'interface utilisent un DOM simulé. Le rendu sur téléphone reste à vérifier.

Avec `jsdom` disponible dans l'environnement de développement :

```sh
node --test tests/personal-metrics.test.cjs tests/i18n-meals.test.cjs tests/i18n-dom.test.cjs tests/meal-calories.test.cjs tests/positive-feelings.test.cjs
```
