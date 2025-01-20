const express = require("express");
const router = express.Router();
const MedicalHistory = require("../models/MedicalHistory");
const { authenticateUser } = require("../middleware/auth");
const { upload } = require('../config/cloudinary');

// Create medical history record
router.post("/", authenticateUser, upload.array('attachments'), async (req, res) => {
  try {
    const {
      patient,
      doctor,
      appointment,
      diagnosis,
      prescription,
      notes,
      vitalSigns,
      followUpDate
    } = req.body;

    // Handle file uploads if any
    const attachments = req.files?.map(file => ({
      type: file.path,
      description: file.originalname
    }));

    const medicalHistory = new MedicalHistory({
      patient,
      doctor,
      appointment,
      diagnosis,
      prescription: prescription ? JSON.parse(prescription) : undefined,
      notes,
      attachments,
      vitalSigns: vitalSigns ? JSON.parse(vitalSigns) : undefined,
      followUpDate
    });

    await medicalHistory.save();

    res.status(201).json({
      message: "Medical history record created successfully",
      medicalHistory
    });
  } catch (error) {
    console.error("Error creating medical history:", error);
    res.status(500).json({
      message: "Error creating medical history record",
      error: error.message
    });
  }
});

// Get doctor's patients' medical histories
router.get("/doctor/patients", authenticateUser, async (req, res) => {
  try {
    // Ensure the user is a doctor
    if (req.user.role !== 'Doctor') {
      return res.status(403).json({ message: "Access denied. Doctors only." });
    }

    const medicalHistories = await MedicalHistory.find({ doctor: req.user._id })
      .populate('patient', 'name email phoneNumber CIN')
      .populate('appointment', 'appointmentDate reason')
      .sort({ createdAt: -1 });

    // Group medical histories by patient
    const groupedHistories = medicalHistories.reduce((acc, history) => {
      const patientId = history.patient._id.toString();
      if (!acc[patientId]) {
        acc[patientId] = {
          patient: history.patient,
          histories: []
        };
      }
      acc[patientId].histories.push(history);
      return acc;
    }, {});

    res.status(200).json(Object.values(groupedHistories));
  } catch (error) {
    res.status(500).json({
      message: "Error fetching medical histories",
      error: error.message
    });
  }
});

// Get patient's medical history
router.get("/patient/:patientId", authenticateUser, async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.find({ patient: req.params.patientId })
      .populate('doctor', 'name specialization')
      .populate('appointment', 'appointmentDate')
      .sort({ createdAt: -1 });

    res.status(200).json(medicalHistory);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching medical history",
      error: error.message
    });
  }
});

// Get specific medical history record
router.get("/:id", authenticateUser, async (req, res) => {
  try {
    const medicalHistory = await MedicalHistory.findById(req.params.id)
      .populate('doctor', 'name specialization')
      .populate('patient', 'name')
      .populate('appointment', 'appointmentDate');

    if (!medicalHistory) {
      return res.status(404).json({ message: "Medical history record not found" });
    }

    res.status(200).json(medicalHistory);
  } catch (error) {
    res.status(500).json({
      message: "Error fetching medical history record",
      error: error.message
    });
  }
});

// Update medical history record
router.put("/:id", authenticateUser, upload.array('attachments'), async (req, res) => {
  try {
    const {
      diagnosis,
      prescription,
      notes,
      vitalSigns,
      followUpDate
    } = req.body;

    // Handle new file uploads
    const newAttachments = req.files?.map(file => ({
      type: file.path,
      description: file.originalname
    }));

    const medicalHistory = await MedicalHistory.findById(req.params.id);
    if (!medicalHistory) {
      return res.status(404).json({ message: "Medical history record not found" });
    }

    // Update fields
    medicalHistory.diagnosis = diagnosis || medicalHistory.diagnosis;
    medicalHistory.prescription = prescription ? JSON.parse(prescription) : medicalHistory.prescription;
    medicalHistory.notes = notes || medicalHistory.notes;
    medicalHistory.vitalSigns = vitalSigns ? JSON.parse(vitalSigns) : medicalHistory.vitalSigns;
    medicalHistory.followUpDate = followUpDate || medicalHistory.followUpDate;

    // Add new attachments if any
    if (newAttachments?.length > 0) {
      medicalHistory.attachments = [...medicalHistory.attachments, ...newAttachments];
    }

    await medicalHistory.save();

    res.status(200).json({
      message: "Medical history record updated successfully",
      medicalHistory
    });
  } catch (error) {
    res.status(500).json({
      message: "Error updating medical history record",
      error: error.message
    });
  }
});

module.exports = router; 