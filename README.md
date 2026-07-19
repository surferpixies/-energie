# Énergie & Repas V1.2.1

Application web progressive (PWA) de suivi personnel : repas, fatigue, sommeil, eau et activité.

## Publication GitHub Pages

1. Décompressez le ZIP.
2. Remplacez les fichiers à la racine du dépôt GitHub par le contenu du dossier.
3. Conservez la publication GitHub Pages sur la branche `main`, dossier `/root`.
4. Sur iPhone, ouvrez l'adresse dans Safari puis utilisez **Partager → Sur l'écran d'accueil**.

## Protection des données

- Les données principales sont stockées dans `localStorage` sous la clé `energieRepasDB`.
- Une copie miroir est maintenue sous `energieRepasDB_shadow`.
- Avant une migration, une importation, une restauration ou une suppression, une sauvegarde locale est créée.
- L'application cherche aussi plusieurs anciens formats et clés de stockage afin de récupérer les données des versions précédentes.
- Utilisez régulièrement **Profil → Exporter JSON**. Le fichier exporté est la meilleure protection contre la suppression des données du navigateur.

## Important

Le navigateur conserve les données localement. Effacer les données de Safari, utiliser un autre navigateur ou changer de domaine peut rendre ces données inaccessibles. Une future version pourra ajouter une synchronisation infonuagique.

Cette application sert à observer des tendances personnelles. Elle ne fournit pas de diagnostic médical.


## Protection renforcée V1.2.1

- L'application ne sauvegarde plus automatiquement au démarrage.
- Une sauvegarde de l'ancienne copie est créée avant chaque écriture.
- Une migration est annulée si elle ferait passer un historique contenant des repas à zéro repas.
- Si un format inconnu ou illisible est détecté, l'application s'arrête au lieu de créer une base vide.
- Un bouton de téléchargement brut est présenté lors d'un arrêt de sécurité.
- La copie miroir est relue lorsque la copie principale est absente.
- Le compteur d'eau se règle directement en touchant les gouttes; le bouton « -1 » a été retiré.

Aucun stockage uniquement local ne peut garantir une protection absolue si Safari efface lui-même les données du site. L'export JSON demeure la copie externe la plus sûre.
