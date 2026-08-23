const mongoose = require('mongoose');

const foodSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  category: {
    type: String,
    enum: ['protein', 'carbohydrate', 'fat', 'dairy', 'fruit', 'vegetable',
           'grain', 'legume', 'nut', 'seed', 'beverage', 'snack', 'condiment', 'other'],
    required: true
  },
  subCategory: { type: String, default: '' },
  
  // Nutrition per serving
  calories: { type: Number, required: true },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  sugar: { type: Number, default: 0 },
  sodium: { type: Number, default: 0 },
  
  servingSize: { type: Number, default: 100 },
  servingUnit: { type: String, default: 'g' },
  
  // Allergens & dietary info
  allergens: [{
    type: String,
    enum: ['gluten', 'dairy', 'nuts', 'peanuts', 'soy', 'eggs', 'fish',
           'shellfish', 'wheat', 'sesame', 'sulfites']
  }],
  dietaryTags: [{
    type: String,
    enum: ['vegetarian', 'vegan', 'halal', 'kosher', 'gluten_free',
           'lactose_free', 'nut_free', 'keto', 'paleo', 'low_carb',
           'high_protein', 'low_fat', 'organic']
  }],
  
  cuisine: { type: String, default: 'international' },
  imageUrl: { type: String, default: '' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

foodSchema.index({ name: 'text' });
foodSchema.index({ category: 1 });
foodSchema.index({ dietaryTags: 1 });
foodSchema.index({ allergens: 1 });

module.exports = mongoose.model('Food', foodSchema);
