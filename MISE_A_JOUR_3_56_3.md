# Énergie 3.56.3 — Ressentis et observations positives

Mise à jour cumulative du dépôt existant, conservant les ajouts de la 3.56.0 (profil, poids, calories, ménopause), les corrections linguistiques de la 3.56.1 et les calories modifiables de la 3.56.2. Cette archive n'est pas une application autonome complète.

## Installation

1. Conserver une copie du dépôt actuellement déployé.
2. Extraire l'archive à sa racine, au même niveau que `index.html`.
3. Ajouter/remplacer les fichiers fournis, notamment `app.js`, `index.html`, `sw.js`, `observation-engine.js` et le nouveau `positive-feelings.css`.
4. Conserver tous les autres fichiers du dépôt : configurations, scripts, styles, ressources, manifeste, `assets/` et `brain/`. Ne pas remplacer le dépôt par le seul contenu de ce ZIP.
5. Publier comme d'habitude, recharger Énergie et vérifier la version 3.56.3 au bas du Profil.

Les tests ne sont pas nécessaires au fonctionnement de l'application.

## Utilisation

- Dans **Profil → Mes ressentis suivis → Ressentis positifs**, choisir les ressentis souhaités : « Je me sens bien », « Sensation de légèreté », « Rassasié », « Énergique » et « Calme ou détendu ».
- Les choix existants ne sont pas remplacés. Un bouton « Choisir mes ressentis suivis » est également disponible dans la nouvelle section d'Observations.
- Les ressentis positifs choisis sont accessibles directement avant et après chaque repas ou collation, en une seule colonne. Les catégories demeurent dans le Profil.
- Pour ces ressentis, **0 = pas ressenti**, puis 1 à 5 indiquent l'intensité. Un ressenti non renseigné est inconnu, pas absent.
- « Tout va bien — rien de particulier » reste distinct : il confirme l'absence d'inconforts suivis et peut coexister avec des ressentis positifs. Il ne permet pas de déduire automatiquement de l'énergie, du calme ou leur absence.
- Une énergie qui passe de 1 à 4 est présentée comme « Plus présent après », pas comme une aggravation. Les ressentis stables et les comparaisons incomplètes restent enregistrés sans fenêtre de confirmation.

## Observations positives

La nouvelle section utilise les ressentis réellement enregistrés, jamais les repas fictifs de l'aperçu du tableau de bord.

Le moteur compare l'évolution **après − avant** d'un même ressenti dans les repas contenant une catégorie alimentaire et dans les autres repas. Il conserve les mêmes seuils que pour les observations d'inconforts : au moins cinq repas comparables de chaque côté, quatre augmentations dans le groupe contenant la catégorie, un écart de fréquence d'au moins 18 points de pourcentage et un écart d'évolution moyenne d'au moins 0,35 point. La fenêtre d'analyse est de 180 jours. Ces seuils portent sur des repas, pas sur cinq jours distincts.

Les saisies exclues de l'analyse par le contrôle de qualité ne sont pas utilisées. Pour les nouveaux ressentis positifs, les deux intensités doivent être renseignées; aucune intensité n'est fabriquée à partir d'une ancienne note globale ou de « Tout va bien ».

La sélection des observations positives est indépendante des observations d'inconforts. Elle affiche jusqu'à trois observations principales et huit pistes secondaires. Les catégories qui apparaissent souvent ensemble sont signalées comme des pistes secondaires, car leurs effets ne peuvent pas être distingués ici.

Chaque carte possède « Voir les preuves », les effectifs, les fréquences de renforcement, les évolutions moyennes, le niveau de confiance, l'explication du calcul et l'accès aux repas concernés. La liste de repas illustrant une observation est limitée à douze exemples; les effectifs de calcul peuvent être plus grands.

Ces observations sont des associations dans le journal, pas la démonstration d'un bénéfice causal d'un aliment. Un ressenti positif déjà élevé mais stable ne suffit pas à produire une association.

## Conservation et synchronisation

Les nouveaux ressentis ont des identifiants distincts (`positive_*`). Les anciens ressentis que les versions précédentes avaient déjà regroupés sous « Tout va bien » ne sont pas réinterprétés rétroactivement.

Les scores utilisent les objets JSON existants du repas et du ressenti, avec le score avant recopié dans `feeling.beforeScores` pour la synchronisation. Aucune nouvelle table ou colonne SQL n'est requise sur l'installation actuelle. Les brouillons gardent les choix par identifiant afin que l'ajout de boutons ne décale pas les sélections; la restauration des anciens brouillons reste prise en charge.

## Vérifications

91 tests automatisés réussis : 66 tests existants et 25 nouveaux tests. Ils couvrent la normalisation, les anciens identifiants, zéro et les valeurs manquantes, la saisie avant/après, les seuils du moteur, les exclusions de qualité, les preuves principales/secondaires et leurs boutons, ainsi que les brouillons anciens/nouveaux. Les tests de formulaires utilisent un DOM simulé; les tests de synchronisation utilisent un service simulé. Les vérifications de syntaxe JavaScript réussissent.

Aucun déploiement ni changement de données Supabase réel n'a été effectué. La validation visuelle sur iPhone et Android reste à faire.

Pour rejouer les tests, installer `jsdom` dans l'environnement de développement, puis lancer :

```sh
node --test tests/personal-metrics.test.cjs tests/i18n-meals.test.cjs tests/i18n-dom.test.cjs tests/meal-calories.test.cjs tests/positive-feelings.test.cjs
```
