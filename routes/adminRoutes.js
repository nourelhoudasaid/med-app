const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth");
const twilio = require('twilio');
//const emailService = require('../services/emailService'); // mamlthch
const generateCredentials = require('../utils/generateCredentials'); 
const bcrypt = require('bcrypt');

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

// Route to change doctor verification status
router.put("/verify-doctor/:id", authMiddleware, isAdmin, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    if (doctor.role !== "Doctor") {
      return res.status(400).json({ message: "User is not a doctor" });
    }

    const { isValidated } = req.body;
    
    if (isValidated) {
      // Generate credentials
      const { username, password } = generateCredentials();

      // Update user with new credentials and validation status
      await User.findByIdAndUpdate(req.params.id, { 
        isValidated, 
        username, 
        password: await bcrypt.hash(password, 8) // Hash the password
      });

      // Send credentials via SMS
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        body: `Your account has been validated. Username: ${username}, Password: ${password}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: doctor.phoneNumber
      });

      // Send credentials via email (commented out for now)
      /*
      await emailService.sendEmail(
        doctor.email,
        'Account Validated',
        `Your account has been validated. Username: ${username}, Password: ${password}`
      );
      */

      res.json({
        message: "Doctor verified and credentials sent",
        doctor: { ...doctor.toObject(), isValidated, username }
      });
    } else {
      // Update validation status
      await User.findByIdAndUpdate(req.params.id, { isValidated });

      // Send refusal message
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        body: `Your account validation was unsuccessful. Please contact support for more information.`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: doctor.phoneNumber
      });

      /*
      await emailService.sendEmail(
        doctor.email,
        'Account Validation Unsuccessful',
        `Your account validation was unsuccessful. Please contact support for more information.`
      );
      */

      res.json({
        message: "Doctor verification denied",
        doctor: { ...doctor.toObject(), isValidated }
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;
