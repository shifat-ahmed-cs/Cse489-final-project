const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const User = require('../models/User');

// @route   GET /api/users/profile
router.get('/profile', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/profile
router.put('/profile', auth, async (req, res) => {
  try {
    const updates = req.body;
    const user = await User.findById(req.user._id);

    // Update basic fields
    if (updates.name) user.name = updates.name;
    if (updates.phone) user.phone = updates.phone;
    if (updates.profileImage) user.profileImage = updates.profileImage;

    // Update profile fields
    if (updates.profile) {
      Object.keys(updates.profile).forEach(key => {
        user.profile[key] = updates.profile[key];
      });
    }

    await user.save();
    res.json({ message: 'Profile updated', user: user.toObject({ versionKey: false }) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/users/assessment
router.post('/assessment', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { profile, injuries, mobilityLimitations, medicalRestrictions, foodPreferences } = req.body;

    // Update profile
    if (profile) {
      Object.keys(profile).forEach(key => {
        user.profile[key] = profile[key];
      });
    }

    // Update injuries
    if (injuries) user.injuries = injuries;
    if (mobilityLimitations) user.mobilityLimitations = mobilityLimitations;
    if (medicalRestrictions) user.medicalRestrictions = medicalRestrictions;

    // Update food preferences
    if (foodPreferences) {
      Object.keys(foodPreferences).forEach(key => {
        user.foodPreferences[key] = foodPreferences[key];
      });
    }

    user.assessmentCompleted = true;
    user.onboardingCompleted = true;
    await user.save();

    res.json({ message: 'Assessment completed', user: user.toObject({ versionKey: false }) });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/preferences
router.put('/preferences', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { foodPreferences, notificationPreferences } = req.body;

    if (foodPreferences) {
      Object.keys(foodPreferences).forEach(key => {
        user.foodPreferences[key] = foodPreferences[key];
      });
    }

    if (notificationPreferences) {
      Object.keys(notificationPreferences).forEach(key => {
        user.notificationPreferences[key] = notificationPreferences[key];
      });
    }

    await user.save();
    res.json({ message: 'Preferences updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/users/injuries
router.put('/injuries', auth, async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const { injuries, mobilityLimitations, medicalRestrictions } = req.body;

    if (injuries) user.injuries = injuries;
    if (mobilityLimitations) user.mobilityLimitations = mobilityLimitations;
    if (medicalRestrictions) user.medicalRestrictions = medicalRestrictions;

    await user.save();
    res.json({ message: 'Injury information updated' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;
