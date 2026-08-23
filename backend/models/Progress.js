const mongoose = require('mongoose');

const progressSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: Date, required: true, default: Date.now },
  
  weight: { type: Number },
  bmi: { type: Number },
  bodyFatPercentage: { type: Number },
  
  measurements: {
    chest: { type: Number },
    waist: { type: Number },
    hips: { type: Number },
    leftArm: { type: Number },
    rightArm: { type: Number },
    leftThigh: { type: Number },
    rightThigh: { type: Number },
    neck: { type: Number },
    shoulders: { type: Number }
  },
  
  photos: {
    front: { type: String },
    side: { type: String },
    back: { type: String }
  },
  
  notes: { type: String, default: '' }
}, {
  timestamps: true
});

progressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model('Progress', progressSchema);
