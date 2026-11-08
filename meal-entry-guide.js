/* Guide de saisie du repas : mêmes explications sur le web et dans Capacitor. */
(function (root) {
  'use strict';
  const button = document.getElementById('openMealEntryGuide');
  if (!button) return;
  const english = root.ENERGIE_LOCALE === 'en';
  const france = root.ENERGIE_LOCALE === 'fr-FR';
  const source = france ? 'Ciqual' : 'FCÉN';
  const sourceDescription = france
    ? 'Ciqual 2025 (Anses, France), avec le FCÉN de Santé Canada en secours'
    : 'le FCÉN de Santé Canada, avec Ciqual 2025 (Anses, France) en secours';
  const title = english ? 'Guide to entering my meal' : 'Guide pour entrer mon repas';
  button.innerHTML = `<span class="meal-guide-full-label">${title}</span><span class="meal-guide-short-label">${english ? "Entry guide" : "Guide de saisie"}</span>`;
  button.setAttribute("aria-label", title);
  const dialog = document.createElement('dialog');
  dialog.id = 'mealEntryGuideDialog';
  dialog.className = 'meal-entry-guide-dialog';
  dialog.setAttribute('aria-labelledby', 'mealEntryGuideTitle');
  dialog.setAttribute('data-i18n-skip', '');
  dialog.innerHTML = `<section class="dialog-card meal-entry-guide-card">
    <div class="dialog-header"><div><p class="eyebrow">${english ? 'Entering a meal' : 'Inscrire un repas'}</p><h2 id="mealEntryGuideTitle">${title}</h2></div><button type="button" class="icon-button" data-close-meal-guide aria-label="${english ? 'Close' : 'Fermer'}">✕</button></div>
    ${english ? `
    <p>Write your meal naturally, use a favourite or add a photo. AI can already suggest a meal description from a photo when requested. Calorie estimates using AI are coming soon and will be optional.</p><p data-calorie-ui>For a more useful estimate, include the portion and, at a restaurant, the restaurant and dish name. You can always enter calories manually.</p>
    <section><h3>✍️ Write your meal</h3><p>Write one food per line. Put the quantity before the food when you know it.</p>
    <pre aria-label="Example meal">150 g chicken\n100 g carrots\n2 apples</pre>
    <p>When it matters, specify how food was prepared (raw, cooked, fried, sauce). For example: <strong>120 g cooked spaghetti</strong>. Details help but are not required.</p></section>
    <details open><summary>How to enter quantities</summary><dl>
      <dt>Weight: g or kg</dt><dd><strong>150 g chicken</strong>, <strong>100 g carrots</strong>. Use the weight of the food you ate. If weighed before cooking, specify “raw”. For several meat or fish fillets, enter their total weight. A known branded product can use its label portion; for example, 4 St-Hubert breaded chicken fillets.</dd>
      <dt>Volume: cups or ml</dt><dd><strong>1 cup broccoli</strong>. A cup is 250 ml of volume, not 250 g. This works when the food has a documented volume portion. If no estimate appears, use grams or guided entry.</dd>
      <dt>Half or quarter portions</dt><dd>Write <strong>1/2</strong> for one half and <strong>1/4</strong> for one quarter, with the unit: <strong>1/2 cup cottage cheese</strong>. Plain cottage cheese without a specified fat content uses the 2% reference.</dd>
      <dt>Number of foods</dt><dd><strong>1 apple</strong> or <strong>2 apples</strong> uses a reference medium apple. Size affects the estimate. Counts are supported only when a matching unit portion exists; use grams or guided entry for other fruits and vegetables.</dd>
    </dl><pre aria-label="Example with half a cup">lettuce\ncucumber\n1/2 cup cottage cheese</pre><p class="muted small">Without a quantity, a reference portion may be used. It does not measure what you actually ate. Quantities make the estimate more useful.</p></details>
    <details data-guided-ui><summary>🔎 Guided entry with ${source}</summary><p>Search for a food, choose the matching preparation, enter its quantity and unit, then add it. Repeat for the other foods and finish the entry.</p><p>Canadian Nutrient File (Health Canada) is the first reference, with Ciqual 2025 (Anses, France) as fallback. Choose units offered for the selected food.</p></details>
    <details><summary>📷 Photo</summary><p>A photo records your meal. The analysis starts only when you request it. Use “Analyze with AI” if you want a suggested description, then check the foods and quantities before using it.</p></details>
    <details><summary>▥ Scan a product</summary><p>Use Scanner for a packaged product with a barcode. Check the product and nutrition label, then enter the amount you ate. Label values per 100 g do not mean you ate 100 g.</p></details>
    <details data-calorie-ui><summary>🔥 About calorie estimates</summary><p>Énergie currently uses its nutrition references and any calories you enter. AI calorie estimation from text or photos is in preparation, not active yet. For restaurants, naming the place and dish can help identify a more relevant reference, but does not guarantee an official restaurant value.</p><p>Estimates remain approximate, especially when portions, cooking oil or sauces are unknown. You can always enter or adjust calories yourself.</p></details>
    ` : `
    <p>Décris ton repas naturellement, reprends un favori ou ajoute une photo. L’IA peut déjà suggérer une description à partir d’une photo, seulement si tu demandes l’analyse. L’estimation des calories par IA sera facultative lorsqu’elle sera disponible.</p><p data-calorie-ui>Pour une estimation plus utile, précise les portions si tu les connais. Au restaurant, indique le nom du resto et du plat (ex. 2 McDouble chez McDonald’s). Tu peux toujours entrer les calories manuellement.</p>
    <section><h3>✍️ Écrire ton repas</h3><p>Inscris un aliment par ligne. Place la quantité avant l’aliment quand tu la connais.</p>
    <pre aria-label="Exemple de repas">150 g poulet\n100 g carottes\n2 pommes</pre>
    <p>Quand c’est utile, précise la préparation (cru, cuit, frit, sauce). Par exemple : <strong>120 g de spaghettis cuits</strong>. Ces détails aident, mais ne sont jamais obligatoires.</p></section>
    <details open><summary>Comment écrire les quantités ?</summary><dl>
      <dt>Poids : g ou kg</dt><dd><strong>150 g poulet</strong>, <strong>100 g carottes</strong>. Utilise le poids de l’aliment consommé. Si tu le pèses avant cuisson, précise « cru ». Pour plusieurs filets de viande ou de poisson, indique leur poids total. Un produit de marque reconnu peut utiliser la portion de son étiquette, par exemple « 4 filets de poulet panés St-Hubert ».</dd>
      <dt>Volume : tasses ou ml</dt><dd><strong>1 tasse brocoli</strong>. Une tasse représente 250 ml de volume, pas 250 g. Ce calcul fonctionne si une portion en volume est documentée pour l’aliment. Si aucune estimation n’apparaît, utilise les grammes ou la saisie guidée.</dd>
      <dt>Une demie ou un quart</dt><dd>Écris <strong>1/2</strong> pour une demie et <strong>1/4</strong> pour un quart, suivi de l’unité : <strong>1/2 tasse cottage</strong>. Le cottage sans précision utilise une référence nature à 2 % de matières grasses.</dd>
      <dt>Nombre d’aliments</dt><dd><strong>1 pomme</strong> ou <strong>2 pommes</strong> utilise une pomme moyenne de référence. La taille influence l’estimation. Le nombre fonctionne seulement si une portion unitaire correspondante est disponible; pour les autres fruits et légumes, utilise les grammes ou la saisie guidée.</dd>
    </dl><pre aria-label="Exemple avec une demi-tasse">laitue\nconcombres\n1/2 tasse cottage</pre><p class="muted small">Sans quantité, une portion de référence peut être utilisée. Elle ne mesure pas ce que tu as réellement mangé. Ajouter une quantité rend l’estimation plus utile.</p></details>
    <details data-guided-ui><summary>🔎 Saisie guidée avec ${source}</summary><p>Recherche un aliment, choisis la fiche et la préparation qui correspondent à ton repas, puis saisis la quantité et l’unité. Ajoute les autres aliments et termine la saisie.</p><p>La recherche utilise ${sourceDescription}. Choisis parmi les unités proposées pour l’aliment sélectionné.</p></details>
    <details><summary>📷 Photo</summary><p>La photo garde une trace de ton repas. L’analyse démarre seulement à ta demande. Utilise « Analyser avec l’IA » si tu souhaites une description suggérée, puis vérifie les aliments et les quantités avant de l’utiliser.</p></details>
    <details><summary>▥ Scanner un produit</summary><p>Utilise Scanner pour un produit emballé avec un code-barres. Vérifie le produit et ses valeurs nutritionnelles, puis indique la quantité consommée. Une étiquette « pour 100 g » ne signifie pas que tu as mangé 100 g.</p></details>
    <details data-calorie-ui><summary>🔥 À propos des calories</summary><p>Énergie utilise actuellement ses références nutritionnelles et les calories que tu saisis. L’estimation calorique par IA à partir d’un texte ou d’une photo est en préparation : elle n’est pas encore active. Indiquer le restaurant et le plat peut aider à identifier une référence pertinente, sans garantir une valeur officielle.</p><p>Les résultats resteront approximatifs, surtout lorsque les portions, les huiles ou les sauces sont inconnues. Tu pourras toujours entrer ou modifier les calories manuellement.</p></details>
    `}
    <button type="button" class="primary" data-close-meal-guide>${english ? 'Got it' : 'J’ai compris'}</button>
  </section>`;
  document.body.append(dialog);
  const originalMarkup = dialog.innerHTML;
  button.addEventListener('click', () => {
    dialog.innerHTML = originalMarkup;
    const guidedMode = (() => {
      try {
        const settings = JSON.parse(localStorage.getItem('energie_data') || '{}')?.settings;
        return settings?.mealEntryMode === 'guided';
      } catch (_) { return false; }
    })();
    // Prefer the current form mode when available; avoid relying on persisted key names.
    const inlineGuided = document.getElementById('mealInlineGuided');
    const isGuided = inlineGuided ? !inlineGuided.hidden : guidedMode;
    if (isGuided) {
      const quantityEnabled = !!document.querySelector('#mealInlineGuided .meal-inline-amount:not([hidden])');
      const card = dialog.querySelector('.meal-entry-guide-card');
      const intro = card?.querySelector(':scope > p');
      if (intro) intro.textContent = english
        ? 'Find each food in the nutrition database and select the matching result. Add foods one at a time.'
        : 'Recherche chaque aliment dans le référentiel nutritionnel et sélectionne le bon résultat. Ajoute les aliments un à un.';
      const writeSection = card?.querySelector(':scope > section');
      if (writeSection) writeSection.innerHTML = english
        ? '<h3>🔎 Choose your foods</h3><p>Tap “Search for a food”, type a name and choose the food and preparation that match what you ate. Use “+ Add a food” to add another row, or − to remove one.</p>'
        : '<h3>🔎 Choisir les aliments</h3><p>Clique sur « Rechercher un aliment », écris son nom et sélectionne la fiche et la préparation qui correspondent à ton repas. Utilise « + Ajouter un aliment » pour une autre ligne ou − pour en retirer une.</p>';
      const quantities = card?.querySelector('details[open]');
      if (quantities) {
        quantities.open = true;
        quantities.innerHTML = english
          ? '<summary>How quantities work</summary><p>' + (quantityEnabled ? 'For each food, enter the amount and choose one of the available units. For example, a quantity of 1 with the unit “2 large eggs” means two eggs. Changing the amount updates the nutrition estimate.' : 'Quantities are disabled in your preferences. You only need to select the foods; no amount or unit is required. Without quantities, a precise calorie estimate may not be available.') + '</p>'
          : '<summary>Comment fonctionnent les quantités ?</summary><p>' + (quantityEnabled ? 'Pour chaque aliment, indique le nombre et choisis une unité proposée. Par exemple, une quantité de 1 avec l’unité « 2 gros œufs » représente deux œufs. Modifier le nombre ajuste l’estimation nutritionnelle.' : 'Les quantités sont désactivées dans tes préférences. Sélectionne simplement les aliments, sans nombre ni unité. Sans quantités, une estimation précise des calories peut ne pas être disponible.') + '</p>';
      }
      card?.querySelectorAll('[data-guided-ui]').forEach(el => el.remove());
    }
    if (document.body.classList.contains('professional-hide-guided-options')) {
      dialog.querySelectorAll('[data-guided-ui]').forEach(section => section.remove());
      const intro = dialog.querySelector('.meal-entry-guide-card > p');
      if (intro) intro.textContent = english
        ? 'You can write your meal, add a photo or scan a product. You do not need to use every method.'
        : 'Tu peux écrire ton repas, ajouter une photo ou scanner un produit. Tu n’as pas besoin d’utiliser toutes les méthodes.';
      const walker = document.createTreeWalker(dialog, NodeFilter.SHOW_TEXT);
      while (walker.nextNode()) walker.currentNode.textContent = walker.currentNode.textContent
        .replace('use grams or guided entry for other fruits and vegetables.', 'use grams for other fruits and vegetables.')
        .replace('use grams or guided entry.', 'use grams.')
        .replace('Try guided entry to select a precise reference. ', '')
        .replace('utilise les grammes ou la saisie guidée.', 'utilise les grammes.')
        .replace('utilise les grammes ou passe par la saisie guidée.', 'utilise les grammes.')
        .replace('Essaie la saisie guidée pour choisir une référence précise. ', '');
    }
    dialog.querySelectorAll('[data-close-meal-guide]').forEach(control =>
      control.addEventListener('click', () => dialog.close()));
    dialog.showModal();
  });
})(window);
