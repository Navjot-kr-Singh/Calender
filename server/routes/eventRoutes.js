const express = require('express');
const router = express.Router();
const Event = require('../models/Event');

// Get all events for the current user
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });
    
    const events = await Event.find({ userId }).sort({ createdAt: -1 });
    res.json(events);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create a new event
router.post('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { name, duration, description, isActive } = req.body;
    const newEvent = new Event({
      userId,
      name,
      duration,
      description,
      isActive
    });

    const savedEvent = await newEvent.save();
    res.status(201).json(savedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update an event
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const event = await Event.findOne({ _id: req.params.id, userId });
    if (!event) return res.status(404).json({ message: 'Event not found' });

    Object.assign(event, req.body);
    const updatedEvent = await event.save();
    res.json(updatedEvent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete an event
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const result = await Event.deleteOne({ _id: req.params.id, userId });
    if (result.deletedCount === 0) return res.status(404).json({ message: 'Event not found' });
    
    res.json({ message: 'Event deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
