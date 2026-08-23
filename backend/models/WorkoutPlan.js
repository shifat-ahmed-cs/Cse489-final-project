const mongoose = require('mongoose');

const workoutExerciseSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  exerciseName: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: String, default: '10-12' },
  weight: { type: Number, default: 0 },
  restPeriod: { type: Number, default: 60 },
  duration: { type: Number, default: 0 }, // for cardio/timed exercises, in seconds
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { _id: true });

const workoutDaySchema = new mongoose.Schema({
  dayOfWeek: { type: Number, required: true }, // 0=Sunday, 1=Monday, etc.
  dayName: { type: String, required: true },
  workoutType: {
    type: String,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'upper', 'lower', 'upper_body', 'lower_body',
           'push', 'pull', 'full_body', 'cardio', 'mobility', 'core', 'rest', 'strength', 'endurance',
           'chest_triceps', 'back_biceps', 'shoulders_arms', 'legs_glutes',
           'upper_push', 'upper_pull', 'hiit', 'stretching', 'custom'],
    required: true
  },
  title: { type: String, required: true },
  duration: { type: Number, default: 45 }, // minutes
  exercises: [workoutExerciseSchema],
  isRestDay: { type: Boolean, default: false },
  intensity: { type: String, enum: ['low', 'moderate', 'high', 'very_high'], default: 'moderate' }
}, { _id: true });

const workoutPlanSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, default: 'My Workout Plan' },
  description: { type: String, default: '' },
  schedule: [workoutDaySchema],
  goal: { type: String },
  fitnessLevel: { type: String },
  splitType: {
    type: String,
    enum: ['push_pull_legs', 'upper_lower', 'full_body', 'bro_split', 'custom'],
    default: 'push_pull_legs'
  },
  weekNumber: { type: Number, default: 1 },
  isActive: { type: Boolean, default: true },
  generatedAt: { type: Date, default: Date.now },
  lastAdaptedAt: { type: Date },
  adaptationHistory: [{
    reason: String,
    changes: String,
    date: { type: Date, default: Date.now }
  }],
  // Source tracking for creator programs
  sourceType: { type: String, enum: ['generated', 'creator_program', 'custom'], default: 'generated' },
  sourceProgramId: { type: mongoose.Schema.Types.ObjectId, ref: 'Program' }
}, {
  timestamps: true
});

workoutPlanSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('WorkoutPlan', workoutPlanSchema);
