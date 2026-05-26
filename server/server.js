const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '.env'), override: true });
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');

const noteRoutes = require('./routes/noteRoutes');
const eventRoutes = require('./routes/eventRoutes');
const taskRoutes = require('./routes/taskRoutes');
const { startReminderScheduler } = require('./services/reminderScheduler');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Strict Auth Middleware: Will attach req.auth if token is valid, otherwise unauthenticated.
// We use ClerkExpressWithAuth so we can handle the 401 locally in routes if req.auth.userId is missing
app.use(ClerkExpressWithAuth());

// Routes
app.use('/api/notes', noteRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);

// Global Error Handler
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(401).send('Unauthenticated!');
});

// Start Express server immediately
const PORT = process.env.PORT || 4500;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/calendar-notes";

const server = app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

// Connect to MongoDB in the background
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB');
    startReminderScheduler();
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
  });
