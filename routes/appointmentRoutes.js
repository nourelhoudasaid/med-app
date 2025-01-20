const express = require("express");
const router = express.Router();
const Appointment = require("../models/Appointment");
const { authenticateUser } = require("../middleware/auth");
const MedicalHistory = require("../models/MedicalHistory");

module.exports = function(io) {
  // Create appointment
  router.post("/", authenticateUser, async (req, res) => {
    try {
      const { doctor, appointmentDate, reason, department } = req.body;
      const appointment = new Appointment({
        patient: req.user._id,
        doctor,
        appointmentDate,
        reason,
        department
      });
      
      await appointment.save();
      
      // Populate the newly created appointment
      const populatedAppointment = await Appointment.findById(appointment._id)
        .populate('patient', 'name email phoneNumber')
        .populate('doctor', 'name email specialization availability')
        .populate('department', 'name description');
      
      // Emit socket event with populated data
      io.emit('newAppointment', populatedAppointment);
      
      res.status(201).json({ 
        message: "Appointment created successfully", 
        appointment: populatedAppointment 
      });
    } catch (error) {
      res.status(500).json({ message: "Error creating appointment", error: error.message });
    }
  });

  // Get all appointments
  router.get("/", authenticateUser, async (req, res) => {
    try {
      const appointments = await Appointment.find()
        .populate('patient', 'name email phoneNumber CIN')
        .populate('doctor', 'name email specialization availability')
        .populate('department', 'name description')
        .sort({ appointmentDate: 'asc' })
        .lean();
      res.status(200).json(appointments);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointments", error: error.message });
    }
  });

  // Get appointment by ID
  router.get("/:id", authenticateUser, async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('patient', 'name email phoneNumber CIN')
        .populate('doctor', 'name email specialization availability')
        .populate('department', 'name description');
      
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.status(200).json(appointment);
    } catch (error) {
      res.status(500).json({ message: "Error fetching appointment", error: error.message });
    }
  });

  // Update appointment status
  router.put("/:id/status", authenticateUser, async (req, res) => {
    try {
      const { status, medicalHistory } = req.body;
      const appointment = await Appointment.findByIdAndUpdate(
        req.params.id,
        { status },
        { new: true }
      )
      .populate('patient', 'name email phoneNumber')
      .populate('doctor', 'name email specialization availability')
      .populate('department', 'name description');

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      // If appointment is completed and medical history is provided, create a record
      if (status === 'Completed' && medicalHistory) {
        const newMedicalHistory = new MedicalHistory({
          patient: appointment.patient._id,
          doctor: appointment.doctor._id,
          appointment: appointment._id,
          ...medicalHistory
        });
        await newMedicalHistory.save();
      }
      
      // Emit socket event with populated data
      io.emit('appointmentUpdated', appointment);
      
      res.status(200).json({ 
        message: "Appointment status updated successfully", 
        appointment 
      });
    } catch (error) {
      res.status(500).json({ 
        message: "Error updating appointment status", 
        error: error.message 
      });
    }
  });

  // Delete appointment
  router.delete("/:id", authenticateUser, async (req, res) => {
    try {
      const appointment = await Appointment.findById(req.params.id)
        .populate('patient', 'name email')
        .populate('doctor', 'name email')
        .populate('department', 'name');

      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }

      await Appointment.findByIdAndDelete(req.params.id);
      
      // Emit socket event with appointment details
      io.emit('appointmentDeleted', {
        _id: appointment._id,
        patient: appointment.patient,
        doctor: appointment.doctor,
        department: appointment.department
      });
      
      res.status(200).json({ 
        message: "Appointment deleted successfully",
        appointment 
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting appointment", error: error.message });
    }
  });

  return router;
};
