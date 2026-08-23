const mongoose = require('mongoose');

const milestoneSchema = new mongoose.Schema({
  title: { type: String, required: true },
  target: { type: Number, required: true },
  achieved: { type: Boolean, default: false },
  achievedAt: { type: Date }
}, { _id: true });

const goalSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['weight_loss', 'weight_gain', 'strength', 'endurance', 'consistency',
           'body_fat', 'measurement', 'custom'],
    required: true
  },
  title: { type: String, required: true },
  description: { type: String, default: '' },
  target: { type: Number, required: true },
  current: { type: Number, default: 0 },
  unit: { type: String, default: 'kg' },
  startValue: { type: Number, default: 0 },
  deadline: { type: Date },
  milestones: [milestoneSchema],
  isCompleted: { type: Boolean, default: false },
  completedAt: { type: Date },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

goalSchema.index({ userId: 1, isActive: 1 });

module.exports = mongoose.model('Goal', goalSchema);
