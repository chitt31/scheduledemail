# Scheduled Email

## Description

Scheduled Email is a Node.js application that allows you to schedule and send emails at specific times using Nodemailer and `cron`. Ideal for sending reminders, notifications, or other scheduled communications.

## Features

- Schedule emails to be sent at specific times and dates.
- Use Nodemailer for sending emails.
- Use `cron` for scheduling email tasks.
- Support for various email providers.
- Customizable email templates.
- Logging and error handling.

## Installation

1. Clone the repository:
    ```bash
    git clone https://github.com/chitt31/scheduledemail.git
    ```

2. Navigate to the project directory:
    ```bash
    cd scheduledemail
    ```

3. Install the required packages:
    ```bash
    npm install
    ```

## Configuration

1. Create a `.env` file in the root directory of the project.

2. Add your email provider credentials and configuration to the `.env` file. Example:
    ```env
    EMAIL_HOST=smtp.example.com
    EMAIL_PORT=587
    EMAIL_USER=your-email@example.com
    EMAIL_PASSWORD=your-email-password
    ```

## Usage

1. Start the application:
    ```bash
    npm start
    ```

2. this mainly schedules the mail . Example:
    ```javascript
    const ScheduledEmail = require('../models/ScheduledEmail');
const emailService = require('../services/emailService');

exports.scheduleEmail = async (req, res) => {
  try {
    let emailData;

    
    if (Object.keys(req.query).length > 0) {
      emailData = {
        recipient: req.query.recipient,
        subject: req.query.subject,
        body: req.query.body,
        schedule: {
          type: req.query.type,
          datetime: req.query.datetime,
          recurrence: req.query.recurrence,
          day: req.query.day,
          time: req.query.time,
          timezone: req.query.timezone || 'UTC'
        }
      };
    } else {
      emailData = req.body;
    }

    // Validate required fields
    if (!emailData.recipient || !emailData.subject || !emailData.body || !emailData.schedule || !emailData.schedule.type) {
      return res.status(400).json({ message: 'Missing required fields' });
    }

    // Validate and process schedule data
    if (emailData.schedule.type === 'one-time') {
      if (!emailData.schedule.datetime) {
        return res.status(400).json({ message: 'Datetime is required for one-time schedules' });
      }
      emailData.schedule.datetime = new Date(emailData.schedule.datetime);
      if (isNaN(emailData.schedule.datetime.getTime())) {
        return res.status(400).json({ message: 'Invalid datetime format' });
      }
    } else if (emailData.schedule.type === 'recurring') {
      if (!emailData.schedule.recurrence || !emailData.schedule.time) {
        return res.status(400).json({ message: 'Recurrence and time are required for recurring schedules' });
      }
      if (!['daily', 'weekly', 'monthly', 'quarterly'].includes(emailData.schedule.recurrence)) {
        return res.status(400).json({ message: 'Invalid recurrence type' });
      }
      if (emailData.schedule.recurrence !== 'daily' && !emailData.schedule.day) {
        return res.status(400).json({ message: 'Day is required for weekly, monthly, and quarterly recurrences' });
      }
    } else {
      return res.status(400).json({ message: 'Invalid schedule type' });
    }

    const newEmail = new ScheduledEmail(emailData);

    await newEmail.save();
    emailService.scheduleEmail(newEmail);
    res.status(201).json({ id: newEmail._id, message: 'Email scheduled successfully' });
  } catch (error) {
    console.error('Error scheduling email:', error);
    res.status(400).json({ message: error.message });
  }
};

exports.getScheduledEmails = async (req, res) => {
  try {
    const emails = await ScheduledEmail.find().select('-body -attachments');
    res.json(emails);
  } catch (error) {
    console.error('Error fetching scheduled emails:', error);
    res.status(500).json({ message: 'Error fetching scheduled emails' });
  }
};

exports.getScheduledEmail = async (req, res) => {
  try {
    const email = await ScheduledEmail.findById(req.params.id);
    if (!email) return res.status(404).json({ message: 'Email not found' });
    res.json(email);
  } catch (error) {
    console.error('Error fetching scheduled email:', error);
    res.status(500).json({ message: 'Error fetching scheduled email' });
  }
};

exports.cancelScheduledEmail = async (req, res) => {
  try {
    const email = await ScheduledEmail.findById(req.params.id);
    if (!email) return res.status(404).json({ message: 'Email not found' });
    
    await ScheduledEmail.findByIdAndDelete(req.params.id);
    emailService.cancelScheduledEmail(email._id);
    res.json({ message: 'Email scheduling cancelled successfully' });
  } catch (error) {
    console.error('Error cancelling scheduled email:', error);
    res.status(500).json({ message: 'Error cancelling scheduled email' });
  }
};
    ```
    3. model
    ```javascript
    const mongoose = require('mongoose');

const ScheduledEmailSchema = new mongoose.Schema({
  recipient: {
    type: String,
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  body: {
    type: String,
    required: true
  },
  attachments: [{
    filename: String,
    content: String
  }],
  schedule: {
    type: {
      type: String,
      enum: ['one-time', 'recurring'],
      required: true
    },
    recurrence: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'quarterly'],
      required: function() { return this.schedule.type === 'recurring'; }
    },
    day: {
      type: String,
      required: function() { return this.schedule.type === 'recurring' && ['weekly', 'monthly', 'quarterly'].includes(this.schedule.recurrence); }
    },
    time: {
      type: String,
      required: function() { return this.schedule.type === 'recurring'; }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    datetime: {
      type: Date,
      required: function() { return this.schedule.type === 'one-time'; }
    }
  },
  status: {
    type: String,
    enum: ['pending', 'sent', 'failed'],
    default: 'pending'
  }
});

module.exports = mongoose.model('ScheduledEmail', ScheduledEmailSchema);
    ```

4 . the services of email
``` javascript
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
  ```




