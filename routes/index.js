const express = require("express");
const router = express.Router();

// Import all route files
const doctorRoutes = require("./doctorRoutes");
const patientRoutes = require("./patientRoutes");
const appointmentRoutes = require("./appointmentRoutes");

// Mount the routes on specific paths
router.use("/api/doctors", doctorRoutes);
router.use("/api/patients", patientRoutes);
router.use("/api/appointments", appointmentRoutes);


module.exports = router;
