const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Progress = require('../models/Progress');
const User = require('../models/User');
const { generateDashboardSummary, analyzeStrengthProgression } = require('../engine/progressAnalyzer');

// @route   POST /api/progress
// @desc    Log a progress entry (weight, measurements, etc.)
router.post('/', auth, async (req, res) => {
  try {
    const { weight, bodyFatPercentage, measurements, notes } = req.body;
    const user = await User.findById(req.user._id);

    let bmi = 0;
    if (weight && user.profile.height) {
      const heightM = user.profile.height / 100;
      bmi = +(weight / (heightM * heightM)).toFixed(1);
      // Update user current weight too
      user.profile.weight = weight;
      await user.save();
    }

    const progress = await Progress.create({
      userId: req.user._id,
      date: new Date(),
      weight,
      bmi: bmi || undefined,
      bodyFatPercentage,
      measurements: measurements || {},
      notes: notes || ''
    });

    res.status(201).json({ message: 'Progress logged successfully', progress });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/progress
// @desc    Get progress logs history
router.get('/', auth, async (req, res) => {
  try {
    const { days = 90 } = req.query;
    const since = new Date();
    since.setDate(since.getDate() - parseInt(days));

    const entries = await Progress.find({
      userId: req.user._id,
      date: { $gte: since }
    }).sort({ date: 1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/progress/dashboard
// @desc    Get full analytical dashboard data
router.get('/dashboard', auth, async (req, res) => {
  try {
    const summary = await generateDashboardSummary(req.user._id);
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/progress/strength
// @desc    Analyze strength progression for an exercise
router.get('/strength', auth, async (req, res) => {
  try {
    const { exerciseName, days = 90 } = req.query;
    if (!exerciseName) return res.status(400).json({ message: 'exerciseName is required' });

    const analysis = await analyzeStrengthProgression(req.user._id, exerciseName, parseInt(days));
    res.json(analysis);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/progress/photos
// @desc    Log photo URLs
router.post('/photos', auth, async (req, res) => {
  try {
    const { front, side, back, notes } = req.body;
    const progress = await Progress.create({
      userId: req.user._id,
      date: new Date(),
      photos: { front, side, back },
      notes: notes || ''
    });

    res.status(201).json({ message: 'Progress photos logged', progress });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/progress/photos
// @desc    Get progress photo timeline
router.get('/photos', auth, async (req, res) => {
  try {
    const entries = await Progress.find({
      userId: req.user._id,
      $or: [
        { 'photos.front': { $exists: true, $ne: '' } },
        { 'photos.side': { $exists: true, $ne: '' } },
        { 'photos.back': { $exists: true, $ne: '' } }
      ]
    }).sort({ date: -1 });

    res.json(entries);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
