const express = require("express");
const router = express.Router();
const User = require("../models/User");
const Appointment = require("../models/Appointment");
const MedicalHistory = require("../models/MedicalHistory");
const Department = require("../models/Department");
const { authenticateUser } = require("../middleware/auth");
const { upload } = require('../config/cloudinary');

// ============ SPECIFIC ROUTES FIRST ============

// Create patient
router.post("/register", async (req, res) => {
  try {
    const { name, email, password, phoneNumber, CIN, medicalHistory } = req.body;

    const patient = new User({
      name,
      email,
      password,
      phoneNumber,
      CIN,
      role: "Patient",
      medicalHistory,
      isValidated: true // Patients are auto-validated
    });

    await patient.save();
    res.status(201).json({ message: "Patient registered successfully", patient });
  } catch (error) {
    console.error("Error in patient registration:", error);
    res.status(500).json({ 
      message: "Error registering patient", 
      error: error.message 
    });
  }
});

// Get all patients
router.get("/", authenticateUser, async (req, res) => {
  try {
    const patients = await User.find({ role: "Patient" })
      .select("-password")
      .lean();
    res.status(200).json(patients);
  } catch (error) {
    console.error("Error fetching patients:", error);
    res.status(500).json({ 
      message: "Error fetching patients", 
      error: error.message 
    });
  }
});

// Get patient profile
router.get("/profile", authenticateUser, async (req, res) => {
  try {
    const patient = await User.findById(req.user._id)
      .select("-password")
      .lean();
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching patient profile", 
      error: error.message 
    });
  }
});

// Get patient's appointments
router.get("/my-appointments", authenticateUser, async (req, res) => {
  try {
    const appointments = await Appointment.find({ patient: req.user._id })
      .populate('doctor', 'name email specialization profileImage')
      .populate('department', 'name description')
      .sort({ appointmentDate: -1 });

    res.status(200).json(appointments);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching patient appointments", 
      error: error.message 
    });
  }
});

// Get patient's medical history
router.get("/my-medical-history", authenticateUser, async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.find({ patient: req.user._id })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate reason')
      .sort({ createdAt: -1 });

    res.status(200).json(medicalHistory);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching medical history", 
      error: error.message 
    });
  }
});

// Book appointment
router.post("/book-appointment", authenticateUser, async (req, res) => {
  try {
    const { doctorId, appointmentDate, reason, departmentId } = req.body;

    // Validate if the selected time slot is available
    const doctor = await User.findById(doctorId);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    // Create the appointment
    const appointment = new Appointment({
      patient: req.user._id,
      doctor: doctorId,
      department: departmentId,
      appointmentDate,
      reason,
      status: 'Pending'
    });

    await appointment.save();

    // Populate the appointment details
    const populatedAppointment = await Appointment.findById(appointment._id)
      .populate('doctor', 'name email specialization')
      .populate('department', 'name description');

    res.status(201).json({ 
      message: "Appointment booked successfully", 
      appointment: populatedAppointment 
    });
  } catch (error) {
    res.status(500).json({ 
      message: "Error booking appointment", 
      error: error.message 
    });
  }
});

// Update patient profile
router.put("/profile", authenticateUser, async (req, res) => {
  try {
    const { name, phoneNumber, email } = req.body;
    const updatedPatient = await User.findByIdAndUpdate(
      req.user._id,
      { name, phoneNumber, email },
      { new: true }
    ).select("-password");

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Profile updated successfully",
      patient: updatedPatient
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating profile",
      error: error.message
    });
  }
});

// Update patient's profile picture
router.put("/profile-picture", authenticateUser, upload.single('profileImage'), async (req, res) => {
  try {
    // Ensure user is a patient
    if (req.user.role !== "Patient") {
      return res.status(403).json({ message: "Access denied. Patients only." });
    }

    if (!req.file) {
      return res.status(400).json({ message: "No profile image provided" });
    }

    const updatedPatient = await User.findByIdAndUpdate(
      req.user._id,
      { $set: { profileImage: req.file.path } },
      { new: true, runValidators: true }
    ).select('-password');

    if (!updatedPatient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    res.status(200).json({
      message: "Profile picture updated successfully",
      profileImage: updatedPatient.profileImage
    });
  } catch (error) {
    console.error('Error updating profile picture:', error);
    res.status(500).json({ 
      message: "Error updating profile picture", 
      error: error.message 
    });
  }
});

// ============ PARAMETERIZED ROUTES LAST ============

// Get patient by ID
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    const patient = await User.findOne({ 
      _id: req.params.id, 
      role: "Patient" 
    }).select("-password");
    
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json(patient);
  } catch (error) {
    console.error("Error fetching patient:", error);
    res.status(500).json({ 
      message: "Error fetching patient", 
      error: error.message 
    });
  }
});

// Update patient
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    const { name, phoneNumber, medicalHistory } = req.body;
    const patient = await User.findOneAndUpdate(
      { _id: req.params.id, role: "Patient" },
      { name, phoneNumber, medicalHistory },
      { new: true }
    ).select("-password");

    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json({ message: "Patient updated successfully", patient });
  } catch (error) {
    res.status(500).json({ message: "Error updating patient", error: error.message });
  }
});

// Delete patient
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    // Validate if the ID is a valid MongoDB ObjectId
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({ message: "Invalid patient ID format" });
    }

    const patient = await User.findOneAndDelete({ _id: req.params.id, role: "Patient" });
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }
    res.status(200).json({ message: "Patient deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting patient", error: error.message });
  }
});

module.exports = router;
