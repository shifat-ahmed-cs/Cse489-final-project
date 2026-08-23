const mongoose = require('mongoose');

const exerciseSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  muscleGroups: [{
    type: String,
    enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'forearms',
           'quadriceps', 'hamstrings', 'glutes', 'calves', 'core', 'full_body',
           'hip_flexors', 'traps', 'lats', 'obliques', 'lower_back']
  }],
  category: {
    type: String,
    enum: ['chest', 'back', 'shoulders', 'arms', 'legs', 'glutes', 'core',
           'full_body', 'cardio', 'mobility', 'stretching'],
    required: true
  },
  equipment: [{
    type: String,
    enum: ['none', 'barbell', 'dumbbell', 'kettlebell', 'cable', 'machine',
           'resistance_band', 'pull_up_bar', 'bench', 'squat_rack',
           'smith_machine', 'ez_bar', 'medicine_ball', 'foam_roller',
           'yoga_mat', 'jump_rope', 'treadmill', 'stationary_bike',
           'rowing_machine', 'elliptical', 'box', 'trx']
  }],
  difficulty: {
    type: String,
    enum: ['beginner', 'intermediate', 'advanced'],
    default: 'intermediate'
  },
  instructions: [{ type: String }],
  tips: [{ type: String }],
  videoUrl: { type: String, default: '' },
  imageUrl: { type: String, default: '' },
  defaultSets: { type: Number, default: 3 },
  defaultReps: { type: String, default: '10-12' }, // Can be range like "8-12" or "30 sec"
  restPeriod: { type: Number, default: 60 }, // seconds
  caloriesPerMinute: { type: Number, default: 5 },
  movementType: {
    type: String,
    enum: ['compound', 'isolation', 'cardio', 'flexibility', 'plyometric'],
    default: 'compound'
  },
  bodyArea: {
    type: String,
    enum: ['upper', 'lower', 'core', 'full_body'],
    default: 'upper'
  },
  alternatives: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' }],
  alternativeNames: [{ type: String }], // Fallback text-based alternatives
  tags: [{ type: String }],
  isActive: { type: Boolean, default: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, {
  timestamps: true
});

exerciseSchema.index({ name: 'text', tags: 'text' });
exerciseSchema.index({ category: 1, difficulty: 1 });
exerciseSchema.index({ muscleGroups: 1 });
exerciseSchema.index({ equipment: 1 });

module.exports = mongoose.model('Exercise', exerciseSchema);
