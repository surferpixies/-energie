# Énergie 3.56.49

## Profil — correction de l'ordre d'exécution
Le HTML du Profil était bien rendu, mais la transformation en accordéons était appelée tout à la fin de `renderProfile()`.
Si une initialisation intermédiaire interrompait la fonction, les cartes restaient donc dans leur ancien affichage.

La transformation est maintenant exécutée immédiatement après l'insertion des dernières cartes dynamiques
(À propos de moi, contexte physiologique, pas, etc.) et avant les liaisons d'événements.
