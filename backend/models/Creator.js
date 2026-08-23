const mongoose = require('mongoose');

const creatorSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
  bio: { type: String, default: '' },
  expertise: [{ type: String }],
  certifications: [{ type: String }],
  socialLinks: {
    instagram: { type: String, default: '' },
    youtube: { type: String, default: '' },
    twitter: { type: String, default: '' },
    website: { type: String, default: '' },
    tiktok: { type: String, default: '' }
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  followerCount: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  rating: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },
  totalProgramViews: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true }
}, {
  timestamps: true
});

module.exports = mongoose.model('Creator', creatorSchema);
