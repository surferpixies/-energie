# Énergie — corpus ouvert de saisies naturelles (version 1)

Ce corpus est une **évaluation exploratoire**, distincte des tests de régression connus. Les formulations ne doivent pas être modifiées pour satisfaire le moteur. On conserve les échecs pour guider les corrections; on ne prétend pas qu'un pourcentage sur cette sélection représente tous les repas réels.

## Comment évaluer chaque saisie

Chaque cas peut aboutir à l'un de ces résultats :
- **Calcul complet** : tous les aliments pertinents sont identifiés et les quantités utilisées ou estimées sont affichées clairement.
- **Précision requise** : l'aliment est identifié, mais la cuisson, la quantité ou la recette ne peut pas être inférée de façon sûre. Le message doit préciser ce qui manque.
- **Inconnu** : aucune correspondance suffisamment sûre. Afficher ce qui n'a pas été reconnu.
- **Mauvaise correspondance** : l'application associe silencieusement une recette ou un produit différent. Échec critique, même si des calories s'affichent.

L'estimation générique est acceptable pour un plat composé uniquement si elle est indiquée comme telle et si les ingrédients peuvent être précisés. Une quantité déclarée ne doit jamais être ignorée. Les calories d'une recette générique et celles de ses ingrédients détaillés ne doivent jamais s'additionner deux fois.

## Jeu de descriptions à tester (non optimisées pour le moteur)

| Famille | Saisies naturelles en français | En anglais | Risque principal |
|---|---|---|---|
| Riz | riz jasmin; bol de riz blanc; riz brun cuit; un peu de riz | jasmine rice; a bowl of brown rice | Variété / cuit |
| Oeufs | 2 œufs brouillés; omelette; œufs au plat; œuf dur | two scrambled eggs; fried egg; omelet | Unités / gras de cuisson |
| Noix | 5 amandes; une poignée d'amandes; 10 noix de cajou | five almonds; handful of almonds; 10 cashews | Conversion unités ↔ grammes |
| Chocolat | un carré de chocolat noir; 2 carrés de chocolat au lait | a square of dark chocolate; two milk chocolate squares | Taille du carré |
| Fruits | une grosse pomme; deux petites bananes; quelques bleuets | large apple; two small bananas; some blueberries | Taille et nombre |
| Légumes | concombres; tomates; brocoli vapeur; carottes râpées | cucumber; tomatoes; steamed broccoli; grated carrots | Ne pas choisir variété arbitraire |
| Pâtes | spaghetti cuits; pâtes sèches 100 g; un bol de macaroni | cooked spaghetti; 100 g dry pasta; a bowl of macaroni | Cru/cuit |
| Viandes | poulet grillé; steak haché; boeuf braisé; filet de porc | grilled chicken; ground beef; braised beef; pork tenderloin | Coupe, cuisson |
| Poissons | thon en conserve; saumon fumé; saumon grillé | canned tuna; smoked salmon; grilled salmon | Préparation |
| Laitiers | cottage; yogourt grec; tranche de cheddar | cottage cheese; Greek yogurt; cheddar slice | Type et portion |
| Sandwiches | sandwich; sandwich au jambon; sandwich poulet mayo | sandwich; ham sandwich; chicken mayo sandwich | Composition |
| Soupes | soupe; soupe maison; potage de légumes; soupe poulet nouilles | soup; homemade soup; vegetable soup; chicken noodle soup | Recette / volume |
| Sauces | sauce à la viande; sauce tomate maison; sauce Alfredo | meat sauce; homemade tomato sauce; Alfredo sauce | Ingrédients et portion |
| Salades | salade; salade césar; salade avec vinaigrette | salad; Caesar salad; salad with dressing | Double comptage |
| Plats maison | chili; ragoût; pâté chinois; lasagne | chili; stew; shepherd's pie; lasagna | Hypothèse recette |
| Marques | 4 filets St-Hubert avec sauce; barre protéinée inconnue | 4 branded chicken strips with sauce; unknown protein bar | Ne pas inventer une fiche produit |
| Saisie familière | un p'tit bol de riz; 2 oeufs brouillés; sandwich vite fait | a bit of rice; couple of eggs; quick sandwich | Variantes et langage ordinaire |
| Repas complet | riz jasmin, deux œufs brouillés, tomates, concombre et cinq amandes | jasmine rice, two scrambled eggs, tomatoes, cucumber and five almonds | Tous les ingrédients + total |
| Inversion / séparateurs | carottes + thon; thon, carottes; thon et carottes | carrots + tuna; tuna, carrots; tuna and carrots | Même composition |
| Prudence | tarte aux pommes; gâteau aux carottes; pain aux bananes | apple pie; carrot cake; banana bread | Ne pas assimiler à fruit/légume nature |

## Protocole de robustesse

1. Tester les quatre locales FR-CA, FR-FR, EN-CA et EN-US.
2. Répéter avec et sans quantité. Utiliser au moins : poids en g, tasse/cuillère et nombre d'unités.
3. Confirmer la reconnaissance **alimentaire**, la gestion de **quantité** et l'**exactitude d'identité** séparément; un calcul numérique n'est pas automatiquement une réussite.
4. Tester les repas mélangés avec lignes, virgules, « et », « + »; vérifier qu'aucun ingrédient n'est omis ou ajouté deux fois.
5. Conserver les cas échoués dans un rapport, y compris ceux où une clarification serait préférable. Ne pas corriger la liste d'exemples après coup pour améliorer le score.
6. Confirmer dans le vrai Journal Web, puis enregistrement/rechargement Supabase de test; comparer les calories, quantités et sources.
7. Réviser les échantillons avec des saisies inédites recueillies lors des essais, en évitant d'utiliser uniquement des formulations déjà apprises.

## Mesures à communiquer

Afficher séparément : taux de reconnaissance alimentaire, taux de calcul utilisable, taux de clarification appropriée, taux de mauvaises correspondances, et taux de conservation après rechargement. **Ne pas assimiler « 100 % des tests existants » à 100 % de fiabilité réelle.** L'objectif 90–95 % doit être évalué sur un échantillon représentatif indépendant, avec règles et dénominateur publiés.
