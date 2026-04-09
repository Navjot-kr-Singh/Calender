const mongoose = require('mongoose');

const noteSchema = new mongoose.Schema({
  userId: { type: String, required: true, index: true },
  key: { type: String, required: true },
  content: { type: String, default: "" },
  tasks: [{
    id: String,
    text: String,
    description: { type: String, default: "" },
    completed: { type: Boolean, default: false }
  }]
}, { timestamps: true });

noteSchema.index({ userId: 1, key: 1 }, { unique: true });

// Guard: avoid re-compiling model on hot reload in serverless
module.exports = mongoose.models.Note || mongoose.model('Note', noteSchema);
