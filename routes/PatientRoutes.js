const express = require("express");
const router = express.Router();
const User = require("../models/User");

// @desc    Get all patients
// @route   GET /api/patients
// @access  Public
router.get("/", async (req, res) => {
  try {
    const patients = await User.find().populate("appointments");
    res.json(patients);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// @desc    Get single patient by ID
// @route   GET /api/patients/:id
// @access  Public
router.get("/:id", async (req, res) => {
  try {
    const patient = await User.findById(req.params.id).populate("appointments");
    if (!patient) return res.status(404).json({ message: "Patient not found" });
    res.json(patient);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// @desc    Create new patient
// @route   POST /api/patients
// @access  Public
router.post("/", async (req, res) => {
  const { name, email, phone } = req.body;

  if (!name || !email || !phone) {
    return res
      .status(400)
      .json({ message: "Please provide all required fields" });
  }

  try {
    const existingPatient = await User.findOne({ email });
    if (existingPatient) {
      return res
        .status(400)
        .json({ message: "Patient with this email already exists" });
    }

    const newPatient = new User({ name, email, phone });
    const savedPatient = await newPatient.save();
    res.status(201).json(savedPatient);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// @desc    Update patient by ID
// @route   PUT /api/patients/:id
// @access  Public
router.put("/:id", async (req, res) => {
  const { name, email, phone } = req.body;

  try {
    const patient = await User.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    patient.name = name || patient.name;
    patient.email = email || patient.email;
    patient.phone = phone || patient.phone;

    const updatedPatient = await patient.save();
    res.json(updatedPatient);
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

// @desc    Delete patient by ID
// @route   DELETE /api/patients/:id
// @access  Public
router.delete("/:id", async (req, res) => {
  try {
    const patient = await User.findById(req.params.id);
    if (!patient) {
      return res.status(404).json({ message: "Patient not found" });
    }

    await patient.remove();
    res.json({ message: "Patient removed" });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error });
  }
});

module.exports = router;
