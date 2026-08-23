const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const roleCheck = require('../middleware/roleCheck');
const Creator = require('../models/Creator');
const Program = require('../models/Program');
const User = require('../models/User');
const WorkoutPlan = require('../models/WorkoutPlan');

// @route   POST /api/creators/register
// @desc    Register as a creator
router.post('/register', auth, async (req, res) => {
  try {
    const existing = await Creator.findOne({ userId: req.user._id });
    if (existing) return res.status(400).json({ message: 'Creator profile already exists' });

    const { bio, expertise, certifications, socialLinks } = req.body;
    const creator = await Creator.create({
      userId: req.user._id,
      bio: bio || '',
      expertise: expertise || [],
      certifications: certifications || [],
      socialLinks: socialLinks || {}
    });

    // Update user role to creator
    await User.findByIdAndUpdate(req.user._id, { role: 'creator' });

    res.status(201).json({ message: 'Creator profile created', creator });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/creators
// @desc    Browse verified & active creators
router.get('/', async (req, res) => {
  try {
    const { search, expertise, page = 1, limit = 20 } = req.query;
    const filter = { isActive: true };

    if (expertise) filter.expertise = { $in: expertise.split(',') };

    const creators = await Creator.find(filter)
      .populate('userId', 'name profileImage')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ followerCount: -1, rating: -1 });

    const total = await Creator.countDocuments(filter);
    res.json({ creators, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/creators/:id
// @desc    Get single creator profile with programs
router.get('/:id', async (req, res) => {
  try {
    const creator = await Creator.findById(req.params.id).populate('userId', 'name profileImage');
    if (!creator) return res.status(404).json({ message: 'Creator not found' });

    const programs = await Program.find({ creatorId: creator._id, isPublished: true });
    res.json({ creator, programs });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/creators/programs
// @desc    Creator uploads a new workout program
router.post('/programs', auth, roleCheck('creator', 'admin'), async (req, res) => {
  try {
    const creator = await Creator.findOne({ userId: req.user._id });
    if (!creator) return res.status(403).json({ message: 'Creator profile required' });

    const program = await Program.create({
      ...req.body,
      creatorId: creator._id,
      isPublished: true
    });

    res.status(201).json({ message: 'Program created successfully', program });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   GET /api/creators/programs/browse
// @desc    Browse published creator programs
router.get('/programs/browse', async (req, res) => {
  try {
    const { category, difficulty, search, page = 1, limit = 20 } = req.query;
    const filter = { isPublished: true, isActive: true };

    if (category) filter.category = category;
    if (difficulty) filter.difficulty = difficulty;
    if (search) filter.$text = { $search: search };

    const programs = await Program.find(filter)
      .populate({
        path: 'creatorId',
        populate: { path: 'userId', select: 'name profileImage' }
      })
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .sort({ rating: -1, followerCount: -1 });

    const total = await Program.countDocuments(filter);
    res.json({ programs, total, page: parseInt(page) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/creators/programs/:id/follow
// @desc    One-tap follow/adopt creator program as active workout plan
router.post('/programs/:id/follow', auth, async (req, res) => {
  try {
    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    // Track user follower in program
    if (!program.followers.includes(req.user._id)) {
      program.followers.push(req.user._id);
      program.followerCount = program.followers.length;
      await program.save();
    }

    // Convert program schedule into an active user WorkoutPlan
    await WorkoutPlan.updateMany({ userId: req.user._id, isActive: true }, { isActive: false });

    const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const schedule = [];

    for (let d = 0; d < 7; d++) {
      const progDay = program.schedule.find(s => s.dayNumber === d + 1) || program.schedule[d % program.schedule.length];
      if (progDay && !progDay.isRestDay) {
        schedule.push({
          dayOfWeek: d,
          dayName: dayNames[d],
          workoutType: progDay.workoutType || 'full_body',
          title: progDay.title,
          duration: progDay.duration || 45,
          exercises: progDay.exercises.map((ex, idx) => ({
            exerciseId: ex.exerciseId,
            exerciseName: ex.exerciseName,
            sets: ex.sets || 3,
            reps: ex.reps || '10-12',
            weight: 0,
            restPeriod: ex.restPeriod || 60,
            notes: ex.notes || '',
            order: idx
          })),
          isRestDay: false,
          intensity: 'moderate'
        });
      } else {
        schedule.push({
          dayOfWeek: d,
          dayName: dayNames[d],
          workoutType: 'rest',
          title: 'Rest Day',
          duration: 0,
          exercises: [],
          isRestDay: true,
          intensity: 'low'
        });
      }
    }

    const newPlan = await WorkoutPlan.create({
      userId: req.user._id,
      name: program.title,
      description: program.description,
      schedule,
      goal: req.user.profile?.goal || 'general_fitness',
      fitnessLevel: program.difficulty,
      splitType: 'custom',
      isActive: true,
      sourceType: 'creator_program',
      sourceProgramId: program._id
    });

    res.json({ message: `Successfully followed "${program.title}" and set as active plan!`, plan: newPlan });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/creators/programs/:id/review
// @desc    Add rating and review to a program
router.post('/programs/:id/review', auth, async (req, res) => {
  try {
    const { rating, comment } = req.body;
    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: 'Rating between 1 and 5 is required' });
    }

    const program = await Program.findById(req.params.id);
    if (!program) return res.status(404).json({ message: 'Program not found' });

    program.reviews.push({
      userId: req.user._id,
      rating,
      comment: comment || '',
      createdAt: new Date()
    });

    program.reviewCount = program.reviews.length;
    program.rating = +(program.reviews.reduce((sum, r) => sum + r.rating, 0) / program.reviews.length).toFixed(1);
    await program.save();

    res.status(201).json({ message: 'Review added', program });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
