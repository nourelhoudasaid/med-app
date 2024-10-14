const express = require("express");
const router = express.Router();
const User = require("../models/User");
const authMiddleware = require("../middleware/auth"); // Assuming you have an auth middleware

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

    doctor.isValidated = !doctor.isValidated; // Toggle the validation status
    await doctor.save();

    res.json({ message: "Doctor verification status updated", doctor });
  } catch (error) {
    res.status(500).json({ message: "Server Error", error: error.message });
  }
});

module.exports = router;

