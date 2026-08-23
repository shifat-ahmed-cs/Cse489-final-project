const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Goal = require('../models/Goal');

// @route   GET /api/goals
// @desc    Get user's goals
router.get('/', auth, async (req, res) => {
  try {
    const goals = await Goal.find({ userId: req.user._id, isActive: true }).sort({ createdAt: -1 });
    res.json(goals);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/goals
// @desc    Create a new goal with optional milestones
router.post('/', auth, async (req, res) => {
  try {
    const { type, title, description, target, current, unit, deadline, milestones, startValue } = req.body;

    const goal = await Goal.create({
      userId: req.user._id,
      type,
      title,
      description: description || '',
      target,
      current: current !== undefined ? current : (startValue || 0),
      unit: unit || 'kg',
      startValue: startValue || current || 0,
      deadline,
      milestones: milestones || []
    });

    res.status(201).json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/goals/:id
// @desc    Update goal progress or values
router.put('/:id', auth, async (req, res) => {
  try {
    const goal = await Goal.findOne({ _id: req.params.id, userId: req.user._id });
    if (!goal) return res.status(404).json({ message: 'Goal not found' });

    const { current, isCompleted } = req.body;

    if (current !== undefined) {
      goal.current = current;
      // Auto complete if target reached
      if (goal.target && goal.current >= goal.target) {
        goal.isCompleted = true;
        goal.completedAt = new Date();
      }

      // Check milestones
      goal.milestones.forEach(m => {
        if (!m.achieved && goal.current >= m.target) {
          m.achieved = true;
          m.achievedAt = new Date();
        }
      });
    }

    if (isCompleted !== undefined) {
      goal.isCompleted = isCompleted;
      if (isCompleted) goal.completedAt = new Date();
    }

    await goal.save();
    res.json(goal);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/goals/:id
router.delete('/:id', auth, async (req, res) => {
  try {
    await Goal.findOneAndDelete({ _id: req.params.id, userId: req.user._id });
    res.json({ message: 'Goal removed' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
