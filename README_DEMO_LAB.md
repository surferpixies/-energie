# Laboratoire Énergie — Démo dynamique

Branche: `demo-lab`

## Principe

Le laboratoire génère uniquement des **données brutes de journal**. Il n'injecte jamais une Observation attendue dans les résultats. Le moteur d'Observations existant doit découvrir le signal à partir des repas, ressentis, observations globales, sommeil, hydratation et activité.

Le scénario conserve une vérité cachée non énumérable (`__labTruth`) uniquement pour les contrôles du laboratoire afin de comparer ce qui a été injecté à ce qu'Énergie détecte.

## Première bibliothèque

La v1 contient 26 scénarios répartis entre alimentation, sommeil, activité, hydratation, évolution, cas complexes, tests pièges, contrôles et robustesse.

Exemples: produits laitiers, soya, fruits de mer, gluten, légumineuses, alliums, friture, aliments épicés, aliments transformés, fibres/hydratation, caféine tardive, sommeil court, activité, retrait/réintroduction, effet dose, réaction retardée, faux coupable ail/fromage, absence de signal, données insuffisantes, coïncidence temporaire, données manquantes et cas multifactoriel.

## Variantes

`EnergieDemoLab.generate(id, {variant: 2, days: 60})` génère une nouvelle vie synthétique déterministe: les repas et le bruit changent, mais la vérité cachée reste la même. Cela permet d'éviter de tester le moteur sur une seule séquence arrangée.

## Sommeil

Les journées générées utilisent le modèle actuel avec `sleepHours`, `sleepStartTime` et `sleepEndTime`.

## Étapes d'intégration

1. Ajouter `demo-lab.js` aux assets communs Web/iOS/Android.
2. Remplacer progressivement le sélecteur des quatre profils fixes par « Laboratoire Énergie ».
3. Afficher la bibliothèque par catégories et un bouton « Générer le profil ».
4. Charger le store synthétique dans le mode démo lecture seule existant.
5. Laisser le vrai moteur d'Observations analyser le store.
6. Ajouter un panneau développeur « vérité injectée vs résultat observé ».
7. Ajouter l'exécution en batterie et les tests de non-régression.
8. Conserver Marie/Alex/Sophie/Élodie jusqu'à parité fonctionnelle, puis les retirer.

## Règle de sécurité de test

Un scénario qui contient une association synthétique ne démontre aucune causalité clinique. Il vérifie seulement que le logiciel retrouve correctement un signal connu dans des données contrôlées.


## Modèle commun des familles alimentaires

Les scénarios alimentaires standards partagent la même histoire temporelle:

- début du phénomène dans les premiers jours;
- point de changement aléatoire entre J10 et J50;
- consommation régulière de la famille cible avant le changement;
- ressentis négatifs nettement plus fréquents après une exposition, avec bruit réaliste;
- diminution importante de la famille cible après le changement;
- diminution correspondante des ressentis négatifs;
- réexpositions ponctuelles possibles;
- catalogue commun de repas afin qu'un même repas puisse être neutre dans un scénario et pertinent dans un autre.

Les repas cibles sont vérifiés avec la taxonomie actuelle d'Énergie avant d'être utilisés comme exposition.

### Limite actuelle — alliums

La taxonomie reconnaît l'ail, l'oignon, le poireau et l'échalote comme aliments, mais les classe actuellement sous `vegetables` sans exposer une catégorie d'Observation `allium` distincte. Le scénario allium reste utile comme test de taxonomie, mais le moteur actuel ne peut pas encore faire ressortir « alliums » comme facteur indépendant sans évolution de la taxonomie.
