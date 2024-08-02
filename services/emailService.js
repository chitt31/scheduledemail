const cron = require('node-cron');
const nodemailer = require('nodemailer');
const ScheduledEmail = require('../models/ScheduledEmail');

const transporter = nodemailer.createTransport({

  service: 'gmail',
  auth: {
    user: 'pdfdummy15@gmail.com',
    pass: 'plvi yida bsgp khbj'
  }
});

const scheduleEmail = (email) => {
  if (email.schedule.type === 'one-time') {
    const date = new Date(email.schedule.datetime);
    const now = new Date();
    if (date > now) {
      const delay = date.getTime() - now.getTime();
      setTimeout(() => sendEmail(email), delay);
    } else {
      console.log('Scheduled time is in the past. Sending immediately.');
      sendEmail(email);
    }
  } else if (email.schedule.type === 'recurring') {
    const cronExpression = getCronExpression(email.schedule);
    if (cronExpression) {
      cron.schedule(cronExpression, () => sendEmail(email));
    } else {
      console.error('Invalid recurrence schedule');
    }
  }
};

const sendEmail = async (email) => {
  try {
    await transporter.sendMail({
      from: 'your-email@gmail.com',
      to: email.recipient,
      subject: email.subject,
      text: email.body,
      attachments: email.attachments
    });
    email.status = 'sent';
    await email.save();
  } catch (error) {
    console.error('Failed to send email:', error);
    email.status = 'failed';
    await email.save();
  }
};

const getCronExpression = (schedule) => {
  if (schedule.type !== 'recurring') return null;

  const [hours, minutes] = schedule.time.split(':');
  
  switch (schedule.recurrence) {
    case 'daily':
      return `${minutes} ${hours} * * *`;
    case 'weekly':
      return `${minutes} ${hours} * * ${getDayNumber(schedule.day)}`;
    case 'monthly':
      return `${minutes} ${hours} ${schedule.day} * *`;
    case 'quarterly':
      return `${minutes} ${hours} ${schedule.day} */3 *`;
    default:
      return null;
  }
};

const getDayNumber = (day) => {
  const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  return days.indexOf(day.toLowerCase());
};

const startEmailScheduler = async () => {
  const pendingEmails = await ScheduledEmail.find({ status: 'pending' });
  pendingEmails.forEach(scheduleEmail);
};

const cancelScheduledEmail = (emailId) => {
  // Implement logic to cancel scheduled job
  // This might involve keeping track of scheduled jobs and their IDs
};

module.exports = {
  scheduleEmail,
  startEmailScheduler,
  cancelScheduledEmail
};