(() => {
  "use strict";

  const normalize = value => String(value || "")
    .toLocaleLowerCase("fr-CA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/[^a-z0-9&+\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const DEFINITIONS = [
    { id:"dairy", icon:"🥛", label:"Produits laitiers", terms:["lait","fromage","yogourt","yaourt","yogurt","creme","cream","beurre","butter","mozzarella","parmesan","cheddar","cottage","latte","cappuccino","pizza","poutine","mac and cheese","macaroni au fromage","grilled cheese","cheeseburger","lasagne","lasagna"] },
    { id:"wheat", icon:"🍞", label:"Blé", terms:["pain","toast","rotie","roties","bagel","croissant","pate","pates","pasta","pizza","biscuit","muffin","gateau","tarte","wrap","tortilla","sandwich","burger","hamburger","hot dog","lasagne","lasagna","mac and cheese","macaroni au fromage","cereale","granola"] },
    { id:"caffeine", icon:"☕", label:"Caféine", terms:["cafe","coffee","espresso","latte","cappuccino","frappuccino","matcha","the noir","black tea","the vert","green tea","boisson energisante","energy drink","cola","coke","pepsi"] },
    { id:"tomato", icon:"🍅", label:"Tomates", terms:["tomate","tomatoes","sauce tomate","pizza","lasagne","lasagna","salsa","ketchup"] },
    { id:"spicy", icon:"🌶️", label:"Épicé", terms:["epice","epicee","spicy","piquant","piment","jalapeno","sriracha","buffalo","cari","curry","chili"] },
    { id:"alcohol", icon:"🍷", label:"Alcool", terms:["vin","wine","biere","beer","cidre","cocktail","vodka","rhum","rum","gin","whisky","whiskey","tequila","alcool"] },
    { id:"sugary", icon:"🍬", label:"Aliments sucrés", terms:["bonbon","chocolat","biscuit","gateau","beigne","donut","brownie","tarte","sirop","nutella","popsicle","creme glacee","ice cream","boisson gazeuse","cola","coke","pepsi","sprite","7up","jus","frappuccino","cereales sucrees"] },
    { id:"fried", icon:"🍟", label:"Aliments frits", terms:["frit","frite","fried","poutine","fish and chips","nuggets","ailes de poulet","chicken wings","beigne","donut"] },
    { id:"legumes", icon:"🫘", label:"Légumineuses", terms:["pois chiche","chickpea","lentille","lentils","haricot","beans","tofu","tempeh"] },
    { id:"fruit", icon:"🍓", label:"Fruits", terms:["fruit","pomme","apple","banane","banana","orange","bleuet","blueberry","fraise","strawberry","framboise","raspberry","raisin","grape","mangue","mango","ananas","pineapple","poire","pear","kiwi","melon"] },
    { id:"vegetables", icon:"🥦", label:"Légumes", terms:["legume","salade","brocoli","carotte","concombre","tomate","epinard","poivron","courgette","chou","asperge","haricot vert","aubergine","celeri","oignon"] },
    { id:"fermented", icon:"🥣", label:"Aliments fermentés", terms:["yogourt","yaourt","yogurt","kefir","kimchi","choucroute","sauerkraut","miso","tempeh","kombucha"] },
    { id:"highly_processed", icon:"📦", label:"Aliments très transformés", terms:["chips","croustille","poutine","hot dog","nuggets","boisson gazeuse","cola","coke","pepsi","sprite","7up","bonbon","oreo","chips ahoy","frappuccino","repas congele","fast food"] }
  ];

  function categoriesForText(value) {
    const text = ` ${normalize(value)} `;
    return DEFINITIONS.filter(category => category.terms.some(term => text.includes(` ${normalize(term)} `) || text.includes(normalize(term))));
  }

  function categoryIdsForText(value) {
    return categoriesForText(value).map(category => category.id);
  }

  window.ENERGIE_FOOD_CATEGORIES = Object.freeze({
    version: 1,
    definitions: DEFINITIONS.map(item => ({...item, terms:[...item.terms]})),
    normalize,
    categoriesForText,
    categoryIdsForText
  });
})();
