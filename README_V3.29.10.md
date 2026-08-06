# Énergie 3.29.10 — mise à jour forcée

- Ajoute `force-update.html` pour sortir une installation d’un ancien cache persistant.
- Cette page désenregistre les anciens service workers et supprime leurs caches.
- Elle redirige ensuite vers Énergie avec une URL unique non mise en cache.
- Les semaines du dimanche et la vue horizontale automatique de la 3.29.9 demeurent incluses.

Après le déploiement, ouvrir une seule fois `force-update.html` depuis l’adresse du site.
