const express = require('express');
const router = express.Router();
const Note = require('../models/Note');

// Optional: Import Clerk auth verification middleware if strict backend verification is desired. 
// For now we map based on the req.auth object that clerk middleware provides on server.js.

// GET a note by key
router.get('/:key', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const key = req.params.key;
    const note = await Note.findOne({ userId, key });
    
    if (note) {
      res.json({ content: note.content, tasks: note.tasks || [] });
    } else {
      res.json({ content: "", tasks: [] });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

// POST/PUT to upsert a note by key
router.post('/:key', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: "Unauthorized" });

    const key = req.params.key;
    const { content, tasks } = req.body;

    // Upsert the note
    const updatedNote = await Note.findOneAndUpdate(
      { userId, key },
      { content, tasks: tasks || [] },
      { new: true, upsert: true }
    );

    res.json({ message: "Saved successfully", note: updatedNote });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
});

module.exports = router;
