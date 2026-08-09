(() => {
  "use strict";

  const VERSION = 1;
  const DISHES = [
    {id:"pate_chinois", names:["pate chinois","pâté chinois","chinese pie"], probable:["protein","fiber","red_meat","vegetables"], possible:["dairy"], ingredients:["bœuf haché","maïs","pommes de terre"], nutrition:{calories:430,protein:24,carbs:48,fat:16,fiber:5}},
    {id:"shepherds_pie", names:["shepherd s pie","cottage pie","hachis parmentier"], probable:["protein","fiber","red_meat","vegetables"], possible:["dairy"], ingredients:["viande hachée","légumes","pommes de terre"], nutrition:{calories:440,protein:24,carbs:46,fat:17,fiber:5}},
    {id:"lasagna", names:["lasagne","lasagna"], probable:["protein","dairy","gluten","refined_grains","vegetables"], possible:["fiber","red_meat","eggs"], ingredients:["pâtes","sauce tomate","fromage","protéine variable"], nutrition:{calories:520,protein:28,carbs:48,fat:24,fiber:4}},
    {id:"fettuccine_alfredo", names:["fettuccine alfredo","fettucine alfredo","pates alfredo","pâtes alfredo","alfredo pasta"], probable:["dairy","gluten","refined_grains"], possible:["protein"], ingredients:["pâtes","crème","beurre","parmesan"], nutrition:{calories:610,protein:18,carbs:65,fat:31,fiber:3}},
    {id:"mac_cheese", names:["macaroni au fromage","mac and cheese","mac n cheese","mac & cheese"], probable:["dairy","gluten","refined_grains","protein"], possible:[], ingredients:["macaroni","fromage","lait ou crème"], nutrition:{calories:490,protein:19,carbs:58,fat:21,fiber:3}},
    {id:"spaghetti_meat", names:["spaghetti sauce a la viande","spaghetti sauce à la viande","spaghetti bolognaise","spaghetti bolognese"], probable:["protein","gluten","refined_grains","red_meat","vegetables"], possible:["dairy","fiber"], ingredients:["pâtes","viande","tomates"], nutrition:{calories:520,protein:26,carbs:68,fat:16,fiber:5}},
    {id:"carbonara", names:["spaghetti carbonara","pates carbonara","pâtes carbonara","carbonara"], probable:["protein","dairy","eggs","gluten","refined_grains","processed_foods"], possible:["red_meat"], ingredients:["pâtes","œuf","fromage","porc salé"], nutrition:{calories:590,protein:25,carbs:62,fat:27,fiber:3}},
    {id:"pesto_pasta", names:["pates au pesto","pâtes au pesto","pesto pasta"], probable:["gluten","refined_grains"], possible:["dairy","nuts","protein"], ingredients:["pâtes","basilic","huile","parmesan ou noix possibles"], nutrition:{calories:510,protein:15,carbs:63,fat:23,fiber:4}},
    {id:"pizza", names:["pizza"], probable:["dairy","gluten","refined_grains","vegetables"], possible:["protein","red_meat","soy"], ingredients:["pâte","sauce tomate","fromage","garnitures variables"], nutrition:{calories:560,protein:23,carbs:66,fat:23,fiber:4}},
    {id:"poutine", names:["poutine"], probable:["dairy","vegetables","fried_foods","processed_foods"], possible:["gluten","soy"], ingredients:["frites","fromage en grains","sauce"], nutrition:{calories:740,protein:20,carbs:88,fat:34,fiber:7}},
    {id:"club_sandwich", names:["club sandwich","sandwich club"], probable:["protein","poultry","processed_foods","gluten","refined_grains","vegetables"], possible:["dairy","eggs"], ingredients:["pain","poulet ou dinde","bacon","laitue","tomate"], nutrition:{calories:590,protein:36,carbs:48,fat:28,fiber:4}},
    {id:"grilled_cheese", names:["grilled cheese","sandwich au fromage","toast au fromage"], probable:["dairy","gluten","refined_grains","protein"], possible:[], ingredients:["pain","fromage","matière grasse"], nutrition:{calories:420,protein:18,carbs:38,fat:22,fiber:2}},
    {id:"blt", names:["sandwich blt","blt sandwich","blt"], probable:["protein","red_meat","processed_foods","gluten","refined_grains","vegetables"], possible:["eggs"], ingredients:["bacon","laitue","tomate","pain"], nutrition:{calories:450,protein:19,carbs:39,fat:25,fiber:3}},
    {id:"burger", names:["hamburger","cheeseburger","burger"], probable:["protein","gluten","refined_grains","vegetables"], possible:["dairy","red_meat","soy"], ingredients:["pain","galette protéinée","garnitures variables"], nutrition:{calories:560,protein:28,carbs:45,fat:29,fiber:3}},
    {id:"hot_dog", names:["hot dog","hotdog","chien chaud"], probable:["protein","processed_foods","gluten","refined_grains"], possible:["red_meat","soy","dairy"], ingredients:["saucisse","pain","condiments"], nutrition:{calories:390,protein:15,carbs:34,fat:22,fiber:2}},
    {id:"chili", names:["chili con carne","chili"], probable:["protein","fiber","legumes","vegetables"], possible:["red_meat","dairy","soy"], ingredients:["haricots","tomates","protéine variable"], nutrition:{calories:430,protein:25,carbs:48,fat:15,fiber:12}},
    {id:"meatloaf", names:["pain de viande","meatloaf"], probable:["protein","red_meat"], possible:["gluten","eggs","dairy","soy"], ingredients:["viande hachée","liant et assaisonnements variables"], nutrition:{calories:390,protein:28,carbs:18,fat:23,fiber:2}},
    {id:"tourtiere", names:["tourtiere","tourtière","meat pie"], probable:["protein","red_meat","gluten","refined_grains"], possible:["dairy","eggs","soy"], ingredients:["viande","pâte","assaisonnements"], nutrition:{calories:510,protein:22,carbs:42,fat:28,fiber:3}},
    {id:"chicken_pot_pie", names:["pate au poulet","pâté au poulet","chicken pot pie"], probable:["protein","poultry","gluten","refined_grains","vegetables"], possible:["dairy","soy"], ingredients:["poulet","légumes","sauce","pâte"], nutrition:{calories:520,protein:25,carbs:48,fat:26,fiber:5}},
    {id:"quiche", names:["quiche"], probable:["protein","eggs","dairy","gluten","refined_grains"], possible:["vegetables","red_meat"], ingredients:["œufs","produits laitiers","croûte","garniture variable"], nutrition:{calories:430,protein:20,carbs:28,fat:28,fiber:2}},
    {id:"omelette", names:["omelette","frittata"], probable:["protein","eggs"], possible:["dairy","vegetables","red_meat"], ingredients:["œufs","garnitures variables"], nutrition:{calories:320,protein:22,carbs:8,fat:23,fiber:2}},
    {id:"pancakes", names:["pancake","pancakes","crepe","crêpe","crepes","crêpes"], probable:["gluten","refined_grains","eggs"], possible:["dairy","sugary_foods"], ingredients:["farine","œuf","liquide","garnitures variables"], nutrition:{calories:360,protein:10,carbs:58,fat:10,fiber:2}},
    {id:"waffles", names:["gaufre","gaufres","waffle","waffles"], probable:["gluten","refined_grains","eggs"], possible:["dairy","sugary_foods"], ingredients:["farine","œuf","liquide","garnitures variables"], nutrition:{calories:380,protein:10,carbs:55,fat:14,fiber:2}},
    {id:"french_toast", names:["pain dore","pain doré","french toast"], probable:["protein","eggs","gluten","refined_grains"], possible:["dairy","sugary_foods"], ingredients:["pain","œuf","lait possible"], nutrition:{calories:360,protein:14,carbs:49,fat:12,fiber:3}},
    {id:"tacos", names:["taco","tacos"], probable:["protein","vegetables"], possible:["dairy","gluten","red_meat","soy","fiber"], ingredients:["tortilla","protéine","garnitures variables"], nutrition:{calories:480,protein:24,carbs:48,fat:21,fiber:6}},
    {id:"burrito", names:["burrito","burritos"], probable:["protein","fiber","legumes","refined_grains"], possible:["dairy","gluten","red_meat","soy"], ingredients:["tortilla","riz ou haricots","protéine","garnitures"], nutrition:{calories:620,protein:27,carbs:82,fat:20,fiber:10}},
    {id:"quesadilla", names:["quesadilla","quesadillas"], probable:["protein","dairy","refined_grains"], possible:["gluten","vegetables","red_meat","soy"], ingredients:["tortilla","fromage","garniture variable"], nutrition:{calories:520,protein:25,carbs:46,fat:27,fiber:4}},
    {id:"nachos", names:["nachos","nacho"], probable:["dairy","refined_grains","processed_foods"], possible:["protein","fiber","legumes","red_meat","soy"], ingredients:["croustilles de maïs","fromage","garnitures variables"], nutrition:{calories:610,protein:19,carbs:65,fat:31,fiber:7}},
    {id:"caesar_salad", names:["salade cesar","salade césar","caesar salad"], probable:["fiber","vegetables","dairy"], possible:["protein","poultry","eggs","fish","gluten"], ingredients:["laitue","parmesan","vinaigrette","croûtons possibles"], nutrition:{calories:390,protein:14,carbs:22,fat:29,fiber:5}},
    {id:"greek_salad", names:["salade grecque","greek salad"], probable:["fiber","vegetables","dairy"], possible:[], ingredients:["tomates","concombres","poivrons","feta","olives"], nutrition:{calories:320,protein:10,carbs:18,fat:24,fiber:6}},
    {id:"cobb_salad", names:["salade cobb","cobb salad"], probable:["protein","fiber","vegetables","eggs","poultry"], possible:["dairy","red_meat"], ingredients:["laitue","poulet","œuf","garnitures variables"], nutrition:{calories:520,protein:36,carbs:18,fat:35,fiber:8}},
    {id:"pad_thai", names:["pad thai","pad thaï"], probable:["protein","refined_grains","nuts","eggs"], possible:["soy","seafood","fiber","vegetables"], ingredients:["nouilles de riz","œuf","arachides","sauce variable"], nutrition:{calories:590,protein:25,carbs:78,fat:20,fiber:5}},
    {id:"stir_fry", names:["saute asiatique","sauté asiatique","stir fry","sauté de légumes","saute de legumes"], probable:["protein","fiber","vegetables"], possible:["soy","gluten","nuts"], ingredients:["légumes","protéine","sauce variable"], nutrition:{calories:430,protein:27,carbs:45,fat:17,fiber:8}},
    {id:"fried_rice", names:["riz frit","fried rice"], probable:["protein","refined_grains","eggs","vegetables"], possible:["soy","seafood","poultry"], ingredients:["riz","œuf","légumes","sauce variable"], nutrition:{calories:490,protein:18,carbs:70,fat:15,fiber:5}},
    {id:"ramen", names:["ramen"], probable:["protein","gluten","refined_grains","processed_foods"], possible:["soy","eggs","red_meat","vegetables"], ingredients:["nouilles","bouillon","protéine et garnitures variables"], nutrition:{calories:520,protein:23,carbs:68,fat:18,fiber:4}},
    {id:"pho", names:["soupe pho","pho","phở"], probable:["protein","refined_grains"], possible:["soy","red_meat","vegetables"], ingredients:["nouilles de riz","bouillon","protéine","herbes"], nutrition:{calories:430,protein:26,carbs:62,fat:9,fiber:4}},
    {id:"sushi", names:["sushi","makis","maki"], probable:["protein","refined_grains","fish"], possible:["soy","seafood","eggs","dairy"], ingredients:["riz","poisson ou garniture variable","algue"], nutrition:{calories:420,protein:20,carbs:68,fat:8,fiber:4}},
    {id:"butter_chicken", names:["poulet au beurre","butter chicken"], probable:["protein","poultry","dairy","vegetables"], possible:["nuts"], ingredients:["poulet","tomates","crème ou beurre","épices"], nutrition:{calories:520,protein:34,carbs:28,fat:31,fiber:4}},
    {id:"chicken_parmesan", names:["poulet parmesan","chicken parmesan","chicken parm"], probable:["protein","poultry","dairy","gluten","refined_grains","vegetables"], possible:["eggs"], ingredients:["poulet pané","sauce tomate","fromage"], nutrition:{calories:570,protein:43,carbs:38,fat:27,fiber:4}},
    {id:"fish_chips", names:["fish and chips","poisson et frites"], probable:["protein","fish","gluten","refined_grains","fried_foods"], possible:["eggs","dairy"], ingredients:["poisson pané","frites"], nutrition:{calories:720,protein:34,carbs:78,fat:30,fiber:6}},
    {id:"clam_chowder", names:["clam chowder","chaudree de palourdes","chaudrée de palourdes"], probable:["protein","seafood","dairy","vegetables"], possible:["gluten"], ingredients:["palourdes","pommes de terre","crème"], nutrition:{calories:410,protein:18,carbs:39,fat:21,fiber:4}},
    {id:"shawarma", names:["shawarma","shish taouk","chawarma"], probable:["protein","poultry"], possible:["gluten","dairy","sesame","vegetables"], ingredients:["viande marinée","sauce et accompagnements variables"], nutrition:{calories:520,protein:34,carbs:48,fat:21,fiber:5}},
    {id:"falafel_plate", names:["assiette falafel","falafel wrap","sandwich falafel"], probable:["protein","fiber","legumes","plant_protein","vegetables"], possible:["gluten","sesame","dairy"], ingredients:["pois chiches","légumes","sauce et pain possibles"], nutrition:{calories:520,protein:19,carbs:62,fat:23,fiber:12}}
  ];

  const LABELS = {
    protein:"Protéines", fiber:"Fibres", dairy:"Produits laitiers", soy:"Soya", gluten:"Gluten", eggs:"Œufs", nuts:"Noix", sesame:"Sésame", legumes:"Légumineuses", vegetables:"Légumes", fruits:"Fruits", red_meat:"Viande rouge", poultry:"Volaille", fish:"Poisson", seafood:"Fruits de mer", plant_protein:"Protéines végétales", refined_grains:"Grains raffinés", whole_grains:"Grains entiers", processed_foods:"Aliments transformés", fried_foods:"Aliments frits", sugary_foods:"Aliments sucrés"
  };
  const CATEGORY_TO_TRAITS = {
    dairy:["dairy","protein"], soy:["soy","protein"], gluten:["gluten"], eggs:["eggs","protein"], nuts:["nuts","protein","fiber"], legumes:["legumes","protein","fiber"], plant_protein:["plant_protein","protein"], high_protein:["protein"], high_fiber:["fiber"], vegetables:["vegetables","fiber"], fruits:["fruits","fiber"], whole_grains:["whole_grains","fiber"], red_meat:["red_meat","protein"], poultry:["poultry","protein"], fish:["fish","protein"], seafood:["seafood","protein"], refined_grains:["refined_grains"], processed_foods:["processed_foods"], fried_foods:["fried_foods"], sugary_foods:["sugary_foods"]
  };

  const normalize = value => String(value || "").toLocaleLowerCase("fr-CA").normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[’']/g," ").replace(/[^a-z0-9]+/g," ").replace(/\s+/g," ").trim();
  const contains = (text, term) => (` ${text} `).includes(` ${normalize(term)} `);
  const excludedTraits = text => {
    const rules = {
      dairy:["sans produit laitier","sans produits laitiers","sans lactose","sans lait","sans fromage","dairy free","no dairy"],
      soy:["sans soya","sans soja","soy free","no soy"],
      gluten:["sans gluten","gluten free","no gluten"],
      eggs:["sans oeuf","sans oeufs","egg free","no egg"],
      nuts:["sans noix","nut free","no nuts"],
      red_meat:["sans viande","sans viande rouge","sans boeuf","sans bœuf","vegetarien","vegetarienne","vegan","vegetalien","vegetalienne"],
      poultry:["sans viande","vegetarien","vegetarienne","vegan","vegetalien","vegetalienne"],
      fish:["vegetarien","vegetarienne","vegan","vegetalien","vegetalienne"],
      seafood:["vegetarien","vegetarienne","vegan","vegetalien","vegetalienne"],
    };
    const result = new Set();
    Object.entries(rules).forEach(([trait, terms]) => { if (terms.some(term => contains(text, term))) result.add(trait); });
    return result;
  };
  function findDish(value) {
    const text = normalize(value);
    return DISHES.map(dish => ({dish, match:[...dish.names].sort((a,b)=>b.length-a.length).find(name => contains(text,name))})).filter(x=>x.match).sort((a,b)=>normalize(b.match).length-normalize(a.match).length)[0]?.dish || null;
  }
  function analyze(value, explicitCategoryIds = []) {
    const text = normalize(value), dish = findDish(text), excluded = excludedTraits(text), explicit = new Set();
    explicitCategoryIds.forEach(category => {
      if (excluded.has(category)) return;
      (CATEGORY_TO_TRAITS[category] || [category]).forEach(trait => explicit.add(trait));
    });
    if (excluded.has("dairy") && !/\b(boeuf|bœuf|poulet|dinde|porc|poisson|saumon|thon|oeuf|œuf|tofu|tempeh|lentille|haricot|pois chiche|viande)\b/i.test(String(value || "")))
      explicit.delete("protein");
    excluded.forEach(trait => explicit.delete(trait));
    const probable = new Set((dish?.probable || []).filter(trait => !explicit.has(trait) && !excluded.has(trait)));
    const possible = new Set((dish?.possible || []).filter(trait => !explicit.has(trait) && !probable.has(trait) && !excluded.has(trait)));
    return {
      dish: dish ? {id:dish.id, name:dish.names[0], ingredients:[...dish.ingredients], nutrition:{...dish.nutrition}} : null,
      confirmed:[...explicit], probable:[...probable], possible:[...possible], excluded:[...excluded],
      status(trait){ return explicit.has(trait) ? "confirmed" : probable.has(trait) ? "probable" : possible.has(trait) ? "possible" : "unknown"; }
    };
  }
  window.ENERGIE_DISH_KNOWLEDGE = Object.freeze({VERSION, dishes:DISHES, labels:LABELS, normalize, findDish, analyze});
})();
