const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Department = require("../models/Department");
const Appointment = require("../models/Appointment");
const twilio = require('twilio');
const bcrypt = require('bcrypt');
const { authenticateUser, authorizePatient } = require("../middleware/auth");
const generateCredentials = require('../utils/generateCredentials');
const { sendConfirmationEmail } = require('../services/emailService');

// Middleware to check if the user is an admin
const isAdmin = (req, res, next) => {
  if (req.user && req.user.role === "Admin") {
    next();
  } else {
    res.status(403).json({ message: "Access denied. Admin only." });
  }
};

// Route to change doctor verification status
router.put("/verify-doctor/:id", authenticateUser, isAdmin, async (req, res) => {
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
        password: await bcrypt.hash(password, 8)
      });

      // Try to send SMS if Twilio is configured
      if (process.env.TWILIO_ACCOUNT_SID && 
          process.env.TWILIO_AUTH_TOKEN && 
          process.env.TWILIO_PHONE_NUMBER) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await twilioClient.messages.create({
            body: `Your account has been validated. Username: ${username}, Password: ${password}`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: doctor.phoneNumber
          });
        } catch (twilioError) {
          console.error('SMS notification failed:', twilioError);
          // Continue execution even if SMS fails
        }
      }

      // Send email notification
      try {
        await sendConfirmationEmail(
          doctor.email,
          'Account Validated',
          `Your account has been validated. Username: ${username}, Password: ${password}`
        );
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Continue execution even if email fails
      }

      res.json({
        message: "Doctor verified and credentials sent",
        doctor: { ...doctor.toObject(), isValidated, username }
      });
    } else {
      // Update validation status for rejection
      await User.findByIdAndUpdate(req.params.id, { isValidated });

      // Try to send SMS if Twilio is configured
      if (process.env.TWILIO_ACCOUNT_SID && 
          process.env.TWILIO_AUTH_TOKEN && 
          process.env.TWILIO_PHONE_NUMBER) {
        try {
          const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
          await twilioClient.messages.create({
            body: `Your account validation was unsuccessful. Please contact support for more information.`,
            from: process.env.TWILIO_PHONE_NUMBER,
            to: doctor.phoneNumber
          });
        } catch (twilioError) {
          console.error('SMS notification failed:', twilioError);
          // Continue execution even if SMS fails
        }
      }

      // Send email notification
      try {
        await sendConfirmationEmail(
          doctor.email,
          'Account Validation Unsuccessful',
          `Your account validation was unsuccessful. Please contact support for more information.`
        );
      } catch (emailError) {
        console.error('Email notification failed:', emailError);
        // Continue execution even if email fails
      }

      res.json({
        message: "Doctor verification denied",
        doctor: { ...doctor.toObject(), isValidated }
      });
    }
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

// Get overall statistics
router.get('/stats', authenticateUser, isAdmin, async (req, res) => {
  try {
    const stats = await Promise.all([
      User.countDocuments({ role: 'Doctor' }),
      User.countDocuments({ role: 'Patient' }),
      Appointment.countDocuments(),
      Department.countDocuments()
    ]);

    const appointmentStats = await Appointment.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);

    res.json({
      totalDoctors: stats[0],
      totalPatients: stats[1],
      totalAppointments: stats[2],
      totalDepartments: stats[3],
      appointmentsByStatus: appointmentStats
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add this route after your existing routes
router.put("/validate-user/:id", authenticateUser, isAdmin, async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const { isValidated, validationMessage } = req.body;
    
    // Update user validation status
    user.isValidated = isValidated;
    await user.save();

    // Prepare notification message
    const notificationMessage = isValidated 
      ? "Your profile has been validated successfully!"
      : `Your profile validation was unsuccessful. ${validationMessage || 'Please contact support for more information.'}`;

    // If using Twilio for SMS notifications
    try {
      const twilioClient = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
      await twilioClient.messages.create({
        body: notificationMessage,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: user.phoneNumber
      });
    } catch (error) {
      console.error('SMS notification error:', error);
    }

    // Send email notification
    try {
      await sendConfirmationEmail(
        user.email,
        isValidated ? 'Profile Validated' : 'Profile Validation Update',
        notificationMessage
      );
    } catch (error) {
      console.error('Email notification error:', error);
    }

    res.status(200).json({
      message: `User ${isValidated ? 'validated' : 'validation updated'} successfully`,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isValidated: user.isValidated
      }
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error updating user validation status", 
      error: error.message 
    });
  }
});

module.exports = router;
