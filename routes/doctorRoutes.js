// routes/doctorRoutes.js
const express = require("express");
const multer = require("multer");
const router = express.Router();
const path = require("path");
const User = require("../models/User");

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/"); // Destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage: storage });

// Create a new doctor with image upload
router.post("/register", upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'diplomaImage', maxCount: 1 }
]), async (req, res) => {
  const { name, specialty, availableTimes } = req.body;
  const role = "Doctor";
  try {
    const doctor = new User({
      name,
      specialty,
      role,
      availableTimes: JSON.parse(availableTimes), // Assuming availableTimes is sent as JSON string
      profileImage: req.files['profileImage'] ? req.files['profileImage'][0].path : null,
      diplomaImage: req.files['diplomaImage'] ? req.files['diplomaImage'][0].path : null,
      isValidated: false, // valider par admin
    });

    await doctor.save();
    res.status(201).json({ message: "Doctor created successfully", doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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
      profileImage: doctor.profileImage
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
router.put("/:id", upload.fields([
  { name: 'profileImage', maxCount: 1 },
  { name: 'diplomaImage', maxCount: 1 }
]), async (req, res) => {
  const { name, specialty, availableTimes } = req.body;

  try {
    const doctor = await User.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.availableTimes = availableTimes
      ? JSON.parse(availableTimes)
      : doctor.availableTimes;
    if (req.files['profileImage']) {
      doctor.profileImage = req.files['profileImage'][0].path;
    }
    if (req.files['diplomaImage']) {
      doctor.diplomaImage = req.files['diplomaImage'][0].path;
    }

    await doctor.save();
    res.status(200).json({ message: "Doctor updated successfully", doctor });
  } catch (error) {
    res.status(500).json({ message: "Server error", error });
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

module.exports = router;
