const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const User = require("../models/User");

// @desc    Get statistics for a doctor
// @route   GET /api/statistics/doctor/:id
// @access  Private (require authentication)
router.get("/doctor/:id", async (req, res) => {
  try {
    const doctorId = req.params.id;

    // Vérifier si l'utilisateur est bien un docteur
    const doctor = await User.findById(doctorId);
    if (!doctor || doctor.role !== "Doctor") {
      return res.status(404).json({ message: "Docteur non trouvé ou non valide" });
    }

    // Nombre de patients uniques ayant pris un rendez-vous avec ce docteur
    const patientCount = await Appointment.distinct("name", { doctor: doctorId }).then(
      (patients) => patients.length
    );

    // Nombre total de rendez-vous
    const appointmentCount = await Appointment.countDocuments({ doctor: doctorId });

    // Réponse JSON
    res.status(200).json({
      success: true,
      data: {
        doctorName: doctor.name,
        patientCount,
        appointmentCount,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      success: false,
      message: "Erreur lors de la récupération des statistiques",
      error: error.message,
    });
  }
});

module.exports = router;
