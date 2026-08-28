(() => {
  'use strict';
  const SUPPORTED=['fr-CA','fr-FR','en'];
  const stored=localStorage.getItem('energieLocale');
  const browser=(navigator.languages||[navigator.language||'fr-CA']).find(l=>/^fr-FR/i.test(l)||/^fr/i.test(l)||/^en/i.test(l));
  const locale=SUPPORTED.includes(stored)?stored:(/^fr-FR/i.test(browser||'')?'fr-FR':/^en/i.test(browser||'')?'en':'fr-CA');
  window.ENERGIE_LOCALE=locale;
  document.documentElement.lang=locale;

  const frFR={
    'Journal':'Journal','Historique':'Historique','Observations':'Observations','Profil':'Profil',
    'Déjeuner':'Petit-déjeuner','Dîner':'Déjeuner','Souper':'Dîner','Collation':'En-cas','Boisson':'Boisson',
    'Courriel':'E-mail','Adresse courriel':'Adresse e-mail','Mot de passe':'Mot de passe',
    'Sauvegarde infonuagique':'Sauvegarde dans le cloud','Sauvegarde en ligne':'Sauvegarde en ligne',
    'Repas enregistrés':'Repas enregistrés','Objectif d\'eau':"Objectif d’eau",'Nombre de gouttes affichées':'Nombre de gouttes affichées',
    'Rappels de ressenti':'Rappels de ressenti','Repas concernés':'Repas concernés','Délai après le repas':'Délai après le repas',
    'Autoriser les notifications':'Autoriser les notifications','Mon repas':'Mon repas','Ajouter un repas':'Ajouter un repas','Modifier le repas':'Modifier le repas',
    "Copier le déjeuner d'hier":"Copier le petit-déjeuner d’hier",'Choisir un repas favori':'Choisir un repas favori',
    'Choisir un favori…':'Choisir un favori…','Type de repas':'Type de repas','Heure':'Heure',
    'Ce que tu as mangé ou bu':'Ce que vous avez mangé ou bu','Énergie avant le repas':'Énergie avant le repas',
    'Photo facultative':'Photo facultative','Notes facultatives':'Notes facultatives','Enregistrer':'Enregistrer',
    'Sommeil de la nuit dernière':'Sommeil de la nuit dernière','Nombre d’heures':"Nombre d’heures",'Nombre d\'heures':"Nombre d’heures",
    'Ajouter une activité':'Ajouter une activité','Choisis une activité':'Choisissez une activité','Durée en minutes':'Durée en minutes',
    'Après le repas':'Après le repas','Comment te sens-tu?':'Comment vous sentez-vous ?','Qu’as-tu ressenti?':'Qu’avez-vous ressenti ?',
    'Sélectionne tous les éléments qui s’appliquent.':'Sélectionnez tous les éléments qui s’appliquent.',
    'Autre chose?':'Autre chose ?','Enregistrer le ressenti':'Enregistrer le ressenti',
    'Bienvenue':'Bienvenue','J’ai compris':'J’ai compris','Ne plus afficher ce message automatiquement':'Ne plus afficher ce message automatiquement',
    'Profil et préférences':'Profil et préférences','Protège ton historique':'Protégez votre historique',
    'La copie locale seule peut disparaître sur iPhone.':'La copie locale seule peut disparaître sur iPhone.',
    'Se connecter':'Se connecter','Se déconnecter':'Se déconnecter','Synchroniser':'Synchroniser',
    'Observations et recommandations':'Observations et recommandations','Insights personnels':'Observations personnelles',
    'Suggestions générales':'Suggestions générales','Afficher les sources':'Afficher les sources',
    'Message d’information':'Message d’information','Afficher':'Afficher','Sauvegarde supplémentaire':'Sauvegarde supplémentaire',
    'Exporter JSON':'Exporter en JSON','Importer JSON':'Importer un JSON','Mes favoris':'Mes favoris',
    'À noter':'À renseigner','À ajouter':'À ajouter','Plusieurs possibles':'Plusieurs possibles','Aucun repas pour cette journée.':'Aucun repas pour cette journée.',
    'Repas':'Repas','Sommeil':'Sommeil','Activité':'Activité','Hydratation':'Hydratation','Énergie avant':'Énergie avant',
    'Aujourd’hui':"Aujourd’hui",'Hier':'Hier','Jour précédent':'Jour précédent','Jour suivant':'Jour suivant',
    'Non connecté':'Non connecté','Hors ligne':'Hors ligne','Erreur synchro':'Erreur de synchronisation','Sauvegardé ☁️':'Sauvegardé ☁️',
    'Marche':'Marche','Course':'Course à pied','Vélo':'Vélo','Musculation':'Renforcement musculaire','Yoga':'Yoga','Natation':'Natation','Autre':'Autre',
    'Mal de tête':'Mal de tête','Mal de ventre':'Mal au ventre','Ballonnements':'Ballonnements','Nausées':'Nausées','Fatigue':'Fatigue',
    'Étourdissements':'Vertiges','Reflux':'Reflux','Gaz':'Gaz','Plein d’énergie':'Plein d’énergie','Bonne humeur':'Bonne humeur',
    'Bonne concentration':'Bonne concentration','Digestion facile':'Digestion facile','Je me sens bien':'Je me sens bien',
    'Langue':'Langue','Langue de l’application':'Langue de l’application','Français (Canada)':'Français (Canada)','Français (France)':'Français (France)','English':'English'
  };
  const en={
    'Journal':'Journal','Historique':'History','Observations':'Insights','Observations':'Insights','Profil':'Profile',
    'Déjeuner':'Breakfast','Dîner':'Lunch','Souper':'Dinner','Collation':'Snack','En-cas':'Snack','Boisson':'Drink','Repas':'Meal',
    'Mon repas':'My meal','Ajouter un repas':'Add a meal','Modifier le repas':'Edit meal','Choisir un repas favori':'Choose a favorite meal',
    'Choisir un favori…':'Choose a favorite…','Type de repas':'Meal type','Le type de repas':'Meal type','Heure':'Time','Ce que tu as mangé ou bu':'What you ate or drank',
    'Ce que vous avez mangé ou bu':'What you ate or drank','Énergie avant le repas':'Energy before the meal','Photo facultative':'Optional photo',
    'Retirer la photo':'Remove photo','Notes facultatives':'Optional notes','Enregistrer':'Save',"Copier le déjeuner d'hier":"Copy yesterday’s breakfast",
    'Repos':'Rest','Sommeil':'Sleep','Sommeil de la nuit dernière':'Last night’s sleep','Inscris simplement la durée totale approximative.':'Simply enter the approximate total duration.',
    "Nombre d'heures":'Number of hours','Nombre d’heures':'Number of hours','Enregistrer le sommeil':'Save sleep',
    'Mouvement':'Movement','Ajouter une activité':'Add an activity','Choisis une activité':'Choose an activity','Choisissez une activité':'Choose an activity',
    'Durée en minutes':'Duration in minutes','Intensité':'Intensity','Faible':'Low','Modérée':'Moderate','Élevée':'High','Calories estimées':'Estimated calories','Calories mesurées':'Measured calories','Activités enregistrées':'Saved activities',"Ajouter l'activité":'Add activity',
    'Marche':'Walk','Course':'Run','Course à pied':'Run','Vélo':'Cycling','Musculation':'Strength training','Renforcement musculaire':'Strength training','Yoga':'Yoga','Natation':'Swimming','Autre':'Other',
    'Après le repas':'After the meal','Ressenti':'Feeling','Comment te sens-tu?':'How do you feel?','Comment vous sentez-vous ?':'How do you feel?',
    'Qu’as-tu ressenti?':'What did you notice?','Qu’avez-vous ressenti ?':'What did you notice?','Sélectionne tous les éléments qui s’appliquent.':'Select everything that applies.',
    'Sélectionnez tous les éléments qui s’appliquent.':'Select everything that applies.','Autre chose?':'Anything else?','Autre chose ?':'Anything else?',
    'Enregistrer le ressenti':'Save feeling','Notes facultatives':'Optional notes','Bienvenue':'Welcome','J’ai compris':'I understand',
    'Ne plus afficher ce message automatiquement':'Do not show this message automatically again','Transparence':'Transparency','Pourquoi je vois ceci?':'Why am I seeing this?',
    'Sauvegarde infonuagique':'Cloud backup','Sauvegarde dans le cloud':'Cloud backup','Connexion':'Sign in','Créer un compte':'Create an account',
    'Adresse courriel':'Email address','Adresse e-mail':'Email address','Mot de passe':'Password','Confirmer le mot de passe':'Confirm password',
    'Me connecter':'Sign in','Créer mon compte':'Create my account','Mot de passe oublié':'Forgot password',
    'Journal':'Journal','Historique':'History','Profil et préférences':'Profile and preferences','Protège ton historique':'Protect your history','Protégez votre historique':'Protect your history',
    'La copie locale seule peut disparaître sur iPhone.':'A local-only copy may disappear from your iPhone.','Compte connecté':'Connected account',
    'Synchroniser':'Sync','Se déconnecter':'Sign out','Sauvegarde en ligne':'Online backup','Se connecter':'Sign in',
    'Observations et recommandations':'Insights and recommendations','Tu gardes le contrôle sur ce qui apparaît dans le tableau de bord.':'You control what appears in your dashboard.',
    'Insights personnels':'Personal insights','Observations personnelles':'Personal insights','Tendances calculées à partir de ton historique':'Patterns calculated from your history',
    'Observations nutritionnelles':'Nutrition observations','Estimations prudentes selon les descriptions saisies':'Careful estimates based on your descriptions',
    'Suggestions générales':'General suggestions','Conseils facultatifs et non moralisateurs':'Optional, non-judgmental suggestions','Afficher les sources':'Show sources',
    'Message d’information':'Information notice','Afficher':'Show','Rappels de ressenti':'Feeling reminders','Repas concernés':'Meals included',
    'Délai après le repas':'Delay after meal','Autoriser les notifications':'Allow notifications','Objectif d’eau':'Water goal',"Objectif d'eau":'Water goal',
    'Nombre de gouttes affichées':'Number of drops displayed','Mes favoris':'My favorites','Sauvegarde supplémentaire':'Additional backup',
    'Exporter JSON':'Export JSON','Exporter en JSON':'Export JSON','Importer JSON':'Import JSON','Importer un JSON':'Import JSON',
    'Aujourd’hui':'Today','Hier':'Yesterday','Jour précédent':'Previous day','Jour suivant':'Next day','Journal':'Journal','repas principaux':'main meals',
    'Commence par ton prochain repas':'Start with your next meal','À noter':'To add','À renseigner':'To add','À ajouter':'To add','Plusieurs possibles':'Multiple allowed',
    'Sommeil':'Sleep','Activité':'Activity','Hydratation':'Hydration','Énergie avant':'Energy before','Repas enregistrés':'Saved meals','Aucun repas pour cette journée.':'No meals saved for this day.',
    'Non connecté':'Not signed in','Hors ligne':'Offline','Erreur synchro':'Sync error','Sauvegardé ☁️':'Saved ☁️','à synchroniser':'to sync',
    'Mal de tête':'Headache','Mal de ventre':'Stomach ache','Mal au ventre':'Stomach ache','Ballonnements':'Bloating','Nausées':'Nausea','Fatigue':'Fatigue',
    'Étourdissements':'Dizziness','Vertiges':'Dizziness','Reflux':'Reflux','Gaz':'Gas','Plein d’énergie':'Full of energy','Bonne humeur':'Good mood',
    'Bonne concentration':'Good focus','Digestion facile':'Easy digestion','Je me sens bien':'I feel good',
    'Langue':'Language','Langue de l’application':'App language','Français (Canada)':'French (Canada)','Français (France)':'French (France)','English':'English'
  };
  Object.assign(frFR,{
    'Ressentis positifs':'Ressentis positifs','Digestion':'Digestion','Énergie et état général':'Énergie et état général',
    'Tête et sens':'Tête et sens','Réactions cutanées et respiratoires':'Réactions cutanées et respiratoires',
    'Humeur et envies':'Humeur et envies','Autres signes physiques':'Autres signes physiques',
    'Énergie stable':'Énergie stable','Plus énergique':'Plus énergique','Rassasié':'Rassasié',
    'Digestion confortable':'Digestion confortable','Léger après le repas':'Léger après le repas','Calme ou détendu':'Calme ou détendu',
    'Douleur abdominale':'Douleur abdominale','Crampes abdominales':'Crampes abdominales',
    'Reflux ou brûlures d’estomac':'Reflux ou brûlures d’estomac','Vomissements':'Vomissements','Diarrhée':'Diarrhée',
    'Constipation':'Constipation','Selles urgentes':'Selles urgentes','Sensation de lourdeur':'Sensation de lourdeur',
    'Digestion lente':'Digestion lente','Faim rapidement après le repas':'Faim rapidement après le repas',
    'Perte d’appétit':'Perte d’appétit','Somnolence':'Somnolence','Baisse d’énergie':'Baisse d’énergie',
    'Faiblesse':'Faiblesse','Tremblements':'Tremblements','Brouillard mental':'Brouillard mental',
    'Difficulté à se concentrer':'Difficulté à se concentrer','Migraine':'Migraine',
    'Sensibilité à la lumière':'Sensibilité à la lumière','Sensibilité au bruit':'Sensibilité au bruit',
    'Sensibilité aux odeurs':'Sensibilité aux odeurs','Vision trouble':'Vision trouble',
    'Démangeaisons':'Démangeaisons','Rougeurs':'Rougeurs','Urticaire':'Urticaire','Gonflement':'Gonflement',
    'Nez congestionné':'Nez bouché','Éternuements':'Éternuements','Gorge irritée':'Gorge irritée',
    'Irritabilité':'Irritabilité','Stress':'Stress','Anxiété':'Anxiété','Humeur basse':'Humeur maussade',
    'Envie intense de sucre':'Forte envie de sucre','Fringale':'Fringale','Palpitations':'Palpitations',
    'Bouffées de chaleur':'Bouffées de chaleur','Frissons':'Frissons','Soif inhabituelle':'Soif inhabituelle',
    'Envie fréquente d’uriner':'Envie fréquente d’uriner','Douleur musculaire':'Douleur musculaire'
  });
  Object.assign(en,{
    'Ressentis positifs':'Positive feelings','Digestion':'Digestion','Énergie et état général':'Energy and general wellbeing',
    'Tête et sens':'Head and senses','Réactions cutanées et respiratoires':'Skin and respiratory reactions',
    'Humeur et envies':'Mood and cravings','Autres signes physiques':'Other physical signs',
    'Énergie stable':'Steady energy','Plus énergique':'More energetic','Rassasié':'Satisfied',
    'Digestion confortable':'Comfortable digestion','Léger après le repas':'Light after the meal',
    'Calme ou détendu':'Calm or relaxed','Douleur abdominale':'Abdominal pain','Crampes abdominales':'Abdominal cramps',
    'Reflux ou brûlures d’estomac':'Reflux or heartburn','Vomissements':'Vomiting','Diarrhée':'Diarrhea',
    'Constipation':'Constipation','Selles urgentes':'Urgent bowel movement','Sensation de lourdeur':'Feeling of heaviness',
    'Digestion lente':'Slow digestion','Faim rapidement après le repas':'Hungry soon after the meal',
    'Perte d’appétit':'Loss of appetite','Somnolence':'Sleepiness','Baisse d’énergie':'Energy drop',
    'Faiblesse':'Weakness','Tremblements':'Shakiness','Brouillard mental':'Brain fog',
    'Difficulté à se concentrer':'Difficulty concentrating','Migraine':'Migraine',
    'Sensibilité à la lumière':'Light sensitivity','Sensibilité au bruit':'Sound sensitivity',
    'Sensibilité aux odeurs':'Smell sensitivity','Vision trouble':'Blurred vision',
    'Démangeaisons':'Itching','Rougeurs':'Redness','Urticaire':'Hives','Gonflement':'Swelling',
    'Nez congestionné':'Nasal congestion','Éternuements':'Sneezing','Gorge irritée':'Throat irritation',
    'Irritabilité':'Irritability','Stress':'Stress','Anxiété':'Anxiety','Humeur basse':'Low mood',
    'Envie intense de sucre':'Strong sugar craving','Fringale':'Craving','Palpitations':'Palpitations',
    'Bouffées de chaleur':'Hot flashes','Frissons':'Chills','Soif inhabituelle':'Unusual thirst',
    'Envie fréquente d’uriner':'Frequent urination','Douleur musculaire':'Muscle pain'
  });


  Object.assign(frFR, {
    'Changer le thème':'Changer le thème','Fermer':'Fermer','Aperçu':'Aperçu','Repos':'Repos','Mouvement':'Mouvement',
    'Type d’activité':"Type d’activité",'Ressenti général':'Ressenti général','Sécurité':'Sécurité','Choisir un mot de passe':'Choisir un mot de passe',
    'Presque terminé':'Presque terminé','Enregistrer le mot de passe':'Enregistrer le mot de passe',
    'Connexion directe dans l’app iPhone':"Connexion directe dans l’application iPhone",'Au moins 8 caractères':'Au moins 8 caractères','Répète le mot de passe':'Répétez le mot de passe',
    'Mot de passe oublié ou compte créé avec un lien magique?':'Mot de passe oublié ou compte créé avec un lien magique ?',
    'Cette application sert à suivre tes repas, ton niveau d’énergie avant de manger et certaines habitudes afin de t’aider à observer des tendances personnelles.':
      'Cette application sert à suivre vos repas, votre niveau d’énergie avant de manger et certaines habitudes afin de vous aider à observer des tendances personnelles.',
    'Un outil d’observation, pas un avis médical':'Un outil d’observation, pas un avis médical',
    'Les observations et suggestions sont informatives. Elles ne posent aucun diagnostic, ne prouvent pas un lien de cause à effet et ne remplacent pas les conseils d’un médecin, d’un nutritionniste ou d’un autre professionnel de la santé.':
      'Les observations et suggestions sont informatives. Elles ne posent aucun diagnostic, ne prouvent pas un lien de cause à effet et ne remplacent pas les conseils d’un médecin, d’un nutritionniste ou d’un autre professionnel de santé.',
    'Les estimations nutritionnelles peuvent être incomplètes, surtout lorsque l’application ne connaît pas les portions ni les valeurs nutritives exactes.':
      'Les estimations nutritionnelles peuvent être incomplètes, notamment lorsque l’application ne connaît pas les portions ni les valeurs nutritionnelles exactes.',
    'Ce mot de passe permettra la connexion directe dans l’app installée.':'Ce mot de passe permettra la connexion directe dans l’application installée.',
    'Ex. bagel, œufs et café':'Ex. : tartines, œufs et café','Contexte, digestion, humeur…':'Contexte, digestion, humeur…','Ex. 45':'Ex. : 45',
    'Commence par ton prochain repas':'Commencez par votre prochain repas','Cette carte repose uniquement sur tes données personnelles.':'Cette carte repose uniquement sur vos données personnelles.',
    'Aucun ressenti en attente':'Aucun ressenti en attente','Tu peux le modifier depuis le repas.':'Vous pouvez le modifier depuis le repas.',
    'Les rappels apparaîtront après tes repas principaux.':'Les rappels apparaîtront après vos repas principaux.',
    'Ajouter un ressenti':'Ajouter un ressenti','Modifier le ressenti':'Modifier le ressenti','Supprimer':'Supprimer','Ajouter aux favoris':'Ajouter aux favoris',
    'Aucune activité enregistrée pour cette journée.':'Aucune activité enregistrée pour cette journée.',
    'Ajoute un repas existant à tes favoris avec l’étoile.':'Ajoutez un repas existant à vos favoris grâce à l’étoile.','Aucun résultat.':'Aucun résultat.',
    'favoris':'favoris','verres notés':'verres enregistrés','jours suivis':'jours suivis','sommeil moyen':'sommeil moyen'
  });
  Object.assign(en, {
    'Changer le thème':'Change theme','Fermer':'Close','Aperçu':'Preview','Repos':'Rest','Mouvement':'Movement',
    'Type d’activité':'Activity type','Ressenti général':'Overall feeling','Sécurité':'Security','Choisir un mot de passe':'Choose a password',
    'Presque terminé':'Almost done','Enregistrer le mot de passe':'Save password','Connexion directe dans l’app iPhone':'Sign in directly in the iPhone app',
    'Au moins 8 caractères':'At least 8 characters','Répète le mot de passe':'Repeat the password',
    'Mot de passe oublié ou compte créé avec un lien magique?':'Forgot your password or created your account with a magic link?',
    'Cette application sert à suivre tes repas, ton niveau d’énergie avant de manger et certaines habitudes afin de t’aider à observer des tendances personnelles.':
      'This app helps you track meals, your energy before eating, and selected habits so you can notice personal patterns over time.',
    'Un outil d’observation, pas un avis médical':'A tracking tool, not medical advice',
    'Les observations et suggestions sont informatives. Elles ne posent aucun diagnostic, ne prouvent pas un lien de cause à effet et ne remplacent pas les conseils d’un médecin, d’un nutritionniste ou d’un autre professionnel de la santé.':
      'Insights and suggestions are for informational purposes only. They do not provide a diagnosis, prove cause and effect, or replace advice from a doctor, dietitian, or other healthcare professional.',
    'Les estimations nutritionnelles peuvent être incomplètes, surtout lorsque l’application ne connaît pas les portions ni les valeurs nutritives exactes.':
      'Nutrition estimates may be incomplete, especially when serving sizes and exact nutrition facts are unknown.',
    'Ce mot de passe permettra la connexion directe dans l’app installée.':'This password will let you sign in directly from the installed app.',
    'Ex. bagel, œufs et café':'E.g. bagel, eggs, and coffee','Contexte, digestion, humeur…':'Context, digestion, mood…','Ex. 45':'E.g. 45',
    'Commence par ton prochain repas':'Start with your next meal','Cette carte repose uniquement sur tes données personnelles.':'This card is based only on your personal data.',
    'Aucun ressenti en attente':'No pending check-ins','Tu peux le modifier depuis le repas.':'You can edit it from the meal.',
    'Les rappels apparaîtront après tes repas principaux.':'Reminders will appear after your main meals.',
    'Ajouter un ressenti':'Add a check-in','Modifier le ressenti':'Edit check-in','Supprimer':'Delete','Ajouter aux favoris':'Add to favorites',
    'Aucune activité enregistrée pour cette journée.':'No activity saved for this day.',
    'Ajoute un repas existant à tes favoris avec l’étoile.':'Use the star on a saved meal to add it to your favorites.','Aucun résultat.':'No results.',
    'favoris':'favorites','verres notés':'glasses logged','jours suivis':'days tracked','sommeil moyen':'average sleep',
    'Très faible':'Very low','Faible':'Low','Moyenne':'Moderate','Élevée':'High','Très élevée':'Very high','Préliminaire':'Preliminary',
    'Soirée':'Evening','Beau temps ce matin':'Clear morning','Beau temps cet après-midi':'Clear afternoon','Pluie aujourd’hui':'Rain today','Neige aujourd’hui':'Snow today',
    'Code météo absent':'Weather code unavailable','Géolocalisation indisponible':'Location unavailable',
    'Notifications autorisées.':'Notifications allowed.','Les notifications ne sont pas autorisées dans ce navigateur.':'Notifications are not allowed in this browser.',
    'Choisis un type d’activité.':'Choose an activity type.','Indique une durée en minutes.':'Enter a duration in minutes.',
    'Aucun déjeuner trouvé hier.':'No breakfast was found yesterday.','Aucun symptôme ou état sélectionné. Enregistrer seulement la note globale?':'No symptom or positive state selected. Save only the overall rating?',
    'Ce repas est déjà dans tes favoris.':'This meal is already in your favorites.','Nom du repas favori :':'Favorite meal name:',
    'Repas ajouté aux favoris ⭐':'Meal added to favorites ⭐','Supprimer ce repas?':'Delete this meal?',
    'Après l’inscription, confirme le courriel de Supabase.':'After signing up, confirm the email sent by Supabase.',
    'La connexion se fait directement dans l’application.':'You sign in directly in the app.','Connexion…':'Signing in…','Création du compte…':'Creating account…',
    'Le mot de passe doit contenir au moins 8 caractères.':'The password must contain at least 8 characters.','Les deux mots de passe ne sont pas identiques.':'The passwords do not match.',
    'Compte créé. Confirme le courriel, puis connecte-toi.':'Account created. Confirm your email, then sign in.','Entre d’abord ton adresse courriel.':'Enter your email address first.',
    'Courriel de récupération envoyé.':'Recovery email sent.','Les mots de passe ne sont pas identiques.':'The passwords do not match.','Minimum 8 caractères.':'Minimum 8 characters.',
    'Mot de passe enregistré.':'Password saved.','Importer aussi cette copie dans Supabase?':'Import this copy into Supabase too?','Ce fichier JSON ne peut pas être importé.':'This JSON file cannot be imported.',
    'Courriel ou mot de passe incorrect.':'Incorrect email or password.','Confirme d’abord ton adresse courriel.':'Confirm your email address first.',
    'Ce courriel possède déjà un compte.':'An account already exists for this email.','Trop de tentatives rapprochées. Attends un peu puis réessaie.':'Too many attempts in a short time. Wait a moment and try again.',
    'Une erreur est survenue.':'An error occurred.','Les observations sont désactivées dans les paramètres.':'Insights are disabled in settings.',
    'Continue d’enregistrer tes repas pour obtenir des observations.':'Keep logging meals to unlock insights.',
    'Ce résumé repose uniquement sur les données que tu as enregistrées.':'This summary is based only on the data you recorded.',
    'Cette journée contribue progressivement à mieux décrire tes habitudes.':'This day gradually adds context to your habits.',
    'Journée associée à plus d’énergie':'Day associated with higher energy','Énergie observée avant certains repas':'Energy observed before certain meals',
    'Ce que j’apprends sur toi':'What I’m learning about you','Tu prends un déjeuner presque tous les jours.':'You eat breakfast almost every day.','Tu choisis souvent un fruit comme collation.':'You often choose fruit as a snack.','Les légumes sont présents dans la majorité de tes soupers.':'Vegetables are present in most of your dinners.','Une source de protéines apparaît dans la plupart de tes repas principaux.':'A protein source appears in most of your main meals.','Ton hydratation est très constante les jours où tu la documentes.':'Your hydration is very consistent on the days you track it.','Ton journal devient assez complet pour faire ressortir progressivement des habitudes plus utiles.':'Your journal is becoming complete enough to gradually reveal more useful habits.','Aliments possiblement plus salés':'Foods that may be higher in sodium','Aliments possiblement plus sucrés':'Foods that may be higher in sugar',
    'Gras saturés à surveiller dans les choix fréquents':'Saturated fat in frequently logged foods','Certains aliments notés fréquemment peuvent contenir davantage de gras saturés. Il ne s’agit pas d’un jugement sur un repas; la variété au fil du temps est ce qui compte.':'Some frequently logged foods may contain more saturated fat. This is not a judgment about any meal; variety over time is what matters.','Peu de végétaux repérés dans les descriptions':'Few plant foods detected in descriptions',
    'Organisation mondiale de la Santé — Alimentation saine':'World Health Organization — Healthy diet','Santé Canada — Guide alimentaire canadien':"Health Canada — Canada's Food Guide",
    'Santé Canada — Limiter les aliments hautement transformés':'Health Canada — Limit highly processed foods','Santé Canada — Symbole nutritionnel sur le devant de l’emballage':'Health Canada — Front-of-package nutrition symbol'
  });

  Object.assign(frFR, {
    'Smart Timeline':'Chronologie intelligente','Ton historique, organisé naturellement':'Votre historique, organisé naturellement',
    'Les repas sont regroupés par journée, semaine et mois pour rester faciles à consulter avec le temps.':'Les repas sont regroupés par jour, semaine et mois pour rester faciles à consulter au fil du temps.',
    'Ton parcours':'Votre parcours','Résumé de la journée':'Résumé de la journée','Période':'Période','PÉRIODE':'PÉRIODE','Tout':'Tout','7 jours':'7 jours','Ce mois':'Ce mois','Cette année':'Cette année',
    'Type de repas':'Type de repas','⭐ Favoris':'⭐ Favoris','Énergie faible':'Énergie faible','Énergie élevée':'Énergie élevée','Chronologie':'Chronologie',
    'Rechercher un aliment, une note ou une date…':'Rechercher un aliment, une note ou une date…',
    'Tableau de bord & observations':'Tableau de bord et observations','Observe tes habitudes sans jugement':'Observez vos habitudes',
    'Les cartes décrivent des tendances possibles. Elles ne posent aucun diagnostic et ne prouvent jamais qu’un aliment cause un effet.':'Les cartes décrivent des tendances possibles. Elles ne posent aucun diagnostic et ne prouvent jamais qu’un aliment provoque un effet.',
    'Repas — 7 jours':'Repas — 7 jours','Repas au total':'Repas au total','Heure moyenne':'Heure moyenne','Énergie avant — jours récents':'Énergie avant — jours récents',
    'Pas encore assez de données.':'Pas encore assez de données.','énergie faible':'énergie faible','énergie élevée':'énergie élevée','Repas les plus fréquents':'Repas les plus fréquents',
    'Ajoute quelques repas pour voir le classement.':'Ajoutez quelques repas pour voir le classement.','🧠 Observations':'🧠 Observations',
    'Mode aperçu activé':'Mode aperçu activé','Tes vraies données':'Vos données réelles','Des données exemples montrent la présentation. Elles ne sont jamais sauvegardées.':'Des données d’exemple illustrent la présentation. Elles ne sont jamais enregistrées.',
    'Le tableau de bord utilise seulement tes repas enregistrés.':'Le tableau de bord utilise uniquement vos repas enregistrés.','Voir mes données':'Voir mes données','Voir l’aperçu':'Voir l’aperçu',
    'Les valeurs du mode aperçu sont fictives et servent uniquement à prévisualiser la présentation.':'Les valeurs du mode aperçu sont fictives et servent uniquement à prévisualiser la présentation.',
    'repas':'repas','journées':'jours','mois':'mois','jour de suivi':'jour de suivi','jours de suivi':'jours de suivi','Depuis le':'Depuis le',
    'fatigue moyenne':'fatigue moyenne','Sources générales':'Sources générales','Observation nutritionnelle estimée':'Observation nutritionnelle estimée',
    'Ambiance du jour':'Ambiance du jour','Beau temps ce matin':'Beau temps ce matin','Pluie aujourd’hui':'Pluie aujourd’hui','Neige aujourd’hui':'Neige aujourd’hui'
  });
  Object.assign(en, {
    'Smart Timeline':'Smart Timeline','Ton historique, organisé naturellement':'Your history, naturally organized',
    'Les repas sont regroupés par journée, semaine et mois pour rester faciles à consulter avec le temps.':'Meals are grouped by day, week, and month so they stay easy to browse over time.',
    'Ton parcours':'Your journey','Résumé de la journée':'Daily summary','Période':'Period','PÉRIODE':'PERIOD','Tout':'All','7 jours':'7 days','Ce mois':'This month','Cette année':'This year',
    'Type de repas':'Meal type','Le type de repas':'Meal type','⭐ Favoris':'⭐ Favorites','Énergie faible':'Low energy','Énergie élevée':'High energy','Chronologie':'Timeline',
    'Rechercher un aliment, une note ou une date…':'Search food, notes, or a date…',
    'Tableau de bord & observations':'Dashboard & insights','Observe tes habitudes sans jugement':'Notice your habits',
    'Les cartes décrivent des tendances possibles. Elles ne posent aucun diagnostic et ne prouvent jamais qu’un aliment cause un effet.':'These cards describe possible patterns. They do not diagnose anything or prove that a food causes an effect.',
    'Repas — 7 jours':'Meals — 7 days','Repas au total':'Total meals','Heure moyenne':'Average time','Énergie avant — jours récents':'Energy before meals — recent days',
    'Pas encore assez de données.':'Not enough data yet.','énergie faible':'low energy','énergie élevée':'high energy','Repas les plus fréquents':'Most frequent meals',
    'Ajoute quelques repas pour voir le classement.':'Log a few meals to see the ranking.','🧠 Observations':'🧠 Insights',
    'Mode aperçu activé':'Preview mode on','Tes vraies données':'Your actual data','Des données exemples montrent la présentation. Elles ne sont jamais sauvegardées.':'Sample data shows how the dashboard will look. It is never saved.',
    'Le tableau de bord utilise seulement tes repas enregistrés.':'The dashboard uses only your saved meals.','Voir mes données':'View my data','Voir l’aperçu':'View preview',
    'Les valeurs du mode aperçu sont fictives et servent uniquement à prévisualiser la présentation.':'Preview values are fictional and are shown only to demonstrate the presentation.',
    'repas':'meals','journées':'days','mois':'months','jour de suivi':'day tracked','jours de suivi':'days tracked','Depuis le':'Since',
    'fatigue moyenne':'average fatigue','Sources générales':'General sources','Observation nutritionnelle estimée':'Estimated nutrition observation',
    'Ambiance du jour':'Today’s atmosphere','Beau temps ce matin':'Clear this morning','Pluie aujourd’hui':'Rain today','Neige aujourd’hui':'Snow today',
    'Aucun repas pour cette journée.':'No meals saved for this day.','Tableau de bord':'Dashboard','Observations':'Insights','carte':'card','cartes':'cards'
  });


  // V2.4.3 — nettoyage UX du Journal et derniers correctifs de traduction ciblés.
  Object.assign(en, {
    'Local':'Local','Changer le thème':'Change theme','Navigation principale':'Main navigation','Fermer':'Close','Aperçu':'Preview',
    'Un outil d’observation, pas un avis médical':'A tracking tool, not medical advice',
    'Cette application sert à suivre tes repas, ton niveau d’énergie avant de manger et certaines habitudes afin de t’aider à observer des tendances personnelles.':'This app helps you track meals, your energy before eating, and selected habits so you can notice personal patterns.',
    'Les observations et suggestions sont informatives. Elles ne posent aucun diagnostic, ne prouvent pas un lien de cause à effet et ne remplacent pas les conseils d’un médecin, d’un nutritionniste ou d’un autre professionnel de la santé.':'Insights and suggestions are informational. They do not provide a diagnosis, prove cause and effect, or replace advice from a physician, dietitian, or other health professional.',
    'Connexion directe dans l’app iPhone':'Sign in directly in the iPhone app','Mot de passe oublié ou compte créé avec un lien magique?':'Forgot your password or created your account with a magic link?',
    'Sécurité':'Security','Choisir un mot de passe':'Choose a password','Presque terminé':'Almost done','Nouveau mot de passe':'New password',
    'Revoir les limites et l’utilisation prévue de l’application':'Review the app’s limits and intended use',
    'Choisis si et quand l’application te rappelle de noter ton ressenti après un repas.':'Choose whether and when the app reminds you to record how you feel after a meal.',
    'Désactive ceci pour ne recevoir aucun rappel':'Turn this off to receive no reminders',
    'Sur le Web, les rappels système dépendent des permissions du navigateur et peuvent nécessiter que l’app soit ouverte. Les ressentis dus restent toujours visibles dans le Journal.':'On the web, system reminders depend on browser permissions and may require the app to be open. Due check-ins always remain visible in the Journal.',
    'Connecte-toi afin que les repas et favoris soient enregistrés dans Supabase.':'Sign in so your meals and favorites are saved in Supabase.',
    'La synchronisation Supabase est active.':'Supabase sync is active.','Compte connecté':'Connected account',
    'Ajoute « Pourquoi je vois ceci? » aux cartes':'Add “Why am I seeing this?” to cards',
    'Observations nutritionnelles':'Nutrition insights','Tendances calculées à partir de ton historique':'Patterns calculated from your history',
    'Estimations prudentes selon les descriptions saisies':'Careful estimates based on entered descriptions',
    'Conseils facultatifs et non moralisateurs':'Optional, non-judgmental suggestions',
    'Choisir une activité':'Choose an activity','Ajouter l\'activité':'Add activity','Ressenti général':'Overall feeling',
    'Répondre':'Respond','Utiliser':'Use','Limites importantes':'Important limitations',
    'Cette observation est automatisée et informative. Elle ne constitue ni un diagnostic, ni une preuve de causalité, ni un remplacement d’un avis professionnel.':'This automated insight is informational. It is not a diagnosis, proof of causation, or a substitute for professional advice.',
    'Cette observation utilise les données disponibles dans l’application.':'This insight uses the data available in the app.',
    'Tu es hors ligne. Les changements seront synchronisés plus tard.':'You are offline. Changes will sync later.',
    'Très faible':'Very low','Faible':'Low','Moyenne':'Moderate','Bonne':'Good','Excellente':'Excellent',
    '1 heure':'1 hour','2 heures':'2 hours','3 heures':'3 hours','Tous':'All',
    'Utilisé':'Used','fois':'times','Confiance':'Confidence','élevée':'high','moyenne':'moderate','faible':'low',
    'Repas principaux':'Main meals','repas principal':'main meal','repas principaux':'main meals',
    'journée':'day','jour':'day','jours':'days','mois':'months','Depuis':'Since',
    'Aucun ressenti en attente':'No pending check-ins','Dernier ressenti':'Latest feeling',
    '😊 Ressenti':'😊 Feeling','⭐ Mes favoris':'⭐ My favorites','Observation personnelle':'Personal insight','Observations':'Insight','Observations':'Insights','Pourquoi je vois ceci?':'Why am I seeing this?',
    'Sources générales':'General sources','Afficher les sources':'Show sources',
    'Objectif d\'eau':'Water goal','Nombre de gouttes affichées':'Number of drops displayed',
    'Sauvegarde supplémentaire':'Additional backup','copie(s) locale(s) de sécurité.':'local backup copies.',
    'Énergie V':'Energy V','Enregistrer le mot de passe':'Save password',
    'Repas concernés':'Meals included','Délai après le repas':'Delay after meal',
    'Mode aperçu activé':'Preview mode enabled','Tes vraies données':'Your real data',
    'Des données exemples montrent la présentation. Elles ne sont jamais sauvegardées.':'Sample data demonstrates the experience. It is never saved.',
    'Les observations utilisent seulement tes repas enregistrés.':'The dashboard uses only your logged meals.',
    'Repas au total':'Total meals','Résumé de la journée':'Daily summary','Chronologie':'Timeline','Période':'Period','PÉRIODE':'PERIOD',
    'Ton parcours':'Your journey','Observe tes habitudes sans jugement':'Notice your habits',
    'Observations':'Dashboard & insights','Smart Timeline':'Smart Timeline',
    'Ton historique, organisé naturellement':'Your history, naturally organized',
    'Repas — 7 jours':'Meals — 7 days','Heure moyenne':'Average time','Énergie avant — jours récents':'Energy before meals — recent days',
    'Repas les plus fréquents':'Most frequent meals','Pas encore assez de données.':'Not enough data yet.',
    'Journal':'Journal','Historique':'History','Tableau':'Insights','Profil':'Profile'
  });

  Object.assign(frFR, {
    'Changer le thème':'Changer de thème','Navigation principale':'Navigation principale','Fermer':'Fermer',
    'Cette application sert à suivre tes repas, ton niveau d’énergie avant de manger et certaines habitudes afin de t’aider à observer des tendances personnelles.':'Cette application permet de suivre vos repas, votre niveau d’énergie avant de manger et certaines habitudes afin de vous aider à observer des tendances personnelles.',
    'Un outil d’observation, pas un avis médical':'Un outil d’observation, pas un avis médical',
    'Les observations et suggestions sont informatives. Elles ne posent aucun diagnostic, ne prouvent pas un lien de cause à effet et ne remplacent pas les conseils d’un médecin, d’un nutritionniste ou d’un autre professionnel de la santé.':'Les observations et suggestions sont informatives. Elles ne posent aucun diagnostic, ne prouvent pas de lien de cause à effet et ne remplacent pas les conseils d’un médecin, d’un diététicien ou d’un autre professionnel de santé.',
    'Connexion directe dans l’app iPhone':'Connexion directe dans l’application iPhone',
    'Mot de passe oublié ou compte créé avec un lien magique?':'Mot de passe oublié ou compte créé avec un lien magique ?',
    'Choisis si et quand l’application te rappelle de noter ton ressenti après un repas.':'Choisissez si et quand l’application vous rappelle de noter votre ressenti après un repas.',
    'Désactive ceci pour ne recevoir aucun rappel':'Désactivez cette option pour ne recevoir aucun rappel',
    'Connecte-toi afin que les repas et favoris soient enregistrés dans Supabase.':'Connectez-vous afin que vos repas et favoris soient enregistrés dans Supabase.',
    'Tu es hors ligne. Les changements seront synchronisés plus tard.':'Vous êtes hors ligne. Les modifications seront synchronisées ultérieurement.',
    'Répondre':'Répondre','Utiliser':'Utiliser','Limites importantes':'Limites importantes',
    '😊 Ressenti':'😊 Ressenti','⭐ Mes favoris':'⭐ Mes favoris','Observation personnelle':'Observation personnelle','Très faible':'Très faible','Faible':'Faible','Moyenne':'Moyenne','Bonne':'Bonne','Excellente':'Excellente'
  });



  // V3.7.0 — Sprint 2C : interface du moteur d’observations alimentaires.
  Object.assign(en, {
    'Observations alimentaires':'Food insights','Ce que tes repas semblent révéler':'What your meals may be revealing',
    'Nouvelle tendance détectée':'New trend detected','Tendance forte':'Strong trend','Tendance modérée':'Moderate trend','Tendance légère':'Slight trend',
    'Avec':'With','Sans':'Without','journées analysées':'days analyzed','journée analysée':'day analyzed',
    'Ton journal apprend encore':'Your journal is still learning',
    'Continue à remplir ton journal. Après quelques semaines, Énergie commencera à repérer des tendances personnelles entre tes repas et ton niveau d’énergie.':'Keep filling in your journal. After a few weeks, Énergie will begin noticing personal patterns between your meals and energy level.',
    'actuellement analysable':'currently analyzable','actuellement analysables':'currently analyzable',
    'journée analysable':'analyzable day','journées analysables':'analyzable days','documentée':'documented','documentées':'documented',
    'Ces observations comparent uniquement les journées de ton propre historique. Elles décrivent des associations possibles, ne prouvent aucune cause et ne constituent jamais un diagnostic.':'These insights compare only days from your own history. They describe possible associations, do not prove a cause, and never constitute a diagnosis.',
    'Pourquoi cette tendance apparaît-elle?':'Why does this trend appear?','À interpréter avec prudence':'Interpret with care',
    'Une association ne signifie pas que cet aliment ou cette catégorie est la cause du niveau d’énergie observé. Le sommeil, l’hydratation, les portions, le moment des repas et d’autres facteurs peuvent varier.':'An association does not mean that this food or category caused the observed energy level. Sleep, hydration, portions, meal timing, and other factors may vary.',
    'Comment cette observation est calculée':'How this insight is calculated',
    'Énergie classe les descriptions de repas par catégories, compare les journées avec et sans la catégorie, puis conserve seulement les écarts suffisamment nets avec assez de journées comparables.':'Énergie classifies meal descriptions into categories, compares days with and without the category, and keeps only sufficiently clear differences supported by enough comparable days.',
    'Le moteur préfère ne rien afficher lorsque les données sont insuffisantes ou que la différence est trop faible.':'The engine prefers to show nothing when there is not enough data or the difference is too small.',
    'Autres observations':'Other insights','Continue d’enregistrer tes repas pour obtenir d’autres observations personnelles.':'Keep logging meals to unlock other personal insights.'
  });
  Object.assign(frFR, {
    'Observations alimentaires':'Observations alimentaires','Ce que tes repas semblent révéler':'Ce que vos repas semblent révéler',
    'Nouvelle tendance détectée':'Nouvelle tendance détectée','Tendance forte':'Tendance forte','Tendance modérée':'Tendance modérée','Tendance légère':'Tendance légère',
    'Ton journal apprend encore':'Votre journal apprend encore',
    'Continue à remplir ton journal. Après quelques semaines, Énergie commencera à repérer des tendances personnelles entre tes repas et ton niveau d’énergie.':'Continuez à remplir votre journal. Après quelques semaines, Énergie commencera à repérer des tendances personnelles entre vos repas et votre niveau d’énergie.',
    'Ces observations comparent uniquement les journées de ton propre historique. Elles décrivent des associations possibles, ne prouvent aucune cause et ne constituent jamais un diagnostic.':'Ces observations comparent uniquement les journées de votre propre historique. Elles décrivent des associations possibles, ne prouvent aucune cause et ne constituent jamais un diagnostic.',
    'Pourquoi cette tendance apparaît-elle?':'Pourquoi cette tendance apparaît-elle ?',
    'Une association ne signifie pas que cet aliment ou cette catégorie est la cause du niveau d’énergie observé. Le sommeil, l’hydratation, les portions, le moment des repas et d’autres facteurs peuvent varier.':'Une association ne signifie pas que cet aliment ou cette catégorie est à l’origine du niveau d’énergie observé. Le sommeil, l’hydratation, les portions, l’heure des repas et d’autres facteurs peuvent varier.',
    'Énergie classe les descriptions de repas par catégories, compare les journées avec et sans la catégorie, puis conserve seulement les écarts suffisamment nets avec assez de journées comparables.':'Énergie classe les descriptions de repas par catégories, compare les journées avec et sans la catégorie, puis conserve uniquement les écarts suffisamment nets reposant sur assez de journées comparables.',
    'Continue d’enregistrer tes repas pour obtenir d’autres observations personnelles.':'Continuez à enregistrer vos repas pour obtenir d’autres observations personnelles.'
  });

  // V3.7.1 — Le cerveau d’Énergie.
  Object.assign(en, {
    'Le cerveau d’Énergie':'Énergie’s brain','Je fais connaissance avec toi':'I’m getting to know you','Le cerveau d’Énergie apprend encore':'Énergie’s brain is still learning',
    'Premières connexions détectées':'First connections detected','Mes observations gagnent en confiance':'My insights are gaining confidence','Ton journal est riche en données':'Your journal is rich in data',
    'Les premières tendances se préparent':'Your first trends are taking shape','Continue simplement à remplir ton journal. Le cerveau d’Énergie compare déjà tes journées, mais préfère attendre avant de montrer une observation trop fragile.':'Keep filling in your journal. Énergie’s brain is already comparing your days, but prefers to wait rather than show an insight that is too fragile.',
    'Analyse avancée':'Advanced analysis','La croissance continue avec chaque nouvelle journée.':'Growth continues with every new day.','avant les premières tendances':'until the first trends','pour renforcer les observations':'to strengthen insights','vers un journal riche':'toward a rich journal'
  });
  Object.assign(frFR, {
    'Je fais connaissance avec toi':'Je fais connaissance avec vous','Le cerveau d’Énergie apprend encore':'Le cerveau d’Énergie apprend encore','Premières connexions détectées':'Premières connexions détectées','Mes observations gagnent en confiance':'Mes observations gagnent en fiabilité','Ton journal est riche en données':'Votre journal est riche en données',
    'Les premières tendances se préparent':'Les premières tendances se préparent','Continue simplement à remplir ton journal. Le cerveau d’Énergie compare déjà tes journées, mais préfère attendre avant de montrer une observation trop fragile.':'Continuez simplement à remplir votre journal. Le cerveau d’Énergie compare déjà vos journées, mais préfère attendre avant d’afficher une observation trop fragile.'
  });


  // V3.15.1 — audit complet de localisation (anglais et français de France).
  Object.assign(en, {
    "(facultatif)":"(optional)",
    "Ajout rapide":"Quick add",
    "Ajoute rapidement son nom au repas":"Quickly add its name to the meal",
    "Ajouter au repas":"Add to meal",
    "Aperçu de la caméra":"Camera preview",
    "Aperçu de la démo":"Demo preview",
    "Bienvenue dans":"Welcome to",
    "Calories":"Calories",
    "Cauchemars":"Nightmares",
    "Cerveau":"Brain",
    "Commencer avec mon journal":"Start with my journal",
    "Commencer mon journal":"Start my journal",
    "Continuer":"Continue",
    "Continuer à explorer la démo":"Continue exploring the demo",
    "Derniers repas":"Recent meals",
    "Difficulté à s’endormir":"Difficulty falling asleep",
    "Durée de l’activité en minutes":"Activity duration in minutes",
    "Découvre ce que ton journal peut raconter avec le temps.":"Discover what your journal can reveal over time.",
    "Découvre comment Énergie transforme de petites notes quotidiennes en tendances personnelles.":"Discover how Énergie turns small daily notes into personal patterns.",
    "Effacer les valeurs":"Clear values",
    "Entre la valeur de ta montre ou de ton appareil pour remplacer l’estimation.":"Enter the value from your watch or device to replace the estimate.",
    "Entre un nom":"Enter a name",
    "Entrer le numéro sous le code-barres":"Enter the number below the barcode",
    "Estimation approximative basée sur une portion courante. Les recettes et portions réelles peuvent varier.":"Approximate estimate based on a typical serving. Actual recipes and portions may vary.",
    "Estimation indicative selon l’activité, la durée et l’intensité.":"Indicative estimate based on activity, duration, and intensity.",
    "Estimation nutritionnelle":"Nutrition estimate",
    "Estimer":"Estimate",
    "Explore six mois de données fictives de Phil, puis vois comment les repas, le sommeil, l’eau, l’activité et le ressenti deviennent des observations utiles.":"Explore six months of Phil’s fictional data, then see how meals, sleep, water, activity, and feelings become useful insights.",
    "Explorer la démo guidée":"Explore guided demo",
    "Explorer librement":"Explore freely",
    "Fermer la visite":"Close tour",
    "Fibres (g)":"Fiber (g)",
    "Glucides (g)":"Carbohydrates (g)",
    "Icône Énergie":"Énergie icon",
    "Important":"Important",
    "Intensité de l’activité":"Activity intensity",
    "Journal fictif":"Fictional journal",
    "La durée compte, mais le contexte de la nuit aussi.":"Duration matters, but so does the context of the night.",
    "La démo demeure entièrement locale et n’est jamais envoyée à Supabase.":"The demo remains entirely local and is never sent to Supabase.",
    "Les observations ne prouvent pas un lien de cause à effet, ne posent aucun diagnostic et ne remplacent pas un professionnel de la santé.":"Insights do not prove cause and effect, provide a diagnosis, or replace a health professional.",
    "Levé pour uriner":"Got up to urinate",
    "Lipides (g)":"Fat (g)",
    "Mes collations":"My snacks",
    "Modifie la quantité pour calculer seulement ce que tu as réellement mangé.":"Adjust the quantity to calculate only what you actually ate.",
    "Nom de l’aliment":"Food name",
    "Nombre d’heures de sommeil":"Hours of sleep",
    "Nutrition facultative":"Optional nutrition",
    "Observer, jamais diagnostiquer":"Observe, never diagnose",
    "Place le code-barres dans le cadre. Énergie récupère uniquement le nom du produit, que tu peux modifier avant de l’ajouter.":"Place the barcode inside the frame. Énergie retrieves only the product name, which you can edit before adding it.",
    "Produit reconnu":"Product recognized",
    "Protéines (g)":"Protein (g)",
    "Préparation de la caméra…":"Preparing camera…",
    "Quantité consommée":"Amount consumed",
    "Recherche de produits : Open Food Facts. Les valeurs nutritionnelles, lorsqu’elles existent, restent approximatives et modifiables.":"Product search: Open Food Facts. Nutrition values, when available, remain approximate and editable.",
    "Rechercher":"Search",
    "Retour":"Back",
    "Revoir la visite":"Replay tour",
    "Rien de particulier":"Nothing in particular",
    "Ronflements / apnée":"Snoring / apnea",
    "Réessayer la caméra":"Try camera again",
    "Réveil très tôt":"Woke very early",
    "Réveils fréquents":"Frequent awakenings",
    "Scanner un produit":"Scan a product",
    "Sodium (mg)":"Sodium (mg)",
    "Sucres (g)":"Sugars (g)",
    "Trop chaud / inconfort":"Too hot / discomfort",
    "Tu peux choisir plusieurs réponses.":"You can choose multiple answers.",
    "Tu viens d’explorer 180 jours de journal.":"You just explored 180 days of journal data.",
    "Type de connexion":"Sign-in method",
    "Visite guidée":"Guided tour",
    "Visite terminée":"Tour complete",
    "ou":"or",
    "tendances":"patterns",
    "À propos d’Énergie":"About Énergie",
    "Énergie a relié des repas, du sommeil, de l’hydratation, de l’activité et des ressentis — tout en restant prudent sur ce que les données peuvent réellement dire.":"Énergie connected meals, sleep, hydration, activity, and feelings—while remaining cautious about what the data can truly say.",
    "Énergie aide à repérer des associations possibles entre les repas, le sommeil, l’hydratation, l’activité et le ressenti.":"Énergie helps identify possible associations between meals, sleep, hydration, activity, and feelings.",
    "Étape 1":"Step 1",
    "✓ Graphiques":"✓ Charts",
    "✓ Historique détaillé":"✓ Detailed history",
    "✓ Journal quotidien":"✓ Daily journal",
    "✓ Tendances expliquées":"✓ Explained patterns",
    "＋ Ajouter une collation":"＋ Add a snack",
    "🌙 Qu'est-ce qui a marqué ton sommeil ?":"🌙 What stood out about your sleep?",
    "🍱 Restants : copier le souper d'hier":"🍱 Leftovers: copy yesterday’s dinner",
    "🍳 Copier le déjeuner d'hier":"🍳 Copy yesterday’s breakfast",
    "💡 Voir la suggestion":"💡 View suggestion",
    "📝 Commentaire":"📝 Comment",
    "Cet accès de démonstration n’est pas activé pour ce compte.":"Demo access is not enabled for this account.",
    "Ce profil de démonstration est en lecture seule.":"This demo profile is read-only.",
    "Quitter la démo et revenir à ton journal? Les données fictives seront retirées.":"Leave the demo and return to your journal? Fictional data will be removed.",
    "Connecte-toi avec un compte autorisé pour ouvrir les profils de démonstration.":"Sign in with an authorized account to open demo profiles.",
    "Aucun déjeuner trouvé hier.":"No breakfast found yesterday.",
    "Aucun souper trouvé hier.":"No dinner found yesterday.",
    "Supprimer ce repas?":"Delete this meal?",
    "Aucune collation enregistrée.":"No snacks saved.",
    "Autorise la caméra, puis vise le code-barres.":"Allow camera access, then point it at the barcode.",
    "Entre un numéro de code-barres valide.":"Enter a valid barcode number.",
    "Impossible d’ouvrir le scanner. Entre le numéro sous le code-barres.":"Unable to open the scanner. Enter the number below the barcode.",
    "La caméra n’est pas disponible ici. Entre le numéro manuellement.":"The camera is not available here. Enter the number manually.",
    "Place le code-barres au centre du cadre.":"Center the barcode in the frame.",
    "Recherche du produit…":"Searching for product…",
    "Recherche impossible pour le moment. Entre le nom manuellement.":"Search is unavailable right now. Enter the name manually.",
    "Produit non trouvé. Tu peux entrer son nom.":"Product not found. You can enter its name.",
    "Le produit existe, mais son nom est manquant.":"The product exists, but its name is missing.",
    "Produit trouvé dans tes scans récents.":"Product found in your recent scans.",
    "Tu peux simplifier ou modifier le nom avant de l’ajouter.":"You can simplify or edit the name before adding it.",
    "Entre une durée de sommeil entre 0 et 24 heures.":"Enter a sleep duration between 0 and 24 hours.",
    "Non noté":"Not recorded",
    "Aucun ressenti":"No feeling recorded",
    "Aucune donnée pour cette journée.":"No data for this day.",
    "Pas encore commencé":"Not started yet",
    "Peu de données":"Limited data",
    "Données limitées":"Limited data",
    "Ouvrir le Cerveau":"Open Brain",
    "Mémoire alimentaire":"Food memory",
    "Ta mémoire grandit":"Your memory is growing",
    "Réparation de la mémoire alimentaire":"Repairing food memory",
    "Synchronisation de la mémoire alimentaire":"Syncing food memory",
    "Copie avant démo non enregistrée":"Pre-demo copy was not saved",
    "Copie de la mémoire avant démo impossible":"Unable to copy memory before demo",
    "Restauration de la mémoire impossible":"Unable to restore memory",
    "Mode démo":"Demo mode",
    "Démo locale temporaire":"Temporary local demo",
    "Profil ouvert":"Profile opened",
    "Démo":"Demo",
    "Observation":"Insight",
    "Symptômes":"Symptoms",
    "Observations négatives":"Negative observations",
    "Aucun signalement":"No reports",
    "Activité et détente":"Activity and relaxation",
    "Hydratation et énergie":"Hydration and energy",
    "Une journée de plus compte":"One more day counts",
    "Aujourd’hui, j’apprends encore un peu grâce à ton journal.":"Today, I’m learning a little more from your journal.",
    "Chaque journée m’aide à mieux comprendre tes habitudes.":"Each day helps me understand your habits better.",
    "Chaque nouvelle journée m’aide à distinguer une vraie répétition d’une simple coïncidence.":"Each new day helps me distinguish a real pattern from a simple coincidence.",
    "Chaque repas ajouté aide le Cerveau à mieux comprendre tes habitudes.":"Each meal you add helps the Brain understand your habits better.",
    "Plus ton historique grandit, plus mes observations deviennent précises.":"The more your history grows, the more precise my insights become.",
    "Les tendances les plus fiables prennent du temps à apparaître.":"The most reliable patterns take time to appear.",
    "Je préfère attendre suffisamment de données plutôt que de te montrer une conclusion fragile.":"I prefer to wait for enough data rather than show you a fragile conclusion.",
    "Je compare maintenant tes repas avec ton énergie, ton sommeil et ton hydratation.":"I’m now comparing your meals with your energy, sleep, and hydration.",
    "Le cerveau reste prudent":"The brain remains cautious",
    "J’apprends":"I’m learning",
    "Je découvre":"I’m discovering",
    "Ton journal commence à détecter des tendances":"Your journal is starting to detect patterns",
    "Ton journal connaît maintenant bien tes habitudes":"Your journal now knows your habits well",
    "Votre journal commence à détecter des tendances":"Your journal is starting to detect patterns",
    "Votre journal connaît maintenant bien vos habitudes":"Your journal now knows your habits well",
    "Très forte tendance":"Very strong pattern",
    "Très inhabituel":"Very unusual",
    "Ajoute encore quelques repas pour qu’une habitude claire puisse se dégager.":"Add a few more meals so a clear habit can emerge.",
    "Continue normalement; le Cerveau vérifie surtout la stabilité de tes habitudes.":"Keep going as usual; the Brain is mainly checking the stability of your habits.",
    "Continue simplement à noter tes repas; une suggestion plus personnalisée apparaîtra avec le temps.":"Keep logging your meals; a more personalized suggestion will appear over time.",
    "Tes repas sont déjà variés et structurés.":"Your meals are already varied and well structured.",
    "Ton alimentation demeure variée et régulière.":"Your diet remains varied and regular.",
    "Tes routines d’activité et d’hydratation sont constantes.":"Your activity and hydration routines are consistent.",
    "Aucune priorité particulière ne ressort; poursuis simplement ton suivi.":"No particular priority stands out; simply continue tracking.",
    "Aucune association négative répétée ne se distingue jusqu’ici.":"No repeated negative association stands out so far.",
    "Cette tendance utilise uniquement les données disponibles dans ton journal.":"This pattern uses only the data available in your journal.",
    "Cette comparaison ne tient pas compte de toutes les différences entre les journées.":"This comparison does not account for every difference between days.",
    "D’autres facteurs peuvent expliquer une partie de cette différence.":"Other factors may explain part of this difference.",
    "Cette association ne prouve pas qu’une durée de sommeil cause directement la différence.":"This association does not prove that sleep duration directly causes the difference.",
    "Il s’agit d’une association dans le journal, pas d’un diagnostic ni d’une preuve d’intolérance.":"This is an association in the journal, not a diagnosis or proof of intolerance.",
    "Le journal contient beaucoup de données, mais aucune différence suffisamment claire et répétée ne ressort actuellement. Le Cerveau préfère ne pas créer une tendance artificielle.":"The journal contains a lot of data, but no sufficiently clear and repeated difference currently stands out. The Brain prefers not to create an artificial pattern.",
    "Les symptômes enregistrés ici apparaîtront automatiquement ici.":"Symptoms recorded here will appear automatically.",
    "Les états positifs enregistrés ici apparaîtront automatiquement ici.":"Positive states recorded here will appear automatically."
  });
  Object.assign(frFR, {
    "Ajoute rapidement son nom au repas":"Ajoutez rapidement son nom au repas",
    "Commencer avec mon journal":"Commencer avec mon journal",
    "Commencer mon journal":"Commencer mon journal",
    "Découvre ce que ton journal peut raconter avec le temps.":"Découvrez ce que votre journal peut révéler avec le temps.",
    "Découvre comment Énergie transforme de petites notes quotidiennes en tendances personnelles.":"Découvrez comment Énergie transforme de petites notes quotidiennes en tendances personnelles.",
    "Entre la valeur de ta montre ou de ton appareil pour remplacer l’estimation.":"Saisissez la valeur de votre montre ou de votre appareil pour remplacer l’estimation.",
    "Explore six mois de données fictives de Phil, puis vois comment les repas, le sommeil, l’eau, l’activité et le ressenti deviennent des observations utiles.":"Explorez six mois de données fictives de Phil, puis découvrez comment les repas, le sommeil, l’eau, l’activité et le ressenti deviennent des observations utiles.",
    "Modifie la quantité pour calculer seulement ce que tu as réellement mangé.":"Modifiez la quantité pour calculer uniquement ce que vous avez réellement mangé.",
    "Place le code-barres dans le cadre. Énergie récupère uniquement le nom du produit, que tu peux modifier avant de l’ajouter.":"Placez le code-barres dans le cadre. Énergie récupère uniquement le nom du produit, que vous pouvez modifier avant de l’ajouter.",
    "Tu peux choisir plusieurs réponses.":"Vous pouvez choisir plusieurs réponses.",
    "Tu viens d’explorer 180 jours de journal.":"Vous venez d’explorer 180 jours de journal.",
    "🌙 Qu'est-ce qui a marqué ton sommeil ?":"🌙 Qu’est-ce qui a marqué votre sommeil ?",
    "Cet accès de démonstration n’est pas activé pour ce compte.":"Cet accès de démonstration n’est pas activé pour ce compte.",
    "Ce profil de démonstration est en lecture seule.":"Ce profil de démonstration est en lecture seule.",
    "Quitter la démo et revenir à ton journal? Les données fictives seront retirées.":"Quitter la démo et revenir à votre journal ? Les données fictives seront supprimées.",
    "Connecte-toi avec un compte autorisé pour ouvrir les profils de démonstration.":"Connectez-vous avec un compte autorisé pour ouvrir les profils de démonstration.",
    "Autorise la caméra, puis vise le code-barres.":"Autorisez la caméra, puis visez le code-barres.",
    "Entre un numéro de code-barres valide.":"Saisissez un numéro de code-barres valide.",
    "Impossible d’ouvrir le scanner. Entre le numéro sous le code-barres.":"Impossible d’ouvrir le scanner. Saisissez le numéro sous le code-barres.",
    "La caméra n’est pas disponible ici. Entre le numéro manuellement.":"La caméra n’est pas disponible ici. Saisissez le numéro manuellement.",
    "Place le code-barres au centre du cadre.":"Placez le code-barres au centre du cadre.",
    "Recherche impossible pour le moment. Entre le nom manuellement.":"La recherche est momentanément indisponible. Saisissez le nom manuellement.",
    "Produit non trouvé. Tu peux entrer son nom.":"Produit introuvable. Vous pouvez saisir son nom.",
    "Produit trouvé dans tes scans récents.":"Produit trouvé dans vos scans récents.",
    "Tu peux simplifier ou modifier le nom avant de l’ajouter.":"Vous pouvez simplifier ou modifier le nom avant de l’ajouter.",
    "Entre une durée de sommeil entre 0 et 24 heures.":"Saisissez une durée de sommeil comprise entre 0 et 24 heures.",
    "Ta mémoire grandit":"Votre mémoire s’enrichit",
    "Aujourd’hui, j’apprends encore un peu grâce à ton journal.":"Aujourd’hui, j’en apprends encore un peu grâce à votre journal.",
    "Chaque journée m’aide à mieux comprendre tes habitudes.":"Chaque journée m’aide à mieux comprendre vos habitudes.",
    "Chaque nouvelle journée m’aide à distinguer une vraie répétition d’une simple coïncidence.":"Chaque nouvelle journée m’aide à distinguer une véritable répétition d’une simple coïncidence.",
    "Chaque repas ajouté aide le Cerveau à mieux comprendre tes habitudes.":"Chaque repas ajouté aide le Cerveau à mieux comprendre vos habitudes.",
    "Plus ton historique grandit, plus mes observations deviennent précises.":"Plus votre historique s’enrichit, plus mes observations deviennent précises.",
    "Je préfère attendre suffisamment de données plutôt que de te montrer une conclusion fragile.":"Je préfère attendre suffisamment de données plutôt que de vous présenter une conclusion fragile.",
    "Je compare maintenant tes repas avec ton énergie, ton sommeil et ton hydratation.":"Je compare maintenant vos repas avec votre énergie, votre sommeil et votre hydratation.",
    "Ton journal commence à détecter des tendances":"Votre journal commence à détecter des tendances",
    "Ton journal connaît maintenant bien tes habitudes":"Votre journal connaît maintenant bien vos habitudes",
    "Ajoute encore quelques repas pour qu’une habitude claire puisse se dégager.":"Ajoutez encore quelques repas afin qu’une habitude claire puisse se dégager.",
    "Continue normalement; le Cerveau vérifie surtout la stabilité de tes habitudes.":"Continuez normalement ; le Cerveau vérifie surtout la stabilité de vos habitudes.",
    "Continue simplement à noter tes repas; une suggestion plus personnalisée apparaîtra avec le temps.":"Continuez simplement à noter vos repas ; une suggestion plus personnalisée apparaîtra avec le temps.",
    "Tes repas sont déjà variés et structurés.":"Vos repas sont déjà variés et structurés.",
    "Ton alimentation demeure variée et régulière.":"Votre alimentation reste variée et régulière.",
    "Tes routines d’activité et d’hydratation sont constantes.":"Vos habitudes d’activité et d’hydratation sont régulières.",
    "Aucune priorité particulière ne ressort; poursuis simplement ton suivi.":"Aucune priorité particulière ne se dégage ; poursuivez simplement votre suivi.",
    "Cette tendance utilise uniquement les données disponibles dans ton journal.":"Cette tendance utilise uniquement les données disponibles dans votre journal.",
    "Il s’agit d’une association dans le journal, pas d’un diagnostic ni d’une preuve d’intolérance.":"Il s’agit d’une association observée dans le journal, et non d’un diagnostic ou d’une preuve d’intolérance.",
    "(facultatif)":"(facultatif)",
    "Ajout rapide":"Ajout rapide",
    "Ajouter au repas":"Ajouter au repas",
    "Aperçu de la caméra":"Aperçu de la caméra",
    "Aperçu de la démo":"Aperçu de la démo",
    "Bienvenue dans":"Bienvenue dans",
    "Calories":"Calories",
    "Cauchemars":"Cauchemars",
    "Cerveau":"Cerveau",
    "Continuer":"Continuer",
    "Continuer à explorer la démo":"Continuer à explorer la démo",
    "Derniers repas":"Derniers repas",
    "Difficulté à s’endormir":"Difficulté à s’endormir",
    "Durée de l’activité en minutes":"Durée de l’activité en minutes",
    "Effacer les valeurs":"Effacer les valeurs",
    "Entre un nom":"Entre un nom",
    "Entrer le numéro sous le code-barres":"Entrer le numéro sous le code-barres",
    "Estimation approximative basée sur une portion courante. Les recettes et portions réelles peuvent varier.":"Estimation approximative basée sur une portion courante. Les recettes et portions réelles peuvent varier.",
    "Estimation indicative selon l’activité, la durée et l’intensité.":"Estimation indicative selon l’activité, la durée et l’intensité.",
    "Estimation nutritionnelle":"Estimation nutritionnelle",
    "Estimer":"Estimer",
    "Explorer la démo guidée":"Explorer la démo guidée",
    "Explorer librement":"Explorer librement",
    "Fermer la visite":"Fermer la visite",
    "Fibres (g)":"Fibres (g)",
    "Glucides (g)":"Glucides (g)",
    "Icône Énergie":"Icône Énergie",
    "Important":"Important",
    "Intensité de l’activité":"Intensité de l’activité",
    "Journal fictif":"Journal fictif",
    "La durée compte, mais le contexte de la nuit aussi.":"La durée compte, mais le contexte de la nuit aussi.",
    "La démo demeure entièrement locale et n’est jamais envoyée à Supabase.":"La démo demeure entièrement locale et n’est jamais envoyée à Supabase.",
    "Les observations ne prouvent pas un lien de cause à effet, ne posent aucun diagnostic et ne remplacent pas un professionnel de la santé.":"Les observations ne prouvent pas un lien de cause à effet, ne posent aucun diagnostic et ne remplacent pas un professionnel de la santé.",
    "Levé pour uriner":"Levé pour uriner",
    "Lipides (g)":"Lipides (g)",
    "Mes collations":"Mes collations",
    "Nom de l’aliment":"Nom de l’aliment",
    "Nombre d’heures de sommeil":"Nombre d’heures de sommeil",
    "Nutrition facultative":"Nutrition facultative",
    "Observer, jamais diagnostiquer":"Observer, jamais diagnostiquer",
    "Produit reconnu":"Produit reconnu",
    "Protéines (g)":"Protéines (g)",
    "Préparation de la caméra…":"Préparation de la caméra…",
    "Quantité consommée":"Quantité consommée",
    "Recherche de produits : Open Food Facts. Les valeurs nutritionnelles, lorsqu’elles existent, restent approximatives et modifiables.":"Recherche de produits : Open Food Facts. Les valeurs nutritionnelles, lorsqu’elles existent, restent approximatives et modifiables.",
    "Rechercher":"Rechercher",
    "Retour":"Retour",
    "Revoir la visite":"Revoir la visite",
    "Rien de particulier":"Rien de particulier",
    "Ronflements / apnée":"Ronflements / apnée",
    "Réessayer la caméra":"Réessayer la caméra",
    "Réveil très tôt":"Réveil très tôt",
    "Réveils fréquents":"Réveils fréquents",
    "Scanner un produit":"Scanner un produit",
    "Sodium (mg)":"Sodium (mg)",
    "Sucres (g)":"Sucres (g)",
    "Trop chaud / inconfort":"Trop chaud / inconfort",
    "Type de connexion":"Type de connexion",
    "Visite guidée":"Visite guidée",
    "Visite terminée":"Visite terminée",
    "ou":"ou",
    "tendances":"tendances",
    "À propos d’Énergie":"À propos d’Énergie",
    "Énergie a relié des repas, du sommeil, de l’hydratation, de l’activité et des ressentis — tout en restant prudent sur ce que les données peuvent réellement dire.":"Énergie a relié des repas, du sommeil, de l’hydratation, de l’activité et des ressentis — tout en restant prudent sur ce que les données peuvent réellement dire.",
    "Énergie aide à repérer des associations possibles entre les repas, le sommeil, l’hydratation, l’activité et le ressenti.":"Énergie aide à repérer des associations possibles entre les repas, le sommeil, l’hydratation, l’activité et le ressenti.",
    "Étape 1":"Étape 1",
    "✓ Graphiques":"✓ Graphiques",
    "✓ Historique détaillé":"✓ Historique détaillé",
    "✓ Journal quotidien":"✓ Journal quotidien",
    "✓ Tendances expliquées":"✓ Tendances expliquées",
    "＋ Ajouter une collation":"＋ Ajouter une collation",
    "🍱 Restants : copier le souper d'hier":"🍱 Restants : copier le souper d'hier",
    "🍳 Copier le déjeuner d'hier":"🍳 Copier le déjeuner d'hier",
    "💡 Voir la suggestion":"💡 Voir la suggestion",
    "📝 Commentaire":"📝 Commentaire",
    "Aucun déjeuner trouvé hier.":"Aucun déjeuner trouvé hier.",
    "Aucun souper trouvé hier.":"Aucun souper trouvé hier.",
    "Supprimer ce repas?":"Supprimer ce repas?",
    "Aucune collation enregistrée.":"Aucune collation enregistrée.",
    "Recherche du produit…":"Recherche du produit…",
    "Le produit existe, mais son nom est manquant.":"Le produit existe, mais son nom est manquant.",
    "Non noté":"Non noté",
    "Aucun ressenti":"Aucun ressenti",
    "Aucune donnée pour cette journée.":"Aucune donnée pour cette journée.",
    "Pas encore commencé":"Pas encore commencé",
    "Peu de données":"Peu de données",
    "Données limitées":"Données limitées",
    "Ouvrir le Cerveau":"Ouvrir le Cerveau",
    "Mémoire alimentaire":"Mémoire alimentaire",
    "Réparation de la mémoire alimentaire":"Réparation de la mémoire alimentaire",
    "Synchronisation de la mémoire alimentaire":"Synchronisation de la mémoire alimentaire",
    "Copie avant démo non enregistrée":"Copie avant démo non enregistrée",
    "Copie de la mémoire avant démo impossible":"Copie de la mémoire avant démo impossible",
    "Restauration de la mémoire impossible":"Restauration de la mémoire impossible",
    "Mode démo":"Mode démo",
    "Démo locale temporaire":"Démo locale temporaire",
    "Profil ouvert":"Profil ouvert",
    "Démo":"Démo",
    "Observation":"Observation",
    "Symptômes":"Symptômes",
    "Observations négatives":"Observations négatives",
    "Aucun signalement":"Aucun signalement",
    "Activité et détente":"Activité et détente",
    "Hydratation et énergie":"Hydratation et énergie",
    "Une journée de plus compte":"Une journée de plus compte",
    "Les tendances les plus fiables prennent du temps à apparaître.":"Les tendances les plus fiables prennent du temps à apparaître.",
    "Le cerveau reste prudent":"Le cerveau reste prudent",
    "J’apprends":"J’apprends",
    "Je découvre":"Je découvre",
    "Votre journal commence à détecter des tendances":"Votre journal commence à détecter des tendances",
    "Votre journal connaît maintenant bien vos habitudes":"Votre journal connaît maintenant bien vos habitudes",
    "Très forte tendance":"Très forte tendance",
    "Très inhabituel":"Très inhabituel",
    "Aucune association négative répétée ne se distingue jusqu’ici.":"Aucune association négative répétée ne se distingue jusqu’ici.",
    "Cette comparaison ne tient pas compte de toutes les différences entre les journées.":"Cette comparaison ne tient pas compte de toutes les différences entre les journées.",
    "D’autres facteurs peuvent expliquer une partie de cette différence.":"D’autres facteurs peuvent expliquer une partie de cette différence.",
    "Cette association ne prouve pas qu’une durée de sommeil cause directement la différence.":"Cette association ne prouve pas qu’une durée de sommeil cause directement la différence.",
    "Le journal contient beaucoup de données, mais aucune différence suffisamment claire et répétée ne ressort actuellement. Le Cerveau préfère ne pas créer une tendance artificielle.":"Le journal contient beaucoup de données, mais aucune différence suffisamment claire et répétée ne ressort actuellement. Le Cerveau préfère ne pas créer une tendance artificielle.",
    "Les symptômes enregistrés ici apparaîtront automatiquement ici.":"Les symptômes enregistrés ici apparaîtront automatiquement ici.",
    "Les états positifs enregistrés ici apparaîtront automatiquement ici.":"Les états positifs enregistrés ici apparaîtront automatiquement ici."
  });


  // Audit de localisation — Brain, Tableau intelligent, tendances et suppléments.
  Object.assign(en, {
    'Cerveau':'Brain','Tendance':'Trend','Tendances':'Trends','Tendance forte':'Strong trend','Tendance modérée':'Moderate trend',
    'Nouvelle observation mémorisée':'New insight saved','Nouvelle observation mémorisée dans le journal':'New insight saved in your journal',
    'Valeurs approximatives':'Approximate values','Valeurs approximatives, calculées à partir des aliments reconnus.':'Approximate values calculated from recognized foods.',
    'Les 7 derniers jours':'Last 7 days','Comparaison avec les 7 jours précédents.':'Compared with the previous 7 days.',
    'Comparaison avec les 7 jours précédents. Ces variations montrent des associations dans ton journal, pas des liens de cause à effet.':'Compared with the previous 7 days. These changes show associations in your journal, not cause-and-effect relationships.',
    'La semaine est plutôt stable par rapport aux 7 jours précédents.':'The week is fairly stable compared with the previous 7 days.',
    'Les tendances se préciseront avec quelques jours de données.':'The trends will become clearer after a few more days of data.',
    'Données à venir':'More data needed','Continue à remplir ton journal pour faire ressortir cette tendance.':'Keep filling in your journal to reveal this trend.',
    'Stable':'Stable','À venir':'Coming soon','Repas complets':'Complete meals',
    'Suppléments':'Supplements','Coche ce que tu as pris aujourd’hui. Les éléments restants restent décochés.':'Check what you took today. Items you did not take remain unchecked.',
    'Ajoute ceux que tu prends et ils apparaîtront cochés par défaut dans le journal.':'Add the supplements you take and they will appear in your journal.',
    'Aucun supplément ajouté pour le moment.':'No supplements added yet.','Ex. Vitamine D3':'e.g. Vitamin D3',
    'Tableau intelligent':'Smart dashboard','Tableau':'Dashboard','Point fort':'Strength','Habitude observée':'Observed habit','Suggestion principale':'Main suggestion',
    'Éléments signalés':'Reported items','Accompagnement professionnel':'Professional support','Préparer mes rendez-vous':'Prepare for my appointments',
    'Prépare des sujets à apporter lors de tes rendez-vous.':'Prepare topics to bring up at your appointments.',
    'Affiche dans le Tableau une section « À discuter avec votre professionnel »':'Shows a “Discuss with your healthcare professional” section in the Dashboard',
    'Aucune donnée n’est partagée automatiquement. Tu gardes le contrôle de ton journal en tout temps.':'No data is shared automatically. You remain in control of your journal at all times.',
    'À discuter avec votre professionnel':'Discuss with your healthcare professional',
    'Voici des sujets possibles tirés uniquement de votre journal. Choisissez ceux qui vous semblent pertinents.':'Here are possible topics based only on your journal. Choose the ones that feel relevant to you.',
    'Ces observations servent à préparer une conversation. Elles ne constituent ni un diagnostic ni une recommandation médicale.':'These observations are meant to help prepare a conversation. They are neither a diagnosis nor medical advice.',
    'La place des fibres dans vos repas':'The role of fibre in your meals','Les aliments riches en fibres apparaissent peu souvent dans les repas documentés.':'High-fibre foods appear infrequently in the meals you logged.',
    'Les protéines au déjeuner':'Protein at breakfast','Plusieurs déjeuners enregistrés ne mentionnent pas clairement une source de protéines.':'Several logged breakfasts do not clearly mention a source of protein.',
    'L’énergie en après-midi':'Afternoon energy','Une énergie plus faible a été notée à quelques reprises durant l’après-midi.':'Lower energy was noted a few times during the afternoon.',
    'La régularité des repas':'Meal regularity','Plusieurs journées ne contiennent pas les trois repas principaux dans le journal.':'Several days do not include all three main meals in the journal.',
    'Vos priorités actuelles':'Your current priorities','Votre journal peut servir de point de départ pour préciser ce que vous souhaitez améliorer ou mieux comprendre.':'Your journal can be a starting point for clarifying what you would like to improve or understand better.',
    'Fatigue':'Fatigue','Mal de tête':'Headache','Mal de ventre':'Stomach ache','Ballonnements':'Bloating','Nausées':'Nausea','Reflux':'Reflux','Gaz':'Gas',
    'Contexte de cette journée':'Context for this day','Comparé à tes habitudes personnelles':'Compared with your personal habits','Repas précédents':'Previous meals',
    'Aucun repas précédent enregistré cette journée.':'No previous meal was logged for this day.','Non noté':'Not logged','Non notée':'Not logged',
    'Observation personnelle':'Personal insight','Observation nutritionnelle estimée':'Estimated nutrition insight','Pourquoi je vois ceci?':'Why am I seeing this?',
    'Limites importantes':'Important limitations','Sources générales':'General sources','Cette carte repose uniquement sur tes données personnelles.':'This card is based only on your personal data.',
    'Cette observation utilise les données disponibles dans l’application.':'This insight uses the data available in the app.',
    'Cette observation est automatisée et informative. Elle ne constitue ni un diagnostic, ni une preuve de causalité, ni un remplacement d’un avis professionnel.':'This insight is automated and informational. It is not a diagnosis, proof of causation, or a substitute for professional advice.',
    'Avec les données recueillies':'Based on the data collected','Je commence à voir certaines tendances dans ton journal.':'I am starting to see some patterns in your journal.',
    'Chaque repas ajouté aidera Énergie à faire ressortir tes habitudes positives.':'Every meal you add will help Énergie highlight your positive habits.',
    'Ajoute encore quelques repas pour qu’une habitude claire puisse se dégager.':'Add a few more meals so a clear habit can emerge.',
    'Continue simplement à noter tes repas; une suggestion plus personnalisée apparaîtra avec le temps.':'Keep logging your meals; a more personalized suggestion will appear over time.',
    'Estimation nutritionnelle':'Nutrition estimate','Protéines':'Protein','Glucides':'Carbohydrates','Lipides':'Fat','Fibres':'Fibre','Sucres':'Sugars','Sodium':'Sodium',
    'Ambiance saisonnière':'Seasonal theme','Icônes saisonnières':'Seasonal icons','Affiche une petite icône près de la date dans le Journal':'Shows a small icon beside the date in the Journal',
    'De petites décorations changent selon la date consultée, les saisons et certains moments de l’année.':'Small decorations change based on the selected date, the seasons, and certain times of year.',
    'Tu gardes le contrôle sur ce qui apparaît dans les observations.':'You control what appears in Insights.',
    'Affiche par défaut les calories, protéines, glucides, lipides, fibres, sucres et sodium disponibles. Tout reste modifiable et approximatif.':'Shows available calories, protein, carbohydrates, fat, fibre, sugars, and sodium by default. Everything remains editable and approximate.',
    'Revoir les limites et l’utilisation prévue de l’application':'Review the app’s limitations and intended use',
    'Choisis si et quand l’application te rappelle de noter ton ressenti après un repas.':'Choose whether and when the app reminds you to log how you feel after a meal.',
    'Désactive ceci pour ne recevoir aucun rappel':'Turn this off to receive no reminders',
    'Sur le Web, les rappels système dépendent des permissions du navigateur et peuvent nécessiter que l’app soit ouverte. Les ressentis dus restent toujours visibles dans le Journal.':'On the web, system reminders depend on browser permissions and may require the app to be open. Due check-ins always remain visible in the Journal.'
  });
  Object.assign(frFR, {
    'Nouvelle observation mémorisée dans le journal':'Nouvelle observation enregistrée dans votre journal',
    'Coche ce que tu as pris aujourd’hui. Les éléments restants restent décochés.':'Cochez ce que vous avez pris aujourd’hui. Les autres éléments restent décochés.',
    'Ajoute ceux que tu prends et ils apparaîtront cochés par défaut dans le journal.':'Ajoutez ceux que vous prenez ; ils apparaîtront ensuite dans votre journal.',
    'Continue à remplir ton journal pour faire ressortir cette tendance.':'Continuez à remplir votre journal pour faire ressortir cette tendance.',
    'Comparaison avec les 7 jours précédents. Ces variations montrent des associations dans ton journal, pas des liens de cause à effet.':'Comparaison avec les 7 jours précédents. Ces variations montrent des associations dans votre journal, et non des liens de cause à effet.',
    'Prépare des sujets à apporter lors de tes rendez-vous.':'Préparez des sujets à aborder lors de vos rendez-vous.',
    'Aucune donnée n’est partagée automatiquement. Tu gardes le contrôle de ton journal en tout temps.':'Aucune donnée n’est partagée automatiquement. Vous gardez le contrôle de votre journal à tout moment.',
    'Comparé à tes habitudes personnelles':'Comparé à vos habitudes personnelles',
    'Cette carte repose uniquement sur tes données personnelles.':'Cette carte repose uniquement sur vos données personnelles.',
    'Chaque repas ajouté aidera Énergie à faire ressortir tes habitudes positives.':'Chaque repas ajouté aidera Énergie à faire ressortir vos habitudes positives.',
    'Ajoute encore quelques repas pour qu’une habitude claire puisse se dégager.':'Ajoutez encore quelques repas afin qu’une habitude claire puisse se dégager.',
    'Continue simplement à noter tes repas; une suggestion plus personnalisée apparaîtra avec le temps.':'Continuez simplement à noter vos repas ; une suggestion plus personnalisée apparaîtra avec le temps.',
    'Tu gardes le contrôle sur ce qui apparaît dans les observations.':'Vous gardez le contrôle sur ce qui apparaît dans les observations.',
    'Choisis si et quand l’application te rappelle de noter ton ressenti après un repas.':'Choisissez si et quand l’application vous rappelle de noter votre ressenti après un repas.',
    'Désactive ceci pour ne recevoir aucun rappel':'Désactivez cette option pour ne recevoir aucun rappel'
  });



  // Audit complet ciblé — Cerveau, bandeau du Journal et estimation nutritionnelle.
  Object.assign(en, {
    'Le cerveau apprend':'The brain is learning',
    'Chaque journée nourrit ton arbre':'Every day helps your tree grow',
    'Continue simplement à noter tes repas et ton ressenti. Je compare progressivement les journées qui se ressemblent.':'Keep logging your meals and how you feel. I gradually compare similar days.',
    'Le cerveau en prend note et vérifiera si cette situation se répète avant de te présenter une tendance.':'The brain is taking note and will check whether this happens again before showing you a pattern.',
    'Le cerveau commence avec toi':'The brain starts with you',
    'Le cerveau reste prudent':'The brain remains cautious',
    'Je préfère attendre suffisamment de données plutôt que de te montrer une conclusion fragile.':'I prefer to wait for enough data rather than show you a weak conclusion.',
    'Le cerveau d’Énergie':'Énergie’s brain',
    'Analyse avancée':'Advanced analysis',
    'La croissance continue avec chaque nouvelle journée.':'Growth continues with each new day.',
    'Observations alimentaires':'Food insights',
    'Ce que tes repas semblent révéler':'What your meals may be revealing',
    'Ces observations comparent uniquement les journées de ton propre historique. Elles décrivent des associations possibles, ne prouvent aucune cause et ne constituent jamais un diagnostic.':'These insights compare only days from your own history. They describe possible associations, do not prove causation, and are never a diagnosis.',
    'Date inconnue':'Unknown date','Aujourd’hui':'Today','Hier':'Yesterday',
    'Je découvre':'Discovering','Je sais':'Well known','Je pense':'Likely','J’apprends':'Learning',
    'Toujours':'Always','Souvent':'Often','Parfois':'Sometimes','Rare':'Rarely',
    'Je reconnais ce repas, mais j’ai encore besoin de détails pour apprendre ses ingrédients habituels.':'I recognize this meal, but I still need more detail to learn its usual ingredients.',
    'Pourquoi le Cerveau pense cela?':'Why does the Brain think this?',
    'Observations personnalisées':'Personalized insights',
    'Le moteur compare ton propre historique avec prudence.':'The engine carefully compares your own history.',
    'Le Cerveau rassemble encore des preuves':'The Brain is still gathering evidence',
    'Il faut plusieurs journées comparables dans chaque groupe avant qu’une association apparaisse. Aucune conclusion ne sera forcée.':'Several comparable days are needed in each group before an association appears. No conclusion will be forced.',
    'Ces observations décrivent des associations dans ton propre journal. Elles ne prouvent aucune cause et ne remplacent jamais un avis médical.':'These insights describe associations in your own journal. They do not prove causation and never replace medical advice.',
    'Ce que le Cerveau connaît de toi':'What the Brain knows about you',
    'Ta mémoire alimentaire personnelle':'Your personal food memory',
    'Le Cerveau connaît maintenant assez bien plusieurs de tes habitudes alimentaires.':'The Brain now knows several of your eating habits quite well.',
    'Le Cerveau commence à relier tes différentes façons de nommer et de composer tes repas.':'The Brain is starting to connect the different ways you name and build your meals.',
    'Chaque repas ajouté aide le Cerveau à mieux comprendre tes habitudes.':'Every meal you add helps the Brain better understand your habits.',
    'Connaissance de tes habitudes':'Knowledge of your habits',
    'Cette jauge augmente avec la répétition, la variété et la précision des repas appris.':'This gauge increases with repetition, variety, and the detail of learned meals.',
    'repas appris':'learned meals','utilisations':'uses','bien connus':'well known',
    'Le Cerveau commence tout juste':'The Brain is just getting started',
    'Ajoute naturellement tes repas. Après quelques répétitions, tes recettes et habitudes apparaîtront ici.':'Log your meals naturally. After a few repetitions, your recipes and habits will appear here.',
    'Repas appris':'Learned meals','Les recettes que le Cerveau reconnaît déjà.':'Recipes the Brain already recognizes.',
    'Aliments fréquents':'Frequent foods','Observés dans tes recettes apprises.':'Seen in your learned recipes.',
    'J’ai besoin de descriptions un peu plus détaillées pour identifier tes aliments fréquents.':'I need slightly more detailed descriptions to identify your frequent foods.',
    'En apprentissage':'Still learning',
    'Les repas affichés ici ont maintenant une base suffisamment solide pour être reconnus avec confiance.':'The meals shown here now have a strong enough foundation to be recognized confidently.',
    'Chronologie':'Timeline',
    'Estimation nutritionnelle de la journée':'Daily nutrition estimate',
    'Estimation nutritionnelle':'Nutrition estimate',
    'Valeurs approximatives, calculées à partir des aliments reconnus.':'Approximate values calculated from recognized foods.',
    'Protéines':'Protein','Glucides':'Carbohydrates','Lipides':'Fat','Fibres':'Fibre','Sucres':'Sugars','Sodium':'Sodium'
  });
  Object.assign(frFR, {
    'Le cerveau apprend':'Le cerveau apprend',
    'Chaque journée nourrit ton arbre':'Chaque journée nourrit votre arbre',
    'Continue simplement à noter tes repas et ton ressenti. Je compare progressivement les journées qui se ressemblent.':'Continuez simplement à noter vos repas et votre ressenti. Je compare progressivement les journées qui se ressemblent.',
    'Le cerveau en prend note et vérifiera si cette situation se répète avant de te présenter une tendance.':'Le cerveau en prend note et vérifiera si cette situation se répète avant de vous présenter une tendance.',
    'Ce que le Cerveau connaît de toi':'Ce que le Cerveau connaît de vous',
    'Ta mémoire alimentaire personnelle':'Votre mémoire alimentaire personnelle',
    'Le Cerveau connaît maintenant assez bien plusieurs de tes habitudes alimentaires.':'Le Cerveau connaît maintenant assez bien plusieurs de vos habitudes alimentaires.',
    'Le Cerveau commence à relier tes différentes façons de nommer et de composer tes repas.':'Le Cerveau commence à relier vos différentes façons de nommer et de composer vos repas.',
    'Chaque repas ajouté aide le Cerveau à mieux comprendre tes habitudes.':'Chaque repas ajouté aide le Cerveau à mieux comprendre vos habitudes.',
    'Connaissance de tes habitudes':'Connaissance de vos habitudes',
    'Cette jauge augmente avec la répétition, la variété et la précision des repas appris.':'Cette jauge augmente avec la répétition, la variété et la précision des repas appris.',
    'Ajoute naturellement tes repas. Après quelques répétitions, tes recettes et habitudes apparaîtront ici.':'Ajoutez naturellement vos repas. Après quelques répétitions, vos recettes et habitudes apparaîtront ici.',
    'Les recettes que le Cerveau reconnaît déjà.':'Les recettes que le Cerveau reconnaît déjà.',
    'Observés dans tes recettes apprises.':'Observés dans vos recettes apprises.',
    'J’ai besoin de descriptions un peu plus détaillées pour identifier tes aliments fréquents.':'J’ai besoin de descriptions un peu plus détaillées pour identifier vos aliments fréquents.',
    'Pourquoi le Cerveau pense cela?':'Pourquoi le Cerveau pense-t-il cela ?',
    'Le moteur compare ton propre historique avec prudence.':'Le moteur compare votre propre historique avec prudence.',
    'Ces observations décrivent des associations dans ton propre journal. Elles ne prouvent aucune cause et ne remplacent jamais un avis médical.':'Ces observations décrivent des associations dans votre propre journal. Elles ne prouvent aucune cause et ne remplacent jamais un avis médical.',
    'Ce que tes repas semblent révéler':'Ce que vos repas semblent révéler',
    'Ces observations comparent uniquement les journées de ton propre historique. Elles décrivent des associations possibles, ne prouvent aucune cause et ne constituent jamais un diagnostic.':'Ces observations comparent uniquement les journées de votre propre historique. Elles décrivent des associations possibles, ne prouvent aucun lien de causalité et ne constituent jamais un diagnostic.'
  });

  // Meal types stored in the journal keep their Canadian keys. Only labels change.
  Object.assign(frFR, {
    "🍱 Restants : copier le souper d'hier":"🍱 Restes : copier le dîner d’hier",
    "🍳 Copier le déjeuner d'hier":"🍳 Copier le petit-déjeuner d’hier",
    "Restants : copier le souper d'hier":"Restes : copier le dîner d’hier",
    "Aucun déjeuner trouvé hier.":"Aucun petit-déjeuner trouvé hier.",
    "Aucun souper trouvé hier.":"Aucun dîner trouvé hier.",
    "Derniers déjeuners":"Derniers petits-déjeuners",
    "Derniers dîners":"Derniers déjeuners",
    "Derniers soupers":"Derniers dîners",
    "Dernières collations":"Derniers en-cas",
    "Les protéines au déjeuner":"Les protéines au petit-déjeuner",
    "Plusieurs déjeuners enregistrés ne mentionnent pas clairement une source de protéines.":"Plusieurs petits-déjeuners enregistrés ne mentionnent pas clairement une source de protéines.",
    "Un déjeuner apparaît souvent dans les 28 derniers jours, ce qui peut refléter une routine du matin plutôt qu’un comportement inhabituel.":"Un petit-déjeuner apparaît souvent dans les 28 derniers jours, ce qui peut refléter une routine du matin plutôt qu’un comportement inhabituel.",
    "Les légumes apparaissent souvent dans tes soupers récents.":"Les légumes apparaissent souvent dans vos dîners récents.",
    "Les produits laitiers apparaissent encore dans plusieurs déjeuners, cafés et collations.":"Les produits laitiers apparaissent encore dans plusieurs petits-déjeuners, cafés et en-cas.",
    "Tu prends un déjeuner presque tous les jours.":"Vous prenez un petit-déjeuner presque tous les jours.",
    "Les légumes sont présents dans la majorité de tes soupers.":"Les légumes sont présents dans la majorité de vos dîners.",
    "Les Favoris sont idéaux pour tes déjeuners et collations récurrents : tu pourras ensuite ajuster seulement ce qui change.":"Les Favoris sont idéaux pour vos petits-déjeuners et en-cas récurrents : vous pourrez ensuite ajuster seulement ce qui change."
  });
  Object.assign(en, {
    "Derniers déjeuners":"Recent breakfasts", "Derniers dîners":"Recent lunches",
    "Derniers soupers":"Recent dinners", "Dernières collations":"Recent snacks",
    "Dernières boissons":"Recent drinks", "Derniers repas":"Recent meals"
  });
  Object.assign(en, {
    'Sensation de légèreté':'Feeling light',
    'Énergique':'Energetic',
    'Pas ressenti':'Not felt',
    'Observations positives':'Positive observations',
    'Association positive possible':'Possible positive association',
    'Piste positive secondaire':'Secondary positive lead',
    'Renforcements observés':'Observed increases',
    'Plus présent après':'Stronger afterwards',
    'Moins présent après':'Less strong afterwards',
    'Non ressenti après':'Not felt afterwards',
    'Choisir mes ressentis suivis':'Choose feelings to track',
    'Inconforts':'Discomforts',
    'Inconforts à suivre':'Discomforts to track',
    'Autres indications':'Other information',
    'Mes ressentis':'My feelings',
    'Mes inconforts suivis':'My tracked discomforts',
    'Modifier mes inconforts suivis':'Edit tracked discomforts',
    'Liste fixe, toujours disponible. Aucun choix à configurer.':'Fixed list, always available. No setup needed.',
    'Aucun inconfort sélectionné.':'No discomforts selected.',
  });
  const dict=locale==='en'?en:locale==='fr-FR'?frFR:{};
  Object.assign(en, {
    'Calories estimées':'Estimated calories',
    'Ajustées par vous':'Adjusted by you',
    'Estimation automatique · modifiable':'Automatic estimate · editable',
    'Aucune estimation disponible · saisie facultative':'No estimate available · optional entry',
    'Revenir à l’estimation automatique':'Return to the automatic estimate',
    'Entrez des calories positives ou nulles, ou revenez à l’estimation automatique.':'Enter zero or positive calories, or return to the automatic estimate.'
  });
  const translate=s=>dict[s]||s;
  window.ENERGIE_I18N={locale,t:translateString,translateDOM:root=>translateDOM(root)};
  window.t=translateString;
  const nativeAlert=window.alert.bind(window),nativeConfirm=window.confirm.bind(window),nativePrompt=window.prompt.bind(window);
  window.alert=message=>nativeAlert(translateString(String(message)));
  window.confirm=message=>nativeConfirm(translateString(String(message)));
  window.prompt=(message,defaultValue)=>nativePrompt(translateString(String(message)),defaultValue);

  const NativeDTF=Intl.DateTimeFormat;
  Intl.DateTimeFormat=function(loc,opts){return new NativeDTF(loc==='fr-CA'?locale:loc,opts)};
  Intl.DateTimeFormat.prototype=NativeDTF.prototype;
  const nativeDate=Date.prototype.toLocaleDateString;
  Date.prototype.toLocaleDateString=function(loc,opts){return nativeDate.call(this,loc==='fr-CA'?locale:loc,opts)};

  function translateString(s){
    let out=translate(s);
    // Never feed a mapped French meal name back into another meal mapping.
    if(locale==='fr-FR') {
      if(out!==s) return out;
      const mealWord=x=>translate(x.charAt(0).toUpperCase()+x.slice(1).toLowerCase()).toLowerCase();
      const rules=[
        [/^Après (déjeuner|dîner|souper|collation|boisson) · (.+)$/i,(_,meal,detail)=>`Après ${mealWord(meal)} · ${detail}`],
        [/^Comment te sens-tu après ton (déjeuner|dîner|souper|collation|boisson) \?$/i,(_,meal)=>`Comment vous sentez-vous après votre ${mealWord(meal)} ?`],
        [/^(Ajouter|Modifier) (Déjeuner|Dîner|Souper|Collation|Boisson)$/i,(_,action,meal)=>`${action} ${mealWord(meal)}`],
        [/^Hier, tu as noté (.+) après (déjeuner|dîner|souper|collation|boisson)$/i,(_,feeling,meal)=>`Hier, vous avez noté ${feeling} après ${mealWord(meal)}`],
        [/^Observation basée sur (\d+) soupers des 28 derniers jours\.$/,(_,n)=>`Observation basée sur ${n} dîners des 28 derniers jours.`],
        [/^(\d+) collation(s?) notée(s?)$/,(_,n)=>`${n} en-cas noté${n==='1'?'':'s'}`]
      ];
      for(const [pattern,replacement] of rules) if(pattern.test(s)) return s.replace(pattern,replacement);
    }
    if(locale==='en'){
      const mealWord=x=>translate(x.charAt(0).toUpperCase()+x.slice(1)).toLowerCase();
      out=out
        .replace(/^(\d+)\/(\d+) repas principal(?:aux)?$/,(_,a,b)=>`${a}/${b} main meals`)
        .replace(/^(\d+) entrée(s?) aujourd’hui$/,(_,n)=>`${n} entr${n==='1'?'y':'ies'} today`)
        .replace(/^(\d+) réponse(s?) en attente$/,(_,n)=>`${n} pending response${n==='1'?'':'s'}`)
        .replace(/^Après (déjeuner|dîner|souper|collation|boisson) · (.+)$/i,(_,m,time)=>`After ${mealWord(m)} · ${time}`)
        .replace(/^Dernier ressenti : /,'Latest feeling: ')
        .replace(/^Ajouter (Déjeuner|Dîner|Souper|Collation|Boisson)$/i,(_,m)=>`Add ${translate(m)}`)
        .replace(/^Modifier (Déjeuner|Dîner|Souper|Collation|Boisson)$/i,(_,m)=>`Edit ${translate(m)}`)
        .replace(/^(\d+) heure(s?)$/,(_,n)=>`${n} hour${n==='1'?'':'s'}`)
        .replace(/^(\d+) à synchroniser$/,(_,n)=>`${n} to sync`)
        .replace(/^(\d+) repas$/,(_,n)=>`${n} meal${n==='1'?'':'s'}`)
        .replace(/^(\d+) journée(s?)$/,(_,n)=>`${n} day${n==='1'?'':'s'}`)
        .replace(/^(\d+) mois$/,(_,n)=>`${n} month${n==='1'?'':'s'}`)
        .replace(/^(\d+) jour(s?) de suivi$/,(_,n)=>`${n} day${n==='1'?'':'s'} tracked`)
        .replace(/^Depuis le (.+)$/,'Since $1')
        .replace(/^(\d+) collation(s?) notée(s?)$/,(_,n)=>`${n} snack${n==='1'?'':'s'} logged`)
        .replace(/^Ressenti (\d+) sur 5$/, 'Feeling $1 out of 5')
        .replace(/^Comment te sens-tu après ton (.+) \?$/,(_,meal)=>`How do you feel after your ${mealWord(meal)}?`)
        .replace(/^Supprimer « (.+) » des favoris\?$/,(_,name)=>`Remove “${name}” from favorites?`)
        .replace(/^Semaine du (.+) au (.+)$/,(_,a,b)=>`Week of ${a} to ${b}`)
        .replace(/^(\d+) carte(s?)$/,(_,n)=>`${n} card${n==='1'?'':'s'}`)
        .replace(/^(\d+) copie\(s\) locale\(s\) de sécurité\.$/,(_,n)=>`${n} local backup cop${n==='1'?'y':'ies'}.`)
        .replace(/^Basé sur (\d+) repas enregistrés ce jour de la semaine\.$/,(_,n)=>`Based on ${n} meals logged on this day of the week.`)
        .replace(/^Basé sur (\d+) repas enregistrés\.$/,(_,n)=>`Based on ${n} logged meals.`)
        .replace(/^Tu as enregistré (\d+) repas\. Ce suivi régulier donnera davantage de contexte aux tendances futures\.$/,(_,n)=>`You logged ${n} meals. Continued tracking will add more context to future patterns.`)
        .replace(/^Tu enregistres tes repas vers (.+) en moyenne\.$/,(_,time)=>`You usually log meals around ${time}.`)
        .replace(/^Le (.+), ton énergie avant les repas est en moyenne de (.+)\/5 dans les données disponibles\.$/,(_,day,val)=>`On ${day}, your average energy before meals is ${val}/5 in the available data.`)
        .replace(/^L’énergie notée avant les repas est plutôt faible pour cette journée, selon les données enregistrées\.$/,'Energy before meals was relatively low on this day, based on your entries.')
        .replace(/^L’énergie notée avant les repas est plutôt élevée pour cette journée\. Cela ne permet pas d’en déterminer la cause\.$/,'Energy before meals was relatively high on this day. This does not identify a cause.')
        .replace(/^(\d+) repas au total$/,(_,n)=>`${n} total meal${n==='1'?'':'s'}`)
        .replace(/^(\d+) entrée(?:s)? aujourd’hui$/,(_,n)=>`${n} entr${n==='1'?'y':'ies'} today`)
        .replace(/^(\d+) réponse(?:s)? en attente$/,(_,n)=>`${n} pending response${n==='1'?'':'s'}`)
        .replace(/^(\d+) copie\(s\) locale\(s\) de sécurité\.$/,(_,n)=>`${n} local backup cop${n==='1'?'y':'ies'}.`)
        .replace(/^Utilisé (\d+) fois$/,(_,n)=>`Used ${n} time${n==='1'?'':'s'}`)
        .replace(/^Confiance (.+)$/i,(_,level)=>`Confidence ${translateString(level).toLowerCase()}`)
        .replace(/^Énergie avant (.+)\/5$/,(_,v)=>`Energy before ${v}/5`)
        .replace(/^Après (.+) · (.+)$/,(_,meal,date)=>`After ${translateString(meal)} · ${date}`)
        .replace(/^Depuis le (.+)$/i,(_,date)=>`Since ${date}`)
        .replace(/^(\d+) jour(?:s)? de suivi$/,(_,n)=>`${n} day${n==='1'?'':'s'} tracked`)
        .replace(/^(\d+) journée(?:s)?$/,(_,n)=>`${n} day${n==='1'?'':'s'}`)
        .replace(/^(\d+) mois$/,(_,n)=>`${n} month${n==='1'?'':'s'}`)
        .replace(/^(\d+) repas$/,(_,n)=>`${n} meal${n==='1'?'':'s'}`)
        .replace(/^Supprimer (.+)$/,(_,x)=>`Delete ${translateString(x)}`)
        .replace(/^Avant tes repas « (.+) », ton énergie enregistrée est en moyenne de (.+)\/5\. Cela décrit ton historique sans expliquer la cause\.$/,(_,meal,val)=>`Before ${translateString(meal).toLowerCase()} meals, your logged energy averages ${val}/5. This describes your history without explaining the cause.`)
        .replace(/^Le type de repas le plus souvent enregistré est « (.+) »\. Cette information est descriptive seulement\.$/,(_,meal)=>`The most frequently logged meal type is “${translateString(meal)}”. This information is descriptive only.`)
        .replace(/^Ajouter (.+)$/,(_,x)=>`Add ${translateString(x)}`)
        .replace(/^Modifier (.+)$/,(_,x)=>`Edit ${translateString(x)}`)
        .replace(/^Hier, tu as noté (.+) après (.+)$/i,(_,feeling,meal)=>`Yesterday, you logged ${translateString(feeling)} after ${translateString(meal)}.`)
        .replace(/^Hier, tu as noté « (.+) » après (.+)$/i,(_,feeling,meal)=>`Yesterday, you logged “${translateString(feeling)}” after ${translateString(meal)}.`)
        .replace(/^Il y a (\d+) jours$/,(_,n)=>`${n} days ago`)
        .replace(/^Utilisé (\d+) fois · (.+)$/,(_,n,date)=>`Used ${n} time${n==='1'?'':'s'} · ${translateString(date)}`)
        .replace(/^Confiance (\d+) %$/,(_,n)=>`Confidence ${n}%`)
        .replace(/^Associations détectées dans (\d+) journées récentes\.$/,(_,n)=>`Associations detected across ${n} recent days.`)
        .replace(/^(\d+) autres repas continuent d’être appris en arrière-plan\.$/,(_,n)=>`${n} other meals are still being learned in the background.`)
        .replace(/^(\d+) apparition(?:s)?$/,(_,n)=>`${n} occurrence${n==='1'?'':'s'}`)
        .replace(/^Je suis encore en train de préciser (\d+) repas appris\. Quelques nouvelles utilisations m’aideront à distinguer ce qui est toujours présent de ce qui varie\.$/,(_,n)=>`I am still refining ${n} learned meals. A few more uses will help me distinguish what is always present from what varies.`)
        .replace(/^Le Cerveau a commencé à apprendre (.+)\.$/,(_,meal)=>`The Brain started learning ${meal}.`)
        .replace(/^(\d+) journée(?:s)? analysée(?:s)?$/,(_,n)=>`${n} analyzed day${n==='1'?'':'s'}`)
        .replace(/^(\d+) restante(?:s)?$/,(_,n)=>`${n} remaining`)
        .replace(/^La semaine va dans une direction positive(?:, surtout pour (.+))?\.$/,(_,items)=>items?`The week is trending in a positive direction, especially for ${items}.`:'The week is trending in a positive direction.')
        .replace(/^Quelques éléments sont en baisse(?:, notamment (.+))?\.$/,(_,items)=>items?`A few areas are down, including ${items}.`:'A few areas are down.')
        .replace(/^Avec les données recueillies, (.+) apparaissent régulièrement dans tes repas\.$/,(_,x)=>`Based on the data collected, ${x} regularly appear in your meals.`)
        .replace(/^Avec les données recueillies jusqu’à présent, (.+) sont moins souvent repérées dans tes descriptions de repas\.$/,(_,x)=>`Based on the data collected so far, ${x} appear less often in your meal descriptions.`)
        .replace(/^Pour les prochains repas, tu pourrais simplement penser à intégrer davantage (.+), lorsque cela te convient\.$/,(_,x)=>`For upcoming meals, you could consider adding more ${x}, whenever that works for you.`)
        .replace(/^Estimation par mots-clés dans (\d+) repas des 7 derniers jours\. Les quantités et valeurs nutritives ne sont pas connues\.$/,(_,n)=>`Keyword-based estimate from ${n} meals over the last 7 days. Quantities and nutrient values are unknown.`)
        .replace(/^(\d+) fois$/,(_,n)=>`${n} time${n==='1'?'':'s'}`)
        .replace(/^(\d+) non pris$/,(_,n)=>`${n} not taken`)
        .replace(/^(\d+)\/(\d+) pris$/,(_,a,b)=>`${a}/${b} taken`)
        .replace(/^Ressenti (\d+)\/5$/,(_,n)=>`Feeling ${n}/5`);
    } else if(locale==='fr-FR'){
      out=out.replace(/^Ton parcours$/,'Votre parcours')
        .replace(/^Observe tes habitudes sans jugement$/,'Observez vos habitudes')
        .replace(/^Depuis le (.+)$/,'Depuis le $1')
        .replace(/^(\d+) journée(s?)$/,(_,n)=>`${n} jour${n==='1'?'':'s'}`);
    }
    return out;
  }
  // Remember the output per node/attribute: observer callbacks and subsequent
  // render passes must not translate Déjeuner (French lunch) into breakfast.
  const translatedText=new WeakMap(), translatedAttributes=new WeakMap();
  const ignored='script,style,textarea,input,[contenteditable="true"],[translate="no"],[data-i18n-skip]';
  function translateTextNode(node){
    const parent=node.parentElement;
    if(!parent || parent.closest(ignored)) return;
    const keyed=parent.closest('[data-i18n-key]');
    if(keyed){translateKeyedElement(keyed);return;}
    const raw=node.nodeValue;
    if(translatedText.get(node)===raw) return;
    const trim=raw.trim(), result=trim?raw.replace(trim,translateString(trim)):raw;
    translatedText.set(node,result);
    if(result!==raw) node.nodeValue=result;
  }
  function translateKeyedElement(el){
    if(!el.hasAttribute('data-i18n-key') || el.closest(ignored)) return;
    const value=translateString(el.getAttribute('data-i18n-key'));
    if(el.textContent!==value) el.textContent=value;
  }
  function translateAttributes(el){
    if(el.closest('[translate="no"],[data-i18n-skip]')) return;
    const saved=translatedAttributes.get(el)||{};
    for(const name of ['placeholder','aria-label','title']){
      if(!el.hasAttribute(name)){delete saved[name];continue;}
      const raw=el.getAttribute(name);
      if(saved[name]===raw) continue;
      const result=translateString(raw);
      saved[name]=result;
      if(result!==raw) el.setAttribute(name,result);
    }
    translatedAttributes.set(el,saved);
  }
  function translateDOM(root=document){
    if(root.nodeType===3){translateTextNode(root);return;}
    const elements=[...(root.nodeType===1?[root]:[]),...(root.querySelectorAll?.('[data-i18n-key],[placeholder],[aria-label],[title]')||[])];
    elements.forEach(el=>{if(el.hasAttribute('data-i18n-key'))translateKeyedElement(el);translateAttributes(el);});
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(translateTextNode);
    ensureLanguageSelector();
  }
  function ensureLanguageSelector(){
    const app=document.querySelector('#app');if(!app||!document.querySelector('#waterGoal')||document.querySelector('#languageSettingCard'))return;
    const card=document.createElement('section');card.className='card';card.id='languageSettingCard';
    card.innerHTML=`<div class="settings-row"><div><h3>${translate('Langue')}</h3><p class="muted small">${translate('Langue de l’application')}</p></div><select id="languageSelect" aria-label="${translate('Langue de l’application')}"><option value="fr-CA">${translate('Français (Canada)')}</option><option value="fr-FR">${translate('Français (France)')}</option><option value="en">English</option></select></div>`;
    const stack=app.querySelector('.stack');if(!stack)return;const target=[...stack.children].find(x=>x.textContent.includes('Objectif')||x.textContent.includes('Water goal'));target?.after(card);
    const sel=card.querySelector('select');sel.value=locale;sel.addEventListener('change',()=>{localStorage.setItem('energieLocale',sel.value);location.reload()});
  }
  const obs=new MutationObserver(ms=>ms.forEach(m=>{
    if(m.type==='characterData')translateTextNode(m.target);
    else if(m.type==='attributes'){
      if(m.attributeName==='data-i18n-key')translateKeyedElement(m.target);
      else translateAttributes(m.target);
    }
    m.addedNodes.forEach(n=>{if(n.nodeType===1||n.nodeType===3)translateDOM(n);});
  }));
  function startTranslation(){translateDOM(document);obs.observe(document.body,{childList:true,subtree:true,characterData:true,attributes:true,attributeFilter:['placeholder','aria-label','title','data-i18n-key']});}
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',startTranslation,{once:true});
  else startTranslation();
})();
