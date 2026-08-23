const mongoose = require('mongoose');

const commentSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  content: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}, { _id: true });

const communityPostSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['achievement', 'progress', 'workout', 'recipe', 'general', 'challenge'],
    default: 'general'
  },
  content: { type: String, required: true },
  imageUrl: { type: String, default: '' },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  likeCount: { type: Number, default: 0 },
  comments: [commentSchema],
  commentCount: { type: Number, default: 0 },
  
  // Related data
  workoutLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'WorkoutLog' },
  challengeId: { type: mongoose.Schema.Types.ObjectId, ref: 'Challenge' },
  
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

communityPostSchema.index({ userId: 1, createdAt: -1 });
communityPostSchema.index({ type: 1, createdAt: -1 });

module.exports = mongoose.model('CommunityPost', communityPostSchema);
