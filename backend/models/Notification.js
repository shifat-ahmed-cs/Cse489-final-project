const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: {
    type: String,
    enum: ['workout_reminder', 'missed_workout', 'workout_completed', 'new_workout',
           'meal_reminder', 'water_reminder', 'meal_plan_update',
           'weekly_progress', 'goal_milestone', 'personal_record',
           'new_program', 'creator_update', 'challenge_reminder',
           'community_like', 'community_comment', 'follower_new',
           'system', 'achievement'],
    required: true
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  data: { type: mongoose.Schema.Types.Mixed, default: {} },
  isRead: { type: Boolean, default: false },
  readAt: { type: Date }
}, {
  timestamps: true
});

notificationSchema.index({ userId: 1, createdAt: -1 });
notificationSchema.index({ userId: 1, isRead: 1 });

module.exports = mongoose.model('Notification', notificationSchema);
