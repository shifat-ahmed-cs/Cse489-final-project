const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Food = require('../models/Food');

// @route   GET /api/foods
// @desc    Search and filter foods
router.get('/', async (req, res) => {
  try {
    const { search, category, dietaryTag, allergen, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (dietaryTag) filter.dietaryTags = dietaryTag;
    if (allergen) filter.allergens = { $ne: allergen };
    if (search) filter.$text = { $search: search };

    const foods = await Food.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Food.countDocuments(filter);
    res.json({ foods, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/foods/:id
router.get('/:id', async (req, res) => {
  try {
    const food = await Food.findById(req.params.id);
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/foods (Admin)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const food = await Food.create(req.body);
    res.status(201).json(food);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/foods/:id (Admin)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const food = await Food.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!food) return res.status(404).json({ message: 'Food item not found' });
    res.json(food);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
