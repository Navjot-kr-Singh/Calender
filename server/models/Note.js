const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  key: {
    type: String, // String representation of the date or range (e.g. 'calendar-notes-2026-04-08')
    required: true
  },
  content: {
    type: String,
    default: ""
  },
  tasks: [{
    id: String,
    text: String,
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

// A user should only have one note document per key
noteSchema.index({ userId: 1, key: 1 }, { unique: true });

module.exports = mongoose.model('Note', noteSchema);
