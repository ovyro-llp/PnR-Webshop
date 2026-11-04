const fs = require('fs');
const path = require('path');

// Image visual asset mapping by category and product keywords
const IMAGES = {
  chocolateCake: 'https://images.unsplash.com/photo-1578985545062-69928b1d9587?auto=format&fit=crop&w=800&q=80',
  cheesecake: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?auto=format&fit=crop&w=800&q=80',
  fruitCake: 'https://images.unsplash.com/photo-1565958011703-44f9829ba187?auto=format&fit=crop&w=800&q=80',
  redVelvet: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80',
  tiramisu: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?auto=format&fit=crop&w=800&q=80',
  pastry: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  puff: 'https://images.unsplash.com/photo-1601050690597-df0568f70950?auto=format&fit=crop&w=800&q=80',
  croissant: 'https://images.unsplash.com/photo-1555507036-ab1f4038808a?auto=format&fit=crop&w=800&q=80',
  roll: 'https://images.unsplash.com/photo-1626082927389-6cd097cdc6ec?auto=format&fit=crop&w=800&q=80',
  doughnut: 'https://images.unsplash.com/photo-1527515862127-a4fc05baf7a5?auto=format&fit=crop&w=800&q=80',
  mousse: 'https://images.unsplash.com/photo-1541783245831-57d6fb0926d3?auto=format&fit=crop&w=800&q=80',
  khari: 'https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=800&q=80',
  cookies: 'https://images.unsplash.com/photo-1499636136210-6f4ee915583e?auto=format&fit=crop&w=800&q=80',
  brownie: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?auto=format&fit=crop&w=800&q=80',
  muffin: 'https://images.unsplash.com/photo-1586985289688-ca3cf47d3e6e?auto=format&fit=crop&w=800&q=80',
  bread: 'https://images.unsplash.com/photo-1549931319-a545dcf3bc73?auto=format&fit=crop&w=800&q=80',
  buns: 'https://images.unsplash.com/photo-1586190848861-99aa4a171e90?auto=format&fit=crop&w=800&q=80',
};

function selectImage(name, category) {
  const n = name.toLowerCase();
  const c = category.toLowerCase();

  if (n.includes('cheesecake') || n.includes('cheese cake')) return IMAGES.cheesecake;
  if (n.includes('red velvet') || n.includes('redvelvet')) return IMAGES.redVelvet;
  if (n.includes('tiramisu')) return IMAGES.tiramisu;
  if (n.includes('strawberry') || n.includes('berry') || n.includes('fruit') || n.includes('pineapple') || n.includes('mango')) return IMAGES.fruitCake;
  if (n.includes('chocolate') || n.includes('truffle') || n.includes('mud') || n.includes('fudge') || n.includes('cocoa')) {
    if (c.includes('pastry') || n.includes('pastry')) return IMAGES.pastry;
    return IMAGES.chocolateCake;
  }
  if (n.includes('doughnut') || n.includes('donut')) return IMAGES.doughnut;
  if (n.includes('mousse')) return IMAGES.mousse;
  if (n.includes('croissant') || n.includes('flaky')) return IMAGES.croissant;
  if (n.includes('puff') || n.includes('patty') || n.includes('pattice')) return IMAGES.puff;
  if (n.includes('roll') || n.includes('calzone') || n.includes('toast') || n.includes('swirl')) return IMAGES.roll;
  if (n.includes('brownie')) return IMAGES.brownie;
  if (n.includes('muffin')) return IMAGES.muffin;
  if (n.includes('khari') || n.includes('rusk')) return IMAGES.khari;
  if (n.includes('cookie') || n.includes('macaroon') || n.includes('naankhatai') || n.includes('butter')) return IMAGES.cookies;
  if (n.includes('bread') || n.includes('loaf')) return IMAGES.bread;
  if (n.includes('paav') || n.includes('bun') || n.includes('pita')) return IMAGES.buns;
  return IMAGES.pastry;
}

const OUTLETS = ['cycle-circle', 'nd-patel-road', 'gangapur-road'];

const RAW_PRODUCTS = [
  // ==========================================
  // SHEET 1: BREADS (Breads & Daily Bakes)
  // ==========================================
  { name: 'White Bread', category: 'Breads & Daily Bakes', subCategory: 'Loaves', price: 50, isVeg: true, prep: 5, desc: 'Soft and pillowy everyday sandwich white bread, freshly baked every morning.' },
  { name: 'Brown Bread', category: 'Breads & Daily Bakes', subCategory: 'Loaves', price: 70, isVeg: true, prep: 5, desc: 'Wholesome brown bread made with enriched whole wheat flour.' },
  { name: 'Multigrain Bread', category: 'Breads & Daily Bakes', subCategory: 'Loaves', price: 80, isVeg: true, prep: 5, desc: 'Nutrient-rich bread topped and baked with sunflower, flax, sesame and oats.' },
  { name: 'French Loaf', category: 'Breads & Daily Bakes', subCategory: 'Loaves', price: 70, isVeg: true, prep: 5, desc: 'Classic French style baguette loaf with a crisp golden crust and light airy crumb.' },
  { name: 'Whole Wheat Bread', category: 'Breads & Daily Bakes', subCategory: 'Loaves', price: 100, isVeg: true, prep: 5, desc: '100% stoneground whole wheat loaf, preservative-free and high in dietary fiber.' },
  { name: 'Cheese & Garlic Bread', category: 'Breads & Daily Bakes', subCategory: 'Flavored Breads', price: 50, isVeg: true, prep: 8, desc: 'Toasted bakery loaf infused with aromatic roasted garlic and bubbling mozzarella cheese.' },
  { name: 'Ladi Paav (6 Pcs)', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 30, isVeg: true, prep: 5, desc: 'Ultra-soft authentic Nashik style bakery ladi pav, perfect with misal and maska.' },
  { name: 'Whole Wheat Ladi Paav (6 Pcs)', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 40, isVeg: true, prep: 5, desc: 'Wholesome ladi pav crafted from pure whole wheat flour.' },
  { name: 'Garlic Bread', category: 'Breads & Daily Bakes', subCategory: 'Flavored Breads', price: 40, isVeg: true, prep: 8, desc: 'Oven-fresh bread slathered with herb garlic butter.' },
  { name: 'Bread Rolls (2 Pcs)', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 25, isVeg: true, prep: 5, desc: 'Classic soft dinner bread rolls, pairs perfectly with soups and gravies.' },
  { name: 'Bread Buns (2 Pcs)', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 25, isVeg: true, prep: 5, desc: 'Light golden bakery burger buns, ideal for homemade burgers and sliders.' },
  { name: 'Pita Bread (2 Pcs)', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 30, isVeg: true, prep: 5, desc: 'Authentic pocket pita bread, perfect for falafel, hummus, and wraps.' },
  { name: 'Butter Sweet Bun (2 Pcs)', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 50, isVeg: true, prep: 5, desc: 'Golden sweet glazed butter buns, a timeless tea-time delight.' },
  { name: 'Dinner Roll', category: 'Breads & Daily Bakes', subCategory: 'Daily Buns', price: 30, isVeg: true, prep: 5, desc: 'Fluffy warm dinner roll baked with pure table butter.' },

  // ==========================================
  // SHEET 2: BAKED SNACKS (Puffs, Rolls & Savories)
  // ==========================================
  { name: 'Korean Chilly Buns', category: 'Puffs, Rolls & Savories', subCategory: 'Buns & Breads', price: 100, isVeg: true, isSpicy: true, isBestseller: true, prep: 12, desc: 'Soft brioche bun stuffed with sweet cream cheese, drenched in spicy garlic chili herb butter.' },
  { name: 'Veg Delight Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 30, isVeg: true, prep: 8, desc: 'Flaky puff pastry stuffed with lightly seasoned potato and garden vegetables.' },
  { name: 'Veg Spicy Delight Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 30, isVeg: true, isSpicy: true, prep: 8, desc: 'Golden crisp puff loaded with fiery green chili vegetable masala.' },
  { name: 'Veg Puff (Classic)', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 50, isVeg: true, prep: 8, desc: 'Our signature bakery puff, layers of flaky butter crust filled with spiced potatoes and peas.' },
  { name: 'Veg Spicy Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 50, isVeg: true, isSpicy: true, prep: 8, desc: 'Crunchy flaky pastry bursting with spicy tempered potato filling.' },
  { name: 'Veg Spicy Korean Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 60, isVeg: true, isSpicy: true, isBestseller: true, prep: 10, desc: 'Fusion puff with Korean chili paste glaze, melted cheese, and vegetables.' },
  { name: 'Chicken Spicy Korean Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 60, isVeg: false, isSpicy: true, isBestseller: true, prep: 10, desc: 'Tender pulled chicken tossed in Korean gochujang sauce inside flaky golden crust.' },
  { name: 'Chicken Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 60, isVeg: false, prep: 10, desc: 'Buttery flaky puff loaded with juicy minced chicken cooked in aromatic mild spices.' },
  { name: 'Spicy Chicken Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 60, isVeg: false, isSpicy: true, prep: 10, desc: 'Fiery shredded chicken spiced with black pepper and green chilies inside crispy puff.' },
  { name: 'Chicken Mushroom Puff', category: 'Puffs, Rolls & Savories', subCategory: 'Puffs & Patties', price: 60, isVeg: false, prep: 10, desc: 'Rich savory blend of tender chicken and button mushrooms in white herb pepper reduction.' },
  { name: 'Veg Flaky Tuscan Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 170, isVeg: true, prep: 12, desc: 'Butter croissant stuffed with sun-dried tomatoes, basil pesto, olives and melted mozzarella.' },
  { name: 'Veg Flaky Spinach Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 170, isVeg: true, prep: 12, desc: 'Oven-baked flaky croissant with creamy sautéed garlic spinach and melted parmesan.' },
  { name: 'Chicken Flaky Tuscan Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 170, isVeg: false, prep: 12, desc: 'Smoked chicken cubes, Tuscan herbs, and melted provolone in flaky all-butter croissant.' },
  { name: 'Chicken Flaky Spinach Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 170, isVeg: false, prep: 12, desc: 'Juicy chicken breast tossed with creamy garlic spinach folded into warm layered croissant.' },
  { name: 'Butter Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 100, isVeg: true, prep: 10, desc: 'Classic French crescent roll with hundred delicate buttery layers and crisp crust.' },
  { name: 'Cheese Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 150, isVeg: true, prep: 10, desc: 'Flaky butter croissant filled and topped with sharp cheddar and mozzarella.' },
  { name: 'Chocolate Croissant (Pain au Chocolat)', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 150, isVeg: true, isBestseller: true, prep: 10, desc: 'Crisp laminated pastry layered around premium dark chocolate batons.' },
  { name: 'Almond Chocolate Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 170, isVeg: true, prep: 12, desc: 'Double-baked croissant filled with rich chocolate and frangipane, topped with toasted sliced almonds.' },
  { name: 'Nutella Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 180, isVeg: true, isBestseller: true, prep: 10, desc: 'Decadent croissant generously injected with creamy hazelnut Nutella.' },
  { name: 'Coffee Croissant', category: 'Puffs, Rolls & Savories', subCategory: 'Croissants', price: 170, isVeg: true, prep: 10, desc: 'Flaky pastry infused with aromatic espresso buttercream and coffee glaze.' },
  { name: 'Veg Mexican Toast', category: 'Puffs, Rolls & Savories', subCategory: 'Toasts & Calzones', price: 80, isVeg: true, isSpicy: true, prep: 10, desc: 'Thick-cut artisanal toast layered with Mexican refried corn, peppers, salsa, and cheese.' },
  { name: 'Chicken Mexican Toast', category: 'Puffs, Rolls & Savories', subCategory: 'Toasts & Calzones', price: 80, isVeg: false, isSpicy: true, prep: 10, desc: 'Spiced chipotle chicken, jalapeños, and melted cheese on crusty bakery bread.' },
  { name: 'Veg Calzone', category: 'Puffs, Rolls & Savories', subCategory: 'Toasts & Calzones', price: 90, isVeg: true, prep: 12, desc: 'Folded oven-baked pizza turnover stuffed with peppers, mushrooms, tomato sauce, and mozzarella.' },
  { name: 'Chicken Calzone', category: 'Puffs, Rolls & Savories', subCategory: 'Toasts & Calzones', price: 90, isVeg: false, prep: 12, desc: 'Italian stuffed calzone loaded with BBQ roasted chicken, herbs, and stringy mozzarella.' },
  { name: 'Veg Cheezy Roll', category: 'Puffs, Rolls & Savories', subCategory: 'Savory Rolls', price: 80, isVeg: true, isBestseller: true, prep: 10, desc: 'Soft milk bread rolled around spiced diced veggies and a molten cheese center.' },
  { name: 'Chicken Cheezy Roll', category: 'Puffs, Rolls & Savories', subCategory: 'Savory Rolls', price: 80, isVeg: false, isBestseller: true, prep: 10, desc: 'Tender chicken tikka chunks wrapped in fresh roll dough with creamy melting cheese.' },
  { name: 'Veg Spicy Baked Roll', category: 'Puffs, Rolls & Savories', subCategory: 'Savory Rolls', price: 80, isVeg: true, isSpicy: true, prep: 10, desc: 'Oven-baked roll packed with spicy schezwan vegetables and peri-peri seasoning.' },
  { name: 'Chicken Spicy Baked Roll', category: 'Puffs, Rolls & Savories', subCategory: 'Savory Rolls', price: 80, isVeg: false, isSpicy: true, prep: 10, desc: 'Juicy spiced chicken roll baked to golden perfection with zesty chili glaze.' },
  { name: 'Veg Supreme Bun', category: 'Puffs, Rolls & Savories', subCategory: 'Buns & Breads', price: 80, isVeg: true, prep: 10, desc: 'Stuffed baked bun overflowing with paneer, sweet corn, and melted cheese.' },

  // ==========================================
  // SHEET 3: HIGH TEA (Khari, Cookies & High Tea)
  // ==========================================
  { name: 'Special Khari', category: 'Khari, Cookies & High Tea', subCategory: 'Khari & Toast', price: 100, isVeg: true, isBestseller: true, prep: 5, desc: 'The pride of Nashik: ultra-crisp, feather-light puff biscuits baked with pure ghee.' },
  { name: 'Jeera Khari', category: 'Khari, Cookies & High Tea', subCategory: 'Khari & Toast', price: 100, isVeg: true, prep: 5, desc: 'Crispy flaky khari tempered with aromatic roasted cumin seeds.' },
  { name: 'Whole Wheat Khari', category: 'Khari, Cookies & High Tea', subCategory: 'Khari & Toast', price: 100, isVeg: true, prep: 5, desc: 'Healthy guilt-free khari made from whole grain flour, light and crunchy.' },
  { name: 'Cheese Spirals', category: 'Khari, Cookies & High Tea', subCategory: 'Khari & Toast', price: 150, isVeg: true, isBestseller: true, prep: 5, desc: 'Twisted savory puff pastry spirals infused with real parmesan and cheddar.' },
  { name: 'Rusk (Sweet Toast)', category: 'Khari, Cookies & High Tea', subCategory: 'Khari & Toast', price: 100, isVeg: true, prep: 5, desc: 'Crunchy twice-baked sweet toast, the quintessential chai companion.' },
  { name: 'Whole Wheat Toast', category: 'Khari, Cookies & High Tea', subCategory: 'Khari & Toast', price: 100, isVeg: true, prep: 5, desc: 'Twice-baked whole wheat rusk with gentle sweetness and deep roasted grain aroma.' },
  { name: 'Whole Wheat Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Healthy Cookies', price: 150, isVeg: true, prep: 5, desc: 'Nutritious crisp biscuits made with 100% whole wheat and brown sugar.' },
  { name: 'Multigrain Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Healthy Cookies', price: 150, isVeg: true, prep: 5, desc: 'Wholesome crunch loaded with oats, flaxseed, pumpkin seeds and barley.' },
  { name: 'Millet Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Healthy Cookies', price: 230, isVeg: true, prep: 5, desc: 'Ancient grain cookies made with pearl millet, sweetened naturally.' },
  { name: 'Ragi Joy Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Healthy Cookies', price: 230, isVeg: true, prep: 5, desc: 'Finger millet (nachni) cookies rich in calcium, baked with pure butter.' },
  { name: 'Bread Sticks (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 70, isVeg: true, prep: 5, desc: 'Crispy Italian style grissini breadsticks, ideal for dips and soups.' },
  { name: 'Jeera Butter (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 80, isVeg: true, prep: 5, desc: 'Traditional melt-in-mouth cumin butter biscuits with pleasant savory notes.' },
  { name: 'Ginger Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 130, isVeg: true, prep: 5, desc: 'Spiced aromatic ginger snap cookies with warming notes of cinnamon and clove.' },
  { name: 'Mix Fruit Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 130, isVeg: true, prep: 5, desc: 'Sweet crumbly bakery cookies speckled with colorful tutti frutti gems.' },
  { name: 'Coconut Macaroon (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 130, isVeg: true, isBestseller: true, prep: 5, desc: 'Chewy golden toasted coconut cookies with luscious tropical aroma.' },
  { name: 'Almond Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 130, isVeg: true, prep: 5, desc: 'Crunchy butter cookies packed with slivered Californian almonds.' },
  { name: 'Cashew Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 130, isVeg: true, prep: 5, desc: 'Rich buttery cookies loaded with golden roasted cashew nuts.' },
  { name: 'Osmania Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 180, isVeg: true, isBestseller: true, prep: 5, desc: 'Famous royal sweet-and-salty melt-in-mouth biscuits.' },
  { name: 'Kashmiri Roth (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 200, isVeg: true, prep: 5, desc: 'Traditional aromatic dry fruit baked roth with cardamom and poppy seeds.' },
  { name: 'Butter Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 190, isVeg: true, prep: 5, desc: 'Decadent rich Danish-style butter cookies made with 100% dairy butter.' },
  { name: 'Chocolate Chip Cookies (Eggless)', category: 'Khari, Cookies & High Tea', subCategory: 'Eggless Cookies', price: 200, isVeg: true, isBestseller: true, prep: 5, desc: 'Golden crunchy cookies studded with rich dark chocolate chunks.' },

  // ==========================================
  // SHEET 3 (CONT): TEA TIME CAKES & BROWNIES
  // ==========================================
  { name: 'Brownie (Per Pc)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 100, isVeg: false, isBestseller: true, prep: 5, desc: 'Fudgy dark chocolate brownie with crackly top, baked fresh daily.' },
  { name: 'Banana Walnut Cake', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 200, isVeg: false, prep: 5, desc: 'Moist loaf cake prepared with ripe bananas and toasted crunchy walnuts.' },
  { name: 'Mawa Cake (Signature)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 290, isVeg: false, isBestseller: true, prep: 5, desc: 'Parsi bakery classic made with rich evaporated milk solids, cardamom, and nutmeg.' },
  { name: 'Mix Fruit Cake', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 310, isVeg: false, prep: 5, desc: 'Classic British style tea loaf studded with candied citrus and soaked dried fruits.' },
  { name: 'Almond Cake', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 330, isVeg: false, prep: 5, desc: 'Delicate sponge topped with honeyed sliced almonds.' },
  { name: 'Double Chocolate Cake (Loaf)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 360, isVeg: false, prep: 5, desc: 'Decadent cocoa sponge studded with dark and milk chocolate chips.' },
  { name: 'Chocolate Walnut Cake (Loaf)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 380, isVeg: false, prep: 5, desc: 'Rich chocolate tea cake loaded with roasted Kashmiri walnuts.' },
  { name: 'Brownie Round', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (With Egg)', price: 600, isVeg: false, prep: 5, desc: 'Large 6-inch sharing round of our signature gooey Belgian dark chocolate brownie.' },
  { name: 'Carrot Cake (300g)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (Eggless)', price: 130, isVeg: true, prep: 5, desc: 'Spiced eggless carrot sponge with cinnamon, raisins, and toasted nuts.' },
  { name: 'Mawa Cake (Eggless)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (Eggless)', price: 240, isVeg: true, prep: 5, desc: '100% vegetarian mawa cake infused with saffron, cardamom and pure milk fat.' },
  { name: 'Chocolate Toffee Caramel Tea Cake', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (Eggless)', price: 370, isVeg: true, isBestseller: true, prep: 5, desc: 'Eggless chocolate loaf drizzled with handmade English toffee caramel.' },
  { name: 'Chocolate Overloaded Cake', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (Eggless)', price: 370, isVeg: true, prep: 5, desc: 'Ultimate chocolate lover sponge with melted ganache and chocolate chunks.' },
  { name: 'Dark Forest Cake (Tea Cake)', category: 'Tea-Time Cakes & Brownies', subCategory: 'Tea Time Cakes (Eggless)', price: 370, isVeg: true, prep: 5, desc: 'Dark cocoa cake laced with sour cherries and chocolate curls.' },
  { name: 'Chocolate Walnut Muffin', category: 'Tea-Time Cakes & Brownies', subCategory: 'Muffins', price: 130, isVeg: true, prep: 5, desc: 'Moist bakery muffin bursting with chocolate and crunchy walnut pieces.' },
  { name: 'Blueberry Muffin', category: 'Tea-Time Cakes & Brownies', subCategory: 'Muffins', price: 130, isVeg: true, isBestseller: true, prep: 5, desc: 'Tender golden muffin packed with wild European blueberries.' },
  { name: 'Chocolate Nutella Muffin', category: 'Tea-Time Cakes & Brownies', subCategory: 'Muffins', price: 130, isVeg: true, isBestseller: true, prep: 5, desc: 'Double chocolate muffin with a molten Nutella hazelnut core.' },

  // ==========================================
  // SHEET 4: FILLING N FRIED SNACK
  // ==========================================
  { name: 'Chicken Masala Patty', category: 'Puffs, Rolls & Savories', subCategory: 'Fried Snacks', price: 100, isVeg: false, isSpicy: true, prep: 10, desc: 'Crispy fried golden crumb patty stuffed with spiced chicken mince.' },
  { name: 'Chicken Parsi Pattice', category: 'Puffs, Rolls & Savories', subCategory: 'Fried Snacks', price: 100, isVeg: false, prep: 10, desc: 'Mashed potato cutlet stuffed with fragrant slow-cooked chicken mince.' },
  { name: 'Chicken Cheezy Roll (2 Pcs)', category: 'Puffs, Rolls & Savories', subCategory: 'Fried Snacks', price: 120, isVeg: false, isBestseller: true, prep: 10, desc: 'Twin crispy fried spring rolls loaded with cheesy chicken filling.' },

  // ==========================================
  // SHEET 5: SWEET TOOTH (Pastries & Desserts)
  // ==========================================
  { name: 'Chocolate Delight Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 70, isVeg: true, prep: 5, desc: 'Signature single-serve chocolate sponge layered with smooth chocolate cream.' },
  { name: 'Chocolate Chip Delight Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 90, isVeg: true, prep: 5, desc: 'Rich chocolate pastry studded with crunchy chocolate chips.' },
  { name: 'Exotic Black Forest Gateau Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 90, isVeg: true, prep: 5, desc: 'Classic German pastry with chocolate sponge, whipped cream, and cherries.' },
  { name: 'Vanilla White Chocolate Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 90, isVeg: true, prep: 5, desc: 'Delicate vanilla sponge layered with silky white chocolate ganache.' },
  { name: 'Chocolate Truffle Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 100, isVeg: true, isBestseller: true, prep: 5, desc: 'Dense dark chocolate sponge glazed with 54% dark Belgian truffle ganache.' },
  { name: 'Chocolate Oreo Delight Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 100, isVeg: true, prep: 5, desc: 'Layered with crushed Oreo cookies and rich cookies & cream mousse.' },
  { name: 'Dutch Truffle Gateau Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 100, isVeg: true, isBestseller: true, prep: 5, desc: 'Silky smooth Dutch processed dark chocolate gateau pastry.' },
  { name: 'Irish Chocolate Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 110, isVeg: true, prep: 5, desc: 'Chocolate sponge infused with non-alcoholic Irish cream coffee notes.' },
  { name: 'Chocolate Toffee Caramel Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 150, isVeg: true, isBestseller: true, prep: 5, desc: 'Chocolate pastry layered with buttery toffee sauce and chocolate mousse.' },
  { name: 'Mud Mec Rocks Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Pastries (Small)', price: 230, isVeg: true, isBestseller: true, prep: 5, desc: 'Our most decadent mud cake pastry topped with crunchy Ferrero-style hazelnut rocks.' },
  { name: 'Pineapple Delight Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Fruit Pastries (Small)', price: 90, isVeg: true, prep: 5, desc: 'Light sponge layered with fresh pineapple chunks and whipped cream.' },
  { name: 'Mix Fruit Gateau Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Fruit Pastries (Small)', price: 90, isVeg: true, prep: 5, desc: 'Fluffy vanilla sponge dressed with seasonal fruit compote and glaze.' },
  { name: 'Blueberry Gateau Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Fruit Pastries (Small)', price: 120, isVeg: true, prep: 5, desc: 'Sweet tangy European wild blueberry compote between vanilla cream layers.' },
  { name: 'Honey Almond Gateau Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Small)', price: 100, isVeg: true, prep: 5, desc: 'Fragrant honey-soaked sponge coated in toasted almond slivers.' },
  { name: 'Nougat Gateau Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Small)', price: 90, isVeg: true, prep: 5, desc: 'Crunchy caramelized nut praline nougat cream in soft sponge.' },
  { name: 'Red Velvet Pastry (Small)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Small)', price: 95, isVeg: true, isBestseller: true, prep: 5, desc: 'Ruby red velvet sponge layered with silky cream cheese frosting.' },

  // Large Pastries
  { name: 'Chocolate Delight Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Pastries (Large)', price: 110, isVeg: true, prep: 5, desc: 'Generous portion of our bestselling chocolate delight pastry.' },
  { name: 'Chocolate Chip Delight Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Pastries (Large)', price: 120, isVeg: true, prep: 5, desc: 'Large portion of choco-chip loaded layered pastry.' },
  { name: 'Exotic Black Forest Gateau Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Pastries (Large)', price: 120, isVeg: true, prep: 5, desc: 'Large cut of fresh cream Black Forest gateau.' },
  { name: 'Vanilla White Chocolate Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Pastries (Large)', price: 120, isVeg: true, prep: 5, desc: 'Large slice of delicate vanilla and white chocolate pastry.' },
  { name: 'Dutch Truffle Gateau Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Pastries (Large)', price: 120, isVeg: true, isBestseller: true, prep: 5, desc: 'Large decadent Dutch truffle chocolate slice.' },
  { name: 'Chocolate Truffle Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Pastries (Large)', price: 150, isVeg: true, isBestseller: true, prep: 5, desc: 'Large thick slice of dark chocolate truffle gateau.' },
  { name: 'Pineapple Delight Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Fruit Pastries (Large)', price: 120, isVeg: true, prep: 5, desc: 'Large portion of fresh tropical pineapple gateau.' },
  { name: 'Mix Fruit Gateau Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Fruit Pastries (Large)', price: 120, isVeg: true, prep: 5, desc: 'Large fruit gateau pastry loaded with fresh seasonal toppings.' },
  { name: 'Blueberry Gateau Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Fruit Pastries (Large)', price: 175, isVeg: true, prep: 5, desc: 'Generous slice of blueberry compote gateau.' },
  { name: 'Honey Almond Gateau Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Large)', price: 130, isVeg: true, prep: 5, desc: 'Large honey almond pastry with roasted almonds.' },
  { name: 'Nougat Gateau Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Large)', price: 120, isVeg: true, prep: 5, desc: 'Large crunchy nougat praline pastry.' },
  { name: 'Tiramisu Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Large)', price: 190, isVeg: true, isBestseller: true, prep: 5, desc: 'Italian espresso-soaked sponge with luscious mascarpone sabayon cream.' },
  { name: 'Coffee Mocca Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Large)', price: 190, isVeg: true, prep: 5, desc: 'Deep roasted arabica coffee mousse layered with dark cocoa sponge.' },
  { name: 'Exotic Red Velvet Pastry (Large)', category: 'Pastries & Desserts', subCategory: 'Exotic Pastries (Large)', price: 170, isVeg: true, isBestseller: true, prep: 5, desc: 'Large cut of red velvet sponge with cream cheese frosting.' },

  // Sin & Cheese Pastries
  { name: 'Chocolate Sin Cake Pastry', category: 'Pastries & Desserts', subCategory: 'Sin Pastries', price: 190, isVeg: true, isBestseller: true, prep: 5, desc: 'Unapologetically rich 70% dark Belgian chocolate sin pastry.' },
  { name: 'Chocolate Sin Hazeltine Pastry', category: 'Pastries & Desserts', subCategory: 'Sin Pastries', price: 220, isVeg: true, isBestseller: true, prep: 5, desc: 'Dark chocolate sin pastry loaded with roasted Turkish hazelnut paste.' },
  { name: 'Chocolate Sin Toffee Caramel Pastry', category: 'Pastries & Desserts', subCategory: 'Sin Pastries', price: 220, isVeg: true, prep: 5, desc: 'Sinful chocolate pastry marbled with slow-simmered buttery toffee.' },
  { name: 'Nutella Sin Pastry', category: 'Pastries & Desserts', subCategory: 'Sin Pastries', price: 230, isVeg: true, isBestseller: true, prep: 5, desc: 'Ultimate Nutella overload pastry with hazelnut praline crunch.' },
  { name: 'Biscoff Cheese Pastry', category: 'Pastries & Desserts', subCategory: 'Cheese Pastries', price: 220, isVeg: true, isBestseller: true, prep: 5, desc: 'Creamy New York style cheesecake pastry layered with Lotus Biscoff butter and crumb.' },
  { name: 'Blueberry Cheese Pastry', category: 'Pastries & Desserts', subCategory: 'Cheese Pastries', price: 220, isVeg: true, prep: 5, desc: 'Smooth cheesecake slice crowned with tart wild blueberry reduction.' },
  { name: 'Hazeltine Cheese Pastry', category: 'Pastries & Desserts', subCategory: 'Cheese Pastries', price: 220, isVeg: true, prep: 5, desc: 'Silky cheesecake slice infused with roasted hazelnut butter.' },

  // Desserts & Doughnuts
  { name: 'Chocolate Bomb', category: 'Pastries & Desserts', subCategory: 'Desserts', price: 50, isVeg: true, isBestseller: true, prep: 5, desc: 'Fudgy chocolate truffle ball rolled in chocolate sprinkles.' },
  { name: 'Choco Bees', category: 'Pastries & Desserts', subCategory: 'Desserts', price: 90, isVeg: true, prep: 5, desc: 'Crunchy chocolate honeycomb treats enveloped in pure chocolate.' },
  { name: 'Chocolate Mousse (Petite)', category: 'Pastries & Desserts', subCategory: 'Desserts', price: 90, isVeg: true, prep: 5, desc: 'Airy, silky chocolate mousse cup topped with dark chocolate curls.' },
  { name: 'Cinnamon Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 80, isVeg: true, prep: 5, desc: 'Soft yeast-raised doughnut dusted in fragrant cinnamon sugar.' },
  { name: 'Double Chocolate Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 140, isVeg: true, isBestseller: true, prep: 5, desc: 'Chocolate doughnut dipped in dark chocolate glaze and drizzled with milk chocolate.' },
  { name: 'Dolce Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 140, isVeg: true, prep: 5, desc: 'Glazed artisan doughnut with Italian dulce de leche caramel.' },
  { name: 'KitKat Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 140, isVeg: true, prep: 5, desc: 'Chocolate doughnut topped with crisp KitKat wafer bars.' },
  { name: 'Colored Chocolate Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 140, isVeg: true, prep: 5, desc: 'Fun bakery doughnut dipped in vibrant chocolate with rainbow sprinkles.' },
  { name: 'Silk Bomb Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 140, isVeg: true, isBestseller: true, prep: 5, desc: 'Bursting with creamy molten chocolate silk center.' },
  { name: 'Iced Sprinkle Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 140, isVeg: true, prep: 5, desc: 'Classic bakery glazed ring doughnut with sugar icing and confetti sprinkles.' },
  { name: 'Nutella Doughnut', category: 'Pastries & Desserts', subCategory: 'Doughnuts', price: 150, isVeg: true, isBestseller: true, prep: 5, desc: 'Filled and smothered with original Ferrero Nutella hazelnut spread.' },
  { name: 'Strawberry Mousse Cup', category: 'Pastries & Desserts', subCategory: 'Desserts', price: 150, isVeg: true, prep: 5, desc: 'Light and refreshing mousse made with fresh strawberry puree.' },
  { name: 'Blackberry Mousse Cup', category: 'Pastries & Desserts', subCategory: 'Desserts', price: 180, isVeg: true, prep: 5, desc: 'Gourmet dessert glass of tart blackberry coulis and whipped cream mousse.' },
  { name: 'Chocolate Mousse (Premium Cup)', category: 'Pastries & Desserts', subCategory: 'Desserts', price: 160, isVeg: true, isBestseller: true, prep: 5, desc: 'Grand dessert glass of Belgian 54% dark chocolate mousse.' },

  // ==========================================
  // SHEET 6 & 7: CAKES (1/2 KG & 1 KG)
  // ==========================================
  // Chocolate Cakes
  { name: 'Chocolate Delight Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 450, isVeg: true, isBestseller: true, prep: 20, desc: 'Classic bakery chocolate celebration cake with smooth chocolate ganache.' },
  { name: 'Chocolate Delight Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 900, isVeg: true, isBestseller: true, prep: 20, desc: 'Full 1kg size of our signature celebration chocolate delight cake.' },
  { name: 'Chocolate Chip Delight Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 550, isVeg: true, prep: 20, desc: 'Chocolate cake studded with rich dark chocolate chips.' },
  { name: 'Chocolate Chip Delight Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1100, isVeg: true, prep: 20, desc: '1kg chocolate cake loaded with crunchy chocolate chips.' },
  { name: 'Exotic Black Forest Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 550, isVeg: true, isBestseller: true, prep: 20, desc: 'Authentic German Black Forest cake with fresh cream, chocolate flakes, and cherries.' },
  { name: 'Exotic Black Forest Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1100, isVeg: true, isBestseller: true, prep: 20, desc: '1kg German Black Forest gateau with cherries and chocolate curls.' },
  { name: 'Dutch Truffle Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 600, isVeg: true, isBestseller: true, prep: 20, desc: 'Rich and decadent Dutch cocoa truffle cake.' },
  { name: 'Dutch Truffle Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1200, isVeg: true, isBestseller: true, prep: 20, desc: '1kg of our finest Belgian Dutch truffle chocolate gateau.' },
  { name: 'Chocolate Truffle Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 600, isVeg: true, isBestseller: true, prep: 20, desc: 'Pure dark chocolate truffle cake with mirror glaze.' },
  { name: 'Chocolate Truffle Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1200, isVeg: true, isBestseller: true, prep: 20, desc: '1kg mirror glaze dark chocolate truffle cake.' },
  { name: 'Vanilla White Chocolate Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 600, isVeg: true, prep: 20, desc: 'Sweet vanilla sponge enveloped in rich white chocolate ganache.' },
  { name: 'Vanilla White Chocolate Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1200, isVeg: true, prep: 20, desc: '1kg vanilla and white chocolate celebration cake.' },
  { name: 'Chocolate Oreo Delight Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 650, isVeg: true, prep: 20, desc: 'Oreo cookies and chocolate cream celebration cake.' },
  { name: 'Chocolate Cookie Delight Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1300, isVeg: true, prep: 20, desc: '1kg cookies and cream chocolate celebration cake.' },
  { name: 'Black Forest Truffle Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 650, isVeg: true, prep: 20, desc: 'Black Forest sponge upgraded with rich chocolate truffle cream.' },
  { name: 'Black Forest Truffle Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1300, isVeg: true, prep: 20, desc: '1kg Black Forest truffle gateau.' },
  { name: 'Chocolate Truffle Nougat Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 650, isVeg: true, prep: 20, desc: 'Chocolate truffle cake filled with crunchy nut nougat praline.' },
  { name: 'Chocolate Truffle Nougat Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1300, isVeg: true, prep: 20, desc: '1kg chocolate truffle nougat praline cake.' },
  { name: 'Irish Chocolate Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 700, isVeg: true, prep: 20, desc: 'Chocolate cake infused with rich Irish cream flavor notes.' },
  { name: 'Irish Chocolate Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1400, isVeg: true, prep: 20, desc: '1kg Irish cream chocolate gateau.' },
  { name: 'Chocolate Delight Rose Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 700, isVeg: true, prep: 20, desc: 'Artistically decorated with handcrafted chocolate roses.' },
  { name: 'Chocolate Delight Rose Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1400, isVeg: true, prep: 20, desc: '1kg rose design chocolate celebration cake.' },
  { name: 'White Forest Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 700, isVeg: true, prep: 20, desc: 'Vanilla sponge, cherry compote, and white chocolate shavings.' },
  { name: 'White Forest Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 1400, isVeg: true, prep: 20, desc: '1kg White Forest gateau.' },
  { name: 'Red Velvet Chocolate Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Chocolate Cakes', price: 750, isVeg: true, isBestseller: true, prep: 20, desc: 'Red velvet sponge layered with chocolate truffle and cream cheese.' },

  // Signature Chocolate Cakes
  { name: 'Mocha Velvet Cloud Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 650, isVeg: true, prep: 20, desc: 'Light coffee mousse and chocolate sponge.' },
  { name: 'Mocha Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 750, isVeg: true, prep: 20, desc: 'Espresso infused chocolate gateau.' },
  { name: 'Black Forest Old School (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 850, isVeg: true, prep: 20, desc: 'Heritage recipe with soaked cherries and chocolate.' },
  { name: 'Chocolate Toffee Caramel Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 900, isVeg: true, isBestseller: true, prep: 20, desc: 'Layers of chocolate and handmade toffee caramel.' },
  { name: 'Chocolate Toffee Caramel Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 1800, isVeg: true, isBestseller: true, prep: 20, desc: '1kg chocolate and toffee caramel celebration cake.' },
  { name: 'Chocolate Hazeltine Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 1000, isVeg: true, isBestseller: true, prep: 20, desc: 'Hazelnut praline and dark chocolate ganache.' },
  { name: 'Chocolate Hazeltine Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 2000, isVeg: true, isBestseller: true, prep: 20, desc: '1kg Turkish hazelnut and dark chocolate cake.' },
  { name: 'Mud Chocolate Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 1200, isVeg: true, isBestseller: true, prep: 20, desc: 'Ultra-dense Mississippi style mud chocolate cake.' },
  { name: 'Mud Chocolate Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 2400, isVeg: true, isBestseller: true, prep: 20, desc: '1kg Mississippi mud chocolate cake.' },
  { name: 'Mud Mec Rocks Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 1400, isVeg: true, isBestseller: true, prep: 25, desc: 'Signature mud cake encrusted with Ferrero hazelnut rocks.' },
  { name: 'Mud Mec Rocks Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 2800, isVeg: true, isBestseller: true, prep: 25, desc: '1kg of our highest tier mud mec rocks celebration cake.' },
  { name: 'Chocolate Walnut Crunchy Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 1000, isVeg: true, prep: 20, desc: 'Chocolate cake loaded with caramelized walnuts.' },
  { name: 'Chocolate Walnut Crunchy Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Signature Cakes', price: 2000, isVeg: true, prep: 20, desc: '1kg chocolate walnut crunchy cake.' },

  // Cheesecakes
  { name: 'Cold Cheesecake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Cheesecakes', price: 1300, isVeg: true, isBestseller: true, prep: 25, desc: 'Set cream cheesecake with buttery biscuit base. Choose flavor: Biscoff, Blueberry, Chocolate, or Hazeltine.' },
  { name: 'Cold Cheesecake (1 KG)', category: 'Celebration Cakes', subCategory: 'Cheesecakes', price: 2600, isVeg: true, isBestseller: true, prep: 25, desc: '1kg set cream cheesecake with choice of Biscoff, Blueberry, Chocolate, or Hazeltine.' },
  { name: 'Baked Cheesecake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Cheesecakes', price: 1300, isVeg: true, prep: 25, desc: 'Authentic New York baked cheesecake with golden baked crust.' },

  // Fruit & Berry Cakes
  { name: 'Pineapple Delight (Regular) (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 600, isVeg: true, isBestseller: true, prep: 20, desc: 'Soft sponge, fresh pineapple chunks and whipped dairy cream.' },
  { name: 'Pineapple Delight (Regular) (1 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 1200, isVeg: true, isBestseller: true, prep: 20, desc: '1kg fresh pineapple celebration cake.' },
  { name: 'Pineapple Delight (Loaded) (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 700, isVeg: true, prep: 20, desc: 'Extra loaded with pineapple compote and caramelized fruit.' },
  { name: 'Pineapple Delight (Loaded) (1 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 1400, isVeg: true, prep: 20, desc: '1kg extra loaded pineapple cake.' },
  { name: 'Fresh Strawberry Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 650, isVeg: true, isBestseller: true, prep: 20, desc: 'Mahabaleshwar strawberries with fresh vanilla cream.' },
  { name: 'Fresh Strawberry Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 1300, isVeg: true, isBestseller: true, prep: 20, desc: '1kg fresh strawberry celebration cake.' },
  { name: 'Mix Fruit Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 650, isVeg: true, isBestseller: true, prep: 20, desc: 'Vanilla sponge decorated with seasonal fresh fruits.' },
  { name: 'Mix Fruit Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 1300, isVeg: true, isBestseller: true, prep: 20, desc: '1kg seasonal mix fruit celebration gateau.' },
  { name: 'Blueberry Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 750, isVeg: true, isBestseller: true, prep: 20, desc: 'European wild blueberry compote and light sponge.' },
  { name: 'Blueberry Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 1500, isVeg: true, isBestseller: true, prep: 20, desc: '1kg wild blueberry celebration gateau.' },
  { name: 'Mix Fruit White Chocolate Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 750, isVeg: true, prep: 20, desc: 'White chocolate curls and fresh fruits.' },
  { name: 'Mix Fruit Chocolate Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Fruit & Berry Cakes', price: 1500, isVeg: true, prep: 20, desc: '1kg mix fruit with rich chocolate ganache.' },

  // Exotic Cakes
  { name: 'Honey Almond Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Exotic Cakes', price: 650, isVeg: true, prep: 20, desc: 'Wild honey soaked sponge coated with roasted sliced almonds.' },
  { name: 'Honey Almond Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Exotic Cakes', price: 1300, isVeg: true, prep: 20, desc: '1kg honey almond celebration gateau.' },
  { name: 'Nougat Gateau (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Exotic Cakes', price: 650, isVeg: true, prep: 20, desc: 'Praline nougat cream and vanilla sponge.' },
  { name: 'Nougat Gateau (1 KG)', category: 'Celebration Cakes', subCategory: 'Exotic Cakes', price: 1300, isVeg: true, prep: 20, desc: '1kg crunchy nougat gateau.' },
  { name: 'Rasmalai Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Exotic Cakes', price: 750, isVeg: true, isBestseller: true, prep: 20, desc: 'Indian fusion favorite with saffron milk, pistachios, and soft rasmalai pieces.' },
  { name: 'Rasmalai Regular Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Exotic Cakes', price: 1500, isVeg: true, isBestseller: true, prep: 20, desc: '1kg royal rasmalai celebration cake.' },

  // Sin Cakes
  { name: 'Chocolate Sin Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 800, isVeg: true, isBestseller: true, prep: 20, desc: 'Pure 70% dark Belgian cocoa sin cake.' },
  { name: 'Chocolate Sin Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 1600, isVeg: true, isBestseller: true, prep: 20, desc: '1kg dark chocolate sin celebration cake.' },
  { name: 'Hazeltine Sin Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 950, isVeg: true, isBestseller: true, prep: 20, desc: 'Dark chocolate sin cake with roasted hazelnut butter.' },
  { name: 'Chocolate Sin Hazeltine Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 1900, isVeg: true, isBestseller: true, prep: 20, desc: '1kg hazelnut chocolate sin cake.' },
  { name: 'Nutella Sin Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 950, isVeg: true, isBestseller: true, prep: 20, desc: 'Decadent Ferrero Nutella sin cake.' },
  { name: 'Nutella Sin Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 1900, isVeg: true, isBestseller: true, prep: 20, desc: '1kg Nutella sin celebration cake.' },
  { name: 'Chocolate Toffee Caramel Sin Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 950, isVeg: true, prep: 20, desc: 'Dark sin cake with thick buttery toffee caramel.' },
  { name: 'Chocolate Sin Toffee Caramel Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 1900, isVeg: true, prep: 20, desc: '1kg chocolate toffee caramel sin cake.' },
  { name: 'Mango Sin Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 950, isVeg: true, prep: 20, desc: 'Alphonso mango glaze and rich white chocolate sin cake.' },
  { name: 'Mango Sin Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Sin Cakes', price: 1900, isVeg: true, prep: 20, desc: '1kg Alphonso mango sin cake.' },

  // Newly Launched Cakes
  { name: 'American Bites Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 750, isVeg: true, prep: 20, desc: 'American cookies and chocolate truffle fusion cake.' },
  { name: 'American Bites Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 1500, isVeg: true, prep: 20, desc: '1kg American bites cake.' },
  { name: 'Exotic Red Velvet Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 750, isVeg: true, isBestseller: true, prep: 20, desc: 'Signature red velvet sponge with silky cream cheese frosting.' },
  { name: 'Exotic Red Velvet Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 1500, isVeg: true, isBestseller: true, prep: 20, desc: '1kg exotic red velvet cake.' },
  { name: 'Tiramisu Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 800, isVeg: true, isBestseller: true, prep: 20, desc: 'Italian coffee sponge with mascarpone cream.' },
  { name: 'Tiramisu Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 1600, isVeg: true, isBestseller: true, prep: 20, desc: '1kg Italian tiramisu celebration cake.' },
  { name: 'Berry Bomb Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 900, isVeg: true, isBestseller: true, prep: 20, desc: 'Loaded with fresh strawberries, blueberries, and blackberries.' },
  { name: 'Berry Bomb Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 1800, isVeg: true, isBestseller: true, prep: 20, desc: '1kg triple berry bomb celebration cake.' },
  { name: 'Berry Berry Cake (1/2 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 800, isVeg: true, prep: 20, desc: 'Strawberry and blueberry fusion celebration cake.' },
  { name: 'Berry Berry Cake (1 KG)', category: 'Celebration Cakes', subCategory: 'Newly Launched', price: 1600, isVeg: true, prep: 20, desc: '1kg strawberry & blueberry celebration cake.' },
];

function generateSlug(text) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-');
}

const MENU_ITEMS = RAW_PRODUCTS.map((p, idx) => {
  const id = `item-${idx + 1}`;
  return {
    id,
    name: p.name,
    description: p.desc || `${p.name} freshly handcrafted by Puffs 'n' Rolls master bakers.`,
    category: p.category,
    subCategory: p.subCategory,
    price: p.price,
    originalPrice: Math.round(p.price * 1.15),
    image: selectImage(p.name, p.category),
    isVeg: p.isVeg,
    isBestseller: Boolean(p.isBestseller),
    isSpicy: Boolean(p.isSpicy),
    preparationTimeMinutes: p.prep || 15,
    availableOutlets: [...OUTLETS],
    isAvailable: true,
    stockQuantity: 25,
    isArchived: false,
  };
});

console.log(`Generated ${MENU_ITEMS.length} total products across categories:`);
const cats = {};
MENU_ITEMS.forEach(i => {
  cats[i.category] = (cats[i.category] || 0) + 1;
});
console.table(cats);

// Write to JSON file for easy loading and persistence
const outputPath = path.join(__dirname, '../src/lib/data/master-catalog.json');
fs.writeFileSync(outputPath, JSON.stringify(MENU_ITEMS, null, 2));
console.log(`Wrote JSON catalog to ${outputPath}`);
