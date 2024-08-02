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