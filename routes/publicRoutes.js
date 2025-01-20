const express = require("express");
const router = express.Router();
const Department = require("../models/Department");
const User = require("../models/User");

// Get all departments
router.get("/departments", async (req, res) => {
  try {
    const departments = await Department.find()
      .populate({
        path: 'doctors',
        select: 'name specialization profileImage availability',
        match: { isValidated: true } // Only return validated doctors
      });

    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching departments", 
      error: error.message 
    });
  }
});

// Get all doctors
router.get("/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: "Doctor",
      isValidated: true 
    })
    .select('name specialization profileImage department availability')
    .populate('department', 'name description');

    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching doctors", 
      error: error.message 
    });
  }
});

// Get doctors by department
router.get("/departments/:departmentId/doctors", async (req, res) => {
  try {
    const doctors = await User.find({ 
      role: "Doctor",
      department: req.params.departmentId,
      isValidated: true 
    })
    .select('name specialization profileImage availability')
    .populate('department', 'name description');

    res.status(200).json(doctors);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching doctors by department", 
      error: error.message 
    });
  }
});

// Get specific doctor's public info
router.get("/doctors/:id", async (req, res) => {
  try {
    const doctor = await User.findOne({ 
      _id: req.params.id,
      role: "Doctor",
      isValidated: true 
    })
    .select('name specialization profileImage department availability')
    .populate('department', 'name description');

    if (!doctor) {
      return res.status(404).json({ message: "Doctor not found" });
    }

    res.status(200).json(doctor);
  } catch (error) {
    res.status(500).json({ 
      message: "Error fetching doctor details", 
      error: error.message 
    });
  }
});

module.exports = router; 