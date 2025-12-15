// src/modules/menu/categoryKeywords.ts
// Editable list of category keywords used for quick keyword matching.

const CATEGORY_KEYWORDS: Record<string, string[]> = {
  Pizza: ["pizza", "pizzas", "margherita", "pepperoni", "paneer", "tikka"],
  Beverages: ["coffee", "cold coffee", "iced coffee", "tea", "juice", "shake", "milkshake", "cola", "soda"],
  Burgers: ["burger", "cheese burger", "veggie burger"],
  Fries: ["fries", "french fries", "peri peri fries"],
  Desserts: ["dessert", "ice cream", "gulab", "kulfi", "brownie"],
  Starters: ["starter", "starter(s)", "appetizer", "snack", "nachos", "wings"],
  Rice: ["biryani", "rice", "fried rice", "pulao"],
  Pasta: ["pasta", "spaghetti", "penne"],
};

export default CATEGORY_KEYWORDS;
