const mongoose = require('mongoose');

const setLogSchema = new mongoose.Schema({
  setNumber: { type: Number, required: true },
  reps: { type: Number, default: 0 },
  weight: { type: Number, default: 0 },
  duration: { type: Number, default: 0 }, // seconds, for timed exercises
  completed: { type: Boolean, default: false },
  isPersonalRecord: { type: Boolean, default: false }
}, { _id: false });

const exerciseLogSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  exerciseName: { type: String, required: true },
  sets: [setLogSchema],
  restTimeTaken: { type: Number, default: 0 },
  difficulty: { type: String, enum: ['very_easy', 'easy', 'moderate', 'hard', 'very_hard'], default: 'moderate' },
  skipped: { type: Boolean, default: false },
  notes: { type: String, default: '' }
}, { _id: true });

const workoutLogSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  workoutPlanId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutPlan' },
  date: { type: Date, required: true, default: Date.now },
  dayTitle: { type: String, default: '' },
  workoutType: { type: String, default: '' },
  exercises: [exerciseLogSchema],
  
  // Workout stats
  startTime: { type: Date },
  endTime: { type: Date },
  duration: { type: Number, default: 0 }, // actual minutes
  plannedDuration: { type: Number, default: 0 },
  completionPercentage: { type: Number, default: 0 },
  totalVolume: { type: Number, default: 0 }, // total weight * reps
  estimatedCalories: { type: Number, default: 0 },
  personalRecords: { type: Number, default: 0 },
  
  // Post-workout feedback
  feedback: {
    overallDifficulty: { type: String, enum: ['very_easy', 'easy', 'moderate', 'hard', 'very_hard', ''], default: '' },
    energyLevel: { type: Number, min: 1, max: 5, default: 3 },
    fatigue: { type: Number, min: 1, max: 5, default: 3 },
    painOrDiscomfort: { type: Boolean, default: false },
    painAreas: [{ type: String }],
    enjoyment: { type: Number, min: 1, max: 5, default: 3 },
    notes: { type: String, default: '' }
  },

  isCompleted: { type: Boolean, default: false }
}, {
  timestamps: true
});

workoutLogSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('WorkoutLog', workoutLogSchema);
