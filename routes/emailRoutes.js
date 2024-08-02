const express = require('express');
const router = express.Router();
const emailController = require('../controllers/emailController');

router.post('/schedule-email', emailController.scheduleEmail);
router.get('/scheduled-emails', emailController.getScheduledEmails);
router.get('/scheduled-emails/:id', emailController.getScheduledEmail);
router.delete('/scheduled-emails/:id', emailController.cancelScheduledEmail);

module.exports = router;