(() => {
  "use strict";
  const recipes = [
    {id:"smoothie", aliases:["smoothie","smoothie bowl","bol smoothie"], ingredients:["fruit","yogourt","lait"], categories:["fruits","beverages"], confidence:.62},
    {id:"poke-bowl", aliases:["poke bowl","poké bowl","bol poke"], ingredients:["riz","poisson","concombre","avocat","edamame"], categories:["prepared_meals","protein","vegetables","starches"], confidence:.68},
    {id:"salade-grecque", aliases:["salade grecque","greek salad"], ingredients:["tomate","concombre","feta","olive"], categories:["vegetables","dairy","healthy_fats"], confidence:.72},
    {id:"overnight-oats", aliases:["overnight oats","gruau overnight","gruau du lendemain"], ingredients:["avoine","lait","yogourt"], categories:["whole_grains","dairy","fiber"], confidence:.72},
    {id:"chili", aliases:["chili","chili con carne","chili végétarien"], ingredients:["haricot","tomate"], categories:["legumes","fiber","protein"], confidence:.64},
    {id:"sandwich", aliases:["sandwich","club sandwich"], ingredients:["pain"], categories:["prepared_meals","starches"], confidence:.48},
    {id:"burrito", aliases:["burrito"], ingredients:["tortilla","riz","haricot"], categories:["prepared_meals","legumes","starches"], confidence:.62},
    {id:"curry", aliases:["curry","cari"], ingredients:["riz"], categories:["prepared_meals","starches"], confidence:.48},
    {id:"sushi", aliases:["sushi","maki","sashimi"], ingredients:["riz","poisson"], categories:["prepared_meals","fish","protein","starches"], confidence:.62}
  ];
  window.EnergieBrainModules = window.EnergieBrainModules || {};
  window.EnergieBrainModules.recipes = Object.freeze({ version:1, recipes });
})();
