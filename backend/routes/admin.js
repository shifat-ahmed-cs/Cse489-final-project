const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const User = require('../models/User');
const Creator = require('../models/Creator');
const Exercise = require('../models/Exercise');
const Food = require('../models/Food');
const WorkoutLog = require('../models/WorkoutLog');
const Program = require('../models/Program');

// Apply admin protection to all routes in this router
router.use(auth, roleCheck('admin'));

// @route   GET /api/admin/users
// @desc    List all users with search
router.get('/users', async (req, res) => {
  try {
    const { search, role, page = 1, limit = 20 } = req.query;
    const filter = {};

    if (role) filter.role = role;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(filter)
      .select('-password')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ createdAt: -1 });

    const total = await User.countDocuments(filter);
    res.json({ users, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/admin/creators/:id/verify
// @desc    Verify or unverify a creator
router.put('/creators/:id/verify', async (req, res) => {
  try {
    const { isVerified } = req.body;
    const creator = await Creator.findByIdAndUpdate(
      req.params.id,
      { isVerified: isVerified !== undefined ? isVerified : true },
      { new: true }
    );
    if (!creator) return res.status(404).json({ message: 'Creator not found' });
    res.json({ message: 'Creator verification status updated', creator });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/admin/analytics
// @desc    Platform-wide analytics
router.get('/analytics', async (req, res) => {
  try {
    const [
      totalUsers,
      totalCreators,
      totalExercises,
      totalFoods,
      totalWorkoutsLogged,
      totalPrograms
    ] = await Promise.all([
      User.countDocuments(),
      Creator.countDocuments(),
      Exercise.countDocuments(),
      Food.countDocuments(),
      WorkoutLog.countDocuments({ isCompleted: true }),
      Program.countDocuments()
    ]);

    const recentLogs = await WorkoutLog.find({ isCompleted: true })
      .sort({ date: -1 })
      .limit(10)
      .populate('userId', 'name email');

    res.json({
      overview: {
        totalUsers,
        totalCreators,
        totalExercises,
        totalFoods,
        totalWorkoutsLogged,
        totalPrograms
      },
      recentWorkouts: recentLogs
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/admin/users/:id
// @desc    Admin delete user
router.delete('/users/:id', async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
