(() => {
  'use strict';
  const SUPPORTED=['fr-CA','fr-FR','en'];
  const stored=localStorage.getItem('energieLocale');
  const browser=(navigator.languages||[navigator.language||'fr-CA']).find(l=>/^fr-FR/i.test(l)||/^fr/i.test(l)||/^en/i.test(l));
  const locale=SUPPORTED.includes(stored)?stored:(/^fr-FR/i.test(browser||'')?'fr-FR':/^en/i.test(browser||'')?'en':'fr-CA');
  window.ENERGIE_LOCALE=locale;
  document.documentElement.lang=locale;

  const frFR={
    'Journal':'Journal','Historique':'Historique','Tableau':'Tableau de bord','Profil':'Profil',
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
    'Journal':'Journal','Historique':'History','Tableau':'Insights','Tableau de bord':'Insights','Profil':'Profile',
    'Déjeuner':'Breakfast','Dîner':'Lunch','Souper':'Dinner','Collation':'Snack','En-cas':'Snack','Boisson':'Drink','Repas':'Meal',
    'Mon repas':'My meal','Ajouter un repas':'Add a meal','Modifier le repas':'Edit meal','Choisir un repas favori':'Choose a favorite meal',
    'Choisir un favori…':'Choose a favorite…','Type de repas':'Meal type','Heure':'Time','Ce que tu as mangé ou bu':'What you ate or drank',
    'Ce que vous avez mangé ou bu':'What you ate or drank','Énergie avant le repas':'Energy before the meal','Photo facultative':'Optional photo',
    'Retirer la photo':'Remove photo','Notes facultatives':'Optional notes','Enregistrer':'Save',"Copier le déjeuner d'hier":"Copy yesterday’s breakfast",
    'Repos':'Rest','Sommeil':'Sleep','Sommeil de la nuit dernière':'Last night’s sleep','Inscris simplement la durée totale approximative.':'Simply enter the approximate total duration.',
    "Nombre d'heures":'Number of hours','Nombre d’heures':'Number of hours','Enregistrer le sommeil':'Save sleep',
    'Mouvement':'Movement','Ajouter une activité':'Add an activity','Choisis une activité':'Choose an activity','Choisissez une activité':'Choose an activity',
    'Durée en minutes':'Duration in minutes','Activités enregistrées':'Saved activities',"Ajouter l'activité":'Add activity',
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
    'Ton horaire habituel':'Your usual schedule','Aliments possiblement plus salés':'Foods that may be higher in sodium','Aliments possiblement plus sucrés':'Foods that may be higher in sugar',
    'Gras saturés à surveiller dans les choix fréquents':'Saturated fat in frequently logged foods','Peu de végétaux repérés dans les descriptions':'Few plant foods detected in descriptions',
    'Organisation mondiale de la Santé — Alimentation saine':'World Health Organization — Healthy diet','Santé Canada — Guide alimentaire canadien':"Health Canada — Canada's Food Guide",
    'Santé Canada — Limiter les aliments hautement transformés':'Health Canada — Limit highly processed foods','Santé Canada — Symbole nutritionnel sur le devant de l’emballage':'Health Canada — Front-of-package nutrition symbol'
  });

  const dict=locale==='en'?en:locale==='fr-FR'?frFR:{};
  const translate=s=>dict[s]||s;
  window.ENERGIE_I18N={locale,t:translateString};
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
    if(locale==='en'){
      out=out.replace(/^(\d+) entrée(s?) aujourd’hui$/,(_,n)=>`${n} entr${n==='1'?'y':'ies'} today`)
        .replace(/^(\d+) réponse(s?) en attente$/,(_,n)=>`${n} pending response${n==='1'?'':'s'}`)
        .replace(/^Après (.+) · /,'After $1 · ')
        .replace(/^Dernier ressenti : /,'Latest feeling: ')
        .replace(/^Ajouter (Breakfast|Lunch|Dinner|Snack)$/,'Add $1')
        .replace(/^Modifier (Breakfast|Lunch|Dinner|Snack)$/,'Edit $1')
        .replace(/^(\d+) heure(s?)$/,(_,n)=>`${n} hour${n==='1'?'':'s'}`)
        .replace(/^(\d+) à synchroniser$/,(_,n)=>`${n} to sync`)
        .replace(/^(\d+) repas$/,(_,n)=>`${n} meal${n==='1'?'':'s'}`)
        .replace(/^(\d+) collation(s?) notée(s?)$/,(_,n)=>`${n} snack${n==='1'?'':'s'} logged`)
        .replace(/^Ressenti (\d+) sur 5$/, 'Feeling $1 out of 5')
        .replace(/^Comment te sens-tu après ton (.+) \?$/,(_,meal)=>`How do you feel after your ${translateString(meal)}?`)
        .replace(/^Supprimer « (.+) » des favoris\?$/,(_,name)=>`Remove “${name}” from favorites?`)
        .replace(/^Semaine du (.+) au (.+)$/,(_,a,b)=>`Week of ${a} to ${b}`);
    }
    return out;
  }
  function translateDOM(root=document){
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_TEXT);
    const nodes=[];while(walker.nextNode())nodes.push(walker.currentNode);
    nodes.forEach(n=>{const raw=n.nodeValue,trim=raw.trim();if(!trim)return;const tr=translateString(trim);if(tr!==trim)n.nodeValue=raw.replace(trim,tr)});
    root.querySelectorAll?.('[placeholder],[aria-label],[title]').forEach(el=>['placeholder','aria-label','title'].forEach(a=>{if(el.hasAttribute(a))el.setAttribute(a,translateString(el.getAttribute(a)))}));
    ensureLanguageSelector();
  }
  function ensureLanguageSelector(){
    const app=document.querySelector('#app');if(!app||!document.querySelector('#waterGoal')||document.querySelector('#languageSettingCard'))return;
    const card=document.createElement('section');card.className='card';card.id='languageSettingCard';
    card.innerHTML=`<div class="settings-row"><div><h3>${translate('Langue')}</h3><p class="muted small">${translate('Langue de l’application')}</p></div><select id="languageSelect" aria-label="${translate('Langue de l’application')}"><option value="fr-CA">${translate('Français (Canada)')}</option><option value="fr-FR">${translate('Français (France)')}</option><option value="en">English</option></select></div>`;
    const stack=app.querySelector('.stack');const target=[...stack.children].find(x=>x.textContent.includes('Objectif')||x.textContent.includes('Water goal'));target?.after(card);
    const sel=card.querySelector('select');sel.value=locale;sel.addEventListener('change',()=>{localStorage.setItem('energieLocale',sel.value);location.reload()});
  }
  const obs=new MutationObserver(ms=>ms.forEach(m=>{if(m.type==='characterData'){const raw=m.target.nodeValue,trim=raw.trim();if(trim){const tr=translateString(trim);if(tr!==trim)m.target.nodeValue=raw.replace(trim,tr)}}m.addedNodes.forEach(n=>{if(n.nodeType===1)translateDOM(n);else if(n.nodeType===3){const raw=n.nodeValue,trim=raw.trim();if(trim){const tr=translateString(trim);if(tr!==trim)n.nodeValue=raw.replace(trim,tr)}}})}));
  document.addEventListener('DOMContentLoaded',()=>{translateDOM(document);obs.observe(document.body,{childList:true,subtree:true,characterData:true})});
})();
