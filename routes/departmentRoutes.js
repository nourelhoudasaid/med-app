const express = require('express');
const router = express.Router();
const Department = require('../models/Department');
const { authenticateUser } = require('../middleware/auth');

// Create department
router.post("/", authenticateUser, async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = new Department({ name, description });
    await department.save();
    res.status(201).json({ message: "Department created successfully", department });
  } catch (error) {
    res.status(500).json({ message: "Error creating department", error: error.message });
  }
});

// Get all departments
router.get("/", async (req, res) => {
  try {
    const departments = await Department.find()
      .populate('doctors', 'name email specialization')
      .lean();
    res.status(200).json(departments);
  } catch (error) {
    res.status(500).json({ message: "Error fetching departments", error: error.message });
  }
});

// Get department by ID
router.get("/:id", async (req, res) => {
  try {
    const department = await Department.findById(req.params.id)
      .populate('doctors', 'name email specialization');
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json(department);
  } catch (error) {
    res.status(500).json({ message: "Error fetching department", error: error.message });
  }
});

// Update department
router.put("/:id", authenticateUser, async (req, res) => {
  try {
    const { name, description } = req.body;
    const department = await Department.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    );
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json({ message: "Department updated successfully", department });
  } catch (error) {
    res.status(500).json({ message: "Error updating department", error: error.message });
  }
});

// Delete department
router.delete("/:id", authenticateUser, async (req, res) => {
  try {
    const department = await Department.findByIdAndDelete(req.params.id);
    if (!department) {
      return res.status(404).json({ message: "Department not found" });
    }
    res.status(200).json({ message: "Department deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting department", error: error.message });
  }
});

module.exports = router; 