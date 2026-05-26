const nodemailer = require('nodemailer');

// Initialize SMTP Transporter
const host = process.env.SMTP_HOST || 'smtp.gmail.com';
const port = parseInt(process.env.SMTP_PORT || '587');
const user = process.env.SMTP_USER;
const pass = process.env.SMTP_PASS;
const from = process.env.SMTP_FROM || `"Calendra" <${user}>`;

const transporter = nodemailer.createTransport({
  host,
  port,
  secure: port === 465, // true for 465, false for other ports
  auth: {
    user,
    pass,
  },
});

// Priority theme mapping for beautiful HTML emails
const PRIORITY_THEMES = {
  Urgent: {
    gradient: 'linear-gradient(135deg, #e11d48 0%, #9f1239 100%)', // Crimson red
    badgeBg: '#ffe4e6',
    badgeText: '#9f1239',
    iconColor: '#e11d48'
  },
  High: {
    gradient: 'linear-gradient(135deg, #f97316 0%, #c2410c 100%)', // Orange/Red
    badgeBg: '#ffedd5',
    badgeText: '#c2410c',
    iconColor: '#f97316'
  },
  Medium: {
    gradient: 'linear-gradient(135deg, #eab308 0%, #a16207 100%)', // Amber
    badgeBg: '#fef9c3',
    badgeText: '#a16207',
    iconColor: '#eab308'
  },
  Low: {
    gradient: 'linear-gradient(135deg, #10b981 0%, #047857 100%)', // Emerald
    badgeBg: '#d1fae5',
    badgeText: '#047857',
    iconColor: '#10b981'
  }
};

/**
 * Sends a stylized HTML task reminder email to the user
 * @param {string} toEmail 
 * @param {object} task 
 */
async function sendTaskReminderEmail(toEmail, task) {
  // Fallback for missing SMTP details to prevent throwing errors on default settings
  if (!user || !pass || user === 'your-email@gmail.com') {
    console.warn(`SMTP email reminders are active, but credentials are not configured in server/.env. Skipping email dispatch to ${toEmail} for task "${task.title}".`);
    return false;
  }

  const theme = PRIORITY_THEMES[task.priority] || PRIORITY_THEMES.Medium;
  const deadlineStr = task.deadline ? new Date(task.deadline).toLocaleString() : 'No deadline set';
  const reminderStr = task.reminderTime ? new Date(task.reminderTime).toLocaleString() : 'No reminder set';
  
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>Task Reminder: ${task.title}</title>
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            background-color: #f3f4f6;
            margin: 0;
            padding: 40px 20px;
          }
          .email-card {
            max-width: 550px;
            margin: 0 auto;
            background-color: #ffffff;
            border-radius: 24px;
            box-shadow: 0 10px 25px -5px rgba(0, 0, 0, 0.05), 0 8px 10px -6px rgba(0, 0, 0, 0.05);
            overflow: hidden;
          }
          .header-banner {
            background: ${theme.gradient};
            padding: 40px 30px;
            text-align: center;
            color: #ffffff;
          }
          .header-banner h1 {
            margin: 0;
            font-size: 24px;
            font-weight: 800;
            letter-spacing: -0.025em;
          }
          .header-banner p {
            margin: 8px 0 0 0;
            font-size: 14px;
            opacity: 0.9;
            font-weight: 500;
          }
          .content-body {
            padding: 40px 30px;
          }
          .task-title {
            font-size: 20px;
            font-weight: 700;
            color: #111827;
            margin: 0 0 16px 0;
            letter-spacing: -0.01em;
          }
          .priority-badge {
            display: inline-block;
            background-color: ${theme.badgeBg};
            color: ${theme.badgeText};
            font-size: 12px;
            font-weight: 700;
            padding: 6px 16px;
            border-radius: 9999px;
            margin-bottom: 20px;
            text-transform: uppercase;
            letter-spacing: 0.05em;
          }
          .task-desc {
            font-size: 15px;
            line-height: 1.6;
            color: #4b5563;
            margin: 0 0 30px 0;
          }
          .meta-section {
            background-color: #f9fafb;
            border: 1px solid #f3f4f6;
            border-radius: 16px;
            padding: 20px;
            margin-bottom: 30px;
          }
          .meta-row {
            display: flex;
            margin-bottom: 12px;
            font-size: 14px;
          }
          .meta-row:last-child {
            margin-bottom: 0;
          }
          .meta-label {
            width: 120px;
            font-weight: 600;
            color: #6b7280;
          }
          .meta-val {
            color: #1f2937;
            font-weight: 500;
          }
          .action-container {
            text-align: center;
          }
          .action-btn {
            display: inline-block;
            background-color: #1e4eb8;
            color: #ffffff;
            font-size: 15px;
            font-weight: 700;
            text-decoration: none;
            padding: 14px 32px;
            border-radius: 14px;
            box-shadow: 0 4px 12px rgba(30, 78, 184, 0.25);
            transition: all 0.2s;
          }
          .footer-section {
            text-align: center;
            font-size: 12px;
            color: #9ca3af;
            padding: 30px 0;
          }
        </style>
      </head>
      <body>
        <div class="email-card">
          <div class="header-banner">
            <h1>Calendra Task Reminder</h1>
            <p>Stay on track with your schedule</p>
          </div>
          <div class="content-body">
            <span class="priority-badge">${task.priority} Priority</span>
            <h2 class="task-title">${task.title}</h2>
            <p class="task-desc">${task.description || 'No additional description provided.'}</p>
            
            <div class="meta-section">
              <div class="meta-row">
                <span class="meta-label">Task Date:</span>
                <span class="meta-val">${task.date}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Due Time:</span>
                <span class="meta-val">${deadlineStr}</span>
              </div>
              <div class="meta-row">
                <span class="meta-label">Reminder:</span>
                <span class="meta-val">${reminderStr}</span>
              </div>
            </div>
            
            <div class="action-container">
              <a href="http://localhost:5173/schedule" class="action-btn">View My Schedule</a>
            </div>
          </div>
        </div>
        <div class="footer-section">
          &copy; 2026 Calendra App. All rights reserved.<br>
          You are receiving this because you set a reminder on Calendra.
        </div>
      </body>
    </html>
  `;

  try {
    const info = await transporter.sendMail({
      from,
      to: toEmail,
      subject: `⏰ [${task.priority}] Calendra Reminder: "${task.title}"`,
      html: htmlContent,
    });
    console.log(`Email reminder sent successfully to ${toEmail} for task: "${task.title}". Message ID: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Failed to send email reminder to ${toEmail} for task "${task.title}":`, error);
    return false;
  }
}

module.exports = {
  sendTaskReminderEmail
};
