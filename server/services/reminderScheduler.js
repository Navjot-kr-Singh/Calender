const Task = require('../models/Task');
const { users } = require('@clerk/clerk-sdk-node');
const { sendTaskReminderEmail } = require('./emailService');

// User email cache to avoid Clerk API rate limits
// Map of userId -> { email, expiresAt }
const emailCache = new Map();
const CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes cache

/**
 * Retrieves the user's email address from cache or queries Clerk API
 * @param {string} userId 
 */
async function getUserEmail(userId) {
  const cached = emailCache.get(userId);
  const now = Date.now();

  if (cached && cached.expiresAt > now) {
    return cached.email;
  }

  try {
    const user = await users.getUser(userId);
    const email = user.emailAddresses && user.emailAddresses[0] ? user.emailAddresses[0].emailAddress : null;
    
    if (email) {
      emailCache.set(userId, {
        email,
        expiresAt: now + CACHE_TTL_MS
      });
    }
    return email;
  } catch (error) {
    console.error(`Error fetching user details from Clerk for ID ${userId}:`, error.message);
    // If we have an expired cache value, use it as a fallback rather than failing
    if (cached) {
      console.log(`Using cached email fallback for user ID ${userId}.`);
      return cached.email;
    }
    return null;
  }
}

// Priority rules configuration
const REMINDER_RULES = {
  Urgent: {
    startBeforeMs: 2 * 60 * 60 * 1000,   // 2 hours
    intervalMs: 15 * 60 * 1000,          // 15 minutes
    repeat: true
  },
  High: {
    startBeforeMs: 1 * 60 * 60 * 1000,   // 1 hour
    intervalMs: 30 * 60 * 1000,          // 30 minutes
    repeat: true
  },
  Medium: {
    startBeforeMs: 30 * 60 * 1000,        // 30 minutes
    intervalMs: null,                    // Once
    repeat: false
  },
  Low: {
    startBeforeMs: 15 * 60 * 1000,        // 15 minutes
    intervalMs: null,                    // Once
    repeat: false
  }
};

/**
 * Scan database for tasks requiring reminder emails and send them
 */
async function scanAndProcessReminders() {
  try {
    const now = new Date();
    // Scan up to 2.5 hours in advance (matches the maximum startBeforeMs window)
    const maxWindow = new Date(now.getTime() + 2.5 * 60 * 60 * 1000);

    // Find active tasks that have target times in the upcoming window
    const tasks = await Task.find({
      completed: false,
      $or: [
        { reminderTime: { $gte: now, $lte: maxWindow } },
        { deadline: { $gte: now, $lte: maxWindow } }
      ]
    });

    if (tasks.length === 0) return;

    for (const task of tasks) {
      const targetTime = task.reminderTime || task.deadline;
      if (!targetTime) continue;

      const priority = task.priority || 'Medium';
      const rule = REMINDER_RULES[priority] || REMINDER_RULES.Medium;
      
      const diffMs = targetTime.getTime() - now.getTime();
      
      // Make sure we are within the warning threshold
      if (diffMs <= rule.startBeforeMs && diffMs >= 0) {
        let shouldRemind = false;

        if (rule.repeat) {
          if (!task.lastReminderSentAt) {
            shouldRemind = true;
          } else {
            const timeSinceLast = now.getTime() - new Date(task.lastReminderSentAt).getTime();
            if (timeSinceLast >= rule.intervalMs) {
              shouldRemind = true;
            }
          }
        } else {
          // Send once
          if (!task.lastReminderSentAt) {
            shouldRemind = true;
          }
        }

        if (shouldRemind) {
          const email = await getUserEmail(task.userId);
          if (email) {
            const success = await sendTaskReminderEmail(email, task);
            if (success) {
              // Update lastReminderSentAt in DB immediately
              await Task.updateOne(
                { _id: task._id },
                { $set: { lastReminderSentAt: now } }
              );
            }
          } else {
            console.warn(`Could not retrieve email for user ID ${task.userId}. Skipping reminder for task: "${task.title}".`);
          }
        }
      }
    }
  } catch (error) {
    console.error('Error scanning or processing task reminders:', error);
  }
}

/**
 * Initializes and starts the background reminder checking thread
 */
function startReminderScheduler() {
  console.log('Background task email reminder scheduler initiated. Scanning every 60 seconds...');
  
  // Run checks every 60 seconds
  const intervalId = setInterval(scanAndProcessReminders, 60000);
  
  // Perform an initial scan on boot (after a 5s delay to let systems connect)
  setTimeout(scanAndProcessReminders, 5000);

  return intervalId;
}

module.exports = {
  startReminderScheduler
};
