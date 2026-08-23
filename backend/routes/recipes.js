const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Recipe = require('../models/Recipe');
const MealPlan = require('../models/MealPlan');

// @route   GET /api/recipes
// @desc    List and search recipes
router.get('/', async (req, res) => {
  try {
    const { mealType, difficulty, search, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (mealType) filter.mealType = mealType;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search };

    const recipes = await Recipe.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rating: -1 });

    const total = await Recipe.countDocuments(filter);
    res.json({ recipes, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/recipes/favorites
// @desc    Get user's favorite recipes
router.get('/favorites', auth, async (req, res) => {
  try {
    const favorites = await Recipe.find({ favoriteBy: req.user._id, isActive: true });
    res.json(favorites);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/recipes/shopping-list
// @desc    Generate a consolidated shopping list from the active meal plans
router.get('/shopping-list', auth, async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const endOfWeek = new Date(today);
    endOfWeek.setDate(endOfWeek.getDate() + 7);

    const plans = await MealPlan.find({
      userId: req.user._id,
      date: { $gte: today, $lte: endOfWeek }
    });

    const itemMap = {};

    plans.forEach(plan => {
      plan.meals.forEach(meal => {
        meal.foods.forEach(food => {
          const key = food.foodName.toLowerCase();
          if (!itemMap[key]) {
            itemMap[key] = {
              name: food.foodName,
              quantity: 0,
              unit: food.servingUnit || 'g',
              foodId: food.foodId,
              checked: false
            };
          }
          itemMap[key].quantity += (food.servingSize || 100);
        });
      });
    });

    const shoppingList = Object.values(itemMap);
    res.json({ shoppingList, totalItems: shoppingList.length });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/recipes/:id
router.get('/:id', async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });
    res.json(recipe);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/recipes/:id/favorite
// @desc    Toggle favorite on a recipe
router.post('/:id/favorite', auth, async (req, res) => {
  try {
    const recipe = await Recipe.findById(req.params.id);
    if (!recipe) return res.status(404).json({ message: 'Recipe not found' });

    const index = recipe.favoriteBy.indexOf(req.user._id);
    let isFavorited = false;

    if (index === -1) {
      recipe.favoriteBy.push(req.user._id);
      isFavorited = true;
    } else {
      recipe.favoriteBy.splice(index, 1);
    }

    await recipe.save();
    res.json({ message: isFavorited ? 'Added to favorites' : 'Removed from favorites', isFavorited });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/recipes
router.post('/', auth, async (req, res) => {
  try {
    const recipe = await Recipe.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(recipe);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
