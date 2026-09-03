# Énergie 3.56.41 — Balance calorique

- Ajout d’un interrupteur **Suivre mon déficit / surplus calorique** dans Profil.
- Calcul optionnel de la dépense énergétique quotidienne estimée avec Mifflin–St Jeor et le niveau d’activité habituel.
- Comparaison avec les calories consignées : valeur négative = déficit estimé, valeur positive = surplus estimé.
- Nouveau graphique 30 jours dans Observations, sous les tendances de poids/calories, avec ligne d’équilibre à 0 kcal.
- Moyenne de balance affichée sur les journées calculables.
- Les activités saisies dans le Journal ne sont pas ajoutées au TDEE afin d’éviter un double comptage avec le niveau d’activité habituel.
- Aucun calcul n’est produit lorsque âge, sexe compatible avec l’équation, taille, activité, poids ou calories sont manquants.
- Le suivi peut être masqué sans supprimer les données existantes et le réglage est inclus dans la synchronisation Supabase.
