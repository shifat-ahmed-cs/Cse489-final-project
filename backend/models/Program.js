const mongoose = require('mongoose');

const programExerciseSchema = new mongoose.Schema({
  exerciseId: { type: mongoose.Schema.Types.ObjectId, ref: 'Exercise' },
  exerciseName: { type: String, required: true },
  sets: { type: Number, default: 3 },
  reps: { type: String, default: '10-12' },
  restPeriod: { type: Number, default: 60 },
  notes: { type: String, default: '' },
  order: { type: Number, default: 0 }
}, { _id: false });

const programDaySchema = new mongoose.Schema({
  dayNumber: { type: Number, required: true },
  title: { type: String, required: true },
  workoutType: { type: String, required: true },
  duration: { type: Number, default: 45 },
  exercises: [programExerciseSchema],
  isRestDay: { type: Boolean, default: false }
}, { _id: true });

const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  rating: { type: Number, min: 1, max: 5, required: true },
  comment: { type: String, default: '' },
  creatorResponse: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const programSchema = new mongoose.Schema({
  creatorId: { type: mongoose.Schema.Types.ObjectId, ref: 'Creator', required: true },
  title: { type: String, required: true, trim: true },
  description: { type: String, required: true },
  duration: { type: Number, default: 28 }, // days
  difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'intermediate' },
  targetAudience: { type: String, default: '' },
  category: {
    type: String,
    enum: ['weight_loss', 'muscle_building', 'muscle_gain', 'strength', 'running', 'home_workouts',
           'gym', 'mobility', 'sports', 'hiit', 'yoga', 'calisthenics', 'general_fitness', 'other'],
    default: 'other'
  },
  schedule: [programDaySchema],
  imageUrl: { type: String, default: '' },
  videoUrl: { type: String, default: '' },
  
  // Stats
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followerCount: { type: Number, default: 0 },
  views: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: [reviewSchema],
  reviewCount: { type: Number, default: 0 },
  completionRate: { type: Number, default: 0 },
  
  isPublished: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
  tags: [{ type: String }]
}, {
  timestamps: true
});

programSchema.index({ creatorId: 1 });
programSchema.index({ category: 1, difficulty: 1 });
programSchema.index({ title: 'text', description: 'text', tags: 'text' });

module.exports = mongoose.model('Program', programSchema);
