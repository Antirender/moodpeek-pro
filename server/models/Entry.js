const mongoose = require('mongoose');

const weatherSchema = new mongoose.Schema(
  {
    tempC: { type: Number },
    humidity: { type: Number },
    condition: { type: String },
  },
  { _id: false }
);

const entrySchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    date: { type: Date, required: true },
    mood: {
      type: String,
      required: true,
      enum: ['happy', 'calm', 'neutral', 'sad', 'stressed', 'VERY_GOOD', 'GOOD', 'NEUTRAL', 'BAD', 'VERY_BAD'],
    },
    city: { type: String, default: '' },
    tags: { type: [String], default: [] },
    activities: { type: [String], default: [] },
    note: { type: String, default: '' },
    weather: { type: weatherSchema, default: {} },
  },
  {
    timestamps: true,
    collection: 'p3_entries',
  }
);

entrySchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Entry', entrySchema);
