(() => {
  "use strict";

  const VERSION = 2;

  const normalize = value => String(value ?? "")
    .toLocaleLowerCase("fr-CA")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[’']/g, " ")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9%+\s-]/g, " ")
    .replace(/[-_]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();

  const CATEGORY_DEFINITIONS = [
    { id:"dairy", icon:"🥛", labels:{"fr-CA":"Produits laitiers","fr-FR":"Produits laitiers",en:"Dairy"} },
    { id:"gluten", icon:"🍞", labels:{"fr-CA":"Gluten","fr-FR":"Gluten",en:"Gluten"} },
    { id:"fruits", icon:"🍓", labels:{"fr-CA":"Fruits","fr-FR":"Fruits",en:"Fruits"} },
    { id:"vegetables", icon:"🥦", labels:{"fr-CA":"Légumes","fr-FR":"Légumes",en:"Vegetables"} },
    { id:"legumes", icon:"🫘", labels:{"fr-CA":"Légumineuses","fr-FR":"Légumineuses",en:"Legumes"} },
    { id:"whole_grains", icon:"🌾", labels:{"fr-CA":"Grains entiers","fr-FR":"Céréales complètes",en:"Whole grains"} },
    { id:"refined_grains", icon:"🥖", labels:{"fr-CA":"Grains raffinés","fr-FR":"Céréales raffinées",en:"Refined grains"} },
    { id:"nuts", icon:"🥜", labels:{"fr-CA":"Noix","fr-FR":"Fruits à coque",en:"Nuts"} },
    { id:"seeds", icon:"🌱", labels:{"fr-CA":"Graines","fr-FR":"Graines",en:"Seeds"} },
    { id:"eggs", icon:"🥚", labels:{"fr-CA":"Œufs","fr-FR":"Œufs",en:"Eggs"} },
    { id:"poultry", icon:"🍗", labels:{"fr-CA":"Volaille","fr-FR":"Volaille",en:"Poultry"} },
    { id:"red_meat", icon:"🥩", labels:{"fr-CA":"Viande rouge","fr-FR":"Viande rouge",en:"Red meat"} },
    { id:"fish", icon:"🐟", labels:{"fr-CA":"Poisson","fr-FR":"Poisson",en:"Fish"} },
    { id:"seafood", icon:"🦐", labels:{"fr-CA":"Fruits de mer","fr-FR":"Fruits de mer",en:"Seafood"} },
    { id:"fermented", icon:"🥣", labels:{"fr-CA":"Aliments fermentés","fr-FR":"Aliments fermentés",en:"Fermented foods"} },
    { id:"sugary_foods", icon:"🍬", labels:{"fr-CA":"Aliments sucrés","fr-FR":"Aliments sucrés",en:"Sugary foods"} },
    { id:"processed_foods", icon:"📦", labels:{"fr-CA":"Aliments transformés","fr-FR":"Aliments transformés",en:"Processed foods"} },
    { id:"ultra_processed", icon:"🏭", labels:{"fr-CA":"Aliments ultra-transformés","fr-FR":"Aliments ultra-transformés",en:"Ultra-processed foods"} },
    { id:"caffeine", icon:"☕", labels:{"fr-CA":"Caféine","fr-FR":"Caféine",en:"Caffeine"} },
    { id:"alcohol", icon:"🍷", labels:{"fr-CA":"Alcool","fr-FR":"Alcool",en:"Alcohol"} },
    { id:"healthy_fats", icon:"🥑", labels:{"fr-CA":"Bons gras","fr-FR":"Matières grasses insaturées",en:"Healthy fats"} },
    { id:"fried_foods", icon:"🍟", labels:{"fr-CA":"Aliments frits","fr-FR":"Aliments frits",en:"Fried foods"} },
    { id:"spicy_foods", icon:"🌶️", labels:{"fr-CA":"Aliments épicés","fr-FR":"Aliments épicés",en:"Spicy foods"} },
    { id:"artificial_sweeteners", icon:"🧪", labels:{"fr-CA":"Édulcorants artificiels","fr-FR":"Édulcorants artificiels",en:"Artificial sweeteners"} },
    { id:"plant_protein", icon:"🌿", labels:{"fr-CA":"Protéines végétales","fr-FR":"Protéines végétales",en:"Plant protein"} },
    { id:"high_protein", icon:"💪", labels:{"fr-CA":"Riche en protéines","fr-FR":"Riche en protéines",en:"High protein"} },
    { id:"high_fiber", icon:"🌾", labels:{"fr-CA":"Riche en fibres","fr-FR":"Riche en fibres",en:"High fiber"} },
    { id:"soy", icon:"🫘", labels:{"fr-CA":"Soya","fr-FR":"Soja",en:"Soy"} }
  ];

  const FOOD_DEFINITIONS = [
    { id:"milk", synonyms:["lait","milk","whole milk","skim milk","2% milk","3.25% milk","lait entier","lait ecreme","lait 2%","lait 3.25%"], exclusions:["lait d amande","almond milk","lait de soya","soy milk","lait d avoine","oat milk","lait de coco","coconut milk"], categories:["dairy"] },
    { id:"cream", synonyms:["creme","cream","heavy cream","whipping cream","creme 35%","coffee cream","creme a cafe"], categories:["dairy","processed_foods"] },
    { id:"cheese", synonyms:["fromage","cheese","cheddar","mozzarella","parmesan","brie","gouda","feta","fromage cottage","cottage cheese","cream cheese","fromage a la creme"], categories:["dairy","processed_foods","high_protein"] },
    { id:"yogurt", synonyms:["yogourt","yaourt","yogurt","greek yogurt","yogourt grec","yaourt grec","skyr"], categories:["dairy","fermented","high_protein"] },
    { id:"kefir", synonyms:["kefir","kéfir"], categories:["dairy","fermented","high_protein"] },
    { id:"butter", synonyms:["beurre","butter"], exclusions:["beurre d arachide","peanut butter","beurre d amande","almond butter","beurre de noix","nut butter","beurre de graines","seed butter"], categories:["dairy","processed_foods"] },
    { id:"ice_cream", synonyms:["creme glacee","ice cream","gelato","sundae","milkshake","lait frappe"], categories:["dairy","sugary_foods","ultra_processed"] },

    { id:"wheat_bread", synonyms:["pain blanc","white bread","pain de ble","wheat bread","toast","toasts","rotie","roties","baguette","croissant","bagel","english muffin","muffin anglais"], exclusions:["whole wheat toast","whole grain toast","rotie de ble entier","roties de ble entier","pain de ble entier","whole wheat bread","whole grain bread","pain complet"], categories:["gluten","refined_grains","processed_foods"] },
    { id:"whole_wheat_bread", synonyms:["pain de ble entier","whole wheat bread","whole grain bread","pain multigrain","multigrain bread","pain complet","whole wheat toast","whole grain toast","rotie de ble entier","roties de ble entier"], categories:["gluten","whole_grains","high_fiber","processed_foods"] },
    { id:"pasta", synonyms:["pates","pate alimentaire","pasta","spaghetti","macaroni","penne","fusilli","linguine","lasagne","lasagna","couscous"], categories:["gluten","refined_grains"] },
    { id:"whole_grain_pasta", synonyms:["pates de ble entier","whole wheat pasta","whole grain pasta","pates completes"], categories:["gluten","whole_grains","high_fiber"] },
    { id:"oats", synonyms:["avoine","oats","oatmeal","gruau","overnight oats","flocons d avoine","porridge"], categories:["whole_grains","high_fiber"] },
    { id:"barley", synonyms:["orge","barley"], categories:["gluten","whole_grains","high_fiber"] },
    { id:"rye", synonyms:["seigle","rye","pain de seigle","rye bread"], categories:["gluten","whole_grains","high_fiber"] },
    { id:"rice_white", synonyms:["riz blanc","white rice","riz jasmin","jasmine rice","riz sushi","sushi rice"], categories:["refined_grains"] },
    { id:"rice_brown", synonyms:["riz brun","brown rice","riz complet","wild rice","riz sauvage"], categories:["whole_grains","high_fiber"] },
    { id:"quinoa", synonyms:["quinoa"], categories:["whole_grains","plant_protein","high_protein","high_fiber"] },
    { id:"breakfast_cereal", synonyms:["cereales","cereal","corn flakes","rice krispies","frosted flakes","fruit loops","cheerios","granola cereal"], categories:["processed_foods","refined_grains"] },
    { id:"pastry", synonyms:["muffin","cupcake","gateau","cake","biscuit","cookie","cookies","donut","beigne","brownie","tarte","pie","danish","viennoiserie"], categories:["gluten","refined_grains","sugary_foods","ultra_processed"] },

    { id:"apple", synonyms:["pomme","pommes","apple","apples"], categories:["fruits","high_fiber"] },
    { id:"banana", synonyms:["banane","bananes","banana","bananas"], categories:["fruits"] },
    { id:"berries", synonyms:["fraise","fraises","strawberry","strawberries","bleuet","bleuets","blueberry","blueberries","framboise","framboises","raspberry","raspberries","mure","mures","blackberry","blackberries"], categories:["fruits","high_fiber"] },
    { id:"citrus", synonyms:["orange","oranges","clementine","mandarine","tangerine","pamplemousse","grapefruit","citron","lemon","lime","lime fruit","citron vert"], categories:["fruits"] },
    { id:"grapes", synonyms:["raisin","raisins","grape","grapes"], categories:["fruits"] },
    { id:"tropical_fruit", synonyms:["mangue","mango","ananas","pineapple","papaye","papaya","kiwi","fruit de la passion","passion fruit"], categories:["fruits"] },
    { id:"stone_fruit", synonyms:["peche","peches","peach","peaches","nectarine","abricot","apricot","prune","plum","cerise","cherry","cherries"], categories:["fruits"] },
    { id:"melon", synonyms:["melon","cantaloup","cantaloupe","melon d eau","watermelon"], categories:["fruits"] },
    { id:"dried_fruit", synonyms:["fruits seches","dried fruit","raisins secs","dried cranberries","canneberges sechees","dates","dattes","figues sechees","dried figs"], categories:["fruits","processed_foods"] },

    { id:"broccoli", synonyms:["brocoli","broccoli"], categories:["vegetables","high_fiber"] },
    { id:"leafy_greens", synonyms:["epinard","epinards","spinach","kale","chou frise","laitue","lettuce","roquette","arugula","mesclun","salade verte","green salad"], categories:["vegetables","high_fiber"] },
    { id:"cruciferous", synonyms:["chou fleur","cauliflower","chou de bruxelles","brussels sprouts","chou","cabbage","bok choy"], categories:["vegetables","high_fiber"] },
    { id:"root_vegetables", synonyms:["carotte","carottes","carrot","carrots","betterave","beet","beets","navet","turnip","panais","parsnip","patate douce","sweet potato","yam"], categories:["vegetables","high_fiber"] },
    { id:"tomato", synonyms:["tomate","tomates","tomato","tomatoes","sauce tomate","tomato sauce"], categories:["vegetables"] },
    { id:"peppers", synonyms:["poivron","poivrons","bell pepper","bell peppers","piment doux","sweet pepper"], categories:["vegetables"] },
    { id:"squash", synonyms:["courgette","zucchini","courge","squash","citrouille","pumpkin"], categories:["vegetables","high_fiber"] },
    { id:"cucumber", synonyms:["concombre","cucumber"], categories:["vegetables"] },
    { id:"mushroom", synonyms:["champignon","champignons","mushroom","mushrooms"], categories:["vegetables"] },
    { id:"allium", synonyms:["oignon","oignons","onion","onions","ail","garlic","poireau","leek","echalote","shallot"], categories:["vegetables"] },
    { id:"corn", synonyms:["mais","corn","baby corn","mini mais"], categories:["vegetables","whole_grains"] },

    { id:"chickpeas", synonyms:["pois chiche","pois chiches","chickpea","chickpeas","houmous","hummus"], categories:["legumes","plant_protein","high_protein","high_fiber"] },
    { id:"lentils", synonyms:["lentille","lentilles","lentil","lentils"], categories:["legumes","plant_protein","high_protein","high_fiber"] },
    { id:"beans", synonyms:["haricot noir","black beans","haricots noirs","kidney beans","haricots rouges","white beans","haricots blancs","navy beans","pinto beans","refried beans","feves","beans"], categories:["legumes","plant_protein","high_protein","high_fiber"] },
    { id:"peas", synonyms:["pois verts","green peas","split peas","pois casses"], categories:["legumes","plant_protein","high_fiber"] },
    { id:"tofu", synonyms:["tofu"], categories:["legumes","soy","plant_protein","high_protein"] },
    { id:"tempeh", synonyms:["tempeh"], categories:["legumes","soy","plant_protein","high_protein","fermented"] },
    { id:"edamame", synonyms:["edamame","feves de soya","soybeans","soya beans"], categories:["legumes","soy","plant_protein","high_protein","high_fiber"] },

    { id:"almonds", synonyms:["amande","amandes","almond","almonds","beurre d amande","almond butter"], categories:["nuts","healthy_fats","plant_protein","high_fiber"] },
    { id:"peanuts", synonyms:["arachide","arachides","peanut","peanuts","beurre d arachide","peanut butter"], categories:["nuts","healthy_fats","plant_protein","high_protein"] },
    { id:"tree_nuts", synonyms:["noix","walnut","walnuts","noix de grenoble","cashew","cashews","noix de cajou","pistache","pistaches","pistachio","pecan","pacane","noisette","hazelnut","macadamia"], categories:["nuts","healthy_fats","plant_protein","high_fiber"] },
    { id:"chia", synonyms:["chia","graines de chia","chia seeds"], categories:["seeds","healthy_fats","plant_protein","high_fiber"] },
    { id:"flax", synonyms:["lin","graines de lin","flax","flaxseed","flax seeds"], categories:["seeds","healthy_fats","plant_protein","high_fiber"] },
    { id:"hemp", synonyms:["chanvre","graines de chanvre","hemp","hemp seeds","hemp hearts"], categories:["seeds","healthy_fats","plant_protein","high_protein"] },
    { id:"other_seeds", synonyms:["graines de citrouille","pumpkin seeds","pepitas","graines de tournesol","sunflower seeds","sesame","graines de sesame","tahini"], categories:["seeds","healthy_fats","plant_protein"] },

    { id:"egg", synonyms:["oeuf","oeufs","egg","eggs","omelette","frittata","oeuf brouille","scrambled eggs","oeuf a la coque","hard boiled egg"], categories:["eggs","high_protein"] },
    { id:"chicken", synonyms:["poulet","chicken","poitrine de poulet","chicken breast","cuisse de poulet","chicken thigh","dinde","turkey"], categories:["poultry","high_protein"] },
    { id:"processed_poultry", synonyms:["nuggets","chicken nuggets","charcuterie de dinde","turkey slices","deli turkey","hot dog de poulet","chicken hot dog"], categories:["poultry","processed_foods","ultra_processed","high_protein"] },
    { id:"beef", synonyms:["boeuf","beef","steak","hamburger patty","boulette de boeuf","ground beef","boeuf hache","roast beef"], categories:["red_meat","high_protein"] },
    { id:"pork", synonyms:["porc","pork","cotelette de porc","pork chop","filet de porc","pork tenderloin"], categories:["red_meat","high_protein"] },
    { id:"processed_meat", synonyms:["bacon","jambon","ham","saucisse","sausage","pepperoni","salami","hot dog","charcuterie","deli meat"], categories:["red_meat","processed_foods","ultra_processed","high_protein"] },
    { id:"salmon", synonyms:["saumon","salmon","truite","trout","sardine","sardines","maquereau","mackerel"], categories:["fish","healthy_fats","high_protein"] },
    { id:"white_fish", synonyms:["morue","cod","aiglefin","haddock","tilapia","sole","flétan","halibut","thon","tuna"], categories:["fish","high_protein"] },
    { id:"shellfish", synonyms:["crevette","crevettes","shrimp","prawn","homard","lobster","crabe","crab","moule","mussels","huitre","oyster","palourde","clam","petoncle","scallop"], categories:["seafood","high_protein"] },

    { id:"sauerkraut", synonyms:["choucroute","sauerkraut"], categories:["fermented","vegetables","processed_foods"] },
    { id:"kimchi", synonyms:["kimchi"], categories:["fermented","vegetables","spicy_foods","processed_foods"] },
    { id:"miso", synonyms:["miso","soupe miso","miso soup"], categories:["fermented","soy","processed_foods"] },
    { id:"kombucha", synonyms:["kombucha"], categories:["fermented","processed_foods"] },
    { id:"pickles", synonyms:["cornichon","cornichons","pickle","pickles","legumes lactofermentes","fermented vegetables"], categories:["fermented","vegetables","processed_foods"] },

    { id:"candy", synonyms:["bonbon","bonbons","candy","candies","gummy","gummies","jujube","caramel"], categories:["sugary_foods","ultra_processed"] },
    { id:"chocolate", synonyms:["chocolat","chocolate","barre de chocolat","chocolate bar","nutella","tartinade au chocolat"], categories:["sugary_foods","processed_foods"] },
    { id:"sweet_drinks", synonyms:["boisson gazeuse","soft drink","soda","cola","coke","pepsi","sprite","7up","root beer","jus sucre","sweetened juice","fruit punch","slush","slushie"], exclusions:["diet soda","diet coke","coke diet","coke zero","pepsi zero","zero sugar soda","boisson zero sucre","boisson diet"], categories:["sugary_foods","ultra_processed"] },
    { id:"sweetened_cereal", synonyms:["cereales sucrees","sugary cereal","frosted flakes","fruit loops","lucky charms","cinnamon toast crunch"], categories:["sugary_foods","refined_grains","ultra_processed"] },
    { id:"protein_bar", synonyms:["barre proteinee","protein bar","barre tendre","granola bar","energy bar"], categories:["processed_foods","ultra_processed"] },
    { id:"chips", synonyms:["chips","croustille","croustilles","potato chips","doritos","cheetos","tortilla chips"], categories:["fried_foods","processed_foods","ultra_processed"] },
    { id:"fast_food", synonyms:["fast food","restauration rapide","mcdo","mcdonalds","burger king","wendys","kfc","taco bell"], categories:["processed_foods","ultra_processed"] },
    { id:"frozen_meal", synonyms:["repas congele","frozen meal","tv dinner","pizza congelee","frozen pizza","pogo","pizza pocket"], categories:["processed_foods","ultra_processed"] },

    { id:"coffee", synonyms:["cafe","coffee","espresso","americano","latte","cappuccino","mocha","frappuccino","cold brew","cafe glace","iced coffee"], categories:["caffeine"] },
    { id:"tea_caffeinated", synonyms:["the noir","black tea","the vert","green tea","matcha","chai","earl grey","oolong"], categories:["caffeine"] },
    { id:"energy_drink", synonyms:["boisson energisante","energy drink","red bull","monster energy","rockstar"], categories:["caffeine","sugary_foods","ultra_processed"] },
    { id:"cola_caffeine", synonyms:["coca cola","coke","pepsi","diet coke","coke zero","pepsi zero"], categories:["caffeine","ultra_processed"] },
    { id:"wine", synonyms:["vin","wine","vin rouge","red wine","vin blanc","white wine","rose wine","vin rose"], categories:["alcohol"] },
    { id:"beer", synonyms:["biere","beer","lager","ipa","stout","cider","cidre"], categories:["alcohol"] },
    { id:"spirits", synonyms:["vodka","gin","rhum","rum","whisky","whiskey","tequila","liqueur","cocktail","alcool","alcohol"], categories:["alcohol"] },

    { id:"avocado", synonyms:["avocat","avocats","avocado","avocados","guacamole"], categories:["fruits","healthy_fats","high_fiber"] },
    { id:"olive_oil", synonyms:["huile d olive","olive oil","olives","olive"], categories:["healthy_fats"] },
    { id:"fried_food", synonyms:["frit","frite","frites","fried","deep fried","tempura","fish and chips","poutine","onion rings","rondelles d oignon","fried chicken","poulet frit"], categories:["fried_foods","processed_foods"] },
    { id:"spicy_food", synonyms:["epice","epicee","epices","spicy","piquant","piment fort","hot pepper","jalapeno","sriracha","tabasco","buffalo sauce","chili","curry","cari"], categories:["spicy_foods"] },
    { id:"artificial_sweetener", synonyms:["aspartame","sucralose","splenda","acesulfame k","acesulfame potassium","saccharin","saccharine","sweet n low","equal","edulcorant artificiel","artificial sweetener"], categories:["artificial_sweeteners","ultra_processed"] },
    { id:"diet_drink", synonyms:["diet soda","diet coke","coke diet","coke zero","pepsi zero","zero sugar soda","boisson zero sucre","boisson diet"], categories:["artificial_sweeteners","ultra_processed","caffeine"] }
  ];

  const CATEGORY_MAP = new Map(CATEGORY_DEFINITIONS.map(category => [category.id, category]));
  const PREPARED_FOODS = FOOD_DEFINITIONS.map(food => ({
    ...food,
    normalizedSynonyms: [...new Set([food.id, ...(food.synonyms || [])].map(normalize).filter(Boolean))]
      .sort((a, b) => b.length - a.length),
    normalizedExclusions: [...new Set((food.exclusions || []).map(normalize).filter(Boolean))]
      .sort((a, b) => b.length - a.length)
  }));

  function containsTerm(normalizedText, normalizedTerm) {
    if (!normalizedText || !normalizedTerm) return false;
    return (` ${normalizedText} `).includes(` ${normalizedTerm} `);
  }

  function foodsForText(value) {
    const text = normalize(value);
    if (!text) return [];
    return PREPARED_FOODS
      .filter(food =>
        food.normalizedSynonyms.some(term => containsTerm(text, term)) &&
        !food.normalizedExclusions.some(term => containsTerm(text, term))
      )
      .map(food => ({id:food.id, synonyms:[...food.synonyms], exclusions:[...(food.exclusions || [])], categories:[...food.categories]}));
  }

  function categoryIdsForText(value) {
    const ids = new Set();
    foodsForText(value).forEach(food => food.categories.forEach(id => ids.add(id)));
    return [...ids];
  }

  function categoriesForText(value, locale = "fr-CA") {
    return categoryIdsForText(value)
      .map(id => CATEGORY_MAP.get(id))
      .filter(Boolean)
      .map(category => ({
        id: category.id,
        icon: category.icon,
        label: category.labels[locale] || category.labels["fr-CA"] || category.labels.en || category.id,
        labels: {...category.labels}
      }));
  }

  function getCategory(id, locale = "fr-CA") {
    const category = CATEGORY_MAP.get(id);
    if (!category) return null;
    return {
      id: category.id,
      icon: category.icon,
      label: category.labels[locale] || category.labels["fr-CA"] || category.labels.en || category.id,
      labels: {...category.labels}
    };
  }

  function getCategoryLabel(id, locale = "fr-CA") {
    return getCategory(id, locale)?.label || id;
  }

  const definitions = CATEGORY_DEFINITIONS.map(category => ({
    id: category.id,
    icon: category.icon,
    label: category.labels["fr-CA"],
    labels: {...category.labels},
    terms: PREPARED_FOODS
      .filter(food => food.categories.includes(category.id))
      .flatMap(food => food.synonyms)
  }));

  window.ENERGIE_FOOD_CATEGORIES = Object.freeze({
    version: VERSION,
    definitions,
    categories: CATEGORY_DEFINITIONS.map(category => ({...category, labels:{...category.labels}})),
    foods: FOOD_DEFINITIONS.map(food => ({...food, synonyms:[...food.synonyms], exclusions:[...(food.exclusions || [])], categories:[...food.categories]})),
    normalize,
    foodsForText,
    categoriesForText,
    categoryIdsForText,
    getCategory,
    getCategoryLabel
  });
})();
