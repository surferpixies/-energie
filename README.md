# Énergie & Repas V1.7.4

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
