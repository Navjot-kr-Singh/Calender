const mongoose = require('mongoose');

const MONGO_URI = "mongodb+srv://navjotkumarsingh81:vvvbbb@database.xe1zlml.mongodb.net/habit_tracker?retryWrites=true&w=majority";

console.log('Testing connection to:', MONGO_URI);

mongoose.connect(MONGO_URI, { serverSelectionTimeoutMS: 5000 })
  .then(() => {
    console.log('SUCCESS: Connected to MongoDB successfully!');
    process.exit(0);
  })
  .catch(err => {
    console.error('ERROR: Connection failed:', err.message);
    console.error(err);
    process.exit(1);
  });
