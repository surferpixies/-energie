# Énergie 3.25.1 — suggestions calculées sur le bon repas

- Le repas est maintenant intégré à la journée avant que sa suggestion soit calculée.
- Un nouveau repas ne peut plus recevoir par erreur une suggestion fondée sur le repas précédent.
- Les modifications apportées à la description sont prises en compte avant le nouveau calcul.
- Les aliments reconnus comme « céleris » et « poivrons » empêchent correctement une suggestion d’ajouter des légumes.
- La suggestion réellement enregistrée avec le repas reste visible lorsqu’on revient le modifier, au lieu d’être recalculée puis de disparaître.
- Une ancienne suggestion devenue incompatible avec la description actuelle est ignorée plutôt que réaffichée.
