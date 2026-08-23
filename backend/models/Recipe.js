const mongoose = require('mongoose');

const ingredientSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  foodName: { type: String, required: true },
  quantity: { type: Number, required: true },
  unit: { type: String, default: 'g' }
}, { _id: false });

const recipeSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  description: { type: String, default: '' },
  ingredients: [ingredientSchema],
  
  // Nutrition totals
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 },
  fiber: { type: Number, default: 0 },
  
  servings: { type: Number, default: 1 },
  prepTime: { type: Number, default: 10 }, // minutes
  cookTime: { type: Number, default: 20 }, // minutes
  difficulty: { type: String, enum: ['easy', 'medium', 'hard'], default: 'easy' },
  
  instructions: [{ type: String }],
  tips: [{ type: String }],
  imageUrl: { type: String, default: '' },
  
  mealType: [{
    type: String,
    enum: ['breakfast', 'lunch', 'dinner', 'snack']
  }],
  cuisine: { type: String, default: 'international' },
  dietaryTags: [{ type: String }],
  tags: [{ type: String }],
  
  // User interaction
  favoriteBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

recipeSchema.index({ name: 'text', tags: 'text' });

module.exports = mongoose.model('Recipe', recipeSchema);
