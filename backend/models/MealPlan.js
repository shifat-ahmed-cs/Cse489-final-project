const mongoose = require('mongoose');

const mealFoodSchema = new mongoose.Schema({
  foodId: { type: mongoose.Schema.Types.ObjectId, ref: 'Food' },
  foodName: { type: String, required: true },
  quantity: { type: Number, default: 1 },
  servingSize: { type: Number, default: 100 },
  servingUnit: { type: String, default: 'g' },
  calories: { type: Number, default: 0 },
  protein: { type: Number, default: 0 },
  carbs: { type: Number, default: 0 },
  fat: { type: Number, default: 0 }
}, { _id: true });

const mealSchema = new mongoose.Schema({
  mealType: {
    type: String,
    enum: ['breakfast', 'morning_snack', 'lunch', 'afternoon_snack', 'dinner', 'evening_snack'],
    required: true
  },
  foods: [mealFoodSchema],
  totalCalories: { type: Number, default: 0 },
  totalProtein: { type: Number, default: 0 },
  totalCarbs: { type: Number, default: 0 },
  totalFat: { type: Number, default: 0 },
  recipeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Recipe' },
  isLogged: { type: Boolean, default: false },
  isSkipped: { type: Boolean, default: false }
}, { _id: true });

const mealPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true },
  meals: [mealSchema],
  
  // Daily targets
  dailyTargets: {
    calories: { type: Number, default: 2000 },
    protein: { type: Number, default: 150 },
    carbs: { type: Number, default: 250 },
    fat: { type: Number, default: 65 },
    fiber: { type: Number, default: 30 },
    water: { type: Number, default: 3000 } // ml
  },
  
  // Daily actuals (updated as meals are logged)
  dailyActuals: {
    calories: { type: Number, default: 0 },
    protein: { type: Number, default: 0 },
    carbs: { type: Number, default: 0 },
    fat: { type: Number, default: 0 },
    fiber: { type: Number, default: 0 },
    water: { type: Number, default: 0 }
  },
  
  isActive: { type: Boolean, default: true },
  generatedAt: { type: Date, default: Date.now },
  lastModifiedReason: { type: String, default: '' }
}, {
  timestamps: true
});

mealPlanSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('MealPlan', mealPlanSchema);
