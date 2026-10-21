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

## Campagne exhaustive FCÉN — couverture de TOUT le catalogue, pas une liste de 50 aliments

Le socle de test doit être **généré automatiquement à partir de chaque fiche FCÉN réellement chargée** dans `cnf-catalog.js`. N'importe quel nombre de fiches : aucune exclusion arbitraire. Si la fiche a plusieurs noms français/anglais, tester chaque nom exploitable; ne pas transformer tous les synonymes anglais en résultats français sans contrôle.

### Inventaire et couverture mesurables
- Compter le nombre total de fiches FCÉN, fiches avec calories, fiches sans calories, fiches par catégorie, par état et par unité de référence. Enregistrer ce nombre à chaque livraison.
- Pour chaque fiche avec une valeur calorique valide, vérifier : chargement, identifiant, nom, énergie par 100 g, macronutriments numériques plausibles, conversion aller-retour par portion et stabilité du calcul. Détecter les collisions d'identifiants.
- Pour chaque fiche sans calories renseignées, afficher « donnée absente », **pas** 0 et pas une estimation masquée.
- Tester la correspondance textuelle sur tous les noms FCÉN pertinents, avec classement : exacte, ambiguë, quantité non convertible, sans donnée; **ne pas exiger que toute chaîne de catalogue soit une saisie grand public non ambiguë**.
- Produire un fichier de résultats avec la liste des identifiants non reconnus, des faux positifs, des conversions invalides et des exceptions acceptées. Un simple pourcentage global ne suffit pas.

### Familles obligatoires (les fiches FCÉN de chacune, sans limitation)
- Pâtes : spaghetti, linguine, fettucine/fettuccine, macaroni, penne, fusilli, rotini, farfalle, rigatoni, lasagne, ravioli, tortellini, nouilles et nouilles aux œufs; cru/sec vs bouilli/cuit; pâtes de blé, complètes, enrichies et sans gluten; sauces et plats préparés distincts.
- Viandes : bœuf (haché, steak, rôti, coupes maigres ou grasses), veau, porc (côtelettes, longe, filet, bacon, jambon), agneau, chèvre, gibier (chevreuil, orignal, bison), abats, viandes transformées; crues/cuites, avec/sans os ou peau, cuisson, teneur en gras.
- Volailles : poulet, dinde, canard, oie; poitrine, cuisse, pilon, aile, haché; cru/cuit, grillé/frit/rôti, avec/sans peau.
- Poissons et fruits de mer : saumon, thon cru/cuit/en conserve, truite, morue, sole, tilapia, sardine, crevette, pétoncle, moule, huître, homard, crabe; frais/surgelé/fumé/en conserve.
- Fruits : pommes, poires, bananes, agrumes, raisins, baies, melons, mangue, ananas, kiwi, fruits à noyau, fruits séchés et en conserve; frais vs jus, avec/sans peau.
- Légumes : tomates, concombres, carottes, pommes de terre, patates douces, poivrons, brocoli, chou-fleur, choux, laitues, épinards, champignons, courges, asperges, oignons, ail, céleri, betteraves, haricots verts, légumes racines et légumes congelés; cru vs cuit vs frit vs conserve.
- Céréales/féculents : riz de toutes sortes, quinoa, boulgour, orge, avoine, pain, bagel, muffin, tortillas, céréales, farines, semoule, couscous; sec/cuit.
- Légumineuses/noix/graines : lentilles, pois chiches, haricots secs et cuits, soya, tofu, tempeh, arachides, amandes, noix et toutes les pâtes/beurres de noix.
- Laitages/œufs : laits et boissons substituts, yogourts, skyr, fromages frais et affinés, cottage, fromage à la crème, crème, beurre, œufs et préparations d'œufs.
- Huiles/condiments, desserts, collations, boissons, produits manufacturés, préparations mixtes et entrées multiples du catalogue : inclus également. Un plat composé **ne doit pas** automatiquement autoriser une correspondance avec son ingrédient de base.

### Matrice de variations à appliquer intelligemment
Pour chaque fiche compatible avec l'unité :
1. Référence de base : nom exact + quantité de référence; énergie et macros recalculées.
2. Poids : 1 g, 50 g, 100 g, 150 g, 250 g, 500 g, 1 kg — tests de proportionnalité et arrondis, si base massique.
3. Volume : 15 ml, 100 ml, 250 ml, tasse, 1/2 tasse — **uniquement** si densité / portion vérifiée.
4. Cuillères : 1/2, 1, 2 c. à thé ou à soupe — uniquement si facteur de conversion validé.
5. Unités naturelles : 1, 2, 3, 10, 50 fruits, œufs, filets, tranches, pièces — si une portion unitaire est définie; autrement « quantité à préciser ».
6. Orthographe : accents, apostrophes droites/courbes, pluriels, majuscules, espaces, synonymes FR-CA/FR-FR/EN attestés.
7. Préparation : cru/cuit/bouilli/rôti/frit/séché/en conserve; jamais une variante non correspondante par défaut.
8. Provenance locale : FCÉN d'abord en fr-CA, Ciqual d'abord en fr-FR, avec repli identifié et sans remplacer une fiche fiable par une suggestion approximative.

### Tests de repas composés / collisions
- Générer des combinaisons 2 à 5 aliments de familles différentes (plusieurs centaines minimum) avec séparateurs : virgule, retour de ligne, « + », « et », « avec », « sur », « garni de ».
- Vérifier **conservation de la somme** : total reconnu = somme de chaque ingrédient avec la même référence et quantité.
- Vérifier que la présence d'une préparation composée dans le catalogue ne détourne pas le match d'un aliment simple.
- Tester les mêmes repas avec ingrédient inconnu ajouté : somme partielle inchangée, statut « partiel » et nom inconnu visible.
- Tester le total des calories et chaque macro avec une tolérance d'arrondi publiée, sans imposer l'égalité d'énergie estimée à 4P+4G+9L (les tables officielles peuvent différer).

### Seuils de publication
- 100 % des scénarios de sécurité P0 et des tests d'intégrité des données passent.
- 100 % des fiches FCÉN sont **inventoriées et évaluées**. Les exceptions sont chiffrées, justifiées et accessibles dans un rapport; ne pas prétendre 100 % de reconnaissance automatique si la fiche est ambiguë.
- Comparaison du nombre de cas réussis et échoués à la version précédente; **aucune régression critique tolérée**.
- Validation bout en bout sur saisie repas, confirmation des calories dans l'interface, sauvegarde/rechargement, puis observation/journal.
- Exécuter en intégration continue à chaque changement des fichiers d'alimentation, de recherche, du moteur et avant tout déploiement. Les tests doivent être branchés au même code de production, pas à une simulation divergente.

**État : ce plan élargi reste un cahier de tests. Le harnais exhaustif et son rapport d'exécution ne sont pas encore implémentés.**
