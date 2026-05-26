const express = require('express');
const router = express.Router();
const Task = require('../models/Task');

// Priority weight mapping
const PRIORITY_MAP = {
  Urgent: 4,
  High: 3,
  Medium: 2,
  Low: 1
};

// Helper function to shift dates for recurring tasks
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const addMonths = (date, months) => {
  const result = new Date(date);
  result.setMonth(result.getMonth() + months);
  return result;
};

const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

// GET all tasks for the logged in user with filters, search, sorting and pagination
router.get('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { priority, completed, upcoming, search, startDate, endDate, sortBy, page = 1, limit = 50 } = req.query;

    const query = { userId };

    if (priority) {
      query.priority = priority;
    }

    if (completed !== undefined) {
      query.completed = completed === 'true';
    }

    if (upcoming === 'true') {
      query.deadline = { $gte: new Date() };
    }

    if (startDate && endDate) {
      query.date = { $gte: startDate, $lte: endDate };
    } else if (startDate) {
      query.date = { $gte: startDate };
    } else if (endDate) {
      query.date = { $lte: endDate };
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } }
      ];
    }

    let sortOptions = {};
    if (sortBy === 'priority') {
      sortOptions.priorityWeight = -1;
      sortOptions.createdAt = -1;
    } else if (sortBy === 'deadline') {
      sortOptions.deadline = 1;
      sortOptions.createdAt = -1;
    } else if (sortBy === 'newest') {
      sortOptions.createdAt = -1;
    } else {
      // Default to sorting by date, then priority, then newest
      sortOptions.date = 1;
      sortOptions.priorityWeight = -1;
      sortOptions.createdAt = -1;
    }

    const skipIndex = (page - 1) * limit;

    const tasks = await Task.find(query)
      .sort(sortOptions)
      .skip(skipIndex)
      .limit(Number(limit));

    const total = await Task.countDocuments(query);

    res.json({
      tasks,
      total,
      page: Number(page),
      pages: Math.ceil(total / limit)
    });
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET tasks for a specific date
router.get('/date/:date', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const date = req.params.date;
    const tasks = await Task.find({ userId, date }).sort({ priorityWeight: -1, createdAt: -1 });
    res.json(tasks);
  } catch (error) {
    console.error('Error fetching tasks by date:', error);
    res.status(500).json({ message: error.message });
  }
});

// GET a single task by ID
router.get('/:id', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const task = await Task.findOne({ _id: req.params.id, userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    res.json(task);
  } catch (error) {
    console.error('Error fetching task:', error);
    res.status(500).json({ message: error.message });
  }
});

// POST to create a task
router.post('/', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const { title, description, priority, deadline, reminderTime, completed, date, tags, recurring } = req.body;
    
    if (!title || !date) {
      return res.status(400).json({ message: 'Title and date are required fields.' });
    }

    const priorityWeight = PRIORITY_MAP[priority] || 2;

    const newTask = new Task({
      userId,
      title,
      description,
      priority: priority || 'Medium',
      priorityWeight,
      deadline,
      reminderTime,
      completed: completed || false,
      date,
      tags: tags || [],
      recurring: recurring || 'none'
    });

    const savedTask = await newTask.save();
    res.status(201).json(savedTask);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(400).json({ message: error.message });
  }
});

// PATCH to update a task (includes recurring progression logic)
router.patch('/:id', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const task = await Task.findOne({ _id: req.params.id, userId });
    if (!task) return res.status(404).json({ message: 'Task not found' });

    const originalCompleted = task.completed;
    const updates = req.body;

    if (updates.priority) {
      updates.priorityWeight = PRIORITY_MAP[updates.priority] || 2;
    }

    // Apply updates
    Object.assign(task, updates);
    const updatedTask = await task.save();

    // Recurrence logic: if task is marked completed now AND was not completed before AND is recurring
    if (updatedTask.completed && !originalCompleted && updatedTask.recurring !== 'none') {
      try {
        const currentDateObj = new Date(updatedTask.date + 'T00:00:00');
        let nextDateObj;

        if (updatedTask.recurring === 'daily') {
          nextDateObj = addDays(currentDateObj, 1);
        } else if (updatedTask.recurring === 'weekly') {
          nextDateObj = addDays(currentDateObj, 7);
        } else if (updatedTask.recurring === 'monthly') {
          nextDateObj = addMonths(currentDateObj, 1);
        }

        if (nextDateObj) {
          const nextDateStr = formatDate(nextDateObj);

          let nextDeadline = null;
          if (updatedTask.deadline) {
            const diffTime = new Date(updatedTask.deadline).getTime() - currentDateObj.getTime();
            nextDeadline = new Date(nextDateObj.getTime() + diffTime);
          }

          let nextReminder = null;
          if (updatedTask.reminderTime) {
            const diffTime = new Date(updatedTask.reminderTime).getTime() - currentDateObj.getTime();
            nextReminder = new Date(nextDateObj.getTime() + diffTime);
          }

          // Create next recurrence task
          const nextTask = new Task({
            userId,
            title: updatedTask.title,
            description: updatedTask.description,
            priority: updatedTask.priority,
            priorityWeight: updatedTask.priorityWeight,
            deadline: nextDeadline,
            reminderTime: nextReminder,
            completed: false,
            date: nextDateStr,
            tags: updatedTask.tags,
            recurring: updatedTask.recurring
          });

          await nextTask.save();

          // Stop the completed task from recurring again in the future
          updatedTask.recurring = 'none';
          await updatedTask.save();
        }
      } catch (recurrenceErr) {
        console.error('Failed to spawn recurring task occurrence:', recurrenceErr);
        // Note: We don't fail the request since the main update was successful
      }
    }

    res.json(updatedTask);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(400).json({ message: error.message });
  }
});

// DELETE a task
router.delete('/:id', async (req, res) => {
  try {
    const userId = req.auth.userId;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const result = await Task.deleteOne({ _id: req.params.id, userId });
    if (result.deletedCount === 0) {
      return res.status(404).json({ message: 'Task not found' });
    }

    res.json({ message: 'Task deleted successfully' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
