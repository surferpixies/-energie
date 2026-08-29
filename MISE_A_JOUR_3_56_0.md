# Énergie 3.56.0 — Profil, poids, calories et ménopause

## Installation sur le dépôt existant

Cette archive est une **mise à jour de la version 3.55.25**, pas une application autonome complète.

1. Conserver une copie de la version actuellement déployée.
2. Ajouter les fichiers de cette archive à la racine du dépôt Énergie, au même niveau que l'actuel `index.html`.
3. Remplacer `app.js`, `index.html` et `sw.js`. Ajouter `personal-metrics.js` et `personal-metrics.css`.
4. **Ne pas supprimer les autres fichiers** : conserver notamment `config.js`, `i18n.js`, `foods.js`, `food-categories.js`, `dish-knowledge.js`, `manifest.webmanifest`, `assets/`, `brain/`, les styles et les autres scripts déjà présents.
5. Publier comme d'habitude sur GitHub Pages, puis rouvrir/recharger Énergie. Le bas du Profil doit indiquer 3.56.0.

Le dossier `tests/` contient des tests de non-régression; il n'est pas nécessaire au fonctionnement de l'application.

## Nouveautés

- Profil : âge, sexe et poids facultatifs, avec « Non renseigné » et « Je préfère ne pas répondre » pour chacun.
- Poids en kg ou lb, avec une mesure par date. Les nouvelles mesures n'écrasent pas les autres dates. Une correction remplace la mesure de sa date; vider le champ retire cette seule mesure.
- Le refus de renseigner le poids masque sa courbe et la saisie, mais ne supprime pas les mesures historiques. Le refus pour l'âge ou le sexe efface la valeur courante de ces champs.
- Ménopause ajoutée aux contextes physiologiques. Aucun changement automatique des analyses ni calcul d'objectif calorique à partir de ces renseignements.
- Total calorique estimé en haut du Journal, sans macronutriments. Les jours sans estimation affichent un tiret, et non zéro.
- Deux graphiques sur 30 jours dans Observations : mesures de poids et calories estimées des repas et collations enregistrés. Les jours sans données ne deviennent pas des zéros. Les estimations partielles sont signalées; les valeurs sont aussi accessibles dans un tableau.
- Les graphiques chiffrés ne reprennent pas les données fictives de l'aperçu d'Observations. Un profil de démonstration reste séparé et non modifiable.

## Sauvegarde

Les champs valides sont sauvegardés localement après une courte pause ou à la sortie du champ. Les choix sont sauvegardés immédiatement. La synchronisation utilise la connexion existante à Supabase et la file d'attente habituelle.

Les nouveaux champs voyagent dans le JSON `daily_logs.supplements` : `personalProfile` pour les renseignements facultatifs et le contexte physiologique, `weightMeasurement` pour la mesure du jour. Aucune nouvelle table ou colonne n'est nécessaire sur l'installation qui dispose déjà de `supplements`.

En cas d'absence de cette colonne, une opération contenant les nouveaux renseignements reste en attente/erreur : elle n'est pas présentée comme synchronisée après suppression silencieuse de ces champs. Les choix du profil et les mesures possèdent leurs propres horodatages pour conserver la version la plus récente lors de la fusion. Il faut mettre à jour les appareils utilisés; une ancienne version de l'application ne connaît pas ces nouveaux champs.

Le message du formulaire confirme l'enregistrement **sur l'appareil**. Le badge général indique l'état du nuage. La synchronisation en arrière-plan ne reconstruit pas le Profil pendant la saisie.

## Vérifications réalisées

Commande : `node --test tests/personal-metrics.test.cjs`

37 tests automatisés réussis : calculs, conversions, états vides, choix de refus, modifications datées, migration, génération des graphiques, champs de formulaire simulés et synchronisation avec service simulé. Syntaxe JavaScript vérifiée avec `node --check`.

Pas de test réalisé contre le compte Supabase réel, ni sur un iPhone/Android physique. Aucun déploiement distant n'a été effectué. Les ressources communes absentes de l'ancienne archive restent celles du dépôt existant.
