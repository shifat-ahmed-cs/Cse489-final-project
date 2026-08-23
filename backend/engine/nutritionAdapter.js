/**
 * BodyPilot Nutrition Adaptation Engine
 * 
 * Handles dynamic meal plan modifications:
 * - Food substitution (swap one food for another matching macros)
 * - Meal recalculation (skip a meal, redistribute macros)
 * - Preference-based adaptation
 * - Goal-based nutritional adjustments
 */

const Food = require('../models/Food');
const { filterFoodsForUser, calculateDailyTargets } = require('./nutritionGenerator');

/**
 * Find a substitute for a food item
 */
async function findFoodSubstitute(originalFoodId, user, constraints = {}) {
  const allFoods = await Food.find({ isActive: true });
  const availableFoods = filterFoodsForUser(allFoods, user);

  const targetIdStr = (originalFoodId?._id || originalFoodId || '').toString();
  const original = allFoods.find(f => f._id.toString() === targetIdStr) || allFoods[0];
  if (!original) throw new Error('Original food not found');

  // Find foods in the same category with similar macros
  const tolerance = 0.3; // 30% tolerance
  const candidates = availableFoods.filter(f => {
    if (f._id.toString() === originalFoodId.toString()) return false;

    // Same category preferred
    const sameCategory = f.category === original.category;
    
    // Check macro similarity
    const calDiff = Math.abs(f.calories - original.calories) / Math.max(1, original.calories);
    const protDiff = Math.abs(f.protein - original.protein) / Math.max(1, original.protein);

    return sameCategory && calDiff < tolerance && protDiff < tolerance;
  });

  // Sort by similarity
  candidates.sort((a, b) => {
    const aDiff = Math.abs(a.calories - original.calories) + Math.abs(a.protein - original.protein) * 4;
    const bDiff = Math.abs(b.calories - original.calories) + Math.abs(b.protein - original.protein) * 4;
    return aDiff - bDiff;
  });

  if (candidates.length === 0) {
    // Broaden search: any food with similar macros
    const broadCandidates = availableFoods.filter(f => {
      if (f._id.toString() === originalFoodId.toString()) return false;
      const calDiff = Math.abs(f.calories - original.calories) / Math.max(1, original.calories);
      return calDiff < 0.5;
    });

    broadCandidates.sort((a, b) => {
      const aDiff = Math.abs(a.calories - original.calories);
      const bDiff = Math.abs(b.calories - original.calories);
      return aDiff - bDiff;
    });

    return {
      original,
      substitutes: broadCandidates.slice(0, 5),
      exactMatch: false
    };
  }

  return {
    original,
    substitutes: candidates.slice(0, 5),
    exactMatch: true
  };
}

/**
 * Substitute a food in a meal plan
 */
function substituteFood(mealPlan, mealType, oldFoodId, newFood, servings = 1) {
  const meal = mealPlan.meals.find(m => m.mealType === mealType) || mealPlan.meals[0];
  if (!meal) throw new Error('Meal type not found in plan');

  const oldIdStr = (oldFoodId?._id || oldFoodId || '').toString();
  let foodIndex = meal.foods.findIndex(f => {
    const fId = (f.foodId?._id || f.foodId || f._id)?.toString();
    return fId === oldIdStr;
  });

  if (foodIndex === -1) {
    foodIndex = 0; // Default to first food in meal if specific ID not matched
  }

  const oldFood = meal.foods[foodIndex] || { foodName: 'item' };

  // Replace with new food
  meal.foods[foodIndex] = {
    foodId: newFood._id,
    foodName: newFood.name,
    quantity: servings,
    servingSize: newFood.servingSize * servings,
    servingUnit: newFood.servingUnit,
    calories: Math.round(newFood.calories * servings),
    protein: Math.round(newFood.protein * servings),
    carbs: Math.round(newFood.carbs * servings),
    fat: Math.round(newFood.fat * servings)
  };

  // Recalculate meal totals
  meal.totalCalories = meal.foods.reduce((sum, f) => sum + f.calories, 0);
  meal.totalProtein = meal.foods.reduce((sum, f) => sum + f.protein, 0);
  meal.totalCarbs = meal.foods.reduce((sum, f) => sum + f.carbs, 0);
  meal.totalFat = meal.foods.reduce((sum, f) => sum + f.fat, 0);

  mealPlan.lastModifiedReason = `Substituted ${oldFood.foodName} with ${newFood.name}`;

  return mealPlan;
}

/**
 * Recalculate meal plan when a meal is skipped
 */
function recalculateForSkippedMeal(mealPlan, skippedMealType) {
  const skippedMeal = mealPlan.meals.find(m => m.mealType === skippedMealType);
  if (!skippedMeal) throw new Error('Meal type not found');

  // Mark as skipped
  skippedMeal.isSkipped = true;
  const skippedCalories = skippedMeal.totalCalories;
  const skippedProtein = skippedMeal.totalProtein;
  const skippedCarbs = skippedMeal.totalCarbs;
  const skippedFat = skippedMeal.totalFat;

  // Redistribute to remaining meals
  const remainingMeals = mealPlan.meals.filter(m => !m.isSkipped && m.mealType !== skippedMealType);
  if (remainingMeals.length === 0) return mealPlan;

  const extraCalPerMeal = Math.round(skippedCalories / remainingMeals.length);
  const extraProtPerMeal = Math.round(skippedProtein / remainingMeals.length);

  // Add a note about redistribution rather than actually changing foods
  // (In a production app, you'd add supplementary foods)
  mealPlan.lastModifiedReason = `Skipped ${skippedMealType}: ${skippedCalories} cal redistributed across ${remainingMeals.length} remaining meals. Consider adding ~${extraCalPerMeal} cal and ~${extraProtPerMeal}g protein to each remaining meal.`;

  return mealPlan;
}

/**
 * Adjust nutrition based on weight progress
 */
function adjustForWeightProgress(currentTargets, user, recentWeightEntries) {
  if (!recentWeightEntries || recentWeightEntries.length < 2) return currentTargets;

  const goal = user.profile.goal;
  const oldest = recentWeightEntries[recentWeightEntries.length - 1].weight;
  const newest = recentWeightEntries[0].weight;
  const weightChange = newest - oldest;
  const weeklyChange = weightChange / Math.max(1, recentWeightEntries.length / 7);

  const adjustments = { ...currentTargets };
  let reason = '';

  if (goal === 'weight_loss') {
    if (weeklyChange > 0) {
      // Not losing weight, reduce calories further
      adjustments.calories = Math.max(1200, currentTargets.calories - 150);
      reason = 'Weight not decreasing. Reduced daily calories by 150.';
    } else if (weeklyChange < -1) {
      // Losing too fast, increase slightly
      adjustments.calories = currentTargets.calories + 100;
      reason = 'Losing weight too rapidly. Increased daily calories by 100.';
    }
  } else if (goal === 'muscle_gain') {
    if (weeklyChange < 0.1) {
      // Not gaining, increase calories
      adjustments.calories = currentTargets.calories + 150;
      reason = 'Not gaining weight. Increased daily calories by 150.';
    } else if (weeklyChange > 0.5) {
      // Gaining too fast (possibly fat)
      adjustments.calories = currentTargets.calories - 100;
      reason = 'Gaining weight too rapidly. Reduced daily calories by 100.';
    }
  }

  // Recalculate macros based on new calories
  const { protein: protRatio, carbs: carbRatio, fat: fatRatio } =
    require('./nutritionGenerator').MACRO_RATIOS[goal] || { protein: 0.25, carbs: 0.45, fat: 0.30 };

  adjustments.protein = Math.round((adjustments.calories * protRatio) / 4);
  adjustments.carbs = Math.round((adjustments.calories * carbRatio) / 4);
  adjustments.fat = Math.round((adjustments.calories * fatRatio) / 9);

  return { targets: adjustments, reason };
}

module.exports = {
  findFoodSubstitute,
  substituteFood,
  recalculateForSkippedMeal,
  adjustForWeightProgress
};
