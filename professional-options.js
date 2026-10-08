(function (root) {
  'use strict';
  const definitions = [
    {key:'showCnfGuidedEntry',control:'#settingShowCnfGuidedEntry',label:'Afficher la saisie guidée FCÉN'},
    {key:'showCiqualGuidedEntry',control:'#settingShowCiqualGuidedEntry',label:'Afficher la saisie guidée Ciqual'},
    {key:'forceGuidedCnfMealEntry',control:'#settingForceGuidedCnf',label:'Exiger la saisie guidée'},
    {key:'hideCalories',control:'#settingHideCalories',label:'Masquer toutes les calories'},
    {key:'showEatingReasons',control:'#settingEatingReasons',label:'Afficher les raisons de manger'},
    {key:'showRecognizedElements',control:'#settingRecognizedElements',label:'Afficher les éléments reconnus'},
    {key:'summaryHideCompletedMeals',control:'#settingSummaryHideCompletedMeals',label:'Masquer les repas complétés en vue Sommaire'},
    {key:'feelingReminders',control:'#settingFeelingReminders',label:'Rappels de ressenti'},
  ];
  const keys = new Set(definitions.map(item=>item.key)), originals = new WeakMap();
  const raw = settings => originals.get(settings) || settings;
  function cleanRules(value) {
    const rules = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return rules;
    for (const key of keys) {
      const item = value[key];
      if (item && ['default','locked'].includes(item.mode) && typeof item.value === 'boolean' && typeof item.token === 'string' && item.token.length <= 64 && item.token.length) {
        rules[key] = {mode:item.mode,value:item.value,token:item.token};
      }
    }
    return rules;
  }
  function cleanChoices(value) {
    const choices = {};
    if (!value || typeof value !== 'object' || Array.isArray(value)) return choices;
    for (const [id,item] of Object.entries(value).slice(-80)) {
      const key = id.split(':').at(-1);
      if (keys.has(key) && id.length <= 120 && typeof item?.token === 'string' && item.token.length <= 64 && typeof item.value === 'boolean' && Number.isFinite(Date.parse(item.updatedAt))) {
        choices[id] = {token:item.token,value:item.value,updatedAt:item.updatedAt};
      }
    }
    return choices;
  }
  function mergeChoices(local, remote) {
    const out=cleanChoices(local);
    for (const [id,item] of Object.entries(cleanChoices(remote))) if (!out[id] || Date.parse(item.updatedAt) > Date.parse(out[id].updatedAt)) out[id]=item;
    return cleanChoices(out);
  }
  function effective(settings, key, policy) {
    const source=raw(settings), rule=policy?.rules?.[key];
    if (!keys.has(key) || !rule) return source[key];
    if (rule.mode === 'locked') return rule.value;
    const choice=source.professionalOptionChoices?.[`${policy.linkId}:${key}`];
    return choice?.token === rule.token && typeof choice.value === 'boolean' ? choice.value : rule.value;
  }
  function wrap(settings, getPolicy) {
    const source=raw(settings);
    const proxy=new Proxy(source, {get(target,key,receiver) {
      if (key==='toJSON') return ()=>target;
      return keys.has(key) ? effective(target,key,getPolicy()) : Reflect.get(target,key,receiver);
    }});
    originals.set(proxy,source);
    return proxy;
  }
  function recordChoice(settings,key,policy,now=new Date().toISOString()) {
    const source=raw(settings),rule=policy?.rules?.[key];
    if (!keys.has(key) || rule?.mode !== 'default' || typeof source[key] !== 'boolean') return;
    source.professionalOptionChoices=cleanChoices({...source.professionalOptionChoices,[`${policy.linkId}:${key}`]:{token:rule.token,value:source[key],updatedAt:now}});
  }
  function hideControls(scope,policy) {
    for (const definition of definitions) {
      if (policy?.rules?.[definition.key]?.mode !== 'locked') continue;
      const control=scope.querySelector(definition.control),label=control?.closest('label'),card=control?.closest('section.card');
      if (control) control.disabled=true;
      label?.remove();
      if (definition.key==='feelingReminders' && policy.rules.feelingReminders.value === false) scope.querySelector('#feelingReminderOptions')?.remove();
      if (card && !card.querySelector('input,select,button,details')) card.remove();
    }
    // Les explications de saisie ne doivent pas proposer une option masquée.
    const guided=scope.querySelector('.guided-entry-settings');
    if (guided && ['showCnfGuidedEntry','showCiqualGuidedEntry'].some(key=>policy?.rules?.[key]?.mode==='locked' && !policy.rules[key].value)) {
      const heading=guided.querySelector('h3'),description=guided.querySelector(':scope > p');
      if (heading) heading.textContent=root.ENERGIE_I18N?.t?.('Saisie des aliments') || 'Saisie des aliments';
      if (description) description.remove();
    }
    // Une source entièrement imposée n'a plus de réglage à présenter au client.
    for (const card of scope.querySelectorAll('.guided-entry-settings')) if (!card.querySelector('input,select,button')) card.remove();
    if (policy?.rules?.hideCalories?.mode === 'locked' && policy.rules.hideCalories.value) scope.querySelector('.calorie-balance-profile-card')?.remove();
    if (['showCnfGuidedEntry','showCiqualGuidedEntry','forceGuidedCnfMealEntry'].some(key=>policy?.rules?.[key]?.mode==='locked' && policy.rules[key].value===false)) scope.querySelector('.nutrition-source-profile-card')?.remove();
  }
  root.EnergieProfessionalOptions={definitions,raw,cleanRules,cleanChoices,mergeChoices,effective,wrap,recordChoice,hideControls};
})(typeof window !== 'undefined' ? window : globalThis);
