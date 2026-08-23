const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Exercise = require('../models/Exercise');

// @route   GET /api/exercises
router.get('/', async (req, res) => {
  try {
    const { category, difficulty, equipment, muscleGroup, search, page = 1, limit = 50 } = req.query;
    const filter = { isActive: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (equipment) filter.equipment = { $in: equipment.split(',') };
    if (muscleGroup) filter.muscleGroups = { $in: muscleGroup.split(',') };
    if (search) filter.$text = { $search: search };

    const exercises = await Exercise.find(filter)
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ name: 1 });

    const total = await Exercise.countDocuments(filter);

    res.json({ exercises, total, page: parseInt(page), pages: Math.ceil(total / limit) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/exercises/:id
router.get('/:id', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id).populate('alternatives', 'name difficulty equipment muscleGroups');
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/exercises/:id/alternatives
router.get('/:id/alternatives', async (req, res) => {
  try {
    const exercise = await Exercise.findById(req.params.id);
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });

    // Find alternatives by same muscle group and similar difficulty
    const alternatives = await Exercise.find({
      _id: { $ne: exercise._id },
      muscleGroups: { $in: exercise.muscleGroups },
      isActive: true
    }).limit(10).select('name difficulty equipment muscleGroups category defaultSets defaultReps');

    res.json({ exercise: exercise.name, alternatives });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/exercises (Admin)
router.post('/', auth, roleCheck('admin'), async (req, res) => {
  try {
    const exercise = await Exercise.create(req.body);
    res.status(201).json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/exercises/:id (Admin)
router.put('/:id', auth, roleCheck('admin'), async (req, res) => {
  try {
    const exercise = await Exercise.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!exercise) return res.status(404).json({ message: 'Exercise not found' });
    res.json(exercise);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
