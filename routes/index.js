const express = require("express");
const router = express.Router();

module.exports = function(io) {
  // Import all route files
  const doctorRoutes = require("./doctorRoutes");
  const patientRoutes = require("./patientRoutes");
  const appointmentRoutes = require("./appointmentRoutes")(io);
  const adminRoutes = require("./adminRoutes");

  // Mount the routes on specific paths
  router.use("/api/doctors", doctorRoutes);
  router.use("/api/patients", patientRoutes);
  router.use("/api/appointments", appointmentRoutes);
  router.use("/api/admin", adminRoutes);

  return router;
};