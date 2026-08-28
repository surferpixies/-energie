# Énergie 3.56.1 — Noms des repas en français de France

## Mise à jour du dépôt existant

Cette archive est cumulative : elle conserve les ajouts de la **3.56.0** (poids, âge, sexe facultatifs, ménopause, calories du Journal et graphiques) et ajoute le correctif linguistique. Ce n'est pas une application autonome complète.

1. Conserver une copie de la version actuellement déployée.
2. Extraire les fichiers à la racine du dépôt Énergie existant, au même niveau que `index.html`.
3. Remplacer `app.js`, `index.html`, `sw.js` et **`i18n.js`**.
4. Ajouter `meal-labels.css`. Ajouter ou remplacer `personal-metrics.js` et `personal-metrics.css` (ajouts de la 3.56.0 inclus).
5. Ne pas supprimer les autres fichiers du dépôt : conserver notamment les configurations, autres scripts, styles, `assets/`, `brain/` et le manifeste.
6. Publier comme d'habitude. Fermer puis rouvrir/recharger Énergie et vérifier **3.56.1** en bas du Profil. Aucun effacement des données du navigateur n'est nécessaire.

Les fichiers `tests/` ne sont pas requis au fonctionnement de l'application.

## Correction

| Repas | Français (Canada) | Français (France) | Anglais |
| --- | --- | --- | --- |
| Matin | Déjeuner | Petit-déjeuner | Breakfast |
| Midi | Dîner | Déjeuner | Lunch |
| Soir | Souper | Dîner | Dinner |
| Entre les repas | Collation | En-cas | Snack |

Le traducteur appliquait plusieurs fois les substitutions aux mêmes textes. En France, « Souper » pouvait donc devenir successivement « Dîner », « Déjeuner » puis « Petit-déjeuner ». Certains libellés étaient déjà traduits avant ce passage, tandis que certaines phrases de rappel n'avaient aucune traduction fr-FR.

- Les noms affichés conservent désormais leur clé d'origine, séparée du libellé traduit.
- Le traitement automatique mémorise ses résultats pour ne pas les retraduire lors des rafraîchissements.
- Les cartes, filtres d'Historique, fenêtres de repas, choix des rappels dans le Profil et libellés de repas dans les observations utilisent cette protection.
- Les rappels après-repas et notifications, la copie du repas de la veille, les titres des repas récents et plusieurs phrases d'observation utilisent les appellations françaises appropriées.
- « Petit-déjeuner » peut prendre deux lignes sur les petits écrans.
- Le français canadien et l'anglais sont conservés. Les descriptions saisies dans les cartes ne sont pas traduites.

Les types stockés des repas, les identifiants, les favoris, les cases de rappel et les données Supabase ne sont pas renommés. Il ne faut pas convertir les anciennes valeurs : elles servent de clés internes indépendantes de la langue. **Aucune modification SQL supplémentaire** pour ce correctif.

## Vérifications

54 tests automatisés réussis :

- 37 tests des données de profil, poids, calories et synchronisation simulée de la 3.56.0;
- 12 tests de traduction, rappels, préférences linguistiques et conservation des clés;
- 5 tests avec DOM simulé et véritables callbacks `MutationObserver` : traductions répétées, reconstruction des cartes, Profil, changement de type dans la fenêtre, notifications simulées, attributs, réinsertion d'éléments et chargement tardif du traducteur.

Syntaxe JavaScript vérifiée. Les essais n'ont pas touché le compte Supabase réel et aucun déploiement distant n'a été effectué.

Le script Playwright pour tester la présentation sur écran étroit est fourni, mais **n'a pas pu être exécuté jusqu'au bout dans cet environnement** (navigateurs/dépendances système indisponibles). La validation visuelle sur iPhone et Android reste donc à effectuer après publication.

### Rejouer les tests

Sans dépendance supplémentaire :

```sh
node --test tests/personal-metrics.test.cjs tests/i18n-meals.test.cjs
```

Avec `jsdom` installé comme dépendance de développement :

```sh
node --test tests/i18n-dom.test.cjs
```

Avec Playwright et ses navigateurs installés :

```sh
node tests/i18n-browser.cjs
```

### Vérification manuelle conseillée

Choisir Français (France) dans le Profil, puis ouvrir le Journal plusieurs fois. Vérifier les trois noms distincts, les cases des rappels et chaque fenêtre de repas. Confirmer que les repas existants restent sous le bon type. Refaire le parcours en Français (Canada), puis revenir en Français (France).
