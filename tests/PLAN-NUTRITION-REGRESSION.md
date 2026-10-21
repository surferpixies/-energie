# Énergie — plan de non-régression nutritionnelle

Statut : **plan de test, non exécuté**. Ce fichier ne prouve pas que les cas passent.
Priorité : restaurer la confiance dans le moteur de reconnaissance et de calcul avant le pilote nutritionniste.

## Principes de validation
1. Chaque aliment identifié dans le catalogue doit être associé au bon produit, sans faux positif (p. ex. tomate ≠ vinaigrette).
2. Chaque ingrédient d'une description multi-lignes doit être évalué **individuellement** et contribué au total une seule fois.
3. Une portion explicite doit être convertie seulement si le moteur dispose d'une conversion fiable; sinon afficher « quantité à préciser », jamais inventer une portion.
4. Un aliment reconnu ne doit pas afficher zéro par défaut si la référence donne des calories; aucun aliment inconnu ne doit être silencieusement compté comme zéro.
5. Les valeurs FCÉN et Ciqual sont prioritaires lorsqu'une correspondance précise est validée; signaler la source.
6. Afficher **total partiel** lorsque tous les ingrédients ne sont pas calculables.
7. Chaque correction doit ajouter un cas à la suite automatisée; aucune publication si un test critique échoue.

## Cas P0 — scénarios de pilote
| ID | Saisie | Attendu |
|---|---|---|
| P001 | bagel fromage à la crème / 1 banane / 1 cuillère beurre d'arachide | 4 ingrédients (bagel, fromage à la crème, banane, beurre d'arachide); 4 contributions, ou indication de portion à préciser; total cohérent |
| P002 | bagel / fromage à la crème / banane / beurre d'arachide | Même identité des aliments que P001; portions implicites indiquées comme estimées |
| P003 | 1 banane | 1 banane reconnue, portion unitaire, calories positives |
| P004 | 2 bananes | Échelle 2× P003 pour la même référence |
| P005 | 1 bagel | Bagel reconnu, sans confondre avec pain tranché |
| P006 | fromage à la crème | Fromage à la crème reconnu, sans être confondu avec crème sûre |
| P007 | 1 c. à soupe de beurre d'arachide | Beurre d'arachide reconnu; échelle 1/2 d'une référence « 2 c. à soupe » |
| P008 | 2 c. à soupe de beurre d'arachide | Échelle 2× P007 |
| P009 | 1 cuillère beurre d'arachide | Politique explicite : demander type de cuillère OU hypothèse clairement affichée; jamais valeur silencieusement inventée |
| P010 | 1 pomme / 50 pommes | La seconde saisie ne peut pas avoir le même total que la première |
| P011 | tomate / concombre | Deux légumes nature, jamais recette vinaigrette |
| P012 | 250 g de spaghetti cuits | Quantité cuite exacte, pas 100 g implicites |

## Cas P1 — aliments fréquents
| Catégorie | Saisies à tester |
|---|---|
| Fruits | pomme, banane, orange, poire, fraises, bleuets, ananas, raisins, kiwi, avocat |
| Légumes | tomate, carotte, concombre, brocoli, courgette, laitue, épinards, poivron |
| Féculents | bagel, pain blanc, pain complet, rôtie, pita, riz cuit, riz sec, pâtes cuites, avoine, pomme de terre |
| Produits laitiers | lait, fromage cheddar, fromage à la crème, fromage cottage, yogourt grec, skyr |
| Protéines | œuf dur, 2 œufs, poulet cuit, saumon cuit, thon en conserve, bœuf haché, tofu, lentilles |
| Matières grasses | beurre, huile d'olive, beurre d'arachide, beurre d'amande, mayonnaise |
| Mélanges simples | bagel + fromage à la crème, rôtie + beurre, yogourt + bleuets, salade tomate + concombre + huile, riz + poulet + brocoli |
| Synonymes | beurre de pinotte, peanut butter, cream cheese, banana, chicken, tuna |

## Cas P1 — quantités et unités
Pour chaque catégorie compatible : 1, 2, 3 unités; 50 g, 100 g, 250 g; 1/2 tasse, 1 tasse; 1 c. à thé, 1 c. à soupe, 2 c. à soupe; cru vs cuit; français avec accents et sans accents; espaces, retours de ligne, « et », « avec », « + ».
Les proportions des calories/macros doivent suivre la quantité uniquement **à référence identique**. Les données non comparables ne doivent pas être extrapolées.

## Cas P0 — faux positifs interdits
- tomate ≠ sauce tomate ou salade assaisonnée
- pomme ≠ tarte aux pommes
- poulet ≠ recette de poulet pané sans mention
- cottage nature ≠ cottage aux légumes
- riz sec ≠ riz cuit; pâtes sèches ≠ pâtes cuites
- beurre d'arachide ≠ beurre ordinaire
- fromage à la crème ≠ crème glacée
- quantités non convertibles ≠ calories devinées

## Critères avant essai nutritionniste
- Exécuter tous les P0 en automatisé, puis vérifier les résultats avec références.
- Exécuter les P1 sur Web FR-CA et FR-FR; comparer les sources FCÉN / Ciqual et leurs replis.
- Valider au moins un scénario complet par plateforme (Web, iPhone, Android).
- Bloquer la livraison sur tout échec P0; enregistrer les échecs P1 avec sévérité et décision explicite.
- Vérifier l'absence de régression pour l'hydratation, le suivi glycémique et l'enregistrement des repas.
- Conserver un journal des cas, résultat attendu, résultat obtenu, source, date, commit et correctif.

## Défaut ouvert au 21 octobre 2026
- Description « bagel fromage à la crème / 1 banane / 1 cuillère beurre d'arachide » : reconnaissance et calcul global non encore vérifiés de bout en bout. Plusieurs correctifs ciblés ont été apportés; **ne pas considérer ce cas comme réussi sans exécution réelle**.
