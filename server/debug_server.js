console.log('1. Starting debug server...');
const path = require('path');
console.log('2. Loaded path module');
require('dotenv').config({ path: path.join(__dirname, '.env') });
console.log('3. Loaded dotenv config');
const express = require('express');
console.log('4. Loaded express');
const mongoose = require('mongoose');
console.log('5. Loaded mongoose');
const cors = require('cors');
console.log('6. Loaded cors');
const { ClerkExpressWithAuth } = require('@clerk/clerk-sdk-node');
console.log('7. Loaded Clerk');

const noteRoutes = require('./routes/noteRoutes');
console.log('8. Loaded noteRoutes');
const eventRoutes = require('./routes/eventRoutes');
console.log('9. Loaded eventRoutes');
const taskRoutes = require('./routes/taskRoutes');
console.log('10. Loaded taskRoutes');

const app = express();
console.log('11. Initialized express app');

app.use(cors());
app.use(express.json());
console.log('12. Mounted base middlewares');

app.use(ClerkExpressWithAuth());
console.log('13. Mounted ClerkExpressWithAuth');

app.use('/api/notes', noteRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/tasks', taskRoutes);
console.log('14. Mounted routes');

app.use((err, req, res, next) => {
  console.error('GLOBAL ERROR:', err.stack);
  res.status(401).send('Unauthenticated!');
});

const PORT = process.env.PORT || 4500;
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/calendar-notes";

console.log('15. Attempting to start express listener on port', PORT);
const server = app.listen(PORT, () => {
  console.log(`16. SUCCESS: Server running on port ${PORT}`);
});

console.log('17. Connecting to MongoDB Atlas...');
mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('18. SUCCESS: Connected to MongoDB');
  })
  .catch((err) => {
    console.error('19. ERROR: MongoDB connection error:', err);
  });
