# Énergie — recette nutritionnelle avant les essais professionnels

**Objectif** : vérifier sur l'application réellement déployée ce que les tests unitaires ne démontrent pas : saisie, affichage, persistance et consultation. Ce document ne constitue **pas** une preuve que ces vérifications manuelles ont été effectuées.

## Préparation sécuritaire

- Utiliser un compte de **test** distinct, et de préférence un projet Supabase de test. Ne pas utiliser les données d'un client ou de la nutritionniste.
- Noter la plateforme (Web / iOS / Android), le navigateur, la version, la langue (fr-CA / fr-FR / en-CA / en-US) et la date.
- Capturer la description d'origine, les calories affichées, les ingrédients et quantités reconnus, les macros, la source nutritionnelle, puis reprendre les mêmes notes après fermeture/réouverture.
- Un calcul « reconnu » n'est pas nécessairement **exact** : examiner quantités, unité, cru/cuit, aliment choisi, préparations et valeurs plausibles.

## Matrice de saisie à exécuter dans l'interface

| N° | Français | English | Point critique |
|---|---|---|---|
| 01 | 1 pomme | 1 apple | Fruit au nombre |
| 02 | 2 bananes | 2 bananas | Multiplicateur |
| 03 | 200 g carottes | 200 g carrots | Légume simple, sans gâteau |
| 04 | 250 g tomates | 250 g tomatoes | Sans vinaigrette |
| 05 | 200 g concombres | 200 g cucumber | Sans salade composée |
| 06 | 200 g spaghettis cuits | 200 g cooked spaghetti | État cuit, masse |
| 07 | 120 g spaghettis | 120 g spaghetti | Ambiguïté cru/cuit : demander précision |
| 08 | 1 tasse de riz cuit | 1 cup cooked rice | Volume converti correctement |
| 09 | 150 g poulet cuit | 150 g cooked chicken | Viande simple |
| 10 | 150 g saumon cuit | 150 g cooked salmon | Poisson |
| 11 | 150 g boeuf cuit | 150 g cooked beef | Boeuf |
| 12 | 150 g dinde cuite | 150 g cooked turkey | Dinde |
| 13 | 100 g fromage cottage | 100 g cottage cheese | Produit laitier |
| 14 | 30 g fromage à la crème | 30 g cream cheese | Produit laitier |
| 15 | 1 c. à soupe beurre d'arachide | 1 tbsp peanut butter | Pas du beurre laitier |
| 16 | 1 c. à soupe beurre d'amandes | 1 tbsp almond butter | Pas du beurre d'arachide |
| 17 | 100 g fraises | 100 g strawberries | Fruit |
| 18 | 2 oeufs durs | 2 boiled eggs | Nombre et cuisson |
| 19 | 1 bagel + 30 g fromage à la crème + 1 banane + 1 c. à soupe beurre d'arachide | 1 bagel + 30 g cream cheese + 1 banana + 1 tbsp peanut butter | Quatre ingrédients, vérifier la somme |
| 20 | 150 g poulet cuit + 200 g spaghettis cuits + 100 g brocoli | 150 g cooked chicken + 200 g cooked spaghetti + 100 g broccoli | Repas composé et quantités |
| 21 | 140 g thon | 140 g tuna | Ambiguïté cru/cuit |
| 22 | 4 filets de poulet St-Hubert avec sauce | 4 St-Hubert chicken fillets with sauce | Ne pas prétendre connaître la recette |
| 23 | 100 g brocoli au fromage | 100 g broccoli with cheese | Ne pas traiter comme brocoli nature |
| 24 | 2 tartes aux pommes | 2 apple pies | Ne pas traiter comme pommes nature |

> Ces descriptions sont des cas d'essai, **pas** des assertions que la valeur calorique attendue est connue. Les résultats doivent être comparés à une référence nutritionnelle pertinente, avec le même aliment, son état et sa quantité.

## Cycle complet obligatoire pour les repas 06, 15, 19 et 20

1. Saisir le repas dans le Journal; relever les calories, macros, traces d'ingrédients et éventuels avertissements.
2. Enregistrer et attendre explicitement **« Sauvegardé ☁️ »**. Si « Erreur synchro » ou « à synchroniser » persiste, noter l'incident; ne pas déclarer un succès.
3. Recharger la page ou fermer/réouvrir l'application; retrouver le repas dans le Journal.
4. Ouvrir les modes **Sommaire**, **Détail** et **Consultation**; comparer avec les données initiales.
5. Si possible, se connecter avec **le même compte de test sur un deuxième appareil** et comparer le repas.
6. Modifier une quantité (ex. 200 g à 250 g), enregistrer, recharger et vérifier qu'aucune ancienne valeur ne réapparaît.
7. Simuler une panne réseau (mode hors ligne), modifier un repas, rétablir le réseau et confirmer la synchronisation et l'absence de perte.

## Critères de passage

- **Reconnaissance** : tous les ingrédients essentiels sont reconnus ou signalés explicitement comme inconnus/ambigus, jamais silencieusement remplacés par un autre aliment.
- **Quantités** : les unités et multiples changent les résultats dans le sens et l'ordre de grandeur attendus.
- **Persistance** : calories, macros, ingrédients, quantités et source restent identiques après sauvegarde et rechargement, à arrondi d'affichage près.
- **Intégrité** : aucune sauvegarde signalée comme réussie après abandon silencieux des données nutritionnelles.
- **Affichage** : les trois modes du Journal montrent un repas cohérent et accessible; tout choix de masquer les calories est respecté.
- **Sécurité** : descriptions ambiguës ou marques/recettes non couvertes n'entraînent pas de certitude artificielle.

## Rapport de test (une ligne par essai)

| Date | Version/plateforme | Locale | N° | Reconnu? | Quantité correcte? | Valeur plausible? | Rechargement OK? | Commentaire / capture |
|---|---|---|---|---|---|---|---|---|

**Calcul de fiabilité** : utiliser un échantillon indépendant de repas de la vie courante, avec proportion documentée de réussites, échecs et cas ambigus. Les cas de cette matrice sont des scénarios de régression sélectionnés; leur réussite ne prouve pas, à elle seule, une fiabilité générale de 90–95 %.

## Test Supabase réel encore à réaliser

La simulation de la sauvegarde et du rechargement est automatisée dans :
- `tests/meal-sync-error-contract.test.js`
- `tests/meal-cloud-pull-contract.test.js`

Une validation réseau réelle exige un environnement Supabase **de test** configuré et un compte de test. Elle n'a pas été réalisée par ces scripts. Ne jamais placer de clé `service_role` ou d'identifiants dans le dépôt, les logs CI ou les captures.
