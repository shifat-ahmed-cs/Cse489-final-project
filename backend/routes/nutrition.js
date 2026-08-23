const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const MealPlan = require('../models/MealPlan');
const Food = require('../models/Food');
const User = require('../models/User');
const {
  generateMealPlan,
  generateWeeklyMealPlan,
  calculateDailyTargets
} = require('../engine/nutritionGenerator');
const {
  findFoodSubstitute,
  substituteFood,
  recalculateForSkippedMeal
} = require('../engine/nutritionAdapter');

// @route   GET /api/nutrition/plan
// @desc    Get today's meal plan or for a specific date
router.get('/plan', auth, async (req, res) => {
  try {
    const targetDate = req.query.date ? new Date(req.query.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    let plan = await MealPlan.findOne({
      userId: req.user._id,
      date: { $gte: targetDate, $lt: nextDate },
      isActive: true
    }).populate('meals.foods.foodId');

    if (!plan) {
      const user = await User.findById(req.user._id);
      if (user.profile && user.profile.goal) {
        const generated = await generateMealPlan(user, targetDate);
        plan = await MealPlan.create(generated);
      } else {
        return res.status(404).json({ message: 'No meal plan found. Please complete profile assessment.' });
      }
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/nutrition/generate
// @desc    Generate/Regenerate meal plan for today or week
router.post('/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    const isWeekly = req.body.weekly === true;
    const targetDate = req.body.date ? new Date(req.body.date) : new Date();
    targetDate.setHours(0, 0, 0, 0);

    if (isWeekly) {
      const weeklyPlans = await generateWeeklyMealPlan(user);
      // Deactivate active plans for the week
      const endDate = new Date(targetDate);
      endDate.setDate(endDate.getDate() + 7);

      await MealPlan.updateMany(
        { userId: user._id, date: { $gte: targetDate, $lte: endDate } },
        { isActive: false }
      );

      const savedPlans = await MealPlan.insertMany(weeklyPlans);
      return res.status(201).json({ message: 'Weekly meal plan generated', plans: savedPlans });
    }

    // Single day
    const nextDate = new Date(targetDate);
    nextDate.setDate(nextDate.getDate() + 1);

    await MealPlan.updateMany(
      { userId: user._id, date: { $gte: targetDate, $lt: nextDate } },
      { isActive: false }
    );

    const generated = await generateMealPlan(user, targetDate);
    const plan = await MealPlan.create(generated);

    res.status(201).json({ message: 'Daily meal plan generated', plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/nutrition/substitute-options
// @desc    Find suitable substitutes for a food item
router.post('/substitute-options', auth, async (req, res) => {
  try {
    const { foodId } = req.body;
    if (!foodId) return res.status(400).json({ message: 'foodId is required' });

    const user = await User.findById(req.user._id);
    const result = await findFoodSubstitute(foodId, user);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/nutrition/substitute
// @desc    Apply a substitution to current meal plan
router.post('/substitute', auth, async (req, res) => {
  try {
    const { mealPlanId, mealType, oldFoodId, newFoodId, servings = 1 } = req.body;
    const plan = await MealPlan.findOne({ _id: mealPlanId, userId: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Meal plan not found' });

    const newFood = await Food.findById(newFoodId);
    if (!newFood) return res.status(404).json({ message: 'Replacement food not found' });

    substituteFood(plan, mealType, oldFoodId, newFood, servings);
    await plan.save();

    res.json({ message: 'Food substituted successfully', plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/nutrition/skip-meal
// @desc    Skip a meal and recalculate remaining day's macros
router.post('/skip-meal', auth, async (req, res) => {
  try {
    const { mealPlanId, mealType } = req.body;
    const plan = await MealPlan.findOne({ _id: mealPlanId, userId: req.user._id });
    if (!plan) return res.status(404).json({ message: 'Meal plan not found' });

    recalculateForSkippedMeal(plan, mealType);
    await plan.save();

    res.json({ message: 'Meal skipped and macros recalculated', plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/nutrition/log
// @desc    Log a meal or manual food entry
router.post('/log', auth, async (req, res) => {
  try {
    const { mealPlanId, mealType, foodItem, waterMl } = req.body;
    const targetDate = new Date();
    targetDate.setHours(0, 0, 0, 0);

    let plan = mealPlanId
      ? await MealPlan.findOne({ _id: mealPlanId, userId: req.user._id })
      : await MealPlan.findOne({ userId: req.user._id, date: { $gte: targetDate } });

    if (!plan) {
      const user = await User.findById(req.user._id);
      const generated = await generateMealPlan(user, targetDate);
      plan = await MealPlan.create(generated);
    }

    if (waterMl) {
      plan.dailyActuals.water = (plan.dailyActuals.water || 0) + waterMl;
    }

    if (mealType && foodItem) {
      let meal = plan.meals.find(m => m.mealType === mealType);
      if (!meal) {
        plan.meals.push({
          mealType,
          foods: [],
          totalCalories: 0,
          totalProtein: 0,
          totalCarbs: 0,
          totalFat: 0,
          isLogged: true
        });
        meal = plan.meals[plan.meals.length - 1];
      }

      meal.foods.push(foodItem);
      meal.totalCalories += foodItem.calories || 0;
      meal.totalProtein += foodItem.protein || 0;
      meal.totalCarbs += foodItem.carbs || 0;
      meal.totalFat += foodItem.fat || 0;
      meal.isLogged = true;

      plan.dailyActuals.calories += foodItem.calories || 0;
      plan.dailyActuals.protein += foodItem.protein || 0;
      plan.dailyActuals.carbs += foodItem.carbs || 0;
      plan.dailyActuals.fat += foodItem.fat || 0;
    }

    await plan.save();
    res.json({ message: 'Nutrition logged successfully', plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/nutrition/daily
// @desc    Get daily macro summary (actual vs target)
router.get('/daily', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    let plan = await MealPlan.findOne({
      userId: req.user._id,
      date: { $gte: today, $lt: tomorrow }
    });

    const user = await User.findById(req.user._id);
    const targets = plan ? plan.dailyTargets : calculateDailyTargets(user);
    const actuals = plan ? plan.dailyActuals : { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, water: 0 };

    res.json({ targets, actuals, planId: plan?._id });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
