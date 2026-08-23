/**
 * BodyPilot Nutrition Generator Engine
 * 
 * Rule-based engine that generates personalized meal plans based on:
 * - TDEE calculation (Mifflin-St Jeor equation)
 * - Macro distribution based on goal
 * - Food preferences, allergies, dietary restrictions
 * - Meal timing and frequency
 */

const Food = require('../models/Food');

// Activity level multipliers for TDEE
const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extremely_active: 1.9
};

// Macro ratios by goal (protein%, carbs%, fat%)
const MACRO_RATIOS = {
  weight_loss: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  muscle_gain: { protein: 0.30, carbs: 0.45, fat: 0.25 },
  strength: { protein: 0.30, carbs: 0.40, fat: 0.30 },
  endurance: { protein: 0.20, carbs: 0.55, fat: 0.25 },
  general_fitness: { protein: 0.25, carbs: 0.45, fat: 0.30 },
  body_recomposition: { protein: 0.35, carbs: 0.35, fat: 0.30 },
  flexibility: { protein: 0.25, carbs: 0.45, fat: 0.30 }
};

// Calorie adjustments by goal
const CALORIE_ADJUSTMENTS = {
  weight_loss: -500,
  muscle_gain: 300,
  strength: 200,
  endurance: 100,
  general_fitness: 0,
  body_recomposition: -200,
  flexibility: 0
};

// Meal distribution (% of daily calories)
const MEAL_DISTRIBUTIONS = {
  3: {
    breakfast: 0.30,
    lunch: 0.40,
    dinner: 0.30
  },
  4: {
    breakfast: 0.25,
    morning_snack: 0.10,
    lunch: 0.35,
    dinner: 0.30
  },
  5: {
    breakfast: 0.25,
    morning_snack: 0.10,
    lunch: 0.30,
    afternoon_snack: 0.10,
    dinner: 0.25
  },
  6: {
    breakfast: 0.20,
    morning_snack: 0.10,
    lunch: 0.25,
    afternoon_snack: 0.10,
    dinner: 0.25,
    evening_snack: 0.10
  }
};

/**
 * Calculate BMR using Mifflin-St Jeor Equation
 */
function calculateBMR(weight, height, age, gender) {
  if (gender === 'male') {
    return 10 * weight + 6.25 * height - 5 * age + 5;
  } else {
    return 10 * weight + 6.25 * height - 5 * age - 161;
  }
}

/**
 * Calculate TDEE (Total Daily Energy Expenditure)
 */
function calculateTDEE(weight, height, age, gender, activityLevel) {
  const bmr = calculateBMR(weight, height, age, gender);
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.55;
  return Math.round(bmr * multiplier);
}

/**
 * Calculate daily nutritional targets
 */
function calculateDailyTargets(user) {
  const { weight, height, age, gender, goal, dailyActivityLevel } = {
    weight: user.profile.weight || 70,
    height: user.profile.height || 170,
    age: user.profile.age || 25,
    gender: user.profile.gender || 'male',
    goal: user.profile.goal || 'general_fitness',
    dailyActivityLevel: user.profile.dailyActivityLevel || 'moderately_active'
  };

  const tdee = calculateTDEE(weight, height, age, gender, dailyActivityLevel);
  const adjustment = CALORIE_ADJUSTMENTS[goal] || 0;
  const targetCalories = Math.max(1200, tdee + adjustment);

  const ratios = MACRO_RATIOS[goal] || MACRO_RATIOS.general_fitness;
  const protein = Math.round((targetCalories * ratios.protein) / 4); // 4 cal/g
  const carbs = Math.round((targetCalories * ratios.carbs) / 4);     // 4 cal/g
  const fat = Math.round((targetCalories * ratios.fat) / 9);         // 9 cal/g

  return {
    calories: targetCalories,
    protein,
    carbs,
    fat,
    fiber: 30,
    water: Math.round(weight * 35) // ml, ~35ml per kg bodyweight
  };
}

/**
 * Filter foods based on user preferences and restrictions
 */
function filterFoodsForUser(foods, user) {
  let filtered = [...foods];
  const prefs = user.foodPreferences || {};

  // Remove foods with user's allergens
  if (prefs.allergies && prefs.allergies.length > 0) {
    filtered = filtered.filter(food =>
      !food.allergens.some(a => prefs.allergies.includes(a))
    );
  }

  // Apply dietary restrictions
  if (prefs.dietaryRestrictions && prefs.dietaryRestrictions.length > 0) {
    for (const restriction of prefs.dietaryRestrictions) {
      switch (restriction) {
        case 'vegetarian':
          filtered = filtered.filter(f =>
            f.dietaryTags.includes('vegetarian') ||
            !['protein'].includes(f.category) ||
            f.subCategory !== 'meat'
          );
          break;
        case 'vegan':
          filtered = filtered.filter(f =>
            f.dietaryTags.includes('vegan') ||
            (!['dairy', 'protein'].includes(f.category) && f.subCategory !== 'meat')
          );
          break;
        case 'halal':
          filtered = filtered.filter(f =>
            f.dietaryTags.includes('halal') || !f.name.toLowerCase().includes('pork')
          );
          break;
        case 'gluten_free':
          filtered = filtered.filter(f =>
            !f.allergens.includes('gluten')
          );
          break;
        case 'lactose_free':
          filtered = filtered.filter(f =>
            !f.allergens.includes('dairy')
          );
          break;
        case 'nut_free':
          filtered = filtered.filter(f =>
            !f.allergens.includes('nuts') && !f.allergens.includes('peanuts')
          );
          break;
      }
    }
  }

  // Remove disliked foods
  if (prefs.dislikedFoods && prefs.dislikedFoods.length > 0) {
    filtered = filtered.filter(f =>
      !prefs.dislikedFoods.some(df =>
        f.name.toLowerCase().includes(df.toLowerCase())
      )
    );
  }

  // Remove "never recommend" foods
  if (prefs.neverRecommend && prefs.neverRecommend.length > 0) {
    filtered = filtered.filter(f =>
      !prefs.neverRecommend.some(nr =>
        f.name.toLowerCase().includes(nr.toLowerCase())
      )
    );
  }

  return filtered;
}

/**
 * Select foods to meet calorie and macro targets for a meal
 */
function selectFoodsForMeal(availableFoods, targetCalories, targetProtein, targetCarbs, targetFat) {
  const selected = [];
  let remainingCal = targetCalories;
  let remainingProtein = targetProtein;
  let remainingCarbs = targetCarbs;
  let remainingFat = targetFat;

  // Prioritize: protein source first, then carb source, then fat/vegetables
  const proteinFoods = availableFoods.filter(f => f.category === 'protein' || f.protein > 15);
  const carbFoods = availableFoods.filter(f => ['carbohydrate', 'grain', 'fruit'].includes(f.category));
  const fatFoods = availableFoods.filter(f => f.category === 'fat' || f.fat > 10);
  const vegFoods = availableFoods.filter(f => f.category === 'vegetable');
  const otherFoods = availableFoods.filter(f =>
    !['protein', 'carbohydrate', 'grain', 'fruit', 'fat', 'vegetable'].includes(f.category)
  );

  // Helper to add a food
  function addFood(food, servings = 1) {
    const cal = food.calories * servings;
    if (cal > remainingCal * 1.5) return false; // Don't overshoot too much

    selected.push({
      foodId: food._id,
      foodName: food.name,
      quantity: servings,
      servingSize: food.servingSize * servings,
      servingUnit: food.servingUnit,
      calories: Math.round(food.calories * servings),
      protein: Math.round(food.protein * servings),
      carbs: Math.round(food.carbs * servings),
      fat: Math.round(food.fat * servings)
    });

    remainingCal -= cal;
    remainingProtein -= food.protein * servings;
    remainingCarbs -= food.carbs * servings;
    remainingFat -= food.fat * servings;
    return true;
  }

  // 1. Add protein source
  if (proteinFoods.length > 0) {
    const protein = proteinFoods[Math.floor(Math.random() * proteinFoods.length)];
    const servings = Math.max(1, Math.round(remainingProtein / Math.max(1, protein.protein)));
    addFood(protein, Math.min(servings, 3));
  }

  // 2. Add carb source
  if (carbFoods.length > 0 && remainingCarbs > 10) {
    const carb = carbFoods[Math.floor(Math.random() * carbFoods.length)];
    const servings = Math.max(1, Math.round(remainingCarbs / Math.max(1, carb.carbs)));
    addFood(carb, Math.min(servings, 3));
  }

  // 3. Add vegetable
  if (vegFoods.length > 0) {
    const veg = vegFoods[Math.floor(Math.random() * vegFoods.length)];
    addFood(veg, 1);
  }

  // 4. Add fat source if needed
  if (fatFoods.length > 0 && remainingFat > 5) {
    const fat = fatFoods[Math.floor(Math.random() * fatFoods.length)];
    addFood(fat, 1);
  }

  return selected;
}

/**
 * Generate a personalized daily meal plan
 */
async function generateMealPlan(user, date = new Date()) {
  const targets = calculateDailyTargets(user);
  const mealsPerDay = user.foodPreferences?.mealsPerDay || 3;
  const clampedMeals = Math.min(Math.max(mealsPerDay, 3), 6);

  // Fetch all foods
  const allFoods = await Food.find({ isActive: true });
  const availableFoods = filterFoodsForUser(allFoods, user);

  if (availableFoods.length < 5) {
    throw new Error('Not enough foods available after applying preferences. Please adjust your food restrictions.');
  }

  // Get meal distribution
  const distribution = MEAL_DISTRIBUTIONS[clampedMeals];
  const meals = [];

  for (const [mealType, ratio] of Object.entries(distribution)) {
    const mealCalories = Math.round(targets.calories * ratio);
    const mealProtein = Math.round(targets.protein * ratio);
    const mealCarbs = Math.round(targets.carbs * ratio);
    const mealFat = Math.round(targets.fat * ratio);

    // Shuffle foods for variety
    const shuffled = [...availableFoods].sort(() => Math.random() - 0.5);

    const foods = selectFoodsForMeal(shuffled, mealCalories, mealProtein, mealCarbs, mealFat);

    const totalCalories = foods.reduce((sum, f) => sum + f.calories, 0);
    const totalProtein = foods.reduce((sum, f) => sum + f.protein, 0);
    const totalCarbs = foods.reduce((sum, f) => sum + f.carbs, 0);
    const totalFat = foods.reduce((sum, f) => sum + f.fat, 0);

    meals.push({
      mealType,
      foods,
      totalCalories,
      totalProtein,
      totalCarbs,
      totalFat,
      isLogged: false,
      isSkipped: false
    });
  }

  return {
    userId: user._id,
    date,
    meals,
    dailyTargets: targets,
    dailyActuals: { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 },
    isActive: true,
    generatedAt: new Date()
  };
}

/**
 * Generate meal plans for a week
 */
async function generateWeeklyMealPlan(user) {
  const plans = [];
  const today = new Date();

  for (let i = 0; i < 7; i++) {
    const date = new Date(today);
    date.setDate(today.getDate() + i);
    const plan = await generateMealPlan(user, date);
    plans.push(plan);
  }

  return plans;
}

module.exports = {
  calculateBMR,
  calculateTDEE,
  calculateDailyTargets,
  filterFoodsForUser,
  generateMealPlan,
  generateWeeklyMealPlan,
  MACRO_RATIOS,
  CALORIE_ADJUSTMENTS,
  MEAL_DISTRIBUTIONS
};
