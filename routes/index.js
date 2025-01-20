const express = require("express");
const router = express.Router();
const multer = require('multer');
const { upload } = require('../config/cloudinary');

module.exports = function(io) {
  // Import all route files
  const authRoutes = require("./auth");
  const doctorRoutes = require("./doctorRoutes");
  const patientRoutes = require("./PatientRoutes");
  const appointmentRoutes = require("./appointmentRoutes")(io);
  const adminRoutes = require("./adminRoutes");
  const departmentRoutes = require("./departmentRoutes");
  const statisticsRoutes = require("./statistics");
  const medicalHistoryRoutes = require("./medicalHistoryRoutes");
  const publicRoutes = require("./publicRoutes");

  // Configure multer for file uploads
  const uploadMiddleware = upload.fields([
    { name: 'profileImage', maxCount: 1 },
    { name: 'diplomaImage', maxCount: 1 }
  ]);

  // Auth routes with file upload middleware
  router.use("/api/auth", (req, res, next) => {
    if (req.path === '/register' && req.method === 'POST') {
      uploadMiddleware(req, res, (err) => {
        if (err instanceof multer.MulterError) {
          return res.status(400).json({ message: "File upload error", error: err.message });
        } else if (err) {
          return res.status(500).json({ message: "Server error", error: err.message });
        }
        next();
      });
    } else {
      next();
    }
  }, authRoutes);

  // Mount all other routes
  router.use("/api/doctors", doctorRoutes);
  router.use("/api/patients", patientRoutes);
  router.use("/api/appointments", appointmentRoutes);
  router.use("/api/admin", adminRoutes);
  router.use("/api/departments", departmentRoutes);
  router.use("/api/statistics", statisticsRoutes);
  router.use("/api/medical-history", medicalHistoryRoutes);
  router.use("/api/public", publicRoutes);

  return router;
};