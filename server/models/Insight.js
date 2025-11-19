const mongoose = require('mongoose');

const insightSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    range: { type: String, required: true },
    topMood: { type: String },
    avgMood: { type: Number },
    grade: { type: String },
    positiveActivities: { type: [String], default: [] },
    negativeActivities: { type: [String], default: [] },
    bestDay: { type: String },
    worstDay: { type: String },
    trend: { type: String },
    weatherCorrelation: {
      temp: { type: Number },
      humidity: { type: Number },
    },
  },
  { timestamps: true }
);

insightSchema.index({ userId: 1, range: 1 }, { unique: true });

module.exports = mongoose.model('Insight', insightSchema);
