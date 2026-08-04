# Énergie 3.21.1

## Synchronisation et rappel des ressentis

- Les nouvelles entrées conservent une valeur technique neutre dans l’ancienne colonne `fatigue_before` afin de rester compatibles avec les installations Supabase qui exigent encore une valeur de 1 à 5.
- Cette valeur n’est ni affichée ni utilisée dans les statistiques ou les observations.
- Les repas déjà placés en attente peuvent être resynchronisés normalement.
- Lorsqu’une journée contient au moins un repas, mais aucun ressenti avant ou après, un message discret explique pourquoi les ressentis sont essentiels aux comparaisons et aux tendances.
- Le message disparaît automatiquement dès qu’un ressenti est documenté.

