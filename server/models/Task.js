const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  priority: {
    type: String,
    enum: ['Low', 'Medium', 'High', 'Urgent'],
    default: 'Medium'
  },
  priorityWeight: {
    type: Number,
    default: 2 // Low=1, Medium=2, High=3, Urgent=4 (used for backend sorting)
  },
  deadline: {
    type: Date
  },
  reminderTime: {
    type: Date
  },
  completed: {
    type: Boolean,
    default: false
  },
  date: {
    type: String, // String representation of the date (e.g. 'YYYY-MM-DD')
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  recurring: {
    type: String,
    enum: ['none', 'daily', 'weekly', 'monthly'],
    default: 'none'
  },
  userId: {
    type: String,
    required: true,
    index: true
  },
  lastReminderSentAt: {
    type: Date
  }
}, { timestamps: true });

// Compound index on userId and date to optimize queries
taskSchema.index({ userId: 1, date: 1 });

module.exports = mongoose.model('Task', taskSchema);
