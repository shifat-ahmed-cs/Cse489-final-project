const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const WorkoutPlan = require('../models/WorkoutPlan');
const WorkoutLog = require('../models/WorkoutLog');
const User = require('../models/User');
const { generateWorkoutPlan, generateQuickWorkout } = require('../engine/workoutGenerator');
const {
  adaptForInjury,
  adaptForTime,
  adaptForEquipment,
  adaptDifficulty,
  smartReschedule,
  applyProgressiveOverload
} = require('../engine/workoutAdapter');

// @route   GET /api/workouts/plan
// @desc    Get current active workout plan
router.get('/plan', auth, async (req, res) => {
  try {
    let plan = await WorkoutPlan.findOne({ userId: req.user._id, isActive: true })
      .populate('schedule.exercises.exerciseId');

    if (!plan) {
      // Auto-generate if user has profile
      const user = await User.findById(req.user._id);
      if (user.profile && user.profile.goal) {
        const generated = await generateWorkoutPlan(user);
        plan = await WorkoutPlan.create({ ...generated, userId: user._id });
      } else {
        return res.status(404).json({ message: 'No workout plan found. Please complete profile assessment.' });
      }
    }

    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/workouts/generate
// @desc    Generate/Regenerate personalized workout plan
router.post('/generate', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: 'User not found' });

    // Deactivate previous active plans
    await WorkoutPlan.updateMany({ userId: user._id, isActive: true }, { isActive: false });

    const planData = await generateWorkoutPlan(user);
    const plan = await WorkoutPlan.create({
      ...planData,
      userId: user._id
    });

    res.status(201).json({ message: 'Personalized workout plan generated', plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/workouts/plan
// @desc    Customize current active plan
router.put('/plan', auth, async (req, res) => {
  try {
    const plan = await WorkoutPlan.findOneAndUpdate(
      { userId: req.user._id, isActive: true },
      { $set: req.body },
      { new: true }
    );
    if (!plan) return res.status(404).json({ message: 'No active plan found' });
    res.json(plan);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/workouts/adapt
// @desc    Adapt active workout plan ("Change My Plan" feature)
router.post('/adapt', auth, async (req, res) => {
  try {
    const { action, injuryArea, availableMinutes, newEquipment, direction, missedDay } = req.body;
    const plan = await WorkoutPlan.findOne({ userId: req.user._id, isActive: true });
    if (!plan) return res.status(404).json({ message: 'No active plan found' });

    const user = await User.findById(req.user._id);
    let result = { plan, changes: [] };

    switch (action) {
      case 'injury':
        if (!injuryArea) return res.status(400).json({ message: 'injuryArea is required' });
        result = await adaptForInjury(plan, user, injuryArea);
        break;

      case 'time':
        const dayOfWeek = req.body.dayOfWeek !== undefined ? req.body.dayOfWeek : new Date().getDay();
        result = await adaptForTime(plan, dayOfWeek, availableMinutes || 30);
        break;

      case 'equipment':
        if (!newEquipment || !Array.isArray(newEquipment)) {
          return res.status(400).json({ message: 'newEquipment array required' });
        }
        result = await adaptForEquipment(plan, user, newEquipment);
        break;

      case 'difficulty':
        result = adaptDifficulty(plan, direction || 'harder');
        break;

      case 'reschedule':
        const targetMissedDay = missedDay !== undefined ? missedDay : (new Date().getDay() || 7) - 1;
        result = smartReschedule(plan, targetMissedDay);
        break;

      case 'progressive_overload':
        result = await applyProgressiveOverload(plan, user._id);
        break;

      default:
        return res.status(400).json({ message: 'Invalid adapt action' });
    }

    await plan.save();
    res.json({ message: 'Plan adapted successfully', changes: result.changes, plan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/workouts/quick
// @desc    Generate a single on-the-fly quick workout session
router.post('/quick', auth, async (req, res) => {
  try {
    const { minutes } = req.body;
    const user = await User.findById(req.user._id);
    const quick = await generateQuickWorkout(user, minutes || 20);
    res.json(quick);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/workouts/log
// @desc    Log a completed workout
router.post('/log', auth, async (req, res) => {
  try {
    const {
      workoutPlanId,
      dayTitle,
      workoutType,
      exercises,
      startTime,
      endTime,
      duration,
      completionPercentage,
      totalVolume,
      estimatedCalories,
      feedback
    } = req.body;

    const log = await WorkoutLog.create({
      userId: req.user._id,
      workoutPlanId,
      date: new Date(),
      dayTitle,
      workoutType,
      exercises,
      startTime,
      endTime,
      duration,
      completionPercentage: completionPercentage || 100,
      totalVolume: totalVolume || 0,
      estimatedCalories: estimatedCalories || Math.round((duration || 45) * 6),
      feedback: feedback || {},
      isCompleted: true
    });

    // Update streak and last workout date
    const user = await User.findById(req.user._id);
    const now = new Date();
    if (user.lastWorkoutDate) {
      const diffDays = Math.round((now - user.lastWorkoutDate) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        user.currentStreak += 1;
      } else if (diffDays > 1) {
        user.currentStreak = 1;
      }
    } else {
      user.currentStreak = 1;
    }
    user.longestStreak = Math.max(user.longestStreak || 0, user.currentStreak);
    user.lastWorkoutDate = now;
    await user.save();

    res.status(201).json({ message: 'Workout logged successfully', log, streak: user.currentStreak });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/workouts/history
// @desc    Get user workout history
router.get('/history', auth, async (req, res) => {
  try {
    const { limit = 30, page = 1 } = req.query;
    const logs = await WorkoutLog.find({ userId: req.user._id })
      .sort({ date: -1 })
      .skip((page - 1) * limit)
      .limit(parseInt(limit));

    const total = await WorkoutLog.countDocuments({ userId: req.user._id });
    res.json({ logs, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/workouts/history/:id
// @desc    Get specific workout log detail
router.get('/history/:id', auth, async (req, res) => {
  try {
    const log = await WorkoutLog.findOne({ _id: req.params.id, userId: req.user._id });
    if (!log) return res.status(404).json({ message: 'Workout log not found' });
    res.json(log);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
