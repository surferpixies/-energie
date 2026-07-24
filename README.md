## Nouveauté V3.0.6

- Option configurable dans Profil, désactivée par défaut.
- Carte « À discuter avec votre professionnel » dans le Tableau lorsqu’elle est activée.
- Sujets prudents tirés du journal, sans diagnostic ni partage automatique.

## V3.0.6 — Accompagnement professionnel

- Recherche visible en permanence, filtres repliés par défaut.
- Bouton Filtres avec ouverture/fermeture des blocs Période et Type de repas.
- Les journées affichent un maximum de 3 repas principaux; les collations sont présentées séparément comme complément.

## V3.0.3 — Suggestions adaptées au prochain repas

- Les suggestions sont maintenant déclenchées selon le repas qui vient d’être enregistré.
- Après le déjeuner : protéines, fibres ou fruit; aucune suggestion de légumes.
- Après le dîner : analyse cumulative pour préparer le souper, avec protéines, légumes, fibres ou fruit.
- Après une collation : suggestion seulement lorsque le signal est suffisamment clair.
- Après le souper : aucune suggestion alimentaire tardive.
- Un manque évident peut être signalé dès le déjeuner; l’application n’attend plus la fin de la journée.
- Une seule suggestion est affichée et les catégories déjà proposées ne sont pas répétées le même jour.

# Énergie V3.0.3 — Suggestions adaptées au prochain repas

Cette version ajoute un raccourci de saisie par code-barres dans la fenêtre de repas. Le scan cherche uniquement le nom et la marque dans Open Food Facts. Le nom reste toujours modifiable avant l’ajout. Aucune calorie, macro, portion, note nutritionnelle ou Nutri-Score n’est enregistré.

Le scanner utilise la caméra du téléphone et offre une saisie manuelle du numéro en solution de secours. Les produits déjà reconnus sont conservés dans un petit cache local.

# Énergie V2.4.3

- Nom simplifié : **Énergie**.
- Logo pomme + éclair conservé exactement tel quel.
- Nouvel écran de lancement discret avec le logo existant.
- « Fatigue avant » devient « Énergie avant le repas ».
- Nouveau curseur à cinq niveaux, de 😴 à 😄, avec libellé dynamique.
- L’hydratation précise maintenant qu’une goutte correspond à **500 ml**.
- Structure des données et colonnes Supabase conservées pour assurer la compatibilité.

# Énergie & Repas V1.7.4


## Correctif V2.4.2

- Les options Déjeuner, Dîner, Souper et Collation du profil restent entièrement visibles sur mobile.
- Les cases et leur libellé sont maintenant regroupés dans une zone cliquable pleine largeur.
- L’alignement et les espacements des options de rappel ont été uniformisés.

## Nouveautés

- Message d’information au premier lancement avec option « Ne plus afficher ».
- Le message peut être revu dans Profil et préférences.
- Suppression de la saisie « Fatigue après »; les anciennes valeurs demeurent dans les données historiques pour éviter toute perte.
- Observations personnelles reformulées sans causalité ni diagnostic.
- Observations nutritionnelles proactives et prudentes sur les descriptions de repas.
- Sources officielles de Santé Canada et de l’OMS accessibles avec « Pourquoi je vois ceci? ».
- Paramètres séparés pour désactiver les Insights, observations nutritionnelles, suggestions générales et sources.
- Aucune modification SQL requise et aucune donnée supprimée.

## Limite importante

Sans code-barres, portions ou tableau de valeur nutritive, l’application ne peut pas calculer réellement le sucre, le sodium ou les gras saturés. Les cartes nutritionnelles de cette version utilisent uniquement des mots-clés dans les descriptions et sont explicitement présentées comme des estimations.

---

# Énergie & Repas V1.5.1

Cette version part de la V1.4/V1.5 et conserve l’authentification ainsi que les repas déjà enregistrés dans Supabase.

## Nouveautés

- ⭐ Bibliothèque de repas favoris et ajout rapide;
- 🔎 Recherche instantanée par repas, type, note ou date;
- filtres sur 7 et 30 jours;
- 📊 tableau de bord;
- 🧠 Insights avec niveau de confiance;
- 👀 mode aperçu automatique lorsqu’il y a moins de 8 repas.

Les données du mode aperçu sont fictives, restent uniquement en mémoire et ne sont jamais envoyées dans Supabase.

## Mise à jour Supabase

Dans **Supabase → SQL Editor**, exécute `supabase-setup.sql` une seule fois.

Le script est non destructif : il ne contient aucun `DELETE`, `TRUNCATE` ou `DROP TABLE`. Il ajoute seulement `favorite_meals` et ses règles de sécurité. La table `meals` n’est pas modifiée.

## Publication

1. Fais d’abord un export JSON depuis **Profil → Exporter JSON**.
2. Exécute `supabase-setup.sql`.
3. Remplace les fichiers de ton dépôt GitHub Pages par ceux de cette archive.
4. Vérifie que `config.js` contient l’URL et la clé publique Supabase déjà utilisées par la V1.4.
5. Après la publication, ferme complètement la PWA et rouvre-la. Si l’ancienne version reste en cache, retire puis réinstalle l’icône depuis Safari.

## Validation conseillée

1. Connecte-toi et confirme que tes repas existants apparaissent.
2. Ajoute un repas aux favoris avec `☆`.
3. Utilise ce favori pour préremplir un nouveau repas.
4. Teste la recherche.
5. Ouvre **Tableau** pour voir le mode aperçu et les Insights.


## Correctif 1.5.2

- Le champ « Confirmer le mot de passe » est maintenant affiché uniquement lors de la création de compte.
- Aucun changement au schéma Supabase ni aux données existantes.


## Nouveautés V1.7.1 à V1.7.3 — Smart Timeline

- historique regroupé par mois, semaine et journée;
- sections repliables pour conserver une chronologie compacte;
- résumés quotidiens, hebdomadaires et mensuels;
- filtres par période, type de repas, favoris et niveau de fatigue;
- recherche conservée dans toute la chronologie;
- aucune modification SQL requise et aucune suppression de données.


## Détails de la V1.7.3

- V1.7.1 : résumés quotidiens enrichis (repas, fatigue, sommeil, hydratation et favoris selon les données disponibles).
- V1.7.2 : résumés hebdomadaires et mensuels avec observations descriptives.
- V1.7.3 : parcours global, animations discrètes et stratégie de cache PWA renforcée pour que les mises à jour apparaissent immédiatement.
- Toutes les fonctions existantes sont conservées; aucune modification SQL n’est requise.

### Important pour la mise à jour iPhone

Après avoir remplacé les fichiers sur GitHub Pages, ferme complètement l’application puis rouvre-la. La V1.7.3 ajoute des paramètres anti-cache dans les fichiers et force la mise à jour du service worker.


## Nouveauté V1.7.4 — en-tête vivant

- L’icône à côté du titre **Énergie & Repas** est restaurée.
- Elle change automatiquement selon l’heure locale : 🌅 le matin, ☀️ le jour, 🌇 en fin de journée et 🌙 le soir.
- La même icône dynamique est conservée dans l’onglet **Aujourd’hui**.
- Aucun changement aux données, à Supabase ou au regroupement de l’historique.


## V1.7.7 — Icône météo discrète

- 🌤️ le matin lorsque la météo n’indique ni pluie ni neige
- ☀️ l’après-midi lorsque la météo n’indique ni pluie ni neige
- 🌧️ le jour lorsqu’il pleut ou qu’il y a des averses / orages
- 🌙 le soir et la nuit
- ❄️ lorsqu’il neige, y compris le soir
- utilisation d’Open-Meteo sans clé API
- géolocalisation approximative de l’appareil, sans enregistrer les coordonnées dans Supabase
- cache météo local de 30 minutes et repli automatique sur l’heure en cas de refus, d’absence de réseau ou d’erreur

Aucune modification SQL n’est nécessaire.


## V1.7.7

- Remplacement des emojis météo par un seul jeu d’icônes SVG intégré à l’application.
- Icônes autorisées uniquement : soleil du matin, plein soleil en après-midi, pluie, neige et lune.
- Suppression du changement visuel causé par les variantes d’emojis du système.
- L’historique hiérarchique demeure inchangé.


## V1.7.7 — Nuages

- Ajout d’une icône SVG de nuage pour les codes météo Open-Meteo 2, 3, 45 et 48.
- Le soleil demeure affiché lorsqu’il fait clair ou principalement clair.
- La pluie, la neige et la lune conservent leur comportement existant.
- Aucun changement SQL ni aux données enregistrées.


## V2.0.0
- Correction du remplacement visuel de l’icône météo.
- Le cache météo utilise une nouvelle clé.
- L’icône n’est redessinée que lorsque la condition change réellement.
- Mise à jour complète des versions du service worker et des fichiers CSS/JS/config.
- Conditions disponibles : soleil du matin, soleil de l’après-midi, nuage, pluie, neige et lune.


## V2.0.4

- Zoom désactivé dans l’application installée.
- Boutons Déjeuner, Dîner, Souper et Collation rendus plus compacts.
- Correction du débordement horizontal et du défilement latéral.


## V2.0.5
- Séparation complète des formulaires Sommeil et Activité.
- La carte Sommeil ouvre uniquement la saisie des heures de sommeil.
- La carte Activité ouvre uniquement les icônes d'exercices, la durée et la liste des activités.
- Aucun changement aux repas, à la navigation ou aux favoris.


## Correctif V2.1.1

- La flèche vers le jour suivant est grisée et désactivée à la date du jour.
- La navigation par glissement et la logique interne empêchent aussi toute ouverture d’une date future.


## V2.2.0 — Ressenti après les repas

- Carte **Ressenti** dans le Journal avec réponses en attente.
- Ressenti général de 1 à 5 lié au repas exact.
- Sélection multiple de symptômes et d'états positifs.
- Modification ultérieure depuis la carte du repas.
- Rappels configurables dans le Profil : activation complète, types de repas et délai de 1, 2 ou 3 heures.
- Les collations sont désactivées par défaut.
- Les ressentis restent accessibles dans le Journal même lorsqu'une notification système n'a pas pu être affichée.

### Limite des notifications PWA

Une application Web statique ne peut pas garantir une notification différée lorsque le navigateur ou la PWA est complètement fermé sans service de notifications push côté serveur. La V2.2 affiche une notification locale lorsque le navigateur l'autorise et que l'application peut s'exécuter. Le système de **ressentis en attente** demeure la source fiable et ne perd aucune demande de suivi.

### Migration Supabase

Exécuter les nouvelles lignes à la fin de `supabase-setup.sql` pour ajouter `feeling` et `feeling_notified_at` à la table `meals`.


## V2.4.2 — Internationalisation

- Détection automatique de la langue du navigateur.
- Français (Canada), français (France) et anglais.
- Sélecteur de langue dans Profil.
- Dates localisées avec Intl.
- Les valeurs enregistrées demeurent compatibles avec les versions précédentes et Supabase.

### Base de données

Aucune migration SQL n'est requise pour la V2.4.2. La langue choisie est enregistrée localement dans le navigateur (`energieLocale`) et les valeurs métier existantes demeurent compatibles avec Supabase.

### Passe de traduction exhaustive V2.4.2

- Traduction du message d'accueil et des avertissements du splash screen.
- Traduction complète du module Ressenti, de ses rappels et de ses messages de confirmation.
- Traduction des fenêtres de connexion, création de compte et récupération du mot de passe.
- Traduction des alertes, confirmations, invites, placeholders, attributs d'accessibilité et contenus créés dynamiquement.
- Observation des changements de texte dynamiques afin que les écrans rerendus restent dans la langue sélectionnée.

## V2.4.2 — Internationalisation complète

- Traduction des écrans Historique, Chronologie et Tableau de bord.
- Traduction des compteurs dynamiques avec pluriels anglais.
- Dates localisées en français canadien, français de France et anglais.
- Traduction des résumés quotidiens, du parcours, des périodes et des cartes d’observation.
- Aucune migration Supabase requise.


## Version 2.4.2
- Moteur de traduction renforcé pour fr-CA, fr-FR et anglais.
- Traduction des textes statiques, dynamiques, pluriels, alertes, profils, statistiques, chronologie et ressentis.
- Aucune migration de base de données requise.


## V2.4.3 — Journal et traductions ciblées

- Suppression du bouton redondant « + Autre » sous les repas enregistrés.
- Déplacement de « Copier le déjeuner d’hier » sous le type de repas.
- Le bouton de copie apparaît uniquement lorsque « Déjeuner » est sélectionné.
- Traduction complétée pour le type de repas dans la chronologie.
- Traduction complétée pour les observations dynamiques des Insights, notamment les repas nommés dans « Avant tes repas… » et l’observation sur les aliments fréquemment notés.
- Aucune migration SQL requise.


## V2.4.4 — Fenêtre de repas et type figé

- La fenêtre d’ajout et de modification d’un repas reste fixe à l’écran.
- Le défilement de la page derrière la fenêtre est bloqué pendant son ouverture.
- Le type de repas n’est plus modifiable dans la fenêtre : il reprend automatiquement la tuile choisie dans le Journal.
- Une tuile illustrée affiche clairement le type de repas sélectionné.
- « Copier le déjeuner d’hier » apparaît uniquement pour un déjeuner.
- Les repas favoris proposés sont limités au type de repas actuellement ouvert afin d’éviter toute ambiguïté.
- Aucune migration SQL requise.


## V2.4.5 — Heure compacte et autoremplissage
- Champ Heure présenté sur une seule ligne avec une petite horloge.
- Largeur du sélecteur d’heure réduite pour éviter tout débordement mobile.
- Autoremplissage désactivé sur les formulaires de suivi non liés au compte afin de limiter les suggestions « Préremplir le contact » du navigateur.


## V2.4.6 — Saisie mobile et autoremplissage

- Contournement renforcé de la suggestion Safari/iOS « Préremplir le contact ».
- Champs Sommeil et Activité convertis en saisies texte avec clavier numérique.
- Validation numérique conservée, y compris les décimales avec virgule ou point.
- Champ Heure compact conservé sur une seule ligne.


## V2.5.0 — Mode démo guidé

- Nouveau choix au premier lancement : explorer une démo ou commencer avec un journal vide.
- Génération locale de 180 jours de données fictives pour le profil « Phil ».
- Mascotte dérivée directement du logo pomme-éclair.
- Visite guidée animée en cinq étapes.
- Nouvelles découvertes à long terme :
  - produits laitiers et maux de tête;
  - café tardif et sommeil plus court;
  - hydratation et fatigue;
  - activité et humeur plus détendue.
- Comparaisons chiffrées, niveaux de confiance et explications « Voir pourquoi ».
- Mode démo clairement identifié et isolé de Supabase.
- Boutons pour revoir la visite ou commencer un journal personnel.
- Formulations prudentes : associations possibles, jamais de diagnostic.


## V2.5.2
Visite guidée étendue avec graphiques, profil et écran final clair. Construite à partir de la dernière V2.5.0 fonctionnelle.


## V2.5.3 — Démo toujours accessible

Correction importante : le message de bienvenue pouvait rester caché à cause des préférences déjà conservées dans le navigateur. La démo est maintenant accessible en tout temps grâce à :

- un bouton **Démo** permanent dans l’entête;
- une grande carte **Lancer la démo guidée** dans le Profil;
- une restauration du vrai journal après la sortie de la démo;
- des cibles corrigées dans la visite guidée;
- un cache de service worker V2.5.3 afin que la nouvelle interface soit réellement chargée.


## V2.6.0 — Expérience démo reconstruite

- Écran de choix de première ouverture indépendant des anciennes préférences.
- Démo guidée dans un panneau fixe qui ne peut pas passer derrière l’historique.
- Navigation automatique dans Journal, Historique, Tableau et Profil.
- Étapes plus riches avec preuve ou contexte à chaque écran.
- Aucun blocage du défilement et aucun changement de z-index du contenu.
- Restauration du vrai journal à la sortie de la démo.
- Démo fictive entièrement locale et isolée de Supabase.


## Nouveautés V2.8.0
- Section « Repas enregistrés » retirée du bas du Journal.
- Au dîner, copie rapide du souper de la veille pour les restants.
- Raccourcis vers les derniers repas saisis dans la fenêtre d’ajout.


## Nouveautés V2.9.0

- Les suggestions rapides sont maintenant séparées par type de repas : déjeuners, dîners, soupers, collations et boissons.
- Le dîner conserve en priorité le raccourci « Restants : copier le souper d’hier ».
- Les suggestions sont classées par fréquence d’utilisation avec un léger avantage aux repas récents.
- Les doublons simples causés par les espaces ou la ponctuation finale sont regroupés.



## V3.0.1 — Recommandation après un repas

- Analyse locale et prudente des repas enregistrés pour la journée.
- Affiche au maximum une petite idée après l’enregistrement d’un repas.
- Suggestions possibles : protéines, fruits/légumes, fibres ou hydratation.
- Aucun conseil lorsque les données sont trop vagues ou qu’aucun complément évident n’est utile.
- Aucun diagnostic, score, jugement ou conclusion de causalité.
- La carte disparaît automatiquement et peut être fermée immédiatement.

## V3.0.0 — Nutrition facultative
- Suppression de la carte « Ton parcours » dans l’Historique.
- Mode d’estimation nutritionnelle facultatif, activé par défaut dans Profil.
- Estimation locale à partir de mots courants, toujours modifiable.
- Récupération des valeurs Open Food Facts au scan lorsqu’elles existent.
- Les estimations sont indicatives et ne remplacent pas les données d’une étiquette ni les conseils d’un professionnel.
- Pour Supabase, exécuter la nouvelle ligne `alter table ... nutrition jsonb` du fichier `supabase-setup.sql`.


## V3.0.1 — Gestion des collations
- Toucher la carte Collation affiche les collations de la journée lorsqu’il y en a déjà.
- Chaque collation peut être modifiée ou supprimée individuellement.
- Un bouton permet d’ajouter une autre collation.
- Tout repas ouvert en modification possède maintenant un bouton Supprimer.


## Version 3.1.0
- Base locale de 272 aliments courants dans `foods.js`.
- Recherche bilingue FR/EN avec gestion des expressions longues pour éviter les doubles comptages (ex. « pomme de terre » vs « pomme »).
- Valeurs nutritionnelles estimées par portion courante; les valeurs peuvent être ajustées manuellement.


## Version 3.1.2
- Ajout de la carte d’estimation nutritionnelle dans le Journal.
- Totaux quotidiens des calories, protéines, glucides et lipides.

## Version 3.2.0
- Estimation nutritionnelle activée par défaut, y compris lors de la migration depuis une version antérieure.
- Une seule meilleure correspondance est retenue pour chaque ingrédient afin d’éviter les doubles calculs (ex. « thon en conserve » + « thon »).
- Les repas composés séparés par `+`, virgules, points-virgules, retours de ligne, « et » ou « avec » sont additionnés ingrédient par ingrédient.
- Meilleure tolérance aux marques ajoutées au nom d’un aliment et aux pluriels courants.
- Les données d’un produit scanné demeurent prioritaires et modifiables.


## V3.3.0 — Estimation nutritionnelle enrichie

- Remplacement des libellés visibles « Macros » par « Estimation nutritionnelle ».
- Ajout des fibres, sucres et sodium lorsqu’ils sont disponibles.
- Les valeurs absentes ne sont pas inventées ni affichées.
- Lecture de ces nutriments depuis Open Food Facts et ajout d’estimations prudentes pour des aliments courants de la base Énergie.


## V3.3.1 — Finition du Journal
- Affiche maintenant Fibres, Sucres et Sodium dans le résumé nutritionnel quotidien lorsque toutes les entrées de la journée disposent de ces valeurs.
- Corrige la condition qui empêchait ces trois nutriments d’apparaître dans le Journal.
- Réduit la hauteur de la tuile Journal et de son anneau de progression.
- Resserre l’espacement entre la progression quotidienne et l’estimation nutritionnelle.


## V3.3.5 — Suggestions et portions scannées
- La suggestion d’un repas principal peut être rouverte lors de la modification du repas.
- Aucun lien de suggestion n’est affiché pour les collations.
- Le scanner demande maintenant la quantité réellement consommée en grammes et recalcule les valeurs à partir des données pour 100 g lorsqu’elles sont disponibles.
