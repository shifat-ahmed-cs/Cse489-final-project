const mongoose = require('mongoose');

const challengeSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  type: {
    type: String,
    enum: ['workout', 'steps', 'exercise', 'running', 'consistency', 'custom'],
    default: 'workout'
  },
  duration: { type: Number, default: 30 }, // days
  target: { type: Number, required: true },
  targetUnit: { type: String, default: 'workouts' },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  imageUrl: { type: String, default: '' },
  
  participants: [{
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    progress: { type: Number, default: 0 },
    joinedAt: { type: Date, default: Date.now },
    isCompleted: { type: Boolean, default: false }
  }],
  participantCount: { type: Number, default: 0 },
  
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Challenge', challengeSchema);
