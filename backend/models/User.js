const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, minlength: 6 },
  phone: { type: String, default: '' },
  name: { type: String, required: true, trim: true },
  role: { type: String, enum: ['user', 'creator', 'admin'], default: 'user' },
  profileImage: { type: String, default: '' },

  // Fitness Profile
  profile: {
    age: { type: Number, default: 0 },
    gender: { type: String, enum: ['male', 'female', 'other', ''], default: '' },
    height: { type: Number, default: 0 }, // cm
    weight: { type: Number, default: 0 }, // kg
    fitnessLevel: { type: String, enum: ['beginner', 'intermediate', 'advanced', ''], default: '' },
    goal: {
      type: String,
      enum: ['weight_loss', 'muscle_gain', 'strength', 'endurance', 'general_fitness', 'body_recomposition', 'flexibility', ''],
      default: ''
    },
    targetWeight: { type: Number, default: 0 },
    targetBodyFat: { type: Number, default: 0 },
    dailyActivityLevel: {
      type: String,
      enum: ['sedentary', 'lightly_active', 'moderately_active', 'very_active', 'extremely_active', ''],
      default: ''
    },
    workoutDaysPerWeek: { type: Number, default: 3 },
    preferredWorkoutDuration: { type: Number, default: 45 }, // minutes
    preferredWorkoutTime: { type: String, enum: ['morning', 'afternoon', 'evening', 'any', ''], default: 'any' },
    workoutLocation: { type: String, enum: ['home', 'gym', 'outdoors', 'any', ''], default: 'gym' },
    equipment: [{ type: String }],
    previousFitnessExperience: { type: String, default: '' },
    preferredWorkoutTypes: [{ type: String }],
    dislikedExercises: [{ type: String }],
  },

  // Injuries & Limitations
  injuries: [{
    type: { type: String }, // current, previous
    area: { type: String },
    description: { type: String },
    severity: { type: String, enum: ['mild', 'moderate', 'severe'] },
    restrictedExercises: [{ type: String }],
    restrictedMovements: [{ type: String }]
  }],
  mobilityLimitations: [{ type: String }],
  medicalRestrictions: [{ type: String }],

  // Food Preferences
  foodPreferences: {
    likedFoods: [{ type: String }],
    dislikedFoods: [{ type: String }],
    neverRecommend: [{ type: String }],
    allergies: [{ type: String }],
    dietaryRestrictions: [{ type: String }], // vegetarian, vegan, halal, gluten-free, etc.
    cuisinePreferences: [{ type: String }],
    mealsPerDay: { type: Number, default: 3 },
    cookingAbility: { type: String, enum: ['beginner', 'intermediate', 'advanced', ''], default: '' },
    availableCookingTime: { type: Number, default: 30 }, // minutes
    budget: { type: String, enum: ['low', 'medium', 'high', ''], default: 'medium' }
  },

  // Notification Preferences
  notificationPreferences: {
    workoutReminder: { type: Boolean, default: true },
    mealReminder: { type: Boolean, default: true },
    waterReminder: { type: Boolean, default: true },
    progressReport: { type: Boolean, default: true },
    communityUpdates: { type: Boolean, default: true },
    creatorUpdates: { type: Boolean, default: true }
  },

  // Assessment completed flag
  assessmentCompleted: { type: Boolean, default: false },
  onboardingCompleted: { type: Boolean, default: false },

  // Streak tracking
  currentStreak: { type: Number, default: 0 },
  longestStreak: { type: Number, default: 0 },
  lastWorkoutDate: { type: Date },

  // Social
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],

  resetPasswordToken: { type: String },
  resetPasswordExpire: { type: Date }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

// Compare password method
userSchema.methods.matchPassword = async function(enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

// Calculate BMI
userSchema.methods.calculateBMI = function() {
  if (this.profile.height > 0 && this.profile.weight > 0) {
    const heightM = this.profile.height / 100;
    return +(this.profile.weight / (heightM * heightM)).toFixed(1);
  }
  return 0;
};

module.exports = mongoose.model('User', userSchema);
