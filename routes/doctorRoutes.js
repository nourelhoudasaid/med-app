// routes/doctorRoutes.js
const express = require('express');
const multer = require('multer');
const Doctor = require('./models/Doctor');
const router = express.Router();
const path = require('path');
const User = require('../models/user');
s

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Destination folder for uploaded images
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save file with current timestamp to avoid conflicts
  }
});
const upload = multer({ storage: storage });

// Create a new doctor with image upload
router.post('/register', upload.single('image'), async (req, res) => {
  const { name, specialty, availableTimes } = req.body;
const role = "Doctor"
  try {
    const doctor = new User({
      name,
      specialty,
      role,
      availableTimes: JSON.parse(availableTimes), // Assuming availableTimes is sent as JSON string
      image: req.file ? req.file.path : null, // Store the uploaded image path
    });

    await doctor.save();
    res.status(201).json({ message: 'Doctor created successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get all doctors
router.get('/', async (req, res) => {
  try {
    const doctors = await Doctor.find();
    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Get doctor by ID
router.get('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Update doctor by ID
router.put('/:id', upload.single('image'), async (req, res) => {
  const { name, specialty, availableTimes } = req.body;

  try {
    const doctor = await Doctor.findById(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }

    doctor.name = name || doctor.name;
    doctor.specialty = specialty || doctor.specialty;
    doctor.availableTimes = availableTimes ? JSON.parse(availableTimes) : doctor.availableTimes;
    doctor.image = req.file ? req.file.path : doctor.image; // Update image if a new one is uploaded

    await doctor.save();
    res.status(200).json({ message: 'Doctor updated successfully', doctor });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

// Delete doctor by ID
router.delete('/:id', async (req, res) => {
  try {
    const doctor = await Doctor.findByIdAndDelete(req.params.id);
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found' });
    }
    res.status(200).json({ message: 'Doctor deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});

module.exports = router;
