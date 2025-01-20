// routes/doctorRoutes.js
const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/appointment");
const { upload } = require('../config/cloudinary');
const mongoose = require('mongoose');
const { authenticateUser } = require('../middleware/auth');

// Update the upload middleware configuration
const uploadFields = upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'diplomaImage', maxCount: 1 }
]);

// Create doctor
router.post("/register", uploadFields, async (req, res) => {
  try {
    const {
      name,
      email,
      password,
      phoneNumber,
      CIN,
      specialization,
      department,
      availability
    } = req.body;

    const doctor = new User({
      name,
      email,
      password,
      phoneNumber,
      CIN,
      role: "Doctor",
      specialization,
      department,
      availability: JSON.parse(availability),
      profileImage: req.files?.profileImage?.[0]?.path,
      diplomaImage: req.files?.diplomaImage?.[0]?.path,
      isValidated: false
    });

    await doctor.save();
    res.status(201).json({ message: "Doctor registered successfully", doctor });
  } catch (error) {
    res.status(500).json({ message: "Error registering doctor", error: error.message });
  }
});

// Get all doctors
router.get("/", async (req, res) => {
  try {
    const doctors = await User.find({ role: "Doctor" })
      .lean();

    // Transform the data to include only necessary fields
    const formattedDoctors = doctors.map(doctor => ({
      _id: doctor._id,
      name: doctor.name,
      email: doctor.email,
      specialization: doctor.specialization,
      availability: doctor.availability,
      isValidated: doctor.isValidated,
      profileImage: doctor.profileImage,
      diplomaImage: doctor.diplomaImage
    }));

    res.status(200).json(formattedDoctors);
  } catch (error) {
    console.error('Error fetching doctors:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Get doctor by ID
router.get("/:id", async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Update doctor by ID
router.put("/:id", uploadFields, async (req, res) => {
  try {
    const { name, specialty, availableTimes } = req.body;
    const doctor = await User.findById(req.params.id);

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Update basic fields
    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.availableTimes = availableTimes ? JSON.parse(availableTimes) : doctor.availableTimes;

    // Update images if provided
    if (req.files) {
      if (req.files.profileImage) {
        doctor.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.diplomaImage) {
        doctor.diplomaImage = req.files.diplomaImage[0].path;
      }
    }

    await doctor.save();
    res.status(200).json({ message: "Doctor updated successfully", doctor });
  } catch (error) {
    console.error('Doctor update error:', error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
});

// Delete doctor by ID
router.delete("/:id", async (req, res) => {
  try {
    const doctor = await User.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }
    res.status(200).json({ message: "Doctor deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
  }
});

// Get doctor availability
router.get('/:id/availability', async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id)
      .select('availability')
      .lean();

    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    res.json(doctor.availability);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Update doctor availability
router.put('/:id/availability', authenticateUser, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.availability = req.body.availability;
    await doctor.save();

    res.json(doctor);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get doctor statistics
router.get('/:id/stats', authenticateUser, async (req, res) => {
  try {
    const doctorId = req.params.id;

    const stats = await Appointment.aggregate([
      { $match: { doctor: mongoose.Types.ObjectId(doctorId) } },
      {
        $group: {
          _id: null,
          totalAppointments: { $sum: 1 },
          confirmedAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Confirmed'] }, 1, 0] }
          },
          cancelledAppointments: {
            $sum: { $cond: [{ $eq: ['$status', 'Cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    res.json(stats[0] || { totalAppointments: 0, confirmedAppointments: 0, cancelledAppointments: 0 });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get doctor's patients (unique patients from appointments)
router.get("/:id/patients", authenticateUser, async (req, res) => {
  try {
    // Find all appointments for this doctor
    const appointments = await Appointment.find({ doctor: req.params.id })
      .populate({
        path: 'patient',
        select: 'name email phoneNumber CIN medicalHistory'
      })
      .lean();

    // Extract unique patients
    const uniquePatients = Array.from(
      new Map(
        appointments.map(app => [app.patient._id.toString(), app.patient])
      ).values()
    );

    res.status(200).json(uniquePatients);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching doctor's patients", 
      error: error.message 
    });
  }
});

// Get doctor's appointments
router.get("/:id/appointments", authenticateUser, async (req, res) => {
  try {
    const appointments = await Appointment.find({ doctor: req.params.id })
      .populate('patient', 'name email phoneNumber CIN medicalHistory')
      .populate('doctor', 'name email specialization availability')
      .populate('department', 'name description')
      .sort({ appointmentDate: 'asc' })
      .lean();

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching doctor's appointments", 
      error: error.message 
    });
  }
});

// Add this endpoint after your existing routes
router.post('/:id/availability', authenticateUser, async (req, res) => {
  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor || doctor.role !== 'Doctor') {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    const { availability } = req.body;
    
    // Validate availability data structure
    if (!Array.isArray(availability)) {
      return res.status(400).json({ 
        message: 'Availability must be an array of day schedules' 
      });
    }

    // Validate each day's data
    const validDays = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    const isValid = availability.every(day => {
      return (
        validDays.includes(day.day) &&
        Array.isArray(day.slots) &&
        day.slots.every(slot => typeof slot.time === 'string')
      );
    });

    if (!isValid) {
      return res.status(400).json({
        message: 'Invalid availability format',
        format: {
          availability: [{
            day: 'Monday-Sunday',
            slots: [{ time: 'HH:MM', isBooked: false }]
          }]
        }
      });
    }

    // Update doctor's availability
    doctor.availability = availability;
    await doctor.save();

    res.status(200).json({
      message: 'Availability updated successfully',
      availability: doctor.availability
    });
  } catch (error) {
    console.error('Error updating availability:', error);
    res.status(500).json({ 
      message: 'Error updating availability', 
      error: error.message 
    });
  }
});

module.exports = router;
