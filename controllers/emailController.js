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